import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

/**
 * Spine Lab 独立 Vitest 配置（研究线单测，不进主项目 pnpm test）：
 * include 限定 spine-lab/src，与主项目测试隔离。
 */
export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: ['src/**/__tests__/**/*.test.ts'],
    root: fileURLToPath(new URL('.', import.meta.url)),
  },
});