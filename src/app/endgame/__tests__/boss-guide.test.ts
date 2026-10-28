// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { sharedPhaseAnswer, stageBossGuide, stageBossName, stageOwnerLabel } from '../boss-guide';
import type { MazeBossGuide, MazeStageDetail } from '../../../services/types';

const stage = (monsters: MazeStageDetail['monsters']): MazeStageDetail => ({ monsters } as MazeStageDetail);

describe('sharedPhaseAnswer 两阶段同文的应对策略', () => {
  it('全部阶段逐字相同才返回该条', () => {
    expect(sharedPhaseAnswer([
      { id: 1, name: '阶段一', answer: '应对策略：优先消灭召唤物' },
      { id: 2, name: '阶段二', answer: '应对策略：优先消灭召唤物' },
    ])).toBe('应对策略：优先消灭召唤物');
  });
  it('任一阶段不同即返回 null（留在阶段内渲染）', () => {
    expect(sharedPhaseAnswer([
      { id: 1, name: '阶段一', answer: 'A' },
      { id: 2, name: '阶段二', answer: 'B' },
    ])).toBeNull();
  });
  it('单阶段与空应对策略不上提', () => {
    expect(sharedPhaseAnswer([{ id: 1, name: '阶段一', answer: 'A' }])).toBeNull();
    expect(sharedPhaseAnswer([
      { id: 1, name: '阶段一' },
      { id: 2, name: '阶段二' },
    ])).toBeNull();
  });
});

describe('stageBossGuide 首领机制归属到波次敌方', () => {
  const guides: Record<string, MazeBossGuide> = {
    '2004014': { traits: [{ id: 1, name: '坚防守备' }] },
  };

  it('取带 boss_guide 指针的那条敌方', () => {
    const hit = stageBossGuide(stage([
      { id: '1', name: '护卫', icon: '', wave: 1 },
      { id: '2', name: '首领', icon: '', wave: 1, boss_guide: '2004014' },
    ]), guides);
    expect(hit?.monster.name).toBe('首领');
    expect(hit?.guide.traits?.[0].name).toBe('坚防守备');
  });

  it('未登记机制的敌方与缺 guides 都不产出区块', () => {
    expect(stageBossGuide(stage([{ id: '1', name: '护卫', icon: '' }]), guides)).toBeNull();
    expect(stageBossGuide(stage([{ id: '2', name: '首领', icon: '', boss_guide: '2004014' }]), undefined)).toBeNull();
  });
});

describe('stageOwnerLabel 区块头归属', () => {
  const s = stage([{ id: '1', name: '影将军', icon: '', wave: 1 }]);

  it('常规层带半场前缀，星启节点只留首领名', () => {
    expect(stageOwnerLabel('stage1', s)).toBe('上半场 · 影将军');
    expect(stageOwnerLabel('stage2', s)).toBe('下半场 · 影将军');
    expect(stageOwnerLabel('tierce', s)).toBe('影将军');
  });

  it('末波首领即归属对象（同场多敌时取最后一波）', () => {
    expect(stageBossName(stage([
      { id: '1', name: '护卫', icon: '', wave: 1 },
      { id: '2', name: '首领', icon: '', wave: 2 },
    ]))).toBe('首领');
    expect(stageBossName(undefined)).toBe('');
  });
});
