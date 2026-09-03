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
    vision = (ROOT / "vision.html").read_text(encoding="utf-8")
    template = ROOT / "assets" / "downloads" / "세미나분석지_초간단.hwpx"

    assert config["academicYears"] == [2022, 2023, 2024, 2025, 2026, 2027]
    assert config["questionNumbers"] == [13, 14, 15, 20, 21, 22]
    assert config["weeklyBaseTarget"] == 4
    assert len(config["academicYears"]) * 3 * len(config["questionNumbers"]) == 108
    assert "id=\"seasonGrid\"" in html
    assert "세미나분석지_초간단.hwpx" in html
    assert "seasonPlaceholder" in app
    assert "PARealtime.claim" in app
    assert "postgres_changes" in realtime
    assert "signInAnonymously" in realtime
    assert "question_id text primary key" in sql
    assert "enable row level security" in sql
    assert "auth.uid() = owner_id" in sql
    assert "sb_secret_" not in realtime_config
    assert "같은 문제를 여러 명이 맡아도 됨" not in vision
    assert template.exists() and zipfile.is_zipfile(template)
    print("PASS dashboard season/realtime contract: 16 assertions")


if __name__ == "__main__":
    main()
