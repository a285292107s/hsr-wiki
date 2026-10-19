#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, relative, sep } from 'node:path';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const SRC = join(ROOT, 'src');
const HAN = /[\u4e00-\u9fff]/;
const LIST_ONLY = process.argv.includes('--list');

const LINE_ALLOW = [
  /console\.(?:warn|error|info|log)\s*\(/,
  /\b(?:throw\s+)?new\s+(?:NkError|Error)\s*\(/,
  /CN_ORDINAL/,
  /\/[^/\n]*[\u4e00-\u9fff][^/\n]*\//,
];

const FILE_ALLOW = new Map([
  ['src/lib/i18n/locales.ts', '语言选择器的母语自称与数制单位字形'],
  ['src/lib/constants.ts', 'SITE_NAME 品牌名与「中文技能名 → 枚举」解析表'],
  ['src/spine/', 'spine 渲染诊断文本（console / 研究线）'],
]);

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
