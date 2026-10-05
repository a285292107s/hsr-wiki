import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { collectConsoleIssues, expectNoUnknownOverflow, waitForCatalogCards } from './helpers';

/**
 * 不变量层（guards）：本文件的用例**永不因视觉/数值改动而改**。
 *
 * 判据只有三类，全部与具体像素、文案、块序无关：
 *   1) 无未捕获 JS 异常（pageerror 硬断言；console error 由 helpers 记录，环境性噪声不误杀）；
 *   2) 无**未知**横向溢出（已登记缺陷由 helpers 的 KNOWN_OVERFLOWS 过滤并告警，新溢出必红）；
 *   3) 关键容器可达 且 未落进共享错误态（`.nk-error-state` 是加载失败的唯一出口）。
 *
 * 分层约定：语义契约（该显示什么、顺序、计数）与数值规格（字号序、令牌派生）分别在
 * `layout-*.spec.ts` 各域文件；**这里只放「破了就是页面坏了」的底线**。
 * 用例标题内嵌路由，便于 `--grep "/endgame/boss/3020"` 只跑受影响页面。
 *
 * 双 project 覆盖：本文件不打 `@viewport-pinned`（用例不钉视口），故 desktop 与
 * `mobile-chromium`（Pixel 7 / isMobile）各跑一遍——手机断点的溢出缺陷只能在这里暴露。
 */

interface GuardRoute {
  /** 路由（同时作为用例标题里的 grep 关键词） */
  path: string;
  /** 关键容器：页面主内容根，必须是结构性选择器（不得含数值/文案） */
  roots: string[];
  /** 目录页需等卡片渲染完成，否则关键容器命中 skeleton */
  catalog?: boolean;
}

const ROUTES: GuardRoute[] = [
  { path: '/', roots: ['#nk-home-app', '.nk-hub-brand__title', '.nk-hub-release__title'] },
  { path: '/character', roots: ['#nk-catalog-app', '.nk-cat-toolbar'], catalog: true },
  { path: '/character/1001', roots: ['.nk-hero--char', '.nk-hero__archive'] },
  { path: '/endgame', roots: ['#nk-catalog-app', '.nk-cat-toolbar'], catalog: true },
  { path: '/currency', roots: ['.nk-hub-brand__title', '.nk-hub-release__title'] },
  { path: '/currency/role/1001', roots: ['.nk-crole-hero__name', '.nk-crole-bar'] },
  { path: '/settings', roots: ['#accent-title', '.ui-sidebar'] },
  // 末日幻影默认停在星启模式（用户裁决）：关键容器取两条分支共有的看板，不取只在层分支下存在的 `.nk-egd-lvl`
  { path: '/endgame/boss/3020', roots: ['.nk-egd-tabs', '.nk-egd-board'] },
  // 异相仲裁默认停在首个关卡 tab（无星启）：关键容器取子 tab 行与单关面板（ADR 0043）
  { path: '/endgame/peak/9', roots: ['#egd-level-tabs', '.nk-egd-peak'] },
];

test.describe('不变量守卫（视觉改动不得让其变红）', () => {
  for (const route of ROUTES) {
    test(`不变量 ${route.path}：无未捕获 JS 异常 / 无未知横向溢出 / 关键容器可达`, async ({ page }) => {
      const { assertNoErrors } = collectConsoleIssues(page);
      // dev public 索引缓存（rolldown-vite 运行期新增文件未入索引）会让 prop_icons.json 404 →
      // 直接注入磁盘内容，避免把环境问题计成页面缺陷
      if (route.path === '/currency/role/1001') {
        await page.route('**/data/cn/currency/prop_icons.json', (r) =>
          r.fulfill({
            contentType: 'application/json',
            body: readFileSync('public/data/cn/currency/prop_icons.json', 'utf8'),
          }),
        );
      }

      await page.goto(route.path);
      if (route.catalog) await waitForCatalogCards(page);

      for (const selector of route.roots) {
        await expect(page.locator(selector).first(), `${route.path} 关键容器 ${selector} 应可达`).toBeVisible();
      }
      // 加载失败是硬性不变量：错误态一旦出现，下面所有结构断言都会退化成「结构不存在」
      await expect(page.locator('.nk-error-state')).toHaveCount(0);
      await expectNoUnknownOverflow(page);
      assertNoErrors();
    });
  }

  test('不变量 /settings：调试台 dev 入口与设置入口都在（应用外壳未退化）', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/settings');
    await expect(page.locator('.ui-sidebar')).toBeVisible();
    await expect(page.locator('a.ui-sidebar-settings')).toHaveCount(1);
    assertNoErrors();
  });
});
