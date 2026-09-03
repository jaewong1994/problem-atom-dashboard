from __future__ import annotations

import io
import json
import re
import shutil
import zipfile
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image

DASH = Path(__file__).resolve().parent
NGD2 = Path(r"C:\Users\jaewo\OneDrive\바탕 화면\학원\NGD2_새폴더_풀세트\공장")
SOURCE_ROOT = Path(r"C:\Users\jaewo\OneDrive\바탕 화면\학원\입실론\한글자료\모의고사 [20260216]\모의고사 [2026] HWP")
OLD_ROOT = SOURCE_ROOT / "[년도별] 모의고사 고3 (2003-2025년)"
CSAT_ROOT = SOURCE_ROOT / "[기출] 수능기출 (1983-2026학년도)"
OFFICIAL_WORK = NGD2.parent / "회귀자료" / "공식시험_적재_20260825"
ASSETS = DASH / "assets" / "questions"
PB3_TAGS = DASH / "problem-bank3-tags.json"

COURSE_LABELS = {
    "CM1": "공통수학Ⅰ",
    "CM2": "공통수학Ⅱ",
    "ALG": "대수(기존 수학Ⅰ)",
    "M2": "미적분Ⅰ(기존 수학Ⅱ)",
    "CALC": "미적분Ⅱ(기존 미적분)",
    "PRST": "확률과 통계",
    "GEO": "기하",
}


def normalize_track(value: str) -> str:
    track = re.sub(r"\s+", "", value or "")
    track = re.sub(r"^(수학|수리)", "", track)
    if "확률통계" in track or "확통" in track:
        return "확통"
    if "미분과적분" in track:
        return "가형미분과적분"
    if "공통" in track:
        return "가형공통" if "가형" in track else "공통"
    if "미적분" in track:
        return "미적분"
    if "기하" in track:
        return "기하"
    for legacy in ("가형", "나형", "A형", "B형"):
        if legacy in track:
            return legacy
    return track or "미상"


def load_pb3_index() -> dict[tuple[str, int, str, str, int], dict]:
    if not PB3_TAGS.exists():
        return {}
    payload = json.loads(PB3_TAGS.read_text(encoding="utf-8"))
    return {
        (
            row["examType"],
            int(row["year"]),
            row["session"],
            normalize_track(row["track"]),
            int(row["number"]),
        ): row
        for row in payload.get("records", [])
    }


PB3_INDEX = load_pb3_index()


def apply_pb3_meta(question: dict, exam_type: str, year: int, session: str, track: str, number: int) -> dict:
    normalized = normalize_track(track)
    row = PB3_INDEX.get((exam_type, int(year), session, normalized, int(number)))
    if not row and exam_type == "csat":
        fallbacks = [
            candidate
            for key, candidate in PB3_INDEX.items()
            if key[0] == exam_type and key[1] == int(year) and key[2] == session and key[4] == int(number)
            and (key[3].startswith(normalized) or normalized.startswith(key[3]))
        ]
        row = fallbacks[0] if len(fallbacks) == 1 else None
    if not row:
        question.setdefault("courseCode", "")
        question.setdefault("courseLabel", "과목 미분류")
        question.setdefault("tagSource", "")
        return question
    course_code = row.get("courseCode") or ""
    question["courseCode"] = course_code
    question["courseLabel"] = row.get("courseLabel") or COURSE_LABELS.get(course_code, "과목 미분류")
    question["bankUnit"] = row.get("unit") or ""
    if row.get("unit"):
        question["unit"] = row["unit"]
    question["tagSource"] = "problem-bank-3"
    return question


def extract_item_figures(item: dict, dest_dir: Path, number: int) -> list[str]:
    """Resolve HWPX meta.image_refs and publish browser-safe PNG figures."""
    refs = [str(ref) for ref in (item.get("meta") or {}).get("image_refs") or [] if ref]
    origin = Path(item.get("origin_path") or "")
    if not refs or not origin.exists() or origin.suffix.lower() != ".hwpx":
        return []

    outputs: list[str] = []
    try:
        with zipfile.ZipFile(origin) as archive:
            members = {
                Path(name).stem.lower(): name
                for name in archive.namelist()
                if name.lower().startswith("bindata/")
            }
            for index, ref in enumerate(refs, 1):
                member = members.get(ref.lower())
                if not member:
                    continue
                with Image.open(io.BytesIO(archive.read(member))) as image:
                    image.load()
                    if image.mode not in {"RGB", "RGBA"}:
                        image = image.convert("RGBA" if "transparency" in image.info else "RGB")
                    dest_dir.mkdir(parents=True, exist_ok=True)
                    dest = dest_dir / f"item_{number:03d}_fig_{index:02d}.png"
                    image.save(dest, format="PNG", optimize=True)
                    outputs.append(dest.relative_to(DASH).as_posix())
    except (OSError, zipfile.BadZipFile):
        return []
    return outputs


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
            images = extract_item_figures(item, ASSETS / legacy_exam_id, number)
            question = {
                "id": question_id,
                "number": number,
                "score": score,
                "unit": item.get("unit") or "개념 태그 미입력",
                "preview": preview,
                "images": images,
                "body": item.get("raw_text") or None,
                "legacyIds": [question_id],
            }
            questions.append(apply_pb3_meta(question, "mock", year, session, track, number))
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
                "images": [],
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
        "images": [],
        "body": None,
        "legacyIds": [question_id],
        "courseCode": "",
        "courseLabel": "과목 미분류",
        "tagSource": "",
    }


def csat_scaffold_exams() -> list[dict]:
    """NGD2 공식시험 적재본이 없을 때만 사용하는 수능 체크 구조다."""
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


def csat_section_id(raw: str) -> str:
    if raw in {"공통", "기하", "미적분", "확통"}:
        return raw
    return (raw.replace("수리가형", "가형")
               .replace("수리나형", "나형")
               .replace("수리A형", "A형")
               .replace("수리B형", "B형")
               .replace("수학가형", "가형")
               .replace("수학나형", "나형"))


def csat_section_title(section_id: str) -> str:
    labels = {
        "공통": "공통 문항",
        "기하": "기하 선택",
        "미적분": "미적분 선택",
        "확통": "확률과 통계 선택",
    }
    return labels.get(section_id, section_id.replace("_", " "))


def csat_ready_exams() -> list[dict]:
    """검증 완료된 NGD2 공식시험 JSONL과 렌더를 읽기 전용으로 현황판에 연결한다."""
    manifest_path = OFFICIAL_WORK / "manifest.json"
    if not manifest_path.exists():
        return []
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    if manifest.get("status") != "verified":
        return []

    grouped: dict[int, list[dict]] = defaultdict(list)
    for spec in manifest.get("sessions", []):
        if spec.get("org") != "수능" or "_수능_" not in spec.get("key", ""):
            continue
        year = int(spec["academic_year"])
        raw_section = spec["key"].split("_수능_", 1)[1]
        section_id = csat_section_id(raw_section)
        render_dir = Path(spec["renders_dir"]) if spec.get("renders_dir") else None
        questions = []
        with Path(spec["items_path"]).open(encoding="utf-8") as handle:
            for line in handle:
                item = json.loads(line)
                score_source = f"{item.get('raw_text', '')} {item.get('raw_xml', '')}"
                score_match = re.search(r"\[([234])점\]", score_source)
                score = int(score_match.group(1)) if score_match else None
                if score not in (3, 4):
                    continue
                meta = item.get("meta") or {}
                number = int(meta.get("question_no") or item["origin_seq"])
                question_id = f"csat-{year}-{section_id}-{number:02d}"
                legacy_ids = [question_id]
                if section_id == "공통":
                    legacy_ids.append(f"csat-{year}-common-{number:02d}")
                if section_id.startswith("가형"):
                    legacy_ids.append(f"csat-{year}-가형-{number:02d}")
                preview = None
                src_img = render_dir / f"item_{number:03d}.png" if render_dir else None
                if src_img and src_img.exists():
                    dest_dir = ASSETS / f"csat-{year}-{section_id}"
                    dest_dir.mkdir(parents=True, exist_ok=True)
                    dest = dest_dir / src_img.name
                    shutil.copy2(src_img, dest)
                    preview = dest.relative_to(DASH).as_posix()
                images = extract_item_figures(item, ASSETS / f"csat-{year}-{section_id}", number)
                question = {
                    "id": question_id,
                    "number": number,
                    "score": score,
                    "unit": item.get("unit") or "개념 태그 미입력",
                    "preview": preview,
                    "images": images,
                    "body": item.get("raw_text") or None,
                    "legacyIds": sorted(set(legacy_ids)),
                }
                questions.append(apply_pb3_meta(question, "csat", year, "수능", section_id, number))
        if questions:
            grouped[year].append({
                "id": section_id,
                "title": csat_section_title(section_id),
                "kind": "common" if section_id == "공통" else ("choice" if section_id in {"기하", "미적분", "확통"} else "track"),
                "questions": questions,
                "source": Path(spec.get("source_path") or spec["items_path"]).name,
            })

    order = {"공통": 0, "기하": 1, "미적분": 2, "확통": 3, "가형": 4, "나형": 5, "A형": 6, "B형": 7}
    exams = []
    for year, sections in grouped.items():
        sections.sort(key=lambda section: (next((rank for name, rank in order.items() if section["id"].startswith(name)), 99), section["id"]))
        sources = sorted({section.pop("source") for section in sections})
        exams.append({
            "id": f"csat-{year}",
            "examGroup": "csat",
            "organizer": "평가원",
            "year": year,
            "session": "수능",
            "title": f"{year}학년도 대학수학능력시험",
            "assetStatus": "ready",
            "sourceFiles": sources,
            "sections": sections,
        })
    return exams


def official_mock_ready_exams() -> list[dict]:
    """공식시험 manifest에만 있는 최신 평가원 회차를 현황판에 연결한다."""
    manifest_path = OFFICIAL_WORK / "manifest.json"
    if not manifest_path.exists():
        return []
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    if manifest.get("status") != "verified":
        return []

    grouped: dict[tuple[int, str], list[dict]] = defaultdict(list)
    for spec in manifest.get("sessions", []):
        match = re.match(r"(\d{4})_(6월|9월)_평가원_(.+)", spec.get("key", ""))
        if spec.get("org") != "평가원" or not match:
            continue
        academic_year, session, raw_section = int(match.group(1)), match.group(2), match.group(3)
        calendar_year = academic_year - 1
        section_id = normalize_track(raw_section)
        render_dir = Path(spec["renders_dir"]) if spec.get("renders_dir") else None
        questions = []
        with Path(spec["items_path"]).open(encoding="utf-8") as handle:
            for line in handle:
                item = json.loads(line)
                score_source = f"{item.get('raw_text', '')} {item.get('raw_xml', '')}"
                score_match = re.search(r"\[([234])점\]", score_source)
                score = int(score_match.group(1)) if score_match else None
                if score not in (3, 4):
                    continue
                meta = item.get("meta") or {}
                number = int(meta.get("question_no") or item["origin_seq"])
                id_track = "기하" if section_id == "공통" else section_id
                question_id = f"kice-{calendar_year}-{session[:-1]}-{id_track}-{number:02d}"
                preview = None
                src_img = render_dir / f"item_{number:03d}.png" if render_dir else None
                if src_img and src_img.exists():
                    dest_dir = ASSETS / f"kice-{calendar_year}-{session[:-1]}-{section_id}"
                    dest_dir.mkdir(parents=True, exist_ok=True)
                    dest = dest_dir / src_img.name
                    shutil.copy2(src_img, dest)
                    preview = dest.relative_to(DASH).as_posix()
                question = {
                    "id": question_id,
                    "number": number,
                    "score": score,
                    "unit": item.get("unit") or "개념 태그 미입력",
                    "preview": preview,
                    "images": extract_item_figures(item, ASSETS / f"kice-{calendar_year}-{session[:-1]}-{section_id}", number),
                    "body": item.get("raw_text") or None,
                    "legacyIds": [question_id],
                    "courseCode": item.get("course") if item.get("course") in COURSE_LABELS else "",
                    "courseLabel": COURSE_LABELS.get(item.get("course"), "과목 미분류"),
                    "tagSource": "official-header" if item.get("course") in COURSE_LABELS else "",
                }
                questions.append(apply_pb3_meta(question, "mock", calendar_year, session, section_id, number))
        if questions:
            grouped[(calendar_year, session)].append({
                "id": "common" if section_id == "공통" else section_id,
                "title": "공통 문항" if section_id == "공통" else f"{section_id} 선택",
                "kind": "common" if section_id == "공통" else "choice",
                "questions": questions,
            })

    exams = []
    section_order = {"common": 0, "기하": 1, "미적분": 2, "확통": 3}
    for (year, session), sections in grouped.items():
        sections.sort(key=lambda section: section_order.get(section["id"], 9))
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


def main() -> None:
    ASSETS.mkdir(parents=True, exist_ok=True)
    csat = csat_ready_exams() or csat_scaffold_exams()
    legacy_mock = ready_exams()
    official_mock = official_mock_ready_exams()
    official_ids = {exam["id"] for exam in official_mock}
    exams = pending_exams() + [exam for exam in legacy_mock if exam["id"] not in official_ids] + official_mock + csat
    exams.sort(key=lambda x: ({"mock": 0, "csat": 1, "education": 2}.get(x["examGroup"], 9), -x["year"], x["session"]))
    payload = {
        "schemaVersion": 4,
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "scope": "평가원 2006~2025년 6·9월 및 수능 2007~2026학년도, 교육청 탭 준비",
        "exams": exams,
    }
    (DASH / "dashboard-data.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    questions = [q for e in exams for s in e["sections"] for q in s["questions"]]
    previews = sum(bool(q["preview"]) for q in questions)
    figures = sum(len(q.get("images") or []) for q in questions)
    print(f"완료: 시험 박스 {len(exams)}개, 고유 체크 문항 {len(questions)}개, 실제 미리보기 {previews}문항, LaTeX 본문 그림 {figures}개")


if __name__ == "__main__":
    main()
