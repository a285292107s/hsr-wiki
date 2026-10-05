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

test.describe('布局验收：跨模式入口文案', () => {

  test('可见标签 = 目的地模式名（常规↔货币战争双向），点击落到对方图签页', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    const swap = page.locator('.ui-sidebar-swap');

    // 常规模式页：按钮直接写目的地「货币战争」，旧标签「交换 / SWAP」退场
    await page.goto('/character');
    await expect(swap.locator('.ui-sidebar-link__cn')).toHaveText('货币战争');
    await expect(swap.locator('.ui-sidebar-link__en')).toHaveText('CURRENCY WAR');
    // 手机底栏显示的是 __label 那份，必须同文案（桌面档该元素 display:none，文本仍可比对）
    await expect(swap.locator('.ui-sidebar-link__label')).toHaveText('货币战争');
    await expect(swap).toHaveAttribute('aria-label', '前往货币战争');
    await expect(swap).toHaveAttribute('title', '前往货币战争');
    await expect(swap).not.toContainText('交换');

    // 位置契约：入口属「工具」组（与设置同组、紧贴其前），不再是导航首项
    await expect(page.locator('.ui-sidebar-tools').locator('.ui-sidebar-swap')).toHaveCount(1);
    expect(await swap.evaluate((el) => el.nextElementSibling?.classList.contains('ui-sidebar-settings'))).toBe(true);
    const vis = await page.evaluate(() => {
      const s = document.querySelector('.ui-sidebar-swap')!.getBoundingClientRect();
      const e = document.querySelector('.ui-sidebar-settings')!.getBoundingClientRect();
      return { swapY: s.y, swapX: s.x, settingsY: e.y, settingsX: e.x };
    });
    // 视觉序：侧栏里在上（同列）或底栏里在左（同行），两种断点都成立
    expect(vis.swapY <= vis.settingsY + 1 || vis.swapX < vis.settingsX).toBe(true);

    // 点击 → 对方模式的图签页（ADR 0016 决策 1 的落点粒度不变）
    await swap.click();
    await expect(page).toHaveURL(/\/currency\/role$/);

    // 货币战争页：反过来写「常规模式」
    await expect(swap.locator('.ui-sidebar-link__cn')).toHaveText('常规模式');
    await expect(swap.locator('.ui-sidebar-link__en')).toHaveText('NORMAL MODE');
    await expect(swap.locator('.ui-sidebar-link__label')).toHaveText('常规模式');
    await expect(swap).toHaveAttribute('aria-label', '前往常规模式');
    await expect(swap).toHaveAttribute('title', '前往常规模式');

    await swap.click();
    await expect(page).toHaveURL(/\/character$/);
    await noUnknownOverflow(page);
    assertNoErrors();
  });
});

test.describe('布局验收：侧栏各项风格一致', () => {
  test('侧栏文案落位一致：内容项（a）与工具项（button）的两行文案左缘必须对齐', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/character');
    await expect(page.locator('.ui-sidebar-link').first()).toBeVisible();

    /* 用户报的缺陷：侧栏「货币战争」看着居中、与别的 tab 不齐。
       根因是**元素类型**而非类名——内容项是 `<RouterLink>`（`a`，UA 默认 `text-align: start`），
       「交换」与「更多」是 `<button>`（UA 默认 `center`）；而 ≥1024 档 `.ui-sidebar-link__text`
       是纵向 flex，两行文案被拉伸到同宽后由 `text-align` 决定落位 ⇒ 只有按钮项的两行居中。
       判据不写绝对 px：① 各项 `text-align` 必须与首项相同；② **同一项内** CN 与 EN 两行文字的
       ink 左缘必须一致（居中的话较短的 CN 行会右移）。 */
    const rows = await page.evaluate(() => {
      const inkLeft = (node: Element) => {
        const range = document.createRange();
        range.selectNodeContents(node);
        return Math.round(range.getBoundingClientRect().left);
      };
      return [...document.querySelectorAll('.ui-sidebar-link')]
        .filter((el) => getComputedStyle(el).display !== 'none')
        .map((el) => {
          const cn = el.querySelector('.ui-sidebar-link__cn');
          const en = el.querySelector('.ui-sidebar-link__en');
          const label = el.querySelector('.ui-sidebar-link__label');
          const visible = (n: Element | null) => n && getComputedStyle(n).display !== 'none' && n.getBoundingClientRect().width > 0;
          return {
            name: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 12),
            tag: el.tagName.toLowerCase(),
            textAlign: getComputedStyle(el).textAlign,
            cnLeft: visible(cn) ? inkLeft(cn!) : null,
            enLeft: visible(en) ? inkLeft(en!) : null,
            labelLeft: visible(label) ? inkLeft(label!) : null,
          };
        });
    });
    expect(rows.length, '侧栏应有可见项').toBeGreaterThan(5);

    const ref = rows[0];
    expect(ref.textAlign, '基准项应为左对齐').toBe('start');
    for (const r of rows) {
      expect(r.textAlign, `${r.name}（${r.tag}）的 text-align 应与基准一致`).toBe(ref.textAlign);
      if (r.cnLeft !== null && r.enLeft !== null) {
        expect(Math.abs(r.cnLeft - r.enLeft), `${r.name}：CN 与 EN 两行左缘必须对齐（居中即不对齐）`).toBeLessThanOrEqual(1);
      }
      if (r.cnLeft !== null && r.labelLeft !== null) {
        expect(Math.abs(r.cnLeft - r.labelLeft), `${r.name}：CN 与底栏标签左缘必须对齐`).toBeLessThanOrEqual(1);
      }
    }
    assertNoErrors();
  });
});
