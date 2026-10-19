
import { gameTagsToHtml } from './html';
import { stanceTagLabel } from './enum-labels';
import { activeLocale } from './i18n/active';
import { BIG_NUMBER_UNITS, findLocale } from './i18n/locales';
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

export function localeCulture(): string {
  return findLocale(activeLocale())?.culture ?? 'en-US';
}

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

export function fmtBigNumber(v: number | null | undefined): string {
  if (v == null) return '';
  if (!Number.isFinite(v)) return String(v);
  const units = BIG_NUMBER_UNITS[activeLocale()];
  const n = Math.round(Math.abs(v));
  if (!units || n >= 1e12) return (v < 0 ? '-' : '') + fmtNumber(n);
  if (n < 1e4) return (v < 0 ? '-' : '') + String(n);
  const groups: number[] = [];
  for (let rest = n; rest > 0; rest = Math.floor(rest / 1e4)) groups.push(rest % 1e4);
  let lowest = 0;
  while (lowest < groups.length - 1 && groups[lowest] === 0) lowest++;
  const parts: string[] = [];
  for (let i = groups.length - 1; i >= lowest; i--) {
    const text = i === groups.length - 1 ? String(groups[i]) : String(groups[i]).padStart(4, '0');
    parts.push(i === 0 ? text : text + (i === 1 ? units[1] : units[0]));
  }
  return (v < 0 ? '-' : '') + parts.join('');
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

export function refsResolved(
  desc: string | null | undefined,
  params: number[] | null | undefined,
): boolean {
  const refs = (desc || '').match(/#\d+/g);
  if (!refs) return true;
  return refs.every((r) => params?.[Number(r.slice(1)) - 1] != null);
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

export function levelStatValue(base: number, add: number, level: number): number {
  return base + add * (level - 1);
}

export function maxLevelValue(base: number, add: number): number {
  return levelStatValue(base, add, MAX_CHAR_LEVEL);
}

export function charStageForLevel(level: number, stageCount: number): number {
  let stage = 0;
  for (const cap of CHAR_STAGE_LEVEL_CAPS) if (level >= cap) stage++;
  return Math.min(stage, Math.max(stageCount - 1, 0));
}

export function deepClone<T>(o: T): T {
  if (typeof structuredClone === 'function') {
    try { return structuredClone(o); } catch { }
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
