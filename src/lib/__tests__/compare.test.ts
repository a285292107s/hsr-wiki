/**
 * compare.ts（对比模式纯函数）单元测试
 * 内联 fixture 参照本地转换数据真实结构手工构造（ID 前缀规则：强化 ID = base ID + 1000000）。
 */
import { describe, it, expect } from 'vitest';
import { baseSkillId, buildCompare } from '../compare';
import type { CharacterData, Skill } from '../../services/types';

/* ─── fixture ─── */

const sk = (over: Partial<Skill> = {}): Skill => ({
  id: 100501,
  name: '普攻',
  desc: '造成等同于攻击力 #1[i]% 的伤害',
  type: 'Normal',
  type_name: '普攻',
  ...over,
});

/** 基础角色：技能 100501（普攻，无变化）+ 100502（战技，desc/level 变化）+ 星魂 1-2 + 行迹 */
const baseChar = (): CharacterData => ({
  name: '测试角色',
  rarity: 'CombatPowerAvatarRarityType5',
  base_type: 'Mage',
  damage_type: 'Quantum',
  sp_need: 120,
  ranks: {
    '1': { id: 1005101, name: '星魂一', desc: '造成 #1[i]% 伤害', icon: 'i1', param_list: [0.5] },
    '2': { id: 1005102, name: '星魂二', desc: '回复能量', icon: 'i2', param_list: [] },
  },
  skills: {
    '100501': sk({ id: 100501 }),
    '100502': sk({
      id: 100502, name: '战技', type: 'BPSkill', type_name: '战技',
      desc: '对单体造成攻击力 #1[i]% 伤害',
      level: {
        '1': { level: 1, param_list: [1] },
        '2': { level: 2, param_list: [1.2] },
      },
    }),
  },
  skill_trees: {
    point01: {
      '1': { point_id: 1005101, point_name: '攻击强化', point_desc: '攻击力提高 #1[i]%', param_list: [0.08] },
    },
    point02: {
      '1': { point_id: 1005102, point_name: '生命强化', point_desc: '生命值提高 #1[i]%', param_list: [0.08] },
    },
  },
  stats: {
    '0': { attack_base: 100, attack_add: 10, defence_base: 50, defence_add: 5, hp_base: 200, hp_add: 20, speed_base: 100, critical_chance: 0.05, critical_damage: 0.5 },
  },
});

/** 附加强化包（默认：技能 100502 desc/level 变、星魂 1 desc 变、行迹 point02 desc 变、sp_need 变） */
const withEnh = (d: CharacterData, over: Partial<NonNullable<CharacterData['enhanced']>[string]> = {}): CharacterData => ({
  ...d, // base.sp_need 保持 120，与包内 140 形成实际差异
  enhanced: {
    '1': {
      skills: {
        '1100502': sk({
          id: 1100502, name: '强化战技', type: 'BPSkill', type_name: '战技',
          desc: '对全体造成攻击力 #1[i]% 伤害',
          level: {
            '1': { level: 1, param_list: [1.5] },
            '2': { level: 2, param_list: [1.7] },
          },
        }),
      },
      ranks: {
        '1': { id: 1105101, name: '星魂一', desc: '造成生命上限 #1[i]% 伤害', icon: 'i1', param_list: [0.6] },
      },
      skill_trees: {
        point02: {
          '1': { point_id: 1105102, point_name: '生命强化', point_desc: '生命值提高 #1[i]%（强化）', param_list: [0.12] },
        },
      },
      descs: ['强化摘要'],
      sp_need: 140,
      skill_ids: [1100501, 1100502],
      rank_ids: [1105101, 1105102],
      ...over,
    },
  },
});

/* ─── ID 映射 ─── */

describe('baseSkillId', () => {
  it('加强技能 ID 去 11 前缀得到 base ID', () => {
    expect(baseSkillId(1100501)).toBe(100501);
    expect(baseSkillId(1131001)).toBe(131001);
  });
});

/* ─── buildCompare ─── */

describe('buildCompare', () => {
  it('无增强包 / 键不存在 → 全空结果', () => {
    expect(buildCompare(baseChar(), '1')).toEqual({ skills: [], ranks: [], trees: [], spChanged: false });
    expect(buildCompare(withEnh(baseChar()), '2')).toEqual({ skills: [], ranks: [], trees: [], spChanged: false });
    expect(buildCompare(null, '1')).toEqual({ skills: [], ranks: [], trees: [], spChanged: false });
  });

  it('仅冗余字段差异的技能不判定为变化（无变化条目排除）', () => {
    // 普攻 1100501 注册在案但 base/enh 内容一致（仅 id/icon 前缀差异 + rated 关联变化）→ 不输出；
    // 战技 1100502 保持默认变化版本 → 仍输出
    const d = withEnh(baseChar(), {
      skills: {
        // 1100501：仅冗余字段差异（id/icon 前缀 + rated 关联 + combo 无消费）→ 不输出
        '1100501': sk({ id: 1100501, icon: 'en/11005.png', rated_rank_id: [1105101], rated_skill_tree_id: [1105102], skill_combo_value_delta: { Value: 10 } }),
        // 1100502：保持变化版本（desc/level 与 base 不同）→ 仍须输出
        '1100502': sk({
          id: 1100502, name: '强化战技', type: 'BPSkill', type_name: '战技',
          desc: '对全体造成攻击力 #1[i]% 伤害',
          level: {
            '1': { level: 1, param_list: [1.5] },
            '2': { level: 2, param_list: [1.7] },
          },
        }),
      },
    });
    // base 侧普攻带 rated 关联（模拟 base 也有关联），两侧仅 rated/id/icon/combo 不同 → 无变化
    d.skills['100501'] = sk({ id: 100501, icon: 'base/1005.png', rated_rank_id: [1005101], rated_skill_tree_id: [1005102], skill_combo_value_delta: null });
    const r = buildCompare(d, '1');
    expect(r.skills.map((s) => s.id)).toEqual([1100502]);
  });

  it('desc / level / sp_need 变化被检出并给出字段明细', () => {
    const r = buildCompare(withEnh(baseChar()), '1');
    expect(r.spChanged).toBe(true);
    const skill = r.skills.find((s) => s.id === 1100502);
    expect(skill).toBeDefined();
    expect(skill!.kinds).toContain('desc');
    expect(skill!.kinds).toContain('level');
    expect(skill!.base.desc).toContain('单体');
    expect(skill!.enh.desc).toContain('全体');
  });

  it('星魂 desc/param 变化检出（E2 无变化不输出）', () => {
    const r = buildCompare(withEnh(baseChar()), '1');
    expect(r.ranks.map((x) => x.key)).toEqual(['1']);
    expect(r.ranks[0].kinds).toContain('desc');
    expect(r.ranks[0].kinds).toContain('param');
    // 星魂名变化兜底：kinds 不含 name，但 base/enh.name 可直接取用
    expect(r.ranks[0].base.name).toBe('星魂一');
  });

  it('行迹变化按 anchor×level 输出，结构性字段差异不算变化', () => {
    const r = buildCompare(withEnh(baseChar()), '1');
    expect(r.trees.map((t) => t.anchor)).toEqual(['point02']);
    expect(r.trees[0].kinds).toContain('point_desc');
    expect(r.trees[0].kinds).toContain('param');
    // point01 的 point_id 前缀差异（1005101 → 1105101）不算变化
  });

  it('point_name / status_add_list 变化检出', () => {
    const d = withEnh(baseChar(), {
      skill_trees: {
        point02: {
          '1': {
            point_id: 1105102, point_name: '新名字', point_desc: '生命值提高 #1[i]%（强化）',
            param_list: [0.12], status_add_list: [{ property_type: 'HP', value: 0.1, name: '生命' }],
          },
        },
      },
    });
    const r = buildCompare(d, '1');
    const t = r.trees[0];
    expect(t.kinds).toContain('point_name');
    expect(t.kinds).toContain('status_add_list');
  });

  it('星魂/行迹无变化时不输出对应条目', () => {
    const d = withEnh(baseChar(), {
      ranks: { '1': { id: 1105101, name: '星魂一', desc: '造成 #1[i]% 伤害', icon: 'i1', param_list: [0.5] } },
      skill_trees: {
        point02: { '1': { point_id: 1105102, point_name: '生命强化', point_desc: '生命值提高 #1[i]%', param_list: [0.08] } },
      },
    });
    const r = buildCompare(d, '1');
    expect(r.ranks).toEqual([]);
    expect(r.trees).toEqual([]);
  });
});