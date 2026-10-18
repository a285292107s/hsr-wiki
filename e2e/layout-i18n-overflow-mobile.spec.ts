import { test, expect } from '@playwright/test';
import { collectConsoleIssues } from './helpers';
import {
  RISK_LOCALES, ROUTE_FAMILIES, detailRoutes, prefixOf, scanDefects, settleForMeasurement,
} from './i18n-overflow.shared';

/**
 * 布局验收：多语言长文案下的排版破损 —— 手机断点（390）。
 *
 * 存在理由、P0~P3 处置分级与三类判据见 `i18n-overflow.shared.ts` 文件头（本文件同口径，不重复）。
 * 本文件只承担 **手机断点面（390）**：视口档不同 ⇒ 溢出根因不同（桌面档是译文撑破容器、手机档是
 * 固定卡宽 / 列数、320 档是窄容器里不收缩的短标签），故按档拆文件——`--shard` 只在**文件**边界
 * 生效，不拆就没有并行余地（耗时数字不记：它们必然过期）。
 *
 * 标签：用例内自钉视口 ⇒ 必须静态声明 `@viewport-pinned`（mobile-chromium 以 `grepInvert` 跳过）。
 * 期望值一律**不写死**：路由取迭代范围清单，详情 id 从随站数据派生。
 */
test.describe('布局验收：多语言长文案 · 手机断点（390）', () => {
  /* 窄视口下长文案最先撑破的是网格与标签链。溢出根因（固定卡宽 / 列数）与桌面档不同，故独立成档。

     **每语言一条用例**（而非一条 gross 用例里循环 5 语言）：gross 形态在条数上算 1、在耗时上却是
     5 份，而 `--shard` 按**条数**在文件组之间均分——拆开后才摊得到多台 runner 上。
     判据与取值范围与拆前逐字相同。 */
  for (const code of RISK_LOCALES) {
    test(`${code}：手机档长文案不撑破网格、不产生整页横向溢出`, { tag: '@viewport-pinned' }, async ({ page }) => {
      test.setTimeout(180_000);
      const { assertNoErrors } = collectConsoleIssues(page);
      await page.setViewportSize({ width: 390, height: 844 });

      const base = prefixOf(code);
      // 详情族只抽缺省语言：详情页在窄视口的版式与语言无关（同构骨架），
      // 而 5 语言 × 5 详情族的墙钟不成比例 ⇒ 目录族全语言 + 详情族单语言已覆盖两类根因。
      const routes = [
        ...ROUTE_FAMILIES.map((r) => ({ name: r.name, path: r.path(base) })),
        ...(code === 'cn' ? detailRoutes(base) : []),
      ];
      const failures: string[] = [];
      for (const route of routes) {
        await page.goto(route.path);
        await settleForMeasurement(page);
        const d = await scanDefects(page);
        if (d.pageOverflow > 1) failures.push(`${code}/${route.name}: 整页横向溢出 ${d.pageOverflow}px`);
        for (const x of d.hardClipX) failures.push(`${code}/${route.name} 横向硬裁切 ${x}`);
        for (const x of d.spillX) failures.push(`${code}/${route.name} 横向外溢 ${x}`);
        for (const x of d.navClipped) failures.push(`${code}/${route.name} 导航被截断 ${x}`);
      }
      expect(failures, `${code}：手机档布局破损`).toEqual([]);
      assertNoErrors();
    });
  }
});
