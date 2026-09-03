from __future__ import annotations

import hashlib
import json
import re
from collections import defaultdict
from pathlib import Path

from PIL import Image

from build_dashboard import DASH, detect_following_cover_y


def main() -> None:
    payload = json.loads((DASH / "dashboard-data.json").read_text(encoding="utf-8"))
    questions = [
        question
        for exam in payload["exams"]
        for section in exam["sections"]
        for question in section["questions"]
    ]
    previews = {question["preview"] for question in questions if question.get("preview")}
    inline_images = {
        path
        for question in questions
        for path in (question.get("images") or [])
    }
    image_assets = previews | inline_images
    missing = sorted(path for path in image_assets if not (DASH / path).exists())
    cover_text = sorted(
        question["id"]
        for question in questions
        if all(marker in (question.get("body") or "") for marker in ("문제지", "제 2 교시", "수학 영역"))
    )
    repeated_scores = sorted(
        question["id"]
        for question in questions
        if len(re.findall(r"\[[234]점\]", question.get("body") or "")) > 1
    )

    hashes: dict[str, list[str]] = defaultdict(list)
    cover_pixels = []
    for preview in sorted(image_assets):
        path = DASH / preview
        if not path.exists():
            continue
        if preview in previews:
            hashes[hashlib.sha256(path.read_bytes()).hexdigest()].append(preview)
        with Image.open(path) as image:
            if image.height >= 1200 and detect_following_cover_y(image) is not None:
                cover_pixels.append(preview)

    duplicate_assets = [
        paths
        for paths in hashes.values()
        if len({re.search(r"item_(\d+)", path).group(1) for path in paths}) > 1
    ]
    result = {
        "questions": len(questions),
        "uniquePreviews": len(previews),
        "uniqueInlineImages": len(inline_images),
        "uniqueImageAssets": len(image_assets),
        "missingImageAssets": missing,
        "followingCoverText": cover_text,
        "followingCoverPixels": cover_pixels,
        "multipleScoreMarkers": repeated_scores,
        "exactDuplicatesAcrossDifferentNumbers": duplicate_assets,
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))
    assert not missing
    assert not cover_text
    assert not cover_pixels
    assert not repeated_scores
    assert not duplicate_assets


if __name__ == "__main__":
    main()
