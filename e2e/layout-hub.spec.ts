import { test, expect } from '@playwright/test';
import { collectConsoleIssues, waitForCatalogCards } from './helpers';
import { expectTokenNumber, noUnknownOverflow, readContentOffset } from './layout.shared';

/**
 * 布局验收：枢纽页导航条回归（ADR 0019） —— layout 验收层（语义契约 + 数值规格）分文件之一。
 *
 * 拆分动因：`fullyParallel: false` 下**文件内**串行，单文件 layout（74 用例 / 469s）把全量墙钟
 * 锁死在 6.6 分钟（a11y 仅 85s 跑完后两个 worker 空转）。按 describe 边界拆开后文件级并行生效，
 * 每条用例的隔离性与拆分前完全一致（文件内本就串行），故已记录的并发 flake 纪律不受影响。
 *
 * `@viewport-pinned` 标签：凡用例内自行 `setViewportSize(...)` 固定视口者，必须在 `test(...)`
 * 第二参传该标签（mobile-chromium 以 `grepInvert` 跳过，视口已由用例钉死）。标签须静态书写，
 * 动态 annotation 对收集期过滤无效。
 *
 * 数值断言的三种合法形态：① 令牌派生（`readTokenPx` / `computedNumber`）；② 相对关系（序、等值、
 * 整数倍、跨断点只放大不缩小）；③ 数据派生（期望值从 `public/data/cn/**.json` 读）。
 * 绝对 px 只允许出现在跨会话不得漂移的契约值。**禁止新增** `toHaveCSS(<绝对值>)` 一类断言。
 *
 * 跨块共用的取值原语与数据派生在 `e2e/layout.shared.ts`；不变量层在 `e2e/guards.spec.ts`。
 */

test.describe('布局验收：枢纽页导航条回归（ADR 0019）', () => {
  test('桌面（1280px）：/ 与 /currency 渲染侧栏，避让 148px，无 data-nav', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 1280, height: 720 });

    await page.goto('/');
    await expect(page.locator('.nk-hub-brand__title')).toBeVisible();
    await expect(page.locator('.ui-sidebar')).toBeVisible();
    // 无侧栏枢纽形态已移除——data-nav 属性与避让回退一并退场
    await expect(page.locator('html')).not.toHaveAttribute('data-nav');
    expect(await readContentOffset(page)).toBe(148);
    // 令牌真实生效：品牌带标题区左缘 = 侧栏避让令牌落值
    await expectTokenNumber(page.locator('.nk-hub-brand__content'), 'padding-left', await readContentOffset(page), '品牌带内容区左避让');

    await page.goto('/currency');
    await expect(page.locator('.nk-hub-brand__title')).toBeVisible();
    await expect(page.locator('.ui-sidebar')).toBeVisible();
    await expect(page.locator('html')).not.toHaveAttribute('data-nav');
    expect(await readContentOffset(page)).toBe(148);
    await expectTokenNumber(page.locator('.nk-hub-release'), 'padding-left', await readContentOffset(page), '枢纽版块左避让');

    // 客户端路由切换（非整页加载）主流程：枢纽页 → 板块页全程导航条在位。
    await page.locator('.ui-sidebar a[href="/currency/role"]').first().click();
    // 落点断言（期望值取自 CW_NAV_ITEMS[0].path，勿凭直觉）
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
    await expectTokenNumber(page.locator('.nk-hub-release'), 'padding-left', await readContentOffset(page), '平板档枢纽版块左避让');
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('手机（390px）：枢纽页渲染底部栏（全断点无导航的特例已作废）', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/currency');
    await expect(page.locator('.ui-sidebar')).toBeVisible();
    await expect(page.locator('html')).not.toHaveAttribute('data-nav');
    // 手机端侧面无避让：底部栏不占左缘，避让令牌维持 0
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
