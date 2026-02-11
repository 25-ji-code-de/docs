---
layout: home

hero:
  name: SEKAI Platform
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
    details: 全部部署在 Cloudflare Workers，全球分布式边缘节点，极速响应

  - icon: 🎯
    title: 统一网关
    details: API Gateway 提供统一入口，多层缓存策略，完善的监控和日志

  - icon: 🤖
    title: AI 集成
    details: Nako AI 基于 Qwen 3 30B，支持向量搜索和智能表情推荐

  - icon: 💬
    title: 实时通信
    details: Nightcord 聊天室基于 WebSocket，事件驱动架构，模块化设计

  - icon: 📚
    title: 开源友好
    details: 所有项目 MIT License，完善的文档和示例，欢迎贡献
---

## 快速链接

- [Nightcord 聊天室](https://nightcord.de5.net) - 实时聊天应用
- [25時作業風景](https://25ji.nightcord.de5.net) - 沉浸式学习工具
- [SEKAI Pass](https://id.nightcord.de5.net) - SSO 认证系统
- [API 网关](https://api.nightcord.de5.net) - 统一 API 入口

## 技术栈

- **运行平台**: Cloudflare Workers, Pages
- **数据存储**: D1, KV, R2, Vectorize
- **编程语言**: TypeScript, JavaScript
- **框架**: Hono, Lucia Auth
- **AI 模型**: Qwen 3 30B, Qwen 3 Embedding

## 生态架构

```
用户应用层
├─ Nightcord (聊天室)
├─ 25ji (学习工具)
└─ 未来项目...

服务层
├─ SEKAI Pass (SSO)
└─ Nako AI (聊天机器人)

基础设施层
├─ API Gateway (统一入口)
├─ Assets CDN (静态资源)
└─ Stickers (贴纸服务)
```
