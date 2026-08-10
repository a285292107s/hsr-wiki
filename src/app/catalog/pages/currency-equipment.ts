/** 货币战争 · 装备图鉴目录页配置 */
import { escHtml, gridFightEquipIconUrl } from '../../../lib/format';
import { propLabel, propValue } from '../../../lib/currency-role';
import { loadLocalCurrencyEquipment } from '../../../services/api';
import type { CatalogItem, CatalogPageConfig, CatalogFilter } from '../types';
import { loadCwCatalogCss } from './shared';

/** 分类 → 图标边框色 */
const CAT_BORDER: Record<string, string> = {
  Basic: 'var(--cw-rarity-3)',
  Craftable: 'var(--cw-rarity-4)',
  Radiant: 'var(--gold-400)',
  Emblem: 'var(--prop-hp)',
  FateEquip: 'var(--prop-hp)',
  Hack: 'var(--skill-passive)',
  Crown: 'var(--gold-300)',
  Material: 'var(--cw-rarity-1)',
  TraitSpecial: 'var(--cw-faction-core)',
};

/** 属性类型 → 行首指示色 */
const PROP_COLOR: Record<string, string> = {
  ExtraSpeedAddedRatio1: 'var(--prop-hp)',
  ExtraSpeedAddedRatio2: 'var(--prop-hp)',
  ExtraFrontPowerAddedRatio1: 'var(--cw-special-core)',
  ExtraBackPowerAddedRatio1: 'var(--cw-combat-core)',
  ExtraHPAddedRatio1: 'var(--cw-rarity-2)',
  ExtraHPAddedRatio2: 'var(--cw-rarity-2)',
  ExtraAllDamageTypeAddedRatio1: 'var(--gold-400)',
  ExtraAllDamageTypeAddedRatio4: 'var(--gold-400)',
  ExtraAllDamageTypeAddedRatio5: 'var(--gold-400)',
  ExtraCriticalChanceBase: 'var(--diff-del)',
  ExtraCriticalDamageBase: 'var(--diff-del)',
  ExtraBreakDamageAddedRatio: 'var(--cw-faction-core)',
  BreakDamageAddedRatioBase: 'var(--cw-faction-core)',
  StanceBreakAddedRatio: 'var(--cw-faction-core)',
  ExtraHealRatioBase: 'var(--cw-rarity-2)',
  ExtraHealAddedRatio: 'var(--cw-rarity-2)',
  ExtraShieldRatioBase: 'var(--cw-rarity-3)',
  ExtraShieldAddedRatio: 'var(--cw-rarity-3)',
  ExtraAllDamageReduce: 'var(--cw-rarity-3)',
  ExtraInitSP: 'var(--gold-300)',
  ExtraLuckChance: 'var(--ctrait-multicolor)',
  ExtraLuckDamage: 'var(--ctrait-multicolor)',
};
function propColor(key: string): string {
  return PROP_COLOR[key] || 'var(--primary)';
}

function renderEquipCard(item: CatalogItem, index = 0): string {
  const icon = gridFightEquipIconUrl(item.icon as string);
  const tags = (item.tags as Array<{ id: number; desc: string }>) || [];
  const tagChips = tags
    .map((t) => `<span class="nk-cw-tag">${escHtml(t.desc)}</span>`)
    .join('');
  const catName = (item.category_name as string) || '';
  const cat = (item.category as string) || '';
  const borderColor = CAT_BORDER[cat] || 'var(--border2)';
  const props = (item.props as Array<{ name: string; property_type: string; value: number }>) || [];
  // 属性行：逐条渲染，名称左对齐 + 数值右对齐
  const statRows = props.length
    ? `<div class="nk-cw-equip-stats">${props.map((p) => {
        const color = propColor(p.property_type || p.name);
        return `<div class="nk-cw-equip-stat">
          <span class="nk-cw-equip-stat__dot" style="background:${color}"></span>
          <span class="nk-cw-equip-stat__name">${escHtml(propLabel(p))}</span>
          <span class="nk-cw-equip-stat__val">${propValue(p.value)}</span>
        </div>`;
      }).join('')}</div>`
    : '';
  // 无属性加成时回退显示功能道具描述（取第一行）
  const fallbackDesc = props.length ? '' : ((item.desc as string) || '').split('\\n')[0];
  const descHtml = fallbackDesc ? `<div class="nk-cw-equip-desc">${escHtml(fallbackDesc)}</div>` : '';
  return `<div class="nk-cw-card nk-cw-equip-card" style="--i:${index}">
      <div class="nk-cw-equip-header">
        <div class="nk-cw-equip-icon" style="border-color:${borderColor}"><img loading="lazy" src="${escHtml(icon)}" alt="${escHtml(item.name)}"></div>
        <div class="nk-cw-equip-title">
          <div class="nk-cw-equip-name">${escHtml(item.name)}</div>
          ${catName ? `<div class="nk-cw-equip-cat">${escHtml(catName)}</div>` : ''}
        </div>
      </div>
      ${tagChips ? `<div class="nk-cw-equip-tags">${tagChips}</div>` : ''}
      ${statRows}
      ${descHtml}
    </div>`;
}

export const currencyEquipmentPage: CatalogPageConfig = {
  id: 'currency-equipment',
  title: '货币战争 · 装备图鉴',
  searchPlaceholder: '搜索装备…',
  gridClass: 'nk-cat-grid nk-cw-grid nk-cw-grid--wide',
  cardClass: '.nk-cw-card',
  /* CW 卡片共享样式（nk-cw-card） */
  styles: [loadCwCatalogCss],
  async fetchData() {
    const { items } = await loadLocalCurrencyEquipment();
    return items.map((it) => ({
      id: String(it.id),
      name: it.name,
      icon: it.icon,
      desc: it.desc,
      category: it.category,
      category_name: it.category_name,
      tags: it.tags,
      /** 标签 ID 字符串数组（供筛选匹配） */
      tag: (it.tags || []).map((t) => String(t.id)),
      props: it.props,
      priority: it.priority,
      /** 费用档位：1-5 费为常规，6+ 归为特殊 */
      cost: it.priority >= 6 ? '6+' : String(it.priority),
      recommend_roles: it.recommend_roles,
    }));
  },
  buildFilters(items: CatalogItem[]) {
    const filters: CatalogFilter[] = [];
    // 费用筛选（1费~5费 + 特殊）
    const COST_ORDER = ['1', '2', '3', '4', '5', '6+'];
    const COST_LABEL: Record<string, string> = {
      '1': '1费', '2': '2费', '3': '3费', '4': '4费', '5': '5费', '6+': '特殊',
    };
    const costSet = new Set(items.map((it) => it.cost as string));
    const costOpts = COST_ORDER.filter((c) => costSet.has(c));
    if (costOpts.length > 1) {
      filters.push({
        key: 'cost',
        label: '费用',
        options: [
          { val: '', label: '全部' },
          ...costOpts.map((c) => ({ val: c, label: COST_LABEL[c] || c })),
        ],
      });
    }
    // 分类筛选
    const cats = new Map<string, string>();
    items.forEach((it) => {
      const c = it.category as string;
      const cn = it.category_name as string;
      if (c && cn && !cats.has(c)) cats.set(c, cn);
    });
    if (cats.size) {
      filters.push({
        key: 'category',
        label: '分类',
        options: [
          { val: '', label: '全部' },
          ...[...cats.entries()].map(([val, label]) => ({ val, label })),
        ],
      });
    }
    // 标签筛选
    const tagMap = new Map<number, string>();
    items.forEach((it) => {
      ((it.tags as Array<{ id: number; desc: string }>) || []).forEach((t) => {
        if (!tagMap.has(t.id)) tagMap.set(t.id, t.desc);
      });
    });
    if (tagMap.size) {
      filters.push({
        key: 'tag',
        label: '标签',
        options: [
          { val: '', label: '全部' },
          ...[...tagMap.entries()].sort((a, b) => a[0] - b[0]).map(([id, desc]) => ({ val: String(id), label: desc })),
        ],
      });
    }
    return filters;
  },
  renderCard: (item, i) => renderEquipCard(item, i),
};
