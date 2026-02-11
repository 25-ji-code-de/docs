# 项目总览

SEKAI 生态包含 6 个项目，涵盖应用、服务和基础设施。

## 项目列表

| 项目 | 类型 | 技术栈 | 生产环境 |
|------|------|--------|----------|
| [Nightcord](/projects/nightcord) | 聊天应用 | 原生 JS, WebSocket | [nightcord.de5.net](https://nightcord.de5.net) |
| [25時作業風景](/projects/25ji) | 学习工具 | 原生 JS, HLS.js | [25ji.nightcord.de5.net](https://25ji.nightcord.de5.net) |
| [SEKAI Pass](/projects/sekai-pass) | SSO 认证 | TypeScript, Hono, D1 | [id.nightcord.de5.net](https://id.nightcord.de5.net) |
| [Nako AI](/projects/nako) | AI 助手 | TypeScript, Workers AI | [nako.nightcord.de5.net](https://nako.nightcord.de5.net) |
| [Gateway](/projects/gateway) | API 网关 | TypeScript, R2 | [api.nightcord.de5.net](https://api.nightcord.de5.net) |
| Stickers | 贴纸服务 | 静态 HTML | [sticker.nightcord.de5.net](https://sticker.nightcord.de5.net) |

## 项目关系

```
SEKAI Pass (SSO)
  ↓ 提供认证
Nightcord, 25ji, 未来项目...
  ↓ 使用 AI 服务
Nako AI
  ↓ 使用贴纸数据
Stickers
  ↓ 通过网关访问
Gateway (API 网关)
```

## 技术栈对比

| 项目 | 语言 | 框架 | 数据库 | 特色技术 |
|------|------|------|--------|----------|
| SEKAI Pass | TypeScript | Hono, Lucia Auth | D1 | OAuth 2.1, OIDC, JWT |
| Nightcord | JavaScript | 无 | localStorage | WebSocket, 事件驱动 |
| Nako AI | TypeScript | 无 | Vectorize | Workers AI, 向量搜索 |
| 25ji | JavaScript | 无 | IndexedDB | HLS.js, Web Audio API |
| Gateway | JavaScript | 无 | R2 | 多层缓存, 流式处理 |
| Stickers | JavaScript | 无 | 无 | CSS Grid, Lazy Loading |

## 代码规模

- **SEKAI Pass**: ~5,000 行
- **Nightcord**: ~4,255 行
- **Nako AI**: ~2,000 行
- **25ji**: ~15,000 行
- **Gateway**: ~500 行
- **Stickers**: ~200 行

**总计**: ~27,000+ 行代码

## 部署平台

所有项目部署在 Cloudflare：

- **Workers** - sekai_pass, nightcord-nako, pjsekai
- **Pages** - nightcord, 25ji_sagyo_fukei, stickers
- **D1** - sekai_pass 数据库
- **KV** - sekai_pass 密钥存储
- **R2** - pjsekai 对象存储
- **Vectorize** - nightcord-nako 向量数据库

## 开发规范

### Commit 规范

所有项目遵循 Conventional Commits：

- `feat:` - 新功能
- `fix:` - Bug 修复
- `docs:` - 文档更新
- `refactor:` - 重构
- `chore:` - 构建/工具相关

### 代码风格

- TypeScript/JavaScript: 2 空格缩进
- 关键逻辑必须添加注释
- 避免过度工程化

### 许可证

所有项目使用 MIT License。

## GitHub Organization

所有项目托管在 [25-ji-code-de](https://github.com/25-ji-code-de) Organization。

## 下一步

- [Nightcord 详情](/projects/nightcord)
- [SEKAI Pass 详情](/projects/sekai-pass)
- [Gateway 详情](/projects/gateway)
