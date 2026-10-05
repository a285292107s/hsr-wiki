import { ELEM, MON_RANK } from '../../lib/constants';
import { escHtml, elementIconUrl, fmtDesc } from '../../lib/format';
import { cdnUri, cdnImgFallbackAttr } from '../../services/cdn';
import type {
  MazeBossTrait, MazeBuffInfo, MazeListEntry, MazeMonsterInfo, MazeTargetInfo,
} from '../../services/types';

export function buffDescHtml(b: MazeBuffInfo): string {
  return fmtDesc(b.desc, b.param_list || []);
}

/** 首领特性描述（与赛季增益同渲染：#N[i] 参数占位由 fmtDesc 替换） */
export function bossTraitDescHtml(t: MazeBossTrait): string {
  return fmtDesc(t.desc, t.param_list || []);
}

/** 赛季增益列表：与逐层已呈现的增益同文的不再复述一份（忘却之庭的「记忆紊流」既是赛季增益
 *  也是每层的层级增益，由层看板逐层承担，赛季级区块整块退场；异相仲裁同 3 条既是赛季 `buffs`
 *  也是王棋关 `levels[].buffs`，同理整块退场）。 */
export function seasonBuffList(data: MazeListEntry): MazeBuffInfo[] {
  const flat = data.buffs || [];
  if (!flat.length) return [];
  const carried = new Set<number>();
  for (const f of data.floor_details || []) if (f.buff) carried.add(f.buff.id);
  for (const nd of data.tierce?.nodes || []) if (nd.buff) carried.add(nd.buff.id);
  for (const l of data.levels || []) for (const b of l.buffs || []) carried.add(b.id);
  return flat.filter((b) => !carried.has(b.id));
}

export interface SeasonRule {
  label: string;
  value: number;
}

/** 赛季级规则数值（层面板右栏）：与每层取值完全相同的项不再复述——忘却之庭的回合上限
 *  就是逐层回合上限（已落在半场卡片上），虚构叙事的回合上限与通关分数线才是赛季维度。 */
export function seasonRules(data: MazeListEntry): SeasonRule[] {
  const perFloor = (data.floor_details || []).map((f) => f.countdown || 0);
  const rules: SeasonRule[] = [];
  const cd = data.countdown || 0;
  if (cd && !(perFloor.length > 0 && perFloor.every((c) => c === cd))) {
    rules.push({ label: '回合限制 CYCLES', value: cd });
  }
  if (data.clear_score) rules.push({ label: '通关分数线 SCORE', value: data.clear_score });
  return rules;
}

/** 增益图标 URL（bufficon CDN；资源未就绪时 404，img error 事件兜底 SVG 占位） */
export function buffIconUrl(b: MazeBuffInfo): string {
  return b.icon ? cdnUri('bufficon', `${b.icon}.webp`) : '';
}

export const BUFF_ICON_FALLBACK =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23a0a0b0' stroke-width='1.5' stroke-linejoin='round'><path d='M12 2.5l2.3 6.2 6.2 2.3-6.2 2.3-2.3 6.2-2.3-6.2-6.2-2.3 6.2-2.3z'/><circle cx='12' cy='12' r='1.4' fill='%23a0a0b0' stroke='none'/></svg>";

export function elemRow(types: string[]): string {
  return types.map((d) => {
    const src = elementIconUrl(d);
    return src
      ? `<img class="nk-egd-elem" src="${escHtml(src)}"${cdnImgFallbackAttr(src)} alt="${escHtml(ELEM[d] || d)}" title="${escHtml(ELEM[d] || d)}" loading="lazy">`
      : '';
  }).join('');
}

/** 末波首领（最后一波的第 1 只）：战斗卡片「打谁」的唯一判据——
 *  末日幻影每场 1 敌即首领本体，忘却之庭 / 虚构叙事的末波是压轴首领（波 1 是小怪）。 */
export function lastWaveBoss(mons: MazeMonsterInfo[] | undefined): MazeMonsterInfo | null {
  const list = mons || [];
  if (!list.length) return null;
  const maxWave = Math.max(...list.map((m) => m.wave || 1));
  return list.find((m) => (m.wave || 1) === maxWave) || list[list.length - 1] || null;
}

export function monTitle(m: MazeMonsterInfo): string {
  const parts = [m.name];
  const r = m.rank ? (MON_RANK[m.rank] || '') : '';
  if (r) parts.push(r);
  if (m.camp) parts.push(m.camp);
  if (m.stance) parts.push(`韧性 ${m.stance}`);
  if (m.speed) parts.push(`速度 ${m.speed}`);
  if (m.weak?.length) parts.push(`弱点：${m.weak.map((d) => ELEM[d] || d).join(' / ')}`);
  const es = Object.entries(m.resist || {});
  if (es.length) parts.push(`抗性：${es.map(([d, v]) => `${ELEM[d] || d} ${Math.round(v * 100)}%`).join(' / ')}`);
  return parts.join(' · ');
}

const waveGroupsCache = new WeakMap<MazeMonsterInfo[], { wave: number; items: MazeMonsterInfo[] }[]>();
export function monWaveGroups(mons: MazeMonsterInfo[]): { wave: number; items: MazeMonsterInfo[] }[] {
  const cached = waveGroupsCache.get(mons);
  if (cached) return cached;
  const groups: { wave: number; items: MazeMonsterInfo[] }[] = [];
  for (const m of mons) {
    const w = m.wave || 1;
    const last = groups[groups.length - 1];
    if (!last || last.wave !== w) {
      groups.push({ wave: w, items: [m] });
    } else {
      last.items.push(m);
    }
  }
  waveGroupsCache.set(mons, groups);
  return groups;
}

export function monCountLabel(mons: MazeMonsterInfo[] | undefined): string {
  if (!mons?.length) return '';
  const waves = new Set(mons.map((m) => m.wave || 1)).size;
  return `${waves} 波 · ${mons.length} 敌`;
}

export function peakTagsHtml(tags: string[]): string {
  return tags.map((t) => `<span class="nk-egd-peak__tag">${escHtml(t)}</span>`).join('');
}

export const TARGET_TYPE_LABEL: Record<string, string> = {
  TOTAL_SCORE: '分数',
  ROUNDS_LEFT: '回合',
  DEAD_AVATAR: '减员',
};

/** 挑战目标类型语义 SVG（子仓库解包无对应图标，自制语义化内联图标） */
export const TARGET_TYPE_SVG: Record<string, string> = {
  TOTAL_SCORE: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l2.6 5.3 5.9.8-4.3 4.1 1 5.8L12 16.4l-5.2 2.6 1-5.8L3.5 9.1l5.9-.8z"/></svg>`,
  ROUNDS_LEFT: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2h12M6 22h12M12 2v2M12 20v2M5 6h14v3a7 7 0 11-14 0z"/></svg>`,
  DEAD_AVATAR: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4.5 20.5c1.3-3.5 4.6-5.5 7.5-5.5s6.2 2 7.5 5.5"/><path d="M4 4l16 16"/></svg>`,
};

export function targetTypeIconHtml(type: string): string {
  const label = TARGET_TYPE_LABEL[type];
  const svg = TARGET_TYPE_SVG[type];
  if (!label || !svg) return '';
  return `<span class="nk-egd-node__typeicon">${svg}</span><span>${label}</span>`;
}

export function targetHtml(t: MazeTargetInfo): string {
  if (t.param != null) return fmtDesc(t.text, [t.param]);
  return t.text.replace(/#\d+\[[^\]]*\]%?/g, '').replace(/#\d+/g, '');
}

export function hideOnError(e: Event): void {
  (e.target as HTMLImageElement).style.display = 'none';
}
