/*
 * Copyright 2026 The 25-ji-code-de Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * API 文档里的示例必须能跑通。
 *
 * ── 由来 ────────────────────────────────────────────────────────
 *
 * `docs/api/sekai-pass.md` 一度**自相矛盾**：
 *
 *   「Token 端点」参考章节写得完全正确 ——
 *      Content-Type: application/x-www-form-urlencoded，
 *      表格里列着 code_verifier，没有 client_secret。
 *
 *   而底部「示例」章节的 JS 与 Python 代码三处全错 ——
 *      发 JSON、缺 code_verifier、多发 client_secret。
 *
 * **人们复制的是示例，不是表格。** 而这三处不是风格问题：
 *
 *   1. 服务端读的是 `await c.req.formData()`，对 JSON 体直接抛 TypeError
 *      （实测过：`Request.formData()` 报 "Content-Type was not one of
 *      multipart/form-data or application/x-www-form-urlencoded"）
 *   2. OAuth 2.1 强制 PKCE，缺 code_verifier 换不到 token
 *   3. client_secret 拿不到也用不上 —— 本服务只支持 none 与 private_key_jwt
 *
 * 也就是说：照着示例写的人，**一行都跑不通**。
 *
 * 这批测试盯的是「示例与同一份文档里的参考说同一件事」。
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');

/**
 * 取出所有代码块，附带语言标记。
 *
 * `\r?\n` 不是多余的 —— 第一版写死 `\n`，而文件是 CRLF，于是**一个代码块都
 * 没匹配到**。三条「没有发 JSON / 都带 code_verifier / 没有 client_secret」
 * 全部空过。是那条「确实找到了示例」的守卫把它拦下来的。
 */
function codeBlocks(md) {
  const out = [];
  for (const m of md.matchAll(/```(\w*)\r?\n([\s\S]*?)```/g)) {
    out.push({ lang: m[1], body: m[2], at: m.index });
  }
  return out;
}

/** 去掉代码里的注释 —— 断言「某个名字在不在」之前必须先剥。 */
function stripComments(code, lang) {
  if (lang === 'python') return code.replace(/#[^\n]*/g, '');
  return code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}

describe('sekai-pass 的 token 交换示例', () => {
  const md = read('docs/api/sekai-pass.md');
  const blocks = codeBlocks(md);

  /** 涉及 /oauth/token 的示例块（排除 http 那种协议示意块）。 */
  const tokenBlocks = blocks.filter(
    (b) => /oauth\/token/.test(b.body) && ['js', 'javascript', 'python', 'bash', 'sh'].includes(b.lang),
  );

  test('确实找到了 token 交换的示例（否则下面几条是空跑）', () => {
    assert.ok(tokenBlocks.length >= 3, `只找到 ${tokenBlocks.length} 个，正则多半写错了`);
  });

  test('没有任何示例发 JSON body —— 服务端读的是表单', () => {
    const bad = tokenBlocks.filter(
      (b) =>
        /'Content-Type':\s*'application\/json'/.test(b.body) ||
        /"Content-Type":\s*"application\/json"/.test(b.body) ||
        /requests\.post\([^)]*\bjson=/.test(b.body),
    );
    assert.deepEqual(
      bad.map((b) => b.lang),
      [],
      '这些示例用 JSON body 打 /oauth/token —— formData() 会抛 TypeError，一行都跑不通',
    );
  });

  test('每个示例都带 code_verifier —— OAuth 2.1 强制 PKCE', () => {
    /*
     * 判据落在**代码**上，不是「块里出现过这个词」。
     *
     * 第一版写的是 `/code_verifier/.test(b.body)` —— 而我在示例上方加的
     * 解释性注释里正好写着「code_verifier 必需」，于是把那一行删掉，
     * 这条断言照样通过。反向验证抓出来的。
     *
     * 这是我今天第四次栽在同一件事上：**断言某个名字在不在，必须先剥注释。**
     */
    const missing = tokenBlocks
      .filter((b) => /grant_type/.test(b.body) && /authorization_code/.test(b.body))
      .filter((b) => !/code_verifier/.test(stripComments(b.body, b.lang)));
    assert.deepEqual(
      missing.map((b) => b.lang),
      [],
      '这些 authorization_code 示例缺 code_verifier，换不到 token',
    );
  });

  test('没有任何示例发 client_secret', () => {
    /*
     * 允许在**说明文字**里提到它（比如「本服务不用 client_secret」），
     * 禁的是在示例代码里当成参数发出去。
     */
    const bad = tokenBlocks.filter((b) => /^\s*['"]?client_secret['"]?\s*:/m.test(b.body));
    assert.deepEqual(
      bad.map((b) => b.lang),
      [],
      '这些示例发了 client_secret —— 本服务的两种客户端认证方式都不用它',
    );
  });
});

describe('参考章节与示例章节不打架', () => {
  const md = read('docs/api/sekai-pass.md');

  test('参考章节声明的是 form-urlencoded', () => {
    // 这一条钉的是「参考本来就是对的」这个前提
    const section = /### Token 端点[\s\S]*?(?=\r?\n### )/.exec(md)?.[0] ?? '';
    assert.ok(section, '找不到「Token 端点」一节');

    /*
     * 断言的是那个 `http` 块里的 Content-Type，不是「这一节里出现过
     * form-urlencoded」—— 同一节下面的 curl 示例里也有这个字符串，
     * 于是把 http 块改成 application/json，宽松的断言照样通过。
     * 反向验证抓出来的。
     */
    const httpBlock = codeBlocks(section).find((b) => b.lang === 'http');
    assert.ok(httpBlock, '「Token 端点」一节里找不到 http 块');
    assert.match(
      httpBlock.body,
      /Content-Type:\s*application\/x-www-form-urlencoded/,
      '参考章节声明的 Content-Type 不是 form-urlencoded',
    );

    assert.match(section, /code_verifier/);
    assert.doesNotMatch(section, /client_secret/);
  });
});

describe('接入指引与开放平台一致', () => {
  const md = read('docs/guide/sekai-pass.md');

  test('不再教人「联系管理员登记应用」', () => {
    // 开放平台上线后这条就不成立了；照着做的人会去找一个不需要找的人
    assert.doesNotMatch(md, /联系管理员登记应用/);
  });

  test('指向自助创建的位置', () => {
    assert.match(md, /\/apps/, '没有告诉人自助管理在哪儿');
  });

  test('说清两种客户端认证方式，且不含糊其辞', () => {
    assert.match(md, /private_key_jwt/);
    // 「通常无需 client_secret」这种写法暗示有时需要 —— 而它从来不需要
    assert.doesNotMatch(md, /通常无需\s*`?client_secret/);
  });
});
