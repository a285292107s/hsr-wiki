import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { i18n, setI18nLocale, translate } from './i18n';
import { createNkRouter } from './router';
import { installCdnImgFallback, startCdnHealthProbe, subscribeCdnHealth } from '../services/cdn';
import { useAppStore } from './stores/app';
import { initAccent } from '../lib/theme';
import { loadEnumLabels } from '../lib/enum-labels';
import { setLabelTranslator } from '../lib/label-translator';
import { setActiveLocale } from '../lib/i18n/active';
import { localeFromPath } from '../lib/i18n/locales';
import '../styles/tokens.css';
import '../styles/catalog.css';
import '../styles/fonts.css';

export async function bootstrap(): Promise<void> {
  const locale = localeFromPath(window.location.pathname);
  setActiveLocale(locale.code);
  setI18nLocale(locale.code);
  document.documentElement.lang = locale.culture;
  document.querySelector('meta[name="description"]')?.setAttribute('content', translate('meta.description'));

  initAccent();
  setLabelTranslator(translate);
  await loadEnumLabels();
  const app = createApp(App);
  const router = createNkRouter();
  app.use(createPinia());
  app.use(i18n);
  app.use(router);
  app.mount('#app');
  installCdnImgFallback();
  startCdnHealthProbe();
  subscribeCdnHealth((down) => {
    const store = useAppStore();
    if (down) store.toast('warn', translate('toast.cdnDown'), 5000);
    else store.toast('success', translate('toast.cdnUp'));
  });
  await router.isReady();
}
