/**
 * 色彩令牌收口检查器
 *
 * 扫描 src 下样式/视图/配置代码中的裸色值（hex / rgb / rgba），输出未收口清单。
 * 配合三层令牌体系使用（tokens.css：原始层 --ph-xxx / --gold-xxx、语义层 --primary 等、
 * 领域层 --rarity-xxx / --prop-xxx）。
 *
 * 豁免范围：
 * - tokens.css（令牌定义源）
 * - currency-*（CW 专属文件，保留暗金/紫色点缀，待后续迁移）
 * - debug 诊断文件（分析用色）
 * - 黑/白/底色（rgba(15,15,35) 系等历史沉淀，不随主题）
 * - CSS 变量引用 var()、color-mix()、transparent 等关键词
 *
 * 用法：
 *   node tools/check-colors.mjs            # 报告模式（退出码恒 0）
 *   node tools/check-colors.mjs --strict   # 有裸色值时退出码 1（CI 用）
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = fileURLToPath(new URL('../src', import.meta.url));
const EXT = new Set(['.css', '.vue', '.ts']);
const strict = process.argv.includes('--strict');

/** 跳过整个文件（CW 专属 / debug 诊断 / 令牌源 / 测试） */
const SKIP_FILE = /(^|[\\/])(currency-|SpineAudit|SpineDebug|__tests__)/;

/** 合法的色值形态：变量引用、color-mix、关键词 */
const LEGIT_RE =
  /transparent|currentColor|inherit|initial|unset|revert|\b(white|black)\b/i;

const COLOR_RE = /#[\da-fA-F]{3,8}\b|rgba?\([^)]*\)/g;

/** hex / rgb → [r,g,b] */
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

/** 近灰判定：三分量接近即视为中性色（黑/白/灰阶/深色底，不随主题，豁免） */
function isNeutral(v) {
  const rgb = parseRgb(v);
  if (!rgb) return false;
  return Math.abs(rgb[0] - rgb[1]) <= 25 && Math.abs(rgb[1] - rgb[2]) <= 25;
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
    // 行内注释剥离（保留引号内字符串，如 ts 配置的 color 字段）
    let code = line.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/, '');
    // 剥离 var() / color-mix() 调用（含 fallback 色值），只检查真正的裸色值
    code = code.replace(/color-mix\([^)]*\)/g, '').replace(/var\([^)]*\)/g, '');
    for (const m of code.matchAll(COLOR_RE)) {
      const v = m[0].trim();
      if (LEGIT_RE.test(v) || isNeutral(v)) continue;
      hits.push(`${i + 1}: ${v}`);
    }
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
