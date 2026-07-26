# SEKAI Pass API

SEKAI Pass 提供基于 OAuth 2.1 和 OpenID Connect 的认证服务。

## 基础信息

- **Base URL**: `https://id.nightcord.de5.net`
- **协议**: OAuth 2.1, OpenID Connect
- **认证方式**: Bearer Token

## 端点

### 授权端点

获取授权码。

```http
GET /oauth/authorize
```

**参数：**

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `client_id` | string | 是 | 客户端 ID |
| `redirect_uri` | string | 是 | 回调 URL |
| `response_type` | string | 是 | 固定为 `code` |
| `scope` | string | 是 | 权限范围，空格分隔 |
| `state` | string | 推荐 | 防 CSRF 令牌 |
| `code_challenge` | string | PKCE | PKCE challenge |
| `code_challenge_method` | string | PKCE | 固定为 `S256` |

**响应：**

重定向到 `redirect_uri`，带上 `code` 和 `state` 参数。

```
https://your-app.com/callback?code=AUTH_CODE&state=STATE
```

### Token 端点

交换授权码获取访问令牌。

```http
POST /oauth/token
Content-Type: application/x-www-form-urlencoded
```

**表单字段（authorization_code）：**

| 字段 | 说明 |
|------|------|
| `grant_type` | `authorization_code` |
| `code` | 授权码 |
| `redirect_uri` | 与授权请求一致的回调 |
| `client_id` | 客户端 ID |
| `code_verifier` | PKCE verifier（公共客户端必需） |

**表单字段（refresh_token）：**

| 字段 | 说明 |
|------|------|
| `grant_type` | `refresh_token` |
| `refresh_token` | 刷新令牌 |
| `client_id` | 客户端 ID |

```bash
curl -X POST https://id.nightcord.de5.net/oauth/token \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'grant_type=authorization_code&code=…&redirect_uri=…&client_id=…&code_verifier=…'
```

**成功响应示例：**

```json
{
  "access_token": "…",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "…",
  "id_token": "…"
}
```

### 用户信息端点

获取当前用户信息。

```http
GET /oauth/userinfo
Authorization: Bearer {access_token}
```

**响应（字段因 scope / 实现略有差异）：**

```json
{
  "sub": "user_123456",
  "preferred_username": "mafuyu",
  "username": "mafuyu",
  "name": "朝比奈真冬",
  "display_name": "朝比奈真冬",
  "email": "mafuyu@example.com",
  "picture": "https://…/avatar.png",
  "avatar_url": "https://…/avatar.png",
  "bio": "……"
}
```

前端显示名优先级见 25ji `getDisplayName()`：`display_name → name → preferred_username → username → email`。

### 刷新 Token

使用同一 token 端点，`grant_type=refresh_token`，`Content-Type: application/x-www-form-urlencoded`（见上表）。Pass 支持 refresh token 轮换；客户端应 single-flight 刷新。

### 撤销 Token

RFC 7009 端点已实现：

```http
POST /oauth/revoke
Content-Type: application/x-www-form-urlencoded
```

| 字段 | 说明 |
|------|------|
| `token` | access 或 refresh token |
| `token_type_hint` | 可选 `access_token` / `refresh_token` |

未知/无效 token 仍返回 **200**（符合 RFC 7009）。公共 SPA 登出时也应清理本地 storage。

## Scope

| Scope | 说明 |
|-------|------|
| `openid` | 基础 OIDC 信息（必需） |
| `profile` | 用户资料（用户名、头像） |
| `email` | 邮箱地址 |

## 错误响应

所有错误响应遵循 OAuth 2.1 规范：

```json
{
  "error": "invalid_request",
  "error_description": "Missing required parameter: client_id"
}
```

**错误码：**

| 错误码 | 说明 |
|--------|------|
| `invalid_request` | 请求参数错误 |
| `invalid_client` | 客户端认证失败 |
| `invalid_grant` | 授权码无效或过期 |
| `unauthorized_client` | 客户端无权限 |
| `unsupported_grant_type` | 不支持的 grant_type |
| `invalid_scope` | 无效的 scope |

## 安全

### PKCE

公开客户端（纯前端应用）必须使用 PKCE。

**生成 code verifier：**

```javascript
function generateCodeVerifier() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}
```

**生成 code challenge：**

```javascript
async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(hash);
}
```

### State

使用 `state` 参数防止 CSRF 攻击：

```javascript
function generateState() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}
```

### Token 安全

- **不要在 URL 中传递 token** - 使用 Authorization 头
- **使用 HTTPS** - 所有请求必须通过 HTTPS
- **短期 token** - access_token 有效期 1 小时
- **安全存储** - 使用 httpOnly cookie 或 secure storage

## 速率限制

| 端点 | 限制 |
|------|------|
| `/oauth/authorize` | 100 次/分钟/IP |
| `/oauth/token` | 50 次/分钟/IP |
| `/oauth/userinfo` | 200 次/分钟/token |

超过限制返回 `429 Too Many Requests`。

## 示例

### JavaScript

```javascript
// 授权
const authUrl = new URL('https://id.nightcord.de5.net/oauth/authorize');
authUrl.searchParams.set('client_id', 'YOUR_CLIENT_ID');
authUrl.searchParams.set('redirect_uri', 'https://your-app.com/callback');
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('scope', 'openid profile email');
authUrl.searchParams.set('state', generateState());

window.location.href = authUrl.toString();

// 交换 token
//
// 三处容易写错的地方，本文上面的「Token 端点」一节是准的：
//   1. 必须是 application/x-www-form-urlencoded —— 服务端读的是 formData()，
//      发 JSON 会直接抛 TypeError
//   2. code_verifier 必需 —— OAuth 2.1 强制 PKCE，缺了换不到 token
//   3. 没有 client_secret —— 本服务只支持 none 与 private_key_jwt 两种
//      客户端认证方式，两种都不用密钥字符串
const tokenResponse = await fetch('https://id.nightcord.de5.net/oauth/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: 'https://your-app.com/callback',
    client_id: 'YOUR_CLIENT_ID',
    code_verifier: codeVerifier   // 发起授权时生成、存在会话里的那个
  })
});

const { access_token } = await tokenResponse.json();

// 获取用户信息
const userResponse = await fetch('https://id.nightcord.de5.net/oauth/userinfo', {
  headers: { 'Authorization': `Bearer ${access_token}` }
});

const user = await userResponse.json();
```

### Python

```python
import requests

# 交换 token
#
# 注意用 data= 而不是 json= —— 服务端读的是表单，发 JSON 会失败。
# code_verifier 必需（OAuth 2.1 强制 PKCE）；没有 client_secret。
token_response = requests.post('https://id.nightcord.de5.net/oauth/token', data={
    'grant_type': 'authorization_code',
    'code': code,
    'redirect_uri': 'https://your-app.com/callback',
    'client_id': 'YOUR_CLIENT_ID',
    'code_verifier': code_verifier,  # 发起授权时生成、存在会话里的那个
})

access_token = token_response.json()['access_token']

# 获取用户信息
user_response = requests.get('https://id.nightcord.de5.net/oauth/userinfo', headers={
    'Authorization': f'Bearer {access_token}'
})

user = user_response.json()
```

## 相关链接

- [SEKAI Pass 集成指南](/guide/sekai-pass)
- [SEKAI Pass 项目详情](/projects/sekai-pass)
- [GitHub 仓库](https://github.com/25-ji-code-de/sekai-pass)
