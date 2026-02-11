# 法律文档维护指南

## 目录结构

```
docs/legal/
├── base/                    # 基础文档（所有项目共享）
│   ├── privacy-base.md      # 隐私政策基础部分
│   └── terms-base.md        # 用户服务协议基础部分
├── supplements/             # 补充文档（项目特定）
│   ├── authentication.md    # 认证服务补充（SEKAI Pass）
│   ├── local-storage.md     # 本地存储补充（25ji）
│   ├── realtime-ugc.md      # 实时通信与 UGC（Nightcord, 25ji）
│   └── copyright-pjsekai.md # Project SEKAI 版权声明（25ji）
├── complete/                # 完整文档（自动生成，不要手动编辑）
│   ├── privacy-sekai-pass.md
│   ├── privacy-nightcord.md
│   ├── privacy-25ji.md
│   ├── terms-sekai-pass.md
│   ├── terms-nightcord.md
│   └── terms-25ji.md
└── index.md                 # 法律文档索引页
```

## 如何更新文档

### 1. 更新通用条款

如果要更新所有项目共享的内容（如 Cloudflare 说明、未成年人保护等）：

```bash
# 编辑基础文档
vim docs/legal/base/privacy-base.md
vim docs/legal/base/terms-base.md

# 重新生成完整文档
npm run legal:build
```

### 2. 更新项目特定条款

如果要更新某个项目的特定内容：

```bash
# 编辑对应的补充文档
vim docs/legal/supplements/authentication.md      # SEKAI Pass
vim docs/legal/supplements/local-storage.md       # 25ji
vim docs/legal/supplements/realtime-ugc.md        # Nightcord, 25ji
vim docs/legal/supplements/copyright-pjsekai.md   # 25ji

# 重新生成完整文档
npm run legal:build
```

### 3. 添加新项目

如果要为新项目添加法律文档：

1. 创建项目特定的补充文档（如果需要）
2. 编辑 `scripts/build-legal.mjs`，在 `DOCUMENTS` 对象中添加新配置
3. 运行 `npm run legal:build` 生成文档
4. 更新 `docs/.vitepress/config.js` 添加导航链接

## 构建命令

```bash
# 仅构建法律文档
npm run legal:build

# 构建整个文档站点（会自动构建法律文档）
npm run docs:build

# 本地开发（不会自动构建法律文档，需要手动运行）
npm run docs:dev
```

## 文档组合逻辑

每个完整文档由以下部分组成：

1. **标题和版本信息**（自动生成）
2. **导言**（在 `build-legal.mjs` 中配置）
3. **补充文档内容**（项目特定条款）
4. **基础文档内容**（通用条款）
5. **结尾**（自动生成）

## 注意事项

- ⚠️ **不要手动编辑 `complete/` 目录下的文件**，它们会被自动覆盖
- ✅ 只编辑 `base/` 和 `supplements/` 目录下的文件
- ✅ 每次修改后运行 `npm run legal:build` 重新生成
- ✅ 提交时包含 `complete/` 目录的更新

## 版本管理

文档版本号在 `scripts/build-legal.mjs` 的 `DOCUMENTS` 配置中管理。更新文档时：

1. 修改对应的版本号
2. 运行构建脚本
3. 文档顶部会自动显示新的版本号和更新日期

## 示例工作流

```bash
# 1. 更新 SEKAI Pass 的数据保留政策
vim docs/legal/supplements/authentication.md

# 2. 更新版本号
vim scripts/build-legal.mjs  # 修改 privacy-sekai-pass 的 version

# 3. 重新生成文档
npm run legal:build

# 4. 预览效果
npm run docs:dev

# 5. 提交更改
git add docs/legal/ scripts/build-legal.mjs
git commit -m "docs: update SEKAI Pass data retention policy"
```

## 部署

文档站点通过 Cloudflare Pages 自动部署：

1. 推送到 GitHub
2. Cloudflare Pages 自动触发构建
3. 构建过程会运行 `npm run docs:build`（包含法律文档构建）
4. 部署到 `https://docs.nightcord.de5.net`

---

*最后更新：2026-02-11*
