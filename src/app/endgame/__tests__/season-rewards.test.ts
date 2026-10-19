// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { seasonRewardGroups, seasonRewardPlan } from '../season-rewards';
import type { MazeListEntry } from '../../../services/types';

const target = (param: number) => ({ text: `#1[${param}]`, param });
const reward = (id: number, num: number) => ({ id, num });

describe('seasonRewardGroups 本期奖励分组', () => {
  it('按层升序分组：层组带通关奖励与该层星级切片，星启组带棱彩行', () => {
    const data = {
      id: 'test', zh: '测试',
      clear_score: 12345,
      countdown: 30,
      floor_details: [
        { floor: 2, reward: [reward(2, 200)], targets: [target(2)], star_rewards: [{ star: 6, items: [reward(2, 20)] }] },
        { floor: 1, reward: [reward(1, 100)], targets: [target(1)], star_rewards: [{ star: 3, items: [reward(1, 10)] }] },
      ],
      tierce: {
        score: 45000,
        countdown: 45,
        targets: [target(1), { ...target(2), prism: true }],
        rewards: [reward(9, 1)],
        prism_reward: [reward(8, 1)],
      },
    } as unknown as MazeListEntry;
    const groups = seasonRewardGroups(data);
    expect(groups.map((g) => g.key)).toEqual(['floor-1', 'floor-2', 'tierce']);
    expect(groups[0].label).toBe('第 1 层');
    expect(groups[0].rules.map((r) => r.value)).toEqual(['12,345', '30']);
    expect(groups[0].items).toEqual([reward(1, 100)]);
    expect(groups[0].rows[0].star).toBe(3);
    expect(groups[1].rows[0].star).toBe(6);
    expect(groups[2].label).toBe('星启模式');
    expect(groups[2].rules.map((r) => r.value)).toEqual(['45,000', '45']);
    expect(groups[2].rows.some((row) => row.prism)).toBe(true);
    expect(groups[2].items).toEqual([reward(9, 1)]);
  });

  it('异相仲裁按骑士 → 王棋 → 绝境分组', () => {
    const data = {
      id: 'test', zh: '测试',
      levels: [
        { kind: 'knight', id: 1, name: '骑士（一）', targets: [target(4), target(2)], star_rewards: [{ star: 3, items: [reward(1, 1)] }] },
        { kind: 'knight', id: 2, name: '骑士（二）', targets: [target(4), target(2)], star_rewards: [{ star: 6, items: [reward(1, 1)] }] },
        { kind: 'knight', id: 3, name: '骑士（三）', targets: [target(4), target(2)], star_rewards: [{ star: 9, items: [reward(1, 1)] }] },
        {
          kind: 'king', id: 4, name: '将杀王棋',
          targets: [target(6), target(4), target(2)],
          star_rewards: [
            { star: 1, items: [reward(1, 1)] },
            { star: 2, items: [reward(1, 1)] },
            { star: 3, items: [reward(1, 1)] },
          ],
          hard: { name: '绝境', targets: [target(2)], star_rewards: [{ star: 3, items: [reward(1, 1)] }] },
        },
      ],
    } as unknown as MazeListEntry;
    const groups = seasonRewardGroups(data);
    expect(groups.map((g) => g.label)).toEqual(['骑士（一）', '骑士（二）', '骑士（三）', '将杀王棋', '绝境']);
    expect(groups.map((g) => g.rows.length)).toEqual([1, 1, 1, 3, 1]);
    expect(groups.every((g) => g.items.length === 0)).toBe(true);
  });
});

describe('seasonRewardPlan 统一赛季压缩', () => {
  const uniformData = {
    id: 'test', zh: '测试',
    clear_score: 30000,
    countdown: 30,
    floor_details: [
      { floor: 1, reward: [reward(2, 100)], targets: [target(10), target(20)], star_rewards: [{ star: 3, items: [reward(1, 60)] }] },
      { floor: 2, reward: [reward(2, 100)], targets: [target(10), target(20)], star_rewards: [{ star: 6, items: [reward(1, 80)] }] },
    ],
    star_rewards: [{ star: 3, items: [reward(1, 60)] }, { star: 6, items: [reward(1, 80)] }],
    tierce: {
      targets: [target(1), { ...target(2), prism: true }],
      rewards: [reward(9, 1)],
      prism_reward: [reward(8, 1)],
    },
  } as unknown as MazeListEntry;

  it('同通关奖励 / 同条件 / 同目标 ⇒ 统一路径（共享头 + 完整阶梯 + 星启组）', () => {
    const plan = seasonRewardPlan(uniformData);
    expect(plan.uniform).toBe(true);
    expect(plan.floorFrom).toBe(1);
    expect(plan.floorTo).toBe(2);
    expect(plan.clear?.items).toEqual([reward(2, 100)]);
    expect(plan.clear?.rules.map((rule) => rule.value)).toEqual(['30,000', '30']);
    expect(plan.conditions).toHaveLength(2);
    expect(plan.ladder?.map((row) => row.star)).toEqual([3, 6]);
    expect(plan.ladder?.every((row) => row.targets.length === 0)).toBe(true);
    expect(plan.tierce?.key).toBe('tierce');
    expect(plan.groups).toEqual([]);
  });

  it('任一层通关奖励不同 ⇒ 回退按层分组（保留例外）', () => {
    const data = {
      ...uniformData,
      floor_details: [
        { floor: 1, reward: [reward(2, 100)], targets: [target(10), target(20)], star_rewards: [{ star: 3, items: [reward(1, 60)] }] },
        { floor: 2, reward: [reward(2, 200)], targets: [target(10), target(20)], star_rewards: [{ star: 6, items: [reward(1, 80)] }] },
      ],
    } as unknown as MazeListEntry;
    const plan = seasonRewardPlan(data);
    expect(plan.uniform).toBe(false);
    expect(plan.groups.map((group) => group.key)).toEqual(['floor-1', 'floor-2', 'tierce']);
    expect(plan.groups[0].rules.map((rule) => rule.value)).toEqual(['30,000', '30']);
  });

  it('异相仲裁不参与统一路径，保持按关分组', () => {
    const data = {
      id: 'test', zh: '测试',
      levels: [
        { kind: 'knight', id: 1, name: '骑士（一）', targets: [target(4), target(2)], star_rewards: [{ star: 3, items: [reward(1, 1)] }] },
        { kind: 'king', id: 4, name: '将杀王棋', targets: [target(6), target(4), target(2)], star_rewards: [{ star: 1, items: [reward(1, 1)] }] },
      ],
    } as unknown as MazeListEntry;
    const plan = seasonRewardPlan(data);
    expect(plan.uniform).toBe(false);
    expect(plan.groups.map((group) => group.key)).toEqual(['knight-1', 'king-4']);
  });
});
