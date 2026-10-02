#!/usr/bin/env node
/**
 * 受影响 e2e 用例推导（report-only；只有 --run 才真正执行）。
 * 用法：node tools/e2e-affected.mjs [--base <ref>] [--run] [--only <文件,文件>] [-- <playwright 额外参数>]
 * （--only 以显式清单替代 git diff，用于自检/预演某个改动的影响面；`-- --list` 只收集不执行）
 * 由 git diff（默认工作区 + HEAD；--base 指定基线）推导受影响路由，再按 e2e/**&#47;*.spec.ts 的
 * page.goto 字面量（含 `for (... of CONST_ARRAY)` 间接写法）建立「路由 → 用例标题」索引，
 * 输出可直接执行的 `pnpm exec playwright test <files> --grep "<标题正则>"`。
 * 全局文件（tokens.css / catalog.css / App.vue / SidebarNav.vue / router/** / main/bootstrap / e2e 公共工具与配置）
 * 判为「影响全部页面」；推导不出用例时明确打印「建议跑 guards 层 + 全量 layout」，不输出空命令。
 * 退出码：默认 0（只报告）；--run 透传 playwright 退出码。
 * 硬约束：只用 node 内置模块；默认不启动浏览器（--run 除外）；visual.spec 像素基线单独列出，不进默认建议命令。
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, sep, posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
const baseIdx = args.indexOf('--base');
const base = baseIdx >= 0 && args[baseIdx + 1] ? args[baseIdx + 1] : 'HEAD';
const doRun = args.includes('--run');
/** `--` 之后的参数原样透传给 playwright（如 `-- --list` 只收集不执行） */
const passthrough = args.includes('--') ? args.slice(args.indexOf('--') + 1) : [];

const git = (a) => spawnSync('git', ['-c', 'core.quotePath=false', ...a], { cwd: ROOT, encoding: 'utf8' });
const toPosix = (p) => p.split(sep).join(posix.sep);

/* ═══ 变更文件 ═══ */
const onlyIdx = args.indexOf('--only');
const only = onlyIdx >= 0 && args[onlyIdx + 1] ? args[onlyIdx + 1].split(',').map((s) => s.trim()).filter(Boolean) : null;
const diff = git(['diff', '--name-only', base]);
const untracked = git(['ls-files', '--others', '--exclude-standard']);
const changed = only
  ? new Set(only)
  : new Set(
      `${diff.stdout || ''}\n${untracked.stdout || ''}`.split(/\r?\n/).map((s) => s.trim()).filter(Boolean).map(toPosix),
    );
const RELEVANT = /^(src|e2e|public)\//;
const ROOT_CONF = new Set(['index.html', 'package.json', 'playwright.config.ts', 'vite.config.ts', 'vitest.config.ts']);
const relevant = [...changed].filter((f) => RELEVANT.test(f) || ROOT_CONF.has(f)).sort();
const ignored = [...changed].filter((f) => !relevant.includes(f));
/** 全局文件：单点声明处被改 = 全部页面受影响 */
const PAGE_GLOBAL_RES = [
  /(^|\/)tokens\.css$/, /(^|\/)catalog\.css$/, /(^|\/)App\.vue$/, /(^|\/)SidebarNav\.vue$/,
  /^src\/app\/router\//, /^src\/main\.[tj]s$/, /^src\/app\/bootstrap/, /bootstrap\.(ts|js)$/,
];
/** e2e 公共设施：被改 = 全部 spec 受波及 */
const E2E_INFRA_RES = [/^e2e\/helpers\.ts$/, /^playwright\.config\.ts$/, /^package\.json$/, /^vite\.config\.ts$/, /^index\.html$/];
const pageGlobals = relevant.filter((f) => PAGE_GLOBAL_RES.some((re) => re.test(f)));
const e2eInfra = relevant.filter((f) => E2E_INFRA_RES.some((re) => re.test(f)));

/* ═══ 路由表（router/index.ts 静态解析） ═══ */
const routeRecs = [];
{
  const text = readFileSync(join(ROOT, 'src', 'app', 'router', 'index.ts'), 'utf8');
  let cur = null;
  for (const line of text.split(/\r?\n/)) {
    const pm = line.match(/path:\s*'([^']+)'/);
    if (pm) {
      cur = { path: pm[1], components: [], catalog: null };
      routeRecs.push(cur);
      continue;
    }
    if (!cur) continue;
    const im = line.match(/import\(\s*'([^']+)'\s*\)/);
    if (im) cur.components.push(posix.normalize(posix.join('src/app/router', im[1])));
    const cm = line.match(/catalogView\(\s*'([^']+)'\s*\)/);
    if (cm) {
      cur.catalog = cm[1];
      cur.components.push('src/app/views/CatalogView.vue', `src/app/catalog/pages/${cm[1]}.ts`);
    }
    const mm = line.match(/catalog:\s*'([^']+)'/);
    if (mm) cur.catalog = mm[1];
  }
}
const routeRegex = (p) =>
  new RegExp(`^${p.split('/').map((seg) => (seg.startsWith(':') ? '[^/]+' : seg === '*' ? '.*' : seg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))).join('/')}$`);
/** 可交互路由：redirect-only 记录（无组件、无目录配置）不承载页面，不参与模块名匹配 */
const liveRoutes = routeRecs.filter((r) => r.components.length > 0 || r.catalog);

/* ═══ e2e 用例索引 ═══ */
const specFiles = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (name.endsWith('.spec.ts')) specFiles.push(toPosix(relative(ROOT, p)));
  }
};
walk(join(ROOT, 'e2e'));
specFiles.sort();

/** 括号配对：返回 text[open] 对应的闭括号下标（忽略引号内部） */
const matchBracket = (text, open) => {
  const pairs = { '[': ']', '(': ')', '{': '}' };
  const oc = text[open];
  const cc = pairs[oc];
  let depth = 0;
  let quote = null;
  for (let i = open; i < text.length; i++) {
    const c = text[i];
    if (quote) {
      if (c === quote && text[i - 1] !== '\\') quote = null;
      continue;
    }
    if (c === "'" || c === '"' || c === '`') quote = c;
    else if (c === oc) depth++;
    else if (c === cc && --depth === 0) return i;
  }
  return text.length;
};
/** 顶层逗号切分（忽略括号与引号内部） */
const splitTopLevel = (body) => {
  const out = [];
  let depth = 0;
  let quote = null;
  let cur = '';
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (quote) {
      cur += c;
      if (c === quote && body[i - 1] !== '\\') quote = null;
      continue;
    }
    if (c === "'" || c === '"' || c === '`') quote = c;
    else if ('([{'.includes(c)) depth++;
    else if (')]}'.includes(c)) depth--;
    else if (c === ',' && depth === 0) {
      out.push(cur);
      cur = '';
      continue;
    }
    cur += c;
  }
  if (cur.trim()) out.push(cur);
  return out;
};
/** `const NAME = [ … ]` → { fields: Map, path }（供 for-of 间接 goto 与模板标题展开） */
const parseConstArrays = (text) => {
  const map = new Map();
  const re = /const\s+([A-Za-z_$][\w$]*)\s*(?::[^=]+)?=\s*\[/g;
  for (const m of text.matchAll(re)) {
    const open = m.index + m[0].length - 1;
    const body = text.slice(open + 1, matchBracket(text, open));
    const entries = splitTopLevel(body).map((chunk) => {
      const fields = new Map();
      for (const f of chunk.matchAll(/([A-Za-z_$][\w$]*)\s*:\s*'([^']*)'/g)) fields.set(f[1], f[2]);
      const bare = chunk.trim().match(/^'([^']+)'/);
      if (bare && !fields.size) fields.set('', bare[1]);
      return { fields, path: fields.get('path') ?? fields.get('') ?? null };
    });
    map.set(m[1], entries);
  }
  return map;
};

const index = []; // { file, title, routes:Set }
for (const file of specFiles) {
  const text = readFileSync(join(ROOT, ...file.split('/')), 'utf8');
  const constArrays = parseConstArrays(text);
  const anchors = [...text.matchAll(/(?<![\w.])test(\.describe)?\(/g)].map((m) => ({ pos: m.index, describe: Boolean(m[1]) }));
  for (const [ai, a] of anchors.entries()) {
    if (a.describe) continue;
    const end = anchors[ai + 1] ? anchors[ai + 1].pos : text.length;
    const block = text.slice(a.pos, end);
    const tm = block.slice(0, 500).match(/^test\(\s*(['"`])([\s\S]*?)\1/);
    if (!tm) continue;
    const title = tm[2];
    const addRoute = (r) => r && r.startsWith('/') && !r.includes('${') && !r.includes('*');
    const literalRoutes = new Set();
    for (const g of block.matchAll(/goto\(\s*(['"`])([^'"`$]+)\1\s*\)/g)) if (addRoute(g[2])) literalRoutes.add(g[2]);
    for (const g of block.matchAll(/for\s*\(\s*const\s+[\w${}\s:,]+\s+of\s*\[([^\]]*)\]/g)) {
      for (const s of g[1].matchAll(/'([^']+)'/g)) if (addRoute(s[1])) literalRoutes.add(s[1]);
    }
    // 间接 goto：`for (const route of ROUTES) { … page.goto(route.path) }` → 按数组条目逐条展开用例
    const loop = text.slice(Math.max(0, a.pos - 600), a.pos).match(/for\s*\(\s*const\s+(\{[^}]*\}|[A-Za-z_$][\w$]*)\s+of\s+([A-Za-z_$][\w$]*)\s*\)/);
    const entries = loop ? constArrays.get(loop[2]) : null;
    if (loop && entries) {
      const destructured = loop[1].startsWith('{') ? [...loop[1].matchAll(/[A-Za-z_$][\w$]*/g)].map((x) => x[0]) : null;
      const gotos = [...block.matchAll(/goto\(\s*([A-Za-z_$][\w$]*)(?:\.([A-Za-z_$][\w$]*))?\s*\)/g)];
      for (const e of entries) {
        const routes = new Set(literalRoutes);
        for (const g of gotos) {
          const v = destructured && destructured.includes(g[1]) ? e.fields.get(g[1]) : e.fields.get(g[2] ?? 'path') ?? e.fields.get('');
          if (addRoute(v)) routes.add(v);
        }
        const expanded = title.replace(/\$\{([\w$]+)(?:\.([\w$]+))?\}/g, (all, name, prop) => {
          const v = destructured && destructured.includes(name) ? e.fields.get(name) : e.fields.get(prop ?? name);
          return v !== undefined ? v : all;
        });
        index.push({ file, title: expanded, routes });
      }
      continue;
    }
    if (!literalRoutes.size) {
      for (const g of block.matchAll(/['"`](\/[^'"`\s$*]*)['"`]/g)) if (addRoute(g[1])) literalRoutes.add(g[1]);
    }
    index.push({ file, title, routes: literalRoutes });
  }
}

/* ═══ 变更 → 受影响路由 ═══ */
const affected = new Map(); // route → reason
const directSpecFiles = new Set();
const unmapped = [];
const addAffected = (r, why) => {
  if (!affected.has(r)) affected.set(r, []);
  affected.get(r).push(why);
};
for (const f of relevant) {
  let matched = false;
  for (const r of liveRoutes) {
    if (r.components.includes(f)) {
      addAffected(r.path, `${f}（路由组件）`);
      matched = true;
    }
  }
  const cat = f.match(/^src\/app\/catalog\/pages\/([^/]+)\.ts$/);
  if (cat) {
    for (const r of liveRoutes) {
      if (r.catalog === cat[1]) {
        addAffected(r.path, `${f}（目录配置 ${cat[1]}）`);
        matched = true;
      }
    }
  }
  const segs = f.split('/');
  const dirSegs = segs.slice(0, -1).map((s) => s.toLowerCase());
  const baseRaw = segs[segs.length - 1] ?? '';
  // 模块名只认「目录段全等」或「文件名首个驼峰/连字符词元」，避免 EndgameFloorBuff 撞上 /currency/buff 这类子串误配
  const firstToken = (baseRaw.replace(/([a-z0-9])([A-Z])/g, '$1-$2').split(/[^A-Za-z0-9]+/)[0] || '').toLowerCase();
  for (const r of liveRoutes) {
    const keys = r.path.split('/').filter((s) => !s.startsWith(':') && s.length >= 4);
    const hit = keys.find((k) => {
      const kk = k.toLowerCase();
      return dirSegs.includes(kk) || (firstToken.length >= 4 && kk === firstToken);
    });
    if (hit) {
      addAffected(r.path, `${f}（模块名 ${hit}）`);
      matched = true;
    }
  }
  if (/^e2e\/.*\.spec\.ts$/.test(f)) {
    directSpecFiles.add(f);
    matched = true;
  }
  if (!matched && !f.startsWith('e2e/') && !pageGlobals.includes(f) && !e2eInfra.includes(f)) unmapped.push(f);
}

/* ═══ 路由 → 用例 ═══ */
const ris = [...affected.keys()].map(routeRegex);
const matchedTests = [];
for (const t of index) {
  const direct = directSpecFiles.has(t.file);
  const hit = t.routes.size ? [...t.routes].some((r) => ris.some((re) => re.test(r))) : false;
  if (direct || hit) matchedTests.push({ ...t, direct });
}
const pixelTests = matchedTests.filter((t) => t.file.includes('visual.spec.ts'));
const runTests = matchedTests.filter((t) => !t.file.includes('visual.spec.ts'));

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const grepOf = (list) => {
  const frags = new Set();
  for (const t of list) {
    const parts = t.title.split(/\$\{[^}]*\}/).map(escapeRe);
    frags.add(parts.length > 1 ? parts.join('.*') : escapeRe(t.title));
  }
  return [...frags].join('|');
};
const fileList = (list) => [...new Set(list.map((t) => t.file))].sort();
const guards = existsSync(join(ROOT, 'e2e', 'guards.spec.ts')) ? 'e2e/guards.spec.ts' : null;
const FALLBACK = [guards, 'e2e/layout.spec.ts'].filter(Boolean).join(' ');
const CI_CMD = `pnpm exec playwright test ${FALLBACK}`;

/* ═══ 报告 ═══ */
const B = (s) => `\x1b[1m${s}\x1b[0m`;
const isGlobal = pageGlobals.length > 0 || e2eInfra.length > 0;
console.log(B(`\n[受影响 e2e] 变更 ${changed.size} 文件（base=${base}）｜代码相关 ${relevant.length}｜全局判定 ${isGlobal ? '是' : '否'}｜受影响路由 ${affected.size}｜命中用例 ${matchedTests.length}\n`));
if (relevant.length) {
  console.log(B('── 代码相关变更 ──'));
  for (const f of relevant) console.log(`  ${f}`);
  console.log('');
}
if (ignored.length) console.log(`（忽略非代码路径 ${ignored.length} 个：docs/tools 等，不参与 e2e 影响面）\n`);

let cmd = null;
if (isGlobal) {
  console.log(B('── 全局判定 ──'));
  for (const f of pageGlobals) console.log(`  ${f} 属全局文件（单点声明 / 应用外壳 / 路由 / bootstrap）→ 影响全部页面`);
  for (const f of e2eInfra) console.log(`  ${f} 属 e2e 公共设施 → 全部 spec 受波及`);
  console.log('  （下方路由与用例仅作定位参考，命令按全局判定给全量）\n');
  cmd = CI_CMD;
}
if (affected.size) {
  console.log(B('── 受影响路由 ──'));
  for (const [r, why] of affected) {
    const list = [...new Set(why)];
    console.log(`  ${r.replace(/\([^)]*\)/g, '')}  ← ${list.slice(0, 3).join('、')}${list.length > 3 ? ` 等 ${list.length} 个文件` : ''}`);
  }
  console.log('');
}
if (unmapped.length) {
  console.log(B('── 未映射到路由的文件（若为共享组件/服务层，请追加全量 layout） ──'));
  for (const f of unmapped) console.log(`  ${f}`);
  console.log('');
}
if (runTests.length) {
  console.log(B('── 命中用例 ──'));
  for (const t of runTests) {
    console.log(`  ${t.file}: ${[...t.routes].join(',') || '（按文件纳入）'}  ${t.title}${t.direct ? '  [spec 本身变更]' : ''}`);
  }
  console.log('');
  if (!cmd) cmd = `pnpm exec playwright test ${fileList(runTests).join(' ')} --grep "${grepOf(runTests)}"`;
} else if (!isGlobal) {
  console.log(B('── 无法还原受影响用例 ──'));
  console.log('  推导不出（变更未落到任何路由，或该路由没有 goto 索引）→ 不要静默跳过：');
  console.log(`  建议跑 guards 层 + 全量 layout：${CI_CMD}\n`);
  cmd = CI_CMD;
}
if (pixelTests.length) {
  console.log(B(`── 像素基线（按需，未进默认命令；${pixelTests.length} 条） ──`));
  for (const t of pixelTests) console.log(`  ${t.file}  ${t.title}`);
  console.log(`  需要时：pnpm exec playwright test ${fileList(pixelTests).join(' ')}\n`);
}
if (cmd) {
  console.log(B('── 建议命令 ──'));
  console.log(`  ${cmd}\n`);
}

/* ═══ --run ═══ */
if (doRun) {
  const cli = join(ROOT, 'node_modules', '@playwright', 'test', 'cli.js');
  let exe;
  let argv;
  if (existsSync(cli)) {
    exe = process.execPath;
    argv = [cli];
  } else {
    exe = 'pnpm';
    argv = ['exec', 'playwright'];
  }
  const runArgs = cmd.replace(/^pnpm exec playwright /, '').match(/"[^"]*"|\S+/g).map((s) => s.replace(/^"|"$/g, ''));
  const full = [...argv, 'test', ...runArgs, ...passthrough];
  const quoted = full.map((s) => (/\s/.test(s) ? `"${s}"` : s)).join(' ');
  console.log(`[--run] ${exe} ${quoted}\n`);
  const r = spawnSync(exe, full, { cwd: ROOT, stdio: 'inherit' });
  process.exit(r.status ?? 1);
}
process.exit(0);
