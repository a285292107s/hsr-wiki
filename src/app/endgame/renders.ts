
import { elemLabel } from '../../lib/enum-labels';
import { translate } from '../i18n';
import { monsterRankKey } from '../../lib/enum-labels';
import { hideImgOnError, imgHtml } from '../../lib/image';
import { elementIconUrl, fmtDesc } from '../../lib/format';
import { cdnSrc } from '../../lib/image';
import type {
  MazeBossTrait, MazeBuffInfo, MazeListEntry, MazeMonsterInfo,
} from '../../services/types';

export function buffDescHtml(b: MazeBuffInfo): string {
  return fmtDesc(b.desc, b.param_list || []);
}

export function bossTraitDescHtml(t: MazeBossTrait): string {
  return fmtDesc(t.desc, t.param_list || []);
}

export function seasonBuffList(data: MazeListEntry): MazeBuffInfo[] {
  const flat = data.buffs || [];
  if (!flat.length) return [];
  const carried = new Set<number>();
  for (const f of data.floor_details || []) if (f.buff) carried.add(f.buff.id);
  for (const nd of data.tierce?.nodes || []) if (nd.buff) carried.add(nd.buff.id);
  return flat.filter((b) => !carried.has(b.id));
}

export function seasonNodeBuff(data: MazeListEntry): MazeBuffInfo | null {
  const nodes: (MazeBuffInfo | null)[] = [
    ...(data.floor_details || []).map((floor) => floor.buff ?? null),
    ...(data.tierce?.nodes || []).map((node) => node.buff ?? null),
  ];
  if (!nodes.length || nodes.some((b) => !b)) return null;
  const first = nodes[0] as MazeBuffInfo;
  return nodes.every((b) => (b as MazeBuffInfo).id === first.id) ? first : null;
}

export function buffIconUrl(b: MazeBuffInfo): string {
  return b.icon ? cdnSrc('bufficon', `${b.icon}.webp`) : '';
}

export const BUFF_ICON_FALLBACK =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23a0a0b0' stroke-width='1.5' stroke-linejoin='round'><path d='M12 2.5l2.3 6.2 6.2 2.3-6.2 2.3-2.3 6.2-2.3-6.2-6.2-2.3 6.2-2.3z'/><circle cx='12' cy='12' r='1.4' fill='%23a0a0b0' stroke='none'/></svg>";

export function elemRow(types: string[]): string {
  return types.map((d) => {
    const src = elementIconUrl(d);
    return src
      ? imgHtml(src, { className: 'nk-egd-elem', alt: elemLabel(d), title: elemLabel(d), loading: 'lazy' })
      : '';
  }).join('');
}

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



export const hideOnError = hideImgOnError;
