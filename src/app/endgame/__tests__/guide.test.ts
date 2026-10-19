import { describe, expect, it } from 'vitest';
import {
  CHOICE_LABEL, fallbackSystemName, guideMode, seasonBuffChoiceLabel,
  seasonBuffCount, seasonBuffSystemName,
} from '../guide';
import type { EndgameGuideDb } from '../../../services/types';

const db: EndgameGuideDb = {
  modes: {
    boss: {
      key: 'boss', label: '末日幻影', en: 'APOCALYPSE', intro_id: 93,
      sections: [{ title: '末日幻影', text: '' }, { title: '终焉公理', text: '' }],
      system: { name: '终焉公理', count: 3, choice: 'per_stage' },
    },
    maze: {
      key: 'maze', label: '忘却之庭', en: 'FORGOTTEN HALL', intro_id: 2,
      sections: [{ title: '忘却之庭', text: '' }],
    },
  },
};

describe('seasonBuffSystemName', () => {
  it('取该玩法体系名；无 system 时返回空串（不替调用方回退）', () => {
    expect(seasonBuffSystemName(db, 'boss')).toBe('终焉公理');
    expect(seasonBuffSystemName(db, 'maze')).toBe('');
    expect(seasonBuffSystemName(db, 'story')).toBe('');
    expect(seasonBuffSystemName(null, 'boss')).toBe('');
  });
  it('站点工作名只作回退常量存在，不得被当作体系名返回', () => {
    expect(fallbackSystemName()).toBe('赛季增益');
    expect(seasonBuffSystemName(db, 'story')).not.toBe(fallbackSystemName());
  });
});

describe('选法文案与口径行', () => {
  it('枚举 → 文案映射四档齐备', () => {
    expect(Object.keys(CHOICE_LABEL).sort()).toEqual(['fixed', 'per_king', 'per_stage', 'per_team']);
  });
  it('choiceLabel 与无体系数据时的空串', () => {
    expect(seasonBuffChoiceLabel(db, 'boss')).toBe('每场首领挑战前选 1 条（上/下半场各一套）');
    expect(seasonBuffChoiceLabel(db, 'maze')).toBe('');
  });
  it('条数与模式查询', () => {
    expect(seasonBuffCount(db, 'boss')).toBe(3);
    expect(seasonBuffCount(db, 'maze')).toBe(0);
    expect(guideMode(db, 'boss')?.label).toBe('末日幻影');
    expect(guideMode(db, 'nope')).toBeNull();
  });
});
