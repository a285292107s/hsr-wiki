import { test, expect, type Page } from '@playwright/test';
import { collectConsoleIssues, waitForCatalogCards } from './helpers';
import { noUnknownOverflow } from './layout.shared';

test.describe('布局验收：全站顶部导航', () => {
  for (const width of [390, 800, 1600]) {
    test(`${width}px：顶部导航随页面滚动保持可见`, { tag: '@viewport-pinned' }, async ({ page }) => {
      await page.setViewportSize({ width, height: 780 });
      await page.goto('/');
      const nav = page.locator('nav.ui-top-nav');
      await expect(nav).toBeVisible();
      await expect(page.locator('.ui-site-header')).toHaveCSS('position', 'sticky');
      await expect(page.locator('.nk-hub-footer')).toBeVisible();
      const top = await nav.evaluate((el) => el.getBoundingClientRect().top);
      const scroller = page.locator('#nk-home-app');
      await expect.poll(() => scroller.evaluate((el) => el.scrollHeight - el.clientHeight)).toBeGreaterThan(0);
      await scroller.evaluate((el) => el.scrollTo({ top: el.scrollHeight, behavior: 'instant' }));
      await expect.poll(() => scroller.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
      await expect.poll(() => nav.evaluate((el) => el.getBoundingClientRect().top)).toBe(top);
      await noUnknownOverflow(page);
    });
  }
  const normalSections = ['/', '/character', '/lightcone', '/relic', '/endgame'];
  const cwSections = ['/currency', '/currency/role', '/currency/item', '/currency/buff', '/currency/augment', '/currency/trait'];
  const stripLocale = (href: string | null): string => {
    const raw = href ?? '';
    if (raw === '/en') return '/';
    return raw.startsWith('/en/') ? raw.slice(3) : raw;
  };

  for (const { width, route, activeHref, sections } of [
    { width: 320, route: '/relic', activeHref: '/relic', sections: normalSections },
    { width: 390, route: '/currency/role', activeHref: '/currency/role', sections: cwSections },
    { width: 600, route: '/en/relic', activeHref: '/en/relic', sections: normalSections },
  ]) {
    test(`${width}px：${route} 当前项常显，折叠项可访问`, { tag: '@viewport-pinned' }, async ({ page }) => {
      await page.setViewportSize({ width, height: 780 });
      await page.goto(route);
      const nav = page.locator('nav.ui-top-nav');
      const active = nav.locator(`a[href="${activeHref}"][aria-current="page"]`);
      await expect(active).toBeVisible();
      const more = nav.locator('.ui-sidebar-more');
      await expect(more).toHaveAttribute('aria-expanded', 'false');
      await more.click();
      await expect(more).toHaveAttribute('aria-expanded', 'true');
      const dropdown = page.locator('.ui-more');
      await expect(dropdown).toBeVisible();
      await expect(dropdown.locator(`a[href="${activeHref}"]`)).toHaveCount(0);
      const headerHrefs = await nav.locator('.ui-top-nav__links a').evaluateAll((els) => els.map((el) => el.getAttribute('href')));
      const drawerHrefs = await dropdown.locator('a.ui-more__item').evaluateAll((els) => els.map((el) => el.getAttribute('href')));
      const union = [...headerHrefs, ...drawerHrefs];
      expect(new Set(union).size, '顶栏与「更多」不得重复同一路由').toBe(union.length);
      expect([...new Set(union.map(stripLocale))].sort(), '当前模式的每个章节都必须可达').toEqual([...sections].sort());
      const firstItem = dropdown.locator('.ui-more__item').first();
      await expect(firstItem).toBeVisible();
      await noUnknownOverflow(page);
      await page.keyboard.press('Escape');
      await expect(dropdown).toBeHidden();
      await expect(more).toHaveAttribute('aria-expanded', 'false');
    });
  }

  test('宽桌面：章节项全量平铺，不出现折叠入口', { tag: '@viewport-pinned' }, async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 900 });
    await page.goto('/relic');
    const nav = page.locator('nav.ui-top-nav');
    await expect(nav.locator('a[href="/relic"][aria-current="page"]')).toBeVisible();
    await expect(nav.locator('a[href="/character"]')).toBeVisible();
    await expect(nav.locator('.ui-sidebar-more')).toBeHidden();
    await noUnknownOverflow(page);
  });
});
test.describe('布局验收：跨模式入口文案', () => {

  test('可见标签 = 目的地模式名（常规↔货币战争双向），点击落到对方图签页', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    const swap = page.locator('.ui-sidebar-swap');

    await page.goto('/character');
    await expect(swap.locator('.ui-sidebar-link__label')).toHaveText('货币战争');
    await expect(swap).toHaveAttribute('aria-label', '前往货币战争');
    await expect(swap).toHaveAttribute('title', '前往货币战争');

    await expect(swap).toBeVisible();

    await swap.click();
    await expect(page).toHaveURL(/\/currency\/role$/);

    await expect(swap.locator('.ui-sidebar-link__label')).toHaveText('常规模式');
    await expect(swap).toHaveAttribute('aria-label', '前往常规模式');
    await expect(swap).toHaveAttribute('title', '前往常规模式');

    await swap.click();
    await expect(page).toHaveURL(/\/character$/);
    await noUnknownOverflow(page);
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
    await page.route('**/*CatalogView*', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2500));
      await route.continue();
    });
    await page.goto('/en/character', { waitUntil: 'domcontentloaded' });
    const settings = page.locator('.ui-sidebar-settings');
    await expect(settings).toBeVisible();
    const shellOnly = await page.evaluate(() => {
      const app = document.getElementById('app');
      return !!app && [...app.children].every((el) => el.matches('.ui-site-header, .nk-toast-container'));
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
