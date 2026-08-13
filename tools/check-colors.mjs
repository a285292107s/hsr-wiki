/**
 * 色彩令牌收口检查器（ADR 0012 规则豁免模式）
 *
 * 扫描 src 下样式/视图/配置代码中的裸色值（hex / rgb / rgba），输出未收口清单。
 * 配合三层令牌体系使用（tokens.css：原始层 --ph-* / --gold-* / --blk-*、语义层 --primary 等、
 * 领域层 --rarity-* / --prop-* / --cw-* 等）。
 *
 * 规则（ADR 0012）：
 * - 严格中性：三分量差 ≤4 才算中性（纯黑/白/灰阶）；假中性（如 rgba(15,15,35) 差 20）暴露
 * - var() fallback：fallback 内色值纳入检查（必须为中性或令牌引用，禁止裸彩色 fallback）
 * - SKIP_FILE 仅豁免 debug 诊断文件与测试（currency-* 已收编，不再豁免）
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

/** 跳过整个文件（debug 诊断色 / 测试数据 / 主题预览数据；视图合并后含 Spine*Section 面板） */
const SKIP_FILE = /(^|[\\/])(SpineKvSection|SpineAuditSection|SpineAuditDetail|SpineDebug|SpineAudit|__tests__|theme\.ts)/;

/* ═══ 豁免登记（ADR 0012 §3 三分类；变更须同步 ADR 引用） ═══
 * 1. 中性豁免：三分量差 ≤4 的灰阶/黑/白（含 SVG data URI 内联白——物理限制无法 var()）
 * 2. 领域色豁免：数据语义色已全部收编为领域层令牌
 *    （--rarity-* / --prop-* / --elem-* / --skill-* / --eg-* / --diff-* / --season-* /
 *      --cw-* / --crole-* / --ctrait-*），页面只允许 var() 引用，
 *    裸色值在 tokens.css 领域层唯一定义——本清单无裸色条目
 * 3. 导航语义豁免：首页网关入口卡（.nk-home-card--gateway）与交换按钮双色状态点——
 *    "金色=CW 模式"导航标识，实现已全部 var(--gold-*) 引用，此处登记设计意图防误修
 * 若未来确有无法令牌化的裸色值，必须在此登记（带理由 + ADR 引用），禁止静默豁免 */
const DOMAIN_EXEMPT = [];

/** 严格中性判定：三分量差 ≤4（纯黑/白/灰阶才豁免——ADR 0012） */
const NEUTRAL_DELTA = 4;

/** 合法的色值形态：关键词 */
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

/** 严格中性判定：三分量差 ≤NEUTRAL_DELTA（纯黑/白/灰阶；假中性暴露） */
function isNeutral(v) {
  const rgb = parseRgb(v);
  if (!rgb) return false;
  return Math.abs(rgb[0] - rgb[1]) <= NEUTRAL_DELTA && Math.abs(rgb[1] - rgb[2]) <= NEUTRAL_DELTA;
}

/**
 * 单行检查：
 * 1. 剥离注释与 color-mix()（color-mix 内部为令牌引用表达式）
 * 2. var() 段整体移除，但其 fallback 内色值单独校验（ADR 0012：fallback 必须中性或令牌）
 * 3. 剩余裸色值必须中性或 LEGIT 关键词
 */
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
