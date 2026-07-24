import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import monkey, { cdn } from 'vite-plugin-monkey';

/**
 * 双模式构建：
 * - 默认模式（dev / build）：油猴脚本模式
 *   vite-plugin-monkey 以 src/main.ts 为入口，产出 dist/*.user.js；
 *   Vue 通过 externalGlobals 走 CDN @require（见 ADR-0001）。
 * - standalone 模式（--mode standalone）：独立预览站点
 *   常规 Vite 应用，入口 index.html → src/main.standalone.ts，产出 dist-standalone/。
 * 两种模式共享 100% 应用代码，仅入口与平台适配层不同。
 */

// 多 CDN 兜底（ADR-0001）：cdn.jsdelivr/unpkg 返回 [全局变量名, URL 函数] 元组，
// 展开为扁平数组后，多个 URL 均生成 @require——任一 CDN 加载成功即提供 window.Vue；
// 全部失败时脚本在隐藏宿主前静默退出，用户看到原站（天然降级，零白屏风险）。
const [vueGlobal, vueJsdelivrUrl] = cdn.jsdelivr('Vue', 'dist/vue.global.prod.js');
const [, vueUnpkgUrl] = cdn.unpkg('Vue', 'dist/vue.global.prod.js');

export default defineConfig(({ mode }) => {
  const standalone = mode === 'standalone';

  return {
    plugins: [
      vue(),
      ...(standalone
        ? []
        : [
            monkey({
              entry: 'src/main.ts',
              userscript: {
                name: { '': 'Nanoka HSR Wiki', 'zh-CN': 'Nanoka 星穹铁道 Wiki' },
                namespace: 'cc.nanoka.hsr-wiki',
                version: '1.0.0',
                description: '崩坏：星穹铁道 Wiki 重构版 UI（Vue 3 + TypeScript）',
                'run-at': 'document-start',
                match: [
                  'https://hsr.nanoka.cc/*',
                  'https://nanoka.cc/hsr/*',
                  'https://www.nanoka.cc/hsr/*',
                ],
              },
              build: {
                externalGlobals: {
                  vue: [vueGlobal, vueJsdelivrUrl, vueUnpkgUrl],
                },
              },
            }),
          ]),
    ],
    build: standalone ? { outDir: 'dist-standalone' } : {},
  };
});
