import { escHtml, gridFightIconUrl, fmtDesc } from '../../../lib/format';
import { loadLocalCurrencyPortals } from '../../../services/api';
import type { CatalogItem, CatalogPageConfig } from '../types';
import { loadCwCatalogCss } from './shared';

function renderPortalCard(item: CatalogItem, index = 0): string {
  const icon = gridFightIconUrl(item.icon as string);
  const desc = fmtDesc(item.desc as string, item.params as number[]);
  /* 卡名 2 行截断（P1）后长译文的全文仍需可达：完整名挂卡根 title（触屏无 hover 时唯一复原通道）。 */
  return `<div class="nk-cw-card nk-cw-portal-card" style="--i:${index}" title="${escHtml(item.name)}">
      <div class="nk-cw-card__icon"><img loading="lazy" src="${escHtml(icon)}" alt="${escHtml(item.name)}"></div>
      <div class="nk-cw-card__body">
        <div class="nk-cw-card__name">${escHtml(item.name)}</div>
        <div class="nk-cw-card__desc">${desc}</div>
      </div>
    </div>`;
}

export const currencyPortalPage: CatalogPageConfig = {
  id: 'currency-portal',
  titleKey: 'catalog.titleWithMode',
  titleArgs: { mode: 'catalog.currencyWar', name: 'nav.cwPortal' },
  subtitle: 'PORTALS',
  searchKey: 'catalog.cwPortal.search',
  gridClass: 'nk-cat-grid nk-cw-grid nk-cw-grid--wide',
  cardClass: '.nk-cw-card',
  styles: [loadCwCatalogCss],
  async fetchData() {
    const { portals } = await loadLocalCurrencyPortals();
    return portals
      .filter((p) => p.in_book)
      .map((p) => ({
        id: String(p.id),
        name: p.title,
        icon: p.icon,
        desc: p.desc,
        params: p.params,
      }));
  },
  renderCard: (item, i) => renderPortalCard(item, i),
};
