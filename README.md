# Lazy Doggy · 公开复建蓝图

**躺在床上，也能安排 AI 干活。**

离开电脑后，从手机继续给服务器上的 Agent 补充要求、看结果、传文件；在 Windows 上使用同一套服务。遇到客户端问题，在手机上提交复现步骤，交给开发者或 AI 排查。

**[打开中文互动报告](https://hoary-stock.github.io/lazy-doggy/)** · [从这里开始搭建](docs/quickstart.md) · [交给你的 AI 的任务书](AI_BUILD_PROMPT.md) · [成本与边界](docs/costs.md)

## 可以做什么

| 入口 | 适合的场景 | 展示实例 |
|---|---|---|
| Android Tmux 客户端 | 看已有窗口、继续对话、切换 Agent、传文件 | 0.1.65 |
| Android Remote 客户端 | 结构化会话、用量、相关控制和窗口检查 | 3.29.0 |
| Windows 客户端 | 在电脑上使用同一服务、检查应用和 Agent 更新 | 0.3.0 |

上表版本号对应原实例的展示界面；本公开仓库不提供这些版本的二进制。

图片与普通文件附件、横向筛选标签、上下文与思考控制、真实 Token 统计、手机问题反馈、应用内更新、受保护的缓存清理，分别在报告和模块文档里标注。

## 需要准备什么

- 一台常开的 Linux 服务器、一个你自己的域名，以及 HTTPS。
- 你有权使用的 Agent CLI、模型订阅或 API；这些费用和服务器费用分开。
- 现有 Android 手机或 Windows 电脑。自托管大模型才另外考虑 GPU。

服务器配置取决于实际运行的 CLI、窗口数和隔离方式；一台服务器并不意味着最低配置可以运行任意多的 Agent。[完整预算](docs/costs.md)给出可复算的官网价格示例。

## 文档地图

| 要了解什么 | 文档 |
|---|---|
| 最小搭建路线 | [快速开始](docs/quickstart.md) |
| 结构、拓扑与模块分工 | [架构](docs/architecture.md) |
| HTTP、事件、回执与数据状态 | [接口约定](docs/contracts.md) |
| Linux 服务与安全部署 | [服务端](docs/backend-build.md) |
| 接入自己的模型或 CLI | [Agent 适配器](docs/agent-adapters.md) |
| 两个 Android 客户端与 Windows 客户端 | [客户端](docs/clients-build.md) |
| 图片、文件与缓存生命周期 | [附件与缓存](docs/attachments-cache.md) |
| 应用更新、Agent 更新和手机反馈 | [更新与反馈](docs/updates-feedback.md) |
| 明显的故障及修复原则 | [典型问题](docs/known-bugs.md) |
| 分阶段实现与验收 | [AI 实施顺序](docs/ai-build-playbook.md) · [验收](docs/acceptance.md) |
| 隐私、公开材料与演示边界 | [隐私](docs/privacy.md) · [截图说明](docs/screenshots.md) |
| 价格与官方技术资料 | [成本](docs/costs.md) · [来源](docs/sources.md) |

## 使用方式

把 [AI_BUILD_PROMPT.md](AI_BUILD_PROMPT.md) 和本仓库交给你的 AI，让它先实现一个模拟适配器，再逐项接入你自己的服务器和账号。文档描述的是可以独立实现的模块、接口和验收要求，不保证生成的程序与原客户端二进制兼容。

原实例验证过 Codex、Claude Code、DeepSeek 和 Qwen 的相关接入；支持范围按各自能力区分。**Kimi 是扩展示例，尚未在原实例验收。** 订阅、API 和 CLI 登录方式不能假定互相替代。

本仓库只包含重新整理的文档、展示 HTML、展示脚本与使用合成演示数据的真实界面截图。原程序源码、APK、安装器、账号、密钥、私有地址及个人对话不在这里。截图证明界面和操作路径，不是性能或模型回答质量的基准测试。

## 本地阅读报告

```sh
python3 -m http.server 8080 --bind 127.0.0.1
```

浏览器打开本机 `http://127.0.0.1:8080`。也可以直接打开 `index.html`；下载的单文件 `lazy-doggy-offline.html` 可以独立阅读。报告不调用任何真实 Agent，也不收集访客输入。

## 许可

本仓库原创文档和展示代码采用 MIT 许可。许可不涵盖未收录的原客户端、第三方产品或商标。请使用自己的服务地址、账号和密钥搭建。
