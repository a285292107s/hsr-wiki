#!/usr/bin/env node
/**
 * AI 检索可见性端点守卫（契约 docs/agents/ai-discoverability.md §6；构建末步运行，失败即构建失败）。
 * 断言 7 项：① robots.txt 五个 UA 组各自自足 + Disallow: /prerender/ + Sitemap 与生成器同源；
 * ② sitemap.xml 合法、loc 全绝对同源无重复、与快照一一对应、≤50000；
 * ③ 每个快照的 title/canonical/内链/中文字符数/h1/JSON-LD/游戏标记/未展开参数占位符 `#\d+\[…\]`/
 *    裸 `#N`（仅 currency/item.html 与 currency/augment.html 按页点名，禁止全局化）/入口 JS，详情页禁 nk-snapshot__entry；
 * ④ 文件级覆盖率：每族快照数 = 数据 + 应用可见性判据独立推导的期望（禁写死数字；契约 §2「可见性对齐」）；
 * ⑤ 条目级覆盖率：12 个目录页 nk-snapshot__entry 计数 = 同一条目数、枢纽 ≥1、详情页抽样 = 0（契约 §6.4②③）；
 * ⑥ 外壳与首页：`prerender/_shell.html` 存在且不含 nk-snapshot、`dist/index.html` ≡ `prerender/home.html`（sha256）、
 *    `dist/index.html` 有非空 h1 与中文正文（Vercel 文件系统先于 rewrites，'/' 直接命中它）；
 * ⑦ 汇总一行 [PASS]/[FAIL]，任一失败退出码 1。prerender 下 `_` 前缀文件为非快照内部文件，扫描跳过并报数。
 * 用法：node tools/check-ai-endpoints.mjs [--dist dist] [--data public/data/cn]
 *        [--robots public/robots.txt] [--generator tools/gen-ai-endpoints.mjs]
 * 相对路径按仓库根解析（与 cwd 无关）。--robots / --generator 仅供 temp/ 下合成夹具自测，默认值即真实产物路径。
 * 禁止：把 SITE_ORIGIN 或覆盖率数字写死成本文件常量——SITE_ORIGIN 唯一事实源是生成器模块导出。
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative, isAbsolute, sep, basename } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));

/* ─── 契约常量（改动须同步 docs/agents/ai-discoverability.md §2/§5/§6） ─── */
const REQUIRED_ROBOTS_UAS = ['OAI-SearchBot', 'PerplexityBot', 'Claude-SearchBot', 'Googlebot', 'bingbot'];
const SITEMAP_MAX_URLS = 50000;
const MIN_CJK_CHARS = 80;
/** 单次运行每条断言的明细上限（真实产物上千快照，避免刷屏） */
const DETAIL_CAP = 20;
/** 快照正文里出现即判失败的游戏标记（契约 §3：必须剥成纯文本） */
const GAME_MARKERS = ['<color=', '<unbreak>', '<u>'];
/**
 * 未展开的参数占位符（契约 §3「参数展开保真」/ §6.3）：如 `#1[i]`、`#2[f1]%`——必须由 fillParams 展开，
 * 缺参数时应整段省略。**禁止误伤上游原文**：字面 `#81`（无 `[..]`）与 `{TEXTJOIN#61}` 不匹配本正则，必须放行。
 */
const PARAM_PLACEHOLDER_RE = /#\d+\[[^\]]*\]/g;
/**
 * 裸 `#N` 占位符（契约 §3「参数展开保真」延伸 / §6.3）：**只对下面两个 CW 目录页断言**。
 * 为什么按页点名而**禁止**扩成全局断言：裸 `#N` 无法与上游字面区分——`character/1303`「天才俱乐部#81号会员」、
 * `item.html` 的「#8拉姆」、`{TEXTJOIN#61}`、`achievement.html` 的 233 处都是与应用显示一致的上游原文，必须放行；
 * 而 CW 装备 / CW 投资策略这两族的数据条目携带 `params` 语义，裸 `#N` 即未展开占位符（应用侧渲染 `?`，缺参数须整段省略）。
 */
const BARE_HASH_PAGES = ['currency/item.html', 'currency/augment.html'];
const BARE_HASH_RE = /#\d+/g;

/* ─── 参数 ─── */
function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  const v = i >= 0 ? process.argv[i + 1] : null;
  return v && !v.startsWith('--') ? v : fallback;
}
const resolveFromRoot = (p) => (isAbsolute(p) ? p : join(ROOT, p));
const DIST = resolveFromRoot(arg('dist', 'dist'));
const DATA = resolveFromRoot(arg('data', join('public', 'data', 'cn')));
const ROBOTS = resolveFromRoot(arg('robots', join('public', 'robots.txt')));
const GENERATOR = resolveFromRoot(arg('generator', join('tools', 'gen-ai-endpoints.mjs')));

const rel = (p) => relative(ROOT, p) || p;

/* ─── SITE_ORIGIN 唯一事实源：生成器模块（对 import 无副作用） ─── */
let SITE_ORIGIN = null;
let originError = null;
try {
  if (!existsSync(GENERATOR)) throw new Error(`生成器文件不存在: ${rel(GENERATOR)}`);
  const mod = await import(pathToFileURL(GENERATOR).href);
  if (typeof mod.SITE_ORIGIN !== 'string') throw new Error('生成器未导出字符串常量 SITE_ORIGIN');
  SITE_ORIGIN = new URL(mod.SITE_ORIGIN).origin;
} catch (e) {
  originError = `无法从 ${rel(GENERATOR)} 读取 SITE_ORIGIN：${e.message}`;
}

/* ─── 通用工具 ─── */
function walk(dir) {
  const out = [];
  const stack = [dir];
  while (stack.length > 0) {
    const d = stack.pop();
    let entries;
    try {
      entries = readdirSync(d, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entries) {
      const p = join(d, e.name);
      if (e.isDirectory()) stack.push(p);
      else if (e.isFile()) out.push(p);
    }
  }
  return out;
}

/** 去脚本/样式与标签后的正文；解码基本实体（否则 &lt;color= 这类转义残留会逃过标记断言） */
function visibleText(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
}

function countCjk(s) {
  const m = s.match(/[\u3400-\u4dbf\u4e00-\u9fff]/g);
  return m ? m.length : 0;
}

function tagText(html, re) {
  const m = html.match(re);
  return m ? m[1].replace(/<[^>]*>/g, '').trim() : null;
}

/** 所有 <script src="...">（入口 / 分包） */
function scriptSrcs(html) {
  return [...html.matchAll(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi)].map((m) => m[1]);
}

/** <link rel="x" href="...">；无该 link 返回 null，href 缺失返回空串 */
function linkHref(html, relName) {
  for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
    const tag = m[0];
    const r = tag.match(/\brel\s*=\s*["']([^"']+)["']/i);
    if (!r || r[1].trim().toLowerCase() !== relName) continue;
    const h = tag.match(/\bhref\s*=\s*["']([^"']*)["']/i);
    return h ? h[1].trim() : '';
  }
  return null;
}

/**
 * 目录条目稳定标记计数（契约 §3：目录条目清单每条渲染为 `<li class="nk-snapshot__entry">`）。
 * 只认 li 元素且 class token 精确匹配（支持双/单引号、无引号、多 class）；其它标签上的同名 class 不计。
 */
function countEntryMarks(html) {
  let n = 0;
  for (const m of html.matchAll(/<li\b[^>]*>/gi)) {
    const cm = m[0].match(/\bclass\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    if (!cm) continue;
    if (((cm[1] ?? cm[2] ?? cm[3]) || '').split(/\s+/).includes('nk-snapshot__entry')) n++;
  }
  return n;
}

/** 详情页路由前缀（带 :id 的族）——`nk-snapshot__entry` 在这些页面上必须为 0（契约 §3 冻结）；
 *  目录/枢纽页（character.html / currency.html / currency/role.html …）不含尾斜杠，不会误命中 */
const DETAIL_ROUTE_PREFIXES = ['character/', 'lightcone/', 'relic/', 'monster/', 'endgame/', 'currency/role/', 'currency/trait/'];

function loadJson(relPath) {
  const p = join(DATA, relPath);
  try {
    return { ok: true, value: JSON.parse(readFileSync(p, 'utf-8')) };
  } catch (e) {
    return { ok: false, err: `${rel(p)}: ${e.message}` };
  }
}

/* ─── 扫描产物 ─── */
const PRERENDER = join(DIST, 'prerender');
/** 下划线前缀 = 内部文件（如 `_shell.html` 纯 SPA 外壳，由 vercel catch-all rewrite 投递）：
 *  它**不是快照**——禁止计入快照数 / sitemap 一一对应 / 覆盖率 / 条目数。 */
const isInternalFile = (f) => basename(f).startsWith('_');
const allPrerenderHtml = existsSync(PRERENDER)
  ? walk(PRERENDER).filter((f) => f.toLowerCase().endsWith('.html')).sort()
  : [];
const internalFiles = allPrerenderHtml.filter(isInternalFile);
const snapshotFiles = allPrerenderHtml.filter((f) => !isInternalFile(f));
const SHELL = join(PRERENDER, '_shell.html');
const DIST_INDEX = join(DIST, 'index.html');
const SITEMAP = join(DIST, 'sitemap.xml');
const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

/** prerender 内文件 → 路由（契约 §2：home.html 即 `/`） */
function routeOf(file) {
  const p = relative(PRERENDER, file).split(sep).join('/').replace(/\.html$/i, '');
  return p === 'home' ? '/' : `/${p}`;
}

const checks = [];
const push = (id, title, details) => checks.push({ id, title, ok: details.length === 0, details });

/* ═══ 1/5 robots.txt ═══ */
{
  const details = [];
  if (originError) details.push(originError);
  if (!existsSync(ROBOTS)) {
    details.push(`robots.txt 不存在: ${rel(ROBOTS)}（契约 §5：Lead 手写提交入库）`);
  } else {
    const groups = [];
    const sitemaps = [];
    let cur = null;
    for (const raw of readFileSync(ROBOTS, 'utf-8').split(/\r?\n/)) {
      const line = raw.replace(/#.*$/, '').trim();
      if (!line) {
        cur = null; // 空行 = 组结束（robots 标准）
        continue;
      }
      const m = line.match(/^([A-Za-z][A-Za-z-]*)\s*:\s*(.*)$/);
      if (!m) continue;
      const field = m[1].toLowerCase();
      const value = m[2].trim();
      if (field === 'sitemap') {
        sitemaps.push(value);
        cur = null;
        continue;
      }
      if (field === 'user-agent') {
        // 连续 User-agent 行同属一组；指令之后再出现 User-agent 则开新组
        if (!cur || cur.directives.length > 0) {
          cur = { agents: [], directives: [] };
          groups.push(cur);
        }
        cur.agents.push(value);
        continue;
      }
      if (!cur) {
        cur = { agents: [], directives: [] };
        groups.push(cur);
      }
      cur.directives.push({ field, value });
    }

    const byAgent = new Map();
    for (const g of groups) {
      for (const a of g.agents) if (!byAgent.has(a.toLowerCase())) byAgent.set(a.toLowerCase(), g);
    }
    for (const ua of REQUIRED_ROBOTS_UAS) {
      const g = byAgent.get(ua.toLowerCase());
      if (!g) {
        details.push(`robots.txt 缺少 User-agent 组: ${ua}`);
        continue;
      }
      if (!g.directives.some((d) => d.field === 'allow' && d.value === '/')) {
        details.push(`robots.txt ${ua} 组缺 Allow: /（命中具体 UA 组时 User-agent: * 组被完全忽略，每组必须自足）`);
      }
      if (!g.directives.some((d) => d.field === 'disallow' && d.value === '/prerender/')) {
        details.push(`robots.txt ${ua} 组缺 Disallow: /prerender/（快照是同内容第二份 URL，必须挡收录）`);
      }
    }
    if (sitemaps.length === 0) details.push('robots.txt 缺 Sitemap: 行');
    for (const s of sitemaps) {
      let u = null;
      try {
        u = new URL(s);
      } catch {
        details.push(`robots.txt Sitemap 行不是合法绝对 URL: ${s}`);
        continue;
      }
      if (!SITE_ORIGIN) {
        details.push(`robots.txt Sitemap ${s} 未做同源校验（SITE_ORIGIN 不可用）`);
        continue;
      }
      if (u.origin !== SITE_ORIGIN) details.push(`robots.txt Sitemap 与生成器 SITE_ORIGIN 不同源: ${s}（期望 ${SITE_ORIGIN}）`);
      if (u.pathname !== '/sitemap.xml') details.push(`robots.txt Sitemap 路径应为 /sitemap.xml，实际 ${u.pathname}`);
    }
  }
  push('1', `robots.txt（${REQUIRED_ROBOTS_UAS.length} 个 UA 组自足 + Disallow: /prerender/ + Sitemap 同源）`, details);
}

/* ═══ 2/5 sitemap.xml ═══ */
let sitemapCount = -1;
{
  const details = [];
  const snapshotRoutes = new Set(snapshotFiles.map(routeOf));
  if (!existsSync(SITEMAP)) {
    details.push(`sitemap.xml 不存在: ${rel(SITEMAP)}`);
  } else {
    const xml = readFileSync(SITEMAP, 'utf-8');
    if (!/<urlset\b/i.test(xml)) {
      details.push('sitemap.xml 缺 <urlset> 根元素（不是合法 URL set）');
    } else if (!/sitemaps\.org\/schemas\/sitemap/i.test(xml)) {
      details.push('sitemap.xml <urlset> 缺 sitemaps.org 0.9 命名空间');
    }
    const urlBlocks = xml.match(/<url\b[\s\S]*?<\/url>/gi) || [];
    const locs = [...xml.matchAll(/<loc\s*>\s*([\s\S]*?)\s*<\/loc>/gi)].map((m) => m[1]);
    sitemapCount = locs.length;
    if (locs.length !== urlBlocks.length) {
      details.push(`sitemap.xml <url> 块 ${urlBlocks.length} 个 ≠ <loc> ${locs.length} 条（结构不合法）`);
    }
    if (locs.length > SITEMAP_MAX_URLS) {
      details.push(`sitemap.xml URL 数 ${locs.length} 超过单文件上限 ${SITEMAP_MAX_URLS}`);
    }
    const seen = new Set();
    const dups = [];
    const bad = [];
    const sitemapRoutes = new Set();
    for (const loc of locs) {
      if (seen.has(loc)) dups.push(loc);
      seen.add(loc);
      let u = null;
      try {
        u = new URL(loc);
      } catch {
        bad.push(`${loc}（非绝对 URL）`);
        continue;
      }
      if (!/^https?:$/i.test(u.protocol)) {
        bad.push(`${loc}（协议 ${u.protocol}）`);
        continue;
      }
      if (SITE_ORIGIN && u.origin !== SITE_ORIGIN) {
        bad.push(`${loc}（非同源，期望 ${SITE_ORIGIN}）`);
        continue;
      }
      if (u.search || u.hash) {
        bad.push(`${loc}（不应带查询/片段）`);
        continue;
      }
      sitemapRoutes.add(u.pathname);
    }
    if (dups.length > 0) details.push(`sitemap.xml 重复 <loc> ${dups.length} 条: ${dups.slice(0, 5).join(', ')}`);
    if (bad.length > 0) details.push(`sitemap.xml 非法 <loc> ${bad.length} 条: ${bad.slice(0, 5).join(', ')}`);
    const missing = [...snapshotRoutes].filter((r) => !sitemapRoutes.has(r));
    const extra = [...sitemapRoutes].filter((r) => !snapshotRoutes.has(r));
    if (missing.length > 0) details.push(`sitemap 缺 ${missing.length} 个快照对应 URL: ${missing.slice(0, 8).join(', ')}`);
    if (extra.length > 0) details.push(`sitemap 含 ${extra.length} 个无快照的 URL: ${extra.slice(0, 8).join(', ')}`);
    if (sitemapRoutes.size !== snapshotRoutes.size) {
      details.push(`sitemap URL 数 ${sitemapRoutes.size} ≠ 快照数 ${snapshotRoutes.size}（契约 §6.2 要求一一对应）`);
    }
    if (!SITE_ORIGIN) details.push('sitemap.xml 未做同源校验（SITE_ORIGIN 不可用）');
  }
  push('2', `sitemap.xml（合法 URL set / 同源 / 无重复 / 与快照一一对应 / ≤${SITEMAP_MAX_URLS}）`, details);
}

/* ═══ 3/5 快照正文 ═══ */
{
  const details = [];
  let defaultTitle = null;
  let entryScripts = [];
  /** 基线 = 纯 SPA 外壳 `prerender/_shell.html`（**不再**是 dist/index.html——它现在是 home 快照，
   *  其 title/h1 是首页标题，拿它当外壳基线会把每个快照都判成「默认标题」） */
  if (!existsSync(SHELL)) {
    details.push(`缺纯 SPA 外壳 ${rel(SHELL)}，无法取得默认 title 与入口 <script src> 基线（task-10 落地前会如此）`);
  } else {
    const shellHtml = readFileSync(SHELL, 'utf-8');
    defaultTitle = tagText(shellHtml, /<title[^>]*>([\s\S]*?)<\/title>/i);
    entryScripts = scriptSrcs(shellHtml).sort();
    if (!defaultTitle) details.push(`${rel(SHELL)} 无 <title>，无法判定快照默认标题`);
    if (entryScripts.length === 0) details.push(`${rel(SHELL)} 无 <script src> 入口，无法校验快照入口一致性`);
  }
  if (snapshotFiles.length === 0) {
    details.push(`未发现任何快照: ${rel(PRERENDER)} 下 0 个 .html（先跑 node tools/gen-ai-endpoints.mjs）`);
  }

  const violations = [];
  /** 命中未展开参数占位符的快照数（用于在明细首行给出规模，单个文件仍逐条点名） */
  let phFiles = 0;
  /** 命中裸 #N 的 CW 目录页（按页点名，最多 2 页） */
  const bareHashHits = [];
  for (const file of snapshotFiles) {
    const name = rel(file);
    const route = routeOf(file);
    const add = (msg) => violations.push(`${name}: ${msg}`);
    let html;
    try {
      html = readFileSync(file, 'utf-8');
    } catch (e) {
      add(`无法读取（${e.message}）`);
      continue;
    }

    // title 非空且非站点默认
    const title = tagText(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
    if (!title) add('缺 <title> 或标题为空');
    else if (defaultTitle && title === defaultTitle) add(`<title> 仍是站点默认标题「${title}」`);

    // canonical 同源 + 路径 = 路由
    const canonical = linkHref(html, 'canonical');
    if (canonical === null) add('缺 <link rel="canonical">');
    else if (!canonical) add('canonical href 为空');
    else {
      let u = null;
      try {
        u = new URL(canonical);
      } catch {
        add(`canonical 非绝对 URL: ${canonical}`);
      }
      if (u) {
        if (SITE_ORIGIN && u.origin !== SITE_ORIGIN) add(`canonical 非同源: ${canonical}（期望 ${SITE_ORIGIN}）`);
        const norm = (p) => (p === '/' ? '/' : p.replace(/\/+$/, ''));
        if (norm(u.pathname) !== norm(route)) add(`canonical 路径与快照路由不符: ${u.pathname} ≠ ${route}`);
      }
    }

    // ≥1 条真实站内 <a href>，且禁 # / JS 链接（契约 §3）
    const anchors = [...html.matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"']*)["'][^>]*>/gi)].map((m) => m[1].trim());
    const internal = anchors.filter((h) => h.startsWith('/') || (SITE_ORIGIN && h.startsWith(SITE_ORIGIN + '/')));
    if (internal.length === 0) {
      add(`无站内 <a href="/...">（内链是快照存在的首要目的；当前 ${anchors.length} 个 a）`);
    }
    const bogus = anchors.filter((h) => !h.startsWith('/') && !/^https?:\/\//i.test(h));
    if (bogus.length > 0) add(`含非法链接 href（禁止 # / JS / 相对路径）: ${bogus.slice(0, 3).join(', ')}`);

    // 去标签正文中文字符
    const text = visibleText(html);
    /** 标记扫描面必须含原始标签文本：游戏标记 `<color=…>` / `<unbreak>` 形似 HTML 标签，
     *  会被 visibleText 一并剥掉，只看去标签正文会漏判。
     *  同时剥掉 HTML 注释：注释不是可见文本，且模板注释里含十六进制色（如 `--blk-850 #121214`），
     *  保留会让裸 `#N` / 颜色类模式误报 */
    const rawScan = html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<!--[\s\S]*?-->/g, ' ');
    const cjk = countCjk(text);
    if (cjk < MIN_CJK_CHARS) add(`去标签正文中文字符 ${cjk} < ${MIN_CJK_CHARS}（服务端 HTML 必须有正文）`);

    // h1 非空
    const h1 = tagText(html, /<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
    if (h1 === null) add('缺 <h1>');
    else if (!h1) add('<h1> 文本为空');

    // JSON-LD 可解析
    const lds = [...html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
    if (lds.length === 0) add('缺 JSON-LD <script type="application/ld+json">');
    for (let i = 0; i < lds.length; i++) {
      try {
        JSON.parse(lds[i].trim());
      } catch (e) {
        add(`JSON-LD #${i + 1} JSON.parse 失败: ${e.message}`);
      }
    }

    // 游戏标记残留（原始标签面 + 解码后的正文面，覆盖转义与未转义两种残留）
    for (const marker of GAME_MARKERS) {
      if (rawScan.includes(marker) || text.includes(marker)) add(`正文残留游戏标记 ${marker}`);
    }
    if (rawScan.includes('\\n') || text.includes('\\n')) add('正文残留字面 \\n 游戏换行标记');

    // 未展开参数占位符（契约 §3「参数展开保真」/ §6.3）：同一扫描面；字面 `#81`、`{TEXTJOIN#61}` 不匹配故放行
    const phText = text.match(PARAM_PLACEHOLDER_RE) || [];
    const phRaw = rawScan.match(PARAM_PLACEHOLDER_RE) || [];
    if (phText.length > 0 || phRaw.length > 0) {
      // 计数优先取可见文本面；占位符只在标签属性里出现时（标签剥离后不可见）回退原始面计数
      const n = phText.length > 0 ? phText.length : phRaw.length;
      phFiles++;
      add(`正文残留未展开参数占位符 ${n} 处（如 ${(phText[0] || phRaw[0]).replace(/</g, '&lt;')}）`);
    }

    // 裸 #N：**按页点名**，仅 BARE_HASH_PAGES 两页（禁止全局化——理由见该常量注释）。
    // 只扫**可见文本**面（text），不扫原始面：标签属性/注释/CSS 里的十六进制色（如 shell 注释的
    // `--blk-850 #121214`、`style="border-color:#121214"`）匹配 `#\d+` 但都不是可见文本，扫原始面会误报。
    const snapPath = relative(PRERENDER, file).split(sep).join('/');
    if (BARE_HASH_PAGES.includes(snapPath)) {
      const bh = text.match(BARE_HASH_RE) || [];
      if (bh.length > 0) {
        bareHashHits.push(snapPath);
        add(`可见文本残留裸 #N 占位符 ${bh.length} 处（如 ${bh[0]}）。本断言按契约 §6.3 仅点名这两个 CW 目录页——裸 #N 无法与上游字面（天才俱乐部#81号会员 / #8拉姆 / {TEXTJOIN#61} / achievement.html 的 233 处）区分，禁止扩为全局断言；也只扫可见文本（属性/注释中的 #121214 等色值不算）`);
      }
    }

    // 入口 JS 与 dist/index.html 完全一致（复制 shell 而非重写模板）
    const scripts = scriptSrcs(html).sort();
    if (entryScripts.length > 0 && scripts.join('|') !== entryScripts.join('|')) {
      add(`入口 <script src> 与 dist/index.html 不一致: [${scripts.join(', ')}] ≠ [${entryScripts.join(', ')}]`);
    }

    // 契约 §3：nk-snapshot__entry 冻结为「仅目录条目清单」——详情页出现即违规（此处 html 已读入，全量覆盖零额外 IO）
    const relNoExt = relative(PRERENDER, file).split(sep).join('/').replace(/\.html$/i, '');
    if (DETAIL_ROUTE_PREFIXES.some((p) => relNoExt.startsWith(p))) {
      const marks = countEntryMarks(html);
      if (marks > 0) add(`详情页出现 ${marks} 个 nk-snapshot__entry（契约 §3：该类名仅用于目录条目清单）`);
    }
  }

  const preCount = details.length; // 逐文件扫描前的前置问题（模板缺失 / 入口缺失 / 无快照）
  details.push(...violations);
  if (phFiles > 0) {
    details.unshift(`未展开参数占位符命中 ${phFiles}/${snapshotFiles.length} 个快照（契约 §3「参数展开保真」：缺参数须整段省略，禁止原样发布）`);
  }
  if (bareHashHits.length > 0) {
    details.unshift(`裸 #N 占位符命中 ${bareHashHits.length}/${BARE_HASH_PAGES.length} 个 CW 目录页（${bareHashHits.join(', ')}）——仅按页点名；其余页的字面 #N 属上游原文，必须放行`);
  }
  const skipNote = internalFiles.length > 0
    ? `；跳过内部文件 ${internalFiles.length} 个（${internalFiles.map((f) => basename(f)).join(', ')}——非快照，不计入覆盖率/条目数）`
    : '';
  const title = details.length === 0
    ? `快照正文（${snapshotFiles.length} 个文件 × 11 项断言全通过${skipNote}）`
    : `快照正文（${violations.length} 项文件级违规 + ${preCount} 项前置问题）`;
  push('3', title, details);
}

/* ═══ 4/5 覆盖率（实时统计，禁写死数字） ═══ */
{
  const details = [];

  /** 单页族：契约 §2 表中无 `:id` 的路由，各恰好 1 个快照文件 */
  const singleFamilies = [
    ['home', 'home.html', '/'],
    ['character', 'character.html', '/character'],
    ['lightcone', 'lightcone.html', '/lightcone'],
    ['relic', 'relic.html', '/relic'],
    ['item', 'item.html', '/item'],
    ['monster', 'monster.html', '/monster'],
    ['endgame', 'endgame.html', '/endgame'],
    ['achievement', 'achievement.html', '/achievement'],
    ['currency', 'currency.html', '/currency'],
    ['currency/role', 'currency/role.html', '/currency/role'],
    ['currency/item', 'currency/item.html', '/currency/item'],
    ['currency/buff', 'currency/buff.html', '/currency/buff'],
    ['currency/augment', 'currency/augment.html', '/currency/augment'],
    ['currency/trait', 'currency/trait.html', '/currency/trait'],
  ];

  /**
   * 详情族：id 集 = 数据 + **应用可见性判据**（契约 §2「可见性对齐」）独立推导，禁止信生成器自述。
   * 逐条对齐 src/app/catalog/pages/*.ts 的 fetchData：
   *  · character/lightcone/relic/monster：`if (!info.name) continue;`（character.ts:28 / lightcone.ts:19 / relic.ts:17 / monster.ts:34）
   *  · currency/role、currency/trait：`roles.map` / `traits.map` 无条目过滤（currency-role.ts:84 / currency-trait.ts:71）→ 全量计入
   *  · 未纳入的例外：character.ts:29 的开拓者形态过滤读 localStorage 偏好（默认女），是**用户偏好**不是数据判据，
   *    且 8xxx 详情路由不受它影响；按它收缩会丢 5 个真实可达实体页（8001/8003/8005/8007/8009），
   *    故本族仍计全部非空 name 条目（与 §2 表 98 一致）。该特例已上报 Lead 裁决。
   */
  const idFamilyDefs = [
    ['character', 'character', 'characters.json', (j) => j.filter((x) => x && x.name).map((x) => String(x.id))],
    ['lightcone', 'lightcone', 'light_cones.json', (j) => j.filter((x) => x && x.name).map((x) => String(x.id))],
    ['relic', 'relic', 'relics.json', (j) => j.filter((x) => x && x.name).map((x) => String(x.id))],
    ['monster', 'monster', 'monsters.json', (j) => j.filter((x) => x && x.name).map((x) => String(x.id))],
    ['currency/role', 'currency/role', 'currency/role.json', (j) => j.roles.map((x) => String(x.id))],
    ['currency/trait', 'currency/trait', 'currency/traits.json', (j) => j.traits.map((x) => String(x.id))],
  ];

  /** 终局：mode 与 catalog 的对应关系取自 src/app/router（maze/story/boss/peak）。
   *  条目判据 = src/app/catalog/pages/endgame.ts:190 `if (!info || !info.zh) continue;`（zh 求真值），
   *  故 maze_boss 的 3022（zh 为空串）**不计入期望**；生成器必须施加同一判据，禁止为其兜底命名。
   *  期望值与数据同源自动跟随：数据出现新的空 zh 赛季即自动从期望中消失。 */
  const endgameModes = [
    ['maze', 'maze.catalog.json'],
    ['story', 'maze_extra.catalog.json'],
    ['boss', 'maze_boss.catalog.json'],
    ['peak', 'maze_peak.catalog.json'],
  ];

  const families = [];
  for (const [id, file, route] of singleFamilies) families.push({ kind: 'single', id, file, route });
  for (const [id, dir, dataFile, pick] of idFamilyDefs) {
    const loaded = loadJson(dataFile);
    if (!loaded.ok) {
      details.push(`数据文件无法解析（覆盖率断言失效）: ${loaded.err}`);
      families.push({ kind: 'ids', id, dir, expected: null, source: dataFile });
      continue;
    }
    let ids = [];
    try {
      ids = pick(loaded.value);
    } catch (e) {
      details.push(`数据文件结构不符（${dataFile}）: ${e.message}`);
    }
    families.push({ kind: 'ids', id, dir, expected: new Set(ids), source: dataFile });
  }
  for (const [mode, dataFile] of endgameModes) {
    const loaded = loadJson(dataFile);
    if (!loaded.ok) {
      details.push(`数据文件无法解析（覆盖率断言失效）: ${loaded.err}`);
      families.push({ kind: 'ids', id: `endgame/${mode}`, dir: `endgame/${mode}`, expected: null, source: dataFile });
      continue;
    }
    const ids = Object.entries(loaded.value)
      .filter(([, info]) => info && info.zh)
      .map(([key]) => key);
    families.push({ kind: 'ids', id: `endgame/${mode}`, dir: `endgame/${mode}`, expected: new Set(ids), source: dataFile });
  }

  // 快照归类
  const observedSingle = new Set();
  const observedIds = new Map(families.filter((f) => f.kind === 'ids').map((f) => [f.id, new Set()]));
  const strays = [];
  for (const file of snapshotFiles) {
    const relNoExt = relative(PRERENDER, file).split(sep).join('/').replace(/\.html$/i, '');
    const single = families.find((f) => f.kind === 'single' && f.file.replace(/\.html$/i, '') === relNoExt);
    if (single) {
      observedSingle.add(single.id);
      continue;
    }
    const idsFam = families.find(
      (f) => f.kind === 'ids' && relNoExt.startsWith(f.dir + '/') && !relNoExt.slice(f.dir.length + 1).includes('/'),
    );
    if (idsFam) {
      observedIds.get(idsFam.id).add(relNoExt.slice(idsFam.dir.length + 1));
      continue;
    }
    strays.push(relNoExt + '.html');
  }

  // 单页族
  const missingSingles = families.filter((f) => f.kind === 'single' && !observedSingle.has(f.id));
  if (missingSingles.length > 0) {
    details.push(
      `缺 ${missingSingles.length} 个单页快照: ${missingSingles.map((f) => `prerender/${f.file}（路由 ${f.route}）`).join(', ')}`,
    );
  }

  // 详情族：计数 + id 集差
  const covered = [];
  for (const f of families) {
    if (f.kind !== 'ids') continue;
    const obs = observedIds.get(f.id);
    if (!f.expected) {
      covered.push(`${f.id}=${obs.size}(数据不可用)`);
      continue;
    }
    const missing = [...f.expected].filter((id) => !obs.has(id));
    const extra = [...obs].filter((id) => !f.expected.has(id));
    if (obs.size !== f.expected.size) {
      details.push(`${f.id}: 快照 ${obs.size} 个 ≠ 数据 ${f.expected.size} 条（缺 id: ${missing.slice(0, 5).join(', ') || '无'}；多出: ${extra.slice(0, 5).join(', ') || '无'}）`);
    } else if (missing.length > 0 || extra.length > 0) {
      details.push(`${f.id}: 快照数与数据一致但 id 集不同（缺: ${missing.slice(0, 5).join(', ')}；多出: ${extra.slice(0, 5).join(', ')}）`);
    }
    covered.push(`${f.id}=${obs.size}/${f.expected.size}`);
  }

  if (strays.length > 0) details.push(`未登记快照 ${strays.length} 个（不在契约 §2 路由表内）: ${strays.slice(0, 8).join(', ')}`);

  const expectedTotal =
    families.filter((f) => f.kind === 'single').length +
    families.filter((f) => f.kind === 'ids' && f.expected).reduce((n, f) => n + f.expected.size, 0);
  if (details.length === 0 && snapshotFiles.length !== expectedTotal) {
    details.push(`快照总数 ${snapshotFiles.length} ≠ 数据实时统计 ${expectedTotal}`);
  }

  const title = details.length === 0
    ? `覆盖率（数据实时统计一致：${covered.join(' ')}，单页 ${observedSingle.size}/${singleFamilies.length}）`
    : '覆盖率（生成文件数与数据实时统计不一致）';
  push('4', title, details);
}

/* ═══ 5/6 条目级覆盖率（契约 §6.4②③：防「生成器静默漏条目」——文件数断言查不出） ═══ */
{
  const details = [];
  const ENTRY = 'nk-snapshot__entry';
  const named = (x) => Boolean(x && x.name);

  /** 目录页期望：判据与检查 4 同源（数据 + 应用可见性），逐条对齐 pages/*.ts 的 fetchData */
  const specs = [];
  const addSpec = (file, route, dataFile, pick, note) => {
    const r = loadJson(dataFile);
    if (!r.ok) {
      details.push(`数据源不可用（条目级断言失效）: ${r.err}`);
      specs.push({ file, route, want: null, note });
      return;
    }
    let n = null;
    try {
      n = pick(r.value).length;
    } catch (e) {
      details.push(`数据源结构不符（${dataFile}）: ${e.message}`);
    }
    specs.push({ file, route, want: n, note });
  };

  addSpec('character.html', '/character', 'characters.json', (j) => j.filter(named), 'characters.json 非空 name（character.ts:28）');
  addSpec('lightcone.html', '/lightcone', 'light_cones.json', (j) => j.filter(named), 'light_cones.json 非空 name（lightcone.ts:19）');
  addSpec('relic.html', '/relic', 'relics.json', (j) => j.filter(named), 'relics.json 非空 name（relic.ts:17）');
  addSpec('item.html', '/item', 'items.json', (j) => j.filter(named), 'items.json 非空 name（item.ts:88）');
  addSpec('monster.html', '/monster', 'monsters.json', (j) => j.filter(named), 'monsters.json 非空 name（monster.ts:34）');
  addSpec('achievement.html', '/achievement', 'achievements.json', (j) => j, 'achievements.json（应用无条目过滤）');
  addSpec('currency/role.html', '/currency/role', 'currency/role.json', (j) => j.roles, 'currency/role.json roles（无过滤）');
  addSpec('currency/item.html', '/currency/item', 'currency/equipment.json', (j) => j.items, 'currency/equipment.json items（无过滤）');
  addSpec('currency/buff.html', '/currency/buff', 'currency/portals.json', (j) => j.portals.filter((p) => p && p.in_book), 'currency/portals.json in_book（currency-portal.ts:30）');
  addSpec('currency/augment.html', '/currency/augment', 'currency/augments.json', (j) => j.augments, 'currency/augments.json augments（无过滤）');
  addSpec('currency/trait.html', '/currency/trait', 'currency/traits.json', (j) => j.traits, 'currency/traits.json traits（无过滤）');
  let endgameWant = 0;
  let endgameOk = true;
  for (const f of ['maze.catalog.json', 'maze_extra.catalog.json', 'maze_boss.catalog.json', 'maze_peak.catalog.json']) {
    const r = loadJson(f);
    if (!r.ok) {
      details.push(`数据源不可用（条目级断言失效）: ${r.err}`);
      endgameOk = false;
      continue;
    }
    endgameWant += Object.entries(r.value).filter(([, info]) => info && info.zh).length;
  }
  specs.push({ file: 'endgame.html', route: '/endgame', want: endgameOk ? endgameWant : null, note: '四张 maze*.catalog.json 的 zh 真值键并集（endgame.ts:190）' });

  const readSnap = (file) => {
    const p = join(PRERENDER, file);
    if (!existsSync(p)) {
      details.push(`缺快照 ${rel(p)}，无法统计条目`);
      return null;
    }
    return readFileSync(p, 'utf-8');
  };

  const catCounts = [];
  for (const s of specs) {
    const html = readSnap(s.file);
    if (html === null) continue;
    const got = countEntryMarks(html);
    if (s.want === null) {
      details.push(`${s.route}: 期望条目数不可推导（数据源不可用），实测 ${ENTRY} ${got} 个`);
      continue;
    }
    if (got !== s.want) details.push(`${s.route}: ${ENTRY} 条目 ${got} ≠ 应用可见条目 ${s.want}（${s.note}）`);
    catCounts.push(`${s.route.slice(1)}=${got}/${s.want}`);
  }

  // 枢纽页：分区是 curated 子集，只断言 ≥1（契约 §6.4③）
  const hubCounts = [];
  for (const [file, route] of [['home.html', '/'], ['currency.html', '/currency']]) {
    const html = readSnap(file);
    if (html === null) continue;
    const got = countEntryMarks(html);
    if (got < 1) details.push(`${route}: 枢纽页 ${ENTRY} 条目 ${got} < 1（分区是 curated 子集，至少 1 条）`);
    hubCounts.push(`${route === '/' ? 'home' : 'currency'}=${got}/≥1`);
  }

  // 详情页抽样（契约要求抽 3 页）：优先用契约点名的快照；该 id 若已从数据消失，回退到该族排序最前者，
  // 避免「样本腐烂」把真实产物判成假失败（断言本身不放宽——计数仍必须 = 0）。全量详情页由检查 3 逐文件覆盖。
  const sampled = [];
  for (const [dir, prefFile, prefRoute] of [
    ['character', 'character/1308.html', '/character/1308'],
    ['lightcone', 'lightcone/20000.html', '/lightcone/20000'],
    ['monster', 'monster/1002011.html', '/monster/1002011'],
  ]) {
    let file = prefFile;
    let route = prefRoute;
    if (!existsSync(join(PRERENDER, prefFile))) {
      const alt = snapshotFiles.find((f) => relative(PRERENDER, f).split(sep).join('/').startsWith(dir + '/'));
      if (!alt) {
        details.push(`详情页抽样：${dir}/ 下无快照（见检查 4 覆盖率）`);
        continue;
      }
      file = relative(PRERENDER, alt).split(sep).join('/');
      route = routeOf(alt);
    }
    const got = countEntryMarks(readFileSync(join(PRERENDER, file), 'utf-8'));
    if (got !== 0) details.push(`${route}: 详情页出现 ${ENTRY} ${got} 个（契约 §3 冻结该类名仅用于目录条目清单）`);
    sampled.push(`${route}=${got}`);
  }

  const title = details.length === 0
    ? `条目级覆盖率（${catCounts.join(' ')}；枢纽 ${hubCounts.join(' ')}；详情页抽样 ${sampled.join(' ')}）`
    : '条目级覆盖率（目录条目数 ≠ 应用可见条目数，或枢纽/详情页标记违规）';
  push('5', title, details);
}

/* ═══ 6/7 外壳与首页一致性（线上实测：Vercel 文件系统先于 rewrites，`/` 必须直接命中 home 快照） ═══ */
{
  const details = [];
  // ① 纯 SPA 外壳存在且不含任何快照内容（catch-all rewrite 的投递目标）
  if (!existsSync(SHELL)) {
    details.push(`缺纯 SPA 外壳 ${rel(SHELL)}（vercel catch-all rewrite 的投递目标；task-10 落地前会如此）`);
  } else {
    const shellHtml = readFileSync(SHELL, 'utf-8');
    const marks = (shellHtml.match(/nk-snapshot/g) || []).length;
    if (marks !== 0) details.push(`${rel(SHELL)}: 出现 ${marks} 处 nk-snapshot——纯外壳不得含快照内容（它经 rewrite 投递给全部 CSR 路由）`);
  }
  // ② dist/index.html ≡ prerender/home.html（字节等价，sha256）
  if (!existsSync(DIST_INDEX)) {
    details.push(`缺 ${rel(DIST_INDEX)}（'/' 的文件系统命中目标）`);
  } else if (!existsSync(join(PRERENDER, 'home.html'))) {
    details.push(`缺 ${rel(join(PRERENDER, 'home.html'))}，无法与 dist/index.html 比对`);
  } else {
    const hi = sha256(readFileSync(DIST_INDEX));
    const hh = sha256(readFileSync(join(PRERENDER, 'home.html')));
    if (hi !== hh) {
      details.push(`dist/index.html 与 prerender/home.html 字节不等价（sha256 ${hi.slice(0, 12)}… ≠ ${hh.slice(0, 12)}…）——'/' 由文件系统直接投递，两份必须是同一份 home 快照`);
    }
  }
  // ③ dist/index.html 必须自带正文（否则 '/' 又变回空壳——线上实测 962 B）
  if (existsSync(DIST_INDEX)) {
    const html = readFileSync(DIST_INDEX, 'utf-8');
    const h1 = tagText(html, /<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
    if (!h1) details.push(`${rel(DIST_INDEX)}: 缺非空 <h1>（'/' 必须投递含正文的 home 快照，不能是纯外壳）`);
    if (countCjk(visibleText(html)) === 0) details.push(`${rel(DIST_INDEX)}: 去标签中文字符 = 0（线上实测 '/' 曾返回 962 B 空壳）`);
  }
  push('6', '外壳与首页（_shell.html 无 nk-snapshot / dist/index.html ≡ prerender/home.html / index.html 有 h1 与正文）', details);
}

/* ═══ 输出 ═══ */
let failed = 0;
const lines = [];
for (const c of checks) {
  lines.push(`[${c.ok ? 'PASS' : 'FAIL'}] ${c.id}/7 ${c.title}`);
  if (!c.ok) failed++;
  for (const d of c.details.slice(0, DETAIL_CAP)) lines.push(`       - ${d}`);
  if (c.details.length > DETAIL_CAP) lines.push(`       - …另有 ${c.details.length - DETAIL_CAP} 项未列出`);
}
console.log(lines.join('\n'));
console.log(
  failed === 0
    ? `[PASS] 7/7 汇总：AI 端点守卫通过（快照 ${snapshotFiles.length}，跳过内部文件 ${internalFiles.length}${internalFiles.length ? `(${internalFiles.map((f) => basename(f)).join(', ')})` : ''}，sitemap ${sitemapCount}，robots UA 组 ${REQUIRED_ROBOTS_UAS.length}，SITE_ORIGIN ${SITE_ORIGIN}）`
    : `[FAIL] 7/7 汇总：AI 端点守卫失败（${failed}/7 项断言不通过，明细见上）`,
);
/* 用 exitCode 而非 process.exit()：失败明细可能上千行，process.exit 在管道下可能截断 stdout */
process.exitCode = failed === 0 ? 0 : 1;
