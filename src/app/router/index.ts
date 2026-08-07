/**
 * 路由表 + 方向过渡
 * 深度差决定页面过渡方向（navDir：1=前进深入，-1=返回，0=平级）。
 * 终局内容合并单页（/endgame）：四模式身份为筛选选项，endgame.css 随路由并行加载。
 * meta.cw：货币战争模式路由——驱动全壳暗金主题（data-theme="cw"）与 CW 导航配置。
 * History 模式（Vercel SPA fallback）。
 */
import { createRouter, createWebHistory, type RouteRecordRaw, type Router } from 'vue-router';
import { ref } from 'vue';

/** 导航方向（驱动 nk-enter-fwd / nk-enter-back 过渡动画） */
export const navDir = ref<1 | -1 | 0>(0);

/** 终局内容单页：CatalogView + endgame.css 并行加载（样式先于渲染到达） */
const endgameCatalogView = (): Promise<typeof import('../views/CatalogView.vue').default> =>
  Promise.all([import('../views/CatalogView.vue'), import('../../styles/endgame.css')]).then(([m]) => m.default);

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

/** 成就目录视图：.nk-ach-card 卡片样式定义于 achievement.css，随路由并行加载 */
const achievementCatalogView = (): Promise<typeof import('../views/CatalogView.vue').default> =>
  Promise.all([import('../views/CatalogView.vue'), import('../../styles/achievement.css')]).then(([m]) => m.default);

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
    component: endgameCatalogView,
    meta: { depth: 2, catalog: 'endgame', title: '终局内容' },
  },
  {
    /* 赛季详情页：/endgame/:mode/:id（mode ∈ maze/story/boss/peak，与目录卡片 href 一致） */
    path: '/endgame/:mode/:id(\\d+)',
    name: 'endgame-season',
    component: () => import('../views/EndgameView.vue'),
    meta: { depth: 3, title: '赛季详情' },
  },
  /* 终局旧子路径（四模式 Tab 时代）兼容重定向 */
  { path: '/endgame/maze', redirect: '/endgame' },
  { path: '/endgame/story', redirect: '/endgame' },
  { path: '/endgame/boss', redirect: '/endgame' },
  { path: '/endgame/peak', redirect: '/endgame' },
  /* 旧路径兼容重定向 */
  { path: '/maze', redirect: '/endgame' },
  { path: '/story', redirect: '/endgame' },
  { path: '/boss', redirect: '/endgame' },
  { path: '/peak', redirect: '/endgame' },
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
    // 成就页：第二期落地为 CatalogView 目录（1869 条虚拟网格），卡片样式随路由并行加载。
    path: '/achievement',
    name: 'catalog-achievement',
    component: achievementCatalogView,
    meta: { depth: 1, catalog: 'achievement', title: '成就' },
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
    document.title = t ? `${t} - 咸鱼百科` : '咸鱼百科';
  });

  return router;
}
