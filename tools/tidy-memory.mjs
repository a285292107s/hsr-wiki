#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, basename, extname } from 'node:path';

const dryRun = process.argv.includes('--dry-run');
const maxKB = (() => {
  const i = process.argv.indexOf('--max-kb');
  return i > 0 ? Number(process.argv[i + 1]) : 65;
})();
const args = process.argv.filter((a, i, arr) => {
  if (a.startsWith('--')) return false;
  const prev = arr[i - 1];
  return !(prev === '--max-kb');
});
const cmd = args[2];

function slug(heading) {
  return heading
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-');
}

const STRIP = /^- \*\*(?:独立验证|验证|验收)(?:[（(][^）)]*[）)])?\*\*[：:]/;

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
  const base = basename(rel, extname(rel));

  const partAlready = readdirSync(dir).some((n) => new RegExp(`^${base}-p\\d+\\.md$`).test(n));
  if (partAlready && sections.length < 5) {
    console.error(`✗ ${rel} 看起来已经是总索引（${sections.length} 节），且 ${base}-p*.md 分片已存在。`);
    console.error(`  再跑 split 会丢弃索引里的分片小节锚点。`);
    console.error(`  要重建索引：把日志正文追加到对应分片（${base}-p8.md 等）后，让 split 从**日志源**跑；`);
    console.error(`  或先删掉分片再对「含正文的源文件」跑一次。`);
    process.exit(1);
  }

  const total = Buffer.byteLength(src);
  const nChunks = Math.max(1, Math.ceil(total / (maxKB * 1024)));
  const target = total / nChunks;
  const chunks = [];
  let cur = { bytes: 0, sections: [] };
  for (const s of sections) {
    const b = Buffer.byteLength(s.body.join('\n'));
    const remainingChunks = nChunks - chunks.length;
    if (cur.sections.length > 0 && remainingChunks > 1 && cur.bytes + b > target * 1.15) {
      chunks.push(cur);
      cur = { bytes: 0, sections: [] };
    }
    cur.bytes += b;
    cur.sections.push(s);
  }
  if (cur.sections.length) chunks.push(cur);

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
