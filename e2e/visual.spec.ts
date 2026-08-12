import { test, expect, type Page } from '@playwright/test';
import { waitForCatalogCards } from './helpers';

// 目录页含 80+ 张 CDN 图 + 破图重试预算（25s），默认 30s 测试超时不够
test.setTimeout(120_000);

/**
 * 视觉基线（L4 像素回归，本地 Percy）
 *
 * 4 个关键页面：首页 / 角色图鉴 / 终局 / 货币战争 Hub。
 * 基线截图提交 git（e2e/snapshots/），变更后 `pnpm exec playwright test -u` 刷新。
 * maxDiffPixelRatio 容差吸收 CDN 图片加载时序抖动（网络环境差异，非布局回归）。
 *
 * 注意：Spine 首页 hero 含 WebGL 动画，基线对动画帧敏感——截图前冻结动画
 * （spine 画布由 .nk-home-hero__spine 包裹，等待 spineReady 类出现后稳定帧）。
 */

/**
 * 截图前等待图片加载（截图稳定，不断言）。
 *
 * 死链检查已从 e2e 移除（2026-08-12 重构）：死链是静态事实（URL 404），每次测试
 * 验证低性价比，改为独立低频审计 tools/dead-links.test.ts（data-sync.yml 数据变更时触发）。
 * 此处仅保留等待逻辑：像素基线负责渲染完整性兜底。
 */
async function waitImages(page: Page) {
  // 等待所有 img 完成加载（网络慢时给足时间，超时静默——不因 CDN 时序抖动误报）
  await page
    .waitForFunction(() => {
      const imgs = [...document.images];
      return imgs.length > 0 && imgs.every((i) => i.complete && i.naturalWidth > 0);
    }, undefined, { timeout: 20_000 })
    .catch(() => {
      // 超时不失败（环境性），但显式留下记录——基线可能包含未加载图片，人工可见
      console.warn('[visual] 图片加载超时（20s），像素基线可能包含未就绪图片');
    });
  await page.waitForTimeout(500);
}

test.describe('视觉基线', () => {
  test('首页 /', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.nk-home-hero__title')).toBeVisible();
    await waitImages(page);
    // Spine 为 WebGL rAF 动画（CSS animations 禁用无效），且已有 debug/spine-audit 专用引擎
    // 负责其渲染验收——像素基线将其隐藏，避免动画帧导致基线不稳定
    await page.locator('.nk-home-hero__spine').evaluate((el) => {
      (el as HTMLElement).style.display = 'none';
    });
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
    await expect(page.locator('.nk-cwhub-hero__title')).toBeVisible();
    await waitImages(page);
    // ticker 是无限动画，动画冻结后帧稳定
    await expect(page).toHaveScreenshot('currency.png', { maxDiffPixelRatio: 0.05, animations: 'disabled' });
  });
});
