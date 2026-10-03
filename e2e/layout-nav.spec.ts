import { test, expect } from '@playwright/test';
import { collectConsoleIssues } from './helpers';
import { collectNavAnchors, noUnknownOverflow } from './layout.shared';

/**
 * 布局验收：导航动态溢出折叠 —— layout 验收层（语义契约 + 数值规格）分文件之一。
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

test.describe('布局验收：导航动态溢出折叠', () => {

  test('窄视口：可见项恒为规范序前缀，尾部折叠进"更多"抽屉', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto('/settings');
    // 320px 常规模式 9 导航项放不下 → 至少折叠出"更多"入口
    await expect(page.locator('.ui-sidebar-more')).toBeVisible();
    const anchors = await collectNavAnchors(page);
    expect(anchors.length).toBeGreaterThan(1);
    // 前缀性质：可见锚点在 DOM 序中恒为前 k 个（不放乱序/交错）
    const visIdx = anchors.map((a, i) => (a.visible ? i : -1)).filter((i) => i >= 0);
    expect(visIdx).toEqual(Array.from({ length: visIdx.length }, (_, i) => i));
    // 只有折叠（可见项 < 全量）→ 抽屉内容 = 隐藏尾部，顺序一致
    const foldedHrefs = anchors.filter((a) => !a.visible).map((a) => a.href);
    expect(foldedHrefs.length).toBeGreaterThan(0);
    await page.locator('.ui-sidebar-more').click();
    const drawerHrefs = await page.locator('.ui-more__item').evaluateAll((els) =>
      els.map((el) => el.getAttribute('href')),
    );
    expect(drawerHrefs).toEqual(foldedHrefs);
    // 320px 低于最小声明断点 374，属未声明支持区间。已知项（.nk-seg 手机宽被裁，登记于
    // helpers.ts 的 KNOWN_OVERFLOWS）过滤后断言：其余任何溢出仍然失败。
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('宽视口（≥768px）：全部平铺，无折叠、"更多"入口隐藏', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/settings');
    await expect(page.locator('.ui-sidebar-more')).toBeHidden();
    // 无折叠项渲染；全部导航锚点可见
    await expect(page.locator('a.ui-sidebar-link--in-more')).toHaveCount(0);
    const anchors = await collectNavAnchors(page);
    expect(anchors.length).toBeGreaterThan(1);
    expect(anchors.every((a) => a.visible)).toBe(true);
    await noUnknownOverflow(page);
    assertNoErrors();
  });
});
