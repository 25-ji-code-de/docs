# SEKAI Pass

SEKAI Pass 是 SEKAI 生态的统一身份认证服务（SSO），基于 OAuth 2.1 和 OpenID Connect。

## 项目信息

- **类型**: SSO 认证服务
- **技术栈**: TypeScript, Hono, Lucia Auth, D1
- **生产环境**: [id.nightcord.de5.net](https://id.nightcord.de5.net)
- **GitHub**: [25-ji-code-de/sekai-pass](https://github.com/25-ji-code-de/sekai-pass)
- **代码量**: ~5,000 行

## 功能特性

### OAuth 2.1

- **授权码流程** - 标准 OAuth 2.1 授权码流程
- **PKCE 支持** - 公开客户端安全增强
- **Refresh Token** - 长期访问支持（规划中）
- **Token 撤销** - 主动撤销访问令牌（规划中）

### OpenID Connect

- **ID Token** - JWT 格式的身份令牌
- **UserInfo 端点** - 获取用户信息
- **Discovery** - OIDC 发现端点（规划中）

### 用户管理

- **注册/登录** - 邮箱 + 密码
- **密码加密** - PBKDF2 + 随机盐
- **会话管理** - Lucia Auth
- **头像上传** - 支持自定义头像（规划中）

### 客户端管理

- **应用注册** - 开发者控制台（规划中）
- **Redirect URI 验证** - 防止重定向攻击
- **Scope 管理** - 细粒度权限控制

## 技术架构

### 后端架构

```
src/
├── index.ts             # 入口文件
├── routes/
│   ├── oauth.ts         # OAuth 端点
│   ├── auth.ts          # 认证端点
│   └── user.ts          # 用户端点
├── lib/
│   ├── lucia.ts         # Lucia Auth 配置
│   ├── oauth.ts         # OAuth 逻辑
│   └── db.ts            # 数据库操作
├── middleware/
│   ├── auth.ts          # 认证中间件
│   └── cors.ts          # CORS 中间件
└── types/
    └── index.ts         # 类型定义
```

### 数据库设计

**users 表：**

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  avatar TEXT,
  created_at INTEGER NOT NULL
);
```

**sessions 表：**

```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**oauth_clients 表：**

```sql
CREATE TABLE oauth_clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  secret TEXT NOT NULL,
  redirect_uris TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
```

**oauth_codes 表：**

```sql
CREATE TABLE oauth_codes (
  code TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  redirect_uri TEXT NOT NULL,
  scope TEXT NOT NULL,
  code_challenge TEXT,
  expires_at INTEGER NOT NULL,
  FOREIGN KEY (client_id) REFERENCES oauth_clients(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## 本地开发

### 克隆项目

```bash
git clone https://github.com/25-ji-code-de/sekai-pass.git
cd sekai-pass
```

### 安装依赖

```bash
npm install
```

### 配置数据库

```bash
# 创建本地 D1 数据库
npx wrangler d1 create sekai-pass-dev

# 运行迁移
npx wrangler d1 migrations apply sekai-pass-dev --local
```

### 配置环境变量

编辑 `wrangler.toml`：

```toml
name = "sekai-pass"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "sekai-pass-dev"
database_id = "your-database-id"

[vars]
JWT_SECRET = "your-jwt-secret"
SESSION_SECRET = "your-session-secret"
```

### 运行

```bash
npm run dev
# 访问 http://localhost:8787
```

## 部署

### 部署到 Cloudflare Workers

```bash
npm run deploy
```

### 配置生产数据库

```bash
# 创建生产 D1 数据库
npx wrangler d1 create sekai-pass

# 运行迁移
npx wrangler d1 migrations apply sekai-pass
```

### 配置密钥

```bash
# 设置 JWT 密钥
npx wrangler secret put JWT_SECRET

# 设置会话密钥
npx wrangler secret put SESSION_SECRET
```

## API 端点

### 认证端点

**注册：**

```http
POST /auth/register
Content-Type: application/json

{
  "username": "mafuyu",
  "email": "mafuyu@example.com",
  "password": "password123"
}
```

**登录：**

```http
POST /auth/login
Content-Type: application/json

{
  "email": "mafuyu@example.com",
  "password": "password123"
}
```

**登出：**

```http
POST /auth/logout
Authorization: Bearer {access_token}
```

### OAuth 端点

详见 [SEKAI Pass API 参考](/api/sekai-pass)。

## 安全特性

### 密码加密

使用 PBKDF2 + 随机盐：

```typescript
import { pbkdf2 } from 'crypto';

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(password, salt, 100000, 32, 'sha256');
  return `${Buffer.from(salt).toString('hex')}:${Buffer.from(hash).toString('hex')}`;
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const [saltHex, hashHex] = hash.split(':');
  const salt = Buffer.from(saltHex, 'hex');
  const expectedHash = Buffer.from(hashHex, 'hex');

  const actualHash = await pbkdf2(password, salt, 100000, 32, 'sha256');
  return crypto.timingSafeEqual(expectedHash, actualHash);
}
```

### PKCE

验证 code_verifier：

```typescript
async function verifyPKCE(verifier: string, challenge: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const computed = base64UrlEncode(hash);

  return computed === challenge;
}
```

### CSRF 防护

验证 state 参数：

```typescript
function verifyState(state: string, savedState: string): boolean {
  return crypto.timingSafeEqual(
    Buffer.from(state),
    Buffer.from(savedState)
  );
}
```

### Rate Limiting

使用 Cloudflare Workers KV：

```typescript
async function checkRateLimit(ip: string, limit: number, window: number): Promise<boolean> {
  const key = `ratelimit:${ip}`;
  const count = await env.KV.get(key);

  if (count && parseInt(count) >= limit) {
    return false;
  }

  await env.KV.put(key, (parseInt(count || '0') + 1).toString(), {
    expirationTtl: window
  });

  return true;
}
```

## 集成示例

### JavaScript

```javascript
// 授权
const authUrl = new URL('https://id.nightcord.de5.net/oauth/authorize');
authUrl.searchParams.set('client_id', 'YOUR_CLIENT_ID');
authUrl.searchParams.set('redirect_uri', 'https://your-app.com/callback');
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('scope', 'openid profile email');

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
```

## 贡献

参考 [CONTRIBUTING.md](https://github.com/25-ji-code-de/sekai-pass/blob/main/CONTRIBUTING.md)。

## 许可证

MIT License - 详见 [LICENSE](https://github.com/25-ji-code-de/sekai-pass/blob/main/LICENSE)。

## 相关链接

- [SEKAI Pass 集成指南](/guide/sekai-pass)
- [SEKAI Pass API 参考](/api/sekai-pass)
- [项目总览](/projects/overview)
