#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const pwCli = join(ROOT, 'node_modules', '@playwright', 'test', 'cli.js');
if (!existsSync(pwCli)) {
  console.error('未找到 @playwright/test，请先 pnpm install');
  process.exit(1);
}

const files = [
  'e2e/layout-locales-smoke.spec.ts',
  'e2e/layout-locales-sweep.spec.ts',
  'e2e/layout-i18n-overflow.spec.ts',
  'e2e/layout-i18n-overflow-mobile.spec.ts',
  'e2e/layout-endgame-overflow.spec.ts',
];

console.log(`[e2e:full] playwright test ${files.length} 个文件（13 语言 × 三档长文案）`);
const r = spawnSync(process.execPath, [pwCli, 'test', ...files, ...process.argv.slice(2)], {
  cwd: ROOT,
  stdio: 'inherit',
  env: { ...process.env, SMOKE_SCOPE: 'all', I18N_OVERFLOW_ALL: '1' },
});
process.exit(r.status ?? 1);
