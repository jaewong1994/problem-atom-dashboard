#!/usr/bin/env python3
"""Create the public, aggregate-only asset library from the operator-curated source."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parent
SOURCE = ROOT.parent / "shared" / "approved-assets.json"
REVIEW = ROOT.parent / "shared" / "review-board.json"
OUTPUT = ROOT / "asset-library.json"
KINDS = ("concept", "skill", "decision", "problem_pattern", "strategy")


def clean_record(record: dict) -> dict:
    allowed = {
        "id", "kind", "name", "definition", "status", "subjects", "tags",
        "sourceCount", "reviewers", "updatedAt", "bottlenecks", "relations",
        "questionId", "title", "axes", "flow", "difficulty", "familyRole",
        "coverage", "memberSummary", "candidateId", "canonicalId", "contentHash", "domain", "origin", "fromHandwriting",
    }
    return {key: record[key] for key in allowed if key in record}


def build() -> None:
    payload = json.loads(SOURCE.read_text(encoding="utf-8-sig"))
    review = json.loads(REVIEW.read_text(encoding="utf-8-sig")) if REVIEW.exists() else {}
    entities = [clean_record(x) for x in payload.get("entities", []) if x.get("status") in {"reviewed", "approved"}]
    questions = [clean_record(x) for x in payload.get("questions", []) if x.get("status") in {"reviewed", "approved"}]
    families = [clean_record(x) for x in payload.get("families", []) if x.get("status") in {"reviewed", "approved"}]
    mock_exams = [clean_record(x) for x in payload.get("mockExams", []) if x.get("status") in {"reviewed", "approved"}]
    review_entities = [clean_record(x) for x in review.get("entities", [])]
    review_questions = [clean_record({**x, "kind": x.get("kind") or "question"}) for x in review.get("questions", [])]
    by_kind = {kind: sum(x.get("kind") == kind for x in entities) for kind in KINDS}
    approved = sum(x.get("status") == "approved" for x in entities + questions + families + mock_exams)
    output = {
        "schemaVersion": 1,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "summary": {
            "entities": len(entities), "questions": len(questions), "families": len(families),
            "mockExams": len(mock_exams), "approved": approved, "byKind": by_kind,
            "reviewQueue": len(review_entities) + len(review_questions),
        },
        "entities": entities, "questions": questions, "families": families, "mockExams": mock_exams,
        "reviewQueue": review_entities + review_questions,
    }
    OUTPUT.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(
        f"공유 자산 생성: 엔터티 {len(entities)}, 문항 {len(questions)}, "
        f"문항군 {len(families)}, 모의고사 {len(mock_exams)}, 검토 대기 {len(review_entities) + len(review_questions)}"
    )


if __name__ == "__main__":
    build()
