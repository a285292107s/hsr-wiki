/**
 * lib/currency-role.ts 纯函数单元测试
 * 合成 fixture（结构对齐 CurrencyRoleDetail 类型），不依赖真实数据。
 */
import { describe, it, expect } from 'vitest';
import {
  propLabel, propValue, mergeSkillGroups, buildGrowthMatrix, matrixUp,
  resolveRecommend, buildRecommendRows, catOfTrait, groupTraits,
  resolveServantAttr, buildServantAttrs, buildSkillNameMap, rankMech, rankDesc,
  stanceText, FB_LABEL, CHARGE_LABEL,
} from '../currency-role';
import type {
  CharacterData, CurrencyRoleRank, CurrencyRoleRecommend, CurrencyRoleSkill,
  CurrencyRoleStar, CurrencyRoleTrait,
} from '../../services/types';

/* ─── fixture ─── */

const skill = (over: Partial<CurrencyRoleSkill> = {}): CurrencyRoleSkill => ({
  id: 1001,
  name: '测试技能',
  desc: '造成 #1[i]% 伤害',
  simple_desc: '单体攻击',
  type: 'Normal',
  tag: null,
  sp_base: null,
  sp_need: null,
  bp_need: null,
  bp_add: null,
  show_stance_list: null,
  extra: null,
  level: null,
  ...over,
});

const star = (over: Partial<CurrencyRoleStar> = {}): CurrencyRoleStar => ({
  star: 1,
  front_one_word_desc: null,
  back_one_word_desc: null,
  front_power_base: null,
  back_power_base: null,
  front_show_skill: [],
  back_show_skill: [],
  servant_show_skill: [],
  general_property_modify_list: null,
  back_speed_rewrite: null,
  back_speed_added_ratio: null,
  back_energy_bar: null,
  back_max_sp: null,
  back_initial_sp: null,
  back_initial_energy_bar: null,
  luck_chance: null,
  luck_damage: null,
  extra_heal_base: null,
  extra_shield_base: null,
  stance_damage_display: null,
  show_stance_list: null,
  recommend: null,
  servant: null,
  ...over,
});

const rank = (over: Partial<CurrencyRoleRank> = {}): CurrencyRoleRank => ({
  rank_id: 1,
  rank: 1,
  name: '星魂一',
  desc: '描述 #1[i]',
  icon: '',
  owner_props: [],
  all_props: [],
  param_list: [],
  modify_skill_list: [],
  modify_energy_bar: null,
  rank_ability: [],
  ...over,
});

/* ─── 标签映射 ─── */

describe('propLabel / propValue', () => {
  it('maps known property keys to official labels', () => {
    expect(propLabel({ property_type: 'ExtraSpeedAddedRatio1' })).toBe('速度增幅');
    expect(propLabel({ property_type: 'ExtraLuckChance' })).toBe('幸运一击率');
  });

  it('falls back to de-prefixed key for unknown properties', () => {
    expect(propLabel({ property_type: 'ExtraFooAddedRatio3' })).toBe('Foo');
    expect(propLabel({ name: 'PlainName' })).toBe('PlainName');
  });

  it('prefers converter-provided prop_name (official TextMap name)', () => {
    // 官方名优先于映射表；映射冲突时以官方为准（如 ExtraInitSP = 初始能量）
    expect(propLabel({ property_type: 'ExtraInitSP', prop_name: '初始能量' })).toBe('初始能量');
    // 无 prop_name 时回退映射表
    expect(propLabel({ property_type: 'ExtraInitSP' })).toBe('初始能量');
    // 空 prop_name 视为缺失
    expect(propLabel({ property_type: 'ExtraSpeedAddedRatio1', prop_name: '' })).toBe('速度增幅');
  });

  it('formats ratios as percent and absolutes as-is', () => {
    expect(propValue(0.15)).toBe('15%');
    expect(propValue(1.5)).toBe('1.5');
    expect(propValue(100)).toBe('100');
  });

  it('exposes front/back and charge labels', () => {
    expect(FB_LABEL.Front).toBe('前台');
    expect(CHARGE_LABEL.EnergyBar).toBe('充能点数');
  });
});

/* ─── 跨星级技能合并 ─── */

describe('mergeSkillGroups', () => {
  it('returns [] for empty input', () => {
    expect(mergeSkillGroups(null)).toEqual([]);
    expect(mergeSkillGroups({})).toEqual([]);
  });

  it('merges same-name skills across stars with concatenated param sets', () => {
    const stars = {
      '1': star({
        front_show_skill: [
          skill({ id: 101, name: '普攻', level: { '1': { level: 1, param_list: [100] } } }),
        ],
      }),
      '2': star({
        front_show_skill: [
          skill({ id: 201, name: '普攻', level: { '1': { level: 1, param_list: [150] } } }),
        ],
      }),
    };
    const groups = mergeSkillGroups(stars);
    expect(groups).toHaveLength(1);
    expect(groups[0].key).toBe('front_show_skill');
    expect(groups[0].label).toBe('前台技能');
    expect(groups[0].skills).toHaveLength(1);
    expect(groups[0].skills[0].paramSets).toEqual([[100], [150]]);
  });

  it('keeps distinct-named skills as separate entries and falls back to #id key', () => {
    const stars = {
      '1': star({
        back_show_skill: [
          skill({ id: 1, name: '技能A' }),
          skill({ id: 2, name: '', }),
        ],
      }),
    };
    const groups = mergeSkillGroups(stars);
    const back = groups.find((g) => g.key === 'back_show_skill')!;
    expect(back.skills.map((s) => s.name)).toEqual(['技能A', '#2']);
  });

  it('merges extra sets across stars with param lists', () => {
    const stars = {
      '1': star({
        front_show_skill: [
          skill({
            id: 1, name: '技',
            extra: { trigger: { name: '触发', desc: '额外 #1[i]', param: [10] } },
          }),
        ],
      }),
      '2': star({
        front_show_skill: [
          skill({
            id: 2, name: '技',
            extra: { trigger: { name: '触发', desc: '额外 #1[i]', param: [20] } },
          }),
        ],
      }),
    };
    const [group] = mergeSkillGroups(stars);
    const [merged] = group.skills;
    expect(merged.extraSets).toHaveLength(1);
    expect(merged.extraSets[0].paramSets).toEqual([[10], [20]]);
  });
});

/* ─── 成长矩阵 ─── */

describe('buildGrowthMatrix', () => {
  it('returns [] for empty input', () => {
    expect(buildGrowthMatrix(null)).toEqual([]);
    expect(buildGrowthMatrix({})).toEqual([]);
  });

  it('groups properties semantically and injects power rows first', () => {
    const stars = {
      '1': star({
        front_power_base: 100,
        general_property_modify_list: [
          { property_type: 'ExtraHPAddedRatio1', value: 0.05 },
          { property_type: 'ExtraSpeedAddedRatio1', value: 0.02 },
        ],
      }),
      '2': star({
        front_power_base: 120,
        general_property_modify_list: [
          { property_type: 'ExtraHPAddedRatio1', value: 0.08 },
          { property_type: 'ExtraSpeedAddedRatio1', value: 0.02 },
        ],
      }),
    };
    const matrix = buildGrowthMatrix(stars);
    // 强度（含 power 行 + 无强度属性 → 仅 power 行）→ 生存 → 速度
    expect(matrix.map((g) => g.group)).toEqual(['强度', '生存', '速度']);
    const power = matrix[0];
    expect(power.rows[0]).toMatchObject({ key: '__front_power', label: '基础前台强度' });
    expect(power.rows[0].values.map((v) => v.text)).toEqual(['100', '120']);
    const hp = matrix[1].rows[0];
    expect(hp.values.map((v) => v.text)).toEqual(['5%', '8%']);
  });

  it('formats luck damage with x suffix', () => {
    const stars = { '1': star({ luck_damage: 1.5 }) };
    const matrix = buildGrowthMatrix(stars);
    const mech = matrix.find((g) => g.group === '机制')!;
    const luck = mech.rows.find((r) => r.key === 'ExtraLuckDamage')!;
    expect(luck.values[0].text).toBe('1.5×');
  });

  it('appends unknown groups after ordered ones', () => {
    const stars = {
      '1': star({
        general_property_modify_list: [{ property_type: 'MysteryProp', value: 3 }],
      }),
    };
    const matrix = buildGrowthMatrix(stars);
    expect(matrix).toHaveLength(1);
    expect(matrix[0].group).toBe('其它');
  });
});

describe('matrixUp', () => {
  it('marks only changed cells vs previous column', () => {
    const row = { key: 'k', label: 'l', values: [{ text: 'a', raw: 1 }, { text: 'b', raw: 2 }, { text: 'b', raw: 2 }] };
    expect(matrixUp(row, 0)).toBe(false);
    expect(matrixUp(row, 1)).toBe(true);
    expect(matrixUp(row, 2)).toBe(false);
  });
});

/* ─── 推荐装备 ─── */

describe('resolveRecommend / buildRecommendRows', () => {
  const rec = (): CurrencyRoleRecommend => ({
    front: { first: [{ id: 1, name: '装A', icon: 'a.png' }], second: [] },
    back: { first: [], second: [{ id: 2, name: '装B', icon: '' }] },
  });

  it('prefers selected star recommend and falls back to first non-empty star', () => {
    const stars = {
      '1': star({ recommend: rec() }),
      '2': star({ recommend: null }),
    };
    expect(resolveRecommend(stars, stars['1'])).toEqual(rec());
    // 选中星级无 recommend → 回退到首个非空星级（含选中星级本身之前的键）
    expect(resolveRecommend(stars, stars['2'])).toEqual(rec());
  });

  it('builds rows per position with first/second priority', () => {
    const rows = buildRecommendRows(rec());
    expect(rows).toHaveLength(2);
    expect(rows[0].pos).toBe('前台');
    expect(rows[0].groups.map((g) => g.priority)).toEqual(['首选']);
    expect(rows[1].groups.map((g) => g.priority)).toEqual(['次选']);
  });

  it('returns [] for null', () => {
    expect(buildRecommendRows(null)).toEqual([]);
  });
});

/* ─── 特质分类 ─── */

describe('catOfTrait / groupTraits', () => {
  const trait = (id: number): CurrencyRoleTrait => ({
    id, name: `T${id}`, activation_type: null, icon: '', desc: '', simple_desc: '',
    desc_params: [], effect_list: [], layers: [],
  });

  it('classifies by id range', () => {
    expect(catOfTrait(1000)).toBe('faction');
    expect(catOfTrait(1999)).toBe('faction');
    expect(catOfTrait(2500)).toBe('combat');
    expect(catOfTrait(3500)).toBe('special');
    expect(catOfTrait(9999)).toBe('special');
  });

  it('groups in fixed category order and skips empty categories', () => {
    const groups = groupTraits([trait(3001), trait(1001), trait(2001)]);
    expect(groups.map((g) => g.cat)).toEqual(['faction', 'combat', 'special']);
    expect(groups[2].items.map((t) => t.id)).toEqual([3001]);
    expect(groupTraits([])).toEqual([]);
    expect(groupTraits(null)).toEqual([]);
  });
});

/* ─── 随从 #N 引用解析 ─── */

describe('resolveServantAttr / buildServantAttrs', () => {
  const charData: CharacterData = {
    name: '本体',
    skills: {
      '7': {
        id: 7,
        name: '技',
        level: { '1': { level: 1, param_list: [2000, 0.3] } },
      },
    },
  } as unknown as CharacterData;

  it('passes literal values through', () => {
    expect(resolveServantAttr(500, null, charData)).toBe('500');
    expect(resolveServantAttr('字面值', null, charData)).toBe('字面值');
    expect(resolveServantAttr(null, null, charData)).toBeNull();
    expect(resolveServantAttr('', null, charData)).toBeNull();
  });

  it('resolves #N against the referenced skill param_list', () => {
    expect(resolveServantAttr('#1', 7, charData)).toBe('2000');
    expect(resolveServantAttr('#2', 7, charData)).toBe('0.3');
    expect(resolveServantAttr('#9', 7, charData)).toBeNull();
    expect(resolveServantAttr('#1', 999, charData)).toBeNull();
  });

  it('builds display items with percent conversion for inherit ratios', () => {
    const attrs = buildServantAttrs({
      hp_base: '#1', hp_inherit: '#2', hp_skill: 7,
      speed_base: '120', speed_inherit: '0.5', speed_skill: null,
    }, charData);
    expect(attrs).toEqual([
      { label: 'HP', value: '2000' },
      { label: '生命继承', value: '30%' },
      { label: '速度', value: '120' },
      { label: '速度继承', value: '50%' },
    ]);
    expect(buildServantAttrs(null, charData)).toEqual([]);
  });
});

/* ─── 星魂辅助 ─── */

describe('buildSkillNameMap / rankMech / rankDesc / stanceText', () => {
  it('maps skill ids across stars and groups', () => {
    const map = buildSkillNameMap({
      '1': star({ front_show_skill: [skill({ id: 5, name: '终结技' })] }),
      '2': star({ back_show_skill: [skill({ id: 6, name: '' })] }),
    });
    expect(map.get(5)).toBe('终结技');
    expect(map.get(6)).toBe('#6');
  });

  it('composes rank mechanics text', () => {
    const map = new Map<number, string>([[5, '终结技']]);
    const rk = rank({ modify_skill_list: [5, 99], modify_energy_bar: 2 });
    expect(rankMech(rk, map)).toBe('强化技能：终结技、#99 · 能量条 +2');
    expect(rankMech(rank(), map)).toBe('');
  });

  it('renders rank desc with params or renders ? for missing params', () => {
    const withParams = rank({ desc: '造成 #1[i] 伤害', param_list: [150] });
    expect(rankDesc(withParams)).toContain('150');
    // 无参数时 #1[i] 占位符渲染为 ?（原视图行为：fmtDesc 无参数回退）
    const noParams = rank({ desc: '效果 #1[i]', param_list: [] });
    expect(rankDesc(noParams)).toContain('?');
  });

  it('formats stance list text', () => {
    expect(stanceText(null)).toBe('');
    expect(stanceText([0, 0])).toBe('');
    // 原视图行为：非全零列表 join 全部值（含 0 位）
    expect(stanceText([1, 0, 2])).toBe('1 / 0 / 2');
  });
});
