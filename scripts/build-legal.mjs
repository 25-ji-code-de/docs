#!/usr/bin/env node

/**
 * Legal Documents Builder
 *
 * 自动组合基础文档和补充文档，生成完整的法律文档
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LEGAL_DIR = path.join(__dirname, '../docs/legal');
const BASE_DIR = path.join(LEGAL_DIR, 'base');
const SUPPLEMENTS_DIR = path.join(LEGAL_DIR, 'supplements');
const COMPLETE_DIR = path.join(LEGAL_DIR, 'complete');

// 文档配置
const DOCUMENTS = {
  'privacy-sekai-pass': {
    title: '隐私政策',
    service: 'SEKAI Pass',
    url: 'https://id.nightcord.de5.net',
    version: '1.3',
    base: 'privacy-base.md',
    supplements: ['authentication.md'],
    intro: `**SEKAI Pass**（以下简称"本服务"或"我们"）非常重视用户的隐私保护。本隐私政策旨在向您说明我们如何收集、使用、存储和保护您的个人信息。

**请您务必仔细阅读并充分理解本政策，特别是以加粗形式标注的条款。在使用本服务之前，请确认您已充分理解并同意本政策。如果您不同意本政策的任何内容，请立即停止使用本服务。**`
  },
  'privacy-25ji': {
    title: '隐私政策',
    service: '『25时、Nightcord见。』成员们的 24 小时工作日常',
    url: 'https://25ji.nightcord.de5.net',
    version: '3.1',
    base: 'privacy-base.md',
    supplements: ['local-storage.md', 'realtime-ugc.md'],
    intro: `『25时、Nightcord见。』成员们的 24 小时工作日常（以下简称"本服务"或"我们"）非常重视用户的隐私保护。本隐私政策旨在向您说明我们如何收集、使用、存储和保护您的个人信息。

**请您务必仔细阅读并充分理解本政策，特别是以加粗形式标注的条款。在使用本服务之前，请确认您已充分理解并同意本政策。如果您不同意本政策的任何内容，请立即停止使用本服务。**`
  },
  'privacy-nightcord': {
    title: '隐私政策',
    service: 'Nightcord',
    url: 'https://nightcord.de5.net',
    version: '1.0',
    base: 'privacy-base.md',
    supplements: ['realtime-ugc.md'],
    intro: `**Nightcord**（以下简称"本服务"或"我们"）非常重视用户的隐私保护。本隐私政策旨在向您说明我们如何收集、使用、存储和保护您的个人信息。

**请您务必仔细阅读并充分理解本政策，特别是以加粗形式标注的条款。在使用本服务之前，请确认您已充分理解并同意本政策。如果您不同意本政策的任何内容，请立即停止使用本服务。**`
  },
  'terms-sekai-pass': {
    title: '用户服务协议',
    service: 'SEKAI Pass',
    url: 'https://id.nightcord.de5.net',
    version: '1.3',
    base: 'terms-base.md',
    supplements: ['authentication.md'],
    intro: `欢迎使用 **SEKAI Pass**（以下简称"本服务"）！

本服务是一个单点登录 (SSO) 认证系统。为使用本服务，您应当阅读并遵守《用户服务协议》（以下简称"本协议"）。**请您务必审慎阅读、充分理解各条款内容，特别是免除或者限制责任的条款、知识产权条款、法律适用和争议解决条款等。限制、免责条款可能以加粗形式提示您注意。**

**除非您已阅读并接受本协议所有条款，否则您无权使用本服务。您的注册、登录、授权等行为即视为您已阅读并同意本协议的约束。**

**如果您未满 14 周岁，请勿使用本服务。** 如果您是 14 周岁以上、18 周岁以下的未成年人，请在法定监护人的陪同下阅读本协议，并在取得监护人书面同意后使用本服务。`
  },
  'terms-25ji': {
    title: '用户服务协议',
    service: '『25时、Nightcord见。』成员们的 24 小时工作日常',
    url: 'https://25ji.nightcord.de5.net',
    version: '3.1',
    base: 'terms-base.md',
    supplements: ['local-storage.md', 'realtime-ugc.md', 'copyright-pjsekai.md'],
    intro: `欢迎使用『25时、Nightcord见。』成员们的 24 小时工作日常（以下简称"本服务"）！

为使用本服务，您应当阅读并遵守《用户服务协议》（以下简称"本协议"）。**请您务必审慎阅读、充分理解各条款内容，特别是免除或者限制责任的条款、知识产权条款、法律适用和争议解决条款等。限制、免责条款可能以加粗形式提示您注意。**

**除非您已阅读并接受本协议所有条款，否则您无权使用本服务。您的访问、使用、浏览等行为即视为您已阅读并同意本协议的约束。**

**如果您未满 14 周岁，请勿使用本服务。** 如果您是 14 周岁以上、18 周岁以下的未成年人，请在法定监护人的陪同下阅读本协议，并在取得监护人书面同意后使用本服务。`
  },
  'terms-nightcord': {
    title: '用户服务协议',
    service: 'Nightcord',
    url: 'https://nightcord.de5.net',
    version: '1.0',
    base: 'terms-base.md',
    supplements: ['realtime-ugc.md'],
    intro: `欢迎使用 **Nightcord**（以下简称"本服务"）！

为使用本服务，您应当阅读并遵守《用户服务协议》（以下简称"本协议"）。**请您务必审慎阅读、充分理解各条款内容，特别是免除或者限制责任的条款、知识产权条款、法律适用和争议解决条款等。限制、免责条款可能以加粗形式提示您注意。**

**除非您已阅读并接受本协议所有条款，否则您无权使用本服务。您的访问、使用、浏览等行为即视为您已阅读并同意本协议的约束。**

**如果您未满 14 周岁，请勿使用本服务。** 如果您是 14 周岁以上、18 周岁以下的未成年人，请在法定监护人的陪同下阅读本协议，并在取得监护人书面同意后使用本服务。`
  }
};

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf-8');
}

function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf-8');
}

function buildDocument(docKey, config) {
  const today = new Date().toISOString().split('T')[0];
  const [year, month, day] = today.split('-');
  const dateStr = `${year}年${month}月${day}日`;

  let content = `# ${config.title}\n\n`;
  content += `**最后更新日期：${dateStr}**\n\n`;
  content += `**版本：${config.version}**\n\n`;
  content += `---\n\n`;
  content += `## 导言\n\n`;
  content += `${config.intro}\n\n`;
  content += `---\n\n`;

  // 读取补充文档内容
  const supplementContents = config.supplements.map(supplement => {
    const supplementPath = path.join(SUPPLEMENTS_DIR, supplement);
    let supplementContent = readFile(supplementPath);

    // 移除补充文档的标题和适用范围说明
    supplementContent = supplementContent.replace(/^#[^\n]+\n\n/, '');
    supplementContent = supplementContent.replace(/^>[^\n]+\n\n/, '');
    supplementContent = supplementContent.replace(/^---\n\n/, '');

    return supplementContent;
  });

  // 插入补充内容
  content += supplementContents.join('\n\n---\n\n');
  content += '\n\n---\n\n';

  // 读取基础文档内容
  const basePath = path.join(BASE_DIR, config.base);
  let baseContent = readFile(basePath);

  // 移除基础文档的标题和说明
  baseContent = baseContent.replace(/^#[^\n]+\n\n/, '');
  baseContent = baseContent.replace(/^>[^\n]+\n\n/, '');
  baseContent = baseContent.replace(/^---\n\n/, '');

  content += baseContent;
  content += '\n\n---\n\n';
  content += `*（完）*\n`;

  // 写入完整文档
  const outputPath = path.join(COMPLETE_DIR, `${docKey}.md`);
  writeFile(outputPath, content);

  console.log(`✅ Generated: ${docKey}.md`);
}

function main() {
  console.log('🔨 Building legal documents...\n');

  // 确保输出目录存在
  if (!fs.existsSync(COMPLETE_DIR)) {
    fs.mkdirSync(COMPLETE_DIR, { recursive: true });
  }

  // 构建所有文档
  for (const [docKey, config] of Object.entries(DOCUMENTS)) {
    buildDocument(docKey, config);
  }

  console.log('\n✨ All documents generated successfully!');
}

main();
