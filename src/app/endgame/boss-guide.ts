import { translate } from '../i18n';
import type { MazeBossGuide, MazeBossPhase, MazeMonsterInfo, MazeStageDetail } from '../../services/types';

export interface StageBossGuide {
  guide: MazeBossGuide;
  monster: MazeMonsterInfo;
}

export function stageBossGuide(
  stage: MazeStageDetail | undefined,
  guides: Record<string, MazeBossGuide> | undefined,
): StageBossGuide | null {
  for (const m of stage?.monsters ?? []) {
    const guide = m.boss_guide ? guides?.[m.boss_guide] : undefined;
    if (guide) return { guide, monster: m };
  }
  return null;
}

export function stageBossName(stage: MazeStageDetail | undefined): string {
  const mons = stage?.monsters ?? [];
  if (!mons.length) return '';
  const wave = Math.max(...mons.map((m) => m.wave || 1));
  const last = mons.filter((m) => (m.wave || 1) === wave);
  return last[last.length - 1]?.name || mons[mons.length - 1]?.name || '';
}

export type StageKey = 'stage1' | 'stage2' | 'tierce';

export function stageOwnerLabel(key: StageKey, stage: MazeStageDetail | undefined): string {
  const name = stageBossName(stage);
  if (key === 'tierce') return name;
  return [translate(key === 'stage1' ? 'egd.pollution.half1' : 'egd.pollution.half2'), name]
    .filter(Boolean)
    .join(' · ');
}

export function sharedPhaseAnswer(phases: MazeBossPhase[]): string | null {
  if (phases.length < 2) return null;
  const first = phases[0]?.answer || '';
  if (!first) return null;
  return phases.every((p) => (p.answer || '') === first) ? first : null;
}
