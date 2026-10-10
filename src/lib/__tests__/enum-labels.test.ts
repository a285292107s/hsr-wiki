import { describe, it, expect } from 'vitest';
import { monsterRankKey, propLabel, relicSlotLabel } from '../enum-labels';

/** 标签表的回退语义：表未就绪 / 未收录时**不得**产出空串（界面会出现空白而不是枚举键）。 */
describe('enum labels', () => {
  it('propLabel：未加载表时回退 fallback，再退回枚举键', () => {
    expect(propLabel('CriticalChanceBase')).toBe('CriticalChanceBase');
    expect(propLabel('CriticalChanceBase', '暴击率')).toBe('暴击率');
  });

  it('relicSlotLabel：取结构层官方部位名，缺字段时回退枚举键', () => {
    expect(relicSlotLabel({ type: 'HEAD', type_name: '头部' })).toBe('头部');
    expect(relicSlotLabel({ type: 'HEAD' })).toBe('HEAD');
    expect(relicSlotLabel({ type: 'HEAD', type_name: '' })).toBe('HEAD');
  });
});

/** 怪物分类键必须落在词典里存在的键上：曾把 `BigBoss` 映射成 `monster.rank.bigBoss`，
 *  而词典里只有 `monster.rank.boss` ⇒ 详情页分类徽记显示原始键名。 */
describe('monsterRankKey', () => {
  it('数据枚举 → 词典键（与词典实际键一致）', () => {
    expect(monsterRankKey('BigBoss')).toBe('monster.rank.boss');
    expect(monsterRankKey('LittleBoss')).toBe('monster.rank.littleBoss');
    expect(monsterRankKey('Elite')).toBe('monster.rank.elite');
    expect(monsterRankKey('Minion')).toBe('monster.rank.minion');
    expect(monsterRankKey('MinionLv2')).toBe('monster.rank.minion');
    expect(monsterRankKey(null)).toBe('monster.rank.minion');
  });
});
