#!/usr/bin/env node
/**
 * e2e 裸 px 字面量统计（report-only）。
 * 用法：node tools/check-e2e-literals.mjs [--strict] [--baseline <文件>] [--write-baseline]
 * 扫 e2e/**&#47;*.spec.ts 的 px 字面量并给出 file:line；行内 `// e2e-literal-ok: 理由` 视为豁免（缺理由不豁免）。
 * 基线默认 tools/e2e-literal-baseline.json：缺失时以当前计数为基线并提示生成。
 * 退出码：默认恒 0；--strict 高于基线（总数或单文件）退出 1。
 * 硬约束：只用 node 内置模块；除 --write-baseline 外不改写任何文件。
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, sep, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const strict = process.argv.includes('--strict');
const writeBaseline = process.argv.includes('--write-baseline');
const baseArg = process.argv.indexOf('--baseline');
const baselineRel = baseArg >= 0 && process.argv[baseArg + 1] ? process.argv[baseArg + 1] : posix.join('tools', 'e2e-literal-baseline.json');
const baselinePath = join(ROOT, baselineRel);

/** px 字面量：前一位不得是标识符/小数点，后一位不得是字母数字（`4.2.43px` 不误切） */
const PX_RE = /(?<![\w.-])\d+(?:\.\d+)?px(?![A-Za-z0-9])/g;
/** 行内豁免：注释须带非空理由 */
const OK_RE = /\/\/\s*e2e-literal-ok\s*[:：]\s*(\S.*)$/;
const BAD_OK_RE = /\/\/\s*e2e-literal-ok\s*[:：]?\s*$/;

/**
 * 断言位判定（硬约束）：只统计**断言调用里的** px。
 * 注释、用例标题、`setViewportSize` 里的 px 不是裸数值断言，计进去会让守卫对「改一句注释」报警，
 * 反过来逼人改注释去凑绿——守卫噪声本身就是 churn 来源。
 */
const ASSERT_RE = /\b(?:toHaveCSS|toHaveAttribute|toContain|toMatch|toEqual|toBe|toBeLessThan|toBeGreaterThan|toBeLessThanOrEqual|toBeGreaterThanOrEqual|toBeCloseTo|expect)\b/;
/** 带非 ASCII 的字符串是断言消息/中文文案（如 `（±2px）`），断言值一律是 ASCII 串（'1px'） */
const STRING_RE = /('[^'\n]*'|"[^"\n]*"|`[^`\n]*`)/g;
const NON_ASCII_RE = /[^\x00-\x7F]/;

/** 逐行去注释（块注释跨行按状态机，行注释不误伤 `://`） */
function stripComments(line, state) {
  let out = '';
  let i = 0;
  while (i < line.length) {
    if (state.inBlock) {
      const end = line.indexOf('*/', i);
      if (end < 0) return out;
      state.inBlock = false;
      i = end + 2;
      continue;
    }
    const block = line.indexOf('/*', i);
    const slash = line.indexOf('//', i);
    const isUrl = slash > 0 && line[slash - 1] === ':';
    if (slash >= 0 && !isUrl && (block < 0 || slash < block)) return out + line.slice(i, slash);
    if (block >= 0) {
      out += line.slice(i, block);
      state.inBlock = true;
      i = block + 2;
      continue;
    }
    return out + line.slice(i);
  }
  return out;
}

/** 去掉带中文的字符串（断言消息），保留 ASCII 字符串（断言值） */
const dropLocalized = (code) => code.replace(STRING_RE, (s) => (NON_ASCII_RE.test(s) ? '' : s));

const specs = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (name.endsWith('.spec.ts')) specs.push(p);
  }
};
walk(join(ROOT, 'e2e'));
specs.sort();

const hits = []; // { rel, line, literals[], exempt }
const exempted = [];
const badReasons = [];
const state = { inBlock: false };
for (const abs of specs) {
  const rel = relative(ROOT, abs).split(sep).join(posix.sep);
  state.inBlock = false;
  readFileSync(abs, 'utf8').split(/\r?\n/).forEach((line, i) => {
    const code = stripComments(line, state);
    if (!ASSERT_RE.test(code)) return; // 非断言行（标题 / 视口 / 注释）不进计数
    const literals = dropLocalized(code).match(PX_RE);
    if (!literals) return;
    const ok = line.match(OK_RE);
    if (ok) exempted.push({ rel, line: i + 1, literals, reason: ok[1].trim() });
    else {
      if (BAD_OK_RE.test(line)) badReasons.push({ rel, line: i + 1 });
      hits.push({ rel, line: i + 1, literals });
    }
  });
}

const total = hits.reduce((n, h) => n + h.literals.length, 0);
const byFile = new Map();
for (const h of hits) byFile.set(h.rel, (byFile.get(h.rel) || 0) + h.literals.length);

/* ═══ 基线比对 ═══ */
const hasBaseline = existsSync(baselinePath);
let baseline = null;
if (hasBaseline) {
  try {
    baseline = JSON.parse(readFileSync(baselinePath, 'utf8'));
  } catch (e) {
    console.log(`[WARN] 基线文件无法解析（${baselineRel}）：${e.message}`);
  }
}
if (writeBaseline) {
  const files = {};
  for (const [rel, n] of [...byFile].sort((a, b) => a[0].localeCompare(b[0]))) files[rel] = n;
  writeFileSync(baselinePath, `${JSON.stringify({ total, files }, null, 2)}\n`, 'utf8');
  console.log(`[写出基线] ${baselineRel}：total=${total}（${byFile.size} 个文件）`);
  process.exit(0);
}

const grown = [];
if (baseline) {
  if (total > (baseline.total ?? 0)) grown.push(`总计 ${total} > 基线 ${baseline.total}`);
  for (const [rel, n] of byFile) {
    const base = baseline.files?.[rel] ?? 0;
    if (n > base) grown.push(`${rel} ${n} > 基线 ${base}`);
  }
}

/* ═══ 报告 ═══ */
const B = (s) => `\x1b[1m${s}\x1b[0m`;
console.log(B(`\n[e2e 字面量] 扫描 ${specs.length} 个 spec｜px 字面量 ${total} 处｜豁免 ${exempted.length} 行${badReasons.length ? `｜豁免缺理由 ${badReasons.length} 行` : ''}｜基线 ${hasBaseline ? `${baseline?.total ?? '?'}（${baselineRel}）` : '缺失'}\n`));

if (!hasBaseline) {
  console.log(`基线文件缺失（${baselineRel}）→ 本次以当前计数 ${total} 为基线，--strict 恒通过；`);
  console.log('生成基线：node tools/check-e2e-literals.mjs --write-baseline\n');
}

if (byFile.size) {
  console.log(B('── 计数（高于基线者标 ▲） ──'));
  for (const [rel, n] of [...byFile].sort((a, b) => a[0].localeCompare(b[0]))) {
    const base = baseline?.files?.[rel] ?? 0;
    console.log(`  ${rel}  ${n}${baseline && n > base ? `  ▲ 基线 ${base}` : ''}`);
  }
  console.log('');
  console.log(B('── 明细（file:line → 字面量） ──'));
  let shown = 0;
  for (const h of hits) {
    if (shown++ >= 200) {
      console.log(`  … 另有 ${hits.length - 200} 行（工具输出截断，非豁免）`);
      break;
    }
    console.log(`  ${h.rel}:${h.line}  ${h.literals.join(', ')}`);
  }
  console.log('');
} else {
  console.log('全部 e2e spec 无裸 px 字面量 ✓\n');
}
if (exempted.length) {
  console.log(B('── 已豁免（// e2e-literal-ok） ──'));
  for (const e of exempted) console.log(`  ${e.rel}:${e.line}  ${e.literals.join(', ')}  【${e.reason}】`);
  console.log('');
}
if (badReasons.length) {
  console.log(B('── 豁免缺理由（按未豁免计入） ──'));
  for (const e of badReasons) console.log(`  ${e.rel}:${e.line}  // e2e-literal-ok 未写理由`);
  console.log('');
}

if (!grown.length) {
  const baseTotal = baseline?.total ?? null;
  if (baseTotal !== null && total < baseTotal) {
    console.log(`[PASS] 未高于基线（低于基线：${total} < ${baseTotal}）→ 收敛后可下调：node tools/check-e2e-literals.mjs --write-baseline\n`);
  } else {
    console.log(hasBaseline ? '[PASS] 未高于基线\n' : '[PASS] 无基线可判（report-only）\n');
  }
} else {
  console.log(`[FAIL] ${grown.length} 项高于基线：${grown.join('；')}`);
  console.log('       正解：令牌派生（e2e/helpers.ts → readToken）或相对序断言；确属不可漂移契约值再补 `// e2e-literal-ok: 理由`\n');
}
process.exit(strict && grown.length ? 1 : 0);
