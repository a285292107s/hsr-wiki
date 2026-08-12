#!/usr/bin/env node
/**
 * 构建守卫统一入口（build 前置，CI 挂接）：
 *   node tools/check-guards.mjs
 *
 * 依次运行三个独立守卫（各脚本保持可单独运行）：
 *   1. check-colors.mjs --strict        色彩令牌收口（ADR 0012）
 *   2. check-spine-manifest.mjs         双清单结构校验
 *   3. check-contrast.mjs --strict      令牌 WCAG 对比度
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