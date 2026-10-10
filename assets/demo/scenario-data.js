'use strict';
window.DEMO_SCENARIOS = [
  {id:'flow',label:'消息链路',steps:[
    {title:'手机输入要求',active:['phone'],text:'给本客户端的标签加横向滚动，先给候选补丁。客户端保存原请求编号；动画里的点击不发送真实请求。',gateway:'原编号已保存',broker:'等待交付',agent:'等待原生确认'},
    {title:'鉴权成功，保存一次回执',active:['gateway'],done:['phone'],text:'服务端检查身份、会话权限与输入边界，持久接收后返回回执。accepted 表示接收，不表示 Agent 已执行。',gateway:'鉴权通过 · accepted',broker:'尚未确认交付',agent:'尚未执行'},
    {title:'Tmux broker 检查已有窗口',active:['broker'],done:['phone','gateway'],text:'Broker 读取原生状态；可交付时送入既有 Agent，忙碌时按已验证能力排队。一次 Enter 不等于模型已经接收。',gateway:'原回执可查询',broker:'原生检查 → 有界交付',agent:'等待原生确认'},
    {title:'Agent 组织模型推理与工具',active:['agent'],done:['phone','gateway','broker'],text:'服务器 Agent 按能力传递 effort、上下文和文件引用。模型返回建议；工具只能修改被授权的工作区。',gateway:'原请求保持不变',broker:'原生确认 running',agent:'推理 / 受限工具执行'},
    {title:'按序记录事件，再推回手机',active:['events'],done:['phone','gateway','broker','agent'],text:'进度、补丁和用量先记录，再推送。累计 Token 与上下文占用分别显示；未知读数不会变成零。',gateway:'原请求状态可读',broker:'保留已有窗口',agent:'生成候选结果',events:'示例事件序号：01 → 02 → 03'},
    {title:'手机断线，只补读原操作',active:['resume'],done:['phone','gateway','broker','agent','events'],text:'服务器正常且请求已可靠接收时，窗口继续工作。恢复连接后只读原回执和缺失事件；不确定的写操作不重发。',events:'断线期间事件仍由服务器记录',resume:'GET 原回执 + 补读事件 · POST 不重放'},
    {title:'Windows 接回同一个窗口',active:['windows'],done:['phone','gateway','broker','agent','events','resume'],text:'电脑读取同一服务器窗口和候选补丁。各端未发送草稿仍属本地；换端不新建任务，也不自动重复要求。',resume:'按原身份与来源恢复读取',windows:'读取已有窗口 · 本地草稿各自保留'}
  ]},
  {id:'worktree',label:'并行分工',steps:[
    {title:'先约定任务和文件所有权',active:['worker-a','worker-b','worker-c'],text:'主协调者把本客户端改动拆为界面、状态契约、验收说明。三位 subagent 读同一契约，各自拥有明确文件范围。',workers:'范围已分配',merge:'尚未合并'},
    {title:'三个 worktree，各有独立分支',active:['worker-a','worker-b','worker-c'],text:'从同一基线建立三个独立工作区；A 改界面，B 改回执，C 补回归。共享说明可以读取，彼此改动不相互覆盖。',workers:'独立修改中',merge:'主分支保持基线'},
    {title:'产出候选补丁与验证证据',active:['worker-a','worker-b','worker-c'],text:'各自提交候选补丁，说明改了什么、测试了什么、还缺什么。此处补丁和测试状态都是教学示意。',workers:'候选提交待复核',merge:'收集 A / B / C 补丁'},
    {title:'主协调者按顺序合并',active:['merge'],done:['worker-a','worker-b','worker-c'],text:'主协调者检查提交身份与基线，依次合并。遇到同一接口的重叠修改，先复核语义和冲突，再继续下一份补丁。',workers:'候选提交已收集',merge:'A → B → C · 复核冲突',tests:'合并后才检查组合行为'},
    {title:'对合并后的结果跑共同回归',active:['tests'],done:['worker-a','worker-b','worker-c','merge'],text:'验证窄屏滑动、筛选计数、鉴权失败和原回执恢复。单个分支测试通过不能代替最终组合与原生验收。',workers:'候选提交已合并',merge:'共同分支待验收',tests:'有意义回归 → 原生验收'},
    {title:'形成可审阅的候选版本',active:['review'],done:['worker-a','worker-b','worker-c','merge','tests'],text:'交付统一补丁、测试证据和剩余限制。可审阅结果不自动获得生产部署或发布权限。',workers:'分工结果已汇总',merge:'保留各提交与合并记录',tests:'记录通过与未验证范围',review:'候选结果 → 等待构建 / 发布授权'}
  ]},
  {id:'fix',label:'客户端修复',steps:[
    {title:'先保存客户端自身的问题材料',active:['feedback'],text:'反馈接收和私有保存已验收。这里用合成布局问题说明流程；原生缩略图中的草稿已取消，本动画不提交报告。',permission:'材料不是执行授权',build:'等待限定修复范围'},
    {title:'确认问题、候选方向和影响范围',active:['permission'],done:['feedback'],text:'确认问题来自本客户端的Agent 筛选标签布局，约定目标是完整名称、横向拖动与计数保留。未建立一键自动修复保证。',permission:'候选：横向标签 + 窄屏回归'},
    {title:'取得修复授权，再进入独立分支',active:['permission'],done:['feedback'],text:'授权修复后才让 Agent 改指定文件。报告文本属于不可信输入，不能借此扩大目录权限或停止既有任务。',permission:'示意节点：明确授权修复',build:'修复授权不等于发布授权'},
    {title:'候选补丁要通过真实回归',active:['build'],done:['feedback','permission'],text:'检查小屏幕、放大字体和附件入口。界面修复、权限与恢复逻辑都需实际测试；动画里的示意进度不是测试成绩。',permission:'修复范围已限定',build:'候选分支 → 回归证据'},
    {title:'授权构建发布，验收候选安装包',active:['build'],done:['feedback','permission'],text:'构建和发布分别取得授权。确认包身份、摘要、签名连续性和数据保留后，才把已验收版本作为下载候选。',permission:'保持限定改动范围',build:'授权构建 → 原生验收 → 授权发布'},
    {title:'手机取得已验收的正式版本',active:['update'],done:['feedback','permission','build'],text:'手机获取已验收 APK，检查大小、摘要及签名连续性。修复状态自动回传属于重建目标，需另行验收。',build:'仅发布已验收版本',update:'手机查看新版 → 下载正式 APK'},
    {title:'系统确认安装，服务端任务保留',active:['update'],done:['feedback','permission','build'],text:'手机交给 Android 系统确认安装；电脑使用独立更新入口。更新客户端不停止服务器任务，本演示不安装软件。',build:'一键全自动修复 worker 仍未验收',update:'系统单独确认 · 服务端工作保留'}
  ]}
];
