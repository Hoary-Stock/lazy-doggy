<!-- SPDX-License-Identifier: CC-BY-NC-4.0 -->
# Lazy Doggy 本机白板

**不能直接部署。请让自己的 AI 先检查、修理并补齐安全与功能门禁。**

这是按公开契约新写的最简 mock，没有找到可确认为旧版的白板程序，因此不把它称为原程序的脱敏版。这里的四个 provider、消息、事件和 Tokens 都是假数据，没有真实 CLI 或模型。

## 运行

需要 Python 3.10 或更新版本；无需安装依赖。在此目录运行：

```sh
python server.py
```

在同一设备的浏览器打开 `http://127.0.0.1:8765`，结束时按 Ctrl+C。只绑定 loopback，不提供改 host 的选项，不配置后台服务。端口冲突可用 `python server.py --port 8766`。

手机和 Windows 浏览器都可打开 `index.html` 阅读静态白板。静态模式不发请求；互动需要浏览器所在设备运行本机 Python 服务。它不是让手机远程访问电脑的部署方案，不要为了演示把它绑定到公网或局域网。

点击“模拟确认丢失”，再点“只查原 UUID”，观察一次 POST、原 ID 的 GET 和合成统计。这里的丢失是前端主动忽略响应，并不模拟服务器崩溃。数据只在内存：刷新丢前端 UUID，重启丢后端回执，最多64个模拟操作。

## 检查

```sh
python -B -m unittest test_demo.py -v
```

测试只启动自己的临时 loopback mock，并在结束时关闭。没有真实模型请求、凭据读取、shell执行、上传、缓存释放或删除。

完整说明、缺失能力及 AI 任务模板见[白板说明](../../docs/whiteboard-example.md)。归属和许可见 [NOTICE](NOTICE.md)。
