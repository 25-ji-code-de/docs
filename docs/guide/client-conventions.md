# 前端客户端约定（跨仓）

本文描述 SEKAI 生态各前端在对接 **SEKAI Pass** 与 **Gateway** 时应遵循的约定。

::: tip 约定已经落成 SDK
这些行为现在由 [`@25-ji-code-de/sekai-auth`](https://github.com/25-ji-code-de/sekai-auth) 实现。**新前端直接用它**，不要再抄一份。

Worker 侧对应的是 [`@25-ji-code-de/sekai-worker-kit`](https://github.com/25-ji-code-de/sekai-worker-kit)。
:::

## 客户端实现现状

| 仓库 | 文件 | 形态 | 是否已迁到 SDK |
|------|------|------|------|
| hub | `assets/js/auth.js` + `api.js` | ES module | 待迁移 |
| 25ji-sagyo | `js/utils/auth.js` + `api.js` | IIFE → `window.SekaiAuth` | 待迁移 |
| nightcord | `sekai-pass-auth.js` | IIFE → `SekaiPassAuth` | 待迁移 |
| stickers-maker | `src/services/auth.service.ts` | TypeScript + OIDC discovery | 待迁移 |

迁移前 hub 与 25ji 的 `auth.js` 是**近乎逐字相同的两份拷贝**，nightcord 与 stickers-maker 各自又有独立实现。四份的行为已经开始漂移，这是抽 SDK 的直接原因。

## 必须对齐的行为

1. **PKCE**：`S256`；`code_verifier` 为 64 随机字节 → 128 hex 字符（RFC 7636 允许的上限）。
2. **临时机密**：`state` / `code_verifier` 放在 **sessionStorage**（标签页作用域）。
3. **Token 持久化**：access / refresh / expires_at 放在 **localStorage**。
4. **Single-flight refresh**：并发取 token 只触发一次 refresh 请求。
5. **提前刷新**：`expires_at - now < 5min` 时刷新。
6. **`expires_in` 缺省**：按 3600s 处理，写入时用 `String(...)`。
7. **`state` 一次性**：读出即作废，重放必须被拒。
8. **refresh 失败**：清理本地 token；触发 `onAuthExpired` / 引导重新登录。
9. **logout**：清理本地后 **best-effort** `POST /oauth/revoke`（RFC 7009，form-urlencoded，`keepalive`）。
10. **`isAuthenticated()`**：有 refresh token 时即使 access 过期也算已登录（可静默续期）。

## Storage 键

SDK 默认由 `storagePrefix`（默认 `sekai_`）拼出。各仓历史键不一致，迁移时用 `keys` 逐项覆盖，**避免升级把现有用户登出**：

| 仓库 | 前缀 | 需要覆盖的键 |
|---|---|---|
| hub / 25ji-sagyo | `sekai_` | `expiresAt → sekai_token_expires_at`、`state → sekai_auth_state` |
| nightcord | `sekai_pass_` | 无（默认值刚好对得上）|
| stickers-maker | — | 历史上整包存 `ayaka_auth_state`（JSON），迁移会登出一次 |

```js
createSekaiAuth({
  clientId: 'hub_client',
  endpoints: SEKAI_PASS_ENDPOINTS,
  storagePrefix: 'sekai_',
  keys: { expiresAt: 'sekai_token_expires_at', state: 'sekai_auth_state' },
});
```

## Gateway 调用

- Base：`https://api.nightcord.de5.net`
- Header：`Authorization: Bearer <access_token>`
- 用户写接口：`PUT /user/profile`、`POST /user/sync`、`POST /user/events`
- 读接口：`GET /user/stats|achievements|activity|sync|profile`

hub 的 `API.request()` 是推荐的 DRY 形态：统一注入 Bearer、解析错误 `message`。

### 统计 metric 命名（`user_stats.metric_name`）

| 项目 | event_type | metric_name（规范） | 备注 |
|------|------------|---------------------|------|
| nightcord | `message_sent` | `messages_sent` | |
| nightcord | `online_time` | `online_minutes` | metadata.minutes |
| 25ji | `pomodoro_completed` | `pomodoros_completed` | hub 兼容 `pomodoro_completed` |
| 25ji | `study_time` | `study_minutes` | metadata.seconds → 分钟 |
| 25ji | `song_played` | `songs_played` | |
| nako | `nako_conversation` / `{persona}_conversation` | `*_conversations` | nako Worker 直写 D1；hub 汇总所有 `*_conversations` |

写入方应使用规范名；读取方（hub）应对历史别名做兼容。

## 错误信封

生态里曾经有三种互不兼容的形状。收敛目标是 `sekai-worker-kit` 的结构化信封：

```json
{
  "success": false,
  "error": { "code": "invalid_request", "message": "缺少 project 参数" },
  "message": "缺少 project 参数"
}
```

顶层 `message` 是给读 `body.message` 的旧客户端的**兼容镜像**，新代码请读 `error.code` / `error.message`。

成功形状：`{ "success": true, "data": ..., "message": "可选" }`

| 仓库 | 迁移前 | 目标 |
|---|---|---|
| gateway | `{ error: true, message }` | 结构化信封 |
| nako | `{ success: false, error: { code, message } }` | 结构化信封（形状不变，补顶层 `message`）|
| storage-worker | `{ error: "message" }` | **保持不变**，见下 |
| sekai-pass | `{ error, error_description }` | **保持不变**（OAuth / OIDC 标准要求）|

> storage-worker 暂不收编：nightcord 的 `file-upload-service.js` 直接把 `body.error` 当字符串用（`error.error || ...`），换成对象会让上传报错显示为 `[object Object]`。要统一得先改 nightcord。

## Nako 调用

- Base：`https://nako.nightcord.de5.net`
- `POST /api/chat?persona=…` body：`{ userId, message, history?, stream? }`
- 成功：`{ success: true, response, usage }`
- 失败：见上方错误信封

## Storage / SEKAI v2

- 上传：`PUT https://storage.nightcord.de5.net/v2/upload`
- Resolve：`https://r2.nightcord.de5.net/images|files|stickers/{uuid}`
- 客户端软上限约 1GB（与 storage-worker `MAX_UPLOAD_BYTES` 一致）
- 消息载荷格式见 [SEKAI v2 标记规范](/spec/sekai-v2)

## Worker 侧约定

用 [`@25-ji-code-de/sekai-worker-kit`](https://github.com/25-ji-code-de/sekai-worker-kit)：

- `authenticate(request, env)` 查 `AUTH_DB`（D1）而不是 HTTP 回调 SEKAI Pass
- 任何校验失败一律返回 `null` → 调用方回 401
- JSON 响应带 `X-Content-Type-Options: nosniff`，错误响应带 `Cache-Control: no-store`
- CORS 用 `handleCors` / `withCors`，不要在各 handler 里重复硬编码

::: warning scope 尚未强制
`access_tokens` 表有 `scope` 与 `client_id` 列，但 gateway 与 nako 目前都不校验 —— 任何 client、任何 scope 的 token 对所有端点一律放行。`authenticate()` 已把这两个字段带出来，收紧时传 `{ requireScopes: [...] }`。
:::

## 安全响应头（Pages）

静态前端仓库应提供 Cloudflare Pages `_headers`，且**只用一个 `/*` 块**（曾有三个仓把安全头和缓存头拆成两个 `/*` 段拼在一起）：

```
/*
  Cache-Control: no-cache
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: DENY
  Permissions-Policy: camera=(), microphone=(), geolocation=()
```

内容固定的二进制资源（音效、图标、贴纸图片）另开路径规则走长缓存：

```
/sounds/*
  Cache-Control: public, max-age=31536000, immutable
```

未做内容哈希的 `.js` / `.css` **不要**加长缓存 —— 它们改名不换版本。

## 仓库配置一致性

| 项 | 约定 |
|---|---|
| 许可证 | 代码 Apache-2.0 或 AGPL-3.0（以各仓 LICENSE 为准）；SDK 一律 **Apache-2.0** |
| `package.json` | `author` 统一 `The 25-ji-code-de Team`；`repository` 指向 `github.com/25-ji-code-de/*` |
| 包管理器 | npm（`package-lock.json`）。不要同时提交 `pnpm-lock.yaml` |
| `compatibility_date` | Worker 各仓对齐，示例配置为 `2026-02-10` |
| wrangler 配置 | 只提交 `.example`，真实配置本地保留并 gitignore |
