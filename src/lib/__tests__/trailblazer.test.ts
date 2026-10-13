/**
 * 开拓者形态（trailblazer.ts）纯函数契约测试
 * 覆盖：默认值回退、localStorage 持久化读写、ID 段判定（8xxx 开拓者、奇男偶女）。
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  DEFAULT_TRAILBLAZER_GENDER,
  getSavedTrailblazerGender,
  setTrailblazerGender,
  isTrailblazerId,
  trailblazerGenderOfId,
  shouldUseFemaleAvatar,
  pickGenderVariant,
} from '../trailblazer';

const STORAGE_KEY = 'HSR_WIKI_TRAILBLAZER_GENDER';

describe('trailblazer gender', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('无存储时回退默认', () => {
    expect(getSavedTrailblazerGender()).toBe(DEFAULT_TRAILBLAZER_GENDER);
  });

  it('非法存储值回退默认', () => {
    localStorage.setItem(STORAGE_KEY, 'alien');
    expect(getSavedTrailblazerGender()).toBe(DEFAULT_TRAILBLAZER_GENDER);
  });

  it('setTrailblazerGender：持久化生效', () => {
    setTrailblazerGender('male');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('male');
    expect(getSavedTrailblazerGender()).toBe('male');
  });
});

describe('trailblazer ID 判定', () => {
  it('8xxx 为开拓者段，常规角色不在段内', () => {
    expect(isTrailblazerId(8001)).toBe(true);
    expect(isTrailblazerId('8010')).toBe(true);
    expect(isTrailblazerId(1001)).toBe(false);
    expect(isTrailblazerId(1217)).toBe(false);
  });

  it('8xxx 奇数=男、偶数=女（vo_tag playerboy/playergirl 佐证）', () => {
    expect(trailblazerGenderOfId(8001)).toBe('male');
    expect(trailblazerGenderOfId(8007)).toBe('male');
    expect(trailblazerGenderOfId(8002)).toBe('female');
    expect(trailblazerGenderOfId(8008)).toBe('female');
  });

  it('shouldUseFemaleAvatar：仅女性选择且存在映射时生效', () => {
    expect(shouldUseFemaleAvatar('female', 8008)).toBe(true);
    expect(shouldUseFemaleAvatar('female', null)).toBe(false);
    expect(shouldUseFemaleAvatar('female', undefined)).toBe(false);
    expect(shouldUseFemaleAvatar('male', 8008)).toBe(false);
  });
});

/* pickGenderVariant：官方 fr/de/pt 的开拓者名带 {M#…}{F#…} 双支，名字必须二选一。
   若走 stripTags 的「两支拼接」口径会得到官方不存在的词（PionnierPionnière）——本组测试即该边界。 */
describe('pickGenderVariant', () => {
  it('按性别取对应支，且丢掉全部标记', () => {
    const fr = '{M#Pionnier}{F#Pionnière}·Le Souvenir';
    expect(pickGenderVariant(fr, 'male')).toBe('Pionnier·Le Souvenir');
    expect(pickGenderVariant(fr, 'female')).toBe('Pionnière·Le Souvenir');
  });

  it('单支标记也取对应支（de 部分条目只带一支）', () => {
    expect(pickGenderVariant('{F#Erzählerin}{M#Erzähler} der Gegenwart', 'male')).toBe('Erzähler der Gegenwart');
    expect(pickGenderVariant('{F#Erzählerin}{M#Erzähler} der Gegenwart', 'female')).toBe('Erzählerin der Gegenwart');
  });

  it('无标记文本原样返回（10 个单支语言的恒等路径）', () => {
    expect(pickGenderVariant('星', 'female')).toBe('星');
    expect(pickGenderVariant('Trailblazer', 'male')).toBe('Trailblazer');
    expect(pickGenderVariant('', 'male')).toBe('');
  });

  it('幂等：取支结果再取支不变（生成器与前端可能各过一次）', () => {
    const once = pickGenderVariant('{M#Pionnier}{F#Pionnière}·Le Souvenir', 'female');
    expect(pickGenderVariant(once, 'female')).toBe(once);
  });

  it('缺对应性别支时退回「保支文本、去标记」，不产出空串', () => {
    // 现实语言包里两支总是成对；此用例固化兜底语义，避免将来单支数据把名字清空。
    expect(pickGenderVariant('{F#Nur weiblich}', 'male')).toBe('Nur weiblich');
  });

  it('不残留标记（拼接口径的回归守卫）', () => {
    const out = pickGenderVariant('{M#Pionnier}{F#Pionnière}·L\'Allégresse', 'female');
    expect(out).not.toMatch(/\{[MF]#/);
    expect(out).not.toContain('PionnierPionnière');
  });
});