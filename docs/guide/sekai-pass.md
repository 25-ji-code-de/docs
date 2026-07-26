# SEKAI Pass 集成

SEKAI Pass 是 SEKAI 生态的统一身份认证服务（SSO），基于 OAuth 2.1 和 OpenID Connect。

## 为什么使用 SEKAI Pass？

- **统一身份** — 一个账号登录 Nightcord / 25ji / Hub 等
- **安全可靠** — OAuth 2.1 + **强制 PKCE (S256)** + OIDC
- **开发友好** — 标准协议；前端参考实现已对齐
- **隐私可控** — 按 scope 返回用户字段

## 快速开始

### 1. 注册应用

登录 SEKAI Pass 后打开**开放平台**（`/apps`），自助创建：

- 应用名称
- 回调 URL（Redirect URI，可含本地 `http://localhost`）
- 应用描述、主页（可选）
- 客户端类型：公开客户端（PKCE）或机密客户端（private_key_jwt）

创建后立刻拿到 `client_id`。公共 SPA 用不到 `client_secret`。

::: warning client_secret 只显示一次
创建与轮换时才返回，之后服务端不再吐出来。当场复制走。
:::

选了 private_key_jwt 的应用还要在应用卡片上点「管理公钥」登记公钥 ——
**在登记之前这个应用取不到 token**。

::: tip 以前不是这样的
开放平台上线之前，注册应用只能请人手工往数据库里 `INSERT`。
如果你手上还有旧文档写着"联系管理员"，那是过期的。
:::

### 2. 公共客户端（SPA）— 推荐

浏览器应用应使用 **授权码 + PKCE**，不要把 secret 放进前端。

完整行为约定（sessionStorage / single-flight refresh / 提前 5 分钟刷新）见：

→ [前端客户端约定](/guide/client-conventions)

参考实现：

| 仓库 | 文件 |
|------|------|
| hub | `assets/js/auth.js` |
| 25ji-sagyo | `js/utils/auth.js` |
| nightcord | `sekai-pass-auth.js` |
| stickers-maker | `src/services/auth.service.ts` |

**步骤 1：跳转授权**

```javascript
// 生成 state + code_verifier，存 sessionStorage
// code_challenge = BASE64URL(SHA256(code_verifier))
const authUrl = new URL('https://id.nightcord.de5.net/oauth/authorize');
authUrl.searchParams.set('client_id', CLIENT_ID);
authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('scope', 'openid profile email');
authUrl.searchParams.set('state', state);
authUrl.searchParams.set('code_challenge', codeChallenge);
authUrl.searchParams.set('code_challenge_method', 'S256');
window.location.href = authUrl.toString();
```

**步骤 2：回调换 token**（`application/x-www-form-urlencoded`）

```javascript
const body = new URLSearchParams({
  grant_type: 'authorization_code',
  code,
  redirect_uri: REDIRECT_URI,
  client_id: CLIENT_ID,
  code_verifier: codeVerifier,
});
const res = await fetch('https://id.nightcord.de5.net/oauth/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body,
});
const tokens = await res.json();
// access_token / refresh_token / expires_in / id_token?
```

**步骤 3：UserInfo**

```javascript
const me = await fetch('https://id.nightcord.de5.net/oauth/userinfo', {
  headers: { Authorization: `Bearer ${accessToken}` },
}).then((r) => r.json());
```

### 3. 调用受保护 API

```javascript
await fetch('https://api.nightcord.de5.net/user/stats', {
  headers: { Authorization: `Bearer ${accessToken}` },
});
await fetch('https://nako.nightcord.de5.net/api/chat?persona=nako', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ userId: 'K', message: '你好', history: [] }),
});
```

Gateway / Nako 通过 D1 `AUTH_DB` 校验 token，无需再 HTTP 访问 Pass。

## OIDC Discovery

```
GET https://id.nightcord.de5.net/.well-known/openid-configuration
```

stickers-maker 已用 discovery 解析 authorize/token/userinfo 端点。

## 更多

- [API 参考](/api/sekai-pass)
- [架构总览](/guide/architecture)
- [客户端约定](/guide/client-conventions)
