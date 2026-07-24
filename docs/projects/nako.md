# Nako AI

Nako 是 SEKAI 生态的对话与贴纸语义推荐服务。

## 项目信息

| 项 | 值 |
|----|-----|
| 类型 | AI 助手 API |
| 技术栈 | TypeScript, Workers AI / 上游 LLM, Vectorize |
| 生产 | [nako.nightcord.de5.net](https://nako.nightcord.de5.net) |
| GitHub | [25-ji-code-de/nako](https://github.com/25-ji-code-de/nako) |
| 认证 | SEKAI Pass Bearer（`AUTH_DB`） |

## 功能特性

- 多人格（`?persona=`）：nako / asagi / miku / yui …
- 非流式 JSON + 流式 SSE
- Vectorize 贴纸推荐（回复内嵌 `[assetbundleName]`）
- 成功对话后写入 Gateway 同构 D1 统计（`{persona}_conversations`）

## 代码结构

```
src/
├── index.ts              # 路由 · CORS · /health
├── handlers/chat.ts · recommend.ts
├── middleware/auth.ts
├── personas/             # 人设与模型配置
├── models/               # workers-ai / openai 兼容
├── services/ai.ts · sticker.ts
└── utils/validation.ts · response.ts
```

## 协作

- **Pass**：token 校验
- **Nightcord**：`nako-ai-service.js` 调用
- **Gateway / Hub**：统计与看板
- **Stickers**：向量元数据来源

详见 [API 参考](/api/nako)。
