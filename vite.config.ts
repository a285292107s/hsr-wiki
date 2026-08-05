import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  base: '/',
  server: {
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
