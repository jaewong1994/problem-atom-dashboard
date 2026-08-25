from __future__ import annotations

import json
import mimetypes
import os
import re
import sys
import tempfile
import webbrowser
from argparse import ArgumentParser
from datetime import datetime, timezone
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import unquote, urlparse

ROOT = Path(sys.executable).resolve().parent if getattr(sys, "frozen", False) else Path(__file__).resolve().parent
PROGRESS = ROOT / "progress"
HOST, PORT = "127.0.0.1", 8876
PROGRESS.mkdir(exist_ok=True)


def json_bytes(value: object) -> bytes:
    return json.dumps(value, ensure_ascii=False, separators=(",", ":")).encode("utf-8")


def safe_actor(value: str) -> str:
    cleaned = re.sub(r"[^0-9A-Za-z가-힣_-]", "_", value.strip())[:20]
    if not cleaned:
        raise ValueError("구성원 이름이 필요합니다.")
    return cleaned


class Handler(SimpleHTTPRequestHandler):
    def log_message(self, fmt: str, *args: object) -> None:
        print(f"[{self.log_date_time_string()}] {fmt % args}")

    def send_json(self, value: object, status: int = 200) -> None:
        body = json_bytes(value)
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:
        path = urlparse(self.path).path
        if path == "/api/data":
            try:
                self.send_json(json.loads((ROOT / "dashboard-data.json").read_text(encoding="utf-8")))
            except Exception as exc:
                self.send_json({"error": str(exc)}, 500)
            return
        if path == "/api/progress":
            sources = []
            for item in sorted(PROGRESS.glob("*.json")):
                try:
                    sources.append(json.loads(item.read_text(encoding="utf-8")))
                except (OSError, json.JSONDecodeError):
                    continue
            self.send_json({"sources": sources})
            return
        if path == "/":
            self.path = "/index.html"
        return super().do_GET()

    def do_POST(self) -> None:
        if urlparse(self.path).path != "/api/toggle":
            self.send_json({"error": "not found"}, 404)
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length < 2 or length > 8192:
                raise ValueError("잘못된 요청 크기입니다.")
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
            actor = safe_actor(str(payload.get("actor", "")))
            question_id = str(payload.get("questionId", ""))
            if not re.fullmatch(r"[0-9A-Za-z가-힣_.:-]{3,120}", question_id):
                raise ValueError("문항 ID가 올바르지 않습니다.")
            target = PROGRESS / f"{actor}.json"
            current = {"actor": actor, "events": []}
            if target.exists():
                current = json.loads(target.read_text(encoding="utf-8"))
            current.setdefault("events", []).append({
                "questionId": question_id,
                "done": bool(payload.get("done")),
                "updatedAt": datetime.now(timezone.utc).isoformat(timespec="milliseconds"),
            })
            current["events"] = current["events"][-5000:]
            fd, temp_name = tempfile.mkstemp(prefix=f".{actor}-", suffix=".tmp", dir=PROGRESS)
            try:
                with os.fdopen(fd, "w", encoding="utf-8") as handle:
                    json.dump(current, handle, ensure_ascii=False, indent=2)
                    handle.flush()
                    os.fsync(handle.fileno())
                os.replace(temp_name, target)
            finally:
                if os.path.exists(temp_name):
                    os.unlink(temp_name)
            self.send_json({"ok": True})
        except Exception as exc:
            self.send_json({"error": str(exc)}, 400)

    def translate_path(self, path: str) -> str:
        clean = unquote(urlparse(path).path).lstrip("/")
        candidate = (ROOT / clean).resolve()
        if candidate != ROOT and ROOT not in candidate.parents:
            return str(ROOT / "__blocked__")
        return str(candidate)


def parse_args() -> object:
    parser = ArgumentParser(description="기출 원자화 세미나 현황판")
    parser.add_argument("--port", type=int, default=PORT)
    parser.add_argument("--no-browser", action="store_true")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    url = f"http://{HOST}:{args.port}"
    try:
        server = ThreadingHTTPServer((HOST, args.port), Handler)
    except OSError as exc:
        print(f"현황판 포트({args.port})를 열 수 없습니다: {exc}")
        print(f"이미 실행 중이라면 브라우저에서 {url}/ 을 열어 주세요.")
        if not args.no_browser:
            webbrowser.open(f"{url}/")
        return

    print(f"현황판 실행 중: {url}/")
    print(f"공유 데이터 폴더: {ROOT}")
    print("이 창을 닫으면 현황판 서버가 종료됩니다.")
    if not args.no_browser:
        webbrowser.open(f"{url}/")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
