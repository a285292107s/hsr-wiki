#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './doc-scope.mjs';

const TARGET = 'docs/data/转换器字段映射.md';
const LINE_LIMIT = 400;
const CONTRACT_HEAD = '> 产物：';
const INDEX_ROW_RE = /^\|\s*`([^`\s]+)`\s*\|/;
const strict = process.argv.includes('--strict');

const B = (s) => `\x1b[1m${s}\x1b[0m`;
const clip = (s, n) => (s.length > n ? `${s.slice(0, n)}…` : s);

const rawLines = readFileSync(join(ROOT, TARGET), 'utf8').split(/\r?\n/);
const lines = rawLines.slice(0, rawLines.findLastIndex((l) => l !== '') + 1);
const physicalLines = rawLines.length - (rawLines.at(-1) === '' ? 1 : 0);

const headings = lines.flatMap((text, index) =>
  text.startsWith('## ') ? [{ index, lineNo: index + 1, text: text.slice(3).trim() }] : [],
);
const tokenOf = (title) => (title.match(/^[^\s—]+/) ?? [''])[0];
const h2Tokens = new Set(headings.map((h) => tokenOf(h.text)));

const longLines = lines.flatMap((text, index) =>
  text.length > LINE_LIMIT ? [{ lineNo: index + 1, width: text.length, preview: text.trim() }] : [],
);

const duplicateGroups = [...h2Tokens]
  .map((token) => ({ token, lineNos: headings.filter((h) => tokenOf(h.text) === token).map((h) => h.lineNo) }))
  .filter((g) => g.lineNos.length > 1);

const windowOf = (heading, nextHeading) => {
  const stop = nextHeading ? nextHeading.index : lines.length;
  return lines.slice(heading.index + 1, stop).filter((l) => l.trim() !== '').slice(0, 2);
};
const missingContracts = headings.filter(
  (h, i) => !windowOf(h, headings[i + 1]).some((l) => l.startsWith(CONTRACT_HEAD)),
);

const preamble = lines.slice(0, headings.length ? headings[0].index : lines.length);
const indexTokens = new Set(preamble.flatMap((l) => l.match(INDEX_ROW_RE)?.slice(1) ?? []));
const indexMissingTable = indexTokens.size === 0;
const notInIndex = [...h2Tokens].filter((t) => !indexTokens.has(t));
const notInHeadings = [...indexTokens].filter((t) => !h2Tokens.has(t));

const hits =
  longLines.length + duplicateGroups.length + missingContracts.length +
  (indexMissingTable ? 1 : 0) + notInIndex.length + notInHeadings.length;

console.log(B(`\n[字段映射结构检查] ${TARGET}｜物理行 ${physicalLines}｜H2 ${headings.length} 节（token ${h2Tokens.size} 个）｜超长单行 ${longLines.length}｜重复模块 ${duplicateGroups.length} 组｜缺契约行 ${missingContracts.length} 节｜索引表问题 ${(indexMissingTable ? 1 : 0) + notInIndex.length + notInHeadings.length} 条\n`));

if (longLines.length) {
  console.log(B(`── ① 单行超长（>${LINE_LIMIT} 字符，目标 0 条） ──`));
  for (const l of longLines) console.log(`  L${l.lineNo}  ${l.width} 字符  ${clip(l.preview, 60)}`);
  console.log('  改法：把该行拆成父 bullet 一句 + 子 bullet 分点，语义不删\n');
}

if (duplicateGroups.length) {
  console.log(B('── ② H2 重复（同一模块只保留一个 H2） ──'));
  for (const g of duplicateGroups) console.log(`  ${g.token}  ${g.lineNos.map((n) => `L${n}`).join(' / ')}`);
  console.log('  改法：同模块合并为一节，或把次要主题并入父节下的子 bullet\n');
}

if (missingContracts.length) {
  console.log(B('── ③ 缺契约行（H2 后前 2 个非空行内无 `> 产物：… ｜ 源：…`） ──'));
  for (const h of missingContracts) console.log(`  L${h.lineNo}  ## ${clip(h.text, 64)}`);
  console.log('  改法：在 H2 下紧邻补一行 `> 产物：<输出 JSON 字段/文件> ｜ 源：<表/字段>`（后半段可省）\n');
}

if (indexMissingTable || notInIndex.length || notInHeadings.length) {
  console.log(B('── ④ 索引表 ↔ 小节 token 不一致 ──'));
  if (indexMissingTable) console.log(`  文首（第一个 H2 之前）无模块索引表：应有形如 | \`<token>\` | … | 的表行`);
  if (notInIndex.length) console.log(`  仅出现在 H2、未登记索引（${notInIndex.length}）：${notInIndex.join('、')}`);
  if (notInHeadings.length) console.log(`  仅出现在索引、无对应 H2（${notInHeadings.length}）：${notInHeadings.join('、')}`);
  console.log('  token = `## ` 之后至第一个空格或 `—` 之前的连续非空格串（如 characters.py / release_version）\n');
}

if (hits === 0) {
  console.log('[PASS] 四项结构检查全部通过\n');
} else if (strict) {
  console.log(`[FAIL] --strict：共 ${hits} 条命中（超长单行 ${longLines.length} / 重复模块 ${duplicateGroups.length} / 缺契约行 ${missingContracts.length} / 索引表问题 ${(indexMissingTable ? 1 : 0) + notInIndex.length + notInHeadings.length}）\n`);
} else {
  console.log(`[REPORT] 共 ${hits} 条命中，report-only 不阻塞（加 --strict 才退出 1）\n`);
}

process.exit(strict && hits > 0 ? 1 : 0);
