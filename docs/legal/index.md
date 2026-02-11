# 法律文档

SEKAI 生态各项目的法律文档，包括隐私政策和用户服务协议。

## 完整文档

### SEKAI Pass (id.nightcord.de5.net)

单点登录认证系统

- [隐私政策](./complete/privacy-sekai-pass.md)
- [用户服务协议](./complete/terms-sekai-pass.md)

### Nightcord (nightcord.de5.net)

实时聊天室

- [隐私政策](./complete/privacy-nightcord.md)
- [用户服务协议](./complete/terms-nightcord.md)

### 25時作業風景 (25ji.nightcord.de5.net)

24 小时学习工作日常

- [隐私政策](./complete/privacy-25ji.md)
- [用户服务协议](./complete/terms-25ji.md)

---

## 文档结构

本目录采用模块化结构，便于维护和更新：

### 基础文档 (`base/`)

所有项目共享的通用条款：
- [隐私政策基础部分](./base/privacy-base.md)
- [用户服务协议基础部分](./base/terms-base.md)

### 补充文档 (`supplements/`)

项目特定的补充条款：
- [认证服务补充](./supplements/authentication.md) - SEKAI Pass 专用
- [本地存储补充](./supplements/local-storage.md) - 25ji 专用
- [实时通信与 UGC 补充](./supplements/realtime-ugc.md) - Nightcord, 25ji 共用
- [Project SEKAI 版权声明](./supplements/copyright-pjsekai.md) - 25ji 专用

### 完整文档 (`complete/`)

自动生成的完整法律文档，由基础文档和补充文档组合而成。

---

## 构建文档

如需重新生成完整文档，运行：

```bash
node scripts/build-legal.mjs
```

---

## 更新说明

- **2026-02-11**: 创建模块化法律文档系统
  - 提取通用基础部分
  - 创建项目特定补充文档
  - 实现自动构建脚本

---

*本文档系统由 SEKAI 生态维护，遵循 [MIT License](../../LICENSE)。*
