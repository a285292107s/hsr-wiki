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
  type TrailblazerGender,
} from '../trailblazer';

const STORAGE_KEY = 'HSR_WIKI_TRAILBLAZER_GENDER';

describe('trailblazer gender', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('无存储时回退默认（女性）', () => {
    expect(getSavedTrailblazerGender()).toBe(DEFAULT_TRAILBLAZER_GENDER);
    expect(DEFAULT_TRAILBLAZER_GENDER).toBe('female');
  });

  it('读取持久化选择（本地存储命中）', () => {
    localStorage.setItem(STORAGE_KEY, 'male');
    expect(getSavedTrailblazerGender()).toBe('male');
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

  it('类型收窄：TrailblazerGender 仅接受两种键', () => {
    const keys: TrailblazerGender[] = ['female', 'male'];
    expect(keys).toContain(DEFAULT_TRAILBLAZER_GENDER);
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