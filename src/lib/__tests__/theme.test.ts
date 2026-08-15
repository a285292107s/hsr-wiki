/**
 * 主题强调色（theme.ts）纯函数契约测试
 * 覆盖：默认值回退、localStorage 持久化读写、<html data-accent> 应用与缺省清理。
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  ACCENTS,
  DEFAULT_ACCENT,
  getSavedAccent,
  applyAccent,
  setAccent,
  initAccent,
  type AccentKey,
} from '../theme';

const STORAGE_KEY = 'HSR_WIKI_ACCENT';

describe('theme accents', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-accent');
  });

  it('ACCENTS 覆盖五个预置主题且互为唯一键', () => {
    expect(ACCENTS.map((a) => a.key)).toEqual(['terracotta', 'olive', 'slate', 'sand', 'iris']);
    expect(new Set(ACCENTS.map((a) => a.key)).size).toBe(ACCENTS.length);
    // 每个主题色板提供 300/400/500 三点
    for (const a of ACCENTS) {
      expect(a.swatch).toHaveLength(3);
      expect(a.swatch.every((c) => /^#[0-9A-F]{6}$/i.test(c))).toBe(true);
    }
  });

  it('无存储时回退默认主题（terracotta）', () => {
    expect(getSavedAccent()).toBe(DEFAULT_ACCENT);
  });

  it('DEFAULT_ACCENT 是合法主题键', () => {
    expect(ACCENTS.some((a) => a.key === DEFAULT_ACCENT)).toBe(true);
  });

  it('读取持久化主题（本地存储命中）', () => {
    localStorage.setItem(STORAGE_KEY, 'olive');
    expect(getSavedAccent()).toBe('olive');
  });

  it('非法存储值回退默认', () => {
    localStorage.setItem(STORAGE_KEY, 'not-a-theme');
    expect(getSavedAccent()).toBe(DEFAULT_ACCENT);
  });

  it('applyAccent：非默认主题写入 data-accent', () => {
    applyAccent('slate');
    expect(document.documentElement.dataset.accent).toBe('slate');
  });

  it('applyAccent：默认主题删除 data-accent（保持 :root 幂等）', () => {
    document.documentElement.dataset.accent = 'sand';
    applyAccent(DEFAULT_ACCENT);
    expect(document.documentElement.hasAttribute('data-accent')).toBe(false);
  });

  it('setAccent：持久化并应用', () => {
    setAccent('sand');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('sand');
    expect(document.documentElement.dataset.accent).toBe('sand');
  });

  it('initAccent：按持久化值初始化 data-accent', () => {
    localStorage.setItem(STORAGE_KEY, 'olive');
    initAccent();
    expect(document.documentElement.dataset.accent).toBe('olive');
  });

  it('类型收窄：AccentKey 仅接受预置键', () => {
    const keys: AccentKey[] = ACCENTS.map((a) => a.key);
    expect(keys).toContain('terracotta');
  });
});