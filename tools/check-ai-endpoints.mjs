#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative, isAbsolute, sep, basename } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));

const REQUIRED_ROBOTS_UAS = ['OAI-SearchBot', 'PerplexityBot', 'Claude-SearchBot', 'Googlebot', 'bingbot'];
const SITEMAP_MAX_URLS = 50000;
const MIN_CJK_CHARS = 80;
const HAN_SCRIPT_LOCALES = new Set(['cn', 'cht', 'jp', 'kr']);
const DETAIL_CAP = 20;
const GAME_MARKERS = ['<color=', '<unbreak>', '<u>'];
const GENDER_MARKER_RE = /\{[MF]#[^}]*\}/;
const GENDER_MARKER_PAGE_RE = /^(?:[a-z]{2,3}\/)?(?:character(?:\.html|\/\d+\.html)|currency\/role(?:\.html|\/\d+\.html)|currency\/trait\/\d+\.html)$/;
const PARAM_PLACEHOLDER_RE = /#\d+\[[^\]]*\]/g;
const BARE_HASH_PAGES = ['currency/item.html', 'currency/augment.html'];
const BARE_HASH_RE = /#\d+/g;
const LD_PAGE_NODE_TYPES = new Set(['WebPage', 'CollectionPage', 'Article']);
const STAT_CATALOG_ROUTES = ['/character', '/lightcone', '/relic', '/item', '/monster', '/achievement'];

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

let SITE_ORIGIN = null;
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

function scriptSrcs(html) {
  return [...html.matchAll(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi)].map((m) => m[1]);
}

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

function countEntryMarks(html) {
  return countTagClass(html, 'li', 'nk-snapshot__entry');
}

function classTokensOf(tagText) {
  const cm = tagText.match(/\bclass\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
  if (!cm) return [];
  return (((cm[1] ?? cm[2] ?? cm[3]) || '').trim()).split(/\s+/).filter(Boolean);
}

function countTagClass(html, tag, token) {
  let n = 0;
  for (const m of html.matchAll(new RegExp(`<${tag}\\b[^>]*>`, 'gi'))) {
    if (classTokensOf(m[0]).includes(token)) n++;
  }
  return n;
}

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

const DETAIL_ROUTE_PREFIXES = ['character/', 'lightcone/', 'relic/', 'monster/', 'endgame/', 'currency/role/', 'currency/trait/'];

function loadJson(relPath) {
  const p = join(DATA, relPath);
  try {
    return { ok: true, value: JSON.parse(readFileSync(p, 'utf-8')) };
  } catch (e) {
    return { ok: false, err: `${rel(p)}: ${e.message}` };
  }
}

const PRERENDER = join(DIST, 'prerender');
const isInternalFile = (f) => basename(f).startsWith('_');
const allPrerenderHtml = existsSync(PRERENDER)
  ? walk(PRERENDER).filter((f) => f.toLowerCase().endsWith('.html')).sort()
  : [];
const internalFiles = allPrerenderHtml.filter(isInternalFile);
const snapshotFiles = allPrerenderHtml.filter((f) => !isInternalFile(f));
const SHELL = join(PRERENDER, '_shell.html');
const DIST_INDEX = join(DIST, 'index.html');
const SITEMAP = join(DIST, 'sitemap.xml');
const LLMS_TXT = join(DIST, 'llms.txt');
const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

function routeOf(file) {
  const p = relative(PRERENDER, file).split(sep).join('/').replace(/\.html$/i, '');
  const layeredHome = /^([a-z]{2,3})\/home$/.exec(p);
  if (layeredHome) return `/${layeredHome[1]}`;
  return p === 'home' ? '/' : `/${p}`;
}

const LANG_JSON = JSON.parse(readFileSync(join(ROOT, 'tools', 'converter', 'languages.json'), 'utf-8'));
const LOCALE_CULTURE = Object.fromEntries(
  (LANG_JSON.languages ?? LANG_JSON).map((l) => [l.code, l.culture ?? l.code]),
);
const LOCALE_CULTURE_SIZE = Object.keys(LOCALE_CULTURE).length;
const DEFAULT_LOCALE = typeof LANG_JSON.default === 'string' ? LANG_JSON.default : 'cn';
const catalogEntryExpect = new Map();
const hanByLocale = new Map();
const coveredNotes = [];
const coveredPush = (m) => coveredNotes.push(m);

const checks = [];
const push = (id, title, details) => checks.push({ id, title, ok: details.length === 0, details });

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
        cur = null;
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

{
  const details = [];
  let defaultTitle = null;
  let entryScripts = [];
  if (!existsSync(SHELL)) {
    details.push(`缺纯 SPA 外壳 ${rel(SHELL)}，无法取得默认 title 与入口 <script src> 基线（task-10 落地前会如此）`);
  } else {
    const shellHtml = readFileSync(SHELL, 'utf-8');
    defaultTitle = tagText(shellHtml, /<title[^>]*>([\s\S]*?)<\/title>/i);
    entryScripts = scriptSrcs(shellHtml).sort();
    if (!defaultTitle) details.push(`${rel(SHELL)} 无 <title>，无法判定快照默认标题`);
    if (entryScripts.length === 0) details.push(`${rel(SHELL)} 无 <script src> 入口，无法校验快照入口一致性`);
    const shellRobotsMeta = (shellHtml.match(/<meta\b[^>]*\bname\s*=\s*["']robots["'][^>]*>/i) || [])[0] || '';
    if (!/content\s*=\s*["'][^"']*noindex/i.test(shellRobotsMeta)) {
      details.push(`${rel(SHELL)} 缺 robots noindex 声明（catch-all 会把 CSR 路由 / 404 / 垃圾路径都投给它，必须挡收录）`);
    }
    const shellOg = (shellHtml.match(/<meta[^>]*property="og:image"[^>]*content="([^"]*)"/i) || [])[1] || '';
    if (!shellOg) details.push(`${rel(SHELL)} 缺 og:image（外壳兜底值，需与生成器 OG_IMAGE 同源）`);
    else if (!shellOg.startsWith(`${SITE_ORIGIN}/`)) details.push(`${rel(SHELL)} 的 og:image 非同源: ${shellOg}`);
  }
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
  const cnDictFile = join(ROOT, 'src', 'lib', 'i18n', 'messages', 'cn.json');
  let keyRe = null;
  if (existsSync(cnDictFile)) {
    const keys = Object.keys(JSON.parse(readFileSync(cnDictFile, 'utf-8')));
    const esc = (k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    keyRe = new RegExp(`(?<![\\w.])(${keys.map(esc).join('|')})(?![\\w.])`);
  }

  let phFiles = 0;
  const versionProbe = loadJson('version.json');
  const syncedAt = versionProbe.ok ? String(versionProbe.value?.synced_at ?? '').trim() : '';
  if (!syncedAt) {
    details.push(
      `无法从 ${rel(join(DATA, 'version.json'))} 读取 synced_at，dateModified / <time> 断言失效`
      + (versionProbe.ok ? '（字段缺失或为空）' : `：${versionProbe.err}`),
    );
  }
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

    if (html.includes('$t:')) add('正文残留未解析文本令牌 `$t:…`');
    {
      const m = html.match(/\{PROP:[A-Za-z0-9_]+\}/);
      if (m) add(`正文残留未解析属性占位符 ${m[0]}`);
    }
    if (keyRe) {
      const hit = html.match(keyRe);
      if (hit) add(`正文出现原始词典键名「${hit[1]}」（缺键或未翻译）`);
    }

    const noindexAt = html.search(/noindex/i);
    if (noindexAt >= 0) {
      add(`含 noindex（快照必须可收录，该声明只属于 _shell.html）: …${
        html.slice(Math.max(0, noindexAt - 60), noindexAt + 24).replace(/\s+/g, ' ')}…`);
    }

    const title = tagText(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
    if (!title) add('缺 <title> 或标题为空');
    else if (defaultTitle && title === defaultTitle) add(`<title> 仍是站点默认标题「${title}」`);

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

    const anchors = [...html.matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"']*)["'][^>]*>/gi)].map((m) => m[1].trim());
    const internal = anchors.filter((h) => h.startsWith('/') || (SITE_ORIGIN && h.startsWith(SITE_ORIGIN + '/')));
    if (internal.length === 0) {
      add(`无站内 <a href="/...">（内链是快照存在的首要目的；当前 ${anchors.length} 个 a）`);
    }
    const bogus = anchors.filter((h) => !h.startsWith('/') && !/^https?:\/\//i.test(h));
    if (bogus.length > 0) add(`含非法链接 href（禁止 # / JS / 相对路径）: ${bogus.slice(0, 3).join(', ')}`);

    const text = visibleText(html);
    const rawScan = html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<!--[\s\S]*?-->/g, ' ');
    const cjk = countCjk(text);
    const firstSeg = relative(PRERENDER, file).split(sep)[0];
    const isHanLocale = firstSeg === 'cht' || !/^[a-z]{2,3}$/.test(firstSeg);
    if (isHanLocale) {
      if (cjk < MIN_CJK_CHARS) add(`去标签正文中文字符 ${cjk} < ${MIN_CJK_CHARS}（服务端 HTML 必须有正文）`);
    } else {
      const textLen = text.replace(/\s+/g, '').length;
      if (textLen < MIN_CJK_CHARS) add(`去标签正文长度 ${textLen} < ${MIN_CJK_CHARS}（服务端 HTML 必须有正文）`);
    }

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

    const snapStart = html.indexOf('<div class="nk-snapshot">');
    const bodyText = snapStart >= 0 ? visibleText(html.slice(snapStart)) : '';
    if (!bodyText) {
      add('未能抽取 nk-snapshot 正文（标记缺失或正文为空）——所有基于正文的断言都会静默失效');
    }

    if (!isHanLocale && !HAN_SCRIPT_LOCALES.has(firstSeg)) {
      const hanRuns = bodyText.match(/[\u4e00-\u9fff]+/g) ?? [];
      const hanCount = hanRuns.filter((r) => '星铁档案馆'.indexOf(r) === -1).length;
      if (hanCount > 0) hanByLocale.set(firstSeg, (hanByLocale.get(firstSeg) ?? 0) + 1);
    }

    const h1 = tagText(html, /<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
    if (h1 === null) add('缺 <h1>');
    else if (!h1) add('<h1> 文本为空');

    const lds = [...html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
    if (lds.length === 0) add('缺 JSON-LD <script type="application/ld+json">');
    for (let i = 0; i < lds.length; i++) {
      try {
        JSON.parse(lds[i].trim());
      } catch (e) {
        add(`JSON-LD #${i + 1} JSON.parse 失败: ${e.message}`);
      }
    }

    if (syncedAt) {
      const ldNodes = [];
      for (const raw of lds) {
        let graph;
        try {
          graph = JSON.parse(raw.trim());
        } catch {
          continue;
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
      } catch { }
    }

    const hasArticle = lds.length > 0 && (() => {
      try {
        const g = JSON.parse(lds[0].trim());
        return (g['@graph'] || [g]).some((n) => n && n['@type'] === 'Article');
      } catch { return false; }
    })();
    const isVoracityPage = /(^|\/)voracity\.html$/.test(String(file).split('\\').join('/'));
    if (hasArticle && !isVoracityPage) add('JSON-LD 用 Article 描述数据条目页（应改用 WebPage + mainEntity）');
    if (!hasArticle && isVoracityPage) add('/voracity 的 JSON-LD 应为 Article（它是叙述性专题，不是数据条目）');

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

    for (const marker of GAME_MARKERS) {
      if (rawScan.includes(marker) || text.includes(marker)) add(`正文残留游戏标记 ${marker}`);
    }
    if (rawScan.includes('\\n') || text.includes('\\n')) add('正文残留字面 \\n 游戏换行标记');

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

    const phText = text.match(PARAM_PLACEHOLDER_RE) || [];
    const phRaw = rawScan.match(PARAM_PLACEHOLDER_RE) || [];
    if (phText.length > 0 || phRaw.length > 0) {
      const n = phText.length > 0 ? phText.length : phRaw.length;
      phFiles++;
      add(`正文残留未展开参数占位符 ${n} 处（如 ${(phText[0] || phRaw[0]).replace(/</g, '&lt;')}）`);
    }

    const snapPath = relative(PRERENDER, file).split(sep).join('/');
    if (BARE_HASH_PAGES.includes(snapPath)) {
      const bh = text.match(BARE_HASH_RE) || [];
      if (bh.length > 0) {
        bareHashHits.push(snapPath);
        add(`可见文本残留裸 #N 占位符 ${bh.length} 处（如 ${bh[0]}）。本断言按契约 §6.3 仅点名这两个 CW 目录页——裸 #N 无法与上游字面（天才俱乐部#81号会员 / #8拉姆 / {TEXTJOIN#61} / achievement.html 的 233 处）区分，禁止扩为全局断言；也只扫可见文本（属性/注释中的 #121214 等色值不算）`);
      }
    }

    const scripts = scriptSrcs(html).sort();
    if (entryScripts.length > 0 && scripts.join('|') !== entryScripts.join('|')) {
      add(`入口 <script src> 与 dist/index.html 不一致: [${scripts.join(', ')}] ≠ [${entryScripts.join(', ')}]`);
    }

    const relNoExt = relative(PRERENDER, file).split(sep).join('/').replace(/\.html$/i, '');
    const marks = countEntryMarks(html);
    if (DETAIL_ROUTE_PREFIXES.some((p) => relNoExt.startsWith(p))) {
      if (marks > 0) add(`详情页出现 ${marks} 个 nk-snapshot__entry（契约 §3：该类名仅用于目录条目清单）`);
    } else if (relNoExt === 'voracity' && marks > 0) {
      add(`专题页出现 ${marks} 个 nk-snapshot__entry（契约 §3：专题页分区不是应用收录条目集合，禁止使用该标记）`);
    }
  }

  const preCount = details.length;
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

{
  const details = [];

  const singleFamilies = [
    ['home', 'home.html', '/'],
    ['character', 'character.html', '/character'],
    ['lightcone', 'lightcone.html', '/lightcone'],
    ['relic', 'relic.html', '/relic'],
    ['item', 'item.html', '/item'],
    ['monster', 'monster.html', '/monster'],
    ['endgame', 'endgame.html', '/endgame'],
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
    ['voracity', 'voracity.html', '/voracity'],
  ];

  const idFamilyDefs = [
    ['character', 'character', 'characters.json', (j) => j.filter((x) => x && x.name).map((x) => String(x.id))],
    ['lightcone', 'lightcone', 'light_cones.json', (j) => j.filter((x) => x && x.name).map((x) => String(x.id))],
    ['relic', 'relic', 'relics.json', (j) => j.filter((x) => x && x.name).map((x) => String(x.id))],
    ['monster', 'monster', 'monsters.json', (j) => j.filter((x) => x && x.name).map((x) => String(x.id))],
    ['currency/role', 'currency/role', 'currency/role.json', (j) => j.roles.map((x) => String(x.id))],
    ['currency/trait', 'currency/trait', 'currency/traits.json', (j) => j.traits.map((x) => String(x.id))],
  ];

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

  const observedSingle = new Set();
  const observedIds = new Map(families.filter((f) => f.kind === 'ids').map((f) => [f.id, new Set()]));
  const strays = [];
  for (const file of snapshotFiles) {
    const relNoExt = relative(PRERENDER, file).split(sep).join('/').replace(/\.html$/i, '');
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

  const missingSingles = families.filter((f) => f.kind === 'single' && !observedSingle.has(f.id));
  if (missingSingles.length > 0) {
    details.push(
      `缺 ${missingSingles.length} 个单页快照: ${missingSingles.map((f) => `prerender/${f.file}（路由 ${f.route}）`).join(', ')}`,
    );
  }

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
    : '覆盖率（数据实时统计不一致 / 分层快照汉字残留回涨）';
  push('4', title, details);
}

{
  const details = [];
  const ENTRY = 'nk-snapshot__entry';
  const named = (x) => Boolean(x && x.name);


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

  const hubCounts = [];
  for (const [file, route] of [['home.html', '/'], ['currency.html', '/currency']]) {
    const html = readSnap(file);
    if (html === null) continue;
    const got = countEntryMarks(html);
    if (got < 1) details.push(`${route}: 枢纽页 ${ENTRY} 条目 ${got} < 1（分区是 curated 子集，至少 1 条）`);
    hubCounts.push(`${route === '/' ? 'home' : 'currency'}=${got}/≥1`);
  }

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

{
  const details = [];
  if (!existsSync(SHELL)) {
    details.push(`缺纯 SPA 外壳 ${rel(SHELL)}（vercel catch-all rewrite 的投递目标；task-10 落地前会如此）`);
  } else {
    const shellHtml = readFileSync(SHELL, 'utf-8');
    const marks = (shellHtml.match(/nk-snapshot/g) || []).length;
    if (marks !== 0) details.push(`${rel(SHELL)}: 出现 ${marks} 处 nk-snapshot——纯外壳不得含快照内容（它经 rewrite 投递给全部 CSR 路由）`);
  }
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
  if (existsSync(DIST_INDEX)) {
    const html = readFileSync(DIST_INDEX, 'utf-8');
    const h1 = tagText(html, /<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
    if (!h1) details.push(`${rel(DIST_INDEX)}: 缺非空 <h1>（'/' 必须投递含正文的 home 快照，不能是纯外壳）`);
    if (countCjk(visibleText(html)) === 0) details.push(`${rel(DIST_INDEX)}: 去标签中文字符 = 0（线上实测 '/' 曾返回 962 B 空壳）`);
  }
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
process.exitCode = failed === 0 ? 0 : 1;
