import { test, expect, type Page } from '@playwright/test';
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

const DETAIL_ROUTES = ROUTES.filter((r) => !['/', '/settings'].includes(r.path));
const SHELL_ROUTES = ROUTES.filter((r) => ['/', '/settings'].includes(r.path));

const SOFT_ASSERT_TIMEOUT = 8_000;

async function guardRoute(page: Page, route: GuardRoute): Promise<string[]> {
  const failures: string[] = [];
  const { issues, assertNoErrors } = collectConsoleIssues(page);
  const record = (label: string, err: unknown): void => {
    failures.push(`${label}: ${String((err as Error)?.message ?? err).split('\n')[0]}`);
  };

  try {
    if (route.path === '/currency/role/1001') {
      await page.route('**/data/cn/currency/prop_icons.json', (r) =>
        r.fulfill({
          contentType: 'application/json',
          body: readFileSync('public/data/cn/currency/prop_icons.json', 'utf8'),
        }),
      );
    }

    await page.goto(route.path, { timeout: 20_000 });
    if (route.catalog) await waitForCatalogCards(page);

    for (const selector of route.roots) {
      await expect
        .soft(page.locator(selector).first(), `${route.path} 关键容器 ${selector} 应可达`)
        .toBeVisible({ timeout: SOFT_ASSERT_TIMEOUT });
    }
    await expect.soft(page.locator('h1'), `${route.path} 应有且仅有一个 h1`).toHaveCount(1);
    await expect.soft(page.locator('h1').first(), `${route.path} 的 h1 必须可见`).toBeVisible({ timeout: SOFT_ASSERT_TIMEOUT });
    await expect.soft(page.locator('.nk-error-state'), `${route.path} 不得出现错误态`).toHaveCount(0);
    await expectNoUnknownOverflow(page);
    assertNoErrors();
  } catch (err) {
    record(route.path, err);
  }

  const hard = issues.pageErrors.filter(
    (e) => !e.includes('ResizeObserver loop') && !e.includes('ResizeObserver loop completed'),
  );
  if (hard.length) failures.push(`${route.path}: 未捕获 JS 异常 ${hard.join(' | ')}`);
  return failures;
}

test.describe('不变量守卫（视觉改动不得让其变红）', () => {
  // 16 条不变量（15 条路由 + /settings 外壳断言）一条不减，只是收成 2 条 test：白屏 / 未捕获异常 /
  // 未知横向溢出 / 关键容器可达仍逐路执行；聚合只为把「每条都重启页面 ✕ 15」的重复开销压下来
  // （移动 project 也只再跑 2 条）。**逐路用 soft 断言 + try/catch 收口，一条路由坏掉不会挡住后面
  // 14 条**——否则「一次看全所有坏页」的能力会被聚合吃掉，而这正是重构期最需要的信息。
  test('不变量：全部页面可达 / 无未捕获 JS 异常 / 无未知横向溢出 / 关键容器可达', async ({ page }) => {
    test.setTimeout(180_000);
    const failures: string[] = [];
    for (const route of DETAIL_ROUTES) failures.push(...(await guardRoute(page, route)));
    expect.soft(failures, '以下路由的不变量被破坏').toEqual([]);
  });

  test('不变量：应用外壳未退化（/ 与 /settings 的调试台 / 设置入口都在）', async ({ page }) => {
    test.setTimeout(90_000);
    const failures: string[] = [];
    for (const route of SHELL_ROUTES) failures.push(...(await guardRoute(page, route)));

    try {
      await page.goto('/settings', { timeout: 20_000 });
      await expect.soft(page.locator('.ui-sidebar')).toBeVisible({ timeout: SOFT_ASSERT_TIMEOUT });
      await expect.soft(page.locator('a.ui-sidebar-settings')).toHaveCount(1);
    } catch (err) {
      failures.push(`/settings: ${String((err as Error)?.message ?? err).split('\n')[0]}`);
    }
    expect.soft(failures, '应用外壳的不变量被破坏').toEqual([]);
  });
});
