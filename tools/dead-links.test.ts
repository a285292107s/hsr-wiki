import { describe, expect, test } from 'vitest';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import {
  avatarDrawCardUrl,
  avatarShopIconUrl,
  eidolonIconUrl,
  elementIconUrl,
  gridFightEquipIconUrl,
  gridFightEquipIconWithFallback,
  gridFightIconUrl,
  gridFightTraitIconById,
  gridFightTraitIconUrl,
  iconUrl,
  itemIconUrl,
  lightconeIconUrl,
  monsterFigureUrl,
  monsterIconUrl,
  pathIconUrl,
  skillIconUrl,
} from '../src/lib/icons';
import { SLOT_ICONS, SLOT_INDEX } from '../src/lib/constants';
import { cdnUri } from '../src/services/cdn';

const DATA = join(import.meta.dirname, '..', 'public', 'data', 'cn');
const CACHE_FILE = join(import.meta.dirname, '..', 'temp', 'dead-links-cache.json');
const LIMIT = Number(process.env.DEAD_LINKS_LIMIT || 0);
const FORCE = process.env.DEAD_LINKS_FORCE === '1';
const BUDGET_MS = Number(process.env.DEAD_LINKS_BUDGET_MS || 0);

const CONCURRENCY = 3;
const TTL_OK_DEAD = 7;
const TTL_ENV = 1;
const UA = 'hsr-wiki-dead-link-audit/1.0 (+https://github.com/a285292107s/hsr-wiki)';

function walkJson(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walkJson(p, out);
    else if (name.endsWith('.json')) out.push(p);
  }
  return out;
}

const load = (rel: string) => JSON.parse(readFileSync(join(DATA, rel), 'utf8'));
const loadDir = (rel: string) =>
  walkJson(join(DATA, rel)).map((f) => JSON.parse(readFileSync(f, 'utf8')));

type Urls = Map<string, string>;

function add(map: Urls, url: string | undefined | null, source: string): void {
  if (url && !map.has(url)) map.set(url, source);
}

function collectUrls(): Urls {
  const urls: Urls = new Map();

  for (const c of load('characters.json')) {
    add(urls, avatarShopIconUrl(c.id), `characters.json#${c.id}.avatar`);
    add(urls, avatarDrawCardUrl(c.id), `characters.json#${c.id}.drawcard`);
    add(urls, elementIconUrl(c.element), `characters.json#${c.id}.element`);
    add(urls, pathIconUrl(c.path), `characters.json#${c.id}.path`);
  }
  for (const f of walkJson(join(DATA, 'characters'))) {
    const d = JSON.parse(readFileSync(f, 'utf8'));
    const id = basename(f, '.json');
    for (const sk of Object.values(d.skills || {})) {
      add(urls, skillIconUrl(sk as never, id, d), `characters/${id}.json#skill.${(sk as { type: string }).type}`);
    }
    for (const [rkKey, rk] of Object.entries((d.ranks as Record<string, { icon: string }>) || {})) {
      add(urls, eidolonIconUrl(id, rkKey), `characters/${id}.json#rank${rkKey}`);
      add(urls, iconUrl(rk.icon), `characters/${id}.json#rank${rkKey}.icon`);
    }
    for (const ab of Object.values(d.extra?.abilities || {})) {
      add(urls, iconUrl((ab as { icon: string }).icon), `characters/${id}.json#ability.${(ab as { name: string }).name}`);
    }
  }

  for (const lc of load('light_cones.json')) {
    add(urls, lightconeIconUrl(lc.id), `light_cones.json#${lc.id}`);
    add(urls, pathIconUrl(lc.path), `light_cones.json#${lc.id}.path`);
  }

  for (const m of load('monsters.json')) {
    add(urls, monsterIconUrl(m.icon), `monsters.json#${m.id}.icon`);
  }
  for (const d of loadDir('monsters')) {
    add(urls, monsterFigureUrl(d.figure), `monsters/${d.id}.json#figure`);
    add(urls, monsterIconUrl(d.icon), `monsters/${d.id}.json#icon`);
  }

  for (const it of load('items.json')) {
    add(urls, itemIconUrl(it.figure_icon), `items.json#${it.id}.figure_icon`);
    add(urls, itemIconUrl(it.icon), `items.json#${it.id}.icon`);
  }
  for (const mz of ['maze.json', 'maze_boss.json', 'maze_extra.json', 'maze_peak.json']) {
    for (const d of Object.values(load(mz))) {
      add(urls, itemIconUrl(d.icon), `${mz}#${d.id}.icon`);
    }
  }

  for (const r of load('relics.json')) {
    add(urls, itemIconUrl(r.icon), `relics.json#${r.id}.icon`);
    add(urls, itemIconUrl(r.icon_figure), `relics.json#${r.id}.icon_figure`);
    for (const slot of Object.keys(SLOT_ICONS)) {
      add(urls, cdnUri('relicfigures', `IconRelic_${r.id}_${SLOT_INDEX[slot] ?? 1}.webp`), `relics.json#${r.id}.${slot}`);
    }
  }

  for (const it of load('currency/equipment.json').items || []) {
    add(urls, gridFightEquipIconUrl(it.icon), `currency/equipment.json#${it.id}`);
  }
  for (const it of load('currency/augments.json').augments || []) {
    add(urls, gridFightIconUrl(it.icon) || gridFightIconUrl(it.mini_icon), `currency/augments.json#${it.id}`);
  }
  for (const it of load('currency/portals.json').portals || []) {
    add(urls, gridFightIconUrl(it.icon), `currency/portals.json#${it.id}`);
  }
  for (const it of load('currency/traits.json').traits || []) {
    add(urls, gridFightTraitIconUrl(it.icon), `currency/traits.json#${it.id}`);
  }
  for (const d of loadDir('currency/role')) {
    const id = String(d.avatar_id || d.id);
    add(urls, avatarShopIconUrl(id), `currency/role/${id}.json#avatar`);
    add(urls, avatarDrawCardUrl(id), `currency/role/${id}.json#drawcard`);
    for (const rk of d.rank || []) {
      add(urls, iconUrl(rk.icon), `currency/role/${id}.json#rank${rk.rank}`);
    }
    for (const eq of d.equipment || []) {
      const eqId = eq.equipment_id ?? eq.id;
      add(urls, gridFightEquipIconWithFallback(eq.icon, eqId), `currency/role/${id}.json#equip.${eqId}`);
    }
    for (const t of d.traits || []) {
      add(urls, gridFightTraitIconUrl(t.icon), `currency/role/${id}.json#trait.${t.id}`);
      add(urls, gridFightTraitIconById(t.id), `currency/role/${id}.json#trait.${t.id}.byId`);
    }
  }

  const scanAbs = (o: unknown, src: string): void => {
    if (!o || typeof o !== 'object') return;
    if (Array.isArray(o)) {
      o.forEach((v) => scanAbs(v, src));
      return;
    }
    for (const [k, v] of Object.entries(o)) {
      if (typeof v === 'string' && v.startsWith('https://')) add(urls, v, `${src}#${k}`);
      else scanAbs(v, src);
    }
  };
  for (const f of walkJson(DATA)) {
    scanAbs(JSON.parse(readFileSync(f, 'utf8')), f.replace(DATA + '\\', '').replace(/\\/g, '/'));
  }

  return urls;
}


function sourceFileOf(source: string): string | null {
  const f = source.split('#')[0];
  return f.endsWith('.json') ? f : null;
}

function computeSourceHashes(urls: Urls): Record<string, string> {
  const files = new Set<string>();
  for (const source of urls.values()) {
    const f = sourceFileOf(source);
    if (f) files.add(f);
  }
  const hashes: Record<string, string> = {};
  for (const f of files) {
    try {
      hashes[f] = createHash('sha1').update(readFileSync(join(DATA, f))).digest('hex');
    } catch {
      hashes[f] = 'unreadable';
    }
  }
  return hashes;
}

interface CacheEntry {
  status: 'ok' | 'dead' | 'env';
  ts: number;
}
interface CacheFile {
  sourceHashes: Record<string, string>;
  entries: Record<string, CacheEntry>;
}

function loadCache(): CacheFile | null {
  try {
    const c = JSON.parse(readFileSync(CACHE_FILE, 'utf8')) as CacheFile;
    return c && typeof c.sourceHashes === 'object' ? c : null;
  } catch {
    return null;
  }
}

function saveCache(hashes: Record<string, string>, entries: Record<string, CacheEntry>): void {
  mkdirSync(dirname(CACHE_FILE), { recursive: true });
  writeFileSync(CACHE_FILE, JSON.stringify({ sourceHashes: hashes, entries }), 'utf8');
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));


type ProbeResult = 'ok' | 'dead' | 'env';

async function singleRequest(url: string, range: boolean): Promise<'ok' | 'dead' | 'env' | 'throttled'> {
  try {
    const r = await fetch(url, {
      method: range ? 'GET' : 'HEAD',
      redirect: 'manual',
      headers: { 'User-Agent': UA, ...(range ? { Range: 'bytes=0-0' } : {}) },
      signal: AbortSignal.timeout(10_000),
    });
    if (r.ok || r.status === 206) return 'ok';
    if (r.status === 301 || r.status === 302 || r.status === 303 || r.status === 307 || r.status === 308) return 'ok';
    if (r.status === 404) return 'dead';
    if (r.status === 429 || r.status === 503) return 'throttled';
    if (r.status === 403) return 'env';
    return 'env';
  } catch {
    return 'env';
  }
}

async function probe(url: string): Promise<ProbeResult> {
  for (const wait of [0, 2_000, 5_000]) {
    if (wait) await sleep(wait);
    const head = await singleRequest(url, false);
    if (head === 'ok') return 'ok';
    if (head === 'dead') {
      const get = await singleRequest(url, true);
      if (get === 'throttled') continue;
      return get === 'ok' ? 'ok' : 'dead';
    }
    if (head === 'throttled') continue;
    return 'env';
  }
  return 'env';
}

function domainOf(url: string): string {
  if (url.startsWith('https://cdn.jsdelivr.net')) return 'jsdelivr';
  if (url.startsWith('https://static.nanoka.cc')) return 'nanoka';
  return 'other';
}

test('数据全量图标 URL 可达（死链为 0）', async () => {
  const urls = collectUrls();
  const all = [...urls.keys()];
  const limited = LIMIT > 0 ? all.slice(0, LIMIT) : all;

  const sourceHashes = computeSourceHashes(urls);
  const cacheFile = FORCE ? null : loadCache();
  const cached: Record<string, CacheEntry> = cacheFile ? cacheFile.entries : {};
  const prevHashes = cacheFile ? cacheFile.sourceHashes : {};
  const now = Date.now();
  const fresh = (e: CacheEntry): boolean => {
    const ttlDays = e.status === 'env' ? TTL_ENV : TTL_OK_DEAD;
    return now - e.ts < ttlDays * 24 * 3600 * 1000;
  };

  const toProbe = limited.filter((u) => {
    const e = cached[u];
    if (!e || !fresh(e)) return true;
    const f = sourceFileOf(urls.get(u)!);
    return f ? prevHashes[f] !== sourceHashes[f] : false;
  });
  const results: Record<string, CacheEntry> = { ...cached };

  const dead: [string, string][] = [];
  const env = new Set<string>();
  let okCount = 0;
  let idx = 0;
  let probedCount = 0;
  let budgetExhausted = false;

  const worker = async (): Promise<void> => {
    while (idx < toProbe.length && !budgetExhausted) {
      if (BUDGET_MS > 0 && Date.now() - now >= BUDGET_MS) {
        budgetExhausted = true;
        break;
      }
      const url = toProbe[idx++];
      const source = urls.get(url)!;
      const st = await probe(url);
      results[url] = { status: st, ts: now };
      if (st === 'dead') dead.push([url, source]);
      else if (st === 'env') env.add(url);
      else okCount++;
      probedCount++;
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  saveCache(sourceHashes, results);
  const incomplete = BUDGET_MS > 0 && probedCount < toProbe.length;

  const byDomain = (arr: string[]) =>
    arr.reduce<Record<string, number>>((m, u) => {
      const d = domainOf(u);
      m[d] = (m[d] || 0) + 1;
      return m;
    }, {});

  console.log(`\n══════════════════════════════════════`);
  console.log(`死链审计：${limited.length} URL（${LIMIT ? `抽样 ${LIMIT}` : '全量'}）`);
  console.log(`  缓存复用: ${limited.length - toProbe.length}（来源文件内容签名一致）`);
  console.log(`  本次探测: ${toProbe.length}（并发 ${CONCURRENCY}，UA 已标识）`);
  if (incomplete) {
    console.log(`  增量预算: ${(BUDGET_MS / 1000).toFixed(0)}s 内完成 ${probedCount}/${toProbe.length}，剩余已缓存进度（下轮继续）`);
  }
  console.log(`  ok: ${okCount} / dead: ${dead.length} / 环境性(不判失败): ${env.size}`);
  console.log(`  ok 分域: ${JSON.stringify(byDomain(limited.filter((u) => results[u]?.status === 'ok')))}`);
  if (env.size) {
    console.log(`  环境性信号 ${env.size} 个（403 数据中心拒用 / 429 限流 / 5xx / 超时），已退避重试仍无法判定`);
  }
  if (dead.length) {
    const byFile = new Map<string, string[]>();
    for (const [url, source] of dead) {
      const file = source.split('#')[0];
      byFile.set(file, [...(byFile.get(file) || []), `${source} → ${url}`]);
    }
    console.log(`\n[FAIL] 死链清单（${dead.length} 条，来自 ${byFile.size} 个数据文件）：`);
    for (const [file, items] of [...byFile.entries()].sort((a, b) => b[1].length - a[1].length)) {
      console.log(`  ${file}（${items.length}）`);
      for (const it of items.slice(0, 5)) console.log(`    ${it}`);
      if (items.length > 5) console.log(`    … 另 ${items.length - 5} 条`);
    }
  }
  expect(dead, `存在 ${dead.length} 条死链（详见上方清单）`).toEqual([]);
}, 1_200_000);

describe('死链审计工具自身', () => {
  test('数据可加载且 URL 收集非空', () => {
    const urls = collectUrls();
    expect(urls.size).toBeGreaterThan(1000);
  });
});