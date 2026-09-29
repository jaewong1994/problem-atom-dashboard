"""Attach reviewed PDF crops to existing dashboard identities without touching progress."""
from __future__ import annotations

import copy
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
MANIFEST = "official-exam-media.json"


def apply_media(data: dict, root: Path = ROOT) -> tuple[dict, dict]:
    manifest_path = root / MANIFEST
    if not manifest_path.exists():
        return data, {"attached": 0, "outsideDashboard": 0}
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    if manifest.get("schema") != "problem-atom/official-exam-media/1":
        raise ValueError("Unknown official exam media schema")
    result = copy.deepcopy(data)
    index = {}
    for exam in result["exams"]:
        for section in exam.get("sections", []):
            for question in section.get("questions", []):
                key = (exam["id"], section["id"], question["number"])
                if key in index:
                    raise ValueError(f"Duplicate dashboard coordinate: {key}")
                index[key] = (exam, question)
    seen = set()
    attached = outside = 0
    for row in manifest["records"]:
        key = (row["examId"], row["sectionId"], row["number"])
        if key in seen:
            raise ValueError(f"Duplicate media coordinate: {key}")
        seen.add(key)
        asset = (root / row["preview"]).resolve()
        if not asset.is_relative_to((root / "assets" / "exams").resolve()):
            raise ValueError("Exam image path must stay in assets/exams")
        if not asset.is_file():
            raise ValueError(f"Missing exam crop: {row['preview']}")
        if hashlib.sha256(asset.read_bytes()).hexdigest() != row["imageSha256"]:
            raise ValueError(f"Exam crop hash mismatch: {key}")
        if not row.get("answer") or row.get("score") not in (2, 3, 4):
            raise ValueError(f"Missing official answer/score: {key}")
        if key not in index:
            if row["score"] != 2:
                raise ValueError(f"Unmatched 3/4-point exam question: {key}")
            outside += 1
            continue
        exam, question = index[key]
        if exam["year"] != row["calendarYear"] or row["academicYear"] != exam["year"] + 1:
            raise ValueError(f"Calendar/academic year mismatch: {key}")
        if question.get("score") != row["score"]:
            raise ValueError(f"Score mismatch: {key}")
        # IDs, legacyIds, body/inline figures, course tags, and claim/progress data stay intact.
        question["preview"] = row["preview"]
        question["officialAnswer"] = row["answer"]
        question["previewSource"] = row["source"]
        attached += 1
    coverage = manifest["dashboardCoverage"]
    if attached != coverage["attached"] or outside != coverage["outsideDashboard"]:
        raise ValueError(f"Incomplete media attachment: {attached}/{outside}")
    result["mediaUpdatedAt"] = manifest["updatedAt"]
    return result, {"attached": attached, "outsideDashboard": outside}


def update_dashboard(root: Path = ROOT) -> dict:
    path = root / "dashboard-data.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    updated, report = apply_media(data, root)
    if updated != data:
        path.write_text(json.dumps(updated, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return report


if __name__ == "__main__":
    print(json.dumps(update_dashboard(), ensure_ascii=False))
