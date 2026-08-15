/** 目录页共享常量 */
/* 内嵌 SVG 选项图标（星标等）约定：经筛选选项 label 的 span v-html 渲染后与文本 inline 混排，
   默认 baseline 对齐会使图标底边贴文本基线而向上浮起错位——
   新增内嵌 SVG 图标必须在 catalog.css 配 .nk-cat-select__opt .nk-cat-select__{class} 且带 vertical-align: middle；
   URL 图片图标走 opt.icon 字段（flex 子元素天然居中），无此问题 */
export const STAR_SVG =
  '<svg class="nk-cat-select__star" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.26L21.5 9.3l-4.75 4.4 1.15 6.8L12 17.3l-5.9 3.2 1.15-6.8L2.5 9.3l6.6-1.04z"/></svg>';

/**
 * 货币战争目录专属样式 loader（5 个 CW 目录共用：nk-cw-card / nk-crole-card 卡片定义）。
 * 随路由并行加载（CatalogPageConfig.styles 声明，路由层统一消费）。
 */
export const loadCwCatalogCss = (): Promise<unknown> => import('../../../../src/styles/currency-catalog.css');
