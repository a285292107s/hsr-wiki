// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { bossTraitDescHtml, seasonBuffList, seasonRules } from '../renders';
import type { MazeBossTrait, MazeListEntry } from '../../../services/types';

const buff = (id: number, name: string) => ({ id, name });

describe('seasonBuffList 赛季增益（与逐层已呈现的同 ID 项不复述）', () => {
  it('忘却之庭：赛季增益与每层层内增益同一条 → 赛季增益组不再复述（由层看板首块呈现）', () => {
    const data = {
      id: '1036', zh: '物竞天择',
      buffs: [buff(3030149, '记忆紊流')],
      floor_details: [{ floor: 1, buff: buff(3030149, '记忆紊流') }, { floor: 2, buff: buff(3030149, '记忆紊流') }],
    } as MazeListEntry;
    expect(seasonBuffList(data)).toEqual([]);
  });

  it('虚构叙事：赛季增益无逐层对应 → 原样保留（排在敌人配置之前）', () => {
    const flat = [buff(1, '触技'), buff(2, '笑韵'), buff(3, '变奏')];
    const data = { id: '2026', zh: '立界开篇', buffs: flat, floor_details: [{ floor: 1 }] } as MazeListEntry;
    expect(seasonBuffList(data)).toEqual(flat);
  });

  it('只有部分增益被逐层承担时，只留差额部分', () => {
    const data = {
      id: '3001', zh: '冽风骑士',
      buffs: [buff(1, '甲'), buff(2, '乙')],
      floor_details: [{ floor: 1, buff: buff(1, '甲') }],
    } as MazeListEntry;
    expect(seasonBuffList(data).map((b) => b.name)).toEqual(['乙']);
  });

  it('星启节点自带增益也算节点已承担', () => {
    const data = {
      id: '3020', zh: '仙客天狼',
      buffs: [buff(9, '余烬')],
      floor_details: [{ floor: 1 }],
      tierce: { id: 30205, nodes: [{ idx: 3, origin: 'tierce', buff: buff(9, '余烬') }] },
    } as unknown as MazeListEntry;
    expect(seasonBuffList(data)).toEqual([]);
  });

  it('异相仲裁：关卡级增益不进「已承担」集合（levels 仅异相仲裁产出）', () => {
    const data = {
      id: '9', zh: '军团再临',
      buffs: [buff(3033073, '美妙奇笑'), buff(3033074, '终结之吻'), buff(3033087, '蜂群忆质')],
      levels: [
        { kind: 'knight' },
        { kind: 'king', buffs: [buff(3033073, '美妙奇笑'), buff(3033074, '终结之吻'), buff(3033087, '蜂群忆质')] },
      ],
    } as unknown as MazeListEntry;
    expect(seasonBuffList(data).map((b) => b.name))
      .toEqual(['美妙奇笑', '终结之吻', '蜂群忆质']);
  });

  it('异相仲裁：赛季增益不受关卡增益影响，完整保留', () => {
    const data = {
      id: '9', zh: '军团再临',
      buffs: [buff(1, '甲'), buff(2, '乙')],
      levels: [{ kind: 'king', buffs: [buff(1, '甲')] }],
    } as unknown as MazeListEntry;
    expect(seasonBuffList(data).map((b) => b.name)).toEqual(['甲', '乙']);
  });

  it('无增益返回空数组', () => {
    expect(seasonBuffList({ id: '1', zh: 'x' } as MazeListEntry)).toEqual([]);
  });
});

describe('seasonRules 赛季级规则数值', () => {
  it('忘却之庭：回合上限与每层一致 → 不进赛季规则右栏（由半场卡片承担）', () => {
    const data = {
      id: '1036', zh: '物竞天择', countdown: 30,
      floor_details: [{ floor: 1, countdown: 30 }, { floor: 2, countdown: 30 }],
    } as MazeListEntry;
    expect(seasonRules(data)).toEqual([]);
  });

  it('虚构叙事：回合限制与通关分数线都是赛季维度', () => {
    const data = {
      id: '2026', zh: '立界开篇', countdown: 5, clear_score: 30000,
      floor_details: [{ floor: 1, countdown: 0 }],
    } as MazeListEntry;
    expect(seasonRules(data)).toEqual([
      { label: '回合限制 CYCLES', value: 5 },
      { label: '通关分数线 SCORE', value: 30000 },
    ]);
  });

  it('末日幻影：赛季回合上限为 0 → 规则栏退场（基准页形态不变）', () => {
    const data = {
      id: '3020', zh: '仙客天狼', countdown: 0,
      floor_details: [{ floor: 1, countdown: 0 }, { floor: 2, countdown: 0 }],
    } as MazeListEntry;
    expect(seasonRules(data)).toEqual([]);
  });
});

describe('bossTraitDescHtml 首领特性文案', () => {
  it('#N[i] 参数按原序替换（坚防守备：降低 50% / 提高 100%）', () => {
    const trait: MazeBossTrait = {
      id: 101701,
      name: '坚防守备',
      desc: '首领幻影受到的伤害降低<color=#f29e38ff><unbreak>#1[i]%</unbreak></color>。'
        + '<color=#f29e38ff>弱点击破</color>后，行动额外延后，受到的伤害提高'
        + '<color=#f29e38ff><unbreak>#2[i]%</unbreak></color>。',
      param_list: [0.5, 1, 1.5],
    };
    const html = bossTraitDescHtml(trait);
    expect(html).toContain('首领幻影受到的伤害降低');
    expect(html).toContain('受到的伤害提高');
    expect(html).toContain('<span class="hl">50%</span>');
    expect(html).toContain('<span class="hl">100%</span>');
    expect(html).not.toContain('#1');
  });

  it('无描述返回空串（不落空段落）', () => {
    expect(bossTraitDescHtml({ id: 1, name: '无描述' })).toBe('');
  });
});

