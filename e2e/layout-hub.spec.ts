import { test, expect } from '@playwright/test';
import { collectConsoleIssues, waitForCatalogCards } from './helpers';
import { expectTokenNumber, noUnknownOverflow, readContentOffset } from './layout.shared';

test.describe('布局验收：枢纽页导航条回归（ADR 0019）', () => {
  test('桌面（1280px）：/ 与 /currency 渲染侧栏，避让 148px，无 data-nav', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 1280, height: 720 });

    await page.goto('/');
    await expect(page.locator('.nk-hub-masthead__title')).toBeVisible();
    await expect(page.locator('.ui-sidebar')).toBeVisible();
    await expect(page.locator('html')).not.toHaveAttribute('data-nav');
    expect(await readContentOffset(page)).toBe(148);
    await expectTokenNumber(page.locator('.nk-intake'), 'padding-left', await readContentOffset(page), '首页内容区左避让');

    await page.goto('/currency');
    await expect(page.locator('.nk-hub-masthead__title')).toBeVisible();
    await expect(page.locator('.ui-sidebar')).toBeVisible();
    await expect(page.locator('html')).not.toHaveAttribute('data-nav');
    expect(await readContentOffset(page)).toBe(148);
    await expectTokenNumber(page.locator('.nk-hub-release'), 'padding-left', await readContentOffset(page), '枢纽版块左避让');

    await page.locator('.ui-sidebar a[href="/currency/role"]').first().click();
    await expect(page).toHaveURL(/\/currency\/role$/);
    await expect(page.locator('.ui-sidebar')).toBeVisible();
    await expect(page.locator('html')).not.toHaveAttribute('data-nav');
    expect(await readContentOffset(page)).toBe(148);
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('平板（800px）：/ 渲染侧栏，避让 88px', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 800, height: 900 });
    await page.goto('/');
    await expect(page.locator('.ui-sidebar')).toBeVisible();
    await expect(page.locator('html')).not.toHaveAttribute('data-nav');
    expect(await readContentOffset(page)).toBe(88);
    await expectTokenNumber(page.locator('.nk-intake'), 'padding-left', await readContentOffset(page), '平板档枢纽版块左避让');
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('手机（390px）：枢纽页渲染底部栏（全断点无导航的特例已作废）', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/currency');
    await expect(page.locator('.ui-sidebar')).toBeVisible();
    await expect(page.locator('html')).not.toHaveAttribute('data-nav');
    expect(await readContentOffset(page)).toBe(0);
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('非枢纽页（/character）：侧栏与 148px 避让照常，无 data-nav', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/character');
    await waitForCatalogCards(page);
    await expect(page.locator('.ui-sidebar')).toBeVisible();
    await expect(page.locator('html')).not.toHaveAttribute('data-nav');
    expect(await readContentOffset(page)).toBe(148);
    assertNoErrors();
  });
});
