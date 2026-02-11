# Nako AI API

Nako AI 是基于 Cloudflare Workers AI 的智能助手，支持上下文记忆和向量搜索。

## 基础信息

- **Base URL**: `https://nako.nightcord.de5.net`
- **模型**: Qwen 3 30B
- **认证**: 无需认证（公开 API）

## 端点

### 聊天

与 Nako AI 对话。

```http
POST /api/chat
Content-Type: application/json
```

**请求体：**

```json
{
  "message": "你好，Nako！",
  "userId": "user123",
  "history": [
    {
      "role": "user",
      "content": "之前的消息"
    },
    {
      "role": "assistant",
      "content": "Nako 的回复"
    }
  ]
}
```

**参数说明：**

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `message` | string | 是 | 用户消息 |
| `userId` | string | 是 | 用户 ID（用于记忆） |
| `history` | array | 否 | 对话历史 |

**响应：**

```json
{
  "reply": "你好！我是 Nako，很高兴见到你！",
  "conversationId": "conv_123456"
}
```

### 流式聊天

流式返回 Nako 的回复。

```http
POST /api/chat/stream
Content-Type: application/json
```

**请求体：** 同 `/api/chat`

**响应：** Server-Sent Events (SSE)

```
data: {"type":"start","conversationId":"conv_123456"}

data: {"type":"token","content":"你"}

data: {"type":"token","content":"好"}

data: {"type":"done"}
```

### 搜索记忆

搜索 Nako 的记忆（向量搜索）。

```http
POST /api/memory/search
Content-Type: application/json
```

**请求体：**

```json
{
  "query": "关于音乐的对话",
  "userId": "user123",
  "limit": 5
}
```

**响应：**

```json
{
  "results": [
    {
      "content": "我喜欢听 Project SEKAI 的音乐",
      "timestamp": "2026-02-11T10:00:00Z",
      "score": 0.95
    }
  ]
}
```

### 清除记忆

清除用户的对话记忆。

```http
DELETE /api/memory/{userId}
```

**响应：**

```json
{
  "success": true,
  "message": "Memory cleared"
}
```

## 使用示例

### JavaScript

```javascript
// 基础对话
async function chatWithNako(message, userId) {
  const response = await fetch('https://nako.nightcord.de5.net/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message,
      userId,
      history: []
    })
  });

  const data = await response.json();
  return data.reply;
}

// 流式对话
async function streamChatWithNako(message, userId, onToken) {
  const response = await fetch('https://nako.nightcord.de5.net/api/chat/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message,
      userId
    })
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));
        if (data.type === 'token') {
          onToken(data.content);
        }
      }
    }
  }
}

// 使用
const reply = await chatWithNako('你好', 'user123');
console.log(reply);

// 流式使用
await streamChatWithNako('讲个故事', 'user123', (token) => {
  process.stdout.write(token);
});
```

### Python

```python
import requests

# 基础对话
def chat_with_nako(message, user_id):
    response = requests.post('https://nako.nightcord.de5.net/api/chat', json={
        'message': message,
        'userId': user_id,
        'history': []
    })
    return response.json()['reply']

# 使用
reply = chat_with_nako('你好', 'user123')
print(reply)
```

### cURL

```bash
# 基础对话
curl -X POST https://nako.nightcord.de5.net/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "你好",
    "userId": "user123",
    "history": []
  }'

# 搜索记忆
curl -X POST https://nako.nightcord.de5.net/api/memory/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "音乐",
    "userId": "user123",
    "limit": 5
  }'

# 清除记忆
curl -X DELETE https://nako.nightcord.de5.net/api/memory/user123
```

## 对话历史

Nako 支持多轮对话，通过 `history` 参数传递对话历史：

```javascript
const history = [
  { role: 'user', content: '我叫真冬' },
  { role: 'assistant', content: '你好，真冬！' },
  { role: 'user', content: '我的名字是什么？' }
];

const response = await fetch('https://nako.nightcord.de5.net/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: '我的名字是什么？',
    userId: 'user123',
    history
  })
});

// Nako 会回复: "你的名字是真冬。"
```

## 向量记忆

Nako 使用 Cloudflare Vectorize 存储对话记忆，支持语义搜索：

```javascript
// 搜索关于音乐的对话
const response = await fetch('https://nako.nightcord.de5.net/api/memory/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: '音乐',
    userId: 'user123',
    limit: 5
  })
});

const { results } = await response.json();
results.forEach(result => {
  console.log(`[${result.score.toFixed(2)}] ${result.content}`);
});
```

## 错误处理

API 使用标准 HTTP 状态码：

- `200` - 成功
- `400` - 请求参数错误
- `429` - 速率限制
- `500` - 服务器错误

**错误响应：**

```json
{
  "error": true,
  "message": "Invalid request",
  "details": "Missing required field: message"
}
```

## 速率限制

| 端点 | 限制 |
|------|------|
| `/api/chat` | 20 次/分钟/userId |
| `/api/chat/stream` | 10 次/分钟/userId |
| `/api/memory/search` | 50 次/分钟/userId |

超过限制返回 `429 Too Many Requests`。

## 最佳实践

### 1. 管理对话历史

保留最近 10 条消息，避免上下文过长：

```javascript
function trimHistory(history, maxLength = 10) {
  return history.slice(-maxLength);
}
```

### 2. 错误重试

网络错误时自动重试：

```javascript
async function chatWithRetry(message, userId, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await chatWithNako(message, userId);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

### 3. 流式显示

使用流式 API 提升用户体验：

```javascript
let fullReply = '';

await streamChatWithNako('讲个故事', 'user123', (token) => {
  fullReply += token;
  updateUI(fullReply); // 实时更新 UI
});
```

## 相关链接

- [Nako AI 项目详情](/projects/nako)
- [GitHub 仓库](https://github.com/25-ji-code-de/nako)
- [Nightcord 集成示例](https://github.com/25-ji-code-de/nightcord)
