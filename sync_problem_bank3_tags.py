from __future__ import annotations

import json
import re
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path


DASH = Path(__file__).resolve().parent
NGD2_CONFIG = Path(
    r"C:\Users\jaewo\OneDrive\바탕 화면\학원\NGD2_새폴더_풀세트\공장\적재설정.json"
)
OUTPUT = DASH / "problem-bank3-tags.json"
PAGE_SIZE = 1000

COURSE_LABELS = {
    "CM1": "공통수학Ⅰ",
    "CM2": "공통수학Ⅱ",
    "ALG": "대수(기존 수학Ⅰ)",
    "M2": "미적분Ⅰ(기존 수학Ⅱ)",
    "CALC": "미적분Ⅱ(기존 미적분)",
    "PRST": "확률과 통계",
    "GEO": "기하",
}

SOURCE_RE = re.compile(
    r"^(?P<year>\d{4})\s+(?P<kind>평가원|수능)\s+고3\s+(?P<track>.+?)\s+"
    r"(?P<month>\d{1,2}월)\s+(?P<number>\d+)번$"
)


def normalize_track(value: str) -> str:
    track = re.sub(r"\s+", "", value or "")
    track = re.sub(r"^(수학|수리)", "", track)
    if "확률통계" in track or "확통" in track:
        return "확통"
    if "미분과적분" in track:
        return "가형미분과적분"
    if "공통" in track:
        if "가형" in track:
            return "가형공통"
        return "공통"
    if "미적분" in track:
        return "미적분"
    if "기하" in track:
        return "기하"
    if "가형" in track:
        return "가형"
    if "나형" in track:
        return "나형"
    if "A형" in track:
        return "A형"
    if "B형" in track:
        return "B형"
    return track or "미상"


def fetch_rows(url: str, key: str) -> list[dict]:
    rows: list[dict] = []
    offset = 0
    while True:
        query = urllib.parse.urlencode(
            {
                "select": "source_label,course,course_norm,unit,origin_seq",
                "or": "(source_label.ilike.*평가원*,source_label.ilike.*수능*)",
                "limit": PAGE_SIZE,
                "offset": offset,
                "order": "id.asc",
            }
        )
        request = urllib.request.Request(
            f"{url}/rest/v1/items?{query}",
            headers={
                "apikey": key,
                "Authorization": f"Bearer {key}",
                "User-Agent": "problem-atom-dashboard-tag-sync/1.0",
            },
        )
        with urllib.request.urlopen(request, timeout=60) as response:
            page = json.load(response)
        rows.extend(page)
        if len(page) < PAGE_SIZE:
            return rows
        offset += PAGE_SIZE


def main() -> None:
    config = json.loads(NGD2_CONFIG.read_text(encoding="utf-8"))
    rows = fetch_rows(config["url"], config["key"])
    records = []
    for row in rows:
        label = str(row.get("source_label") or "").strip()
        match = SOURCE_RE.match(label)
        if not match:
            continue
        raw_course = str(row.get("course_norm") or row.get("course") or "").strip()
        course_code = raw_course if raw_course in COURSE_LABELS else ""
        records.append(
            {
                "sourceLabel": label,
                "examType": "mock" if match["kind"] == "평가원" else "csat",
                "year": int(match["year"]),
                "session": match["month"] if match["kind"] == "평가원" else "수능",
                "track": normalize_track(match["track"]),
                "number": int(match["number"]),
                "courseCode": course_code,
                "courseLabel": COURSE_LABELS.get(course_code, raw_course or "과목 미분류"),
                "unit": str(row.get("unit") or "").strip(),
            }
        )

    records.sort(key=lambda row: (row["examType"], row["year"], row["session"], row["track"], row["number"]))
    payload = {
        "schema": "problem-atom/problem-bank3-course-tags/1.0",
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": "NGD2 문제은행3 읽기 전용 과목·단원 메타",
        "note": "세미나 사람검수 온톨로지와 분리된 탐색용 태그이며 자동 병합하지 않는다.",
        "courseLabels": COURSE_LABELS,
        "records": records,
    }
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"문제은행3 태그 {len(records)}건 저장: {OUTPUT.name}")


if __name__ == "__main__":
    main()
