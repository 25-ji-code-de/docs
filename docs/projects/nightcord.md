# Nightcord

Nightcord 是 SEKAI 生态的实时聊天前端：WebSocket、SEKAI 标记语言、Pass 登录、Nako AI、Storage v2 上传。

## 项目信息

| 项 | 值 |
|----|-----|
| 类型 | 聊天应用 |
| 技术栈 | 原生 JavaScript, WebSocket |
| 生产 | [nightcord.de5.net](https://nightcord.de5.net) |
| GitHub | [25-ji-code-de/nightcord](https://github.com/25-ji-code-de/nightcord) |

## 功能特性

- 事件总线解耦（EventBus）+ WebSocket 自动重连
- SEKAI Pass OAuth（`sekai_pass_*` storage 前缀）
- Nako 多人格流式对话
- SEKAI v2 上传（storage.*）与 r2 解析
- 贴纸自动补全、图片查看器、分析上报

## 主要模块（仓库根目录）

```
nightcord.js · nightcord-mgr.js · websocket-mgr.js · event-bus.js
sekai-pass-auth.js · nako-ai-service.js · file-upload-service.js
sekai-renderer.js · ui-manager.js · ui-sticker-service.js
sekai-analytics.js · storage-manager.js · performance-optimizer.js
```

## 协作

| 依赖 | 用途 |
|------|------|
| Pass | 登录 |
| Nako | AI |
| Storage / R2 | 附件 |
| Gateway | 事件统计 |
| Stickers | autocomplete / 图片 |

## 文档

仓库内 `docs/ARCHITECTURE.md` · `docs/API.md` · `docs/NAKO_AI.md`
