#!/usr/bin/env node
/**
 * memory 日志维护（对应 AGENTS.md「文档体量红线」与 conventions.md「文档体量」节）：
 *   ① strip —— 删除「验证数字」bullet（规则：验证数字进 commit message，不进 memory）；
 *   ② tldr  —— 文件头插入带锚点的 TL;DR 索引；
 *   ③ split —— 超限的月度日志按时序分片为 p1/p2…，原文件改为月内总索引（TL;DR + 分片链接）。
 *
 * 用法：
 *   node tools/tidy-memory.mjs strip <file.md> ...        # ①+②（单文件，未超限时）
 *   node tools/tidy-memory.mjs split <file.md> [--max-kb 65]  # ③（超限时；默认 65KB≈5 万 token 中文口径）
 *   node tools/tidy-memory.mjs --dry-run ...              # 任一子命令加 --dry-run 只预览
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, basename, extname } from 'node:path';

const dryRun = process.argv.includes('--dry-run');
const maxKB = (() => {
  const i = process.argv.indexOf('--max-kb');
  return i > 0 ? Number(process.argv[i + 1]) : 65;
})();
// 位置参数 = 子命令 + .md 文件路径（跳过 --flag 及其取值）
const args = process.argv.filter((a, i, arr) => {
  if (a.startsWith('--')) return false;
  const prev = arr[i - 1];
  return !(prev === '--max-kb');
});
const cmd = args[2];

/** GitHub 风格锚点（github-slugger 同算法；VSCode 预览 / GitHub 渲染一致） */
function slug(heading) {
  return heading
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-');
}

/** 待删除的 bullet 判据：标签为 验证/验收/独立验证（括号补充说明允许）；验证法/取证方法等可复用方法论保留 */
const STRIP = /^- \*\*(?:独立验证|验证|验收)(?:[（(][^）)]*[）)])?\*\*[：:]/;

/** 去掉此前插入的 TL;DR 块：索引说明行 + 首个 ## 之前的所有 "- [" 锚点行（保留合并说明等其他前言） */
function stripTldr(text) {
  const lines = text.split('\n');
  const firstSection = lines.findIndex((l) => /^## /.test(l));
  const bound = firstSection === -1 ? lines.length : firstSection;
  return lines
    .filter((l, i) => {
      if (i >= bound) return true;
      if (l.includes('> 本节为 TL;DR 索引') || l.includes('> 本节为分片索引')) return false;
      if (/^- \[/.test(l)) return false;
      return true;
    })
    .join('\n');
}

/** 拆出 (H1, 前言剩余, sections[{title, body}])；前言 = H1 与首个 ## 之间的非 TL;DR 内容 */
function parse(text) {
  const lines = text.split('\n');
  const h1i = lines.findIndex((l) => /^# /.test(l));
  if (h1i === -1) throw new Error('无 H1');
  const sections = [];
  let cur = null;
  let firstSectionLine = -1;
  for (let i = h1i + 1; i < lines.length; i += 1) {
    const m = /^## (.+)$/.exec(lines[i]);
    if (m) {
      if (cur) sections.push(cur);
      if (firstSectionLine === -1) firstSectionLine = i;
      cur = { title: m[1].trim(), body: [lines[i]] };
    } else if (cur) {
      cur.body.push(lines[i]);
    }
  }
  if (cur) sections.push(cur);
  const preamble = firstSectionLine === -1 ? lines.slice(h1i + 1) : lines.slice(h1i + 1, firstSectionLine);
  return { h1: lines[h1i], preamble, sections };
}

function sectionAnchor(title, used) {
  let a = slug(title);
  const n = used.get(a) ?? 0;
  used.set(a, n + 1);
  return n > 0 ? `${a}-${n}` : a;
}

function stripFile(rel) {
  const src = readFileSync(rel, 'utf8');
  const kept = [];
  let removed = 0;
  for (const line of src.split('\n')) {
    if (STRIP.test(line)) { removed += 1; continue; }
    kept.push(line);
  }
  const used = new Map();
  const tldr = [];
  for (const line of kept) {
    const m = /^## (.+)$/.exec(line);
    if (!m) continue;
    const a = sectionAnchor(m[1].trim(), used);
    if (a) tldr.push(`- [${m[1].trim()}](#${a})`);
  }
  const out = [...kept];
  let h1 = out.findIndex((l) => /^# /.test(l));
  let at = h1 + 1;
  while (at < out.length && out[at].trim() === '') at += 1;
  out.splice(at, 0, '', '> 本节由 `tools/tidy-memory.mjs` 维护：TL;DR 索引（定位靠它，勿整读）。', '', ...tldr);
  const result = out.join('\n');
  console.log(`${rel}: 删除验证 bullet ${removed}；TL;DR ${tldr.length} 条；${(Buffer.byteLength(src) / 1024).toFixed(0)} → ${(Buffer.byteLength(result) / 1024).toFixed(0)} KB`);
  if (!dryRun) writeFileSync(rel, result, 'utf8');
}

function splitFile(rel) {
  const src = stripTldr(readFileSync(rel, 'utf8'));
  const { h1, preamble, sections } = parse(src);
  const dir = dirname(rel);
  const base = basename(rel, extname(rel)); // 2026-10

  // 幂等保护：split 的输入必须是「含正文小节」的日志源。若传入的已是生成出来的总索引
  // （正文小节已搬进分片，此文件只剩「### 分片 N/M」+ 链接），再跑一次会把索引压成空壳，
  // 142 条小节锚点全丢。此处直接拒绝，并提示正确的重建路径。
  const partAlready = readdirSync(dir).some((n) => new RegExp(`^${base}-p\\d+\\.md$`).test(n));
  if (partAlready && sections.length < 5) {
    console.error(`✗ ${rel} 看起来已经是总索引（${sections.length} 节），且 ${base}-p*.md 分片已存在。`);
    console.error(`  再跑 split 会丢弃索引里的分片小节锚点。`);
    console.error(`  要重建索引：把日志正文追加到对应分片（${base}-p8.md 等）后，让 split 从**日志源**跑；`);
    console.error(`  或先删掉分片再对「含正文的源文件」跑一次。`);
    process.exit(1);
  }

  // 均衡分片：先按字节算片数，再按均值贪切（避免末片过小）
  const total = Buffer.byteLength(src);
  const nChunks = Math.max(1, Math.ceil(total / (maxKB * 1024)));
  const target = total / nChunks;
  const chunks = [];
  let cur = { bytes: 0, sections: [] };
  for (const s of sections) {
    const b = Buffer.byteLength(s.body.join('\n'));
    const remainingChunks = nChunks - chunks.length;
    // 已超目标 1.15 倍且还有分片名额时切片；否则继续累积
    if (cur.sections.length > 0 && remainingChunks > 1 && cur.bytes + b > target * 1.15) {
      chunks.push(cur);
      cur = { bytes: 0, sections: [] };
    }
    cur.bytes += b;
    cur.sections.push(s);
  }
  if (cur.sections.length) chunks.push(cur);

  // 末片再均衡：末片不足目标一半时，把末两片合并后均分（避免拖一个过小的尾巴）
  while (chunks.length >= 2 && chunks[chunks.length - 1].bytes < target * 0.5) {
    const tail = chunks.splice(chunks.length - 2, 2);
    const merged = tail.flatMap((c) => c.sections);
    const half = tail[0].bytes + tail[1].bytes;
    const halfChunks = [{ bytes: 0, sections: [] }, { bytes: 0, sections: [] }];
    for (const s of merged) {
      const b = Buffer.byteLength(s.body.join('\n'));
      const pick = halfChunks[0].bytes + b <= half / 2 ? 0 : 1;
      halfChunks[pick].bytes += b;
      halfChunks[pick].sections.push(s);
    }
    chunks.push(...halfChunks);
  }

  // 写分片
  const partNames = [];
  chunks.forEach((chunk, idx) => {
    const n = idx + 1;
    const partName = `${base}-p${n}.md`;
    partNames.push(partName);
    const first = chunk.sections[0].title;
    const last = chunk.sections[chunk.sections.length - 1].title;
    const head = [
      h1,
      '',
      `> 本文件是 [${base}.md](${base}.md) 月度复盘的分片 ${n}/${chunks.length}（${chunk.sections.length} 节，${(chunk.bytes / 1024).toFixed(0)} KB，按时序）。`,
      `> 覆盖：${first} … ${last}`,
      '',
    ];
    const content = [
      ...head,
      ...chunk.sections.flatMap((s) => [...s.body, '']),
    ].join('\n');
    console.log(`  ${partName}: ${chunk.sections.length} 节，${(chunk.bytes / 1024).toFixed(0)} KB`);
    if (!dryRun) writeFileSync(join(dir, partName), content, 'utf8');
  });

  // 原文件改写为月内总索引（前言 + TL;DR + 分片链接）
  const used = new Map();
  const lines = [h1, '', ...preamble.filter((l) => l.trim() !== ''), ''];
  lines.push(`> 本节为 ${base} 月度复盘的总索引（由 \`tools/tidy-memory.mjs split\` 维护，共 ${sections.length} 节 / ${chunks.length} 个分片）。**勿整读**：先在此定位小节，再开对应分片。`, '');
  chunks.forEach((chunk, idx) => {
    const partName = partNames[idx];
    lines.push(`### 分片 ${idx + 1}/${chunks.length}：[${partName}](${partName})（${chunk.sections.length} 节）`, '');
    for (const s of chunk.sections) {
      const a = sectionAnchor(s.title, used);
      lines.push(a ? `- [${s.title}](${partName}#${a})` : `- ${s.title}`);
    }
    lines.push('');
  });
  const index = lines.join('\n');
  console.log(`${rel} → 总索引 ${(Buffer.byteLength(index) / 1024).toFixed(0)} KB + ${chunks.length} 分片`);
  if (!dryRun) {
    writeFileSync(rel, index, 'utf8');
    // 清掉旧的单文件残留（若此前生成过 *-p*.md 之外的临时文件不处理；分片已在上面覆写）
  }
}

if (cmd === 'strip') {
  for (const f of args.slice(3)) stripFile(f);
} else if (cmd === 'split') {
  for (const f of args.slice(3)) {
    if (!existsSync(f)) { console.error(`✗ 不存在 ${f}`); process.exit(1); }
    console.log(`split ${f}（max ${maxKB} KB/片）:`);
    splitFile(f);
  }
} else {
  console.error('用法: node tools/tidy-memory.mjs strip <file.md> ... | split <file.md> [--max-kb N] [--dry-run]');
  process.exit(1);
}
