#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';


export const SITE_ORIGIN = 'https://myhsr.wiki';

export const OG_IMAGE = `${SITE_ORIGIN}/og.png`;

const ROOT = fileURLToPath(new URL('..', import.meta.url));

const LANG_REGISTRY = JSON.parse(readFileSync(join(ROOT, 'tools', 'converter', 'languages.json'), 'utf8'));
const LOCALES = LANG_REGISTRY.languages.map((l) => ({ code: l.code, culture: l.culture }));
const DEFAULT_LOCALE = LANG_REGISTRY.default;
const DEFAULT_CULTURE = LOCALES.find((l) => l.code === DEFAULT_LOCALE)?.culture || 'zh-CN';
let currentLocale = DEFAULT_LOCALE;
let SNAPSHOT_SYNCED_AT = '';

const ogLocale = (culture) => String(culture || DEFAULT_CULTURE).replace('-', '_');

const ldLang = () => LOCALES.find((l) => l.code === currentLocale)?.culture || DEFAULT_CULTURE;

const packCache = new Map();

function packOf(locale) {
  const hit = packCache.get(locale);
  if (hit) return hit;
  const merged = {};
  const dir = join(ROOT, 'public', 'data', 'i18n', locale);
  if (existsSync(dir)) {
    for (const f of readdirSync(dir)) {
      if (f.endsWith('.json')) Object.assign(merged, JSON.parse(readFileSync(join(dir, f), 'utf8')));
    }
  }
  packCache.set(locale, merged);
  return merged;
}

function defaultPack() {
  return packOf(DEFAULT_LOCALE);
}
const uiDictCache = new Map();
function uiDict(locale) {
  const hit = uiDictCache.get(locale);
  if (hit) return hit;
  let d = {};
  try {
    d = JSON.parse(readFileSync(new URL(`../src/lib/i18n/messages/${locale}.json`, import.meta.url), 'utf8'));
  } catch {
    d = {};
  }
  uiDictCache.set(locale, d);
  return d;
}

function uiT(key, cnFallback, params = {}, count = null) {
  let v = ui(key, cnFallback);
  if (v.includes('|')) {
    const forms = v.split('|').map((x) => x.trim());
    v = count === 1 ? forms[0] : (forms[1] ?? forms[0]);
  }
  for (const [k, val] of Object.entries(params)) v = v.split(`{${k}}`).join(String(val));
  return v;
}

function ui(key, cnFallback) {
  const v = uiDict(currentLocale)[key];
  return typeof v === 'string' && v.trim() ? v : cnFallback;
}
const DATA_DIR = join(ROOT, 'public', 'data', 'cn');
const DIST_DIR = join(ROOT, 'dist');
const TEMPLATE_FILE = join(DIST_DIR, 'index.html');
const PRERENDER_DIR = join(DIST_DIR, 'prerender');
const SITEMAP_FILE = join(DIST_DIR, 'sitemap.xml');
const SHELL_FILE = join(PRERENDER_DIR, '_shell.html');
const SHELL_NOINDEX = '<meta name="robots" content="noindex">';
const withShellNoindex = (html) => (html.includes(SHELL_NOINDEX) ? html : html.replace('</head>', `${SHELL_NOINDEX}</head>`));

const SNAPSHOT_TEXT_LIMIT_ENTRY = 4000;
const SNAPSHOT_TEXT_LIMIT_DETAIL = 20000;

const SITE_NAME = '星铁档案馆';

const gameName = () => ui('meta.gameName', '崩坏：星穹铁道');

const titleTail = () => `${gameName()} Wiki | ${SITE_NAME}`;
const MAX_CHAR_LEVEL = 80;


const CATALOG_TITLE = {
  '/character': () => ui('catalog.character.title', '角色图鉴'),
  '/lightcone': () => ui('catalog.lightcone.title', ui('catalog.lightcone.title', '光锥图鉴')),
  '/relic': () => ui('catalog.relic.title', ui('catalog.relic.title', '遗器图鉴')),
  '/item': () => ui('catalog.item.title', ui('nav.item', '物品')),
  '/monster': () => ui('catalog.monster.title', ui('catalog.monster.title', '敌对物种')),
  '/endgame': () => ui('catalog.endgame.title', ui('catalog.endgame.title', '终局内容')),
  '/achievement': () => ui('catalog.achievement.title', ui('nav.achievement', '成就')),
  '/currency/role': () => `${ui('catalog.currencyWar', '货币战争')} · ${ui('catalog.character.title', '角色图鉴')}`,
  '/currency/item': () => `${ui('catalog.currencyWar', '货币战争')} · ${ui('nav.cwEquipment', '装备图鉴')}`,
  '/currency/buff': () => `${ui('catalog.currencyWar', '货币战争')} · ${ui('nav.cwPortal', '投资环境')}`,
  '/currency/augment': () => `${ui('catalog.currencyWar', '货币战争')} · ${ui('nav.cwAugment', '投资策略')}`,
  '/currency/trait': () => `${ui('catalog.currencyWar', '货币战争')} · ${ui('nav.cwTrait', '羁绊图鉴')}`,
};
const voracityTitle = () => ui('nav.voracity', '贪饕污染');

const ENDGAME_MODES = [
  { key: 'maze', label: () => ui('catalog.option.modeMaze', '忘却之庭'), file: 'maze.catalog.json', list: 'maze.json' },
  { key: 'story', label: () => ui('catalog.option.modeStory', '虚构叙事'), file: 'maze_extra.catalog.json', list: 'maze_extra.json' },
  { key: 'boss', label: () => ui('catalog.option.modeBoss', '末日幻影'), file: 'maze_boss.catalog.json', list: 'maze_boss.json' },
  { key: 'peak', label: () => ui('catalog.option.modePeak', '异相仲裁'), file: 'maze_peak.catalog.json', list: 'maze_peak.json' },
];

const MON_RANK = {
  Minion: 'monster.rank.minion',
  MinionLv2: 'monster.rank.minion',
  Elite: 'monster.rank.elite',
  LittleBoss: 'monster.rank.littleBoss',
  BigBoss: 'monster.rank.boss',
};
const MON_TYPE = { BOSS: 'monster.rank.boss', ELITE: 'monster.rank.elite', MINION: 'monster.rank.minion' };
const monRankLabel = (t) => (MON_RANK[t] ? ui(MON_RANK[t], t) : t);
const MON_STATUS_TYPE = { Buff: 'mob.status.buff', Debuff: 'mob.status.debuff', Other: 'mob.status.other' };
const monStatusLabel = (t) => (MON_STATUS_TYPE[t] ? ui(MON_STATUS_TYPE[t], t) : t);

const ITEM_MAIN_TYPE = {
  Material: ['itemType.Material', ui('itemType.Material', '材料')],
  Virtual: ['itemType.Virtual', ui('itemType.Virtual', '货币')],
  Usable: ['itemMainType.Usable', ui('itemMainType.Usable', '可用')],
  Mission: ['itemMainType.Mission', ui('itemMainType.Mission', '任务')],
};
const itemMainTypeLabel = (t) => (ITEM_MAIN_TYPE[t] ? ui(ITEM_MAIN_TYPE[t][0], ITEM_MAIN_TYPE[t][1]) : t);

const ACH_RARITY = {
  Low: ['catalog.option.rarityLow', ui('catalog.option.rarityLow', '铜')],
  Mid: ['catalog.option.rarityMid', ui('catalog.option.rarityMid', '银')],
  High: ['catalog.option.rarityHigh', ui('catalog.option.rarityHigh', '金')],
};
const achRarityLabel = (t) => (ACH_RARITY[t] ? ui(ACH_RARITY[t][0], ACH_RARITY[t][1]) : t);
const CW_FB_LABEL = {
  Front: 'catalog.position.front',
  Back: 'catalog.position.back',
  Both: 'catalog.position.both',
};
const cwFbLabel = (t) => (CW_FB_LABEL[t] ? ui(CW_FB_LABEL[t], t) : t);
const CW_CHARGE_LABEL = {
  Speed: 'catalog.charge.speed', EnergyBar: 'catalog.charge.specialEnergy',
  MaxSP: 'catalog.charge.ultEnergy', MaxHP: 'catalog.charge.maxHp', SP: 'catalog.charge.sp',
};
const cwChargeLabel = (t) => (CW_CHARGE_LABEL[t] ? ui(CW_CHARGE_LABEL[t], t) : t);
const CW_CAT_LABEL = { faction: 'catalog.traitCat.faction', combat: 'catalog.traitCat.combat', special: 'catalog.traitCat.special' };
const cwCatLabel = (t) => (CW_CAT_LABEL[t] ? ui(CW_CAT_LABEL[t], t) : t);
const CW_QUALITY_LABEL = {
  Silver: ['catalog.quality.silver', ui('catalog.quality.silver', '银色')],
  Gold: ['catalog.quality.gold', ui('catalog.quality.gold', '金色')],
  Multicolor: ['catalog.quality.multicolor', ui('catalog.quality.multicolor', '彩')],
  Unique: ['catalog.quality.unique', ui('catalog.quality.unique', '独特')],
};
const cwQualityLabel = (t) => (CW_QUALITY_LABEL[t] ? ui(CW_QUALITY_LABEL[t][0], CW_QUALITY_LABEL[t][1]) : t);


function fail(msg) {
  console.error(`[FAIL] ${msg}`);
  process.exit(1);
}

const TOKEN_PREFIX = '$t:';
const isToken = (v) => typeof v === 'string' && v.startsWith(TOKEN_PREFIX);


function resolveTokens(value) {
  if (isToken(value)) {
    const key = value.slice(TOKEN_PREFIX.length);
    const text = packOf(currentLocale)[key];
    if (text === undefined) fail(`语言包缺键 ${key}（public/data/i18n/${currentLocale}/** 与结构层不同源）`);
    return text.replace(/\\n/g, '\n');
  }
  if (Array.isArray(value)) return value.map(resolveTokens);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = resolveTokens(v);
    return out;
  }
  return value;
}

function readJson(rel) {
  const file = join(DATA_DIR, rel);
  if (!existsSync(file)) fail(`缺少数据文件 ${file}（public/data/cn/** 由 tools/converter 生成）`);
  return resolveTokens(JSON.parse(readFileSync(file, 'utf8')));
}

const ESC_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

function esc(v) {
  return v == null ? '' : String(v).replace(/[&<>"']/g, (c) => ESC_MAP[c]);
}


const CN_UI_DICT = (() => {
  try {
    return JSON.parse(readFileSync(new URL('../src/lib/i18n/messages/cn.json', import.meta.url), 'utf8'));
  } catch {
    return {};
  }
})();

function clean(raw) {
  if (raw == null) return '';
  return String(raw)
    .replaceAll('{SPACE}', ' ')
    .replace(/\{NICKNAME\}/g, ui('common.trailblazer', '开拓者'))
    .replace(/\{PROP:([A-Za-z0-9_]+)\}/g, (_m, k) => uiDict(currentLocale)[`prop.${k}`] ?? k)
    .replace(/\{[FM]#([^}]*)\}/g, '$1')
    .replace(/\{RUBY_[EB]#[^}]*\}/g, '')
    .replace(/\{TEXTJOIN#\d+\}/g, '')
    .replace(/\\n|\r?\n/g, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const GENDER_VARIANT_RE = /\{([MF])#([^}]*)\}/g;

function pickGender(text, gender) {
  if (text == null || text === '') return text;
  let matched = false;
  const picked = String(text).replace(GENDER_VARIANT_RE, (_m, flag, body) => {
    if ((flag === 'M' ? 'male' : 'female') === gender) {
      matched = true;
      return body;
    }
    return '';
  });
  if (matched) return picked;
  return String(text).replace(GENDER_VARIANT_RE, '$2');
}

const isTrailblazerId = (id) => Number(id) >= 8000;
const genderOfId = (id) => (Number(id) % 2 === 0 ? 'female' : 'male');

const SNAPSHOT_GENDER = 'female';

function charName(entry) {
  return isTrailblazerId(entry.id) ? pickGender(entry.name, genderOfId(entry.id)) : entry.name;
}

function cwRoleName(entry) {
  return isTrailblazerId(entry.id) ? pickGender(entry.name, SNAPSHOT_GENDER) : entry.name;
}

function charDetailName(entry, raw) {
  return clean(isTrailblazerId(entry.id) ? pickGender(raw, genderOfId(entry.id)) : raw) || charName(entry);
}

function cwRoleDetailName(entry, raw) {
  return clean(isTrailblazerId(entry.id) ? pickGender(raw, SNAPSHOT_GENDER) : raw) || cwRoleName(entry);
}

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

function fillParams(text, params) {
  if (!text || !Array.isArray(params) || !params.length) return text;
  return text
    .replace(/#(\d+)\[([^\]]*)\](%?)/g, (raw, i, tag, pct) => {
      const v = fmtParam(params[Number(i) - 1], tag, pct === '%');
      return v == null ? raw : v + pct;
    })
    .replace(/#(\d+)/g, (raw, i) => fmtParam(params[Number(i) - 1], '', '') ?? raw);
}

function cut(text, limit) {
  return limit && text.length > limit ? `${text.slice(0, limit)}…` : text;
}

function plain(raw, params, limit) {
  return cut(fillParams(clean(raw), params), limit);
}

function txt(raw, params, limit = SNAPSHOT_TEXT_LIMIT_DETAIL) {
  return esc(plain(raw, params, limit));
}

function eventLevelRange(levels) {
  const list = Array.isArray(levels) ? levels.filter((n) => n != null) : [];
  if (!list.length) return '';
  return list.length > 1 ? `${list[0]}–${list[list.length - 1]}` : String(list[0]);
}

function txtSafe(raw, params, limit = SNAPSHOT_TEXT_LIMIT_ENTRY, paramsSemantics = false) {
  const expanded = plain(raw, params);
  if (/#\d+\[/.test(expanded)) return '';
  if (paramsSemantics && /#\d/.test(expanded)) return '';
  return esc(cut(expanded, limit));
}

function hasParamSemantics(entry) {
  return Array.isArray(entry && entry.params)
    || Array.isArray(entry && entry.base_params)
    || Array.isArray(entry && entry.param_list);
}

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

function starText(n) {
  const num = Number(n) || 0;
  return num > 0 ? '★'.repeat(num) : '';
}

function factMeta(parts, fallbackLabel, name) {
  const bits = parts.map((p) => clean(p)).filter(Boolean);
  return bits.length ? `${name} · ${bits.join(' · ')}` : `${fallbackLabel} · ${name}`;
}

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


function crumbHtml(parts) {
  const items = parts.map(([label, href]) => (href
    ? `<a href="${esc(href)}">${esc(label)}</a>`
    : `<span>${esc(label)}</span>`));
  return `<nav class="nk-snapshot__crumbs" aria-label="面包屑">${items.join('<span class="nk-snapshot__sep">›</span>')}</nav>`;
}

function snapSection(title, html) {
  return html ? `<section class="nk-snapshot__section"><h2>${esc(title)}</h2>${html}</section>` : '';
}

function snapMore(href, label) {
  return `<p class="nk-snapshot__more"><a href="${esc(href)}">${esc(uiT('snapshot.viewAll', '查看全部{label}', { label }))}</a></p>`;
}

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

const DATE_SLOT = '{{nk-date}}';
const timeTag = (v) => `<time datetime="${esc(v)}">${esc(v)}</time>`;

function snapFooter(ctx) {
  const updated = uiT('snapshot.updatedAt', '数据最后更新：{date}', { date: DATE_SLOT });
  const note = uiT('snapshot.note', '本页为{site}构建期预渲染快照，内容与站点数据一致，无 JavaScript 亦可读取。', { site: SITE_NAME });
  return `<p class="nk-snapshot__meta">${esc(updated).replace(DATE_SLOT, timeTag(ctx.syncedAt))}</p>`
    + `<p class="nk-snapshot__note">${esc(note)}</p>`;
}

function factList(facts) {
  const rows = (facts || [])
    .filter(([, v]) => v != null && String(v) !== '')
    .map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${v}</dd></div>`);
  return rows.length ? `<dl class="nk-snapshot__facts">${rows.join('')}</dl>` : '';
}

function groupSections(rows, labelOf, labelSource, entries) {
  if (rows.length !== entries.length) {
    fail(`${labelSource}：分组源与条目数不等（${rows.length} vs ${entries.length}）`);
  }
  const groups = new Map();
  rows.forEach((row, i) => {
    const label = labelOf(row);
    if (!label) fail(`${labelSource}：存在取不到分组标签的条目，会产出空 <h2>`);
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label).push(entries[i]);
  });
  return [...groups.entries()].map(([label, list]) => ({ title: label, html: linkList(list, true) }));
}

function catalogBody(ctx, o) {
  const parts = ['<div class="nk-snapshot">', o.crumbs, `<h1>${esc(o.h1)}</h1>`];
  if (o.summary) parts.push(`<p class="nk-snapshot__summary">${o.summary}</p>`);
  if (o.items && o.items.length) parts.push(linkList(o.items, true));
  for (const s of o.sections || []) parts.push(snapSection(s.title, s.html));
  parts.push(snapFooter(ctx));
  parts.push('</div>');
  return parts.join('');
}

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


function ldCollection(route, title, description, entries) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: title,
    url: SITE_ORIGIN + route,
    description,
    dateModified: SNAPSHOT_SYNCED_AT,
    inLanguage: ldLang(),
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
        inLanguage: ldLang(),
        mainEntityOfPage: SITE_ORIGIN + route,
        isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: `${SITE_ORIGIN}/` },
      },
      breadcrumbNode(crumbs),
    ],
  };
}

function ldDataPage(route, name, description, crumbs, ctx) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${SITE_ORIGIN}${route}#page`,
        name,
        description,
        url: SITE_ORIGIN + route,
        dateModified: ctx.syncedAt,
        inLanguage: ldLang(),
        isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: `${SITE_ORIGIN}/` },
        mainEntity: {
          '@type': 'Thing',
          '@id': `${SITE_ORIGIN}${route}#entry`,
          name,
          description,
        },
      },
      breadcrumbNode(crumbs),
    ],
  };
}

function ldCharacter(route, name, description, crumbs, ctx, d) {
  const attrs = [];
  const rarity = /(\d+)\s*$/.exec(String(d.rarity || ''))?.[1];
  if (rarity) attrs.push({ '@type': 'PropertyValue', name: ui('catalog.filter.rarity', '稀有度'), value: rarity });
  const pathName = ctx.pathNames.get(d.base_type) || d.base_type;
  if (pathName) attrs.push({ '@type': 'PropertyValue', name: ui('catalog.filter.path', '命途'), value: pathName });
  const elemName = ctx.elemNames.get(d.damage_type) || d.damage_type;
  if (elemName) attrs.push({ '@type': 'PropertyValue', name: '属性', value: elemName });
  const camp = clean(d.chara_info && d.chara_info.camp);
  if (camp) attrs.push({ '@type': 'PropertyValue', name: '阵营', value: camp });
  if (d.sp_need != null) attrs.push({ '@type': 'PropertyValue', name: ui('catalog.charge.ultEnergy', '终结技能量'), value: String(d.sp_need) });

  const character = {
    '@type': 'Person',
    '@id': `${SITE_ORIGIN}${route}#character`,
    name,
    additionalType: 'https://schema.org/VideoGameSeries',
    description,
    inLanguage: ldLang(),
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
        dateModified: ctx.syncedAt,
        inLanguage: ldLang(),
        isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: `${SITE_ORIGIN}/` },
        mainEntity: { '@id': `${SITE_ORIGIN}${route}#character` },
      },
      character,
      breadcrumbNode(crumbs),
    ],
  };
}

function serializeLd(ld) {
  return JSON.stringify(ld).replace(/</g, '\\u003c');
}


function upsertMeta(html, attr, value, content) {
  const re = new RegExp(`<meta\\s+[^>]*${attr}="${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>`);
  const tag = `<meta ${attr}="${value}" content="${esc(content)}">`;
  if (re.test(html)) return html.replace(re, tag);
  return html.replace('</head>', `${tag}</head>`);
}

function prefixLdUrls(node, prefix, inWebSite = false) {
  if (typeof node === 'string') {
    if (inWebSite || !node.startsWith(SITE_ORIGIN)) return node;
    const path = node.slice(SITE_ORIGIN.length);
    if (path === '') return node;
    return SITE_ORIGIN + prefix + (path === '/' ? '' : path);
  }
  if (Array.isArray(node)) return node.map((v) => prefixLdUrls(v, prefix, inWebSite));
  if (node && typeof node === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(node)) out[k] = prefixLdUrls(v, prefix, inWebSite || k === 'isPartOf');
    return out;
  }
  return node;
}

function renderSnapshot(template, page) {
  const canonical = SITE_ORIGIN + page.route;
  let html = template;

  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(page.title)}</title>`);
  html = upsertMeta(html, 'name', 'description', page.description);
  html = upsertMeta(html, 'property', 'og:title', page.title);
  html = upsertMeta(html, 'property', 'og:description', page.description);
  html = upsertMeta(html, 'property', 'og:url', canonical);
  html = upsertMeta(html, 'property', 'og:image', OG_IMAGE);
  html = upsertMeta(html, 'property', 'og:locale', ogLocale(page.lang));
  html = upsertMeta(html, 'name', 'twitter:card', 'summary_large_image');
  html = upsertMeta(html, 'name', 'twitter:title', page.title);
  html = upsertMeta(html, 'name', 'twitter:description', page.description);
  html = upsertMeta(html, 'name', 'twitter:image', OG_IMAGE);

  if (page.lang) html = html.replace(/<html([^>]*)\slang="[^"]*"/, `<html$1 lang="${esc(page.lang)}"`);
  if (page.alternates) {
    const links = page.alternates
      .map((a) => `<link rel="alternate" hreflang="${esc(a.hreflang)}" href="${esc(a.href)}">`)
      .join('');
    html = html.replace('</head>', `${links}</head>`);
  }

  html = html.replace('<head>', '<head><script>document.documentElement.classList.add(\'js\')</script>');
  const headTail = `<style>html.js #app > .nk-snapshot{display:none}</style>`
    + `<link rel="canonical" href="${esc(canonical)}">`
    + `<script type="application/ld+json">${serializeLd(page.ld)}</script>`;
  html = html.replace('</head>', `${headTail}</head>`);

  const appRe = /<div id="app">\s*<\/div>/;
  if (!appRe.test(html)) {
    fail('dist/index.html 的 #app 容器不是空 div（模板结构变化），无法注入快照正文');
  }
  html = html.replace(appRe, `<div id="app">${page.body}</div>`);
  return html;
}

function renderSitemap(ctx, pages) {
  const lastmod = /^\d{4}-\d{2}-\d{2}/.test(ctx.syncedAt || '')
    ? `<lastmod>${esc(ctx.syncedAt)}</lastmod>` : '';
  const urls = pages
    .map((p) => `<url><loc>${SITE_ORIGIN}${p.route}</loc>${lastmod}</url>`)
    .join('');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>\n`;
}


function loadContext() {
  const version = readJson('version.json');
  SNAPSHOT_SYNCED_AT = clean(version.synced_at) || '未知';
  return {
    syncedAt: SNAPSHOT_SYNCED_AT,
    versionLabel: clean(version.version_label),
    pathNames: new Map(readJson('paths.json').map((p) => [p.id, p.name])),
    elemNames: new Map(readJson('elements.json').map((e) => [e.id, e.name])),
  };
}

function pickRelease(list, label) {
  const target = String(label || '').trim();
  if (!target) return [];
  return list.filter((item) => String(item.release_version ?? '').trim() === target);
}

function pickSeasonNew(list) {
  return list.filter((item) => item.is_season_new === true);
}

function makePage(family, o) {
  return { family, route: o.route, file: o.file, title: o.title, description: o.description, ld: o.ld, body: o.body };
}


const STAT_ROUTES = ['/character', '/lightcone', '/relic', '/item', '/monster', '/achievement'];

function homeStatsBlock(pages) {
  const rows = [];
  for (const route of STAT_ROUTES) {
    const page = pages.find((p) => p.route === route);
    if (!page) continue;
    const n = (page.body.match(/nk-snapshot__entry/g) || []).length;
    if (!n) continue;
    rows.push(`<li class="nk-snapshot__stat"><a href="${esc(route)}">${esc(CATALOG_TITLE[route]())}</a>`
      + `<span class="nk-snapshot__stat-n">${n}</span></li>`);
  }
  if (rows.length < 5) {
    fail(`首页站点统计块只取到 ${rows.length} 个目录（期望 ≥5）：目录页正文缺 nk-snapshot__entry 或路由未构建`);
  }
  return `<ul class="nk-snapshot__stats">${rows.join('')}</ul>`;
}

function injectHomeStats(page, block) {
  const anchor = '<p class="nk-snapshot__meta">';
  const i = page.body.lastIndexOf(anchor);
  if (i < 0) fail('首页快照正文缺少页脚锚点，无法注入站点统计块');
  page.body = page.body.slice(0, i) + block + page.body.slice(i);
}

function homePages(ctx) {
  const chars = readJson('characters.json').filter((c) => c.name);
  const cones = readJson('light_cones.json').filter((c) => c.name);
  const relics = readJson('relics.json').filter((r) => r.name);
  const title = titleTail();
  const groups = [
    {
      label: ui('catalog.character.title', '角色'),
      listHref: '/character',
      rows: pickRelease(chars, ctx.versionLabel).sort((a, b) => Number(b.id) - Number(a.id)),
      href: (c) => `/character/${c.id}`,
      meta: (c) => `${starText(c.rarity)} · ${ctx.elemNames.get(c.element) || c.element} · ${ctx.pathNames.get(c.path) || c.path}`,
    },
    {
      label: ui('catalog.lightcone.title', '光锥'),
      listHref: '/lightcone',
      rows: pickRelease(cones, ctx.versionLabel).sort((a, b) => Number(b.id) - Number(a.id)),
      href: (c) => `/lightcone/${c.id}`,
      meta: (c) => `${starText(c.rarity)} · ${ctx.pathNames.get(c.path) || c.path}`,
    },
    {
      label: ui('nav.relic', '遗器'),
      listHref: '/relic',
      rows: pickRelease(relics, ctx.versionLabel).sort((a, b) => Number(b.id) - Number(a.id)),
      href: (r) => `/relic/${r.id}`,
      meta: (r) => (Array.isArray(r.require_num) && r.require_num.includes(4)
        ? `${ui('relic.setType.cavern', '隧洞遗器')} · ${uiT('relic.setPieces', '{n}件套', { n: 4 })}`
        : `${ui('relic.setType.planar', '位面饰品')} · ${uiT('relic.setPieces', '{n}件套', { n: 2 })}`),
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
  const versionText = ctx.versionLabel
    ? `${ctx.versionLabel} ${ui('home.releaseTitleNoVersion', '版本上新')}`
    : ui('home.releaseTitleNoVersion', '版本上新');
  const summaryPlain = uiT('snapshot.sum.home', '{site}首页：{extra}，收录本版本新增的角色、光锥与遗器条目。', { site: gameName(), extra: versionText });
  const body = catalogBody(ctx, {
    crumbs: crumbHtml([[ui('nav.home', '首页'), '/'], [ui('home.releaseTitleNoVersion', '版本上新'), null]]),
    h1: SITE_NAME,
    summary: esc(summaryPlain),
    items: [],
    sections: sections.length
      ? sections
      : [{ title: ui('home.releaseTitleNoVersion', '版本上新'), html: `<p>本版本暂无新增条目。</p>` }],
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


function characterPages(ctx) {
  const list = readJson('characters.json').filter((c) => c.name);
  const ordered = [...list].sort((a, b) => {
    const at = Number(a.id) >= 8000 ? 1 : 0;
    const bt = Number(b.id) >= 8000 ? 1 : 0;
    if (at !== bt) return at - bt;
    return Number(b.id) - Number(a.id);
  });
  const links = ordered.map((c) => ({ name: charName(c), href: `/character/${c.id}` }));
  const title = `${CATALOG_TITLE['/character']()} - ${titleTail()}`;
  const summaryPlain = uiT('snapshot.sum.character', '{site}角色图鉴：共 {n} 名角色，含稀有度、命途、属性与技能档案。', { site: gameName(), n: ordered.length });
  const items = ordered.map((c) => ({
    name: charName(c),
    href: `/character/${c.id}`,
    meta: `${starText(c.rarity)} · ${ctx.elemNames.get(c.element) || c.element} · ${ctx.pathNames.get(c.path) || c.path}`,
  }));
  const pages = [makePage('character-list', {
    route: '/character',
    file: 'character.html',
    title,
    description: cut(summaryPlain, 150),
    ld: ldCollection('/character', CATALOG_TITLE['/character'](), cut(summaryPlain, 150), items),
    body: catalogBody(ctx, {
      crumbs: crumbHtml([[ui('nav.home', '首页'), '/'], [CATALOG_TITLE['/character'](), null]]),
      h1: CATALOG_TITLE['/character'](),
      summary: esc(summaryPlain),
      items,
    }),
  })];

  ordered.forEach((entry, idx) => {
    const d = readJson(`characters/${entry.id}.json`);
    const name = charDetailName(entry, d.name);
    const route = `/character/${entry.id}`;
    const stats = d.stats || {};
    const statKey = stats['6'] ? '6' : Object.keys(stats).map(Number).filter((k) => !Number.isNaN(k)).sort((a, b) => b - a)[0];
    const st = statKey != null ? stats[String(statKey)] : null;
    const stories = (d.chara_info && d.chara_info.stories) || {};
    const firstStory = Object.keys(stories).sort((a, b) => Number(a) - Number(b)).map((k) => stories[k]).find((s) => clean(s));
    const sourceSummary = clean(firstStory);
    const rarityNum = /(\d+)\s*$/.exec(String(d.rarity || ''))?.[1];
    const description = sourceSummary
      ? cut(sourceSummary, 150)
      : cut(factMeta(
        [starText(rarityNum), ctx.elemNames.get(d.damage_type) || d.damage_type, ctx.pathNames.get(d.base_type) || d.base_type],
        CATALOG_TITLE['/character'](),
        name,
      ), 150);

    const facts = [
      [ui('catalog.filter.rarity', '稀有度'), esc(starText(/(\d+)\s*$/.exec(String(d.rarity || ''))?.[1]))],
      [ui('catalog.filter.path', '命途'), esc(ctx.pathNames.get(d.base_type) || d.base_type || '')],
      ['属性', esc(ctx.elemNames.get(d.damage_type) || d.damage_type || '')],
      ['阵营', txt(d.chara_info && d.chara_info.camp, null, 200)],
      [ui('catalog.charge.ultEnergy', '终结技能量'), d.sp_need != null ? esc(String(d.sp_need)) : ''],
      ['配音（中文）', txt(d.chara_info && d.chara_info.va && d.chara_info.va.chinese, null, 100)],
    ];
    if (st) {
      facts.push(
        ['生命（满级）', esc(String(Math.round(st.hp_base + st.hp_add * (MAX_CHAR_LEVEL - 1))))],
        ['攻击（满级）', esc(String(Math.round(st.attack_base + st.attack_add * (MAX_CHAR_LEVEL - 1))))],
        ['防御（满级）', esc(String(Math.round(st.defence_base + st.defence_add * (MAX_CHAR_LEVEL - 1))))],
        ['速度', esc(String(st.speed_base))],
        [ui('prop.CriticalChanceBase', '暴击率'), st.critical_chance != null ? esc(`${(st.critical_chance * 100).toFixed(1)}%`) : ''],
        [ui('prop.CriticalDamageBase', '暴击伤害'), st.critical_damage != null ? esc(`${(st.critical_damage * 100).toFixed(1)}%`) : ''],
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
      crumbs: crumbHtml([[ui('nav.home', '首页'), '/'], [CATALOG_TITLE['/character'](), '/character'], [name, null]]),
      h1: name,
      summary: sourceSummary ? esc(cut(sourceSummary, 200)) : '',
      facts,
      sections: [
        { title: '技能', html: skillHtml ? `<ul class="nk-snapshot__blocks">${skillHtml}</ul>` : '' },
        { title: ui('char.sec.eidolons', '星魂'), html: rankHtml ? `<ul class="nk-snapshot__blocks">${rankHtml}</ul>` : '' },
        { title: '角色档案', html: storyHtml ? `<ul class="nk-snapshot__blocks">${storyHtml}</ul>` : '' },
      ],
      links: siblingsOf(links, idx),
      listLabel: '同图鉴角色',
    });

    pages.push(makePage('character-detail', {
      route,
      file: `character/${entry.id}.html`,
      title: `${name} - ${titleTail()}`,
      description,
      ld: ldCharacter(route, name, description,
        [[ui('nav.home', '首页'), '/'], [CATALOG_TITLE['/character'](), '/character'], [name, route]], ctx, d),
      body,
    }));
  });
  return pages;
}


function lightconePages(ctx) {
  const list = readJson('light_cones.json').filter((c) => c.name);
  const ordered = [...list].sort((a, b) => {
    const aH = Number(a.id) >= 24000 ? 1 : 0;
    const bH = Number(b.id) >= 24000 ? 1 : 0;
    if (aH !== bH) return aH - bH;
    return Number(b.id) - Number(a.id);
  });
  const links = ordered.map((c) => ({ name: c.name, href: `/lightcone/${c.id}` }));
  const charNames = new Map(
    readJson('characters.json').filter((c) => c.name).map((c) => [String(c.id), clean(charName(c))]),
  );
  const summaryPlain = uiT('snapshot.sum.lightcone', '{site}光锥图鉴：共 {n} 把光锥，含稀有度、命途、技能效果与晋阶属性。', { site: gameName(), n: ordered.length });
  const items = ordered.map((c) => ({
    name: c.name,
    href: `/lightcone/${c.id}`,
    meta: [starText(c.rarity), ctx.pathNames.get(c.path) || c.path, txtSafe(c.skill_name, null, 60)].filter(Boolean).join(' · '),
  }));
  const pages = [makePage('lightcone-list', {
    route: '/lightcone',
    file: 'lightcone.html',
    title: `${CATALOG_TITLE['/lightcone']()} - ${titleTail()}`,
    description: cut(summaryPlain, 150),
    ld: ldCollection('/lightcone', CATALOG_TITLE['/lightcone'](), cut(summaryPlain, 150), items),
    body: catalogBody(ctx, {
      crumbs: crumbHtml([[ui('nav.home', '首页'), '/'], [CATALOG_TITLE['/lightcone'](), null]]),
      h1: CATALOG_TITLE['/lightcone'](),
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
    const sourceSummary = clean(d.desc) || clean(d.story);
    const description = sourceSummary
      ? cut(sourceSummary, 150)
      : cut(factMeta([starText(d.rarity), ctx.pathNames.get(d.path) || d.path], CATALOG_TITLE['/lightcone'](), name), 150);
    const facts = [
      [ui('catalog.filter.rarity', '稀有度'), esc(starText(d.rarity))],
      [ui('catalog.filter.path', '命途'), esc(ctx.pathNames.get(d.path) || d.path || '')],
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
      crumbs: crumbHtml([[ui('nav.home', '首页'), '/'], [CATALOG_TITLE['/lightcone'](), '/lightcone'], [name, null]]),
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
          title: ui('lc.sec.recommended', '适配角色'),
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
      title: `${name} - ${titleTail()}`,
      description,
      ld: ldDataPage(route, name, description,
        [[ui('nav.home', '首页'), '/'], [CATALOG_TITLE['/lightcone'](), '/lightcone'], [name, route]], ctx),
      body,
    }));
  });
  return pages;
}


function relicPages(ctx) {
  const list = readJson('relics.json').filter((r) => r.name);
  const ordered = [...list].sort((a, b) => Number(b.id) - Number(a.id));
  const links = ordered.map((r) => ({ name: r.name, href: `/relic/${r.id}` }));
  const setTag = (r) => (Array.isArray(r.require_num) && r.require_num.includes(4)
    ? `${ui('relic.setType.cavern', '隧洞遗器')} · ${uiT('relic.setPieces', '{n}件套', { n: 4 })}`
    : `${ui('relic.setType.planar', '位面饰品')} · ${uiT('relic.setPieces', '{n}件套', { n: 2 })}`);
  const summaryPlain = uiT('snapshot.sum.relic', '{site}遗器图鉴：共 {n} 套遗器，含套装效果与部位信息。', { site: gameName(), n: ordered.length });
  const items = ordered.map((r) => ({ name: r.name, href: `/relic/${r.id}`, meta: esc(setTag(r)) }));
  const pages = [makePage('relic-list', {
    route: '/relic',
    file: 'relic.html',
    title: `${CATALOG_TITLE['/relic']()} - ${titleTail()}`,
    description: cut(summaryPlain, 150),
    ld: ldCollection('/relic', CATALOG_TITLE['/relic'](), cut(summaryPlain, 150), items),
    body: catalogBody(ctx, {
      crumbs: crumbHtml([[ui('nav.home', '首页'), '/'], [CATALOG_TITLE['/relic'](), null]]),
      h1: CATALOG_TITLE['/relic'](),
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
    const effectTexts = reqNums.map((n) => plain(descriptions[String(n)], params[String(n)]));
    const firstEffect = effectTexts.find(Boolean);
    const sourceSummary = firstEffect || '';
    const setTypeText = Array.isArray(entry.require_num) && entry.require_num.includes(4) ? ui('relic.setType.cavern', '隧洞遗器') : ui('relic.setType.planar', '位面饰品');
    const description = sourceSummary
      ? cut(sourceSummary, 150)
      : cut(factMeta([setTypeText], CATALOG_TITLE['/relic'](), name), 150);
    const body = detailBody(ctx, {
      crumbs: crumbHtml([[ui('nav.home', '首页'), '/'], [CATALOG_TITLE['/relic'](), '/relic'], [name, null]]),
      h1: name,
      summary: sourceSummary ? esc(cut(sourceSummary, 200)) : '',
      facts: [
        [ui('catalog.filter.setType', '套装类型'), esc(Array.isArray(entry.require_num) && entry.require_num.includes(4) ? ui('relic.setType.cavern', '隧洞遗器') : ui('relic.setType.planar', '位面饰品'))],
        ['套装效果件数', esc(reqNums.join(' / '))],
        ['部位数', esc(String((entry.pieces || []).length))],
        ['上线版本', txt(entry.release_version, null, 40)],
      ],
      sections: [
        { title: ui('relic.sec.effect', '套装效果'), html: effectHtml ? `<ul class="nk-snapshot__blocks">${effectHtml}</ul>` : '' },
        { title: ui('relic.parts', '部位'), html: pieceHtml ? `<ul class="nk-snapshot__blocks">${pieceHtml}</ul>` : '' },
      ],
      links: siblingsOf(links, idx),
      listLabel: '同图鉴遗器',
    });
    pages.push(makePage('relic-detail', {
      route,
      file: `relic/${entry.id}.html`,
      title: `${name} - ${titleTail()}`,
      description,
      ld: ldDataPage(route, name, description,
        [[ui('nav.home', '首页'), '/'], [CATALOG_TITLE['/relic'](), '/relic'], [name, route]], ctx),
      body,
    }));
  });
  return pages;
}


function itemPages(ctx) {
  const list = readJson('items.json').filter((i) => i.name);
  const rarityOrder = { 5: 0, 4: 1, 3: 2, 2: 3, 1: 4 };
  const ordered = [...list].sort((a, b) => (rarityOrder[a.rarity] ?? 5) - (rarityOrder[b.rarity] ?? 5));
  const summaryPlain = uiT('snapshot.sum.item', '{site}物品图鉴：共 {n} 件物品，含类型、稀有度与物品描述。', { site: gameName(), n: ordered.length });
  const items = ordered.map((i) => ({
    name: i.name,
    href: null,
    meta: `${esc(i.main_type ? itemMainTypeLabel(i.main_type) : '')} · ${esc(starText(i.rarity))}`,
    desc: [txtSafe(i.desc, null, 400), txtSafe(i.bg_desc, null, SNAPSHOT_TEXT_LIMIT_ENTRY)].filter(Boolean).join(' '),
  }));
  return [makePage('item-list', {
    route: '/item',
    file: 'item.html',
    title: `${CATALOG_TITLE['/item']()} - ${titleTail()}`,
    description: cut(summaryPlain, 150),
    ld: ldCollection('/item', CATALOG_TITLE['/item'](), cut(summaryPlain, 150), items),
    body: catalogBody(ctx, {
      crumbs: crumbHtml([[ui('nav.home', '首页'), '/'], [CATALOG_TITLE['/item'](), null]]),
      h1: CATALOG_TITLE['/item'](),
      summary: esc(summaryPlain),
      items: [],
      sections: groupSections(ordered, (i) => (i.main_type ? itemMainTypeLabel(i.main_type) : ''), 'items.json 的 main_type', items),
    }),
  })];
}


function monsterPages(ctx) {
  const list = readJson('monsters.json').filter((m) => m.name);
  const links = list.map((m) => ({ name: m.name, href: `/monster/${m.id}` }));
  const summaryPlain = uiT('snapshot.sum.monster', '{site}敌对物种图鉴：共 {n} 个条目，含分类、弱点、抗性与技能。', { site: gameName(), n: list.length });
  const items = list.map((m) => ({
    name: m.name,
    href: `/monster/${m.id}`,
    meta: [
      m.type ? ui(MON_TYPE[m.type] ?? '', m.type) : '',
      (m.weak || []).map((e) => ctx.elemNames.get(e) || e).join('/'),
      m.camp || '',
    ].filter(Boolean).map(esc).join(' · '),
  }));
  const pages = [makePage('monster-list', {
    route: '/monster',
    file: 'monster.html',
    title: `${CATALOG_TITLE['/monster']()} - ${titleTail()}`,
    description: cut(summaryPlain, 150),
    ld: ldCollection('/monster', CATALOG_TITLE['/monster'](), cut(summaryPlain, 150), items),
    body: catalogBody(ctx, {
      crumbs: crumbHtml([[ui('nav.home', '首页'), '/'], [CATALOG_TITLE['/monster'](), null]]),
      h1: CATALOG_TITLE['/monster'](),
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
    const sourceSummary = clean(d.intro);
    const description = sourceSummary
      ? cut(sourceSummary, 150)
      : cut(factMeta([monRankLabel(d.rank), d.camp], CATALOG_TITLE['/monster'](), name), 150);
    const skillHtml = (d.skills || [])
      .filter((s) => s && s.name)
      .map((s) => {
        const metaParts = [s.tag, s.type_desc, s.damage_type ? (ctx.elemNames.get(s.damage_type) || s.damage_type) : ''].filter(Boolean);
        const fx = (s.extra_effects || [])
          .filter((f) => f && f.name)
          .map((f) => `<p>附带效果 ${txt(f.name, null, 60)}${f.desc ? `：${txt(f.desc, f.param_list)}` : ''}</p>`)
          .join('');
        const rawParams = Array.isArray(s.param_list) && s.param_list.length
          ? `<p>参数 ${s.param_list.map((v) => esc(String(v))).join(' / ')}</p>`
          : '';
        return `<li><span>${txt(s.name, null, 100)}${metaParts.length ? `（${txt(metaParts.join(' · '), null, 60)}）` : ''}</span><p>${txt(s.desc, s.param_list)}</p>${rawParams}${fx}</li>`;
      })
      .join('');
    const facts = [
      [ui('catalog.filter.category', '分类'), txt(monRankLabel(d.rank), null, 40)],
      ['阵营', txt(d.camp, null, 60)],
      ['图鉴编号', esc(String(d.id))],
      ['韧性', d.stance != null ? esc(String(d.stance)) : ''],
      [ui('mob.resist.stance', '韧性弱点'), esc(weak.join(' / '))],
      [ui('mob.resist.damage', '伤害抗性'), esc(resist.join(' / '))],
      ['生命（基准值）', d.stats?.hp != null ? esc(String(d.stats.hp)) : ''],
      ['攻击（基准值）', d.stats?.atk != null ? esc(String(d.stats.atk)) : ''],
      ['防御（基准值）', d.stats?.def != null ? esc(String(d.stats.def)) : ''],
      ['速度（基准值）', d.stats?.speed != null ? esc(String(d.stats.speed)) : ''],
      [ui('mob.event.k', '活动出处'), d.event
        ? txt(`${d.event.name}（${d.event.count} 个活动关卡，等级 ${eventLevelRange(d.event.levels)}${d.event.tabs.length ? `；页签 ${d.event.tabs.join('/')}` : ''}）`, null, 160)
        : ''],
    ];
    if (d.invaded) {
      const invadedLevels = (d.invaded.invasion_ids || []).filter((n) => n != null);
      facts.push(['受『贪饕』侵蚀', [
        invadedLevels.length ? uiT('mob.levelTag', '等级 {n}', { n: esc(invadedLevels.join(' / ')) }) : '',
        `<a href="/voracity">${esc(voracityTitle())}</a>`,
      ].filter(Boolean).join(' · ')]);
    }
    if (d.appearances && d.appearances.total) {
      const groups = (d.appearances.groups || []).filter((g) => g.count > 0);
      const modes = groups
        .slice(0, 4)
        .map((g) => `${ui(`mob.dom.${g.key}`, g.key)} ${g.count}`)
        .join(' / ');
      const more = groups.length > 4 ? ' …' : '';
      const samples = groups
        .flatMap((g) => (g.samples || []).map((s) => (s.activity ? `${s.activity} · ${s.name}` : s.name)))
        .filter(Boolean)
        .slice(0, 2);
      const parts = [`${modes}${more}`, samples.length ? `如 ${esc(samples.join(' / '))}` : ''].filter(Boolean);
      facts.push([ui('mob.sec.appear', '出没关卡'), `${d.appearances.total} 个${parts.length ? `（${esc(parts.join('；'))}）` : ''}`]);
    }
    if (Array.isArray(d.drops) && d.drops.length) {
      const base = d.drops.find((t) => t.world_level == null) || d.drops[0];
      const names = (base.items || []).map((i) => i.name).filter(Boolean).join(' / ');
      const tiers = d.drops.length > 1 ? uiT('mob.dropsTiers', '（共 {n} 档均衡等级）', { n: d.drops.length }) : '';
      if (names) facts.push([ui('mob.sec.drop', '掉落'), `${esc(names)}${esc(tiers)}`]);
    }
    const statusHtml = (d.statuses || [])
      .filter((s) => s && s.name)
      .map((s) => {
        const statusLabel = MON_STATUS_TYPE[s.type] ? ui(MON_STATUS_TYPE[s.type], '其他') : (s.type || '其他');
        const meta = `${statusLabel}${s.dispel ? ' · 可驱散' : ''}`;
      })
      .join('');
    const atlasForms = entry.atlas_group == null
      ? []
      : list.filter((m) => m.atlas_group === entry.atlas_group)
        .sort((a, b) => Number(a.id) - Number(b.id));
    const atlasOthers = atlasForms.filter((m) => `${m.name}\u0000${(m.icon || '').split('/').pop()?.replace(/\.png$/i, '') || ''}`
      !== `${name}\u0000${(entry.icon || '').split('/').pop()?.replace(/\.png$/i, '') || ''}`);
    const atlasHtml = atlasOthers.length
      ? `<ul class="nk-snapshot__list">${atlasOthers.map((m) => `<li><a href="/monster/${m.id}">${txt(m.name, null, 80)}</a></li>`).join('')}</ul>`
      : '';
    const body = detailBody(ctx, {
      crumbs: crumbHtml([[ui('nav.home', '首页'), '/'], [CATALOG_TITLE['/monster'](), '/monster'], [name, null]]),
      h1: name,
      summary: sourceSummary ? esc(cut(sourceSummary, 200)) : '',
      facts,
      sections: [
        { title: ui('mob.sec.record', '图鉴记录'), html: sourceSummary ? `<p>${txt(d.intro, null, SNAPSHOT_TEXT_LIMIT_DETAIL)}</p>` : '' },
        { title: '技能', html: skillHtml ? `<ul class="nk-snapshot__blocks">${skillHtml}</ul>` : '' },
        { title: ui('mob.sec.status', '状态词条'), html: statusHtml ? `<ul class="nk-snapshot__blocks">${statusHtml}</ul>` : '' },
        { title: atlasHtml ? uiT('mob.atlasForms', '同图鉴其他形态（本族共 {n} 个形态）', { n: atlasForms.length }) : '', html: atlasHtml },
      ],
      links: siblingsOf(links, idx),
      listLabel: '同图鉴敌对物种',
    });
    pages.push(makePage('monster-detail', {
      route,
      file: `monster/${entry.id}.html`,
      title: `${name} - ${titleTail()}`,
      description,
      ld: ldDataPage(route, name, description,
        [[ui('nav.home', '首页'), '/'], [CATALOG_TITLE['/monster'](), '/monster'], [name, route]], ctx),
      body,
    }));
  });
  return pages;
}


const SEASON_TZ_OFFSET = '+08:00';
const SEASON_TZ_MS = 8 * 3600 * 1000;
const BARE_SEASON_TIME = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/;

function seasonTimeMs(s) {
  if (!s) return null;
  const raw = String(s).trim();
  if (!raw) return null;
  const m = BARE_SEASON_TIME.exec(raw);
  const iso = m
    ? `${m[1]}-${m[2]}-${m[3]}T${m[4] ?? '00'}:${m[5] ?? '00'}:${m[6] ?? '00'}${SEASON_TZ_OFFSET}`
    : raw;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? null : t;
}

function seasonDateParts(s) {
  if (!s) return null;
  const raw = String(s).trim();
  const m = BARE_SEASON_TIME.exec(raw);
  if (m) return `${m[1]}.${m[2]}.${m[3]}`;
  const t = seasonTimeMs(raw);
  if (t == null) return null;
  const d = new Date(t + SEASON_TZ_MS);
  return `${d.getUTCFullYear()}.${String(d.getUTCMonth() + 1).padStart(2, '0')}.${String(d.getUTCDate()).padStart(2, '0')}`;
}

function dateRange(entry) {
  const start = seasonDateParts(entry.live_begin);
  const end = seasonDateParts(entry.live_end);
  if (start && end) return `${start} – ${end}`;
  if (start) return `${start} –`;
  if (end) return `– ${end}`;
  return '';
}

function seasonStatus(entry) {
  const start = seasonTimeMs(entry.live_begin) ?? seasonTimeMs(entry.begin);
  const end = seasonTimeMs(entry.live_end) ?? seasonTimeMs(entry.end);
  const now = Date.now();
  if (start != null && now < start) return 'upcoming';
  if (end != null && now > end) return 'ended';
  if (start != null || end != null) return 'live';
  return 'unknown';
}

const seasonStatusLabel = (status) => ui(`endgame.status.${status}`, status);

function endgamePages(ctx) {
  const catalogs = ENDGAME_MODES.map((m) => ({ mode: m, db: readJson(m.file) }));
  const fullLists = new Map(ENDGAME_MODES.map((m) => [m.key, readJson(m.list)]));
  const all = [];
  for (const { mode, db } of catalogs) {
    for (const [id, entry] of Object.entries(db)) {
      if (!entry || !clean(entry.zh)) continue;
      all.push({ mode, id, entry, name: clean(entry.zh) });
    }
  }
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

  const summaryPlain = uiT('snapshot.endgameSummary', '{site}终局内容：{modes}四模式赛季，共 {n} 期。', {
    site: gameName(),
    modes: ENDGAME_MODES.map((m) => m.label()).join('、'),
    n: all.length,
  });
  const items = all.map((s) => ({
    name: s.name,
    href: `/endgame/${s.mode.key}/${s.id}`,
    meta: [esc(s.mode.label()), esc(dateRange(s.entry)), esc(uiT('snapshot.enemyCount', '{n} 名敌方', { n: (s.entry.monsters || []).length }, (s.entry.monsters || []).length))].filter(Boolean).join(' · '),
  }));
  const pages = [makePage('endgame-list', {
    route: '/endgame',    file: 'endgame.html',
    title: `${CATALOG_TITLE['/endgame']()} - ${titleTail()}`,
    description: cut(summaryPlain, 150),
    ld: ldCollection('/endgame', CATALOG_TITLE['/endgame'](), cut(summaryPlain, 150), items),
    body: catalogBody(ctx, {
      crumbs: crumbHtml([[ui('nav.home', '首页'), '/'], [CATALOG_TITLE['/endgame'](), null]]),
      h1: CATALOG_TITLE['/endgame'](),
      summary: esc(summaryPlain),
      items,
    }),
  })];

  const guide = readJson('endgame_guide.json');
  const MODE_CHOICE_LABEL = {
    fixed: ['egm.choice.fixed', '固定生效，不可选择'],
    per_team: ['egm.choice.perTeam', '每支队伍选 1 条'],
    per_stage: ['egm.choice.perStage', '每场战斗选 1 条'],
    per_king: ['egm.choice.perKing', '王棋挑战前选 1 条'],
  };
  const modeChoiceLabel = (t) => (MODE_CHOICE_LABEL[t]
    ? ui(MODE_CHOICE_LABEL[t][0], MODE_CHOICE_LABEL[t][1])
    : t);
  for (const { mode } of catalogs) {
    const modeOrdered = all.filter((s) => s.mode.key === mode.key);
    if (!modeOrdered.length) continue;
    const g = guide.modes?.[mode.key];
    const system = g?.system || null;
    const systemName = clean(system?.name) || ui('egm.sec.buffs', '赛季增益');
    const livePick = modeOrdered.find((s) => seasonStatus(s.entry) === 'live') || null;
    const current = livePick || modeOrdered[0];
    const currentStatus = seasonStatus(current.entry);
    const cur = current.entry;
    const curFull = (fullLists.get(mode.key) || {})[current.id] || cur;
    const floors = curFull.floor_details || [];
    const levelsFull = curFull.levels || [];
    const halfs = floors.length ? ((floors[0].stage1 ? 1 : 0) + (floors[0].stage2 ? 1 : 0)) : 0;
    const knights = levelsFull.filter((l) => l.kind === 'knight').length;
    const kings = levelsFull.filter((l) => l.kind === 'king').length;
    const withTargets = levelsFull.filter((l) => (l.targets || []).length).length;
    const ruleSections = (g?.sections || []).map((sec) => {
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
      .map((c) => ({ name: c.mode.label(), href: `/endgame/${c.mode.key}` }));
    const description = cut(
      factMeta([mode.label(), systemName, uiT('egm.seasonCount', '{n} 期赛季', { n: modeOrdered.length })], CATALOG_TITLE['/endgame'](), mode.label()), 150,
    );
    const route = `/endgame/${mode.key}`;
    pages.push(makePage('endgame-mode', {
      route,
      file: `endgame/${mode.key}.html`,
      title: `${mode.label()} - ${titleTail()}`,
      description,
      ld: ldDataPage(route, mode.label(), description,
        [[ui('nav.home', '首页'), '/'], [CATALOG_TITLE['/endgame'](), '/endgame'], [mode.label(), route]], ctx),
      body: detailBody(ctx, {
        crumbs: crumbHtml([[ui('nav.home', '首页'), '/'], [CATALOG_TITLE['/endgame'](), '/endgame'], [mode.label(), null]]),
        h1: mode.label(),
        summary: '',
        facts: [
          [
            livePick ? ui('egm.currentSeason', '当期赛季') : ui('egm.latestSeason', '最新赛季'),
            !livePick && currentStatus !== 'unknown'
              ? esc(uiT('egm.latestSeasonWith', '最新赛季（{status}）', { status: seasonStatusLabel(currentStatus) }))
              : esc(current.name),
          ],
          [ui('egm.stat.floors', '关卡层级'), floors.length ? esc(uiT('egm.value.floors', '{n} 层', { n: floors.length }, floors.length)) : ''],
          [ui('egm.stat.halfs', '每层场次'), halfs ? esc(uiT('egm.value.halfs', '{n} 场', { n: halfs }, halfs)) : ''],
          [ui('egm.stat.levels', '关卡组成'), levelsFull.length ? esc(uiT('vor.stageCount', '{n} 关', { n: levelsFull.length }, levelsFull.length)) : ''],
          [ui('egm.stat.knights', '骑士试炼'), knights ? esc(uiT('vor.stageCount', '{n} 关', { n: knights }, knights)) : ''],
          [ui('egm.stat.kings', '王棋关卡'), kings ? esc(uiT('vor.stageCount', '{n} 关', { n: kings }, kings)) : ''],
          [ui('egm.stat.targets', '设挑战目标'), withTargets ? esc(uiT('vor.stageCount', '{n} 关', { n: withTargets }, withTargets)) : ''],
          [ui('egm.stat.countdown', '回合上限'), curFull.countdown ? esc(uiT('egm.value.countdown', '{n} 轮', { n: curFull.countdown }, curFull.countdown)) : ''],
          [ui('egm.stat.scoreCap', '分数上限'), curFull.clear_score ? esc(String(curFull.clear_score)) : ''],
          [ui('egm.stat.tierce', '星启模式'), curFull.tierce ? ui('egm.value.tierceOn', '含') : ui('egm.value.tierceOff', '不含')],
          [ui('egm.fact.buffSystem', '增益体系'), esc(systemName)],
          [ui('egm.fact.perSeason', '每期条数'), system ? esc(String(system.count)) : ''],
          [ui('egm.fact.choiceMode', '选择方式'), system ? esc(modeChoiceLabel(system.choice)) : ''],
        ],
        sections: [
          ...ruleSections,
          { title: ui('egm.sec.seasons', '赛季列表'), html: linkList(seasonLinks) },
        ],
        links: otherModeLinks,
        listLabel: ui('egm.othersAria', '其它玩法'),
      }),
    }));
  }

  for (const { mode, db } of catalogs) {
    const keys = Object.keys(db).filter((k) => db[k] && clean(db[k].zh));
    const modeOrdered = all.filter((s) => s.mode.key === mode.key);
    const links = modeOrdered.map((s) => ({ name: s.name, href: `/endgame/${s.mode.key}/${s.id}` }));
    const guideMode = guide.modes?.[mode.key];
    const systemName = clean(guideMode?.system?.name) || ui('egm.sec.buffs', '赛季增益');
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
          const bits = [monRankLabel(m.rank), m.camp, (m.weak || []).map((e) => ctx.elemNames.get(e) || e).join('/')].filter(Boolean);
          return `<li><span>${txt(m.name, null, 100)}</span><p>${txt(bits.join(' · '), null, 120)}</p></li>`;
        })
        .join('');
      const description = cut(factMeta(
        [mode.label(), dateRange(entry), `${buffs.length} 项赛季增益`, uiT('snapshot.enemyCount', '{n} 名敌方', { n: monsters.length }, monsters.length)],
        CATALOG_TITLE['/endgame'](),
        name,
      ), 150);
      const body = detailBody(ctx, {
        crumbs: crumbHtml([[ui('nav.home', '首页'), '/'], [CATALOG_TITLE['/endgame'](), '/endgame'], [name, null]]),
        h1: name,
        summary: '',
        facts: [
          [ui('egm.fact.mode', '所属玩法'), esc(mode.label())],
          ['赛季编号', esc(String(id))],
          ['排期', esc(dateRange(entry))],
          ['赛季增益数', esc(String(buffs.length))],
          ['敌方条目数', esc(String(monsters.length))],
          ['常驻关卡', entry.permanent ? '是' : ''],
          ['测试期', entry.test ? '是' : ''],
        ],
        sections: [
          { title: systemName, html: buffs.length ? `<ul class="nk-snapshot__list">${buffs.map((b) => `<li>${txt(b, null, 100)}</li>`).join('')}</ul>` : '' },
          { title: '最终层阵容', html: finalM.length ? `<ul class="nk-snapshot__blocks">${finalM.map((m) => `<li><span>${txt(m.name, null, 100)}</span><p>${txt([monRankLabel(m.rank), m.camp].filter(Boolean).join(' · '), null, 80)}</p></li>`).join('')}</ul>` : '' },
          { title: ui('egd.enemySetup', '敌方配置'), html: monsterHtml ? `<ul class="nk-snapshot__blocks">${monsterHtml}</ul>` : '' },
          {
            title: '模式机制',
            html: [
              entry.tierce ? `<p>星启模式：关卡 ${txt(entry.tierce.id, null, 20)}${(entry.tierce.damage_types || []).length ? ` · 弱点 ${txt((entry.tierce.damage_types || []).map((e) => ctx.elemNames.get(e) || e).join('、'), null, 80)}` : ''}</p>` : '',
              (entry.levels || []).length ? `<p>异相仲裁关卡组成：${txt((entry.levels || []).map((l) => (l.kind === 'king' ? '王棋最终关' : '骑士试炼')).join(' · '), null, 120)}</p>` : '',
            ].join(''),
          },
        ],
        links: siblingsOf(links, idx < 0 ? 0 : idx),
        listLabel: `同模式赛季（${mode.label()}）`,
      });
      pages.push(makePage('endgame-detail', {
        route,
        file: `endgame/${mode.key}/${id}.html`,
        title: `${name} - ${mode.label()} - ${titleTail()}`,
        description,
        ld: ldDataPage(route, name, description,
          [[ui('nav.home', '首页'), '/'], [CATALOG_TITLE['/endgame'](), '/endgame'], [name, route]], ctx),
        body,
      }));
    }
  }
  return pages;
}


function achievementPages(ctx) {
  const list = readJson('achievements.json').filter((a) => a.title);
  const series = readJson('achievement_series.json');
  const seriesName = new Map(series.map((s) => [s.id, s.name]));
  const summaryPlain = uiT('snapshot.sum.achievement', '{site}成就图鉴：共 {n} 个成就，含系列、稀有度与达成要求。', { site: gameName(), n: list.length });
  const items = list.map((a) => ({
    name: a.title,
    href: null,
    meta: [esc(seriesName.get(a.series_id) || ''), esc(a.rarity ? achRarityLabel(a.rarity) : '')].filter(Boolean).join(' · '),
    desc: txtSafe(a.desc, null, SNAPSHOT_TEXT_LIMIT_ENTRY),
  }));
  return [makePage('achievement-list', {
    route: '/achievement',
    file: 'achievement.html',
    title: `${CATALOG_TITLE['/achievement']()} - ${titleTail()}`,
    description: cut(summaryPlain, 150),
    ld: ldCollection('/achievement', CATALOG_TITLE['/achievement'](), cut(summaryPlain, 150), items),
    body: catalogBody(ctx, {
      crumbs: crumbHtml([[ui('nav.home', '首页'), '/'], [CATALOG_TITLE['/achievement'](), null]]),
      h1: CATALOG_TITLE['/achievement'](),
      summary: esc(summaryPlain),
      items: [],
      sections: groupSections(list, (a) => seriesName.get(a.series_id) || '', 'achievements.json 的 series_id', items),
    }),
  })];
}


function currencyHubPages(ctx) {
  const roles = readJson('currency/role.json').roles || [];
  const traits = readJson('currency/traits.json').traits || [];
  const newRoles = pickSeasonNew(roles);
  const newTraits = pickSeasonNew(traits);
  const sections = [];
  const ldEntries = [];
  if (newRoles.length) {
    const items = newRoles.map((r) => ({ name: cwRoleName(r), href: `/currency/role/${r.id}`, meta: esc(uiT('snapshot.costLabel', '{n} 费', { n: r.rarity })) }));
    sections.push({ title: `${ui('catalog.character.title', '角色图鉴')}（${items.length}）`, html: linkList(items, true) + snapMore('/currency/role', ui('catalog.character.title', '角色图鉴')) });
    ldEntries.push(...items);
  }
  if (newTraits.length) {
    const items = newTraits.map((t) => ({ name: t.name, href: `/currency/trait/${t.id}`, meta: esc(cwCatLabel(t.cat)) }));
    sections.push({ title: `${ui('nav.cwTrait', '羁绊图鉴')}（${items.length}）`, html: linkList(items, true) + snapMore('/currency/trait', ui('nav.cwTrait', '羁绊图鉴')) });
    ldEntries.push(...items);
  }
  const summaryPlain = uiT('snapshot.sum.cwHub', '{site}货币战争模式枢纽：本赛季新增角色图鉴与羁绊图鉴条目。', { site: gameName() });
  const title = `${CATALOG_TITLE['/currency/role']().split(' · ')[0]} - ${titleTail()}`;
  const body = catalogBody(ctx, {
    crumbs: crumbHtml([[ui('nav.home', '首页'), '/'], [ui('catalog.currencyWar', '货币战争'), null]]),
    h1: ui('catalog.currencyWar', '货币战争'),
    summary: esc(summaryPlain),
    items: [],
    sections: sections.length ? sections : [{ title: ui('cwHub.releaseTitle', '本赛季新增'), html: '<p>本赛季暂无新增条目。</p>' }],
  });
  return [makePage('currency-hub', {
    route: '/currency',
    file: 'currency.html',
    title,
    description: cut(summaryPlain, 150),
    ld: ldCollection('/currency', ui('catalog.currencyWar', '货币战争'), cut(summaryPlain, 150), ldEntries),
    body,
  })];
}


function currencyRolePages(ctx) {
  const roles = readJson('currency/role.json').roles || [];
  const links = roles.map((r) => ({ name: cwRoleName(r), href: `/currency/role/${r.id}` }));
  const chargeText = (r) => (r.charge_type || []).map((c) => cwChargeLabel(c)).join(' · ');
  const summaryPlain = uiT('snapshot.sum.cwRole', '{site}货币战争角色图鉴：共 {n} 名可招募角色，含费用、前后台定位与羁绊。', { site: gameName(), n: roles.length });
  const items = roles.map((r) => ({
    name: cwRoleName(r),
    href: `/currency/role/${r.id}`,
    meta: [esc(uiT('snapshot.costLabel', '{n} 费', { n: r.rarity })), esc(cwFbLabel(r.front_back_type)), esc(chargeText(r))].filter(Boolean).join(' · '),
    desc: txtSafe((r.traits || []).map((t) => t.name).filter(Boolean).join('、'), null, 200),
  }));
  const pages = [makePage('currency-role-list', {
    route: '/currency/role',
    file: 'currency/role.html',
    title: `${CATALOG_TITLE['/currency/role']()} - ${titleTail()}`,
    description: cut(summaryPlain, 150),
    ld: ldCollection('/currency/role', CATALOG_TITLE['/currency/role'](), cut(summaryPlain, 150), items),
    body: catalogBody(ctx, {
      crumbs: crumbHtml([[ui('nav.home', '首页'), '/'], [ui('catalog.currencyWar', '货币战争'), '/currency'], [CATALOG_TITLE['/currency/role'](), null]]),
      h1: CATALOG_TITLE['/currency/role'](),
      summary: esc(summaryPlain),
      items,
    }),
  })];

  roles.forEach((entry, idx) => {
    const d = readJson(`currency/role/${entry.id}.json`);
    const name = cwRoleDetailName(entry, d.name);
    const route = `/currency/role/${entry.id}`;
    const starKeys = Object.keys(d.stars || {}).sort((a, b) => Number(a) - Number(b));
    const description = cut(factMeta(
      [`${d.rarity}费`, d.front_back_type ? (cwFbLabel(d.front_back_type)) : '', chargeText(d)],
      CATALOG_TITLE['/currency/role'](),
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
        return `<li><span>${esc(uiT('mob.levelTag', '等级 {n}', { n: eq.level }))}</span><p>${txt(eq.desc, eq.param_list)}${props ? `（${props}）` : ''}</p></li>`;
      })
      .join('');
    const body = detailBody(ctx, {
      crumbs: crumbHtml([[ui('nav.home', '首页'), '/'], [ui('catalog.currencyWar', '货币战争'), '/currency'], [CATALOG_TITLE['/currency/role'](), '/currency/role'], [name, null]]),
      h1: name,
      summary: '',
      facts: [
        [ui('catalog.filter.cost', '费用'), esc(`${d.rarity} 费`)],
        ['定位', txt(cwFbLabel(d.front_back_type), null, 40)],
        [ui('catalog.filter.chargeType', '充能类型'), txt(chargeText(d), null, 80)],
        [ui('catalog.filter.expert', '专家'), d.is_expert ? '是' : '否'],
        ['赛季', esc((d.season_ids || []).join(' / '))],
        ['羁绊数', esc(String((d.traits || []).length))],
        ['星魂数', esc(String((d.rank || []).length))],
      ],
      sections: [
        { title: ui('nav.cwTraitShort', '羁绊'), html: traitHtml ? `<ul class="nk-snapshot__blocks">${traitHtml}</ul>` : '' },
        { title: '星级与技能', html: starHtml ? `<ul class="nk-snapshot__blocks">${starHtml}</ul>` : '' },
        { title: ui('char.sec.eidolons', '星魂'), html: rankHtml ? `<ul class="nk-snapshot__blocks">${rankHtml}</ul>` : '' },
        { title: '专属装备', html: equipHtml ? `<ul class="nk-snapshot__blocks">${equipHtml}</ul>` : '' },
      ],
      links: siblingsOf(links, idx),
      listLabel: '同图鉴角色',
    });
    pages.push(makePage('currency-role-detail', {
      route,
      file: `currency/role/${entry.id}.html`,
      title: `${name} - ${titleTail()}`,
      description,
      ld: ldDataPage(route, name, description,
        [[ui('nav.home', '首页'), '/'], [ui('catalog.currencyWar', '货币战争'), '/currency'], [CATALOG_TITLE['/currency/role'](), '/currency/role'], [name, route]], ctx),
      body,
    }));
  });
  return pages;
}


function currencyListPages(ctx) {
  const pages = [];

  const equip = (readJson('currency/equipment.json').items || []).filter((e) => e.name);
  const equipSummary = uiT('snapshot.sum.cwItem', '{site}货币战争装备图鉴：共 {n} 件装备，含分类、效果与属性加成。', { site: gameName(), n: equip.length });
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
    title: `${CATALOG_TITLE['/currency/item']()} - ${titleTail()}`,
    description: cut(equipSummary, 150),
    ld: ldCollection('/currency/item', CATALOG_TITLE['/currency/item'](), cut(equipSummary, 150), equipItems),
    body: catalogBody(ctx, {
      crumbs: crumbHtml([[ui('nav.home', '首页'), '/'], [ui('catalog.currencyWar', '货币战争'), '/currency'], [CATALOG_TITLE['/currency/item'](), null]]),
      h1: CATALOG_TITLE['/currency/item'](),
      summary: esc(equipSummary),
      items: equipItems,
    }),
  }));

  const portals = (readJson('currency/portals.json').portals || []).filter((p) => p.in_book && p.title);
  const portalSummary = uiT('snapshot.sum.cwPortal', '{site}货币战争投资环境图鉴：共 {n} 个投资环境。', { site: gameName(), n: portals.length });
  const portalItems = portals.map((p) => ({ name: p.title, href: null, meta: esc(ui('nav.cwPortal', '投资环境')), desc: txtSafe(p.desc, p.params, 400, hasParamSemantics(p)) }));
  pages.push(makePage('currency-portal-list', {
    route: '/currency/buff',
    file: 'currency/buff.html',
    title: `${CATALOG_TITLE['/currency/buff']()} - ${titleTail()}`,
    description: cut(portalSummary, 150),
    ld: ldCollection('/currency/buff', CATALOG_TITLE['/currency/buff'](), cut(portalSummary, 150), portalItems),
    body: catalogBody(ctx, {
      crumbs: crumbHtml([[ui('nav.home', '首页'), '/'], [ui('catalog.currencyWar', '货币战争'), '/currency'], [CATALOG_TITLE['/currency/buff'](), null]]),
      h1: CATALOG_TITLE['/currency/buff'](),
      summary: esc(portalSummary),
      items: portalItems,
    }),
  }));

  const augments = (readJson('currency/augments.json').augments || []).filter((a) => a.name);
  const augSummary = uiT('snapshot.sum.cwAugment', '{site}货币战争投资策略图鉴：共 {n} 条投资策略。', { site: gameName(), n: augments.length });
  const augItems = augments.map((a) => ({
    name: a.name,
    href: null,
    meta: txt(a.quality ? cwQualityLabel(a.quality) : '', null, 40),
    desc: txtSafe(a.desc, a.params, 400, hasParamSemantics(a)),
  }));
  pages.push(makePage('currency-augment-list', {
    route: '/currency/augment',
    file: 'currency/augment.html',
    title: `${CATALOG_TITLE['/currency/augment']()} - ${titleTail()}`,
    description: cut(augSummary, 150),
    ld: ldCollection('/currency/augment', CATALOG_TITLE['/currency/augment'](), cut(augSummary, 150), augItems),
    body: catalogBody(ctx, {
      crumbs: crumbHtml([[ui('nav.home', '首页'), '/'], [ui('catalog.currencyWar', '货币战争'), '/currency'], [CATALOG_TITLE['/currency/augment'](), null]]),
      h1: CATALOG_TITLE['/currency/augment'](),
      summary: esc(augSummary),
      items: augItems,
    }),
  }));

  return pages;
}


function currencyTraitPages(ctx) {
  const traits = readJson('currency/traits.json').traits || [];
  const roles = readJson('currency/role.json').roles || [];
  const links = traits.map((t) => ({ name: t.name, href: `/currency/trait/${t.id}` }));
  const summaryPlain = uiT('snapshot.cwTraitSummary', '{site}货币战争羁绊图鉴：共 {n} 个羁绊，含激活人数层级与成员加成。', { site: gameName(), n: traits.length });
  const items = traits.map((t) => ({
    name: t.name,
    href: `/currency/trait/${t.id}`,
    meta: [esc(cwCatLabel(t.cat)), esc(uiT('egm.value.floors', '{n} 层', { n: (t.layers || []).length }, (t.layers || []).length))].filter(Boolean).join(' · '),
    desc: txtSafe(t.simple_desc || t.desc, t.base_params, 200, hasParamSemantics(t)),
  }));
  const pages = [makePage('currency-trait-list', {
    route: '/currency/trait',
    file: 'currency/trait.html',
    title: `${CATALOG_TITLE['/currency/trait']()} - ${titleTail()}`,
    description: cut(summaryPlain, 150),
    ld: ldCollection('/currency/trait', CATALOG_TITLE['/currency/trait'](), cut(summaryPlain, 150), items),
    body: catalogBody(ctx, {
      crumbs: crumbHtml([[ui('nav.home', '首页'), '/'], [ui('catalog.currencyWar', '货币战争'), '/currency'], [CATALOG_TITLE['/currency/trait'](), null]]),
      h1: CATALOG_TITLE['/currency/trait'](),
      summary: esc(summaryPlain),
      items,
    }),
  })];

  traits.forEach((entry, idx) => {
    const name = clean(entry.name) || `#${entry.id}`;
    const route = `/currency/trait/${entry.id}`;
    const members = roles.filter((r) => (r.trait_list || []).includes(Number(entry.id)));
    const sourceSummary = plain(entry.simple_desc, entry.base_params) || plain(entry.desc, entry.base_params);
    const description = sourceSummary
      ? cut(sourceSummary, 150)
      : cut(factMeta([cwCatLabel(entry.cat), entry.activation_type], CATALOG_TITLE['/currency/trait'](), name), 150);
    const layerHtml = (entry.layers || [])
      .map((l) => {
        const props = [...(l.member_props || []), ...(l.all_props || [])]
          .map((p) => `${propLabel(p)} ${propValue(p.value)}`).join('、');
        const quality = l.quality ? `${cwQualityLabel(l.quality)} · ` : '';
        return `<li><span>${esc(`${quality}${l.layer} 人`)}</span><p>${txt(l.desc, l.params)}${l.buff_desc ? ` ${txt(l.buff_desc, l.buff_params)}` : ''}</p>${props ? `<p>${txt(props, null, 600)}</p>` : ''}</li>`;
      })
      .join('');
    const remarkHtml = (entry.remarks || [])
      .map((r) => `<li><p>${txt(r.desc, r.params)}</p></li>`)
      .join('');
    const body = detailBody(ctx, {
      crumbs: crumbHtml([[ui('nav.home', '首页'), '/'], [ui('catalog.currencyWar', '货币战争'), '/currency'], [CATALOG_TITLE['/currency/trait'](), '/currency/trait'], [name, null]]),
      h1: name,
      summary: sourceSummary ? esc(cut(sourceSummary, 200)) : '',
      facts: [
        [ui('catalog.filter.category', '分类'), txt(cwCatLabel(entry.cat), null, 40)],
        ['激活方式', txt(entry.activation_type, null, 60)],
        ['层级数', esc(String((entry.layers || []).length))],
        ['成员数', esc(String(members.length))],
        ['所属赛季', entry.season_id != null ? esc(String(entry.season_id)) : ''],
      ],
      sections: [
        { title: ui('ctrait.sec.effect', '效果说明'), html: clean(entry.desc) ? `<p>${txt(entry.desc, entry.base_params, SNAPSHOT_TEXT_LIMIT_DETAIL)}</p>` : '' },
        { title: ui('ctrait.sec.layers', '层级效果'), html: layerHtml ? `<ul class="nk-snapshot__blocks">${layerHtml}</ul>` : '' },
        { title: ui('ctrait.sec.mechanics', '机制详情'), html: remarkHtml ? `<ul class="nk-snapshot__blocks">${remarkHtml}</ul>` : '' },
        {
          title: ui('ctrait.sec.members', '羁绊成员'),
          html: members.length
            ? linkList(members.map((m) => ({ name: cwRoleName(m), href: `/currency/role/${m.id}`, meta: esc(uiT('snapshot.costLabel', '{n} 费', { n: m.rarity })) })))
            : '',
        },
      ],
      links: siblingsOf(links, idx),
      listLabel: '同图鉴羁绊',
    });
    pages.push(makePage('currency-trait-detail', {
      route,
      file: `currency/trait/${entry.id}.html`,
      title: `${name} - ${titleTail()}`,
      description,
      ld: ldDataPage(route, name, description,
        [[ui('nav.home', '首页'), '/'], [ui('catalog.currencyWar', '货币战争'), '/currency'], [CATALOG_TITLE['/currency/trait'](), '/currency/trait'], [name, route]], ctx),
      body,
    }));
  });
  return pages;
}


function pctText(v) {
  if (v == null || !Number.isFinite(Number(v))) return '';
  const n = Number(v);
  return `${Math.round(Math.max(0, Math.min(100, n <= 1 ? n * 100 : n)) * 10) / 10}%`;
}

function voracityPages(ctx) {
  const db = readJson('voracity.json');
  const activity = db.activity || {};
  const invasion = db.invasion || {};
  const levels = Array.isArray(invasion.levels) ? invasion.levels : [];
  const buffLevels = Array.isArray(activity.buff_levels) ? activity.buff_levels : [];
  const tutorials = Array.isArray(db.tutorials) ? db.tutorials : [];
  const affixes = Array.isArray(db.affixes) ? db.affixes : [];

  const nameOrId = (entry, key, fallbackKey) => txtSafe(entry && entry[key], null, 120)
    || (entry && entry[fallbackKey] != null ? esc(String(entry[fallbackKey])) : '');

  const levelHtml = levels.map((lv) => {
    const desc = txtSafe(lv && lv.desc, lv && lv.param_list, SNAPSHOT_TEXT_LIMIT_DETAIL, hasParamSemantics(lv));
    if (!desc) return '';
    const head = lv && lv.invasion_id != null
      ? uiT('snapshot.invasionLevel', '污染等级 {n}', { n: esc(String(lv.invasion_id)) })
      : '';
    return `<li>${head ? `<span>${head}</span>` : ''}<p>${desc}</p></li>`;
  }).join('');
  const buffHtml = buffLevels.map((b) => {
    const name = nameOrId(b, 'name', 'buff_id');
    const desc = txtSafe(b && b.desc, b && b.param_list, SNAPSHOT_TEXT_LIMIT_DETAIL, hasParamSemantics(b));
    const pct = pctText(b && b.progress_percent);
    if (!name && !desc && !pct) return '';
    const head = `${name}${b && b.level != null ? `（${uiT('mob.levelTag', '等级 {n}', { n: esc(String(b.level)) })}）` : ''}`;
    return `<li><span>${head}</span>${pct ? `<p>${uiT('vor.field.wishPower', '愿力进度 {n}', { n: esc(pct) })}</p>` : ''}${desc ? `<p>${desc}</p>` : ''}</li>`;
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
  const summaryPlain = uiT('snapshot.sum.voracity', '{site}贪饕污染专题：{extra}「贪饕」侵蚀机制、玩家支援、教程图文与位面词条。', {
    site: gameName(),
    extra: activityName ? `${activityName}，` : '',
  });
  const description = cut(summaryPlain, 150);
  const body = detailBody(ctx, {
    crumbs: crumbHtml([[ui('nav.home', '首页'), '/'], [voracityTitle(), null]]),
    h1: voracityTitle(),
    summary: '',
    facts: [
      [ui('vor.field.activity', '活动'), txtSafe(activity.name, null, 120)],
      [ui('vor.field.unlockQuest', '解锁任务'), activity.unlock_mission_id != null ? esc(String(activity.unlock_mission_id)) : ''],
      [ui('vor.field.affixes', '位面词条数'), esc(String(affixes.length))],
    ],
    sections: [
      { title: ui('vor.sec.overview', '玩法概览'), html: introHtml ? `<p>${introHtml}</p>` : '' },
      {
        title: ui('vor.sec.invasionFull', '「贪饕」侵蚀（敌方与玩家支援）'),
        html: [
          levelHtml ? `<p>${esc(ui('vor.sec.enemyBuffs', '敌方强化（关卡侵蚀）'))}</p><ul class="nk-snapshot__blocks">${levelHtml}</ul>` : '',
          buffHtml ? `<p>${esc(ui('vor.sec.playerSupport', '玩家支援（愿力分档）'))}</p><ul class="nk-snapshot__blocks">${buffHtml}</ul>` : '',
        ].join(''),
      },
      { title: ui('vor.sec.tutorials', '教程图文'), html: tutorialHtml ? `<ul class="nk-snapshot__blocks">${tutorialHtml}</ul>` : '' },
      { title: ui('vor.sec.affixes', '位面词条'), html: affixHtml ? `<ul class="nk-snapshot__blocks">${affixHtml}</ul>` : '' },
    ],
  });
  return [makePage('voracity-page', {
    route: '/voracity',
    file: 'voracity.html',
    title: `${voracityTitle()} - ${titleTail()}`,
    description,
    ld: ldArticle('/voracity', voracityTitle(), description, [[ui('nav.home', '首页'), '/'], [voracityTitle(), '/voracity']], ctx),
    body,
  })];
}


const FORMULA_ACTION_VALUE_BASE = 10000;
const FORMULA_FIRST_CYCLE_AV = 150;
const FORMULA_CYCLE_AV = 100;
const FORMULA_SPEED_TABLES = [
  ['formula.speed.tableFirst', '首轮（150 行动值）', FORMULA_FIRST_CYCLE_AV, [1, 2, 3, 4]],
  ['formula.speed.tableTwo', '前两轮（250 行动值）', FORMULA_FIRST_CYCLE_AV + FORMULA_CYCLE_AV, [2, 4, 6]],
];
const FORMULA_RES_PRESETS = [0, 20, 40, 60];

function formulaSpeedNeed(turns, budget) {
  return String(Math.round((turns * FORMULA_ACTION_VALUE_BASE * 100) / budget) / 100);
}

const FORMULA_BREAK_ELEMENTS = [
  ['Physical', 2],
  ['Fire', 2],
  ['Wind', 1.5],
  ['Ice', 1],
  ['Thunder', 1],
  ['Quantum', 0.5],
  ['Imaginary', 0.5],
];
const FORMULA_BREAK_ROWS = [
  ['formula.row.breakBase', '击破基数', 'base'],
  ['formula.row.elementBreak', '属性击破倍率', 'x'],
  ['formula.row.breakEffect', '击破特攻', 'x1plus'],
  ['formula.row.toughnessLength', '韧性条长度系数', 'x'],
  ['formula.row.breakBonus', '击破增伤', 'x1plus'],
  ['formula.row.vuln', '易伤区', 'x'],
  ['formula.row.defense', '防御区', 'x'],
  ['formula.row.resist', '抗性区', 'x'],
  ['formula.row.reduce', '减伤区', 'x'],
  ['formula.row.toughnessCheck', '韧性减伤', 'x09'],
];
const FORMULA_SUPER_BREAK_ROWS = [
  ['formula.row.breakBase', '击破基数', 'base10'],
  ['formula.row.breakEffect', '击破特攻', 'x1plus'],
  ['formula.row.superToughness', '削韧值', 'x'],
  ['formula.row.superBonus', '超击破伤害提高', 'x1plus'],
  ['formula.row.vuln', '易伤区', 'x'],
  ['formula.row.defense', '防御区', 'x'],
  ['formula.row.resist', '抗性区', 'x'],
  ['formula.row.reduce', '减伤区', 'x'],
  ['formula.row.toughnessCheck', '韧性减伤', 'x1'],
];
const FORMULA_ELATION_ROWS = [
  ['formula.row.elationBase', '欢愉基础值', 'base'],
  ['formula.row.elationMultiplier', '欢愉倍率', 'x'],
  ['formula.row.elationDegree', '欢愉度', 'x1plus'],
  ['formula.row.joke', '笑点区', 'x'],
  ['formula.row.crit', '双爆区', 'x'],
  ['formula.row.laugh', '增笑区', 'x1plus'],
  ['formula.row.vuln', '易伤区', 'x'],
  ['formula.row.resist', '抗性区', 'x'],
  ['formula.row.toughnessCheck', '韧性减伤', 'x'],
  ['formula.row.defense', '防御区', 'x'],
  ['formula.term.dmgReduction', '减伤', 'x1minus'],
];

function formulaChainTerm(rowKey, fallbackName, kind) {
  const name = ui(rowKey, fallbackName);
  if (kind === 'base') return name;
  if (kind === 'base10') return `${name} ÷ 10`;
  if (kind === 'x1plus') return `(1 + ${name})`;
  if (kind === 'x1minus') return `(1 − ${name})`;
  if (kind === 'x09') return `0.9 (${name})`;
  if (kind === 'x1') return `1 (${name})`;
  return name;
}

function formulaChainLine(rows) {
  return rows.map(([rowKey, fallbackName, kind]) => formulaChainTerm(rowKey, fallbackName, kind)).join(' × ');
}

function formulaPages(ctx) {
  const title = ui('nav.formula', '战斗公式');
  const itemList = (rows) => `<ul class="nk-snapshot__list">${rows
    .map(([name, detail]) => `<li><span>${esc(name)}</span><p>${esc(detail)}</p></li>`)
    .join('')}</ul>`;
  const cardList = (cards) => `<ul class="nk-snapshot__list">${cards
    .map(([name, lines]) => `<li><span>${esc(name)}</span>${lines.map((line) => `<p>${esc(line)}</p>`).join('')}</li>`)
    .join('')}</ul>`;
  const speedRows = FORMULA_SPEED_TABLES.map(([key, fallback, budget, turnsList]) => [
    ui(key, fallback),
    turnsList.map((n) => `${uiT('formula.speed.turnsUnit', '{n} 动', { n })} → ${formulaSpeedNeed(n, budget)}`).join(' · '),
  ]);
  const elemName = (id) => ctx.elemNames.get(id) || id;
  const breakElements = FORMULA_BREAK_ELEMENTS.map(([id, mult]) => [elemName(id), `× ${mult}`]);
  const entryLinks = [
    ['/', ui('nav.home', '首页')],
    ['/character', ui('catalog.character.title', '角色图鉴')],
    ['/monster', ui('catalog.monster.title', '敌对物种')],
  ].map(([href, label]) => `<a href="${esc(href)}">${esc(label)}</a>`).join('<span class="nk-snapshot__sep">›</span>');
  const paragraph = (key, fallback) => `<p>${esc(ui(key, fallback))}</p>`;
  const summaryPlain = `${title} · ${ui('formula.hero.lead', '把一次直伤拆成六个乘区，逐区调参看读数怎么走。')}`;
  const description = cut(summaryPlain, 150);
  const body = detailBody(ctx, {
    crumbs: crumbHtml([[ui('nav.home', '首页'), '/'], [title, null]]),
    h1: title,
    summary: esc(ui('formula.hero.lead', '把一次直伤拆成六个乘区，逐区调参看读数怎么走。')),
    facts: [[ui('formula.chain.toughness', '韧性区'), `${esc(ui('formula.chain.toughnessOff', '未破韧 ×0.9'))} / ${esc(ui('formula.chain.toughnessOn', '已击破 ×1'))}`]],
    sections: [
      {
        title: ui('formula.sec.overview', '伤害链路'),
        html: paragraph('formula.overview.lead', '乘区之间只有乘法，所以每个乘区的相对提升价值相同。点任一乘区看公式与取值范围，右侧账本显示它相对中性值的偏移。')
          + `<p>${esc(ui('formula.ledger.title', '乘区账本'))} · ${esc(ui('formula.ledger.note', '以中性值 1.0 为轴：向右为增益、向左为损失；条长按系数与 1 的差值大小计，不代表伤害占比。基础伤害不是系数，单列在顶部。'))}</p>`
          + paragraph('formula.overview.noCrit', '击破伤害与持续伤害不能暴击，它们的暴击区恒为 1。')
          + `<p>${esc(ui('formula.chain.toughness', '韧性区'))}：${esc(ui('formula.chain.toughnessOff', '未破韧 ×0.9'))} / ${esc(ui('formula.chain.toughnessOn', '已击破 ×1'))}</p>`
          + paragraph('formula.zoneNote.toughness', '未破韧时全部伤害 ×0.9；击破后回到 ×1。它是战斗状态，不是可调乘区。')
          + `<p class="nk-snapshot__note">${esc(ui('formula.hero.note', '口径：直伤、击破与持续伤害；数值取自本站转换数据，机制常量取官方战斗系统。'))}</p>`
          + `<p class="nk-snapshot__more">${entryLinks}</p>`,
      },
      {
        title: ui('formula.sec.break', '击破链路'),
        html: paragraph('formula.break.lead', '击破与超击破是两条独立链路：基数是「击破基数 × 属性击破倍率」，不是攻击力。两者最大的差别是韧性减伤——击破瞬伤恒定 ×0.9，超击破只发生在已破韧目标上 ×1。')
          + `<p>${esc(ui('formula.break.normalTitle', '普通击破'))}</p>`
          + `<p>${esc(formulaChainLine(FORMULA_BREAK_ROWS))}</p>`
          + paragraph('formula.break.lengthNote', '韧性条越长，单次击破伤害越高：长度系数 = ((韧性点 ÷ 10) + 2) ÷ 4。击破瞬伤恒定吃 ×0.9 韧性减伤。')
          + paragraph('formula.break.noCrit', '击破伤害不能暴击，所以没有暴击区。')
          + paragraph('formula.break.noBonus', '击破伤害不吃增伤区（攻击力、增伤、属性增伤全部无效），但吃击破增伤。')
          + `<p>${esc(ui('formula.row.elementBreak', '属性击破倍率'))}</p>`
          + itemList(breakElements)
          + `<p>${esc(ui('formula.break.effectTitle', '击破效果'))}</p>`
          + `<ul class="nk-snapshot__list">${['Physical', 'Fire', 'Thunder', 'Wind', 'Ice', 'Quantum', 'Imaginary']
            .map((el) => `<li><p>${esc(ui(`formula.break.effect${el}`, el))}</p></li>`).join('')}</ul>`
          + paragraph('formula.break.effectNote', '以上为每次结算的基础值，再乘 (1 + 击破特攻) 与防御 / 抗性 / 易伤 / 减伤区；持续伤害与附加伤害不乘长度系数（裂伤上限与纠缠例外），不能暴击，也不吃攻击力与增伤。')
          + `<p>${esc(ui('formula.break.superTitle', '超击破'))}</p>`
          + `<p>${esc(formulaChainLine(FORMULA_SUPER_BREAK_ROWS))}</p>`
          + paragraph('formula.break.superOff', '超击破只发生在已破韧目标上：基数 = 击破基数 ÷ 10，削韧值按韧性点计，韧性减伤 ×1。打开开关查看结算。')
          + `<p>${esc(ui('formula.break.result', '击破伤害'))} · ${esc(ui('formula.break.superResult', '超击破伤害'))}</p>`,
      },
      {
        title: ui('formula.sec.elation', '欢愉伤害'),
        html: paragraph('formula.elation.lead', '欢愉伤害是一条独立链路：基数来自欢愉基础值，由欢愉倍率、欢愉度与笑点区推进，不经过攻击力。')
          + `<p>${esc(formulaChainLine(FORMULA_ELATION_ROWS))}</p>`
          + `<p>${esc(`${ui('formula.row.joke', '笑点区')} = 1 + (2 × ${ui('formula.elation.joke', '好活数')}) ÷ 242`)}</p>`
          + paragraph('formula.elation.jokeNote', '笑点区只看好活数：好活数 240 时约 2.98 倍，好活数 5 时约 1.04 倍。')
          + `<p class="nk-snapshot__note">${esc(ui('formula.elation.notIncluded', '不参与：攻击力、增伤（含属性增伤与攻击类型增伤）。'))}</p>`
          + `<p>${esc(ui('formula.elation.result', '暴击伤害'))} · ${esc(ui('formula.elation.expected', '期望伤害'))}</p>`,
      },
      {
        title: ui('formula.sec.true', '真实伤害'),
        html: paragraph('formula.true.lead', '真实伤害不是独立的伤害类型，而是从已经算好的原伤害里再派生一段，比例由伤害来源决定。')
          + paragraph('formula.true.noElement', '无属性：不吃抗性，也不吃抗性穿透。')
          + paragraph('formula.true.derived', '由原伤害派生：原伤害不变，最终 = 原伤害 × (1 + 比例)。')
          + paragraph('formula.true.noZone', '不进任何乘区：增伤、暴击 / 暴伤、易伤、减防、穿透、减伤全部无效。')
          + paragraph('formula.true.notAttack', '不视为一次攻击：不削韧，也不触发攻击判定与受击反馈。')
          + paragraph('formula.true.notLethal', '可能标注【不致命】：该段真实伤害不会击杀目标。')
          + `<p>${esc(`${ui('formula.true.added', '附加真实伤害')} = ${ui('formula.true.original', '原伤害')} × ${ui('formula.true.ratio', '真实伤害比例')}`)}</p>`
          + `<p>${esc(`${ui('formula.true.total', '结算后总伤害')} = ${ui('formula.true.original', '原伤害')} × (1 + ${ui('formula.true.ratio', '真实伤害比例')})`)}</p>`
          + paragraph('formula.true.note', '原伤害本身不变：最终伤害 = 原伤害 × (1 + 比例)。')
          + `<p>${esc(`${ui('formula.true.compareTitle', '同样比例，换两条路')}：${ui('formula.true.compareBonus', '加到增伤区')} / ${ui('formula.true.compareTrue', '走真实伤害')}`)}</p>`
          + `<p class="nk-snapshot__note">${esc(ui('formula.true.vsPursued', '与「附加伤害」的区别：附加伤害走完整乘区（可暴击、吃增伤与易伤），真实伤害不进乘区。'))}</p>`,
      },
      {
        title: ui('formula.sec.heal', '治疗与护盾'),
        html: paragraph('formula.heal.lead', '治疗量与护盾量沿用伤害的结构：一个基础区乘一个修饰区。')
          + cardList([
            [ui('formula.heal.healValue', '治疗量'), [
              ui('formula.heal.baseFormula', '基础治疗区 = 倍率 × 属性 + 固定值'),
              ui('formula.heal.zoneFormula', '治疗修饰区 = (1 + Σ治疗量加成) × (1 − Σ治疗量降低)'),
            ]],
            [ui('formula.heal.shieldValue', '护盾量'), [
              ui('formula.shield.baseFormula', '基础护盾区 = 倍率 × 属性 + 固定值'),
              ui('formula.heal.shieldFormula', '护盾修饰区 = 1 + Σ护盾量提高 + Σ获得护盾量提高'),
            ]],
          ])
          + paragraph('formula.heal.note', '不同来源的护盾不叠加（取最高值）；治疗与护盾的修饰区互不影响。'),
      },
      {
        title: ui('formula.sec.speed', '速度与行动值'),
        html: paragraph('formula.speed.lead', '行动值 = 10000 ÷ 速度；行动值越小越先行动。速度越高，同样的行动预算内行动次数越多。')
          + paragraph('formula.speed.formula', '行动值 = 10000 ÷ 速度')
          + paragraph('formula.speed.cyclesNote', '忘却之庭首轮 150 行动值、之后每轮 100；图中的行动次数为整数（向下取整）。')
          + paragraph('formula.speed.thresholdTitle', '速度阈值')
          + itemList(speedRows)
          + `<p>${esc(ui('formula.speed.needSpeed', '所需最低速度'))}（${esc(ui('formula.speed.needTurns', '目标首轮行动次数'))}）</p>`,
      },
      {
        title: ui('formula.sec.extra', '削韧·能量·命中'),
        html: paragraph('formula.extra.lead', '削韧与负面效果命中不构成伤害乘区，但它们决定伤害能不能打出去。')
          + `<p>${esc(ui('formula.extra.baseToughness', '基础破韧'))}：${esc(ui('formula.extra.breakFormula', '破韧 = 基础破韧 × (1 + 弱点击破效率)'))}</p>`
          + paragraph('formula.extra.breakUnit', '归一单位（1 = 普攻破韧）')
          + paragraph('formula.extra.breakNote', '以敌方韧性条上限为单位：普攻 1 / 战技 2 / 终结技 3；附加伤害与持续伤害不削韧。')
          + paragraph('formula.extra.energyFormula', '回能 = 基础回能 × (1 + 能量恢复效率)')
          + paragraph('formula.extra.chanceFormula', '生效概率 = 基础概率 × (1 + 效果命中) × (1 − 效果抵抗) × (1 − 专属抵抗)')
          + `<p>${esc(ui('formula.extra.hitReverse', '所需效果命中'))}：${esc(ui('formula.extra.hitReverseNote', '按当前基础概率与效果抵抗反推；已达标时显示 0%。'))}</p>`
          + paragraph('formula.extra.chanceNote', '效果抵抗通常 30%~40%，末日兽可达 100%；生效概率上限 100%。'),
      },
      {
        title: ui('formula.sec.calc', '实战计算器'),
        html: paragraph('formula.calc.lead', '填入面板值，直接看各乘区如何把基础伤害推到最后；账本显示每个乘区相对中性值的偏移。')
          + itemList([
            [ui('formula.calc.toughness', '韧性状态'), `${ui('formula.status.unbroken', '未破韧')} / ${ui('formula.status.broken', '已击破')}`],
            [ui('formula.calc.swarm', '扑满'), `${ui('formula.status.off', '关')} / ${ui('formula.status.on', '开')}`],
            [ui('formula.calc.resPreset', '抗性预设'), FORMULA_RES_PRESETS.map((v) => `${v}%`).join(' / ')],
          ])
          + `<p>${esc(ui('formula.calc.result', '期望伤害'))} · ${esc(ui('formula.calc.breakdown', '乘区账本'))}</p>`,
      },
    ],
  });
  return [makePage('formula', {
    route: '/formula',
    file: 'formula.html',
    title: `${title} - ${titleTail()}`,
    description,
    ld: ldDataPage('/formula', title, description, [[ui('nav.home', '首页'), '/'], [title, '/formula']], ctx),
    body,
  })];
}


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
    ...formulaPages(ctx),
  ];
}

function main() {
  if (!existsSync(TEMPLATE_FILE)) {
    fail(`缺少 ${TEMPLATE_FILE}：请先执行 \`pnpm exec vite build\`（快照模板必须是构建产物，禁止用源码模板）`);
  }
  const shellSource = existsSync(SHELL_FILE) ? SHELL_FILE : TEMPLATE_FILE;
  const template = readFileSync(shellSource, 'utf8').split(SHELL_NOINDEX).join('');
  if (shellSource === TEMPLATE_FILE && template.includes('class="nk-snapshot"')) {
    fail(`${TEMPLATE_FILE} 已是注入过的快照且缺少 ${SHELL_FILE}：请先执行 \`pnpm exec vite build\` 重建纯 shell 模板`);
  }
  const isLayered = (family) => !family.endsWith('-detail');
  const alternatesFor = (cnRoute) => {
    const strip = (code, route) => (route === '/' ? `/${code}` : `/${code}${route}`);
    return [
      ...LOCALES.map((l) => ({
        hreflang: l.culture,
        href: SITE_ORIGIN + (l.code === DEFAULT_LOCALE ? cnRoute : strip(l.code, cnRoute)),
      })),
      { hreflang: 'x-default', href: SITE_ORIGIN + cnRoute },
    ];
  };

  const localeSet = LOCALES;
  const pages = [];
  let ctx;
  for (const loc of localeSet) {
    currentLocale = loc.code;
    ctx = loadContext();
    const built = buildPages(ctx);
    const homePage = built.find((p) => p.route === '/');
    if (homePage) injectHomeStats(homePage, homeStatsBlock(built));
    const keep = loc.code === DEFAULT_LOCALE ? built : built.filter((p) => isLayered(p.family));
    const prefix = loc.code === DEFAULT_LOCALE ? '' : `/${loc.code}`;
    for (const p of keep) {
      const route = prefix ? (p.route === '/' ? prefix : `${prefix}${p.route}`) : p.route;
      const file = prefix ? `${loc.code}/${p.file}` : p.file;
      const ld = prefix ? prefixLdUrls(p.ld, prefix) : p.ld;
      pages.push({
        ...p, route, file, ld,
        lang: loc.culture,
        alternates: isLayered(p.family) ? alternatesFor(p.route) : null,
      });
    }
  }

  rmSync(PRERENDER_DIR, { recursive: true, force: true });
  mkdirSync(PRERENDER_DIR, { recursive: true });
  writeFileSync(SHELL_FILE, withShellNoindex(template));

  let bytes = 0;
  let homeHtml = null;
  for (const page of pages) {
    const out = join(PRERENDER_DIR, page.file);
    mkdirSync(dirname(out), { recursive: true });
    const html = renderSnapshot(template, page);
    writeFileSync(out, html);
    bytes += Buffer.byteLength(html);
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
    else if (name.name.endsWith('.html') && !name.name.startsWith('_')) n += 1;
  }
  return n;
}

const isEntry = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isEntry) {
  main();
}
