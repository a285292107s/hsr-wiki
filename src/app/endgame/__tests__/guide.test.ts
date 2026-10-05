// guide.ts 纯函数契约：体系名/条数/选法文案与回退口径。
// 判据：产物缺省（未加载 / 该玩法未命中分节标题）时 `seasonBuffSystemName` 返回**空串**——
// 由消费方决定回退，避免 truthy 回退串让「无数据」与「体系名恰好叫赛季增益」不可区分。
import { describe, expect, it } from 'vitest';
import {
  CHOICE_LABEL, FALLBACK_SYSTEM_NAME, guideMode, seasonBuffChoiceLabel,
  seasonBuffCount, seasonBuffSystemLine, seasonBuffSystemName,
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
    expect(FALLBACK_SYSTEM_NAME).toBe('赛季增益');
    expect(seasonBuffSystemName(db, 'story')).not.toBe(FALLBACK_SYSTEM_NAME);
  });
});

describe('选法文案与口径行', () => {
  it('枚举 → 文案映射四档齐备', () => {
    expect(Object.keys(CHOICE_LABEL).sort()).toEqual(['fixed', 'per_king', 'per_stage', 'per_team']);
  });
  it('choiceLabel 与口径行（措辞逐条对齐官方原话）', () => {
    // boss 必须写明「每场首领挑战」与「上/下半场各一套」——数据是每个首领投影一套，
    // 只写「每场战斗选 1 条」会被读成整期只有一套（判据见 guide.ts 的 CHOICE_LABEL 注释）
    expect(seasonBuffChoiceLabel(db, 'boss')).toBe('每场首领挑战前选 1 条（上/下半场各一套）');
    expect(seasonBuffSystemLine(db, 'boss')).toBe('每期 3 条 · 每场首领挑战前选 1 条（上/下半场各一套）');
    // 口径行是**常青规格**（不随赛季轮换），故用「每期 N 条」而不是「本期 N 条」
    expect(seasonBuffSystemLine(db, 'boss')).toContain('每期 3 条');
    // 无体系数据时为空串（调用方据此不渲染该行）
    expect(seasonBuffChoiceLabel(db, 'maze')).toBe('');
    expect(seasonBuffSystemLine(db, 'maze')).toBe('');
  });
  it('条数与模式查询', () => {
    expect(seasonBuffCount(db, 'boss')).toBe(3);
    expect(seasonBuffCount(db, 'maze')).toBe(0);
    expect(guideMode(db, 'boss')?.label).toBe('末日幻影');
    expect(guideMode(db, 'nope')).toBeNull();
  });
});
