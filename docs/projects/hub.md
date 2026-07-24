# SEKAI Hub

生态门户与登录后的跨项目看板。

## 项目信息

| 项 | 值 |
|----|-----|
| 类型 | 门户 / 用户中心 |
| 技术栈 | 原生 ES modules, OAuth PKCE |
| 生产 | [hub.nightcord.de5.net](https://hub.nightcord.de5.net) |
| GitHub | [25-ji-code-de/hub](https://github.com/25-ji-code-de/hub) |

## 功能

- 公开页：生态项目入口（Nightcord / 25ji / Stickers / Pass / Gateway / Storage / Docs）
- 登录：SEKAI Pass PKCE（`assets/js/auth.js`）
- 看板：`/user/stats` · `/user/achievements` · `/user/activity` · `/user/sync?project=25ji`

## 结构

```
index.html
callback.html · callback/index.html
assets/js/auth.js · api.js · config.js · main.js
assets/css/style.css
_headers
```

## 协作

见 [客户端约定](/guide/client-conventions)。metric 别名兼容见 hub `main.js` 的 `metricNum` / `sumMetrics`。
