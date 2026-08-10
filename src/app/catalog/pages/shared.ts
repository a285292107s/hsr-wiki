/** 目录页共享常量 */
export const STAR_SVG =
  '<svg class="nk-cat-chip__star" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.26L21.5 9.3l-4.75 4.4 1.15 6.8L12 17.3l-5.9 3.2 1.15-6.8L2.5 9.3l6.6-1.04z"/></svg>';

/**
 * 货币战争目录专属样式 loader（5 个 CW 目录共用：nk-cw-card / nk-crole-card 卡片定义）。
 * 随路由并行加载（CatalogPageConfig.styles 声明，路由层统一消费）。
 */
export const loadCwCatalogCss = (): Promise<unknown> => import('../../../../src/styles/currency-catalog.css');
