import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { createNkRouter } from './router';
import { installCdnImgFallback, startCdnHealthProbe, subscribeCdnHealth } from '../services/cdn';
import { useAppStore } from './stores/app';
import { initAccent } from '../lib/theme';
import '../styles/tokens.css';
import '../styles/catalog.css';

export async function bootstrap(): Promise<void> {
  initAccent();
  const app = createApp(App);
  const router = createNkRouter();
  app.use(createPinia());
  app.use(router);
  app.mount('#app');
  installCdnImgFallback();
  startCdnHealthProbe();
  subscribeCdnHealth((down) => {
    const store = useAppStore();
    if (down) store.toast('warn', 'CDN 资源暂不可用，图片与动画已降级展示', 5000);
    else store.toast('success', 'CDN 已恢复，图片自动重载');
  });
  await router.isReady();
}
