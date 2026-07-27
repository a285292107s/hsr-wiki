/**
 * API 层：全部为纯函数（显式传参，无全局状态），由 Pinia store 编排调用。
 *
 * 数据源（第二期已完成统一）：
 * - 角色（列表/详情/配装名/遗器套装）走本地转换数据（public/data/cn，随站部署）；
 * - 光锥/遗器/物品/敌对/终局目录均走本地数据（converter 输出或 cdn-samples 落地）；
 * - 图片资源与 Spine 动画仍走 CDN（static.nanoka.cc）。
 */
import { CDN } from '../lib/constants';
import { CACHE_TTL, cachedFetch, purgeStaleVersions } from './cache';
import type {
  Manifest, CharacterData, ItemDb, NameCache, RelicSetData, SpineManifest,
  MazeListDb, LocalCharList,
  LocalItemList, LocalLightConeList, LocalRelicList, LocalMonsterList,
} from './types';

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

/* ─── 本地目录数据（随站部署，二期统一数据源） ─── */

/** 数字稀有度 → 字符串键（与 ItemInfo.rarity 及目录页 ITEM_RARITY_MAP 对齐） */
export const RARITY_NUM_TO_KEY: Record<number, string> = {
  5: 'SuperRare', 4: 'VeryRare', 3: 'Rare', 2: 'NotNormal', 1: 'Normal',
};

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return (await res.json()) as T;
}

export function loadLocalItems(): Promise<LocalItemList> {
  return fetchJson<LocalItemList>(`${LOCAL_DATA_BASE}/items.json`);
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
  return fetchJson<LocalLightConeList>(`${LOCAL_DATA_BASE}/light_cones.json`);
}

export function loadLocalRelicSets(): Promise<LocalRelicList> {
  return fetchJson<LocalRelicList>(`${LOCAL_DATA_BASE}/relics.json`);
}

export function loadLocalMonsterList(): Promise<LocalMonsterList> {
  return fetchJson<LocalMonsterList>(`${LOCAL_DATA_BASE}/monsters.json`);
}

export function loadLocalMazeList(): Promise<MazeListDb> {
  return fetchJson<MazeListDb>(`${LOCAL_DATA_BASE}/maze.json`);
}

export function loadLocalStoryList(): Promise<MazeListDb> {
  return fetchJson<MazeListDb>(`${LOCAL_DATA_BASE}/maze_extra.json`);
}

export function loadLocalBossList(): Promise<MazeListDb> {
  return fetchJson<MazeListDb>(`${LOCAL_DATA_BASE}/maze_boss.json`);
}

export function loadLocalPeakList(): Promise<MazeListDb> {
  return fetchJson<MazeListDb>(`${LOCAL_DATA_BASE}/maze_peak.json`);
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

const LOCAL_DATA_BASE = `${import.meta.env.BASE_URL}data/cn`;

export async function loadLocalCharacterList(): Promise<LocalCharList> {
  const url = `${LOCAL_DATA_BASE}/characters.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.json();
}

export async function loadLocalCharacter(charId: string): Promise<CharacterData> {
  const url = `${LOCAL_DATA_BASE}/characters/${charId}.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.json();
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
      fetch(`${LOCAL_DATA_BASE}/light_cones.json`).then((r) => (r.ok ? r.json() : [])),
      fetch(`${LOCAL_DATA_BASE}/relics.json`).then((r) => (r.ok ? r.json() : [])),
      fetch(`${LOCAL_DATA_BASE}/characters.json`).then((r) => (r.ok ? r.json() : [])),
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
    const res = await fetch(`${LOCAL_DATA_BASE}/relics.json`);
    if (!res.ok) return null;
    const list: Array<{
      id: number; name: string; icon: string;
      descriptions?: Record<string, string>;
      param_list?: Record<string, number[]>;
    }> = await res.json();
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
