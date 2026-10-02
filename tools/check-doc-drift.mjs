#!/usr/bin/env node
/**
 * living docs 与代码的漂移检查（report-only）。
 * 用法：node tools/check-doc-drift.mjs [--strict]
 * 只扫 docs/agents/** 与 CONTEXT.md（docs/memory/** 是历史档案，不在扫描面）；
 * 比对反引号里的 nk-/ui- CSS 类名与 src|e2e 路径是否仍存在于代码（例外见下方 EXIST_SURFACE）。
 * 句中带「已退场 / 已移除 / 不复用 / 历史 …」等标记的条目降级为「历史提及」，不计入 --strict。
 * 行内 `<!-- doc-drift-ok: 理由 -->` 可整体豁免该行。
 * 退出码：默认恒 0；--strict 有未降级漂移退出 1。
 * 硬约束：只用 node 内置模块；只读不改写；不重复 check-doc-links（这里不查 markdown 链接）。
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, sep, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const strict = process.argv.includes('--strict');

/** 扫描面：只含 living docs */
const DOC_ENTRIES = [posix.join('docs', 'agents'), 'CONTEXT.md'];
/** 存在性依据：代码与生成器（docs/** 自身不算依据） */
const CODE_ROOTS = ['src', 'tools', 'e2e'];
const CODE_ROOT_FILES = ['index.html', 'vite.config.ts', 'vitest.config.ts', 'playwright.config.ts', 'package.json', 'vercel.json'];
const SKIP_DIR = new Set(['node_modules', 'dist', '.git', 'temp', 'vendor', 'public', 'docs', '.playwright', 'playwright-report']);
const SEARCH_EXT = new Set(['.ts', '.vue', '.css', '.mjs', '.cjs', '.js', '.json', '.html', '.py', '.md']);

const walk = (abs, out = []) => {
  for (const name of readdirSync(abs, { withFileTypes: true })) {
    if (name.isDirectory()) {
      if (!SKIP_DIR.has(name.name)) walk(join(abs, name.name), out);
    } else if (name.isFile()) out.push(join(abs, name.name));
  }
  return out;
};

/* ═══ 文档面 ═══ */
const docs = [];
for (const entry of DOC_ENTRIES) {
  const abs = join(ROOT, ...entry.split('/'));
  if (!existsSync(abs)) continue;
  if (statSync(abs).isDirectory()) {
    for (const f of walk(abs)) if (f.endsWith('.md')) docs.push(relative(ROOT, f).split(sep).join(posix.sep));
  } else docs.push(entry);
}
docs.sort();

/* ═══ 存在性依据（一次性读入） ═══ */
const codeTexts = [];
const existingPaths = new Set();
for (const root of CODE_ROOTS) {
  const abs = join(ROOT, root);
  if (!existsSync(abs)) continue;
  for (const f of walk(abs)) {
    const rel = relative(ROOT, f).split(sep).join(posix.sep);
    existingPaths.add(rel);
    if (SEARCH_EXT.has(rel.slice(rel.lastIndexOf('.')))) {
      try {
        codeTexts.push(readFileSync(f, 'utf8'));
      } catch { /* 二进制/不可读跳过 */ }
    }
  }
}
for (const rel of CODE_ROOT_FILES) {
  if (existsSync(join(ROOT, rel))) {
    existingPaths.add(rel);
    codeTexts.push(readFileSync(join(ROOT, rel), 'utf8'));
  }
}
const codeBlob = codeTexts.join('\n');

/* ═══ 提取 ═══ */
const CLASS_RE = /(?<![\w-])((?:nk|ui)-[A-Za-z0-9][A-Za-z0-9_-]*)/g;
const PATH_RE = /(?:^|[\s（(【，,、;；:：])((?:src|e2e)\/[\w./@-]+)/g;
const WILDCARD = /[*<>{}…]/;
/** 历史语境标记：命中则不判漂移（docs/memory 之外，living docs 也常带历史说明） */
const HISTORICAL = /已退场|已移除|已删除|已作废|已下线|不复用|不再出现|不再|历史|曾用|当时|旧形态|退场|作废/;
const EXEMPT = /<!--\s*doc-drift-ok\s*[:：]\s*(\S.*?)\s*-->/;

const items = []; // { kind, rel, line, token, historical, why }
let classCount = 0;
let pathCount = 0;
let exemptCount = 0;

for (const rel of docs) {
  const lines = readFileSync(join(ROOT, ...rel.split('/')), 'utf8').split(/\r?\n/);
  lines.forEach((line, i) => {
    const lineNo = i + 1;
    if (EXEMPT.test(line)) {
      exemptCount++;
      return;
    }
    const historical = HISTORICAL.test(line);
    for (const m of line.matchAll(/`([^`\n]+)`/g)) {
      const token = m[1].trim();
      if (!token || WILDCARD.test(token)) continue;
      for (const c of token.matchAll(CLASS_RE)) {
        const cls = c[1];
        if (cls.length <= 4 || cls.endsWith('-')) continue;
        classCount++;
        if (!codeBlob.includes(cls)) items.push({ kind: '类名', rel, line: lineNo, token: cls, historical });
      }
      for (const p of token.matchAll(PATH_RE)) {
        const path = p[1].replace(/\/+$/, '');
        if (!path || path.includes('//')) continue;
        pathCount++;
        const hit = existingPaths.has(path) || [...existingPaths].some((f) => f.startsWith(`${path}/`));
        if (!hit) items.push({ kind: '路径', rel, line: lineNo, token: path, historical });
      }
    }
  });
}

/* ═══ 报告 ═══ */
const B = (s) => `\x1b[1m${s}\x1b[0m`;
const drift = items.filter((x) => !x.historical);
const soft = items.filter((x) => x.historical);
console.log(B(`\n[文档漂移] living doc ${docs.length} 份｜类名 ${classCount} 处（缺 ${items.filter((x) => x.kind === '类名').length}）｜路径 ${pathCount} 处（缺 ${items.filter((x) => x.kind === '路径').length}）｜豁免行 ${exemptCount}\n`));
const printList = (title, list) => {
  if (!list.length) return;
  console.log(B(title));
  for (const x of list) console.log(`  ${x.rel}:${x.line}  [${x.kind}] ${x.token}`);
  console.log('');
};
printList('── 漂移（文档提到、代码内已无） ──', drift);
printList('── 历史提及（句中带「已退场 / 已移除 / 不再 / 历史」等标记，仅提示） ──', soft);

if (!drift.length) console.log(`[PASS] 无未降级漂移${soft.length ? `（另有 ${soft.length} 条历史提及，见上）` : ''}\n`);
else {
  console.log(`[FAIL] 漂移 ${drift.length} 条：类名 ${drift.filter((x) => x.kind === '类名').length} + 路径 ${drift.filter((x) => x.kind === '路径').length}`);
  console.log('       修法：改文档字面量、改代码命名，或确认属历史说明后补「已退场/已移除」标记或行内 <!-- doc-drift-ok: 理由 -->\n');
}
process.exit(strict && drift.length ? 1 : 0);
