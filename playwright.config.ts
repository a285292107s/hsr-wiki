import { defineConfig, devices } from '@playwright/test';
import os from 'node:os';
import path from 'node:path';

// 常规收集排除的环境无关 / 慢档标签：@font-calibrated（字体度量依平台）、@visual-detail（锁版式的
// 脆弱几何断言，回归证据保留但不进常规收集）、@i18n-detail（逐键词典枚举对比，冒烟由 locales-smoke
// 与构建期 i18n 守卫兜底）。三者只在显式 --grep 或慢档专门 job 里跑。
// **回看必须走 `E2E_DETAIL=1`**：`grepInvert` 没有 CLI 覆盖开关，「保留证据」若只有标签而无开关，
// 那些用例就成了不可执行的黑洞——`--grep @visual-detail` 在 grepInvert 下手一条也收不到。
const detailExcludes = [/@visual-detail/, /@i18n-detail/];
const calibratedExclude = /@font-calibrated/;
const routineExclude = process.env.CI ? [...detailExcludes, calibratedExclude] : detailExcludes;
const chromiumGrepInvert = process.env.E2E_DETAIL === '1' ? undefined : routineExclude;
const mobileSlowExcludes = process.env.E2E_DETAIL === '1' ? [] : [...detailExcludes, calibratedExclude];

export default defineConfig({
  testDir: './e2e',
  outputDir: path.join(os.tmpdir(), 'hsr-wiki-e2e-results'),
  snapshotPathTemplate: './e2e/snapshots/{testFilePath}/{arg}{ext}',
  fullyParallel: false,
  workers: 2,
  retries: 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: 'http://localhost:6188',
    viewport: { width: 1280, height: 720 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'firefox-layout-contract',
      use: { ...devices['Desktop Firefox'] },
      testMatch: /layout-character.*\.spec\.ts/,
      grep: /@cross-engine/,
      grepInvert: process.env.CI && process.env.E2E_DETAIL !== '1' ? [calibratedExclude] : undefined,
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      grepInvert: chromiumGrepInvert,
    },
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 7'] },
      testIgnore: [/visual\.spec\.ts/, /accessibility\.spec\.ts/],
      // @viewport-pinned / @viewport-independent：自钉或断点无关，手机档不必重跑；@visual-detail /
      // @i18n-detail / @font-calibrated：慢档专属，常规收集一律收起（CI 与本机一致）。
      grepInvert: [/@viewport-pinned/, /@viewport-independent/, ...mobileSlowExcludes],
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:6188',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
