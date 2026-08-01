/**
 * 目录页配置注册表行为测试
 * 验证所有注册的 CatalogPageConfig 均满足引擎契约：
 * - id 唯一且与注册 key 一致
 * - renderCard 函数存在且返回字符串
 * - filters / buildFilters 字段结构合法
 */
import { describe, it, expect } from 'vitest';
import { CATALOG_PAGES } from '../pages';
import type { CatalogFilter } from '../types';

const entries = Object.entries(CATALOG_PAGES);

describe('CATALOG_PAGES registry', () => {
  it('should register at least one page', () => {
    expect(entries.length).toBeGreaterThan(0);
  });

  it('all ids are unique', () => {
    const ids = entries.map(([, cfg]) => cfg.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('each config id matches its registry key', () => {
    for (const [key, cfg] of entries) {
      expect(cfg.id, `key "${key}" should match config.id`).toBe(key);
    }
  });

  it('each config has required string fields', () => {
    for (const [key, cfg] of entries) {
      expect(cfg.title, `${key}.title`).toBeTruthy();
      expect(typeof cfg.title).toBe('string');
      expect(typeof cfg.searchPlaceholder).toBe('string');
    }
  });
});

describe('renderCard', () => {
  it('every config exposes renderCard as a function', () => {
    for (const [key, cfg] of entries) {
      expect(typeof cfg.renderCard, `${key}.renderCard`).toBe('function');
    }
  });

  it('renderCard returns a non-empty HTML string for a minimal item', () => {
    const stub = { name: 'Test', href: '/test' };
    for (const [key, cfg] of entries) {
      const html = cfg.renderCard(stub, 0);
      expect(typeof html, `${key}.renderCard return type`).toBe('string');
      expect(html.length, `${key}.renderCard should produce non-empty html`).toBeGreaterThan(0);
    }
  });
});

describe('filters validity', () => {
  function assertFiltersValid(filters: CatalogFilter[], key: string) {
    expect(Array.isArray(filters), `${key}.filters should be array`).toBe(true);
    for (const f of filters) {
      expect(typeof f.key, `${key} filter.key`).toBe('string');
      expect(f.key.length).toBeGreaterThan(0);
      expect(typeof f.label, `${key} filter.label`).toBe('string');
      expect(f.label.length).toBeGreaterThan(0);
      expect(Array.isArray(f.options), `${key} filter.options`).toBe(true);
      for (const opt of f.options) {
        expect(typeof opt.val, `${key} option.val`).toBe('string');
        expect(typeof opt.label, `${key} option.label`).toBe('string');
      }
    }
  }

  it('static filters (if present) have valid structure', () => {
    for (const [key, cfg] of entries) {
      if (cfg.filters !== undefined) {
        assertFiltersValid(cfg.filters, key);
      }
    }
  });

  it('buildFilters (if present) is a function', () => {
    for (const [key, cfg] of entries) {
      if (cfg.buildFilters !== undefined) {
        expect(typeof cfg.buildFilters, `${key}.buildFilters`).toBe('function');
      }
    }
  });

  it('buildFilters returns valid filters given stub data', () => {
    const stubData = [
      { name: 'A', element: 'fire', path: 'Destruction', rarity: 5, subType: 'Material', quality: 'gold', cat: 'offense' },
      { name: 'B', element: 'ice', path: 'Preservation', rarity: 4, subType: 'AvatarExp', quality: 'silver', cat: 'defense' },
    ];
    for (const [key, cfg] of entries) {
      if (cfg.buildFilters) {
        const result = cfg.buildFilters(stubData);
        assertFiltersValid(result, `${key}.buildFilters()`);
      }
    }
  });
});
