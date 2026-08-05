/**
 * 路由表 + 方向过渡
 * 深度差决定页面过渡方向（navDir：1=前进深入，-1=返回，0=平级）。
 * 终局内容使用嵌套路由（/endgame/*），Tab 切换由 EndgameView 布局组件处理。
 * meta.cw：货币战争模式路由——驱动全壳暗金主题（data-theme="cw"）与 CW 导航配置。
 * History 模式（Vercel SPA fallback）。
 */
import { createRouter, createWebHistory, type RouteRecordRaw, type Router } from 'vue-router';
import { ref } from 'vue';

/** 导航方向（驱动 nk-enter-fwd / nk-enter-back 过渡动画） */
export const navDir = ref<1 | -1 | 0>(0);

/**
 * CW 目录视图：组件 chunk 与 currency-catalog.css 并行加载。
 * 样式随导航异步依赖在路由渲染前到达，不影响 400ms 主题过渡。
 */
const cwCatalogView = (): Promise<typeof import('../views/CatalogView.vue').default> =>
  Promise.all([import('../views/CatalogView.vue'), import('../../styles/currency-catalog.css')]).then(([m]) => m.default);

/** 角色图鉴目录：.nk-crole-card 卡片样式定义于 currency-role.css（详情页同源），需一并加载 */
const cwRoleCatalogView = (): Promise<typeof import('../views/CatalogView.vue').default> =>
  Promise.all([
    import('../views/CatalogView.vue'),
    import('../../styles/currency-catalog.css'),
    import('../../styles/currency-role.css'),
  ]).then(([m]) => m.default);

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
    path: '/endgame',
    component: () => import('../views/EndgameView.vue'),
    meta: { depth: 2 },
    children: [
      { path: '', redirect: '/endgame/maze' },
      { path: 'maze', name: 'catalog-maze', component: () => import('../views/CatalogView.vue'), meta: { depth: 2, catalog: 'maze', title: '终局内容 · 忘却之庭' } },
      { path: 'story', name: 'catalog-story', component: () => import('../views/CatalogView.vue'), meta: { depth: 2, catalog: 'story', title: '终局内容 · 虚构叙事' } },
      { path: 'boss', name: 'catalog-boss', component: () => import('../views/CatalogView.vue'), meta: { depth: 2, catalog: 'boss', title: '终局内容 · 末日幻影' } },
      { path: 'peak', name: 'catalog-peak', component: () => import('../views/CatalogView.vue'), meta: { depth: 2, catalog: 'peak', title: '终局内容 · 异相仲裁' } },
    ],
  },
  /* 旧路径兼容重定向 */
  { path: '/maze', redirect: '/endgame/maze' },
  { path: '/story', redirect: '/endgame/story' },
  { path: '/boss', redirect: '/endgame/boss' },
  { path: '/peak', redirect: '/endgame/peak' },
  /* ─── 货币战争模式（独立路由树，meta.cw 驱动全壳暗金主题与 CW 导航） ─── */
  {
    path: '/currency',
    name: 'currency-hub',
    component: () => import('../views/CurrencyHubView.vue'),
    meta: { depth: 0, cw: true, title: '货币战争' },
  },
  {
    path: '/currency/role',
    name: 'catalog-currency-role',
    component: cwRoleCatalogView,
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
    component: cwCatalogView,
    meta: { depth: 1, catalog: 'currency-equipment', cw: true, title: '货币战争 · 装备图鉴' },
  },
  {
    path: '/currency/buff',
    name: 'catalog-currency-portal',
    component: cwCatalogView,
    meta: { depth: 1, catalog: 'currency-portal', cw: true, title: '货币战争 · 投资环境' },
  },
  {
    path: '/currency/augment',
    name: 'catalog-currency-augment',
    component: cwCatalogView,
    meta: { depth: 1, catalog: 'currency-augment', cw: true, title: '货币战争 · 投资策略' },
  },
  {
    path: '/currency/trait',
    name: 'catalog-currency-trait',
    component: cwCatalogView,
    meta: { depth: 1, catalog: 'currency-trait', cw: true, title: '货币战争 · 羁绊图鉴' },
  },
  {
    path: '/currency/trait/:id(\\d+)',
    name: 'currency-trait',
    component: () => import('../views/CurrencyTraitView.vue'),
    meta: { depth: 2, cw: true },
  },
  {
    // 成就页为尚未实现的扩展模块，第二期重构；第一期展示占位页。
    path: '/achievement',
    name: 'achievement',
    component: () => import('../views/PlaceholderView.vue'),
    meta: { depth: 1, title: '成就' },
  },
  /* Debug 调试中心入口：汇总各诊断子页面入口（/debug） */
  {
    path: '/debug',
    name: 'debug-hub',
    component: () => import('../views/DebugHubView.vue'),
    meta: { depth: 0, title: '调试中心' },
  },
  /* KV 场景验收台：每版本官网重新抓取的 official-scene 在此验收渲染（一键验收 + 单层状态排查，/debug/spine?scene=home-bg） */
  {
    path: '/debug/spine',
    name: 'debug-spine',
    component: () => import('../views/SpineDebugView.vue'),
    meta: { depth: 0, title: 'KV 场景验收' },
  },
  /* Spine 审核台：全量 manifest 条目批量体检（/debug/spine-audit） */
  {
    path: '/debug/spine-audit',
    name: 'debug-spine-audit',
    component: () => import('../views/SpineAuditView.vue'),
    meta: { depth: 0, title: 'Spine 审核' },
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
      // 默认 auto 交由浏览器自行优化批量；目录容器的滚动恢复由 CatalogPage 的 sessionStorage 负责。
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
    document.title = t ? `${t} - HSR Wiki` : 'HSR Wiki';
  });

  return router;
}
