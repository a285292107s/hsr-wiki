/**
 * 货币战争主题色（cw-theme.ts）纯函数契约测试
 * 覆盖：默认值回退、localStorage 持久化读写、<html data-cw-accent> 应用与缺省清理。
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  DEFAULT_CW_ACCENT,
  getSavedCwAccent,
  applyCwAccent,
  setCwAccent,
  initCwAccent,
} from '../cw-theme';

const STORAGE_KEY = 'HSR_WIKI_CW_ACCENT';

describe('cw theme accents', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-cw-accent');
  });

  it('无存储时回退默认主题（gold）', () => {
    expect(getSavedCwAccent()).toBe(DEFAULT_CW_ACCENT);
  });

  it('读取持久化主题（本地存储命中）', () => {
    localStorage.setItem(STORAGE_KEY, 'rose');
    expect(getSavedCwAccent()).toBe('rose');
  });

  it('非法存储值回退默认', () => {
    localStorage.setItem(STORAGE_KEY, 'not-a-theme');
    expect(getSavedCwAccent()).toBe(DEFAULT_CW_ACCENT);
  });

  it('applyCwAccent：默认主题删除 data-cw-accent（保持 :root 幂等）', () => {
    document.documentElement.dataset.cwAccent = 'copper';
    applyCwAccent(DEFAULT_CW_ACCENT);
    expect(document.documentElement.hasAttribute('data-cw-accent')).toBe(false);
  });

  it('setCwAccent：持久化并应用', () => {
    setCwAccent('silver');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('silver');
    expect(document.documentElement.dataset.cwAccent).toBe('silver');
  });

  it('initCwAccent：按持久化值初始化 data-cw-accent', () => {
    localStorage.setItem(STORAGE_KEY, 'rose');
    initCwAccent();
    expect(document.documentElement.dataset.cwAccent).toBe('rose');
  });
});