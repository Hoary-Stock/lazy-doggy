# Lazy Doggy · 公开复建蓝图

**躺在床上，也能安排 AI 干活。**

离开电脑后，从手机继续给服务器上的 Agent 补充要求、看结果、传文件；在 Windows 上使用同一套服务。客户端自身出现 Bug 或想到新功能时，在手机里提出，让有授权的远程 Agent 修代码、验证和构建，发布后在应用内升级。反馈接收和应用更新已有验收；一键全自动修复流水线须另行接通和验证。

**[打开中文互动报告](https://hoary-stock.github.io/lazy-doggy/)** · [从这里开始搭建](docs/quickstart.md) · [交给你的 AI 的任务书](AI_BUILD_PROMPT.md) · [成本与边界](docs/costs.md) · [非商用许可](docs/licensing.md)

## 四个互动小故事

场景、成品界面、四个互动例子、架构、成本与搭建说明，全部放在同一份报告里。原来的报告网址和 GitHub 地址继续使用。

| 手机说什么 | 服务器安排什么 | 手机看到什么 |
|---|---|---|
| 做一个简单打卡 APP | 隔离开发、Linux 构建、Android 测试、验收后发布 | APK 下载入口 |
| 学习卡加收藏功能 | 开发新版、测试旧数据迁移、发布更新信息 | 在 APP 内发起更新与系统安装确认 |
| 搭一个自己的网页 | 制作受控预览、浏览器测试、授权部署 | 可以打开的网页 |
| 跑一段回测并看图 | 引用受控数据接口、隔离计算、核验、授权发布 | 图表网页 |

四个例子可以播放、暂停、按步看或拖动；回测另有可播放与停止的 GIF。**全部使用合成教学数据，不实际创建 APK、调用数据 API、回测或部署；动画不是完整自动流水线的验收证明。** 应用内更新仍下载 APK，通常由 Android 系统确认安装。

[四例任务书](docs/example-tasks.md) · [扩展实施与验收](docs/implementation-checklist.md)

## 可以做什么

| 入口 | 适合的场景 | 展示实例 |
|---|---|---|
| Android Tmux 客户端 | 看已有窗口、继续对话、切换 Agent、传文件 | 0.1.65 |
| Android Remote 客户端 | 结构化会话、用量、相关控制和窗口检查 | 3.29.0 |
| Windows 客户端 | 在电脑上使用同一服务、检查应用和 Agent 更新 | 0.3.0 |

上表版本号对应原实例的展示界面；本公开仓库不提供这些版本的二进制。

**新搭建推荐：先 Tmux，再 Windows；Android Remote 可以跳过。** Android Remote 是作者最初的探索路线，起初没有程序开发背景，在设计上绕过一些弯路；按作者目前的使用体验，Tmux 更适合作为日常窗口控制入口。Remote 已积累了较多会话、统计与管理功能，作者又希望 Tmux 保持精简，因此个人仍将两款手机应用并用。这是作者的取舍，不是性能基准结论。

图片与普通文件附件、横向筛选标签、上下文与思考控制、真实 Token 统计、手机问题反馈、应用内更新、受保护的缓存清理，分别在报告和模块文档里标注。

## 需要准备什么

- 一台常开的 Linux 服务器、一个你自己的域名，以及 HTTPS。
- 你有权使用的 Agent CLI、模型订阅或 API；这些费用和服务器费用分开。
- 现有 Android 手机或 Windows 电脑。自托管大模型才另外考虑 GPU。

服务器配置取决于实际运行的 CLI、窗口数和隔离方式；一台服务器并不意味着最低配置可以运行任意多的 Agent。[完整预算](docs/costs.md)给出可复算的官网价格示例。

模型请求由服务器发出，手机只与自己的服务器通信；手机短暂断网时，已接受的任务可继续运行。手机仍需能连到服务器，服务器也需能访问上游；不承诺任何网络或地区都一定可用。详见[网络链路](docs/network-path.md)。

**数据集中也是风险集中。** 硬盘或存储故障、误删可能同时损失多个项目的数据。跨项目调用和容器隔离不会替代备份。准备独立位置、加密、带版本的备份，并实际验证恢复；客户端不是服务器数据的完整副本。[备份与恢复](docs/backup-recovery.md)

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
| 手机到服务器的动态示例 | [演示场景](docs/demo-scenarios.md) |
| 网络、远程访问与模块阅读顺序 | [网络链路](docs/network-path.md) · [仓库地图](docs/repository-map.md) |
| 简化白板示例与部署前修理 | [白板示例](docs/whiteboard-example.md) |
| 数据集中存储的风险与恢复 | [备份与恢复](docs/backup-recovery.md) |
| 非商用、作者责任与历史版本 | [许可说明](docs/licensing.md) |
| 价格与官方技术资料 | [成本](docs/costs.md) · [来源](docs/sources.md) |

## 使用方式

白板示例：[在线外观预览](https://hoary-stock.github.io/lazy-doggy/examples/whiteboard/index.html) · [本机模拟启动说明](examples/whiteboard/README.md)。在线页面不连接后端；示例不能直接部署。

把 [AI_BUILD_PROMPT.md](AI_BUILD_PROMPT.md) 和本仓库交给你的 AI，让它先实现一个模拟适配器，再逐项接入你自己的服务器和账号。文档描述的是可以独立实现的模块、接口和验收要求，不保证生成的程序与原客户端二进制兼容。

原实例验证过 Codex、Claude Code、DeepSeek 和 Qwen 的相关接入；支持范围按各自能力区分。**Kimi 是扩展示例，尚未在原实例验收。** 订阅、API 和 CLI 登录方式不能假定互相替代。

本仓库包含重新整理的文档、互动 HTML、脚本生成的教学视频、使用合成数据的真实界面截图，以及独立重写的最小白板 mock 示例。白板仅供学习，必须让自己的 AI 检查、修理并补全后再考虑部署。原程序源码、APK、安装器、账号、密钥、私有地址及个人对话不在这里。截图证明界面和操作路径，不是性能或模型回答质量的基准测试。

## 本地阅读报告

```sh
python3 -m http.server 8080 --bind 127.0.0.1
```

浏览器打开本机 `http://127.0.0.1:8080`。也可以直接打开 `index.html`；`lazy-doggy-offline.html` 是同步更新的单文件阅读版，`lazy-doggy-blueprint.zip` 包含完整报告、文档与演示资源。报告不调用任何真实 Agent，也不收集访客输入。

## 许可

本次起，代码采用 **PolyForm Noncommercial 1.0.0**，原创文档与可许可演示内容采用 **CC BY-NC 4.0**。未经单独授权不得超出许可范围商用；仅在法律允许范围内按现状提供、限制作者责任。两份完整原文随仓库和 ZIP 收录，详见 [LICENSE](LICENSE) 与[中文说明](docs/licensing.md)。此前 MIT 版本的既有授权保留；本次修改不能追溯撤销。第三方与未公开原产品不由本仓库授权。
