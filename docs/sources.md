# 官方资料与证据边界

价格最后核查：2026-10-10。技术文档会更新，请搭建前再确认其当前版本。本仓库的接口是复建设计约定，不宣称是各厂商原生协议。

| 标记 | 官方资料 | 支持的内容 |
|---|---|---|
| C1 | [AWS Lightsail 价格](https://aws.amazon.com/lightsail/pricing/) | 含公有 IPv4 的 Linux/Unix 2/4/8 GB 月费示例 |
| C2 | [Porkbun 域名价格表](https://porkbun.com/products/domains) | 普通 .com 注册/续费价格；不包含溢价域名 |
| C3 | [Let's Encrypt 开始指南](https://letsencrypt.org/getting-started/) | 免费自动化证书与 ACME 客户端配置 |
| T1 | [tmux 手册](https://man.openbsd.org/tmux) | server/session/window/pane 生命周期 |
| T2 | [Flutter 文档](https://docs.flutter.dev/) | Android 客户端实现与构建参考 |
| T3 | [Electron 更新文档](https://www.electronjs.org/docs/latest/tutorial/updates) | Windows 更新能力和平台差异；本蓝图仍定义独立受信来源及摘要检查 |
| T4 | [systemd.service](https://www.freedesktop.org/software/systemd/man/latest/systemd.service.html) · [systemd.kill](https://www.freedesktop.org/software/systemd/man/latest/systemd.kill.html) · [官方上游手册源](https://raw.githubusercontent.com/systemd/systemd/main/man/systemd.kill.xml) | 服务管理与 KillMode 语义；网页版抓取受限时已核对上游手册源，保留会话还需真实进程身份验收 |
| T5 | [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages) | 从公开仓库托管静态 HTML；不是 Agent 后端 |

## 展示证据

本仓库原生截图来自测试设备或虚拟机中的真实界面，使用合成演示数据。截图与能力覆盖见 [截图说明](screenshots.md)。原实例的私有原始记录未发布；不要求读者访问私有站点来完成复建。

原实例已验证的路径、蓝图要求、新适配器扩展示例、流程示意和教学预算分别标记。页面中的交互不会触发真实模型调用、反馈提交或客户端更新；不得把交互示意当作实际服务端执行证据。

## 许可与数据保护资料

| 标记 | 官方资料 | 支持的内容 |
|---|---|---|
| L1 | [PolyForm Noncommercial 1.0.0](https://polyformproject.org/licenses/noncommercial/1.0.0) | 软件的非商用用途、通知与法律允许范围内的责任限制 |
| L2 | [CC BY-NC 4.0 正文](https://creativecommons.org/licenses/by-nc/4.0/legalcode.en) · [CC FAQ](https://creativecommons.org/faq/) | 原创内容的非商用、署名与第 5 节责任限制；软件另选软件许可 |
| S1 | [CISA 指南](https://www.cisa.gov/stopransomware/ransomware-guide) | 离线加密备份与恢复验证；抓取网页版受限时核对官网索引摘要，不将该来源当作本项目已做恢复验收的证据 |
| S2 | [SQLite Backup API](https://www.sqlite.org/backup.html) | 正在运行数据库的一致性备份机制 |

网络软件的官方文档、源码和许可见[网络链路](network-path.md)；AI 模型许可差异、OSI 定义与旧 MIT 版本见[许可说明](licensing.md)。
