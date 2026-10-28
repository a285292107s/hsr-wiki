#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
const skipBuild = args.includes('--skip-build');
const passthrough = args.filter((a) => a !== '--skip-build');

const runNode = (cli, argv, extraEnv = {}) => {
  const full = [cli, ...argv];
  const r = spawnSync(process.execPath, full, {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, ...extraEnv },
  });
  return r.status ?? 1;
};

const viteCli = join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js');
const pwCli = join(ROOT, 'node_modules', '@playwright', 'test', 'cli.js');
if (!existsSync(pwCli)) {
  console.error('未找到 @playwright/test，请先 pnpm install');
  process.exit(1);
}

if (!skipBuild) {
  if (!existsSync(viteCli)) {
    console.error('未找到 vite，请先 pnpm install');
    process.exit(1);
  }
  console.log('[e2e:prod] vite build');
  const built = runNode(viteCli, ['build', '--logLevel', 'warn']);
  if (built !== 0) process.exit(built);
}

const testArgs = passthrough.length ? passthrough : ['--project=chromium'];
console.log(`[e2e:prod] playwright test ${testArgs.join(' ')}（baseURL=http://localhost:6189）`);
process.exit(runNode(pwCli, ['test', ...testArgs], { E2E_PREVIEW: '1' }));
