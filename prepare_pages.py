#!/usr/bin/env python3
"""Build the GitHub Pages artifact and optionally merge seminar JSON files."""

from __future__ import annotations

import argparse
import json
import shutil
import stat
from pathlib import Path


ROOT = Path(__file__).resolve().parent
SITE = ROOT / "_site"
SUMMARY = ROOT / "progress-summary.json"
STATIC_FILES = (
    "index.html",
    "entry.css",
    "entry.js",
    "manifest.webmanifest",
    "sw.js",
    "pwa-install.css",
    "pwa-install.js",
    "dashboard.html",
    "app.js",
    "styles.css",
    "grouped.css",
    "season.css",
    "realtime-config.js",
    "realtime.js",
    "season-config.json",
    "vision.html",
    "vision.css",
    "vision.js",
    "asset-library.html",
    "asset-library.css",
    "ontology-boundary.css",
    "asset-library.js",
    "asset-library.json",
    "dashboard-data.json",
    "progress-summary.json",
)
STATIC_DIRS = ("assets", "vendor")


def merge_progress() -> None:
    sources = []
    for path in sorted((ROOT / "progress").glob("*.json")):
        with path.open(encoding="utf-8-sig") as stream:
            payload = json.load(stream)
        if not isinstance(payload, dict) or not isinstance(payload.get("events"), list):
            raise ValueError(f"잘못된 세미나 JSON 형식: {path.name}")
        sources.append({"actor": payload.get("actor") or path.stem, "events": payload["events"]})
    SUMMARY.write_text(
        json.dumps({"sources": sources}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"공유 현황 병합 완료: {len(sources)}개 파일 → {SUMMARY.name}")


def build_site() -> None:
    if SITE.exists():
        if SITE.parent != ROOT or SITE.name != "_site":
            raise RuntimeError("빌드 폴더 경로 검증 실패")
        def remove_readonly(function, path, _error):
            Path(path).chmod(stat.S_IWRITE)
            function(path)

        shutil.rmtree(SITE, onexc=remove_readonly)
    SITE.mkdir()
    for name in STATIC_FILES:
        source = ROOT / name
        if not source.exists():
            raise FileNotFoundError(f"배포 필수 파일 없음: {name}")
        shutil.copy2(source, SITE / name)
    for name in STATIC_DIRS:
        ignore = None
        if name == "assets":
            ignore = shutil.ignore_patterns(
                "csat-2014-수리A형", "csat-2014-수리B형",
                "csat-2015-수리A형", "csat-2015-수리B형",
                "csat-2016-수리A형", "csat-2016-수리B형",
            )
        shutil.copytree(ROOT / name, SITE / name, ignore=ignore)
    (SITE / ".nojekyll").write_text("", encoding="utf-8")
    print(f"GitHub Pages 빌드 완료: {SITE}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--merge-progress", action="store_true")
    parser.add_argument("--build", action="store_true")
    args = parser.parse_args()
    if args.merge_progress:
        merge_progress()
    if args.build or not args.merge_progress:
        build_site()
