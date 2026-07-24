# 前端客户端约定（跨仓）

本文描述 SEKAI 生态各前端在对接 **SEKAI Pass** 与 **Gateway** 时应遵循的约定。目标是行为一致，并为未来抽成共享 SDK 做准备。

## 已实现客户端

| 仓库 | 文件 | 形态 |
|------|------|------|
| hub | `assets/js/auth.js` + `api.js` | ES module |
| 25ji-sagyo | `js/utils/auth.js` + `api.js` | IIFE → `window.SekaiAuth` |
| nightcord | `sekai-pass-auth.js` | IIFE → `SekaiPassAuth`（独立前缀） |
| stickers-maker | `src/services/auth.service.ts` | TypeScript + env |

## 必须对齐的行为

1. **PKCE**：`S256`；`code_verifier` 足够长（≥ 32 字节熵）。
2. **临时机密**：`state` / `code_verifier` 放在 **sessionStorage**。
3. **Token 持久化**：access / refresh / expires_at 放在 **localStorage**。
4. **Single-flight refresh**：并发 `getValidAccessToken()` 只触发一次 refresh 请求。
5. **提前刷新**：`expires_at - now < 5min` 时刷新。
6. **expires_in 缺省**：按 3600s 处理，写入时用 `String(...)`。
7. **refresh 失败**：清理本地 token；可触发 `onAuthExpired` / 跳转登录。
8. **logout**：清理本地后 **best-effort** `POST /oauth/revoke`（RFC 7009，form-urlencoded，keepalive）。

## 建议的 storage 键

Hub / 25ji 共用（不同子域互不影响）：

- `sekai_access_token`
- `sekai_refresh_token`
- `sekai_token_expires_at`
- PKCE：`sekai_code_verifier` / `sekai_auth_state`（session）

Nightcord 使用 `sekai_pass_*` 前缀，避免与其它应用逻辑混淆——**允许**。

stickers-maker 将整包 `AuthState` 存为 `ayaka_auth_state`（JSON），PKCE 用 sessionStorage——**允许**，但 refresh / revoke / 5min 提前刷新行为须一致。

## Gateway 调用

- Base：`https://api.nightcord.de5.net`
- Header：`Authorization: Bearer <access_token>`
- 用户写接口：`PUT /user/profile`、`POST /user/sync`、`POST /user/events`
- 读接口：`GET /user/stats|achievements|activity|sync|profile`

Hub 的 `API.request()` 是推荐的 DRY 形态：统一注入 Bearer、解析错误 `message`。

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

## Nako 调用

- Base：`https://nako.nightcord.de5.net`
- `POST /api/chat?persona=…` body：`{ userId, message, history?, stream? }`
- 成功：`{ success: true, response, usage }`
- 失败：`{ success: false, error: { code, message } }`

## Storage / SEKAI v2

- 上传：`PUT https://storage.nightcord.de5.net/v2/upload`
- Resolve：`https://r2.nightcord.de5.net/images|files|stickers/{uuid}`
- 客户端软上限约 1GB（与 storage-worker `MAX_UPLOAD_BYTES` 一致）
- 消息载荷见 [Storage 项目页](/projects/storage) 与 `SYS_SEKA_STD`

## 安全响应头（Pages）

静态前端仓库建议提供 Cloudflare Pages `_headers`：

- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Frame-Options: DENY`（或 SAMEORIGIN）
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

Workers JSON 响应建议附带 `X-Content-Type-Options: nosniff`。

## 未来 SDK 草图

```ts
// @25-ji-code-de/sekai-auth (planned)
createSekaiAuth({
  clientId,
  redirectUri,
  endpoints: { authorize, token, userinfo },
  storagePrefix?: string,
})
// → login / handleCallback / getAccessToken / logout / isAuthenticated
```

在抽出 npm 包之前，请以 **hub** 与 **25ji** 的实现为参考实现，改一处时同步另一处。
