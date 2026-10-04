import { defineConfig, devices } from '@playwright/test';
import os from 'node:os';
import path from 'node:path';

// CI 层不收集 `@font-calibrated`（当前 2 条「骨架↔就绪同框」）：它们比「骨架盒高 == 就绪面板内容高」，
// 而就绪内容高由若干 `line-height: normal` 行盒求和而成，比例随**解析到的回退字体**变——Linux runner 上
// Firefox 实测比标定源（Windows）高 3.0 / 2.0px，故判定依赖平台。按「环境相关判定不进 CI」（与像素基线
// 移出 CI 同一条理由，见 docs/agents/testing.md）只在 CI 下不收集；本机 `pnpm test:e2e` 全量仍判。
const fontCalibrated = /@font-calibrated/;
const ciFontCalibratedExclude = process.env.CI ? fontCalibrated : undefined;

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
      grepInvert: ciFontCalibratedExclude,
    },
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 7'] },
      testIgnore: [/visual\.spec\.ts/, /accessibility\.spec\.ts/],
      grepInvert: process.env.CI ? [/@viewport-pinned/, fontCalibrated] : /@viewport-pinned/,
    },
    // Firefox 只跑角色详情页的布局契约（`@viewport-pinned` 用例自钉视口，不受项目默认视口影响）。
    // 存在理由：滚动驱动动画在 Firefox **不支持**（`CSS.supports('animation-timeline','scroll()')` = false），
    // 而缺 `@supports` 门时动画会退回普通时间轴跑完并停在末帧 ⇒ 媒体层永久下移 36px（本轮实测到的真实缺陷）。
    // **不扩到全部 layout 用例**：那是「三引擎 × 全量」，墙钟与既有 flake 面都会成倍放大，收益不匹配。
    // 未覆盖：WebKit 与其余 spec —— 见 docs/audit/角色详情页验收标准.md 的 B3 条目。
    {
      name: 'firefox-layout-contract',
      use: { ...devices['Desktop Firefox'] },
      testMatch: /layout-character\.spec\.ts/,
      grepInvert: ciFontCalibratedExclude,
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:6188',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
