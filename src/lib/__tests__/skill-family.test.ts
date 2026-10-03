// @vitest-environment node
/**
 * 技能族推导（skill-family.ts）契约测试（ADR 0022）。
 * 必须读真实数据 public/data/cn/characters/*.json：全量不变量是「换分组不丢技能」的端到端哨兵，禁止改用纯手写夹具。
 * 镜流 1212 是反例锚点：AvatarConfig.SkillList 顺序把形态 121209 排在基座 121202 之前，期望值一律以 skill_trees 为准。
 * 禁止改用 node:fs：项目未装 @types/node，node:* 具名导入过不了 vue-tsc 门禁；glob 同样读磁盘真实文件。
 */
import { describe, it, expect } from 'vitest';
import { groupSkillsByFamily } from '../skill-family';
import { SKILL_ORDER } from '../constants';
import type { CharacterData, Skill, SkillTree } from '../../services/types';

/** 全部真实角色 JSON（glob 键即文件路径，此处归一为 charId → 数据） */
const CHARS: Record<string, CharacterData> = Object.fromEntries(
  Object.entries(
    import.meta.glob<string>('../../../public/data/cn/characters/*.json', {
      eager: true,
      query: '?raw',
      import: 'default',
    }),
  ).map(([file, raw]) => [
    file.slice(file.lastIndexOf('/') + 1).replace(/\.json$/, ''),
    JSON.parse(raw) as CharacterData,
  ]),
);

function load(id: number): CharacterData {
  const d = CHARS[String(id)];
  if (!d) throw new Error(`character ${id} 缺失`);
  return d;
}

/** 可见技能（与实现同判据，供全量不变量比对） */
function visibleIds(d: CharacterData): number[] {
  return Object.values(d.skills)
    .filter((s) => !!s.type_name && SKILL_ORDER.includes(s.type))
    .map((s) => s.id);
}

function flatIds(fams: ReturnType<typeof groupSkillsByFamily>): number[] {
  return fams.flatMap((f) => [f.main.id, ...f.children.map((c) => c.id)]);
}

const asc = (a: number, b: number): number => a - b;

function familyOf(id: number, mainId: number) {
  const d = load(id);
  const fams = groupSkillsByFamily(d.skills, d.skill_trees);
  return { d, fams, fam: fams.find((f) => f.main.id === mainId) };
}

describe('技能族（真实数据：族序 / 交集过滤）', () => {
  it('真珠 1503：Point01 族 = 基座 150301 → 形态 150308/150310，且族间按 SKILL_ORDER 排序', () => {
    const { fams, fam } = familyOf(1503, 150301);
    expect(fam?.anchor).toBe('Point01');
    expect(fam?.children.map((c) => c.id)).toEqual([150308, 150310]);
    // 欢愉技（SKILL_ORDER 下标 4）必须排在秘技（下标 6）之前，null 分隔位不产卡
    expect(fams.map((f) => f.main.id)).toEqual([150301, 150302, 150303, 150304, 150320, 150307]);
  });

  it('真珠 1503：type_name 为空的 150306 不进任何族', () => {
    const { fams } = familyOf(1503, 150301);
    expect(flatIds(fams)).not.toContain(150306);
    expect(fams.some((f) => f.main.id === 150306)).toBe(false);
  });

  it('镜流 1212：战技族基座为 121202「无罅飞光」（SkillList 顺序反例），子卡 121209', () => {
    const { fams, fam } = familyOf(1212, 121202);
    expect(fam?.anchor).toBe('Point02');
    expect(fam?.children.map((c) => c.id)).toEqual([121209]);
    // 形态不得同时充当平级卡的基座
    expect(fams.some((f) => f.main.id === 121209)).toBe(false);
  });

  it('白厄 1408：type=null 的天赋 140805 归入 Point04 族，不拆成平级卡', () => {
    const { fams, fam } = familyOf(1408, 140804);
    expect(fam?.anchor).toBe('Point04');
    expect(fam?.children.map((c) => c.id)).toEqual([140805]);
    expect(fams.some((f) => f.main.id === 140805)).toBe(false);
  });

  it('吉尔伽美什 1509：天赋族 150904 → 150905', () => {
    const { fams, fam } = familyOf(1509, 150904);
    expect(fam?.anchor).toBe('Point04');
    expect(fam?.children.map((c) => c.id)).toEqual([150905]);
    expect(fams.some((f) => f.main.id === 150905)).toBe(false);
  });

  it('飞霄 1220：终结技族 122003 → 122008/122009，converter 过滤的 122014 不得出现', () => {
    const { d, fams, fam } = familyOf(1220, 122003);
    expect(fam?.anchor).toBe('Point03');
    expect(fam?.children.map((c) => c.id)).toEqual([122008, 122009]);
    expect(Object.keys(d.skills)).not.toContain('122014');
    expect(flatIds(fams)).not.toContain(122014);
  });

  it('黄泉 1308：内部子技能 130814-130817 不在输出 JSON → 无任何 children', () => {
    const { d, fams } = familyOf(1308, 130803);
    for (const id of [130814, 130815, 130816, 130817]) {
      expect(Object.keys(d.skills)).not.toContain(String(id));
    }
    expect(fams.every((f) => f.children.length === 0)).toBe(true);
  });
});

describe('全量不变量（遍历全部角色 JSON）', () => {
  it('覆盖的技能 id 集合 == 可见技能 id 集合（不丢不重），且 children id 唯一', () => {
    const ids = Object.keys(CHARS);
    expect(ids.length).toBeGreaterThanOrEqual(90);
    let withChildren = 0;

    for (const id of ids) {
      const file = `${id}.json`;
      const d = load(Number(id));
      const visible = visibleIds(d);
      const fams = groupSkillsByFamily(d.skills, d.skill_trees);
      const flat = flatIds(fams);

      expect(flat.length, `${file} 不重`).toBe(new Set(flat).size);
      expect([...flat].sort(asc), `${file} 不丢`).toEqual([...visible].sort(asc));
      expect(flat.length, `${file} 非可见技能不入族`).toBe(new Set([...flat, ...visible]).size);

      for (const f of fams) {
        const kidIds = f.children.map((c) => c.id);
        expect(new Set(kidIds).size, `${file}/${f.anchor} children id 唯一`).toBe(kidIds.length);
        expect(kidIds, `${file}/${f.anchor} 基座不得重复进 children`).not.toContain(f.main.id);
        if (f.children.length) withChildren++;
      }
    }

    // 防护：全量不变量若退化成「全部单卡」会假绿，必须真实存在成族项
    expect(withChildren).toBeGreaterThanOrEqual(30);
  });
});

describe('退化路径', () => {
  it('skill_trees 为 null / undefined / {} → 全部单卡，数量 == 可见技能数', () => {
    const d = load(1503);
    const visible = [...visibleIds(d)].sort(asc);
    const cases: (CharacterData['skill_trees'] | null | undefined)[] = [null, undefined, {}];

    for (const trees of cases) {
      const fams = groupSkillsByFamily(d.skills, trees);
      expect(fams).toHaveLength(visible.length);
      expect(fams.every((f) => f.anchor === '' && f.children.length === 0)).toBe(true);
      expect([...flatIds(fams)].sort(asc)).toEqual(visible);
    }
  });
});

describe('技能族（合成输入：先到先得 / 原序 / 覆盖）', () => {
  const sk = (id: number, type: Skill['type'], type_name = '普攻'): Skill => ({
    id,
    name: `S${id}`,
    desc: '',
    type,
    type_name,
  });

  const trees = (map: Record<string, number[]>): CharacterData['skill_trees'] =>
    Object.fromEntries(
      Object.entries(map).map(([k, ids]) => [k, { '1': { level_up_skill_id: ids } } as Record<string, SkillTree>]),
    );

  const shape = (fams: ReturnType<typeof groupSkillsByFamily>) =>
    fams.map((f) => [f.anchor, f.main.id, f.children.map((c) => c.id)]);

  it('族序取 level_up_skill_id 原序，不随技能表顺序变', () => {
    const fams = groupSkillsByFamily(
      { '1': sk(1, 'Normal'), '2': sk(2, 'Normal'), '3': sk(3, 'Normal') },
      trees({ Point01: [3, 1, 2] }),
    );
    expect(shape(fams)).toEqual([['Point01', 3, [1, 2]]]);
  });

  it('一个技能只进一个族：先到先得的锚点拥有成员', () => {
    const fams = groupSkillsByFamily(
      { '1': sk(1, 'Normal'), '2': sk(2, 'Normal') },
      trees({ Point02: [2, 1], Point01: [1, 2] }),
    );
    expect(shape(fams)).toEqual([['Point02', 2, [1]]]);
  });

  it('同类型族保持登记序（锚点插入序，非 id 升序）', () => {
    const fams = groupSkillsByFamily(
      { '1': sk(1, 'Normal'), '2': sk(2, 'Normal'), '3': sk(3, 'Normal'), '4': sk(4, 'Normal') },
      trees({ Point05: [2, 3], Point01: [1, 4] }),
    );
    expect(fams.map((f) => f.main.id)).toEqual([2, 1]);
  });

  it('可见交集 <2 条的锚点不成族：该技能为单卡（anchor 空串）；不可见成员不计入', () => {
    const only = groupSkillsByFamily({ '1': sk(1, 'BPSkill') }, trees({ Point02: [1] }));
    expect(only).toEqual([{ anchor: '', main: sk(1, 'BPSkill'), children: [] }]);

    // 锚点内含非可见技能（type_name 空）→ 可见交集仍为 1 条
    const mixed = groupSkillsByFamily(
      { '1': sk(1, 'Ultra'), '2': sk(2, 'Normal', '') },
      trees({ Point01: [1, 2] }),
    );
    expect(shape(mixed)).toEqual([['', 1, []]]);
  });

  it('未被任何锚点覆盖的可见技能落为单卡，不可见技能不入任何族', () => {
    const fams = groupSkillsByFamily(
      {
        '1': sk(1, 'Ultra'),
        '2': sk(2, null, '天赋'),
        '3': sk(3, 'Maze', ''),
      },
      trees({ Point01: [99] }),
    );
    // type=null 命中 SKILL_ORDER 分隔位（下标 5），故排在 Ultra（下标 2）之后
    expect(shape(fams)).toEqual([
      ['', 1, []],
      ['', 2, []],
    ]);
  });

  it('锚点首级无 level_up_skill_id 时不漏族（各级实测内容相同）', () => {
    const t: CharacterData['skill_trees'] = {
      Point01: { '1': {}, '2': { level_up_skill_id: [1, 2] } },
    };
    const fams = groupSkillsByFamily({ '1': sk(1, 'Normal'), '2': sk(2, 'Normal') }, t);
    expect(shape(fams)).toEqual([['Point01', 1, [2]]]);
  });
});
