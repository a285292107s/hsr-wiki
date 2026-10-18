
import { shallowRef } from 'vue';
import { elemLabel } from '../../lib/enum-labels';
import { translate } from '../i18n';
import { monsterRankKey } from '../../lib/enum-labels';
import { escHtml, elementIconUrl, fmtDesc } from '../../lib/format';
import { cdnUri, cdnImgFallbackAttr } from '../../services/cdn';
import { loadLocalItems } from '../../services/api';
import type {
  LocalItemEntry, MazeBossTrait, MazeBuffInfo, MazeListEntry, MazeMonsterInfo, MazeRewardItem,
  MazeStarReward, MazeTargetInfo,
} from '../../services/types';

/** 奖励物品 id → 名称 / 图标：**模块级共享**。`loadLocalItems` 是单例取数，但每个消费实例原先各建一份
 *  全量 Map（items.json 2600+ 条；星数奖励每档渲染一个 `EndgameReward` ⇒ 单页 3~6 份）。
 *  这里一次构建、全实例共享；失败时清掉 promise 允许重试（与站点共享单例同一纪律）。 */
export type RewardItemMeta = Pick<LocalItemEntry, 'name' | 'icon'>;
export const rewardItemMap = shallowRef<Map<number, RewardItemMeta>>(new Map());
let rewardItemPromise: Promise<void> | null = null;

export function ensureRewardItemMap(): Promise<void> {
  if (!rewardItemPromise) {
    rewardItemPromise = loadLocalItems()
      .then((items) => {
        rewardItemMap.value = new Map(items.map((it) => [it.id, { name: it.name, icon: it.icon }]));
      })
      .catch(() => { rewardItemPromise = null; });
  }
  return rewardItemPromise;
}

export function buffDescHtml(b: MazeBuffInfo): string {
  return fmtDesc(b.desc, b.param_list || []);
}

/** 首领特性描述（与赛季增益同渲染：#N[i] 参数占位由 fmtDesc 替换） */
export function bossTraitDescHtml(t: MazeBossTrait): string {
  return fmtDesc(t.desc, t.param_list || []);
}

/** 赛季增益列表：剔除已由关卡自身承载的同 ID 增益（忘却之庭的「记忆紊流」既是赛季增益
 *  也是每层的层级增益，由层 / 节点看板首块的末法余烬位逐层呈现，赛季级一份不再复述）。
 *  判据用增益 ID 而非文案比对：同 ID 即同一条上游记录。 */
export function seasonBuffList(data: MazeListEntry): MazeBuffInfo[] {
  const flat = data.buffs || [];
  if (!flat.length) return [];
  const carried = new Set<number>();
  for (const f of data.floor_details || []) if (f.buff) carried.add(f.buff.id);
  for (const nd of data.tierce?.nodes || []) if (nd.buff) carried.add(nd.buff.id);
  return flat.filter((b) => !carried.has(b.id));
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
      ? `<img class="nk-egd-elem" src="${escHtml(src)}"${cdnImgFallbackAttr(src)} alt="${escHtml(elemLabel(d))}" title="${escHtml(elemLabel(d))}" loading="lazy">`
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
  const r = m.rank ? translate(monsterRankKey(m.rank)) : '';
  if (r) parts.push(r);
  if (m.camp) parts.push(m.camp);
  if (m.stance) parts.push(translate('card.value.stance', { v: m.stance }));
  if (m.speed) parts.push(translate('card.value.speed', { v: m.speed }));
  if (m.weak?.length) parts.push(translate('card.weak', { list: m.weak.map((d) => elemLabel(d)).join(' / ') }));
  const es = Object.entries(m.resist || {});
  if (es.length) parts.push(translate('card.resist', { list: es.map(([d, v]) => `${elemLabel(d)} ${Math.round(v * 100)}%`).join(' / ') }));
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
  return translate('egd.wavesEnemies', { waves, mons: mons.length });
}

export const TARGET_TYPE_LABEL: Record<string, string> = {
  TOTAL_SCORE: translate('egd.score.total'),
  ROUNDS_LEFT: translate('egd.score.rounds'),
  DEAD_AVATAR: translate('egd.score.dead'),
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

/** 星级目标 × 星级奖励**按档配对**成一行（ADR 0051 补记四）：档位数与目标数不等时
 *  （忘却之庭一层 3 个目标只推进 1 档），目标按 `ceil(目标数 / 档数)` 成组挂到对应档；
 *  实测逐层恒为 3 个目标，故忘却之庭 = 1 行 3 目标、虚构叙事 / 末日幻影 = 3 行各 1 目标。
 *  无档位（奖励线缺失的期）时退化为每目标一行、不带奖励，不隐藏目标。 */
export interface StarTierRow {
  /** 累计星数档位；`prism` 档为 0（徽章走「棱彩星」） */
  star: number;
  label?: string;
  prism?: boolean;
  targets: MazeTargetInfo[];
  items: MazeRewardItem[];
}

export function starTierRows(
  targets: MazeTargetInfo[],
  tiers: MazeStarReward[],
  prism?: { target: MazeTargetInfo | null; items: MazeRewardItem[] },
): StarTierRow[] {
  const rows: StarTierRow[] = tiers.length
    ? (() => {
      const size = Math.ceil(targets.length / tiers.length);
      return tiers.map((tier, i) => ({
        star: tier.star,
        label: tier.label,
        targets: targets.slice(i * size, (i + 1) * size),
        items: tier.items,
      }));
    })()
    : targets.map((t) => ({ star: 0, targets: [t], items: [] }));
  if (prism?.target) {
    rows.push({ star: 0, prism: true, targets: [prism.target], items: prism.items });
  }
  return rows;
}

export function hideOnError(e: Event): void {
  (e.target as HTMLImageElement).style.display = 'none';
}
