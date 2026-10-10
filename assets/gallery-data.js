/* Native client screenshots with synthetic demonstration data. */
window.SHOWCASE_GALLERY = {
  "tmux": [
    {
      "title": "手机 Tmux：一行横向拖动的代理标签",
      "src": "assets/screenshots/tmux-horizontal-agents.png",
      "description": "真实左右拖动后显示完整 Claude、Codex、DeepSeek 和 Qwen 标签，窗口、运行、等待及 Qwen 16 路容量统计保留在同一屏。",
      "caption": "真实 Tmux 0.1.65 客户端界面；合成演示数据。标签滑动不启动任务，窗口与状态数字为演示数据。16 是原实例的准入上限展示；本次截图不是并发性能测试。",
      "alt": "Tmux 手机会话列表，横向标签显示四代理名称及数量，下面显示演示窗口。"
    },
    {
      "title": "手机 Tmux：选文件，先检查附件栏",
      "src": "assets/screenshots/tmux-file-tray.png",
      "description": "通过 Android 系统文件选择器选中 demo-notes.txt，向演示服务上传一次70字节文件，并在待发送附件栏确认 Ready。",
      "caption": "真实 Tmux 0.1.65 客户端界面；合成演示数据。演示文件留在待发送附件栏，未发送模型任务；原文件保留。",
      "alt": "Tmux 演示聊天窗口的文件附件栏，demo-notes.txt 显示 Ready 和70字节。"
    },
    {
      "title": "手机 Tmux：有引用的缓存保持保护",
      "src": "assets/screenshots/tmux-cache-protected.png",
      "description": "手动刷新后的缓存面板说明复用保留、活动租约、未知引用及本地草稿保护规则；本张展示策略和摘要区域。上方账户卡片未在演示服务中配置，显示未知状态；这不是实际账号或内部路由。",
      "caption": "真实 Tmux 0.1.65 客户端界面；合成演示数据。仅查看保护状态，没有释放或清理；原文件保留。",
      "alt": "Tmux 维护页面下方的附件缓存策略与容量摘要，说明草稿和待发送附件保持保护。"
    }
  ],
  "remote": [
    {
      "title": "手机 Remote：窗口管理先分清操作",
      "src": "assets/screenshots/remote-window-management.png",
      "description": "同一入口区分四代理的遗留窗口检查和 Claude 交互进程详情；查看证据、辅助建议及确认关闭有不同步骤。",
      "caption": "真实客户端界面；合成演示数据。仅打开入口，不执行检查任务或关闭操作。",
      "alt": "手机 Remote 的窗口管理入口，分别提供遗留窗口检查与 Claude 进程查看。"
    },
    {
      "title": "手机 Remote：四代理检查入口",
      "src": "assets/screenshots/remote-four-agent-inspector.png",
      "description": "分析器选项包含 Claude、Codex、DeepSeek 和 Qwen；Qwen 窗口仅供查看，界面明确说明权限和确认规则。",
      "caption": "真实客户端界面；合成演示数据。复用该版本原生验收中的检查入口截图，未执行真实模型调用或关闭窗口。",
      "alt": "手机遗留窗口检查界面，显示四代理分析器选项和 Qwen 只读说明。"
    },
    {
      "title": "手机 Remote：上下文占用与累计 Token",
      "src": "assets/screenshots/remote-thinking-tokens.png",
      "description": "同一面板显示配置值、原生观测值、上下文占用及累计 Token。截图时为 low／256K；之后只向测试替身保存一次 xhigh／64K，没有发送模型任务。",
      "caption": "真实客户端界面；合成演示数据。截图显示 low／256K；8192、1100 等数字不是账单或性能测量。",
      "alt": "Qwen 手机设置面板，分别显示上下文占用、累计 Token、思考强度与上下文上限。"
    },
    {
      "title": "手机 Remote：先看截图，再描述问题",
      "src": "assets/screenshots/remote-feedback-preview.png",
      "description": "打开实际反馈预览，填写一段合成布局问题；预览提示截图可能包含敏感信息，并提示当前捕获回退的限制。",
      "caption": "真实客户端界面；合成演示数据。填入演示说明后选择 Cancel，未提交反馈、工单或修复任务。",
      "alt": "手机反馈预览显示合成问题说明、敏感信息提醒及取消和发送按钮。"
    }
  ],
  "windows": [
    {
      "title": "电脑端：四代理与实时窗口",
      "src": "assets/screenshots/windows-four-agents.png",
      "description": "同一界面查看 Claude、Codex、DeepSeek 和 Qwen；示例展示当前上下文占用、累计窗口 Token，以及仅保存在输入框的草稿。",
      "caption": "真实客户端界面；合成演示数据；账号显示替换为 Demo。Token 和对话均为演示数据，未调用真实模型。",
      "alt": "Windows 客户端四代理筛选与 Qwen 演示窗口，显示上下文占用和窗口 Token。"
    },
    {
      "title": "电脑端：思考深度与上下文",
      "src": "assets/screenshots/windows-thinking-context.png",
      "description": "读出当前设置后打开 Qwen 控制菜单，展示 thinking off、low、medium、xhigh 和 32K 到 256K 的上下文选项；随后关闭菜单。",
      "caption": "真实客户端界面；合成演示数据；账号显示替换为 Demo。仅展示控制菜单，未发送任务。",
      "alt": "Qwen 思考深度和上下文选项的真实 Windows 客户端弹窗。"
    },
    {
      "title": "电脑端：先核验，再确认更新",
      "src": "assets/screenshots/windows-app-update-confirm.png",
      "description": "使用测试替身提供的合成 0.3.1 元数据、下载文件和摘要，展示大小与 SHA256 核验后的确认流程；未连接真实发布源，客户端仍为 0.3.0。",
      "caption": "真实客户端界面；合成演示数据；账号显示替换为 Demo。0.3.1、下载文件与摘要均为演示数据；取消确认，未安装更新。",
      "alt": "Windows 0.3.0 客户端显示合成 0.3.1 更新确认对话框，含取消和确认按钮。"
    }
  ]
};
