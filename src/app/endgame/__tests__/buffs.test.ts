import { describe, it, expect } from 'vitest';
import { bossTraitDescHtml, endgameGroups } from '../renders';
import { buildEndgameSections, sectionIdxMap } from '../sections';
import type { MazeBossTrait, MazeListEntry } from '../../../services/types';

const buff = (id: number, name: string) => ({ id, name });

describe('endgameGroups 分场次分组', () => {
  it('末日幻影：按上半场/下半场/星启模式分组，空场次不产生分组', () => {
    const groups = endgameGroups(
      { stage1: [buff(1, '膏腴之地')], stage2: [buff(2, '才藻富赡')], tierce: [] },
      undefined,
    );
    expect(groups.map((g) => [g.key, g.label, g.items.length])).toEqual([
      ['stage1', '上半场', 1],
      ['stage2', '下半场', 1],
    ]);
  });

  it('无分场次数据时降级为单个无标签分组（忘却之庭/虚构叙事的扁平列表）', () => {
    const flat = [buff(1, '记忆紊流')];
    expect(endgameGroups(undefined, flat)).toEqual([{ key: 'all', label: '', items: flat }]);
    expect(endgameGroups(undefined, [])).toEqual([]);
    expect(endgameGroups(undefined, undefined)).toEqual([]);
    // 分场次数据优先：即使同时带扁平列表也不重复渲染
    expect(endgameGroups({ stage1: flat }, flat).map((g) => g.key)).toEqual(['stage1']);
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

describe('buildEndgameSections 末日幻影子 tab 承载', () => {
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

  it('赛季增益/首领特性/星启/关卡层级不再进区块导航，只剩赛季级污染等级', () => {
    expect(buildEndgameSections(bossData, 'boss', []).map((s) => s.id)).toEqual(['pollution']);
    expect(sectionIdxMap(buildEndgameSections(bossData, 'boss', []))).toEqual({ pollution: '01' });
  });

  it('无污染赛季的末日幻影无区块导航（顶部条改由层级子 tab 承担）', () => {
    const clean = { ...bossData, pollution: undefined, tierce: undefined } as MazeListEntry;
    expect(buildEndgameSections(clean, 'boss', [])).toEqual([]);
  });

  it('其余模式口径不变（忘却之庭：赛季增益区块）', () => {
    const data = { id: '1035', zh: '回忆', buffs: [buff(1, '记忆紊流')] } as MazeListEntry;
    expect(buildEndgameSections(data, 'maze', []).map((s) => s.id)).toEqual(['buffs']);
  });
});
