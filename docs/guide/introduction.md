# 介绍

欢迎来到 SEKAI 文档！

## 什么是 SEKAI？

SEKAI 是一个现代化的 Web 应用生态系统，灵感来自《Project SEKAI》中的"25時、Nightcordで。"组合。

生态包含多个相互协作的项目：

| 项目 | 角色 |
|------|------|
| **Nightcord** | 实时聊天（SEKAI 标记语言、WebSocket、Nako AI） |
| **25時作業風景** | 学习陪伴（番茄钟、曲库、云同步） |
| **SEKAI Hub** | 生态门户与用户数据看板 |
| **SEKAI Pass** | OAuth 2.1 + OIDC 单点登录 |
| **Nako AI** | 对话 + 贴纸语义推荐 |
| **Gateway** | 统一 API（音乐、同步、统计、成就） |
| **Storage Worker** | OSS 代理与 SEKAI v2 资源门面 |
| **Stickers / Maker** | 贴纸图鉴与生成器 |

## 核心特性

### 🔐 统一认证

SEKAI Pass 提供完整的 OAuth 2.1 和 OpenID Connect 1.0 实现：

- 强制 PKCE（Proof Key for Code Exchange）
- Private Key JWT 客户端认证
- 刷新令牌自动轮换
- ES256 签名的 ID Token

跨前端约定见 [前端客户端约定](/guide/client-conventions)。

### ⚡ 边缘计算

所有服务部署在 Cloudflare 边缘网络：

- Workers - 无服务器计算
- Pages - 静态站点托管
- D1 - 分布式 SQLite 数据库
- KV - 键值存储
- R2 / OSS - 对象存储
- Vectorize - 向量数据库

### 🎯 统一网关与存储

- **Gateway** — 音乐数据多层缓存、用户同步/成就/事件
- **Storage** — 上传与 UUID 解析，对接 SEKAI v2 消息载荷

### 🤖 AI 集成

Nako AI 提供智能对话和表情推荐：

- 可配置上游模型 / Workers AI
- 动态人格系统
- 向量搜索（语义匹配贴纸）
- 流式响应（SSE）

## 设计原则

1. **模块化** - 每个项目职责单一，松耦合
2. **开放** - 完善的文档和示例（许可证以各仓库为准）
3. **性能** - 边缘计算 + 多层缓存
4. **安全** - OAuth 2.1 合规，HTTPS 强制
5. **可观测** - 完善的日志和监控
6. **跨仓一致** - 认证/CORS/错误形状对齐，便于抽 SDK

> **注意**：生态内仓库许可证并不统一（如 Apache-2.0、AGPL-3.0、MIT 等），贡献与再分发前请阅读对应仓库的 `LICENSE`。

## 下一步

- [架构总览](/guide/architecture) - 了解生态架构
- [前端客户端约定](/guide/client-conventions) - 对接 Pass / Gateway
- [快速开始](/guide/getting-started) - 开始使用
- [项目总览](/projects/overview) - 查看所有项目
