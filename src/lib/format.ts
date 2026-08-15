/**
 * 纯函数工具（barrel）：数值格式化 / 强化模式视图构建 / 数据校验。
 * 已拆分子模块并在此 re-export 保持旧导入路径兼容：
 * - ./html  ：转义与富文本标签（escHtml / gameTagsToHtml / stripTags / stripAllTags）
 * - ./icons ：图标 URL 构造器（iconUrl / skillIconUrl / itemName…）
 */
import { gameTagsToHtml } from './html';
import { MAX_CHAR_LEVEL, STANCE_LABEL, STANCE_TAG } from './constants';
import { NkError } from './errors';
import type { CharacterData, CharStats, Skill } from '../services/types';

export * from './html';
export * from './icons';

/* ─── 数值格式化 ─── */

export function fmtVal(v: number | null | undefined, tag: string, isPct: boolean): string {
  if (v == null) return '?';
  let n = v;
  if (isPct) n = n * 100;
  if (tag === 'i') return String(Math.round(n));
  if (/^f[1-6]$/.test(tag)) {
    const f = 10 ** Number(tag.slice(1));
    return String(Math.round(n * f) / f);
  }
  /* 裸 #N 占位符（无 tag 无 %）：参数原样显示，不四舍五入——
     整数参数 String 与 round 结果一致，常规模式不受影响。
     货币战争光锥描述走 fmtDescWithFormat（ParamFormat 标注 [i]%），不经过此分支。 */
  return String(n);
}

/**
 * 按 ParamFormat 模板渲染描述（货币战争专属光锥：desc 为裸 #N + ParamFormat "[i]%"）。
 * 将裸 #N 注入模板 tag/百分号后复用 fmtDesc（0.12 → "12%"）；无模板时回退 fmtDesc 原样。
 * 全量验证（2026-08-15）：GridFightBackEquipment.ParamFormat 165/165 为 "[i]%"。
 */
export function fmtDescWithFormat(
  desc: string | null | undefined,
  params: number[] | null | undefined,
  format: string | null | undefined,
): string {
  if (!desc) return '';
  if (!format) return fmtDesc(desc, params);
  const m = format.match(/^\[([^\]]*)\](%?)$/);
  if (!m) return fmtDesc(desc, params);
  const tag = m[1] || 'i';
  const pct = m[2] || '';
  // 裸 #N（未带 [tag] 的）统一注入模板：如 #1 → #1[i]%（已带 tag 的保持原样，防双写）
  const s = desc.replace(/#(\d+)(?!\[)/g, `#$1[${tag}]${pct}`);
  return fmtDesc(s, params);
}

/**
 * 渲染技能描述：替换 #N[tag]% 占位符为参数值。
 */
export function fmtDesc(
  desc: string | null | undefined,
  params?: number[] | null,
): string {
  if (!desc) return '';
  let s = gameTagsToHtml(desc);
  const rep = (i: string, t: string, pct: string): string => {
    const n = fmtVal(params && params[parseInt(i) - 1], t, pct === '%');
    return `<span class="hl">${n}${pct}</span>`;
  };
  s = s.replace(/#(\d+)\[([^\]]*)\](%?)/g, (_, i: string, t: string, pct: string) =>
    rep(i, t, pct));
  s = s.replace(/#(\d+)/g, (_, i: string) => rep(i, '', ''));
  s = s.replace(/\\n|\n/g, '<br>');
  return s;
}

/**
 * 跨星级合并渲染技能描述：每个 #N[tag]% 占位符按各星级参数集逐一取值，
 * 以斜杠分隔（对齐官方 Wiki 的 200/250/300/300% 样式）。
 * 各星级值全部相同时仅显示单个值。
 */
export function fmtDescMerged(
  desc: string | null | undefined,
  paramSets: Array<number[] | null | undefined>,
): string {
  if (!desc) return '';
  let s = gameTagsToHtml(desc);
  const sets = paramSets.filter((p): p is number[] => Array.isArray(p) && p.length > 0);
  const rep = (i: string, t: string, pct: string): string => {
    const idx = parseInt(i) - 1;
    if (!sets.length) return `<span class="hl">?${pct}</span>`;
    const vals = sets.map((p) => fmtVal(p[idx], t, pct === '%'));
    const allSame = vals.every((v) => v === vals[0]);
    const text = allSame ? `${vals[0]}${pct}` : vals.join('/') + pct;
    return `<span class="hl">${text}</span>`;
  };
  s = s.replace(/#(\d+)\[([^\]]*)\](%?)/g, (_, i: string, t: string, pct: string) => rep(i, t, pct));
  s = s.replace(/#(\d+)/g, (_, i: string) => rep(i, '', ''));
  s = s.replace(/\\n|\n/g, '<br>');
  return s;
}

/**
 * 技能描述按星级参数渲染（CW 技能卡星级联动：只替换第 starIdx 套参数）。
 * 与 fmtDescMerged 同构，paramSets 维度从「跨星级并置」降为「单星级取值」；
 * 下标越界 / 参数缺失回退 '?' 占位，行为与合并版一致。
 */
export function fmtDescStar(
  desc: string | null | undefined,
  paramSets: Array<number[] | null | undefined>,
  starIdx: number,
): string {
  if (!desc) return '';
  let s = gameTagsToHtml(desc);
  const set = paramSets[starIdx];
  const rep = (i: string, t: string, pct: string): string => {
    const idx = parseInt(i) - 1;
    if (!set) return `<span class="hl">?${pct}</span>`;
    const v = set[idx];
    const text = v == null ? `?${pct}` : `${fmtVal(v, t, pct === '%')}${pct}`;
    return `<span class="hl">${text}</span>`;
  };
  s = s.replace(/#(\d+)\[([^\]]*)\](%?)/g, (_, i: string, t: string, pct: string) => rep(i, t, pct));
  s = s.replace(/#(\d+)/g, (_, i: string) => rep(i, '', ''));
  s = s.replace(/\\n|\n/g, '<br>');
  return s;
}

/** 韧性条格式化（show_stance_list /3 保留 2 位） */
export function fmtToughness(sk: Skill): string {
  const list = sk.show_stance_list;
  if (!list) return '';
  const parts = list
    .map((v, i) => {
      if (!v) return '';
      const label = STANCE_TAG[STANCE_LABEL[i]] || STANCE_LABEL[i];
      const val = Math.round((v / 3) * 100) / 100;
      return `${label}: ${val}`;
    })
    .filter(Boolean);
  return parts.join(' / ');
}

/* ─── 属性计算 ─── */

/** 稳定取最高等级的 stats（不依赖 key 插入顺序） */
export function maxLevelStat(stats: Record<string, CharStats> | null | undefined): CharStats | null {
  if (!stats) return null;
  if (stats['6']) return stats['6'];
  const keys = Object.keys(stats).map(Number).filter((k) => !isNaN(k));
  const maxK = keys.length ? Math.max(...keys) : null;
  return maxK != null ? stats[maxK] : (Object.values(stats).pop() ?? null);
}

/** 满级属性计算：base + add * (MAX_CHAR_LEVEL - 1) */
export function maxLevelValue(base: number, add: number): number {
  return base + add * (MAX_CHAR_LEVEL - 1);
}

/** 从 rank 字符串解析稀有度数字（CombatPowerAvatarRarityType4 → 4，无法解析回退 5） */
export function parseRarity(rank: string | null | undefined): number {
  const m = (rank || '').match(/(\d+)\s*$/);
  return m ? Number(m[1]) : 5;
}

/* ─── 加强模式：视图构建 ─── */

/** 深拷贝（优先 structuredClone，失败时降级 JSON——如传入 reactive Proxy 的场景） */
export function deepClone<T>(o: T): T {
  if (typeof structuredClone === 'function') {
    try { return structuredClone(o); } catch { /* Proxy 等不可克隆对象走 JSON 回退 */ }
  }
  return JSON.parse(JSON.stringify(o)) as T;
}

/** 返回加强版本键列表（空数组 = 该角色无加强） */
export function getEnhancedKeys(d: CharacterData | null | undefined): string[] {
  return Object.keys((d && d.enhanced) || {});
}

/** 构建"强化后"视图：base 副本上覆盖 enhanced[enhKey] 的 skills/ranks/skill_trees/sp_need */
export function buildEnhancedView(d: CharacterData, enhKey: string): CharacterData {
  const enh = d.enhanced && d.enhanced[enhKey];
  if (!enh) return d;
  const view = deepClone(d);
  if (enh.skills) view.skills = deepClone(enh.skills);
  if (enh.ranks) view.ranks = deepClone(enh.ranks);
  if (enh.skill_trees) view.skill_trees = deepClone(enh.skill_trees);
  if (enh.sp_need != null) view.sp_need = enh.sp_need;
  return view;
}

/** 依据当前强化模式返回渲染数据（原始模式直接返回 base；无强化包时同样返回 base） */
export function getRenderData(
  base: CharacterData | null,
  enhKey: string | null,
): CharacterData | null {
  if (enhKey && base && base.enhanced && base.enhanced[enhKey]) {
    return buildEnhancedView(base, enhKey);
  }
  return base;
}

/* ─── 数据校验 ─── */

/** 角色数据完整性校验（fail-fast，避免渲染时抛出不可读的 TypeError） */
export function validateCharData(d: CharacterData | null | undefined): asserts d is CharacterData {
  if (!d || typeof d !== 'object') throw new NkError('角色数据为空或非对象', false);
  const missing: string[] = [];
  if (!d.name) missing.push('name');
  if (!d.stats) missing.push('stats');
  if (!d.skills) missing.push('skills');
  if (!d.damage_type) missing.push('damage_type');
  if (!d.base_type) missing.push('base_type');
  if (missing.length) throw new NkError(`角色数据缺少必要字段: ${missing.join(', ')}`, false);
}
