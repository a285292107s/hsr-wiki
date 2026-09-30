export const STAR_SVG =
  '<svg class="nk-cat-select__star" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.26L21.5 9.3l-4.75 4.4 1.15 6.8L12 17.3l-5.9 3.2 1.15-6.8L2.5 9.3l6.6-1.04z"/></svg>';

export const loadCwCatalogCss = (): Promise<unknown> => import('../../../../src/styles/currency-catalog.css');
