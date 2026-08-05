/** 货币战争 · 角色图鉴目录页配置 */
import { cdnUri } from '../../../services/cdn';
import { escHtml, avatarShopIconUrl } from '../../../lib/format';
import { loadLocalCurrencyRoles } from '../../../services/api';
import type { CatalogItem, CatalogPageConfig, CatalogFilter } from '../types';

const FB_LABEL: Record<string, string> = {
  Front: '前台', Back: '后台', Both: '前后台',
};

const CHARGE_LABEL: Record<string, string> = {
  Speed: '速度', EnergyBar: '充能点数', MaxSP: '终结技充能', MaxHP: '生命上限', SP: '战技点',
};

/* ─── 特质分类（与 converter _trait_cat 对齐） ─── */
type TraitCat = 'faction' | 'combat' | 'special';
const TRAIT_CAT_LABEL: Record<TraitCat, string> = {
  faction: '阵营', combat: '流派', special: '特殊',
};

/* 前后台 SVG 图标（自绘，无网络依赖）
   设计语言：「阵型槽位」——横向胶囊条 = 行位，实心亮色 = 占据，半透明幽灵描边 = 空槽。
   暖金 = 前台，冷靖蓝 = 后台；三图标共享同一几何，仅填充状态不同。 */
const FB_SVG_FRONT = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="18" height="8" rx="3" fill="#FBBF24"/><rect x="3" y="13" width="18" height="8" rx="3" fill="#FBBF24" fill-opacity=".15" stroke="#FBBF24" stroke-opacity=".62" stroke-width="1.5"/></svg>`;
const FB_SVG_BACK = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="18" height="8" rx="3" fill="#818CF8" fill-opacity=".15" stroke="#818CF8" stroke-opacity=".62" stroke-width="1.5"/><rect x="3" y="13" width="18" height="8" rx="3" fill="#818CF8"/></svg>`;
const FB_SVG_BOTH = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="18" height="8" rx="3" fill="#FBBF24"/><rect x="3" y="13" width="18" height="8" rx="3" fill="#818CF8"/></svg>`;


function renderCurrencyRoleCard(item: CatalogItem, index = 0): string {
  const id = String(item.id);
  const avatar = item.avatar || avatarShopIconUrl(id);
  const rarity = Number(item.rarity) || 0;
  const fbType = (item.front_back_type as string) ?? 'Both';
  const charge = (item.charge_type || []).map((c) => CHARGE_LABEL[c] ?? c).join(' · ');
  const expert = item.is_expert ? '<span class="nk-crole-card__exp">专家</span>' : '';
  /* 前后台角标（SVG 图标 + 磨砂底座，头像左上角） */
  const fbIcon = fbType === 'Both' ? FB_SVG_BOTH
    : fbType === 'Front' ? FB_SVG_FRONT
    : fbType === 'Back' ? FB_SVG_BACK
    : '';
  const fbBadge = fbIcon ? `<span class="nk-crole-card__fb">${fbIcon}</span>` : '';
  /* 费用菱形徽章（头像右上角，稀有度配色） */
  const costBadge = rarity >= 1 ? `<span class="nk-crole-card__cost" title="${rarity}费"><b>${rarity}</b></span>` : '';
  /* 特质标签（数据驱动，由 converter 从 TextMap 解析；带小图标） */
  const traits = (item.traits as Array<{ id: number; name: string; cat: TraitCat }>) || [];
  const traitChips = traits
    .map((t) => `<span class="nk-crole-tcard-trait nk-crole-tcard-trait--${t.cat}"><img class="nk-crole-tcard-trait__icon" src="${cdnUri('gridfight-icon', `${t.id}.webp`)}" alt="" loading="lazy">${escHtml(t.name || `#${t.id}`)}</span>`)
    .join('');
  /* 卡牌结构：头像出血（叠加 fb 角标 + 费用菱形 + scrim 名称）+ 紧凑 body */
  return `<a class="nk-crole-card" href="${item.href}" data-id="${escHtml(id)}" data-name="${escHtml(item.name)}" data-rarity="${rarity}" style="--i:${index}">
      <div class="nk-crole-card__avatar">
        <img loading="lazy" src="${escHtml(avatar)}" alt="${escHtml(item.name)}">
        ${fbBadge}
        ${costBadge}
        <span class="nk-crole-card__name">${escHtml(item.name)}${expert}</span>
      </div>
      <div class="nk-crole-card__body">
        ${traitChips ? `<div class="nk-crole-card__traits">${traitChips}</div>` : ''}
        <div class="nk-crole-card__meta">
          ${charge ? `<span class="nk-crole-card__meta-item nk-crole-card__meta-item--charge">${escHtml(charge)}</span>` : ''}
        </div>
      </div>
    </a>`;
}

export const currencyRolePage: CatalogPageConfig = {
  id: 'currency-role',
  title: '货币战争 · 角色图鉴',
  searchPlaceholder: '搜索角色…',
  gridClass: 'nk-cat-grid nk-crole-grid',
  cardClass: '.nk-crole-card',
  async fetchData() {
    const { roles } = await loadLocalCurrencyRoles();
    return roles.map((r) => {
      const traits = r.traits || [];
      return {
        id: String(r.id),
        name: r.name,
        href: `/currency/role/${r.id}`,
        avatar: avatarShopIconUrl(r.avatar_id || r.id),
        rarity: r.rarity,
        front_back_type: r.front_back_type ?? 'Both',
        charge_type: r.charge_type,
        is_expert: r.is_expert,
        trait_list: r.trait_list,
        traits,
        trait_faction: traits.filter((t) => t.cat === 'faction').map((t) => t.id),
        trait_combat: traits.filter((t) => t.cat === 'combat').map((t) => t.id),
        trait_special: traits.filter((t) => t.cat === 'special').map((t) => t.id),
        has_equipment: r.equipment_id != null,
      };
    });
  },
  buildFilters(items: CatalogItem[]) {
    const filters: CatalogFilter[] = [];

    // 稀有度（降序排列）
    const rarities = [...new Set(items.map((it) => Number(it.rarity)))].filter((v) => v > 0).sort((a, b) => b - a);
    if (rarities.length) {
      filters.push({
        key: 'rarity',
        label: '稀有度',
        options: [
          { val: '', label: '全部' },
          ...rarities.map((v) => ({ val: String(v), label: `${v}费` })),
        ],
      });
    }

    // 特质筛选：按分类（阵营 / 流派 / 特殊）从数据动态汇总
    const traitByName = (cat: TraitCat) => {
      const seen = new Map<number, string>();
      items.forEach((it) => {
        const list = (it.traits as Array<{ id: number; name: string; cat: TraitCat }>) || [];
        list.filter((t) => t.cat === cat).forEach((t) => {
          if (!seen.has(t.id)) seen.set(t.id, t.name || `#${t.id}`);
        });
      });
      return [...seen.entries()].sort((a, b) => a[0] - b[0]);
    };

    for (const cat of ['faction', 'combat', 'special'] as TraitCat[]) {
      const entries = traitByName(cat);
      if (!entries.length) continue;
      filters.push({
        key: `trait_${cat}`,
        label: TRAIT_CAT_LABEL[cat],
        options: [
          { val: '', label: '全部' },
          ...entries.map(([id, name]) => ({ val: String(id), label: name })),
        ],
      });
    }

    // 位置（含"未定位"选项，null → 'None'）
    const POS_ORDER: Record<string, number> = { Front: 0, Back: 1, Both: 2 };
    const positions = [...new Set(items.map((i) => String(i.front_back_type)).filter(Boolean))];
    if (positions.length) {
      filters.push({
        key: 'front_back_type',
        label: '位置',
        options: [
          { val: '', label: '全部' },
          ...positions.sort((a, b) => (POS_ORDER[a] ?? 99) - (POS_ORDER[b] ?? 99))
            .map((v) => ({ val: v, label: FB_LABEL[v] ?? v })),
        ],
      });
    }

    // 充能
    const charge = new Set<string>();
    items.forEach((it) => (Array.isArray(it.charge_type) ? it.charge_type : []).forEach((c) => charge.add(c)));
    if (charge.size) {
      filters.push({
        key: 'charge_type',
        label: '充能',
        options: [
          { val: '', label: '全部' },
          ...[...charge].sort().map((v) => ({ val: v, label: CHARGE_LABEL[v] ?? v })),
        ],
      });
    }

    // 专家
    filters.push({
      key: 'is_expert',
      label: '专家',
      options: [
        { val: '', label: '全部' },
        { val: 'true', label: '仅专家' },
      ],
    });

    // 专属光锥
    filters.push({
      key: 'has_equipment',
      label: '光锥',
      options: [
        { val: '', label: '全部' },
        { val: 'true', label: '有预设光锥' },
      ],
    });

    return filters;
  },
  renderCard: (item, i) => renderCurrencyRoleCard(item, i),
};
