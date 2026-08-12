import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

/**
 * Spine Lab 独立 Vite 子应用（研究线，与主项目双向隔离）：
 * - root 指向 spine-lab 自身；共享引擎层（../src/spine、services、lib）经 fs.allow 放行
 * - publicDir 指向主项目 public/：manifest 数据走 LOCAL_DATA_BASE（/data/cn/...）直接可访问
 * - 独立端口 5174（strictPort），与主项目 5173 互不抢占
 */
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [vue()],
  publicDir: fileURLToPath(new URL('../public', import.meta.url)),
  server: {
    port: 5174,
    strictPort: true,
    fs: {
      allow: [fileURLToPath(new URL('..', import.meta.url))],
    },
  },
  build: {
    outDir: 'dist',
  },
});