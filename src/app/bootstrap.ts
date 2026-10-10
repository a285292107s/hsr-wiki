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

export async function bootstrap(): Promise<void> {
  /* 语言在**页面加载期**一次性确定（ADR 0052 决策 5：切语言走整页导航）：数据层按它取对应语言包，
     根元素 `lang` 供无障碍 / 排版 / 爬虫读取。router history base 由同一个解析结果决定（见 router/index.ts）。 */
  const locale = localeFromPath(window.location.pathname);
  setActiveLocale(locale.code);
  setI18nLocale(locale.code);
  document.documentElement.lang = locale.culture;
  /* 站点描述随语言：`index.html` 里的静态值只有缺省语言那一份，不改写就等于所有语言的
     搜索结果 / 分享摘要都是中文（`og:*` 是品牌名、语言无关，故只处理 description）。 */
  document.querySelector('meta[name="description"]')?.setAttribute('content', translate('meta.description'));

  initAccent();
  /* 注入词典翻译：`lib/` 不 import 应用层，故由 app 层注入（见 lib/currency-role.ts 的 setLabelTranslator） */
  setLabelTranslator(translate);
  /* 枚举标签表在挂载前加载（标签是同步读取的；见 lib/enum-labels.ts 的说明） */
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
