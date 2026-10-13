/**
 * 页面标题契约：**13 语言都必须带上官方游戏名**。
 *
 * 为什么值得钉：全站快照的 `<title>` 原本只由「页面名 + 品牌名」拼成，游戏名（主关键词）一次都不出现——
 * 这是 on-page SEO 最大的缺口，而且是**静默**的：页面、守卫、类型检查全绿。同时钉住「品牌排最后」，
 * 因为标题被搜索引擎截断时丢的是尾部，关键词必须在前。
 *
 * 快照侧是另一份实现（`tools/gen-ai-endpoints.mjs` 的 `titleTail()`），两份必须同格式：本测试只钉
 * 前端这一侧，快照侧的格式由 `tools/check-ai-endpoints.mjs` 的断言与人工核对保证（执行 JS 的爬虫读
 * 渲染后的 title，无 JS 的爬虫读快照 title，分叉就是同一 URL 两个口径）。
 */
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
      // 缺键时 vue-i18n 会把键名本身渲染出来（与守卫在快照上拦的是同一类缺陷）
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
