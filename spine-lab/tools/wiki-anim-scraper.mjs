
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
    for (const a of anims) skills[type].push(a.title ? { url: a.url, title: a.title } : { url: a.url });
  }

  return { avatarId: finalId, skills, points: points.length, form: template.points.length ? 'template' : 'structured' };
}

function mergeTypes(target, incoming) {
  for (const [type, list] of Object.entries(incoming)) {
    const cur = target[type] || (target[type] = []);
    const seen = new Set(cur.map(a => a.url));
    for (const a of list) {
      if (seen.has(a.url)) continue;
      cur.push(a);
      seen.add(a.url);
    }
  }
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
