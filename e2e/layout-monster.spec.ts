import { test, expect } from '@playwright/test';
import { collectConsoleIssues } from './helpers';

/**
 * 布局验收：敌方详情页（`/monster/<id>`）。
 *
 * 域独立成文件：本页此前没有任何 layout 分域文件——它的骨架几何由探针背书（第 11 轮），
 * 但「加载态与就绪态不产生位移」这条**契约**一直没人守。第 19 轮抓到真缺陷（见下），故立此文件。
 *
 * 用例只锁一件事：**hero 高度在立绘到达前后不得变化**。
 *   缺陷原型：`.nk-mob-hero__figure` 桌面档只有 `min-height: 300px`，立绘用 `max-width: 88%`
 *   在**未解码时不产生盒子**（高 0）⇒ hero 首帧 301px，立绘到达后内容高 357px ⇒ hero 变 358px，
 *   把下方 `.nk-panels` 整体推下 57px。实测该页 CLS 0.0288（全 632 个敌方详情页同构）。
 *   判据写法与像素/文案无关：只断言「采样窗口内 hero 高度恒定」——立绘尺寸、字体度量变化都不会让它变红，
 *   而一旦有人把 `aspect-ratio` 摘掉就会立刻变红。
 */
const MONSTER_ID = '1002011';
const IMG_DELAY_MS = 2500;

test.describe('布局验收：敌方详情页', () => {
  test(`/monster/${MONSTER_ID}：立绘延迟到达时 hero 高度不得变化`, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);

    // 采样器要在页面脚本之前装好；只记录几何，不做任何样式注入
    await page.addInitScript(() => {
      const w = window as unknown as { __heroSamples: Array<{ h: number; fig: number; loaded: boolean }> };
      w.__heroSamples = [];
      setInterval(() => {
        const hero = document.querySelector('.nk-mob-hero');
        const figure = document.querySelector('.nk-mob-hero__figure');
        const img = document.querySelector('.nk-mob-hero__figure img');
        if (!hero || !figure) return;
        w.__heroSamples.push({
          h: Math.round(hero.getBoundingClientRect().height),
          fig: Math.round(figure.getBoundingClientRect().height),
          loaded: Boolean(img && img.complete && img.naturalWidth > 0),
        });
      }, 50);
    });
    // 延迟而非中断：中断会触发 `<img onerror>` 换备用源，量到的就不是「立绘未到达」了
    await page.route(/\.(webp|png|jpe?g|avif)(\?|$)/, async (route) => {
      await new Promise((r) => setTimeout(r, IMG_DELAY_MS));
      await route.continue().catch(() => {});
    });

    await page.goto(`/monster/${MONSTER_ID}`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.nk-mob-hero')).toBeVisible();
    await page.waitForTimeout(IMG_DELAY_MS + 1800);

    const samples = await page.evaluate(
      () => (window as unknown as { __heroSamples: Array<{ h: number; fig: number; loaded: boolean }> }).__heroSamples,
    );
    const heights = samples.map((s) => s.h);
    const figures = samples.map((s) => s.fig);
    expect(heights.length, '应采到 hero 高度样本').toBeGreaterThan(5);
    expect(samples.some((s) => s.loaded), '立绘最终应加载完成（否则断言会变成空转）').toBe(true);

    // ① 立绘方框必须恒定——这正是缺陷原型破掉的性质（桌面档 300 → 357）
    expect(
      Math.max(...figures) - Math.min(...figures),
      '立绘方框高度在立绘到达前后必须恒定（`aspect-ratio: 1` 提前给盒子）',
    ).toBe(0);
    // ② hero 总高只允许 ≤2px 的内容级收尾：手机档实测 +2px，来自信息列的中文行盒随字体落定
    //    （与立绘无关；缺陷原型是桌面档 +57px，量级差 28 倍，阈值仍能区分二者）
    expect(
      Math.max(...heights) - Math.min(...heights),
      'hero 总高变化不得超过内容级收尾（≤2px）',
    ).toBeLessThanOrEqual(2);

    assertNoErrors();
  });
});
