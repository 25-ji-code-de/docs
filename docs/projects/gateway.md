# Gateway

Gateway 是 SEKAI 生态的统一 API 网关，提供高性能、多层缓存的数据服务。

## 项目信息

- **类型**: API 网关
- **技术栈**: TypeScript, Cloudflare Workers, R2
- **生产环境**: [api.nightcord.de5.net](https://api.nightcord.de5.net)
- **GitHub**: [25-ji-code-de/gateway](https://github.com/25-ji-code-de/gateway)
- **代码量**: ~500 行

## 功能特性

### 统一 API 入口

- **单一域名** - 所有 API 请求通过 `api.nightcord.de5.net`
- **路由管理** - 模块化路由设计
- **版本控制** - 支持 API 版本管理（规划中）

### 多层缓存

- **Edge Cache** - Cloudflare 边缘节点缓存
- **R2 Cache** - 对象存储二级缓存
- **Stale-While-Revalidate** - 后台刷新策略

### 数据聚合

- **音乐数据** - 聚合多个上游源
- **贴纸数据** - 代理贴纸服务
- **压缩优化** - 减少数据传输量

### 监控和日志

- **请求日志** - 记录所有请求
- **性能指标** - 响应时间、缓存命中率
- **错误追踪** - 详细错误日志

## 技术架构

### 后端架构

```
src/
├── index.ts             # 入口文件
├── routes/
│   ├── sekai.ts         # SEKAI 相关 API
│   └── health.ts        # 健康检查
├── lib/
│   ├── cache.ts         # 缓存管理
│   ├── fetch.ts         # 上游请求
│   └── logger.ts        # 日志记录
├── middleware/
│   ├── cors.ts          # CORS 中间件
│   └── ratelimit.ts     # 速率限制
└── types/
    └── index.ts         # 类型定义
```

### 缓存策略

**音乐数据缓存：**

```typescript
const CACHE_CONFIG = {
  edge: {
    ttl: 30,              // 30 秒
    swr: 60               // 60 秒 stale-while-revalidate
  },
  r2: {
    fresh: 180,           // 3 分钟
    stale: 600            // 10 分钟
  }
};
```

**缓存流程：**

```
请求 → Edge Cache (30s)
  ↓ MISS
R2 Cache (3min fresh, 10min stale)
  ↓ MISS
并行获取上游源
  ├─ sekai-world.github.io/musics.json
  ├─ sekai-world.github.io/musicVocals.json
  └─ i18n-json.sekai.best/music_titles.json
  ↓
合并 + 压缩 + 存储到 R2
  ↓
返回数据 + 写入 Edge Cache
```

### 数据聚合

```typescript
async function aggregateMusicData(): Promise<MusicData> {
  // 并行获取 3 个上游源
  const [musics, vocals, titles] = await Promise.all([
    fetch('https://sekai-world.github.io/sekai-master-db-diff/musics.json'),
    fetch('https://sekai-world.github.io/sekai-master-db-diff/musicVocals.json'),
    fetch('https://i18n-json.sekai.best/music_titles.json')
  ]);

  // 合并数据
  const songs = musics.map(music => ({
    i: music.id,
    t: titles[music.id] || music.title,
    p: music.composer,
    d: music.duration,
    c: vocals.find(v => v.musicId === music.id)?.characters.join(', ')
  }));

  return { songs };
}
```

## 本地开发

### 克隆项目

```bash
git clone https://github.com/25-ji-code-de/gateway.git
cd gateway
```

### 安装依赖

```bash
npm install
```

### 配置

编辑 `wrangler.toml`：

```toml
name = "gateway"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[r2_buckets]]
binding = "R2"
bucket_name = "sekai-cache"
```

### 创建 R2 Bucket

```bash
npx wrangler r2 bucket create sekai-cache
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
# 创建生产 R2 Bucket
npx wrangler r2 bucket create sekai-cache-prod
```

## API 端点

### 音乐数据

```http
GET /sekai/music_data.json
```

**响应：**

```json
{
  "songs": [
    {
      "i": 1,
      "t": "Tell Your World",
      "p": "kz (livetune)",
      "d": 126,
      "c": "初音ミク"
    }
  ]
}
```

**缓存控制：**

- 添加 `?refresh=1` 强制刷新缓存

### 贴纸数据

```http
GET /sekai/stickers/autocomplete.json
```

**响应：**

```json
{
  "stamp": {
    "未来：请多关照": "weilai_qingduoguanzhao"
  },
  "character": {
    "未来": "weilai"
  }
}
```

### 健康检查

```http
GET /health
```

**响应：**

```json
{
  "status": "ok",
  "timestamp": "2026-02-11T10:00:00Z",
  "version": "2.0.0"
}
```

## 缓存实现

### Edge Cache

```typescript
async function handleWithEdgeCache(request: Request): Promise<Response> {
  const cache = caches.default;
  const cacheKey = new Request(request.url, request);

  // 尝试从 Edge Cache 获取
  let response = await cache.match(cacheKey);

  if (!response) {
    // 缓存未命中，获取数据
    response = await fetchData(request);

    // 写入 Edge Cache
    const headers = new Headers(response.headers);
    headers.set('Cache-Control', 'public, max-age=30, s-maxage=30');

    response = new Response(response.body, {
      status: response.status,
      headers
    });

    await cache.put(cacheKey, response.clone());
  }

  return response;
}
```

### R2 Cache

```typescript
async function handleWithR2Cache(key: string): Promise<Response | null> {
  const object = await env.R2.get(key);

  if (!object) return null;

  const metadata = object.customMetadata;
  const timestamp = parseInt(metadata?.timestamp || '0');
  const now = Date.now();

  // 检查是否新鲜
  if (now - timestamp < CACHE_CONFIG.r2.fresh * 1000) {
    return new Response(object.body, {
      headers: {
        'Content-Type': 'application/json',
        'X-Cache': 'R2-HIT-FRESH'
      }
    });
  }

  // 检查是否在 stale 期内
  if (now - timestamp < CACHE_CONFIG.r2.stale * 1000) {
    // 返回旧数据，同时在后台刷新
    ctx.waitUntil(refreshCache(key));

    return new Response(object.body, {
      headers: {
        'Content-Type': 'application/json',
        'X-Cache': 'R2-HIT-STALE'
      }
    });
  }

  return null;
}
```

### 写入 R2

```typescript
async function writeToR2(key: string, data: any): Promise<void> {
  await env.R2.put(key, JSON.stringify(data), {
    customMetadata: {
      timestamp: Date.now().toString()
    }
  });
}
```

## 性能优化

### 并行请求

```typescript
// 并行获取多个上游源
const results = await Promise.allSettled([
  fetch(url1),
  fetch(url2),
  fetch(url3)
]);

// 处理成功的请求
const data = results
  .filter(r => r.status === 'fulfilled')
  .map(r => r.value);
```

### 流式处理

```typescript
// 流式返回数据，无需等待完整响应
async function streamResponse(upstream: Response): Promise<Response> {
  return new Response(upstream.body, {
    headers: upstream.headers
  });
}
```

### 压缩

```typescript
// 压缩响应数据
function compressData(data: any): string {
  // 移除不必要的字段
  const compressed = data.songs.map(song => ({
    i: song.id,
    t: song.title,
    p: song.composer,
    d: song.duration,
    c: song.characters
  }));

  return JSON.stringify({ songs: compressed });
}
```

## 监控

### 请求日志

```typescript
function logRequest(request: Request, response: Response, duration: number) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    method: request.method,
    path: new URL(request.url).pathname,
    status: response.status,
    duration,
    country: request.cf?.country,
    cacheStatus: response.headers.get('X-Cache')
  }));
}
```

### 查看日志

```bash
cd ~/WebstormProjects/pjsekai
wrangler tail
```

### 性能指标

```typescript
// 记录性能指标
const start = Date.now();
const response = await fetchData(request);
const duration = Date.now() - start;

// 上报到 Analytics Engine（规划中）
env.ANALYTICS.writeDataPoint({
  blobs: [request.url],
  doubles: [duration],
  indexes: [request.cf?.country]
});
```

## 错误处理

```typescript
async function handleRequest(request: Request): Promise<Response> {
  try {
    return await processRequest(request);
  } catch (error) {
    console.error('Request failed:', {
      url: request.url,
      error: error.message,
      stack: error.stack
    });

    return new Response(JSON.stringify({
      error: true,
      message: 'Internal server error',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
```

## 贡献

参考 [CONTRIBUTING.md](https://github.com/25-ji-code-de/gateway/blob/main/CONTRIBUTING.md)。

## 许可证

MIT License - 详见 [LICENSE](https://github.com/25-ji-code-de/gateway/blob/main/LICENSE)。

## 相关链接

- [API 网关使用指南](/guide/api-gateway)
- [API 网关 API 参考](/api/gateway)
- [项目总览](/projects/overview)
