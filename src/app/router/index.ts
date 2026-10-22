import { createRouter, createWebHistory, type RouteRecordRaw, type Router } from 'vue-router';
import { ref } from 'vue';
import { pageTitle } from '../seo';
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
    path: '/formula',
    name: 'formula',
    component: () => import('../views/FormulaView.vue'),
    meta: { depth: 1, titleKey: 'nav.formula' },
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
    history: createWebHistory(localeBaseFromPath(window.location.pathname)),
    routes,
    scrollBehavior(_to, _from, savedPosition) {
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
    const key = to.meta.titleKey as string | undefined;
    const args = to.meta.titleArgs as Record<string, string> | undefined;
    const title = key
      ? (args
        ? translate(key, Object.fromEntries(Object.entries(args).map(([n, k]) => [n, translate(k)])))
        : translate(key))
      : '';
    document.title = title ? pageTitle(title) : pageTitle();
  });

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
