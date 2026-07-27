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
| puzzle-sekai | `src/auth/{pkce,session,oidc,config,user}.ts` | TypeScript，拆成五个模块 | 待迁移 |

迁移前 hub 与 25ji 的 `auth.js` 是**近乎逐字相同的两份拷贝**，nightcord、stickers-maker、puzzle-sekai 各自又有独立实现。**五份**的行为已经开始漂移，这是抽 SDK 的直接原因。

::: warning 为什么是五份而不是四份
早期的清点只数到四份 —— puzzle-sekai 被排除在跨仓一致性检查之外，所以它那份实现从来没被数进去。豁免掩盖问题，不是解决问题。检查器现在覆盖全部仓。
:::

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
11. **OIDC `nonce`**：`scope` 含 `openid` 时必须发 `nonce`，并且**拿到 `id_token` 后必须验它** —— 连同签名一起。

## OIDC nonce：一个曾经全员踩空的点

`nonce` 挡的是 **ID Token 注入** —— 攻击者把在别处（别的用户、别的会话）拿到的**合法** ID Token 塞进受害者的回调。

`state` 挡不住这个。`state` 保证的是「这次回调对应我发起的那次请求」，它是外层参数；`nonce` 写在 ID Token **内部**、由签发方签名带回，保证的是「这个 ID Token 就是为这次请求签发的」。两者管的不是同一件事。

抽 SDK 时清点的现状是：

| 客户端 | 发 `nonce` | 验 `nonce` |
|---|:--:|:--:|
| hub / 25ji-sagyo / nightcord / stickers-maker | ✗ | ✗ |
| puzzle-sekai | ✓ | ✗ |

**没有一个闭环。** puzzle-sekai 是唯一发了的（`src/auth/oidc.ts`），但它的回调只解构 `access_token` / `refresh_token` / `expires_in`，从头到尾没碰过 `id_token` —— 那个 `nonce` 发出去就没有下文了。

而 **SEKAI Pass 服务端一直是完整支持的**：授权端点读 `nonce`、存进 `oidc_auth_data`、`buildIDTokenClaims` 再把它写回 ID Token。服务端该做的都做了，客户端一侧没人接住。

::: danger 只验 nonce 是没有意义的
能注入 token 的攻击者同样能伪造 nonce。**必须连签名一起验**，两步缺一不可。

具体地：只接受 `ES256` / `RS256`，拒绝 `alg: none` 与一切对称算法 —— 后者会让「把 JWKS 里的公钥当成 HMAC 密钥」的经典伪造攻击成立。
:::

SDK 从 `v0.2.0` 起把这两步绑在一起做完了，下游什么都不用写：

```js
// scope 含 openid 时，login() 自动发 nonce，
// handleCallback() 自动验签 + 校验 iss / aud / exp / iat / nonce
const tokens = await auth.handleCallback();
```

## Storage 键

SDK 默认由 `storagePrefix`（默认 `sekai_`）拼出。各仓历史键不一致，迁移时用 `keys` 逐项覆盖，**避免升级把现有用户登出**：

| 仓库 | 前缀 | 需要覆盖的键 |
|---|---|---|
| hub / 25ji-sagyo | `sekai_` | `expiresAt → sekai_token_expires_at`、`state → sekai_auth_state` |
| nightcord | `sekai_pass_` | 无（默认值刚好对得上）|
| stickers-maker | — | 历史上整包存 `ayaka_auth_state`（JSON），迁移会登出一次 |
| puzzle-sekai | — | 整包存 `puzzleSekaiAuth`（JSON），PKCE 存 `puzzleSekaiPkce`；迁移会登出一次 |

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
