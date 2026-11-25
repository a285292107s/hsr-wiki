import { test, expect } from '@playwright/test';
import { collectConsoleIssues, waitForCatalogCards } from './helpers';
import { noUnknownOverflow } from './layout.shared';

test.describe('布局验收：枢纽页共用顶部导航', () => {
  for (const { width, height, path } of [
    { width: 1280, height: 720, path: '/' },
    { width: 1280, height: 720, path: '/currency' },
    { width: 800, height: 900, path: '/' },
    { width: 390, height: 844, path: '/currency' },
  ]) {
    test(`${width}px：${path} 导航位于报头上方`, { tag: '@viewport-pinned' }, async ({ page }) => {
      const { assertNoErrors } = collectConsoleIssues(page);
      await page.setViewportSize({ width, height });
      await page.goto(path);
      const title = page.locator('.nk-hub-masthead__title');
      const nav = page.locator('nav.ui-top-nav');
      await expect(title).toBeVisible();
      await expect(nav).toBeVisible();
      await expect(page.locator('html')).not.toHaveAttribute('data-nav');
      const navBottom = await nav.evaluate((el) => el.getBoundingClientRect().bottom);
      expect((await title.boundingBox())!.y).toBeGreaterThanOrEqual(navBottom);
      await noUnknownOverflow(page);
      assertNoErrors();
    });
  }

  test('赛季枢纽通过导航进入角色目录，顶部导航仍可见', { tag: '@viewport-pinned' }, async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 900 });
    await page.goto('/currency');
    const nav = page.locator('nav.ui-top-nav');
    await nav.locator('a[href="/currency/role"]').click();
    await expect(page).toHaveURL(/\/currency\/role$/);
    await waitForCatalogCards(page);
    await expect(nav.locator('a[href="/currency/role"]')).toHaveAttribute('aria-current', 'page');
  });
});
