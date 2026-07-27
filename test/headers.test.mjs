/*
 * Copyright 2026 The 25-ji-code-de Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * `_headers` 里强制生效的每一条，都必须有个成立的前提。
 *
 * ── 为什么要测这个 ──────────────────────────────────────────────
 *
 * `Content-Security-Policy`（强制那条，不是 Report-Only）写了
 * `form-action 'none'`。这条成立的前提是**构建产物里一个 <form> 都没有**。
 * 哪天有人加了个反馈表单，页面不会报错、不会白屏 —— 表单只是**静默失效**，
 * 点提交没反应。那是最难被发现的一类故障。
 *
 * 所以这里不测「_headers 里写了什么」（那是重复抄一遍），而是测
 * **写下那几条时依赖的事实现在还成不成立**。
 *
 * ── 与 nightcord 的差别 ─────────────────────────────────────────
 *
 * nightcord 把 `script-src 'self'` 提进了强制那条，因为它全站零内联 script。
 * 本站做不到：VitePress 每页都输出内联 script，其中 `__VP_HASH_MAP__`
 * 的内容每次构建都变，连哈希白名单都用不了。
 *
 * 下面那条「本站确实有内联 script」的测试，钉的就是这个**差别本身** ——
 * 如果哪天 VitePress 不再输出内联 script 了，它会红，提醒可以收紧。
 * 测试红在这里不是坏消息，是「可以更严了」的通知。
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const HEADERS = join(root, 'docs/public/_headers');
const DIST = join(root, 'docs/.vitepress/dist');

/** 递归收集构建产物里的 html。 */
function htmlFiles(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...htmlFiles(p));
    else if (name.endsWith('.html')) out.push(p);
  }
  return out;
}

/** 去掉 html 注释 —— 断言「有没有某个标签」之前必须先剥。 */
const stripHtmlComments = (s) => s.replace(/<!--[\s\S]*?-->/g, '');

/** 从 _headers 里读某个响应头的值（`/*` 那一组）。 */
function headerValue(name) {
  const text = readFileSync(HEADERS, 'utf8');
  // 注释里逐字引用了这些头名，得先把 # 开头的行剥掉
  const body = text
    .split(/\r?\n/)
    .filter((l) => !l.trimStart().startsWith('#'))
    .join('\n');
  const m = new RegExp(`^\\s*${name}:\\s*(.+)$`, 'im').exec(body);
  return m?.[1].trim() ?? null;
}

describe('_headers 存在且放对了地方', () => {
  test('文件在 docs/public/ 下', () => {
    /*
     * Cloudflare Pages 只认**输出根目录**里的 _headers。
     * VitePress 把 <srcDir>/public/ 整个拷到输出根，所以必须是这个位置；
     * 放在仓库根或 docs/ 下都不会生效，而且不会有任何报错。
     */
    assert.ok(existsSync(HEADERS), 'docs/public/_headers 不存在');
  });

  test('规则作用于全站', () => {
    const text = readFileSync(HEADERS, 'utf8');
    assert.match(text, /^\/\*\s*$/m, '没有 /* 这一组规则');
  });
});

describe('强制生效的 CSP 依赖的前提仍然成立', () => {
  const pages = htmlFiles(DIST);

  test('构建产物存在（否则下面几条是空跑）', () => {
    assert.ok(
      pages.length >= 10,
      `只找到 ${pages.length} 个 html —— 先跑 npm run docs:build`,
    );
  });

  test("form-action 'none'：全站没有任何 <form>", () => {
    const withForm = pages
      .filter((p) => /<form[\s>]/i.test(stripHtmlComments(readFileSync(p, 'utf8'))))
      .map((p) => p.slice(DIST.length + 1));
    assert.deepEqual(
      withForm,
      [],
      "这些页面有 <form>，而强制生效的 CSP 写着 form-action 'none' —— " +
        '提交会被浏览器静默拦掉（不报错、不白屏，只是点了没反应）。' +
        "要么去掉表单，要么把 form-action 放宽成 'self'",
    );
    assert.match(headerValue('Content-Security-Policy') ?? '', /form-action 'none'/);
  });

  test("object-src 'none'：全站没有 <object> / <embed>", () => {
    const withObject = pages
      .filter((p) => /<(object|embed)[\s>]/i.test(stripHtmlComments(readFileSync(p, 'utf8'))))
      .map((p) => p.slice(DIST.length + 1));
    assert.deepEqual(withObject, [], "这些页面有 <object>/<embed>，会被 object-src 'none' 挡掉");
  });

  test("base-uri 'self'：全站没有 <base>", () => {
    const withBase = pages
      .filter((p) => /<base[\s>]/i.test(stripHtmlComments(readFileSync(p, 'utf8'))))
      .map((p) => p.slice(DIST.length + 1));
    assert.deepEqual(withBase, [], '这些页面有 <base> 标签');
  });
});

describe('放宽的地方确实需要放宽', () => {
  const pages = htmlFiles(DIST);

  test("script-src 留着 'unsafe-inline' 是因为 VitePress 真的输出内联 script", () => {
    /*
     * 这条**期望内联 script 存在**。
     *
     * 它红的时候是好消息：说明 VitePress 不再输出内联 script 了，
     * 可以把 script-src 'self' 提进强制生效那条（nightcord 就是这么做的）。
     */
    let inline = 0;
    for (const p of pages.slice(0, 50)) {
      const html = stripHtmlComments(readFileSync(p, 'utf8'));
      inline += (html.match(/<script(?![^>]*\ssrc=)[^>]*>/gi) ?? []).length;
    }
    assert.ok(
      inline > 0,
      "构建产物里已经没有内联 script 了 —— 可以把 script-src 'self' 提进强制生效那条 CSP，" +
        '并同步改掉 _headers 里那段说明',
    );

    const enforced = headerValue('Content-Security-Policy') ?? '';
    assert.doesNotMatch(
      enforced,
      /script-src/,
      '强制生效那条里出现了 script-src —— 站里还有内联 script，这会让每个页面的主题初始化被拦',
    );
  });

  test('没有外部资源来源需要额外放行', () => {
    /*
     * Report-Only 那条写的是 `default-src 'self'` + `img-src 'self' data:`，
     * 前提是站里没有外部字体、外部图片、外部脚本。
     *
     * 只看**会发起加载**的属性（src / 样式里的 url()），不看 <a href> ——
     * 页面里指向 hub / id / api 的链接全是导航，CSP 管不着。
     */
    const external = new Set();
    for (const p of pages.slice(0, 50)) {
      const html = stripHtmlComments(readFileSync(p, 'utf8'));
      for (const m of html.matchAll(/\ssrc="(https?:\/\/[^"]+)"/gi)) external.add(m[1]);
      for (const m of html.matchAll(/url\((https?:\/\/[^)]+)\)/gi)) external.add(m[1]);
    }
    assert.deepEqual(
      [...external],
      [],
      "这些外部资源会被 Report-Only 的 default-src 'self' 报出来 —— 要么内置，要么在策略里放行",
    );
  });
});

describe('几个不该丢的头', () => {
  for (const [name, re] of [
    ['X-Frame-Options', /^DENY$/],
    ['X-Content-Type-Options', /^nosniff$/],
    ['Referrer-Policy', /strict-origin/],
  ]) {
    test(name, () => {
      const v = headerValue(name);
      assert.ok(v, `_headers 里没有 ${name}`);
      assert.match(v, re);
    });
  }

  test('frame-ancestors 与 X-Frame-Options 说的是同一件事', () => {
    // 两者不一致的话，行为取决于浏览器支持哪个 —— 那是最难查的一类不一致
    assert.match(headerValue('Content-Security-Policy') ?? '', /frame-ancestors 'none'/);
    assert.equal(headerValue('X-Frame-Options'), 'DENY');
  });
});
