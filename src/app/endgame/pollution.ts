import type { MazeStageInvasion } from '../../services/types';

/** 污染节点在关卡里的位置：上下半场 / 异相仲裁单关 / 星启附加关（见 ADR 0026） */
export type PollutionHalf = 'stage1' | 'stage2' | 'level' | 'tierce';

/** 徽标文案：统一用「污染等级 N」（CONTEXT.md 术语，勿简写成侵蚀等级） */
export function pollutionLabel(inv: MazeStageInvasion | undefined | null): string {
  return inv ? `污染等级 ${inv.level}` : '';
}

/** 位置文案入参（专题页的 scopes 与终局节点共用同一套文案，避免两处口径漂移） */
export interface PollutionPos {
  half: string;
  floor?: number;
  title?: string;
}

/** 节点位置文案：层级 =「第 N 层 · 上半场」/ 异相仲裁 = 关名 / 星启 =「星启附加关」 */
export function pollutionPosition(e: PollutionPos): string {
  if (e.half === 'tierce') return '星启附加关';
  if (e.half === 'level') return e.title || '关卡';
  const half = e.half === 'stage1' ? '上半场' : '下半场';
  return e.floor ? `第 ${e.floor} 层 · ${half}` : half;
}

/** 半场文案（层级卡徽标用：层号已在楼层头，此处只区分上下半场） */
export function halfLabel(half: PollutionHalf): string {
  if (half === 'stage1') return '上半场';
  if (half === 'stage2') return '下半场';
  return '';
}
