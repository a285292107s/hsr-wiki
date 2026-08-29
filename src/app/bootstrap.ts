import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { createNkRouter } from './router';
import { installCdnImgFallback, startCdnHealthProbe, subscribeCdnHealth } from '../services/cdn';
import { useAppStore } from './stores/app';
import { initAccent } from '../lib/theme';
import { initCwAccent } from '../lib/cw-theme';
// 全局样式仅保留设计令牌与共享目录引擎；页面专属样式随路由 chunk 懒加载
// （character/lightcone/relic/currency-* 各自视图内 import）
import '../styles/tokens.css';
import '../styles/catalog.css';

export async function bootstrap(): Promise<void> {
  // 在挂载前写入持久化主题强调色（常规 data-accent + CW data-cw-accent，避免首帧主题闪烁）
  initAccent();
  initCwAccent();
  const app = createApp(App);
  const router = createNkRouter();
  app.use(createPinia());
  app.use(router);
  app.mount('#app');
  // 全局 CDN 图片回退委托：覆盖 v-html 卡片（data-cdn-fallback）的主源失效回退 + 最终降级标记
  installCdnImgFallback();
  // CDN 健康探测（fire-and-forget）：down 短路 / 恢复重载的信号源
  startCdnHealthProbe();
  // CDN 状态变化提示：down 提示降级，恢复提示自动重载（探测异步完成，pinia 已就绪）
  subscribeCdnHealth((down) => {
    const store = useAppStore();
    if (down) store.toast('warn', 'CDN 资源暂不可用，图片与动画已降级展示', 5000);
    else store.toast('success', 'CDN 已恢复，图片自动重载');
  });
  await router.isReady();
}
