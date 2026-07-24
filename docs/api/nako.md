# Nako AI API

Nako 是 SEKAI 生态的对话与贴纸推荐服务，部署在 Cloudflare Workers。

## 基础信息

| 项 | 值 |
|----|-----|
| Base URL | `https://nako.nightcord.de5.net` |
| 认证 | **必需** `Authorization: Bearer <SEKAI Pass access_token>` |
| 公开 | `GET /` · `GET /health`（无认证） |

模型与 endpoint 可按人设配置（Workers AI 或上游 OpenAI 兼容 API）。

## 端点

### 健康检查

```http
GET /health
```

```json
{ "service": "nako", "status": "ok", "version": "1.0.0", "routes": ["/api/chat", "/api/recommend"] }
```

### 聊天

```http
POST /api/chat?persona=nako
Authorization: Bearer <token>
Content-Type: application/json
```

**Query**

| 参数 | 说明 |
|------|------|
| `persona` | 可选，默认 nako。如 `asagi` / `miku` / `yui` 等 |

**Body**

```json
{
  "userId": "display-name-or-id",
  "message": "今天天气真好啊",
  "history": [
    { "userId": "Someone", "message": "早上好", "isBot": false },
    { "userId": "Nako", "message": "哼...早什么早", "isBot": true }
  ],
  "stream": false
}
```

| 字段 | 类型 | 必需 | 限制 |
|------|------|------|------|
| `userId` | string | 是 | ≤128 |
| `message` | string | 是 | 非空，≤2000 |
| `history` | array | 否 | ≤50 条，每条 message ≤2000 |
| `stream` | boolean | 否 | 默认 false |

**成功（非流式）**

```json
{
  "success": true,
  "response": "哼,天气好又怎样...[stamp0004]",
  "usage": {
    "promptTokens": 411,
    "completionTokens": 187,
    "totalTokens": 598
  },
  "reasoningContent": "可选"
}
```

贴纸推荐（若绑定 Vectorize）会在回复末尾插入 `[assetbundleName]`。

**失败**

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

常见 `code`：`UNAUTHORIZED` · `INVALID_JSON` · `INVALID_REQUEST` · `INVALID_PERSONA` · `INTERNAL_ERROR`。

### 流式聊天

同一路径，`stream: true`。响应 `Content-Type: text/event-stream`，OpenAI 风格 SSE chunk；结束前可能追加贴纸 chunk，最后 `data: [DONE]`。

### 贴纸推荐

```http
GET /api/recommend?prompt=开心&topK=5
POST /api/recommend
Authorization: Bearer <token>
```

POST body：

```json
{
  "prompt": "开心",
  "topK": 5,
  "excludeRecent": ["最近消息1", "含[stamp0001]的消息"]
}
```

```json
{
  "success": true,
  "stickers": [
    { "assetbundleName": "stamp0004", "name": "…", "score": 0.82 }
  ],
  "query": "开心"
}
```

`prompt` 最长 500；`topK` 1–20。Vectorize 未配置时返回 503 `VECTORIZE_UNAVAILABLE`。

## 使用统计

成功生成后，Nako 向 Gateway 所用 D1（`DB`）写入：

- `user_activities.event_type` = `{persona}_conversation`
- `user_stats.metric_name` = `{persona}_conversations`

Hub 仪表盘会汇总所有 `*_conversations`。

## 示例

```bash
curl -X POST 'https://nako.nightcord.de5.net/api/chat?persona=nako' \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId":"K","message":"你好","history":[],"stream":false}'
```

```javascript
const res = await fetch('https://nako.nightcord.de5.net/api/chat?persona=nako', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    userId: 'K',
    message: '你好',
    history: [],
    stream: false,
  }),
});
const data = await res.json();
if (data.success) console.log(data.response);
```

## 相关链接

- [GitHub](https://github.com/25-ji-code-de/nako)
- [前端客户端约定](/guide/client-conventions)
- [项目详情](/projects/nako)
