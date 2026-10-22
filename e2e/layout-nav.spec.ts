import { test, expect, type Page } from '@playwright/test';
import { collectConsoleIssues, waitForCatalogCards } from './helpers';
import { collectNavAnchors, noUnknownOverflow, waitForNavMode } from './layout.shared';

test.describe('布局验收：导航动态溢出折叠', () => {

  test('窄视口：可见项恒为规范序前缀，尾部折叠进"更多"抽屉', { tag: ['@visual-detail', '@viewport-pinned'] }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto('/settings');
    await expect(page.locator('.ui-sidebar-more')).toBeVisible();
    const anchors = await collectNavAnchors(page);
    expect(anchors.length).toBeGreaterThan(1);
    const visIdx = anchors.map((a, i) => (a.visible ? i : -1)).filter((i) => i >= 0);
    expect(visIdx).toEqual(Array.from({ length: visIdx.length }, (_, i) => i));

    const allHrefs = await page.evaluate(() => {
      const bar = document.querySelector('.ui-sidebar')!;
      return [...bar.querySelectorAll('a.ui-sidebar-link:not(.ui-sidebar-settings):not(.ui-sidebar-debug)')]
        .map((el) => el.getAttribute('href'));
    });
    expect(allHrefs.length).toBeGreaterThan(0);
    await page.locator('.ui-sidebar-more').click();
    await expect(page.locator('.ui-more__item').first()).toBeVisible();
    const drawerHrefs = await page.locator('.ui-more__item').evaluateAll((els) =>
      els.map((el) => el.getAttribute('href')),
    );
    const union = [...allHrefs, ...drawerHrefs];
    expect(new Set(union).size, '底栏与抽屉不得重复同一路由').toBe(union.length);
    expect(drawerHrefs.length, '320px 档必须确有折叠项').toBeGreaterThan(0);
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('窄视口（≥768px）：全部平铺，无折叠、"更多"入口隐藏', { tag: ['@visual-detail', '@viewport-pinned'] }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/settings');
    await waitForNavMode(page, 'normal');
    await expect(page.locator('.ui-sidebar-more')).toBeHidden();
    const anchors = await collectNavAnchors(page);
    expect(anchors.length).toBeGreaterThan(1);
    await expect(page.locator('.ui-more__item')).toHaveCount(0);
    expect(anchors.every((a) => a.visible)).toBe(true);
    await noUnknownOverflow(page);
    assertNoErrors();
  });
});

test.describe('布局验收：底栏槽位数与语言无关', () => {
  test('中文与葡语（最长译文）在窄视口下槽位数一致', { tag: ['@visual-detail', '@viewport-pinned'] }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    const count = async (url: string, width: number): Promise<number> => {
      await page.setViewportSize({ width, height: 780 });
      await page.goto(url);
      await waitForNavMode(page, 'normal');
      return page.locator('.ui-sidebar')
        .locator('a.ui-sidebar-link:not(.ui-sidebar-settings):not(.ui-sidebar-debug)')
        .evaluateAll((els) => els.filter((el) => el.offsetParent !== null).length);
    };
    for (const width of [320, 390, 430]) {
      const cn = await count('/character', width);
      const pt = await count('/pt/character', width);
      expect(pt, `${width}px：葡语底栏槽位数应与中文一致（改前葡语更少）`).toBe(cn);
      expect(cn, `${width}px：底栏至少 2 槽`).toBeGreaterThanOrEqual(2);
    }
    assertNoErrors();
  });

  test('货币战争模式：常规手机档全量平铺（无「更多」抽屉）', { tag: ['@visual-detail', '@viewport-pinned'] }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 390, height: 780 });
    await page.goto('/currency/role');
    await waitForNavMode(page, 'cw');
    const all = await page.locator('.ui-sidebar')
      .locator('a.ui-sidebar-link:not(.ui-sidebar-settings):not(.ui-sidebar-debug)')
      .evaluateAll((els) => els.map((el) => ({ href: el.getAttribute('href'), vis: el.offsetParent !== null })));
    expect(all.length, '货币战争模式的章节项应全部渲染').toBeGreaterThan(1);
    expect(all.every((a) => a.vis), '390px 档货币战争模式应全量平铺（ADR 0007 的 6 槽位口径）').toBe(true);
    await expect(page.locator('.ui-sidebar-more'), '全量平铺时不得出现「更多」入口').toBeHidden();
    assertNoErrors();
  });
});

test.describe('布局验收：跨模式入口文案', () => {

  test('可见标签 = 目的地模式名（常规↔货币战争双向），点击落到对方图签页', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    const swap = page.locator('.ui-sidebar-swap');

    await page.goto('/character');
    await expect(swap.locator('.ui-sidebar-link__cn')).toHaveText('货币战争');
    await expect(swap.locator('.ui-sidebar-link__en')).toHaveText('CURRENCY WAR');
    await expect(swap.locator('.ui-sidebar-link__label')).toHaveText('货币战争');
    await expect(swap).toHaveAttribute('aria-label', '前往货币战争');
    await expect(swap).toHaveAttribute('title', '前往货币战争');
    await expect(swap).not.toContainText('交换');

    await expect(page.locator('.ui-sidebar-tools').locator('.ui-sidebar-swap')).toHaveCount(1);
    expect(await swap.evaluate((el) => el.nextElementSibling?.classList.contains('ui-sidebar-settings'))).toBe(true);
    const vis = await page.evaluate(() => {
      const s = document.querySelector('.ui-sidebar-swap')!.getBoundingClientRect();
      const e = document.querySelector('.ui-sidebar-settings')!.getBoundingClientRect();
      return { swapY: s.y, swapX: s.x, settingsY: e.y, settingsX: e.x };
    });
    expect(vis.swapY <= vis.settingsY + 1 || vis.swapX < vis.settingsX).toBe(true);

    await swap.click();
    await expect(page).toHaveURL(/\/currency\/role$/);

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
  test('侧栏文案落位一致：内容项（a）与工具项（button）的两行文案左缘必须对齐', { tag: ['@visual-detail', '@viewport-pinned'] }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/character');
    await expect(page.locator('.ui-sidebar-link').first()).toBeVisible();

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

test.describe('布局验收：设置入口可收起', () => {
  const pathname = (page: Page) => new URL(page.url()).pathname;

  test('站内从详情页进设置，再点设置 → 回到该详情页', { tag: '@viewport-independent' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/character/1212');
    await waitForCatalogCards(page, '.nk-hero--char');
    await page.locator('.ui-sidebar-settings').click();
    await expect.poll(() => pathname(page), '首次点击应进入设置页').toBe('/settings');
    await page.locator('.ui-sidebar-settings').click();
    await expect.poll(() => pathname(page), '再点设置应收起并回到进入前的详情页').toBe('/character/1212');
    assertNoErrors();
  });

  test('直达设置页（无站内历史），再点设置 → 兜底回本模式首页', { tag: '@viewport-independent' }, async ({ page }) => {
    await page.goto('/settings');
    await page.waitForSelector('.nk-settings', { state: 'attached', timeout: 15_000 });
    await page.locator('.ui-sidebar-settings').click();
    await expect.poll(() => pathname(page), '无站内历史时应兜底回 / 而不是留在设置页').toBe('/');
    await expect(page.locator('.nk-settings')).toHaveCount(0);
  });

  test('货币战争模式：站内进入再点回原页；直达则兜底回货币战争枢纽', { tag: '@viewport-independent' }, async ({ page }) => {
    await page.goto('/currency/role');
    await waitForCatalogCards(page);
    await page.locator('.ui-sidebar-settings').click();
    await expect.poll(() => pathname(page)).toBe('/currency/settings');
    await page.locator('.ui-sidebar-settings').click();
    await expect.poll(() => pathname(page), '再点设置应收起并回到进入前的货币战争页').toBe('/currency/role');

    await page.goto('/currency/settings');
    await page.waitForSelector('.nk-settings', { state: 'attached', timeout: 15_000 });
    await page.locator('.ui-sidebar-settings').click();
    await expect.poll(() => pathname(page), '兜底落点必须是本模式枢纽（/currency）而非常规首页').toBe('/currency');
  });

  test('语言前缀档同判据：/en/settings 收起回 /en/character', { tag: '@viewport-independent' }, async ({ page }) => {
    await page.goto('/en/character');
    await waitForCatalogCards(page);
    await page.locator('.ui-sidebar-settings').click();
    await expect.poll(() => pathname(page)).toBe('/en/settings');
    await page.locator('.ui-sidebar-settings').click();
    await expect.poll(() => pathname(page), '前缀不得被收起动作吃掉').toBe('/en/character');
  });

  test('首屏 chunk 就绪前点设置：收起仍须回本页 URL', { tag: '@viewport-independent' }, async ({ page }) => {
    await page.route('**/CatalogView.vue*', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2500));
      await route.continue();
    });
    await page.goto('/en/character', { waitUntil: 'domcontentloaded' });
    const settings = page.locator('.ui-sidebar-settings');
    await expect(settings).toBeVisible();
    const shellOnly = await page.evaluate(() => {
      const app = document.getElementById('app');
      return !!app && [...app.children].every((el) => el.matches('.ui-sidebar, .nk-toast-container'));
    });
    expect(shellOnly, '前置条件：点进设置时首屏视图尚未挂载（延迟 chunk 生效）').toBe(true);
    await settings.click();
    await expect.poll(() => pathname(page)).toBe('/en/settings');
    await settings.click();
    await expect
      .poll(() => pathname(page), { timeout: 15_000, message: '收起必须回本次落地的 URL（路径与语言前缀都不得被吃掉）' })
      .toBe('/en/character');
  });
});
