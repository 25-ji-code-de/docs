---
layout: home

hero:
  name: SEKAI
  text: 25時、コードで。
  tagline: 现代化的 Web 应用生态系统
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: 查看项目
      link: /projects/overview

features:
  - icon: 🔐
    title: 统一认证
    details: SEKAI Pass 提供 OAuth 2.1 + OIDC 单点登录，支持 PKCE 和 Private Key JWT

  - icon: ⚡
    title: 边缘计算
    details: 全部部署在 Cloudflare Workers / Pages，全球分布式边缘节点

  - icon: 🎯
    title: 统一网关
    details: API Gateway 提供统一入口，多层缓存，用户同步与成就

  - icon: 🤖
    title: AI 集成
    details: Nako AI 多人格对话 + 贴纸语义推荐，需 Pass 认证

  - icon: 💬
    title: 实时通信
    details: Nightcord 聊天室 WebSocket + SEKAI 标记语言 + Storage v2

  - icon: 📚
    title: 跨仓一致
    details: 客户端约定与文档协同；许可证以各仓库 LICENSE 为准
---

## 快速链接

- [Nightcord 聊天室](https://nightcord.de5.net)
- [25時作業風景](https://25ji.nightcord.de5.net)
- [SEKAI Hub](https://hub.nightcord.de5.net)
- [SEKAI Pass](https://id.nightcord.de5.net)
- [API 网关](https://api.nightcord.de5.net)
- [贴纸图鉴](https://sticker.nightcord.de5.net)

## 技术栈

- **运行平台**: Cloudflare Workers, Pages
- **数据存储**: D1, KV, R2 / OSS, Vectorize
- **编程语言**: TypeScript, JavaScript
- **框架**: Hono, Lucia Auth（Pass）
- **AI**: Workers AI / 可配置上游 LLM

## 生态架构

```
用户应用层
├─ Nightcord · 25ji · Hub · Stickers / Maker

服务层
├─ SEKAI Pass (SSO)
└─ Nako AI

基础设施层
├─ API Gateway
├─ Storage Worker (storage.* / r2.*)
└─ Stickers CDN
```

详见 [架构总览](/guide/architecture) 与 [前端客户端约定](/guide/client-conventions)。
