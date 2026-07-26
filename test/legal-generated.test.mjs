/*
 * Copyright 2026 The 25-ji-code-de Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * 法律文档：生成物必须是最新的，日期必须是有人决定的。
 *
 * ── 两件事 ──────────────────────────────────────────────────────
 *
 * **一、`最后更新日期` 曾经是构建当天。**
 *
 * `build-legal.mjs` 里写的是 `new Date()`，于是每次部署这个日期都变 ——
 * 而条款内容可能一个字没改。用户正是靠它判断「条款是不是变了」，
 * 于是这个信号全是噪音；看几次假警报之后就没人再看了。
 *
 * 而 `版本` 字段本来就是真正的变更标记，日期把它的作用抵消掉了。
 *
 * 现在取自配置里的 `updated`，改条款时手动更新 ——
 * 这是一个应当有人**决定**的动作，不该是构建的副产品。
 *
 * **二、`complete/*.md` 是生成物却提交进了仓。**
 *
 * 这本身就要求「仓里的那份必须等于生成器现在产出的那份」，否则**读仓库的人
 * 看到的法律文档，与线上发布的不是同一份**（线上是 CI 现场构建的）。
 *
 * 对普通文档这只是不整洁；对法律文档是另一回事。
 *
 * （我一度把这条写成「仓里的落后 90 行」—— 说反了。实际是 Windows 上未归一化
 *   行尾的生成器**多**产出 90 行本该剥掉的标题，仓里那份是对的。
 *   看 diff 时把方向读反了。）
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const COMPLETE = join(root, 'docs/legal/complete');
const files = readdirSync(COMPLETE).filter((f) => f.endsWith('.md'));

describe('最后更新日期', () => {
  test('目录里有生成的文档（否则下面几条是空跑）', () => {
    assert.ok(files.length >= 6, `只找到 ${files.length} 个文档`);
  });

  test('构建脚本不再用构建当天做日期', () => {
    const src = readFileSync(join(root, 'scripts/build-legal.mjs'), 'utf8');
    /*
     * 断言的是**取日期的那一行**，不是「文件里不出现 new Date」——
     * 解释「为什么改掉」的注释里当然会提到它。
     */
    const fn = /function buildDocument[\s\S]*?\n\}/.exec(src)?.[0] ?? '';
    assert.ok(fn, '找不到 buildDocument');
    const dateSource = /const \[year, month, day\] = ([^;]+);/.exec(fn)?.[1] ?? '';
    assert.match(
      dateSource,
      /config\.updated/,
      `日期取自 ${dateSource.trim()} —— 应当取自配置的 updated`,
    );
  });

  test('每个文档配置都声明了 updated，且格式合法', () => {
    const src = readFileSync(join(root, 'scripts/build-legal.mjs'), 'utf8');
    const versions = [...src.matchAll(/^\s*version: '/gm)].length;
    const dates = [...src.matchAll(/^\s*updated: '(\d{4}-\d{2}-\d{2})',/gm)];
    assert.equal(
      dates.length,
      versions,
      `${versions} 个文档有 version，但只有 ${dates.length} 个有合法的 updated`,
    );
  });

  test('生成物里的日期与配置一致，且不是今天', () => {
    /*
     * 「不是今天」这一条会在真的改了条款、且当天就构建时误报 ——
     * 那种时候把 updated 改成今天是**正确**的，此时应当更新这条测试
     * 的例外，而不是把它删掉。
     */
    const today = new Date();
    const todayStr = `${today.getFullYear()}年${String(today.getMonth() + 1).padStart(2, '0')}月${String(today.getDate()).padStart(2, '0')}日`;
    for (const f of files) {
      const text = readFileSync(join(COMPLETE, f), 'utf8');
      const m = /\*\*最后更新日期：([^*]+)\*\*/.exec(text);
      assert.ok(m, `${f} 里找不到最后更新日期`);
      assert.notEqual(
        m[1],
        todayStr,
        `${f} 的日期正好是今天 —— 若不是真的今天改了条款，说明日期又变成构建产物了`,
      );
    }
  });
});

describe('生成物是最新的', () => {
  test('重跑生成器之后 complete/ 没有变化', () => {
    /*
     * 仓里的 complete/*.md 是生成物。它们一旦落后于生成器，
     * **读仓库的人看到的法律文档就与线上发布的不是同一份** ——
     * 线上是对的（CI 每次现构建），仓里的是旧的。
     *
     * 这条会真的跑一次生成器（写文件），然后问 git 有没有变化。
     * 如果本来就是最新的，重写的内容一模一样，什么都不会变。
     */
    let dirtyBefore;
    try {
      dirtyBefore = execFileSync('git', ['status', '--porcelain', 'docs/legal/complete'], {
        cwd: root, encoding: 'utf8',
      }).trim();
    } catch {
      // 不在 git 检出里（比如 npm 包解压后），这条跳过而不是假装通过
      return;
    }
    assert.equal(
      dirtyBefore,
      '',
      '跑测试前 complete/ 就有未提交的改动，这条测不出东西 —— 先提交或还原',
    );

    execFileSync(process.execPath, [join(root, 'scripts/build-legal.mjs')], {
      cwd: root, stdio: 'ignore',
    });

    const dirtyAfter = execFileSync('git', ['status', '--porcelain', 'docs/legal/complete'], {
      cwd: root, encoding: 'utf8',
    }).trim();

    assert.equal(
      dirtyAfter,
      '',
      '重跑生成器之后 complete/ 变了 —— 仓里的法律文档落后于生成器。\n' +
        '跑 `npm run legal:build` 并提交结果。\n' +
        dirtyAfter,
    );
  });
});
