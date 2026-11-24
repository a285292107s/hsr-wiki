import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = fileURLToPath(new URL('../src', import.meta.url));
const EXT = new Set(['.vue', '.ts']);
const strict = process.argv.includes('--strict');

const EXEMPT = /(^|[\\/])(__tests__)([\\/]|$)|lib[\\/]image\.ts|app[\\/]components[\\/]CdnImage\.vue|services[\\/]cdn[\\/]/;

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

function stripComments(line) {
  return line.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/, '');
}

function checkLine(line) {
  const code = stripComments(line);
  const hits = [];

  if (/<img\b(?![^>]*\bv-bind=)/.test(code) && /\b:src\s*=|\bsrc\s*=|\bdata-cdn-src\s*=/.test(code)) {
    hits.push('裸 <img src/data-cdn-src>（应走 image 模块的 imgAttrs/imgHtml/CdnImage）');
  }
  if (/backgroundImage\s*:\s*`?\s*url\(/.test(code)) {
    hits.push('裸 background-image url()（应走 image 模块的 bgStyle/bgVar）');
  }
  if (/@error\s*=\s*"[^"]*\$event\.target[^\n]*\.src\s*=/.test(code)) {
    hits.push('内联 @error 改 src（应走 image 模块的 swapImgOnError/markImgError/hideImgOnError）');
  }
  if (/\bnew\s+Image\s*\(/.test(code)) {
    hits.push('new Image() 私自加载（应走 image 模块）');
  }
  return hits;
}

let total = 0;
let filesWithIssues = 0;

for (const file of walk(SRC)) {
  const rel = relative(SRC, file).split(sep).join('/');
  if (EXEMPT.test(rel)) continue;

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

console.log(`\n════════════════════════════════════════════════════════════════════════`);
console.log(total ? `发现 ${total} 处私自图片加载（${filesWithIssues} 个文件）` : '全部图片加载均已收口到 image 模块 ✓');
if (strict && total) process.exit(1);
