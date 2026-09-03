from __future__ import annotations

import json
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parent


def main() -> None:
    config = json.loads((ROOT / "season-config.json").read_text(encoding="utf-8"))["activeSeason"]
    html = (ROOT / "dashboard.html").read_text(encoding="utf-8")
    app = (ROOT / "app.js").read_text(encoding="utf-8")
    realtime = (ROOT / "realtime.js").read_text(encoding="utf-8")
    realtime_config = (ROOT / "realtime-config.js").read_text(encoding="utf-8")
    sql = (ROOT / "realtime" / "supabase_setup.sql").read_text(encoding="utf-8")
    data = json.loads((ROOT / "dashboard-data.json").read_text(encoding="utf-8"))
    vision = (ROOT / "vision.html").read_text(encoding="utf-8")
    template = ROOT / "assets" / "downloads" / "세미나분석지_초간단.hwpx"

    assert config["academicYears"] == [2022, 2023, 2024, 2025, 2026, 2027]
    assert config["questionNumbers"] == [13, 14, 15, 20, 21, 22]
    assert config["weeklyBaseTarget"] == 4
    assert "id=\"seasonGrid\"" in html
    assert "id=\"subjectFilter\"" in html and "id=\"yearFilter\"" in html
    assert "강사 이름" in html
    assert "세미나분석지_초간단.hwpx" in html
    assert "seasonPlaceholder" in app
    assert 'question.courseCode === "M2"' in app
    assert "교차분석 참여" in app
    assert "questionClaims" in app
    assert "PARealtime.claim" in app
    assert "postgres_changes" in realtime
    assert "signInAnonymously" in realtime
    assert "primary key (question_id, owner_id)" in sql
    assert "enable row level security" in sql
    assert "auth.uid() = owner_id" in sql
    assert "sb_secret_" not in realtime_config
    assert "같은 문제를 여러 명이 맡아도 됨" not in vision
    assert template.exists() and zipfile.is_zipfile(template)
    target_numbers = set(config["questionNumbers"])
    season_questions = []
    for exam in data["exams"]:
        academic_year = exam["year"] if exam["session"] == "수능" else exam["year"] + 1
        if academic_year not in config["academicYears"]:
            continue
        common = next((section for section in exam["sections"] if section["kind"] == "common"), None)
        if not common:
            continue
        season_questions.extend(
            question for question in common["questions"]
            if question["number"] in target_numbers and question.get("courseCode") == "M2"
        )
    assert season_questions and all(question["courseCode"] == "M2" for question in season_questions)
    assert any(exam["id"] == "kice-2026-6" for exam in data["exams"])
    september = next(exam for exam in data["exams"] if exam["id"] == "kice-2026-9")
    assert {section["id"]: len(section["questions"]) for section in september["sections"]} == {
        "common": 20,
        "기하": 7,
        "미적분": 7,
        "확통": 7,
    }
    assert all(
        question.get("courseCode")
        for section in september["sections"]
        for question in section["questions"]
    )
    assert sum(len(question.get("images") or []) for section in september["sections"] for question in section["questions"]) == 9
    print(f"PASS dashboard season/realtime contract: {len(season_questions)} M2 season questions")


if __name__ == "__main__":
    main()
