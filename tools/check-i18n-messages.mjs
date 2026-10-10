#!/usr/bin/env node
/**
 * UI 词典守卫：node tools/check-i18n-messages.mjs
 *
 * 四条判据（[ADR 0052](../docs/adr/0052-多语言站点架构-路径前缀与语言包.md) 决策 4）：
 *   1. `src/lib/i18n/messages/*.json` 的语言集合 == `tools/converter/languages.json` 声明集合（双向）
 *   2. 每份词典的键集与源语言 `cn` **逐键相等**（缺译会被 fallback 掩盖成中文，必须构建前拦下）
 *   3. 无空值；非中日韩语言不得出现汉字（抓「复制源语言忘了翻」这类静默泄漏）
 *   4. 代码里静态写出的 `t('…')` 键必须存在于 `cn`（抓拼写错误；动态键 `t(`a.${x}`)` 不在此列）
 *
 * 退出码：违反 1；全绿 0。
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const MSG_DIR = join(ROOT, 'src', 'lib', 'i18n', 'messages');
const REGISTRY = join(ROOT, 'tools', 'converter', 'languages.json');
const SRC_DIR = join(ROOT, 'src');

const SOURCE_LOCALE = 'cn';
/** 允许出现汉字的语言：源语言 + 繁体 + 日文（日文正文含汉字属正常） */
const HAN_ALLOWED = new Set(['cn', 'cht', 'jp']);
const HAN_RE = /[\u3400-\u4dbf\u4e00-\u9fff]/;

const problems = [];

/* ─── 1. 词典集合 == 语言清单 ─── */
if (!existsSync(REGISTRY)) {
  console.error(`[FAIL] 缺少语言清单 ${REGISTRY}`);
  process.exit(1);
}
const declared = JSON.parse(readFileSync(REGISTRY, 'utf8')).languages.map((l) => l.code);
const files = existsSync(MSG_DIR)
  ? readdirSync(MSG_DIR).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -'.json'.length))
  : [];
if (files.length === 0) problems.push(`未找到任何词典：${MSG_DIR}`);
for (const code of declared) {
  if (!files.includes(code)) problems.push(`语言 ${code} 缺词典 src/lib/i18n/messages/${code}.json`);
}
for (const code of files) {
  if (!declared.includes(code)) {
    problems.push(`词典 ${code}.json 不在语言清单里（改 languages.json 或删文件）`);
  }
}
if (!files.includes(SOURCE_LOCALE)) {
  console.error(`[FAIL] 缺源语言词典 ${SOURCE_LOCALE}.json`);
  process.exit(1);
}

/* ─── 2/3. 键集相等 + 空值 + 汉字泄漏 ─── */
const dicts = {};
for (const code of files) {
  try {
    dicts[code] = JSON.parse(readFileSync(join(MSG_DIR, `${code}.json`), 'utf8'));
  } catch (e) {
    problems.push(`词典 ${code}.json 解析失败：${e.message}`);
  }
}
const source = dicts[SOURCE_LOCALE] ?? {};
const sourceKeys = Object.keys(source).sort();
if (sourceKeys.length === 0) problems.push('源语言词典没有任何键');

for (const code of files) {
  const dict = dicts[code];
  if (!dict) continue;
  const keys = Object.keys(dict);
  const missing = sourceKeys.filter((k) => !(k in dict));
  const extra = keys.filter((k) => !(k in source));
  if (missing.length > 0) problems.push(`${code}.json 缺 ${missing.length} 键（例：${missing.slice(0, 3).join(', ')}）`);
  if (extra.length > 0) problems.push(`${code}.json 多 ${extra.length} 键（例：${extra.slice(0, 3).join(', ')}）`);
  for (const [k, v] of Object.entries(dict)) {
    if (typeof v !== 'string' || v.trim() === '') problems.push(`${code}.json 的 ${k} 为空值`);
    else if (!HAN_ALLOWED.has(code) && HAN_RE.test(v)) {
      problems.push(`${code}.json 的 ${k} 含汉字（疑似漏译）：${v.slice(0, 24)}`);
    }
  }
  // 插值占位符必须与源语言一致（漏掉 {dest} 会让界面出现原文括号）
  // 复数形式（vue-i18n 的 `|`）会在每个形式里重复同一占位符 ⇒ 比较**去重后的集合**；
  // 并要求每个形式自身的占位符集合一致（少写会让该形式少插一个值，比总数不一致更隐蔽）。
  const phSet = (v) => [...new Set(v.match(/\{\w+\}/g) ?? [])].sort().join(',');
  for (const k of sourceKeys) {
    if (!(k in dict)) continue;
    const want = phSet(source[k]);
    const got = phSet(dict[k]);
    if (want !== got) problems.push(`${code}.json 的 ${k} 占位符不一致：源 [${want}] vs 本文 [${got}]`);
    const forms = dict[k].split('|');
    const bad = forms.findIndex((f) => phSet(f) !== got);
    if (bad >= 0) problems.push(`${code}.json 的 ${k} 第 ${bad + 1} 个复数形式占位符与整体不一致：${forms[bad].trim().slice(0, 24)}`);
  }
}

/* ─── 3.5 词典值里的花括号只能是占位符 ─── */
/* vue-i18n 会把 `{…}` 当占位符编译：德语「开拓者」官方写法是 `{M#Trailblazer}{F#Trailblazerin}`
   （性别变体标记），直接进词典会抛 `SyntaxError: Invalid token in placeholder` 并让页面渲染异常。
   占位符只允许 `{name}` 形态；含其它花括号即失败（要字面花括号须走 vue-i18n 的转义写法）。 */
const PLACEHOLDER_OK = /^\{[A-Za-z_][A-Za-z0-9_]*\}$/;
for (const [code, dict] of Object.entries(dicts)) {
  for (const [k, v] of Object.entries(dict)) {
    if (typeof v !== 'string' || !v.includes('{')) continue;
    for (const m of v.matchAll(/\{[^}]*\}/g)) {
      if (PLACEHOLDER_OK.test(m[0])) continue;
      problems.push(`${code}.json 的 ${k} 含非占位符花括号 ${m[0]}（vue-i18n 会当占位符编译并报错）`);
    }
  }
}

/* ─── 3.6 数据驱动键：模板拼接的键静态查不到，按数据枚举值兜底 ─── */
/* `t('itemType.' + v)` / `propLabel('prop.' + k)` 这类键的**取值域来自数据**，
   静态扫描只看得到前缀 ⇒ 新增一个枚举值时界面会静默显示原始键名。
   本轮 `itemType.ComposeMaterial` 就是这样漏的（13 语言全缺，物品页显示键名）。 */
const DATA = join(ROOT, 'public', 'data', 'cn');
const base = dicts[SOURCE_LOCALE] ?? {};
const readJsonSafe = (f) => { try { return JSON.parse(readFileSync(f, 'utf8')); } catch { return null; } };
{
  const itemsFile = join(DATA, 'items.json');
  if (existsSync(itemsFile)) {
    const raw = readJsonSafe(itemsFile);
    const rows = Array.isArray(raw) ? raw : (raw?.items ?? []);
    const subs = new Set(rows.map((r) => r?.sub_type).filter((v) => typeof v === 'string' && v));
    const missing = [...subs].filter((v) => base[`itemType.${v}`] === undefined).sort();
    if (missing.length) {
      problems.push(`items.json 的 sub_type 缺词典键 ${missing.length} 个（例：itemType.${missing[0]}）`);
    }
  }
  /* 技能类型：`skillType.<skills[].type>`（角色与忆灵两处） */
  const charDir = join(DATA, 'characters');
  if (existsSync(charDir)) {
    const types = new Set();
    for (const f of readdirSync(charDir).filter((x) => x.endsWith('.json'))) {
      const d = readJsonSafe(join(charDir, f));
      if (!d) continue;
      for (const s of Object.values(d.skills ?? {})) if (s?.type) types.add(s.type);
      for (const s of Object.values(d.memosprite?.skills ?? {})) if (s?.type) types.add(s.type);
    }
    const missing = [...types].filter((v) => base[`skillType.${v}`] === undefined).sort();
    if (missing.length) problems.push(`角色技能类型缺词典键 ${missing.length} 个（例：skillType.${missing[0]}）`);
  }
  /* 固定枚举族：键由代码常量产出（`MAZE_STATUS_CLASS` / `GROUP_ORDER`），数据里没有取值域，
     只能按代码侧的枚举固定断言。 */
  for (const k of ['endgame.status.live', 'endgame.status.ended', 'endgame.status.upcoming', 'endgame.status.unknown']) {
    if (base[k] === undefined) problems.push(`终局状态缺词典键（mazeStatusLabelKey 会产出它）：${k}`);
  }
  for (const k of ['propGroup.power', 'propGroup.damage', 'propGroup.speed', 'propGroup.survival', 'propGroup.mechanic', 'propGroup.other']) {
    if (base[k] === undefined) problems.push(`货币战争属性分组缺词典键（groupLabel 会产出它）：${k}`);
  }

  /* 怪物分类：键由 enum-labels 的映射表产出（枚举值与数据值不同名，无法从数据直接推），
     故按映射表的**输出**固定断言。 */
  for (const k of ['monster.rank.boss', 'monster.rank.littleBoss', 'monster.rank.elite', 'monster.rank.minion']) {
    if (base[k] === undefined) problems.push(`怪物分类缺词典键（enum-labels 会产出它）：${k}`);
  }

  const curDir = join(DATA, 'currency');
  if (existsSync(curDir)) {
    const props = new Set();
    for (const f of readdirSync(curDir).filter((x) => x.endsWith('.json'))) {
      const text = readFileSync(join(curDir, f), 'utf8');
      for (const m of text.matchAll(/"property_type"\s*:\s*"([A-Za-z]+)"/g)) props.add(m[1]);
    }
    const missing = [...props].filter((v) => base[`prop.${v}`] === undefined).sort();
    if (missing.length) {
      problems.push(`货币战争数据出现未登记属性 ${missing.length} 个（例：prop.${missing[0]}）`);
    }
  }
}

/* ─── 3.7 结构层「中文回退」的可达性 ─── */
/* `properties.json` 里有两条官方无独立词条的属性名（`SpeedAddedRatio` / `MaxSP`），落成
   **未令牌化的中文**⇒ 只有缺省语言一份。当前它们不可达（遗器数据不含、CW 行走令牌或词典），
   但这是**数据现状**而非保证：一旦某个属性 id 在数据里被用到，非缺省语言就会露中文。
   判据：被数据用到的回退行必须同时有 `prop.<id>` 词典键（词典是本地化兜底）。 */
{
  const propsFile = join(DATA, 'properties.json');
  const rows = existsSync(propsFile) ? (readJsonSafe(propsFile) ?? []) : [];
  const literalRows = (Array.isArray(rows) ? rows : []).filter(
    (r) => typeof r?.name === 'string' && !r.name.startsWith('$t:'),
  );
  if (literalRows.length) {
    const used = new Set();
    const scan = (dir) => {
      for (const name of readdirSync(dir)) {
        const full = join(dir, name);
        if (statSync(full).isDirectory()) { scan(full); continue; }
        if (!name.endsWith('.json')) continue;
        const text = readFileSync(full, 'utf8');
        if (!text.includes('"property_type"')) continue;
        for (const m of text.matchAll(/"property_type"\s*:\s*"([A-Za-z0-9_]+)"/g)) used.add(m[1]);
      }
    };
    scan(DATA);
    for (const r of literalRows) {
      if (used.has(r.id) && base[`prop.${r.id}`] === undefined) {
        problems.push(`属性 ${r.id} 在数据里被使用，但枚举表只有中文回退且词典缺 prop.${r.id}（非缺省语言会露中文）`);
      }
    }
  }
}

/* ─── 4. 代码里静态 `t('…')` 的键必须存在 ─── */
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === '__tests__' || name === 'node_modules') continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|vue)$/.test(name)) out.push(p);
  }
  return out;
}

/* 静态键：`t('k')` / `t('k', {...})` / `translate('k', …)` 都算（两参调用曾漏检，
   于是 `t('mob.stage', { n })` 这种带插值的键拼错时守卫静默放过）。动态键（模板字符串）不在列。 */
const T_RE = /\b(?:t|translate)\(\s*'([A-Za-z][\w.]*)'/g;
const used = new Map();
for (const file of walk(SRC_DIR)) {
  const text = readFileSync(file, 'utf8');
  for (const m of text.matchAll(T_RE)) {
    const key = m[1];
    if (!(key in source)) {
      used.set(key, used.get(key) ?? []);
      used.get(key).push(posix.normalize(file.slice(ROOT.length).split('\\').join('/')));
    }
  }
}
for (const [key, where] of used) {
  problems.push(`代码引用了不存在的词典键 ${key}（${[...new Set(where)].slice(0, 2).join(', ')}）`);
}

/* ─── 4.5 死键报告（信息级，不阻塞） ─── */
/* 反向视图：词典里有、代码里从未被引用的键。它们会让「漏译/拼错」的排查变难（改了一处、
   另一处留着旧值），也会随功能下线不断堆积。**只报告不失败**——引用方式有多种（`labelKey` /
   `titleKey` / 数据驱动族），漏扫会误判，故不进 CI 门禁。 */
{
  const referenced = new Set();
  /* 判据：键以**引号包裹的字符串**出现在源码里即视为已引用。
     这比只认 `t('k')` 稳得多——键也常出现在映射表 / 数组 / 配置对象里
     （`{ 1: 'catalog.cost.1' }`、`RARITY_LABEL[key]`），逐种写法去识别必漏。
     动态拼接（`t(`a.${n}`)`）与数据驱动族另算，见下。 */
  const KEY_RE = new RegExp(`(['"\`])((?:${sourceKeys.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')}))\\1`, 'g');
  const DYN_PREFIX_RE = /`([A-Za-z][\w.]*)\.\$\{/g;
  const dynPrefixes = new Set();
  for (const file of walk(SRC_DIR)) {
    const text = readFileSync(file, 'utf8');
    for (const m of text.matchAll(KEY_RE)) referenced.add(m[2]);
    for (const m of text.matchAll(DYN_PREFIX_RE)) dynPrefixes.add(m[1] + '.');
  }
  /* 数据驱动族：前缀即引用（取值域由上面的数据断言兜住） */
  const DYN = ['itemType.', 'prop.', 'skillType.', 'monster.rank.', 'endgame.status.', 'propGroup.', 'stanceTag.'];
  for (const k of sourceKeys) {
    if (DYN.some((p) => k.startsWith(p)) || [...dynPrefixes].some((p) => k.startsWith(p))) referenced.add(k);
  }
  const unused = sourceKeys.filter((k) => !referenced.has(k)).sort();
  if (unused.length > 0) {
    console.log(`  [report] 未被引用的词典键 ${unused.length} 个：${unused.slice(0, 16).join(', ')}${unused.length > 16 ? ' …' : ''}`);
    console.log(`  [report]   动态前缀已识别 ${dynPrefixes.size} 个：${[...dynPrefixes].slice(0, 8).join(', ')}`);
  }
}

/* ─── 汇总 ─── */
if (problems.length > 0) {
  console.error(`\n[FAIL] UI 词典校验失败，共 ${problems.length} 处：`);
  for (const p of problems.slice(0, 25)) console.error(`  - ${p}`);
  if (problems.length > 25) console.error(`  … 另有 ${problems.length - 25} 处`);
  process.exit(1);
}
console.log(
  `[PASS] UI 词典一致（${files.length} 种语言 × ${sourceKeys.length} 键；`
  + `${used.size === 0 ? '代码静态键全部存在' : ''}${used.size === 0 ? '' : '存在未登记键'}）`,
);
