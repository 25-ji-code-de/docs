# 项目总览

SEKAI 生态包含应用、服务与基础设施，通过 **SEKAI Pass** 统一登录、**Gateway** 统一用户数据、**Storage** 统一媒体资源。

## 项目列表

| 项目 | 类型 | 技术栈 | 生产环境 |
|------|------|--------|----------|
| [Nightcord](/projects/nightcord) | 聊天应用 | 原生 JS, WebSocket | [nightcord.de5.net](https://nightcord.de5.net) |
| [25時作業風景](/projects/25ji) | 学习工具 | 原生 JS, HLS.js | [25ji.nightcord.de5.net](https://25ji.nightcord.de5.net) |
| [SEKAI Hub](/projects/hub) | 门户 / 看板 | 原生 ES modules | [hub.nightcord.de5.net](https://hub.nightcord.de5.net) |
| [SEKAI Pass](/projects/sekai-pass) | SSO 认证 | TypeScript, Hono, D1 | [id.nightcord.de5.net](https://id.nightcord.de5.net) |
| [Nako AI](/projects/nako) | AI 助手 | TypeScript, Workers AI / 上游 LLM | [nako.nightcord.de5.net](https://nako.nightcord.de5.net) |
| [Gateway](/projects/gateway) | API 网关 | JS modules, D1, R2 | [api.nightcord.de5.net](https://api.nightcord.de5.net) |
| [Storage Worker](/projects/storage) | 对象存储代理 | JS Worker, OSS | storage.* / r2.* |
| [Stickers](/projects/stickers) | 贴纸图鉴 | 静态 HTML | [sticker.nightcord.de5.net](https://sticker.nightcord.de5.net) |
| [Stickers Maker](/projects/stickers) | 贴纸生成 | React, Vite | [st.nightcord.de5.net](https://st.nightcord.de5.net) |

## 项目关系

```
                    SEKAI Pass (id.*)
                           │ AUTH_DB / OAuth
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
        Nightcord        25ji            Hub
           │               │               │
           │  Nako AI      │  /user/sync   │  /user/*
           ▼               ▼               ▼
        Storage v2  ◄──  Gateway (api.*)  ──►  Stickers autocomplete
```

## 技术栈对比

| 项目 | 语言 | 框架 | 存储 | 特色 |
|------|------|------|------|------|
| SEKAI Pass | TypeScript | Hono | D1, KV | OAuth 2.1, OIDC, JWT |
| Nightcord | JavaScript | 无 | localStorage | WebSocket, SEKAI 渲染 |
| Nako AI | TypeScript | 无 | Vectorize | 人格、贴纸推荐 |
| 25ji | JavaScript | 无 | localStorage + sync | HLS, 番茄钟 |
| Hub | JavaScript | 无 | — | OAuth 看板 |
| Gateway | JavaScript | 无 | D1, R2 | 缓存、同步合并 |
| Storage | JavaScript | 无 | OSS | SEKAI v2 UUID 资源 |
| Stickers | JavaScript | 无 | 静态 | 图鉴 |

## 部署平台

所有项目部署在 Cloudflare：

- **Workers** — sekai-pass, nako, gateway, storage-worker
- **Pages** — nightcord, 25ji, hub, stickers, stickers-maker, docs
- **D1** — Pass 用户/token；Gateway 用户统计/同步
- **KV** — Pass OIDC 密钥
- **R2 / OSS** — 音乐缓存、聊天附件
- **Vectorize** — Nako 贴纸向量

## 跨仓约定

见 [前端客户端约定](/guide/client-conventions) 与 [架构总览](/guide/architecture)。

## 开发规范

### Commit 规范

所有项目遵循 Conventional Commits：

- `feat:` - 新功能
- `fix:` - Bug 修复
- `docs:` - 文档更新
- `refactor:` - 重构
- `chore:` / `ci:` - 构建/工具/CI

### 代码风格

- TypeScript/JavaScript: 2 空格缩进
- 关键逻辑必须添加注释
- 避免过度工程化
- 认证相关改动优先与 hub / 25ji 参考实现对齐
