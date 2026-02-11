# Nako AI

Nako AI 是基于 Cloudflare Workers AI 的智能助手，支持上下文记忆和向量搜索。

## 项目信息

- **类型**: AI 助手
- **技术栈**: TypeScript, Workers AI (Qwen 3 30B), Vectorize
- **生产环境**: [nako.nightcord.de5.net](https://nako.nightcord.de5.net)
- **GitHub**: [25-ji-code-de/nako](https://github.com/25-ji-code-de/nako)
- **代码量**: ~2,000 行

## 功能特性

### AI 对话

- **Qwen 3 30B** - 高质量中文对话模型
- **流式响应** - 实时显示 AI 回复
- **上下文记忆** - 记住对话历史
- **多轮对话** - 支持连续对话

### 向量搜索

- **Cloudflare Vectorize** - 向量数据库
- **语义搜索** - 基于语义相似度搜索
- **记忆检索** - 检索相关对话历史
- **自动嵌入** - 自动生成文本嵌入

### 个性化

- **用户记忆** - 每个用户独立记忆
- **记忆管理** - 清除、搜索记忆
- **上下文窗口** - 智能管理上下文长度

## 技术架构

### 后端架构

```
src/
├── index.ts             # 入口文件
├── routes/
│   ├── chat.ts          # 聊天端点
│   └── memory.ts        # 记忆端点
├── lib/
│   ├── ai.ts            # Workers AI 封装
│   ├── vectorize.ts     # Vectorize 封装
│   └── memory.ts        # 记忆管理
├── middleware/
│   ├── ratelimit.ts     # 速率限制
│   └── cors.ts          # CORS 中间件
└── types/
    └── index.ts         # 类型定义
```

### Workers AI 集成

```typescript
import { Ai } from '@cloudflare/ai';

const ai = new Ai(env.AI);

const response = await ai.run('@cf/qwen/qwen3-30b', {
  messages: [
    { role: 'system', content: 'You are Nako, a helpful AI assistant.' },
    { role: 'user', content: 'Hello!' }
  ],
  stream: true
});
```

### Vectorize 集成

```typescript
// 生成嵌入
const embedding = await ai.run('@cf/baai/bge-base-en-v1.5', {
  text: 'Hello, world!'
});

// 存储到 Vectorize
await env.VECTORIZE.insert([{
  id: 'msg_123',
  values: embedding.data[0],
  metadata: {
    userId: 'user123',
    content: 'Hello, world!',
    timestamp: Date.now()
  }
}]);

// 搜索
const results = await env.VECTORIZE.query(embedding.data[0], {
  topK: 5,
  filter: { userId: 'user123' }
});
```

## 本地开发

### 克隆项目

```bash
git clone https://github.com/25-ji-code-de/nako.git
cd nako
```

### 安装依赖

```bash
npm install
```

### 配置

编辑 `wrangler.toml`：

```toml
name = "nako"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[ai]
binding = "AI"

[[vectorize]]
binding = "VECTORIZE"
index_name = "nako-memory"
```

### 创建 Vectorize 索引

```bash
npx wrangler vectorize create nako-memory \
  --dimensions=768 \
  --metric=cosine
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

### 配置生产环境

```bash
# 创建生产 Vectorize 索引
npx wrangler vectorize create nako-memory-prod \
  --dimensions=768 \
  --metric=cosine
```

## API 端点

详见 [Nako AI API 参考](/api/nako)。

## 提示词工程

### 系统提示词

```typescript
const SYSTEM_PROMPT = `你是 Nako，一个友好、乐于助人的 AI 助手。

你的特点：
- 友好、耐心、善解人意
- 回答简洁明了，不啰嗦
- 擅长编程、技术问题
- 了解 Project SEKAI 和 25時、Nightcordで。

回答时：
- 使用简体中文
- 避免过度正式的语气
- 适当使用表情符号
- 不要重复用户的问题`;
```

### 上下文管理

```typescript
function trimHistory(history: Message[], maxTokens: number = 4000): Message[] {
  let totalTokens = 0;
  const trimmed: Message[] = [];

  for (let i = history.length - 1; i >= 0; i--) {
    const tokens = estimateTokens(history[i].content);
    if (totalTokens + tokens > maxTokens) break;

    trimmed.unshift(history[i]);
    totalTokens += tokens;
  }

  return trimmed;
}
```

### 记忆检索

```typescript
async function retrieveRelevantMemories(
  query: string,
  userId: string,
  limit: number = 3
): Promise<string[]> {
  const embedding = await generateEmbedding(query);

  const results = await env.VECTORIZE.query(embedding, {
    topK: limit,
    filter: { userId }
  });

  return results.matches.map(match => match.metadata.content);
}
```

## 性能优化

### 流式响应

```typescript
async function streamChat(request: Request): Promise<Response> {
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  // 异步处理
  (async () => {
    const stream = await ai.run('@cf/qwen/qwen3-30b', {
      messages,
      stream: true
    });

    for await (const chunk of stream) {
      await writer.write(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
    }

    await writer.close();
  })();

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}
```

### 缓存嵌入

```typescript
// 缓存常见查询的嵌入
const embeddingCache = new Map<string, number[]>();

async function getCachedEmbedding(text: string): Promise<number[]> {
  if (embeddingCache.has(text)) {
    return embeddingCache.get(text)!;
  }

  const embedding = await generateEmbedding(text);
  embeddingCache.set(text, embedding);

  return embedding;
}
```

### 批量插入

```typescript
// 批量插入记忆
async function batchInsertMemories(memories: Memory[]): Promise<void> {
  const vectors = await Promise.all(
    memories.map(async (memory) => ({
      id: memory.id,
      values: await generateEmbedding(memory.content),
      metadata: {
        userId: memory.userId,
        content: memory.content,
        timestamp: memory.timestamp
      }
    }))
  );

  await env.VECTORIZE.insert(vectors);
}
```

## 集成示例

### JavaScript

```javascript
// 基础对话
const response = await fetch('https://nako.nightcord.de5.net/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: '你好，Nako！',
    userId: 'user123',
    history: []
  })
});

const { reply } = await response.json();
console.log(reply);

// 流式对话
const response = await fetch('https://nako.nightcord.de5.net/api/chat/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: '讲个故事',
    userId: 'user123'
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  console.log(chunk);
}
```

### Python

```python
import requests

# 基础对话
response = requests.post('https://nako.nightcord.de5.net/api/chat', json={
    'message': '你好',
    'userId': 'user123',
    'history': []
})

print(response.json()['reply'])
```

## 贡献

参考 [CONTRIBUTING.md](https://github.com/25-ji-code-de/nako/blob/main/CONTRIBUTING.md)。

## 许可证

MIT License - 详见 [LICENSE](https://github.com/25-ji-code-de/nako/blob/main/LICENSE)。

## 相关链接

- [Nako AI API 参考](/api/nako)
- [Nightcord 集成](/projects/nightcord)
- [项目总览](/projects/overview)
