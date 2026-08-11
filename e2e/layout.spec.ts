import { test, expect } from '@playwright/test';
import { collectConsoleIssues, findHorizontalOverflow, waitForCatalogCards } from './helpers';

/**
 * 布局验收（AGENTS.md T1b/T2 的自动化落地）
 *
 * 覆盖四类关键页面：
 * - /          常规首页（hero + 导航行）
 * - /character 目录页（虚拟滚动网格，卡片模板字符串渲染）
 * - /endgame   终局合并单页
 * - /currency  货币战争 Hub（meta.cw → <html data-theme="cw"> 黑金主题）
 *
 * 每页统一断言：无未捕获 JS 异常 + 无横向溢出 + 关键结构存在。
 */

test.describe('布局验收：常规主题', () => {
  test('首页 /：hero 标题、板块导航、无溢出', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/');
    await expect(page.locator('.nk-home-hero__title')).toBeVisible();
    await expect(page.locator('.nk-home-hero__title')).toHaveText(/星铁档案馆/);
    // 板块导航行数量 = 配置的 indexGroups（≥4 个板块）
    const rowCount = await page.locator('.nk-home-row').count();
    expect(rowCount).toBeGreaterThanOrEqual(4);
    // 常规模式不得挂 cw 主题
    await expect(page.locator('html')).not.toHaveAttribute('data-theme', 'cw');
    // L3 溢出
    expect(await findHorizontalOverflow(page)).toEqual([]);
    assertNoErrors();
  });

  test('角色图鉴 /character：卡片渲染、筛选工具条、无溢出', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/character');
    await waitForCatalogCards(page);
    const cardCount = await page.locator('[class$="-grid"] a').count();
    expect(cardCount).toBeGreaterThan(0);
    // 工具条存在（搜索/筛选）
    await expect(page.locator('.nk-catalog-toolbar, .nk-cat-filters').first()).toBeVisible();
    expect(await findHorizontalOverflow(page)).toEqual([]);
    assertNoErrors();
  });
});

test.describe('布局验收：终局合并单页', () => {
  test('/endgame：四模式筛选、卡片渲染、无溢出', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/endgame');
    await waitForCatalogCards(page);
    const cardCount = await page.locator('[class$="-grid"] a').count();
    expect(cardCount).toBeGreaterThan(0);
    expect(await findHorizontalOverflow(page)).toEqual([]);
    assertNoErrors();
  });
});

test.describe('布局验收：货币战争主题', () => {
  test('/currency：黑金主题挂载、导航齐全、无溢出', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/currency');
    // meta.cw → <html data-theme="cw">
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'cw');
    // CW Hub 导航（SECTORS 板块卡）
    await expect(page.locator('.nk-cwhub-hero__title')).toBeVisible();
    const sectionCards = await page.locator('.nk-cwhub-card').count();
    expect(sectionCards).toBeGreaterThanOrEqual(3);
    expect(await findHorizontalOverflow(page)).toEqual([]);
    assertNoErrors();
  });
});

test.describe('布局验收：角色详情页', () => {
  test('/character/1001：hero、概览面板、无溢出', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/character/1001');
    // CharHero 渲染（数据流最复杂的高频路径，P1-3）
    await expect(page.locator('.nk-hero--char')).toBeVisible();
    await expect(page.locator('.nk-hero__archive')).toContainText('1001');
    // 概览面板结构出现（PROFILE / TALENTS 等区块）
    await expect(page.locator('.nk-profile, .nk-title').first()).toBeVisible();
    expect(await findHorizontalOverflow(page)).toEqual([]);
    assertNoErrors();
  });
});
