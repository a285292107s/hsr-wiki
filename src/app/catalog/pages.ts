/**
 * 目录页配置注册表（对应原 catalog.js 的 registerCatalogPage 调用）
 * 10 个目录页：角色（专用抓取 + 筛选）、光锥、遗器、物品、敌对、迷宫、剧情、首领、混沌、货币战争
 */
import { CDN, PATH } from '../../lib/constants';
import {
  escHtml, stripAllTags, itemIconUrl, avatarShopIconUrl, elementIconUrl, pathIconUrl,
  lightconeIconUrl, monsterIconUrl,
} from '../../lib/format';
import {
  loadLocalItems, loadLocalLightCones, loadLocalRelicSets, loadLocalMonsterList,
  loadLocalMazeList, loadLocalStoryList, loadLocalBossList,
  loadLocalPeakList,
  prefetchEndgameAll, loadLocalCharacterList, RARITY_NUM_TO_KEY,
  loadLocalCurrencyRoles,
} from '../../services/api';
import type { CatalogItem, CatalogPageConfig, CatalogSubNavItem, CatalogFilter } from './types';
import type { MazeListDb, MazeListEntry, MazeVersionMap } from '../../services/types';

/** 属性图标 URL 键（小写） → 中文名 */
const ELEM_NAMES: Record<string, string> = {
  fire: '火', ice: '冰', thunder: '雷', wind: '风',
  quantum: '量子', imaginary: '虚数', physical: '物理',
};

const STAR_SVG =
  '<svg class="nk-cat-chip__star" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.26L21.5 9.3l-4.75 4.4 1.15 6.8L12 17.3l-5.9 3.2 1.15-6.8L2.5 9.3l6.6-1.04z"/></svg>';

const ITEM_RARITY_MAP: Record<string, { stars: number; label: string; color: string }> = {
  SuperRare: { stars: 5, label: '5★', color: '#FBBF24' },
  VeryRare: { stars: 4, label: '4★', color: '#C084FC' },
  Rare: { stars: 3, label: '3★', color: '#60A5FA' },
  NotNormal: { stars: 2, label: '2★', color: '#4ADE80' },
  Normal: { stars: 1, label: '1★', color: '#94A3B8' },
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

/* ─── 角色目录 ─── */

const characterPage: CatalogPageConfig = {
  id: 'character',
  title: '角色',
  searchPlaceholder: '搜索角色...',
  gridClass: 'nk-cat-grid',
  cardClass: '.nk-cat-card',
  async fetchData() {
    const list = await loadLocalCharacterList();
    const items: CatalogItem[] = [];
    for (const info of list) {
      if (!info.name) continue;
      const element = info.element.toLowerCase();
      const path = info.path.toLowerCase();
      const id = String(info.id);
      items.push({
        id,
        name: info.name,
        href: `/character/${id}`,
        avatar: avatarShopIconUrl(id),
        elemImg: elementIconUrl(element),
        pathImg: pathIconUrl(path),
        element,
        path,
        rarity: info.rarity,
      });
    }
    items.sort((a, b) => {
      const aTrailblazer = Number(a.id) >= 8000;
      const bTrailblazer = Number(b.id) >= 8000;
      if (aTrailblazer !== bTrailblazer) return aTrailblazer ? 1 : -1;
      return Number(b.id) - Number(a.id);
    });
    return items;
  },
  buildFilters(data) {
    const pathIconMap: Record<string, string> = {};
    const elemIconMap: Record<string, string> = {};
    data.forEach((c) => {
      if (c.path && c.pathImg) pathIconMap[String(c.path)] = String(c.pathImg);
      if (c.element && c.elemImg) elemIconMap[String(c.element)] = String(c.elemImg);
    });
    const paths = [...new Set(data.map((c) => String(c.path || '')).filter(Boolean))];
    const elems = [...new Set(data.map((c) => String(c.element || '')).filter(Boolean))];
    return [
      {
        key: 'path', label: '命途',
        options: [
          { val: '', label: '全部' },
          ...paths.map((p) => ({ val: p, label: PATH[p] || p, icon: pathIconMap[p] })),
        ],
      },
      {
        key: 'element', label: '属性',
        options: [
          { val: '', label: '全部' },
          ...elems.map((e) => ({ val: e, label: ELEM_NAMES[e] || e, icon: elemIconMap[e] })),
        ],
      },
      {
        key: 'rarity', label: '稀有度',
        options: [
          { val: '', label: '全部' },
          { val: '5', label: STAR_SVG + '5' },
          { val: '4', label: STAR_SVG + '4' },
        ],
      },
    ];
  },
  renderCard(item, i) {
    const stars = '★'.repeat(Number(item.rarity) || 5);
    const element = String(item.element || '');
    const path = String(item.path || '');
    return `<a class="nk-cat-card" href="${escHtml(item.href)}" data-element="${escHtml(element)}" data-rarity="${escHtml(item.rarity)}" data-name="${escHtml(item.name)}" data-path="${escHtml(path)}" style="--i:${i}">
    <div class="nk-cat-card__img">
      <img class="avatar" src="${escHtml(item.avatar)}" alt="${escHtml(item.name)}" loading="lazy">
      <div class="nk-cat-card__icons">
        ${item.elemImg ? `<img class="nk-cat-card__elem" src="${escHtml(item.elemImg)}" alt="${ELEM_NAMES[element] || element}">` : ''}
        ${item.pathImg ? `<img class="nk-cat-card__path" src="${escHtml(item.pathImg)}" alt="${PATH[path] || path}">` : ''}
      </div>
      <div class="nk-cat-card__info">
        <span class="nk-cat-card__stars">${stars}</span>
        <span class="nk-cat-card__name">${escHtml(item.name)}</span>
      </div>
    </div>
  </a>`;
  },
};

/* ─── 光锥 ─── */

const lightconePage: CatalogPageConfig = {
  id: 'lightcone',
  title: '光锥',
  searchPlaceholder: '搜索光锥...',
  gridClass: 'nk-cat-grid nk-lc-grid',
  cardClass: '.nk-lc-card',
  async fetchData() {
    const list = await loadLocalLightCones();
    const items: CatalogItem[] = [];
    for (const info of list) {
      if (!info.name) continue;
      const path = (info.path || '').toLowerCase();
      items.push({
        id: String(info.id),
        name: info.name,
        href: `/lightcone/${info.id}`,
        img: lightconeIconUrl(String(info.id)),
        pathImg: pathIconUrl(path),
        path,
        rarity: info.rarity,
      });
    }
    // 排序：id 降序（新光锥在前），黑塔商店特殊光锥（id ≥ 24000）排在尾部
    items.sort((a, b) => {
      const aId = Number(a.id);
      const bId = Number(b.id);
      const aHerta = aId >= 24000 ? 1 : 0;
      const bHerta = bId >= 24000 ? 1 : 0;
      if (aHerta !== bHerta) return aHerta - bHerta;
      return bId - aId;
    });
    return items;
  },
  buildFilters(data) {
    const pathIconMap: Record<string, string> = {};
    data.forEach((c) => {
      if (c.path && c.pathImg) pathIconMap[String(c.path)] = String(c.pathImg);
    });
    const paths = [...new Set(data.map((c) => String(c.path || '')).filter(Boolean))];
    return [
      {
        key: 'rarity', label: '稀有度',
        options: [
          { val: '', label: '全部' },
          { val: '5', label: STAR_SVG + '5' },
          { val: '4', label: STAR_SVG + '4' },
          { val: '3', label: STAR_SVG + '3' },
        ],
      },
      {
        key: 'path', label: '命途',
        options: [
          { val: '', label: '全部' },
          ...paths.map((p) => ({ val: p, label: PATH[p] || p, icon: pathIconMap[p] })),
        ],
      },
    ];
  },
  renderCard(item, i) {
    const stars = '★'.repeat(Number(item.rarity) || 5);
    const path = String(item.path || '');
    return `<a class="nk-lc-card" href="${escHtml(item.href)}" data-rarity="${escHtml(item.rarity)}" data-name="${escHtml(item.name)}" data-path="${escHtml(path)}" style="--i:${i}">
      <div class="nk-lc-card__img">
        <img class="lc-avatar" src="${escHtml(item.img)}" alt="${escHtml(item.name)}" loading="lazy">
        <div class="nk-sk nk-sk--shimmer nk-lc-card__shimmer" aria-hidden="true"></div>
        <div class="nk-lc-card__sheen-wrap" aria-hidden="true"></div>
        ${item.pathImg ? `<div class="nk-lc-card__badge"><img src="${escHtml(item.pathImg)}" alt="${PATH[path] || path}"></div>` : ''}
        <div class="nk-lc-card__info">
          <span class="nk-lc-card__stars">${stars}</span>
          <span class="nk-lc-card__name">${escHtml(item.name)}</span>
        </div>
      </div>
    </a>`;
  },
};

/* ─── 遗器 ─── */

const relicPage: CatalogPageConfig = {
  id: 'relic',
  title: '遗器',
  searchPlaceholder: '搜索遗器...',
  gridClass: 'nk-cat-grid nk-relic-grid',
  cardClass: '.nk-relic-card',
  async fetchData() {
    const list = await loadLocalRelicSets();
    const items: CatalogItem[] = [];
    for (const info of list) {
      if (!info.name) continue;
      const reqNums = Array.isArray(info.require_num) ? info.require_num : [];
      items.push({
        id: String(info.id),
        name: info.name,
        href: `/relic/${info.id}`,
        img: itemIconUrl(info.icon),
        set_type: reqNums.includes(4) ? '4' : '2',
      });
    }
    // 默认按 ID 降序：新遗器（ID 大）排在前面
    items.sort((a, b) => Number(b.id) - Number(a.id));
    return items;
  },
  filters: [
    {
      key: 'set_type', label: '套装类型',
      options: [
        { val: '', label: '全部' },
        { val: '4', label: '4件套 · 隧洞' },
        { val: '2', label: '2件套 · 位面' },
      ],
    },
  ],
  renderCard(item, i) {
    return `<a class="nk-relic-card" href="${escHtml(item.href)}" data-name="${escHtml(item.name)}" style="--i:${i}">
      <div class="nk-relic-card__img">
        <img src="${escHtml(item.img)}" alt="${escHtml(item.name)}" loading="lazy">
      </div>
      <div class="nk-relic-card__info">
        <span class="nk-relic-card__name">${escHtml(item.name)}</span>
      </div>
    </a>`;
  },
};

/* ─── 物品（本地数据源，>400 条触发虚拟滚动） ─── */

const itemPage: CatalogPageConfig = {
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
      ? `<img class="nk-item-card__pic" src="${escHtml(item.icon)}" alt="${escHtml(item.name)}" loading="lazy" onerror="this.classList.add('is-broken')">`
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

/* ─── 敌对物种 ─── */

const monsterPage: CatalogPageConfig = {
  id: 'monster',
  title: '敌对物种',
  searchPlaceholder: '搜索敌对物种...',
  gridClass: 'nk-cat-grid nk-mob-grid',
  cardClass: '.nk-mob-card',
  async fetchData() {
    const list = await loadLocalMonsterList();
    const items: CatalogItem[] = [];
    for (const info of list) {
      if (!info.name) continue;
      items.push({
        id: String(info.id),
        name: info.name,
        href: `/monster/${info.id}`,
        img: monsterIconUrl(info.icon),
      });
    }
    return items;
  },
  filters: [],
  renderCard(item, i) {
    return `<a class="nk-mob-card" href="${escHtml(item.href)}" data-name="${escHtml(item.name)}" style="--i:${i}">
      <div class="nk-mob-card__img">
        <img src="${escHtml(item.img)}" alt="${escHtml(item.name)}" loading="lazy">
      </div>
      <div class="nk-mob-card__info">
        <span class="nk-mob-card__name">${escHtml(item.name)}</span>
      </div>
    </a>`;
  },
};

/* ─── 终局内容（时间线赛季卡片） ─── */

/** 赛季状态：依据 begin/end 日期推导；无日期信息时返回"未知"（与原站一致） */
function mazeStatus(info: MazeListEntry): string {
  const parse = (s: string | undefined): number | null => {
    if (!s) return null;
    const t = new Date(s).getTime();
    return Number.isNaN(t) ? null : t;
  };
  const start = parse(info.live_begin) ?? parse(info.begin);
  const end = parse(info.live_end) ?? parse(info.end);
  const now = Date.now();
  if (start != null && now < start) return '未开始';
  if (end != null && now > end) return '已结束';
  if (start != null || end != null) return '进行中';
  return '未知';
}

/** 格式化日期区间（YYYY.MM.DD – MM.DD） */
function mazeDateRange(info: MazeListEntry): string {
  const fmt = (s: string | undefined): string | null => {
    if (!s) return null;
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return null;
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };
  const start = fmt(info.live_begin) ?? fmt(info.begin);
  const end = fmt(info.live_end) ?? fmt(info.end);
  if (start && end) return `${start} – ${end}`;
  if (start) return `${start} –`;
  return '';
}

/** 状态 → CSS 修饰类 */
const MAZE_STATUS_CLASS: Record<string, string> = {
  '进行中': 'live',
  '已结束': 'ended',
  '未开始': 'upcoming',
  '未知': 'unknown',
};

/** 终局内容 4 大分类（对应 4 个独立路由） */
const ENDGAME_TABS = [
  { label: '忘却之庭', en: 'FORGOTTEN HALL', href: '/maze' },
  { label: '虚构叙事', en: 'PURE FICTION', href: '/story' },
  { label: '末日幻影', en: 'APOCALYPSE', href: '/boss' },
  { label: '异相仲裁', en: 'ANOMALY', href: '/peak' },
] as const;

/** 生成子导航（当前路由项标记 active） */
function endgameSubNav(activeHref: string): CatalogSubNavItem[] {
  return ENDGAME_TABS.map((t) => ({ label: t.label, en: t.en, href: t.href, active: t.href === activeHref }));
}

/** 版本标签：数字版本原样输出；特殊键（unknown/static）转为中文 */
function verLabel(ver: string, idx: number): string {
  if (ver === 'unknown') return '未知';
  if (ver === 'static') return '常驻';
  return `${ver} v${idx + 1}`;
}

interface EndgamePageOpts {
  id: string;
  title: string;
  /** 本页路由（用于子导航高亮与详情链接前缀） */
  href: string;
  loadList: (ver: string) => Promise<MazeListDb>;
  /** 可选版本映射；无则按 ID 降序直接输出（story/boss） */
  loadVersions?: (ver: string) => Promise<MazeVersionMap>;
}

/**
 * 终局内容页工厂：4 页共享时间线卡片 / 状态筛选 / 子导航。
 */
function makeEndgamePage(o: EndgamePageOpts): CatalogPageConfig {
  return {
    id: o.id,
    title: o.title,
    subNav: endgameSubNav(o.href),
    prefetch: (ctx) => prefetchEndgameAll(ctx.version),
    searchPlaceholder: '搜索赛季...',
    gridClass: 'nk-cat-grid nk-season-grid',
    cardClass: '.nk-season-card',
    async fetchData(ctx) {
      const db = await o.loadList(ctx.version);
      const items: CatalogItem[] = [];
      if (o.loadVersions) {
        // 有 version.json：按版本映射输出（maze/peak），同赛季取最近归属版本
        const verMap = await o.loadVersions(ctx.version);
        const seen = new Set<string>();
        for (const [ver, ids] of Object.entries(verMap)) {
          (ids || []).forEach((mid, idx) => {
            const key = String(mid);
            if (seen.has(key)) return;
            seen.add(key);
            const info = db[key];
            if (!info || !info.zh) return;
            items.push({
              id: `ID ${key}`,
              name: stripAllTags(info.zh),
              href: `${o.href}/${key}`,
              version: verLabel(ver, idx),
              status: mazeStatus(info),
              dateRange: mazeDateRange(info),
            });
          });
        }
      } else {
        // 无 version.json：直接按 ID 降序输出（story/boss，对齐原站 2026→2001 / 3020→3001）
        for (const [key, info] of Object.entries(db)) {
          if (!info || !info.zh) continue;
          items.push({
            id: `ID ${key}`,
            name: stripAllTags(info.zh),
            href: `${o.href}/${key}`,
            version: '',
            status: mazeStatus(info),
            dateRange: mazeDateRange(info),
          });
        }
        items.sort((a, b) => Number(String(b.id).replace(/\D/g, '')) - Number(String(a.id).replace(/\D/g, '')));
      }
      return items;
    },
    renderCard(item, i) {
      const st = String(item.status || '未知');
      const stCls = MAZE_STATUS_CLASS[st] || 'unknown';
      const dateRange = item.dateRange ? String(item.dateRange) : '';
      const num = String(item.id).replace(/\D/g, '');
      const numCls = num.length >= 3 ? ' nk-season-card__num--long' : '';
      return `<a class="nk-season-card nk-season-card--${stCls}" href="${escHtml(item.href)}" data-name="${escHtml(item.name)} ${escHtml(item.id)}" data-status="${escHtml(st)}" style="--i:${i}">
      <div class="nk-season-card__node"></div>
      <span class="nk-season-card__num${numCls}">${escHtml(num)}</span>
      <div class="nk-season-card__body">
        <div class="nk-season-card__top">
          <span class="nk-season-card__name">${escHtml(item.name) || '未命名赛季'}</span>
          ${st !== '未知' ? `<span class="nk-season-card__status">${escHtml(st)}</span>` : ''}
        </div>
        <div class="nk-season-card__meta">
          <span class="nk-season-card__ver${item.version && item.version !== '未知' ? '' : ' nk-season-card__ver--unknown'}">${escHtml(item.version || '未知')}</span>
          ${dateRange ? `<span class="nk-season-card__date">${escHtml(dateRange)}</span>` : ''}
        </div>
      </div>
      <svg class="nk-season-card__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
    </a>`;
    },
  };
}

const mazePage = makeEndgamePage({
  id: 'maze', title: '终局内容', href: '/maze',
  loadList: loadLocalMazeList,
});

const storyPage = makeEndgamePage({
  id: 'story', title: '终局内容', href: '/story',
  loadList: loadLocalStoryList,
});

const bossPage = makeEndgamePage({
  id: 'boss', title: '终局内容', href: '/boss',
  loadList: loadLocalBossList,
});

const peakPage = makeEndgamePage({
  id: 'peak', title: '终局内容', href: '/peak',
  loadList: loadLocalPeakList,
});

/* ─── 货币战争（复用遗器卡片样式） ─── */

const currencyPage: CatalogPageConfig = {
  id: 'currency',
  title: '货币战争',
  searchPlaceholder: '搜索货币战争...',
  gridClass: 'nk-cat-grid nk-maze-grid',
  cardClass: '.nk-relic-card',
  async fetchData() {
    // 无 CDN 列表端点；硬编码 5 张静态卡片
    return [
      { name: '角色图鉴', href: '/currency/role', img: `${CDN}/assets/hsr/avatarroundicon/1001.webp` },
      { name: '装备图鉴', href: '/currency/item', img: `${CDN}/assets/hsr/gridfight/equipment/350101.webp` },
      { name: '投资环境图鉴', href: '/currency/buff', img: `${CDN}/assets/hsr/gridfight/portal/101.webp` },
      { name: '投资策略图鉴', href: '/currency/augment', img: `${CDN}/assets/hsr/gridfight/augmentbig/100101.webp` },
      { name: '羁绊图鉴', href: '/currency/trait', img: `${CDN}/assets/hsr/gridfight/icon/1001.webp` },
    ];
  },
  filters: [],
  renderCard(item, i) {
    return `<a class="nk-relic-card" href="${escHtml(item.href)}" data-name="${escHtml(item.name)}" style="--i:${i}">
      <div class="nk-relic-card__img">
        <img src="${escHtml(item.img)}" alt="${escHtml(item.name)}" loading="lazy">
      </div>
      <div class="nk-relic-card__info">
        <span class="nk-relic-card__name">${escHtml(item.name)}</span>
      </div>
    </a>`;
  },
};

/* ─── 货币战争 · 角色图鉴 ─── */

const FB_LABEL: Record<string, string> = {
  Front: '前排', Back: '后排', Both: '前后台',
};
const HEAL_LABEL: Record<string, string> = {
  Healer: '治疗', Shield: '护盾', Heal: '治疗', Damage: '输出',
};
const CHARGE_LABEL: Record<string, string> = {
  Speed: '速度', EnergyBar: '能量条', MaxSP: 'SP上限', MaxHP: '生命上限', SP: '战技点',
};

/* ─── 特质分类（与 converter _trait_cat 对齐） ─── */
type TraitCat = 'faction' | 'combat' | 'special';
const TRAIT_CAT_LABEL: Record<TraitCat, string> = {
  faction: '阵营', combat: '战斗定位', special: '特殊',
};

function renderCurrencyRoleCard(item: CatalogItem, index = 0): string {
  const id = String(item.id);
  const avatar = item.avatar || avatarShopIconUrl(id);
  const rarity = Number(item.rarity) || 0;
  const stars = rarity >= 1 && rarity <= 6 ? '★'.repeat(rarity) : String(rarity);
  const fb = FB_LABEL[item.front_back_type as string] ?? (item.front_back_type as string) ?? '';
  const heal = HEAL_LABEL[item.heal_or_shield_display as string] ?? (item.heal_or_shield_display as string) ?? '';
  const charge = (item.charge_type || []).map((c) => CHARGE_LABEL[c] ?? c).join(' · ');
  const expert = item.is_expert ? '<span class="nk-crole-tag nk-crole-tag--exp">专家</span>' : '';
  /* 特质标签（数据驱动，由 converter 从 TextMap 解析） */
  const traits = (item.traits as Array<{ id: number; name: string; cat: TraitCat }>) || [];
  const traitChips = traits
    .map((t) => `<span class="nk-crole-tcard-trait nk-crole-tcard-trait--${t.cat}">${escHtml(t.name || `#${t.id}`)}</span>`)
    .join('');
  /* data-rarity 上提到锚点，配合 CSS 稀有度色板；--i 驱动入场交错动画 */
  return `<a class="nk-crole-card" href="${item.href}" data-id="${escHtml(id)}" data-name="${escHtml(item.name)}" data-rarity="${rarity}" style="--i:${index}">
      <div class="nk-crole-card__avatar"><img loading="lazy" src="${escHtml(avatar)}" alt="${escHtml(item.name)}"></div>
      <div class="nk-crole-card__body">
        <div class="nk-crole-card__name">${escHtml(item.name)}</div>
        <div class="nk-crole-card__stars">${stars}</div>
        <div class="nk-crole-card__tags">
          ${fb ? `<span class="nk-crole-tag nk-crole-tag--fb">${escHtml(fb)}</span>` : ''}
          ${heal ? `<span class="nk-crole-tag nk-crole-tag--heal">${escHtml(heal)}</span>` : ''}
          ${charge ? `<span class="nk-crole-tag nk-crole-tag--charge">${escHtml(charge)}</span>` : ''}
          ${expert}
        </div>
        ${traitChips ? `<div class="nk-crole-card__traits">${traitChips}</div>` : ''}
      </div>
    </a>`;
}

const currencyRolePage: CatalogPageConfig = {
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
        avatar: avatarShopIconUrl(r.id),
        rarity: r.rarity,
        front_back_type: r.front_back_type ?? 'Both',
        heal_or_shield_display: r.heal_or_shield_display,
        charge_type: r.charge_type,
        is_expert: r.is_expert,
        trait_list: r.trait_list,
        traits,
        trait_faction: traits.filter((t) => t.cat === 'faction').map((t) => t.id),
        trait_combat: traits.filter((t) => t.cat === 'combat').map((t) => t.id),
        trait_special: traits.filter((t) => t.cat === 'special').map((t) => t.id),
        has_equipment: r.equipment_id != null,
      } as CatalogItem;
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
          ...rarities.map((v) => ({ val: String(v), label: `${v}★` })),
        ],
      });
    }

    // 特质筛选：按分类（阵营 / 战斗定位 / 特殊）从数据动态汇总
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

/* ─── 注册表 ─── */

export const CATALOG_PAGES: Record<string, CatalogPageConfig> = {
  character: characterPage,
  lightcone: lightconePage,
  relic: relicPage,
  item: itemPage,
  monster: monsterPage,
  maze: mazePage,
  story: storyPage,
  boss: bossPage,
  peak: peakPage,
  currency: currencyPage,
  'currency-role': currencyRolePage,
};
