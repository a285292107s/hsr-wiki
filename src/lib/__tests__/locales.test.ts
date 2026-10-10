// @vitest-environment node
/**
 * locales.ts（语言清单前端镜像 + 纯路径函数）单元测试。
 * 清单本体的一致性由 tools/check-languages.mjs 守卫（需同时读 Python 侧事实源），
 * 本文件覆盖清单形态与路径收敛语义。
 */
import { describe, it, expect } from 'vitest';
import {
  DEFAULT_LOCALE,
  LOCALES,
  findLocale,
  localeBaseFromPath,
  localeCodes,
  localeFromPath,
  localePrefix,
  localizedPath,
  normalizeLocaleCode,
  stripLocalePrefix,
} from '../i18n/locales';

describe('LOCALES 清单形态', () => {
  it('13 种语言且代码唯一', () => {
    expect(LOCALES).toHaveLength(13);
    expect(new Set(localeCodes()).size).toBe(13);
  });

  it('缺省语言 cn 无前缀，其余前缀等于语言代码', () => {
    for (const l of LOCALES) {
      expect(l.prefix).toBe(l.isDefault ? '' : l.code);
    }
    expect(DEFAULT_LOCALE).toBe('cn');
  });

  it('每种语言都有母语名与 culture', () => {
    for (const l of LOCALES) {
      expect(l.native.length).toBeGreaterThan(0);
      expect(l.culture).toMatch(/^[a-z]{2}-[A-Z]{2}$/);
    }
  });

  it('前缀不与既有路由首段冲突', () => {
    const routes = ['character', 'lightcone', 'relic', 'item', 'monster', 'endgame', 'currency', 'achievement', 'voracity', 'settings'];
    for (const l of LOCALES) {
      if (l.prefix) expect(routes).not.toContain(l.prefix);
    }
  });
});

describe('localeFromPath / localeBaseFromPath（URL 前缀 → router history base）', () => {
  it('已登记前缀 → 对应语言与 base', () => {
    expect(localeFromPath('/en/character').code).toBe('en');
    expect(localeBaseFromPath('/en/character')).toBe('/en/');
    expect(localeBaseFromPath('/jp/settings')).toBe('/jp/');
    expect(localeBaseFromPath('/th')).toBe('/th/');
  });

  it('无前缀 / 未登记首段 / 缺省语言别名 → 缺省语言与根 base', () => {
    expect(localeFromPath('/character').code).toBe('cn');
    expect(localeBaseFromPath('/character')).toBe('/');
    expect(localeBaseFromPath('/')).toBe('/');
    expect(localeBaseFromPath('/cn/character')).toBe('/');        // 缺省语言不做 /cn 别名
    expect(localeBaseFromPath('/english/character')).toBe('/');
  });

  it('culture 供 <html lang>，前缀供 base', () => {
    expect(localeFromPath('/jp/x').culture).toBe('ja-JP');
    expect(localeFromPath('/kr').prefix).toBe('kr');
  });
});

describe('localePrefix / findLocale', () => {
  it('缺省语言前缀为空串', () => {
    expect(localePrefix('cn')).toBe('');
  });

  it('非缺省语言前缀为代码；未登记代码回退空串', () => {
    expect(localePrefix('de')).toBe('de');
    expect(localePrefix('zz')).toBe('');
  });

  it('findLocale 按代码取 culture', () => {
    expect(findLocale('cht')?.culture).toBe('zh-TW');
    expect(findLocale('zz')).toBeUndefined();
  });
});

describe('normalizeLocaleCode', () => {
  it('已登记代码原样返回', () => {
    expect(normalizeLocaleCode('fr')).toBe('fr');
  });

  it('未登记 / 空 / null 回退缺省语言', () => {
    expect(normalizeLocaleCode('zz')).toBe('cn');
    expect(normalizeLocaleCode('')).toBe('cn');
    expect(normalizeLocaleCode(null)).toBe('cn');
    expect(normalizeLocaleCode(undefined)).toBe('cn');
  });
});

describe('stripLocalePrefix', () => {
  it('剥掉已登记语言前缀', () => {
    expect(stripLocalePrefix('/en/character')).toBe('/character');
    expect(stripLocalePrefix('/jp')).toBe('/');
    expect(stripLocalePrefix('/de/currency/trait/1001')).toBe('/currency/trait/1001');
  });

  it('无前缀路径原样返回', () => {
    expect(stripLocalePrefix('/character')).toBe('/character');
    expect(stripLocalePrefix('/monster/123')).toBe('/monster/123');
  });

  it('根路径收敛为 /', () => {
    expect(stripLocalePrefix('/')).toBe('/');
    expect(stripLocalePrefix('')).toBe('/');
  });

  it('首段不是已登记前缀时不误剥', () => {
    expect(stripLocalePrefix('/english/character')).toBe('/english/character');
    expect(stripLocalePrefix('/cn/character')).toBe('/cn/character');
  });

  it('前缀直接跟查询串 / hash 时也能剥（locale 根路径带参）', () => {
    expect(stripLocalePrefix('/en?tab=skills')).toBe('/?tab=skills');
    expect(stripLocalePrefix('/en#top')).toBe('/#top');
    expect(stripLocalePrefix('/jp/monster/7?lv=80')).toBe('/monster/7?lv=80');
  });
});

describe('localizedPath', () => {
  it('缺省语言保持根路径（不做 /cn 别名）', () => {
    expect(localizedPath('cn', '/character')).toBe('/character');
    expect(localizedPath('cn', '/')).toBe('/');
  });

  it('非缺省语言加前缀', () => {
    expect(localizedPath('en', '/character')).toBe('/en/character');
    expect(localizedPath('en', '/')).toBe('/en');
    expect(localizedPath('th', '/currency/trait/1001')).toBe('/th/currency/trait/1001');
  });

  it('幂等：把已带别的语言前缀的路径喂进来不会叠加', () => {
    expect(localizedPath('jp', '/en/monster/12')).toBe('/jp/monster/12');
    expect(localizedPath('cn', '/en/monster/12')).toBe('/monster/12');
    expect(localizedPath('jp', localizedPath('en', '/relic/42'))).toBe('/jp/relic/42');
  });

  it('保留查询串与 hash（切换语言时直接喂 fullPath）', () => {
    expect(localizedPath('en', '/character?tab=skills')).toBe('/en/character?tab=skills');
    expect(localizedPath('cn', '/en/character?tab=skills')).toBe('/character?tab=skills');
  });
});
