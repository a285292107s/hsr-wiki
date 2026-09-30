import { defineConfig, type Plugin } from 'vite';
import vue from '@vitejs/plugin-vue';
import { readdirSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const PUBLIC_DIR = fileURLToPath(new URL('./public', import.meta.url));
const DATA_CN_DIR = join(PUBLIC_DIR, 'data', 'cn');
const DATA_INDEX_PATH = '/data/cn/data-file-index.json';

function walkJson(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walkJson(p, out);
    else if (name.endsWith('.json')) out.push(p);
  }
  return out;
}

function buildIndex(): string[] {
  return walkJson(DATA_CN_DIR)
    .map((f) => f.slice(DATA_CN_DIR.length + 1).split(sep).join('/'))
    .sort();
}

function dataFileIndexDevPlugin(): Plugin {
  return {
    name: 'data-file-index',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url !== DATA_INDEX_PATH) return next();
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify(buildIndex()));
      });
    },
  };
}

export default defineConfig({
  plugins: [vue(), dataFileIndexDevPlugin()],
  base: '/',
  server: {
    port: 6188,
    strictPort: true,
    watch: {
      usePolling: true,
      interval: 300,
      ignored: [
        '**/vendor/**',
        '**/tools/**',
        '**/public/data/**',
      ],
    },
  },
  build: {
    rollupOptions: {
      output: {
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
