#!/usr/bin/env node
/**
 * 界面中文守卫：`src/` 里**面向用户渲染的中文**必须走词典或数据源，不得写死在代码里。
 *
 * 为什么需要它：多语言改造已完成（界面文案全部进 UI 词典 / 数据令牌），但「新写一段中文标签」
 * 不会有任何既有守卫报错——`check-i18n-messages.mjs` 只管「已用到的词典键是否存在」，管不到
 * 「这段中文该不该写死」。本守卫把当时的**有意保留清单**固化成机检，防止回流。
 *
 * 有意保留（白名单，改动白名单即视为契约变更）：
 *   1. 站点品牌名 `SITE_NAME`
 *   2. 语言列表里的母语自称（语言选择器必须用其母语显示）
 *   3. `lib/constants.ts` 的「中文技能名 → 枚举」解析表
 *   4. `console.warn/error` 诊断日志
 *   5. 内部校验抛出的 `Error`/`NkError` 文本（数据完整性诊断）
 *   6. 阶段名解析用的中文序数正则（`CN_ORDINAL` 与 `阶段N：` 前缀）
 *
 * 判据：**这段文字是否按当前语言渲染给用户看**——是则必须走词典/数据，否则不进词典。
 * 用法：node tools/check-ui-chinese.mjs [--list]
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, relative, sep } from 'node:path';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const SRC = join(ROOT, 'src');
const HAN = /[\u4e00-\u9fff]/;
const LIST_ONLY = process.argv.includes('--list');

/** 逐行判据：命中即放行（这些形态里的中文是有意的） */
const LINE_ALLOW = [
  /console\.(?:warn|error|info|log)\s*\(/, // 诊断日志
  /\b(?:throw\s+)?new\s+(?:NkError|Error)\s*\(/, // 内部校验诊断
  /CN_ORDINAL/, // 中文序数表
  /\/[^/\n]*[\u4e00-\u9fff][^/\n]*\//, // 含中文的正则字面量（解析源文本用）
];

/** 文件级白名单：整份文件允许出现中文（前缀匹配，登记必须带理由） */
const FILE_ALLOW = new Map([
  // 语言列表：母语自称必须用其母语显示
  ['src/lib/i18n/locales.ts', '语言选择器的母语自称'],
  // 品牌名
  ['src/lib/constants.ts', 'SITE_NAME 品牌名与「中文技能名 → 枚举」解析表'],
  // Spine 诊断：错误文本只进 console 与 /debug 研究线，不面向用户渲染
  ['src/spine/', 'spine 渲染诊断文本（console / 研究线）'],
]);

/** 剔除注释：块注释、HTML 注释、行注释（避免把说明文字当界面文案） */
function stripComments(s) {
  return s
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:'"\\])\/\/[^\n]*/g, '$1');
}

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (/\.(ts|vue)$/.test(name)) out.push(p);
  }
  return out;
}

const problems = [];
const allowedHits = [];
for (const abs of walk(SRC)) {
  const rel = relative(ROOT, abs).split(sep).join('/');
  /* 测试固件与 /debug 研究线不面向用户（后者生产构建已剔除） */
  if (rel.includes('__tests__') || rel.endsWith('.test.ts') || rel.includes('/debug/')) continue;
  const fileAllow = [...FILE_ALLOW.entries()].find(([prefix]) => rel === prefix || rel.startsWith(prefix))?.[1];
  const code = stripComments(readFileSync(abs, 'utf8'));
  code.split('\n').forEach((line, i) => {
    if (!HAN.test(line)) return;
    if (LINE_ALLOW.some((re) => re.test(line))) {
      allowedHits.push(`${rel}:${i + 1}`);
      return;
    }
    if (fileAllow && !line.trim().startsWith('import')) {
      allowedHits.push(`${rel}:${i + 1}（${fileAllow}）`);
      return;
    }
    problems.push({ rel, line: i + 1, text: line.trim().slice(0, 100) });
  });
}

if (LIST_ONLY) {
  console.log(`白名单命中 ${allowedHits.length} 处：`);
  for (const h of allowedHits) console.log('  ' + h);
  process.exit(problems.length ? 1 : 0);
}

if (problems.length) {
  console.error(`[FAIL] 界面中文守卫：${problems.length} 处中文直接写在代码里（应走词典或数据源）：`);
  for (const p of problems.slice(0, 25)) console.error(`  - ${p.rel}:${p.line}  ${p.text}`);
  if (problems.length > 25) console.error(`  …另有 ${problems.length - 25} 处`);
  console.error('  若确属有意保留（品牌名 / 母语自称 / 诊断日志 / 内部校验文本 / 中文解析表），');
  console.error('  按本脚本头部的白名单规则登记，并在 docs/memory/architecture.md 说明理由。');
  process.exit(1);
}
console.log(`[PASS] 界面中文守卫：无写死的中文界面文案（白名单命中 ${allowedHits.length} 处）`);
