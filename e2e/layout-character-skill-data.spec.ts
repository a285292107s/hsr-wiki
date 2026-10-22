import { test, expect } from '@playwright/test';
import { collectConsoleIssues, computedNumber, readJson, resolveTokenColor } from './helpers';
import {
  charFamilyIds,
  charSkillNames,
  expectNoSkillsOverflow,
  noUnknownOverflow,
  pseudoBox,
  skillRailX,
  tableBoxWithinCard,
} from './layout.shared';

test.describe('布局验收：角色详情页', () => {

  test('/character/1212：强化技能图标（nanoka 404 名）必须经回退源加载成功，不得出现占位', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/character/1212');
    const icons = page.locator('[data-panel="skills"] .nk-skill__icon');
    await expect(icons.first()).toBeVisible();
    await expect.poll(() => icons.count()).toBeGreaterThanOrEqual(5);
    await expect(icons.first()).toHaveAttribute('data-cdn-fallback', /^https:\/\/.+\/skillicons\//);
    await expect
      .poll(async () => icons.evaluateAll((els) => els.every((el) => (el as HTMLImageElement).complete)), { timeout: 15_000 })
      .toBe(true);
    const states = await icons.evaluateAll((els) => els.map((el) => ({
      complete: (el as HTMLImageElement).complete,
      w: (el as HTMLImageElement).naturalWidth,
      down: (el as HTMLImageElement).hasAttribute('data-cdn-down'),
      ph: (el as HTMLImageElement).hasAttribute('data-cdn-placeholder'),
      src: (el as HTMLImageElement).currentSrc,
    })));
    for (const s of states) {
      expect(s.ph, `占位不应出现（src=${s.src}）`).toBe(false);
      expect(s.w, `图标应加载出位图（complete=${s.complete} src=${s.src}）`).toBeGreaterThan(0);
    }
    assertNoErrors();
  });

  test('/character/1212：三个源皆 404 时显示占位图形（naturalWidth>0）', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.route('**/data/assets/icons/skillicons/**', (route) => route.fulfill({ status: 404, body: '' }));
    await page.route('**/assets/hsr/skillicons/**', (route) => route.fulfill({ status: 404, body: '' }));
    await page.route('**/cdn.jsdelivr.net/**skillicons/**', (route) => route.fulfill({ status: 404, body: '' }));
    await page.goto('/character/1212');
    const icon = page.locator('[data-panel="skills"] .nk-skill__icon').first();
    await expect(icon).toBeVisible();
    await expect.poll(async () => icon.getAttribute('data-cdn-placeholder'), { timeout: 15000 }).toBe('1');
    const state = await icon.evaluate((el) => ({
      src: el.getAttribute('src') || '',
      w: (el as HTMLImageElement).naturalWidth,
      box: el.getBoundingClientRect().width,
      visibility: getComputedStyle(el).visibility,
    }));
    expect(state.src.startsWith('data:image/svg+xml,')).toBe(true);
    expect(state.w).toBeGreaterThan(0);
    expect(state.box).toBeGreaterThan(0);
    expect(state.visibility).toBe('visible');
    assertNoErrors();
  });

  test('/character/1503：展开技能数据表后，竖轨与表盒（含首列）不相交、表盒不出卡片内容区', { tag: ['@visual-detail', '@viewport-pinned'] }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/character/1503');
    const card = page.locator('[data-panel="skills"] > .nk-skill').first();
    const indent = await page
      .locator('.nk-char-page')
      .evaluate((el) => parseFloat(getComputedStyle(el).getPropertyValue('--nk-skill-child-indent')));
    const wrapLeft: Record<string, number> = {};

    for (const target of ['父卡', '首张子卡'] as const) {
      const host = target === '父卡' ? card : card.locator('.nk-skill--child').first();
      const wrap = host.locator(':scope > .nk-skill__body > .nk-skill__table-wrap');
      await wrap.getByRole('button', { name: '技能数据' }).click();
      await expect(wrap.locator('.nk-table tbody tr').first()).toBeVisible();

      const railX = await skillRailX(host);
      const box = await tableBoxWithinCard(host);
      wrapLeft[target] = box.left;
      expect(railX + 8, `${target} 竖轨 x=${railX.toFixed(1)} 必须让开表盒左缘 ${box.left.toFixed(1)}`).toBeLessThan(box.left);
      const firstColLeft = await wrap
        .locator('.nk-table tbody td:first-child')
        .first()
        .evaluate((el) => el.getBoundingClientRect().left);
      expect(railX + 8, `${target} 首列左缘 ${firstColLeft.toFixed(1)}`).toBeLessThan(firstColLeft);
      expect(box.left, `${target} 表盒左缘出内容区`).toBeGreaterThanOrEqual(box.contentLeft - 1);
      expect(box.right, `${target} 表盒右缘出内容区`).toBeLessThanOrEqual(box.contentRight + 1);
    }

    expect(
      Math.abs(wrapLeft['首张子卡'] - wrapLeft['父卡'] - indent),
      `子卡表盒左移量 ${(wrapLeft['首张子卡'] - wrapLeft['父卡']).toFixed(1)}px，indent=${indent}px`,
    ).toBeLessThanOrEqual(1);

    await expectNoSkillsOverflow(page);
    assertNoErrors();
  });
});
