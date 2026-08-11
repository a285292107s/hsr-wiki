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
 * 破图守护：渲染态失败 → HTTP 探测判定真死链。
 *
 * 关键认知（2026-08-11 实证）：character 页真实渲染 301 张 CDN 图，jsDelivr 对
 * 300+ 并发子请求会瞬时限流——好图在页面里也加载失败（naturalWidth=0），重载也
 * 救不回（限流持续）。因此「渲染态」不能区分死链，必须用 HTTP 状态码判定。
 *
 * 限流针对性探测（jsDelivr burst 限流优化）：
 * - 404 → 真死链，直接判（不重试）
 * - 429/5xx/网络错误 → 限流或瞬态，重试 1 次（500ms 退避）后仍失败才判死链
 * - 并发 12（HEAD 轻请求），平衡收敛速度与再次触发限流的风险
 */
async function assertImagesLoaded(page: Page) {
  // 短等待首屏图有机会加载（不长时间等：301 张图全量等待会耗尽测试超时）
  await page.waitForTimeout(2_000);
  const broken = await page.evaluate(() =>
    [...document.images].filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.src),
  );
  if (broken.length === 0) return;
  const CONCURRENCY = 12;
  /** 探测单个 URL：404=真死链；限流/瞬态错误重试 1 次；返回 true=可达，false=死链 */
  const probe = async (url: string): Promise<boolean> => {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const r = await page.request.head(url, { timeout: 10_000 }).catch(() =>
          page.request.get(url, { timeout: 10_000 }),
        );
        if (r.ok()) return true;
        if (r.status() === 404) return false; // 真死链，无需重试
        // 429/5xx/其他：限流嫌疑，落入下方退避重试
      } catch {
        // 网络错误：限流嫌疑，落入下方退避重试
      }
      if (attempt === 0) await page.waitForTimeout(500);
    }
    return false;
  };
  const dead: string[] = [];
  for (let i = 0; i < broken.length; i += CONCURRENCY) {
    const verdicts = await Promise.all(
      broken.slice(i, i + CONCURRENCY).map(async (url) => {
        const ok = await probe(url);
        return ok ? null : url;
      }),
    );
    dead.push(...verdicts.filter((v): v is string => v !== null));
  }
  expect(dead, `CDN 图片死链（限流重试后仍不可达）：\n${dead.join('\n')}`).toEqual([]);
}

test.describe('视觉基线', () => {
  test('首页 /', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.nk-home-hero__title')).toBeVisible();
    await assertImagesLoaded(page);
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
    await assertImagesLoaded(page);
    await expect(page).toHaveScreenshot('character.png', { maxDiffPixelRatio: 0.05 });
  });

  test('终局内容 /endgame', async ({ page }) => {
    await page.goto('/endgame');
    await waitForCatalogCards(page);
    await assertImagesLoaded(page);
    await expect(page).toHaveScreenshot('endgame.png', { maxDiffPixelRatio: 0.05 });
  });

  test('货币战争 Hub /currency', async ({ page }) => {
    await page.goto('/currency');
    await expect(page.locator('.nk-cwhub-hero__title')).toBeVisible();
    await assertImagesLoaded(page);
    // ticker 是无限动画，动画冻结后帧稳定
    await expect(page).toHaveScreenshot('currency.png', { maxDiffPixelRatio: 0.05, animations: 'disabled' });
  });
});
