import { describe, expect, it } from 'vitest';
import march7 from '../../../public/data/cn/characters/1001.json';
import lightCone from '../../../public/data/cn/light_cones/20000.json';
import {
  growthLevelRange,
  skillGrowthSeries,
  skillLineRatio,
  statAtLevel,
  statSeries,
  traceBonuses,
  type PhaseStatMap,
} from '../formula/growth';

const characterStats: PhaseStatMap = Object.fromEntries(
  Object.entries(march7.stats).map(([key, row]) => [
    key,
    {
      hp_base: row.hp_base,
      hp_add: row.hp_add,
      attack_base: row.attack_base,
      attack_add: row.attack_add,
      defence_base: row.defence_base,
      defence_add: row.defence_add,
    },
  ]),
);

const lightConeStats: PhaseStatMap = Object.fromEntries(
  Object.entries(lightCone.stats).map(([key, row]) => [
    key,
    {
      hp_base: row.hp_base,
      hp_add: row.hp_add,
      attack_base: row.attack_base,
      attack_add: row.attack_add,
      defence_base: row.defence_base,
      defence_add: row.defence_add,
      max_level: row.max_level,
    },
  ]),
);

const capsInjected: PhaseStatMap = Object.fromEntries(
  Object.entries(characterStats).map(([key, row]) => [
    key,
    { ...row, max_level: [20, 30, 40, 50, 60, 70, 80][Number(key)] },
  ]),
);

describe('成长等级区间', () => {
  it('角色按 MAX_CHAR_LEVEL，光锥按数据 max_level', () => {
    expect(growthLevelRange(characterStats)).toEqual({ min: 1, max: 80 });
    expect(growthLevelRange(lightConeStats)).toEqual({ min: 1, max: 80 });
    expect(growthLevelRange({})).toEqual({ min: 1, max: 80 });
  });
});

describe('statAtLevel（晋阶分桶 + base + add×(level-1)）', () => {
  it('角色 1001（三月七）80 级：HP 1058.4 / DEF 573.3 / ATK 511.56', () => {
    expect(statAtLevel(characterStats, 'hp', 80)).toBeCloseTo(1058.4, 6);
    expect(Math.round(statAtLevel(characterStats, 'hp', 80))).toBe(1058);
    expect(statAtLevel(characterStats, 'defence', 80)).toBeCloseTo(573.3, 6);
    expect(Math.round(statAtLevel(characterStats, 'defence', 80))).toBe(573);
    expect(statAtLevel(characterStats, 'attack', 80)).toBeCloseTo(511.56, 6);
  });

  it('两种晋阶口径同时可锁：无 max_level = 突破后（与 /character 一致），注入 caps = 突破前', () => {
    expect(statAtLevel(characterStats, 'hp', 1)).toBeCloseTo(march7.stats['0'].hp_base, 6);
    expect(statAtLevel(characterStats, 'hp', 1)).toBeCloseTo(144, 6);
    expect(statAtLevel(characterStats, 'hp', 20)).toBeCloseTo(201.6 + 7.2 * 19, 6);
    expect(statAtLevel(characterStats, 'hp', 70)).toBeCloseTo(489.6 + 7.2 * 69, 6);
    expect(statAtLevel(capsInjected, 'hp', 20)).toBeCloseTo(144 + 7.2 * 19, 6);
    expect(statAtLevel(capsInjected, 'hp', 70)).toBeCloseTo(432 + 7.2 * 69, 6);
    expect(statAtLevel(capsInjected, 'hp', 80)).toBeCloseTo(1058.4, 6);
  });

  it('光锥按数据 max_level 升序分桶：20 级落 max_level=20 的行，80 级落 max_level=80 的行', () => {
    expect(statAtLevel(lightConeStats, 'hp', 20)).toBeCloseTo(38.4 + 5.76 * 19, 6);
    expect(statAtLevel(lightConeStats, 'hp', 80)).toBeCloseTo(391.68 + 5.76 * 79, 6);
    expect(statAtLevel(lightConeStats, 'attack', 80)).toBeCloseTo(146.88 + 2.16 * 79, 6);
  });

  it('max_level 分桶与对象键顺序无关', () => {
    const shuffled: PhaseStatMap = {
      late: { hp_base: 391.68, hp_add: 5.76, attack_base: 1, attack_add: 1, defence_base: 1, defence_add: 1, max_level: 80 },
      early: { hp_base: 38.4, hp_add: 5.76, attack_base: 1, attack_add: 1, defence_base: 1, defence_add: 1, max_level: 20 },
    };
    expect(statAtLevel(shuffled, 'hp', 20)).toBeCloseTo(147.84, 6);
    expect(statAtLevel(shuffled, 'hp', 80)).toBeCloseTo(846.72, 6);
  });

  it('等级钳到区间 [1, max]；空表返回 0', () => {
    expect(statAtLevel(characterStats, 'hp', 0)).toBeCloseTo(144, 6);
    expect(statAtLevel(characterStats, 'hp', 120)).toBeCloseTo(1058.4, 6);
    expect(statAtLevel({}, 'hp', 80)).toBe(0);
  });
});

describe('statSeries', () => {
  it('逐级取值且含端点', () => {
    const series = statSeries(characterStats, 'hp', 78, 80);
    expect(series.map((point) => point.level)).toEqual([78, 79, 80]);
    expect(series[0].value).toBeCloseTo(489.6 + 7.2 * 77, 6);
    expect(series[2].value).toBeCloseTo(1058.4, 6);
  });

  it('越界钳到区间；反向区间返回空数组', () => {
    const clamped = statSeries(characterStats, 'hp', 0, 2);
    expect(clamped.map((point) => point.level)).toEqual([1, 2]);
    expect(statSeries(characterStats, 'hp', 80, 70)).toEqual([]);
  });
});

describe('行迹加成（数据驱动）', () => {
  it('按 property_type 跨节点累加并按 value 降序', () => {
    const rows = traceBonuses(march7.skill_trees);
    expect(rows.map((row) => row.id)).toEqual([
      'DefenceAddedRatio',
      'IceAddedRatio',
      'StatusResistanceBase',
    ]);
    expect(rows[0].value).toBeCloseTo(0.225, 10);
    expect(rows[1].value).toBeCloseTo(0.224, 10);
    expect(rows[2].value).toBeCloseTo(0.1, 10);
  });

  it('空输入 / 异常结构返回 []，不抛错', () => {
    expect(traceBonuses(undefined)).toEqual([]);
    expect(traceBonuses(null)).toEqual([]);
    expect(traceBonuses({})).toEqual([]);
    expect(traceBonuses([])).toEqual([]);
    expect(traceBonuses('not-a-tree')).toEqual([]);
    expect(traceBonuses({ P1: { '1': { status_add_list: 'nope' } } })).toEqual([]);
    expect(
      traceBonuses({
        P1: {
          '1': {
            status_add_list: [null, { property_type: 1, value: 0.1 }, { property_type: 'X', value: Number.NaN }],
          },
        },
      }),
    ).toEqual([]);
  });

  it('同一属性跨节点累加后排序', () => {
    const trees = {
      P1: { '1': { status_add_list: [{ property_type: 'AttackAddedRatio', value: 0.05 }] } },
      P2: { '1': { status_add_list: [{ property_type: 'AttackAddedRatio', value: 0.05 }] } },
      P3: { '1': { status_add_list: [{ property_type: 'HpAddedRatio', value: 0.1 }] } },
    };
    const rows = traceBonuses(trees);
    expect(rows.map((row) => row.id)).toEqual(['AttackAddedRatio', 'HpAddedRatio']);
    expect(rows[0].value).toBeCloseTo(0.1, 12);
    expect(rows[1].value).toBeCloseTo(0.1, 12);
  });
});

describe('技能成长线型（1 级 = 1）', () => {
  it('普攻 1-10 级 50%→140% 线性，归一化后 1→2.8', () => {
    expect(skillLineRatio('normal', 1)).toBe(1);
    expect(skillLineRatio('normal', 5)).toBeCloseTo(1.8, 12);
    expect(skillLineRatio('normal', 9)).toBeCloseTo(2.6, 12);
    expect(skillLineRatio('normal', 10)).toBeCloseTo(2.8, 12);
    expect(skillLineRatio('normal', 20)).toBeCloseTo(2.8, 12);
  });

  it('战技/天赋标准线型：6 级 1.5，10 级 2.0，15 级 2.5', () => {
    expect(skillLineRatio('skill', 1)).toBe(1);
    expect(skillLineRatio('skill', 3)).toBeCloseTo(1.2, 12);
    expect(skillLineRatio('skill', 6)).toBeCloseTo(1.5, 12);
    expect(skillLineRatio('skill', 10)).toBeCloseTo(2, 12);
    expect(skillLineRatio('skill', 15)).toBeCloseTo(2.5, 12);
    expect(skillLineRatio('skill', 0)).toBe(1);
  });

  it('终结技标准线型：6 级 4/3，10 级 5/3，15 级 2', () => {
    expect(skillLineRatio('ultra', 6)).toBeCloseTo(4 / 3, 12);
    expect(skillLineRatio('ultra', 10)).toBeCloseTo(5 / 3, 12);
    expect(skillLineRatio('ultra', 15)).toBeCloseTo(2, 12);
    expect(skillLineRatio('ultra', 3)).toBeCloseTo(1 + 2 / 15, 12);
  });

  it('成长序列覆盖 1 级到上限且单调递增', () => {
    const normal = skillGrowthSeries('normal');
    const skill = skillGrowthSeries('skill');
    const ultra = skillGrowthSeries('ultra');
    expect(normal).toHaveLength(10);
    expect(skill).toHaveLength(15);
    expect(ultra).toHaveLength(15);
    for (const series of [normal, skill, ultra]) {
      expect(series[0].level).toBe(1);
      for (let index = 1; index < series.length; index += 1) {
        expect(series[index].value).toBeGreaterThan(series[index - 1].value);
      }
    }
    expect(normal[normal.length - 1].value).toBeCloseTo(2.8, 12);
    expect(skill[skill.length - 1].value).toBeCloseTo(2.5, 12);
    expect(ultra[ultra.length - 1].value).toBeCloseTo(2, 12);
  });

  it('skillGrowthSeries 按数据等级上限 cap 裁剪（钳到 1..标准上限）', () => {
    const normal9 = skillGrowthSeries('normal', 9);
    expect(normal9).toHaveLength(9);
    expect(normal9[normal9.length - 1].value).toBeCloseTo(2.6, 12);
    expect(skillGrowthSeries('normal', 20)).toHaveLength(10);
    expect(skillGrowthSeries('skill', 0)).toHaveLength(1);
    expect(skillGrowthSeries('ultra', 12)).toHaveLength(12);
    expect(skillGrowthSeries('ultra', 12)[11].value).toBeCloseTo(5 / 3 + 2 / 15, 12);
    expect(skillGrowthSeries('skill', Number.NaN)).toHaveLength(15);
    expect(skillGrowthSeries('skill', 12.9)).toHaveLength(12);
  });
});
