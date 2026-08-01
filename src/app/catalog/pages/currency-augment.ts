/** 货币战争 · 投资策略图鉴目录页配置 */
import { escHtml, gridFightIconUrl, fmtDesc } from '../../../lib/format';
import { loadLocalCurrencyAugments } from '../../../services/api';
import type { CatalogItem, CatalogPageConfig, CatalogFilter } from '../types';

const QUALITY_LABEL: Record<string, string> = {
  Silver: '银色', Gold: '金色', Prismatic: '棱彩',
};
/** 品质排序：银色 → 金色 → 棱彩 */
const QUALITY_ORDER = ['Silver', 'Gold', 'Prismatic'];

function renderAugmentCard(item: CatalogItem, index = 0): string {
  const icon = gridFightIconUrl(item.icon as string) || gridFightIconUrl(item.mini_icon as string);
  const quality = (item.quality as string) || '';
  const qLabel = QUALITY_LABEL[quality] || quality;
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
  title: '策略',
  searchPlaceholder: '搜索投资策略…',
  gridClass: 'nk-cat-grid nk-cw-grid nk-cw-grid--wide',
  cardClass: '.nk-cw-card',
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
    // 品质筛选（按银/金/棱彩排序）
    const qualities = [...new Set(items.map((it) => it.quality as string).filter(Boolean))]
      .sort((a, b) => QUALITY_ORDER.indexOf(a) - QUALITY_ORDER.indexOf(b));
    if (qualities.length) {
      filters.push({
        key: 'quality',
        label: '品质',
        options: [
          { val: '', label: '全部' },
          ...qualities.map((q) => ({ val: q, label: QUALITY_LABEL[q] || q })),
        ],
      });
    }
    return filters;
  },
  renderCard: (item, i) => renderAugmentCard(item, i),
};
