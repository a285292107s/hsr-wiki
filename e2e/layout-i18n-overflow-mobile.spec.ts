import { test, expect } from '@playwright/test';
import { collectConsoleIssues } from './helpers';
import {
  RISK_LOCALES, ROUTE_FAMILIES, detailRoutes, prefixOf, scanDefects, settleForMeasurement,
} from './i18n-overflow.shared';

test.describe('布局验收：多语言长文案 · 手机断点（390）', () => {
  for (const code of RISK_LOCALES) {
    test(`${code}：手机档长文案不撑破网格、不产生整页横向溢出`, { tag: '@viewport-pinned' }, async ({ page }) => {
      test.setTimeout(180_000);
      const { assertNoErrors } = collectConsoleIssues(page);
      await page.setViewportSize({ width: 390, height: 844 });

      const base = prefixOf(code);
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
