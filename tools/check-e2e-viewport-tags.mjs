#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const strict = process.argv.includes('--strict');

const OK_RE = /\/\/\s*e2e-viewport-ok\s*[:：]\s*(\S.*)$/;
const BAD_OK_RE = /\/\/\s*e2e-viewport-ok\s*[:：]?\s*$/;
const SET_VP_RE = /\bsetViewportSize\s*\(/;
const PINNED_RE = /@viewport-pinned/;
const INDEPENDENT_RE = /@viewport-independent/;
const TEST_RE = /^\s*test\(/;

function leadingComments(lines, start) {
  const out = [];
  let inBlock = false;
  for (let i = start - 1; i >= 0 && out.length < 30; i--) {
    const t = lines[i].trim();
    if (t === '') continue;
    if (inBlock) {
      out.push(lines[i]);
      if (t.startsWith('/*')) break;
      continue;
    }
    if (t.startsWith('//')) out.push(lines[i]);
    else if (t.endsWith('*/')) {
      inBlock = true;
      out.push(lines[i]);
    } else break;
  }
  return out;
}

const specs = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (name.endsWith('.spec.ts')) specs.push(p);
  }
};
walk(join(ROOT, 'e2e'));
specs.sort();

const violations = [];
const badReasons = [];
const exempted = [];
let total = 0;
let pinnedCount = 0;

const findLine = (text, re) => text.split('\n').find((l) => re.test(l));

for (const abs of specs) {
  const rel = relative(ROOT, abs).split(sep).join(posix.sep);
  const lines = readFileSync(abs, 'utf8').split(/\r?\n/);
  const starts = [];
  for (let i = 0; i < lines.length; i++) if (TEST_RE.test(lines[i])) starts.push(i);

  for (const [k, s] of starts.entries()) {
    const end = k + 1 < starts.length ? starts[k + 1] : lines.length;
    total++;
    const sigLines = lines.slice(s, s + 3).join('\n').split('=>')[0];
    const bodyLines = lines.slice(s + 1, end);
    const codeLines = bodyLines.filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l));
    const pins = SET_VP_RE.test(codeLines.join('\n'));
    const pinned = PINNED_RE.test(sigLines);
    const independent = INDEPENDENT_RE.test(sigLines);
    const title = (lines[s].match(/^\s*test\(\s*'([^']*)'/) || [])[1] ?? `${lines[s].trim().slice(0, 40)}…`;
    if (pinned) pinnedCount++;
    const scope = [leadingComments(lines, s).join('\n'), sigLines, lines.slice(s, end).join('\n')];
    const ok = scope.map((t) => findLine(t, OK_RE)).find(Boolean);
    const badOk = scope.some((t) => findLine(t, BAD_OK_RE));

    if (pins && !pinned) {
      const hit = ok && ok.match(OK_RE);
      if (hit) exempted.push({ rel, line: s + 1, title, reason: hit[1].trim() });
      else {
        if (badOk) badReasons.push({ rel, line: s + 1, title });
        violations.push({ rel, line: s + 1, title, independent });
      }
    }
  }
}

const B = (s) => `\x1b[1m${s}\x1b[0m`;

const configIssues = [];
const configPath = join(ROOT, 'playwright.config.ts');
const configText = readFileSync(configPath, 'utf8');
const projectBlocks = [];
for (const m of configText.matchAll(/name:\s*'([a-z-]+)'/g)) {
  const open = configText.lastIndexOf('\n    {', m.index);
  const start = open < 0 ? m.index : open;
  const end = configText.indexOf('\n    },', start);
  projectBlocks.push({ name: m[1], body: configText.slice(start, end < 0 ? configText.length : end) });
}
for (const { name, body } of projectBlocks) {
  if (name !== 'mobile-chromium') continue;
  if (!PINNED_RE.test(body)) {
    configIssues.push(
      `playwright.config.ts 的 mobile-chromium 缺对 @viewport-pinned 的 grepInvert——自钉视口的桌面契约会被 Pixel 7（isMobile + 触摸仿真）重跑`,
    );
  }
}
if (!projectBlocks.some((p) => p.name === 'mobile-chromium')) {
  configIssues.push('playwright.config.ts 未找到 mobile-chromium project（本检查失去作用对象，禁止静默通过）');
}

console.log(
  B(
    `\n[e2e 视口标签] 扫描 ${specs.length} 个 spec｜test 声明 ${total}｜@viewport-pinned ${pinnedCount}｜违规 ${violations.length}｜豁免 ${exempted.length}｜配置问题 ${configIssues.length}\n`,
  ),
);

if (configIssues.length) {
  console.log(B('── 配置违规（project 的收集过滤） ──'));
  for (const issue of configIssues) console.log(`  ${issue}`);
  console.log('');
}

if (violations.length) {
  console.log(B('── 违规（自钉视口但未声明 @viewport-pinned） ──'));
  for (const v of violations) {
    console.log(`  ${v.rel}:${v.line}  ${v.title}`);
    if (v.independent) console.log('      ↑ 同时声明了 @viewport-independent：语义冲突，自钉视口的正解是 @viewport-pinned');
  }
  console.log('');
}
if (badReasons.length) {
  console.log(B('── 豁免缺理由（按未豁免计入） ──'));
  for (const e of badReasons) console.log(`  ${e.rel}:${e.line}  // e2e-viewport-ok 未写理由`);
  console.log('');
}
if (exempted.length) {
  console.log(B('── 已豁免（// e2e-viewport-ok） ──'));
  for (const e of exempted) console.log(`  ${e.rel}:${e.line}  【${e.reason}】`);
  console.log('');
}

if (!violations.length && !configIssues.length) {
  console.log('[PASS] 自钉视口用例都声明了 @viewport-pinned，且 mobile project 按标签收起\n');
} else {
  if (violations.length) {
    console.log(`[FAIL] ${violations.length} 条自钉视口用例缺 @viewport-pinned`);
    console.log('       正解：在 test(...) 第二参静态声明 { tag: \'@viewport-pinned\' }（动态 annotation 对收集期过滤无效）；');
    console.log('       若该用例**必须**留在 mobile project（例如 isMobile 就是被测对象），补 `// e2e-viewport-ok: 理由`');
  }
  if (configIssues.length) {
    console.log(`[FAIL] ${configIssues.length} 处 project 收集过滤缺失`);
    console.log('       正解：mobile-chromium 的 grepInvert 必须含 /@viewport-pinned/（标签与过滤是一对，缺一即失效）\n');
  }
}
process.exit(strict && (violations.length || badReasons.length || configIssues.length) ? 1 : 0);
