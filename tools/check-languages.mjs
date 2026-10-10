#!/usr/bin/env node
/**
 * 语言清单一致性守卫：node tools/check-languages.mjs
 *
 * 两侧清单必须同步（[ADR 0052](../docs/adr/0052-多语言站点架构-路径前缀与语言包.md)）：
 *   - 事实源：tools/converter/languages.json（转换器经 languages.py 读取）
 *   - UI 镜像：src/lib/i18n/locales.ts（路由前缀 / 语言选择器）
 *
 * 校验项：
 *   1. 两侧语言代码集合、每个代码的 culture 与母语名、缺省语言完全一致
 *   2. 前缀规则：缺省语言为空串，其余等于语言代码（缺省语言不做 `/cn/**` 别名）
 *   3. vendor 在场时：每个语言声明的 TextMap 分片文件真实存在，且清单与
 *      ExcelOutput/AllowedTextLanguage.json 的上游语言全量对齐（上游新增语言即失败，
 *      强制走一次「要不要支持」的决策，而不是静默漏掉）
 *
 * 退出码：有漂移 1，全绿 0。vendor 不在场（CI 未浅克隆 / Vercel 构建）时跳过第 3 项并提示。
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, posix, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const REGISTRY_REL = 'tools/converter/languages.json';
const LOCALES_REL = 'src/lib/i18n/locales.ts';
const VENDOR_LANG_REL = 'vendor/TurnBasedGameData/ExcelOutput/AllowedTextLanguage.json';
const VENDOR_TEXTMAP_REL = 'vendor/TurnBasedGameData/TextMap';

const problems = [];
const notes = [];
const fail = (msg) => problems.push(msg);
const note = (msg) => notes.push(msg);

const readText = (rel) => readFileSync(join(ROOT, rel), 'utf8');

/* ─── 事实源 ─── */
if (!existsSync(join(ROOT, REGISTRY_REL))) {
  console.error(`[FAIL] 缺少语言清单事实源 ${REGISTRY_REL}`);
  process.exit(1);
}
const registry = JSON.parse(readText(REGISTRY_REL));
const registryLangs = Array.isArray(registry.languages) ? registry.languages : [];
if (registryLangs.length === 0) fail(`${REGISTRY_REL}: languages 为空`);
const defaultCode = String(registry.default || '');

const CODE_RE = /^[a-z]{2,3}$/;
const CULTURE_RE = /^[a-z]{2}-[A-Z]{2}$/;
const seen = new Set();
for (const lang of registryLangs) {
  const code = String(lang.code || '');
  if (!CODE_RE.test(code)) fail(`${REGISTRY_REL}: 语言代码不合法 ${JSON.stringify(code)}`);
  if (seen.has(code)) fail(`${REGISTRY_REL}: 语言代码重复 ${code}`);
  seen.add(code);
  if (!CULTURE_RE.test(String(lang.culture || ''))) fail(`${REGISTRY_REL}: ${code} culture 不合法 ${JSON.stringify(lang.culture)}`);
  if (!String(lang.native || '')) fail(`${REGISTRY_REL}: ${code} 缺母语名`);
  const shards = Array.isArray(lang.textmap) ? lang.textmap : [];
  if (shards.length === 0) fail(`${REGISTRY_REL}: ${code} 未声明 TextMap 分片`);
}
if (!seen.has(defaultCode)) fail(`${REGISTRY_REL}: default=${JSON.stringify(defaultCode)} 不在 languages 内`);

/* ─── UI 镜像 ─── */
if (!existsSync(join(ROOT, LOCALES_REL))) {
  console.error(`[FAIL] 缺少前端语言清单 ${LOCALES_REL}`);
  process.exit(1);
}
const localesSrc = readText(LOCALES_REL);
const ENTRY_RE = /\{\s*code:\s*'([^']+)',\s*culture:\s*'([^']+)',\s*native:\s*'([^']*)',\s*prefix:\s*'([^']*)',\s*isDefault:\s*(true|false)\s*\}/g;
const localeEntries = [...localesSrc.matchAll(ENTRY_RE)].map((m) => ({
  code: m[1], culture: m[2], native: m[3], prefix: m[4], isDefault: m[5] === 'true',
}));
if (localeEntries.length === 0) {
  fail(`${LOCALES_REL}: 未解析到任何语言条目（条目格式变化需同步本守卫的正则）`);
}
const defaultInTs = /DEFAULT_LOCALE\s*=\s*'([^']+)'/.exec(localesSrc);
if (!defaultInTs) fail(`${LOCALES_REL}: 未找到 DEFAULT_LOCALE`);
else if (defaultInTs[1] !== defaultCode) {
  fail(`${LOCALES_REL}: DEFAULT_LOCALE='${defaultInTs[1]}' 与事实源 default='${defaultCode}' 不一致`);
}

/* ─── 两侧逐项比对 ─── */
const tsByCode = new Map(localeEntries.map((e) => [e.code, e]));
for (const lang of registryLangs) {
  const code = String(lang.code);
  const ts = tsByCode.get(code);
  if (!ts) {
    fail(`前端清单缺少语言 ${code}（改 ${REGISTRY_REL} 时必须同步 ${LOCALES_REL}）`);
    continue;
  }
  if (ts.culture !== lang.culture) fail(`${code}: culture 漂移 事实源=${lang.culture} 前端=${ts.culture}`);
  if (ts.native !== lang.native) fail(`${code}: 母语名漂移 事实源=${lang.native} 前端=${ts.native}`);
  const wantDefault = code === defaultCode;
  if (ts.isDefault !== wantDefault) fail(`${code}: isDefault 漂移（应为 ${wantDefault}）`);
  const wantPrefix = wantDefault ? '' : code;
  if (ts.prefix !== wantPrefix) fail(`${code}: URL 前缀漂移 应为 '${wantPrefix}'，实际 '${ts.prefix}'`);
  tsByCode.delete(code);
}
for (const leftover of tsByCode.keys()) {
  fail(`前端清单多出未登记语言 ${leftover}（事实源里没有）`);
}

/* ─── vendor 交叉校验（不在场则跳过） ─── */
const vendorLangFile = join(ROOT, VENDOR_LANG_REL);
const textmapDir = join(ROOT, VENDOR_TEXTMAP_REL);
if (existsSync(vendorLangFile)) {
  const vendorLangs = JSON.parse(readFileSync(vendorLangFile, 'utf8'));
  const vendorByCode = new Map(vendorLangs.map((v) => [String(v.TextLanguageKey), String(v.LanguageCultureCode)]));
  for (const lang of registryLangs) {
    const code = String(lang.code);
    const culture = vendorByCode.get(code);
    if (culture === undefined) {
      fail(`${code} 不在上游 ${VENDOR_LANG_REL} 内（站内语言代码必须取上游 TextLanguageKey）`);
    } else if (culture !== lang.culture) {
      fail(`${code}: culture 与上游 LanguageCultureCode 不符 上游=${culture} 清单=${lang.culture}`);
    }
  }
  const uncovered = [...vendorByCode.keys()].filter((c) => !seen.has(c));
  if (uncovered.length > 0) {
    fail(`上游文本语言未被本站覆盖: ${uncovered.join(', ')}（需显式决策：支持或明确排除）`);
  }
  if (existsSync(textmapDir)) {
    for (const lang of registryLangs) {
      for (const shard of lang.textmap || []) {
        if (!existsSync(join(textmapDir, String(shard)))) {
          fail(`${lang.code}: TextMap 分片不存在 ${shard}`);
        }
      }
    }
  } else {
    note('vendor TextMap 目录不在场，跳过分片存在性校验');
  }
} else {
  note(`vendor 不在场（${VENDOR_LANG_REL}），跳过上游交叉校验`);
}

/* ─── 格式化必须按站点语言（不是浏览器语言） ─── */
/* `toLocaleString()` 不带参数时用**浏览器**语言 ⇒ 德语站点配英文浏览器会输出 `1,234.5`（应为 `1.234,5`）。
   统一走 `src/lib/format.ts` 的 `fmtNumber()`。debug 研究线不面向用户，不进此判据。 */
{
  const SRC = join(ROOT, 'src');
  const walk = (dir, out = []) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) walk(full, out);
      else if (/\.(ts|vue)$/.test(name)) out.push(full);
    }
    return out;
  };
  for (const file of walk(SRC)) {
    const rel = posix.join(...file.slice(ROOT.length).split(sep));
    if (rel.includes('__tests__') || rel.endsWith('.test.ts') || rel.includes('/debug/')) continue;
    const text = readFileSync(file, 'utf8');
    text.split('\n').forEach((line, i) => {
      if (/\.toLocaleString\(\)/.test(line) && !line.trim().startsWith('//') && !line.trim().startsWith('*')) {
        problems.push(`${rel}:${i + 1} 无参 toLocaleString()（用的是浏览器语言，应走 fmtNumber()）`);
      }
    });
  }
}

/* ─── 内链必须带语言前缀（非 RouterLink 场合） ─── */
/* 目录卡与模板里的普通 `<a href>` 不走路由 history base：写死 `/lightcone/23001` 这类内链，
   在非缺省语言下点一下就会**静默跳回缺省语言**。唯一正确写法是 `activeHref(...)`（或 RouterLink 的 `to`）。
   本轮实测漏点：`BuildsPanel.vue` 的推荐光锥卡。 */
{
  const walk = (dir, out = []) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) walk(full, out);
      else if (/\.(ts|vue)$/.test(name)) out.push(full);
    }
    return out;
  };
  for (const file of walk(join(ROOT, 'src'))) {
    const rel = posix.join(...file.slice(ROOT.length).split(sep));
    if (rel.includes('__tests__') || rel.endsWith('.test.ts') || rel.includes('/debug/')) continue;
    const text = readFileSync(file, 'utf8');
    text.split('\n').forEach((line, i) => {
      if (!/href\s*[:=]\s*[`'"]?\s*\//.test(line)) return;
      if (/activeHref\(|https?:|\/\/|href\s*[:=]\s*[`'"]?#/.test(line)) return;
      problems.push(`${rel}:${i + 1} 内链写死路径且未经 activeHref（非缺省语言会跳回缺省语言）：${line.trim().slice(0, 60)}`);
    });
  }
}

/* ─── 汇总 ─── */
for (const n of notes) console.log(`[INFO] ${n}`);
if (problems.length > 0) {
  console.error(`\n[FAIL] 语言清单漂移 ${problems.length} 处：`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(
  `[PASS] 语言清单一致（${registryLangs.length} 种语言，缺省 ${defaultCode}，`
  + `${registryLangs.length - 1} 个前缀）`,
);
