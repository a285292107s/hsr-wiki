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
 * 注意：枢纽页（/ 与 /currency）自 ADR 0018 起为静态品牌带 + 板块索引，不含 WebGL / 视频帧，
 * 基线天然稳定，不再需要冻结动画或隐藏媒体层。旧的 `.nk-home-hero__spine` /
 * `.nk-cwhub-hero__video` 冻结块已随媒体层删除——那两个元素已不存在，保留会让 evaluate 直接失败。
 */

/**
 * 截图前等待图片加载（截图稳定，不断言）。
 *
 * 死链检查已从 e2e 移除（重构决策）：死链是静态事实（URL 404），每次测试
 * 验证低性价比，改为独立低频审计 tools/dead-links.test.ts（data-sync.yml 数据变更时触发）。
 * 此处仅保留等待逻辑：像素基线负责渲染完整性兜底。
 */
async function waitImages(page: Page) {
  // 只等视口内图片加载完成：toHaveScreenshot 截视口，屏外 loading="lazy" 图不会触发加载，
  // 全量等待（imgs.every）必 20s 超时并把 80 张屏外图误报为「jsDelivr burst 限流」（环境噪声）。
  // 口径与截图范围一致——视口内图加载完毕即截图稳定（诊断：catch 分支只列视口内未就绪图）。
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
      // 诊断信息：列出视口内未就绪图片，一眼区分 jsDelivr burst 限流（与 curl 独立连接对比，
      // 处置见 docs/agents/architecture.md「已知环境坑位」）与真死链（归 tools/dead-links.test.ts 与调试台「死链审核」面板审计）。
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
  await page.waitForTimeout(500);
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
