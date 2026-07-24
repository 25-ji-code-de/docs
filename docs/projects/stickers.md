# Stickers / Stickers Maker

## Stickers（图鉴）

| 项 | 值 |
|----|-----|
| 生产 | [sticker.nightcord.de5.net](https://sticker.nightcord.de5.net) |
| 技术 | 静态 HTML + `stickers.json` |
| 仓库 | `stickers/` |

特性：

- 懒加载网格、客户端搜索
- `autocomplete.json` 供 Nightcord / Gateway 代理
- Cloudflare Pages `_headers`：安全头 + 贴纸图片长缓存

## Stickers Maker（生成器）

| 项 | 值 |
|----|-----|
| 生产 | [st.nightcord.de5.net](https://st.nightcord.de5.net) |
| 技术 | React, Vite, MUI, PWA |
| 仓库 | `stickers-maker/` |

特性：

- 角色贴纸自定义文字 / 导出
- OIDC discovery + PKCE 登录（与生态约定对齐）
- Vite PWA 离线缓存

## 协作

```
stickers autocomplete.json
        │
        ├─► nightcord ui-sticker-service（直连，失败则 gateway 代理）
        └─► gateway /sekai/stickers/autocomplete.json
```

Nako 贴纸向量元数据来自同类 assetbundle 名称空间。
