#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const STRUCT_DIR = join(ROOT, 'public', 'data', 'cn');
const PACK_DIR = join(ROOT, 'public', 'data', 'i18n');
const REGISTRY = join(ROOT, 'tools', 'converter', 'languages.json');

const TOKEN_PREFIX = '$t:';

function groupOf(rel) {
  const slash = rel.indexOf('/');
  if (slash >= 0) return rel.slice(0, slash);
  return rel.endsWith('.json') ? rel.slice(0, -5) : rel;
}

function collectKeys(value, sink) {
  if (typeof value === 'string') {
    if (value.startsWith(TOKEN_PREFIX)) sink.add(value.slice(TOKEN_PREFIX.length));
    return;
  }
  if (Array.isArray(value)) {
    for (const v of value) collectKeys(v, sink);
    return;
  }
  if (value && typeof value === 'object') {
    for (const v of Object.values(value)) collectKeys(v, sink);
  }
}

function walkJson(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walkJson(p, out);
    else if (name.endsWith('.json')) out.push(p);
  }
  return out;
}

if (!existsSync(REGISTRY)) {
  console.error(`[FAIL] 缺少语言清单 ${REGISTRY}`);
  process.exit(1);
}
const languages = JSON.parse(readFileSync(REGISTRY, 'utf8')).languages.map((l) => l.code);
if (languages.length === 0) {
  console.error('[FAIL] 语言清单为空，无法校验语言包覆盖');
  process.exit(1);
}

if (!existsSync(STRUCT_DIR)) {
  console.error('[FAIL] 结构层目录不存在：public/data/cn（由 tools/converter 生成）');
  process.exit(1);
}

const byGroup = new Map();
let tokenFiles = 0;
let plainFiles = 0;

for (const file of walkJson(STRUCT_DIR)) {
  const rel = file.slice(STRUCT_DIR.length + 1).split('\\').join('/');
  const keys = new Set();
  collectKeys(JSON.parse(readFileSync(file, 'utf8')), keys);
  if (keys.size === 0) {
    plainFiles++;
    continue;
  }
  tokenFiles++;
  const g = groupOf(rel);
  const acc = byGroup.get(g) ?? new Set();
  for (const k of keys) acc.add(k);
  byGroup.set(g, acc);
}

if (tokenFiles === 0) {
  console.log(`[PASS] 结构层未令牌化（${plainFiles} 个 JSON 无令牌），语言包覆盖检查为空操作`);
  process.exit(0);
}

const problems = [];
for (const [g, keys] of [...byGroup].sort()) {
  for (const lang of languages) {
    const packFile = join(PACK_DIR, lang, `${g}.json`);
    if (!existsSync(packFile)) {
      problems.push(`缺语言包 ${posix.join(lang, `${g}.json`)}（分组 ${g} 有 ${keys.size} 个令牌键）`);
      continue;
    }
    const pack = JSON.parse(readFileSync(packFile, 'utf8'));
    const missing = [...keys].filter((k) => pack[k] === undefined);
    if (missing.length > 0) {
      problems.push(`${lang}/${g}.json 缺 ${missing.length} 键（例：${missing.slice(0, 3).join(', ')}）`);
    }
  }
}

const NICKS = ['开拓者'];
const HAN_LANGS = new Set(['cn', 'cht']);
  for (const lang of languages) {
    if (HAN_LANGS.has(lang)) continue;
    for (const g of [...byGroup.keys()].sort()) {
      const packFile = join(PACK_DIR, lang, `${g}.json`);
      if (!existsSync(packFile)) continue;
      const pack = JSON.parse(readFileSync(packFile, 'utf8'));
      const hit = Object.entries(pack).filter(([, v]) => typeof v === 'string' && NICKS.some((n) => v.includes(n)));
      if (hit.length > 0) {
        problems.push(
          `${lang}/${g}.json 有 ${hit.length} 条含中文「${NICKS[0]}」（占位符未按语言展开，例：${hit[0][0]}）`,
        );
      }
    }
}

const BORROWED = { skill_animations: 'characters' };
for (const [g, src] of Object.entries(BORROWED)) {
  for (const lang of languages) {
    const a = join(PACK_DIR, lang, `${g}.json`);
    const b = join(PACK_DIR, lang, `${src}.json`);
    if (!existsSync(a) || !existsSync(b)) continue;
    const pa = JSON.parse(readFileSync(a, 'utf8'));
    const pb = JSON.parse(readFileSync(b, 'utf8'));
    const drift = Object.keys(pa).filter((k) => pb[k] !== undefined && pa[k] !== pb[k]);
    if (drift.length > 0) {
      problems.push(
        `${lang}/${g}.json 与 ${src} 分组有 ${drift.length} 键值不一致（借值未随源更新，例：${drift[0]}）`,
      );
    }
  }
}

const HAN_RE = /[\u4e00-\u9fff]/;
const HAN_SCAN_LANGS = ['en', 'es', 'fr', 'de', 'pt', 'ru', 'kr', 'th', 'vi', 'id'];
const BASELINE_FILE = join(ROOT, 'tools', 'i18n-han-baseline.json');
const counts = {};
for (const lang of HAN_SCAN_LANGS) {
  let n = 0;
  for (const f of readdirSync(join(PACK_DIR, lang)).filter((x) => x.endsWith('.json'))) {
    const pack = JSON.parse(readFileSync(join(PACK_DIR, lang, f), 'utf8'));
    for (const v of Object.values(pack)) if (typeof v === 'string' && HAN_RE.test(v)) n += 1;
  }
  counts[lang] = n;
}
if (process.argv.includes('--write-baseline')) {
  writeFileSync(BASELINE_FILE, JSON.stringify(counts, null, 2) + '\n', 'utf8');
  console.log(`[OK] 汉字棘轮基线已更新：${JSON.stringify(counts)}`);
} else if (existsSync(BASELINE_FILE)) {
  const base = JSON.parse(readFileSync(BASELINE_FILE, 'utf8'));
  const worse = [];
  const better = [];
  for (const lang of HAN_SCAN_LANGS) {
    const b = base[lang] ?? counts[lang];
    if (counts[lang] > b) worse.push(`${lang}: ${b} → ${counts[lang]}`);
    else if (counts[lang] < b) better.push(`${lang}: ${b} → ${counts[lang]}`);
  }
  if (worse.length) {
    problems.push(`非汉字语言包含汉字条目数回涨（${worse.join('，')}）——新写入的写死中文或缺词条回退中文`);
  }
  if (better.length) {
    console.log(`  （可收紧基线：${better.join('，')}）`);
  }
}

if (problems.length > 0) {
  console.error(`\n[FAIL] 语言包覆盖不变量被破坏，共 ${problems.length} 处：`);
  for (const p of problems.slice(0, 20)) console.error(`  - ${p}`);
  if (problems.length > 20) console.error(`  … 另有 ${problems.length - 20} 处`);
  process.exit(1);
}

console.log(
  `[PASS] 语言包覆盖完整（${tokenFiles} 个令牌文件 / ${byGroup.size} 个分组 / `
  + `${languages.length} 种语言，${plainFiles} 个无令牌文件已跳过）`,
);
