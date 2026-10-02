import { defineConfig, devices } from '@playwright/test';
import os from 'node:os';
import path from 'node:path';

export default defineConfig({
  testDir: './e2e',
  outputDir: path.join(os.tmpdir(), 'hsr-wiki-e2e-results'),
  snapshotPathTemplate: './e2e/snapshots/{testFilePath}/{arg}{ext}',
  // 并行实测过（见 docs/agents/commands.md）：墙钟 −19% 但 3 次全量里 1 次出现并发竞态 flake
  // （同一用例串行 2/2 与单独 3/3 均绿）——收益不足以换 flake，故保持串行。
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: 'http://localhost:6188',
    viewport: { width: 1280, height: 720 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 7'] },
      testIgnore: [/visual\.spec\.ts/, /accessibility\.spec\.ts/],
      grepInvert: /@viewport-pinned/,
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:6188',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
