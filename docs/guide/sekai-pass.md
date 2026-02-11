# SEKAI Pass 集成

SEKAI Pass 是 SEKAI 生态的统一身份认证服务（SSO），基于 OAuth 2.1 和 OpenID Connect。

## 为什么使用 SEKAI Pass？

- **统一身份** - 一个账号登录所有 SEKAI 应用
- **安全可靠** - 基于 OAuth 2.1 + PKCE，支持 OIDC
- **开发友好** - 标准协议，易于集成
- **隐私保护** - 最小化数据收集，用户可控

## 快速开始

### 1. 注册应用

访问 [SEKAI Pass 开发者控制台](https://id.nightcord.de5.net/developer)（规划中）注册你的应用。

目前请联系管理员注册应用，提供以下信息：

- 应用名称
- 回调 URL（Redirect URI）
- 应用描述
- 应用图标（可选）

你将获得：

- `client_id` - 客户端 ID
- `client_secret` - 客户端密钥（仅服务端应用需要）

### 2. 实现 OAuth 流程

#### 授权码流程（推荐）

适用于有后端的应用。

**步骤 1：跳转到授权页面**

```javascript
const authUrl = new URL('https://id.nightcord.de5.net/oauth/authorize');
authUrl.searchParams.set('client_id', 'YOUR_CLIENT_ID');
authUrl.searchParams.set('redirect_uri', 'https://your-app.com/callback');
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('scope', 'openid profile email');
authUrl.searchParams.set('state', generateRandomState()); // 防 CSRF

window.location.href = authUrl.toString();
```

**步骤 2：处理回调**

```javascript
// 在 /callback 路由
const code = new URL(request.url).searchParams.get('code');
const state = new URL(request.url).searchParams.get('state');

// 验证 state
if (state !== savedState) {
  throw new Error('Invalid state');
}

// 交换 access token
const tokenResponse = await fetch('https://id.nightcord.de5.net/oauth/token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: 'https://your-app.com/callback',
    client_id: 'YOUR_CLIENT_ID',
    client_secret: 'YOUR_CLIENT_SECRET'
  })
});

const { access_token, id_token } = await tokenResponse.json();
```

**步骤 3：获取用户信息**

```javascript
const userResponse = await fetch('https://id.nightcord.de5.net/oauth/userinfo', {
  headers: {
    'Authorization': `Bearer ${access_token}`
  }
});

const user = await userResponse.json();
// { sub, username, email, avatar, ... }
```

#### PKCE 流程（公开客户端）

适用于纯前端应用（如 Nightcord）。

**步骤 1：生成 code verifier 和 challenge**

```javascript
// 生成 code verifier
const codeVerifier = generateRandomString(128);
sessionStorage.setItem('code_verifier', codeVerifier);

// 生成 code challenge
const encoder = new TextEncoder();
const data = encoder.encode(codeVerifier);
const hash = await crypto.subtle.digest('SHA-256', data);
const codeChallenge = base64UrlEncode(hash);
```

**步骤 2：跳转到授权页面**

```javascript
const authUrl = new URL('https://id.nightcord.de5.net/oauth/authorize');
authUrl.searchParams.set('client_id', 'YOUR_CLIENT_ID');
authUrl.searchParams.set('redirect_uri', 'https://your-app.com/callback');
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('scope', 'openid profile email');
authUrl.searchParams.set('code_challenge', codeChallenge);
authUrl.searchParams.set('code_challenge_method', 'S256');
authUrl.searchParams.set('state', generateRandomState());

window.location.href = authUrl.toString();
```

**步骤 3：交换 token（无需 client_secret）**

```javascript
const code = new URL(window.location.href).searchParams.get('code');
const codeVerifier = sessionStorage.getItem('code_verifier');

const tokenResponse = await fetch('https://id.nightcord.de5.net/oauth/token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: 'https://your-app.com/callback',
    client_id: 'YOUR_CLIENT_ID',
    code_verifier: codeVerifier
  })
});

const { access_token } = await tokenResponse.json();
```

## API 端点

### 授权端点

```
GET https://id.nightcord.de5.net/oauth/authorize
```

**参数：**

- `client_id` - 客户端 ID（必需）
- `redirect_uri` - 回调 URL（必需）
- `response_type` - 固定为 `code`（必需）
- `scope` - 权限范围，空格分隔（必需）
- `state` - 防 CSRF 令牌（推荐）
- `code_challenge` - PKCE challenge（PKCE 流程必需）
- `code_challenge_method` - 固定为 `S256`（PKCE 流程必需）

### Token 端点

```
POST https://id.nightcord.de5.net/oauth/token
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
  "access_token": "访问令牌",
  "token_type": "Bearer",
  "expires_in": 3600,
  "id_token": "ID 令牌（OIDC）"
}
```

### 用户信息端点

```
GET https://id.nightcord.de5.net/oauth/userinfo
Authorization: Bearer {access_token}
```

**响应：**

```json
{
  "sub": "用户 ID",
  "username": "用户名",
  "email": "邮箱",
  "avatar": "头像 URL",
  "created_at": "注册时间"
}
```

## Scope 说明

- `openid` - 基础 OIDC 信息（必需）
- `profile` - 用户资料（用户名、头像）
- `email` - 邮箱地址

## 安全建议

1. **使用 HTTPS** - 所有请求必须通过 HTTPS
2. **验证 state** - 防止 CSRF 攻击
3. **使用 PKCE** - 公开客户端必须使用 PKCE
4. **保护 client_secret** - 仅在服务端使用，不要暴露到前端
5. **验证 redirect_uri** - 确保回调 URL 与注册时一致
6. **短期 token** - access_token 有效期 1 小时

## 示例项目

参考 Nightcord 的实现：

- [GitHub 仓库](https://github.com/25-ji-code-de/nightcord)
- [登录逻辑](https://github.com/25-ji-code-de/nightcord/blob/main/js/auth.js)

## 相关链接

- [SEKAI Pass API 参考](/api/sekai-pass)
- [SEKAI Pass 项目详情](/projects/sekai-pass)
- [架构总览](/guide/architecture)
