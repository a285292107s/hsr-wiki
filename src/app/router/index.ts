import { createRouter, createWebHistory, type RouteRecordRaw, type Router } from 'vue-router';
import { ref } from 'vue';
import { SITE_NAME } from '../../lib/constants';
import { localeBaseFromPath } from '../../lib/i18n/locales';
import { translate } from '../i18n';

export const navDir = ref<1 | -1 | 0>(0);

const catalogView = (catalogId: string): (() => Promise<typeof import('../views/CatalogView.vue').default>) =>
  () => {
    const view = import('../views/CatalogView.vue');
    const styles = import('../catalog/pages').then(({ CATALOG_PAGES }) => CATALOG_PAGES[catalogId]?.styles || []);
    return Promise.all([view, styles]).then(async ([m, loaders]) => {
      if (loaders.length) await Promise.all(loaders.map((l) => l()));
      return m.default;
    });
  };

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomeView.vue'),
    meta: { depth: 0, titleKey: 'nav.home' },
  },
  {
    path: '/character',
    name: 'catalog-character',
    component: () => import('../views/CatalogView.vue'),
    meta: { depth: 3, catalog: 'character', titleKey: 'catalog.character.title' },
  },
  {
    path: '/character/:id(\\d+)',
    name: 'character',
    component: () => import('../views/CharacterView.vue'),
    meta: { depth: 4 },
  },
  {
    path: '/lightcone',
    name: 'catalog-lightcone',
    component: () => import('../views/CatalogView.vue'),
    meta: { depth: 2, catalog: 'lightcone', titleKey: 'catalog.lightcone.title' },
  },
  {
    path: '/lightcone/:id(\\d+)',
    name: 'lightcone',
    component: () => import('../views/LightconeView.vue'),
    meta: { depth: 3 },
  },
  {
    path: '/relic',
    name: 'catalog-relic',
    component: () => import('../views/CatalogView.vue'),
    meta: { depth: 2, catalog: 'relic', titleKey: 'catalog.relic.title' },
  },
  {
    path: '/relic/:id(\\d+)',
    name: 'relic',
    component: () => import('../views/RelicView.vue'),
    meta: { depth: 3 },
  },
  {
    path: '/item',
    name: 'catalog-item',
    component: () => import('../views/CatalogView.vue'),
    meta: { depth: 2, catalog: 'item', titleKey: 'nav.item' },
  },
  {
    path: '/monster',
    name: 'catalog-monster',
    component: () => import('../views/CatalogView.vue'),
    meta: { depth: 2, catalog: 'monster', titleKey: 'catalog.monster.title' },
  },
  {
    path: '/monster/:id(\\d+)',
    name: 'monster',
    component: () => import('../views/MonsterDetailView.vue'),
    meta: { depth: 3 },
  },
  {
    path: '/endgame',
    name: 'catalog-endgame',
    component: catalogView('endgame'),
    meta: { depth: 2, catalog: 'endgame', titleKey: 'catalog.endgame.title' },
  },
  {
    // 玩法详情页（第四种页面形态：单页数据页）——规则正文 + 结构口径 + 增益体系 + 赛季列表。
    // 正则白名单保证 `/endgame/xyz` 落到 catch-all 404，不吃掉未登记的玩法名。
    path: '/endgame/:mode(maze|story|boss|peak)',
    name: 'endgame-mode',
    component: () => import('../views/EndgameModeView.vue'),
    meta: { depth: 3, titleKey: 'route.modeDetail' },
  },
  {
    path: '/endgame/:mode/:id(\\d+)',
    name: 'endgame-season',
    component: () => import('../views/EndgameView.vue'),
    meta: { depth: 4, titleKey: 'route.seasonDetail' },
  },
  { path: '/maze', redirect: '/endgame' },
  { path: '/story', redirect: '/endgame' },
  { path: '/boss', redirect: '/endgame' },
  { path: '/peak', redirect: '/endgame' },
  {
    path: '/currency',
    name: 'currency-hub',
    component: () => import('../views/CurrencyHubView.vue'),
    meta: { depth: 0, cw: true, titleKey: 'catalog.currencyWar' },
  },
  {
    path: '/currency/role',
    name: 'catalog-currency-role',
    component: catalogView('currency-role'),
    meta: { depth: 1, catalog: 'currency-role', cw: true, titleKey: 'catalog.titleWithMode', titleArgs: { mode: 'catalog.currencyWar', name: 'nav.cwRole' } },
  },
  {
    path: '/currency/role/:id(\\d+)',
    name: 'currency-role',
    component: () => import('../views/CurrencyRoleView.vue'),
    meta: { depth: 2, cw: true },
  },
  {
    path: '/currency/item',
    name: 'catalog-currency-equipment',
    component: catalogView('currency-equipment'),
    meta: { depth: 1, catalog: 'currency-equipment', cw: true, titleKey: 'catalog.titleWithMode', titleArgs: { mode: 'catalog.currencyWar', name: 'nav.cwEquipment' } },
  },
  {
    path: '/currency/buff',
    name: 'catalog-currency-portal',
    component: catalogView('currency-portal'),
    meta: { depth: 1, catalog: 'currency-portal', cw: true, titleKey: 'catalog.titleWithMode', titleArgs: { mode: 'catalog.currencyWar', name: 'nav.cwPortal' } },
  },
  {
    path: '/currency/augment',
    name: 'catalog-currency-augment',
    component: catalogView('currency-augment'),
    meta: { depth: 1, catalog: 'currency-augment', cw: true, titleKey: 'catalog.titleWithMode', titleArgs: { mode: 'catalog.currencyWar', name: 'nav.cwAugment' } },
  },
  {
    path: '/currency/trait',
    name: 'catalog-currency-trait',
    component: catalogView('currency-trait'),
    meta: { depth: 1, catalog: 'currency-trait', cw: true, titleKey: 'catalog.titleWithMode', titleArgs: { mode: 'catalog.currencyWar', name: 'nav.cwTrait' } },
  },
  {
    path: '/currency/trait/:id(\\d+)',
    name: 'currency-trait',
    component: () => import('../views/CurrencyTraitView.vue'),
    meta: { depth: 2, cw: true },
  },
  {
    path: '/currency/settings',
    name: 'settings-cw',
    component: () => import('../views/SettingsView.vue'),
    meta: { depth: 0, cw: true, titleKey: 'nav.settings' },
  },
  {
    path: '/achievement',
    name: 'catalog-achievement',
    component: catalogView('achievement'),
    meta: { depth: 1, catalog: 'achievement', titleKey: 'nav.achievement' },
  },
  {
    path: '/voracity',
    name: 'voracity',
    component: () => import('../views/VoracityView.vue'),
    meta: { depth: 1, titleKey: 'nav.voracity' },
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('../views/SettingsView.vue'),
    meta: { depth: 0, titleKey: 'nav.settings' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../views/NotFoundView.vue'),
    meta: { depth: 0, titleKey: 'route.notFound' },
  },
];

export function createNkRouter(): Router {
  const router = createRouter({
    /* 语言前缀落在 history base（`/en/` 或 `/`）而不是复制 12 套路由表：
       路由名保持唯一、`router-link` / `router.push('/character')` 一律自动带上前缀。
       前缀在**页面加载期**由 URL 首段解析（ADR 0052：切语言走整页导航，见 SettingsView）。 */
    history: createWebHistory(localeBaseFromPath(window.location.pathname)),
    routes,
    scrollBehavior(_to, _from, savedPosition) {
      // 不指定 behavior: 'instant'：本站目录页为内部容器滚动（window 不滚），
      // instant 会在卡片初渲染的关键路径上强制同步回流，拖慢首屏。
      return savedPosition ?? { top: 0 };
    },
  });

  router.beforeEach((to, from) => {
    const dTo = typeof to.meta.depth === 'number' ? to.meta.depth : 0;
    const dFrom = typeof from.meta.depth === 'number' ? from.meta.depth : 0;
    navDir.value = dTo > dFrom ? 1 : dTo < dFrom ? -1 : 0;
    return true;
  });

  router.afterEach((to) => {
    /* 标题存**词典键**（不是中文正文）：切语言走整页导航，故这里按当前语言解析一次即可 */
    const key = to.meta.titleKey as string | undefined;
    const args = to.meta.titleArgs as Record<string, string> | undefined;
    const title = key
      ? (args
        ? translate(key, Object.fromEntries(Object.entries(args).map(([n, k]) => [n, translate(k)])))
        : translate(key))
      : '';
    document.title = title ? `${title} - ${SITE_NAME}` : SITE_NAME;
  });

  /* 研究线调试台（Spine Lab 迁入主站，dev-only 注册）：
     仅开发环境 addRoute——生产构建下 import.meta.env.DEV 被编译为 false，
     本块连同调试台视图的懒加载 chunk 一并被摇树移除（与 zzz wiki devRoutes
     同模式，实测：跨模块常量 + 数组展开分支无法消除 dynamic import，必须
     本文件内 if(DEV) 注册）。prod 无 /debug 路由：深链直接落 404、零打包。 */
  if (import.meta.env.DEV) {
    router.addRoute({
      path: '/debug',
      name: 'debug-console',
      component: () => import('../debug/DebugConsoleView.vue'),
      meta: { depth: 0, titleKey: 'nav.debug' },
    });
  }

  return router;
}
