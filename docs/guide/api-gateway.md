# 使用 API 网关

API 网关（`api.nightcord.de5.net`）是 SEKAI 生态的统一 API 入口。

## 为什么使用 API 网关？

- **统一入口** — 公开数据 + 用户 API 同一域名
- **全球加速** — Cloudflare 边缘
- **智能缓存** — Edge + R2 + stale 降级（音乐数据）
- **统一认证** — Bearer + D1 `AUTH_DB`（与 Pass 同源 token 表）

## 快速开始

### 获取音乐数据（v3）

```javascript
const response = await fetch('https://api.nightcord.de5.net/sekai/music_data.json');
const data = await response.json();

console.log(`v${data.v} · ${data.n} 首`);
for (const song of data.m) {
  console.log(`${song.i}: ${song.t}`);
}
```

字段说明见 [API 参考 · 音乐数据](/api/gateway#sekai-音乐数据)。

### 获取贴纸补全

```javascript
const response = await fetch(
  'https://api.nightcord.de5.net/sekai/stickers/autocomplete.json',
);
const data = await response.json();
console.log('分类:', Object.keys(data));
```

### 用户 API（需登录）

```javascript
const res = await fetch('https://api.nightcord.de5.net/user/sync?project=25ji', {
  headers: { Authorization: `Bearer ${accessToken}` },
});
const sync = await res.json();
```

事件 / metric 命名见 [客户端约定](/guide/client-conventions)。

## 缓存策略（音乐）

1. **Edge** ~30s  
2. **R2** 新鲜 3min，stale 可用至 10min  
3. **Origin** sekai-world / i18n 上游；失败可返回 stale  

强制刷新：`?refresh=1`。

## 错误

```json
{ "error": true, "message": "…" }
```

## 相关

- [完整 API 参考](/api/gateway)
- [架构总览](/guide/architecture)
