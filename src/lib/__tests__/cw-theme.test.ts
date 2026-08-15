/**
 * 货币战争主题色（cw-theme.ts）纯函数契约测试
 * 覆盖：默认值回退、localStorage 持久化读写、<html data-cw-accent> 应用与缺省清理。
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  CW_ACCENTS,
  DEFAULT_CW_ACCENT,
  getSavedCwAccent,
  applyCwAccent,
  setCwAccent,
  initCwAccent,
  type CwAccentKey,
} from '../cw-theme';

const STORAGE_KEY = 'HSR_WIKI_CW_ACCENT';

describe('cw theme accents', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-cw-accent');
  });

  it('CW_ACCENTS 覆盖五个预置主题且互为唯一键', () => {
    expect(CW_ACCENTS.map((a) => a.key)).toEqual(['gold', 'rose', 'silver', 'emerald', 'copper']);
    expect(new Set(CW_ACCENTS.map((a) => a.key)).size).toBe(CW_ACCENTS.length);
    // 每个主题色板提供 300/400/500 三点
    for (const a of CW_ACCENTS) {
      expect(a.swatch).toHaveLength(3);
      expect(a.swatch.every((c) => /^#[0-9A-F]{6}$/i.test(c))).toBe(true);
    }
  });

  it('无存储时回退默认主题（gold）', () => {
    expect(getSavedCwAccent()).toBe(DEFAULT_CW_ACCENT);
  });

  it('DEFAULT_CW_ACCENT 是合法主题键', () => {
    expect(CW_ACCENTS.some((a) => a.key === DEFAULT_CW_ACCENT)).toBe(true);
  });

  it('读取持久化主题（本地存储命中）', () => {
    localStorage.setItem(STORAGE_KEY, 'rose');
    expect(getSavedCwAccent()).toBe('rose');
  });

  it('非法存储值回退默认', () => {
    localStorage.setItem(STORAGE_KEY, 'not-a-theme');
    expect(getSavedCwAccent()).toBe(DEFAULT_CW_ACCENT);
  });

  it('applyCwAccent：非默认主题写入 data-cw-accent', () => {
    applyCwAccent('emerald');
    expect(document.documentElement.dataset.cwAccent).toBe('emerald');
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

  it('类型收窄：CwAccentKey 仅接受预置键', () => {
    const keys: CwAccentKey[] = CW_ACCENTS.map((a) => a.key);
    expect(keys).toContain('gold');
  });
});