# API 网关

API 网关（`api.nightcord.de5.net`）是 SEKAI 生态的统一 API 入口。

## 端点

### SEKAI 音乐数据

获取 Project SEKAI 的音乐数据（聚合自多个上游源）。

```http
GET /sekai/music_data.json
```

**响应示例：**

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

**缓存策略：**

- Edge Cache: 30 秒
- R2 Fresh: 3 分钟
- R2 Stale: 10 分钟

### 贴纸自动补全

获取贴纸自动补全数据。

```http
GET /sekai/stickers/autocomplete.json
```

**响应示例：**

```json
{
  "stamp": {
    "未来：请多关照": "weilai_qingduoguanzhao",
    "铃：一起加油吧～！": "ling_yiqijiayouba"
  },
  "character": {
    ...
  }
}
```

**缓存策略：**

- Edge Cache: 1 小时

## 使用示例

### JavaScript / TypeScript

```javascript
// 获取音乐数据
const response = await fetch('https://api.nightcord.de5.net/sekai/music_data.json');
const data = await response.json();

console.log(`共 ${data.songs.length} 首歌曲`);

// 获取贴纸数据
const stickers = await fetch('https://api.nightcord.de5.net/sekai/stickers/autocomplete.json');
const stickerData = await stickers.json();

console.log('贴纸分类:', Object.keys(stickerData));
```

### Python

```python
import requests

# 获取音乐数据
response = requests.get('https://api.nightcord.de5.net/sekai/music_data.json')
data = response.json()

print(f"共 {len(data['songs'])} 首歌曲")

# 获取贴纸数据
stickers = requests.get('https://api.nightcord.de5.net/sekai/stickers/autocomplete.json')
sticker_data = stickers.json()

print('贴纸分类:', list(sticker_data.keys()))
```

### cURL

```bash
# 获取音乐数据
curl https://api.nightcord.de5.net/sekai/music_data.json

# 获取贴纸数据
curl https://api.nightcord.de5.net/sekai/stickers/autocomplete.json

# 强制刷新缓存
curl 'https://api.nightcord.de5.net/sekai/music_data.json?refresh=1'
```

## 错误处理

API 使用标准 HTTP 状态码：

- `200` - 成功
- `404` - 端点不存在
- `500` - 服务器错误

**错误响应格式：**

```json
{
  "error": true,
  "message": "Failed to fetch data",
  "details": "Upstream server timeout"
}
```

## 性能优化

### 缓存命中率

API 网关使用多层缓存：

1. **Edge Cache** - Cloudflare 边缘节点，全球分布
2. **R2 Cache** - 对象存储，作为二级缓存
3. **Origin** - 上游源站

大部分请求会命中 Edge Cache，响应时间 < 50ms。

### 监控

所有请求都会记录以下指标：

```json
{
  "timestamp": "2026-02-11T08:45:23Z",
  "method": "GET",
  "path": "/sekai/music_data.json",
  "status": 200,
  "duration": 45,
  "country": "CN",
  "cacheStatus": "HIT"
}
```

查看实时日志：

```bash
cd ~/WebstormProjects/pjsekai
wrangler tail
```

## 速率限制

目前没有速率限制，但建议：

- 合理使用缓存（不要频繁刷新）
- 避免并发大量请求
- 考虑在客户端缓存数据

## 未来端点

计划中的 API 端点：

- `/user/*` - 用户相关 API（需要认证）
- `/chat/*` - 聊天相关 API（需要认证）
- `/study/*` - 学习相关 API（需要认证）

## 相关链接

- [GitHub 仓库](https://github.com/25-ji-code-de/gateway)
- [架构总览](/guide/architecture)
- [项目详情](/projects/gateway)
