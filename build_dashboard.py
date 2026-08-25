from __future__ import annotations

import json
import re
import shutil
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

DASH = Path(__file__).resolve().parent
NGD2 = Path(r"C:\Users\jaewo\OneDrive\바탕 화면\학원\NGD2_새폴더_풀세트\공장")
OLD_ROOT = Path(r"C:\Users\jaewo\OneDrive\바탕 화면\학원\입실론\고2\한글파일\모의고사 [20260216]\모의고사 [2026] HWP\[년도별] 모의고사 고3 (2003-2025년)")
CSAT_ROOT = Path(r"C:\Users\jaewo\OneDrive\바탕 화면\학원\입실론\고2\한글파일\모의고사 [20260216]\모의고사 [2026] HWP\[기출] 수능기출 (1983-2026학년도)")
ASSETS = DASH / "assets" / "questions"


def track_from_name(name: str) -> str:
    match = re.search(r"고3_(.+?)_(6월|9월)", name)
    if not match:
        return "과정 미상"
    return match.group(1).replace("수학", "").replace("수리", "")


def read_source(source: Path) -> dict | None:
    base = source.name.removesuffix(".items.jsonl")
    match = re.match(r"학평_(\d{4})_평가원_고3_.+?_(6월|9월)", base)
    if not match:
        return None
    year, session = int(match.group(1)), match.group(2)
    track = track_from_name(source.name)
    legacy_exam_id = f"kice-{year}-{session[:-1]}-{track}"
    render_dir = NGD2 / "renders" / base
    questions = []
    with source.open(encoding="utf-8") as handle:
        for line in handle:
            item = json.loads(line)
            score_match = re.search(r"\[([234])점\]", item.get("raw_text", ""))
            score = int(score_match.group(1)) if score_match else None
            if score not in (3, 4):
                continue
            number = int(item["origin_seq"])
            question_id = f"{legacy_exam_id}-{number:02d}"
            src_img = render_dir / f"item_{number:03d}.png"
            preview = None
            if src_img.exists():
                dest_dir = ASSETS / legacy_exam_id
                dest_dir.mkdir(parents=True, exist_ok=True)
                dest = dest_dir / src_img.name
                shutil.copy2(src_img, dest)
                preview = dest.relative_to(DASH).as_posix()
            questions.append({
                "id": question_id,
                "number": number,
                "score": score,
                "unit": item.get("unit") or "개념 태그 미입력",
                "preview": preview,
                "body": item.get("raw_text") or None,
                "legacyIds": [question_id],
            })
    return {"year": year, "session": session, "track": track, "questions": questions}


def ready_exams() -> list[dict]:
    grouped: dict[tuple[int, str], list[dict]] = defaultdict(list)
    for source in sorted(NGD2.glob("학평_*_평가원_고3_*.items.jsonl")):
        parsed = read_source(source)
        if parsed:
            grouped[(parsed["year"], parsed["session"])].append(parsed)

    exams = []
    for (year, session), tracks in grouped.items():
        sections = []
        tracks.sort(key=lambda x: ({"기하": 0, "미적분": 1, "확통": 2}.get(x["track"], 9), x["track"]))
        if year >= 2021:
            reference = next((x for x in tracks if x["track"] == "기하"), tracks[0])
            common = []
            for question in reference["questions"]:
                if question["number"] > 22:
                    continue
                aliases = []
                for track in tracks:
                    same = next((q for q in track["questions"] if q["number"] == question["number"]), None)
                    if same:
                        aliases.extend(same["legacyIds"])
                question["legacyIds"] = sorted(set(aliases))
                common.append(question)
            sections.append({"id": "common", "title": "공통 문항", "kind": "common", "questions": common})
            for track in tracks:
                choice = [q for q in track["questions"] if q["number"] >= 23]
                sections.append({"id": track["track"], "title": f"{track['track']} 선택", "kind": "choice", "questions": choice})
        else:
            for track in tracks:
                sections.append({"id": track["track"], "title": track["track"], "kind": "track", "questions": track["questions"]})
        exams.append({
            "id": f"kice-{year}-{session[:-1]}",
            "examGroup": "mock",
            "organizer": "평가원",
            "year": year,
            "session": session,
            "title": f"{session} 평가원",
            "assetStatus": "ready",
            "sections": sections,
        })
    return exams


def pending_exams() -> list[dict]:
    grouped: dict[tuple[int, str], list[dict]] = defaultdict(list)
    for year in range(2006, 2016):
        folder = OLD_ROOT / f"{year}년"
        for hwp in sorted(folder.glob(f"학평_{year}_평가원_고3_*.hwp")):
            match = re.match(rf"학평_{year}_평가원_고3_(.+?)_(6월|9월)\.hwp", hwp.name)
            if not match:
                continue
            raw_track, session = match.groups()
            track = raw_track.replace("수학", "").replace("수리", "")
            legacy_exam_id = f"kice-{year}-{session[:-1]}-{track}"
            questions = [{
                "id": f"{legacy_exam_id}-{n:02d}",
                "number": n,
                "score": None,
                "unit": "메타 등록 대기",
                "preview": None,
                "body": None,
                "legacyIds": [f"{legacy_exam_id}-{n:02d}"],
            } for n in range(1, 31)]
            grouped[(year, session)].append({"id": track, "title": track, "kind": "track", "questions": questions})
    exams = []
    for (year, session), sections in grouped.items():
        sections.sort(key=lambda x: x["title"])
        exams.append({
            "id": f"kice-{year}-{session[:-1]}",
            "examGroup": "mock",
            "organizer": "평가원",
            "year": year,
            "session": session,
            "title": f"{session} 평가원",
            "assetStatus": "pending",
            "sections": sections,
        })
    return exams


def csat_question(exam_id: str, number: int) -> dict:
    question_id = f"{exam_id}-{number:02d}"
    return {
        "id": question_id,
        "number": number,
        "score": None,
        "unit": "메타 등록 대기",
        "preview": None,
        "body": None,
        "legacyIds": [question_id],
    }


def csat_exams() -> list[dict]:
    """HWP를 OCR하지 않고 파일명만으로 20개년 수능 체크 구조를 만든다."""
    grouped: dict[int, list[tuple[str, Path]]] = defaultdict(list)
    for hwp in sorted(CSAT_ROOT.glob("*.hwp")):
        match = re.match(r"(\d{4})학년도 수능 수(?:리|학)\((.+?)\)\.hwp", hwp.name)
        if not match:
            continue
        year, track = int(match.group(1)), match.group(2)
        if 2007 <= year <= 2026:
            grouped[year].append((track, hwp))

    order = {"기하": 0, "미적분": 1, "확통": 2, "가형": 3, "나형": 4, "A형": 5, "B형": 6}
    exams = []
    for year, sources in grouped.items():
        sources.sort(key=lambda item: (order.get(item[0], 99), item[0]))
        exam_id = f"csat-{year}"
        tracks = [track for track, _ in sources]
        sections = []
        if {"기하", "미적분", "확통"}.issubset(tracks):
            sections.append({
                "id": "common",
                "title": "공통 문항",
                "kind": "common",
                "questions": [csat_question(f"{exam_id}-common", n) for n in range(1, 23)],
            })
            for track, _ in sources:
                sections.append({
                    "id": track,
                    "title": f"{track} 선택",
                    "kind": "choice",
                    "questions": [csat_question(f"{exam_id}-{track}", n) for n in range(23, 31)],
                })
        else:
            for track, _ in sources:
                sections.append({
                    "id": track,
                    "title": track,
                    "kind": "track",
                    "questions": [csat_question(f"{exam_id}-{track}", n) for n in range(1, 31)],
                })
        exams.append({
            "id": exam_id,
            "examGroup": "csat",
            "organizer": "평가원",
            "year": year,
            "session": "수능",
            "title": f"{year}학년도 대학수학능력시험",
            "assetStatus": "source-only",
            "sourceFiles": [path.name for _, path in sources],
            "sections": sections,
        })
    return exams


def main() -> None:
    ASSETS.mkdir(parents=True, exist_ok=True)
    exams = pending_exams() + ready_exams() + csat_exams()
    exams.sort(key=lambda x: ({"mock": 0, "csat": 1, "education": 2}.get(x["examGroup"], 9), -x["year"], x["session"]))
    payload = {
        "schemaVersion": 3,
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "scope": "평가원 2006~2025년 6·9월 및 수능 2007~2026학년도, 교육청 탭 준비",
        "exams": exams,
    }
    (DASH / "dashboard-data.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    questions = [q for e in exams for s in e["sections"] for q in s["questions"]]
    previews = sum(bool(q["preview"]) for q in questions)
    print(f"완료: 시험 박스 {len(exams)}개, 고유 체크 문항 {len(questions)}개, 실제 미리보기 {previews}문항")


if __name__ == "__main__":
    main()
