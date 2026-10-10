<!-- SPDX-License-Identifier: CC-BY-NC-4.0 -->
# Lazy Doggy 第二版 · 手机许愿，服务器动手

这版用四个小故事讲“从手机安排服务器做事”可以怎么扩展：做一个打卡 APP、给学习卡加功能并在应用内更新、搭一个个人学习网页、安排回测并从手机看图表网页。

**[打开第二版](https://hoary-stock.github.io/lazy-doggy/v2/)** · [回第一版](../index.html) · [示例任务书](docs/example-tasks.md) · [实施与验收](docs/implementation-checklist.md)

## 怎么看

选一个例子，可以播放、暂停、按步看，或拖动进度。手机回复、构建、测试和发布状态一起变化。每段十步，默认不自动播放。

页面里的“模拟下载 APK”“模拟点应用内更新”“模拟打开网页”“模拟查看图表网页”，只在页面内显示说明。**不下载文件、不安装应用、不访问真实网站，也不向模型、数据 API 或业务服务器发请求。** “模拟断线后查原回执”同样只是本地教学，强调失去确认后先读原请求，不重放写操作。

第四例的互动图表在第七步才出现，倒退会重置显示状态；它只有十二个预设的无单位合成数值，不计算策略、不给收益结论。旁边的小动图单独说明完整链路，默认是静态 SVG，用户点“播放动图”才加载本地 GIF，点“停止动图”回到静态图；不宣称停在原帧。

关闭 JavaScript 后，仍可阅读四例摘要、任务书、实施文档和作者声明。无需账号、Key 或额外依赖。

## 这版的范围

- 第一版的全部已有文件、页面与下载包保持原样，第二版只新增在 `v2/`。
- 所有愿望、版本、回执和结果均为合成数据，没有真实项目、个人资料或测试产物。
- 回测例子只用泛化的均线交叉思路和受控数据接口引用，没有真实标的、参数建议或账户。接口凭据应经安全配置传入，不写进聊天、页面或报告；费用、滑点、时间切分和未来数据边界是待实际验证的要求。
- 原框架已有远程控制、反馈和应用更新等模块；**端到端造 APP、自动修复、自动发布 worker 不因这个演示而成为已验收功能**，须自己实现和测试。
- APK 在隔离 Linux 构建环境编译。Android 模拟器负责安装、运行与测试；实际要核验宿主机、虚拟化加速与资源条件，可选合适的独立宿主机或真机，不承诺虚拟 Linux 内嵌套加速普遍可行。
- 应用内更新省去手动找下载链接；**仍会下载 APK，通常须 Android 系统确认安装**。应用身份、签名关系、递增版本和旧数据迁移须实际验证。
- 新搭建优先 Tmux，再加 Windows；Android Remote 可选。模型可按实际能力适配，不限 GPT；邮件、网盘、推送只是后续方向。

## 文件

| 文件 | 用途 |
|---|---|
| [index.html](index.html) | 四例互动报告、作者声明和官方资料 |
| [assets/v2.css](assets/v2.css) | 第二版布局与移动样式，复用第一版基础样式 |
| [assets/scenarios.js](assets/scenarios.js) | 四例十步合成教学数据 |
| [assets/v2.js](assets/v2.js) | 纯浏览器内播放、切换、进度和模拟动作 |
| [assets/backtest-flow.svg](assets/backtest-flow.svg) | 原创新合成的流程静态图，默认显示 |
| [assets/backtest-flow.gif](assets/backtest-flow.gif) | 原创新合成的教学动图，用户自主播放与停止，无真实回测结果 |
| [docs/example-tasks.md](docs/example-tasks.md) | 可交给自己的 AI 的示例任务书 |
| [docs/implementation-checklist.md](docs/implementation-checklist.md) | 权限、构建、测试、更新、发布与恢复门禁 |

第二版需要和仓库一起阅读，因为使用 `../assets/showcase.css` 并链接第一版文档；没有另外制作第二版单文件或 ZIP。直接打开 `v2/index.html` 或通过本地静态服务浏览均可。

## 安全和许可

这是框架和教学材料，不是可直接投入生产的部署包。人机验证不代替登录和授权，防火墙也不保证应用安全。部署者应结合实际用途完善权限、撤销、隔离、备份与恢复，必要时请专业人员审核。

数据集中在服务器，存储故障可能影响多个项目。客户端缓存不是完整备份，应准备独立位置、加密、带版本的备份并验证恢复。[备份与恢复](../docs/backup-recovery.md)

第二版新增的 JavaScript、CSS 等代码适用 PolyForm Noncommercial 1.0.0；新增原创文档与可许可演示内容适用 CC BY-NC 4.0，混合 HTML 依各自内容类型适用许可。在法律允许范围内按现状提供、限制作者责任；第三方各有许可。旧 MIT 已授予权利保留，完整历史适用范围以[中文说明](../docs/licensing.md)为准，不因第二版缩减旧权利。详见 [LICENSE](../LICENSE)及仓库随附标准原文。

Required Notice: Copyright (c) 2026 Lazy Doggy contributors (https://github.com/Hoary-Stock/lazy-doggy)
