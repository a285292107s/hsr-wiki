/**
 * 路由 chunk 预加载函数
 * Vite dynamic import 天然返回相同 Promise（模块缓存），重复调用无副作用。
 * 侧栏 hover / 首页 idle 时调用，提前加载目标路由组件 chunk。
 */
import { loadSpineRuntime } from '../../lib/spine/runtime';

/* ─── 目录页（共享 CatalogView） ─── */
export const preloadCatalog = () => import('../views/CatalogView.vue');

/* ─── 详情页 ─── */
export const preloadCharacterDetail = () => import('../views/CharacterView.vue');
export const preloadLightconeDetail = () => import('../views/LightconeView.vue');
export const preloadRelicDetail = () => import('../views/RelicView.vue');

/* ─── 枢纽 / 特殊页 ─── */
export const preloadHome = () => import('../views/HomeView.vue');
export const preloadCurrencyHub = () => import('../views/CurrencyHubView.vue');
export const preloadCurrencyRoleDetail = () => import('../views/CurrencyRoleView.vue');

/** 路径 → 预加载函数映射（侧栏 hover 用） */
const PREFETCH_MAP: Record<string, () => Promise<unknown>> = {
  '/': preloadHome,
  '/character': preloadCatalog,
  '/lightcone': preloadCatalog,
  '/relic': preloadCatalog,
  '/item': preloadCatalog,
  '/monster': preloadCatalog,
  '/maze': preloadCatalog,
  '/endgame/maze': preloadCatalog,
  '/currency': preloadCurrencyHub,
  '/currency/role': preloadCatalog,
  '/currency/item': preloadCatalog,
  '/currency/buff': preloadCatalog,
  '/currency/augment': preloadCatalog,
  '/currency/trait': preloadCatalog,
};

/** 根据路径触发对应 chunk 预加载（无匹配时静默忽略） */
export function prefetchByPath(path: string): void {
  const fn = PREFETCH_MAP[path];
  if (fn) void fn();
}

/** 首页 idle 时预加载高频路由（角色目录 + 光锥目录）+ spine 运行时预热（~500KB CDN script，
 *  角色页/首页共用单例；提前加载消除进入有 spine 页面时的下载等待） */
export function prefetchHighPriority(): void {
  const run = (): void => {
    void preloadCatalog();
    void preloadCharacterDetail();
    void loadSpineRuntime();
  };
  if ('requestIdleCallback' in window) {
    requestIdleCallback(run, { timeout: 2000 });
  } else {
    setTimeout(run, 200);
  }
}
