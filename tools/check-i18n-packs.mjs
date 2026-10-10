#!/usr/bin/env node
/**
 * 语言包覆盖守卫：node tools/check-i18n-packs.mjs
 *
 * 不变量（[ADR 0052](../docs/adr/0052-多语言站点架构-路径前缀与语言包.md) 决策 2）：
 * **结构层里出现过的令牌 = 必须被语言包覆盖的键**，与令牌来源无关（`endgame_catalog` 从已令牌化的
 * `maze*.json` 派生 catalog，拿到的是普通字符串令牌）。判据三条：
 *   1. 任一结构文件含令牌 ⇒ 其分组在**每一种声明语言**下都要有包
 *   2. 该包的键集必须覆盖该分组用到的全部键（缺键会让前端解析抛 NkError）
 *   3. 结构层未令牌化（无任何令牌）时本守卫恒过——迁移期与「语言无关数据」不误报
 *
 * 分组规则与 `tools/converter/textpack.py: group_of`、`src/lib/i18n/pack-path.ts` 同一份语义：
 * 相对路径首段目录（顶层文件取文件名去 `.json`）。三处各一份实现是刻意的——本守卫校验的是
 * **产物事实**（包是否存在、是否覆盖），任一实现漂移都会在这里或前端运行期立刻暴露。
 *
 * 退出码：违反 1；全绿 0。`public/data/i18n` 未生成而结构层已令牌化时报缺失（这是真缺陷）。
 */

import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const STRUCT_DIR = join(ROOT, 'public', 'data', 'cn');
const PACK_DIR = join(ROOT, 'public', 'data', 'i18n');
const REGISTRY = join(ROOT, 'tools', 'converter', 'languages.json');

const TOKEN_PREFIX = '$t:';

/** 相对路径 → 分组名（与转换器 / 前端同规则）。 */
function groupOf(rel) {
  const slash = rel.indexOf('/');
  if (slash >= 0) return rel.slice(0, slash);
  return rel.endsWith('.json') ? rel.slice(0, -5) : rel;
}

/** 递归收集结构里的令牌键（命中即计数，用于覆盖判定）。 */
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

/** 分组 → 该分组用到的键集合 */
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

/* 占位符必须按语言展开：`{NICKNAME}` 的取值分语言（Trailblazer / 開拓者 / 개척자 / Первопроходец…），
   清洗路径漏传语言表时会把它写成中文「开拓者」——9 种语言包曾因此出现 568 处中文（见
   docs/memory/data-pipeline.md）。此处只钉这一条：非中文语言包里不得出现中文「开拓者」。 */
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

/* 借值分组：`skill_animations` 的标题令牌值取自 `characters`（同一批官方词条，
   由抓取脚本拷贝）。两份必须逐键一致——否则转换器重跑只更新 `characters`，
   界面上的动画小标题会静默停在旧译文。 */
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

/* 汉字棘轮：非汉字语言包里「含汉字的条目数」不得回涨。
   本仓已修过两轮同类泄漏（`{NICKNAME}` 写成中文「开拓者」568 处、货币战争属性名 2000+ 处），
   两次都是**新写入的写死中文 / 缺词条回退中文**，而原有守卫只看「键是否存在」。
   kr 的基线偏高是合法的：官方韩文本身用汉字注音（`세검(細劍)`）。
   有意增补（如官方新文案）时跑 `--write-baseline` 并说明原因；**只允许下调**。 */
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
