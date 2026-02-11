# 使用 API 网关

API 网关（`api.nightcord.de5.net`）是 SEKAI 生态的统一 API 入口，提供高性能、多层缓存的数据服务。

## 为什么使用 API 网关？

- **统一入口** - 所有 API 请求通过一个域名
- **全球加速** - Cloudflare 边缘节点，低延迟
- **智能缓存** - 多层缓存策略，减少上游压力
- **高可用** - 自动故障转移，stale-while-revalidate
- **监控完善** - 请求日志、性能指标、错误追踪

## 快速开始

### 获取音乐数据

```javascript
const response = await fetch('https://api.nightcord.de5.net/sekai/music_data.json');
const data = await response.json();

console.log(`共 ${data.songs.length} 首歌曲`);
data.songs.forEach(song => {
  console.log(`${song.t} - ${song.p}`);
});
```

### 获取贴纸数据

```javascript
const response = await fetch('https://api.nightcord.de5.net/sekai/stickers/autocomplete.json');
const data = await response.json();

console.log('贴纸分类:', Object.keys(data));
```

## 缓存策略

### 音乐数据缓存

`/sekai/music_data.json` 使用三层缓存：

1. **Edge Cache (30s)** - Cloudflare 边缘节点
2. **R2 Cache (3min fresh, 10min stale)** - 对象存储
3. **Origin** - 上游源站（sekai-world, sekai.best）

**缓存流程：**

```
请求 → Edge Cache (30s)
  ↓ MISS
R2 Cache (3min fresh)
  ↓ MISS
并行获取 3 个上游源
  ├─ sekai-world.github.io/musics.json
  ├─ sekai-world.github.io/musicVocals.json
  └─ i18n-json.sekai.best/music_titles.json
  ↓
合并 + 压缩 + 存储到 R2
  ↓
返回数据 + 写入 Edge Cache
```

**Stale-While-Revalidate：**

如果 R2 缓存过期但在 stale 期内（10min），会立即返回旧数据，同时在后台刷新。

### 贴纸数据缓存

`/sekai/stickers/autocomplete.json` 使用单层缓存：

- **Edge Cache (1h)** - Cloudflare 边缘节点

数据来自 `sticker.nightcord.de5.net`，更新频率低，缓存时间长。

## 强制刷新缓存

添加 `?refresh=1` 参数强制刷新缓存：

```javascript
const response = await fetch('https://api.nightcord.de5.net/sekai/music_data.json?refresh=1');
```

**注意：** 强制刷新会绕过所有缓存，直接请求上游源，响应时间较长。请谨慎使用。

## 响应格式

### 音乐数据

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

**字段说明：**

- `i` - 歌曲 ID
- `t` - 标题
- `p` - 作曲家
- `d` - 时长（秒）
- `c` - 角色

### 贴纸数据

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

## 错误处理

API 使用标准 HTTP 状态码：

- `200` - 成功
- `404` - 端点不存在
- `500` - 服务器错误

**错误响应：**

```json
{
  "error": true,
  "message": "Failed to fetch data",
  "details": "Upstream server timeout"
}
```

**建议：**

```javascript
try {
  const response = await fetch('https://api.nightcord.de5.net/sekai/music_data.json');

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  // 处理数据
} catch (error) {
  console.error('获取数据失败:', error);
  // 使用本地缓存或显示错误
}
```

## 性能优化

### 客户端缓存

建议在客户端缓存数据，减少请求：

```javascript
// 使用 localStorage
const CACHE_KEY = 'sekai_music_data';
const CACHE_TTL = 5 * 60 * 1000; // 5 分钟

async function getMusicData() {
  const cached = localStorage.getItem(CACHE_KEY);

  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_TTL) {
      return data;
    }
  }

  const response = await fetch('https://api.nightcord.de5.net/sekai/music_data.json');
  const data = await response.json();

  localStorage.setItem(CACHE_KEY, JSON.stringify({
    data,
    timestamp: Date.now()
  }));

  return data;
}
```

### 预加载

在页面加载时预加载数据：

```html
<link rel="prefetch" href="https://api.nightcord.de5.net/sekai/music_data.json">
```

### 并发请求

使用 `Promise.all` 并发请求多个端点：

```javascript
const [musicData, stickerData] = await Promise.all([
  fetch('https://api.nightcord.de5.net/sekai/music_data.json').then(r => r.json()),
  fetch('https://api.nightcord.de5.net/sekai/stickers/autocomplete.json').then(r => r.json())
]);
```

## 监控和调试

### 查看缓存状态

响应头包含缓存信息：

```
CF-Cache-Status: HIT
Age: 15
```

- `CF-Cache-Status` - 缓存状态（HIT/MISS/EXPIRED/STALE）
- `Age` - 缓存年龄（秒）

### 查看实时日志

```bash
cd ~/WebstormProjects/pjsekai
wrangler tail
```

日志包含：

- 请求路径、方法、状态码
- 响应时间
- 缓存状态（edge/r2/origin）
- 国家/地区

## 速率限制

目前没有速率限制，但建议：

- 合理使用缓存（不要频繁刷新）
- 避免并发大量请求
- 考虑在客户端缓存数据

如果滥用，可能会被限制访问。

## 未来端点

计划中的 API 端点：

- `/user/*` - 用户相关 API（需要认证）
- `/chat/*` - 聊天相关 API（需要认证）
- `/study/*` - 学习相关 API（需要认证）

这些端点将需要 SEKAI Pass 认证。

## 相关链接

- [API 网关 API 参考](/api/gateway)
- [Gateway 项目详情](/projects/gateway)
- [架构总览](/guide/architecture)
