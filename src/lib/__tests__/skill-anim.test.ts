/**
 * 忆灵技能预览分配（skill-anim.ts）纯函数契约测试
 * 覆盖：按 subTitle 匹配技能名、无标题条目顺序补位、多余条目并入首技能、空池/空技能降级。
 */
import { describe, it, expect } from 'vitest';
import { assignAnimEntries, memoAnimKey } from '../skill-anim';
import type { Skill, SkillAnimEntry } from '../../services/types';

function sk(id: number, name: string, type = ''): Skill {
  return { id, name, type, type_name: type === 'Servant' ? '忆灵技' : '忆灵天赋', desc: '' };
}
const entry = (url: string, title?: string): SkillAnimEntry => (title ? { url, title } : { url });

describe('memoAnimKey', () => {
  it('忆灵技取 type；忆灵天赋 type 为空串时用合成键', () => {
    expect(memoAnimKey(sk(1, '坏人！麻烦！', 'Servant'))).toBe('Servant');
    expect(memoAnimKey(sk(2, '伙伴！一起！'))).toBe('ServantPassive');
  });
});

describe('assignAnimEntries', () => {
  it('按 subTitle 匹配技能名（不依赖顺序）', () => {
    const map = assignAnimEntries(
      [entry('a', '迷梦，流失，如露'), entry('b', '追忆，蹁跹，如雨')],
      [sk(11, '追忆，蹁跹，如雨', 'Servant'), sk(12, '迷梦，流失，如露', 'Servant')],
    );
    expect(map[11].map((a) => a.url)).toEqual(['b']);
    expect(map[12].map((a) => a.url)).toEqual(['a']);
  });

  it('无标题条目按技能顺序补位，未获配的技能不入表', () => {
    const map = assignAnimEntries(
      [entry('only')],
      [sk(21, '乌云乌云快走开！', 'Servant'), sk(22, '牵起晴空的手')],
    );
    expect(map[21].map((a) => a.url)).toEqual(['only']);
    expect(map[22]).toBeUndefined();
  });

  it('标题匹配后剩余条目继续补位（164 昔涟：2 有题 + 14 无题被过滤后的等价形态）', () => {
    const skills = [sk(31, '花与箭的舞曲', 'Servant'), sk(32, '此诗，献予一切生命', 'Servant'), sk(33, '献予「创世」之诗', 'Servant')];
    const map = assignAnimEntries([entry('x', '此诗，献予一切生命'), entry('y')], skills);
    expect(map[32].map((a) => a.url)).toEqual(['x']);
    expect(map[31].map((a) => a.url)).toEqual(['y']);
    expect(map[33]).toBeUndefined();
  });

  it('条目多于技能时并入首个技能（保留全部，卡片内 tab 切换）', () => {
    const map = assignAnimEntries([entry('a'), entry('b'), entry('c')], [sk(41, '甲', 'Servant')]);
    expect(map[41].map((a) => a.url)).toEqual(['a', 'b', 'c']);
  });

  it('空池 / 空技能列表返回空映射且不改动入参', () => {
    const entries = [entry('a', '甲')];
    const skills = [sk(51, '甲', 'Servant')];
    expect(assignAnimEntries(null, skills)).toEqual({});
    expect(assignAnimEntries(entries, [])).toEqual({});
    const map = assignAnimEntries(entries, skills);
    expect(map[51]).toHaveLength(1);
    expect(entries).toHaveLength(1);
    expect(skills[0].name).toBe('甲');
  });
});
