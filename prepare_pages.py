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
    "studio.html", "connections.html", "connections.css", "connections.js", "connection-engine.js", "connection-registry.json", "connection-validation.json", "composition-catalog.json",
    "authoring-model.js", "authoring-ui.js", "authoring.css", "authoring-lessons.json", "web-handoff.js", "production-io.js", "composition-graph.js", "mindmap-ui.js", "box-copy.js", "model-contract.js", "composition-planner.js", "selection-model.js", "session-client.js", "model-provider.json",
    "review-groups.json", "group-review-ledger.json", "group-review.js", "sandbox.css",
    "combination-examples.json", "combination-examples.js",
    "motif-library.html",
    "motif-library.css",
    "motif-library.js",
    "motif-library.json",
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
    "site-shell.css",
    "site-shell.js",
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
    "promotion-board.html",
    "promotion-board.css",
    "promotion-board.js",
    "promotion-board.json",
    "math-text.js",
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
    from build_navigation import build as build_navigation
    build_navigation()
    from build_sandbox import build
    build(ROOT)
    # The published bank must pass independent symbolic checks on every build.
    import unittest
    from test_sandbox import SandboxTests
    from test_composer import ComposerTests
    from build_connections import build as build_connections
    build_connections()
    from test_connections import ConnectionTests
    from test_model import ModelTests
    from test_session import SessionTests
    from test_session_math import SessionMathTests
    from test_navigation import NavigationTests
    from test_planner import PlannerTests
    from test_graph import GraphTests
    from test_handoff import HandoffTests, HwpxTests
    from test_authoring import AuthoringTests
    suite=unittest.TestSuite([unittest.defaultTestLoader.loadTestsFromTestCase(case) for case in (SandboxTests,ComposerTests,ConnectionTests,ModelTests,SessionTests,SessionMathTests,NavigationTests,PlannerTests,GraphTests,HandoffTests,HwpxTests,AuthoringTests)])
    result = unittest.TextTestRunner(verbosity=1).run(suite)
    if not result.wasSuccessful():
        raise RuntimeError("조합 문항 회귀검증 실패: 배포를 중단합니다")
    import hashlib
    registry=json.loads((ROOT/'connection-registry.json').read_text(encoding='utf-8'))
    (ROOT/'connection-validation.json').write_text(json.dumps({
        'engine':'connections-1.0',
        'registry_revision':registry['revision'],
        'engine_sha256':hashlib.sha256((ROOT/'connection-engine.js').read_text(encoding='utf-8').encode('utf-8')).hexdigest(),
        'test_methods_passed':result.testsRun-len(result.skipped), 'test_methods_skipped':len(result.skipped),
        'records':len(registry['records']), 'contracts':len(registry['operations']),
        'pair_discovery_checks':len(registry['operations'])**2,
        'cross_seminar_witnesses':3, 'legacy_generated_cases':192,
        'checks':['every contract requirement removed','forbidden conditions','object and scope isolation','bridge paths and removal','unknown and stale assets','new asset ingestion','independent algebra witnesses','retired UI','Sol request and result contract','mock API failure handling','service access controls'],
        'model_api_default':'gpt-5.6-sol','live_api_tested':False,'model_adapter_tested_with_mock':True,
        'generation_mode':'codex_chatgpt_session','session_model':'gpt-5.6-sol','session_service_regressions':True,
        'local_item_generator_enabled':False,'human_approved':False,'difficulty_calibrated':False
    },ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
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
