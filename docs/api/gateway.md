# API 网关

API 网关（`api.nightcord.de5.net`）是 SEKAI 生态的统一 API 入口。

## 公开端点

### 健康检查

```http
GET /
GET /health
```

```json
{
  "service": "gateway",
  "status": "ok",
  "version": "1.0.0",
  "routes": ["/sekai/*", "/assets/*", "/user/*", "/chat/*", "/study/*"]
}
```

### SEKAI 音乐数据

聚合 Project SEKAI 上游源，返回 **v3 压缩字段** JSON。

```http
GET /sekai/music_data.json
GET /sekai/music_data.json?refresh=1
```

**响应形状（v3）：**

```json
{
  "v": 3,
  "t": 1710000000000,
  "n": 500,
  "m": [
    {
      "i": 1,
      "t": "Tell Your World",
      "p": "てるゆあわーるど",
      "tz": "告诉你的世界",
      "c": "kz",
      "l": "kz",
      "a": "music001",
      "f": 0,
      "v": [{ "i": 1, "t": "original_music", "c": "…", "a": "…", "ch": [[21, "game_character"]] }]
    }
  ]
}
```

| 字段 | 含义 |
|------|------|
| `v` | 格式版本（当前 3） |
| `t` | 生成时间戳 ms |
| `n` | 曲目数量 |
| `m[]` | 曲目列表 |
| `m[].i` | 曲目 ID |
| `m[].t` | 标题 |
| `m[].p` | 读音 |
| `m[].tz` | 中文标题（若有） |
| `m[].c` / `l` | 作曲 / 作词 |
| `m[].a` | assetbundleName |
| `m[].v` | 音源列表 |

**缓存：** Edge 30s · R2 新鲜 3min · stale 可用 10min · 上游失败可返回 STALE。

### 贴纸自动补全

```http
GET /sekai/stickers/autocomplete.json
```

代理 `sticker.nightcord.de5.net/autocomplete.json`，Edge 缓存约 1 小时。

### 资源预取

```http
GET /assets/prefetch?path=/music/long/xxx.mp3
```

从 `storage.sekai.best` 拉资源写入 R2（path 已做遍历校验）。

## 需认证端点（`Authorization: Bearer <access_token>`）

Token 由 **SEKAI Pass** 签发；Gateway 通过 D1 `AUTH_DB` 直读校验。

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/user/profile` | 扩展资料 bio |
| PUT | `/user/profile` | 更新 bio（≤500 字） |
| GET | `/user/stats?project=&date=` | 日统计（按 project 分组） |
| POST | `/user/events` | 上报事件 → 更新统计 / 成就 |
| GET | `/user/activity` | 活动时间线 |
| GET | `/user/achievements` | 成就列表 |
| GET | `/user/sync?project=25ji` | 读取云同步包 |
| POST | `/user/sync` | 上传并合并同步包 |

事件与 metric 命名见 [前端客户端约定](/guide/client-conventions#gateway-调用)。

**错误形状：**

```json
{
  "error": true,
  "message": "Unauthorized"
}
```

## 使用示例

```javascript
// 公开：音乐
const res = await fetch('https://api.nightcord.de5.net/sekai/music_data.json');
const data = await res.json();
console.log(`v${data.v} · ${data.n} 首`);

// 认证：同步
const sync = await fetch('https://api.nightcord.de5.net/user/sync?project=25ji', {
  headers: { Authorization: `Bearer ${accessToken}` },
});
```

```bash
curl https://api.nightcord.de5.net/sekai/music_data.json
curl -H "Authorization: Bearer $TOKEN" \
  'https://api.nightcord.de5.net/user/stats?date=2026-07-24'
```

## 性能

- 音乐数据多层缓存；`X-Cache: HIT|MISS|STALE-ERROR`
- 指标经 `console.log` JSON，可用 `wrangler tail` 查看

## 相关链接

- [GitHub](https://github.com/25-ji-code-de/gateway)
- [架构总览](/guide/architecture)
- [前端客户端约定](/guide/client-conventions)
- [项目详情](/projects/gateway)
