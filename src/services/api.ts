/**
 * CDN API 层：全部为纯函数（显式传参，无全局状态），由 Pinia store 编排调用。
 * ⚠️ 运行时必须始终从 https://static.nanoka.cc 实时拉取（cdn-samples 仅供类型参考）
 */
import { CDN } from '../lib/constants';
import { CACHE_TTL, cachedFetch, cacheHas, memStore, purgeStaleVersions } from './cache';
import type {
  Manifest, CharacterData, ItemDb, NameCache, RelicSetData, SpineManifest,
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

/* ─── 角色数据 ─── */

export function characterUrl(ver: string, charId: string): string {
  return `${CDN}/hsr/${ver}/zh/character/${charId}.json`;
}

export function loadCharacter(ver: string, charId: string): Promise<CharacterData> {
  return cachedFetch<CharacterData>(characterUrl(ver, charId), `char_${ver}_${charId}`, CACHE_TTL.data);
}

/* ─── 物品数据库 ─── */

export function loadItems(ver: string): Promise<ItemDb> {
  return cachedFetch<ItemDb>(`${CDN}/hsr/${ver}/zh/item.json`, `item_${ver}`, CACHE_TTL.data);
}

/* ─── 遗器套装 ─── */

export function loadRelicSet(ver: string, id: number | string): Promise<RelicSetData | null> {
  return cachedFetch<RelicSetData>(
    `${CDN}/hsr/${ver}/zh/relicset/${id}.json`,
    `relicset_${ver}_${id}`,
    CACHE_TTL.data,
  ).catch(() => null);
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

/* ─── 配装名称批量加载（光锥/遗器套装/队伍成员） ─── */

/** 简单并发限制器：限制同 host 并发请求数（HTTP/1.1 同源 6 连接上限留余量） */
async function pLimit<T>(
  concurrency: number,
  items: T[],
  worker: (item: T, index: number) => Promise<void>,
): Promise<void> {
  const queue = items.slice();
  let idx = 0;
  const run = async (): Promise<void> => {
    while (queue.length) {
      const i = idx++;
      const item = queue.shift() as T;
      await worker(item, i);
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, run));
}

/**
 * 收集角色配装引用的名称（光锥/遗器套装/队伍成员），4 并发拉取各自 JSON 的 name 字段。
 * 返回合并后的新 NameCache（不修改入参）。失败项回退为 '#id'。
 */
export async function loadBuildNames(
  ver: string,
  d: CharacterData,
  existing: NameCache = {},
): Promise<NameCache> {
  const paths = new Set<string>();
  (d.lightcones || []).forEach((id) => paths.add('lightcone/' + id));
  if (d.relics) {
    (d.relics.set4_id_list || []).concat(d.relics.set2_id_list || []).forEach((id) => paths.add('relicset/' + id));
  }
  if (d.teams) d.teams.forEach((t) => (t.member_list || []).forEach((id) => paths.add('character/' + id)));

  const result: NameCache = { ...existing };
  await pLimit(4, [...paths], async (path) => {
    const id = path.split('/')[1];
    if (result[id]) return; // 已有则跳过
    try {
      const j = await cachedFetch<{ name?: string }>(
        `${CDN}/hsr/${ver}/zh/${path}.json`,
        `name_${ver}_${path}`,
        CACHE_TTL.data,
      );
      result[id] = j.name || '#' + id;
    } catch {
      result[id] = '#' + id;
    }
  });
  return result;
}

/* ─── Hover 预取：列表页悬停时提前加载角色数据（火并忘） ─── */

const prefetched = new Set<string>();

export function prefetchCharData(ver: string, charId: string): void {
  if (!ver || !charId || prefetched.has(charId)) return;
  prefetched.add(charId);
  void (async () => {
    try {
      const key = `char_${ver}_${charId}`;
      if (await cacheHas(key)) return; // 内存/IDB 已有
      // 低优先级网络预取
      const url = characterUrl(ver, charId);
      const opts: RequestInit & { priority?: string } = {};
      if ('priority' in Request.prototype) opts.priority = 'low';
      const r = await fetch(url, opts);
      if (!r.ok) return;
      const data = await r.json();
      memStore(key, data, CACHE_TTL.data);
    } catch {
      /* 预取失败静默 */
    }
  })();
}
