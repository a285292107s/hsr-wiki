/** 物品目录页配置 */
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

/** 物品 sub_type → 中文名（覆盖数据中出现的所有子类型，避免卡片回退成英文） */
const ITEM_TYPE_NAMES: Record<string, string> = {
  // Material 主类型
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
  // Virtual 主类型
  Virtual: '货币',
  // Usable 主类型
  Book: '书籍',
  Food: '食物',
  Gift: '礼物',
  Formula: '配方',
  TravelBrochurePaster: '旅行手帐贴纸',
  ChessRogueDiceSurface: '诡弈骰子面',
  ForceOpitonalGift: '剧情赠礼',
  RogueMedal: '模拟宇宙勋章',
  FindChest: '寻宝道具',
  // Mission 主类型
  Mission: '任务道具',
};

/** 类型筛选的优先展示顺序（其余按字母序排在后面） */
const ITEM_TYPE_PREFERRED = [
  'Material', 'Virtual', 'Food', 'Book', 'Gift', 'Mission',
  'AvatarExp', 'EquipmentExp', 'RelicExp', 'Formula',
];

/** 物品无图标时的占位图形（立方体/物资标识） */
const ITEM_NO_ICON_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
  + '<path d="M21 8v8a2 2 0 0 1-1 1.73l-7 4a2 2 0 0 1-2 0l-7-4A2 2 0 0 1 3 16V8a2 2 0 0 1 1-1.73l7-4a2 2 0 0 1 2 0l7 4A2 2 0 0 1 21 8z"/>'
  + '<path d="M3.27 6.96 12 12.01l8.73-5.05"/>'
  + '<path d="M12 22.08V12"/></svg>';

export const itemPage: CatalogPageConfig = {
  id: 'item',
  title: '物品',
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
        rarity: RARITY_NUM_TO_KEY[info.rarity] || 'Normal',
        icon: itemIconUrl(info.figure_icon),
      });
    }
    const rarityOrder: Record<string, number> = { SuperRare: 0, VeryRare: 1, Rare: 2, NotNormal: 3, Normal: 4 };
    items.sort((a, b) => (rarityOrder[String(a.rarity)] ?? 5) - (rarityOrder[String(b.rarity)] ?? 5));
    return items;
  },
  buildFilters(data) {
    // 动态从数据汇总所有 sub_type，保证筛选选项始终完整（新增类型自动出现）
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
    const subTypeOptions = [
      { val: '', label: '全部' },
      ...subTypes.map((st) => ({ val: st, label: ITEM_TYPE_NAMES[st] || st })),
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
    const pic = hasIcon
      ? `<img class="nk-item-card__pic" src="${escHtml(item.icon)}"${cdnImgFallbackAttr(String(item.icon))} alt="${escHtml(item.name)}" loading="lazy" onerror="this.classList.add('is-broken')">`
      : '';
    return `<div class="nk-item-card" data-rarity="${escHtml(item.rarity)}" data-name="${escHtml(item.name)}" data-sub-type="${escHtml(subType)}" style="--i:${i};--rarity-color:${r.color}">
      <div class="nk-item-card__img">
        ${pic}
        <div class="nk-item-card__noimg" aria-hidden="true">${ITEM_NO_ICON_SVG}</div>
      </div>
      <div class="nk-item-card__info">
        <span class="nk-item-card__name">${escHtml(item.name)}</span>
        <span class="nk-item-card__meta">${typeName} · ${r.label}</span>
      </div>
    </div>`;
  },
};
