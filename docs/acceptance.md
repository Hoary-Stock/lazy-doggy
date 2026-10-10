# 验收：证明每一步真的成立

本仓库给出重建门禁，不附原服务日志或私有验收数据。已有实现经验包括Android和Windows原生功能检查，但不能代替读者自己版本的测试。模型调用、停止真实窗口、生产部署和发布分别需要授权；大多数门禁用假Agent和合成文件即可完成。

## 1. 三层证据

| 层 | 能证明 | 不能替代 |
|---|---|---|
| 单元/协议测试 | schema、状态迁移、去重、能力gate、竞态、预算、鉴权 | 真实OS选择器、安装器、native Agent行为 |
| 隔离HTTP/WS fixture + 原生App | 真正点击、显示、持久化、上传字段、取消、恢复 | 真实模型推理、容器权限或维护效果 |
| 获授权的最小真实适配检查 | 会话恢复、实际设置、真实usage、文件边界、原生取消 | 全业务质量、未来版本兼容或所有并发容量 |

静态source review、构建成功、HTTP200和“服务active”都不足以单独宣称功能完成。每个结果写明source、测试对象、覆盖与未覆盖。

## 2. 阶段门禁

### A：服务与协议

- 未认证、过期及撤销令牌均拒绝；WS首帧失败不会读取历史，terminal票据不能授权普通API。
- 写接口拒绝额外字段、路径穿越、symlink、任意目标URL/命令；ID同名不同内容409。
- 同UUID两个并发请求只有一个provider调用；lost ack后只GET原回执；404/损坏/未知都不重POST。
- 没有WS的消息仍运行；断线/多次重连不新建回合；回复可从journal补齐且无重复。
- 在queued/taken/running/terminal各点断进程，恢复语义符合契约；running不自动重跑。
- 最后残缺journal行、磁盘不足、writer锁冲突、慢订阅者、超大历史都给明确degraded/resync。

### B：四代理适配与隔离

每个provider单独完成初始化、catalog、空会话、首prompt、关闭后恢复、审批、取消、模型选择、真实usage。未支持项标unknown/false。用一次可控上下文记忆请求证明resume实际保留内容，不能只证明连接可建。

设置门禁分别核查保存与原生观测：支持的effort、默认上下文及缩短选项、busy拒绝、resume后恢复、新连接旧occupancy清空。不要通过发大段垃圾填满窗口来“测试256K”或把接受参数当作容量已实测。

隔离用无秘密的marker文件：Agent能在共同工作区创建/改/删测试文件；无法读写其他Agent私有环境。测试目录、容器和marker均由本次验收创建，不能触碰真实项目或既有会话。

### C：真实终端窗口

使用独立scratch tmux socket与合成原生程序。专用目标可接收多行且只提交一次；以下任一条件出现时断言零输入：owner/start改变、TTY失配、shell替换、composer有字、dialog未解析、copy-mode、dead-pane、read-only、维护hold。

输入后Enter回执不当作delivery；读取native acceptance证明。dialog fingerprint过期拒绝，不多发送一轮方向键。手机终端view不能移动操作者view；read-only从服务端拒绝键盘输入。

### D：十类附件/缓存场景

1. Qwen普通文件无文字发送：仅file_ids，视觉入口无能力则关闭并说明。
2. 文件已入库而ack损坏：杀App、正常重新进入，原UUID GET恢复，只发生一次上传POST。
3. Codex文件+图混合：两类字段严格分开，回执类型正确。
4. DeepSeek混合附件：vision按当前能力；普通文件不编码为图片。
5. Claude图片lost ack后原ID读取恢复，再与文件一起发送。
6. ready但未发托盘的文件与图片：即使服务器eligible，本地引用也阻止release/cleanup。
7. 排队、运行、可重试、复用、改变的结果、新增文件及未知lease都显示保护原因。
8. 用户确认release再确认eligible cleanup，只删已验证私有副本；replacement/symlink/原地变更被保留。
9. inventory缺失或损坏：complete:false、bytes:null、清空旧选择，两个写按钮禁用且零写请求。
10. 系统文件/图片选择真正完成；已验证冗余私有副本可释放，原文档、图片与项目结果的字节摘要不变。

边界再测：25MiB与超限、240UTF-8字节文件名、chunked/spool、并发准入、满cache、旧receipt内容变化、跨scopeID、IPC乱序chunk、取消时未提交/已提交区别。不能只用假文件路径替代系统picker。

### E：八类窗口管理场景

1. 从菜单打开中立管理hub，无模型与停止请求。
2. 从Control打开同hub，行为一致。
3. Claude交互详情列表只GET；摘要和关闭独立按钮。
4. 分析器选择可见且换行；选择模型不改变清单范围。
5. 明确一次分析后四来源分组，未知Qwen/RSS保持未知，默认零勾选，unsupported不可关闭。
6. 原scan UUID GET刷新和重开，不POST重算。
7. 其他分析器仍检查同范围，建议不授予停止权。
8. 缺失来源/旧清单范围不完整，关闭预览禁止；busy与unknown不得被自动关闭。

窗口管理的原生fixture检查不停止、杀死或归档清理真实窗口。归档停止若需验收，另用本次创建的可丢弃对象，逐项核对归档readback、fresh身份、确认与恢复边界。

### F：统计、反馈、两类更新

- usage重复行和run重读不双计；全未知请求不填0；部分未知显示已知下界；窗口/日/周来源与时区一致。
- occupancy与累计Tokens分开，未观测不画满或0；无额度provider不显示余额。
- 反馈使用真实引擎截图PNG，含常见合法chunk；伪MIME、超解压预算、过长metadata拒绝。用户可检查截图，报告不公开，不触发修复执行。
- 应用更新测试：最新不变/改变、损坏hash/size、symlink、重定向、取消、登出、revocation、重启、安装器启动失败，失败不执行/不误退出。
- Agent更新测试：preview过期、确认不足、busy、丢ack原UUIDGET、unknown锁定、finished旧快照竞态、future-only范围、恢复receipt。不得调用真实升级来验证一个按钮。

## 3. 原生环境怎么安排

Android使用独立fixture包名，保留正式main入口；只允许测试origin、package与label不同，不增加绕过登录/能力/缓存的probe界面。系统选择器、权限提示和安装流程按用户真实路径操作。

Windows在干净任务目录中安装真实打包产物；检查启动、主进程/renderer隔离、文件picker、encrypted login、更新及安装器交接。源码浏览器测试不能代替Windows实际启动。

一次只能有一位负责人驱动同一设备。loopback fixture不转发生产；合成登录和会话不得放入真实密码。独立统计HTTP方法/route、WS帧类型和操作UUID，默认不记录授权值或完整消息正文。

失败先保留XML/截图、fixture计数、原UUID和状态，再判断产品、驱动、fixture依赖或环境问题。导航修正不能跳过功能断言；已有上传不能为了“重跑更整齐”再次POST。App修复后重建新产物，install-r保留原草稿和receipt继续测试，跨构建覆盖必须明确披露。

VM资源不足先测memory、PID/thread/cgroup及进程身份；不要靠泛kill/restart清掉证据。必要修复只作用于本次拥有的测试环境、单独授权和记录，不动其他任务。

## 4. 构建与发布门禁

```sh
# 新工程的示例命令；按实际依赖补齐
python -m pytest server/tests -q
dart format --output=none --set-exit-if-changed lib test
flutter analyze
flutter test
flutter build apk --release
```

Windows执行其renderer/main/gateway测试，再进行Windows打包和原生门禁。不因时间不足绕过当前发布说明中的必需检查；也不为未改的模块无限扩大可选测试。

正式产物记录source commit、逐文件source摘要、version/platform、byte count、SHA-256、签名证书及允许的fixture差异。唯一正式包安装后确认版本与正常未登录页，不能用fixture截图证明正式包已安装。

私有最终receipt至少有：`acceptance_state,passed,cases,source,artifacts,request_counts,failed_attempts,coverage_limits,formal_restore`。若有跨构建或多次续测，列出每段覆盖，不能宣称一次无失败的完整运行。公开材料只引用经过脱敏的总结，不上传真实receipt、运行标识、日志或私有截图。

最后才执行获授权的部署与发布：精确scope、可回退、排空后替换、health与protected身份复查、下载字节校验。服务器活跃版本、客户端可下载版本、用户已安装版本分别记录；发布文件存在不等于用户已经安装。
