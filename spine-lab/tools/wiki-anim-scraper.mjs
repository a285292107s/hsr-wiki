
import { readFileSync, writeFileSync } from 'node:fs';

const LIST_API = 'https://act-api-takumi-static.mihoyo.com/common/blackboard/sr_wiki/v1/home/content/list?app_sn=sr_wiki&channel_id=18';
const INFO_API = 'https://act-api-takumi-static.mihoyo.com/common/blackboard/sr_wiki/v1/content/info?app_sn=sr_wiki&content_id=';

const TAG_TO_TYPE = {
  '普攻': 'Normal',
  '战技': 'BPSkill',
  '终结技': 'Ultra',
  '天赋': 'Passive',
  '秘技': 'Maze',
  '欢愉技': 'ElationDamage',
};

const MEMO_TAG_TO_TYPE = { '忆灵技': 'Servant', '忆灵天赋': 'ServantPassive' };

const SKIP_TAGS = new Set(['额外能力', '属性加成', '属性强化', '攻击强化', '生命强化', '防御强化', '角色晋阶']);

const AVATAR_ID_FIX = {
  '白露': '1211',
};

const args = process.argv.slice(2);
const pretty = args.includes('--pretty');
const fresh = args.includes('--fresh');
const delayArg = args.find(a => a.startsWith('--delay='));
const DELAY = delayArg ? parseInt(delayArg.split('=')[1], 10) : 300;

const OUT_PATH = new URL('../../public/data/cn/skill_animations.json', import.meta.url);
/* 标题里的 `$t:<技能名 hash>` 令牌要能被前端解析 ⇒ 必须同时产出本分组的语言包。
   值直接取自 `characters` 包（同一批官方词条），缺失时回退缺省语言。 */
const PACK_DIR = new URL('../../public/data/i18n/', import.meta.url);
const DEFAULT_LANG = 'cn';
const LANGS = ['cn', 'cht', 'en', 'jp', 'kr', 'es', 'fr', 'de', 'pt', 'ru', 'th', 'vi', 'id'];
const CHAR_LIST_PATH = new URL('../../public/data/cn/characters.json', import.meta.url);
const CHAR_DIR = new URL('../../public/data/cn/characters/', import.meta.url);

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}: ${url}`);
  return r.json();
}

function loadSkillNameMap(avatarId) {
  try {
    const d = JSON.parse(readFileSync(new URL(`${avatarId}.json`, CHAR_DIR), 'utf-8'));
    const map = {};
    for (const s of Object.values(d.skills || {})) {
      if (s && s.type && s.name) map[s.name] = s.type;
    }
    return map;
  } catch {
    return null;
  }
}

/**
 * 动画小标题 → 技能名**令牌**映射（缺省语言技能名 → `$t:<hash>`）。
 *
 * 为什么不能直接写 wiki 的 `subTitle` 原文：前端 `assignAnimEntries` 用
 * `a.title === sk.name` 把动画挂到技能上，而 `sk.name` 是**按语言解析后**的正文
 * ⇒ 标题写死中文时，非中文语言下匹配必然失败（动画挂错技能），且选择器里显示中文。
 * 命中官方技能名的标题改写成令牌后随语言解析，两个问题一起消掉。
 * 未命中（变体小标题，如「解放的金色王权」）保留原文。
 */
function loadSkillTokenMap(avatarId) {
  try {
    const d = JSON.parse(readFileSync(new URL(`${avatarId}.json`, CHAR_DIR), 'utf-8'));
    const pack = JSON.parse(readFileSync(new URL('../../public/data/i18n/cn/characters.json', import.meta.url), 'utf-8'));
    const map = {};
    const add = (sk) => {
      if (!sk || !sk.name) return;
      const token = sk.name;
      const cn = token.startsWith('$t:') ? pack[token.slice(3)] : token;
      if (cn) map[cn] = token;
    };
    for (const s of Object.values(d.skills || {})) add(s);
    for (const s of Object.values((d.memosprite && d.memosprite.skills) || {})) add(s);
    return map;
  } catch {
    return {};
  }
}

function resolveByName(tag, nameMap) {
  if (nameMap[tag]) return nameMap[tag];
  for (const part of tag.split('/')) {
    const hit = nameMap[part.trim()];
    if (hit) return hit;
  }
  return '';
}

function structuredPoints(rpg) {
  if (!rpg) return [];
  const traceModule = (rpg.modules || []).find(m => String(m.id) === '13' || (m.name || '').startsWith('角色行迹'));
  if (!traceModule?.components?.[0]?.data) return [];
  let skillData;
  try {
    skillData = JSON.parse(traceModule.components[0].data);
  } catch {
    return [];
  }
  return (skillData.points || []).map(p => ({
    tag: p.tag,
    entries: (p.subList || []).map(s => ({ url: s.image || '', title: (s.subTitle || '').trim() })),
  }));
}

function templatePoints(contents) {
  const points = [];
  let avatarId = null;
  for (const c of contents || []) {
    const html = c && typeof c.text === 'string' ? c.text : '';
    if (!html.includes('obc-tmpl-character__trace')) continue;
    const role = html.match(/obc-tmpl-character__trace__role">\s*(\d+)/);
    if (role) avatarId = role[1];
    for (const frag of html.split('<li class="obc-tmpl-character__trace__point">').slice(1)) {
      const descAt = frag.indexOf('__trace__desc');
      if (descAt < 0) continue;
      const nameHtml = frag.slice(0, descAt);
      const nameDiv = (nameHtml.match(/obc-tmpl-character__trace__name">([\s\S]*?)<\/div>/) || [])[1] || '';
      const tag = (nameDiv.match(/class="colorful-tag[^"]*"[^>]*>([^<]+)</) || [])[1];
      if (!tag) continue;
      const nameText = nameDiv.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      const title = nameText.replace(tag.trim(), '').replace(/^[\s:：·、-]+/, '').trim();
      const tableAt = frag.indexOf('__trace__table');
      const desc = frag.slice(descAt, tableAt < 0 ? undefined : tableAt);
      const urls = [...desc.matchAll(/<img[^>]+src="([^"]+)"/g)].map(m => m[1]);
      points.push({ tag, entries: urls.map(url => ({ url, title })) });
    }
  }
  return { points, avatarId };
}

function extractAnimations(data, unknownTags) {
  const content = data?.data?.content;
  if (!content) return null;

  const rpg = content.rpg_new_tmp_content;
  const template = templatePoints(content.contents);

  const avatarId = rpg?.base?.userInfo?.avatarId;
  const title = content.title || '';
  const fixedId = (!avatarId || avatarId === '0') ? AVATAR_ID_FIX[title] : null;
  const finalId = fixedId || avatarId || template.avatarId;
  if (!finalId || finalId === '0') return null;

  const points = [...structuredPoints(rpg), ...template.points];
  const nameMap = loadSkillNameMap(finalId);
  const tokenMap = loadSkillTokenMap(finalId);
  const skills = {};

  for (const p of points) {
    const tag = (p.tag || '').trim();
    if (!tag || tag === 'undefined' || SKIP_TAGS.has(tag)) continue;
    const type = TAG_TO_TYPE[tag] || MEMO_TAG_TO_TYPE[tag] || (nameMap ? resolveByName(tag, nameMap) : '');
    if (!type) {
      unknownTags.set(tag, (unknownTags.get(tag) || 0) + 1);
      continue;
    }

    const anims = (p.entries || []).filter(a => a.url.endsWith('.webp') || a.url.endsWith('.gif'));
    if (!anims.length) continue;

    if (!skills[type]) skills[type] = [];
    for (const a of anims) {
      if (!a.title) { skills[type].push({ url: a.url }); continue; }
      const token = tokenMap[a.title];
      /* 命中官方技能名 → `title` 写名称令牌（随语言解析，且与前端 `a.title === sk.name` 的匹配同源）。
         未命中（变体小标题，如「解放的金色王权」）→ **不写 title**：它只有 wiki 侧中文原文，
         写进去会让非中文语言的选择器显示中文；留空则前端回落序号，且结构层不残留中文。 */
      skills[type].push(token ? { url: a.url, title: token } : { url: a.url });
    }
  }

  return { avatarId: finalId, skills, points: points.length, form: template.points.length ? 'template' : 'structured' };
}

function mergeTypes(target, incoming) {
  for (const [type, list] of Object.entries(incoming)) {
    const cur = target[type] || (target[type] = []);
    const byUrl = new Map(cur.map((a, i) => [a.url, i]));
    for (const a of list) {
      const i = byUrl.get(a.url);
      if (i === undefined) {
        cur.push(a);
        byUrl.set(a.url, cur.length - 1);
        continue;
      }
      // 条目身份由 url 决定（媒体资源不变即同一条）；title 是元数据，随最新抓取更新。
      // 若这里也保持「既有优先」，标题就永远停在旧值（本次把标题改成技能名令牌时踩到）。
      const next = { ...cur[i] };
      if (a.title !== undefined) next.title = a.title;
      else delete next.title;
      cur[i] = next;
    }
  }
}

/**
 * 写出 `skill_animations` 分组的 13 语言包（只含本文件用到的令牌键）。
 *
 * 为什么抓取脚本要写语言包：标题令牌是**借用**官方技能名词条（其值住在 `characters` 分组），
 * 而前端按「同分组包」解析令牌（`singletonLocalData('skill_animations.json')`）。
 * 不写这一份，前端拿到的是未解析的 `$t:…`，守卫 `check-i18n-packs.mjs` 也会报缺包。
 */
function writeTitlePacks(merged) {
  const keys = new Set();
  for (const types of Object.values(merged)) {
    for (const arr of Object.values(types)) {
      for (const a of arr || []) {
        if (typeof a?.title === 'string' && a.title.startsWith('$t:')) keys.add(a.title.slice(3).split('~')[0]);
      }
    }
  }
  if (!keys.size) return 0;
  const read = (lang) => {
    try {
      return JSON.parse(readFileSync(new URL(`${lang}/characters.json`, PACK_DIR), 'utf-8'));
    } catch {
      return {};
    }
  };
  const packs = Object.fromEntries(LANGS.map((l) => [l, read(l)]));
  let written = 0;
  for (const lang of LANGS) {
    const fallback = packs[DEFAULT_LANG];
    const out = {};
    for (const k of [...keys].sort()) out[k] = packs[lang][k] ?? fallback[k] ?? '';
    writeFileSync(new URL(`${lang}/skill_animations.json`, PACK_DIR), JSON.stringify(out, null, 2) + '\n', 'utf-8');
    written += 1;
  }
  return written;
}

function reportCoverage(merged, pageInfo) {
  let charList = [];
  try {
    charList = JSON.parse(readFileSync(CHAR_LIST_PATH, 'utf-8'));
  } catch {
    console.log('  （跳过：读不到 characters.json）');
    return;
  }
  const missingByType = new Map();
  const lines = [];
  let full = 0, checked = 0;

  for (const c of charList) {
    const id = String(c.id);
    let need = null;
    try {
      const d = JSON.parse(readFileSync(new URL(`${id}.json`, CHAR_DIR), 'utf-8'));
      need = new Set();
      for (const s of Object.values(d.skills || {})) if (s.type && s.type_name) need.add(s.type);
      for (const s of Object.values((d.memosprite && d.memosprite.skills) || {})) {
        need.add(s.type || 'ServantPassive');
      }
    } catch {
      continue;
    }
    checked++;
    const have = merged[id] || {};
    const miss = [...need].filter(t => !(have[t] && have[t].length));
    if (!miss.length) { full++; continue; }
    for (const t of miss) missingByType.set(t, (missingByType.get(t) || 0) + 1);
    const page = pageInfo.get(id);
    const reason = !page
      ? 'wiki 无该角色页 / 页内无 avatarId'
      : (page.anims === 0 ? 'wiki 页内 0 张动画图' : '该技能 wiki 页未配图');
    lines.push(`    ${id} ${c.name} 缺 [${miss.join(',')}] — ${reason}`);
  }

  console.log(`  已知角色 ${checked}：技能预览全覆盖 ${full}，仍有缺口 ${lines.length}`);
  if (lines.length) console.log(lines.join('\n'));
  const agg = [...missingByType.entries()].sort((a, b) => b[1] - a[1]).map(([t, n]) => `${t}×${n}`).join('  ');
  if (agg) console.log(`  缺口类型汇总：${agg}`);
}

async function main() {
  console.log('=== 米游社 Wiki 技能动画抓取 ===\n');

  console.log('[1/4] 获取角色列表...');
  const listData = await fetchJSON(LIST_API);
  const categories = listData?.data?.list || [];
  const charCategory = categories.find(c => c.name === '角色') || categories[0];
  const chars = charCategory?.list || [];
  console.log(`  找到 ${chars.length} 个角色页\n`);

  if (!chars.length) {
    console.error('错误：未获取到角色列表');
    process.exit(1);
  }

  console.log('[2/4] 逐个抓取技能动画...');
  const result = {};
  const unknownTags = new Map();
  const pageInfo = new Map();
  let success = 0, noAnim = 0, noAvatar = 0, failed = 0;

  for (let i = 0; i < chars.length; i++) {
    const entry = chars[i];
    const name = entry.title || '?';
    const progress = `[${i + 1}/${chars.length}]`;

    try {
      const data = await fetchJSON(INFO_API + entry.content_id);
      const extracted = extractAnimations(data, unknownTags);

      if (!extracted) {
        console.log(`  ${progress} ${name} → 无 avatarId，跳过`);
        noAvatar++;
      } else {
        const animCount = Object.values(extracted.skills).reduce((s, arr) => s + arr.length, 0);
        pageInfo.set(extracted.avatarId, { title: name, points: extracted.points, anims: animCount, form: extracted.form });
        if (animCount) {
          if (!result[extracted.avatarId]) result[extracted.avatarId] = {};
          mergeTypes(result[extracted.avatarId], extracted.skills);
          console.log(`  ${progress} ${name} (${extracted.avatarId}) → ${animCount} 个动画 ✓${extracted.form === 'template' ? '（OBC 模板形态）' : ''}`);
          success++;
        } else {
          console.log(`  ${progress} ${name} (${extracted.avatarId}) → 页内 0 张动画图`);
          noAnim++;
        }
      }
    } catch (e) {
      console.error(`  ${progress} ${name} → 失败: ${e.message}`);
      failed++;
    }

    if (i < chars.length - 1) await sleep(DELAY);
  }

  console.log(`\n[3/4] 合并既有数据 → ${OUT_PATH.pathname}`);
  let prev = {};
  if (!fresh) {
    try {
      prev = JSON.parse(readFileSync(OUT_PATH, 'utf-8'));
    } catch {
    }
  }
  const merged = {};
  for (const [cid, types] of Object.entries(prev)) merged[cid] = { ...types };
  let addedChars = 0, addedEntries = 0;
  for (const [cid, types] of Object.entries(result)) {
    if (!merged[cid]) { merged[cid] = {}; addedChars++; }
    for (const [type, list] of Object.entries(types)) {
      const before = (merged[cid][type] || []).length;
      mergeTypes(merged[cid], { [type]: list });
      addedEntries += merged[cid][type].length - before;
    }
  }
  /* 不变量：`title` 只能是名称令牌，非令牌的一律删除。
     这里兜的是**联合模式沿用下来的历史值**——wiki 页本轮不再下发的条目会保留旧 `title`，
     其中若有中文（主角 8001 实测 3 条）就会在非中文语言的选择器里继续露中文。 */
  for (const types of Object.values(merged)) {
    for (const arr of Object.values(types)) {
      for (const e of arr || []) {
        if (!e) continue;
        if (typeof e.title === 'string' && !e.title.startsWith('$t:')) delete e.title;
        /* 历史字段清理：曾把无词条的 wiki 中文小标题存进 `wikiTitle`，它会留在结构层里 */
        if ('wikiTitle' in e) delete e.wikiTitle;
      }
    }
  }

  const carried = [];
  for (const [cid, types] of Object.entries(merged)) {
    for (const type of Object.keys(types)) {
      if (!result[cid] || !result[cid][type]) carried.push(`${cid}.${type}`);
    }
  }
  const entryTotal = Object.values(merged).reduce(
    (s, types) => s + Object.values(types).reduce((n, arr) => n + arr.length, 0), 0,
  );
  const json = pretty ? JSON.stringify(merged, null, 2) : JSON.stringify(merged);
  writeFileSync(OUT_PATH, json + '\n', 'utf-8');
  console.log(`  ${Object.keys(merged).length} 个角色 / ${entryTotal} 条动画；本轮新增 ${addedChars} 角色、${addedEntries} 条`);
  const packs = writeTitlePacks(merged);
  if (packs) console.log(`  标题令牌语言包：${packs} 份（值借用 characters 分组）`);
  if (carried.length) console.log(`  ⚠ 本轮未抓到、沿用既有：${carried.join(', ')}`);

  console.log('\n[4/4] 覆盖报告');
  if (unknownTags.size) {
    const tags = [...unknownTags.entries()].sort((a, b) => b[1] - a[1]).map(([t, n]) => `${t}×${n}`).join('  ');
    console.log(`  未识别标签（不在映射表且反查不到技能名）：${tags}`);
  }
  reportCoverage(merged, pageInfo);

  console.log(`\n=== 完成 ===`);
  console.log(`  有动画: ${success} | 页内无图: ${noAnim} | 无 avatarId: ${noAvatar} | 失败: ${failed}`);
}

main().catch(e => { console.error(e); process.exit(1); });
