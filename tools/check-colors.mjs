import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = fileURLToPath(new URL('../src', import.meta.url));
const EXT = new Set(['.css', '.vue', '.ts']);
const strict = process.argv.includes('--strict');

const SKIP_FILE = /(^|[\\/])(__tests__|theme\.ts)|(^|[\\/])debug([\\/]|$)/;

const NEUTRAL_DELTA = 4;

const LEGIT_RE =
  /transparent|currentColor|inherit|initial|unset|revert|\b(white|black)\b/i;

const COLOR_RE = /#[\da-fA-F]{3,8}\b|rgba?\([^)]*\)/g;

function parseRgb(v) {
  if (v.startsWith('#')) {
    const h = v.slice(1);
    const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.length === 4 ? h.slice(0, 3).split('').map((c) => c + c).join('') : h;
    if (full.length < 6) return null;
    return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
  }
  const m = v.match(/rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

function isNeutral(v) {
  const rgb = parseRgb(v);
  if (!rgb) return false;
  return Math.abs(rgb[0] - rgb[1]) <= NEUTRAL_DELTA && Math.abs(rgb[1] - rgb[2]) <= NEUTRAL_DELTA;
}

function checkLine(line) {
  const hits = [];
  let code = line.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/, '');
  code = code.replace(/color-mix\([^)]*\)/g, '');
  code = code.replace(/var\(([^)]+)\)/g, (m, inner) => {
    const parts = inner.split(',');
    if (parts.length >= 2) {
      const fb = parts.slice(1).join(',').trim();
      for (const mm of fb.matchAll(COLOR_RE)) {
        const v = mm[0].trim();
        if (LEGIT_RE.test(v) || isNeutral(v)) continue;
        hits.push(`var() fallback: ${v}`);
      }
    }
    return '';
  });
  for (const m of code.matchAll(COLOR_RE)) {
    const v = m[0].trim();
    if (LEGIT_RE.test(v) || isNeutral(v)) continue;
    hits.push(v);
  }
  return hits;
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (!['node_modules', 'dist', 'temp'].includes(name)) walk(p, out);
    } else if (EXT.has(extname(p))) {
      out.push(p);
    }
  }
  return out;
}

let total = 0;
let filesWithIssues = 0;

for (const file of walk(SRC)) {
  const rel = relative(SRC, file).split(sep).join('/');
  if (SKIP_FILE.test(rel) || rel.startsWith('styles/tokens.css')) continue;

  const lines = readFileSync(file, 'utf8').split('\n');
  const hits = [];
  lines.forEach((line, i) => {
    for (const h of checkLine(line)) hits.push(`${i + 1}: ${h}`);
  });
  if (hits.length) {
    filesWithIssues++;
    total += hits.length;
    console.log(`\n${rel}`);
    for (const h of hits.slice(0, 12)) console.log(`  L${h}`);
    if (hits.length > 12) console.log(`  … 共 ${hits.length} 处`);
  }
}

console.log(`\n════════════════════════════════════`);
console.log(total ? `发现 ${total} 处裸色值（${filesWithIssues} 个文件）` : '全部色值均已收口为令牌 ✓');
if (strict && total) process.exit(1);
