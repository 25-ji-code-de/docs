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

## 上传上限

| 大小 | 要求 |
|------|------|
| ≤ 512 MiB | 匿名（对齐 Cloudflare 可缓存对象上限） |
| 512 MiB – 约 1GB | 需 **SEKAI Pass** access token（`Authorization: Bearer …`）；缺失/无效 → `401` |
| > 约 1GB | 拒绝 → `413` |

> Cloudflare 按套餐限制请求体大小（Free/Pro 100MB、Business 200MB、Enterprise 默认 500MB）。超过套餐上限的上传需账号级提额，与本 Worker 的分档无关。

匿名上限 `ANON_MAX_UPLOAD_BYTES = 536870912`，绝对硬顶 `MAX_UPLOAD_BYTES = 1048576000`（PostObject policy 也用后者）。超 512 MiB 时查 `AUTH_DB`（`sekai_pass_db`）。

## 内容政策

匿名文件服务，允许任意类型（含可执行文件）；对象一律以 `attachment` 下载、带 `nosniff`，不在浏览器渲染。违法内容禁止并按举报删除，举报邮箱见根 API 文档（`ABUSE_REPORT_EMAIL`），请附公开 URL 与原因，勿再上传违规内容本身。

## 与生态协作

- **Nightcord** `file-upload-service.js` 默认 v2，失败回退 legacy
- **Pass** 头像可走 v2 上传
- 客户端匿名软上限 512 MiB；持 SEKAI Pass token 时可到硬顶约 1GB
