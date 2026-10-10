// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Required Notice: Copyright (c) 2026 Lazy Doggy contributors (https://hoary-stock.github.io/lazy-doggy/).
"use strict";
const element = (id) => document.getElementById(id);
const providers = [
  {id: "claude", label: "Claude · 模拟"}, {id: "codex", label: "Codex · 模拟"},
  {id: "deepseek", label: "DeepSeek · 模拟"}, {id: "qwen", label: "Qwen · 模拟"}
];
const local = location.protocol === "http:" && ["127.0.0.1", "localhost"].includes(location.hostname);
let provider = "claude", pendingId = null, busy = false;

function controls() {
  element("send").disabled = !local || busy || pendingId !== null;
  element("lose").disabled = !local || busy || pendingId !== null;
  element("recover").disabled = !local || busy || pendingId === null;
}
function showStatus(text) { element("status").textContent = text; }
async function api(path, body) {
  if (!local || !path.startsWith("/demo/")) throw new Error("local_demo_only");
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), 5000);
  try {
    const response = await fetch(path, {
      method: body ? "POST" : "GET", cache: "no-store", redirect: "error",
      credentials: "omit", signal: abort.signal,
      headers: body ? {"Content-Type": "application/json", "X-Whiteboard-Demo": "1"} : {},
      body: body ? JSON.stringify(body) : undefined
    });
    const value = await response.json();
    if (!response.ok || value.demo_only !== true) throw new Error("demo_request_failed");
    return value;
  } finally { clearTimeout(timer); }
}
async function statistics() {
  const usage = await api("/demo/usage");
  element("tokens").textContent = `${usage.known_tokens} · 固定假值，${usage.requests} 个模拟操作`;
  const events = await api("/demo/events?since_seq=0");
  element("events").textContent = JSON.stringify(events, null, 2);
}
function accept(receipt) {
  if (receipt.request_id !== pendingId || receipt.state !== "done") throw new Error("receipt_mismatch");
  element("receipt").textContent = JSON.stringify(receipt, null, 2);
  element("occupancy").textContent = `${receipt.context.used_tokens} / ${receipt.context.capacity_tokens} · 合成占用`;
  pendingId = null;
  showStatus("已读模拟终态；没有 Agent 执行，也没有真实 Tokens 消耗。");
}
async function send(loseAck) {
  if (busy || pendingId !== null) return;
  if (!globalThis.crypto?.randomUUID) return showStatus("浏览器缺少安全 UUID；不发送。");
  pendingId = crypto.randomUUID().replaceAll("-", "");
  busy = true; controls();
  showStatus("模拟请求已开始；出错只查原 UUID，不自动重放。");
  try {
    const receipt = await api("/demo/messages", {
      request_id: pendingId, provider, effort: element("effort").value,
      context_window: Number(element("context").value)
    });
    if (loseAck) {
      element("receipt").textContent = `已故意忽略响应；原 UUID：${pendingId}`;
      showStatus("模拟确认丢失：下一步只能读取原 UUID，不重新 POST。");
    } else { accept(receipt); }
    await statistics().catch(() => showStatus("统计读取失败；保留已知回执状态。"));
  } catch (_error) {
    showStatus("结果未知：保留原 UUID，只读查询；404 也不证明没有接收。");
    element("receipt").textContent = `未确认的 UUID：${pendingId}`;
  } finally { busy = false; controls(); }
}
async function recover() {
  if (busy || pendingId === null) return;
  busy = true; controls();
  try {
    accept(await api(`/demo/messages/${pendingId}`));
    await statistics().catch(() => showStatus("统计读取失败；原回执已确认。"));
  }
  catch (_error) { showStatus("回执仍未知；没有自动重放请求。"); }
  finally { busy = false; controls(); }
}
for (const item of providers) {
  const button = document.createElement("button");
  button.textContent = item.label;
  button.setAttribute("aria-pressed", String(item.id === provider));
  button.addEventListener("click", () => {
    provider = item.id;
    for (const child of element("providers").children) child.setAttribute("aria-pressed", String(child === button));
  });
  element("providers").append(button);
}
element("send").addEventListener("click", () => send(false));
element("lose").addEventListener("click", () => send(true));
element("recover").addEventListener("click", recover);
controls();
if (local) {
  element("connection").textContent = "本机 HTTP mock；没有任何真实远程连接。";
  statistics().catch(() => showStatus("请运行白板服务器；当前只展示静态页面。"));
}
