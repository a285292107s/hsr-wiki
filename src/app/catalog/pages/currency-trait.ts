/** 货币战争 · 羁绊图鉴目录页配置 */
import { escHtml, gridFightTraitIconUrl, fmtDesc } from '../../../lib/format';
import { loadLocalCurrencyTraits } from '../../../services/api';
import type { CatalogItem, CatalogPageConfig, CatalogFilter } from '../types';

type TraitCat = 'faction' | 'combat' | 'special';
const CAT_LABEL: Record<TraitCat, string> = {
  faction: '阵营', combat: '流派', special: '特殊',
};

function renderTraitCard(item: CatalogItem, index = 0): string {
  const icon = gridFightTraitIconUrl(item.icon as string);
  const cat = (item.cat as TraitCat) || 'special';
  const catLabel = CAT_LABEL[cat] || cat;
  const layers = (item.layers as Array<{ layer: number; quality: string | null }>) || [];
  const layerCount = layers.length;
  const desc = fmtDesc(item.simple_desc as string || item.desc as string, item.base_params as number[]);
  return `<div class="nk-cw-card nk-cw-trait-card" data-cat="${escHtml(cat)}" style="--i:${index}">
      <div class="nk-cw-card__icon"><img loading="lazy" src="${escHtml(icon)}" alt="${escHtml(item.name)}"></div>
      <div class="nk-cw-card__body">
        <div class="nk-cw-card__name">${escHtml(item.name)}</div>
        <div class="nk-cw-card__meta">
          <span class="nk-cw-tag nk-cw-tag--${cat}">${escHtml(catLabel)}</span>
          ${layerCount ? `<span class="nk-cw-trait-layers">${layerCount} 层</span>` : ''}
        </div>
        <div class="nk-cw-card__desc">${desc}</div>
      </div>
    </div>`;
}

export const currencyTraitPage: CatalogPageConfig = {
  id: 'currency-trait',
  title: '羁绊',
  searchPlaceholder: '搜索羁绊…',
  gridClass: 'nk-cat-grid nk-cw-grid nk-cw-grid--wide',
  cardClass: '.nk-cw-card',
  async fetchData() {
    const { traits } = await loadLocalCurrencyTraits();
    return traits.map((t) => ({
      id: String(t.id),
      name: t.name,
      icon: t.icon,
      mini_icon: t.mini_icon,
      cat: t.cat,
      desc: t.desc,
      simple_desc: t.simple_desc,
      base_params: t.base_params,
      activation_type: t.activation_type,
      season_id: t.season_id,
      layers: t.layers,
    }));
  },
  buildFilters(items: CatalogItem[]) {
    const filters: CatalogFilter[] = [];
    // 分类筛选
    const cats = [...new Set(items.map((it) => it.cat as string).filter(Boolean))];
    if (cats.length) {
      filters.push({
        key: 'cat',
        label: '分类',
        options: [
          { val: '', label: '全部' },
          ...cats.map((c) => ({ val: c, label: CAT_LABEL[c as TraitCat] || c })),
        ],
      });
    }
    return filters;
  },
  renderCard: (item, i) => renderTraitCard(item, i),
};
