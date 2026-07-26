import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  base: '/hsr_wiki/',
  server: {
    watch: {
      ignored: ['**/vendor/**', '**/tools/**'],
    },
  },
});
