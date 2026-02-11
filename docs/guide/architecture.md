# 架构总览

SEKAI 生态采用三层架构设计，各层职责清晰，松耦合。

## 架构图

```
┌─────────────────────────────────────────────────────────┐
│                      用户应用层                          │
├─────────────────────────────────────────────────────────┤
│  nightcord.de5.net          25ji.nightcord.de5.net     │
│  (Nightcord 聊天室)          (25時作業風景)             │
│                                                          │
│  sekai.nightcord.de5.net    (未来项目...)               │
│  (SEKAI Hub - 规划中)                                   │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                       服务层                             │
├─────────────────────────────────────────────────────────┤
│  id.nightcord.de5.net       nako.nightcord.de5.net     │
│  (SEKAI Pass SSO)           (Nako AI 助手)              │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                    基础设施层                            │
├─────────────────────────────────────────────────────────┤
│  api.nightcord.de5.net      assets.nightcord.de5.net   │
│  (统一 API 网关)             (静态资源 CDN)              │
│                                                          │
│  sticker.nightcord.de5.net                              │
│  (贴纸资源服务)                                          │
└─────────────────────────────────────────────────────────┘
```

## 域名架构

### 用户入口（应用层）

- `nightcord.de5.net` - Nightcord 聊天室（主应用）
- `25ji.nightcord.de5.net` - 25時作業風景
- `sekai.nightcord.de5.net` - SEKAI Hub（规划中）

### 服务层

- `id.nightcord.de5.net` - SEKAI Pass（SSO 认证）
- `nako.nightcord.de5.net` - Nako AI 助手

### 基础设施层

- `api.nightcord.de5.net` - 统一 API 网关
- `assets.nightcord.de5.net` - 静态资源 CDN
- `sticker.nightcord.de5.net` - 贴纸资源

## 数据流

### 认证流程

```
用户 → Nightcord
  ↓
点击"使用 SEKAI Pass 登录"
  ↓
跳转到 id.nightcord.de5.net
  ↓
OAuth 授权（PKCE）
  ↓
回调到 Nightcord
  ↓
获取 Access Token
  ↓
调用 /oauth/userinfo
  ↓
获取用户信息，登录成功
```

### API 请求流程

```
Nightcord → api.nightcord.de5.net/sekai/stickers/autocomplete.json
  ↓
检查 Edge Cache (30s)
  ↓ MISS
检查源站 (sticker.nightcord.de5.net)
  ↓
返回数据 + 写入 Edge Cache
  ↓
返回给 Nightcord
```

### 音乐数据流程

```
25ji → api.nightcord.de5.net/sekai/music_data.json
  ↓
检查 Edge Cache (30s)
  ↓ MISS
检查 R2 Cache (3min fresh, 10min stale)
  ↓ MISS
并行获取 3 个上游源
  ├─ sekai-world.github.io/musics.json
  ├─ sekai-world.github.io/musicVocals.json
  └─ i18n-json.sekai.best/music_titles.json
  ↓
合并 + 压缩 + 存储到 R2
  ↓
返回给 25ji + 写入 Edge Cache
```

## 技术栈

### 运行平台

- **Cloudflare Workers** - 无服务器计算
- **Cloudflare Pages** - 静态站点托管
- **Cloudflare D1** - SQLite 数据库
- **Cloudflare KV** - 键值存储
- **Cloudflare R2** - 对象存储
- **Cloudflare Vectorize** - 向量数据库

### 编程语言

- **TypeScript** - sekai_pass, nightcord-nako, pjsekai
- **JavaScript** - nightcord, 25ji_sagyo_fukei, stickers

### 框架和库

- **Hono** - 高性能 Web 框架
- **Lucia Auth** - 认证库
- **HLS.js** - 视频播放
- **Web Audio API** - 音频处理

## 缓存策略

### API 网关缓存

| 端点 | Edge TTL | R2 Fresh | R2 Stale | 说明 |
|------|----------|----------|----------|------|
| `/sekai/music_data.json` | 30s | 3min | 10min | 音乐数据 |
| `/sekai/stickers/autocomplete.json` | 1h | - | - | 贴纸索引 |

### 静态资源缓存

| 域名 | Edge TTL | Browser TTL | 说明 |
|------|----------|-------------|------|
| `assets.nightcord.de5.net` | 1年 | 1个月 | 静态资源 |
| `sticker.nightcord.de5.net` | 1年 | 1个月 | 贴纸图片 |

## 监控和日志

所有请求都会记录以下指标：

- **请求指标** - 时长、状态码、国家、缓存状态
- **错误日志** - 上下文、堆栈、额外信息
- **缓存事件** - 命中/未命中、来源（edge/r2/origin）

日志通过 `wrangler tail` 实时查看，未来可集成 Analytics Engine。

## 下一步

- [快速开始](/guide/getting-started) - 开始使用
- [SEKAI Pass 集成](/guide/sekai-pass) - 接入 SSO
- [API 网关使用](/guide/api-gateway) - 使用统一 API
