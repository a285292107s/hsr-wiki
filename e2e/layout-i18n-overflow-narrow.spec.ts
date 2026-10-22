import { test, expect } from '@playwright/test';
import { collectConsoleIssues } from './helpers';
import {
  RISK_LOCALES, detailRoutes, prefixOf, scanDefects, settleForMeasurement,
} from './i18n-overflow.shared';

test.describe('布局验收：多语言长文案 · 最窄档（320）', () => {
  test('最窄档（320）：长文案不撑破容器亦不被祖先静默裁掉', { tag: ['@visual-detail', '@viewport-pinned'] }, async ({ page }) => {
    test.setTimeout(180_000);
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 320, height: 720 });

    const failures: string[] = [];
    const routes = detailRoutes('');
    for (const code of RISK_LOCALES) {
      const base = prefixOf(code);
      for (const route of routes) {
        await page.goto(base + route.path);
        await settleForMeasurement(page);
        const d = await scanDefects(page);
        if (d.pageOverflow > 1) failures.push(`${code}/${route.name}: 整页横向溢出 ${d.pageOverflow}px`);
        for (const x of d.hardClipX) failures.push(`${code}/${route.name} 横向硬裁切 ${x}`);
        for (const x of d.spillX) failures.push(`${code}/${route.name} 横向外溢 ${x}`);
      }
    }
    expect(failures, '320 档布局破损').toEqual([]);
    assertNoErrors();
  });
});
