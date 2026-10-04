import { test, expect } from '@playwright/test';
import { collectConsoleIssues, waitForCatalogCards } from './helpers';
import { charFamilyIds, collectNavAnchors, noUnknownOverflow } from './layout.shared';

/**
 * 布局验收：研究线调试台 dev 入口 —— layout 验收层（语义契约 + 数值规格）分文件之一。
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

test.describe('布局验收：研究线调试台 dev 入口', () => {
  /** e2e 全程 dev server（import.meta.env.DEV=true）：调试台入口应渲染。
   *  手机隐藏由 CSS 承担；平板/桌面竖排侧栏显示于设置按钮上方。 */
  test('平板/桌面（≥768px）：调试台入口可见且位于设置上方', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/settings');
    const debugLink = page.locator('.ui-sidebar-debug');
    await expect(debugLink).toBeVisible();
    await expect(debugLink).toHaveAttribute('href', '/debug');
    // 位置：设置按钮上方（DOM 序中紧随其后，且 top 更小）
    const settingsLink = page.locator('.ui-sidebar-settings');
    await expect(settingsLink).toBeVisible();
    const debugY = await debugLink.evaluate((el) => el.getBoundingClientRect().top);
    const settingsY = await settingsLink.evaluate((el) => el.getBoundingClientRect().top);
    expect(debugY).toBeLessThan(settingsY);
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  /**
   * 本条有意不带 `@viewport-pinned`：它是 mobile project 里唯一「便宜且宽度敏感」的哨兵——
   * `devices['Pixel 7']` 的 `isMobile: true` 使 `<meta name="viewport">`（index.html）参与布局；
   * 该标签一旦被删/改名，layout viewport 退回 980px，此处 `.ui-sidebar-debug` 由隐藏转可见（tokens.css 断点）
   * → 本条硬失败。删除本条或在 playwright.config.ts 里把它一并排除，等于放弃该契约的唯一防线。
   */
  // e2e-viewport-ok: 用例内 setViewportSize 是**被测对象**（手机档哨兵），必须留在 mobile project 里跑
  test('手机（<768px）：调试台入口隐藏，导航折叠不受影响', async ({ page }) => {
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

  test('/debug 可达：调试台页挂载、四 Tab 渲染（dev-only 路由）', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/debug');
    // 调试台 HUD + 四功能 Tab 静态结构（面板数据经 CDN 异步加载，不作断言）
    await expect(page.locator('.nk-spine-debug__head h1')).toHaveText('Spine 调试台');
    const tabs = page.locator('.nk-spine-debug__tab');
    await expect(tabs).toHaveCount(4);
    await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
    assertNoErrors();
  });
});
