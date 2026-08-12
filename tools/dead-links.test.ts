/**
 * 死链低频审计（数据变更时触发；CI 由 data-sync.yml 挂接）
 *
 * 背景（2026-08-12 重构决策，替代 e2e 渲染态死链检查）：
 * - 死链是静态事实（URL 404），每次 e2e 验证低性价比 → 改为数据驱动 + HTTP 探测
 * - URL 构造复用前端真实构造函数（src/lib/icons.ts / services/cdn），零维护漂移
 * - 死链判定：明确 HTTP 404（HEAD + Range GET 双重确认）才 FAIL；其余环境性信号仅 WARN
 *
 * jsDelivr 正确使用（2026-08-12 联网核实 + 实测）：
 * - AUP：本项目为图标包类资源（官方明确 icons packs 不算滥用），合规
 * - 404 响应带 `Cache-Control: no-cache, no-store` —— jsDelivr 不缓存 404，每次探测
 *   都会回源 GitHub 验证 → 已知死链必须本地缓存，禁止反复探测制造无效回源流量
 * - 首次探测可能触发回源（冷文件无缓存），HEAD 请求无 body 是最低开销方式（已实测支持）
 * - jsDelivr 对突发高并发敏感（429；2026-08-11 实证 301 图 burst 限流）→ 并发压低 + 退避重试
 * - API 文档建议 User-Agent 标识工具 → 审计请求携带回源可追溯的 UA
 * - 403 多为数据中心 IP 拒用（CI 历史教训），退避重试一次后判 env 不失败
 *
 * 缓存策略：
 * - 失效依据 = URL 来源文件的**内容 sha1**（converter 输出确定性：全量重写但内容未变 → hash 未变 → 零网络复用）；
 *   只有上游数据真正变化（内容变）的模块才重测对应 URL
 * - ok / dead 缓存 7 天；env（环境性）缓存 1 天
 * - 缓存文件 temp/dead-links-cache.json（temp/ 已 gitignore；CI 经 actions/cache 跨 job 持久化）
 *
 * 用法：
 *   pnpm vitest run --config tools/dead-links.vitest.config.ts   # 增量（默认）
 *   DEAD_LINKS_FORCE=1 pnpm ...                                  # 强制全量重测
 *   DEAD_LINKS_LIMIT=50 pnpm ...                                 # 抽样调试
 */
import { describe, expect, test } from 'vitest';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
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

/** jsDelivr 对 burst 敏感（实证），并发压到 3；nanoka 同样保守 */
const CONCURRENCY = 3;
/** ok/dead 缓存时长（天）；env 环境性信号短缓存 */
const TTL_OK_DEAD = 7;
const TTL_ENV = 1;
/** 标识工具（jsDelivr API 文档建议），回源可追溯 */
const UA = 'hsr-wiki-dead-link-audit/1.0 (+https://github.com/a285292107s/hsr-wiki)';

/** 递归读取目录下全部 JSON 文件 */
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

/** url → 来源标签（数据文件 + 字段），用于死链报告追溯 */
type Urls = Map<string, string>;

function add(map: Urls, url: string | undefined | null, source: string): void {
  if (url && !map.has(url)) map.set(url, source);
}

/** 收集数据中全部渲染 URL（调用点与 src/app 各视图/目录页一致，2026-08-12 核对） */
function collectUrls(): Urls {
  const urls: Urls = new Map();

  // ─── 角色：目录卡片（头像/属性/命途）+ 首页立绘 + 详情 hero ───
  for (const c of load('characters.json')) {
    add(urls, avatarShopIconUrl(c.id), `characters.json#${c.id}.avatar`);
    add(urls, avatarDrawCardUrl(c.id), `characters.json#${c.id}.drawcard`);
    add(urls, elementIconUrl(c.element), `characters.json#${c.id}.element`);
    add(urls, pathIconUrl(c.path), `characters.json#${c.id}.path`);
  }
  // 角色详情：技能图标（skillIconUrl 内部优先 sk.icon）+ 星魂 + 附加能力
  for (const d of loadDir('characters')) {
    const id = String(d.id);
    for (const sk of Object.values(d.skills || {})) {
      add(urls, skillIconUrl(sk as never, id, d), `characters/${id}.json#skill.${(sk as { type: string }).type}`);
    }
    // ranks 为对象（key '1'-'6'）；星魂展示图标 eidolonIconUrl + buff 栏 IconPath 图标
    for (const [rkKey, rk] of Object.entries((d.ranks as Record<string, { icon: string }>) || {})) {
      add(urls, eidolonIconUrl(id, rkKey), `characters/${id}.json#rank${rkKey}`);
      add(urls, iconUrl(rk.icon), `characters/${id}.json#rank${rkKey}.icon`);
    }
    for (const ab of Object.values(d.extra?.abilities || {})) {
      add(urls, iconUrl((ab as { icon: string }).icon), `characters/${id}.json#ability.${(ab as { name: string }).name}`);
    }
  }

  // ─── 光锥：目录 + 详情 ───
  for (const lc of load('light_cones.json')) {
    add(urls, lightconeIconUrl(lc.id), `light_cones.json#${lc.id}`);
    add(urls, pathIconUrl(lc.path), `light_cones.json#${lc.id}.path`);
  }

  // ─── 怪物：目录头像 + 详情立绘 ───
  for (const m of load('monsters.json')) {
    add(urls, monsterIconUrl(m.icon), `monsters.json#${m.id}.icon`);
  }
  for (const d of loadDir('monsters')) {
    add(urls, monsterFigureUrl(d.figure), `monsters/${d.id}.json#figure`);
    add(urls, monsterIconUrl(d.icon), `monsters/${d.id}.json#icon`);
  }

  // ─── 物品：目录 + 终局奖励 ───
  for (const it of load('items.json')) {
    add(urls, itemIconUrl(it.figure_icon), `items.json#${it.id}.figure_icon`);
    add(urls, itemIconUrl(it.icon), `items.json#${it.id}.icon`);
  }
  for (const mz of ['maze.json', 'maze_boss.json', 'maze_extra.json', 'maze_peak.json']) {
    for (const d of Object.values(load(mz))) {
      add(urls, itemIconUrl(d.icon), `${mz}#${d.id}.icon`);
    }
  }

  // ─── 遗器：目录 + 详情（部位图标按 SLOT_INDEX 全量枚举） ───
  for (const r of load('relics.json')) {
    add(urls, itemIconUrl(r.icon), `relics.json#${r.id}.icon`);
    add(urls, itemIconUrl(r.icon_figure), `relics.json#${r.id}.icon_figure`);
    for (const slot of Object.keys(SLOT_ICONS)) {
      add(urls, cdnUri('relicfigures', `IconRelic_${r.id}_${SLOT_INDEX[slot] ?? 1}.webp`), `relics.json#${r.id}.${slot}`);
    }
  }

  // ─── 货币战争：装备 / 强化 / 传送门 / 羁绊 / 角色详情 ───
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
    // rank 为数组（IconPath 完整路径）；equipment / traits 为数组（equipment_id / id 主键）
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

  // ─── 全数据 https 绝对 URL（皮肤图等，mihoyo act-upload） ───
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

/* ─── URL 来源文件内容签名 + 结果缓存（核心：内容未变零网络，只有真变才重测） ─── */

/** source 标签（`file#field`）→ 数据文件相对路径；非 JSON 来源（无）返回 null */
function sourceFileOf(source: string): string | null {
  const f = source.split('#')[0];
  return f.endsWith('.json') ? f : null;
}

/** 计算 URL 引用的全部来源文件的内容 sha1（converter 输出确定性：内容未变则签名未变） */
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
    // 旧格式（目录指纹）无 sourceHashes → 视为无效，冷启动全量一次后写新格式
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

/* ─── 探测：HEAD 优先（无 body），404 用 Range GET 确认（1 字节），429/403/503 退避重试 ─── */

type ProbeResult = 'ok' | 'dead' | 'env';

async function singleRequest(url: string, range: boolean): Promise<'ok' | 'dead' | 'env' | 'throttled'> {
  try {
    const r = await fetch(url, {
      method: range ? 'GET' : 'HEAD',
      // jsDelivr 冷文件未缓存时 302 回源 GitHub raw：不跟随（本机/CI 直连 raw 超时，实测），
      // 重定向本身即“文件存在”信号
      redirect: 'manual',
      headers: { 'User-Agent': UA, ...(range ? { Range: 'bytes=0-0' } : {}) },
      signal: AbortSignal.timeout(10_000),
    });
    if (r.ok || r.status === 206) return 'ok';
    if (r.status === 301 || r.status === 302 || r.status === 303 || r.status === 307 || r.status === 308) return 'ok';
    if (r.status === 404) return 'dead';
    if (r.status === 429 || r.status === 503) return 'throttled';
    // 403 数据中心 IP 拒用是持续信号（2026-08-11 实证），退避重试无意义 → 直接判 env
    if (r.status === 403) return 'env';
    return 'env'; // 其余 4xx/5xx 视为环境性
  } catch {
    return 'env';
  }
}

/** 429/403/503 退避重试（尊重 Retry-After 未实现简化：等 2s/5s），仍失败判 env */
async function probe(url: string): Promise<ProbeResult> {
  for (const wait of [0, 2_000, 5_000]) {
    if (wait) await sleep(wait);
    const head = await singleRequest(url, false);
    if (head === 'ok') return 'ok';
    if (head === 'dead') {
      // HEAD 404 → Range GET 二次确认（206/200 = 文件存在；404 = 真死链）
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

// 全量审计为网络 IO（数千 URL × 并发 3），默认 5s 超时远不够，第三参数显式放宽到 20 分钟
test('数据全量图标 URL 可达（死链为 0）', async () => {
  const urls = collectUrls();
  const all = [...urls.keys()];
  const limited = LIMIT > 0 ? all.slice(0, LIMIT) : all;

  // 缓存：URL 来源文件内容签名一致 → 复用既有结果（零网络）；签名变化或 FORCE → 重测
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
    // 来源文件内容签名变化 → 该 URL 重测（converter 确定性重写但内容未变 → 签名一致 → 复用）
    const f = sourceFileOf(urls.get(u)!);
    return f ? prevHashes[f] !== sourceHashes[f] : false;
  });
  const results: Record<string, CacheEntry> = { ...cached };

  const dead: [string, string][] = [];
  const env = new Set<string>();
  let okCount = 0;
  let idx = 0;

  const worker = async (): Promise<void> => {
    while (idx < toProbe.length) {
      const url = toProbe[idx++];
      const source = urls.get(url)!;
      const st = await probe(url);
      results[url] = { status: st, ts: now };
      if (st === 'dead') dead.push([url, source]);
      else if (st === 'env') env.add(url);
      else okCount++;
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  // 落盘缓存（抽样模式也写：支持 LIMIT 分块推进全量，避免单次超时）
  saveCache(sourceHashes, results);

  // 分域统计
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
  console.log(`  ok: ${okCount} / dead: ${dead.length} / 环境性(不判失败): ${env.size}`);
  console.log(`  ok 分域: ${JSON.stringify(byDomain(limited.filter((u) => results[u]?.status === 'ok')))}`);
  if (env.size) {
    console.log(`  环境性信号 ${env.size} 个（403 数据中心拒用 / 429 限流 / 5xx / 超时），已退避重试仍无法判定`);
  }
  if (dead.length) {
    // 死链按来源文件分组，便于定位 converter 图标映射问题
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