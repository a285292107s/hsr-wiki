import { cdnUri } from '../../../services/cdn';
import { escHtml, avatarShopIconUrl, gridFightTraitIconById } from '../../../lib/format';
import { loadLocalCurrencyRoles } from '../../../services/api';
import { getSavedTrailblazerGender, shouldUseFemaleAvatar } from '../../../lib/trailblazer';
import type { CatalogItem, CatalogPageConfig, CatalogFilter } from '../types';
import { loadCwCatalogCss, STAR_SVG } from './shared';

const FB_LABEL: Record<string, string> = {
  Front: '前台', Back: '后台', Both: '前后台',
};

const CHARGE_LABEL: Record<string, string> = {
  Speed: '速度', EnergyBar: '特殊充能', MaxSP: '终结技能量', MaxHP: '生命上限', SP: '战技点',
};

/* ─── 特质分类（与 converter _trait_cat 对齐） ─── */
type TraitCat = 'faction' | 'combat' | 'special';
const TRAIT_CAT_LABEL: Record<TraitCat, string> = {
  faction: '阵营', combat: '流派', special: '特殊',
};

const FB_SVG_FRONT = `<svg class="nk-cat-select__fb" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="18" height="8" rx="3" style="fill:var(--cw-fb-front)"/><rect x="3" y="13" width="18" height="8" rx="3" style="fill:var(--cw-fb-front);fill-opacity:.15;stroke:var(--cw-fb-front);stroke-opacity:.62" stroke-width="1.5"/></svg>`;
const FB_SVG_BACK = `<svg class="nk-cat-select__fb" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="18" height="8" rx="3" style="fill:var(--cw-fb-back);fill-opacity:.15;stroke:var(--cw-fb-back);stroke-opacity:.62" stroke-width="1.5"/><rect x="3" y="13" width="18" height="8" rx="3" style="fill:var(--cw-fb-back)"/></svg>`;
const FB_SVG_BOTH = `<svg class="nk-cat-select__fb" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="18" height="8" rx="3" style="fill:var(--cw-fb-front)"/><rect x="3" y="13" width="18" height="8" rx="3" style="fill:var(--cw-fb-back)"/></svg>`;

const FB_OPTION_SVG: Record<string, string> = {
  Front: FB_SVG_FRONT, Back: FB_SVG_BACK, Both: FB_SVG_BOTH,
};


function renderCurrencyRoleCard(item: CatalogItem, index = 0): string {
  const id = String(item.id);
  const avatar = item.avatar || avatarShopIconUrl(id);
  const rarity = Number(item.rarity) || 0;
  const fbType = (item.front_back_type as string) ?? 'Both';
  const charge = (item.charge_type || []).map((c) => CHARGE_LABEL[c] ?? c).join(' · ');
  const expert = item.is_expert ? '<span class="nk-crole-card__exp">专家</span>' : '';
  const chargeEl = charge ? `<span class="nk-crole-card__charge">${escHtml(charge)}</span>` : '';
  const fbIcon = fbType === 'Both' ? FB_SVG_BOTH
    : fbType === 'Front' ? FB_SVG_FRONT
    : fbType === 'Back' ? FB_SVG_BACK
    : '';
  const fbBadge = fbIcon ? `<span class="nk-crole-card__fb">${fbIcon}</span>` : '';
  const costBadge = rarity >= 1 ? `<span class="nk-crole-card__cost" title="${rarity}费"><b>${rarity}</b></span>` : '';
  const traits = (item.traits as Array<{ id: number; name: string; cat: TraitCat }>) || [];
  const traitChips = traits
    .map((t) => `<span class="nk-crole-tcard-trait nk-crole-tcard-trait--${t.cat}"><img class="nk-crole-tcard-trait__icon" src="${cdnUri('gridfight-icon', `${t.id}.webp`)}" alt="" loading="lazy">${escHtml(t.name || `#${t.id}`)}</span>`)
    .join('');
  return `<a class="nk-crole-card" href="${item.href}" data-id="${escHtml(id)}" data-name="${escHtml(item.name)}" data-rarity="${rarity}" style="--i:${index}">
      <div class="nk-crole-card__avatar">
        <img loading="lazy" src="${escHtml(avatar)}" alt="${escHtml(item.name)}">
        ${fbBadge}
        ${costBadge}
        <span class="nk-crole-card__name">${escHtml(item.name)}${expert}${chargeEl}</span>
      </div>
      <div class="nk-crole-card__body">
        ${traitChips ? `<div class="nk-crole-card__traits">${traitChips}</div>` : ''}
      </div>
    </a>`;
}

export const currencyRolePage: CatalogPageConfig = {
  id: 'currency-role',
  title: '货币战争 · 角色图鉴',
  searchPlaceholder: '搜索角色…',
  gridClass: 'nk-cat-grid nk-crole-grid',
  cardClass: '.nk-crole-card',
  styles: [loadCwCatalogCss, () => import('../../../../src/styles/currency-role.css')],
  async fetchData() {
    const { roles } = await loadLocalCurrencyRoles();
    // 开拓者：设置选女性时头像用 female_avatar_id（GridFightGenderOverride 映射，仅立绘切换）
    const gender = getSavedTrailblazerGender();
    return roles.map((r) => {
      const traits = r.traits || [];
      const avatarId = shouldUseFemaleAvatar(gender, r.female_avatar_id) ? r.female_avatar_id : r.avatar_id;
      return {
        id: String(r.id),
        name: r.name,
        href: `/currency/role/${r.id}`,
        avatar: avatarShopIconUrl(avatarId || r.id),
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
        is_season_new: r.is_season_new === true,
      };
    });
  },
  buildFilters(items: CatalogItem[]) {
    const filters: CatalogFilter[] = [];

    const rarities = [...new Set(items.map((it) => Number(it.rarity)))].filter((v) => v > 0).sort((a, b) => b - a);
    if (rarities.length) {
      filters.push({
        key: 'rarity',
        label: '稀有度',
        options: [
          { val: '', label: '全部' },
          ...rarities.map((v) => ({ val: String(v), label: `${STAR_SVG}${v}费` })),
        ],
      });
    }

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
          ...entries.map(([id, name]) => ({ val: String(id), label: name, icon: gridFightTraitIconById(id) })),
        ],
      });
    }

    const POS_ORDER: Record<string, number> = { Front: 0, Back: 1, Both: 2 };
    const positions = [...new Set(items.map((i) => String(i.front_back_type)).filter(Boolean))];
    if (positions.length) {
      filters.push({
        key: 'front_back_type',
        label: '位置',
        options: [
          { val: '', label: '全部' },
          ...positions.sort((a, b) => (POS_ORDER[a] ?? 99) - (POS_ORDER[b] ?? 99))
            .map((v) => ({ val: v, label: `${FB_OPTION_SVG[v] ?? ''}${FB_LABEL[v] ?? v}` })),
        ],
      });
    }

    const charge = new Set<string>();
    items.forEach((it) => (Array.isArray(it.charge_type) ? it.charge_type : []).forEach((c) => charge.add(c)));
    if (charge.size) {
      filters.push({
        key: 'charge_type',
        label: '充能类型',
        options: [
          { val: '', label: '全部' },
          ...[...charge].sort().map((v) => ({ val: v, label: CHARGE_LABEL[v] ?? v })),
        ],
      });
    }

    filters.push({
      key: 'is_expert',
      label: '专家',
      options: [
        { val: '', label: '全部' },
        { val: 'true', label: '仅专家' },
      ],
    });

    filters.push({
      key: 'has_equipment',
      label: '光锥',
      options: [
        { val: '', label: '全部' },
        { val: 'true', label: '有后台光锥' },
      ],
    });

    return filters;
  },
  renderCard: (item, i) => renderCurrencyRoleCard(item, i),
};
