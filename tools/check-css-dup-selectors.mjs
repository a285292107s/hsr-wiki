#!/usr/bin/env node
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const strict = process.argv.includes('--strict');
const SCAN_ROOTS = ['src/styles', 'src/app'];
const FILE_RE = /\.(css|vue)$/;

const files = [];
const walk = (dir) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (FILE_RE.test(e.name)) files.push(relative(ROOT, p).split('\\').join('/'));
  }
};
SCAN_ROOTS.forEach((r) => walk(join(ROOT, r)));

const norm = (s) => s.replace(/\s+/g, ' ').trim();
const propsOf = (text) => {
  const set = new Set();
  for (const m of text.matchAll(/(^|;)\s*([a-zA-Z-][\w-]*)\s*:/g)) set.add(m[2]);
  return set;
};
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));

const seen = new Map();

const addProps = (rule, props) => {
  if (!props.size) return;
  for (const one of rule.head.split(',').map(norm).filter(Boolean)) {
    const key = `${rule.ctx}||${one}`;
    if (!seen.has(key)) seen.set(key, new Map());
    const bucket = seen.get(key);
    const id = `${rule.file}:${rule.line}`;
    if (!bucket.has(id)) bucket.set(id, { file: rule.file, line: rule.line, props: new Set() });
    for (const p of props) bucket.get(id).props.add(p);
  }
};

function parseCss(text, file, offsetLine = 1) {
  let i = 0;
  let line = offsetLine;
  const n = text.length;
  const stack = [];
  let buf = '';
  const ctxOf = () => stack.filter((s) => s.type === 'at' && !s.keyframes).map((s) => s.cond).join(' && ');
  const inKeyframes = () => stack.some((s) => s.keyframes);
  const advanceTo = (target) => {
    for (; i < target && i < n; i++) {
      if (text[i] === '\n') line++;
    }
  };

  while (i < n) {
    const ch = text[i];

    if (ch === '/' && text[i + 1] === '*') {
      const end = text.indexOf('*/', i + 2);
      advanceTo(end === -1 ? n : end + 2);
      continue;
    }
    if (ch === '"' || ch === "'") {
      const q = ch;
      let j = i + 1;
      while (j < n && text[j] !== q) {
        if (text[j] === '\\') j++;
        j++;
      }
      buf += text.slice(i, j + 1);
      advanceTo(j + 1);
      continue;
    }
    if (ch === '{') {
      const prelude = norm(buf);
      buf = '';
      const ctx = ctxOf();
      if (/^@/.test(prelude)) {
        stack.push({ type: 'at', cond: prelude, keyframes: inKeyframes() || /@(-\w+-)?keyframes/.test(prelude) });
      } else if (inKeyframes()) {
        stack.push({ type: 'skip' });
      } else {
        const rule = { ctx, head: prelude, file, line };
        stack.push({ type: 'rule', rule });
      }
      i++;
      continue;
    }
    if (ch === '}') {
      const decl = norm(buf);
      buf = '';
      if (decl.includes(':')) {
        const top = [...stack].reverse().find((s) => s.type === 'rule');
        if (top) addProps(top.rule, propsOf(decl));
      }
      stack.pop();
      i++;
      continue;
    }
    if (ch === ';') {
      const decl = norm(buf);
      buf = '';
      if (decl.includes(':')) {
        const top = [...stack].reverse().find((s) => s.type === 'rule');
        if (top) addProps(top.rule, propsOf(decl));
      }
      i++;
      continue;
    }

    buf += ch;
    i++;
    if (ch === '\n') line++;
  }
}

const scopedSfc = new Set();
for (const f of files) {
  const raw = readFileSync(join(ROOT, f), 'utf8');
  const isVue = f.endsWith('.vue');
  if (!isVue) {
    parseCss(stripComments(raw), f);
    continue;
  }
  const attrs = [...raw.matchAll(/<style([^>]*)>/g)].map((m) => m[1]);
  if (attrs.length > 0 && attrs.every((a) => /\bscoped\b/.test(a))) scopedSfc.add(f);
  let cursor = 0;
  for (const m of raw.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) {
    const start = raw.indexOf(m[1], cursor);
    cursor = start + m[1].length;
    const offsetLine = raw.slice(0, start).split('\n').length;
    parseCss(stripComments(m[1]), f, offsetLine);
  }
}

const overlapOf = (list) => {
  const out = new Set();
  for (let a = 0; a < list.length; a++)
    for (let b = a + 1; b < list.length; b++)
      for (const p of list[a].props) if (list[b].props.has(p)) out.add(p);
  return [...out].sort();
};

const sameFile = [];
const crossFile = [];
for (const [key, bucket] of seen) {
  const [ctx, sel] = key.split('||');
  const list = [...bucket.values()];
  const byFile = new Map();
  for (const d of list) byFile.set(d.file, [...(byFile.get(d.file) || []), d]);
  for (const [, ds] of byFile) {
    if (ds.length < 2) continue;
    const overlap = overlapOf(ds);
    if (overlap.length) sameFile.push({ ctx, sel, ds, overlap });
  }
  if (byFile.size > 1) {
    const overlap = overlapOf(list);
    if (!overlap.length) continue;
    const allScoped = [...byFile.keys()].every((x) => scopedSfc.has(x));
    crossFile.push({ ctx, sel, byFile, overlap, kind: allScoped ? 'dup' : 'conflict' });
  }
}

const label = (r) => `${r.ctx ? `[${r.ctx}] ` : ''}${r.sel}`;
console.log(`扫描 ${files.length} 个文件（src/styles + src/app SFC）`);

console.log(`\n=== A. 同文件 · 同上下文 · 属性真重叠（静默覆盖）：${sameFile.length} 条 ===`);
for (const r of sameFile.sort((a, b) => b.overlap.length - a.overlap.length)) {
  console.log(`${label(r)}  ← 重叠 ${r.overlap.join(', ')}`);
  for (const d of r.ds) console.log(`   ${d.file} @ ${d.line}`);
}

const conflicts = crossFile.filter((r) => r.kind === 'conflict');
const dups = crossFile.filter((r) => r.kind === 'dup');
console.log(`\n=== B. 跨文件 · 属性真重叠 · 加载序决定生效者：${conflicts.length} 条 ===`);
for (const r of conflicts) {
  console.log(`${label(r)}  ← 重叠 ${r.overlap.join(', ')}`);
  for (const [f, ds] of r.byFile) console.log(`   ${f} @ ${ds.map((d) => d.line).join(', ')}`);
}

console.log(`\n=== C. 跨文件重复实现 · 两侧均为 scoped SFC（运行时不冲突）：${dups.length} 条 ===`);
for (const r of dups) {
  console.log(`${label(r)}  ← 重叠 ${r.overlap.join(', ')}`);
  for (const [f, ds] of r.byFile) console.log(`   ${f} @ ${ds.map((d) => d.line).join(', ')}`);
}

const hits = sameFile.length + conflicts.length;
console.log(`\n合计需处理（A + B）：${hits} 条；C 类重复实现：${dups.length} 条。`);
if (strict && hits > 0) {
  console.error(`[FAIL] ${hits} 条后写静默覆盖`);
  process.exit(1);
}
console.log(strict ? '[PASS] 无后写静默覆盖' : '[report] 默认不阻塞');
