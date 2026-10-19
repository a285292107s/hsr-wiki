import { test, expect } from '@playwright/test';
import {
  SWEEP_LOCALES, collectI18nWarnings, routeFamilies,
} from './locales-smoke.shared';
import { collectConsoleIssues } from './helpers';

test.describe('全语言冒烟 · 全部路由族', () => {
  for (const code of SWEEP_LOCALES) {
    const base = code === 'cn' ? '' : `/${code}`;
    test(`${code}：全部路由族均无未解析令牌、无未捕获异常`, { tag: ['@viewport-independent'] }, async ({ page }) => {
      test.setTimeout(120_000);
      const { assertNoErrors } = collectConsoleIssues(page);
      const i18nWarn = collectI18nWarnings(page);
      const paths = routeFamilies(base);
      for (const path of paths) {
        await page.goto(path);
        await expect(page.locator('#app')).toBeVisible();
        await expect.poll(async () => (await page.locator('body').innerText()).length, {
          message: `${code} ${path} 内容未就位`, timeout: 20000,
        }).toBeGreaterThan(150);
        const body = await page.locator('body').innerText();
        expect(body, `${code} ${path} 出现未解析令牌`).not.toContain('$t:');
        expect(await page.title(), `${code} ${path} 标题残留未解析令牌`).not.toContain('$t:');
        const pageOverflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(pageOverflow, `${code} ${path} 整页横向溢出 ${pageOverflow}px`).toBeLessThanOrEqual(1);
      }
      expect(i18nWarn(), `缺键告警：${i18nWarn().slice(0, 3)}`).toEqual([]);
      assertNoErrors();
    });
  }
});
