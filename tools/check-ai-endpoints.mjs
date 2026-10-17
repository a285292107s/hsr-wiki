#!/usr/bin/env node
/**
 * AI 检索可见性端点守卫（契约 docs/agents/ai-discoverability.md §6；构建末步运行，失败即构建失败）。
 * 断言 7 项：① AI 入口文件：robots.txt 五个 UA 组各自自足 + Disallow: /prerender/ + Sitemap 与生成器同源，
 *    llms.txt 为真文本（非 HTML 外壳）且链接全同源；
 * ② sitemap.xml 合法、loc 全绝对同源无重复、与快照一一对应、≤50000；
 * ③ 每个快照的 title/canonical/内链/中文字符数/h1/JSON-LD（内嵌 URL 语言归属按白名单=必须落在本语言
 *    前缀下、源与路径之间必须有分隔符、自身 canonical 路径必须在场）/游戏标记/未展开参数占位符 `#\d+\[…\]`/
 *    裸 `#N`（仅 currency/item.html 与 currency/augment.html 按页点名，禁止全局化）/入口 JS，详情页与专题页
 *    voracity.html 禁 nk-snapshot__entry；正文抽取必须非空（抽取为空即判红——抽取恒空会让全部正文类
 *    断言静默失效）；快照禁 noindex（robots noindex 是 `_shell.html` 专属）/ JSON-LD 页面级节点
 *    `dateModified` = `version.json.synced_at` / 页脚 `<p class="nk-snapshot__meta">` 内
 *    `<time datetime="{synced_at}">{synced_at}</time>`；汉字脚本语言（cn/cht/jp/kr）以外的分层快照
 *    正文禁汉字（棘轮，基线 `tools/ai-han-baseline.json`）；
 * ④ 文件级覆盖率：每族快照数 = 数据 + 应用可见性判据独立推导的期望（禁写死数字；契约 §2「可见性对齐」）；
 * ⑤ 条目级覆盖率：12 个目录页 nk-snapshot__entry 计数 = 同一条目数、枢纽 ≥1、详情页抽样 = 0（契约 §6.4②③）；
 *    `/item` `/achievement`（含 13 语言）的每条 nk-snapshot__entry 必须落在带非空 `<h2>` 的
 *    `nk-snapshot__section` 内、全站禁空 `<ul class="nk-snapshot__list"></ul>`；
 *    专题页 `/voracity` **不在此列**——它不是目录，正文分区不是「应用收录条目集合」，故无条目级断言（契约 §3/§6.4 注）。
 * ⑥ 外壳与首页：`prerender/_shell.html` 存在且不含 nk-snapshot、`dist/index.html` ≡ `prerender/home.html`（sha256）、
 *    `dist/index.html` 有非空 h1 与中文正文（Vercel 文件系统先于 rewrites，'/' 直接命中它）；
 *    首页族 13 份（`home.html` + 12 个语言前缀）的 `nk-snapshot__stats` 恰 6 条统计（N = 检查 5 的实时
 *    条目期望，禁写死），stats 类名不得出现在非首页族；
 * ⑦ 汇总一行 [PASS]/[FAIL]，任一失败退出码 1。prerender 下 `_` 前缀文件为非快照内部文件，扫描跳过并报数。
 * 用法：node tools/check-ai-endpoints.mjs [--dist dist] [--data public/data/cn]
 *        [--robots public/robots.txt] [--generator tools/gen-ai-endpoints.mjs]
 * 相对路径按仓库根解析（与 cwd 无关）。--robots / --generator 仅供 temp/ 下合成夹具自测，默认值即真实产物路径。
 * 禁止：把 SITE_ORIGIN 或覆盖率数字写死成本文件常量——SITE_ORIGIN 唯一事实源是生成器模块导出。
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative, isAbsolute, sep, basename } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));

/* ─── 契约常量（改动须同步 docs/agents/ai-discoverability.md §2/§5/§6） ─── */
const REQUIRED_ROBOTS_UAS = ['OAI-SearchBot', 'PerplexityBot', 'Claude-SearchBot', 'Googlebot', 'bingbot'];
const SITEMAP_MAX_URLS = 50000;
const MIN_CJK_CHARS = 80;
/** 合法使用汉字的语言（按**脚本**划界，不是按「非缺省语言」）：cn / cht / jp / kr。
 *  其余语言的分层快照正文出现汉字即判残留——口径边界见正文抽取处。 */
const HAN_SCRIPT_LOCALES = new Set(['cn', 'cht', 'jp', 'kr']);
/** 单次运行每条断言的明细上限 */
const DETAIL_CAP = 20;
/** 快照正文里出现即判失败的游戏标记（契约 §3：必须剥成纯文本） */
const GAME_MARKERS = ['<color=', '<unbreak>', '<u>'];
/**
 * 性别变体标记 `{M#…}{F#…}`：**只对「名字」面断言，禁止全局化**。
 *
 * 为什么不能进 GAME_MARKERS：该标记在**描述类文本**里合法保留——`stripTags`/`clean()` 的
 * `/\{[FM]#([^}]*)\}/g → '$1'` 是把两支拼起来（被 `src/lib/__tests__/format.test.ts` 钉住），
 * 实测 `achievement.html`(de/es/fr/pt/ru/jp/th) / `item.html` / `relic.html` 的 JSON-LD 条目名
 * 本来就带标记（**另一种缺陷类别**，与开拓者名无关）。全局断言会因这些既有残留而假红。
 *
 * 为什么名字面必须断言：开拓者形态名在**仅 fr/de/pt** 的语言包里带该标记，而名字必须**二选一**
 * （拼接会得到官方不存在的词 `PionnierPionnière`）。前端 `pickGenderVariant`
 * （`src/lib/trailblazer.ts`）与生成器 `pickGender`（`tools/gen-ai-endpoints.mjs`）各自取支，
 * 两侧漏改任一侧都会在下列页面留下标记 ⇒ 本断言即两侧一致性的机械兜底。
 *
 * 覆盖页：角色目录 / 角色详情 / 货币战争角色目录 / 货币战争角色详情 / 货币战争羁绊详情
 * （羁绊详情列成员名，同样来自 `currency/role.json`）。**必须带可选语言前缀**：缺陷只出现在
 * fr/de/pt 的分层快照（`de/character.html`），漏掉前缀就只扫到 cn 的 12 个页面——而那些页面
 * 从来不带标记，断言会永远为绿（本守卫首版即踩此坑，由负向注入测试发现）。
 */
const GENDER_MARKER_RE = /\{[MF]#[^}]*\}/;
const GENDER_MARKER_PAGE_RE = /^(?:[a-z]{2,3}\/)?(?:character(?:\.html|\/\d+\.html)|currency\/role(?:\.html|\/\d+\.html)|currency\/trait\/\d+\.html)$/;
/**
 * 未展开的参数占位符（契约 §3「参数展开保真」/ §6.3）：如 `#1[i]`、`#2[f1]%`——必须由 fillParams 展开，
 * 缺参数时应整段省略。字面 `#81`（无 `[..]`）与 `{TEXTJOIN#61}` 不匹配本正则，必须放行。
 */
const PARAM_PLACEHOLDER_RE = /#\d+\[[^\]]*\]/g;
/**
 * 裸 `#N` 占位符（契约 §3 延伸 / §6.3）：只对下面两个 CW 目录页断言。
 * 禁止扩成全局断言：裸 `#N` 无法与上游字面区分（「天才俱乐部#81号会员」、`item.html` 的「#8拉姆」、
 * `{TEXTJOIN#61}`、`achievement.html` 的 233 处都是与应用显示一致的上游原文，必须放行）；
 * 而 CW 装备 / CW 投资策略这两族的数据条目携带 `params` 语义，裸 `#N` 即未展开占位符。
 */
const BARE_HASH_PAGES = ['currency/item.html', 'currency/augment.html'];
const BARE_HASH_RE = /#\d+/g;
/**
 * JSON-LD 里**必须**自带 `dateModified` 的页面级节点类型（契约 §3 时效性信号）：
 * 生成器 ldCollection / ldDataPage / ldCharacter 与 ldArticle 各写一个页面级节点，
 * 嵌套实体（Person / BreadcrumbList / ItemList…）不带该字段，不在白名单内。
 */
const LD_PAGE_NODE_TYPES = new Set(['WebPage', 'CollectionPage', 'Article']);
/** 首页站点统计块（契约 §3「页面级摘要」）的目录路由白名单。
 *  路由是契约常量；条目数 N **禁止写死**——期望值由检查 5 的实时口径（catalogEntryExpect）提供。 */
const STAT_CATALOG_ROUTES = ['/character', '/lightcone', '/relic', '/item', '/monster', '/achievement'];

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

/* ─── SITE_ORIGIN / OG_IMAGE 唯一事实源：生成器模块 ─── */
let SITE_ORIGIN = null;
/** 分享图的 URL 路径（生成器导出）→ 用它定位 dist 里的实际文件，避免在守卫里写死文件名 */
let OG_IMAGE_PATH = '/og.png';
let originError = null;
try {
  if (!existsSync(GENERATOR)) throw new Error(`生成器文件不存在: ${rel(GENERATOR)}`);
  const mod = await import(pathToFileURL(GENERATOR).href);
  if (typeof mod.SITE_ORIGIN !== 'string') throw new Error('生成器未导出字符串常量 SITE_ORIGIN');
  SITE_ORIGIN = new URL(mod.SITE_ORIGIN).origin;
  if (typeof mod.OG_IMAGE === 'string') OG_IMAGE_PATH = new URL(mod.OG_IMAGE).pathname;
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
  return countTagClass(html, 'li', 'nk-snapshot__entry');
}

/** 标签上的 class 属性 → token 数组（双/单引号、无引号都认）；无 class 返回空数组 */
function classTokensOf(tagText) {
  const cm = tagText.match(/\bclass\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
  if (!cm) return [];
  return (((cm[1] ?? cm[2] ?? cm[3]) || '').trim()).split(/\s+/).filter(Boolean);
}

/** tag 元素上 class token 精确匹配的计数——token 必须整体相等，`nk-snapshot__stat` 不会被
 *  `nk-snapshot__stat-n` 命中（否则统计块断言会被行内数字 span 污染）。 */
function countTagClass(html, tag, token) {
  let n = 0;
  for (const m of html.matchAll(new RegExp(`<${tag}\\b[^>]*>`, 'gi'))) {
    if (classTokensOf(m[0]).includes(token)) n++;
  }
  return n;
}

/**
 * 成对标签区块（栈式配对 open/close）。`blocks` 只含**最外层**区块，`all` 含全部配对（嵌套也在内）。
 * 不用 `/<section[\s\S]*?<\/section>/` 这类非贪婪正则：嵌套时它会配错，且配对失败（未闭合/多余闭合）
 * 会被静默吞掉——本函数把两种情况都报出来，供调用方判红。
 */
function pairedTagBlocks(html, tag) {
  const events = [];
  for (const m of html.matchAll(new RegExp(`<${tag}\\b[^>]*>`, 'gi'))) {
    events.push({ i: m.index, end: m.index + m[0].length, tagText: m[0], open: true });
  }
  for (const m of html.matchAll(new RegExp(`</${tag}\\s*>`, 'gi'))) events.push({ i: m.index, open: false });
  events.sort((a, b) => a.i - b.i);
  const stack = [];
  const blocks = [];
  const all = [];
  let orphanCloses = 0;
  for (const ev of events) {
    if (ev.open) {
      stack.push(ev);
      continue;
    }
    if (stack.length === 0) {
      orphanCloses++;
      continue;
    }
    const op = stack.pop();
    const block = { tagText: op.tagText, inner: html.slice(op.end, ev.i), start: op.i, depth: stack.length };
    all.push(block);
    if (stack.length === 0) blocks.push(block);
  }
  return { blocks, all, unclosed: stack.length, orphanCloses };
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
/** 纯 SPA 外壳 `prerender/_shell.html`：下划线前缀 = 内部文件（由 vercel catch-all rewrite 投递），
 *  它不是快照——禁止计入快照数 / sitemap 一一对应 / 覆盖率 / 条目数。 */
const isInternalFile = (f) => basename(f).startsWith('_');
const allPrerenderHtml = existsSync(PRERENDER)
  ? walk(PRERENDER).filter((f) => f.toLowerCase().endsWith('.html')).sort()
  : [];
const internalFiles = allPrerenderHtml.filter(isInternalFile);
const snapshotFiles = allPrerenderHtml.filter((f) => !isInternalFile(f));
const SHELL = join(PRERENDER, '_shell.html');
const DIST_INDEX = join(DIST, 'index.html');
const SITEMAP = join(DIST, 'sitemap.xml');
/** llms.txt（契约 §1 产物表）：`public/llms.txt` 随 vite build 原样复制到 dist 根，由文件系统直接投递
 *  （早于 rewrites）。它必须是**真文本文件**——一旦缺失，`/llms.txt` 会落回 catch-all 返回 200 的 HTML
 *  外壳（既不是文件也不是 404），这正是本断言要拦的静默失效。 */
const LLMS_TXT = join(DIST, 'llms.txt');
const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

/** prerender 内文件 → 路由（契约 §2：home.html 即 `/`） */
function routeOf(file) {
  const p = relative(PRERENDER, file).split(sep).join('/').replace(/\.html$/i, '');
  // 分层多语言快照：`<locale>/home.html` 的真实 URL 是 `/<locale>`（不是 `/<locale>/home`）。
  // 只有语言段 + home 这一种组合需要特判，其余（含 `en/character` 等）与单语言同形。
  const layeredHome = /^([a-z]{2,3})\/home$/.exec(p);
  if (layeredHome) return `/${layeredHome[1]}`;
  return p === 'home' ? '/' : `/${p}`;
}

/* 语言清单（单一事实源 = converter 的 languages.json）：语言代码 → culture，
   供分层快照断言（`<html lang>`）与 hreflang 条数校验使用。 */
const LANG_JSON = JSON.parse(readFileSync(join(ROOT, 'tools', 'converter', 'languages.json'), 'utf-8'));
const LOCALE_CULTURE = Object.fromEntries(
  (LANG_JSON.languages ?? LANG_JSON).map((l) => [l.code, l.culture ?? l.code]),
);
const LOCALE_CULTURE_SIZE = Object.keys(LOCALE_CULTURE).length;
/** 缺省语言（快照落在根目录，其余语言带 `/xx/` 前缀）——取自 languages.json 的 `default` 字段 */
const DEFAULT_LOCALE = typeof LANG_JSON.default === 'string' ? LANG_JSON.default : 'cn';
/** 目录页路由 → 应用可见条目数（检查 5 实时推导）。检查 6 的首页统计块断言复用**同一份**期望，
 *  禁止在别处另算或写死数字——两条断言分叉即第二事实源。 */
const catalogEntryExpect = new Map();
/** 分层快照里仍含中文可见文本的**文件数**（按语言累计，供棘轮比对）。 */
const hanByLocale = new Map();
const coveredNotes = [];
const coveredPush = (m) => coveredNotes.push(m);

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

  /* llms.txt：只断言「真文本文件 + 全部链接同源」，不断言内容清单——把入口清单写死进守卫等于给站点
     目录造第二个事实源（目录页增减都会让它漂移），本域只保证它不是 HTML 外壳、也没指向旧 origin。 */
  if (!existsSync(LLMS_TXT)) {
    details.push(`llms.txt 不存在: ${rel(LLMS_TXT)}（契约 §1：public/llms.txt 提交入库；缺失即落回 catch-all 的 HTML 外壳）`);
  } else {
    const txt = readFileSync(LLMS_TXT, 'utf-8');
    if (!/^#\s+\S/m.test(txt)) details.push('llms.txt 缺 H1 标题（llmstxt.org 规范里唯一必填项）');
    if (/<(?:html|body|div|script|p)[\s>/]/i.test(txt)) details.push('llms.txt 含 HTML 标签（必须是纯文本 Markdown，不得是外壳的副本）');
    if (!SITE_ORIGIN) {
      details.push('llms.txt 未做同源校验（SITE_ORIGIN 不可用）');
    } else {
      for (const m of txt.matchAll(/https?:\/\/[^\s)\]"'>]+/g)) {
        const raw = m[0].replace(/[.,;:]+$/, '');
        let u = null;
        try {
          u = new URL(raw);
        } catch {
          details.push(`llms.txt 含非法绝对 URL: ${raw}`);
          continue;
        }
        if (u.origin !== SITE_ORIGIN) details.push(`llms.txt 链接与生成器 SITE_ORIGIN 不同源: ${raw}（期望 ${SITE_ORIGIN}）`);
      }
    }
  }
  push('1', `AI 入口文件（${REQUIRED_ROBOTS_UAS.length} 个 robots UA 组自足 + Disallow: /prerender/ + Sitemap 同源 + llms.txt 真文本同源）`, details);
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
  /** 基线 = 纯 SPA 外壳 `prerender/_shell.html`（不是 dist/index.html——它现在是 home 快照，
   *  其 title/h1 是首页标题，拿它当外壳基线会把每个快照都判成「默认标题」） */
  if (!existsSync(SHELL)) {
    details.push(`缺纯 SPA 外壳 ${rel(SHELL)}，无法取得默认 title 与入口 <script src> 基线（task-10 落地前会如此）`);
  } else {
    const shellHtml = readFileSync(SHELL, 'utf-8');
    defaultTitle = tagText(shellHtml, /<title[^>]*>([\s\S]*?)<\/title>/i);
    entryScripts = scriptSrcs(shellHtml).sort();
    if (!defaultTitle) details.push(`${rel(SHELL)} 无 <title>，无法判定快照默认标题`);
    if (entryScripts.length === 0) details.push(`${rel(SHELL)} 无 <script src> 入口，无法校验快照入口一致性`);
    /* ①-a 纯外壳必须自带 robots noindex：catch-all 把**一切未命中快照的路径**（不存在的实体、垃圾路径、
       客户端路由）都投给这份外壳，不加就是让无限多 URL 进索引。快照一份都不许带该声明
       （①-b 在逐文件循环里断言）——两侧是同一契约的两半，缺任一半都会漏。 */
    const shellRobotsMeta = (shellHtml.match(/<meta\b[^>]*\bname\s*=\s*["']robots["'][^>]*>/i) || [])[0] || '';
    if (!/content\s*=\s*["'][^"']*noindex/i.test(shellRobotsMeta)) {
      details.push(`${rel(SHELL)} 缺 robots noindex 声明（catch-all 会把 CSR 路由 / 404 / 垃圾路径都投给它，必须挡收录）`);
    }
    /* 外壳承载 `og:image` 的静态兜底（catch-all 投递 SPA 外壳时也要有卡片图，
       而外壳不经生成器注入）⇒ origin 必须与生成器同源，否则改域时两处漂移且无人报错。 */
    const shellOg = (shellHtml.match(/<meta[^>]*property="og:image"[^>]*content="([^"]*)"/i) || [])[1] || '';
    if (!shellOg) details.push(`${rel(SHELL)} 缺 og:image（外壳兜底值，需与生成器 OG_IMAGE 同源）`);
    else if (!shellOg.startsWith(`${SITE_ORIGIN}/`)) details.push(`${rel(SHELL)} 的 og:image 非同源: ${shellOg}`);
  }
  /* og:image 指向的**文件本身**必须存在，且尺寸与 meta 里声明的 `og:image:width/height` 一致。
     只断言标签不断言文件，删掉 public/og.png 也能全绿——而线上分享卡片会直接变空图。
     尺寸从 PNG 头直接读（IHDR 宽高在固定偏移），不引入任何图像库。 */
  const ogFile = join(DIST, OG_IMAGE_PATH);
  if (!existsSync(ogFile)) {
    details.push(`缺分享图 ${rel(ogFile)}（og:image 指向它，删了就是线上空图；重跑 node tools/gen-og-image.mjs）`);
  } else if (existsSync(SHELL)) {
    const shellForOg = readFileSync(SHELL, 'utf-8');
    const declW = Number((shellForOg.match(/<meta[^>]*property="og:image:width"[^>]*content="(\d+)"/i) || [])[1]);
    const declH = Number((shellForOg.match(/<meta[^>]*property="og:image:height"[^>]*content="(\d+)"/i) || [])[1]);
    const buf = readFileSync(ogFile);
    const isPng = buf.length > 24 && buf[0] === 0x89 && buf.toString('latin1', 1, 4) === 'PNG';
    if (!isPng) {
      details.push(`${rel(ogFile)} 不是 PNG（多平台不认 SVG/WebP 作为 og:image）`);
    } else if (declW && declH) {
      const w = buf.readUInt32BE(16);
      const h = buf.readUInt32BE(20);
      if (w !== declW || h !== declH) {
        details.push(`分享图实际 ${w}×${h}，与声明的 og:image:width/height ${declW}×${declH} 不一致（平台会按声明裁剪）`);
      }
    } else {
      details.push(`${rel(SHELL)} 缺 og:image:width/height 声明，无法校验分享图尺寸`);
    }
  }
  if (snapshotFiles.length === 0) {
    details.push(`未发现任何快照: ${rel(PRERENDER)} 下 0 个 .html（先跑 node tools/gen-ai-endpoints.mjs）`);
  }

  const violations = [];
  /* 快照是**爬虫唯一可见**的那一份。它由 `gen-ai-endpoints.mjs` 独立渲染 ⇒
     未解析令牌（`$t:…`）或**原始词典键名**（vue-i18n 找不到键时会把键名本身写进页面）
     都会直接进搜索结果，而 SPA 侧看不出来。键名取自源语言词典，一次编译成正则逐份扫描。 */
  const cnDictFile = join(ROOT, 'src', 'lib', 'i18n', 'messages', 'cn.json');
  let keyRe = null;
  if (existsSync(cnDictFile)) {
    const keys = Object.keys(JSON.parse(readFileSync(cnDictFile, 'utf-8')));
    const esc = (k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    keyRe = new RegExp(`(?<![\\w.])(${keys.map(esc).join('|')})(?![\\w.])`);
  }

  /** 命中未展开参数占位符的快照数 */
  let phFiles = 0;
  /* ②③ 的日期唯一事实源：converter 的 `version.json.synced_at`（生成器 SNAPSHOT_SYNCED_AT 与
     sitemap `<lastmod>` 同源）。取不到即这两条断言没有判据——必须显式报出，不能静默放行。 */
  const versionProbe = loadJson('version.json');
  const syncedAt = versionProbe.ok ? String(versionProbe.value?.synced_at ?? '').trim() : '';
  if (!syncedAt) {
    details.push(
      `无法从 ${rel(join(DATA, 'version.json'))} 读取 synced_at，dateModified / <time> 断言失效`
      + (versionProbe.ok ? '（字段缺失或为空）' : `：${versionProbe.err}`),
    );
  }
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

    // 未解析令牌：界面出现 `$t:…` 即语言包/解析链断裂
    if (html.includes('$t:')) add('正文残留未解析文本令牌 `$t:…`');
    /* 自造属性名占位符（ADR 0053 方案 A）：生成器必须按 cn 词典解析掉，残留即渲染链断裂 */
    {
      const m = html.match(/\{PROP:[A-Za-z0-9_]+\}/);
      if (m) add(`正文残留未解析属性占位符 ${m[0]}`);
    }
    // 原始词典键名：vue-i18n 缺键时会直接把键名渲染出来（本轮修过 4 类）
    if (keyRe) {
      const hit = html.match(keyRe);
      if (hit) add(`正文出现原始词典键名「${hit[1]}」（缺键或未翻译）`);
    }

    /* ①-b 快照禁 noindex：外壳的 robots noindex 一旦被带进模板，全部快照会一起从索引里消失，
       而其它断言（title / canonical / 正文 / 条目数）照旧全绿——只有这条拦得住。
       扫描面是整份 HTML（含 <script>）：noindex 出现在 JSON-LD 或注释里同样是泄漏。 */
    const noindexAt = html.search(/noindex/i);
    if (noindexAt >= 0) {
      add(`含 noindex（快照必须可收录，该声明只属于 _shell.html）: …${
        html.slice(Math.max(0, noindexAt - 60), noindexAt + 24).replace(/\s+/g, ' ')}…`);
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
    /* 语言感知判据：缺省语言（cn）与 cht 的正文本就含汉字，沿用汉字数；
       分层多语言快照的非 Han 语言（en/de/ru…）正文本没有汉字，改用「去标签可见文本长度」，
       同样能拦住「空壳 HTML」（分母不同、目的相同）。 */
    const firstSeg = relative(PRERENDER, file).split(sep)[0];
    const isHanLocale = firstSeg === 'cht' || !/^[a-z]{2,3}$/.test(firstSeg);
    if (isHanLocale) {
      if (cjk < MIN_CJK_CHARS) add(`去标签正文中文字符 ${cjk} < ${MIN_CJK_CHARS}（服务端 HTML 必须有正文）`);
    } else {
      const textLen = text.replace(/\s+/g, '').length;
      if (textLen < MIN_CJK_CHARS) add(`去标签正文长度 ${textLen} < ${MIN_CJK_CHARS}（服务端 HTML 必须有正文）`);
    }

    /* ── 分层多语言快照专属断言（方案 B）：`<locale>/…` 才需要，缺省语言不适用 ── */
    if (!isHanLocale) {
      const loc = firstSeg;
      const culture = LOCALE_CULTURE[loc];
      if (!culture) {
        add(`未在 languages.json 中找到语言 ${loc}（前缀目录必须与语言清单同源）`);
      } else {
        const langAttr = (html.match(/<html[^>]*\slang="([^"]*)"/i) || [])[1];
        if (langAttr !== culture) {
          add(`<html lang> 为 ${langAttr ?? '(缺失)'}，应为 ${culture}（languages.json 的 culture）`);
        }
      }
      const alts = [...html.matchAll(/<link[^>]*rel="alternate"[^>]*hreflang="([^"]+)"/gi)].map((m) => m[1]);
      if (alts.length !== LOCALE_CULTURE_SIZE + 1) {
        add(`hreflang 有 ${alts.length} 条，应为 ${LOCALE_CULTURE_SIZE} 语言 + x-default = ${LOCALE_CULTURE_SIZE + 1} 条`);
      } else if (!alts.includes('x-default')) {
        add('hreflang 缺 x-default（缺省语言回退）');
      }
    }

    /* JSON-LD 内嵌 URL 三项断言（前缀改写的机械兜底，缺一项就会重演静默断链）：
       ① 形状：同源 URL 去掉站点源后必须为空或以 `/` 开头——`SITE_ORIGIN + href` 少一条前导斜杠会
          拼出 `https://myhsr.wikicharacter/1503` 这类形态（作为 URL 仍可解析，`new URL()` 查不出）。
       ② 语言归属（分层快照）：路径必须落在当前语言下（`/<locale>` 或 `/<locale>/…`），
          **唯一豁免是站点根 `/`**（`isPartOf` 的 WebSite 本体）。
          **这条才是拦住实测缺陷的那条**：旧前缀改写把 `…wiki/character/1503` 粘成
          `…wiki/encharacter/1503`——路径以 `/` 开头、能解析、请求能拿到 200 外壳，
          只有「首段必须是本语言前缀」判得出；此前口径是「首段匹配 `^[a-z]{2,3}$` 且不等于本语言」，
          而 `encharacter` 有 11 个字母 ⇒ 静默放行（教训：按「已知坏形态的特征」写断言会漏掉坏形态本身）。
       ③ 自身 URL 必须在场：LD 里至少有一个 URL 等于本页 canonical 路径——整份前缀改写缺失
          （而非单点漏改）时只有这条能拦住。 */
    const canonPath = (linkHref(html, 'canonical') ?? '').replace(/^https?:\/\/[^/]+/, '');
    const ldUrls = [];
    for (const m of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
      for (const u of m[1].matchAll(/"(?:@id|url|mainEntityOfPage|item)"\s*:\s*"([^"]+)"/g)) ldUrls.push(u[1]);
    }
    const ldPaths = ldUrls.filter((u) => u.startsWith(SITE_ORIGIN)).map((u) => u.slice(SITE_ORIGIN.length));
    const glued = ldPaths.filter((p) => p !== '' && !p.startsWith('/'));
    if (glued.length > 0) {
      add(`JSON-LD 内嵌 URL 与站点源之间缺分隔符 ${glued.length} 处: ${glued.slice(0, 3).join(', ')}`);
    }
    if (canonPath && !ldPaths.includes(canonPath)) {
      add(`JSON-LD 内嵌 URL 里没有本页 canonical 路径 ${canonPath}（前缀改写疑似整份缺失）`);
    }
    if (!isHanLocale) {
      const outside = ldPaths.filter((p) => p !== '/' && p !== `/${firstSeg}` && !p.startsWith(`/${firstSeg}/`));
      if (outside.length > 0) {
        add(`JSON-LD 内嵌 URL 不在本语言 /${firstSeg} 下（站点根 / 除外）${outside.length} 处: ${outside.slice(0, 3).join(', ')}（canonical ${canonPath}）`);
      }
    }

    /* 社交卡片 + 语言标注：分享预览靠 og:image，语言靠 og:locale 与 JSON-LD inLanguage。
       三者的「语言/来源」必须都与 `<html lang>` / SITE_ORIGIN 同源——否则分享卡片会挂错域，
       或富媒体声称自己是另一种语言（后者曾真发生：JSON-LD 的 inLanguage 曾硬编码 zh-CN）。 */
    const langAttrAny = (html.match(/<html[^>]*\slang="([^"]*)"/i) || [])[1] || '';
    const ogImage = (html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]*)"/i) || [])[1] || '';
    if (!ogImage) add('缺 og:image（分享出去只有纯文字卡片）');
    else if (!ogImage.startsWith(`${SITE_ORIGIN}/`)) add(`og:image 非同源: ${ogImage}`);
    const twTag = (html.match(/<meta[^>]*name="twitter:card"[^>]*>/i) || [])[0] || '';
    if (!twTag) add('缺 twitter:card');
    else if (!twTag.includes('summary_large_image')) add(`twitter:card 必须是 summary_large_image，实际：${twTag}`);
    const expectOgLocale = langAttrAny.replace('-', '_');
    const ogLoc = (html.match(/<meta[^>]*property="og:locale"[^>]*content="([^"]*)"/i) || [])[1] || '';
    if (!ogLoc) add('缺 og:locale');
    else if (ogLoc !== expectOgLocale) add(`og:locale 为 ${ogLoc}，应与 <html lang> ${langAttrAny} 对应（${expectOgLocale}）`);

    /* 快照正文抽取是下面所有「正文类」断言的前提，必须先证明**抽取命中了目标**：
       取整页 visibleText 会把 SPA 外壳的固定中文算进去（每个语言都成 19 个文件，掩盖真实残留），
       故只取 `.nk-snapshot` 之后的部分。此前这段用 `/<div class="nk-snapshot">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/`
       要求**三层** `</div>` 收尾，而快照实际只有两层 ⇒ 正则恒不命中、正文恒为空串 ⇒
       汉字断言与其棘轮长期静默失效（`tools/ai-han-baseline.json` 因此从未落盘，看上去反而像「残留为 0」）。
       抽取为空现在**直接判红**，不再当 0 处理。 */
    const snapStart = html.indexOf('<div class="nk-snapshot">');
    const bodyText = snapStart >= 0 ? visibleText(html.slice(snapStart)) : '';
    if (!bodyText) {
      add('未能抽取 nk-snapshot 正文（标记缺失或正文为空）——所有基于正文的断言都会静默失效');
    }

    /* 汉字残留判据按**脚本**划界（不是按「非缺省语言」）：
       `cn` / `cht` / `jp` / `kr` 都合法使用汉字（日文汉字；韩国官方韩文用汉字注音 `세검(細劍)`），
       对其判「正文汉字为零」会全量误红——实测 jp 19/19、kr 5/19 个分层快照命中。
       其余 8 种语言（拉丁 / 西里尔 / 泰文）正文出现汉字即残留。
       **边界**：jp / kr 里「合法汉字」与「中文残留」用码点范围分不开，本断言不覆盖这两种语言；
       要覆盖需按「仅简体使用的字」建表，属未决项。
       残留计数走**棘轮**：基线缺失时按实测写入、之后只降不升，以免数据侧个别合法遗留阻塞构建。 */
    if (!isHanLocale && !HAN_SCRIPT_LOCALES.has(firstSeg)) {
      const hanRuns = bodyText.match(/[\u4e00-\u9fff]+/g) ?? [];
      const hanCount = hanRuns.filter((r) => '星铁档案馆'.indexOf(r) === -1).length;
      if (hanCount > 0) hanByLocale.set(firstSeg, (hanByLocale.get(firstSeg) ?? 0) + 1);
    }

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

    /* ② JSON-LD `dateModified` = `version.json.synced_at`：搜索侧唯一能读到的时效性信号。
       白名单判据（不是「与已知坏形态不同」）：页面级节点**必须**带该字段，且**任何**声明了
       dateModified 的节点取值都必须等于 synced_at——漏一处、用了旧日期、或整份前缀改写缺失都在此判红。
       先证明抽取命中了目标：页面级节点为 0、或整份 JSON-LD 一个 dateModified 都没有时**直接判红**
       （否则「没抽到 ⇒ 不判」会让这条断言从未生效却全绿）。 */
    if (syncedAt) {
      const ldNodes = [];
      for (const raw of lds) {
        let graph;
        try {
          graph = JSON.parse(raw.trim());
        } catch {
          continue; // 解析失败已在上面报过
        }
        ldNodes.push(...(graph['@graph'] || [graph]));
      }
      const pageNodes = ldNodes.filter((n) => {
        if (!n || typeof n !== 'object') return false;
        const types = Array.isArray(n['@type']) ? n['@type'] : [n['@type']];
        return types.some((t) => LD_PAGE_NODE_TYPES.has(t));
      });
      const dmNodes = ldNodes.filter((n) => n && typeof n === 'object' && 'dateModified' in n);
      if (pageNodes.length === 0) {
        add(`JSON-LD 无页面级节点（${[...LD_PAGE_NODE_TYPES].join(' / ')}），dateModified 断言无落点`);
      } else {
        const noDm = pageNodes.filter((n) => !('dateModified' in n));
        if (noDm.length > 0) add(`JSON-LD 页面级节点缺 dateModified ${noDm.length} 个（期望 ${syncedAt}）`);
      }
      if (dmNodes.length === 0) {
        add(`JSON-LD 无任何 dateModified（期望页面级节点带 ${syncedAt}）`);
      } else {
        const badDm = dmNodes.filter((n) => String(n.dateModified) !== syncedAt);
        if (badDm.length > 0) {
          add(`JSON-LD dateModified 为 ${
            badDm.slice(0, 3).map((n) => JSON.stringify(n.dateModified)).join(', ')
          }，应为 ${syncedAt}（version.json.synced_at 单一事实源）`);
        }
      }
    }

    /* ③ 页脚 `<time datetime="{synced_at}">{synced_at}</time>`：`<time datetime>` 是抽取器/搜索侧
       唯一能读到的结构化日期（页脚那句可见文本只对人有意义）。
       class 匹配走**精确 token**（classTokensOf），不用 `\bnk-snapshot__meta\b`——后者会把
       `nk-snapshot__meta-x` 也当成命中（`-` 是词边界），于是改名后的段落仍被抽取、断言静默通过
       （反向注入 M07 实测过这个漏洞）。
       抽取式断言——先证明抽到了页脚 meta 段：抽不到**直接判红**，不允许当成「没有就不判」。 */
    {
      const metaBlock = pairedTagBlocks(html, 'p').all.find((b) => classTokensOf(b.tagText).includes('nk-snapshot__meta'));
      if (!metaBlock) {
        add('未抽到页脚 <p class="nk-snapshot__meta"> 段（class token 精确匹配），<time> 断言无抽取目标');
      } else {
        const tm = metaBlock.inner.match(/<time\b[^>]*\bdatetime\s*=\s*["']([^"']*)["'][^>]*>([\s\S]*?)<\/time>/i);
        if (!tm) {
          add(`页脚 meta 段内无 <time datetime>（更新日期只有可见文本，机器读不到）: ${
            metaBlock.inner.replace(/\s+/g, ' ').slice(0, 120)}`);
        } else if (syncedAt) {
          const shown = visibleText(tm[2]).trim();
          if (tm[1] !== syncedAt || shown !== syncedAt) {
            add(`页脚 <time> 为 datetime="${tm[1]}" 文本「${shown}」，应为 ${syncedAt}（与 dateModified / sitemap lastmod 同源）`);
          }
        }
      }
    }

    /* JSON-LD 的 inLanguage 必须与 `<html lang>` 同源。此前它硬编码 `zh-CN`，
       于是 228 份语言前缀快照的富媒体信息全都声称自己是中文页（而页面正文是英/日/韩…），
       而且这个错误**任何解析断言都查不出来**——JSON 完全合法。 */
    if (lds.length > 0) {
      try {
        const graph = JSON.parse(lds[0].trim());
        const nodes = graph['@graph'] || [graph];
        const ldLangs = [...new Set(nodes.map((n) => n && n.inLanguage).filter(Boolean))];
        if (!ldLangs.length) add('JSON-LD 缺 inLanguage（页面语言标注）');
        else {
          const badLang = ldLangs.filter((l) => l !== langAttrAny);
          if (badLang.length) add(`JSON-LD inLanguage 为 ${badLang.join(', ')}，应与 <html lang> ${langAttrAny} 一致`);
        }
      } catch { /* 解析失败已在上面的断言里报过 */ }
    }

    /* `Article` 只允许出现在 `/voracity`（站点撰写的叙述性专题长文）。
       数据条目页（光锥 / 遗器 / 敌对物种 / 终局赛季 / 货币战争条目）用 `Article` 等于
       告诉机器「这是一篇资讯稿」，条目身份反而拿不到 ⇒ 必须走 WebPage + mainEntity。 */
    const hasArticle = lds.length > 0 && (() => {
      try {
        const g = JSON.parse(lds[0].trim());
        return (g['@graph'] || [g]).some((n) => n && n['@type'] === 'Article');
      } catch { return false; }
    })();
    const isVoracityPage = /(^|\/)voracity\.html$/.test(String(file).split('\\').join('/'));
    if (hasArticle && !isVoracityPage) add('JSON-LD 用 Article 描述数据条目页（应改用 WebPage + mainEntity）');
    if (!hasArticle && isVoracityPage) add('/voracity 的 JSON-LD 应为 Article（它是叙述性专题，不是数据条目）');

    // 角色详情页的结构化数据形状（验收标准 B5）：必须是「角色实体」而不是「文章」。
    // 只查形状与必填项，不查具体取值（取值随数据变，锁死会假红）。
    if (String(file).includes(`${sep}character${sep}`) && !String(file).includes(`_shell`)) {
      try {
        const graph = JSON.parse(lds[0].trim())['@graph'] || [];
        const page = graph.find((n) => n['@type'] === 'WebPage');
        const person = graph.find((n) => n['@type'] === 'Person');
        const crumbs = graph.find((n) => n['@type'] === 'BreadcrumbList');
        if (!page) add('角色详情 JSON-LD 缺 WebPage 节点');
        if (!person) add('角色详情 JSON-LD 缺 Person（角色实体）节点——用 Article 描述角色等于把数据页说成资讯稿');
        if (!crumbs) add('角色详情 JSON-LD 缺 BreadcrumbList 节点');
        if (page && person) {
          const ref = page.mainEntity && page.mainEntity['@id'];
          if (!ref || ref !== person['@id']) add('角色详情 JSON-LD 的 WebPage.mainEntity 必须指向同页 Person 节点');
        }
        if (person) {
          if (!person.name) add('角色详情 JSON-LD 的 Person 缺 name');
          if (!Array.isArray(person.characterAttribute) || person.characterAttribute.length === 0) {
            add('角色详情 JSON-LD 的 Person 缺 characterAttribute（稀有度/命途/属性/阵营等游戏属性）');
          }
          if ('alternateName' in person && !person.alternateName) {
            add('角色详情 JSON-LD 的 alternateName 不许留空串（无拉丁转写名时应整键省略）');
          }
        }
      } catch (e) {
        add(`角色详情 JSON-LD 形状检查失败: ${e.message}`);
      }
    }

    // 游戏标记残留（原始标签面 + 解码后的正文面，覆盖转义与未转义两种残留）
    for (const marker of GAME_MARKERS) {
      if (rawScan.includes(marker) || text.includes(marker)) add(`正文残留游戏标记 ${marker}`);
    }
    if (rawScan.includes('\\n') || text.includes('\\n')) add('正文残留字面 \\n 游戏换行标记');

    /* 名字面的性别变体标记（见 GENDER_MARKER_RE 注释）：只扫名字相关的页面，不全局化。
       扫描面必须**保留 `<script>`**（JSON-LD 就在其中，而它正是爬虫读到的名字面）——
       `rawScan` 与 `visibleText` 都把 script 剥掉了，用它们会漏判只在 JSON-LD 里残留的标记。
       只排除 `<style>` 与 HTML 注释：CSS 里的 `{}` 块与注释里的模板片段都不是可见文本。 */
    const relName = relative(PRERENDER, file).split(sep).join('/');
    if (GENDER_MARKER_PAGE_RE.test(relName)) {
      const nameScan = html
        .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
        .replace(/<!--[\s\S]*?-->/g, ' ');
      const hit = nameScan.match(GENDER_MARKER_RE);
      if (hit) {
        add(`名字残留性别变体标记 ${hit[0]}——名字必须二选一取支（前端 pickGenderVariant / 生成器 pickGender）`);
      }
    }

    // 未展开参数占位符（契约 §3「参数展开保真」/ §6.3）：同一扫描面；字面 `#81`、`{TEXTJOIN#61}` 不匹配故放行
    const phText = text.match(PARAM_PLACEHOLDER_RE) || [];
    const phRaw = rawScan.match(PARAM_PLACEHOLDER_RE) || [];
    if (phText.length > 0 || phRaw.length > 0) {
      // 计数优先取可见文本面；占位符只在标签属性里出现时回退原始面计数
      const n = phText.length > 0 ? phText.length : phRaw.length;
      phFiles++;
      add(`正文残留未展开参数占位符 ${n} 处（如 ${(phText[0] || phRaw[0]).replace(/</g, '&lt;')}）`);
    }

    // 裸 #N 只按页点名（BARE_HASH_PAGES 两页），且只扫可见文本面：标签属性/注释/CSS 里的十六进制色
    // （如 `#121214`）匹配 `#\d+` 但都不是可见文本，扫原始面会误报。
    const snapPath = relative(PRERENDER, file).split(sep).join('/');
    if (BARE_HASH_PAGES.includes(snapPath)) {
      const bh = text.match(BARE_HASH_RE) || [];
      if (bh.length > 0) {
        bareHashHits.push(snapPath);
        add(`可见文本残留裸 #N 占位符 ${bh.length} 处（如 ${bh[0]}）。本断言按契约 §6.3 仅点名这两个 CW 目录页——裸 #N 无法与上游字面（天才俱乐部#81号会员 / #8拉姆 / {TEXTJOIN#61} / achievement.html 的 233 处）区分，禁止扩为全局断言；也只扫可见文本（属性/注释中的 #121214 等色值不算）`);
      }
    }

    // 入口 JS 与 shell 基线完全一致（复制 shell 而非重写模板）
    const scripts = scriptSrcs(html).sort();
    if (entryScripts.length > 0 && scripts.join('|') !== entryScripts.join('|')) {
      add(`入口 <script src> 与 dist/index.html 不一致: [${scripts.join(', ')}] ≠ [${entryScripts.join(', ')}]`);
    }

    // 契约 §3：nk-snapshot__entry 冻结为「仅目录条目清单」——详情页与专题页出现即违规
    const relNoExt = relative(PRERENDER, file).split(sep).join('/').replace(/\.html$/i, '');
    const marks = countEntryMarks(html);
    if (DETAIL_ROUTE_PREFIXES.some((p) => relNoExt.startsWith(p))) {
      if (marks > 0) add(`详情页出现 ${marks} 个 nk-snapshot__entry（契约 §3：该类名仅用于目录条目清单）`);
    } else if (relNoExt === 'voracity' && marks > 0) {
      // 专题页点名（ADR 0025）：它的分区列表是异构条目的叙述性集合，不是「应用收录条目集合」，
      // 也没有对应的条目级覆盖率期望（见检查 5）。若未来有人把分区当目录收录清单来标，这里直接拦下，
      // 而不是让它静默变成一条覆盖率数字。
      add(`专题页出现 ${marks} 个 nk-snapshot__entry（契约 §3：专题页分区不是应用收录条目集合，禁止使用该标记）`);
    }
  }

  const preCount = details.length; // 逐文件扫描前的前置问题
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
    ? `快照正文（${snapshotFiles.length} 个文件 × 14 项断言全通过${skipNote}）`
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
    // 玩法详情页 = 契约 §2 单页族（第四种页面形态「单页数据页」：无 nk-snapshot__entry、
    // 无条目级覆盖率断言；正文来自 endgame_guide.json）
    ['endgame/maze', 'endgame/maze.html', '/endgame/maze'],
    ['endgame/story', 'endgame/story.html', '/endgame/story'],
    ['endgame/boss', 'endgame/boss.html', '/endgame/boss'],
    ['endgame/peak', 'endgame/peak.html', '/endgame/peak'],
    ['achievement', 'achievement.html', '/achievement'],
    ['currency', 'currency.html', '/currency'],
    ['currency/role', 'currency/role.html', '/currency/role'],
    ['currency/item', 'currency/item.html', '/currency/item'],
    ['currency/buff', 'currency/buff.html', '/currency/buff'],
    ['currency/augment', 'currency/augment.html', '/currency/augment'],
    ['currency/trait', 'currency/trait.html', '/currency/trait'],
    // 专题页（第三种页面形态，ADR 0025）：期望值是「有且仅有 1 个快照文件」这一形态事实，
    // 与数据条目数无关——它的分区列表不是「应用收录条目集合」，故只有文件级断言，无条目级断言（见检查 5）。
    ['voracity', 'voracity.html', '/voracity'],
  ];

  /**
   * 详情族：id 集 = 数据 + 应用可见性判据（契约 §2「可见性对齐」）独立推导，禁止信生成器自述。
   * 逐条对齐 src/app/catalog/pages/*.ts 的 fetchData：
   *  · character/lightcone/relic/monster：`if (!info.name) continue;`
   *  · currency/role、currency/trait：`roles.map` / `traits.map` 无条目过滤 → 全量计入
   *  · 未纳入的例外：character.ts:29 的开拓者形态过滤读 localStorage 偏好（默认女），是用户偏好不是数据判据，
   *    按它收缩会丢 5 个真实可达实体页（8001/8003/8005/8007/8009），故本族仍计全部非空 name 条目。
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
   *  故 maze_boss 的 3022（zh 为空串）不计入期望；生成器必须施加同一判据，禁止为其兜底命名。
   *  期望值与数据同源自动跟随。 */
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
    /* 分层多语言快照（方案 B）：`<locale>/<family>.html` 是同一批路由的**非缺省语言**副本，
       不是「未登记快照」——它们的覆盖率由本块末尾的分层断言单独校验（数量 + 语言集合）。 */
    if (/^(en|cht|de|es|fr|id|jp|kr|pt|ru|th|vi)\//.test(relNoExt)) {
      continue;
    }
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
  /* 分层多语言快照（方案 B）：`<locale>/<family>.html` 是同一批路由的非缺省语言副本。
     语言集合与 vercel.json 的前缀模式改写同源；文件集合 = 契约 §2 的分层家族（非条目级页面）。
     模式感知：未生成分层快照时只要求单语言基线；一旦生成，必须**完整**覆盖 locale × family。 */
  const LAYERED_LOCALES = ['en', 'cht', 'de', 'es', 'fr', 'id', 'jp', 'kr', 'pt', 'ru', 'th', 'vi'];
  const LAYERED_FILES = [
    'home.html', 'character.html', 'lightcone.html', 'relic.html', 'item.html', 'monster.html',
    'endgame.html', 'endgame/maze.html', 'endgame/story.html', 'endgame/boss.html', 'endgame/peak.html',
    'achievement.html', 'currency.html', 'currency/role.html', 'currency/item.html', 'currency/buff.html',
    'currency/augment.html', 'currency/trait.html', 'voracity.html',
  ];
  const layeredSeen = new Set();
  for (const f of snapshotFiles) {
    const relNoExt = relative(PRERENDER, f).split(sep).join('/');
    const seg = relNoExt.split('/')[0];
    if (LAYERED_LOCALES.includes(seg)) layeredSeen.add(relNoExt);
  }
  if (layeredSeen.size > 0) {
    const missingLayered = [];
    for (const loc of LAYERED_LOCALES) {
      for (const file of LAYERED_FILES) {
        if (!layeredSeen.has(`${loc}/${file}`)) missingLayered.push(`${loc}/${file}`);
      }
    }
    if (missingLayered.length > 0) {
      details.push(
        `分层快照缺 ${missingLayered.length}/${LAYERED_LOCALES.length * LAYERED_FILES.length} 个（语言 × 分层家族）: ` +
        `${missingLayered.slice(0, 8).join(', ')}${missingLayered.length > 8 ? ' …' : ''}`,
      );
    }
  }
  const layeredTotal = layeredSeen.size > 0 ? LAYERED_LOCALES.length * LAYERED_FILES.length : 0;
  if (details.length === 0 && snapshotFiles.length !== expectedTotal + layeredTotal) {
    details.push(
      `快照总数 ${snapshotFiles.length} ≠ 预期 ${expectedTotal}${layeredTotal ? ` + 分层 ${layeredTotal}` : ''}`,
    );
  }

  /* 汉字棘轮：基线缺失 ⇒ 按当前实测写入（首次运行自举）；已存在 ⇒ 只降不升。 */
  if (hanByLocale.size > 0) {
    const HAN_BASELINE = join(ROOT, 'tools', 'ai-han-baseline.json');
    const measured = Object.fromEntries([...hanByLocale.entries()].sort());
    if (!existsSync(HAN_BASELINE)) {
      writeFileSync(HAN_BASELINE, `${JSON.stringify(measured, null, 2)}\n`, 'utf-8');
      coveredPush(`汉字棘轮基线已写入 ${rel(HAN_BASELINE)}: ${JSON.stringify(measured)}`);
    } else {
      const base = JSON.parse(readFileSync(HAN_BASELINE, 'utf-8'));
      const worse = Object.entries(measured).filter(([k, v]) => v > (base[k] ?? 0));
      if (worse.length > 0) {
        details.push(
          `分层快照含中文的文件数上升: ${worse.map(([k, v]) => `${k} ${base[k] ?? 0}→${v}`).join(', ')}` +
          `（基线 ${rel(HAN_BASELINE)}；只降不升，修好后再降基线）`,
        );
      }
    }
  }

  const title = details.length === 0
    ? `覆盖率（数据实时统计一致：${covered.join(' ')}，单页 ${observedSingle.size}/${singleFamilies.length}）`
    /* 失败标题必须囊括本段的**全部**失败来源：覆盖率对不上、或汉字棘轮回涨（曾经只写前者，
       棘轮失败时会打印一句与事实不符的标题，误导排查方向）。 */
    : '覆盖率（数据实时统计不一致 / 分层快照汉字残留回涨）';
  push('4', title, details);
}

/* ═══ 5/6 条目级覆盖率（契约 §6.4②③：防「生成器静默漏条目」——文件数断言查不出） ═══ */
{
  const details = [];
  const ENTRY = 'nk-snapshot__entry';
  const named = (x) => Boolean(x && x.name);

  /**
   * 专题页 `/voracity` 无条目级断言（契约 §3/§6.4）：它是 ADR 0025 的第三种页面形态，既不是目录页
   * （正文分区不是「应用收录的条目集合」），也不是枢纽页（没有 `release_version` / 赛季代际这类会静默空态的判据）。
   * 生成器对该页**不渲染** `nk-snapshot__entry`；若在此按 voracity.json 的条目数断言，等于把
   * 「专题页正文 = 目录收录清单」写成契约，与页面形态冲突，并把异构条目（状态词条 / 教程图文 / 位面词条）
   * 误算进覆盖率。该页的存在性与唯一性由检查 4 的单页族断言（各恰好 1 个快照文件）；
   * 「不得误用该类名」由检查 3 的专题页点名断言（计数必须 = 0）保证，不靠人工核查。
   */

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

  /* 检查 6 的首页站点统计块断言复用**同一份**期望（N = 目录页应用可见条目数），
     不复制判据、不写死数字：只有 want 推导成功的目录页才进表，缺项时检查 6 会显式判红。 */
  for (const s of specs) if (s.want !== null) catalogEntryExpect.set(s.route, s.want);

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

  /* ⑤-a 目录页条目必须落在**带非空 `<h2>` 的分区** `nk-snapshot__section` 内（契约 §3）。
     条目计数断言对「分区标题丢了 / 条目标记被挪到分区外」完全无感——计数照旧相等，而爬虫拿到的
     条目清单失去分类语义。覆盖 `/item` 与 `/achievement` 的全部语言（13 个语言 × 2 页）。
     抽取式断言的纪律：抽不到条目 / 标签配对失败都**判红**，不允许「没抽到就放行」。 */
  const SECTIONED_PAGES = ['item.html', 'achievement.html'];
  const sectionedFiles = [];
  for (const loc of Object.keys(LOCALE_CULTURE)) {
    for (const f of SECTIONED_PAGES) sectionedFiles.push(loc === DEFAULT_LOCALE ? f : `${loc}/${f}`);
  }
  const sectionedChecked = [];
  for (const relFile of sectionedFiles) {
    const p = join(PRERENDER, relFile);
    if (!existsSync(p)) {
      details.push(`缺快照 prerender/${relFile}，分区结构断言无法执行（文件级覆盖率见检查 4）`);
      continue;
    }
    const html = readFileSync(p, 'utf-8');
    const { blocks, unclosed, orphanCloses } = pairedTagBlocks(html, 'section');
    if (unclosed > 0 || orphanCloses > 0) {
      details.push(`prerender/${relFile}: <section> 标签不配对（未闭合 ${unclosed} / 多余闭合 ${orphanCloses}），分区结构无法判定`);
    }
    const marks = countEntryMarks(html);
    if (marks === 0) {
      details.push(`prerender/${relFile}: 未抽到任何 ${ENTRY}（抽取目标缺失 ⇒ 分区断言无法生效）`);
    }
    let inSection = 0;
    let titleless = 0;
    for (const b of blocks) {
      if (!classTokensOf(b.tagText).includes('nk-snapshot__section')) continue;
      const n = countEntryMarks(b.inner);
      if (n === 0) continue;
      const h2m = b.inner.match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/i);
      const h2text = h2m ? visibleText(h2m[1]).trim() : '';
      if (!h2text) {
        titleless++;
        continue;
      }
      inSection += n;
    }
    if (titleless > 0) {
      details.push(`prerender/${relFile}: ${titleless} 个含 ${ENTRY} 的 nk-snapshot__section 没有非空 <h2>（分区丢失标题）`);
    }
    if (inSection !== marks) {
      details.push(`prerender/${relFile}: ${marks - inSection}/${marks} 个 ${ENTRY} 不在带非空 <h2> 的分区 section 内（分区外或无标题）`);
    }
    sectionedChecked.push(relFile);
  }

  /* ⑤-b 全站禁空 `<ul class="nk-snapshot__list"></ul>`（契约 §3；生成器 catalogBody 已跳过空 items）。
     空清单对爬虫是零信息，它的出现说明某处「条目判据失效却没报错」——条目计数断言对它是盲区
     （空清单不含 nk-snapshot__entry，计数差为 0）。
     class 走精确 token；用 pairedTagBlocks 的 `all`（含嵌套 ul）而不是只扫最外层，
     否则 `<li>…<ul class="nk-snapshot__list"></ul></li>` 这类嵌套空清单会漏判。 */
  const emptyLists = [];
  for (const file of snapshotFiles) {
    let html;
    try {
      html = readFileSync(file, 'utf-8');
    } catch {
      continue;
    }
    const empty = pairedTagBlocks(html, 'ul').all
      .filter((b) => classTokensOf(b.tagText).includes('nk-snapshot__list') && b.inner.trim() === '');
    if (empty.length > 0) emptyLists.push(`${relative(PRERENDER, file).split(sep).join('/')}(${empty.length} 处)`);
  }
  if (emptyLists.length > 0) {
    details.push(`空 <ul class="nk-snapshot__list"></ul> ${emptyLists.length} 份快照命中: ${
      emptyLists.slice(0, 8).join(', ')}${emptyLists.length > 8 ? ' …' : ''}`);
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
    ? `条目级覆盖率（${catCounts.join(' ')}；枢纽 ${hubCounts.join(' ')}；详情页抽样 ${sampled.join(' ')}；分区结构 ${sectionedChecked.length}/${sectionedFiles.length} 份通过；空 nk-snapshot__list 0 处）`
    : '条目级覆盖率（目录条目数 ≠ 应用可见条目数 / 枢纽或详情页标记违规 / 分区结构或空清单违规）';
  push('5', title, details);
}

/* ═══ 6/7 外壳与首页一致性（Vercel 文件系统先于 rewrites，`/` 必须直接命中 home 快照） ═══ */
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
  // ③ dist/index.html 必须自带正文（否则 '/' 又变回空壳）
  if (existsSync(DIST_INDEX)) {
    const html = readFileSync(DIST_INDEX, 'utf-8');
    const h1 = tagText(html, /<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
    if (!h1) details.push(`${rel(DIST_INDEX)}: 缺非空 <h1>（'/' 必须投递含正文的 home 快照，不能是纯外壳）`);
    if (countCjk(visibleText(html)) === 0) details.push(`${rel(DIST_INDEX)}: 去标签中文字符 = 0（线上实测 '/' 曾返回 962 B 空壳）`);
  }
  /* ④ 首页族的站点统计块（task-2 冻结契约，「页面级摘要」）：
     首页族 = `home.html`（缺省语言）+ `<locale>/home.html`（其余 12 个语言）= 13 份。
     每份必须含**恰好一个** `<ul class="nk-snapshot__stats">`，内含 6 条 `<li class="nk-snapshot__stat">`，
     每条形如 `<a href="/route">本地化目录名</a><span class="nk-snapshot__stat-n">N</span>`，
     路由恰为 STAT_CATALOG_ROUTES，N = 该目录页的应用可见条目数（检查 5 实时推导，禁止写死数字）。
     stats 类名**只允许出现在首页族**——它出现在别处就说明统计块被注入了共用模板。
     抽取式纪律：抽不到 stats 容器 / 行数不符 / 行结构不符 / 抽不到期望值，全部判红。 */
  const homeFamily = Object.keys(LOCALE_CULTURE).map((loc) => (loc === DEFAULT_LOCALE ? 'home.html' : `${loc}/home.html`));
  const homeFamilySet = new Set(homeFamily);
  const statsElsewhere = [];
  for (const file of snapshotFiles) {
    const relFile = relative(PRERENDER, file).split(sep).join('/');
    if (homeFamilySet.has(relFile)) continue;
    let html;
    try {
      html = readFileSync(file, 'utf-8');
    } catch {
      continue;
    }
    const nUl = countTagClass(html, 'ul', 'nk-snapshot__stats');
    const nLi = countTagClass(html, 'li', 'nk-snapshot__stat');
    if (nUl > 0 || nLi > 0) statsElsewhere.push(`${relFile}(ul ${nUl}/li ${nLi})`);
  }
  if (statsElsewhere.length > 0) {
    details.push(`非首页族快照出现站点统计块 ${statsElsewhere.length} 份: ${
      statsElsewhere.slice(0, 5).join(', ')}（nk-snapshot__stats 只允许出现在首页族）`);
  }
  let homeStatsOk = 0;
  for (const relFile of homeFamily) {
    const p = join(PRERENDER, relFile);
    if (!existsSync(p)) {
      details.push(`缺首页族快照 prerender/${relFile}，站点统计块无法校验（文件级覆盖率见检查 4）`);
      continue;
    }
    const html = readFileSync(p, 'utf-8');
    const uls = pairedTagBlocks(html, 'ul').blocks.filter((b) => classTokensOf(b.tagText).includes('nk-snapshot__stats'));
    if (uls.length !== 1) {
      details.push(`prerender/${relFile}: nk-snapshot__stats 容器 ${uls.length} 个，应为恰好 1 个`);
      continue;
    }
    const rows = pairedTagBlocks(uls[0].inner, 'li').blocks.filter((b) => classTokensOf(b.tagText).includes('nk-snapshot__stat'));
    const problems = [];
    if (rows.length !== STAT_CATALOG_ROUTES.length) {
      problems.push(`统计条目 ${rows.length} 条，应为 ${STAT_CATALOG_ROUTES.length} 条`);
    }
    const seenRoutes = [];
    for (const row of rows) {
      const inner = row.inner.trim();
      const m = inner.match(
        /^<a\b[^>]*\bhref\s*=\s*"([^"]*)"[^>]*>([\s\S]*?)<\/a>\s*<span\b[^>]*\bclass\s*=\s*"[^"]*\bnk-snapshot__stat-n\b[^"]*"[^>]*>([\s\S]*?)<\/span>$/i,
      );
      if (!m) {
        problems.push(`统计行结构不符（应为 <a href="/route">目录名</a><span class="nk-snapshot__stat-n">N</span>）: ${
          inner.replace(/\s+/g, ' ').slice(0, 100)}`);
        continue;
      }
      const href = m[1];
      const name = visibleText(m[2]).trim();
      const num = visibleText(m[3]).trim();
      if (!STAT_CATALOG_ROUTES.includes(href)) {
        problems.push(`统计行路由不在白名单: ${JSON.stringify(href)}`);
        continue;
      }
      if (seenRoutes.includes(href)) {
        problems.push(`统计行路由重复: ${href}`);
        continue;
      }
      seenRoutes.push(href);
      if (!name) problems.push(`统计行 ${href} 的目录名为空`);
      if (!/^\d+$/.test(num)) {
        problems.push(`统计行 ${href} 的条目数不是纯数字: ${JSON.stringify(num)}`);
        continue;
      }
      const want = catalogEntryExpect.get(href);
      if (want === undefined) {
        problems.push(`统计行 ${href} 的期望条目数不可推导（检查 5 数据源不可用），实测 ${num}`);
      } else if (Number(num) !== want) {
        problems.push(`统计行 ${href} 条目数 ${num} ≠ 目录页应用可见条目数 ${want}（与目录页实时统计分叉）`);
      }
    }
    const missingRoutes = STAT_CATALOG_ROUTES.filter((r) => !seenRoutes.includes(r));
    if (missingRoutes.length > 0) problems.push(`统计行缺路由: ${missingRoutes.join(', ')}`);
    for (const msg of problems.slice(0, 8)) details.push(`prerender/${relFile}: ${msg}`);
    if (problems.length > 8) details.push(`prerender/${relFile}: …另有 ${problems.length - 8} 项未列出`);
    if (problems.length === 0) homeStatsOk++;
  }
  push('6', `外壳与首页（_shell.html 无 nk-snapshot / dist/index.html ≡ prerender/home.html / index.html 有 h1 与正文 / 首页族 ${homeStatsOk}/${homeFamily.length} 份统计块 N = 实时条目数，非首页 0 份）`, details);
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
