# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
# Required Notice: Copyright (c) 2026 Lazy Doggy contributors (https://hoary-stock.github.io/lazy-doggy/).
"""Original, local-only teaching mock. No agents, credentials or file actions."""
import argparse
import json
import re
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

ROOT = Path(__file__).resolve().parent
PROVIDERS = (
    {"id": "claude", "label": "Claude · 模拟"},
    {"id": "codex", "label": "Codex · 模拟"},
    {"id": "deepseek", "label": "DeepSeek · 模拟"},
    {"id": "qwen", "label": "Qwen · 模拟"},
)
EFFORTS = ("none", "low", "medium", "xhigh")
CONTEXTS = (32768, 65536, 131072, 262144)
DEMO_TEXT = "演示消息：检查一段合成文本。"
MAX_MESSAGES = 64
MAX_BODY = 1024


def strict_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError("duplicate_key")
        result[key] = value
    return result


class DemoServer(HTTPServer):
    def __init__(self, port):
        # Intentionally no host argument: do not turn this into a remote service.
        super().__init__(("127.0.0.1", port), Handler)
        self.receipts = {}
        self.events = []

    def get_request(self):
        connection, address = super().get_request()
        connection.settimeout(5)
        return connection, address


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *_args):
        pass  # No request-body, header or access logging.

    def send_data(self, status, value, content_type="application/json; charset=utf-8"):
        body = value if isinstance(value, bytes) else json.dumps(
            value, ensure_ascii=False, allow_nan=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("Content-Security-Policy", "default-src 'none'; script-src 'self'; "
                         "style-src 'self'; connect-src 'self'; base-uri 'none'; "
                         "frame-ancestors 'none'; form-action 'none'")
        self.end_headers()
        self.wfile.write(body)

    def error(self, status, code):
        self.send_data(status, {"demo_only": True, "code": code})

    def local_host(self):
        # Host/Origin checks only limit accidental calls; they are not authentication.
        # Never proxy or expose this loopback teaching mock to a network.
        port = self.server.server_port
        if self.headers.get("Host") not in {f"127.0.0.1:{port}", f"localhost:{port}"}:
            self.error(421, "local_host_required")
            return False
        if len(self.path) > 512:
            self.error(414, "path_too_long")
            return False
        return True

    def do_GET(self):
        if not self.local_host():
            return
        target = urlsplit(self.path)
        static = {"/": ("index.html", "text/html; charset=utf-8"),
                  "/app.js": ("app.js", "text/javascript; charset=utf-8"),
                  "/style.css": ("style.css", "text/css; charset=utf-8")}
        if target.path in static and not target.query:
            name, mime = static[target.path]
            return self.send_data(200, (ROOT / name).read_bytes(), mime)
        if target.path == "/demo/providers" and not target.query:
            return self.send_data(200, {"demo_only": True, "providers": PROVIDERS,
                "efforts": EFFORTS, "contexts": CONTEXTS,
                "unimplemented": ["kimi", "files", "images", "agent_update"]})
        if target.path == "/demo/usage" and not target.query:
            counts = {p["id"]: 0 for p in PROVIDERS}
            for receipt in self.server.receipts.values():
                counts[receipt["provider"]] += 1
            return self.send_data(200, {"demo_only": True, "source": "fixed_mock_values",
                "requests": len(self.server.receipts),
                "known_tokens": 20 * len(self.server.receipts),
                "models": [{"provider": p, "model": "demo-model", "requests": n,
                            "tokens": n * 20} for p, n in counts.items()]})
        if target.path == "/demo/cache" and not target.query:
            return self.send_data(200, {"demo_only": True, "complete": False,
                "bytes": None, "items": [], "writes_allowed": False,
                "reason": "no_attachment_store_implemented"})
        if target.path == "/demo/events":
            query = parse_qs(target.query, keep_blank_values=True)
            since = query.get("since_seq", ["0"])
            if set(query) - {"since_seq"} or len(since) != 1 or not re.fullmatch(r"[0-9]{1,6}", since[0]):
                return self.error(400, "invalid_cursor")
            events = [e for e in self.server.events if e["seq"] > int(since[0])][:16]
            return self.send_data(200, {"demo_only": True, "events": events})
        prefix = "/demo/messages/"
        if target.path.startswith(prefix) and not target.query:
            request_id = target.path[len(prefix):]
            if not re.fullmatch(r"[0-9a-f]{32}", request_id):
                return self.error(400, "invalid_request_id")
            receipt = self.server.receipts.get(request_id)
            if receipt is None:
                return self.error(404, "receipt_unknown_do_not_replay")
            return self.send_data(200, receipt)
        self.error(404, "not_implemented")

    def do_POST(self):
        if not self.local_host():
            return
        if self.path != "/demo/messages":
            return self.error(404, "not_implemented")
        port = self.server.server_port
        origins = {f"http://127.0.0.1:{port}", f"http://localhost:{port}"}
        if self.headers.get("Origin") not in origins or self.headers.get("X-Whiteboard-Demo") != "1":
            return self.error(403, "same_origin_demo_required")
        if self.headers.get("Transfer-Encoding"):
            return self.error(400, "chunked_not_supported")
        length = self.headers.get("Content-Length", "")
        if not re.fullmatch(r"[0-9]{1,6}", length):
            return self.error(411, "length_required")
        if int(length) > MAX_BODY:
            return self.error(413, "body_too_large")
        if self.headers.get("Content-Type") != "application/json":
            return self.error(415, "json_required")
        try:
            raw = self.rfile.read(int(length))
            if len(raw) != int(length):
                raise ValueError("short_body")
            data = json.loads(raw.decode("utf-8"), object_pairs_hook=strict_object,
                              parse_constant=lambda _value: (_ for _ in ()).throw(ValueError()))
            if type(data) is not dict or set(data) != {"request_id", "provider", "effort", "context_window"}:
                raise ValueError("invalid_fields")
            if not isinstance(data["request_id"], str) or not re.fullmatch(r"[0-9a-f]{32}", data["request_id"]):
                raise ValueError("invalid_id")
            if data["provider"] not in [p["id"] for p in PROVIDERS] or data["effort"] not in EFFORTS:
                raise ValueError("invalid_selection")
            if type(data["context_window"]) is not int or data["context_window"] not in CONTEXTS:
                raise ValueError("invalid_context")
        except (ValueError, TypeError, OSError):
            return self.error(400, "invalid_demo_request")
        request_id = data["request_id"]
        existing = self.server.receipts.get(request_id)
        if existing:
            if existing["request"] != data:
                return self.error(409, "request_id_conflict")
            return self.send_data(200, existing)
        if len(self.server.receipts) >= MAX_MESSAGES:
            return self.error(507, "demo_memory_limit_restart_manually")
        receipt = {"demo_only": True, "request_id": request_id,
            "provider": data["provider"], "request": data, "state": "done",
            "text": DEMO_TEXT, "answer": "模拟回答：未读取文件，也未调用任何模型。",
            "context": {"used_tokens": 12, "capacity_tokens": data["context_window"],
                        "source": "fixed_mock_values"},
            "usage": {"input_tokens": 12, "output_tokens": 8, "total_tokens": 20,
                      "source": "fixed_mock_values"}}
        self.server.receipts[request_id] = receipt
        for state in ("accepted", "running", "done"):
            self.server.events.append({"demo_only": True, "seq": len(self.server.events) + 1,
                "request_id": request_id, "type": state, "source": "immediate_mock_events"})
        self.send_data(202, receipt)


def main():
    parser = argparse.ArgumentParser(description="Lazy Doggy 本机白板：不是可部署产品")
    parser.add_argument("--port", type=int, default=8765)
    args = parser.parse_args()
    if not 1 <= args.port <= 65535:
        parser.error("port must be 1..65535")
    server = DemoServer(args.port)
    print(f"本机教学 mock：http://127.0.0.1:{args.port}；Ctrl+C 停止。不可直接部署。")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
