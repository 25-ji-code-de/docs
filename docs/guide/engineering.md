---
title: 工程约定（跨仓）
outline: [2, 3]
---

# 工程约定（跨仓）

本页描述 SEKAI 生态各仓在 **CI、测试、依赖、安全响应头** 上的共同约定，以及保证这些约定不漂移的机器检查。

::: tip 为什么需要这一页
生态里曾经出现过四份逐渐漂移的 auth 客户端、三种互不兼容的错误信封、跨越两年的 `compatibility_date`。共同点是：**每个仓单独看都没问题，只有放在一起才看得出不一致**，而没有任何单仓机制能发现它。
:::

## 两层机器检查

### 1. `static-check` —— 单仓，可复用

无构建步骤的仓（`hub`、`nightcord`、`stickers`、`25ji-sagyo`、`gateway`）调用组织级的可复用 workflow：

```yaml
jobs:
  check:
    uses: 25-ji-code-de/.github/.github/workflows/static-check.yml@main
```

它检查四件事：

| 检查 | 说明 |
|---|---|
| JavaScript 语法 | 每个 `.js` / `.mjs` 过 `node --check` |
| JSON 合法性 | 每个 `.json` 过 `JSON.parse` |
| 内联 SDK 一致性 | 带 `@sekai-vendor` 头的文件与上游 tag **逐字比对** |
| Pages `_headers` | 重复路径块、UTF-8 BOM、必需安全头、CSP 语法 |

实现在 [`scripts/static-check.mjs`](https://github.com/25-ji-code-de/.github/blob/main/scripts/static-check.mjs)，可以本地直接跑：

```bash
node path/to/.github/scripts/static-check.mjs .
```

### 2. `check-consistency` —— 跨仓，每日定时

把全部仓拉到一起，比对那些**必须一致、但没有任何单仓机制能保证一致**的东西：

- CI 的 Node 版本
- 内联 SDK 的 `@sekai-vendor` tag（`hub` / `25ji-sagyo` / `nightcord` 之间）
- `@25-ji-code-de/*` 依赖的版本（`gateway` / `nako` / `stickers-maker` 之间）
- wrangler 的 `compatibility_date`
- `package.json` 的 `author` 与 `repository` owner
- 五个社区文件是否齐全
- lockfile：有依赖就必须提交、不能同时存在多个、不能被 gitignore
- 静态站的安全响应头与 `X-Frame-Options` 取值
- Worker 仓是否有 `test/` 目录

结果写进 GitHub job summary。`puzzle-sekai` 在排除列表里 —— 它是独立演进的应用，不按统一标准约束。

## Node 版本

**全仓统一 Node 24**（Node 20 已于 2026-04 EOL）。

`node --test` 的 glob 展开需要 Node 22+；Node 24 还原生支持 TypeScript 类型剥离，`sekai-pass` 的测试因此不需要任何额外的测试运行时。

## 测试

每个仓都应该有 `test/`，用 `node:test`，不引入第三方测试框架。

```json
"test": "node --test \"test/*.test.mjs\""
```

TypeScript 仓用 `.ts` 后缀的测试文件，靠 Node 原生类型剥离运行 —— 但注意 **Node 的 ESM 解析器要求显式扩展名**，源码里的无扩展名 import（`from './tokens'`）会导致模块找不到。这是 `sekai-pass` 目前只能测自包含模块的原因。

## 依赖

- **包管理器统一 npm**，`package-lock.json` 必须提交。
  应用仓（不是库）应当锁定依赖；而且 `actions/setup-node` 的 `cache: npm` 没有 lockfile 会**在 setup 阶段直接失败**。
- **不要同时存在多个 lockfile。**
- 共享 SDK 走 git dependency（尚未发布到 npm）：

  ```json
  "@25-ji-code-de/sekai-worker-kit": "github:25-ji-code-de/sekai-worker-kit#v0.1.1"
  ```

- 无构建步骤的静态站只能**内联**引用 SDK，文件首行必须带来源标记：

  ```js
  // @sekai-vendor @25-ji-code-de/sekai-auth@v0.1.2 dist/sekai-auth.global.js
  ```

  `static-check` 会据此从上游 tag 拉原文逐字比对。**不要就地修改内联副本** —— 那正是当初四份客户端漂移的成因。

## 安全响应头

静态站的 `_headers` 应当**只用一个 `/*` 块**（曾有三个仓把安全头和缓存头拆成两段拼接，依赖 Pages 的合并语义）：

```
/*
  Cache-Control: no-cache
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: DENY
  Permissions-Policy: camera=(), microphone=(), geolocation=()
```

注释写在块外、顶格。文件**不能带 UTF-8 BOM** —— BOM 会让第一条路径规则看起来是缩进的。

### CSP 分两条推进

```
  Content-Security-Policy: object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'
  Content-Security-Policy-Report-Only: <完整策略>
```

第一条**强制生效**。这四条指令在不含 `<object>` / `<embed>` / `<base>` / `<form>` 的站点上零破坏风险，直接拦掉 plugin 注入、`<base>` 劫持、表单外发与点击劫持。

第二条是完整策略，**只上报不拦截**，用来收集真实违规数据；确认无误后再并进第一条。

目前四个静态站的 `script-src` 都还保留 `'unsafe-inline'` —— HTML 里有内联 `<script>`，静态站没有构建步骤，要改用 nonce/hash 得先把内联脚本外置。

### 缓存

未做内容哈希的 `.js` / `.css` **不要**加长缓存 —— 它们改名不换版本。内容固定的二进制资源（音效、图标、贴纸图片）才走 `immutable`：

```
/sounds/*
  Cache-Control: public, max-age=31536000, immutable
```

## Worker 配置

- `compatibility_date` 全仓对齐（当前 `2026-02-10`）
- 只提交 `wrangler.*.example`，真实配置本地保留并 gitignore

::: warning 这条与 Cloudflare Workers Builds 冲突
Workers Builds 是从 GitHub 仓 checkout 后构建的，仓里没有 wrangler 配置就找不到 `main` 入口，**每次提交都会失败**。详见 [gateway#2](https://github.com/25-ji-code-de/gateway/issues/2)。
:::

## 仓库元数据

| 项 | 约定 |
|---|---|
| `author` | `The 25-ji-code-de Team` |
| `repository` | 指向 `github.com/25-ji-code-de/*` |
| 许可证 | 代码 Apache-2.0 或 AGPL-3.0（以各仓 LICENSE 为准）；**共享 SDK 一律 Apache-2.0** |
| 社区文件 | `LICENSE` / `README.md` / `CONTRIBUTING.md` / `SECURITY.md` / `CODE_OF_CONDUCT.md` |
