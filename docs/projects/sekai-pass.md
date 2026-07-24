# SEKAI Pass

SEKAI Pass 是生态 SSO：OAuth 2.1 + OIDC，Cloudflare Workers + D1 + KV。

## 项目信息

| 项 | 值 |
|----|-----|
| 类型 | SSO |
| 技术栈 | TypeScript, Hono, Lucia Auth, D1, KV |
| 生产 | [id.nightcord.de5.net](https://id.nightcord.de5.net) |
| GitHub | [25-ji-code-de/sekai-pass](https://github.com/25-ji-code-de/sekai-pass) |

## 功能特性（已实现）

- 授权码 + **强制 PKCE (S256)**
- Refresh token（含轮换）
- OIDC Discovery · JWKS · ID Token (ES256)
- UserInfo / 会话（Lucia）
- 用户资料：display_name、avatar（Storage v2）、bio
- Turnstile / PoW 等反滥用（按环境配置）

## 协作

- **gateway / nako** 绑定 `AUTH_DB` 直读 `access_tokens`
- 前端：hub · 25ji · nightcord · stickers-maker

API 细节：[API 参考](/api/sekai-pass) · 集成：[客户端约定](/guide/client-conventions)
