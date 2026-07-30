/**
 * API 层：全部为纯函数（显式传参，无全局状态），由 Pinia store 编排调用。
 *
 * 数据源（第二期已完成统一）：
 * - 角色（列表/详情/配装名/遗器套装）走本地转换数据（public/data/cn，随站部署）；
 * - 光锥/遗器/物品/敌对/终局目录均走本地数据（converter 输出或 cdn-samples 落地）；
 * - 图片资源与 Spine 动画仍走 CDN（static.nanoka.cc）。
 */
import { CDN } from '../lib/constants';
import { CACHE_TTL, cachedFetch, fetchJSON, purgeStaleVersions } from './cache';
import type {
  Manifest, CharacterData, ItemDb, NameCache, RelicSetData, SpineManifest,
  MazeListDb, LocalCharList,
  LocalItemList, LocalLightConeList, LocalRelicList, LocalMonsterList,
  LightConeDetail, LocalRelicEntry, RelicMainAffixList, RelicSubAffixList, RelicStoriesMap,
  CurrencyRoleList, CurrencyRoleDetail, CurrencySeasonList,
  CurrencyEquipList, CurrencyPortalList, CurrencyAugmentList, CurrencyTraitList,
  SkillAnimationsDb,
} from './types';

/** 本地数据根路径（随站部署，Vite base 自动带前缀） */
const LOCAL_DATA_BASE = `${import.meta.env.BASE_URL}data/cn`;

/* ─── manifest ─── */

export async function loadManifest(): Promise<Manifest> {
  const m = await cachedFetch<Manifest>(`${CDN}/manifest.json`, 'manifest', CACHE_TTL.manifest);
  // 火并忘：清理旧版本条目，不阻塞返回
  void purgeStaleVersions(m.hsr?.latest || '');
  return m;
}

/** 从 manifest 解析当前数据版本 */
export function resolveVersion(m: Manifest): string {
  return m.hsr?.latest || (m.hsr?.available || [])[0] || '';
}

/* ─── 技能动画（米游社 Wiki 抓取数据） ─── */

export function loadSkillAnimations(): Promise<SkillAnimationsDb> {
  if (!_skillAnimsP) {
    _skillAnimsP = fetchJSON<SkillAnimationsDb>(`${LOCAL_DATA_BASE}/skill_animations.json`)
      .catch((e) => { _skillAnimsP = null; throw e; });
  }
  return _skillAnimsP;
}

/* ─── 本地目录数据（随站部署，二期统一数据源） ─── */

/** 数字稀有度 → 字符串键（与 ItemInfo.rarity 及目录页 ITEM_RARITY_MAP 对齐） */
export const RARITY_NUM_TO_KEY: Record<number, string> = {
  5: 'SuperRare', 4: 'VeryRare', 3: 'Rare', 2: 'NotNormal', 1: 'Normal',
};

/* ─── 单例 Promise：静态 JSON 只请求一次，失败自动重置允许重试 ─── */

let _charsP: Promise<LocalCharList> | null = null;
let _lightConesP: Promise<LocalLightConeList> | null = null;
let _relicsP: Promise<LocalRelicList> | null = null;
let _skillAnimsP: Promise<SkillAnimationsDb> | null = null;

export function loadLocalItems(): Promise<LocalItemList> {
  return fetchJSON<LocalItemList>(`${LOCAL_DATA_BASE}/items.json`);
}

/** 物品库（Record 形态，供角色详情页 itemName 解析；由本地数组转换） */
export async function loadLocalItemDb(): Promise<ItemDb> {
  const list = await loadLocalItems();
  const db: ItemDb = {};
  for (const it of list) {
    db[String(it.id)] = {
      item_name: it.name,
      item_sub_type: it.sub_type,
      purpose_type: it.purpose_type,
      rarity: RARITY_NUM_TO_KEY[it.rarity] || 'Normal',
      item_figure_icon_path: it.figure_icon,
    };
  }
  return db;
}

export function loadLocalLightCones(): Promise<LocalLightConeList> {
  if (!_lightConesP) {
    _lightConesP = fetchJSON<LocalLightConeList>(`${LOCAL_DATA_BASE}/light_cones.json`)
      .catch((e) => { _lightConesP = null; throw e; });
  }
  return _lightConesP;
}

export function loadLocalRelicSets(): Promise<LocalRelicList> {
  if (!_relicsP) {
    _relicsP = fetchJSON<LocalRelicList>(`${LOCAL_DATA_BASE}/relics.json`)
      .catch((e) => { _relicsP = null; throw e; });
  }
  return _relicsP;
}

export function loadLocalMonsterList(): Promise<LocalMonsterList> {
  return fetchJSON<LocalMonsterList>(`${LOCAL_DATA_BASE}/monsters.json`);
}

export function loadLocalMazeList(): Promise<MazeListDb> {
  return fetchJSON<MazeListDb>(`${LOCAL_DATA_BASE}/maze.json`);
}

export function loadLocalStoryList(): Promise<MazeListDb> {
  return fetchJSON<MazeListDb>(`${LOCAL_DATA_BASE}/maze_extra.json`);
}

export function loadLocalBossList(): Promise<MazeListDb> {
  return fetchJSON<MazeListDb>(`${LOCAL_DATA_BASE}/maze_boss.json`);
}

export function loadLocalPeakList(): Promise<MazeListDb> {
  return fetchJSON<MazeListDb>(`${LOCAL_DATA_BASE}/maze_peak.json`);
}

/**
 * 终局 4 页数据并行预热入 L1 内存，保证 Tab 切换即时命中（失败静默）。
 * 注意：源数据无"赛季→版本"时间线，四季统一按 ID 降序展示，无需 version 预取。
 */
export function prefetchEndgameAll(_ver: string): void {
  void Promise.allSettled([
    loadLocalMazeList(),
    loadLocalStoryList(), loadLocalBossList(),
    loadLocalPeakList(),
  ]);
}

/* ─── Spine 动画清单 ─── */

export async function resolveSpineName(charId: string): Promise<string | null> {
  try {
    const manifest = await cachedFetch<SpineManifest>(
      `${CDN}/assets/hsr/spine/manifest.json`,
      'spine_manifest',
      CACHE_TTL.data,
    );
    const raw = manifest && manifest[charId];
    if (!raw) return null;
    // 多段资源（如 "bg|tibao1|tibao2"）优先跳过背景层 bg
    const parts = String(raw).split('|').filter(Boolean);
    return parts.find((p) => p !== 'bg') || parts[0] || null;
  } catch {
    return null;
  }
}

/** Spine 资源基地址（.skel / .atlas 后缀由调用方拼接） */
export function spineBaseUrl(charId: string, name: string): string {
  return `${CDN}/assets/hsr/spine/${charId}/${name}`;
}

/* ─── 本地数据源（TurnBasedGameData 转换输出） ─── */

export function loadLocalCharacterList(): Promise<LocalCharList> {
  if (!_charsP) {
    _charsP = fetchJSON<LocalCharList>(`${LOCAL_DATA_BASE}/characters.json`)
      .catch((e) => { _charsP = null; throw e; });
  }
  return _charsP;
}

export function loadLocalCharacter(charId: string): Promise<CharacterData> {
  return fetchJSON<CharacterData>(`${LOCAL_DATA_BASE}/characters/${charId}.json`);
}

export function loadLocalLightConeDetail(id: string): Promise<LightConeDetail> {
  return fetchJSON<LightConeDetail>(`${LOCAL_DATA_BASE}/light_cones/${id}.json`);
}

/** 从本地 relics.json 加载单个遗器套装详情（按 ID 查找） */
export async function loadLocalRelicDetail(id: string): Promise<LocalRelicEntry> {
  const list = await loadLocalRelicSets();
  const item = list.find((r) => String(r.id) === String(id));
  if (!item) throw new Error(`遗器套装不存在: ${id}`);
  return item;
}

/** 遗器主词条表（relic_main_affixes.json） */
export function loadLocalRelicMainAffixes(): Promise<RelicMainAffixList> {
  return fetchJSON<RelicMainAffixList>(`${LOCAL_DATA_BASE}/relic_main_affixes.json`);
}

/** 遗器副词条表（relic_sub_affixes.json） */
export function loadLocalRelicSubAffixes(): Promise<RelicSubAffixList> {
  return fetchJSON<RelicSubAffixList>(`${LOCAL_DATA_BASE}/relic_sub_affixes.json`);
}

/** 遗器来历表（relic_stories.json，set_id → 部位类型 → 故事） */
export function loadLocalRelicStories(): Promise<RelicStoriesMap> {
  return fetchJSON<RelicStoriesMap>(`${LOCAL_DATA_BASE}/relic_stories.json`);
}

/* ─── 货币战争 · 角色图鉴（独立 CDN 数据源，converter 落地） ─── */

export function loadLocalCurrencyRoles(): Promise<CurrencyRoleList> {
  return fetchJSON<CurrencyRoleList>(`${LOCAL_DATA_BASE}/currency/role.json`);
}

export function loadLocalCurrencyRole(id: string): Promise<CurrencyRoleDetail> {
  return fetchJSON<CurrencyRoleDetail>(`${LOCAL_DATA_BASE}/currency/role/${id}.json`);
}

export function loadLocalCurrencySeasons(): Promise<CurrencySeasonList> {
  return fetchJSON<CurrencySeasonList>(`${LOCAL_DATA_BASE}/currency/season.json`);
}

export function loadLocalCurrencyEquipment(): Promise<CurrencyEquipList> {
  return fetchJSON<CurrencyEquipList>(`${LOCAL_DATA_BASE}/currency/equipment.json`);
}

export function loadLocalCurrencyPortals(): Promise<CurrencyPortalList> {
  return fetchJSON<CurrencyPortalList>(`${LOCAL_DATA_BASE}/currency/portals.json`);
}

export function loadLocalCurrencyAugments(): Promise<CurrencyAugmentList> {
  return fetchJSON<CurrencyAugmentList>(`${LOCAL_DATA_BASE}/currency/augments.json`);
}

export function loadLocalCurrencyTraits(): Promise<CurrencyTraitList> {
  return fetchJSON<CurrencyTraitList>(`${LOCAL_DATA_BASE}/currency/traits.json`);
}

/**
 * 从本地 JSON 加载配装名称（光锥/遗器套装/队伍成员）。
 * 返回合并后的新 NameCache（不修改入参）。失败项回退为 '#id'。
 */
export async function loadLocalBuildNames(
  d: CharacterData,
  existing: NameCache = {},
): Promise<NameCache> {
  const result: NameCache = { ...existing };
  const needed = new Set<string>();

  (d.lightcones || []).forEach((id) => needed.add(String(id)));
  if (d.relics) {
    (d.relics.set4_id_list || []).concat(d.relics.set2_id_list || []).forEach((id) => needed.add(String(id)));
  }
  if (d.teams) d.teams.forEach((t) => (t.member_list || []).forEach((id) => needed.add(String(id))));

  try {
    const [lc, relics, chars] = await Promise.all([
      fetchJSON<LocalLightConeList>(`${LOCAL_DATA_BASE}/light_cones.json`),
      fetchJSON<LocalRelicList>(`${LOCAL_DATA_BASE}/relics.json`),
      fetchJSON<LocalCharList>(`${LOCAL_DATA_BASE}/characters.json`),
    ]);
    for (const item of lc) if (needed.has(String(item.id)) && !result[String(item.id)]) result[String(item.id)] = item.name;
    for (const item of relics) if (needed.has(String(item.id)) && !result[String(item.id)]) result[String(item.id)] = item.name;
    for (const item of chars) if (needed.has(String(item.id)) && !result[String(item.id)]) result[String(item.id)] = item.name;
  } catch { /* 失败静默 */ }

  // 任何仍未找到的名称回退为 '#id'
  for (const id of needed) {
    if (!result[id]) result[id] = '#' + id;
  }
  return result;
}

/**
 * 从本地 relics.json 加载遗器套装信息，返回与 CDN RelicSetData 兼容的结构。
 */
export async function loadLocalRelicSet(id: number | string): Promise<RelicSetData | null> {
  try {
    const list = await fetchJSON<LocalRelicList>(`${LOCAL_DATA_BASE}/relics.json`);
    const item = list.find((r) => String(r.id) === String(id));
    if (!item) return null;

    const require_num: Record<string, { desc?: string; param_list?: number[] }> = {};
    if (item.descriptions) {
      for (const [pc, desc] of Object.entries(item.descriptions)) {
        require_num[pc] = {
          desc,
          param_list: (item.param_list && item.param_list[pc]) || [],
        };
      }
    }
    return { name: item.name, icon: item.icon, require_num };
  } catch {
    return null;
  }
}
