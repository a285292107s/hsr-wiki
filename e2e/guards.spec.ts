import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { collectConsoleIssues, expectNoUnknownOverflow, waitForCatalogCards } from './helpers';

interface GuardRoute {
  path: string;
  roots: string[];
  catalog?: boolean;
}

const ROUTES: GuardRoute[] = [
  { path: '/', roots: ['#nk-home-app', '.nk-hub-masthead__title', '.nk-home__version'] },
  { path: '/character', roots: ['#nk-catalog-app', '.nk-cat-toolbar'], catalog: true },
  { path: '/character/1001', roots: ['.nk-hero--char', '.nk-hero__archive'] },
  { path: '/endgame', roots: ['#nk-catalog-app', '.nk-cat-toolbar'], catalog: true },
  { path: '/endgame/maze', roots: ['.nk-egm__hero', '.nk-egm__rule'] },
  { path: '/endgame/story', roots: ['.nk-egm__hero', '.nk-egm__rule'] },
  { path: '/endgame/boss', roots: ['.nk-egm__hero', '.nk-egm__rule'] },
  { path: '/endgame/peak', roots: ['.nk-egm__hero', '.nk-egm__rule'] },
  { path: '/currency', roots: ['.nk-hub-masthead__title', '.nk-hub-release__title'] },
  { path: '/currency/role/1001', roots: ['.nk-crole-hero__name', '.nk-crole-bar'] },
  { path: '/settings', roots: ['#accent-title', '.ui-sidebar'] },
  { path: '/endgame/boss/3020', roots: ['.nk-egd-tabs', '.nk-egd-board'] },
  { path: '/endgame/peak/9', roots: ['#egd-level-tabs', '.nk-egd-peak'] },
  { path: '/endgame/maze/1034', roots: ['.nk-egd-tabs', '.nk-egd-board'] },
  { path: '/endgame/story/2026', roots: ['.nk-egd-tabs', '.nk-egd-board'] },
];

test.describe('不变量守卫（视觉改动不得让其变红）', () => {
  for (const route of ROUTES) {
    test(`不变量 ${route.path}：无未捕获 JS 异常 / 无未知横向溢出 / 关键容器可达`, async ({ page }) => {
      const { assertNoErrors } = collectConsoleIssues(page);
      if (route.path === '/currency/role/1001') {
        await page.route('**/data/cn/currency/prop_icons.json', (r) =>
          r.fulfill({
            contentType: 'application/json',
            body: readFileSync('public/data/cn/currency/prop_icons.json', 'utf8'),
          }),
        );
      }

      await page.goto(route.path);
      if (route.catalog) await waitForCatalogCards(page);

      for (const selector of route.roots) {
        await expect(page.locator(selector).first(), `${route.path} 关键容器 ${selector} 应可达`).toBeVisible();
      }
      await expect(page.locator('h1'), `${route.path} 应有且仅有一个 h1`).toHaveCount(1);
      await expect(page.locator('h1').first(), `${route.path} 的 h1 必须可见`).toBeVisible();
      await expect(page.locator('.nk-error-state')).toHaveCount(0);
      await expectNoUnknownOverflow(page);
      assertNoErrors();
    });
  }

  test('不变量 /settings：调试台 dev 入口与设置入口都在（应用外壳未退化）', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/settings');
    await expect(page.locator('.ui-sidebar')).toBeVisible();
    await expect(page.locator('a.ui-sidebar-settings')).toHaveCount(1);
    assertNoErrors();
  });
});
