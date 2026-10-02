#!/usr/bin/env node
/**
 * ADR 索引与互指一致性检查（report-only）。
 * 用法：node tools/check-adr-index.mjs [--strict] [--verbose]
 * 校验 docs/adr/README.md 索引表 ↔ docs/adr/NNNN-*.md：编号双向、标题、Status 前缀（front-matter 优先），
 * 以及「修订 NNNN / 被 NNNN 修订」双向指针。标题比对为启发式（忽略括号内容与标点，字距相似度兜底）。
 * 退出码：默认恒 0（只报告）；--strict 有漂移退出 1。
 * 硬约束：只用 node 内置模块；只读不改写；裸四位编号只认已知 ADR 号（避免把赛季号 30xx 当引用）。
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const ADR_REL = 'docs/adr';
const ADR_DIR = join(ROOT, 'docs', 'adr');
const strict = process.argv.includes('--strict');

/** 表示「谁修订谁」的动词；两侧方向由引用与动词的相对位置决定 */
const VERBS = ['修订', '推翻', '取代', '修正', '承接', '补全', '移除', '下线'];
/** 回指行需同时出现的引导词与动词 */
const POINTER_LEAD = /[被由见]/;
const POINTER_VERB = /修订|推翻|取代|修正|承接|补全|移除|下线|作废|失效/;

const drift = []; // { file, line, kind, msg }
const add = (file, line, kind, msg) => drift.push({ file, line, kind, msg });

/* ═══ README 索引表 ═══ */
const readmeRel = posix.join(ADR_REL, 'README.md');
const readmeLines = readFileSync(join(ROOT, readmeRel), 'utf8').split(/\r?\n/);
const rows = new Map(); // num → { num, title, status, line }
const reserved = new Set(); // README 前言声明已删除、明文不复用的编号
for (const [i, line] of readmeLines.entries()) {
  const m = line.match(/^\|\s*(\d{4})\s*\|/);
  if (m) {
    const cells = line.split('|').map((s) => s.trim());
    rows.set(m[1], { num: m[1], title: cells[2] || '', status: cells[3] || '', line: i + 1 });
  } else if (line.includes('编号')) {
    for (const r of line.matchAll(/编号\s*(\d{4})/g)) reserved.add(r[1]);
  }
}

/* ═══ ADR 文件 ═══ */
const parseFrontMatter = (text) => {
  if (!text.startsWith('---')) return { fm: {}, body: text };
  const end = text.indexOf('\n---', 3);
  if (end < 0) return { fm: {}, body: text };
  const fm = {};
  for (const line of text.slice(3, end).split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z_-]+)\s*:\s*(.+)$/);
    if (m) fm[m[1].toLowerCase()] = m[2].trim();
  }
  return { fm, body: text.slice(end + 4) };
};

const stripTitlePrefix = (s) =>
  s.replace(/^#\s*/, '').replace(/^ADR[-\s]*\d{4}\s*[:：.]\s*/i, '').replace(/^\d{4}\s*[.、:：]\s*/, '').trim();

const statusOf = (fm, body) => {
  if (fm.status) return fm.status.replace(/[`*]/g, '').trim();
  const sec = body.match(/##\s*状态\s*\n([\s\S]*?)(?=\n##\s|$)/);
  if (sec) {
    const quoted = sec[1].match(/`([A-Za-z][A-Za-z-]*)`/);
    if (quoted) return quoted[1];
    const bold = sec[1].match(/\*\*Status\*\*\s*[:：]\s*([A-Za-z][A-Za-z-]*)/i);
    if (bold) return bold[1];
  }
  const any = body.match(/\*\*Status\*\*\s*[:：]\s*([A-Za-z][A-Za-z-]*)/i);
  return any ? any[1] : '';
};

const files = new Map(); // num → { num, rel, title, status, line, text }
const duplicated = new Map(); // num → [rel]
for (const name of readdirSync(ADR_DIR)) {
  const m = name.match(/^(\d{4})-(.+)\.md$/);
  if (!m) continue;
  const rel = posix.join(ADR_REL, name);
  if (!duplicated.has(m[1])) duplicated.set(m[1], []);
  duplicated.get(m[1]).push(rel);
  const text = readFileSync(join(ADR_DIR, name), 'utf8');
  const { fm, body } = parseFrontMatter(text);
  const h1 = body.split(/\r?\n/).find((l) => /^#\s+\S/.test(l)) || '';
  const title = fm.title ? fm.title.replace(/[`*]/g, '').trim() : stripTitlePrefix(h1);
  const text2 = text.split(/\r?\n/);
  files.set(m[1], {
    num: m[1],
    rel,
    title,
    status: statusOf(fm, body),
    line: text2.findIndex((l) => /^#\s+\S/.test(l)) + 1 || 1,
    statusLine: Math.max(1, text2.findIndex((l) => /\*\*Status\*\*/.test(l) || /^status\s*:/.test(l)) + 1),
    fm: fm.status ? true : false,
    text,
  });
}

const known = new Set([...rows.keys(), ...files.keys(), ...reserved]);

/* ═══ 编号 ↔ 文件 ↔ 索引行 ═══ */
for (const [num, list] of duplicated) {
  if (list.length > 1) {
    for (const rel of list) add(rel, 0, '编号重复', `编号 ${num} 有 ${list.length} 个文件：${list.join('、')}（文件名以「编号-标题」唯一）`);
  }
}
for (const [num, row] of rows) {
  if (!files.has(num) && !reserved.has(num)) {
    add(readmeRel, row.line, '索引行无文件', `索引行 ${num} 在 docs/adr/ 下无对应 NNNN-*.md`);
  }
}
for (const [num, f] of files) {
  if (!rows.has(num)) add(f.rel, f.line, '文件无索引行', `文件 ${num} 未登记进 README 索引表`);
}

/** 标题启发式：去括号/标点后包含或 bigram Dice ≥0.5 */
const normalizeTitle = (s) =>
  s
    .replace(/[（(][^（()）]*[)）]/g, '')
    .replace(/[`*_]/g, '')
    .replace(/[\s·、，,。.:：;；/／|—\-–]+/g, '')
    .toLowerCase();
const dice = (a, b) => {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;
  const grams = (s) => {
    const set = new Set();
    for (let i = 0; i < s.length - 1; i++) set.add(s.slice(i, i + 2));
    return set;
  };
  const A = grams(a);
  const B = grams(b);
  let inter = 0;
  for (const g of A) if (B.has(g)) inter++;
  return (2 * inter) / (A.size + B.size);
};
for (const [num, row] of rows) {
  const f = files.get(num);
  if (!f || !f.title) continue;
  const a = normalizeTitle(row.title);
  const b = normalizeTitle(f.title);
  if (!a || !b) continue;
  const ok = a === b || a.includes(b) || b.includes(a) || dice(a, b) >= 0.5;
  if (!ok) add(readmeRel, row.line, '标题不一致', `索引「${row.title}」/ 文件「${f.title}」（相似度 ${dice(a, b).toFixed(2)}）`);
}
for (const [num, row] of rows) {
  const f = files.get(num);
  if (!f || !f.status) continue;
  const rowPrefix = (row.status.match(/^([A-Za-z][A-Za-z-]*)/) || [])[1] || '';
  if (!rowPrefix) {
    add(readmeRel, row.line, 'Status 缺失', `索引行 ${num} 的 Status 单元格没有英文状态前缀`);
  } else if (rowPrefix.toLowerCase() !== f.status.toLowerCase()) {
    add(readmeRel, row.line, 'Status 不一致', `索引「${rowPrefix}」/ 文件「${f.status}」`);
  }
}

/* ═══ 修订互指 ═══ */
const refsIn = (line) => {
  const out = [];
  const re = /\[ADR\s*(\d{4})\]|\[(\d{4})\]\(|(?<![\d])(\d{4})(?![\d])/g;
  for (const m of line.matchAll(re)) {
    const num = m[1] ?? m[2] ?? m[3];
    if (!(m[1] || m[2]) && !known.has(num)) continue; // 裸编号只认已知 ADR 号
    out.push({ num, index: m.index });
  }
  return out;
};
const mentions = (text, num) => new RegExp(`(?<![0-9])${num}(?![0-9])`).test(text);

/** edges: key `newer>older` → { newer, older, where }；动词后的引用归「本文修订」，被/由引导的引用归「引用修订本文」 */
const edges = new Map();
const collect = (ownerRel, lines, ownerOf) => {
  lines.forEach((line, i) => {
    const ownerNum = ownerOf(line, i);
    const refs = refsIn(line);
    if (ownerNum === null || !refs.length) return;
    for (const verb of VERBS) {
      for (let idx = line.indexOf(verb); idx >= 0; idx = line.indexOf(verb, idx + verb.length)) {
        const verbEnd = idx + verb.length;
        for (const r of refs) {
          if (r.num === ownerNum) continue;
          let newer = null;
          if (r.index >= verbEnd && r.index - verbEnd <= 24) {
            const between = line.slice(verbEnd, r.index);
            // 越过「）。；」即进入新子句，其引用不属于本动词
            if (!/[）)；;]/.test(between)) newer = /[见被由]/.test(between) ? r.num : ownerNum;
          } else if (r.index < idx && idx - r.index <= 20) {
            const between = line.slice(r.index, idx);
            if (/[被由]/.test(between) || /^[\s决策\d/、，,；;:：的]*$/.test(between)) newer = r.num;
          }
          if (!newer) continue;
          const older = newer === ownerNum ? r.num : ownerNum;
          if (newer === older) continue;
          const key = `${newer}>${older}`;
          if (!edges.has(key)) edges.set(key, { newer, older, where: `${ownerRel}:${i + 1}` });
        }
      }
    }
  });
};
collect(readmeRel, readmeLines, (line) => {
  const m = line.match(/^\|\s*(\d{4})\s*\|/);
  return m ? m[1] : null; // 表格行才是索引条目，前言/表头不产生修订边
});
for (const [num, f] of files) collect(f.rel, f.text.split(/\r?\n/), () => num);

const acknowledged = (olderNum, newerNum) => {
  const lines = [
    ...(files.has(olderNum) ? files.get(olderNum).text.split(/\r?\n/) : []),
    ...(rows.has(olderNum) ? [readmeLines[rows.get(olderNum).line - 1]] : []),
  ];
  return lines.some((l) => POINTER_LEAD.test(l) && POINTER_VERB.test(l) && mentions(l, newerNum));
};

for (const e of edges.values()) {
  const holder = files.get(e.older);
  const holderRel = holder ? holder.rel : rows.has(e.older) ? readmeRel : null;
  if (!holderRel) {
    if (!reserved.has(e.older)) add(e.where, 0, '编号悬空', `${e.newer} 声明修订 ${e.older}，但 ${e.older} 既无文件也无索引行`);
    continue;
  }
  if (!acknowledged(e.older, e.newer)) {
    add(holderRel, holder ? holder.statusLine : rows.get(e.older).line, '单向指针',
      `${e.newer} 声明修订 ${e.older}（${e.where}），但 ${e.older} 未回指「被 ${e.newer} 修订」`);
  }
}

/* ═══ 报告 ═══ */
const B = (s) => `\x1b[1m${s}\x1b[0m`;
const byKind = (k) => drift.filter((d) => d.kind === k);
const indexDrift = drift.filter((d) => ['索引行无文件', '编号重复', '文件无索引行', '标题不一致', 'Status 不一致', 'Status 缺失'].includes(d.kind));
const linkDrift = drift.filter((d) => ['单向指针', '编号悬空'].includes(d.kind));

console.log(B(`\n[ADR 索引检查] 索引行 ${rows.size}｜ADR 文件 ${files.size}｜修订边 ${edges.size}｜漂移 ${drift.length}\n`));
const printList = (title, list) => {
  if (!list.length) return;
  console.log(B(title));
  for (const d of list) console.log(`  ${d.line ? `${d.file}:${d.line}` : d.file}  ${d.msg}`);
  console.log('');
};
printList('── 索引 ↔ 文件（编号 / 标题 / Status） ──', indexDrift);
printList('── 正文互指（修订 NNNN / 被 NNNN 修订） ──', linkDrift);
if (process.argv.includes('--verbose')) {
  console.log(B('── 已识别的修订边（--verbose） ──'));
  for (const e of [...edges.values()].sort((a, b) => a.newer.localeCompare(b.newer))) {
    console.log(`  ${e.newer} → 修订 ${e.older}  【声明处 ${e.where}】`);
  }
  console.log('');
}

const fail = indexDrift.length + linkDrift.length;
if (!fail) console.log('[PASS] 索引、标题、Status 与修订互指全部一致\n');
else {
  console.log(`[FAIL] 漂移 ${fail} 条（索引 ${indexDrift.length} + 互指 ${linkDrift.length}）`);
  if (byKind('单向指针').length) console.log('       单向指针修法：在旧 ADR 的「状态」段补一行「被 NNNN 修订（见 [NNNN](NNNN-*.md)）」，或在其索引行 Status 单元格补「被 NNNN 修订」');
  console.log('');
}
process.exit(strict && fail ? 1 : 0);
