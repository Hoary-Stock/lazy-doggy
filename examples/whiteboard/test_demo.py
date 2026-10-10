# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
# Required Notice: Copyright (c) 2026 Lazy Doggy contributors (https://hoary-stock.github.io/lazy-doggy/).
"""Synthetic HTTP checks; own ephemeral loopback server, no upstream calls."""
import http.client
import json
import threading
import unittest

from server import CONTEXTS, DEMO_TEXT, MAX_BODY, MAX_MESSAGES, DemoServer


class WhiteboardTests(unittest.TestCase):
    def setUp(self):
        self.server = DemoServer(0)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(3)
        self.assertFalse(self.thread.is_alive())

    def request(self, method, path, value=None, *, raw=None, extra=None):
        port = self.server.server_port
        connection = http.client.HTTPConnection("127.0.0.1", port, timeout=3)
        headers = {"Host": f"127.0.0.1:{port}", "Origin": f"http://127.0.0.1:{port}",
                   "X-Whiteboard-Demo": "1", "Content-Type": "application/json"}
        headers.update(extra or {})
        body = raw if raw is not None else json.dumps(value).encode() if value is not None else None
        try:
            connection.request(method, path, body=body, headers=headers)
            response = connection.getresponse()
            payload = response.read()
            value = json.loads(payload) if response.getheader("Content-Type", "").startswith("application/json") else payload
            return response.status, value
        finally:
            connection.close()

    def message(self, number=1, **changes):
        return {"request_id": f"{number:032x}", "provider": "qwen", "effort": "none",
                "context_window": 65536, **changes}

    def test_loopback_only(self):
        self.assertEqual(self.server.server_address[0], "127.0.0.1")

    def test_static_allowlist_and_traversal(self):
        for path in ("/", "/app.js", "/style.css"):
            status, body = self.request("GET", path)
            self.assertEqual(status, 200)
            self.assertGreater(len(body), 100)
        for path in ("/../server.py", "/%2e%2e/server.py", "/server.py", "/NOTICE.md"):
            self.assertEqual(self.request("GET", path)[0], 404)

    def test_external_host_is_refused(self):
        self.assertEqual(self.request("GET", "/demo/usage", extra={"Host": "example.invalid"})[0], 421)

    def test_external_origin_is_refused_without_accepting_message(self):
        self.assertEqual(self.request("POST", "/demo/messages", self.message(),
            extra={"Origin": "https://example.invalid"})[0], 403)
        self.assertEqual(self.server.receipts, {})

    def test_fixed_message_and_all_selections(self):
        for number, (provider, context) in enumerate(zip(("claude", "codex", "deepseek", "qwen"), CONTEXTS), 1):
            status, receipt = self.request("POST", "/demo/messages", self.message(number,
                provider=provider, context_window=context))
            self.assertEqual(status, 202)
            self.assertEqual(receipt["text"], DEMO_TEXT)
            self.assertEqual(receipt["context"]["capacity_tokens"], context)
            self.assertEqual(receipt["usage"]["total_tokens"], 20)
            self.assertTrue(receipt["demo_only"])

    def test_same_uuid_deduplicates_and_changed_body_conflicts(self):
        first = self.request("POST", "/demo/messages", self.message())
        second = self.request("POST", "/demo/messages", self.message())
        self.assertEqual(first[1], second[1])
        self.assertEqual(len(self.server.events), 3)
        self.assertEqual(self.request("GET", "/demo/usage")[1]["known_tokens"], 20)
        self.assertEqual(self.request("POST", "/demo/messages", self.message(effort="medium"))[0], 409)

    def test_read_original_receipt_and_unknown_does_not_mutate(self):
        _, receipt = self.request("POST", "/demo/messages", self.message())
        self.assertEqual(self.request("GET", "/demo/messages/" + receipt["request_id"])[1], receipt)
        self.assertEqual(self.request("GET", "/demo/messages/" + self.message(2)["request_id"])[0], 404)
        self.assertEqual(len(self.server.receipts), 1)

    def test_strict_schema_duplicate_keys_and_boolean_context(self):
        bodies = [self.message(text="not accepted"), self.message(context_window=True),
                  self.message(provider="kimi"), self.message(effort="unknown"),
                  self.message(context_window=999999), self.message(request_id="../wrong")]
        for body in bodies:
            self.assertEqual(self.request("POST", "/demo/messages", body)[0], 400)
        duplicate = json.dumps(self.message())[:-1] + ',"effort":"medium"}'
        self.assertEqual(self.request("POST", "/demo/messages", raw=duplicate.encode())[0], 400)
        self.assertEqual(self.server.receipts, {})

    def test_oversized_body_is_refused(self):
        self.assertEqual(self.request("POST", "/demo/messages", raw=b"x" * (MAX_BODY + 1))[0], 413)
        self.assertEqual(self.server.receipts, {})

    def test_event_cursor_and_page_are_bounded(self):
        self.request("POST", "/demo/messages", self.message())
        status, value = self.request("GET", "/demo/events?since_seq=1")
        self.assertEqual(status, 200)
        self.assertEqual([event["seq"] for event in value["events"]], [2, 3])
        for query in ("since_seq=-1", "since_seq=1&since_seq=2", "other=1"):
            self.assertEqual(self.request("GET", "/demo/events?" + query)[0], 400)

    def test_cache_is_unknown_and_file_actions_are_absent(self):
        status, value = self.request("GET", "/demo/cache")
        self.assertEqual(status, 200)
        self.assertIsNone(value["bytes"])
        self.assertFalse(value["complete"])
        self.assertFalse(value["writes_allowed"])
        for path in ("/demo/uploads/file", "/demo/cache/release", "/demo/cache/cleanup", "/demo/exec"):
            self.assertEqual(self.request("POST", path, {})[0], 404)
        self.assertEqual(self.server.receipts, {})

    def test_memory_budget_preserves_existing_receipts(self):
        for number in range(MAX_MESSAGES):
            self.assertEqual(self.request("POST", "/demo/messages", self.message(number))[0], 202)
        self.assertEqual(self.request("POST", "/demo/messages", self.message(MAX_MESSAGES))[0], 507)
        self.assertEqual(self.request("POST", "/demo/messages", self.message(0))[0], 200)
        self.assertEqual(len(self.server.receipts), MAX_MESSAGES)


if __name__ == "__main__":
    unittest.main()
