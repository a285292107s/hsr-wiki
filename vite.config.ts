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
      ignored: ['**/vendor/**', '**/tools/**'],
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
