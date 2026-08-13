import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  base: '/',
  server: {
    // 固定端口 + 严格失败：被占用时明确报错，避免静默递增导致端口堆积
    port: 5173,
    strictPort: true,
    watch: {
      // 坑位（2026-08-13 实证）：rolldown-vite 8（Vite 8.1.5）Windows 下原生文件事件偶发丢失，
      // 且 transform 缓存无 mtime 兜底——事件丢失后该文件 transform 结果永久陈旧（改 CSS 不生效）。
      // 轮询模式不依赖系统事件，必配；删除后复发概率大。
      usePolling: true,
      interval: 300,
      ignored: [
        '**/vendor/**',
        '**/tools/**',
        // public/data 2953 文件走静态服务不经 transform 缓存，无需监听；排除防轮询开销
        '**/public/data/**',
      ],
    },
  },
  build: {
    rollupOptions: {
      output: {
        // 框架库独立 vendor chunk：vue/pinia/vue-router 长期不变，利于浏览器缓存与并行加载
        // （Vite 8 仅支持函数形式 manualChunks）
        manualChunks(id) {
          if (
            id.includes('node_modules/vue/') ||
            id.includes('node_modules/@vue/') ||
            id.includes('node_modules/pinia') ||
            id.includes('node_modules/vue-router')
          ) {
            return 'vendor';
          }
        },
      },
    },
  },
});
