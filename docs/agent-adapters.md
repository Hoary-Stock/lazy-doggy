# Agent适配器：接入模型不等于完成Agent接入

一个聊天API可以生成文字；一个可用的远程Agent还需要工作区、工具权限、会话恢复、审批、取消、事件和真实用量。两者采用不同适配层，客户端始终读取能力目录，不猜测厂商间的功能等价性。

## 1. 实现边界

| Provider | 重建入口 | 需要验证 | 状态说明 |
|---|---|---|---|
| GPT / Codex | Codex原生App Server；或另写API驱动Agent | thread/turn、writer冲突、审批、模型目录、usage | 蓝图有既有实现经验；重建仍须逐项验证 |
| Claude | Claude Code结构化CLI/SDK及独立终端适配 | 流式事件、恢复、交互限制、真实完成 | 有既有实现经验；不把headless视为完整TUI |
| DeepSeek | 模型API加受控Agent harness；兼容实现可使用ACP | model/config、取消、vision、历史覆盖、用量 | 有既有实现经验；不声称所有harness都兼容 |
| Qwen | Qwen Code+经验证推理端点，可使用ACP | 空会话生命周期、思考档位、上下文、原生usage | 有既有实现经验；能力与端点绑定 |
| Kimi | 预留Kimi CLI/模型API适配插件 | 下述第五代理门禁全部完成 | **设计扩展，未在本系统实现或验收** |

“有既有实现经验”只解释设计来源，不保证读者安装的最新版本仍具有相同行为，也不代表本仓库包含运行中的服务。

## 2. 两层接口

```text
ModelTransport:
  models() / complete() / stream() / request_usage()

AgentAdapter:
  capabilities() / model_catalog()
  create_logical_session() / resume_native_session()
  run_turn() / steer_if_supported() / interrupt_turn()
  respond_approval() / history_page() / session_usage()

WindowAdapter:
  inventory() / verify_identity()
  inspect_composer_and_dialog() / submit_once()
  read_delivery_evidence() / view_terminal()
```

所有方法有超时、取消和输入/输出上限。handler不执行任意主机命令；固定launcher、工作区授权及credential scope由服务端配置。新provider必须独立拒绝未知模型/能力，不借用另一provider的统计、默认凭据或窗口。

## 3. GPT / Codex

先初始化原生连接，再建立/恢复thread并开始turn。App Server提供turn/start、turn/steer与turn/interrupt；steer绑定expectedTurnId，不接受把正在运行的回合模型任意替换。[OpenAI App Server官方文档](https://learn.chatgpt.com/docs/app-server)

将text、reasoning、plan、command、file change、approval和usage转换成统一事件。按item_id合并delta，completed要补齐整条内容，不能用原生空completed覆盖客户端已有文字。不要为每个手机重连新建thread；持久逻辑会话映射归runner所有。

一个thread存在外部writer时明确read-only/conflict，不自动takeover或重启共享服务。展示当前运行artifact和未来新实例artifact的区别；“安装版本已更新”不意味着所有已加载原生进程已更新。账户额度读取和服务器Tokens各自有独立source，查看额度不能切账户或消耗额外权益。

## 4. Claude

结构化非交互CLI可提供JSON/stream-json和会话恢复。其流式输出与TUI的交互、permission和退出语义有差异，按所选版本实际验证，不能把进程退出码当作模型完成。[Claude Code程序化运行文档](https://code.claude.com/docs/en/headless)

输入通过固定argv和stdin，不拼shell命令。非交互不能承载的审批/问题明确引导原生终端，不虚构可点击答案。原生CLI已有交互owner时，验证fresh PID/start/TTY及状态；未知或多writer不同时打开第二个写入者。任何强制接管保持独立确认，检查页不执行接管。

原生记录可能按同一assistant message重复写多个内容块；用message ID和真实请求标识去重usage。订阅用户的API等价成本只是估算，不能当作账单；未知价目或未覆盖模型保留不完整标记。

## 5. DeepSeek与ACP

DeepSeek模型API支持OpenAI兼容格式，但该格式本身不提供文件权限、终端窗口和持久Agent会话。[DeepSeek官方API入门](https://api-docs.deepseek.com/) 选择harness后，记录其实际能力、版本、恢复方式、history边界及参数映射；未验证时隐藏effort、vision或Agent updater入口。

ACP可用于客户端与Agent的会话初始化、提示与事件交换；session加载/恢复必须按原生公布的能力协商，不能假定所有实现都提供相同扩展方法。[ACP会话协议](https://agentclientprotocol.com/protocol/v1/session-setup)

每个Agent独立身份启动自己的bridge；协议翻译只改经验证的字段，不转发任意命令。某些实现没有历史replay：UI明确提示当前日志覆盖范围，不能展示空白却声称完整。发送图片只有原生initialize/catalog确认vision且当前窗口能力匹配才允许；普通文件用受控可读路径的text引用。

## 6. Qwen：API链路、生命周期与设置

### 独立模型链路

可把已有模型服务包装成鉴权、并发准入和用量ledger，专门供个人客户端使用。固定上游endpoint和model allowlist由管理员配置；客户端不能传任意base_url。若服务器还有其他调用方，本链路只能统计自己观测到的请求。要统计其他调用方，应在其入口另做计量，不把个人链路的账本改名为全服务器总量。

外层总准入可设为16路，并给Agent交互和模型请求明确预算；取消要传播到真实上游并释放本请求资源。不能只断开外层socket就显示“已停止”。本地模型没有订阅额度时，只展示真实Tokens和资源/容量信息，不虚构剩余余额。

### Qwen Code适配

Qwen Code可配置模型provider、请求参数和contextWindowSize；具体reasoning profile和模态需按所用版本与端点验证。[Qwen Code官方配置](https://github.com/QwenLM/qwen-code/blob/main/docs/users/configuration/model-providers.md)

采用逻辑session ID和native session ID映射。已观察到一种原生实现不会在首次prompt前持久化空session：因此只先保存逻辑ID，首次真实提交才建立native session；没有可恢复证据时，不伪造resume、不重发旧prompt。映射和元数据有schema、大小、数量、owner/mode及no-follow检查；损坏时保持后端可启动，但拒绝覆盖未知状态。

经过验证后可提供none/low/medium/xhigh，以及32/64/128/256Ki上下文选项。256Ki为该示例链路的已验证默认上限；缩短窗口是预算设置，不提升模型真实能力，也不保证上下文内容全部保留。max_output_tokens、effort和context_window是不同参数。

原生resume可能重置effort，故每次连接显式恢复保存值，并读实际config确认。容量变化或新连接清空旧used/capacity观测；只是effort变化不要无故清空仍有效的occupancy。累计run ledger跨连接保持，不能拿累计Tokens当上下文占用。

Agent工作目录只在授权共享区，普通文件必须成为容器真实可见的受控副本，不把服务器私有cache绝对路径塞给容器。即使CLI本身支持图片，所接模型链路未验证vision时也声明images:false。

## 7. 新增Kimi等provider的最小步骤

Kimi官方CLI有独立provider类型与模型能力配置，可以作为设计候选；具体认证、参数和模型能力按其官方文档及使用权限重新核验。[Kimi CLI官方provider说明](https://moonshotai.github.io/kimi-cli/en/configuration/providers.html)

1. 登记新ID、禁用状态和planned标签，不映射到其他provider。
2. 选原生CLI/ACP或自行实现API Agent；明确API兼容不等于session、steer、approval兼容。
3. 独立credential owner、sandbox、工作区、并发预算和账本。
4. 假传输验证消息、事件、unknown、取消、回执与附件。
5. 获授权后做最小真实初始化、首回合、恢复、设置及usage门禁。
6. 没验证的capability保持false/unknown；多按钮布局用通用provider列表。
7. 完成三客户端合成与原生验收才enabled。维护功能另审计，不能因“第五个按钮存在”而加入全量停止或更新名单。

## 8. 只读窗口分析使用更小权限

窗口检查的模型任务只分析不透明ID和数值/枚举清单。采用固定无工具completion，不通过能执行项目命令的Agent工具接口。固定system prompt、限制output长度，拒绝任何tool call和多余字段；每个输入ID恰好出现一次，busy/shell/waiting/unknown不得被建议直接关闭。

OpenAI兼容端点可能拒绝空tools数组，可按已验证协议省略tools，保留禁止工具选择和输出校验。需要JSON模式的端点独立配置固定response_format；仍逐项验证结构，不因JSON合法就接受不安全建议。分析失败显示模型不可用/检查不完整，无自动重试或关闭动作。
