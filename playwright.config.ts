import { defineConfig, devices } from '@playwright/test';
import os from 'node:os';
import path from 'node:path';

/**
 * Playwright e2e / 布局验收层（AGENTS.md「验证流程」的自动化落地）
 *
 * 定位：把 T1b/T2 的「一次性 CDP 取证」固化为可重复的测试基线——
 * - toHaveCSS / 溢出检测 → T1b 布局结构变更
 * - toHaveText / toHaveCount / toMatchAriaSnapshot → T2 模板与数据流
 * - toHaveScreenshot → L4 像素基线（本地 Percy，基线提交 git，-u 更新）
 * - @axe-core/playwright → a11y 维度（新增能力空白）
 * - console / pageerror 监听 → CDN 404 / JS 异常自动守卫
 *
 * Vercel 为静态托管：webServer 直接起 vite dev server，无需任何视觉平台。
 * 单 Chromium 起步（多浏览器使截图基线 ×3 且易 flaky，官方亦建议单浏览器起步）。
 */
export default defineConfig({
  testDir: './e2e',
  // 测试产物（失败截图/trace）放系统临时目录：适配 WorkBuddy safe-delete shim——
  // shim 对 OS 临时目录下的删除走原生直删（shouldUseNativeDelete 豁免通道），
  // 而项目内路径会走回收站 trash，genie-trash 在 Windows 文件占用时会 fail-closed 抛错
  // 导致 playwright 清理 outputDir 中止。产物为诊断临时物，放 temp 不损失价值。
  outputDir: path.join(os.tmpdir(), 'hsr-wiki-e2e-results'),
  // 截图基线随 git 提交；本地开发用 --update-snapshots 刷新
  snapshotPathTemplate: './e2e/snapshots/{testFilePath}/{arg}{ext}',
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
      // 移动端布局守护（P1-2）：只跑 layout（溢出/结构/console 守卫），
      // 不跑 visual 像素基线（避免基线 ×2 维护成本）与 a11y（视口不影响，避免重复扫描成本）
      name: 'mobile-chromium',
      use: { ...devices['Pixel 7'] },
      testIgnore: [/visual\.spec\.ts/, /accessibility\.spec\.ts/],
    },
  ],
  webServer: {
    // 复用已有 6188 实例（AGENTS.md：先探测端口复用），无实例才新起
    command: 'pnpm dev',
    url: 'http://localhost:6188',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
