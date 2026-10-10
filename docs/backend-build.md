# 分模块构建：先证明状态，再接真实 Agent

以下是新实现的建议布局与顺序，使用相对目录，不对应任何现有服务器。建议 Python/FastAPI 后端、Flutter Android 客户端、Electron Windows 客户端；也可换工具链，但必须保留 [契约](contracts.md)与 [验收](acceptance.md)中的行为。

## 1. 建立工程骨架

```text
project/
  server/
    auth/             访问会话、限流、撤销
    sessions/         runner、队列、会话ID映射
    events/           journal、分页、replay
    windows/          原生清单、身份验证、受限broker
    adapters/         具体Agent的协议翻译
    attachments/      流式上传、回执、lease、缓存
    control/          检查、维护、发布元数据、反馈
    tests/            合成协议及独立临时数据
  mobile-terminal/    Flutter终端客户端
  mobile-session/     Flutter会话客户端
  windows-client/     Electron主进程、preload、渲染层
  schemas/            OpenAPI与共享JSON Schema
  acceptance/         本机fixture与原生驱动
```

运行配置与凭据放在仓库之外。提供只有键名和说明的 example；禁止把真实设置、登录缓存、签名钥匙、运行日志或用户数据复制成测试样本。客户端保存应用访问凭据，模型凭据仅由相应服务器身份读取。

## 2. 后端模块依赖与交付条件

| 顺序 | 模块与主要工作 | 进入下一步前证明 |
|---|---|---|
| A | 鉴权、撤销、有限错误格式、只读能力目录 | 未鉴权和已撤销请求不能读取或写入用户数据 |
| B | SQLite或等价事务存储；唯一去重键、操作摘要、writer锁 | 两次并发同UUID只产生一个接收记录；损坏不覆盖 |
| C | 假provider及每会话独占runner | 无WS照样执行；断线不取消；重连不产生第二回合 |
| D | 事件journal、seq、历史分页、WS订阅 | WS与HTTP补读不重复；断尾只损失最后不完整记录 |
| E | tmux inventory与broker | 所有写只到专用目标；身份改变后零键输入 |
| F | 第一个真实适配器，再逐一增加 | 初始化、首回合、恢复、取消、审批、用量逐项可证 |
| G | 类型化附件、上传回执、lease、缓存 | 丢ack只读恢复；未知引用或变更副本无法回收 |
| H | 统计、窗口管理、反馈与两类更新 | 每个写操作都有独立授权/确认和持久回执 |
| I | 已选择的客户端与打包 | 原生环境门禁通过；正式/fixture字节对应可复核 |

SQLite操作使用事务和唯一约束；文件持久化使用同目录临时文件、fsync、原子替换及目录fsync。别在async循环里同步全量扫描或哈希大文件，放到有界线程任务。多worker不能各自领取同一队列；最小版可用一个writer进程，失败时健康报告degraded并拒绝写入，不靠反复崩溃争锁。

## 3. runner、队列与恢复

runner由provider+逻辑session唯一定位，持有Agent连接、正在运行的turn、审批、输入队列和事件订阅。网络连接只是订阅者；关闭聊天页面不停止任务。每次派发前在锁内复查取消、维护hold、能力、附件lease和原生writer所有权。

回合中补充消息：只有适配器确认支持steer时，带exact turn ID交给当前回合；模型/effort切换一般从下一回合生效，界面说明。如果不支持，进入明确服务器队列。别把不同socket看到的“空闲”当成当前会话空闲。

重启恢复依据持久epoch和交付证据，不靠文件年龄猜测。未交付可恢复排队；已执行但结果不明保留unknown，不自动执行。历史分页与journal保留有预算；过旧游标返回明确resync，不重新编号伪装成同一日志。任何不完整计数或用量都带complete/source。

FastAPI支持WebSocket及依赖式认证；它的示例不替你实现持久队列、独占runner或多进程replay，这些是本蓝图要求补上的应用逻辑。[FastAPI WebSocket文档](https://fastapi.tiangolo.com/advanced/websockets/)

## 4. tmux与权限helper

把所有tmux argv集中到一个模块，强制专用socket、固定子命令和目标ID，shell=False；文本经stdin进入临时buffer，完成后释放buffer。多行消息采用已验证的bracketed paste，一次确认，不逐行模拟输入。发送前及确认键前都检查UID、进程start身份、TTY与foreground组、pane/window世代、composer为空、没有dialog/copy-mode/dead-pane。

broker运行在对应Agent身份下，外层应用不能读取其home。跨身份连接验证peer凭据，仅接受固定op及严格有界JSON；拒绝命令、URL、路径、任意环境变量、端口或服务名。危险维护单独helper，应用进程保持no-new-privileges。授予广泛sudo或Docker控制权来“方便更新”会打破该边界。

终端观看用独立view，不能把手机选择窗口传给操作者的当前窗口；只读在服务端丢弃输入。票据短期、限定窗口和模式，并有原子一次消费。回答dialog必须绑定当前问题fingerprint，选项来自原生available decisions，不允许任意政策字符串。

## 5. 附件与存储分析

四类资源分别预算：请求/spool、客户端暂存、服务端私有cache、共同项目副本。25MiB普通文件不能整包base64塞进旧小IPC；采用start/chunk/commit，限制chunk大小、顺序、累计字节及最终SHA。服务端先鉴权再解析，限制chunked body而非只看Content-Length。

建立UUID上传回执、内容摘要、类型、来源scope，以及草稿/队列/执行/复用引用。入队前取得lease；队列持久化后再完成交接。真实worker结束释放执行lease，但用户复用hold仍保留。缺失inventory、legacy记录不完整或引用损坏全部保护。

缓存回收持Store锁：fresh eligible检查→原子移动到随机私有quarantine→再次核验同inode、类型、大小、mtime及摘要→仅删除该quarantine。变更或中断保留、计入预算；恢复不得覆盖后来生成的新叶子。共同工作区复制链逐组件no-follow，校验真实SHA和大小；不扫描/递归删除任意项目。

## 6. Android客户端

先实现 Tmux 终端入口；Android Remote 是可选项。选择 Remote 时共享API、typed events、持久outbox、游标和能力组件，并保留不同导航：终端App围绕已有窗口，会话App围绕对话runner。Agent选择使用2×2、自适应换行或横向滚动；第五个provider也应可见。等待、blocked、unknown、可重试、仅本地保存、服务器排队用不同标签。

附件通过系统选择器取得，普通文件复制到应用私有暂存，先算SHA并保存UUID再上传。原图片/文档不删除。成功回执后，只释放确认为插件创建且无本地引用的冗余副本。预算检查要考虑Android同一应用缓存的系统别名，不能放松未知目录或符号链接边界。Android的系统文件选择通过Storage Access Framework授权访问文档，不能假定所有返回值都是任意可读主机路径。[Android文件访问文档](https://developer.android.com/training/data-storage/shared/documents-files)

大历史使用lazy列表及有界页，流式item原地合并；长工具输出折叠。应用回前台恢复只读状态；语音识别采用短段重启、语言实际能力检查和显式用户开关。keep-alive只在有欠交付任务时保持，尊重用户停止及Android拒绝状态，不把background freeze误报为前台卡死。

## 7. Windows客户端

Electron主进程持有鉴权、文件选择、上传、WS与更新下载；renderer只接收安全展示字段和窄IPC。启用contextIsolation、sandbox，关闭nodeIntegration，不加载任意远端页面，不提供通用exec/readFile/fetch桥，校验IPC调用来源和参数。[Electron安全清单](https://www.electronjs.org/docs/latest/tutorial/security)

记住登录时采用操作系统保护的凭据存储；不可用时让用户选择不保存，不降级明文。Windows上的Electron safeStorage使用系统保护机制，仍不能替代应用自己的授权和IPC限制。[Electron safeStorage](https://www.electronjs.org/docs/latest/api/safe-storage)

文件选择之后由主进程制作有界私有副本，renderer不提供真实路径。每次上传有一次POST及原UUID读取恢复。更新是专用IPC流程：检查→下载进度/取消→verified→用户确认→重核发布和字节→启动固定安装器。安装器尚未可靠启动不得退出客户端；成功交接的安装器副本不能因旧App退出而被清理。

## 8. 手机Bug提交与开发闭环

入口容易找到但不遮住composer和确认按钮。先展示截图与说明供用户确认；提交最多有界PNG、短说明、App/OS版本、路由标签和有限breadcrumbs。截图可能包含隐私，文字redaction不能抹除截图内容，应提供遮挡/重拍并提示用户检查。普通日志默认只记operation ID、状态、长度与错误码，不保存对话或凭据。

服务器验证PNG结构、CRC、像素及解压预算，原子保存到不公开的报告存储，并限制频率、总量和保留策略。冻结/崩溃记录去掉敏感值，下一次正常登录后再提交。

开发者把经过筛选的报告交给获授权AI，在独立分支复现、修复、测试、审核、发布；**手机提交不会自动保证修好Bug，也不默认给AI生产权限**。可回传受理编号和进度，但不能在报告POST中直接运行任意修复命令。

## 9. TLS、部署与升级

反向代理显式支持WS Upgrade、长连接超时和非缓存用户数据响应；上传限制覆盖实际最大body及解析开销。路径或HTTP/HTTPS配置不一致会造成“某些接口突然坏了”。WebSocket代理需要正确转发Upgrade/Connection。[nginx官方说明](https://nginx.org/en/docs/http/websocket.html)

生产升级先限制新写入，再确认所有已接收输入和短worker排空，未知即等待/拒绝；单次“active=0”不是drain。记录并复查受保护原生窗口、进程世代和服务身份。只替换本次目标组件，保留Agent会话、输入文件和队列；撤销自己建立的临时限制。不要把一份特定服务器的防火墙脚本复制为通用安装步骤。

Android签名钥匙预先确定、保存在仓库之外，后续APK使用同证书且versionCode增加。[Flutter Android发布指南](https://docs.flutter.dev/deployment/android) Windows保留稳定App身份、安装范围和卸载/升级路径；长期分发还应规划代码签名。发布唯一版本、验证下载字节与构建产物一致，禁止覆写旧版本掩盖证据。

## 可直接交给实现AI的任务

> 使用本仓库的contracts作为目标，先提交目录设计、JSON Schema、SQLite迁移、假provider和离线测试。证明一个逻辑UUID只执行一次、WS断线后runner继续、unknown不重跑，再接真实provider。逐项完成附件、Token、窗口权限、反馈与更新模块。只在独立fixture中进行原生验收；模型调用、生产部署、停止窗口和发布分别等明确授权。每个阶段提交可复核差异和失败记录。
