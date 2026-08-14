import { fileURLToPath, URL } from 'node:url';
import { readdirSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import vue from '@vitejs/plugin-vue';

/**
 * Spine Lab 独立 Vite 子应用（研究线，与主项目双向隔离）：
 * - root 指向 spine-lab 自身；共享引擎层（../src/spine、services、lib）经 fs.allow 放行
 * - publicDir 指向主项目 public/：manifest 数据走 LOCAL_DATA_BASE（/data/cn/...）直接可访问
 * - 独立端口 5174（strictPort），与主项目 5173 互不抢占
 *
 * 死链审核数据清单插件（data-file-index）：
 * - 浏览器无目录遍历 API，Node 版 dead-links.test.ts 的 walkJson 目录扫描不可移植
 * - 插件在 /data/cn/data-file-index.json 暴露 public/data/cn 全量 JSON 相对路径：
 *   dev 用中间件实时扫描（文件增删即时生效）；build 经 emitFile 写入 dist 产物
 * - 清单与磁盘内容一致 → 死链引擎 URL 收集与 Node 版零漂移，converter 新增模块自动覆盖
 */
const PUBLIC_DIR = fileURLToPath(new URL('../public', import.meta.url));
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

/** 全量 JSON 相对路径（正斜杠），相对 public/data/cn/ */
function buildIndex(): string[] {
  return walkJson(DATA_CN_DIR)
    .map((f) => f.slice(DATA_CN_DIR.length + 1).split(sep).join('/'))
    .sort();
}

function dataFileIndexPlugin(): Plugin {
  return {
    name: 'lab-data-file-index',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url !== DATA_INDEX_PATH) return next();
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify(buildIndex()));
      });
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'data/cn/data-file-index.json',
        source: JSON.stringify(buildIndex()),
      });
    },
  };
}

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [vue(), dataFileIndexPlugin()],
  publicDir: PUBLIC_DIR,
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
