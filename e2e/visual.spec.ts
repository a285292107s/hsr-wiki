import { test, expect, type Page } from '@playwright/test';
import { waitForCatalogCards, waitForSettled } from './helpers';

test.setTimeout(120_000);

async function waitImages(page: Page) {
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
    await expect(page.locator('.nk-hub-masthead__title')).toBeVisible();
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
    await expect(page.locator('.nk-hub-masthead__title')).toBeVisible();
    await waitImages(page);
    await expect(page).toHaveScreenshot('currency.png', { maxDiffPixelRatio: 0.05, animations: 'disabled' });
  });
});
