import { test, expect } from '@playwright/test';
import { collectConsoleIssues, computedNumber, waitForCatalogCards } from './helpers';
import { expectTokenNumber, noUnknownOverflow, readContentOffset } from './layout.shared';

test.describe('布局验收：枢纽页共享页脚原语', () => {
  test('/ 与 /currency 共用 .nk-hub-footer（声明于 tokens.css），全断点留白正确', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 1280, height: 720 });
    for (const path of ['/', '/currency'] as const) {
      await page.goto(path);
      const footer = page.locator('.nk-hub-footer');
      await expect(footer).toHaveCount(1);
      await expect(page.locator('.nk-home-footer')).toHaveCount(0);
      await expectTokenNumber(footer, 'padding-left', await readContentOffset(page), '页脚左避让');
      const gutterFrom = path === '/' ? '.nk-intake' : '.nk-hub-release';
      const releaseGutter = await computedNumber(page.locator(gutterFrom).first(), 'padding-right');
      expect(releaseGutter).toBeGreaterThan(0);
      await expectTokenNumber(footer, 'padding-right', releaseGutter, '页脚右留白（=枢纽版块右留白）');
      const mottoFont = await footer.locator('.nk-hub-footer__motto').evaluate(
        (el) => getComputedStyle(el).fontFamily,
      );
      expect(mottoFont).toContain('Noto Sans SC');
      await expect(footer.locator('.nk-hub-footer__latin')).toHaveCount(0);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await expect(page.locator('.ui-sidebar')).toBeVisible();
    const barHeight = await page.locator('.ui-sidebar').evaluate((el) => el.getBoundingClientRect().height);
    expect(barHeight, '底部导航栏高度应大于 0（否则本判据失去意义）').toBeGreaterThan(0);
    const padBottom = await computedNumber(page.locator('.nk-hub-footer'), 'padding-bottom');
    expect(padBottom, `页脚底部留白 ${padBottom} 应容得下底部栏 ${barHeight}`).toBeGreaterThanOrEqual(barHeight);
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('全站等宽令牌 --font-mono：单点声明 + 目录页消费（裸字面量回归防线）', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/character');
    await waitForCatalogCards(page);
    const token = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--font-mono'),
    );
    expect(token).toContain('ui-monospace');
    await expect(page.locator('.nk-cat-count').first()).toHaveCSS('font-family', /ui-monospace/);
    assertNoErrors();
  });
});
