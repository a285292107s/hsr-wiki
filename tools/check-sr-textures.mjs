/**
 * StarRailTextures 仓库覆盖度核对脚本（jsDelivr 加速源）
 *
 * 用途：以项目实际数据驱动的文件名集合，逐一验证 StarRailTextures 仓库（经 jsDelivr）
 *       对 17 个 CDN 分类的命中率，并输出映射分类（rank/trace/pathicon/element 等）的
 *       官方路径映射结果，为"以 jsDelivr 取缔 nanoka"提供事实依据。
 *
 * 用法：node tools/check-sr-textures.mjs [--limit N]
 *   --limit N：每个分类最多验证 N 个 URL（默认 120；数字 ID 类全量）
 * 输出：控制台命中率报告 + temp/sr-textures-audit.json（明细）
 *
 * 已知事实（数据源 AvatarRankConfig 验证）：
 *   星魂 3/5 官方无独立图标，IconPath 复用技能图标（Rank3→Ultra、Rank5→BP），
 *   故仓库 skillicons/avatar/{id}/ 下不存在 Rank3/Rank5 文件属预期（迁移时数据驱动）。
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = join(ROOT, 'public/data/cn');
const LIMIT = Number(process.argv.find((a) => a.startsWith('--limit='))?.split('=')[1] ?? 120);
// jsDelivr 固定 commit（StarRailTextures 仓库 4.3 快照；升级时同步改此处 + purge）
const GH = 'https://cdn.jsdelivr.net/gh/umaichanuwu/StarRailTextures@2a4b9a7eb7ac9db7f48d627fa5cdfd3822c902ce/assets/asbres/spriteoutput';

/* ─── 数据读取 ─── */
function loadJson(f) {
  try { return JSON.parse(readFileSync(join(DATA, f), 'utf8')); } catch { return null; }
}
function asList(d) { return Array.isArray(d) ? d : Object.values(d); }

/* ─── 文件名集合抽取（真实数据驱动；gridfight 为 {sub,name} 携带官方子路径） ─── */
const charIds = asList(loadJson('characters.json') || []).map((c) => c.id).filter(Boolean);
const lcIds = asList(loadJson('light_cones.json') || []).map((c) => c.id).filter(Boolean);
const gfFlat = (f) => Object.values(loadJson(f) || {}).flat().filter(Boolean); // 顶层对象、值嵌套数组

const SAMPLES = {
  avatarshopicon: charIds,
  avatardrawcard: charIds,
  avatarroundicon: charIds,
  lightconemediumicon: lcIds,
  itemfigures: [...new Set(asList(loadJson('items.json') || []).map((i) => (String(i.icon || '').match(/(\d+)\.png$/) || [])[1]).filter(Boolean))],
  monstermiddleicon: [...new Set(asList(loadJson('monsters.json') || []).map((m) => String(m.icon || '').split('/').pop()?.replace(/\.png$/i, '')).filter(Boolean))],
  monsterfigure: [...new Set(asList(loadJson('monsters.json') || []).map((m) => String(m.image || m.figure || m.icon || '').split('/').pop()?.replace(/\.png$/i, '')).filter(Boolean))],
  relicfigures: [
    ...asList(loadJson('relics.json') || []).flatMap((r) => [1, 2, 3, 4, 5, 6].map((n) => `IconRelic_${r.id}_${n}`)),
    'IconRelicBody', 'IconRelicFoot', 'IconRelicNeck', 'IconRelicGoods',
  ],
  skillicons: [
    ...charIds.flatMap((id) => ['Normal', 'BP', 'Ultra', 'Passive', 'Maze'].map((k) => `SkillIcon_${id}_${k}`)),
    // 忆灵技能：文件名按忆灵 ID、目录按角色 ID（忆灵 ID - 10000；18007 → 8007 开拓者特例）
    ...['11402', '11407', '11413', '11415', '18007'].flatMap((id) => [`SkillIcon_${id}_ServantPassive`, `SkillIcon_${id}_Servant01`]),
  ],
  rank: charIds.flatMap((id) => [1, 2, 3, 4, 5, 6].map((n) => `SkillIcon_${id}_Rank${n}`)),
  trace: ['Attack', 'MaxHP', 'Defence', 'Speed', 'CriticalChance', 'CriticalDamage', 'BreakUp',
    'StatusProbability', 'StatusResistance', 'Joy', 'PhysicalAddedRatio', 'FireAddedRatio',
    'IceAddedRatio', 'ThunderAddedRatio', 'WindAddedRatio', 'QuantumAddedRatio', 'ImaginaryAddedRatio'],
  element: asList(loadJson('elements.json') || []).map((e) => e.id || e.ID).filter(Boolean),
  pathicon: asList(loadJson('paths.json') || []).map((p) => p.id || p.ID).filter(Boolean),
  achievement: [...new Set(asList(loadJson('achievement_series.json') || []).map((s) => s.icon).filter(Boolean))],
  bufficon: [...new Set(['maze.json', 'maze_extra.json', 'maze_boss.json', 'maze_peak.json']
    .flatMap((f) => asList(loadJson(f) || []).flatMap((e) => (e.buffs || []).map((b) => b.icon)))
    .filter(Boolean))],
  'gridfight-equipment': gfFlat('currency/equipment.json')
    .map((e) => { const m = String(e.icon || '').match(/GridFight\/([^/]+)\/([^/]+)\.png$/i); return m ? { sub: m[1], name: m[2] } : null; })
    .filter(Boolean),
  'gridfight-icon': gfFlat('currency/traits.json')
    .map((t) => { const m = String(t.icon || '').match(/TraitIcon\/([^/]+)\/([^/]+)\.png$/i); return m ? { sub: m[1], name: m[2] } : null; })
    .filter(Boolean),
};

/* ─── 官方路径映射规则（分类 → 仓库相对路径构造） ─── */
const PROFESSION_MAP = { Priest: 'Pirest', Elation: 'Joy' }; // 官方拼写差异
const RULES = {
  avatarshopicon: (f) => `avatarshopicon/avatar/${f}.png`,
  avatardrawcard: (f) => `avatardrawcard/${f}.png`,
  avatarroundicon: (f) => `avatarroundicon/avatar/${f}.png`,
  lightconemediumicon: (f) => `lightconemediumicon/${f}.png`,
  itemfigures: (f) => `itemfigures/${f}.png`,
  monstermiddleicon: (f) => `monstermiddleicon/${f}.png`,
  monsterfigure: (f) => `monsterfigure/${f}.png`,
  relicfigures: (f) => `relicfigures/${f}.png`,
  skillicons: (f) => {
    const id = f.match(/\d+/)[0];
    // 忆灵技能文件名以忆灵 ID 为前缀（SkillIcon_11402_Servant*），仓库目录按角色 ID 组织（忆灵 ID - 10000）
    const dir = /_Servant/.test(f) && Number(id) > 10000 ? String(Number(id) - 10000) : id;
    return `skillicons/avatar/${dir}/${f}.png`;
  },
  rank: (f) => { const [, id, n] = f.match(/^SkillIcon_(\d+)_Rank(\d)$/); return `skillicons/avatar/${id}/SkillIcon_${id}_Rank${n}.png`; },
  trace: (f) => `ui/avatar/icon/Icon${f}.png`,
  element: (f) => `icondamagetype/IconDamageType${f[0].toUpperCase()}${f.slice(1).toLowerCase()}.png`,
  pathicon: (f) => `professioniconmiddle/IconProfession${PROFESSION_MAP[f] || f}Middle.png`,
  achievement: (f) => `achievement/${f}.png`,
  bufficon: (f) => `bufficon/${f.replace(/^BuffIcon\//i, '').split('/').map((s, i, a) => (i < a.length - 1 ? s.toLowerCase() : s)).join('/')}.png`,
  'gridfight-equipment': (o) => `gridfight/${o.sub.toLowerCase()}/${o.name}.png`,
  'gridfight-icon': (o) => `gridfight/traiticon/${o.sub.toLowerCase()}/${o.name}.png`,
};

/* ─── 验证（并发池） ─── */
async function pool(items, worker, size = 10) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await worker(items[idx], idx);
    }
  }));
  return out;
}

async function check(url) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 8000);
  try {
    const r = await fetch(url, { signal: ctl.signal, redirect: 'follow' });
    return r.status;
  } catch {
    return -1;
  } finally { clearTimeout(t); }
}

/** 非 200 重试一次（jsDelivr 瞬时抖动会误报缺失） */
async function checkRetry(url) {
  const first = await check(url);
  if (first === 200) return 200;
  await new Promise((r) => setTimeout(r, 400));
  return check(url);
}

/* ─── 主流程 ─── */
const report = {};
let grand = { ok: 0, miss: 0 };
console.log(`StarRailTextures 覆盖度核对（limit=${LIMIT}/分类）\n${'─'.repeat(72)}`);

for (const [cat, files] of Object.entries(SAMPLES)) {
  const uniq = [...new Set(files)].filter(Boolean);
  const picked = uniq.slice(0, LIMIT);
  const urls = picked.map((f) => ({ f, url: `${GH}/${RULES[cat](f)}` }));
  const statuses = await pool(urls, (u) => checkRetry(u.url));
  const ok = statuses.filter((s) => s === 200).length;
  const miss = statuses.length - ok;
  const missSamples = urls.filter((_, i) => statuses[i] !== 200).slice(0, 5).map((u) => u.url.slice(GH.length + 1));
  grand.ok += ok; grand.miss += miss;
  report[cat] = { total: picked.length, ok, miss, missSamples };
  console.log(`${cat.padEnd(20)} ${String(ok).padStart(4)}/${picked.length}  ${miss ? `✗ 缺失 ${miss} 例: ${missSamples.join(' | ')}`.slice(0, 100) : '✓ 全命中'}`);
}

console.log('─'.repeat(72));
console.log(`合计 ${grand.ok + grand.miss} 个 URL：命中 ${grand.ok}（${(grand.ok / (grand.ok + grand.miss) * 100).toFixed(1)}%）/ 缺失 ${grand.miss}`);
const outPath = join(ROOT, 'temp/sr-textures-audit.json');
writeFileSync(outPath, JSON.stringify(report, null, 1));
console.log(`明细已存 ${outPath}`);
