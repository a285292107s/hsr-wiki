// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { bossTraitDescHtml, seasonBuffList, seasonRules } from '../renders';
import { buildEndgameSections, sectionIdxMap } from '../sections';
import type { MazeBossTrait, MazeListEntry } from '../../../services/types';

const buff = (id: number, name: string) => ({ id, name });

describe('seasonBuffList 赛季增益（与层内增益同文的不复述）', () => {
  it('忘却之庭：赛季增益与每层层内增益同一条 → 赛季级列表整块退场', () => {
    const data = {
      id: '1036', zh: '物竞天择',
      buffs: [buff(3030149, '记忆紊流')],
      floor_details: [{ floor: 1, buff: buff(3030149, '记忆紊流') }, { floor: 2, buff: buff(3030149, '记忆紊流') }],
    } as MazeListEntry;
    expect(seasonBuffList(data)).toEqual([]);
  });

  it('虚构叙事：赛季增益无逐层对应 → 原样保留', () => {
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

  it('星启节点自带增益也算逐层已承担', () => {
    const data = {
      id: '3020', zh: '仙客天狼',
      buffs: [buff(9, '余烬')],
      floor_details: [{ floor: 1 }],
      tierce: { id: 30205, nodes: [{ idx: 3, origin: 'tierce', buff: buff(9, '余烬') }] },
    } as unknown as MazeListEntry;
    expect(seasonBuffList(data)).toEqual([]);
  });

  it('异相仲裁：赛季 buffs 是王棋关增益的副本 → 赛季级区块退场（王棋关承担）', () => {
    const data = {
      id: '9', zh: '军团再临',
      buffs: [buff(3033073, '美妙奇笑'), buff(3033074, '终结之吻'), buff(3033087, '蜂群忆质')],
      levels: [
        { kind: 'knight' },
        { kind: 'king', buffs: [buff(3033073, '美妙奇笑'), buff(3033074, '终结之吻'), buff(3033087, '蜂群忆质')] },
      ],
    } as unknown as MazeListEntry;
    expect(seasonBuffList(data)).toEqual([]);
  });

  it('异相仲裁：只有部分是王棋关增益时，只留差额（新机制不重复陈述）', () => {
    const data = {
      id: '9', zh: '军团再临',
      buffs: [buff(1, '甲'), buff(2, '乙')],
      levels: [{ kind: 'king', buffs: [buff(1, '甲')] }],
    } as unknown as MazeListEntry;
    expect(seasonBuffList(data).map((b) => b.name)).toEqual(['乙']);
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

describe('buildEndgameSections 子 tab 承载后的赛季级区块', () => {
  const bossData = {
    id: '3020',
    zh: '仙客天狼',
    buffs: [buff(1, '膏腴之地')],
    buff_groups: { stage1: [buff(1, '膏腴之地')] },
    boss_traits: { stage1: [{ id: 101701, name: '坚防守备' }] },
    tierce: { id: 30205 },
    pollution: { count: 1, levels: [2] },
    floor_details: [{ floor: 1, stage1: {}, stage2: {} }],
  } as MazeListEntry;

  it('末日幻影：赛季增益/首领特性/星启/关卡层级不再进区块导航，只剩赛季级污染等级', () => {
    expect(buildEndgameSections(bossData, 'boss').map((s) => s.id)).toEqual(['pollution']);
    expect(sectionIdxMap(buildEndgameSections(bossData, 'boss'))).toEqual({ pollution: '01' });
  });

  it('无污染赛季的末日幻影无赛季级区块（导航由关卡子 tab 承担）', () => {
    const clean = { ...bossData, pollution: undefined, tierce: undefined } as MazeListEntry;
    expect(buildEndgameSections(clean, 'boss')).toEqual([]);
  });

  it('忘却之庭：赛季增益与层内增益同文 → 只剩污染等级', () => {
    const data = {
      id: '1036', zh: '物竞天择',
      buffs: [buff(3030149, '记忆紊流')],
      floor_details: [{ floor: 1, buff: buff(3030149, '记忆紊流') }],
      pollution: { count: 2, levels: [2, 3] },
    } as MazeListEntry;
    expect(buildEndgameSections(data, 'maze').map((s) => s.id)).toEqual(['pollution']);
  });

  it('虚构叙事：战意机制 → 赛季增益 → 污染等级（块序与模板顺序一致）', () => {
    const data = {
      id: '2026', zh: '立界开篇',
      sub_buffs: [buff(1, '获得笑点'), buff(2, '战熄潮平')],
      buffs: [buff(3, '狂欢')],
      pollution: { count: 1, levels: [2] },
      floor_details: [{ floor: 1 }],
    } as MazeListEntry;
    expect(buildEndgameSections(data, 'story').map((s) => s.id))
      .toEqual(['sub-buffs', 'buffs', 'pollution']);
    expect(sectionIdxMap(buildEndgameSections(data, 'story')))
      .toEqual({ 'sub-buffs': '01', buffs: '02', pollution: '03' });
  });

  it('异相仲裁：关卡由子 tab 承载 → 赛季级只剩污染等级 / 段位徽章', () => {
    const data = {
      id: '9', zh: '军团再临',
      buffs: [buff(1, '出奇制胜')],
      levels: [{ kind: 'king', buffs: [buff(1, '出奇制胜')] }],
      badges: [{ level: 'Gold', name: '「军团再临」黄金勋章', icon: 'x.png' }],
      pollution: { count: 1, levels: [2] },
    } as unknown as MazeListEntry;
    expect(buildEndgameSections(data, 'peak').map((s) => s.id)).toEqual(['pollution', 'badges']);
    expect(sectionIdxMap(buildEndgameSections(data, 'peak'))).toEqual({ pollution: '01', badges: '02' });
  });

  it('异相仲裁无污染且无徽章的期：区块为空（关卡仍在子 tab 内）', () => {
    const data = { id: '1', zh: '智械残局', levels: [{ kind: 'knight' }] } as MazeListEntry;
    expect(buildEndgameSections(data, 'peak')).toEqual([]);
  });
});