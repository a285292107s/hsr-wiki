/**
 * 终局赛季详情 · 模板渲染纯函数（零组件状态，单一事实源）。
 * EndgameView 与 StageContent 共同消费；本模块无 Vue 组件依赖，仅 lib/services 依赖。
 * 从 EndgameView 迁移而来（消除辅助函数在单体内聚、子组件需复制的两难）。
 */
import { ELEM, MON_RANK } from '../../lib/constants';
import { escHtml, elementIconUrl, fmtDesc } from '../../lib/format';
import { cdnUri, cdnImgFallbackAttr } from '../../services/cdn';
import type {
  MazeBuffInfo, MazeFloorDetail, MazeMonsterInfo, MazeStageDetail, MazeTargetInfo,
} from '../../services/types';

/* ═══ 增益 ═══ */

/** 增益描述渲染（#N[i] 参数替换 + 富文本标签） */
export function buffDescHtml(b: MazeBuffInfo): string {
  return fmtDesc(b.desc, b.param_list || []);
}

/** 增益图标 URL（bufficon CDN；资源未就绪时 404，img error 事件兜底 SVG 占位） */
export function buffIconUrl(b: MazeBuffInfo): string {
  return b.icon ? cdnUri('bufficon', `${b.icon}.webp`) : '';
}

/** 增益图标 SVG 占位（data URI，CDN 资源就绪后自动被真实图标取代） */
export const BUFF_ICON_FALLBACK =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23a0a0b0' stroke-width='1.5' stroke-linejoin='round'><path d='M12 2.5l2.3 6.2 6.2 2.3-6.2 2.3-2.3 6.2-2.3-6.2-6.2-2.3 6.2-2.3z'/><circle cx='12' cy='12' r='1.4' fill='%23a0a0b0' stroke='none'/></svg>";

/* ═══ 阶段 / 层级 ═══ */

/** 阶段（上半/下半场）是否含内容（推荐属性或敌方配置） */
export function stageHasContent(s?: MazeStageDetail): boolean {
  return !!s && (!!s.damage?.length || !!s.monsters?.length);
}

/** 末日幻影阶段对应推荐属性（阶段 1/2 取上下半场属性列；第 3 阶段源数据无属性列） */
export function phaseDamage(f: MazeFloorDetail, pi: number): string[] | undefined {
  return pi === 0 ? f.stage1?.damage : pi === 1 ? f.stage2?.damage : undefined;
}

/** 层级推荐属性摘要（折叠态层头索引）：上下半场合并去重 */
export function stageDamageSummary(f: MazeFloorDetail): string {
  const uniq = [...new Set([...(f.stage1?.damage || []), ...(f.stage2?.damage || [])])];
  return uniq.length ? elemRow(uniq) : '';
}

/** 层级上下半场合并敌数汇总（折叠摘要右侧数据；空配置返回空串） */
export function mergedMonCount(f: MazeFloorDetail): string {
  const mons = [...(f.stage1?.monsters || []), ...(f.stage2?.monsters || [])];
  return mons.length ? monCountLabel(mons) : '';
}

/* ═══ 元素 / 敌方 ═══ */

/** 元素图标行 */
export function elemRow(types: string[]): string {
  return types.map((d) => {
    const src = elementIconUrl(d);
    return src
      ? `<img class="nk-egd-elem" src="${escHtml(src)}"${cdnImgFallbackAttr(src)} alt="${escHtml(ELEM[d] || d)}" title="${escHtml(ELEM[d] || d)}" loading="lazy">`
      : '';
  }).join('');
}

/** 小图悬浮提示（层级/peak 非 Boss 模式）：名称 · 分类 · 阵营 · 韧性 · 弱点 · 抗性 */
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

/** 波次分组：带 wave 的敌方 → [{wave, items}]（按出场序；无 wave 视为单波）。
 *  模板中 v-for 与 v-if 对同一数组引用各调用一次，WeakMap 按引用缓存避免重复分组 */
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

/** 波数 · 敌数标签（如"3 波 · 9 敌"；空列表返回空串） */
export function monCountLabel(mons: MazeMonsterInfo[] | undefined): string {
  if (!mons?.length) return '';
  const waves = new Set(mons.map((m) => m.wave || 1)).size;
  return `${waves} 波 · ${mons.length} 敌`;
}

/* ═══ 关卡组成（peak）/ 挑战目标 ═══ */

/** 机制标签行（peak 关卡） */
export function peakTagsHtml(tags: string[]): string {
  return tags.map((t) => `<span class="nk-egd-peak__tag">${escHtml(t)}</span>`).join('');
}

/** 挑战目标类型徽标（ChallengeTargetType → 中文短标；星启目标是整场挑战的评价条件，
 *  与 3 个节点（敌方配置）正交——TOTAL_SCORE 分数档 / ROUNDS_LEFT 剩余轮数 / DEAD_AVATAR 减员 */
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

/** 星启目标类型图标内容（仅 innerHTML：SVG + 文字，由模板外层 span 负责胶囊样式） */
export function targetTypeIconHtml(type: string): string {
  const label = TARGET_TYPE_LABEL[type];
  const svg = TARGET_TYPE_SVG[type];
  if (!label || !svg) return '';
  return `<span class="nk-egd-node__typeicon">${svg}</span><span>${label}</span>`;
}

/** 挑战目标渲染：#N[i] 参数替换（param 缺省时剥离占位符，避免残留） */
export function targetHtml(t: MazeTargetInfo): string {
  if (t.param != null) return fmtDesc(t.text, [t.param]);
  return t.text.replace(/#\d+\[[^\]]*\]%?/g, '').replace(/#\d+/g, '');
}

/** 星启节点摘要：总波数 · 总敌数（用于节点头折叠态/常态摘要） */
export function nodeSummary(nd: { idx: number; monsters: MazeMonsterInfo[] }): string {
  const groups = monWaveGroups(nd.monsters);
  const total = groups.reduce((acc, g) => acc + g.items.length, 0);
  return `${groups.length} 波 · ${total} 敌`;
}

/* ═══ 通用 ═══ */

/** 装饰图加载失败 → 隐藏自身（不占位、不阻断布局） */
export function hideOnError(e: Event): void {
  (e.target as HTMLImageElement).style.display = 'none';
}
