#!/usr/bin/env node
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