import { test, expect, type Page } from '@playwright/test';
import { waitForCatalogCards, waitForSettled } from './helpers';

// 目录页含 80+ 张 CDN 图 + 破图重试预算（25s），默认 30s 测试超时不够
test.setTimeout(120_000);

/**
 * 视觉基线（L4 像素回归，本地 Percy）
 *
 * 4 个关键页面：首页 / 角色图鉴 / 终局 / 货币战争 Hub。
 * 基线截图提交 git（e2e/snapshots/），变更后 `pnpm exec playwright test -u` 刷新。
 * maxDiffPixelRatio 容差吸收 CDN 图片加载时序抖动。
 */

/**
 * 截图前等待图片加载（截图稳定，不断言）。
 * 像素基线负责渲染完整性兜底；死链是静态事实，归独立低频审计 tools/dead-links.test.ts。
 */
async function waitImages(page: Page) {
  // 只等视口内图片加载完成：toHaveScreenshot 截视口，屏外 loading="lazy" 图不会触发加载，
  // 全量等待（imgs.every）必 20s 超时并把屏外图误报为「jsDelivr burst 限流」。
  await page
    .waitForFunction(() => {
      const inView = (el: HTMLImageElement): boolean => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth;
      };
      const imgs = [...document.images].filter(inView);
      return imgs.every((i) => i.complete && i.naturalWidth > 0);
    }, undefined, { timeout: 20_000 })
    .catch(async () => {
      // 超时不失败（环境性），但显式留下记录——基线可能包含未加载图片，人工可见。
      // 诊断信息列出视口内未就绪图片，用于区分 jsDelivr burst 限流与真死链。
      const pending = await page.evaluate(() => {
        const inView = (el: HTMLImageElement): boolean => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.height > 0 && r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth;
        };
        return [...document.images]
          .filter((i) => inView(i) && (!i.complete || i.naturalWidth === 0))
          .map((i) => i.currentSrc || i.src);
      });
      console.warn(
        `[visual] 视口内图片加载超时（20s），${pending.length} 张未就绪（疑似 jsDelivr burst 限流）；前 5 张：${pending.slice(0, 5).join(' , ')}`,
      );
    });
  await waitForSettled(page);
}

test.describe('视觉基线', () => {
  test('首页 /', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.nk-hub-brand__title')).toBeVisible();
    await waitImages(page);
    await expect(page).toHaveScreenshot('home.png', { maxDiffPixelRatio: 0.05, animations: 'disabled' });
  });

  test('角色图鉴 /character', async ({ page }) => {
    await page.goto('/character');
    await waitForCatalogCards(page);
    await waitImages(page);
    await expect(page).toHaveScreenshot('character.png', { maxDiffPixelRatio: 0.05 });
  });

  test('终局内容 /endgame', async ({ page }) => {
    await page.goto('/endgame');
    await waitForCatalogCards(page);
    await waitImages(page);
    await expect(page).toHaveScreenshot('endgame.png', { maxDiffPixelRatio: 0.05 });
  });

  test('货币战争 Hub /currency', async ({ page }) => {
    await page.goto('/currency');
    await expect(page.locator('.nk-hub-brand__title')).toBeVisible();
    await waitImages(page);
    await expect(page).toHaveScreenshot('currency.png', { maxDiffPixelRatio: 0.05, animations: 'disabled' });
  });
});
