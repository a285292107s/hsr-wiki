/**
 * 路由表 + 方向过渡
 * 路径与深度沿用原脚本模块注册表（router.js）：
 *   home(0) / achievement(1) / generic-catalog(2) / character-catalog(3) / character(4)
 * 深度差决定页面过渡方向（navDir：1=前进深入，-1=返回，0=平级）。
 * meta.endgameTab：终局 4 路由互为同页 Tab——共享 transition key 与组件 key，
 * 互切时不触发页面过渡、不重建目录引擎。
 */
import { createRouter, createWebHashHistory, type RouteRecordRaw, type Router } from 'vue-router';
import { ref } from 'vue';

/** 导航方向（驱动 nk-enter-fwd / nk-enter-back 过渡动画） */
export const navDir = ref<1 | -1 | 0>(0);

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    alias: '/hsr',
    name: 'home',
    component: () => import('../views/HomeView.vue'),
    meta: { depth: 0 },
  },
  {
    path: '/character',
    name: 'catalog-character',
    component: () => import('../views/CatalogView.vue'),
    meta: { depth: 3, catalog: 'character' },
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
    meta: { depth: 2, catalog: 'lightcone' },
  },
  {
    path: '/relic',
    name: 'catalog-relic',
    component: () => import('../views/CatalogView.vue'),
    meta: { depth: 2, catalog: 'relic' },
  },
  {
    path: '/item',
    name: 'catalog-item',
    component: () => import('../views/CatalogView.vue'),
    meta: { depth: 2, catalog: 'item' },
  },
  {
    path: '/monster',
    name: 'catalog-monster',
    component: () => import('../views/CatalogView.vue'),
    meta: { depth: 2, catalog: 'monster' },
  },
  {
    path: '/maze',
    name: 'catalog-maze',
    component: () => import('../views/CatalogView.vue'),
    meta: { depth: 2, catalog: 'maze', endgameTab: true },
  },
  {
    path: '/story',
    name: 'catalog-story',
    component: () => import('../views/CatalogView.vue'),
    meta: { depth: 2, catalog: 'story', endgameTab: true },
  },
  {
    path: '/boss',
    name: 'catalog-boss',
    component: () => import('../views/CatalogView.vue'),
    meta: { depth: 2, catalog: 'boss', endgameTab: true },
  },
  {
    path: '/peak',
    name: 'catalog-peak',
    component: () => import('../views/CatalogView.vue'),
    meta: { depth: 2, catalog: 'peak', endgameTab: true },
  },
  {
    path: '/currency',
    name: 'catalog-currency',
    component: () => import('../views/CatalogView.vue'),
    meta: { depth: 2, catalog: 'currency' },
  },
  {
    // 成就页为宿主增强模块，与「宿主 100% 隐藏」新架构不兼容，第二期重构；
    // 第一期展示占位页，保持 HOME_NAV 8 项导航完整。
    path: '/achievement',
    name: 'achievement',
    component: () => import('../views/PlaceholderView.vue'),
    meta: { depth: 1, title: '成就' },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
];

export function createNkRouter(): Router {
  const router = createRouter({
    history: createWebHashHistory(),
    routes,
  });

  router.beforeEach((to, from) => {
    const dTo = typeof to.meta.depth === 'number' ? to.meta.depth : 0;
    const dFrom = typeof from.meta.depth === 'number' ? from.meta.depth : 0;
    navDir.value = dTo > dFrom ? 1 : dTo < dFrom ? -1 : 0;
    return true;
  });

  return router;
}
