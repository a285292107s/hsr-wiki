import { test, expect } from '@playwright/test';
import { collectConsoleIssues, waitForCatalogCards } from './helpers';
import { charFamilyIds, collectNavAnchors, noUnknownOverflow } from './layout.shared';

test.describe('布局验收：研究线调试台 dev 入口', () => {
  test('平板/桌面（≥768px）：调试台入口可见且位于设置上方', { tag: ['@viewport-pinned', '@dev-only'] }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/settings');
    const debugLink = page.locator('.ui-sidebar-debug');
    await expect(debugLink).toBeVisible();
    await expect(debugLink).toHaveAttribute('href', '/debug');
    const settingsLink = page.locator('.ui-sidebar-settings');
    await expect(settingsLink).toBeVisible();
    const debugY = await debugLink.evaluate((el) => el.getBoundingClientRect().top);
    const settingsY = await settingsLink.evaluate((el) => el.getBoundingClientRect().top);
    expect(debugY).toBeLessThan(settingsY);
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  // e2e-viewport-ok: 用例内 setViewportSize 是**被测对象**（手机档哨兵），必须留在 mobile project 里跑
  test('手机（<768px）：调试台入口隐藏，导航折叠不受影响', { tag: '@dev-only' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/character');
    await waitForCatalogCards(page);
    await expect(page.locator('.ui-sidebar-debug')).toBeHidden();
    const anchors = await collectNavAnchors(page);
    expect(anchors.length).toBeGreaterThan(1);
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/debug 可达：调试台页挂载、四 Tab 渲染（dev-only 路由）', { tag: '@dev-only' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/debug');
    await expect(page.locator('.nk-spine-debug__head h1')).toHaveText('Spine 调试台');
    const tabs = page.locator('.nk-spine-debug__tab');
    await expect(tabs).toHaveCount(4);
    await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
    assertNoErrors();
  });
});
