// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { monsterPhases, phaseHpValue, phaseSkills } from '../monster-phases';
import type { MazeMonsterInfo } from '../../../services/types';

const base = { id: '1', name: '测试', icon: '' } as MazeMonsterInfo;

describe('monsterPhases 战斗阶段清单', () => {
  it('逐阶段血量与技能阶段号取并集，连续从 1 起', () => {
    const monster = {
      ...base,
      phase_hp: [100, 125, 100],
      skills: [{ name: 'A', phase_list: [1, 2] }, { name: 'B', phase_list: [3] }],
    } as MazeMonsterInfo;
    expect(monsterPhases(monster)).toEqual([1, 2, 3]);
  });

  it('只有逐阶段血量时按数组长度出阶段', () => {
    expect(monsterPhases({ ...base, phase_hp: [10, 10] } as MazeMonsterInfo)).toEqual([1, 2]);
  });

  it('只有阶段技能时按最大阶段号补齐中间阶段', () => {
    const monster = { ...base, skills: [{ name: 'A', phase_list: [2, 3] }] } as MazeMonsterInfo;
    expect(monsterPhases(monster)).toEqual([1, 2, 3]);
  });

  it('单阶段与无数据不出切换档，阶段号 0 是外键哨兵不算阶段', () => {
    expect(monsterPhases({ ...base, phase_hp: [10] } as MazeMonsterInfo)).toEqual([1]);
    expect(monsterPhases({ ...base, skills: [{ name: 'A', phase_list: [1, 1] }] } as MazeMonsterInfo)).toEqual([1]);
    expect(monsterPhases({ ...base, skills: [{ name: 'A', phase_list: [0] }] } as MazeMonsterInfo)).toEqual([]);
    expect(monsterPhases({ ...base, hp: 10 } as MazeMonsterInfo)).toEqual([]);
  });
});

describe('phaseHpValue 逐阶段血量取值', () => {
  it('下标 +1 即阶段号；缺相阶段回 null', () => {
    const monster = { ...base, phase_hp: [10, 12.5] } as MazeMonsterInfo;
    expect(phaseHpValue(monster, 1)).toBe(10);
    expect(phaseHpValue(monster, 2)).toBe(12.5);
    expect(phaseHpValue(monster, 3)).toBeNull();
    expect(phaseHpValue({ ...base, hp: 10 } as MazeMonsterInfo, 1)).toBeNull();
  });
});

describe('phaseSkills 该阶段可用技能', () => {
  const monster = {
    ...base,
    skills: [
      { name: '通用', phase_list: [] as number[] },
      { name: '一段', phase_list: [1] },
      { name: '二三段', phase_list: [2, 3] },
      { name: '哨兵', phase_list: [0] },
    ],
  } as MazeMonsterInfo;

  it('只取该阶段门控命中的技能；无阶段门控与哨兵技能在每个阶段都出现', () => {
    expect(phaseSkills(monster, 1).map((s) => s.name)).toEqual(['通用', '一段', '哨兵']);
    expect(phaseSkills(monster, 2).map((s) => s.name)).toEqual(['通用', '二三段', '哨兵']);
    expect(phaseSkills(monster, 3).map((s) => s.name)).toEqual(['通用', '二三段', '哨兵']);
  });
});
