# 架构总览

SEKAI 生态采用分层架构设计，各层职责清晰，松耦合。

## 架构图

```
┌─────────────────────────────────────────────────────────────┐
│                         用户应用层                           │
├─────────────────────────────────────────────────────────────┤
│  nightcord.de5.net           25ji.nightcord.de5.net        │
│  (Nightcord 聊天室)           (25時作業風景)                 │
│                                                             │
│  hub.nightcord.de5.net       sticker.nightcord.de5.net     │
│  (SEKAI Hub 门户)             (贴纸图鉴)                     │
│                                                             │
│  st.nightcord.de5.net        (stickers-maker 生成器)        │
└─────────────────────────────────────────────────────────────┘
                              ↓ OAuth / Bearer
┌─────────────────────────────────────────────────────────────┐
│                          服务层                              │
├─────────────────────────────────────────────────────────────┤
│  id.nightcord.de5.net        nako.nightcord.de5.net        │
│  (SEKAI Pass SSO / OIDC)     (Nako AI 助手)                  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                        基础设施层                            │
├─────────────────────────────────────────────────────────────┤
│  api.nightcord.de5.net       storage.nightcord.de5.net     │
│  (Gateway: 音乐/同步/统计)    (对象存储上传 + SEKAI v2)       │
│                                                             │
│  r2.nightcord.de5.net        assets / sticker CDN          │
│  (公开媒体 resolve)           (静态资源)                      │
└─────────────────────────────────────────────────────────────┘
```

## 域名架构

### 用户入口（应用层）

| 域名 | 项目 | 说明 |
|------|------|------|
| `nightcord.de5.net` | nightcord | 实时聊天（SEKAI 标记语言） |
| `25ji.nightcord.de5.net` | 25ji-sagyo | 作业陪伴 / 番茄钟 / 音乐 |
| `hub.nightcord.de5.net` | hub | 生态门户与用户中心 |
| `sticker.nightcord.de5.net` | stickers | 贴纸图鉴 |
| `st.nightcord.de5.net` | stickers-maker | 贴纸生成器 |

### 服务层

| 域名 | 项目 | 说明 |
|------|------|------|
| `id.nightcord.de5.net` | sekai-pass | SSO / OAuth 2.1 PKCE / OIDC |
| `nako.nightcord.de5.net` | nako | AI 对话 + 贴纸推荐 |

### 基础设施层

| 域名 | 项目 | 说明 |
|------|------|------|
| `api.nightcord.de5.net` | gateway | 音乐聚合、用户同步、成就、事件 |
| `storage.nightcord.de5.net` | storage-worker | 上传（legacy + `/v2/upload`） |
| `r2.nightcord.de5.net` | storage-worker | 公开媒体 `/images|files|stickers/{uuid}` |

## 组件如何协同

```
前端应用 ──PKCE──► SEKAI Pass (id.*)
   │                    │
   │ Bearer token       │ AUTH_DB (D1) 被 gateway / nako 直读校验
   ▼                    ▼
gateway (api.*)  ◄── 用户同步 / 统计 / 成就
nako (nako.*)    ◄── AI 对话（同样 Bearer）
storage (storage.* / r2.*)  ◄── 文件上传（Nightcord SEKAI v2）
stickers (sticker.*) ──autocomplete.json──► gateway 代理 / nightcord UI
```

### 认证

1. 各前端（hub / 25ji / nightcord / stickers-maker）实现 **OAuth 2.1 + PKCE** 客户端。
2. Token 存本地；access 将过期时 **single-flight refresh**（避免并发刷新打爆 token endpoint）。
3. gateway / nako 通过 **D1 `AUTH_DB`** 直接校验 `access_tokens`，不二次 HTTP 调 Pass。

### 推荐的客户端约定（跨仓对齐）

| 主题 | 约定 |
|------|------|
| PKCE `state` / `code_verifier` | `sessionStorage`（tab 作用域），不要进长期 `localStorage` |
| access / refresh | `localStorage`，键名可用应用前缀隔离（如 nightcord 的 `sekai_pass_*`） |
| 刷新窗口 | 过期前 5 分钟刷新；并发共用同一 Promise |
| `isAuthenticated` | 有 refresh token 即视为已登录（access 过期可静默刷新） |
| API 错误 | 网关：`{ error: true, message }`；Nako：`{ success: false, error: { code, message } }` |
| CORS | 允许 `Authorization`；用户写接口允许 `PUT` |

> 长期目标：抽出 `@25-ji-code-de/sekai-auth` 浏览器 SDK，统一 hub / 25ji / nightcord 的 PKCE 客户端。目前以「约定 + 复制改进」对齐。

## 数据流

### 认证流程

```
用户 → 应用 (hub / nightcord / 25ji …)
  ↓
点击「使用 SEKAI Pass 登录」
  ↓
跳转 id.nightcord.de5.net/oauth/authorize?…&code_challenge=…
  ↓
授权后回调 /callback
  ↓
用 code + code_verifier 换 access_token / refresh_token
  ↓
调用 /oauth/userinfo → 展示用户信息
```

### API 请求流程

```
应用 → api.nightcord.de5.net/user/*   (Bearer)
应用 → nako.nightcord.de5.net/api/*   (Bearer)
Nightcord 上传 → storage…/v2/upload → 消息内嵌 <$SEKAI:…:uuid>
公开读媒体 → r2…/images/{uuid}
```

### 用户数据同步（25ji）

```
25ji 本地 localStorage
  ↕ POST/GET /user/sync?project=25ji
gateway D1 user_sync_data（版本合并）
  → hub 仪表盘读取展示
```
