import { escHtml, itemIconUrl } from '../../../lib/format';
import { cdnImgFallbackAttr } from '../../../services/cdn';
import { loadLocalItems, RARITY_NUM_TO_KEY } from '../../../services/api';
import type { CatalogItem, CatalogPageConfig } from '../types';

const ITEM_RARITY_MAP: Record<string, { stars: number; label: string; color: string }> = {
  SuperRare: { stars: 5, label: '5★', color: 'var(--gold-400)' },
  VeryRare: { stars: 4, label: '4★', color: 'var(--rarity-4)' },
  Rare: { stars: 3, label: '3★', color: 'var(--rarity-3)' },
  NotNormal: { stars: 2, label: '2★', color: 'var(--rarity-2)' },
  Normal: { stars: 1, label: '1★', color: 'var(--rarity-1)' },
};

const ITEM_TYPE_NAMES: Record<string, string> = {
  Material: '材料',
  ComposeMaterial: '合成素材',
  CommonMonsterDrop: '怪物掉落',
  WeeklyMonsterDrop: '周本掉落',
  TracePath: '行迹素材',
  AvatarRank: '星魂素材',
  AvatarExp: '角色经验',
  EquipmentExp: '光锥经验',
  RelicExp: '遗器经验',
  PlanetFesItem: '星穹电影节道具',
  MuseumStuff: '博物馆藏品',
  MuseumExhibit: '博物馆展件',
  AetherSkill: '以太战线·技能',
  AetherSpirit: '以太战线·精灵',
  ElfRestaurantItem: '精灵餐厅道具',
  HipplenOutfit: '希儿朋服装',
  FightFestSkill: '角斗大会技能',
  DiceCombatDice: '模拟宇宙·战斗骰',
  DiceCombatAvatar: '模拟宇宙·命途骰',
  IdleLiveItem: '摸鱼道具',
  MatchThreeV2: '三消道具',
  PixAirMaterial: '像素飞机道具',
  Virtual: '货币',
  Book: '书籍',
  Food: '食物',
  Gift: '礼物',
  Formula: '配方',
  TravelBrochurePaster: '旅行手帐贴纸',
  ChessRogueDiceSurface: '诡弈骰子面',
  ForceOpitonalGift: '剧情赠礼',
  RogueMedal: '模拟宇宙勋章',
  FindChest: '寻宝道具',
  Mission: '任务道具',
};

const ITEM_TYPE_PREFERRED = [
  'Material', 'Virtual', 'Food', 'Book', 'Gift', 'Mission',
  'AvatarExp', 'EquipmentExp', 'RelicExp', 'Formula',
];

const MAIN_TYPE_ORDER = ['Material', 'Virtual', 'Usable', 'Mission'];
const MAIN_TYPE_NAMES: Record<string, string> = {
  Material: '材料', Virtual: '货币', Usable: '可用', Mission: '任务',
};

const ITEM_NO_ICON_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
  + '<path d="M21 8v8a2 2 0 0 1-1 1.73l-7 4a2 2 0 0 1-2 0l-7-4A2 2 0 0 1 3 16V8a2 2 0 0 1 1-1.73l7-4a2 2 0 0 1 2 0l7 4A2 2 0 0 1 21 8z"/>'
  + '<path d="M3.27 6.96 12 12.01l8.73-5.05"/>'
  + '<path d="M12 22.08V12"/></svg>';

export const itemPage: CatalogPageConfig = {
  id: 'item',
  title: '物品',
  subtitle: 'ITEMS',
  searchPlaceholder: '搜索物品...',
  gridClass: 'nk-cat-grid nk-item-grid',
  cardClass: '.nk-item-card',
  virtualMinColW: 110,
  virtualImgRatio: 1,
  async fetchData() {
    const list = await loadLocalItems();
    const items: CatalogItem[] = [];
    for (const info of list) {
      if (!info.name) continue;
      items.push({
        id: String(info.id),
        name: info.name,
        subType: info.sub_type || '',
        mainType: info.main_type || '',
        rarity: RARITY_NUM_TO_KEY[info.rarity] || 'Normal',
        icon: itemIconUrl(info.figure_icon),
        /* 物品描述此前**既不显示也不可检索**：2606 条里 1609 条有 `desc`（中位 23 字，99% ≤80 字）、
           2058 条有 `bg_desc`（背景故事），而 10 列 × 127px 的图标栅格放不下它们、卡片也不是链接。
           `searchText` 按成就页的同口径把描述纳入检索域（含背景故事，让「记得描述、记不住名字」
           的查法能命中）；`descTip` 是卡片的悬停提示（优先功能描述，无则退到背景故事）。
           **两个字段都要显式带过来**：`renderCard` 只拿到这里构造的对象，漏带就会静默失效。 */
        searchText: `${info.desc || ''}\n${info.bg_desc || ''}`,
        descTip: String(info.desc || info.bg_desc || ''),
      });
    }
    const rarityOrder: Record<string, number> = { SuperRare: 0, VeryRare: 1, Rare: 2, NotNormal: 3, Normal: 4 };
    items.sort((a, b) => (rarityOrder[String(a.rarity)] ?? 5) - (rarityOrder[String(b.rarity)] ?? 5));
    return items;
  },
  buildFilters(data) {
    const seen = new Set<string>();
    const subTypes: string[] = [];
    for (const item of data) {
      const st = String(item.subType || '');
      if (st && !seen.has(st)) {
        seen.add(st);
        subTypes.push(st);
      }
    }
    subTypes.sort((a, b) => {
      const ia = ITEM_TYPE_PREFERRED.indexOf(a);
      const ib = ITEM_TYPE_PREFERRED.indexOf(b);
      if (ia !== -1 || ib !== -1) {
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
      }
      return a.localeCompare(b);
    });
    const mainOf = new Map<string, string>();
    for (const it of data) {
      const st = String(it.subType || '');
      if (st && !mainOf.has(st)) mainOf.set(st, String(it.mainType || ''));
    }
    const groupOrder = (t: string) => {
      const i = MAIN_TYPE_ORDER.indexOf(mainOf.get(t) ?? '');
      return i === -1 ? MAIN_TYPE_ORDER.length : i;
    };
    const grouped = [...subTypes];
    grouped.sort((a, b) => {
      const ga = groupOrder(a);
      const gb = groupOrder(b);
      if (ga !== gb) return ga - gb;
      const ia = ITEM_TYPE_PREFERRED.indexOf(a);
      const ib = ITEM_TYPE_PREFERRED.indexOf(b);
      if (ia !== -1 || ib !== -1) {
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
      }
      return a.localeCompare(b);
    });
    const groupCount = new Map<string, number>();
    for (const st of grouped) {
      const mt = mainOf.get(st) ?? '';
      groupCount.set(mt, (groupCount.get(mt) || 0) + 1);
    }
    const subTypeOptions = [
      { val: '', label: '全部' },
      ...grouped.map((st) => {
        const mt = mainOf.get(st) ?? '';
        return {
          val: st,
          label: ITEM_TYPE_NAMES[st] || st,
          group: `${MAIN_TYPE_NAMES[mt] || mt} · ${groupCount.get(mt)}`,
        };
      }),
    ];
    return [
      {
        key: 'rarity', label: '稀有度',
        options: [
          { val: '', label: '全部' },
          { val: 'SuperRare', label: '5★' },
          { val: 'VeryRare', label: '4★' },
          { val: 'Rare', label: '3★' },
          { val: 'NotNormal', label: '2★' },
        ],
      },
      { key: 'subType', label: '类型', options: subTypeOptions },
    ];
  },
  renderCard(item, i) {
    const r = ITEM_RARITY_MAP[String(item.rarity)] || ITEM_RARITY_MAP.Normal;
    const subType = String(item.subType || '');
    const typeName = ITEM_TYPE_NAMES[subType] || subType;
    const hasIcon = Boolean(item.icon);
    /* 描述（`descTip`：功能描述优先，无则背景故事）挂在卡根上：栅格里放不下正文，但悬停可读。
       卡上还有名字自己的 title（第 13 轮，长名被截断时可复原），两者作用域不同、互不冲突。 */
    const descTip = String(item.descTip || '').replace(/\s+/g, ' ').trim();
    const tipAttr = descTip ? ` title="${escHtml(descTip)}"` : '';
    const pic = hasIcon
      ? `<img class="nk-item-card__pic" src="${escHtml(item.icon)}"${cdnImgFallbackAttr(String(item.icon))} alt="${escHtml(item.name)}" loading="lazy" onerror="this.classList.add('is-broken')">`
      : '';
    return `<div class="nk-item-card" data-rarity="${escHtml(item.rarity)}" data-name="${escHtml(item.name)}" data-sub-type="${escHtml(subType)}" style="--i:${i};--rarity-color:${r.color}"${tipAttr}>
      <div class="nk-item-card__img">
        ${pic}
        <div class="nk-item-card__noimg" aria-hidden="true">${ITEM_NO_ICON_SVG}</div>
      </div>
      <div class="nk-item-card__info">
        <span class="nk-item-card__name" title="${escHtml(item.name)}">${escHtml(item.name)}</span>
        <span class="nk-item-card__meta">${typeName} · ${r.label}</span>
      </div>
    </div>`;
  },
};
