import { test, expect } from '@playwright/test';
import { collectConsoleIssues } from './helpers';
import {
  RISK_LOCALES, ROUTE_FAMILIES, detailRoutes, prefixOf, scanDefects, settleForMeasurement,
} from './i18n-overflow.shared';

/**
 * 布局验收：多语言长文案下的排版破损 —— 桌面档（1280）。
 *
 * 存在理由、P0~P3 处置分级与三类判据见 `i18n-overflow.shared.ts` 文件头（本文件同口径，不重复）。
 * 本文件只承担 **桌面档**：视口档不同 ⇒ 溢出根因不同（桌面档是译文撑破容器、手机档是固定卡宽 /
 * 列数、320 档是窄容器里不收缩的短标签），故按档拆文件——`--shard` 只在**文件**边界生效，
 * 不拆就没有并行余地（耗时数字不记：它们必然过期）。
 *
 * 标签：用例内自钉视口 ⇒ 必须静态声明 `@viewport-pinned`（mobile-chromium 以 `grepInvert` 跳过）。
 * 期望值一律**不写死**：路由取迭代范围清单，详情 id 从随站数据派生。
 */

/**
 * 本文件承担 **桌面档 · cn / de / ru**。
 *
 * 这三条是译文长度与断行规则差异最大的一组（cn 对照组 + de 复合词 + ru 西里尔长词）。
 */
test.describe('布局验收：多语言长文案 · 桌面档（1280）· cn / de / ru', () => {
  /* 桌面档每条语言**只加载每个路由一次**、在一趟里取全部判据。
     理由：判据彼此独立但取样成本相同（都要等就绪门 + 过渡结束），拆成多条会让
     同一路由被重复加载 2~3 遍（5 语言 × 15 路由 × 3 遍 = 225 次导航，墙钟不成比例）。
     失败归因仍充分——每条失败串都带「路由名 + 判据 + 选择器 + 实测数字」。 */
  for (const code of RISK_LOCALES.filter((c) => ['cn', 'de', 'ru'].includes(c))) {
    const base = prefixOf(code);

    test(`${code}：迭代全范围长文案无硬裁切 / 外溢 / 截断丢失`, { tag: '@viewport-pinned' }, async ({ page }) => {
      test.setTimeout(180_000);
      const { assertNoErrors } = collectConsoleIssues(page);
      await page.setViewportSize({ width: 1280, height: 900 });

      /* 目录族 + 枢纽页：长文案最密集（卡片主名称、标签链、计数），且**中文也命中**若干条
         ⇒ 这一批是「既有布局缺陷」而非纯译文问题，改前就有、改后必须为 0。 */
      const routes = [
        ...ROUTE_FAMILIES.map((r) => ({ name: r.name, path: r.path(base) })),
        ...detailRoutes(base),
      ];

      const failures: string[] = [];
      for (const route of routes) {
        await page.goto(route.path);
        await settleForMeasurement(page);
        const d = await scanDefects(page);
        if (d.pageOverflow > 1) failures.push(`${route.name}: 整页横向溢出 ${d.pageOverflow}px`);
        for (const x of d.hardClipX) failures.push(`${route.name} 横向硬裁切 ${x}`);
        for (const x of d.spillX) failures.push(`${route.name} 横向外溢 ${x}`);
        for (const x of d.hardClipY) failures.push(`${route.name} 纵向硬裁切 ${x}`);
        for (const x of d.navClipped) failures.push(`${route.name} 导航被截断 ${x}`);
        // ③ 截断必须有复原手段：触屏没有 hover，否则那段字永久读不到
        for (const x of d.clippedNoFallback) failures.push(`${route.name} 截断无复原文本 ${x}`);
      }
      expect(failures, `${code}：长文案布局破损`).toEqual([]);
      assertNoErrors();
    });
  }
});
