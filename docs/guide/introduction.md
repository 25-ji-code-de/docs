# 介绍

欢迎来到 SEKAI Platform 文档！

## 什么是 SEKAI Platform？

SEKAI Platform（SEKAI 生态）是一个现代化的 Web 应用生态系统，灵感来自《Project SEKAI》中的"25時、Nightcordで。"组合。

生态包含多个相互协作的项目：

- **Nightcord** - 实时聊天应用，支持 WebSocket 通信和 AI 助手
- **25時作業風景** - 沉浸式学习陪伴工具，提供番茄钟、音乐播放等功能
- **SEKAI Pass** - OAuth 2.1 + OIDC 单点登录系统
- **Nako AI** - 基于 Qwen 3 30B 的聊天机器人 API
- **Gateway** - 统一 API 网关，提供缓存、监控、日志
- **Stickers** - 贴纸资源服务

## 核心特性

### 🔐 统一认证

SEKAI Pass 提供完整的 OAuth 2.1 和 OpenID Connect 1.0 实现：

- 强制 PKCE（Proof Key for Code Exchange）
- Private Key JWT 客户端认证
- 刷新令牌自动轮换
- ES256 签名的 ID Token

### ⚡ 边缘计算

所有服务部署在 Cloudflare 边缘网络：

- Workers - 无服务器计算
- Pages - 静态站点托管
- D1 - 分布式 SQLite 数据库
- KV - 键值存储
- R2 - 对象存储
- Vectorize - 向量数据库

### 🎯 统一网关

API Gateway 作为生态的统一入口：

- 多层缓存策略（Edge 30s, R2 3min）
- 异步日志和监控（零性能影响）
- 模块化架构，易于扩展
- CORS 支持

### 🤖 AI 集成

Nako AI 提供智能对话和表情推荐：

- Qwen 3 30B 对话模型
- 动态人格系统（时间感知）
- 向量搜索（语义匹配）
- 流式响应（SSE）

## 设计原则

1. **模块化** - 每个项目职责单一，松耦合
2. **开放** - MIT License，完善的文档和示例
3. **性能** - 边缘计算 + 多层缓存
4. **安全** - OAuth 2.1 合规，HTTPS 强制
5. **可观测** - 完善的日志和监控

## 下一步

- [架构总览](/guide/architecture) - 了解生态架构
- [快速开始](/guide/getting-started) - 开始使用
- [项目总览](/projects/overview) - 查看所有项目
