// 429/503 退避重试，403/网络/CORS/超时→env；数据加载改浏览器 fetch(清单由 dataFileIndexDevPlugin 动态生成)。
// jsDelivr 限流纪律(禁止违反)：404 带 no-cache,no-store→不缓存，每次探测回源 GitHub，已知结果本地缓存(localStorage)+源文件 sha1；
// 并发硬上限 DEFAULT_CONCURRENCY=3，禁止调高；浏览器禁自定义 UA；重定向自动跟随，HEAD 404 直接判 dead(省一半请求)。
import {
  avatarDrawCardUrl,
  avatarShopIconUrl,
  eidolonIconUrl,
  elementIconUrl,
  gridFightEquipIconUrl,
  gridFightEquipIconWithFallback,
  gridFightIconUrl,
  gridFightPropIconUrl,
  gridFightSkillIconSrc,
  gridFightTraitIconById,
  gridFightTraitIconUrl,
  iconUrl,
  itemIconUrl,
  lightconeIconUrl,
  monsterFigureUrl,
  monsterIconUrl,
  pathIconUrl,
  skillIconUrl,
} from '../../lib/icons';
import { SLOT_ICONS, SLOT_INDEX } from '../../lib/constants';
import { cdnUri, resolveCdnUri } from '../../services/cdn';

export type ProbeStatus = 'ok' | 'dead' | 'env';

export interface CacheEntry {
  status: ProbeStatus;
  ts: number;
}
export interface CacheFile {
  sourceHashes: Record<string, string>;
  entries: Record<string, CacheEntry>;
}

export type UrlMap = Map<string, string>;
export type DataMap = Record<string, unknown>;

export const DATA_INDEX_URL = '/data/cn/data-file-index.json';
/** jsDelivr burst 限流实证（Node 版结论）：并发硬上限，UI 只允许调低（1/2/3） */
export const DEFAULT_CONCURRENCY = 3;
const LOAD_CONCURRENCY = 8;
const TTL_OK_DEAD_MS = 7 * 24 * 3600 * 1000;
const TTL_ENV_MS = 24 * 3600 * 1000;
const PROBE_TIMEOUT_MS = 10_000;

export const CACHE_STORAGE_KEY = 'hsr-lab:dead-links-cache:v1';

export type UrlDomain = 'jsdelivr' | 'nanoka' | 'other';

export function domainOf(url: string): UrlDomain {
  if (url.startsWith('https://cdn.jsdelivr.net')) return 'jsdelivr';
  if (url.startsWith('https://static.nanoka.cc')) return 'nanoka';
  return 'other';
}

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

export async function loadDataFileList(fetchImpl: typeof fetch = fetch): Promise<string[]> {
  const r = await fetchImpl(DATA_INDEX_URL);
  if (!r.ok) throw new Error(`数据文件清单加载失败: HTTP ${r.status}`);
  const list: unknown = await r.json();
  return Array.isArray(list) ? list.filter((x): x is string => typeof x === 'string') : [];
}

async function fetchText(rel: string, fetchImpl: typeof fetch): Promise<string> {
  try {
    const r = await fetchImpl(`/data/cn/${rel}`);
    return r.ok ? await r.text() : '';
  } catch {
    return '';
  }
}

export interface PrepareResult {
  urls: UrlMap;
  sourceHashes: Record<string, string>;
  dataFileCount: number;
}
export interface PrepareDeps {
  fetchImpl?: typeof fetch;
  sha1Impl?: (text: string) => Promise<string>;
  loadConcurrency?: number;
}

export async function prepareAudit(deps: PrepareDeps = {}): Promise<PrepareResult> {
  const fetchImpl = deps.fetchImpl ?? fetch;
  const sha1 = deps.sha1Impl ?? sha1Hex;
  const rels = await loadDataFileList(fetchImpl);
  if (rels.length === 0) throw new Error('数据文件清单为空（插件未生效？）');

  const texts = new Map<string, string>();
  const data: DataMap = {};
  let idx = 0;
  const workers = Array.from({ length: deps.loadConcurrency ?? LOAD_CONCURRENCY }, async () => {
    while (idx < rels.length) {
      const rel = rels[idx++];
      const text = await fetchText(rel, fetchImpl);
      texts.set(rel, text);
      try {
        data[rel] = JSON.parse(text);
      } catch {
        data[rel] = null;
      }
    }
  });
  await Promise.all(workers);

  const urls = collectUrls(data);
  const sourceHashes = await computeSourceHashes(urls, texts, sha1);
  return { urls, sourceHashes, dataFileCount: rels.length };
}

export function collectUrls(data: DataMap): UrlMap {
  const urls: UrlMap = new Map();
  const add = (url: string | undefined | null, source: string): void => {
    if (url && !urls.has(url)) urls.set(url, source);
  };

  const list = (rel: string): unknown[] => {
    const v = data[rel];
    return Array.isArray(v) ? v : [];
  };
  const dirFiles = (dir: string): [string, unknown][] =>
    Object.keys(data)
      .filter((rel) => rel.startsWith(`${dir}/`) && rel.endsWith('.json'))
      .sort()
      .map((rel) => [rel, data[rel]]);
  const detailId = (rel: string, dir: string): string => rel.slice(dir.length + 1, -5);

  for (const c of list('characters.json') as Array<{ id: string | number; element?: string; path?: string }>) {
    const id = c.id;
    add(avatarShopIconUrl(id), `characters.json#${id}.avatar`);
    add(avatarDrawCardUrl(id), `characters.json#${id}.drawcard`);
    add(elementIconUrl(c.element), `characters.json#${id}.element`);
    add(pathIconUrl(c.path), `characters.json#${id}.path`);
  }
  for (const [rel, raw] of dirFiles('characters')) {
    const d = raw as Record<string, unknown> | null;
    if (!d || typeof d !== 'object') continue;
    const id = detailId(rel, 'characters');
    for (const sk of Object.values((d.skills as Record<string, unknown> | undefined) || {})) {
      add(skillIconUrl(sk as never, id, d as never), `${rel}#skill.${(sk as { type?: string }).type}`);
    }
    for (const [rkKey, rk] of Object.entries((d.ranks as Record<string, { icon?: string }> | undefined) || {})) {
      add(eidolonIconUrl(id, rkKey), `${rel}#rank${rkKey}`);
      add(iconUrl(rk.icon), `${rel}#rank${rkKey}.icon`);
    }
    for (const ab of Object.values((d.extra as { abilities?: Record<string, { icon?: string; name?: string }> } | undefined)?.abilities || {})) {
      add(iconUrl(ab.icon), `${rel}#ability.${ab.name}`);
    }
  }

  for (const lc of list('light_cones.json') as Array<{ id: string | number; path?: string }>) {
    add(lightconeIconUrl(lc.id), `light_cones.json#${lc.id}`);
    add(pathIconUrl(lc.path), `light_cones.json#${lc.id}.path`);
  }

  for (const m of list('monsters.json') as Array<{ id?: unknown; icon?: string }>) {
    add(monsterIconUrl(m.icon), `monsters.json#${m.id}.icon`);
  }
  for (const [rel, raw] of dirFiles('monsters')) {
    const d = raw as { id?: unknown; figure?: string; icon?: string } | null;
    if (!d || typeof d !== 'object') continue;
    add(monsterFigureUrl(d.figure), `${rel}#figure`);
    add(monsterIconUrl(d.icon), `${rel}#icon`);
  }

  for (const it of list('items.json') as Array<{ id?: unknown; icon?: string; figure_icon?: string }>) {
    add(itemIconUrl(it.figure_icon), `items.json#${it.id}.figure_icon`);
    add(itemIconUrl(it.icon), `items.json#${it.id}.icon`);
  }
  for (const mz of ['maze.json', 'maze_boss.json', 'maze_extra.json', 'maze_peak.json']) {
    for (const d of Object.values((data[mz] as Record<string, { id?: unknown; icon?: string }> | null) || {})) {
      add(itemIconUrl(d.icon), `${mz}#${d.id}.icon`);
    }
  }

  for (const r of list('relics.json') as Array<{ id?: unknown; icon?: string; icon_figure?: string }>) {
    add(itemIconUrl(r.icon), `relics.json#${r.id}.icon`);
    add(itemIconUrl(r.icon_figure), `relics.json#${r.id}.icon_figure`);
    for (const slot of Object.keys(SLOT_ICONS)) {
      add(cdnUri('relicfigures', `IconRelic_${r.id}_${SLOT_INDEX[slot] ?? 1}.webp`), `relics.json#${r.id}.${slot}`);
    }
  }

  for (const it of (data['currency/equipment.json'] as { items?: Array<{ icon?: string; id?: unknown }> } | null)?.items || []) {
    add(gridFightEquipIconUrl(it.icon), `currency/equipment.json#${it.id}`);
  }
  for (const it of (data['currency/augments.json'] as { augments?: Array<{ icon?: string; mini_icon?: string; id?: unknown }> } | null)?.augments || []) {
    add(gridFightIconUrl(it.icon) || gridFightIconUrl(it.mini_icon), `currency/augments.json#${it.id}`);
  }
  for (const it of (data['currency/portals.json'] as { portals?: Array<{ icon?: string; id?: unknown }> } | null)?.portals || []) {
    add(gridFightIconUrl(it.icon), `currency/portals.json#${it.id}`);
  }
  for (const it of (data['currency/traits.json'] as { traits?: Array<{ icon?: string; id?: unknown }> } | null)?.traits || []) {
    add(gridFightTraitIconUrl(it.icon), `currency/traits.json#${it.id}`);
  }
  for (const [pt, icon] of Object.entries((data['currency/prop_icons.json'] as Record<string, string> | undefined) || {})) {
    add(gridFightPropIconUrl(icon), `currency/prop_icons.json#${pt}`);
  }
  for (const [rel, raw] of dirFiles('currency/role')) {
    const d = raw as { avatar_id?: unknown; id?: unknown; stars?: Record<string, { front_show_skill?: Array<{ icon?: string; id?: unknown }>; back_show_skill?: Array<{ icon?: string; id?: unknown }>; servant_show_skill?: Array<{ icon?: string; id?: unknown }> }>; rank?: Array<{ icon?: string; rank?: unknown }>; equipment?: Array<{ icon?: string; equipment_id?: unknown; id?: unknown }>; traits?: Array<{ icon?: string; id?: unknown }> } | null;
    if (!d || typeof d !== 'object') continue;
    const id = String(d.avatar_id ?? d.id ?? detailId(rel, 'currency/role'));
    add(avatarShopIconUrl(id), `${rel}#avatar`);
    add(avatarDrawCardUrl(id), `${rel}#drawcard`);
    for (const s of Object.values(d.stars || {})) {
      for (const g of ['front_show_skill', 'back_show_skill', 'servant_show_skill'] as const) {
        for (const sk of s[g] || []) {
          const { src, fb } = gridFightSkillIconSrc(sk.icon);
          add(src, `${rel}#skill.${sk.id}`);
          add(fb, `${rel}#skill.${sk.id}.nanoka`);
        }
      }
    }
    for (const rk of d.rank || []) {
      const file = `${id}/${id}_Rank_${rk.rank}.webp`;
      const { primary, fallback } = resolveCdnUri('rank', file);
      add(primary, `${rel}#rank${rk.rank}`);
      add(fallback, `${rel}#rank${rk.rank}.nanoka`);
    }
    for (const eq of d.equipment || []) {
      const eqId = eq.equipment_id ?? eq.id;
      add(gridFightEquipIconWithFallback(eq.icon, eqId as number), `${rel}#equip.${eqId}`);
    }
    for (const t of d.traits || []) {
      add(gridFightTraitIconUrl(t.icon), `${rel}#trait.${t.id}`);
      add(gridFightTraitIconById(t.id as number), `${rel}#trait.${t.id}.byId`);
    }
  }

  const scanAbs = (o: unknown, src: string): void => {
    if (!o || typeof o !== 'object') return;
    if (Array.isArray(o)) {
      o.forEach((v) => scanAbs(v, src));
      return;
    }
    for (const [k, v] of Object.entries(o)) {
      if (typeof v === 'string' && v.startsWith('https://')) add(v, `${src}#${k}`);
      else scanAbs(v, src);
    }
  };
  for (const rel of Object.keys(data)) scanAbs(data[rel], rel);

  return urls;
}

function sourceFileOf(url: string, urls: UrlMap): string | null {
  const f = urls.get(url)!.split('#')[0];
  return f.endsWith('.json') ? f : null;
}

export async function computeSourceHashes(
  urls: UrlMap,
  texts: Map<string, string>,
  sha1: (text: string) => Promise<string>,
): Promise<Record<string, string>> {
  const files = new Set<string>();
  for (const source of urls.values()) {
    const f = source.split('#')[0];
    if (f.endsWith('.json')) files.add(f);
  }
  const hashes: Record<string, string> = {};
  for (const f of files) {
    const text = texts.get(f);
    hashes[f] = text === undefined ? 'unreadable' : await sha1(text);
  }
  return hashes;
}

export async function sha1Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export interface ProbePlan {
  toProbe: string[];
  results: Record<string, CacheEntry>;
  reuseCount: number;
}

function isFresh(e: CacheEntry, now: number): boolean {
  return now - e.ts < (e.status === 'env' ? TTL_ENV_MS : TTL_OK_DEAD_MS);
}

export function planProbe(
  urls: UrlMap,
  cache: CacheFile | null,
  sourceHashes: Record<string, string>,
  now: number,
  force: boolean,
): ProbePlan {
  const results: Record<string, CacheEntry> = {};
  const cached = cache ? cache.entries : {};
  const prevHashes = cache ? cache.sourceHashes : {};
  const toProbe: string[] = [];
  let reuseCount = 0;
  for (const url of urls.keys()) {
    const e = cached[url];
    if (!e || !isFresh(e, now) || force) {
      toProbe.push(url);
      continue;
    }
    // 来源文件内容签名变化 → 该 URL 重测（converter 确定性重写但内容未变 → 签名一致 → 复用）
    const f = sourceFileOf(url, urls);
    if (f && prevHashes[f] !== sourceHashes[f]) {
      toProbe.push(url);
      continue;
    }
    results[url] = e;
    reuseCount++;
  }
  return { toProbe, results, reuseCount };
}

type ProbeSingleResult = 'ok' | 'dead' | 'env' | 'throttled';

async function singleRequest(url: string, fetchImpl: typeof fetch): Promise<ProbeSingleResult> {
  try {
    const r = await fetchImpl(url, {
      method: 'HEAD',
      // 重定向跟随（jsDelivr 冷文件 302 → raw.githubusercontent.com，CORS 放行，跟随后 2xx 即存在）
      redirect: 'follow',
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    });
    if (r.ok) return 'ok';
    if (r.status === 404) return 'dead';
    if (r.status === 429 || r.status === 503) return 'throttled';
    // 403 为持续信号（数据中心 IP 拒用等，Node 版历史实证），退避重试无意义
    if (r.status === 403) return 'env';
    return 'env';
  } catch {
    return 'env';
  }
}

export async function probeUrl(
  url: string,
  fetchImpl: typeof fetch = fetch,
  sleepImpl: (ms: number) => Promise<void> = sleep,
): Promise<ProbeStatus> {
  for (const wait of [0, 2_000, 5_000]) {
    if (wait) await sleepImpl(wait);
    const st = await singleRequest(url, fetchImpl);
    if (st === 'ok') return 'ok';
    if (st === 'dead') return 'dead';
    if (st === 'throttled') continue;
    return 'env';
  }
  return 'env';
}

export interface AuditControl {
  stopped: boolean;
  paused: boolean;
}
export interface AuditCallbacks {
  onResult?: (url: string, status: ProbeStatus) => void;
  onProgress?: (done: number, total: number) => void;
}

export async function runAudit(
  toProbe: string[],
  concurrency: number,
  control: AuditControl,
  cb: AuditCallbacks,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  let idx = 0;
  let done = 0;
  const total = toProbe.length;
  const worker = async (): Promise<void> => {
    while (!control.stopped) {
      while (control.paused && !control.stopped) await sleep(200);
      if (control.stopped) break;
      const url = toProbe[idx++];
      if (url === undefined) break;
      const status = await probeUrl(url, fetchImpl);
      cb.onResult?.(url, status);
      done++;
      cb.onProgress?.(done, total);
    }
  };
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
}

export function loadCacheFromStorage(storage: Storage = localStorage): CacheFile | null {
  try {
    const raw = storage.getItem(CACHE_STORAGE_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as CacheFile;
    return c && typeof c.sourceHashes === 'object' ? c : null;
  } catch {
    return null;
  }
}

export function saveCacheToStorage(cf: CacheFile, storage: Storage = localStorage): void {
  try {
    storage.setItem(CACHE_STORAGE_KEY, JSON.stringify(cf));
  } catch {
    // QuotaExceeded / 隐私模式等：静默丢弃，本轮结果仍保留在内存
  }
}
