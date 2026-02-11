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
Content-Type: application/json
```

**请求体：**

```json
{
  "grant_type": "authorization_code",
  "code": "授权码",
  "redirect_uri": "回调 URL",
  "client_id": "客户端 ID",
  "client_secret": "客户端密钥（服务端流程）",
  "code_verifier": "PKCE verifier（PKCE 流程）"
}
```

**响应：**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "id_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 用户信息端点

获取当前用户信息。

```http
GET /oauth/userinfo
Authorization: Bearer {access_token}
```

**响应：**

```json
{
  "sub": "user_123456",
  "username": "mafuyu",
  "email": "mafuyu@example.com",
  "avatar": "https://assets.nightcord.de5.net/avatars/mafuyu.png",
  "created_at": "2026-01-01T00:00:00Z"
}
```

### 刷新 Token

刷新访问令牌（规划中）。

```http
POST /oauth/token
Content-Type: application/json
```

**请求体：**

```json
{
  "grant_type": "refresh_token",
  "refresh_token": "刷新令牌",
  "client_id": "客户端 ID",
  "client_secret": "客户端密钥"
}
```

### 撤销 Token

撤销访问令牌（规划中）。

```http
POST /oauth/revoke
Content-Type: application/json
Authorization: Bearer {access_token}
```

**请求体：**

```json
{
  "token": "访问令牌"
}
```

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
const tokenResponse = await fetch('https://id.nightcord.de5.net/oauth/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: 'https://your-app.com/callback',
    client_id: 'YOUR_CLIENT_ID',
    client_secret: 'YOUR_CLIENT_SECRET'
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
token_response = requests.post('https://id.nightcord.de5.net/oauth/token', json={
    'grant_type': 'authorization_code',
    'code': code,
    'redirect_uri': 'https://your-app.com/callback',
    'client_id': 'YOUR_CLIENT_ID',
    'client_secret': 'YOUR_CLIENT_SECRET'
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
