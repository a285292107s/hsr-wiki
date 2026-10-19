import { describe, it, expect, afterAll } from 'vitest';
import { pageTitle } from '../seo';
import { setI18nLocale } from '../i18n';
import { LOCALES } from '../../lib/i18n/locales';
import { SITE_NAME } from '../../lib/constants';

afterAll(() => setI18nLocale('cn'));

describe('页面标题', () => {
  it('每种语言都含官方游戏名，且品牌排最后', () => {
    for (const l of LOCALES) {
      setI18nLocale(l.code);
      const title = pageTitle('黄泉');
      expect(title.startsWith('黄泉 - '), `${l.code}: ${title}`).toBe(true);
      expect(title.endsWith(SITE_NAME), `${l.code}: ${title}`).toBe(true);
      expect(title, `${l.code}: ${title}`).not.toContain('meta.gameName');
      expect(title, `${l.code}: ${title}`).not.toContain('undefined');
    }
  });

  it('省略页面名 = 站点级标题（首页），且不带「首页」这类零搜索价值的前缀', () => {
    setI18nLocale('cn');
    expect(pageTitle()).toBe(`崩坏：星穹铁道 Wiki | ${SITE_NAME}`);
    setI18nLocale('en');
    expect(pageTitle()).toBe(`Honkai: Star Rail Wiki | ${SITE_NAME}`);
    setI18nLocale('jp');
    expect(pageTitle()).toBe(`崩壊：スターレイル Wiki | ${SITE_NAME}`);
  });
});
