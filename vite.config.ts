import { defineConfig, type Plugin } from 'vite';
import vue from '@vitejs/plugin-vue';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const PUBLIC_DIR = fileURLToPath(new URL('./public', import.meta.url));
const DATA_CN_DIR = join(PUBLIC_DIR, 'data', 'cn');
const DATA_INDEX_PATH = '/data/cn/data-file-index.json';
const SRC_DIR = fileURLToPath(new URL('./src', import.meta.url));
const HERO_FOCUS_PATH = '/__lab/hero-focus';
const HERO_FOCUS_FILE = join(SRC_DIR, 'data', 'currency-hero-focus.json');

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

function heroFocusDevPlugin(): Plugin {
  return {
    name: 'hero-focus-lab',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url || '').split('?')[0];
        if (url !== HERO_FOCUS_PATH) return next();
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        if (req.method === 'GET') {
          try {
            res.end(readFileSync(HERO_FOCUS_FILE, 'utf8'));
          } catch {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'read failed' }));
          }
          return;
        }
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'method not allowed' }));
          return;
        }
        const chunks: Buffer[] = [];
        req.on('data', (c: Buffer) => chunks.push(c));
        req.on('end', () => {
          try {
            const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
            if (!body || typeof body !== 'object' || typeof body.roles !== 'object') {
              throw new Error('invalid shape');
            }
            writeFileSync(HERO_FOCUS_FILE, `${JSON.stringify({ roles: body.roles }, null, 2)}\n`, 'utf8');
            res.end(JSON.stringify({ ok: true }));
          } catch (e) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: String(e) }));
          }
        });
      });
    },
    handleHotUpdate(ctx) {
      const norm = (f: string) => f.split('\\').join('/').toLowerCase();
      if (norm(ctx.file) !== norm(HERO_FOCUS_FILE)) return;
      const mods = ctx.server.moduleGraph.getModulesByFile(HERO_FOCUS_FILE);
      if (!mods) return [];
      mods.forEach((m) => ctx.server.moduleGraph.invalidateModule(m));
      return [];
    },
  };
}

export default defineConfig({
  plugins: [vue(), dataFileIndexDevPlugin(), heroFocusDevPlugin()],
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
