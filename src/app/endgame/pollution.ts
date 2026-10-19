import type { MazeStageInvasion } from '../../services/types';
import { translate } from '../i18n';

export type PollutionHalf = 'stage1' | 'stage2' | 'level' | 'tierce';

export function pollutionLabel(inv: MazeStageInvasion | undefined | null): string {
  return inv ? translate('vor.invasionLevel', { n: inv.level }) : '';
}

export interface PollutionPos {
  half: string;
  floor?: number;
  title?: string;
}

export function pollutionPosition(e: PollutionPos): string {
  if (e.half === 'tierce') return translate('egd.pollution.tierceExtra');
  if (e.half === 'level') return e.title || translate('egd.pollution.stage');
  const half = translate(e.half === 'stage1' ? 'egd.pollution.half1' : 'egd.pollution.half2');
  return e.floor ? translate('egd.pollution.floorHalf', { n: e.floor, half }) : half;
}

export function halfLabel(half: PollutionHalf): string {
  if (half === 'stage1') return translate('egd.pollution.half1');
  if (half === 'stage2') return translate('egd.pollution.half2');
  return '';
}
