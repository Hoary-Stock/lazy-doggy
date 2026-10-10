# 已遇到的真实问题与重建经验

以下来自开发中实际观察和修复的行为，已改写为通用场景，不包含真实会话、任务、日志或部署记录。它们是需要保留的回归案例，不代表所有新版本上游都有同一Bug。具体版本可能已经变化，重建者应测自己的组合。

## 网络与交付

| 问题 | 根因 | 应保留的修复与回归 |
|---|---|---|
| 断线重连后同一句话被多次执行 | 不同socket拥有自己的回合；回退旧无去重接口 | 服务端独占runner；所有入口统一UUID；丢ack查原回执，故障注入证明只执行一次 |
| 手机锁屏后任务完成，但回到聊天不显示回答 | 事件只存在于活socket；补读与history坐标混用 | 持久journal、journal_id+seq、按item合并；回答在无订阅者时生成仍能补回 |
| 接收后立刻标done | 把交给CLI当完成；多个provider终态名称不一致 | taken/running/terminal分离；统一终态映射；断在每个阶段验证真实状态 |
| 补读历史触发旧控制提示 | replay与live共用有副作用分支 | replay只更新展示；旧审批、冲突、停止或切换帧不得再执行 |
| 新聊天第一句话在服务器命名会话前丢失 | 仅保存在socket或内存临时列表 | durable create_id、临时outbox和原子rekey；断网/杀App也保留草稿 |
| WS地址字符串正确，备用连接却失败 | 实际SDK将隐式端口转换成异常值 | 保留原HTTP端口与TLS主机验证；测试真实WS→connectionFactory链路，不只比字符串 |

## 终端与原生协议

| 问题 | 根因 | 应保留的修复与回归 |
|---|---|---|
| 手机文字拼到操作者尚未发送的输入后面 | 只检查registry，没有读composer；检查后身份变化 | fresh empty composer、TTY/foreground/start检查，在粘贴和确认前各复查 |
| 多段文字变成多条prompt | 逐行键输入或LF未经原生bracketed paste处理 | 固定buffer+bracketed paste，长消息整条校验，确认一次 |
| 交互问题明明在屏幕上，手机却不能回答 | 只认waiting；CLI在busy也画dialog | 原生状态和已解析pane共同判定；没有确定options/fingerprint时保持blocked |
| 活跃进程显示unknown、模型按钮灰掉 | 上游新增shell状态；客户端枚举与服务器gate不同 | 完整状态映射，未知仍可见；能力与服务器拒绝原因驱动按钮 |
| 安装了新CLI，旧窗口还在用旧模型/功能 | 长寿命进程仍加载旧binary或别名表 | 区分installed与running artifact；重启/恢复为独立确认，不承诺安装即改变窗口 |
| Qwen空session关闭后无法恢复 | 首个prompt前没有native持久记录 | 先保存逻辑session；首次真实请求再建native映射；不能虚构空会话恢复 |
| 恢复后思考强度退回默认，容量占用仍显示旧值 | resume重置配置；客户端复用上一连接usage | 每次显式恢复并确认配置；新连接/容量变化清空occupancy，ledger保持 |

## 附件与缓存

| 问题 | 根因 | 应保留的修复与回归 |
|---|---|---|
| JPEG真实字节被当PNG拒绝 | 图片插件重编码，却保留旧文件名/声明MIME | sniff真实内容并匹配上传名称；完整结构和像素预算仍检查 |
| 上传后发送失败，容器读取不到文件 | 私有cache路径对其他UID/容器不可见 | verified共享工作区受控副本；no-follow、SHA、真实跨身份读取门禁 |
| 大文件功能看似只需调大上传上限 | 旧broker有小JSON/base64帧上限 | chunk/commit协议与全链路预算；不把25MiB塞进一个旧IPC帧 |
| 一个较长合法文件名使客户端回执无法认领 | 服务端静默截断，客户端严格匹配原名 | 用UTF-8字节验证并保存原显示名；181–240ASCII及多字节回归 |
| 看起来已完成的文件仍被草稿引用却遭清理 | 只扫描outbox，漏了ready托盘；或以DONE/年龄回收 | 全部本地registry与服务端queue/lease共同盘点；缺失inventory全部保护 |
| SHA校验通过后删掉了后来替换的文件 | 最后stat到unlink有竞态 | Store锁+原子quarantine+重新核验实际inode；replacement、新结果、原地修改、symlink回归 |
| Android图库选完图片没有pending附件，显示空间不足 | 应用挂载命名空间中的可信cache系统别名被过严canonical比较拒绝 | 仅对path_provider同应用系统cache接受已证明别名；注入目录、其他包、未知symlink仍拒绝；真实picker门禁 |
| 共用附件父目录由另一个UID创建后无法写下一命名空间 | mkdir模式改变继承ACL的有效mask | 只为新common parent选正确共享权限；私有叶子不放宽，两个UID创建顺序分别验收 |

## 更新、展示与测试

| 问题 | 根因 | 应保留的修复与回归 |
|---|---|---|
| 更新已完成却被查询改成失败 | 查询读到building旧快照，worker已写finished退出 | recovery拿同一锁再读，终态不可覆盖；模拟worker在两步之间完成 |
| 主服务硬化后Agent更新提权失败 | no-new-privileges与sudo设计不兼容 | 保持主服务限制，以固定本地helper及peer身份授权维护；不为方便降安全 |
| 可释放统计或Token显示0，但数据其实没读到 | null/unknown强制转换0；重复usage行叠加 | unknown显式显示，计量有请求去重、完整性和source；上下文不等于累计Tokens |
| 长历史滑到底部冻结 | 一次下载全部；animate跨大量未构建项 | bounded分页、lazy列表、jumpTo与超长输出折叠，前台freeze诊断 |
| 手机控制按钮被长dialog或悬浮反馈遮住 | 固定Column与屏幕比例，忽略实际可用高度 | 用真实布局约束、scroll与固定操作区；320dp、键盘、长问题原生/组件检查 |
| 假测试全绿，真实选择器或App打不开 | 没使用系统文件选择、OS权限、打包后的真实入口 | 用正式入口的隔离fixture包做原生验收；保留所有失败尝试，区分驱动、fixture和产品Bug |

Windows原生验收还遇到测试连接建立晚于首个Electron窗口的竞态。修复只在打包测试模式等待测试连接，普通启动不改。安装驱动也曾误解析固定注册表项、把本地化安装页当作固定英文页面，或误判安装器追加的应用子目录；这些是验收工具问题，不能写成已证实的产品安装缺陷。重建时分别验收源码模式、打包产物和实际安装后的程序。

## 保留的限制

- Kimi是设计扩展，不写成已实现或已测试的第五Agent。
- OpenAI兼容API不能保证原生vision、effort、steer、history或审批等价。
- Qwen窗口可只读覆盖，但没有独立归档/停止支持就不能选择关闭。
- 回执若绑定原访问令牌，重新登录后的新令牌不能保证恢复旧操作；不得因此自动POST。
- 私有缓存可以回收，共同项目输入和Agent结果仍留在项目中；这种保护会占磁盘，需另做人工项目归档策略。
- 手机Bug入口提交报告供开发者与获授权AI调查，不承诺自动修复或自动部署。

公开演示只能使用合成数据。真实日志不是可直接上传的“证据素材”；即使去掉令牌，也可能包含私人任务、文件、身份和网络拓扑。
