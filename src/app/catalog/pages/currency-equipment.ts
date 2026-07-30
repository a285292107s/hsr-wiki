/** 货币战争 · 装备图鉴目录页配置 */
import { escHtml, gridFightEquipIconUrl } from '../../../lib/format';
import { loadLocalCurrencyEquipment } from '../../../services/api';
import type { CatalogItem, CatalogPageConfig, CatalogFilter } from '../types';

/* 属性 key → 友好中文名（与 CurrencyRoleView PROP_LABEL 对齐） */
const PROP_LABEL: Record<string, string> = {
  ExtraAllDamageTypeAddedRatio1: '全伤害提高',
  ExtraAllDamageTypeAddedRatio4: '全伤害提高',
  ExtraAllDamageTypeAddedRatio5: '全伤害提高',
  ExtraInitSP: '初始战技点',
  ExtraHPAddedRatio1: '生命增幅',
  ExtraHPAddedRatio2: '生命增幅',
  ExtraSpeedAddedRatio1: '速度增幅',
  ExtraSpeedAddedRatio2: '速度增幅',
  ExtraAttackAddedRatio: '攻击增幅',
  ExtraDefenceAddedRatio: '防御增幅',
  ExtraCriticalChanceBase: '暴击率提高',
  ExtraCriticalDamageBase: '暴击伤害提高',
  ExtraBreakDamageAddedRatio: '击破特攻提高',
  BreakDamageAddedRatioBase: '击破特攻',
  ExtraHealRatioBase: '治疗量提高',
  ExtraHealAddedRatio: '治疗量提高',
  ExtraShieldRatioBase: '护盾量提高',
  ExtraShieldAddedRatio: '护盾量提高',
  ExtraLuckChance: '幸运触发率提高',
  ExtraLuckDamage: '幸运伤害提高',
  ExtraFrontPowerAddedRatio1: '前台强度提高',
  ExtraBackPowerAddedRatio1: '后台强度提高',
  ExtraAllDamageReduce: '受到伤害降低',
  StanceBreakAddedRatio: '弱点击破效率提高',
  ExtraDOTDamageAddedRatio1: '持续伤害提高',
  ExtraElementDamageAddedRatio1: '属性伤害提高',
  ExtraInsertDamageAddedRatio1: '追加攻击伤害提高',
  ExtraNormalDamageAddedRatio1: '普攻伤害提高',
  ExtraSkillDamageAddedRatio1: '战技伤害提高',
  ExtraUltraDamageAddedRatio1: '终结技伤害提高',
};
function propLabel(key: string): string {
  return PROP_LABEL[key] || key.replace(/^Extra/, '').replace(/AddedRatio\d*$/, '');
}
function propValue(v: number): string {
  return Math.abs(v) < 1 ? `${(v * 100).toFixed(0)}%` : String(v);
}
/** props → 效果说明文本（全量展示，数据 Wiki 不隐藏属性） */
function buildEffectDesc(props: Array<{ name: string; property_type: string; value: number }>): string {
  if (!props.length) return '';
  return props
    .map((p) => `${propLabel(p.property_type || p.name)} +${propValue(p.value)}`)
    .join(' · ');
}

function renderEquipCard(item: CatalogItem, index = 0): string {
  const icon = gridFightEquipIconUrl(item.icon as string);
  const tags = (item.tags as Array<{ id: number; desc: string }>) || [];
  const tagChips = tags
    .slice(0, 3)
    .map((t) => `<span class="nk-cw-tag">${escHtml(t.desc)}</span>`)
    .join('');
  const catName = (item.category_name as string) || '';
  const effectDesc = buildEffectDesc(
    (item.props as Array<{ name: string; property_type: string; value: number }>) || [],
  );
  // 无属性加成时回退显示功能道具描述（取第一行）
  const fallbackDesc = effectDesc ? '' : ((item.desc as string) || '').split('\\n')[0];
  const descHtml = effectDesc || (fallbackDesc ? escHtml(fallbackDesc) : '');
  return `<div class="nk-cw-card nk-cw-equip-card" style="--i:${index}">
      <div class="nk-cw-card__icon"><img loading="lazy" src="${escHtml(icon)}" alt="${escHtml(item.name)}"></div>
      <div class="nk-cw-card__body">
        <div class="nk-cw-card__name">${escHtml(item.name)}</div>
        <div class="nk-cw-card__meta">
          ${catName ? `<span class="nk-cw-card__cat">${escHtml(catName)}</span>` : ''}
          ${tagChips}
        </div>
        ${descHtml ? `<div class="nk-cw-card__desc">${descHtml}</div>` : ''}
      </div>
    </div>`;
}

export const currencyEquipmentPage: CatalogPageConfig = {
  id: 'currency-equipment',
  title: '装备',
  searchPlaceholder: '搜索装备…',
  gridClass: 'nk-cat-grid nk-cw-grid nk-cw-grid--wide',
  cardClass: '.nk-cw-card',
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
