import { describe, expect, it } from 'vitest';
import { atlasFormsOf, groupMonsterFamilies, monsterFamilyKey, monsterFamilyOf, monsterIconStem } from '../monster-family';

/** 真实目录里的 4 条冰锋：名称与**卡面图标**全同，立绘两两不同（正是「看起来一样」的原型）。 */
const ICE_BLADE = [
  { id: 1002011, name: '冰锋', icon: 'SpriteOutput/MosterIcon/Monster_1002011.png', figure: 'Monster_1002011' },
  { id: 1002012, name: '冰锋', icon: 'SpriteOutput/MosterIcon/Monster_1002011.png', figure: 'Monster_1002012' },
  { id: 1002015, name: '冰锋', icon: 'SpriteOutput/MosterIcon/Monster_1002011.png', figure: 'Monster_1002011' },
  { id: 1002016, name: '冰锋', icon: 'SpriteOutput/MosterIcon/Monster_1002011.png', figure: 'Monster_1002012' },
];

/** 同一 stem 下的不同怪物：`Monster_1003010` = 银鬃尉官 / 银鬃尉官（完整），是两只怪不是两档。 */
const SAME_STEM_DIFFERENT_NAME = [
  { id: 1003010, name: '银鬃尉官', icon: 'SpriteOutput/MosterIcon/Monster_1003010.png' },
  { id: 1003011, name: '银鬃尉官（完整）', icon: 'SpriteOutput/MosterIcon/Monster_1003010.png' },
];

describe('monsterIconStem', () => {
  it('三种图标形态都能规整为 stem', () => {
    expect(monsterIconStem('SpriteOutput/MosterIcon/Monster_1002011.png')).toBe('Monster_1002011');
    expect(monsterIconStem('monstermiddleicon/Monster_1002011.png')).toBe('Monster_1002011');
    expect(monsterIconStem('Monster_1002011')).toBe('Monster_1002011');
    expect(monsterIconStem('')).toBe('');
    expect(monsterIconStem(null)).toBe('');
    expect(monsterIconStem(undefined)).toBe('');
  });
});

describe('monsterFamilyKey / groupMonsterFamilies', () => {
  it('名称 + 卡面图标相同的 4 条冰锋归为一族（立绘不同不拆族）', () => {
    const fams = groupMonsterFamilies(ICE_BLADE);
    expect(fams.size).toBe(1);
    expect(fams.get(monsterFamilyKey(ICE_BLADE[0]))!.map((m) => m.id))
      .toEqual([1002011, 1002012, 1002015, 1002016]);
  });

  it('名称为族的一部分：同一图标下的不同怪物不得合并', () => {
    const fams = groupMonsterFamilies(SAME_STEM_DIFFERENT_NAME);
    expect(fams.size).toBe(2);
    for (const bucket of fams.values()) expect(bucket).toHaveLength(1);
  });

  it('族内按 id 升序 —— 「变体 i/n」的序号跨渲染稳定（输入乱序也要正）', () => {
    const shuffled = [ICE_BLADE[3], ICE_BLADE[1], ICE_BLADE[0], ICE_BLADE[2]];
    const fams = groupMonsterFamilies(shuffled);
    expect([...fams.values()][0].map((m) => m.id)).toEqual([1002011, 1002012, 1002015, 1002016]);
  });

  it('id 为字符串形态（数据源 id 一律 String 化）也按数值升序', () => {
    const rows = [
      { id: '1002016', name: '冰锋', icon: 'Monster_1002011' },
      { id: '1002011', name: '冰锋', icon: 'Monster_1002011' },
    ];
    expect([...groupMonsterFamilies(rows).values()][0].map((m) => m.id)).toEqual(['1002011', '1002016']);
  });

  it('同族 ⟺ 名称与图标 stem **都**相同（任一不同即不同族）', () => {
    const base = { id: 1, name: '冰锋', icon: 'Monster_A' };
    expect(monsterFamilyKey(base)).toBe(monsterFamilyKey({ id: 9, name: '冰锋', icon: 'Monster_A' }));
    expect(monsterFamilyKey(base)).not.toBe(monsterFamilyKey({ id: 2, name: '冰锋', icon: 'Monster_B' }));
    expect(monsterFamilyKey(base)).not.toBe(monsterFamilyKey({ id: 3, name: '霜锋', icon: 'Monster_A' }));
  });
});

describe('monsterFamilyOf', () => {
  it('返回自身所在族并保持升序', () => {
    expect(monsterFamilyOf(ICE_BLADE, ICE_BLADE[2]).map((m) => m.id))
      .toEqual([1002011, 1002012, 1002015, 1002016]);
  });

  it('没有同族成员时返回只含自己的数组（详情页据此隐藏整块）', () => {
    const lone = { id: 999, name: '独行', icon: 'Monster_999' };
    expect(monsterFamilyOf([...ICE_BLADE, lone], lone).map((m) => m.id)).toEqual([999]);
  });
});

/* 官方图鉴族（`TemplateGroupID`）：第二个、更粗的维度——它与同族判据**不是**一回事，
   页面只拿它出「其他形态」互链（见 1004010 真实数据：可可利亚 / （完整）×2 / （幻象）/
   无望冽风的幻灭者 / 托帕幻象 / （污染）分属 6 个卡面族）。 */
describe('atlasFormsOf', () => {
  const GROUP_1004010 = [
    { id: 1004010, name: '可可利亚', icon: 'Monster_1004010', atlas_group: 1004010 },
    { id: 1004011, name: '可可利亚（完整）', icon: 'Monster_1004011', atlas_group: 1004010 },
    { id: 1004016, name: '可可利亚', icon: 'Monster_1004010', atlas_group: 1004010 },
    { id: 1004015, name: '托帕幻象', icon: 'Monster_1004015', atlas_group: 1004010 },
    { id: 1004020, name: '杰帕德', icon: 'Monster_1004020', atlas_group: 1004020 },
    { id: 1009999, name: '无组号的怪', icon: 'Monster_1009999' },
  ];

  it('取同组全部形态（含自身）、按 id 升序，不混入其他组', () => {
    expect(atlasFormsOf(GROUP_1004010, GROUP_1004010[0]).map((m) => m.id))
      .toEqual([1004010, 1004011, 1004015, 1004016]);
  });

  it('无组号（缺位不落键）→ 空数组，详情页不渲染图鉴族行', () => {
    expect(atlasFormsOf(GROUP_1004010, GROUP_1004010[5])).toEqual([]);
    expect(atlasFormsOf(GROUP_1004010, { id: 1, name: 'x', icon: 'i', atlas_group: null })).toEqual([]);
  });

  it('同卡面的档位与图鉴族是两个正交维度：同卡面档仍在同组内，可被调用方按族键过滤', () => {
    const forms = atlasFormsOf(GROUP_1004010, GROUP_1004010[0]);
    const key = monsterFamilyKey(GROUP_1004010[0]);
    expect(forms.filter((m) => monsterFamilyKey(m) === key).map((m) => m.id))
      .toEqual([1004010, 1004016]);
    expect(forms.filter((m) => monsterFamilyKey(m) !== key).map((m) => m.id))
      .toEqual([1004011, 1004015]);
  });
});
