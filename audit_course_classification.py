from __future__ import annotations

import argparse
import json
import re
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parent
RULES_PATH = ROOT / "verified-course-classification.json"
DATA_PATH = ROOT / "dashboard-data.json"
REPORT_PATH = ROOT / "course-classification-audit.json"
SOURCE_ROOT_PATH = ROOT / "source-bank-root.local.txt"

COURSE_LABELS = {
    "ALG": "대수(기존 수학Ⅰ)",
    "M2": "미적분Ⅰ(기존 수학Ⅱ)",
    "CALC": "미적분Ⅱ(기존 미적분)",
    "PRST": "확률과 통계",
    "GEO": "기하",
}

LABEL_RE = re.compile(
    r"^(?P<year>\d{4})\s+(?P<kind>평가원|수능)\s+고3\s+(?P<track>.+?)\s+"
    r"(?P<month>\d{1,2}월)\s+(?P<number>\d+)번$"
)


def normalize_track(value: str) -> str:
    track = re.sub(r"\s+", "", value or "")
    track = re.sub(r"^(수학|수리)", "", track)
    if "확률통계" in track or "확통" in track:
        return "확통"
    if "공통" in track:
        return "공통"
    if "미적분" in track:
        return "미적분"
    if "기하" in track:
        return "기하"
    return track or "미상"


def load_rules() -> tuple[dict, dict]:
    payload = json.loads(RULES_PATH.read_text(encoding="utf-8"))
    course_by_unit = payload["courseByUnit"]
    index = {}
    for exam in payload["examMaps"]:
        base = (
            exam["examType"], int(exam["year"]), exam["session"], normalize_track(exam["track"])
        )
        seen = set()
        for unit, numbers in exam["units"].items():
            for number in numbers:
                number = int(number)
                if number in seen:
                    raise ValueError(f"검수표 중복: {base} {number}")
                seen.add(number)
                index[(*base, number)] = {"courseCode": course_by_unit[unit], "unit": unit}
        if base[3] == "공통" and seen != set(range(3, 23)):
            raise ValueError(f"공통 3~22번 누락: {base} {sorted(set(range(3, 23)) - seen)}")
    for row in payload["overrides"]:
        key = (
            row["examType"], int(row["year"]), row["session"],
            normalize_track(row["track"]), int(row["number"]),
        )
        index[key] = row
    return payload, index


def dashboard_rows() -> list[dict]:
    payload = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    rows = []
    for exam in payload["exams"]:
        exam_type = "csat" if exam["session"] == "수능" else "mock"
        for section in exam["sections"]:
            for question in section["questions"]:
                rows.append({
                    "id": question["id"],
                    "examType": exam_type,
                    "year": int(exam["year"]),
                    "session": exam["session"],
                    "track": normalize_track(section["id"]),
                    "number": int(question["number"]),
                    "courseCode": question.get("courseCode") or "",
                    "unit": question.get("unit") or "",
                })
    return rows


def request_json(url: str, key: str, method: str = "GET", body: dict | None = None):
    data = None if body is None else json.dumps(body, ensure_ascii=False).encode("utf-8")
    headers = {"apikey": key, "Authorization": f"Bearer {key}", "User-Agent": "course-audit/1.0"}
    if body is not None:
        headers.update({"Content-Type": "application/json", "Prefer": "return=representation"})
    request = urllib.request.Request(url, data=data, headers=headers, method=method)
    with urllib.request.urlopen(request, timeout=60) as response:
        raw = response.read()
    return json.loads(raw) if raw else []


def fetch_source_rows(url: str, key: str) -> list[dict]:
    rows = []
    offset = 0
    while True:
        query = urllib.parse.urlencode({
            "select": "id,source_label,course,course_norm,unit,origin_seq,meta",
            "or": "(source_label.ilike.*평가원*,source_label.ilike.*수능*)",
            "order": "id.asc", "limit": 1000, "offset": offset,
        })
        page = request_json(f"{url}/rest/v1/items?{query}", key)
        rows.extend(page)
        if len(page) < 1000:
            return rows
        offset += 1000


def source_target(row: dict, rules: dict, index: dict) -> dict | None:
    match = LABEL_RE.match(str(row.get("source_label") or ""))
    if not match:
        return None
    exam_type = "mock" if match["kind"] == "평가원" else "csat"
    year = int(match["year"])
    session = match["month"] if exam_type == "mock" else "수능"
    track = normalize_track(match["track"])
    number = int(match["number"])
    target = index.get((exam_type, year, session, track, number))
    if target:
        return target

    # 구형 모의평가 공통 1~22번은 선택과목별 시험지에 중복 저장돼 있다.
    if exam_type == "mock" and number <= 22:
        target = index.get((exam_type, year, session, "공통", number))
        if target:
            return target
        for repair in rules.get("sourceCommonRepairs") or []:
            if (year, session, number) == (
                int(repair["year"]), repair["session"], int(repair["number"])
            ):
                return repair
    return None


def main() -> None:
    parser = argparse.ArgumentParser(description="평가원 문항 과목 분류 전수검사 및 검증된 원본 교정")
    parser.add_argument("--repair-source", action="store_true", help="검증표와 다른 원본 DB 메타만 교정")
    args = parser.parse_args()

    rules, index = load_rules()
    published = dashboard_rows()
    published_mismatches = []
    for row in published:
        target = index.get((row["examType"], row["year"], row["session"], row["track"], row["number"]))
        if target and (
            row["courseCode"] != target["courseCode"]
            or (target.get("unit") and row["unit"] != target["unit"])
        ):
            published_mismatches.append({"current": row, "expected": target})

    source_root = Path(SOURCE_ROOT_PATH.read_text(encoding="utf-8-sig").strip())
    config = json.loads((source_root / "적재설정.json").read_text(encoding="utf-8"))
    source_rows = fetch_source_rows(config["url"], config["key"])
    source_changes = []
    for row in source_rows:
        target = source_target(row, rules, index)
        if not target:
            continue
        update = {"course": target["courseCode"], "course_norm": target["courseCode"]}
        if target.get("unit"):
            update["unit"] = target["unit"]
        meta = dict(row.get("meta") or {})
        meta.update({
            "course_assignment": "human_verified_20260904",
            "course_reviewed_at": "2026-09-04",
            "course_review_scope": "official_exam_subject_audit",
        })
        update["meta"] = meta
        changed_fields = {
            key: {"before": row.get(key), "after": value}
            for key, value in update.items() if key != "meta" and row.get(key) != value
        }
        # 분류값이 실제로 달라지는 행만 교정한다. 이미 올바른 행에
        # 검수 이력만 덧붙이는 불필요한 쓰기는 하지 않는다.
        if changed_fields:
            source_changes.append({
                "id": row["id"], "sourceLabel": row["source_label"],
                "fields": changed_fields, "update": update,
            })

    applied = []
    if args.repair_source:
        for change in source_changes:
            endpoint = f"{config['url']}/rest/v1/items?id=eq.{int(change['id'])}"
            returned = request_json(endpoint, config["key"], "PATCH", change["update"])
            if len(returned) != 1 or int(returned[0]["id"]) != int(change["id"]):
                raise RuntimeError(f"원본 교정 확인 실패: {change['id']}")
            applied.append(change["id"])

    report = {
        "schema": "problem-atom/course-classification-audit/1.0",
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "publishedCards": len(published),
        "verifiedRuleCount": len(index),
        "publishedMismatchCount": len(published_mismatches),
        "publishedMismatches": published_mismatches,
        "sourceRowsChecked": len(source_rows),
        "sourceChangeCount": len(source_changes),
        "sourceChanges": [
            {key: value for key, value in change.items() if key != "update"}
            for change in source_changes
        ],
        "sourceAppliedCount": len(applied),
        "sourceAppliedIds": applied,
    }
    REPORT_PATH.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(
        f"공개 카드 {len(published)}건 / 검수 규칙 {len(index)}건 / "
        f"공개 불일치 {len(published_mismatches)}건 / 원본 교정 대상 {len(source_changes)}건"
    )
    if args.repair_source:
        print(f"원본 DB 교정 및 응답 검증 {len(applied)}건 완료")
    else:
        print("원본 DB는 변경하지 않았습니다. 적용하려면 --repair-source를 사용하세요.")


if __name__ == "__main__":
    main()
