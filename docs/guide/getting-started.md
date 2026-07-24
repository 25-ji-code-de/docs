# 快速开始

本指南将帮助你快速开始使用 SEKAI 生态。

## 使用现有服务

### 1. 访问 Nightcord 聊天室

直接访问 [nightcord.de5.net](https://nightcord.de5.net)：

1. 输入昵称，或点击「使用 SEKAI Pass 登录」
2. 开始聊天（支持 SEKAI 标记语言、贴纸、文件）
3. 使用 `@Nako` 或 `/nako` 调用 AI 助手

### 2. 使用 25時作業風景

访问 [25ji.nightcord.de5.net](https://25ji.nightcord.de5.net)：

1. 选择背景视频（自动与现实时间同步）
2. 使用番茄钟计时学习
3. 播放 Project SEKAI 音乐
4. 登录后云同步学习数据（经 Gateway）

### 3. SEKAI Hub 门户

访问 [hub.nightcord.de5.net](https://hub.nightcord.de5.net)：

1. 使用 SEKAI Pass 登录
2. 查看跨项目统计与成就

### 4. 注册 SEKAI Pass 账号

访问 [id.nightcord.de5.net](https://id.nightcord.de5.net)：

1. 点击「注册」
2. 填写用户名、邮箱、密码
3. 使用该账号登录 Nightcord / 25ji / Hub 等应用

## 集成到你的项目

### 接入 SEKAI Pass SSO

参考 [SEKAI Pass 集成指南](/guide/sekai-pass) 与 [前端客户端约定](/guide/client-conventions)。

要点：OAuth 2.1 + PKCE（S256）、sessionStorage 存 verifier、single-flight refresh。

### 使用 API 网关

```javascript
// 公开：音乐数据（v3 压缩字段）
const response = await fetch('https://api.nightcord.de5.net/sekai/music_data.json');
const data = await response.json();
console.log(`v${data.v} · ${data.n} 首`);

// 认证：用户同步
const sync = await fetch('https://api.nightcord.de5.net/user/sync?project=25ji', {
  headers: { Authorization: `Bearer ${accessToken}` },
});
```

详见 [API 网关文档](/api/gateway)。

### 调用 Nako AI

需要 SEKAI Pass access token。

```javascript
const response = await fetch('https://nako.nightcord.de5.net/api/chat?persona=nako', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  },
  body: JSON.stringify({
    message: '你好，Nako！',
    userId: 'user123',
    history: [],
    stream: false,
  }),
});

const data = await response.json();
if (data.success) console.log(data.response);
```

详见 [Nako AI 文档](/api/nako)。

### 上传媒体（SEKAI v2）

```bash
curl -X PUT https://storage.nightcord.de5.net/v2/upload \
  -H "X-Filename: photo.jpg" \
  -H "Content-Type: image/jpeg" \
  --data-binary @photo.jpg
# → { "uuid": "…", "url": "/images/…", "kind": "image", … }
```

公开读取：`https://r2.nightcord.de5.net/images/{uuid}`。

## 本地开发

各仓库独立 git。示例：

```bash
git clone https://github.com/25-ji-code-de/nightcord.git
git clone https://github.com/25-ji-code-de/gateway.git
git clone https://github.com/25-ji-code-de/sekai-pass.git
git clone https://github.com/25-ji-code-de/nako.git
# …
```

Workers 项目：`npm install && npm run dev`（需 Wrangler + 绑定）。  
静态 Pages：本地 HTTP 服务器打开即可（注意 OAuth 回调需在 Pass 登记）。

## 下一步

- [架构总览](/guide/architecture)
- [前端客户端约定](/guide/client-conventions)
- [项目总览](/projects/overview)
