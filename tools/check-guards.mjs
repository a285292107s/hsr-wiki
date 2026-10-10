#!/usr/bin/env node
/**
 * 构建守卫统一入口（build 前置，CI 挂接）：node tools/check-guards.mjs
 *
 * 依次运行七个独立守卫（各脚本保持可单独运行）：
 *   1. check-colors.mjs --strict        色彩令牌收口
 *   2. check-spine-manifest.mjs         双清单结构校验
 *   3. check-contrast.mjs --strict      令牌 WCAG 对比度
 *   4. check-languages.mjs              语言清单两侧一致（converter ↔ 前端）+ 上游交叉校验
 *   5. check-i18n-packs.mjs             语言包覆盖（结构层令牌 ↔ 各语言语言包，含缺键）
 *   6. check-i18n-messages.mjs          UI 词典（13 语言键集对齐 / 空值 / 漏译 / 代码键拼写）
 *   7. check-ui-chinese.mjs             界面中文（代码里不得写死中文界面文案；白名单见脚本头部）
 *
 * 任一守卫失败即聚合摘要并退出码 1；全部通过输出一行 PASS。
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const ROOT = fileURLToPath(new URL('../', import.meta.url));

const GUARDS = [
  ['check-colors.mjs', '--strict'],
  ['check-spine-manifest.mjs'],
  ['check-contrast.mjs', '--strict'],
  ['check-languages.mjs'],
  ['check-i18n-packs.mjs'],
  ['check-i18n-messages.mjs'],
  ['check-ui-chinese.mjs'],
];

const results = [];
for (const [script, ...args] of GUARDS) {
  const r = spawnSync(process.execPath, [join('tools', script), ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const ok = r.status === 0;
  results.push({ script, ok, output: (r.stdout || '') + (r.stderr || '') });
  process.stdout.write(r.stdout || '');
  process.stderr.write(r.stderr || '');
}

const failed = results.filter((r) => !r.ok);
console.log(failed.length === 0
  ? `[PASS] ${results.length} 个守卫全部通过`
  : `[FAIL] ${failed.length}/${results.length} 个守卫失败: ${failed.map((r) => r.script).join(', ')}`);
process.exit(failed.length === 0 ? 0 : 1);