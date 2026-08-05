import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { createNkRouter } from './router';
import { installCdnImgFallback } from '../services/cdn';
// 全局样式仅保留设计令牌与共享目录引擎；页面专属样式随路由 chunk 懒加载
// （character/lightcone/relic/currency-* 各自视图内 import）
import '../styles/tokens.css';
import '../styles/catalog.css';

export async function bootstrap(): Promise<void> {
  const app = createApp(App);
  const router = createNkRouter();
  app.use(createPinia());
  app.use(router);
  app.mount('#app');
  // 全局 CDN 图片回退委托：覆盖 v-html 卡片（data-cdn-fallback）的官方源失效回退
  installCdnImgFallback();
  await router.isReady();
}
