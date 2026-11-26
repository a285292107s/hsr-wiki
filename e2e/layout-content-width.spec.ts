import { test, expect } from '@playwright/test';
import { collectConsoleIssues } from './helpers';

const CONTENT_MAX = 1280;
const FAMILIES = [
  { path: '/', host: '#nk-home-app', box: '.nk-intake' },
  { path: '/currency', host: '#nk-cwhub-app', box: '.nk-cwsc' },
  { path: '/character', host: '#nk-catalog-app', box: '#nk-catalog-app .nk-idx-grid' },
];

test.describe('版心上限', () => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 1920, height: 1080 }]) {
    for (const family of FAMILIES) {
      test(`${viewport.width}px：${family.path} 版心不超过 ${CONTENT_MAX}px 且左右留白对称`, { tag: '@viewport-pinned' }, async ({ page }) => {
        const { assertNoErrors } = collectConsoleIssues(page);
        await page.setViewportSize(viewport);
        await page.goto(family.path);
        const box = page.locator(family.box).first();
        await expect(box).toBeVisible({ timeout: 15_000 });

        const geometry = await box.evaluate((el, hostSelector) => {
          const rect = el.getBoundingClientRect();
          const host = document.querySelector(hostSelector) as HTMLElement;
          const hostStyle = getComputedStyle(host);
          const contentLeft = host.getBoundingClientRect().left
            + host.clientLeft
            + parseFloat(hostStyle.paddingLeft);
          const contentWidth = host.clientWidth
            - parseFloat(hostStyle.paddingLeft)
            - parseFloat(hostStyle.paddingRight);
          const offset = Math.round(rect.left - contentLeft);
          return {
            width: Math.round(rect.width),
            offset,
            slack: Math.round(contentWidth - rect.width - offset),
          };
        }, family.host);

        expect(geometry.width, `${family.path}：版心宽 ${geometry.width}px`).toBeLessThanOrEqual(CONTENT_MAX + 1);
        expect(
          Math.abs(geometry.offset - geometry.slack),
          `${family.path}：左留白 ${geometry.offset}px / 右留白 ${geometry.slack}px`,
        ).toBeLessThanOrEqual(1);

        assertNoErrors();
      });
    }
  }
});
