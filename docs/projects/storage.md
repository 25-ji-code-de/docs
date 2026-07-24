# Storage Worker

对象存储代理：Aliyun OSS（或兼容 PostObject）+ SEKAI v2 资源门面。

## 主机

| 角色 | 典型域名 |
|------|----------|
| 上传 / legacy | `storage.nightcord.de5.net` |
| 公开媒体 | `r2.nightcord.de5.net` |

两者可绑定同一 Worker。

## SEKAI v2（推荐）

### 上传

```http
PUT /v2/upload
X-Filename: <percent-encoded name>
Content-Type: <mime>
Content-Length: <bytes>
X-Sekai-Kind: image | file | sticker   # optional
X-Image-Width: <int>                   # optional
X-Image-Height: <int>                  # optional
```

**响应：**

```json
{
  "uuid": "…",
  "key": "…",
  "type": "image/jpeg",
  "size": 204.5,
  "size_bytes": 209408,
  "name": "photo.jpg",
  "kind": "image",
  "url": "/images/…"
}
```

### 解析

```http
GET|HEAD /images/{uuid}
GET|HEAD /files/{uuid}
GET|HEAD /stickers/{uuid}
GET /v2/meta/{uuid}
```

### 消息载荷

```text
<$SEKAI:Image:w=…;h=…;name=…:{uuid}>
<$SEKAI:Files:type=…;size=…;name=…:{uuid}>
<$SEKAI:Stamp:custom=true:{uuid}>
```

## Legacy

- `PUT /` + `X-Filename` → `{ key, url, size }`
- `GET|HEAD|DELETE /{key}`
- 分片：`X-Chunk-Index` / `/chunked/…`

## 文档格式

`GET /` 支持：

- HTML（浏览器默认）
- `?format=json` / `Accept: application/json`
- `?format=md` / `Accept: text/markdown`

## 与生态协作

- **Nightcord** `file-upload-service.js` 默认 v2，失败回退 legacy
- **Pass** 头像可走 v2 上传
- 客户端软上限与 Worker `MAX_UPLOAD_BYTES`（约 1GB）对齐

## 仓库

[25-ji-code-de/storage-worker](https://github.com/25-ji-code-de)（本机 `storage-worker/`）
