
import { gameTagsToHtml } from './html';
import { stanceTagLabel } from './enum-labels';
import { activeLocale } from './i18n/active';
import { findLocale } from './i18n/locales';
import { CHAR_STAGE_LEVEL_CAPS, MAX_CHAR_LEVEL, STANCE_LABEL } from './constants';
import { NkError } from './errors';
import type { CharacterData, CharStats, Skill } from '../services/types';

export * from './html';
export * from './icons';

export function fmtVal(v: number | null | undefined, tag: string, isPct: boolean): string {
  if (v == null) return '?';
  let n = v;
  if (isPct) n = n * 100;
  if (tag === 'i') return String(Math.round(n));
  if (/^f[1-6]$/.test(tag)) {
    const f = 10 ** Number(tag.slice(1));
    return String(Math.round(n * f) / f);
  }

  return String(n);
}

/* 面板数值的统一呈现：≥4 位加千分位。此前同一类「角色 / 敌人面板数值」两处写法不同——
   光锥 hero 与终局奖励走 `toLocaleString()`，角色属性面板与敌人战斗数值直接输出 `{{ st.v }}`，
   于是同一档内容里「1,058」与「25377.9」并存。字符串原样返回（百分比 `25.0%`、占位符 `—` 等
   已格式化过的文本不能被再格式化）；纯数字串则按数值格式化（converter 有把数值写成字符串的字段）。
   **分组符按站点语言**：`toLocaleString()` 不带参数时用的是**浏览器**语言 ⇒ 德语站点配英文浏览器会
   输出 `1,234.5`（德语应为 `1.234,5`）。统一走 `fmtNumber`。 */
export function localeCulture(): string {
  return findLocale(activeLocale())?.culture ?? 'en-US';
}

/** 数字按**站点语言**格式化（不是浏览器语言）。 */
export function fmtNumber(v: number | string): string {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n.toLocaleString(localeCulture()) : String(v);
}

export function fmtStatValue(v: number | string | null | undefined): string {
  if (v == null) return '';
  if (typeof v === 'number') return Number.isFinite(v) ? fmtNumber(v) : String(v);
  const t = v.trim();
  if (t !== '' && /^-?\d+(\.\d+)?$/.test(t)) return fmtNumber(t);
  return v;
}

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

  const s = desc.replace(/#(\d+)(?!\[)/g, `#$1[${tag}]${pct}`);
  return fmtDesc(s, params);
}

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

/** 描述的 #N 占位符是否全部有实参：缺参时消费方整段省略，不落残缺占位与 `?` */
export function refsResolved(
  desc: string | null | undefined,
  params: number[] | null | undefined,
): boolean {
  const refs = (desc || '').match(/#\d+/g);
  if (!refs) return true;
  return refs.every((r) => params?.[Number(r.slice(1)) - 1] != null);
}

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

export function fmtToughness(sk: Skill): string {
  const list = sk.show_stance_list;
  if (!list) return '';
  const parts = list
    .map((v, i) => {
      if (!v) return '';
      const label = stanceTagLabel(STANCE_LABEL[i]);
      const val = Math.round((v / 3) * 100) / 100;
      return `${label}: ${val}`;
    })
    .filter(Boolean);
  return parts.join(' / ');
}

export function maxLevelStat(stats: Record<string, CharStats> | null | undefined): CharStats | null {
  if (!stats) return null;
  if (stats['6']) return stats['6'];
  const keys = Object.keys(stats).map(Number).filter((k) => !isNaN(k));
  const maxK = keys.length ? Math.max(...keys) : null;
  return maxK != null ? stats[maxK] : (Object.values(stats).pop() ?? null);
}

/**
 * 某突破档曲线在指定等级的取值：`AvatarPromotionConfig` 的每档曲线都是 `Base + Add × (等级 − 1)`（等级从 1 起算）。
 * 满级值 = 满级档曲线在 `MAX_CHAR_LEVEL` 处的取值（见 `maxLevelValue`）。
 */
export function levelStatValue(base: number, add: number, level: number): number {
  return base + add * (level - 1);
}

export function maxLevelValue(base: number, add: number): number {
  return levelStatValue(base, add, MAX_CHAR_LEVEL);
}

/**
 * 某等级**可突破到的最高档位**下标（= `stats` 的下标，0 = 未突破）。
 *
 * 判据（不是随手取的档）：
 * 1. 每档的 `Base/Add` 是**该档自己的曲线**，且相邻档的 `Base` 恰好递进 `8 × Add` —— 即**每次突破立刻加面板**
 *    （满突破 6 次累计 +48 级份）。故同一等级在不同突破状态下有不同面板，「某等级的面板」必须绑定一个突破口径。
 * 2. 取「上限 ≤ 该等级的档位数」= **每档上限一到就突破**的标准养成路径：Lv.20 显示的是突破 1 之后的值。
 *    不取「上限 ≥ 该等级的最小档」——那条曲线意味着「过了上限才跳档」，不是任何可达状态
 *    （Lv.70 未突破 = 下限值，而玩家要升到 Lv.71 必须先突破，届时面板已经跳过了）。
 */
export function charStageForLevel(level: number, stageCount: number): number {
  let stage = 0;
  for (const cap of CHAR_STAGE_LEVEL_CAPS) if (level >= cap) stage++;
  return Math.min(stage, Math.max(stageCount - 1, 0));
}

export function parseRarity(rank: string | null | undefined): number {
  const m = (rank || '').match(/(\d+)\s*$/);
  return m ? Number(m[1]) : 5;
}

export function deepClone<T>(o: T): T {
  if (typeof structuredClone === 'function') {
    try { return structuredClone(o); } catch { /* Proxy 等不可克隆对象走 JSON 回退 */ }
  }
  return JSON.parse(JSON.stringify(o)) as T;
}

export function getEnhancedKeys(d: CharacterData | null | undefined): string[] {
  return Object.keys((d && d.enhanced) || {});
}

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

export function getRenderData(
  base: CharacterData | null,
  enhKey: string | null,
): CharacterData | null {
  if (enhKey && base && base.enhanced && base.enhanced[enhKey]) {
    return buildEnhancedView(base, enhKey);
  }
  return base;
}

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
