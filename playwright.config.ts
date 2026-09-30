import { defineConfig, devices } from '@playwright/test';
import os from 'node:os';
import path from 'node:path';

export default defineConfig({
  testDir: './e2e',
  outputDir: path.join(os.tmpdir(), 'hsr-wiki-e2e-results'),
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
