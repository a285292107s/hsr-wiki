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

  test('/lightcone/首个 id：光锥技能卡不受技能族改动波及（标题行图标在，无图标列）', { tag: '@viewport-independent' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    const cones = readJson<Record<string, { id: number }>>('public/data/cn/light_cones.json');
    const lcId = Object.values(cones)[0].id;
    await page.goto(`/lightcone/${lcId}`);
    const icon = page.locator('.nk-lc-skill .nk-skill__title-row .nk-skill__icon');
    await expect(icon).toHaveCount(1);
    await expect(icon).toBeVisible();
    await expect(page.locator('.nk-skill__rail')).toHaveCount(0);
    assertNoErrors();
  });

  test('/lightcone：hero 属性三项同行成列，窄屏回落两列且 DEF 满行，无溢出', { tag: ['@visual-detail', '@viewport-pinned'] }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    const cones = readJson<Record<string, { id: number }>>('public/data/cn/light_cones.json');
    const lcId = Object.values(cones)[0].id;
    const grid = page.locator('.nk-hero__stats--lc');
    const stats = grid.locator('> .nk-hero__stat');
    const boxes = () =>
      stats.evaluateAll((els) =>
        els.map((el) => {
          const r = el.getBoundingClientRect();
          return { top: Math.round(r.top), left: Math.round(r.left), width: Math.round(r.width) };
        }),
      );
    const spill = () => grid.evaluate((el) => el.scrollWidth - el.clientWidth);

    for (const width of [1440, 375]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/lightcone/${lcId}`);
      await expect(stats).toHaveCount(3);
      const b = await boxes();
      expect(new Set(b.map((x) => x.top)).size, `${width}px：三项须同一行`).toBe(1);
      expect(b[1].left, `${width}px：ATK 须在 HP 右侧`).toBeGreaterThan(b[0].left);
      expect(b[2].left, `${width}px：DEF 须在 ATK 右侧`).toBeGreaterThan(b[1].left);
      expect(await spill(), `${width}px：属性网格不得横向溢出`).toBeLessThanOrEqual(1);
      await noUnknownOverflow(page);
    }

    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto(`/lightcone/${lcId}`);
    await expect(stats).toHaveCount(3);
    const b = await boxes();
    expect(b[0].top, '320px：HP 与 ATK 同行').toBe(b[1].top);
    expect(b[2].top, '320px：DEF 应落到第二行').toBeGreaterThan(b[0].top);
    expect(b[2].width, '320px：DEF 应满行').toBeGreaterThan((await grid.evaluate((el) => el.clientWidth)) * 0.8);
    expect(await spill(), '320px：属性网格不得横向溢出').toBeLessThanOrEqual(1);
    assertNoErrors();
  });

  test('/lightcone：hero 视觉层与信息面板不挂浅渐变覆层（等值线来源）', { tag: ['@visual-detail', '@viewport-pinned'] }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    const cones = readJson<Record<string, { id: number }>>('public/data/cn/light_cones.json');
    const lcId = Object.values(cones)[0].id;
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/lightcone/${lcId}`);

    const visual = page.locator('.nk-hero--lc .nk-hero__visual');
    await expect(visual).toHaveCount(1);
    expect(await visual.evaluate((el) => getComputedStyle(el).boxShadow), '视觉区不得有 inset 暗角').toBe('none');
    expect(
      await visual.evaluate((el) => getComputedStyle(el, '::before').backgroundImage),
      '稀有度晕染层不得留渐变',
    ).toBe('none');

    const panel = await page.locator('.nk-hero--lc .nk-hero__panel').evaluate((el) => {
      const cs = getComputedStyle(el);
      return { image: cs.backgroundImage, color: cs.backgroundColor };
    });
    expect(panel.image, '信息面板底必须是纯色，不得是横向渐变').toBe('none');
    expect(panel.color, '纯色底须给出实际颜色而非透明').not.toBe('rgba(0, 0, 0, 0)');
    assertNoErrors();
  });

  test('/lightcone：适配角色区块逐条对应反向索引（链接 / REC. 顺位 / 无溢出）', { tag: ['@visual-detail', '@viewport-pinned'] }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    const cones = readJson<{ id: number }[]>('public/data/cn/light_cones.json');
    let target: { id: number; chars: { id: number; rank: number }[] } | null = null;
    for (const c of cones) {
      const chars = readJson<{ recommend_chars?: { id: number; rank: number }[] }>(
        `public/data/cn/light_cones/${c.id}.json`,
      ).recommend_chars || [];
      if (chars.length >= 2) { target = { id: c.id, chars }; break; }
    }
    expect(target, '数据集中必须存在带适配角色的光锥').not.toBeNull();
    const hit = target!;

    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/lightcone/${hit.id}`);
      await expect(page.getByRole('heading', { name: /适配角色/ })).toBeVisible();
      const items = page.locator('.nk-lc-adapt__item');
      await expect(items).toHaveCount(hit.chars.length);
      await expect(items.first()).toHaveAttribute('href', `/character/${hit.chars[0].id}`);
      await expect(items.first().locator('.nk-lc-adapt__rec')).toHaveText(`REC. ${hit.chars[0].rank}`);
      await noUnknownOverflow(page);
    }
    assertNoErrors();
  });
});
