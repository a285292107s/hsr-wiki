/**
 * 米游社 Wiki 技能动画抓取工具
 * 从 act-api-takumi-static.mihoyo.com 提取所有角色的技能动画 URL，
 * 输出 public/data/cn/skill_animations.json 供前端使用。
 *
 * 用法：node tools/wiki-anim-scraper.mjs [--pretty] [--delay=300]
 *   --pretty  缩进输出（调试用）
 *   --delay   请求间隔毫秒数（默认 300，避免触发限流）
 */

const LIST_API = 'https://act-api-takumi-static.mihoyo.com/common/blackboard/sr_wiki/v1/home/content/list?app_sn=sr_wiki&channel_id=18';
const INFO_API = 'https://act-api-takumi-static.mihoyo.com/common/blackboard/sr_wiki/v1/content/info?app_sn=sr_wiki&content_id=';

/** wiki tag → 前端技能 type 映射 */
const TAG_TO_TYPE = {
  '普攻': 'Normal',
  '战技': 'BPSkill',
  '终结技': 'Ultra',
  '天赋': 'Passive',
  '秘技': 'Maze',
};

/** wiki 页面 avatarId 缺失/错误的已知修正（wiki 数据录入问题） */
const AVATAR_ID_FIX = {
  '白露': '1211',
};

const args = process.argv.slice(2);
const pretty = args.includes('--pretty');
const delayArg = args.find(a => a.startsWith('--delay='));
const DELAY = delayArg ? parseInt(delayArg.split('=')[1], 10) : 300;

const OUT_PATH = new URL('../public/data/cn/skill_animations.json', import.meta.url);

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}: ${url}`);
  return r.json();
}

/** 从 wiki content/info 响应中提取技能动画 */
function extractAnimations(data) {
  const content = data?.data?.content;
  if (!content) return null;

  const rpg = content.rpg_new_tmp_content;
  if (!rpg) return null;

  const avatarId = rpg?.base?.userInfo?.avatarId;
  const title = content.title || '';
  // wiki 部分页面 avatarId 为 0（数据录入缺失），按标题查修正表
  const fixedId = (!avatarId || avatarId === '0') ? AVATAR_ID_FIX[title] : null;
  const finalId = fixedId || avatarId;
  if (!finalId || finalId === '0') return null;

  // 找角色行迹模块 (id=13)
  const modules = rpg.modules || [];
  const traceModule = modules.find(m => m.id === '13' || m.name === '角色行迹');
  if (!traceModule) return { avatarId: finalId, skills: {} };

  const comps = traceModule.components || [];
  if (!comps.length || !comps[0].data) return { avatarId: finalId, skills: {} };

  let skillData;
  try {
    skillData = JSON.parse(comps[0].data);
  } catch {
    return { avatarId: finalId, skills: {} };
  }

  const points = skillData.points || [];
  const skills = {};

  for (const p of points) {
    const tag = (p.tag || '').trim();
    const type = TAG_TO_TYPE[tag];
    if (!type) continue; // 跳过"额外能力"/"属性加成"

    const subList = p.subList || [];
    const anims = subList
      .map(sub => ({
        url: sub.image || '',
        title: (sub.subTitle || '').trim(),
        width: sub.imageMeta?.image?.width || 960,
        height: sub.imageMeta?.image?.height || 514,
      }))
      .filter(a => a.url && (a.url.endsWith('.webp') || a.url.endsWith('.gif')));

    if (!anims.length) continue;

    // 同一 type 可能有多个 point（如终结技多段），合并
    if (!skills[type]) skills[type] = [];
    for (const a of anims) {
      skills[type].push({
        url: a.url,
        ...(a.title ? { title: a.title } : {}),
      });
    }
  }

  return { avatarId: finalId, skills };
}

async function main() {
  console.log('=== 米游社 Wiki 技能动画抓取 ===\n');

  // 1. 获取角色列表
  console.log('[1/3] 获取角色列表...');
  const listData = await fetchJSON(LIST_API);
  const categories = listData?.data?.list || [];
  const charCategory = categories.find(c => c.name === '角色') || categories[0];
  const chars = charCategory?.list || [];
  console.log(`  找到 ${chars.length} 个角色\n`);

  if (!chars.length) {
    console.error('错误：未获取到角色列表');
    process.exit(1);
  }

  // 2. 逐个获取动画数据
  console.log('[2/3] 逐个抓取技能动画...');
  const result = {}; // charId → { type → [{url, title?}] }
  let success = 0, skipped = 0, failed = 0;

  for (let i = 0; i < chars.length; i++) {
    const entry = chars[i];
    const cid = entry.content_id;
    const name = entry.title || '?';
    const progress = `[${i + 1}/${chars.length}]`;

    try {
      const data = await fetchJSON(INFO_API + cid);
      const extracted = extractAnimations(data);

      if (!extracted) {
        console.log(`  ${progress} ${name} → 无数据，跳过`);
        skipped++;
      } else if (!Object.keys(extracted.skills).length) {
        console.log(`  ${progress} ${name} (${extracted.avatarId}) → 无动画`);
        skipped++;
      } else {
        const animCount = Object.values(extracted.skills).reduce((s, arr) => s + arr.length, 0);
        console.log(`  ${progress} ${name} (${extracted.avatarId}) → ${animCount} 个动画 ✓`);
        result[extracted.avatarId] = extracted.skills;
        success++;
      }
    } catch (e) {
      console.error(`  ${progress} ${name} → 失败: ${e.message}`);
      failed++;
    }

    if (i < chars.length - 1) await sleep(DELAY);
  }

  // 3. 输出
  console.log(`\n[3/3] 写入 ${OUT_PATH.pathname}`);
  const json = pretty
    ? JSON.stringify(result, null, 2)
    : JSON.stringify(result);

  const { writeFileSync } = await import('node:fs');
  writeFileSync(OUT_PATH, json + '\n', 'utf-8');

  const sizeKB = (Buffer.byteLength(json) / 1024).toFixed(1);
  console.log(`\n=== 完成 ===`);
  console.log(`  成功: ${success} | 跳过: ${skipped} | 失败: ${failed}`);
  console.log(`  输出: ${sizeKB} KB`);
}

main().catch(e => { console.error(e); process.exit(1); });
