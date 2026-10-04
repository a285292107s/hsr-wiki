#!/usr/bin/env node
/**
 * e2e 视口标签守卫（report-only）。
 * 用法：node tools/check-e2e-viewport-tags.mjs [--strict]
 *
 * 判据（单一事实源：docs/agents/testing.md 的标签纪律）：
 *   用例体内自行 `page.setViewportSize(...)` 固定视口者，**必须**在 `test(...)` 第二参静态声明 `@viewport-pinned`
 *   ——否则 `mobile-chromium` 会用 Pixel 7（`isMobile` + 触摸仿真）重跑一条本已钉死视口的桌面契约，
 *   既是纯重复，也会因仿真环境差异变成 flake（实测一次 30s 超时 × 3 次重试把 CI 拖红）。
 *
 * 行内豁免：`// e2e-viewport-ok: 理由`（写在 test 之前的注释块 / 签名行 / 用例体内均可），缺理由不豁免。
 * 唯一在用豁免：`e2e/layout-debug.spec.ts` 的手机档哨兵——它必须留在 mobile project 里跑（`isMobile` 是**被测对象**）。
 *
 * 只判一个方向（自钉视口 ⇒ 必须声明标签）：这是唯一会让 CI 变红的方向。
 * 反方向（声明了标签但用例内没钉视口）是合法用法——该标签同时承担「断言只在项目默认（桌面）视口下成立」
 * 的排他作用，见 docs/agents/testing.md 的标签纪律；对它报警只会变成永久噪声。
 *
 * 退出码：默认恒 0；--strict 有违规退出 1。
 * 硬约束：只用 node 内置模块；只读，不改写任何文件。
 */
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
const TEST_RE = /^\s{0,2}test\(/;

/** 取 test 之前的连续注释块（doc comment 在语法上属于前一个用例的区间，语义上属于下一个用例） */
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

/** 行级匹配：禁止把行导向的正则作用在多行拼接串上（`$` 跨不过换行，会让豁免静默失效） */
const findLine = (text, re) => text.split('\n').find((l) => re.test(l));

for (const abs of specs) {
  const rel = relative(ROOT, abs).split(sep).join(posix.sep);
  const lines = readFileSync(abs, 'utf8').split(/\r?\n/);
  const starts = [];
  for (let i = 0; i < lines.length; i++) if (TEST_RE.test(lines[i])) starts.push(i);

  for (const [k, s] of starts.entries()) {
    const end = k + 1 < starts.length ? starts[k + 1] : lines.length;
    total++;
    // 签名可能跨行（长标题 + 标签数组）：取签名行起 3 行内、到 `=> {` 之前的部分
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
console.log(
  B(
    `\n[e2e 视口标签] 扫描 ${specs.length} 个 spec｜test 声明 ${total}｜@viewport-pinned ${pinnedCount}｜违规 ${violations.length}｜豁免 ${exempted.length}\n`,
  ),
);

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

if (!violations.length) {
  console.log('[PASS] 所有自钉视口的用例都声明了 @viewport-pinned\n');
} else {
  console.log(`[FAIL] ${violations.length} 条自钉视口用例缺 @viewport-pinned`);
  console.log('       正解：在 test(...) 第二参静态声明 { tag: \'@viewport-pinned\' }（动态 annotation 对收集期过滤无效）；');
  console.log('       若该用例**必须**留在 mobile project（例如 isMobile 就是被测对象），补 `// e2e-viewport-ok: 理由`\n');
}
process.exit(strict && (violations.length || badReasons.length) ? 1 : 0);
