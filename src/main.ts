/**
 * 油猴入口（vite-plugin-monkey entry，run-at: document-start）
 *
 * 同步段仅纯 vanilla：创建平台（initFailsafe 立即隐藏宿主并启动分段计时）。
 * Vue 应用代码走动态导入——油猴构建时 vite-plugin-monkey 用 SystemJS 将
 * 全部 chunk 内联进单文件；CDN external Vue 全部失败时脚本在隐藏宿主前
 * 即终止（天然降级，用户看到原站，零白屏）。
 */
import { createUserscriptPlatform } from './platform/userscript';
import { setPlatform } from './platform';
import { shouldTakeOver } from './lib/route-gate';

// 路由门：非接管路径（光锥/遗器详情等）保持静默，宿主原站正常渲染。
// 必须在创建平台（initFailsafe 隐藏宿主）之前判定。
if (!shouldTakeOver(location.pathname)) {
  // eslint-disable-next-line no-console
  console.info('[nk-wiki] route not handled by phase-1, host in control:', location.pathname);
} else {
  const p = createUserscriptPlatform();
  setPlatform(p);

  void (async () => {
    try {
      const { bootstrap } = await import('./app/bootstrap');
      // 应用 chunk 已加载解析（external Vue 就绪）→ 推进 vue-loaded 段
      p.markStage('vue-loaded');
      await bootstrap();
    } catch (e) {
      p.degrade(e instanceof Error ? e.message : String(e));
    }
  })();
}
