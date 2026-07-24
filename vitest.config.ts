import { defineConfig } from 'vitest/config';

/**
 * Vitest 独立配置（已被 tsconfig.node.json include）：
 * - vitest.config.ts 存在时优先于 vite.config.ts，测试环境不会加载 vite-plugin-monkey
 * - Phase 1 只测数据层（纯函数 / 三级缓存 / CDN API），不测组件
 * - happy-dom 提供 fetch / DOM 等浏览器 API（IndexedDB 由测试内 mock 提供）
 */
export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: ['src/**/__tests__/**/*.test.ts'],
  },
});
