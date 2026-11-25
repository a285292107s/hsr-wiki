#!/usr/bin/env node
/**
 * 图标覆盖度门禁（ADR 0070 第 2 步）。
 *
 * 背景：`check-image-loading.mjs` 只保证「代码里不裸写 <img src>」，不保证「src 指向的文件真的存在」。
 * 结果是一批引用从来没人导出过（2026-11 实测站点侧 423 张、解包侧 16,872 张），构建全绿。
 *
 * 本工具按 `config/sprite-map.json` 的同一套路由（与 tools/ingest-icons.py、src/services/cdn/sprite-map.ts 共读）
 * 重算「引用集 → 应落盘路径」，与 `public/data/assets/icons/**` 实际文件比对。
 *
 * 判据采用**基线制**（因为 CI 上没有本机解包盘，无法现算「有没有源图」）：
 *   - 缺口 = 引用了、但导出目录里没有，且不属于以下豁免：
 *       · 分类标记 `cdnBacked`（设计上走 CDN：uiart / rank / element / pathicon）
 *       · 分类/文件列入 `ignoreLocal`（官方目录本就没有）
 *       · 命中 `knownDeadRefs`（ADR 0057 §7 既有死链）
 *       · 同叶名已在别的分类导出（可借）
 *   - 已知缺口全部记在 `config/icon-coverage-baseline.json`；**新增**缺口 → 失败。
 *     缺口减少时提示刷新基线（不失败）。
 *
 * 用法：
 *   node tools/check-icon-coverage.mjs                 # report-only
 *   node tools/check-icon-coverage.mjs --strict        # 有新增缺口即退出 1（pnpm build 用）
 *   node tools/check-icon-coverage.mjs --write-baseline # 用当前缺口重写基线（补出一批图后执行）
 *   node tools/check-icon-coverage.mjs --scope excel   # 换用解包 ExcelOutput 全量引用
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const ICONS_ROOT = join(ROOT, 'public/data/assets/icons');
const SITE_DATA = join(ROOT, 'public/data');
const EXCEL_DATA = join(ROOT, 'vendor/TurnBasedGameData/ExcelOutput');
const MAP_FILE = join(ROOT, 'config/sprite-map.json');
const BASELINE_FILE = join(ROOT, 'config/icon-coverage-baseline.json');

// 仅用于「本机细分 missing / unsourced」的增强报告，缺失时不影响判定
const TEXTURES_ROOTS = [process.env.HSR_TEXTURES_ROOT, 'C:/Users/28529/Desktop/StarRailTextures'].filter(Boolean);

const REF_RE = /"SpriteOutput\/([^"]+)"/g;
const PROFESSION_MAP = { priest: 'Pirest', elation: 'Joy' };
const PROFESSION_MAP_REV = Object.fromEntries(Object.entries(PROFESSION_MAP).map(([k, v]) => [v, k]));

const argv = process.argv.slice(2);
const strict = argv.includes('--strict');
const writeBaseline = argv.includes('--write-baseline');
const scope = argv.includes('--scope') && argv[argv.indexOf('--scope') + 1] === 'excel' ? 'excel' : 'site';

const spriteMap = JSON.parse(readFileSync(MAP_FILE, 'utf8'));

// ---------------------------------------------------------------- 索引

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

function buildExportIndex() {
  const out = new Map();
  if (!existsSync(ICONS_ROOT)) return out;
  for (const cat of readdirSync(ICONS_ROOT)) {
    const cdir = join(ICONS_ROOT, cat);
    if (!statSync(cdir).isDirectory()) continue;
    const set = new Set();
    for (const f of walk(cdir)) set.add(relative(cdir, f).split(sep).join('/').replace(/\.[^.]+$/, ''));
    out.set(cat, set);
  }
  return out;
}

function resolveSourceRoot() {
  for (const base of TEXTURES_ROOTS) {
    for (const rel of spriteMap.sourceRootCandidates) {
      const cand = join(base, rel);
      if (existsSync(cand)) return cand;
    }
  }
  return null;
}

function buildDiskIndex(srcRoot) {
  const idx = new Map();
  if (!srcRoot) return idx;
  for (const f of walk(srcRoot)) idx.set(relative(srcRoot, f).split(sep).join('/').toLowerCase(), true);
  return idx;
}

function buildLeafIndex(srcRoot, prefix) {
  const idx = new Set();
  if (!srcRoot) return idx;
  const base = prefix ? join(srcRoot, prefix) : srcRoot;
  if (!existsSync(base)) return idx;
  for (const f of walk(base)) idx.add(f.slice(f.lastIndexOf(sep) + 1).replace(/\.[^.]+$/, '').toLowerCase());
  return idx;
}

// ---------------------------------------------------------------- 路由

function matchRoute(route, segsLower) {
  if (segsLower[0] !== route.first) return false;
  if (!route.sub) return true;
  return segsLower.slice(1, 1 + route.sub.split('/').length).join('/') === route.sub.toLowerCase();
}

function localRel(route, segs, leaf) {
  const mode = route.local || 'leaf';
  switch (mode) {
    case 'leaf': return leaf;
    case 'leafLower': return leaf.toLowerCase();
    case 'afterFirst': return segs.slice(1).join('/');
    case 'afterFirstLower': return [...segs.slice(1, -1).map((s) => s.toLowerCase()), leaf].join('/');
    case 'afterSub': return segs.slice(1 + route.sub.split('/').length).join('/');
    case 'fullExact': return segs.join('/');
    case 'lowerDirs': return [...segs.slice(0, -1).map((s) => s.toLowerCase()), leaf].join('/');
    case 'element': {
      const k = leaf.replace(/^IconDamageType/, '');
      return k.charAt(0).toLowerCase() + k.slice(1);
    }
    case 'pathicon': {
      const k = leaf.replace(/^IconProfession/, '').replace(/Middle$/, '');
      return (PROFESSION_MAP_REV[k] || k).toLowerCase();
    }
    default: return leaf;
  }
}

function spriteRelForLocal(route, category, localR) {
  const mode = route.local || 'leaf';
  switch (mode) {
    case 'leaf':
    case 'leafLower': {
      // leaf 模式必须优先用「路由命中的 sub」，否则同分类下多个 sub 只有第一个能定位
      if (route.sub) return `${route.first}/${route.sub}/${localR}`;
      const srcDir = spriteMap.categories[category]?.sourceDir || '';
      return srcDir ? `${srcDir}/${localR}` : localR;
    }
    case 'afterFirst':
    case 'afterFirstLower': return `${route.first}/${localR}`;
    case 'afterSub': return `${route.first}/${route.sub}/${localR}`;
    case 'fullExact':
    case 'lowerDirs': return localR;
    case 'element': return `icondamagetype/IconDamageType${localR.charAt(0).toUpperCase()}${localR.slice(1).toLowerCase()}`;
    case 'pathicon': {
      const mapped = PROFESSION_MAP[localR.toLowerCase()] || localR.charAt(0).toUpperCase() + localR.slice(1);
      return `professioniconmiddle/IconProfession${mapped}Middle`;
    }
    default: return localR;
  }
}

function routeRef(segs) {
  const segsLower = segs.map((s) => s.toLowerCase());
  const leaf = segs[segs.length - 1];
  for (const route of spriteMap.routes) {
    if (!matchRoute(route, segsLower)) continue;
    return (route.categories || [route.category]).map((c) => [c, localRel(route, segs, leaf)]);
  }
  const fb = spriteMap.fallback;
  return [[fb.category, localRel(fb, segs, leaf)]];
}

// ---------------------------------------------------------------- 扫描

function scanRefs() {
  const root = scope === 'excel' ? EXCEL_DATA : SITE_DATA;
  const seen = new Set();
  const out = [];
  for (const f of walk(root)) {
    if (extname(f) !== '.json') continue;
    let text;
    try { text = readFileSync(f, 'utf8'); } catch { continue; }
    REF_RE.lastIndex = 0;
    let m;
    while ((m = REF_RE.exec(text)) !== null) {
      const segs = m[1].split('/');
      if (segs.length < 2) continue;
      segs[segs.length - 1] = segs[segs.length - 1].replace(/\.[^.]+$/, '');
      const key = segs.join('/').toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(segs);
    }
  }
  return out;
}

// ---------------------------------------------------------------- 主逻辑

function main() {
  const exported = buildExportIndex();
  const srcRoot = resolveSourceRoot();
  const disk = buildDiskIndex(srcRoot);
  const leafIdx = new Map();
  for (const [cat, spec] of Object.entries(spriteMap.categories)) {
    if (spec.sourceDir && cat === 'skillicons') leafIdx.set(cat, buildLeafIndex(srcRoot, spec.sourceDir));
  }
  const dead = spriteMap.knownDeadRefs.patterns.map((p) => new RegExp(p));

  const globalStems = new Set();
  for (const set of exported.values()) for (const rel of set) globalStems.add(rel.slice(rel.lastIndexOf('/') + 1).toLowerCase());

  const gaps = [];
  const cdnBacked = [];
  const usedCats = new Map();

  for (const segs of scanRefs()) {
    for (const [cat, lr] of routeRef(segs)) {
      const spec = spriteMap.categories[cat] || {};
      if (exported.get(cat)?.has(lr)) {
        if (!usedCats.has(cat)) usedCats.set(cat, new Set());
        usedCats.get(cat).add(lr);
        break;
      }
      if ((spec.ignoreLocal || []).includes(lr)) break;
      if (dead.some((r) => r.test(`${cat}/${lr}`))) break;
      if (spec.cdnBacked) { cdnBacked.push({ cat, lr }); break; }
      if (globalStems.has(lr.slice(lr.lastIndexOf('/') + 1).toLowerCase())) break;
      gaps.push({ cat, lr });
      break;
    }
  }

  const key = (g) => `${g.cat}/${g.lr}`;
  const gapKeys = new Set(gaps.map(key));
  const baseline = existsSync(BASELINE_FILE)
    ? JSON.parse(readFileSync(BASELINE_FILE, 'utf8'))
    : { scope, gaps: [] };
  const baselineKeys = new Set((baseline.gaps || []).map((g) => (typeof g === 'string' ? g : `${g.cat}/${g.lr}`)));

  const added = [...gapKeys].filter((k) => !baselineKeys.has(k)).sort();
  const removed = [...baselineKeys].filter((k) => !gapKeys.has(k)).sort();

  const group = (arr) => {
    const m = new Map();
    for (const x of arr) m.set(x.cat, (m.get(x.cat) || 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };

  // 本机细分（可选增强）
  const missingNow = [];
  const unsourcedNow = [];
  if (srcRoot) {
    for (const g of gaps) {
      const cat = g.cat;
      let actual = null;
      if (leafIdx.has(cat)) actual = leafIdx.get(cat).has(g.lr.slice(g.lr.lastIndexOf('/') + 1).toLowerCase());
      else {
        const route = spriteMap.routes.find((r) => (r.categories || [r.category]).includes(cat));
        const srel = route ? spriteRelForLocal(route, cat, g.lr) : g.lr;
        actual = disk.has(`${srel}.png`.toLowerCase());
      }
      (actual ? missingNow : unsourcedNow).push(g);
    }
  }

  console.log(`[icon-coverage] scope=${scope}${srcRoot ? '' : '（无解包盘：只比导出集，走基线制）'}`);
  console.log(`  当前缺口（引用但未导出、且非豁免）= ${gaps.length}`);
  for (const [c, n] of group(gaps)) console.log(`      ${c.padEnd(24)} ${n}`);
  if (srcRoot) {
    console.log(`      其中「有源可补」= ${missingNow.length}、「上游也无源」= ${unsourcedNow.length}`);
  }
  console.log(`  cdnBacked（设计走 CDN，不计缺）= ${cdnBacked.length}`);
  for (const [c, n] of group(cdnBacked)) console.log(`      ${c.padEnd(24)} ${n}`);
  console.log(`  基线内已知缺口 = ${baselineKeys.size}；新增 = ${added.length}；已消失 = ${removed.length}`);

  if (writeBaseline) {
    const payload = {
      scope,
      note: 'ADR 0070 图标覆盖度基线。新增缺口会让 pnpm build 失败；补图后用 --write-baseline 刷新。',
      generatedAt: new Date().toISOString(),
      gaps: [...gapKeys].sort().map((k) => ({ cat: k.split('/')[0], lr: k.slice(k.indexOf('/') + 1) })),
    };
    writeFileSync(BASELINE_FILE, JSON.stringify(payload, null, 2) + '\n', 'utf8');
    console.log(`\n[icon-coverage] 基线已写入 ${relative(ROOT, BASELINE_FILE)}（${gapKeys.size} 条）`);
    process.exit(0);
  }

  if (added.length) {
    console.log(`\n[icon-coverage] ${strict ? 'FAIL' : 'WARN'}: ${added.length} 个**新增**缺口（基线之外）：`);
    for (const k of added.slice(0, 20)) console.log(`      + ${k}`);
    if (added.length > 20) console.log(`      … 另 ${added.length - 20} 条`);
    console.log('  修复：python tools/ingest-icons.py --from-refs   或把这些登记进 ignoreLocal / knownDeadRefs');
    if (strict) process.exit(1);
  }
  if (removed.length) {
    console.log(`\n[icon-coverage] 提示：${removed.length} 条基线缺口已消失（补图了？），可运行 --write-baseline 刷新。`);
  }
  if (!added.length) console.log('\n[icon-coverage] PASS: 无新增缺口。');
  process.exit(0);
}

main();
