/**
 * 技能审计脚本：遍历 CDN 全角色数据，检测：
 * 1. 被 groupSkills 过滤逻辑排除的技能（原版网页显示但当前实现不显示）
 * 2. 已显示技能的图标 URL 在 CDN 上 404 的情况
 * 用法：node tools/skill-audit.mjs
 */
const CDN = 'https://static.nanoka.cc';

/* ─── 复制前端过滤逻辑（src/lib/constants.ts + CharacterView.vue groupSkills） ─── */
const SKILL_ORDER = ['Normal', 'BPSkill', 'Ultra', 'Passive', 'ElationDamage', null, 'Maze', 'Assist'];
const SKILL_ICON_KEY = {
  Normal: 'Normal', BPSkill: 'BP', Ultra: 'Ultra',
  Passive: 'Passive', Maze: 'Maze', Servant: 'Servant',
  ServantPassive: 'ServantPassive',
  MazeNormal: 'Normal', ElationDamage: 'Elation', Assist: 'Ultra',
};
const SERVANT_ICON_KEY = {
  '11402': 'Servant01', '11407': 'Servant01', '11413': 'Servant03', '18007': 'Servant01',
};
const TRAILBLAZER_ICON_FALLBACK = {
  '8002': '8001', '8004': '8003', '8006': '8005', '8008': '8007',
};
const SKILL_ICON_KEY_BY_NAME = {
  '普攻': 'Normal', '战技': 'BP', '终结技': 'Ultra',
  '天赋': 'Passive', '秘技': 'Maze', '忆灵技': 'Servant',
  '忆灵天赋': 'ServantPassive', '欢愉技': 'Elation', '助战技': 'Ultra',
};

function memospriteId(charId, data) {
  const icon = data && data.memosprite && data.memosprite.icon;
  if (icon) {
    const m = icon.match(/(\d+)/);
    if (m) return m[1];
  }
  return charId ? '1' + charId : '';
}

function skillIconUrl(sk, charId, data) {
  const key = SKILL_ICON_KEY[sk.type] || (sk.type_name && SKILL_ICON_KEY_BY_NAME[sk.type_name]) || '';
  if (!key || !charId) return '';
  let id = (key === 'Servant' || key === 'ServantPassive') ? memospriteId(charId, data) : charId;
  if (!id) return '';
  const iconKey = key === 'Servant' ? (SERVANT_ICON_KEY[id] || key) : key;
  id = TRAILBLAZER_ICON_FALLBACK[id] || id;
  return `${CDN}/assets/hsr/skillicons/SkillIcon_${id}_${iconKey}.webp`;
}

/** 与前端 groupSkills 完全一致的过滤条件，返回 [通过, 被过滤(含原因)] */
function analyzeSkills(skills) {
  const shown = [];
  const hidden = [];
  for (const s of Object.values(skills || {})) {
    const reasons = [];
    if (s.type === 'MazeNormal') reasons.push('type=MazeNormal(显式排除)');
    if (!s.type_name) reasons.push('type_name为空');
    if (!SKILL_ORDER.includes(s.type)) reasons.push(`type="${s.type}"不在SKILL_ORDER中`);
    if (reasons.length) hidden.push({ sk: s, reasons });
    else shown.push(s);
  }
  return { shown, hidden };
}

/* ─── 网络工具 ─── */
async function fetchJson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}: ${url}`);
  return r.json();
}

const iconCache = new Map();
async function checkIcon(url) {
  if (!url) return { url, status: 'empty' };
  if (iconCache.has(url)) return { url, status: iconCache.get(url) };
  try {
    const r = await fetch(url, { method: 'HEAD' });
    const st = r.ok ? 'ok' : `HTTP ${r.status}`;
    iconCache.set(url, st);
    return { url, status: st };
  } catch (e) {
    iconCache.set(url, 'network-error');
    return { url, status: 'network-error' };
  }
}

/* ─── 主流程 ─── */
async function main() {
  console.log('=== HSR Wiki 技能审计 ===\n');

  // 1. manifest
  const manifest = await fetchJson(`${CDN}/manifest.json`);
  const ver = manifest.hsr?.latest || manifest.hsr?.available?.[0];
  console.log(`数据版本: ${ver}\n`);

  // 2. 角色列表
  const charList = await fetchJson(`${CDN}/hsr/${ver}/character.json`);
  const charIds = Object.keys(charList).sort((a, b) => Number(a) - Number(b));
  console.log(`角色总数: ${charIds.length}\n`);

  const hiddenReport = [];  // { charId, name, skills: [{id, name, type, type_name, reasons}] }
  const iconReport = [];    // { charId, name, missing: [{skillName, type, url, status}] }
  let processed = 0;

  // 并发控制
  const CONCURRENCY = 6;
  let idx = 0;
  async function worker() {
    while (idx < charIds.length) {
      const charId = charIds[idx++];
      try {
        const d = await fetchJson(`${CDN}/hsr/${ver}/zh/character/${charId}.json`);
        const name = d.name || charId;

        // 3. 过滤分析（主体 skills）
        const { shown, hidden } = analyzeSkills(d.skills);
        if (hidden.length) {
          hiddenReport.push({
            charId, name,
            skills: hidden.map(h => ({
              id: h.sk.id, name: h.sk.name, type: h.sk.type,
              type_name: h.sk.type_name, reasons: h.reasons,
            })),
          });
        }

        // 4. 图标检查（显示的技能 + 忆灵技能）
        const allShown = [...shown];
        if (d.memosprite && d.memosprite.skills) {
          allShown.push(...Object.values(d.memosprite.skills));
        }
        const missing = [];
        for (const sk of allShown) {
          const url = skillIconUrl(sk, charId, d);
          const res = await checkIcon(url);
          if (res.status !== 'ok') {
            missing.push({ skillName: sk.name, type: sk.type, type_name: sk.type_name, url, status: res.status });
          }
        }
        if (missing.length) iconReport.push({ charId, name, missing });

        processed++;
        if (processed % 20 === 0) process.stdout.write(`\r已处理: ${processed}/${charIds.length}`);
      } catch (e) {
        console.error(`\n[跳过] ${charId}: ${e.message}`);
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  console.log(`\r已处理: ${processed}/${charIds.length}\n`);

  /* ─── 输出报告 ─── */
  console.log('════════════════════════════════════════════════════════');
  console.log('【一】原版数据中存在、但当前实现不显示的技能');
  console.log('════════════════════════════════════════════════════════\n');
  if (!hiddenReport.length) {
    console.log('  无（所有技能均正常显示）\n');
  } else {
    // 按原因分类统计
    const byReason = {};
    for (const r of hiddenReport) {
      for (const s of r.skills) {
        for (const reason of s.reasons) {
          const key = reason.replace(/type="([^"]+)"/, 'type="$1"');
          if (!byReason[key]) byReason[key] = [];
          byReason[key].push(`${r.name}(${r.charId}) - ${s.name} [id:${s.id}]`);
        }
      }
    }
    for (const [reason, items] of Object.entries(byReason)) {
      console.log(`  ▸ 原因: ${reason} （${items.length} 条）`);
      for (const it of items.slice(0, 30)) console.log(`    - ${it}`);
      if (items.length > 30) console.log(`    ... 还有 ${items.length - 30} 条`);
      console.log('');
    }
    // 逐角色明细
    console.log('  ── 逐角色明细 ──');
    for (const r of hiddenReport) {
      console.log(`  [${r.charId}] ${r.name}:`);
      for (const s of r.skills) {
        console.log(`    ✗ ${s.name} (id:${s.id}, type:${s.type ?? 'null'}, type_name:${s.type_name || '空'}) → ${s.reasons.join('; ')}`);
      }
    }
    console.log('');
  }

  console.log('════════════════════════════════════════════════════════');
  console.log('【二】已显示技能的图标在 CDN 上缺失（404/异常）');
  console.log('════════════════════════════════════════════════════════\n');
  if (!iconReport.length) {
    console.log('  无（所有图标均正常）\n');
  } else {
    for (const r of iconReport) {
      console.log(`  [${r.charId}] ${r.name}:`);
      for (const m of r.missing) {
        console.log(`    ✗ ${m.skillName} (type:${m.type ?? 'null'}, ${m.type_name || ''}) → ${m.status}`);
        console.log(`      ${m.url}`);
      }
    }
    console.log('');
  }

  console.log('════════════════════════════════════════════════════════');
  console.log(`审计完成: ${processed} 个角色, 隐藏技能涉及 ${hiddenReport.length} 个角色, 图标缺失涉及 ${iconReport.length} 个角色`);
}

main().catch(e => { console.error(e); process.exit(1); });
