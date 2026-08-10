/** 货币战争 · 投资环境图鉴目录页配置 */
import { escHtml, gridFightIconUrl, fmtDesc } from '../../../lib/format';
import { loadLocalCurrencyPortals } from '../../../services/api';
import type { CatalogItem, CatalogPageConfig } from '../types';
import { loadCwCatalogCss } from './shared';

function renderPortalCard(item: CatalogItem, index = 0): string {
  const icon = gridFightIconUrl(item.icon as string);
  const desc = fmtDesc(item.desc as string, item.params as number[]);
  return `<div class="nk-cw-card nk-cw-portal-card" style="--i:${index}">
      <div class="nk-cw-card__icon"><img loading="lazy" src="${escHtml(icon)}" alt="${escHtml(item.name)}"></div>
      <div class="nk-cw-card__body">
        <div class="nk-cw-card__name">${escHtml(item.name)}</div>
        <div class="nk-cw-card__desc">${desc}</div>
      </div>
    </div>`;
}

export const currencyPortalPage: CatalogPageConfig = {
  id: 'currency-portal',
  title: '货币战争 · 投资环境',
  searchPlaceholder: '搜索投资环境…',
  gridClass: 'nk-cat-grid nk-cw-grid nk-cw-grid--wide',
  cardClass: '.nk-cw-card',
  /* CW 卡片共享样式（nk-cw-card） */
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
