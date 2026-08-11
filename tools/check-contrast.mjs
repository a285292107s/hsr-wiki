#!/usr/bin/env node
/**
 * 令牌对比度审计（设计语言 §10 对比度验收表 / 迭代 §14）
 *
 * 读取 tokens.css 的 :root 与 [data-theme="cw"] 两块令牌，
 * 解析 var() / color-mix() / rgba 直值，计算文本色令牌对 --bg 的 WCAG 对比度。
 *
 * 验收标准（§10 对比度验收表）：
 *   - 正文类（--text / --text2 / --text3 / --highlight / --gold-sem / --metric-val）≥ 4.5:1
 *   - 主色文字（--primary：编号 / 激活态 / 焦点——装饰与大字豁免）≥ 3:1
 *
 * 用法：
 *   node tools/check-contrast.mjs            # 输出报告，超阈值退出码 0（仅提示）
 *   node tools/check-contrast.mjs --strict   # 低于阈值时退出码 1（CI 用）
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const TOKENS = fileURLToPath(new URL('../src/styles/tokens.css', import.meta.url));
const strict = process.argv.includes('--strict');

const BODY_MIN = 4.5;
const PRIMARY_MIN = 3.0;

/** 正文类令牌（超阈值即失败） */
const BODY_TOKENS = ['--text', '--text2', '--text3', '--text-bright', '--highlight', '--gold-sem', '--metric-val'];
/** 主色文字令牌（装饰/大字豁免位，≥3:1） */
const PRIMARY_TOKENS = ['--primary'];

function parseRgb(v) {
  v = v.trim();
  if (v === 'transparent') return [0, 0, 0, 0];
  if (v === 'white') return [255, 255, 255, 1];
  if (v === 'black') return [0, 0, 0, 1];
  if (v.startsWith('#')) {
    let h = v.slice(1);
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    if (h.length === 4) h = h.slice(0, 3).split('').map((c) => c + c).join('');
    if (h.length === 6) return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), 1];
    if (h.length === 8) return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), parseInt(h.slice(6, 8), 16) / 255];
    return null;
  }
  const m = v.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3]), m[4] === undefined ? 1 : Number(m[4])] : null;
}

/** 返回 str 中 openIdx 处 '(' 的匹配右括号索引 */
function findClosingParen(str, openIdx) {
  let depth = 0;
  for (let i = openIdx; i < str.length; i++) {
    if (str[i] === '(') depth++;
    else if (str[i] === ')') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/** 按顶层逗号分割（忽略括号内逗号） */
function splitTopLevel(str, sep) {
  const out = [];
  let depth = 0;
  let cur = '';
  for (const ch of str) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    if (ch === sep && depth === 0) {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

/** color-mix(in srgb, A p%, B q%) 预乘插值 → 非预乘还原（transparent 视为透明黑） */
function parseColorMix(v, resolve, depth) {
  const start = v.indexOf('color-mix(') + 10;
  const close = findClosingParen(v, start - 1);
  const inner = v.slice(start, close);
  const parts = splitTopLevel(inner, ',').map((s) => s.trim());
  if (parts.length < 3) throw new Error(`color-mix 解析失败: ${v}`);
  let aRaw = parts[1];
  let bRaw = parts[2];
  let pa = null;
  let pb = null;
  const ma = aRaw.match(/^(.*?)\s+(\d+(?:\.\d+)?)%$/);
  if (ma) { aRaw = ma[1]; pa = Number(ma[2]); }
  const mb = bRaw.match(/^(.*?)\s+(\d+(?:\.\d+)?)%$/);
  if (mb) { bRaw = mb[1]; pb = Number(mb[2]); }
  if (pa === null && pb === null) { pa = 50; pb = 50; }
  else if (pa === null) pa = 100 - pb;
  else if (pb === null) pb = 100 - pa;
  const A = resolve(aRaw, depth + 1);
  const B = resolve(bRaw, depth + 1);
  const r = (A[0] * A[3] * pa + B[0] * B[3] * pb) / 100;
  const g = (A[1] * A[3] * pa + B[1] * B[3] * pb) / 100;
  const b = (A[2] * A[3] * pa + B[2] * B[3] * pb) / 100;
  const a = (A[3] * pa + B[3] * pb) / 100;
  if (a <= 0) return [0, 0, 0, 0];
  return [r / a, g / a, b / a, a];
}

function makeResolver(tokens) {
  const cache = new Map();
  function resolve(value, depth = 0) {
    if (depth > 12) throw new Error(`令牌解析深度超限（疑似循环引用）: ${value}`);
    value = value.trim();
    if (cache.has(value)) return cache.get(value);
    let out = null;
    const varM = value.match(/^var\(([^)]+)\)$/);
    if (varM) {
      const name = varM[1].split(',')[0].trim();
      if (!(name in tokens)) throw new Error(`令牌未定义: ${name}`);
      out = resolve(tokens[name], depth + 1);
    } else if (value.includes('color-mix(')) {
      out = parseColorMix(value, resolve, depth);
    } else {
      out = parseRgb(value);
    }
    if (!out) throw new Error(`无法解析颜色值: ${value}`);
    cache.set(value, out);
    return out;
  }
  return resolve;
}

function composite(fg, bg) {
  const a = fg[3];
  return [fg[0] * a + bg[0] * (1 - a), fg[1] * a + bg[1] * (1 - a), fg[2] * a + bg[2] * (1 - a)];
}

function luminance([r, g, b]) {
  const f = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function contrast(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** 提取令牌块（:root / [data-theme="cw"]）：先剥离注释避免干扰，跳过无底色的局部覆盖块 */
function extractBlocks(css) {
  const noComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const blocks = new Map();
  for (const m of noComments.matchAll(/(:root|\[data-theme="cw"\])\s*\{([^{}]*)\}/g)) {
    const tokens = {};
    for (const line of m[2].split(';')) {
      const mm = line.match(/^\s*(--[\w-]+):\s*(.+?)\s*$/);
      if (mm) tokens[mm[1]] = mm[2].trim();
    }
    const key = m[1].trim();
    // :root 可出现多次（局部覆盖块），同主题合并（后者覆盖前者，符合级联语义）
    blocks.set(key, { ...(blocks.get(key) || {}), ...tokens });
  }
  return blocks;
}

const css = readFileSync(TOKENS, 'utf8');
const blocks = extractBlocks(css);
const rootTokens = blocks.get(':root') || {};
let failures = 0;

for (const [theme, tokens] of blocks) {
  if (!tokens['--bg']) continue; // 跳过无底色的局部 :root 覆盖块
  // 非 :root 块（CW）继承 :root 基底：CSS 变量级联语义
  const scope = theme === ':root' ? tokens : { ...rootTokens, ...tokens };
  const resolve = makeResolver(scope);
  const bg = composite(resolve(tokens['--bg']), [0, 0, 0, 1]);
  console.log(`\n════ ${theme}（底色 ${tokens['--bg']}） ════`);
  for (const name of [...BODY_TOKENS, ...PRIMARY_TOKENS]) {
    if (!(name in tokens)) continue;
    const fg = composite(resolve(tokens[name]), bg);
    const ratio = contrast(fg, bg);
    const isPrimary = PRIMARY_TOKENS.includes(name);
    const min = isPrimary ? PRIMARY_MIN : BODY_MIN;
    const ok = ratio >= min;
    if (!ok && strict) failures++;
    console.log(
      `  ${ok ? '✅' : (strict ? '❌' : '⚠')} ${name.padEnd(16)} ${ratio.toFixed(2).padStart(5)}:1  ${ok ? '' : `低于 ${min}:1`}`,
    );
  }
}

console.log(`\n验收线：正文 ≥${BODY_MIN}:1 / 主色文字（编号·激活·焦点，装饰豁免）≥${PRIMARY_MIN}:1`);
console.log(failures ? `发现 ${failures} 处对比度不达标` : '全部令牌对比度达标 ✓');
if (strict && failures) process.exit(1);