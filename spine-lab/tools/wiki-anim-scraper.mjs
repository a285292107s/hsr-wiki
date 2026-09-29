/**
 * 米游社 Wiki 技能动画抓取
 * 源：act-api-takumi-static.mihoyo.com（sr_wiki blackboard）角色页 content/info，两种下发形态都要解析：
 *   ① 结构化 rpg_new_tmp_content.modules[13]（角色行迹）points[].subList[].image
 *   ② OBC 预渲染模板 data.content.contents[].text 里 obc-tmpl-character__trace 的 li 区块（结构化为空时的唯一来源）
 * 输出：public/data/cn/skill_animations.json（charId → 技能类型键 → [{url,title?}]）；
 *   前端链路 src/services/api/characters.ts → CharacterView → SkillsPanel 按技能 type 查表
 * 用法：node spine-lab/tools/wiki-anim-scraper.mjs [--pretty] [--delay=300] [--fresh]
 *   --pretty  缩进输出（仅调试；入库用压缩单行）
 *   --delay   请求间隔毫秒（默认 300，防限流）
 *   --fresh   丢弃既有条目重建；默认与既有文件按 url 取并集——wiki 页面临时改版/缺图不得删掉已发布数据
 * 硬约束：
 *   - 输出路径相对本文件必须是 ../../public/data/cn/（前端按 /data/cn/… 取数，禁止写到 spine-lab 下）
 *   - 只收 .gif/.webp 动画媒体；.png 是静态技能插画（如昔涟忆灵「献予…之诗」440×672），不进「技能预览」
 *   - 标签既不在映射表也反查不到技能名 → 计入末尾报告，禁止静默丢弃
 *   - 禁止只看结构化字段就判定「该页无数据」：先确认 contents[] 模板里也没有行迹区块（椒丘 3058 即此坑）
 */

import { readFileSync, writeFileSync } from 'node:fs';

const LIST_API = 'https://act-api-takumi-static.mihoyo.com/common/blackboard/sr_wiki/v1/home/content/list?app_sn=sr_wiki&channel_id=18';
const INFO_API = 'https://act-api-takumi-static.mihoyo.com/common/blackboard/sr_wiki/v1/content/info?app_sn=sr_wiki&content_id=';

/** wiki tag → 前端技能 type（主技能；tag 与角色数据 type_name 一一对应） */
const TAG_TO_TYPE = {
  '普攻': 'Normal',
  '战技': 'BPSkill',
  '终结技': 'Ultra',
  '天赋': 'Passive',
  '秘技': 'Maze',
  '欢愉技': 'ElationDamage',
};

/** 忆灵（记忆命途召唤物）技能：忆灵技在角色数据里 type='Servant'；
 *  忆灵天赋的 type 是空串 → 用 SkillType 已声明的 'ServantPassive' 作合成键（前端同规则回查） */
const MEMO_TAG_TO_TYPE = { '忆灵技': 'Servant', '忆灵天赋': 'ServantPassive' };

/** 非技能条目（行迹属性加成 / 晋阶），命中即跳过，且不计入「未识别标签」告警 */
const SKIP_TAGS = new Set(['额外能力', '属性加成', '属性强化', '攻击强化', '生命强化', '防御强化', '角色晋阶']);

/** wiki 页面 avatarId 缺失/错误的已知修正（wiki 数据录入问题） */
const AVATAR_ID_FIX = {
  '白露': '1211',
};

const args = process.argv.slice(2);
const pretty = args.includes('--pretty');
const fresh = args.includes('--fresh');
const delayArg = args.find(a => a.startsWith('--delay='));
const DELAY = delayArg ? parseInt(delayArg.split('=')[1], 10) : 300;

/** 仓库根 public/data（相对本文件）；只读项供技能名兜底与覆盖报告 */
const OUT_PATH = new URL('../../public/data/cn/skill_animations.json', import.meta.url);
const CHAR_LIST_PATH = new URL('../../public/data/cn/characters.json', import.meta.url);
const CHAR_DIR = new URL('../../public/data/cn/characters/', import.meta.url);

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}: ${url}`);
  return r.json();
}

/** 技能名 → type（只读本地 converter 输出）。wiki 个别页（content_id 3124「开拓者·毁灭」）
 *  拿技能名当 tag，映射表命中不到，按技能名反查可救回；文件缺失时返回 null 走降级 */
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

/** 技能名 → type：先整串匹配，再按 '/' 拆开逐个匹配（多形态技能拼接 tag） */
function resolveByName(tag, nameMap) {
  if (nameMap[tag]) return nameMap[tag];
  for (const part of tag.split('/')) {
    const hit = nameMap[part.trim()];
    if (hit) return hit;
  }
  return '';
}

/** 结构化形态：rpg_new_tmp_content 的行迹模块 → [{tag, entries:[{url,title}]}]
 *  模块查找：新角色页名带后缀（「角色行迹前瞻【请以正式版本为准】」），故 id 优先、名前缀兜底 */
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
    // 每个 subList 自带 subTitle（多段终结技的分段名）——逐条保留，勿压成「整点一个标题」
    entries: (p.subList || []).map(s => ({ url: s.image || '', title: (s.subTitle || '').trim() })),
  }));
}

/** OBC 预渲染模板形态：老页面迁到新版渲染器后，行迹数据只存在于 `data.content.contents[].text` 的 HTML 里，
 *  结构化 rpg_new_tmp_content 为空（实测椒丘 3058 是当前唯一一例——只解析结构化字段会把它误判成「无数据」）。
 *  avatarId 在 `.obc-tmpl-character__trace__role`；类型标签与结构化形态共用同一套词表 */
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
      // 名称只取 trace__name 区块（其前是 trace__icon，图标 URL 会污染纯文本提取）
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

/** 从 wiki content/info 响应中提取技能动画；unknownTags 累计未识别标签（tag → 出现次数） */
function extractAnimations(data, unknownTags) {
  const content = data?.data?.content;
  if (!content) return null;

  const rpg = content.rpg_new_tmp_content;
  const template = templatePoints(content.contents);

  const avatarId = rpg?.base?.userInfo?.avatarId;
  const title = content.title || '';
  // wiki 部分页面 avatarId 为 0（数据录入缺失），按标题查修正表
  const fixedId = (!avatarId || avatarId === '0') ? AVATAR_ID_FIX[title] : null;
  const finalId = fixedId || avatarId || template.avatarId;
  if (!finalId || finalId === '0') return null;

  const points = [...structuredPoints(rpg), ...template.points];
  const nameMap = loadSkillNameMap(finalId);
  const skills = {};

  for (const p of points) {
    const tag = (p.tag || '').trim();
    if (!tag || tag === 'undefined' || SKIP_TAGS.has(tag)) continue;
    // 名称兜底：wiki 个别页用技能名当 tag，多形态技能用 'A/B/C' 拼接（3124「星尘王牌/全胜•再见安打/…」）
    const type = TAG_TO_TYPE[tag] || MEMO_TAG_TO_TYPE[tag] || (nameMap ? resolveByName(tag, nameMap) : '');
    if (!type) {
      unknownTags.set(tag, (unknownTags.get(tag) || 0) + 1);
      continue;
    }

    const anims = (p.entries || []).filter(a => a.url.endsWith('.webp') || a.url.endsWith('.gif'));
    if (!anims.length) continue;

    // 同一 type 多 point（终结技多段 / 强化变体）合并
    if (!skills[type]) skills[type] = [];
    for (const a of anims) skills[type].push(a.title ? { url: a.url, title: a.title } : { url: a.url });
  }

  return { avatarId: finalId, skills, points: points.length, form: template.points.length ? 'template' : 'structured' };
}

/** charId → type → 条目，按 url 取并集（同 avatarId 多页 / 同一轮多 point 都不重复） */
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

/** 覆盖报告：已知角色里哪些 skill type 仍无预览，并给出 wiki 侧原因（只读本地数据，失败静默） */
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
      // 与 SkillsPanel 同口径：只统计会渲染的技能（主技能要求 type_name 非空；忆灵技能按合成键）
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

  // 1. 获取角色列表
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

  // 2. 逐个获取动画数据
  console.log('[2/4] 逐个抓取技能动画...');
  const result = {}; // charId → { type → [{url, title?}] }
  const unknownTags = new Map();
  const pageInfo = new Map(); // charId → { title, points, anims }
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

  // 3. 与既有文件合并后写盘（并集：页面临时失败不得删掉已发布条目）
  console.log(`\n[3/4] 合并既有数据 → ${OUT_PATH.pathname}`);
  let prev = {};
  if (!fresh) {
    try {
      prev = JSON.parse(readFileSync(OUT_PATH, 'utf-8'));
    } catch {
      /* 首次生成：无既有文件 */
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

  // 4. 覆盖报告
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
