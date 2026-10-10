import { escHtml, gridFightIconUrl, fmtDesc } from '../../../lib/format';
import { loadLocalCurrencyAugments } from '../../../services/api';
import type { CatalogItem, CatalogPageConfig, CatalogFilter } from '../types';
import { loadCwCatalogCss } from './shared';
import { translate } from '../../i18n';

/* 品质枚举 → 词典键（展示文案只在词典里；复用 lib 的货币枚举映射语义） */
const QUALITY_KEY: Record<string, string> = {
  Silver: 'catalog.quality.silver', Gold: 'catalog.quality.gold', Prismatic: 'catalog.quality.prismatic',
};
const QUALITY_ORDER = ['Silver', 'Gold', 'Prismatic'];

function renderAugmentCard(item: CatalogItem, index = 0): string {
  const icon = gridFightIconUrl(item.icon as string) || gridFightIconUrl(item.mini_icon as string);
  const quality = (item.quality as string) || '';
  const qLabel = QUALITY_KEY[quality] ? translate(QUALITY_KEY[quality]) : quality;
  const desc = fmtDesc(item.desc as string, item.params as number[]);
  return `<div class="nk-cw-card nk-cw-augment-card" data-quality="${escHtml(quality)}" style="--i:${index}">
      <div class="nk-cw-card__icon"><img loading="lazy" src="${escHtml(icon)}" alt="${escHtml(item.name)}"></div>
      <div class="nk-cw-card__body">
        <div class="nk-cw-card__name">${escHtml(item.name)}</div>
        ${qLabel ? `<span class="nk-cw-tag nk-cw-tag--${quality.toLowerCase()}">${escHtml(qLabel)}</span>` : ''}
        <div class="nk-cw-card__desc">${desc}</div>
      </div>
    </div>`;
}

export const currencyAugmentPage: CatalogPageConfig = {
  id: 'currency-augment',
  titleKey: 'catalog.titleWithMode',
  titleArgs: { mode: 'catalog.currencyWar', name: 'nav.cwAugment' },
  subtitle: 'AUGMENTS',
  searchKey: 'catalog.cwAugment.search',
  gridClass: 'nk-cat-grid nk-cw-grid nk-cw-grid--wide',
  cardClass: '.nk-cw-card',
  styles: [loadCwCatalogCss],
  async fetchData() {
    const { augments } = await loadLocalCurrencyAugments();
    return augments.map((a) => ({
      id: String(a.id),
      name: a.name,
      icon: a.icon,
      mini_icon: a.mini_icon,
      quality: a.quality,
      category_id: a.category_id,
      desc: a.desc,
      params: a.params,
      chapter_limit: a.chapter_limit,
    }));
  },
  buildFilters(items: CatalogItem[]) {
    const filters: CatalogFilter[] = [];
    const qualities = [...new Set(items.map((it) => it.quality as string).filter(Boolean))]
      .sort((a, b) => QUALITY_ORDER.indexOf(a) - QUALITY_ORDER.indexOf(b));
    if (qualities.length) {
      filters.push({
        key: 'quality',
        labelKey: 'catalog.filter.quality',
        options: [
          { val: '', labelKey: 'catalog.all' },
          ...qualities.map((q) => (QUALITY_KEY[q] ? { val: q, labelKey: QUALITY_KEY[q] } : { val: q, label: q })),
        ],
      });
    }
    return filters;
  },
  renderCard: (item, i) => renderAugmentCard(item, i),
};
