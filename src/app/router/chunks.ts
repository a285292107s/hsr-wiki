import { loadSpineRuntime } from '../../spine/runtime';

export const preloadCatalog = () => import('../views/CatalogView.vue');

export const preloadCharacterDetail = () => import('../views/CharacterView.vue');
export const preloadLightconeDetail = () => import('../views/LightconeView.vue');
export const preloadRelicDetail = () => import('../views/RelicView.vue');

export const preloadHome = () => import('../views/HomeView.vue');
export const preloadCurrencyHub = () => import('../views/CurrencyHubView.vue');
export const preloadCurrencyRoleDetail = () => import('../views/CurrencyRoleView.vue');
export const preloadVoracity = () => import('../views/VoracityView.vue');
export const preloadEndgameMode = () => import('../views/EndgameModeView.vue');

const PREFETCH_MAP: Record<string, () => Promise<unknown>> = {
  '/': preloadHome,
  '/character': preloadCatalog,
  '/lightcone': preloadCatalog,
  '/relic': preloadCatalog,
  '/item': preloadCatalog,
  '/monster': preloadCatalog,
  '/endgame/maze': preloadEndgameMode,
  '/endgame/story': preloadEndgameMode,
  '/endgame/boss': preloadEndgameMode,
  '/endgame/peak': preloadEndgameMode,
  '/voracity': preloadVoracity,
  '/currency': preloadCurrencyHub,
  '/currency/role': preloadCatalog,
  '/currency/item': preloadCatalog,
  '/currency/buff': preloadCatalog,
  '/currency/augment': preloadCatalog,
  '/currency/trait': preloadCatalog,
};

export function prefetchByPath(path: string): void {
  const fn = PREFETCH_MAP[path];
  if (fn) void fn();
}

export function prefetchHighPriority(): void {
  const run = (): void => {
    void preloadCatalog();
    void preloadCharacterDetail();
    if (window.matchMedia('(min-width: 1024px)').matches) {
      void loadSpineRuntime();
    }
  };
  if ('requestIdleCallback' in window) {
    requestIdleCallback(run, { timeout: 2000 });
  } else {
    setTimeout(run, 200);
  }
}
