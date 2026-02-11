# 快速开始

本指南将帮助你快速开始使用 SEKAI 生态。

## 使用现有服务

### 1. 访问 Nightcord 聊天室

直接访问 [nightcord.de5.net](https://nightcord.de5.net)：

1. 输入昵称，或点击"使用 SEKAI Pass 登录"
2. 开始聊天
3. 使用 `@Nako` 或 `/nako` 调用 AI 助手

### 2. 使用 25時作業風景

访问 [25ji.nightcord.de5.net](https://25ji.nightcord.de5.net)：

1. 选择背景视频（自动与现实时间同步）
2. 使用番茄钟计时学习
3. 播放 Project SEKAI 音乐
4. 查看在线人数和活动

### 3. 注册 SEKAI Pass 账号

访问 [id.nightcord.de5.net](https://id.nightcord.de5.net)：

1. 点击"注册"
2. 填写用户名、邮箱、密码
3. 完成注册
4. 使用该账号登录 Nightcord 等应用

## 集成到你的项目

### 接入 SEKAI Pass SSO

参考 [SEKAI Pass 集成指南](/guide/sekai-pass)。

### 使用 API 网关

```javascript
// 获取音乐数据
const response = await fetch('https://api.nightcord.de5.net/sekai/music_data.json');
const data = await response.json();

// 获取贴纸数据
const stickers = await fetch('https://api.nightcord.de5.net/sekai/stickers/autocomplete.json');
const stickerData = await stickers.json();
```

详见 [API 网关文档](/api/gateway)。

### 调用 Nako AI

```javascript
const response = await fetch('https://nako.nightcord.de5.net/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: '你好，Nako！',
    userId: 'user123',
    history: []
  })
});

const data = await response.json();
console.log(data.reply);
```

详见 [Nako AI 文档](/api/nako)。

## 本地开发

### 克隆项目

```bash
# 克隆所有项目
git clone https://github.com/25-ji-code-de/nightcord.git
git clone https://github.com/25-ji-code-de/sekai-pass.git
git clone https://github.com/25-ji-code-de/gateway.git
git clone https://github.com/25-ji-code-de/nako.git
```

### 运行 Nightcord

```bash
cd nightcord

# 直接打开 index.html
# 或使用 HTTP 服务器
python3 -m http.server 8000

# 访问 http://localhost:8000
```

### 运行 SEKAI Pass

```bash
cd sekai-pass

# 安装依赖
npm install

# 本地开发
npm run dev

# 访问 http://localhost:8787
```

### 运行 Gateway

```bash
cd gateway

# 安装依赖
npm install

# 本地开发
npm run dev

# 访问 http://localhost:8787
```

## 部署到 Cloudflare

### 部署 Workers 项目

```bash
# SEKAI Pass
cd sekai-pass
npm run deploy

# Gateway
cd gateway
npm run deploy

# Nako AI
cd nako
npm run deploy
```

### 部署 Pages 项目

```bash
# Nightcord
cd nightcord
git push origin main
# Cloudflare Pages 自动部署

# 25ji
cd 25ji_sagyo_fukei
git push origin main
# Cloudflare Pages 自动部署
```

## 常见问题

### Q: 如何获取 Cloudflare API Token？

A: 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)，创建 API Token。

### Q: 如何配置自定义域名？

A: 在 Cloudflare Dashboard 中配置 Workers 或 Pages 的自定义域名。

### Q: 如何查看日志？

A: 使用 `wrangler tail` 查看实时日志：

```bash
cd gateway
wrangler tail
```

### Q: 如何贡献代码？

A: 参考各项目的 `CONTRIBUTING.md` 文件。

## 下一步

- [架构总览](/guide/architecture) - 了解生态架构
- [SEKAI Pass 集成](/guide/sekai-pass) - 接入 SSO
- [API 参考](/api/gateway) - 查看 API 文档
