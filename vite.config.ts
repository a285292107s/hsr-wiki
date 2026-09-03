import { defineConfig, type Plugin } from 'vite';
import vue from '@vitejs/plugin-vue';
import { readdirSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * data-file-index dev 中间件（原 spine-lab 独立子应用插件并入）：
 * 研究线调试台「死链审核」面板在浏览器端拉取 /data/cn/data-file-index.json
 * （public/data/cn 全量 JSON 相对路径清单）做 URL 收集——浏览器无目录遍历 API，
 * dev 下由本中间件实时扫描磁盘（文件增删即时生效）。
 * 生产构建不含 /debug（import.meta.env.DEV 摇树），本清单仅 dev 需要，无需 build 产物。
 */
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

/** 全量 JSON 相对路径（正斜杠），相对 public/data/cn/ */
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
    // 固定端口 + 严格失败：被占用时明确报错，避免静默递增导致端口堆积。
    // 6188：冷门端口（避开 Vite 默认 5173 等常用段，防与他项目 dev server 撞端口）
    port: 6188,
    strictPort: true,
    watch: {
      // 坑位（2026-08-13 实证）：rolldown-vite 8（Vite 8.1.5）Windows 下原生文件事件偶发丢失，
      // 且 transform 缓存无 mtime 兜底——事件丢失后该文件 transform 结果永久陈旧（改 CSS 不生效）。
      // 轮询模式降低丢失率。注意：曾尝试「周期内容触碰」自动修复（见 docs/memory/2026-08-13.md），
      // 已因并发写入破坏源文件废弃（多实例/多进程时 append+覆盖竞争），勿再引入自动改源文件的方案。
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
