// @vitest-environment node
import { describe, it, expect, afterEach } from 'vitest';
import { activeHref, activeLocale, resetActiveLocale, setActiveLocale } from '../i18n/active';
import { localizedPath } from '../i18n/locales';

afterEach(() => {
  resetActiveLocale();
});

describe('activeHref', () => {
  it('缺省语言原样返回', () => {
    expect(activeLocale()).toBe('cn');
    expect(activeHref('/character/1001')).toBe('/character/1001');
    expect(activeHref('/')).toBe('/');
  });

  it('非缺省语言加前缀（与 router history base 同一规则）', () => {
    setActiveLocale('en');
    expect(activeHref('/character/1001')).toBe('/en/character/1001');
    expect(activeHref('/endgame/maze/1036')).toBe('/en/endgame/maze/1036');
    expect(activeHref('/')).toBe('/en');
  });

  it('未登记代码回退缺省语言，且不重复加前缀', () => {
    setActiveLocale('zz');
    expect(activeLocale()).toBe('cn');
    expect(activeHref('/relic/101')).toBe('/relic/101');
    setActiveLocale('jp');
    expect(activeHref('/en/relic/101')).toBe('/jp/relic/101');
  });
});

describe('localizedPath 的 hash 保真（切语言不得丢锚点）', () => {
  it('带前缀 / 回缺省语言都保留 hash', () => {
    expect(localizedPath('jp', '/de/character/1001#skills')).toBe('/jp/character/1001#skills');
    expect(localizedPath('cn', '/en/character/1001#skills')).toBe('/character/1001#skills');
  });
});
