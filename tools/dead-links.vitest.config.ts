/**
 * 死链审计专用 vitest 配置（低频，数据变更时触发；不入 pnpm test 常规全量）
 * 用法：pnpm vitest run --config tools/dead-links.vitest.config.ts
 *
 * environment 必须为 node：死链探测用 Node 原生 fetch（undici，无 CORS），
 * happy-dom 的浏览器式 fetch 会发 OPTIONS 预检（对 CDN 的预检被 403 拒绝，实测）。
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tools/dead-links.test.ts'],
  },
});