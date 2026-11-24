import { imgHtml } from '../../../lib/image';
import { escHtml, gridFightIconUrl, fmtDesc } from '../../../lib/format';
import { loadLocalCurrencyPortals } from '../../../services/api';
import type { CatalogItem, CatalogPageConfig } from '../types';
import { loadCwCatalogCss } from './shared';

function renderPortalCard(item: CatalogItem, index = 0): string {
  const icon = gridFightIconUrl(item.icon as string);
  const desc = fmtDesc(item.desc as string, item.params as number[]);
  return `<div class="nk-cw-card nk-cw-portal-card" style="--i:${index}" title="${escHtml(item.name)}">
      <div class="nk-cw-card__icon">${imgHtml(icon, { alt: item.name as string, loading: 'lazy' })}</div>
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
  skeleton: { variant: 'row' },
  styles: [loadCwCatalogCss],
  async fetchData(ctx) {
    const { portals, season } = await loadLocalCurrencyPortals();
    const currentSeason = ctx?.cwSeason ?? season?.id ?? null;
    return portals
      .filter((p) => p.in_book)
      .filter((p) => currentSeason == null || p.season_id === currentSeason)
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
