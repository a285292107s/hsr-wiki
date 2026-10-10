import { escHtml, gridFightTraitIconUrl } from '../../../lib/format';
import { activeHref } from '../../../lib/i18n/active';
import { loadLocalCurrencyTraits } from '../../../services/api';
import type { CatalogItem, CatalogPageConfig, CatalogFilter } from '../types';
import { loadCwCatalogCss } from './shared';
import { cwTraitCatKey } from '../../../lib/enum-labels';
import { translate } from '../../i18n';

/** 模板与脚本统一走词典 */
const t = translate;

type TraitCat = 'faction' | 'combat' | 'special';

function renderTraitCard(item: CatalogItem, index = 0): string {
  const icon = gridFightTraitIconUrl(item.icon as string);
  const cat = (item.cat as TraitCat) || 'special';
  const catLabel = cwTraitCatKey(cat) ? translate(cwTraitCatKey(cat)!) : cat;
  const layers = (item.layers as Array<{ layer: number }>) || [];
  const layerCount = layers.length;
  const simpleDesc = escHtml(
    (item.simple_desc as string || '').replace(/\\n/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60),
  );
  const descTruncated = simpleDesc.length >= 60 ? '…' : '';
  /* 截断复原（触屏没有 hover 也要可达）：名条 nowrap+ellipsis 与描述 60 字截断的完整原文都挂卡根 title */
  const fullDesc = escHtml(
    (item.simple_desc as string || '').replace(/\\n/g, ' ').replace(/\s+/g, ' ').trim(),
  );

  return `<a class="nk-cw-trait-card" href="${escHtml(activeHref(`/currency/trait/${item.id}`))}" data-cat="${escHtml(cat)}" title="${escHtml(item.name as string)}：${fullDesc}" style="--i:${index}">
      <div class="nk-cw-trait-card__icon"><img loading="lazy" src="${escHtml(icon)}" alt="${escHtml(item.name)}"></div>
      <div class="nk-cw-trait-card__body">
        <div class="nk-cw-trait-card__name">${escHtml(item.name)}</div>
        <div class="nk-cw-trait-card__meta">
          <span class="nk-cw-tag nk-cw-tag--${cat}">${escHtml(catLabel)}</span>
          ${layerCount ? `<span class="nk-cw-trait-card__layers">${escHtml(t('cwTrait.layerCount', { n: layerCount }))}</span>` : ''}
        </div>
        <div class="nk-cw-trait-card__desc">${simpleDesc}${descTruncated}</div>
      </div>
    </a>`;
}

export const currencyTraitPage: CatalogPageConfig = {
  id: 'currency-trait',
  titleKey: 'catalog.titleWithMode',
  titleArgs: { mode: 'catalog.currencyWar', name: 'nav.cwTrait' },
  subtitle: 'TRAITS',
  searchKey: 'catalog.cwTrait.search',
  gridClass: 'nk-cat-grid nk-cw-trait-grid',
  cardClass: '.nk-cw-trait-card',
  styles: [loadCwCatalogCss],
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
      remarks: t.remarks,
      is_season_new: t.is_season_new === true,
    }));
  },
  buildFilters(items: CatalogItem[]) {
    const filters: CatalogFilter[] = [];
    const cats = [...new Set(items.map((it) => it.cat as string).filter(Boolean))];
    if (cats.length) {
      filters.push({
        key: 'cat',
        labelKey: 'catalog.filter.category',
        options: [
          { val: '', labelKey: 'catalog.all' },
          ...cats.map((c) => (cwTraitCatKey(c) ? { val: c, labelKey: cwTraitCatKey(c) } : { val: c, label: c })),
        ],
      });
    }
    return filters;
  },
  renderCard: (item, i) => renderTraitCard(item, i),
};
