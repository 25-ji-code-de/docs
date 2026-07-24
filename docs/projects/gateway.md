# Gateway

Gateway 是 SEKAI 生态的统一 API 网关：公开数据聚合 + 认证后的用户数据 API。

## 项目信息

| 项 | 值 |
|----|-----|
| 类型 | API 网关 |
| 技术栈 | JavaScript (ES modules), Cloudflare Workers, D1, R2 |
| 生产 | [api.nightcord.de5.net](https://api.nightcord.de5.net) |
| GitHub | [25-ji-code-de/gateway](https://github.com/25-ji-code-de/gateway) |

## 功能特性

### 公开

- `/sekai/music_data.json` — 多层缓存的曲库聚合（v3 字段）
- `/sekai/stickers/autocomplete.json` — 贴纸补全代理
- `/assets/prefetch` — 源站资源写入 R2
- `/` · `/health` — 服务索引

### 认证（Bearer / AUTH_DB）

- `/user/profile` · `/user/stats` · `/user/events` · `/user/activity`
- `/user/achievements` · `/user/sync`

### 基础设施

- Edge + R2 缓存；stale 降级
- CORS（含 PUT）
- 请求指标 JSON 日志

## 代码结构（实际）

```
gateway/
├── index.js                 # 路由入口
├── schema.sql               # D1 用户表
└── src/
    ├── config/constants.js
    ├── middleware/auth.js · cors.js
    ├── handlers/
    │   ├── sekai/           # music-data, stickers-autocomplete
    │   ├── assets/prefetch.js
    │   └── user/            # profile, stats, sync, achievements
    └── utils/cache.js · response.js · analytics.js
```

## 与其它项目的关系

- **Pass**：`AUTH_DB` 绑定校验 access token
- **25ji / Hub**：`/user/sync` 与 stats/achievements
- **Nightcord / Nako**：事件与对话统计写入同一 D1 模型
- **Stickers**：autocomplete 上游

## 文档

- [API 参考](/api/gateway)
- [前端客户端约定 · metric 命名](/guide/client-conventions)
