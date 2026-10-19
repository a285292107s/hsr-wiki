import { test, expect } from '@playwright/test';
import { collectConsoleIssues } from './helpers';
import {
  RISK_LOCALES, ROUTE_FAMILIES, detailRoutes, prefixOf, scanDefects, settleForMeasurement,
} from './i18n-overflow.shared';

test.describe('布局验收：多语言长文案 · 桌面档（1280）· cn / de / ru', () => {
  for (const code of RISK_LOCALES.filter((c) => ['cn', 'de', 'ru'].includes(c))) {
    const base = prefixOf(code);

    test(`${code}：迭代全范围长文案无硬裁切 / 外溢 / 截断丢失`, { tag: '@viewport-pinned' }, async ({ page }) => {
      test.setTimeout(180_000);
      const { assertNoErrors } = collectConsoleIssues(page);
      await page.setViewportSize({ width: 1280, height: 900 });

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
        for (const x of d.clippedNoFallback) failures.push(`${route.name} 截断无复原文本 ${x}`);
      }
      expect(failures, `${code}：长文案布局破损`).toEqual([]);
      assertNoErrors();
    });
  }
});
