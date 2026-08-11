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
 * 关键认知（2026-08-11 实证）：
 * - character 页真实渲染 301 张 CDN 图，jsDelivr 对 300+ 并发子请求会瞬时限流——
 *   好图在页面里也加载失败（naturalWidth=0），浏览器不自动重试，「渲染态」不可靠。
 * - 探测请求（HEAD）在限流窗口/数据中心 IP 下同样会被拒（CI 实证：img 加载成功、
 *   像素基线通过，但 HEAD 探测失败）——**探测失败 ≠ 死链**。
 *
 * 因此探测只认一个判据：HTTP 404 = 真死链；429/5xx/网络错误 = 环境噪音，放行
 * （像素基线已隐式覆盖图片渲染完整性）。不重试：限流窗口内重试无意义且拖慢测试。
 */
async function assertImagesLoaded(page: Page) {
  // CI（GitHub Actions 数据中心 IP）下 jsDelivr 对探测请求不可靠（实证见上），
  // 且像素基线已覆盖渲染完整性，故 CI 跳过探测；本地（代理环境）保留死链守护。
  if (process.env.CI) return;
  // 短等待首屏图有机会加载（不长时间等：301 张图全量等待会耗尽测试超时）
  await page.waitForTimeout(2_000);
  const broken = await page.evaluate(() =>
    [...document.images].filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.src),
  );
  if (broken.length === 0) return;
  const CONCURRENCY = 12;
  /** 仅 404 判定为死链；限流/网络错误放行（环境噪音，非死链证据） */
  const isDead = async (url: string): Promise<boolean> => {
    try {
      const r = await page.request.head(url, { timeout: 5_000 }).catch(() =>
        page.request.get(url, { timeout: 5_000 }),
      );
      return r.status() === 404;
    } catch {
      return false;
    }
  };
  const dead: string[] = [];
  for (let i = 0; i < broken.length; i += CONCURRENCY) {
    const verdicts = await Promise.all(
      broken.slice(i, i + CONCURRENCY).map(async (url) => {
        const bad = await isDead(url);
        return bad ? url : null;
      }),
    );
    dead.push(...verdicts.filter((v): v is string => v !== null));
  }
  expect(dead, `CDN 图片死链（HTTP 404 确认）：\n${dead.join('\n')}`).toEqual([]);
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
