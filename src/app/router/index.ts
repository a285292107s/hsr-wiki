import { createRouter, createWebHistory, type RouteRecordRaw, type Router } from 'vue-router';
import { ref } from 'vue';
import { SITE_NAME } from '../../lib/constants';

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
    meta: { depth: 0, title: '首页' },
  },
  {
    path: '/character',
    name: 'catalog-character',
    component: () => import('../views/CatalogView.vue'),
    meta: { depth: 3, catalog: 'character', title: '角色图鉴' },
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
    meta: { depth: 2, catalog: 'lightcone', title: '光锥图鉴' },
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
    meta: { depth: 2, catalog: 'relic', title: '遗器图鉴' },
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
    meta: { depth: 2, catalog: 'item', title: '物品' },
  },
  {
    path: '/monster',
    name: 'catalog-monster',
    component: () => import('../views/CatalogView.vue'),
    meta: { depth: 2, catalog: 'monster', title: '敌对物种' },
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
    meta: { depth: 2, catalog: 'endgame', title: '终局内容' },
  },
  {
    path: '/endgame/:mode/:id(\\d+)',
    name: 'endgame-season',
    component: () => import('../views/EndgameView.vue'),
    meta: { depth: 3, title: '赛季详情' },
  },
  { path: '/endgame/maze', redirect: '/endgame' },
  { path: '/endgame/story', redirect: '/endgame' },
  { path: '/endgame/boss', redirect: '/endgame' },
  { path: '/endgame/peak', redirect: '/endgame' },
  { path: '/maze', redirect: '/endgame' },
  { path: '/story', redirect: '/endgame' },
  { path: '/boss', redirect: '/endgame' },
  { path: '/peak', redirect: '/endgame' },
  {
    path: '/currency',
    name: 'currency-hub',
    component: () => import('../views/CurrencyHubView.vue'),
    meta: { depth: 0, cw: true, title: '货币战争' },
  },
  {
    path: '/currency/role',
    name: 'catalog-currency-role',
    component: catalogView('currency-role'),
    meta: { depth: 1, catalog: 'currency-role', cw: true, title: '货币战争 · 角色图鉴' },
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
    meta: { depth: 1, catalog: 'currency-equipment', cw: true, title: '货币战争 · 装备图鉴' },
  },
  {
    path: '/currency/buff',
    name: 'catalog-currency-portal',
    component: catalogView('currency-portal'),
    meta: { depth: 1, catalog: 'currency-portal', cw: true, title: '货币战争 · 投资环境' },
  },
  {
    path: '/currency/augment',
    name: 'catalog-currency-augment',
    component: catalogView('currency-augment'),
    meta: { depth: 1, catalog: 'currency-augment', cw: true, title: '货币战争 · 投资策略' },
  },
  {
    path: '/currency/trait',
    name: 'catalog-currency-trait',
    component: catalogView('currency-trait'),
    meta: { depth: 1, catalog: 'currency-trait', cw: true, title: '货币战争 · 羁绊图鉴' },
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
    meta: { depth: 0, cw: true, title: '设置' },
  },
  {
    path: '/achievement',
    name: 'catalog-achievement',
    component: catalogView('achievement'),
    meta: { depth: 1, catalog: 'achievement', title: '成就' },
  },
  {
    path: '/voracity',
    name: 'voracity',
    component: () => import('../views/VoracityView.vue'),
    meta: { depth: 1, title: '贪饕污染' },
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('../views/SettingsView.vue'),
    meta: { depth: 0, title: '设置' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../views/NotFoundView.vue'),
    meta: { depth: 0, title: '页面未找到' },
  },
];

export function createNkRouter(): Router {
  const router = createRouter({
    history: createWebHistory(),
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
    const t = to.meta.title as string | undefined;
    document.title = t ? `${t} - ${SITE_NAME}` : SITE_NAME;
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
      meta: { depth: 0, title: '调试台' },
    });
  }

  return router;
}
