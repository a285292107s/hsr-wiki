import type { MazeMonsterInfo } from '../../services/types';

export type MonsterSkill = NonNullable<MazeMonsterInfo['skills']>[number];

function positivePhases(skill: MonsterSkill): number[] {
  return (skill.phase_list ?? []).filter((phase) => phase > 0);
}

export function monsterPhases(monster: MazeMonsterInfo): number[] {
  const hpPhases = monster.phase_hp?.length ?? 0;
  const skillPhases = (monster.skills ?? []).flatMap(positivePhases);
  const count = Math.max(hpPhases, ...skillPhases, 0);
  return Array.from({ length: count }, (_, i) => i + 1);
}

export function phaseHpValue(monster: MazeMonsterInfo, phase: number): number | null {
  return monster.phase_hp?.[phase - 1] ?? null;
}

export function phaseSkills(monster: MazeMonsterInfo, phase: number): MonsterSkill[] {
  return (monster.skills ?? []).filter((skill) => {
    const phases = positivePhases(skill);
    return phases.length === 0 || phases.includes(phase);
  });
}
