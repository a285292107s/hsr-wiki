import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { createNkRouter } from './router';
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
  await router.isReady();
}
