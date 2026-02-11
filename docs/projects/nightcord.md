# Nightcord

Nightcord 是 SEKAI 生态的核心应用，一个实时聊天室，支持 WebSocket 通信、SEKAI Pass 登录和 Nako AI 助手。

## 项目信息

- **类型**: 聊天应用
- **技术栈**: 原生 JavaScript, WebSocket
- **生产环境**: [nightcord.de5.net](https://nightcord.de5.net)
- **GitHub**: [25-ji-code-de/nightcord](https://github.com/25-ji-code-de/nightcord)
- **代码量**: ~4,255 行

## 功能特性

### 实时聊天

- **WebSocket 通信** - 低延迟实时消息
- **事件驱动架构** - 模块化设计
- **消息类型** - 文本、贴纸、系统消息
- **在线状态** - 实时显示在线用户

### 认证系统

- **SEKAI Pass 集成** - OAuth 2.1 + PKCE
- **游客模式** - 无需登录即可使用
- **持久化登录** - localStorage 存储 token

### AI 助手

- **Nako AI** - 使用 `@Nako` 或 `/nako` 调用
- **上下文记忆** - 记住对话历史
- **流式响应** - 实时显示 AI 回复

### 贴纸系统

- **自动补全** - 输入 `:` 触发贴纸选择
- **分类浏览** - 按角色、表情分类
- **快速搜索** - 支持中文、拼音搜索

## 技术架构

### 前端架构

```
index.html
├── css/
│   └── style.css
├── js/
│   ├── main.js          # 入口文件
│   ├── websocket.js     # WebSocket 管理
│   ├── auth.js          # 认证逻辑
│   ├── ui.js            # UI 更新
│   ├── sticker.js       # 贴纸系统
│   └── nako.js          # AI 助手
└── assets/
    └── stickers/        # 贴纸资源
```

### WebSocket 协议

**客户端 → 服务端：**

```json
{
  "type": "message",
  "content": "Hello, world!",
  "userId": "user123",
  "username": "mafuyu"
}
```

**服务端 → 客户端：**

```json
{
  "type": "message",
  "id": "msg_123",
  "userId": "user123",
  "username": "mafuyu",
  "content": "Hello, world!",
  "timestamp": "2026-02-11T10:00:00Z"
}
```

### 事件系统

```javascript
// 发送消息
EventBus.emit('message:send', {
  content: 'Hello',
  type: 'text'
});

// 接收消息
EventBus.on('message:receive', (message) => {
  UI.appendMessage(message);
});
```

## 本地开发

### 克隆项目

```bash
git clone https://github.com/25-ji-code-de/nightcord.git
cd nightcord
```

### 运行

```bash
# 方式 1：直接打开
open index.html

# 方式 2：使用 HTTP 服务器
python3 -m http.server 8000
# 访问 http://localhost:8000
```

### 配置

编辑 `js/config.js`：

```javascript
const CONFIG = {
  WS_URL: 'wss://nightcord.de5.net/ws',
  SEKAI_PASS_URL: 'https://id.nightcord.de5.net',
  NAKO_URL: 'https://nako.nightcord.de5.net',
  API_URL: 'https://api.nightcord.de5.net'
};
```

## 部署

### Cloudflare Pages

```bash
# 推送到 GitHub
git push origin main

# Cloudflare Pages 自动部署
```

**构建配置：**

- **构建命令**: 无（静态站点）
- **输出目录**: `/`
- **环境变量**: 无

### 自定义域名

在 Cloudflare Pages 设置中添加自定义域名 `nightcord.de5.net`。

## 使用指南

### 基础聊天

1. 访问 [nightcord.de5.net](https://nightcord.de5.net)
2. 输入昵称或使用 SEKAI Pass 登录
3. 在输入框输入消息，按 Enter 发送

### 使用贴纸

1. 输入 `:` 触发贴纸选择
2. 输入关键词搜索（如 `:未来`）
3. 点击贴纸或按 Enter 发送

### 调用 AI 助手

```
@Nako 你好
/nako 讲个笑话
```

### 快捷键

- `Enter` - 发送消息
- `Shift + Enter` - 换行
- `Ctrl + K` - 清空输入框
- `Ctrl + L` - 清空聊天记录

## API 集成

### SEKAI Pass 登录

```javascript
// 跳转到登录页面
function login() {
  const authUrl = new URL('https://id.nightcord.de5.net/oauth/authorize');
  authUrl.searchParams.set('client_id', CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', window.location.origin + '/callback');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'openid profile');
  authUrl.searchParams.set('code_challenge', codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');

  window.location.href = authUrl.toString();
}
```

### 调用 Nako AI

```javascript
async function askNako(message) {
  const response = await fetch('https://nako.nightcord.de5.net/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      userId: currentUser.id,
      history: chatHistory
    })
  });

  const { reply } = await response.json();
  return reply;
}
```

### 获取贴纸数据

```javascript
async function loadStickers() {
  const response = await fetch('https://api.nightcord.de5.net/sekai/stickers/autocomplete.json');
  const stickers = await response.json();
  return stickers;
}
```

## 性能优化

### 消息虚拟化

大量消息时使用虚拟滚动：

```javascript
// 只渲染可见区域的消息
function renderVisibleMessages() {
  const scrollTop = chatContainer.scrollTop;
  const visibleHeight = chatContainer.clientHeight;

  const startIndex = Math.floor(scrollTop / MESSAGE_HEIGHT);
  const endIndex = Math.ceil((scrollTop + visibleHeight) / MESSAGE_HEIGHT);

  renderMessages(messages.slice(startIndex, endIndex));
}
```

### 贴纸懒加载

```javascript
// 使用 Intersection Observer 懒加载贴纸
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src;
      observer.unobserve(img);
    }
  });
});
```

### 本地缓存

```javascript
// 缓存贴纸数据
localStorage.setItem('stickers', JSON.stringify(stickers));

// 缓存用户信息
localStorage.setItem('user', JSON.stringify(user));
```

## 贡献

参考 [CONTRIBUTING.md](https://github.com/25-ji-code-de/nightcord/blob/main/CONTRIBUTING.md)。

## 许可证

MIT License - 详见 [LICENSE](https://github.com/25-ji-code-de/nightcord/blob/main/LICENSE)。

## 相关链接

- [SEKAI Pass 集成](/guide/sekai-pass)
- [Nako AI API](/api/nako)
- [API 网关](/api/gateway)
- [项目总览](/projects/overview)
