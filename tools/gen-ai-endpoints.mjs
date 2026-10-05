#!/usr/bin/env node
/**
 * AI 检索可见性端点生成器（契约 docs/agents/ai-discoverability.md §1-§4）。
 * 用途：构建期把 dist/index.html 原样复制为每个可索引路由一份快照，注入正文 + 真实内链 +
 * 元信息 + JSON-LD 到 dist/prerender/**.html，并输出 dist/sitemap.xml（rewrite 由 vercel.json 管）。
 * 用法：pnpm exec vite build && node tools/gen-ai-endpoints.mjs（必须先有 dist/index.html）。
 * 禁止：改动 dist/index.html 本身（/assets/* 哈希会漂移，守卫断言入口 JS 逐字一致）；import 本模块产生
 * 任何副作用（守卫只 import SITE_ORIGIN，故主流程由入口判断包住）；自建数据源或写死实体内容
 * （数据只从 public/data/cn/** 读，口径以 src/services/api|app/views|app/catalog/pages 为准）；
 * 把 SNAPSHOT_TEXT_LIMIT_* 截断改成全量输出；输出 # 或 JS 链接。
 * 必须：数据派生文本先 clean()（剥 <color=…>/<unbreak>/<u>/\n）再 esc()（HTML 转义，同前端 escHtml）；
 * 详情页含 h1 + 摘要 + 数据事实表 + 面包屑 + ≥3 条同类内链 + 数据最后更新，目录页含 h1 + 条目清单 + 更新时间，
 * 专题页（/voracity）含 h1 + 面包屑 + 分区 + 数据最后更新（非目录，故无 nk-snapshot__entry 条目标记）。
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

/** 站点源（快照 canonical / sitemap / JSON-LD 只用它） */
export const SITE_ORIGIN = 'https://myhsr.wiki';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DATA_DIR = join(ROOT, 'public', 'data', 'cn');
const DIST_DIR = join(ROOT, 'dist');
const TEMPLATE_FILE = join(DIST_DIR, 'index.html');
const PRERENDER_DIR = join(DIST_DIR, 'prerender');
const SITEMAP_FILE = join(DIST_DIR, 'sitemap.xml');
/** 纯 shell 落点（下划线前缀 = 非快照：不注入 .nk-snapshot/canonical/title，不进 sitemap/覆盖率统计） */
const SHELL_FILE = join(PRERENDER_DIR, '_shell.html');

/** 单实体文本上限（契约 §3）：目录条目 4000 / 详情页 20000，超出截断并加 … */
const SNAPSHOT_TEXT_LIMIT_ENTRY = 4000;
const SNAPSHOT_TEXT_LIMIT_DETAIL = 20000;

/** 站点名（与 src/lib/constants.ts SITE_NAME 一致） */
const SITE_NAME = '星铁档案馆';
/** 角色满级等级（与 src/lib/constants.ts MAX_CHAR_LEVEL 一致；满级属性 = base + add*(N-1)） */
const MAX_CHAR_LEVEL = 80;

/* ─── 枚举展示名（前端代码常量，数据文件里没有；新增枚举值必须同步这些表与前端） ─── */

/** 目录路由 meta.title（与 src/app/router/index.ts 各目录路由的 meta.title 逐字一致） */
const CATALOG_TITLE = {
  '/character': '角色图鉴',
  '/lightcone': '光锥图鉴',
  '/relic': '遗器图鉴',
  '/item': '物品',
  '/monster': '敌对物种',
  '/endgame': '终局内容',
  '/achievement': '成就',
  '/currency/role': '货币战争 · 角色图鉴',
  '/currency/item': '货币战争 · 装备图鉴',
  '/currency/buff': '货币战争 · 投资环境',
  '/currency/augment': '货币战争 · 投资策略',
  '/currency/trait': '货币战争 · 羁绊图鉴',
};

/** 专题页 `/voracity` 的标题（与 src/app/router/index.ts 该路由 meta.title 逐字一致；非目录故不进 CATALOG_TITLE） */
const VORACITY_TITLE = '贪饕污染';
/**
 * 专题页「污染」同形词说明（页面级自撰文案，源数据里没有这段文本）：来自 CONTEXT.md「污染」同形词节
 * + ADR 0025 决策——本页说的是「贪饕」侵蚀污染，与 4.5 联动「圣杯战争 · 污染等级」无关联，
 * 禁止合并叙述或互相内链。属契约 §3 的页面级合成文案，但**内容级文本必须与页面逐字一致**（非 chrome 级）。
 */
// 与 src/app/views/VoracityView.vue 的同形词说明逐字一致（契约：同一分区文本对所有 UA 一致）
const VORACITY_DISAMBIGUATION = '本页「污染」指「贪饕」侵蚀污染；4.5 联动「命运/今晚留下来」的「圣杯战争 · 污染等级 1–7 / 深度污染 / 污染词条」是另一套无关体系，两者不合并叙述、也不互相内链。';

/** 终局四模式（与 src/app/catalog/pages/endgame.ts ENDGAME_MODES 的 key/label 一致） */
const ENDGAME_MODES = [
  { key: 'maze', label: '忘却之庭', file: 'maze.catalog.json' },
  { key: 'story', label: '虚构叙事', file: 'maze_extra.catalog.json' },
  { key: 'boss', label: '末日幻影', file: 'maze_boss.catalog.json' },
  { key: 'peak', label: '异相仲裁', file: 'maze_peak.catalog.json' },
];

/** 敌对物种分类（与 src/lib/constants.ts MON_RANK、catalog/pages/monster.ts MON_TYPE 一致） */
const MON_RANK = {
  Minion: '普通', MinionLv2: '普通', Elite: '精英', LittleBoss: '准首领', BigBoss: '首领',
};
const MON_TYPE = { BOSS: '首领', ELITE: '精英', MINION: '喽啰' };

/** 物品主类型（与 src/app/catalog/pages/item.ts MAIN_TYPE_NAMES 一致；子类型不建映射，原样输出数据值） */
const ITEM_MAIN_TYPE = { Material: '材料', Virtual: '货币', Usable: '可用', Mission: '任务' };

/** 成就稀有度 / 货币战争标签（与 catalog 配置同源） */
const ACH_RARITY = { Low: '铜', Mid: '银', High: '金' };
const CW_FB_LABEL = { Front: '前台', Back: '后台', Both: '前后台' };
const CW_CHARGE_LABEL = { Speed: '速度', EnergyBar: '特殊充能', MaxSP: '终结技能量', MaxHP: '生命上限', SP: '战技点' };
const CW_CAT_LABEL = { faction: '阵营', combat: '流派', special: '特殊' };
const CW_QUALITY_LABEL = { Silver: '银色', Gold: '金色', Multicolor: '彩', Unique: '独特' };

/* ═══════════ 基础工具 ═══════════ */

function fail(msg) {
  console.error(`[FAIL] ${msg}`);
  process.exit(1);
}

function readJson(rel) {
  const file = join(DATA_DIR, rel);
  if (!existsSync(file)) fail(`缺少数据文件 ${file}（public/data/cn/** 由 tools/converter 生成）`);
  return JSON.parse(readFileSync(file, 'utf8'));
}

const ESC_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** HTML 转义（与 src/lib/html.ts escHtml 同规则） */
function esc(v) {
  return v == null ? '' : String(v).replace(/[&<>"']/g, (c) => ESC_MAP[c]);
}

/**
 * 剥离游戏富文本标记并归一空白（对照 src/lib/html.ts stripTags 的清洗域）：
 * <color=…>/</color>、<unbreak>、<u>、<i> 等全部标签、{SPACE}/{NICKNAME}/{F#…}/{M#…}/{RUBY_*}/{TEXTJOIN#n}、
 * 以及字面 \n 与真实换行。守卫断言可见文本中不残留 <color= / <unbreak> / \n。
 */
function clean(raw) {
  if (raw == null) return '';
  return String(raw)
    .replaceAll('{SPACE}', ' ')
    .replace(/\{NICKNAME\}/g, '开拓者')
    .replace(/\{[FM]#([^}]*)\}/g, '$1')
    .replace(/\{RUBY_[EB]#[^}]*\}/g, '')
    .replace(/\{TEXTJOIN#\d+\}/g, '')
    .replace(/\\n|\r?\n/g, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** 单个 #N[tag]% 占位符取值（对照 src/lib/format.ts fmtVal；取值口径必须与前端一致） */
function fmtParam(value, tag, pct) {
  if (value == null || Number.isNaN(Number(value))) return null;
  let n = Number(value);
  if (pct) n *= 100;
  const m = /^f([1-6])$/.exec(tag || '');
  if (m) {
    const f = 10 ** Number(m[1]);
    return String(Math.round(n * f) / f);
  }
  return String(Math.round(n));
}

/**
 * 替换 #N[tag]% / 裸 #N 占位符（描述文本里的参数必须展开，否则文本不可读）。
 * 坑位：`%` 属于占位符语法（正则把它单独捕获），替换时必须原样补回——前端 fmtDesc 输出
 * `${n}${pct}`；漏补会让「治疗量提高#1[i]%。」变成「治疗量提高10。」（丢百分号）。
 */
function fillParams(text, params) {
  if (!text || !Array.isArray(params) || !params.length) return text;
  return text
    .replace(/#(\d+)\[([^\]]*)\](%?)/g, (raw, i, tag, pct) => {
      const v = fmtParam(params[Number(i) - 1], tag, pct === '%');
      return v == null ? raw : v + pct;
    })
    .replace(/#(\d+)/g, (raw, i) => fmtParam(params[Number(i) - 1], '', '') ?? raw);
}

/** 截断到 limit 并加 … */
function cut(text, limit) {
  return limit && text.length > limit ? `${text.slice(0, limit)}…` : text;
}

/** 数据派生文本 → 纯文本（已剥离游戏标记、已展开参数） */
function plain(raw, params, limit) {
  return cut(fillParams(clean(raw), params), limit);
}

/** 数据派生文本 → 已转义的安全 HTML 文本（正文一律用它，禁止直接拼原始数据） */
function txt(raw, params, limit = SNAPSHOT_TEXT_LIMIT_DETAIL) {
  return esc(plain(raw, params, limit));
}

/**
 * 目录条目字段的安全渲染（契约 §3「参数展开保真」，含裸 `#N` 语义判据）：
 * 1) 先按 fmtDesc/fmtVal 口径展开 `#N[tag]%`；展开后仍含 `#N[...]` → 省略该字段。
 * 2) 裸 `#N` 的语义取决于该字段所属数据条目是否携带 params 语义（`params` / `base_params` / `param_list` 数组存在，
 *    即便为空数组也算携带）：携带 → 展不开则整个字段省略；不携带 → 是上游字面量，必须原样保留。
 * 判定一律用未截断的展开文本，避免截断把占位符切成半截。
 */
function txtSafe(raw, params, limit = SNAPSHOT_TEXT_LIMIT_ENTRY, paramsSemantics = false) {
  const expanded = plain(raw, params);
  if (/#\d+\[/.test(expanded)) return '';
  if (paramsSemantics && /#\d/.test(expanded)) return '';
  return esc(cut(expanded, limit));
}

/** 条目是否携带参数语义（决定裸 `#N` 是占位符还是上游字面量；见 txtSafe） */
function hasParamSemantics(entry) {
  return Array.isArray(entry && entry.params)
    || Array.isArray(entry && entry.base_params)
    || Array.isArray(entry && entry.param_list);
}

/** 通用属性名/属性值（对照 src/lib/currency-role.ts propLabel / propValue） */
function propLabel(prop) {
  if (prop && typeof prop.prop_name === 'string' && prop.prop_name) return prop.prop_name;
  const key = String((prop && (prop.property_type || prop.name)) || '');
  return key.replace(/^Extra/, '').replace(/AddedRatio\d*$/, '');
}
function propValue(v) {
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);
  return Math.abs(n) < 1 ? `${(n * 100).toFixed(0)}%` : String(n);
}

/** 稀有度数字 → ★ 串 */
function starText(n) {
  const num = Number(n) || 0;
  return num > 0 ? '★'.repeat(num) : '';
}

/**
 * 详情页 meta description 的数据字段拼装（源描述文本缺失时使用）。
 * 禁止在此写合成事实句（形如「X 是某游戏的可玩角色」）——那会成为不存在于数据的实体事实；
 * 只允许把数据字段用「 · 」连接，字段全缺时退化为「图鉴名 · 名称」。
 */
function factMeta(parts, fallbackLabel, name) {
  const bits = parts.map((p) => clean(p)).filter(Boolean);
  return bits.length ? `${name} · ${bits.join(' · ')}` : `${fallbackLabel} · ${name}`;
}

/** 取同类条目第 index 个的前后邻居（≥3 条同类内链；越界跳过、去重） */
function siblingsOf(list, index, count = 4) {
  const out = [];
  const seen = new Set();
  for (let step = 1; out.length < count && step <= list.length; step += 1) {
    for (const j of [index + step, index - step]) {
      if (j < 0 || j >= list.length) continue;
      const item = list[j];
      const key = String(item.href);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(item);
      if (out.length >= count) break;
    }
  }
  return out;
}

/* ═══════════ HTML 骨架（所有 *_html 参数必须是已转义片段） ═══════════ */

function crumbHtml(parts) {
  const items = parts.map(([label, href]) => (href
    ? `<a href="${esc(href)}">${esc(label)}</a>`
    : `<span>${esc(label)}</span>`));
  return `<nav class="nk-snapshot__crumbs" aria-label="面包屑">${items.join('<span class="nk-snapshot__sep">›</span>')}</nav>`;
}

function snapSection(title, html) {
  return html ? `<section class="nk-snapshot__section"><h2>${esc(title)}</h2>${html}</section>` : '';
}

/** 分区级列表入口：与 SPA 分区头右端的 `.nk-hub-release__all` 同源同目标（同一 href、同一份 listHref）。
    措辞属页面级 chrome（页面写「全部角色」），此处用「查看全部角色」——按 §3 粒度规则允许不同。 */
function snapMore(href, label) {
  return `<p class="nk-snapshot__more"><a href="${esc(href)}">查看全部${esc(label)}</a></p>`;
}

/**
 * 条目清单：name/href 由本函数转义；meta/desc 必须是调用方已转义片段。
 * `entry=true` 给内容面收录条目加稳定标记 class `nk-snapshot__entry`（契约 §3）：
 * 覆盖目录页条目清单 + 枢纽页收录条目分区（`/` 版本上新三分区、`/currency` 本赛季两分区）——
 * 这两类判据失效会静默空态，故必须可被守卫逐条计数。
 * 禁止把它加在详情页的导航性列表上——守卫断言详情页该类名计数 = 0。
 */
function linkList(items, entry = false) {
  const open = entry ? '<li class="nk-snapshot__entry">' : '<li>';
  const rows = items.map((it) => {
    const label = it.href
      ? `<a href="${esc(it.href)}">${esc(it.name)}</a>`
      : `<span>${esc(it.name)}</span>`;
    const meta = it.meta ? `<span class="nk-snapshot__itemmeta">${it.meta}</span>` : '';
    const desc = it.desc ? `<p class="nk-snapshot__itemdesc">${it.desc}</p>` : '';
    return `${open}${label}${meta}${desc}</li>`;
  });
  return `<ul class="nk-snapshot__list">${rows.join('')}</ul>`;
}

function snapFooter(ctx) {
  return `<p class="nk-snapshot__meta">数据最后更新：${esc(ctx.syncedAt)}</p>`
    + `<p class="nk-snapshot__note">本页为${esc(SITE_NAME)}构建期预渲染快照，内容与站点数据一致，无 JavaScript 亦可读取。</p>`;
}

/** 事实表：values 必须是已转义片段或纯数字 */
function factList(facts) {
  const rows = (facts || [])
    .filter(([, v]) => v != null && String(v) !== '')
    .map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${v}</dd></div>`);
  return rows.length ? `<dl class="nk-snapshot__facts">${rows.join('')}</dl>` : '';
}

/** 目录页正文 */
function catalogBody(ctx, o) {
  const parts = ['<div class="nk-snapshot">', o.crumbs, `<h1>${esc(o.h1)}</h1>`];
  if (o.summary) parts.push(`<p class="nk-snapshot__summary">${o.summary}</p>`);
  parts.push(linkList(o.items, true));
  for (const s of o.sections || []) parts.push(snapSection(s.title, s.html));
  parts.push(snapFooter(ctx));
  parts.push('</div>');
  return parts.join('');
}

/** 详情页正文：h1 + 摘要 + 事实表 + 章节 + ≥3 条同类内链 + 更新时间 */
function detailBody(ctx, o) {
  const parts = ['<div class="nk-snapshot">', o.crumbs, `<h1>${esc(o.h1)}</h1>`];
  if (o.summary) parts.push(`<p class="nk-snapshot__summary">${o.summary}</p>`);
  const facts = factList(o.facts);
  if (facts) parts.push(facts);
  for (const s of o.sections || []) parts.push(snapSection(s.title, s.html));
  const links = (o.links || []).map((l) => ({ name: l.name, href: l.href }));
  if (links.length) parts.push(snapSection(o.listLabel || '同图鉴条目', linkList(links)));
  parts.push(snapFooter(ctx));
  parts.push('</div>');
  return parts.join('');
}

/* ═══════════ JSON-LD（契约 §4） ═══════════ */

function ldCollection(route, title, description, entries) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: title,
    url: SITE_ORIGIN + route,
    description,
    inLanguage: 'zh-CN',
    isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: `${SITE_ORIGIN}/` },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: entries.length,
      itemListElement: entries.map((e, i) => {
        const node = { '@type': 'ListItem', position: i + 1, name: e.name };
        if (e.href) node.url = SITE_ORIGIN + e.href;
        return node;
      }),
    },
  };
}

/** 面包屑节点（各页共用同一种形状） */
function breadcrumbNode(crumbs) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map(([label, href], i) => {
      const node = { '@type': 'ListItem', position: i + 1, name: label };
      if (href) node.item = SITE_ORIGIN + href;
      return node;
    }),
  };
}

function ldArticle(route, headline, description, crumbs, ctx) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline,
        description,
        dateModified: ctx.syncedAt,
        inLanguage: 'zh-CN',
        mainEntityOfPage: SITE_ORIGIN + route,
        isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: `${SITE_ORIGIN}/` },
      },
      breadcrumbNode(crumbs),
    ],
  };
}

/**
 * 角色详情页的 JSON-LD（验收标准 B5）。
 *
 * 与 `ldArticle` 的差别：角色详情页不是「一篇文章」，而是一个**虚构角色实体**。
 * 用 `Article` 描述它等于把数据页说成资讯稿 —— 机器既拿不到角色属性、也拿不到角色身份。
 * 结构：`WebPage`（这是页面）+ `mainEntity` = `Person`（角色本体，`additionalType: VideoGameSeries`
 * 说明它属于哪类虚构世界）+ `BreadcrumbList`（层级位置）。依据：
 * - `Person.characterAttribute`（见 schema.org/VideoGameSeries）：「a piece of data that represents a
 *   particular aspect of a fictional character (skill, power, character points, advantage, disadvantage)」
 *   —— 正好是稀有度 / 命途 / 属性 / 阵营 / 终结技能量这类游戏属性。
 * - `Person.alternateName`：拉丁转写名（本仓 `name_en`；开拓者形态为空串，故省略而不是落占位符）。
 * 数据全部来自 `public/data/cn/characters/<id>.json`（不新增数据源；空值一律省略）。
 */
function ldCharacter(route, name, description, crumbs, ctx, d) {
  const attrs = [];
  const rarity = /(\d+)\s*$/.exec(String(d.rarity || ''))?.[1];
  if (rarity) attrs.push({ '@type': 'PropertyValue', name: '稀有度', value: rarity });
  const pathName = ctx.pathNames.get(d.base_type) || d.base_type;
  if (pathName) attrs.push({ '@type': 'PropertyValue', name: '命途', value: pathName });
  const elemName = ctx.elemNames.get(d.damage_type) || d.damage_type;
  if (elemName) attrs.push({ '@type': 'PropertyValue', name: '属性', value: elemName });
  const camp = clean(d.chara_info && d.chara_info.camp);
  if (camp) attrs.push({ '@type': 'PropertyValue', name: '阵营', value: camp });
  if (d.sp_need != null) attrs.push({ '@type': 'PropertyValue', name: '终结技能量', value: String(d.sp_need) });

  const character = {
    '@type': 'Person',
    '@id': `${SITE_ORIGIN}${route}#character`,
    name,
    additionalType: 'https://schema.org/VideoGameSeries',
    description,
    inLanguage: 'zh-CN',
    isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: `${SITE_ORIGIN}/` },
  };
  const nameEn = clean(d.name_en);
  if (nameEn) character.alternateName = nameEn;
  if (attrs.length) character.characterAttribute = attrs;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${SITE_ORIGIN}${route}#page`,
        name,
        description,
        url: SITE_ORIGIN + route,
        inLanguage: 'zh-CN',
        isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: `${SITE_ORIGIN}/` },
        mainEntity: { '@id': `${SITE_ORIGIN}${route}#character` },
      },
      character,
      breadcrumbNode(crumbs),
    ],
  };
}

/** JSON-LD 序列化：转义 < 防 </script> 截断 */
function serializeLd(ld) {
  return JSON.stringify(ld).replace(/</g, '\\u003c');
}

/* ═══════════ 模板注入（契约 §1 的 5 项） ═══════════ */

/** <meta {attr}="{value}" content="…"> 覆盖或新增 */
function upsertMeta(html, attr, value, content) {
  const re = new RegExp(`<meta\\s+[^>]*${attr}="${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>`);
  const tag = `<meta ${attr}="${value}" content="${esc(content)}">`;
  if (re.test(html)) return html.replace(re, tag);
  return html.replace('</head>', `${tag}</head>`);
}

/**
 * 快照 = 构建后 index.html 原样复制 + 5 项注入（顺序无关）。
 * 禁止重写模板：/assets/* 与 index.html 必须逐字一致（守卫断言）。
 */
function renderSnapshot(template, page) {
  const canonical = SITE_ORIGIN + page.route;
  let html = template;

  // 3) title / description / og
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(page.title)}</title>`);
  html = upsertMeta(html, 'name', 'description', page.description);
  html = upsertMeta(html, 'property', 'og:title', page.title);
  html = upsertMeta(html, 'property', 'og:description', page.description);
  html = upsertMeta(html, 'property', 'og:url', canonical);

  // 1) <head> 首部内联 js class 脚本（CSS 规则只用它隐藏快照，JS 用户看不到重复内容）
  html = html.replace('<head>', '<head><script>document.documentElement.classList.add(\'js\')</script>');
  // 2)+3)+4) head 末尾：快照隐藏样式 + canonical + JSON-LD
  const headTail = `<style>html.js #app > .nk-snapshot{display:none}</style>`
    + `<link rel="canonical" href="${esc(canonical)}">`
    + `<script type="application/ld+json">${serializeLd(page.ld)}</script>`;
  html = html.replace('</head>', `${headTail}</head>`);

  // 5) #app 内注入快照正文
  const appRe = /<div id="app">\s*<\/div>/;
  if (!appRe.test(html)) {
    fail('dist/index.html 的 #app 容器不是空 div（模板结构变化），无法注入快照正文');
  }
  html = html.replace(appRe, `<div id="app">${page.body}</div>`);
  return html;
}

function renderSitemap(ctx, pages) {
  // 同步日期（converter 的 version.json.synced_at）合法才写 <lastmod>
  const lastmod = /^\d{4}-\d{2}-\d{2}/.test(ctx.syncedAt || '')
    ? `<lastmod>${esc(ctx.syncedAt)}</lastmod>` : '';
  const urls = pages
    .map((p) => `<url><loc>${SITE_ORIGIN}${p.route}</loc>${lastmod}</url>`)
    .join('');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>\n`;
}

/* ═══════════ 各族页面构建 ═══════════ */

function loadContext() {
  const version = readJson('version.json');
  return {
    syncedAt: clean(version.synced_at) || '未知',
    versionLabel: clean(version.version_label),
    pathNames: new Map(readJson('paths.json').map((p) => [p.id, p.name])),
    elemNames: new Map(readJson('elements.json').map((e) => [e.id, e.name])),
  };
}

/** 首页判据（与 use-release-showcase.ts pickCurrentVersion 同口径） */
function pickRelease(list, label) {
  const target = String(label || '').trim();
  if (!target) return [];
  return list.filter((item) => String(item.release_version ?? '').trim() === target);
}

/** 货币战争判据（与 pickSeasonNew 同口径：只读 converter 写入的布尔字段） */
function pickSeasonNew(list) {
  return list.filter((item) => item.is_season_new === true);
}

function makePage(family, o) {
  return { family, route: o.route, file: o.file, title: o.title, description: o.description, ld: o.ld, body: o.body };
}

/* ─── 首页 `/`（版本上新三分区） ─── */

function homePages(ctx) {
  const chars = readJson('characters.json').filter((c) => c.name);
  const cones = readJson('light_cones.json').filter((c) => c.name);
  const relics = readJson('relics.json').filter((r) => r.name);
  const title = `首页 - ${SITE_NAME}`;
  const groups = [
    {
      label: '角色',
      listHref: '/character',
      rows: pickRelease(chars, ctx.versionLabel).sort((a, b) => Number(b.id) - Number(a.id)),
      href: (c) => `/character/${c.id}`,
      meta: (c) => `${starText(c.rarity)} · ${ctx.elemNames.get(c.element) || c.element} · ${ctx.pathNames.get(c.path) || c.path}`,
    },
    {
      label: '光锥',
      listHref: '/lightcone',
      rows: pickRelease(cones, ctx.versionLabel).sort((a, b) => Number(b.id) - Number(a.id)),
      href: (c) => `/lightcone/${c.id}`,
      meta: (c) => `${starText(c.rarity)} · ${ctx.pathNames.get(c.path) || c.path}`,
    },
    {
      label: '遗器',
      listHref: '/relic',
      rows: pickRelease(relics, ctx.versionLabel).sort((a, b) => Number(b.id) - Number(a.id)),
      href: (r) => `/relic/${r.id}`,
      meta: (r) => (Array.isArray(r.require_num) && r.require_num.includes(4) ? '隧洞遗器 · 4件套' : '位面饰品 · 2件套'),
    },
  ];
  const sections = [];
  const ldEntries = [];
  for (const g of groups) {
    if (!g.rows.length) continue;
    const items = g.rows.map((row) => ({ name: row.name, href: g.href(row), meta: g.meta(row) }));
    sections.push({ title: `${g.label}（${items.length}）`, html: linkList(items, true) + snapMore(g.listHref, g.label) });
    for (const it of items) ldEntries.push(it);
  }
  const versionText = ctx.versionLabel ? `${ctx.versionLabel} 版本上新` : '版本上新';
  const summaryPlain = `${SITE_NAME}首页：${versionText}，收录本版本新增的角色、光锥与遗器条目。`;
  const body = catalogBody(ctx, {
    crumbs: crumbHtml([['首页', '/'], ['版本上新', null]]),
    h1: SITE_NAME,
    summary: esc(summaryPlain),
    items: [],
    sections: sections.length
      ? sections
      : [{ title: '版本上新', html: `<p>本版本暂无新增条目。</p>` }],
  });
  const description = cut(summaryPlain, 150);
  return [makePage('/', {
    route: '/',
    file: 'home.html',
    title,
    description,
    ld: ldCollection('/', title, description, ldEntries),
    body,
  })];
}

/* ─── 角色 `/character` + `/character/:id` ─── */

function characterPages(ctx) {
  const list = readJson('characters.json').filter((c) => c.name);
  // 排序镜像 catalog/pages/character.ts：开拓者（id≥8000）垫底，其余 id 降序
  const ordered = [...list].sort((a, b) => {
    const at = Number(a.id) >= 8000 ? 1 : 0;
    const bt = Number(b.id) >= 8000 ? 1 : 0;
    if (at !== bt) return at - bt;
    return Number(b.id) - Number(a.id);
  });
  const links = ordered.map((c) => ({ name: c.name, href: `/character/${c.id}` }));
  const title = `${CATALOG_TITLE['/character']} - ${SITE_NAME}`;
  const summaryPlain = `${SITE_NAME}角色图鉴：共 ${ordered.length} 名角色，含稀有度、命途、属性与技能档案。`;
  const items = ordered.map((c) => ({
    name: c.name,
    href: `/character/${c.id}`,
    meta: `${starText(c.rarity)} · ${ctx.elemNames.get(c.element) || c.element} · ${ctx.pathNames.get(c.path) || c.path}`,
  }));
  const pages = [makePage('character-list', {
    route: '/character',
    file: 'character.html',
    title,
    description: cut(summaryPlain, 150),
    ld: ldCollection('/character', CATALOG_TITLE['/character'], cut(summaryPlain, 150), items),
    body: catalogBody(ctx, {
      crumbs: crumbHtml([['首页', '/'], [CATALOG_TITLE['/character'], null]]),
      h1: CATALOG_TITLE['/character'],
      summary: esc(summaryPlain),
      items,
    }),
  })];

  ordered.forEach((entry, idx) => {
    const d = readJson(`characters/${entry.id}.json`);
    const name = clean(d.name) || entry.name;
    const route = `/character/${entry.id}`;
    const stats = d.stats || {};
    const statKey = stats['6'] ? '6' : Object.keys(stats).map(Number).filter((k) => !Number.isNaN(k)).sort((a, b) => b - a)[0];
    const st = statKey != null ? stats[String(statKey)] : null;
    const stories = (d.chara_info && d.chara_info.stories) || {};
    const firstStory = Object.keys(stories).sort((a, b) => Number(a) - Number(b)).map((k) => stories[k]).find((s) => clean(s));
    /** 摘要段判据（契约 §3）：只在源文本存在时输出（desc 或首个非空 story），否则整段省略（应用 CharHero 对空 desc 渲染空描述）；meta description 缺失时用数据字段拼装 */
    const sourceSummary = clean(d.desc) || clean(firstStory);
    const rarityNum = /(\d+)\s*$/.exec(String(d.rarity || ''))?.[1];
    const description = sourceSummary
      ? cut(sourceSummary, 150)
      : cut(factMeta(
        [starText(rarityNum), ctx.elemNames.get(d.damage_type) || d.damage_type, ctx.pathNames.get(d.base_type) || d.base_type],
        CATALOG_TITLE['/character'],
        name,
      ), 150);

    const facts = [
      ['稀有度', esc(starText(/(\d+)\s*$/.exec(String(d.rarity || ''))?.[1]))],
      ['命途', esc(ctx.pathNames.get(d.base_type) || d.base_type || '')],
      ['属性', esc(ctx.elemNames.get(d.damage_type) || d.damage_type || '')],
      ['阵营', txt(d.chara_info && d.chara_info.camp, null, 200)],
      ['终结技能量', d.sp_need != null ? esc(String(d.sp_need)) : ''],
      ['配音（中文）', txt(d.chara_info && d.chara_info.va && d.chara_info.va.chinese, null, 100)],
    ];
    if (st) {
      facts.push(
        ['生命（满级）', esc(String(Math.round(st.hp_base + st.hp_add * (MAX_CHAR_LEVEL - 1))))],
        ['攻击（满级）', esc(String(Math.round(st.attack_base + st.attack_add * (MAX_CHAR_LEVEL - 1))))],
        ['防御（满级）', esc(String(Math.round(st.defence_base + st.defence_add * (MAX_CHAR_LEVEL - 1))))],
        ['速度', esc(String(st.speed_base))],
        ['暴击率', st.critical_chance != null ? esc(`${(st.critical_chance * 100).toFixed(1)}%`) : ''],
        ['暴击伤害', st.critical_damage != null ? esc(`${(st.critical_damage * 100).toFixed(1)}%`) : ''],
      );
    }

    const skillHtml = Object.values(d.skills || {})
      .filter((sk) => sk && sk.name)
      .map((sk) => {
        const levels = Object.keys(sk.level || {}).map(Number).filter((n) => !Number.isNaN(n)).sort((a, b) => b - a);
        const params = levels.length ? sk.level[String(levels[0])]?.param_list : null;
        const head = `${txt(sk.name, null, 200)}${sk.type_name ? `（${txt(sk.type_name, null, 40)}）` : ''}`;
        return `<li><span>${head}</span><p>${txt(sk.desc, params)}</p></li>`;
      })
      .join('');
    const rankHtml = Object.values(d.ranks || {})
      .filter((rk) => rk && rk.name)
      .map((rk) => `<li><span>${esc(`星魂 ${rk.id}`)} ${txt(rk.name, null, 200)}</span><p>${txt(rk.desc, rk.param_list)}</p></li>`)
      .join('');
    const storyHtml = Object.keys(stories)
      .sort((a, b) => Number(a) - Number(b))
      .map((k) => stories[k])
      .filter((s) => clean(s))
      .map((s, i) => `<li><span>${esc(`档案 ${i + 1}`)}</span><p>${txt(s)}</p></li>`)
      .join('');

    const body = detailBody(ctx, {
      crumbs: crumbHtml([['首页', '/'], [CATALOG_TITLE['/character'], '/character'], [name, null]]),
      h1: name,
      summary: sourceSummary ? esc(cut(sourceSummary, 200)) : '',
      facts,
      sections: [
        { title: '技能', html: skillHtml ? `<ul class="nk-snapshot__blocks">${skillHtml}</ul>` : '' },
        { title: '星魂', html: rankHtml ? `<ul class="nk-snapshot__blocks">${rankHtml}</ul>` : '' },
        { title: '角色档案', html: storyHtml ? `<ul class="nk-snapshot__blocks">${storyHtml}</ul>` : '' },
      ],
      links: siblingsOf(links, idx),
      listLabel: '同图鉴角色',
    });

    pages.push(makePage('character-detail', {
      route,
      file: `character/${entry.id}.html`,
      title: `${name} - ${SITE_NAME}`,
      description,
      ld: ldCharacter(route, name, description,
        [['首页', '/'], [CATALOG_TITLE['/character'], '/character'], [name, route]], ctx, d),
      body,
    }));
  });
  return pages;
}

/* ─── 光锥 `/lightcone` + `/lightcone/:id` ─── */

function lightconePages(ctx) {
  const list = readJson('light_cones.json').filter((c) => c.name);
  // 排序镜像 catalog/pages/lightcone.ts：黑塔商店光锥（id≥24000）垫底，其余 id 降序
  const ordered = [...list].sort((a, b) => {
    const aH = Number(a.id) >= 24000 ? 1 : 0;
    const bH = Number(b.id) >= 24000 ? 1 : 0;
    if (aH !== bH) return aH - bH;
    return Number(b.id) - Number(a.id);
  });
  const links = ordered.map((c) => ({ name: c.name, href: `/lightcone/${c.id}` }));
  // 适配角色的名字来源：converter 只给 id（反向索引），名字在角色列表
  const charNames = new Map(
    readJson('characters.json').filter((c) => c.name).map((c) => [String(c.id), clean(c.name)]),
  );
  const summaryPlain = `${SITE_NAME}光锥图鉴：共 ${ordered.length} 把光锥，含稀有度、命途、技能效果与晋阶属性。`;
  const items = ordered.map((c) => ({
    name: c.name,
    href: `/lightcone/${c.id}`,
    meta: [starText(c.rarity), ctx.pathNames.get(c.path) || c.path, txtSafe(c.skill_name, null, 60)].filter(Boolean).join(' · '),
  }));
  const pages = [makePage('lightcone-list', {
    route: '/lightcone',
    file: 'lightcone.html',
    title: `${CATALOG_TITLE['/lightcone']} - ${SITE_NAME}`,
    description: cut(summaryPlain, 150),
    ld: ldCollection('/lightcone', CATALOG_TITLE['/lightcone'], cut(summaryPlain, 150), items),
    body: catalogBody(ctx, {
      crumbs: crumbHtml([['首页', '/'], [CATALOG_TITLE['/lightcone'], null]]),
      h1: CATALOG_TITLE['/lightcone'],
      summary: esc(summaryPlain),
      items,
    }),
  })];

  ordered.forEach((entry, idx) => {
    const d = readJson(`light_cones/${entry.id}.json`);
    const name = clean(d.name) || entry.name;
    const route = `/lightcone/${entry.id}`;
    const phases = Object.keys(d.stats || {}).map(Number).filter((n) => !Number.isNaN(n)).sort((a, b) => a - b);
    const lastPhase = phases.length ? d.stats[String(phases[phases.length - 1])] : null;
    // 摘要段只在源文本（道具说明 / 卡面故事）存在时输出；meta description 缺源文本时用数据字段拼装
    const sourceSummary = clean(d.desc) || clean(d.story);
    const description = sourceSummary
      ? cut(sourceSummary, 150)
      : cut(factMeta([starText(d.rarity), ctx.pathNames.get(d.path) || d.path], CATALOG_TITLE['/lightcone'], name), 150);
    const facts = [
      ['稀有度', esc(starText(d.rarity))],
      ['命途', esc(ctx.pathNames.get(d.path) || d.path || '')],
      ['光锥技能', txt(d.skill && d.skill.name, null, 100)],
      ['叠影上限', d.max_rank != null ? esc(String(d.max_rank)) : ''],
      ['晋阶阶段', d.max_promotion != null ? esc(String(d.max_promotion)) : ''],
    ];
    if (lastPhase) {
      const lv = lastPhase.max_level || MAX_CHAR_LEVEL;
      facts.push(
        ['生命（满级）', esc(String(Math.round(lastPhase.hp_base + lastPhase.hp_add * (lv - 1))))],
        ['攻击（满级）', esc(String(Math.round(lastPhase.attack_base + lastPhase.attack_add * (lv - 1))))],
        ['防御（满级）', esc(String(Math.round(lastPhase.defence_base + lastPhase.defence_add * (lv - 1))))],
      );
    }
    const levels = Object.keys((d.skill && d.skill.level) || {}).map(Number).filter((n) => !Number.isNaN(n)).sort((a, b) => b - a);
    const skillParams = levels.length ? d.skill.level[String(levels[0])]?.param_list : null;
    // 适配角色：同「推荐光锥」一张表的反向读法，rank = 该光锥在该角色推荐列表中的顺位
    const adapt = (d.recommend_chars || [])
      .map((c) => ({ id: c.id, rank: c.rank, name: charNames.get(String(c.id)) }))
      .filter((c) => c.name);
    const phaseHtml = phases
      .map((p) => {
        const s = d.stats[String(p)];
        const lv = s.max_level || MAX_CHAR_LEVEL;
        return `<li><span>${esc(`突破 ${p} · Lv.${lv}`)}</span><p>${esc(`生命 ${Math.round(s.hp_base + s.hp_add * (lv - 1))} · 攻击 ${Math.round(s.attack_base + s.attack_add * (lv - 1))} · 防御 ${Math.round(s.defence_base + s.defence_add * (lv - 1))}`)}</p></li>`;
      })
      .join('');
    const body = detailBody(ctx, {
      crumbs: crumbHtml([['首页', '/'], [CATALOG_TITLE['/lightcone'], '/lightcone'], [name, null]]),
      h1: name,
      summary: sourceSummary ? esc(cut(sourceSummary, 200)) : '',
      facts,
      sections: [
        {
          title: '光锥技能',
          html: d.skill && d.skill.name
            ? `<ul class="nk-snapshot__blocks"><li><span>${txt(d.skill.name, null, 100)}</span><p>${txt(d.skill.desc, skillParams)}</p></li></ul>`
            : '',
        },
        { title: '晋阶属性', html: phaseHtml ? `<ul class="nk-snapshot__blocks">${phaseHtml}</ul>` : '' },
        {
          title: '适配角色',
          html: adapt.length
            ? linkList(adapt.map((c) => ({ name: c.name, href: `/character/${c.id}`, meta: esc(`REC. ${c.rank}`) })))
            : '',
        },
        { title: '卡面故事', html: d.story ? `<p>${txt(d.story, null, SNAPSHOT_TEXT_LIMIT_DETAIL)}</p>` : '' },
      ],
      links: siblingsOf(links, idx),
      listLabel: '同图鉴光锥',
    });
    pages.push(makePage('lightcone-detail', {
      route,
      file: `lightcone/${entry.id}.html`,
      title: `${name} - ${SITE_NAME}`,
      description,
      ld: ldArticle(route, name, description,
        [['首页', '/'], [CATALOG_TITLE['/lightcone'], '/lightcone'], [name, route]], ctx),
      body,
    }));
  });
  return pages;
}

/* ─── 遗器 `/relic` + `/relic/:id`（详情数据来自 relics.json 条目，无独立详情文件） ─── */

function relicPages(ctx) {
  const list = readJson('relics.json').filter((r) => r.name);
  const ordered = [...list].sort((a, b) => Number(b.id) - Number(a.id));
  const links = ordered.map((r) => ({ name: r.name, href: `/relic/${r.id}` }));
  const setTag = (r) => (Array.isArray(r.require_num) && r.require_num.includes(4) ? '隧洞遗器 · 4件套' : '位面饰品 · 2件套');
  const summaryPlain = `${SITE_NAME}遗器图鉴：共 ${ordered.length} 套遗器，含套装效果与部位信息。`;
  const items = ordered.map((r) => ({ name: r.name, href: `/relic/${r.id}`, meta: esc(setTag(r)) }));
  const pages = [makePage('relic-list', {
    route: '/relic',
    file: 'relic.html',
    title: `${CATALOG_TITLE['/relic']} - ${SITE_NAME}`,
    description: cut(summaryPlain, 150),
    ld: ldCollection('/relic', CATALOG_TITLE['/relic'], cut(summaryPlain, 150), items),
    body: catalogBody(ctx, {
      crumbs: crumbHtml([['首页', '/'], [CATALOG_TITLE['/relic'], null]]),
      h1: CATALOG_TITLE['/relic'],
      summary: esc(summaryPlain),
      items,
    }),
  })];

  ordered.forEach((entry, idx) => {
    const name = clean(entry.name) || `#${entry.id}`;
    const route = `/relic/${entry.id}`;
    const reqNums = Array.isArray(entry.require_num) ? [...entry.require_num].sort((a, b) => a - b) : [];
    const descriptions = entry.descriptions || {};
    const params = entry.param_list || {};
    const effectHtml = reqNums
      .map((n) => `<li><span>${esc(`${n} 件套`)}</span><p>${txt(descriptions[String(n)], params[String(n)])}</p></li>`)
      .join('');
    const pieceHtml = (entry.pieces || [])
      .map((p) => `<li><span>${txt(p.type_name, null, 40)}</span><p>${esc(`最高等级 ${p.max_level} · 稀有度 ${starText(p.rarity)}`)}</p></li>`)
      .join('');
    // 摘要取套装效果源文本；参数口径同 RelicView（fmtDesc(descriptions[n], param_list[n])）
    const effectTexts = reqNums.map((n) => plain(descriptions[String(n)], params[String(n)]));
    const firstEffect = effectTexts.find(Boolean);
    const sourceSummary = firstEffect || '';
    const setTypeText = Array.isArray(entry.require_num) && entry.require_num.includes(4) ? '隧洞遗器' : '位面饰品';
    const description = sourceSummary
      ? cut(sourceSummary, 150)
      : cut(factMeta([setTypeText], CATALOG_TITLE['/relic'], name), 150);
    const body = detailBody(ctx, {
      crumbs: crumbHtml([['首页', '/'], [CATALOG_TITLE['/relic'], '/relic'], [name, null]]),
      h1: name,
      summary: sourceSummary ? esc(cut(sourceSummary, 200)) : '',
      facts: [
        ['套装类型', esc(Array.isArray(entry.require_num) && entry.require_num.includes(4) ? '隧洞遗器' : '位面饰品')],
        ['套装效果件数', esc(reqNums.join(' / '))],
        ['部位数', esc(String((entry.pieces || []).length))],
        ['上线版本', txt(entry.release_version, null, 40)],
      ],
      sections: [
        { title: '套装效果', html: effectHtml ? `<ul class="nk-snapshot__blocks">${effectHtml}</ul>` : '' },
        { title: '部位', html: pieceHtml ? `<ul class="nk-snapshot__blocks">${pieceHtml}</ul>` : '' },
      ],
      links: siblingsOf(links, idx),
      listLabel: '同图鉴遗器',
    });
    pages.push(makePage('relic-detail', {
      route,
      file: `relic/${entry.id}.html`,
      title: `${name} - ${SITE_NAME}`,
      description,
      ld: ldArticle(route, name, description,
        [['首页', '/'], [CATALOG_TITLE['/relic'], '/relic'], [name, route]], ctx),
      body,
    }));
  });
  return pages;
}

/* ─── 物品 `/item`（无详情路由：输出名称 + 描述文本） ─── */

function itemPages(ctx) {
  const list = readJson('items.json').filter((i) => i.name);
  const rarityOrder = { 5: 0, 4: 1, 3: 2, 2: 3, 1: 4 };
  const ordered = [...list].sort((a, b) => (rarityOrder[a.rarity] ?? 5) - (rarityOrder[b.rarity] ?? 5));
  const summaryPlain = `${SITE_NAME}物品图鉴：共 ${ordered.length} 件物品，含类型、稀有度与物品描述。`;
  const items = ordered.map((i) => ({
    name: i.name,
    href: null,
    meta: `${esc(ITEM_MAIN_TYPE[i.main_type] || i.main_type || '')} · ${esc(starText(i.rarity))}`,
    desc: [txtSafe(i.desc, null, 400), txtSafe(i.bg_desc, null, SNAPSHOT_TEXT_LIMIT_ENTRY)].filter(Boolean).join(' '),
  }));
  return [makePage('item-list', {
    route: '/item',
    file: 'item.html',
    title: `${CATALOG_TITLE['/item']} - ${SITE_NAME}`,
    description: cut(summaryPlain, 150),
    ld: ldCollection('/item', CATALOG_TITLE['/item'], cut(summaryPlain, 150), items),
    body: catalogBody(ctx, {
      crumbs: crumbHtml([['首页', '/'], [CATALOG_TITLE['/item'], null]]),
      h1: CATALOG_TITLE['/item'],
      summary: esc(summaryPlain),
      items,
    }),
  })];
}

/* ─── 敌对物种 `/monster` + `/monster/:id` ─── */

function monsterPages(ctx) {
  const list = readJson('monsters.json').filter((m) => m.name);
  const links = list.map((m) => ({ name: m.name, href: `/monster/${m.id}` }));
  const summaryPlain = `${SITE_NAME}敌对物种图鉴：共 ${list.length} 个条目，含分类、弱点、抗性与技能。`;
  const items = list.map((m) => ({
    name: m.name,
    href: `/monster/${m.id}`,
    meta: esc(MON_TYPE[m.type] || m.type || ''),
  }));
  const pages = [makePage('monster-list', {
    route: '/monster',
    file: 'monster.html',
    title: `${CATALOG_TITLE['/monster']} - ${SITE_NAME}`,
    description: cut(summaryPlain, 150),
    ld: ldCollection('/monster', CATALOG_TITLE['/monster'], cut(summaryPlain, 150), items),
    body: catalogBody(ctx, {
      crumbs: crumbHtml([['首页', '/'], [CATALOG_TITLE['/monster'], null]]),
      h1: CATALOG_TITLE['/monster'],
      summary: esc(summaryPlain),
      items,
    }),
  })];

  list.forEach((entry, idx) => {
    const d = readJson(`monsters/${entry.id}.json`);
    const name = clean(d.name) || entry.name;
    const route = `/monster/${entry.id}`;
    const weak = (d.weak || []).map((e) => ctx.elemNames.get(e) || e);
    const resist = Object.entries(d.resist || {}).map(([k, v]) => `${ctx.elemNames.get(k) || k} ${Math.round(Number(v) * 100)}%`);
    // 摘要段只在 intro 源文本存在时输出；meta description 缺源文本时用 分类+阵营 拼装
    const sourceSummary = clean(d.intro);
    const description = sourceSummary
      ? cut(sourceSummary, 150)
      : cut(factMeta([MON_RANK[d.rank] || d.rank, d.camp], CATALOG_TITLE['/monster'], name), 150);
    const skillHtml = (d.skills || [])
      .filter((s) => s && s.name)
      .map((s) => {
        const metaParts = [s.tag, s.type_desc, s.damage_type ? (ctx.elemNames.get(s.damage_type) || s.damage_type) : ''].filter(Boolean);
        return `<li><span>${txt(s.name, null, 100)}${metaParts.length ? `（${txt(metaParts.join(' · '), null, 60)}）` : ''}</span><p>${txt(s.desc, s.param_list)}</p></li>`;
      })
      .join('');
    /**
     * 「贪饕」侵蚀标记与回链（ADR 0025）：怪物详情数据带可选块 `invaded` 时，输出事实行 + `/voracity` 内链。
     * 判据 = **目录条目自身的详情文件**里该块是否存在（`monsters.json` 条目 → `monsters/{id}.json`）：
     * 不按 id 白名单硬编码、也不枚举 `monsters/` 目录——该目录下的实例变体页（长号实例 ID）不在
     * `monsters.json` 目录内，应用不展示、快照也不生成（实测 217 个详情文件带该块，其中仅 24 个是目录条目）。
     * 等级取 `invaded.invasion_ids`，与页面「受『贪饕』侵蚀 · 等级 N」同口径；无该块的怪物不输出此行。
     */
    const facts = [
      ['分类', txt(MON_RANK[d.rank] || d.rank, null, 40)],
      ['阵营', txt(d.camp, null, 60)],
      ['图鉴编号', esc(String(d.id))],
      ['韧性', d.stance ? esc(String(d.stance)) : ''],
      ['韧性弱点', esc(weak.join(' / '))],
      ['伤害抗性', esc(resist.join(' / '))],
      ['生命', d.stats ? esc(String(d.stats.hp)) : ''],
      ['攻击', d.stats ? esc(String(d.stats.atk)) : ''],
      ['防御', d.stats ? esc(String(d.stats.def)) : ''],
      ['速度', d.stats ? esc(String(d.stats.speed)) : ''],
    ];
    if (d.invaded) {
      const invadedLevels = (d.invaded.invasion_ids || []).filter((n) => n != null);
      facts.push(['受『贪饕』侵蚀', [
        invadedLevels.length ? `等级 ${esc(invadedLevels.join(' / '))}` : '',
        `<a href="/voracity">${esc(VORACITY_TITLE)}</a>`,
      ].filter(Boolean).join(' · ')]);
    }
    const body = detailBody(ctx, {
      crumbs: crumbHtml([['首页', '/'], [CATALOG_TITLE['/monster'], '/monster'], [name, null]]),
      h1: name,
      summary: sourceSummary ? esc(cut(sourceSummary, 200)) : '',
      facts,
      sections: [
        // 空 intro 时「图鉴记录」整段省略
        { title: '图鉴记录', html: sourceSummary ? `<p>${txt(d.intro, null, SNAPSHOT_TEXT_LIMIT_DETAIL)}</p>` : '' },
        { title: '技能', html: skillHtml ? `<ul class="nk-snapshot__blocks">${skillHtml}</ul>` : '' },
      ],
      links: siblingsOf(links, idx),
      listLabel: '同图鉴敌对物种',
    });
    pages.push(makePage('monster-detail', {
      route,
      file: `monster/${entry.id}.html`,
      title: `${name} - ${SITE_NAME}`,
      description,
      ld: ldArticle(route, name, description,
        [['首页', '/'], [CATALOG_TITLE['/monster'], '/monster'], [name, route]], ctx),
      body,
    }));
  });
  return pages;
}

/* ─── 终局 `/endgame` + `/endgame/:mode/:id`（数据源 = 四份 *.catalog.json，契约 §2） ─── */

/** 排期区间格式化（对照 catalog/pages/endgame.ts mazeDateRange） */
function dateRange(entry) {
  const fmt = (s) => {
    if (!s) return null;
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return null;
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };
  const start = fmt(entry.live_begin);
  const end = fmt(entry.live_end);
  if (start && end) return `${start} – ${end}`;
  if (start) return `${start} –`;
  if (end) return `– ${end}`;
  return '';
}

function endgamePages(ctx) {
  const catalogs = ENDGAME_MODES.map((m) => ({ mode: m, db: readJson(m.file) }));
  /**
   * 可见性判据 = 应用同一判据（src/app/catalog/pages/endgame.ts:190 `if (!info || !info.zh) continue;`）：
   * 名称为空/空白的赛季应用不展示，且不为其造兜底名——快照与 sitemap 都不生成该 URL（未发布内容不入索引）。
   */
  const all = [];
  for (const { mode, db } of catalogs) {
    for (const [id, entry] of Object.entries(db)) {
      if (!entry || !clean(entry.zh)) continue;
      all.push({ mode, id, entry, name: clean(entry.zh) });
    }
  }
  // 排序镜像 catalog/pages/endgame.ts bySeasonDesc：首个已知端点降序（live_begin 优先、
  // 回退 live_end，单边排期也参与排序），同日开始端在前，两端皆无按 ID 降序
  const sortKey = (entry) => {
    const begin = String(entry.live_begin || '');
    if (begin) return { date: begin, isBegin: true };
    return { date: String(entry.live_end || ''), isBegin: false };
  };
  all.sort((a, b) => {
    const ka = sortKey(a.entry);
    const kb = sortKey(b.entry);
    if (ka.date && kb.date && ka.date !== kb.date) return ka.date < kb.date ? 1 : -1;
    if (ka.date && kb.date) {
      if (ka.isBegin !== kb.isBegin) return ka.isBegin ? -1 : 1;
    } else if (ka.date) {
      return -1;
    } else if (kb.date) {
      return 1;
    }
    return Number(String(b.id).replace(/\D/g, '')) - Number(String(a.id).replace(/\D/g, ''));
  });

  const summaryPlain = `${SITE_NAME}终局内容：忘却之庭、虚构叙事、末日幻影、异相仲裁四模式赛季，共 ${all.length} 期。`;
  const items = all.map((s) => ({
    name: s.name,
    href: `/endgame/${s.mode.key}/${s.id}`,
    meta: [esc(s.mode.label), esc(dateRange(s.entry)), esc(`${(s.entry.monsters || []).length} 名敌方`)].filter(Boolean).join(' · '),
  }));
  const pages = [makePage('endgame-list', {
    route: '/endgame',    file: 'endgame.html',
    title: `${CATALOG_TITLE['/endgame']} - ${SITE_NAME}`,
    description: cut(summaryPlain, 150),
    ld: ldCollection('/endgame', CATALOG_TITLE['/endgame'], cut(summaryPlain, 150), items),
    body: catalogBody(ctx, {
      crumbs: crumbHtml([['首页', '/'], [CATALOG_TITLE['/endgame'], null]]),
      h1: CATALOG_TITLE['/endgame'],
      summary: esc(summaryPlain),
      items,
    }),
  })];

  /* ── 玩法详情页（第四种页面形态：单页数据页）─────────────────────────────
     正文逐字来自 endgame_guide.json（IntroData 分节）；结构口径与当期增益取当期赛季（目录排序首位）。
     形态约定：**不使用 `nk-snapshot__entry`**、无条目级覆盖率断言（见 docs/agents/ai-discoverability.md §3）；
     当期增益只出名称（不出 desc，避免快照出现未展开的 `#N[i]` 占位符）。 */
  const guide = readJson('endgame_guide.json');
  // 选择语义文案与 src/app/endgame/guide.ts 的 CHOICE_LABEL 同源同写（生成器不能 import TS，故镜像一份）
  const MODE_CHOICE_LABEL = {
    fixed: '固定生效，不可选择',
    per_team: '每支队伍选 1 条',
    per_stage: '每场战斗选 1 条',
    per_king: '王棋挑战前选 1 条',
  };
  for (const { mode } of catalogs) {
    const modeOrdered = all.filter((s) => s.mode.key === mode.key);
    if (!modeOrdered.length) continue;
    const g = guide.modes?.[mode.key];
    const system = g?.system || null;
    const systemName = clean(system?.name) || '赛季增益';
    const current = modeOrdered[0];
    const cur = current.entry;
    const floors = cur.floor_details || [];
    const levels = cur.levels || [];
    const halfs = floors.length ? ((floors[0].stage1 ? 1 : 0) + (floors[0].stage2 ? 1 : 0)) : 0;
    // 当期增益：peak 取王棋关、boss 取分场次表（扁平 buffs 是 1∪2 并集，口径不同，禁用）
    const rawBuffs = mode.key === 'peak'
      ? ((levels.find((l) => l.kind === 'king') || levels[levels.length - 1] || {}).buffs || [])
      : mode.key === 'boss' ? ((cur.buff_groups || {}).stage1 || []) : (cur.buffs || []);
    const curBuffs = rawBuffs.map((b) => clean(b?.name)).filter(Boolean);
    const ruleSections = (g?.sections || []).map((sec) => {
      // 数据里换行是**字面量** `\n`（非真换行），故按两字符序列拆行；`●`/`○` 起首的行归入列表
      const lines = String(sec.text || '').split('\\n').map((l) => l.trim()).filter(Boolean);
      const paras = lines.filter((l) => !l.startsWith('●') && !l.startsWith('○'));
      const items = lines.filter((l) => l.startsWith('●') || l.startsWith('○')).map((l) => l.replace(/^[●○]\s*/, ''));
      return {
        title: clean(sec.title),
        html: [
          paras.map((p) => `<p>${txt(p, null, 400)}</p>`).join(''),
          items.length ? `<ul class="nk-snapshot__list">${items.map((i) => `<li>${txt(i, null, 200)}</li>`).join('')}</ul>` : '',
        ].join(''),
      };
    });
    const seasonLinks = modeOrdered.slice(0, 8).map((s) => ({ name: s.name, href: `/endgame/${mode.key}/${s.id}` }));
    const otherModeLinks = catalogs
      .filter((c) => c.mode.key !== mode.key)
      .map((c) => ({ name: c.mode.label, href: `/endgame/${c.mode.key}` }));
    const description = cut(
      factMeta([mode.label, systemName, `${modeOrdered.length} 期赛季`], CATALOG_TITLE['/endgame'], mode.label), 150,
    );
    const route = `/endgame/${mode.key}`;
    pages.push(makePage('endgame-mode', {
      route,
      file: `endgame/${mode.key}.html`,
      title: `${mode.label} - ${SITE_NAME}`,
      description,
      ld: ldArticle(route, mode.label, description,
        [['首页', '/'], [CATALOG_TITLE['/endgame'], '/endgame'], [mode.label, route]], ctx),
      body: detailBody(ctx, {
        crumbs: crumbHtml([['首页', '/'], [CATALOG_TITLE['/endgame'], '/endgame'], [mode.label, null]]),
        h1: mode.label,
        summary: '',
        facts: [
          ['所属玩法', esc(mode.label)],
          ['英文名', esc(mode.en)],
          ['当期赛季', esc(current.name)],
          ['关卡层级', floors.length ? esc(`${floors.length} 层`) : ''],
          ['每层场次', halfs ? esc(`${halfs} 场`) : ''],
          ['关卡组成', levels.length ? esc(`${levels.length} 关`) : ''],
          ['回合上限', cur.countdown ? esc(`${cur.countdown} 轮`) : ''],
          ['分数上限', cur.clear_score ? esc(String(cur.clear_score)) : ''],
          ['星启模式', cur.tierce ? '含' : '不含'],
          ['增益体系', esc(systemName)],
          ['每期条数', system ? esc(String(system.count)) : ''],
          ['选择方式', system ? esc(MODE_CHOICE_LABEL[system.choice] || '') : ''],
        ],
        sections: [
          ...ruleSections,
          {
            title: systemName,
            html: curBuffs.length ? `<ul class="nk-snapshot__list">${curBuffs.map((b) => `<li>${txt(b, null, 100)}</li>`).join('')}</ul>` : '',
          },
          { title: '赛季列表', html: linkList(seasonLinks) },
        ],
        links: otherModeLinks,
        listLabel: '其它玩法',
      }),
    }));
  }

  for (const { mode, db } of catalogs) {
    const keys = Object.keys(db).filter((k) => db[k] && clean(db[k].zh));
    // 同模式内按排期开始降序（与目录排序同口径）取相邻赛季作为内链
    const modeOrdered = all.filter((s) => s.mode.key === mode.key);
    const links = modeOrdered.map((s) => ({ name: s.name, href: `/endgame/${s.mode.key}/${s.id}` }));
    const guideMode = guide.modes?.[mode.key];
    /** 体系名（游戏内命名，来自 IntroData 分节标题）——与页面逐字一致；缺省回退站点工作名（见 src/app/endgame/guide.ts） */
    const systemName = clean(guideMode?.system?.name) || '赛季增益';
    for (const id of keys) {
      const entry = db[id];
      const name = clean(entry.zh);
      const route = `/endgame/${mode.key}/${id}`;
      const idx = links.findIndex((l) => l.href === route);
      const buffs = (entry.buffs || []).map((b) => b.name).filter(Boolean);
      const monsters = (entry.monsters || []).filter((m) => m && m.name);
      const finalM = (entry.final_monsters || []).filter((m) => m && m.name);
      const monsterHtml = monsters
        .map((m) => {
          const bits = [MON_RANK[m.rank] || m.rank, m.camp, (m.weak || []).map((e) => ctx.elemNames.get(e) || e).join('/')].filter(Boolean);
          return `<li><span>${txt(m.name, null, 100)}</span><p>${txt(bits.join(' · '), null, 120)}</p></li>`;
        })
        .join('');
      /** 赛季 catalog 没有描述性源字段 → 不输出可见摘要段；事实由下方 facts 表承载，
       *  meta description 用数据字段拼装（玩法 · 排期 · 增益数 · 敌方数）。 */
      const description = cut(factMeta(
        [mode.label, dateRange(entry), `${buffs.length} 项赛季增益`, `${monsters.length} 名敌方`],
        CATALOG_TITLE['/endgame'],
        name,
      ), 150);
      const body = detailBody(ctx, {
        crumbs: crumbHtml([['首页', '/'], [CATALOG_TITLE['/endgame'], '/endgame'], [name, null]]),
        h1: name,
        summary: '',
        facts: [
          ['所属玩法', esc(mode.label)],
          ['赛季编号', esc(String(id))],
          ['排期', esc(dateRange(entry))],
          ['赛季增益数', esc(String(buffs.length))],
          ['敌方条目数', esc(String(monsters.length))],
          ['常驻关卡', entry.permanent ? '是' : ''],
          ['测试期', entry.test ? '是' : ''],
        ],
        sections: [
          { title: systemName, html: buffs.length ? `<ul class="nk-snapshot__list">${buffs.map((b) => `<li>${txt(b, null, 100)}</li>`).join('')}</ul>` : '' },
          { title: '最终层阵容', html: finalM.length ? `<ul class="nk-snapshot__blocks">${finalM.map((m) => `<li><span>${txt(m.name, null, 100)}</span><p>${txt([MON_RANK[m.rank] || m.rank, m.camp].filter(Boolean).join(' · '), null, 80)}</p></li>`).join('')}</ul>` : '' },
          { title: '敌方配置', html: monsterHtml ? `<ul class="nk-snapshot__blocks">${monsterHtml}</ul>` : '' },
          {
            title: '模式机制',
            html: [
              entry.tierce ? `<p>星启模式：关卡 ${txt(entry.tierce.id, null, 20)}${(entry.tierce.damage_types || []).length ? ` · 弱点 ${txt((entry.tierce.damage_types || []).map((e) => ctx.elemNames.get(e) || e).join('、'), null, 80)}` : ''}</p>` : '',
              (entry.levels || []).length ? `<p>异相仲裁关卡组成：${txt((entry.levels || []).map((l) => (l.kind === 'king' ? '王棋最终关' : '骑士试炼')).join(' · '), null, 120)}</p>` : '',
            ].join(''),
          },
        ],
        links: siblingsOf(links, idx < 0 ? 0 : idx),
        listLabel: `同模式赛季（${mode.label}）`,
      });
      pages.push(makePage('endgame-detail', {
        route,
        file: `endgame/${mode.key}/${id}.html`,
        title: `${name} - ${mode.label} - ${SITE_NAME}`,
        description,
        ld: ldArticle(route, name, description,
          [['首页', '/'], [CATALOG_TITLE['/endgame'], '/endgame'], [name, route]], ctx),
        body,
      }));
    }
  }
  return pages;
}

/* ─── 成就 `/achievement`（无详情路由：名称 + 描述文本） ─── */

function achievementPages(ctx) {
  const list = readJson('achievements.json').filter((a) => a.title);
  const series = readJson('achievement_series.json');
  const seriesName = new Map(series.map((s) => [s.id, s.name]));
  const summaryPlain = `${SITE_NAME}成就图鉴：共 ${list.length} 个成就，含系列、稀有度与达成要求。`;
  const items = list.map((a) => ({
    name: a.title,
    href: null,
    meta: [esc(seriesName.get(a.series_id) || ''), esc(ACH_RARITY[a.rarity] || a.rarity || '')].filter(Boolean).join(' · '),
    desc: txtSafe(a.desc, null, SNAPSHOT_TEXT_LIMIT_ENTRY),
  }));
  return [makePage('achievement-list', {
    route: '/achievement',
    file: 'achievement.html',
    title: `${CATALOG_TITLE['/achievement']} - ${SITE_NAME}`,
    description: cut(summaryPlain, 150),
    ld: ldCollection('/achievement', CATALOG_TITLE['/achievement'], cut(summaryPlain, 150), items),
    body: catalogBody(ctx, {
      crumbs: crumbHtml([['首页', '/'], [CATALOG_TITLE['/achievement'], null]]),
      h1: CATALOG_TITLE['/achievement'],
      summary: esc(summaryPlain),
      items,
    }),
  })];
}

/* ─── 货币战争枢纽 `/currency`（本赛季新增两分区） ─── */

function currencyHubPages(ctx) {
  const roles = readJson('currency/role.json').roles || [];
  const traits = readJson('currency/traits.json').traits || [];
  const newRoles = pickSeasonNew(roles);
  const newTraits = pickSeasonNew(traits);
  const sections = [];
  const ldEntries = [];
  if (newRoles.length) {
    const items = newRoles.map((r) => ({ name: r.name, href: `/currency/role/${r.id}`, meta: esc(`${r.rarity}费`) }));
    sections.push({ title: `角色图鉴（${items.length}）`, html: linkList(items, true) + snapMore('/currency/role', '角色图鉴') });
    ldEntries.push(...items);
  }
  if (newTraits.length) {
    const items = newTraits.map((t) => ({ name: t.name, href: `/currency/trait/${t.id}`, meta: esc(CW_CAT_LABEL[t.cat] || t.cat || '') }));
    sections.push({ title: `羁绊图鉴（${items.length}）`, html: linkList(items, true) + snapMore('/currency/trait', '羁绊图鉴') });
    ldEntries.push(...items);
  }
  const summaryPlain = `${SITE_NAME}货币战争模式枢纽：本赛季新增角色图鉴与羁绊图鉴条目。`;
  const title = `${CATALOG_TITLE['/currency/role'].split(' · ')[0]} - ${SITE_NAME}`;
  const body = catalogBody(ctx, {
    crumbs: crumbHtml([['首页', '/'], ['货币战争', null]]),
    h1: '货币战争',
    summary: esc(summaryPlain),
    items: [],
    sections: sections.length ? sections : [{ title: '本赛季新增', html: '<p>本赛季暂无新增条目。</p>' }],
  });
  return [makePage('currency-hub', {
    route: '/currency',
    file: 'currency.html',
    title,
    description: cut(summaryPlain, 150),
    ld: ldCollection('/currency', '货币战争', cut(summaryPlain, 150), ldEntries),
    body,
  })];
}

/* ─── 货币战争角色 `/currency/role` + `/currency/role/:id` ─── */

function currencyRolePages(ctx) {
  const roles = readJson('currency/role.json').roles || [];
  const links = roles.map((r) => ({ name: r.name, href: `/currency/role/${r.id}` }));
  const chargeText = (r) => (r.charge_type || []).map((c) => CW_CHARGE_LABEL[c] || c).join(' · ');
  const summaryPlain = `${SITE_NAME}货币战争角色图鉴：共 ${roles.length} 名可招募角色，含费用、前后台定位与羁绊。`;
  const items = roles.map((r) => ({
    name: r.name,
    href: `/currency/role/${r.id}`,
    meta: [esc(`${r.rarity}费`), esc(CW_FB_LABEL[r.front_back_type] || r.front_back_type || ''), esc(chargeText(r))].filter(Boolean).join(' · '),
    desc: txtSafe((r.traits || []).map((t) => t.name).filter(Boolean).join('、'), null, 200),
  }));
  const pages = [makePage('currency-role-list', {
    route: '/currency/role',
    file: 'currency/role.html',
    title: `${CATALOG_TITLE['/currency/role']} - ${SITE_NAME}`,
    description: cut(summaryPlain, 150),
    ld: ldCollection('/currency/role', CATALOG_TITLE['/currency/role'], cut(summaryPlain, 150), items),
    body: catalogBody(ctx, {
      crumbs: crumbHtml([['首页', '/'], ['货币战争', '/currency'], [CATALOG_TITLE['/currency/role'], null]]),
      h1: CATALOG_TITLE['/currency/role'],
      summary: esc(summaryPlain),
      items,
    }),
  })];

  roles.forEach((entry, idx) => {
    const d = readJson(`currency/role/${entry.id}.json`);
    const name = clean(d.name) || entry.name;
    const route = `/currency/role/${entry.id}`;
    const starKeys = Object.keys(d.stars || {}).sort((a, b) => Number(a) - Number(b));
    /**
     * 角色详情数据（currency/role/{id}.json）只有结构化字段、无描述性源字段 → 不输出可见摘要段；
     * meta description 用数据字段拼装。
     */
    const description = cut(factMeta(
      [`${d.rarity}费`, d.front_back_type ? (CW_FB_LABEL[d.front_back_type] || d.front_back_type) : '', chargeText(d)],
      CATALOG_TITLE['/currency/role'],
      name,
    ), 150);
    const traitHtml = (d.traits || []).map((tr) => {
      const layerText = (tr.layers || [])
        .map((l) => {
          const props = [...(l.member_props || []), ...(l.all_props || [])]
            .map((p) => `${propLabel(p)} ${propValue(p.value)}`).join('、');
          return `${l.layer} 人：${plain(l.desc, l.params)}${props ? `（${props}）` : ''}`;
        })
        .filter(Boolean)
        .join('；');
      return `<li><span>${txt(tr.name, null, 100)}</span><p>${txt(tr.desc, tr.desc_params)}</p>${layerText ? `<p>${txt(layerText, null, SNAPSHOT_TEXT_LIMIT_DETAIL)}</p>` : ''}</li>`;
    }).join('');
    const starHtml = starKeys.map((k) => {
      const s = d.stars[k];
      const groups = ['front_show_skill', 'back_show_skill', 'servant_show_skill'];
      const skills = groups
        .flatMap((g) => (s[g] || []))
        .filter((sk) => sk && sk.name)
        .map((sk) => {
          const lv = sk.level && sk.level['1'];
          return `<li><p>${txt(sk.name, null, 100)}：${txt(sk.desc, lv ? lv.param_list : null)}</p></li>`;
        })
        .join('');
      const line = [
        s.front_one_word_desc ? `前台「${clean(s.front_one_word_desc)}」` : '',
        s.back_one_word_desc ? `后台「${clean(s.back_one_word_desc)}」` : '',
        s.front_power_base != null ? `前台强度 ${s.front_power_base}` : '',
        s.back_power_base != null ? `后台强度 ${s.back_power_base}` : '',
      ].filter(Boolean).join(' · ');
      return `<li><span>${esc(`${k} 星`)}</span>${line ? `<p>${txt(line, null, 300)}</p>` : ''}${skills ? `<ul>${skills}</ul>` : ''}</li>`;
    }).join('');
    const rankHtml = (d.rank || []).filter((rk) => rk && rk.name)
      .map((rk) => `<li><span>${txt(rk.name, null, 100)}</span><p>${txt(rk.desc, rk.param_list)}</p></li>`)
      .join('');
    const equipHtml = (d.equipment || []).filter((eq) => eq && eq.desc)
      .map((eq) => {
        const props = [...(eq.owner_props || []), ...(eq.all_props || [])]
          .map((p) => `${propLabel(p)} ${propValue(p.value)}`).join('、');
        return `<li><span>${esc(`等级 ${eq.level}`)}</span><p>${txt(eq.desc, eq.param_list)}${props ? `（${props}）` : ''}</p></li>`;
      })
      .join('');
    const body = detailBody(ctx, {
      crumbs: crumbHtml([['首页', '/'], ['货币战争', '/currency'], [CATALOG_TITLE['/currency/role'], '/currency/role'], [name, null]]),
      h1: name,
      summary: '',
      facts: [
        ['费用', esc(`${d.rarity} 费`)],
        ['定位', txt(CW_FB_LABEL[d.front_back_type] || d.front_back_type, null, 40)],
        ['充能类型', txt(chargeText(d), null, 80)],
        ['专家', d.is_expert ? '是' : '否'],
        ['赛季', esc((d.season_ids || []).join(' / '))],
        ['羁绊数', esc(String((d.traits || []).length))],
        ['星魂数', esc(String((d.rank || []).length))],
      ],
      sections: [
        { title: '羁绊', html: traitHtml ? `<ul class="nk-snapshot__blocks">${traitHtml}</ul>` : '' },
        { title: '星级与技能', html: starHtml ? `<ul class="nk-snapshot__blocks">${starHtml}</ul>` : '' },
        { title: '星魂', html: rankHtml ? `<ul class="nk-snapshot__blocks">${rankHtml}</ul>` : '' },
        { title: '专属装备', html: equipHtml ? `<ul class="nk-snapshot__blocks">${equipHtml}</ul>` : '' },
      ],
      links: siblingsOf(links, idx),
      listLabel: '同图鉴角色',
    });
    pages.push(makePage('currency-role-detail', {
      route,
      file: `currency/role/${entry.id}.html`,
      title: `${name} - ${SITE_NAME}`,
      description,
      ld: ldArticle(route, name, description,
        [['首页', '/'], ['货币战争', '/currency'], [CATALOG_TITLE['/currency/role'], '/currency/role'], [name, route]], ctx),
      body,
    }));
  });
  return pages;
}

/* ─── 货币战争装备 / 投资环境 / 投资策略（均无详情路由） ─── */

function currencyListPages(ctx) {
  const pages = [];

  const equip = (readJson('currency/equipment.json').items || []).filter((e) => e.name);
  const equipSummary = `${SITE_NAME}货币战争装备图鉴：共 ${equip.length} 件装备，含分类、效果与属性加成。`;
  const equipItems = equip.map((e) => {
    const tags = (e.tags || []).map((t) => clean(t.desc)).filter(Boolean).join('、');
    const props = (e.props || []).map((p) => `${propLabel(p)} ${propValue(p.value)}`).join('、');
    return {
      name: e.name,
      href: null,
      meta: [esc(e.category_name || e.category || ''), esc(e.ability_name || '')].filter(Boolean).join(' · '),
      desc: [txtSafe(e.desc, null, 400, hasParamSemantics(e)), txtSafe(tags, null, 200, hasParamSemantics(e)), txtSafe(props, null, 200)].filter(Boolean).join(' '),
    };
  });
  pages.push(makePage('currency-equip-list', {
    route: '/currency/item',
    file: 'currency/item.html',
    title: `${CATALOG_TITLE['/currency/item']} - ${SITE_NAME}`,
    description: cut(equipSummary, 150),
    ld: ldCollection('/currency/item', CATALOG_TITLE['/currency/item'], cut(equipSummary, 150), equipItems),
    body: catalogBody(ctx, {
      crumbs: crumbHtml([['首页', '/'], ['货币战争', '/currency'], [CATALOG_TITLE['/currency/item'], null]]),
      h1: CATALOG_TITLE['/currency/item'],
      summary: esc(equipSummary),
      items: equipItems,
    }),
  }));

  /**
   * 可见性判据 = 应用同一判据（src/app/catalog/pages/currency-portal.ts:30 `.filter((p) => p.in_book)`）：
   * 未收录图鉴的投资环境应用不展示，快照只列收录项。
   */
  const portals = (readJson('currency/portals.json').portals || []).filter((p) => p.in_book && p.title);
  const portalSummary = `${SITE_NAME}货币战争投资环境图鉴：共 ${portals.length} 个投资环境。`;
  const portalItems = portals.map((p) => ({ name: p.title, href: null, meta: esc('投资环境'), desc: txtSafe(p.desc, p.params, 400, hasParamSemantics(p)) }));
  pages.push(makePage('currency-portal-list', {
    route: '/currency/buff',
    file: 'currency/buff.html',
    title: `${CATALOG_TITLE['/currency/buff']} - ${SITE_NAME}`,
    description: cut(portalSummary, 150),
    ld: ldCollection('/currency/buff', CATALOG_TITLE['/currency/buff'], cut(portalSummary, 150), portalItems),
    body: catalogBody(ctx, {
      crumbs: crumbHtml([['首页', '/'], ['货币战争', '/currency'], [CATALOG_TITLE['/currency/buff'], null]]),
      h1: CATALOG_TITLE['/currency/buff'],
      summary: esc(portalSummary),
      items: portalItems,
    }),
  }));

  const augments = (readJson('currency/augments.json').augments || []).filter((a) => a.name);
  const augSummary = `${SITE_NAME}货币战争投资策略图鉴：共 ${augments.length} 条投资策略。`;
  const augItems = augments.map((a) => ({
    name: a.name,
    href: null,
    meta: txt(CW_QUALITY_LABEL[a.quality] || a.quality, null, 40),
    // 目录条目：条目携带 params 语义（此处 params 全为 []，即占位符不可展开）→ 含裸 `#N` 的 desc 整段省略
    desc: txtSafe(a.desc, a.params, 400, hasParamSemantics(a)),
  }));
  pages.push(makePage('currency-augment-list', {
    route: '/currency/augment',
    file: 'currency/augment.html',
    title: `${CATALOG_TITLE['/currency/augment']} - ${SITE_NAME}`,
    description: cut(augSummary, 150),
    ld: ldCollection('/currency/augment', CATALOG_TITLE['/currency/augment'], cut(augSummary, 150), augItems),
    body: catalogBody(ctx, {
      crumbs: crumbHtml([['首页', '/'], ['货币战争', '/currency'], [CATALOG_TITLE['/currency/augment'], null]]),
      h1: CATALOG_TITLE['/currency/augment'],
      summary: esc(augSummary),
      items: augItems,
    }),
  }));

  return pages;
}

/* ─── 货币战争羁绊 `/currency/trait` + `/currency/trait/:id` ─── */

function currencyTraitPages(ctx) {
  const traits = readJson('currency/traits.json').traits || [];
  const roles = readJson('currency/role.json').roles || [];
  const links = traits.map((t) => ({ name: t.name, href: `/currency/trait/${t.id}` }));
  const summaryPlain = `${SITE_NAME}货币战争羁绊图鉴：共 ${traits.length} 个羁绊，含激活人数层级与成员加成。`;
  const items = traits.map((t) => ({
    name: t.name,
    href: `/currency/trait/${t.id}`,
    meta: [esc(CW_CAT_LABEL[t.cat] || t.cat || ''), esc(`${(t.layers || []).length} 层`)].filter(Boolean).join(' · '),
    // 目录条目：条目携带 base_params 语义 → 能展开就展开（含裸 `#N`），展不开则整段省略该 desc
    desc: txtSafe(t.simple_desc || t.desc, t.base_params, 200, hasParamSemantics(t)),
  }));
  const pages = [makePage('currency-trait-list', {
    route: '/currency/trait',
    file: 'currency/trait.html',
    title: `${CATALOG_TITLE['/currency/trait']} - ${SITE_NAME}`,
    description: cut(summaryPlain, 150),
    ld: ldCollection('/currency/trait', CATALOG_TITLE['/currency/trait'], cut(summaryPlain, 150), items),
    body: catalogBody(ctx, {
      crumbs: crumbHtml([['首页', '/'], ['货币战争', '/currency'], [CATALOG_TITLE['/currency/trait'], null]]),
      h1: CATALOG_TITLE['/currency/trait'],
      summary: esc(summaryPlain),
      items,
    }),
  })];

  traits.forEach((entry, idx) => {
    const name = clean(entry.name) || `#${entry.id}`;
    const route = `/currency/trait/${entry.id}`;
    const members = roles.filter((r) => (r.trait_list || []).includes(Number(entry.id)));
    // 摘要段只在源文本（简述 / 完整描述）存在时输出；参数口径同羁绊详情（desc + base_params）
    const sourceSummary = plain(entry.simple_desc, entry.base_params) || plain(entry.desc, entry.base_params);
    const description = sourceSummary
      ? cut(sourceSummary, 150)
      : cut(factMeta([CW_CAT_LABEL[entry.cat] || entry.cat, entry.activation_type], CATALOG_TITLE['/currency/trait'], name), 150);
    const layerHtml = (entry.layers || [])
      .map((l) => {
        const props = [...(l.member_props || []), ...(l.all_props || [])]
          .map((p) => `${propLabel(p)} ${propValue(p.value)}`).join('、');
        const quality = l.quality ? `${CW_QUALITY_LABEL[l.quality] || l.quality} · ` : '';
        return `<li><span>${esc(`${quality}${l.layer} 人`)}</span><p>${txt(l.desc, l.params)}${l.buff_desc ? ` ${txt(l.buff_desc, l.buff_params)}` : ''}</p>${props ? `<p>${txt(props, null, 600)}</p>` : ''}</li>`;
      })
      .join('');
    const remarkHtml = (entry.remarks || [])
      .map((r) => `<li><p>${txt(r.desc, r.params)}</p></li>`)
      .join('');
    const body = detailBody(ctx, {
      crumbs: crumbHtml([['首页', '/'], ['货币战争', '/currency'], [CATALOG_TITLE['/currency/trait'], '/currency/trait'], [name, null]]),
      h1: name,
      summary: sourceSummary ? esc(cut(sourceSummary, 200)) : '',
      facts: [
        ['分类', txt(CW_CAT_LABEL[entry.cat] || entry.cat, null, 40)],
        ['激活方式', txt(entry.activation_type, null, 60)],
        ['层级数', esc(String((entry.layers || []).length))],
        ['成员数', esc(String(members.length))],
        ['所属赛季', entry.season_id != null ? esc(String(entry.season_id)) : ''],
      ],
      sections: [
        // 空 desc 时「效果说明」整段省略
        { title: '效果说明', html: clean(entry.desc) ? `<p>${txt(entry.desc, entry.base_params, SNAPSHOT_TEXT_LIMIT_DETAIL)}</p>` : '' },
        { title: '层级效果', html: layerHtml ? `<ul class="nk-snapshot__blocks">${layerHtml}</ul>` : '' },
        { title: '机制详情', html: remarkHtml ? `<ul class="nk-snapshot__blocks">${remarkHtml}</ul>` : '' },
        {
          title: '羁绊成员',
          html: members.length
            ? linkList(members.map((m) => ({ name: m.name, href: `/currency/role/${m.id}`, meta: esc(`${m.rarity}费`) })))
            : '',
        },
      ],
      links: siblingsOf(links, idx),
      listLabel: '同图鉴羁绊',
    });
    pages.push(makePage('currency-trait-detail', {
      route,
      file: `currency/trait/${entry.id}.html`,
      title: `${name} - ${SITE_NAME}`,
      description,
      ld: ldArticle(route, name, description,
        [['首页', '/'], ['货币战争', '/currency'], [CATALOG_TITLE['/currency/trait'], '/currency/trait'], [name, route]], ctx),
      body,
    }));
  });
  return pages;
}

/* ─── 专题页 `/voracity`（「贪饕污染」；ADR 0025 的第三种页面形态：非目录、非实体详情） ─── */

/**
 * 比例字段 → 百分比文本（专题页的进度类字段专用）：镜像页面 `src/app/views/VoracityView.vue` 的
 * `ratioPct`/`fmtPct`——0~1 视为比例、>1 原样视为已是百分数、钳到 [0,100]、保留 1 位小数；
 * `null`/非数值返回空串（该档不输出百分比）。用于 `progress_steps[*].progress` 与
 * `activity.buff_levels[*].progress_percent`：数据事实必须与页面同口径（契约 §3「页面 ↔ 快照的对齐粒度」）。
 */
function pctText(v) {
  if (v == null || !Number.isFinite(Number(v))) return '';
  const n = Number(v);
  return `${Math.round(Math.max(0, Math.min(100, n <= 1 ? n * 100 : n)) * 10) / 10}%`;
}

/**
 * 专题页正文（契约 §3「专题页正文规则」）：数据全部来自 `voracity.json`（converter 的 voracity 模块单文件产物），
 * 五块分区 + 「污染」同形词说明；**不使用** `nk-snapshot__entry`——该类名被契约 §3 冻结为
 * 「12 个目录页 + 枢纽页的收录条目清单」，专题页的分区列表不是「应用收录条目集合」，标记它会把专题页
 * 误计入条目级覆盖率断言（见 tools/check-ai-endpoints.mjs 检查 5 的注释）。JSON-LD 用 ldArticle：专题页不是目录，
 * 不用 CollectionPage + ItemList。所有描述字段走 txtSafe——按 fmtDesc/fmtVal 口径展开 `#N[tag]%`，
 * 缺参数展开不了的字段整段省略（守卫断言无残留 `#\d+\[…\]`）。
 */
function voracityPages(ctx) {
  const db = readJson('voracity.json');
  const activity = db.activity || {};
  const invasion = db.invasion || {};
  const levels = Array.isArray(invasion.levels) ? invasion.levels : [];
  const stages = Array.isArray(invasion.stages) ? invasion.stages : [];
  const buffLevels = Array.isArray(activity.buff_levels) ? activity.buff_levels : [];
  const scores = Array.isArray(activity.scores) ? activity.scores : [];
  const steps = Array.isArray(activity.progress_steps) ? activity.progress_steps : [];
  const statuses = Array.isArray(db.statuses) ? db.statuses : [];
  const tutorials = Array.isArray(db.tutorials) ? db.tutorials : [];
  const affixes = Array.isArray(db.affixes) ? db.affixes : [];

  /** 名称回退 = 数据自身的 id（禁止为无名条目合成实体文案；id 是数据字段） */
  const nameOrId = (entry, key, fallbackKey) => txtSafe(entry && entry[key], null, 120)
    || (entry && entry[fallbackKey] != null ? esc(String(entry[fallbackKey])) : '');

  const monsterTotal = stages.reduce((n, st) => n + (Array.isArray(st && st.monsters) ? st.monsters.length : 0), 0);
  const stageHtml = stages.map((st) => {
    const monsters = (Array.isArray(st && st.monsters) ? st.monsters : []).map((m) => {
      const name = txtSafe(m && m.name, null, 120) || (m && m.monster_id != null ? esc(String(m.monster_id)) : '');
      // detail_id 非空才给真实内链；为空（认不出模板）输出纯文本，禁止造 `#` 链接
      const href = m && m.detail_id != null && String(m.detail_id) !== '' ? `/monster/${m.detail_id}` : null;
      const label = href ? `<a href="${esc(href)}">${name}</a>` : `<span>${name}</span>`;
      return `<li>${label}</li>`;
    }).join('');
    const head = [
      st && st.stage_id != null ? `关卡 ${esc(String(st.stage_id))}` : '',
      st && st.invasion_id != null ? `侵蚀等级 ${esc(String(st.invasion_id))}` : '',
    ].filter(Boolean).join(' · ');
    if (!head && !monsters) return '';
    return `<li>${head ? `<span>${head}</span>` : ''}${monsters ? `<ul class="nk-snapshot__list">${monsters}</ul>` : ''}</li>`;
  }).join('');

  const levelHtml = levels.map((lv) => {
    const desc = txtSafe(lv && lv.desc, lv && lv.param_list, SNAPSHOT_TEXT_LIMIT_DETAIL, hasParamSemantics(lv));
    if (!desc) return '';
    const head = lv && lv.invasion_id != null ? `侵蚀等级 ${esc(String(lv.invasion_id))}` : '';
    return `<li>${head ? `<span>${head}</span>` : ''}<p>${desc}</p></li>`;
  }).join('');
  const buffHtml = buffLevels.map((b) => {
    const name = nameOrId(b, 'name', 'buff_id');
    const desc = txtSafe(b && b.desc, b && b.param_list, SNAPSHOT_TEXT_LIMIT_DETAIL, hasParamSemantics(b));
    // 愿力分档进度是数据事实（页面同处渲染）→ 有值必输出，标签沿用页面文案「愿力进度」；null 档不输出
    const pct = pctText(b && b.progress_percent);
    if (!name && !desc && !pct) return '';
    const head = `${name}${b && b.level != null ? `（等级 ${esc(String(b.level))}）` : ''}`;
    return `<li><span>${head}</span>${pct ? `<p>愿力进度 ${esc(pct)}</p>` : ''}${desc ? `<p>${desc}</p>` : ''}</li>`;
  }).join('');

  const scoreHtml = scores.length ? `<p>愿力档位：${scores.map((s) => esc(String(s))).join(' / ')}</p>` : '';
  /** 进度档位百分比：与页面 `fmtPct` 同口径（pctText），无值档不输出百分比 */
  const stepHtml = steps.map((p) => {
    const prog = pctText(p && p.progress);
    const desc = txtSafe(p && p.desc, null, SNAPSHOT_TEXT_LIMIT_DETAIL);
    if (!prog && !desc) return '';
    return `<li>${prog ? `<span>进度 ${esc(prog)}</span>` : ''}${desc ? `<p>${desc}</p>` : ''}</li>`;
  }).join('');

  const statusHtml = statuses.map((s) => {
    const name = nameOrId(s, 'name', 'status_id');
    const type = txtSafe(s && s.type, null, 40);
    const desc = txtSafe(s && s.desc, s && s.param_list, SNAPSHOT_TEXT_LIMIT_DETAIL, hasParamSemantics(s));
    if (!name && !desc) return '';
    return `<li><span>${name}${type ? `（${type}）` : ''}</span>${desc ? `<p>${desc}</p>` : ''}</li>`;
  }).join('');

  const tutorialHtml = tutorials.map((t) => {
    const desc = txtSafe(t && t.desc, null, SNAPSHOT_TEXT_LIMIT_DETAIL);
    return desc ? `<li><p>${desc}</p></li>` : '';
  }).join('');

  const affixHtml = affixes.map((a) => {
    const name = nameOrId(a, 'name', 'id');
    const desc = txtSafe(a && a.desc, a && a.params, SNAPSHOT_TEXT_LIMIT_DETAIL, hasParamSemantics(a));
    if (!name && !desc) return '';
    return `<li><span>${name}</span>${desc ? `<p>${desc}</p>` : ''}</li>`;
  }).join('');

  const activityName = clean(activity.name);
  const introHtml = txtSafe(activity.intro, null, SNAPSHOT_TEXT_LIMIT_DETAIL);
  const summaryPlain = `${SITE_NAME}贪饕污染专题：${activityName ? `${activityName}，` : ''}`
    + '含污染等级与愿力、「贪饕」侵蚀（敌方强化与玩家支援）、波及关卡与被污染怪物、状态词条、教程图文与货币战争位面词条。';
  const description = cut(summaryPlain, 150);
  const body = detailBody(ctx, {
    crumbs: crumbHtml([['首页', '/'], [VORACITY_TITLE, null]]),
    h1: VORACITY_TITLE,
    summary: '',
    facts: [
      ['活动', txtSafe(activity.name, null, 120)],
      ['解锁任务', activity.unlock_mission_id != null ? esc(String(activity.unlock_mission_id)) : ''],
      ['波及关卡数', esc(String(stages.length))],
      ['怪物名单条目数', esc(String(monsterTotal))],
      ['状态词条数', esc(String(statuses.length))],
      ['位面词条数', esc(String(affixes.length))],
    ],
    sections: [
      { title: '玩法概览', html: introHtml ? `<p>${introHtml}</p>` : '' },
      {
        title: '污染等级与愿力',
        html: scoreHtml + (stepHtml ? `<ul class="nk-snapshot__blocks">${stepHtml}</ul>` : ''),
      },
      {
        title: '「贪饕」侵蚀（敌方与玩家支援）',
        html: [
          levelHtml ? `<p>敌方强化（关卡侵蚀）</p><ul class="nk-snapshot__blocks">${levelHtml}</ul>` : '',
          buffHtml ? `<p>玩家支援（愿力分档）</p><ul class="nk-snapshot__blocks">${buffHtml}</ul>` : '',
        ].join(''),
      },
      {
        title: '波及关卡与被污染怪物',
        html: stageHtml ? `<ul class="nk-snapshot__blocks">${stageHtml}</ul>` : '',
      },
      { title: '状态词条', html: statusHtml ? `<ul class="nk-snapshot__blocks">${statusHtml}</ul>` : '' },
      { title: '教程图文', html: tutorialHtml ? `<ul class="nk-snapshot__blocks">${tutorialHtml}</ul>` : '' },
      { title: '位面词条', html: affixHtml ? `<ul class="nk-snapshot__blocks">${affixHtml}</ul>` : '' },
      { title: '「污染」同形词说明', html: `<p>${esc(VORACITY_DISAMBIGUATION)}</p>` },
    ],
  });
  return [makePage('voracity-page', {
    route: '/voracity',
    file: 'voracity.html',
    title: `${VORACITY_TITLE} - ${SITE_NAME}`,
    description,
    ld: ldArticle('/voracity', VORACITY_TITLE, description, [['首页', '/'], [VORACITY_TITLE, '/voracity']], ctx),
    body,
  })];
}

/* ═══════════ 主流程 ═══════════ */

function buildPages(ctx) {
  return [
    ...homePages(ctx),
    ...characterPages(ctx),
    ...lightconePages(ctx),
    ...relicPages(ctx),
    ...itemPages(ctx),
    ...monsterPages(ctx),
    ...endgamePages(ctx),
    ...achievementPages(ctx),
    ...currencyHubPages(ctx),
    ...currencyRolePages(ctx),
    ...currencyListPages(ctx),
    ...currencyTraitPages(ctx),
    ...voracityPages(ctx),
  ];
}

function main() {
  if (!existsSync(TEMPLATE_FILE)) {
    fail(`缺少 ${TEMPLATE_FILE}：请先执行 \`pnpm exec vite build\`（快照模板必须是构建产物，禁止用源码模板）`);
  }
  /**
   * 模板取值（Vercel 投递模型 = 文件系统先于 rewrites，契约 §1）：
   * 生成后 `dist/index.html` 会被 home 快照覆盖，因此再次运行时禁止拿它当模板——
   * 优先复用上一轮原样落盘的纯 shell `dist/prerender/_shell.html`。
   * `_shell.html` 缺失且 `dist/index.html` 已被注入时立即失败，避免拿 home 快照当 shell 二次注入。
   */
  const shellSource = existsSync(SHELL_FILE) ? SHELL_FILE : TEMPLATE_FILE;
  const template = readFileSync(shellSource, 'utf8');
  if (shellSource === TEMPLATE_FILE && template.includes('class="nk-snapshot"')) {
    fail(`${TEMPLATE_FILE} 已是注入过的快照且缺少 ${SHELL_FILE}：请先执行 \`pnpm exec vite build\` 重建纯 shell 模板`);
  }
  const ctx = loadContext();
  const pages = buildPages(ctx);

  // 每次重建都清空 prerender：残留快照会让「快照数 = 数据条目数」与 sitemap 一一对应断言失效
  rmSync(PRERENDER_DIR, { recursive: true, force: true });
  mkdirSync(PRERENDER_DIR, { recursive: true });
  /**
   * 纯 shell 原样落盘（供 vercel.json catch-all rewrite 投递 SPA 外壳）。
   * 下划线前缀 = 非快照标记：不注入 `.nk-snapshot` / canonical / title / JSON-LD，
   * 守卫与覆盖率统计都跳过 `_` 前缀文件。
   */
  writeFileSync(SHELL_FILE, template);

  let bytes = 0;
  let homeHtml = null;
  for (const page of pages) {
    const out = join(PRERENDER_DIR, page.file);
    mkdirSync(dirname(out), { recursive: true });
    const html = renderSnapshot(template, page);
    writeFileSync(out, html);
    bytes += Buffer.byteLength(html);
    // home 快照要同时覆盖 dist/index.html（字节一致）→ `/` 命中正文；此处只渲染一次，避免两份不一致
    if (page.route === '/') homeHtml = html;
  }
  if (homeHtml == null) fail('未构建 route="/" 的 home 页面，无法覆盖 dist/index.html');
  writeFileSync(TEMPLATE_FILE, homeHtml);
  const sitemap = renderSitemap(ctx, pages);
  writeFileSync(SITEMAP_FILE, sitemap);
  bytes += Buffer.byteLength(sitemap);

  const byFamily = new Map();
  for (const p of pages) byFamily.set(p.family, (byFamily.get(p.family) || 0) + 1);
  console.log(`[OK] 快照 ${pages.length} 个 → ${PRERENDER_DIR}（+${(bytes / 1024 / 1024).toFixed(2)} MB）`);
  for (const [family, count] of [...byFamily.entries()].sort()) {
    console.log(`  ${family}: ${count}`);
  }
  console.log(`[OK] ${SHELL_FILE}（纯 shell，非快照，已跳过注入）`);
  console.log(`[OK] ${TEMPLATE_FILE} = home 快照（与 prerender/home.html 字节一致，供路由 / 直接命中）`);
  console.log(`[OK] ${SITEMAP_FILE}（${pages.length} <loc>，origin=${SITE_ORIGIN}）`);

  const fileCount = countFiles(PRERENDER_DIR);
  if (fileCount !== pages.length) fail(`快照文件数 ${fileCount} ≠ 页面数 ${pages.length}（应已排除 _ 前缀非快照）`);
}

function countFiles(dir) {
  let n = 0;
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, name.name);
    if (name.isDirectory()) n += countFiles(p);
    // 下划线前缀 = 非快照（_shell.html），不计入快照数
    else if (name.name.endsWith('.html') && !name.name.startsWith('_')) n += 1;
  }
  return n;
}

/* 入口判断：被 import 取 SITE_ORIGIN 时绝不执行主流程 */
const isEntry = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isEntry) {
  main();
}
