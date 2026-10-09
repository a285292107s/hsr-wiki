#!/usr/bin/env node
/**
 * 文档链接与引用一致性检查器（CI 门禁；断链/误删引用即退出 1）。
 * 受管范围与跳过名单见 tools/doc-scope.mjs（唯一来源，勿在别处再写一份）；
 * 排除 node_modules/dist/temp/vendor/.agents/public/缓存 与自动生成的 DATA_CATALOG.md。
 * 检查项：① 断链([text](path)/图片/反引号路径，目录/http(s)/mailto/锚点跳过)；
 * ② 误删引用(HEAD 有、工作区无→报错，同名迁移给建议路径)；③ 重复(sha256 全等或 Jaccard≥0.8)。
 * 用法：node tools/check-doc-links.mjs [--verbose|--report|--strict]。
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname, relative, sep, dirname, resolve, basename, posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { SKIP_DIR, MANAGED_ENTRIES, SKIP_FILE } from './doc-scope.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const reportOnly = process.argv.includes('--report');
const strict = process.argv.includes('--strict');
const verbose = process.argv.includes('--verbose');

/* 受管范围与跳过名单的唯一来源是 tools/doc-scope.mjs（原先此处与 doc-audit.mjs 各写一份，
   新增生成物目录必然只改一处 → 违反「禁止重复实现同一功能」）。 */

/** 可被识别的仓库内路径后缀（反引号路径只在命中这些后缀时才校验，避免命令/标识符误报） */
const PATH_EXT = new Set([
  '.md', '.mjs', '.cjs', '.js', '.ts', '.vue', '.css', '.json', '.py',
  '.yml', '.yaml', '.html', '.txt', '.toml', '.sh', '.ps1', '.svg', '.png', '.webp', '.csv',
]);

/* ═══ 收集受管 markdown ═══ */
const files = [];
const walk = (abs) => {
  if (!existsSync(abs)) return;
  const st = statSync(abs);
  if (st.isFile()) {
    if (extname(abs).toLowerCase() !== '.md') return;
    const rel = relative(ROOT, abs).split(sep).join(posix.sep);
    // SKIP_FILE 用正斜杠（跨平台一致）；此处必须用 rel 比较，原生分隔符在 Windows 下永不命中
    if (!SKIP_FILE.has(rel)) files.push(rel);
    return;
  }
  for (const name of readdirSync(abs)) {
    if (SKIP_DIR.has(name)) continue;
    walk(join(abs, name));
  }
};
for (const entry of MANAGED_ENTRIES) walk(join(ROOT, entry));
files.sort();

/* ═══ git HEAD 文件清单（用于识别「已被删除/已移动」的引用） ═══ */
const headFiles = (() => {
  const r = spawnSync('git', ['-c', 'core.quotePath=false', 'ls-tree', '-r', '--name-only', 'HEAD'], { cwd: ROOT, encoding: 'utf8' });
  if (r.status !== 0 || !r.stdout) return null;
  return new Set(r.stdout.split(/\r?\n/).filter(Boolean));
})();

/** git 从不跟踪 .qoder-cn 等，HEAD 缺失时不做存在性反查 */
const inHead = (rel) => headFiles !== null && (headFiles.has(rel) || [...headFiles].some((f) => f.normalize('NFC') === rel.normalize('NFC')));

/** 全仓路径索引：basename → 相对路径数组（用于给出「已移动」建议） */
const byBasename = new Map();
/** 全仓文件相对路径（后缀匹配用） */
const allRepoFiles = [];
{
  const walkAll = (abs) => {
    let names;
    try { names = readdirSync(abs, { withFileTypes: true }); } catch { return; }
    for (const d of names) {
      if (d.isDirectory()) {
        if (SKIP_DIR.has(d.name)) continue;
        walkAll(join(abs, d.name));
      } else if (d.isFile()) {
        const rel = relative(ROOT, join(abs, d.name)).split(sep).join(posix.sep);
        allRepoFiles.push(rel);
        const key = d.name.normalize('NFC');
        if (!byBasename.has(key)) byBasename.set(key, []);
        byBasename.get(key).push(rel);
      }
    }
  };
  walkAll(ROOT);
}

/* ═══ 链接/引用提取 ═══ */
/** 单个文件内所有候选引用：{line, raw, kind} */
const MD_LINK_RE = /!?\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
const BT_PATH_RE = /`([^`\n]+)`/g;

/**
 * 归一化候选引用：
 * - 去掉 #锚点 与 ?query，解码 %20 等
 * - 丢弃外链、纯锚点、含通配/占位符的模板路径
 */
const normalize = (raw, anchor) => {
  let s = raw.trim();
  if (!s) return null;
  if (/^(https?:|mailto:|tel:|data:|ftp:|#)/i.test(s)) return null;
  s = s.split('#')[0].split('?')[0];
  if (!s) return null;
  try { s = decodeURIComponent(s); } catch { /* 保留原样 */ }
  s = s.replace(/^<|>$/g, '');
  if (/[*?{}<>|]/.test(s)) return null; // 通配/占位符，不判存在性
  return { target: s, anchor };
};

/** 反引号路径只在「看起来是仓库文件路径」时校验 */
const looksLikePath = (s) => {
  if (s.includes(' ') || s.includes('=') || s.startsWith('-')) return false;
  const ext = extname(s).toLowerCase();
  if (PATH_EXT.has(ext) && s.includes('/')) return true;
  // 目录式引用（以 / 结尾，如 docs/adr/）
  return /\/$/.test(s);
};

/** 解析候选仓库相对路径：先按文档所在目录，再按仓库根（兼容 `docs/…` 根式写法） */
const resolveCandidates = (fileRel, target) => {
  const t = target.replace(/\\/g, '/');
  if (t.startsWith('/')) return [posix.normalize(t.slice(1))];
  const fromDoc = posix.normalize(`${posix.dirname(fileRel)}/${t}`);
  const fromRoot = posix.normalize(t);
  return fromDoc === fromRoot ? [fromDoc] : [fromDoc, fromRoot];
};

/** 仓库内是否已无该文件、但 git HEAD 里仍存在 → 高置信「误删/未同步」 */
const deletedInWorktree = (() => {
  const r = spawnSync('git', ['-c', 'core.quotePath=false', 'diff', '--name-only', '--diff-filter=D', 'HEAD'], { cwd: ROOT, encoding: 'utf8' });
  if (r.status !== 0 || !r.stdout) return null;
  return new Set(r.stdout.split(/\r?\n/).filter(Boolean).map((p) => p.split(sep).join(posix.sep)));
})();
const wasDeleted = (rel) => deletedInWorktree !== null && deletedInWorktree.has(rel);

/** 在候选路径中挑选「已移动」证据：优先路径后缀匹配（router/index.ts → src/router/index.ts），
 *  退化为同名文件（services/cache.ts → src/services/cache.ts） */
const movedHint = (cands) => {
  const suffix = cands.flatMap((c) => allRepoFiles.filter((p) => p.endsWith(`/${c}`))).sort((a, b) => a.length - b.length);
  if (suffix.length) return `路径补全 → 建议改为 ${suffix[0]}`;
  for (const c of cands) {
    const same = (byBasename.get(basename(c).normalize('NFC')) || []).filter((p) => p !== c);
    if (same.length) return `已移动 → 建议改为 ${same[0]}`;
  }
  return '';
};

/* ═══ 逐文件校验 ═══ */
const broken = [];    // markdown 断链 → 退出码 1
const misrefs = [];   // 反引号引用本次被删除的文件 → 退出码 1
const warns = [];     // 反引号路径不可达（低置信：可能是外部数据目录/历史描述）→ 仅 --strict 失败
const seenRef = new Set();

for (const fileRel of files) {
  const text = readFileSync(join(ROOT, fileRel), 'utf8');
  const lines = text.split(/\r?\n/);
  lines.forEach((line, i) => {
    const lineNo = i + 1;
    const candidates = [];
    for (const m of line.matchAll(MD_LINK_RE)) candidates.push([m[1], true]);
    for (const m of line.matchAll(BT_PATH_RE)) {
      const tok = m[1].trim().replace(/:\d+(-\d+)?$/, ''); // 去除 :行号 后缀
      if (looksLikePath(tok)) candidates.push([tok, false]);
    }
    for (const [raw, anchor] of candidates) {
      const norm = normalize(raw, anchor);
      if (!norm) continue;
      const cands = resolveCandidates(fileRel, norm.target);
      if (cands.some((c) => existsSync(join(ROOT, ...c.split('/'))))) continue;
      const key = `${fileRel}:${lineNo}:${raw}`;
      if (seenRef.has(key)) continue;
      seenRef.add(key);

      const hint = movedHint(cands);
      const rec = { file: fileRel, line: lineNo, target: raw, hint };
      if (anchor) broken.push(rec);
      else if (cands.some(wasDeleted)) misrefs.push(rec);
      else warns.push(rec);
    }
  });
}

/* ═══ 重复文件检测 ═══ */
const hashes = new Map(); // sha256 → [file]
const lineSets = new Map(); // file → Set(规范化行)
for (const fileRel of files) {
  const text = readFileSync(join(ROOT, fileRel), 'utf8');
  const h = createHash('sha256').update(text, 'utf8').digest('hex');
  if (!hashes.has(h)) hashes.set(h, []);
  hashes.get(h).push(fileRel);
  const set = new Set(
    text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !/^[-=*_#>\s|]+$/.test(l)),
  );
  lineSets.set(fileRel, set);
}
const identical = [...hashes.values()].filter((g) => g.length > 1);

/** 规范化行集合 Jaccard 相似度（≥30 行才比较，避免小文件噪声） */
const similar = [];
const similarFiles = files.filter((f) => lineSets.get(f).size >= 30);
for (let a = 0; a < similarFiles.length; a++) {
  for (let b = a + 1; b < similarFiles.length; b++) {
    const A = lineSets.get(similarFiles[a]);
    const B = lineSets.get(similarFiles[b]);
    let inter = 0;
    for (const x of A) if (B.has(x)) inter++;
    const j = inter / (A.size + B.size - inter);
    if (j >= 0.8) similar.push({ a: similarFiles[a], b: similarFiles[b], jaccard: j.toFixed(3) });
  }
}

/* ═══ 报告 ═══ */
const B = (s) => `\x1b[1m${s}\x1b[0m`;
const F = broken.length + misrefs.length;
console.log(B(`\n[文档链接检查] 受管 markdown ${files.length} 份｜断链 ${broken.length}｜误删引用 ${misrefs.length}｜低置信 ${warns.length}｜重复文件 ${identical.length} 组｜高度雷同 ${similar.length} 组\n`));

const printList = (title, list, limit = Infinity) => {
  if (!list.length) return;
  console.log(B(title));
  for (const r of list.slice(0, limit)) console.log(`  ${r.file}:${r.line}  →  ${r.target}${r.hint ? `  【${r.hint}】` : ''}`);
  if (list.length > limit) console.log(`  … 另有 ${list.length - limit} 条（--verbose 查看全部）`);
  console.log('');
};
printList('── 断链（markdown 链接目标不存在） ──', broken);
printList('── 误删引用（引用了本次/HEAD 中已被删除的文件） ──', misrefs);
printList('── 低置信（反引号路径不可达：可能是外部数据目录或历史描述，--strict 才失败） ──', warns, verbose ? Infinity : 12);

if (identical.length) {
  console.log(B('── 内容完全相同（sha256 相同） ──'));
  for (const g of identical) console.log(`  sha256:${createHash('sha256').update(readFileSync(join(ROOT, g[0]), 'utf8'), 'utf8').digest('hex').slice(0, 12)}  ${g.join('  <->  ')}`);
  console.log('');
}
if (similar.length) {
  console.log(B('── 高度雷同（Jaccard ≥ 0.8） ──'));
  for (const s of similar) console.log(`  ${s.jaccard}  ${s.a}  <->  ${s.b}`);
  console.log('');
}

const dupFail = strict && (identical.length || similar.length) > 0;
const warnFail = strict && warns.length > 0;
if (!F && !dupFail && !warnFail) console.log('[PASS] 全部引用可达\n');
else if (F) console.log(`[FAIL] ${F} 条引用不可达（断链 ${broken.length} + 误删 ${misrefs.length}）\n`);
if (warnFail) console.log(`[FAIL] --strict：${warns.length} 条低置信引用不可达\n`);
if (dupFail) console.log('[FAIL] --strict：存在重复/雷同文档\n');

process.exit(reportOnly ? 0 : F || dupFail || warnFail ? 1 : 0);
