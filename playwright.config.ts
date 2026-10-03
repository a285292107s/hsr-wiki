import { defineConfig, devices } from '@playwright/test';
import os from 'node:os';
import path from 'node:path';

export default defineConfig({
  testDir: './e2e',
  outputDir: path.join(os.tmpdir(), 'hsr-wiki-e2e-results'),
  snapshotPathTemplate: './e2e/snapshots/{testFilePath}/{arg}{ext}',
  // `fullyParallel: false` 只禁**文件内**并行；文件级并行始终生效。layout 按域拆成 `layout-*.spec.ts`
  // 后，单文件不再是唯一调度单元，全量墙钟 327s → 约 150s，且每条用例的隔离性与拆分前一致
  // （文件内本就串行，未新增用例级并发面）。
  //
  // `workers: 2` 是实测的「无 flake 又有收益」平衡点：
  //  - 不限并发（Playwright 取 CPU 半数，本机 12 核 → 6）：84 用例必现 4 条 30s 超时，单独复跑全绿；
  //  - 3 worker：仍偶发 1 条超时（角色详情 1212 强化图标，实测该用例在**未拆分的 HEAD 原文件**上
  //    4 跑挂 3，与本次拆分无关，属既有 CDN 竞态——见 docs/memory/2026-10 的坑位记录）；
  //  - 2 worker：连续 3 轮全量 84/84 全绿，墙钟约 5.3 分钟。
  // 换句话说：2 worker 拿到约 40% 提速，代价为零；再往上买到的是 flake。**勿上调**。
  fullyParallel: false,
  workers: 2,
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
