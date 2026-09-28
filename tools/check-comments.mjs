#!/usr/bin/env node
/**
 * 注释「累赘度」构建守卫（report-only 先行，不进 pnpm build 门禁）。
 * 设计动机：注释「占比」不是好指标（小文件高占比成本近零），真正干扰 AI 的是
 * 「长散文块 / 超长文件头 / 跨文件重复断言」随文件被无条件加载——相当于绕开
 * AGENTS.md「按需加载」机制的变相 @path 全量注入。本守卫把既有注释硬约束机械化。
 *
 * 用法：
 *   node tools/check-comments.mjs            # 报告模式（始终退出 0）
 *   node tools/check-comments.mjs --strict   # 硬违规即退出 1（存量清零后接入 check-guards）
 *   node tools/check-comments.mjs --emit-baseline   # 写 tools/comment-baseline.json（护栏行数锁）
 *
 * 硬规则（--strict 失败）：① 单块连续注释 ≤ 20 行；② 文件头注释 ≤ 12 行；
 * ③ 跨文件重复注释行（≥24 字、≥3 文件）报警；④ 护栏基线（禁止/必须/不得/切勿/绝不/一律）
 * 行数不得低于 baseline——下降即红，除非同 commit 显式更新基线。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const SKIP = new Set([
  'node_modules', 'dist', '.git', 'coverage', 'coverage-out', 'vendor', 'public',
  'temp', 'docs', '.github', '__pycache__', '.pnpm-store', '.vscode', '.playwright',
  'playwright-report', '.pytest_cache', '.agents',
]);
const CODE_EXT = /\.(ts|mts|cts|js|mjs|cjs|vue|css|html|py)$/;

const BLOCK_MAX = 20;
const HEADER_MAX = 12;
const RATIO_SOFT = 0.25; // 仅报告，不作硬失败（会误报小文件）
const DUP_MIN_FILES = 3;
const DUP_MIN_LEN = 24;
const GUARD_RE = /禁止|必须|不得|切勿|绝不|一律/;

/* ---------- 逐语言行标记 ---------- */
const lineStarts = (t) => { const s = [0]; for (let i = 0; i < t.length; i++) if (t[i] === '\n') s.push(i + 1); return s; };
const lineOfPos = (st, p) => { let lo = 0, hi = st.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (st[m] <= p) lo = m; else hi = m - 1; } return lo; };

function tsRanges(text) {
  const sf = ts.createSourceFile('x.ts', text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const out = [];
  const visit = (n) => {
    const f = n.getFullStart(), s = n.getStart(sf);
    if (s > f) { const rs = ts.getLeadingCommentRanges(text, f); if (rs) out.push(...rs); }
    const trs = ts.getTrailingCommentRanges(text, n.getEnd()); if (trs) out.push(...trs);
    for (const k of n.getChildren(sf)) visit(k);
  };
  visit(sf);
  const tail = ts.getLeadingCommentRanges(text, sf.endOfFileToken.getFullStart()); if (tail) out.push(...tail);
  return out;
}
const blankStrings = (text) => {
  const o = text.split('');
  for (const ch of ['"', "'"]) {
    let i = 0;
    while (i < o.length) {
      if (o[i] === '\\') { i += 2; continue; }
      if (o[i] === ch) { let j = i + 1; while (j < o.length && o[j] !== '\\' && o[j] !== ch && o[j] !== '\n') j++; for (let k = i + 1; k < j; k++) o[k] = ' '; i = j + 1; continue; }
      i++;
    }
  }
  return o.join('');
};
function flagsForTs(text, rel) {
  const st = lineStarts(text), total = st.length;
  const mask = new Uint8Array(text.length);
  for (const r of tsRanges(text)) { for (let i = r.pos; i < r.end; i++) mask[i] = 1; }
  return { st, total, mask, text };
}
function flagsForVue(text) {
  const st = lineStarts(text), total = st.length;
  const mask = new Uint8Array(text.length);
  const mark = (a, b) => { for (let i = a; i < b; i++) mask[i] = 1; };
  const re = /<(script|style|template)\b[^>]*>/g;
  let m;
  while ((m = re.exec(text))) {
    const tag = m[1], oe = m.index + m[0].length;
    const cm = new RegExp(`</${tag}\\s*>`).exec(text.slice(oe));
    if (!cm) continue;
    const cs = oe + cm.index, ce = cs + cm[0].length;
    const sub = text.slice(oe, cs);
    if (tag === 'script') for (const r of tsRanges(sub)) mark(oe + r.pos, oe + r.end);
    else if (tag === 'style') blankStrings(sub).replace(/\/\*[\s\S]*?\*\//g, (mm, off) => { mark(oe + off, oe + off + mm.length); return mm; });
    else sub.replace(/<!--[\s\S]*?-->/g, (mm, off) => { mark(oe + off, oe + off + mm.length); return mm; });
    re.lastIndex = ce;
  }
  return { st, total, mask, text };
}
function flagsForCss(text) {
  const st = lineStarts(text), total = st.length;
  const mask = new Uint8Array(text.length);
  blankStrings(text).replace(/\/\*[\s\S]*?\*\//g, (mm, off) => { for (let i = off; i < off + mm.length; i++) mask[i] = 1; return mm; });
  return { st, total, mask, text };
}
function flagsForHtml(text) {
  const st = lineStarts(text), total = st.length;
  const mask = new Uint8Array(text.length);
  text.replace(/<!--[\s\S]*?-->/g, (mm, off) => { for (let i = off; i < off + mm.length; i++) mask[i] = 1; return mm; });
  return { st, total, mask, text };
}
function flagsForPy(text) {
  const st = lineStarts(text), total = st.length;
  const mask = new Uint8Array(text.length);
  const lines = text.split('\n');
  let inStr = null;
  for (let i = 0; i < total; i++) {
    const line = lines[i];
    const a = st[i], b = i + 1 < st.length ? st[i + 1] - 1 : text.length;
    let isC = false, isM = false;
    if (!inStr) {
      if (/^\s*(?:#|\/\/)/.test(line)) { isC = true; }
      else {
        const m = line.match(/(?:"""|''')/);
        if (m) {
          inStr = m[0][0];
          isC = true;
          const after = line.slice(line.indexOf(m[0]) + 3);
          if (after.includes(inStr + inStr + inStr)) inStr = null;
        } else if (/#/.test(line)) { isM = true; }
      }
    } else {
      isC = true;
      if (line.includes(inStr + inStr + inStr)) inStr = null;
    }
    if (isC || isM) for (let p = a; p < b; p++) mask[p] = 1;
  }
  return { st, total, mask, text };
}
function flagsFor(rel, text) {
  const ext = path.extname(rel);
  if (rel.endsWith('.vue')) return flagsForVue(text);
  if (ext === '.css') return flagsForCss(text);
  if (ext === '.html') return flagsForHtml(text);
  if (ext === '.py') return flagsForPy(text);
  return flagsForTs(text, rel);
}

/* ---------- 指标 ---------- */
function metrics(rel, text) {
  const { st, total, mask } = flagsFor(rel, text);
  const flags = new Array(total);
  for (let i = 0; i < total; i++) {
    const a = st[i], b = i + 1 < st.length ? st[i + 1] - 1 : text.length;
    let c = false, k = false;
    for (let p = a; p < b; p++) { if (mask[p]) { c = true; continue; } const ch = text[p]; if (ch !== ' ' && ch !== '\t' && ch !== '\r') k = true; }
    flags[i] = c && k ? 'M' : c ? 'C' : k ? 'K' : 'B';
  }
  const lines = text.split('\n');
  const commentText = (i) => (flags[i] === 'C' || flags[i] === 'M') ? lines[i].trim() : '';
  let blank = 0, cLines = 0, mLines = 0;
  for (const f of flags) { if (f === 'B') blank++; else if (f === 'C') cLines++; else if (f === 'M') mLines++; }
  const nb = total - blank;
  const ratio = cLines / nb;
  // 文件头：首个 K/M 之前的 C/M 行
  let firstCode = flags.findIndex((f) => f === 'K' || f === 'M');
  if (firstCode < 0) firstCode = total;
  let header = 0;
  for (let i = 0; i < firstCode; i++) if (flags[i] === 'C' || flags[i] === 'M') header++;
  // 块：连续 C（允许块内至多 1 个空行）
  const blocks = [];
  let i = 0;
  while (i < total) {
    if (flags[i] !== 'C') { i++; continue; }
    let j = i, last = i, blankRun = 0;
    while (j < total && (flags[j] === 'C' || flags[j] === 'B')) {
      if (flags[j] === 'C') { last = j; blankRun = 0; } else if (++blankRun > 1) break;
      j++;
    }
    blocks.push({ start: i + 1, end: last + 1, len: last - i + 1 });
    i = last + 1;
  }
  // 护栏行
  let guard = 0;
  for (let i = 0; i < total; i++) if ((flags[i] === 'C' || flags[i] === 'M') && GUARD_RE.test(lines[i])) guard++;
  return { rel, total, flags, lines, blank, cLines, mLines, nb, ratio, header, blocks, guard, commentText };
}

/* ---------- 扫描 ---------- */
function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) { if (!SKIP.has(e.name)) walk(full, out); }
    else if (CODE_EXT.test(e.name)) out.push(full);
  }
}
const files = [];
walk(ROOT, files);
const rows = [];
for (const full of files) {
  const rel = path.relative(ROOT, full).replace(/\\/g, '/');
  let text = fs.readFileSync(full, 'utf8').replace(/^\uFEFF/, '');
  if (text.endsWith('\n')) text = text.slice(0, -1);
  rows.push(metrics(rel, text));
}

/* ---------- 汇总 ---------- */
const allComment = rows.reduce((a, r) => a + r.cLines, 0);
const blockViol = [];
for (const r of rows) for (const b of r.blocks) if (b.len > BLOCK_MAX) blockViol.push({ rel: r.rel, ...b });
const headerViol = rows.filter((r) => r.header > HEADER_MAX).map((r) => ({ rel: r.rel, header: r.header }));
const ratioSoft = rows.filter((r) => r.ratio > RATIO_SOFT).map((r) => ({ rel: r.rel, ratio: r.ratio }));
const guardTotal = rows.reduce((a, r) => a + r.guard, 0);
const tooLongBlocks = rows.reduce((a, r) => a + r.blocks.filter((b) => b.len > BLOCK_MAX).reduce((s, b) => s + b.len - BLOCK_MAX, 0), 0);
const overHeader = rows.reduce((a, r) => a + Math.max(0, r.header - HEADER_MAX), 0);

// 重复断言
const norm = (t) => t.replace(/^[\s/*#!\-=─━]+/, '').replace(/[\s*/\-=─━]+$/, '').replace(/\s+/g, ' ').trim();
const dupMap = new Map();
for (const r of rows) for (let i = 0; i < r.total; i++) {
  if (r.flags[i] !== 'C') continue;
  const t = norm(r.commentText(i));
  const cjk = (t.match(/[一-鿿]/g) || []).length;
  if (t.length < DUP_MIN_LEN || cjk < 2) continue;
  if (!dupMap.has(t)) dupMap.set(t, new Set());
  dupMap.get(t).add(r.rel);
}
const dups = [...dupMap.entries()].filter(([, s]) => s.size >= DUP_MIN_FILES).sort((a, b) => b[1].size - a[1].size);

/* ---------- 输出 ---------- */
const pad = (s, n) => String(s).padEnd(n);
const padL = (s, n) => String(s).padStart(n);
const pct = (x) => (x * 100).toFixed(1) + '%';

let report = [];
const say = (s = '') => report.push(s);
say('# 注释累赘度守卫（report-only）');
say();
say(`- 扫描 ${rows.length} 个代码文件；整行注释 ${allComment} 行；护栏类注释（禁止/必须/不得/切勿/绝不/一律）${guardTotal} 行`);
say(`- 长块（> ${BLOCK_MAX} 行）：${blockViol.length} 块，涉及 ${new Set(blockViol.map((b) => b.rel)).size} 个文件，可外移 ${tooLongBlocks} 行`);
say(`- 文件头（> ${HEADER_MAX} 行）：${headerViol.length} 个文件，可压缩 ${overHeader} 行`);
say(`- 超标文件（占比 > ${pct(RATIO_SOFT)}，仅提示）：${ratioSoft.length} 个（小文件多为误报，不作为硬规则）`);
say(`- 跨文件重复注释行（≥${DUP_MIN_FILES} 文件）：${dups.length} 条，合计 ${dups.reduce((a, [, s]) => a + s.size, 0)} 处`);
say();
say('## 硬违规 1/4：连续注释块 > ' + BLOCK_MAX + ' 行');
for (const b of blockViol.sort((a, b) => b.len - a.len)) say(`  · ${pad(b.rel + ':' + b.start + '-' + b.end, 50)} ${b.len} 行`);
say();
say('## 硬违规 2/4：文件头注释 > ' + HEADER_MAX + ' 行');
for (const h of headerViol.sort((a, b) => b.header - a.header)) say(`  · ${pad(h.rel, 46)} ${h.header} 行`);
say();
say('## 硬违规 3/4：跨文件重复注释行');
for (const [t, s] of dups) say(`  · [${s.size} 文件] ${t.slice(0, 74)}`);
say();
say('## 硬违规 4/4：护栏基线锁定');
const basePath = path.join(ROOT, 'tools', 'comment-baseline.json');
if (fs.existsSync(basePath)) {
  const base = JSON.parse(fs.readFileSync(basePath, 'utf8'));
  const delta = guardTotal - (base.guardrailLines || 0);
  say(`  · 当前 ${guardTotal} 行 / 基线 ${base.guardrailLines} 行 → ${delta === 0 ? '持平' : delta > 0 ? `+${delta}（增加，OK）` : `${delta}（下降！须在本 commit 更新基线或找回护栏）`}`);
} else {
  say('  · 尚未生成基线；运行 `node tools/check-comments.mjs --emit-baseline`');
}
say();

if (process.argv.includes('--emit-baseline')) {
  const payload = {
    guardrailLines: guardTotal,
    blockViolations: blockViol.map((b) => b.rel + ':' + b.start),
    headerViolations: headerViol.map((h) => h.rel),
  };
  fs.writeFileSync(basePath, JSON.stringify(payload, null, 2) + '\n', 'utf8');
  say(`[emit] 已写 ${path.relative(ROOT, basePath)}：guardrailLines=${guardTotal}`);
}

console.log(report.join('\n'));

const strict = process.argv.includes('--strict');
if (strict) {
  const fail = blockViol.length > 0 || headerViol.length > 0 || dups.length > 0;
  const base = fs.existsSync(basePath) ? JSON.parse(fs.readFileSync(basePath, 'utf8')) : null;
  const guardFail = base && guardTotal < (base.guardrailLines || 0);
  if (fail || guardFail) {
    console.log(`[FAIL] 注释守卫：${blockViol.length} 长块 / ${headerViol.length} 超长头 / ${dups.length} 重复行${guardFail ? ' / 护栏基线下降' : ''}`);
    process.exit(1);
  }
  console.log('[PASS] 注释守卫全部通过');
  process.exit(0);
}
process.exit(0);
