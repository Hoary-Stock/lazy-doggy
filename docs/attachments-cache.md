# 图片、普通文件与缓存

附件传输与缓存属于应用自己的受控空间。手机和电脑的原文件、项目输入、Agent 生成结果以及无法核验的副本都不能纳入普通缓存删除。

本文的通道限额和 raw / multipart 两套字段描述**原实例行为**。重建一个新系统时，以 [v1 契约](contracts.md)作为唯一对外接口；既有通道仅作为适配器的设计参考，不要求实现两套同名 API，也不保证原客户端可直接连接。

## 类型与限额

| 项目 | 当前实现 |
| --- | --- |
| 普通文件 | 每个最多 25 MiB |
| 含文件或混合消息 | 最多 8 个附件，总量最多 100 MiB |
| Tmux / PC 图片通道 | 既有每张 900 KiB；纯图片消息最多 16 张 |
| Remote 图片上传通道 | 既有每张 15 MiB；纯图片消息保留最多 16 张及总量约束 |
| 托管服务端私有缓存 | 最多 1 GiB；Tmux 分为四个 256 MiB provider 分区 |

这是上传通道限额；相册选择后缩图的原图上限、插件缓存额度和服务端上传大小是不同约束。DeepSeek 的图片通道还须遵守其适配器的单回合大小及实时视觉能力。Qwen 当前不支持原生视觉，界面禁用图片入口；作为普通文件引用图片格式文件也不表示模型可以看图。

## 上传状态机

`准备私有快照 → 保存原 request_id 与 SHA-256 → 上传一次 → 核验回执 → 可用于消息`

ack 丢失时进入 `unconfirmed`，保留同一 request_id，只查询原回执。不存在、暂未找到、盘点失败不是重新上传的许可。已提交、明确中止和未知状态必须区分。重启应用不会自动重复 POST。

### 原实例：Tmux 与 PC

- 文件：raw `application/octet-stream`，文件名使用百分号编码的 UTF-8 basename，最多 240 UTF-8 字节。
- 图片：raw 已支持的图片 MIME，验证内容后保持原上传字节。
- 客户端保存一个 32 位小写十六进制 `request_id`；请求用封闭的文件名和请求编号头传递。
- 回执包含不透明 `file_id` 或 `image_id`、`request_id, filename, size_bytes, sha256, media_type, held, in_use, available`。
- GET 原窗口的文件 / 图片清单，返回 `items, uploads, complete`；上传记录状态为 `pending / committed / aborted`。

### 原实例：Remote Agent

- 使用 multipart `file` 与 `request_id`。
- 回执包含 `upload_id, request_id, kind, name, size, mime, sha256, reusable`。
- 通过 provider 与原 request_id 查询，不使用返回值猜测主机路径。

### 重建 v1 的统一映射

新实现使用 `POST /v1/uploads/{file|image}` 和 `GET /v1/uploads/receipts/{uuid}`。默认采用流式 raw；选择 multipart 时必须在入口限制认证与全请求体大小，仍返回同一 DTO。

| v1 回执字段 | Tmux / PC 参考字段 | Remote 参考字段 |
| --- | --- | --- |
| `id` | `file_id` 或 `image_id` | `upload_id` |
| `name` | `filename` | `name` |
| `bytes` | `size_bytes` | `size` |
| `mime` | `media_type` | `mime` |
| `reusable` | `held` | `reusable` |

`request_id, kind, sha256, state, available` 按 v1 定义统一；参考接口没有直接给出的字段由服务端从持久状态验证，不由客户端猜测。上传回执状态始终为 `pending / committed / aborted`；上传 UI 的 `unconfirmed` 是客户端尚未获知结果，不是服务端确认中止。

消息始终区分 `file_ids` 与 `image_ids`；普通文件不执行、不解压，也不塞进原生图片 block。权限边界内的大文件采用有上限的块传输，验证严格块序号及最终 SHA，避免巨型 base64 IPC。

## Agent 可读副本

私有上传目录并不必然能被另一个运行身份或容器读取。后端只能把已核验附件复制到预先授权工作区中的受控命名空间，例如 `managed-inputs/<client>/<opaque-id>/`；示例路径由部署者定义，客户端不能指定目的地。

复制时检查工作区身份、祖先与叶子的 no-follow、字节数、SHA、类型及访问权限。保留跨身份读取所需的最小权限与已有 ACL，不增加全局用户组或任意主机挂载。共享副本可能被项目继续使用，当前实现将其保留在私有 GC 之外；不能承诺共享区占用也被 1 GiB 私有额度覆盖。

## 保留、释放、清理

| 状态 | 允许删除？ |
| --- | --- |
| 尚未确认的上传或消息 | 否 |
| 手机 / PC 的待发草稿、outbox、可重发消息 | 否 |
| queued、taken、运行中或重试引用 | 否 |
| 可复用保留、活动输入 lease | 否 |
| 盘点不完整、记录损坏、旧引用不明 | 否 |
| 文件改变或出现可能的 Agent 结果 | 否 |
| 明确释放，完整盘点证明无引用，私有字节未变 | 可清理 |

“从草稿移除”与“释放复用保留”是不同操作。释放 hold 也不会取消活动 lease。窗口关闭后，应按已存的窗口身份、代次和进程起点验证引用结束；失效或缺失记录仍保留，不以时间、CLI `DONE` 或成功交接猜测 AI 已用完。

缓存页展示已用、限额、保留 / 可清理数量、原因及盘点完整性。释放与清理分别确认，客户端在操作前重新检查本地草稿与 outbox。空间不足只处理已经符合清理条件的少量条目；仍不足则拒绝新增，不驱逐保护项。

新 v1 使用 `GET /v1/cache`，以及两个独立 POST `/v1/cache/release`、`/v1/cache/cleanup`；写入包含 `request_id, ids, confirmed:true`。清单字段使用 `bytes, reusable, in_use, queue_refs, eligible, protected_reason`。原实例的 `held`、清理 `{}` 或按 provider 分开的接口不能直接混入这套新合同。

私有 GC 在持有锁时有界读取、比较前后 FD 身份，将候选原子移动至私有隔离名，再核验 inode、时间、大小及 SHA 后删除。发现替换则保留，恢复不能覆盖新文件。中断或未知隔离文件计入占用并受到保护。不得递归删除项目目录。

## 手机和电脑暂存

核验回执且没有本地引用后，可以清理明确归本应用所有的传输副本。Remote 对已验证的新插件副本有专门回收；未知旧副本继续保留。Tmux 的图片草稿清除不等于所有 picker 文件都已删除。PC renderer 只接收不透明编号、名字和进度，主进程持有私有快照。所有端都保留原文档和照片。

验收应使用自己的合成文件：取消选择器零上传、原 UUID 失联后不重放、混合消息只发送一次、草稿及 lease 阻止删除、明确释放后仅清理 eligible 项，并再次比较原文件摘要。
