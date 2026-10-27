import { test, expect } from '@playwright/test';
import { collectConsoleIssues, readJson } from './helpers';
import { collectNavAnchors, navEntryReachable, noUnknownOverflow } from './layout.shared';

test.describe('布局验收：贪饕污染专题页（ADR 0025）', () => {
  test('/voracity：H1、数据驱动区块、已裁剪区块缺席、侧栏前缀性、无溢出', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    const vor = readJson<{
      activity?: { buff_levels?: unknown[] };
      invasion?: { levels?: unknown[] };
      tutorials?: unknown[];
      affixes?: { name: string }[];
    }>('public/data/cn/voracity.json');
    await page.goto('/voracity');
    await expect(page.locator('.nk-vor-hero__title')).toHaveText('贪饕污染');
    const sectionCount = [
      !!vor.activity,
      !!(vor.invasion?.levels?.length || vor.activity?.buff_levels?.length),
      !!vor.tutorials?.length,
      !!vor.affixes?.length,
    ].filter(Boolean).length;
    const secnav = page.locator('.nk-vor-secnav .nk-secnav__btn');
    await expect(secnav).toHaveCount(sectionCount);
    await expect(secnav.first()).toContainText('玩法概览');
    await expect(secnav.last()).toContainText('位面词条');
    await expect(page.locator('#vor-affixes .nk-vor-affix')).toHaveCount(vor.affixes!.length);
    await expect(page.locator('#vor-scores, #vor-stages, #vor-statuses, #vor-disambig')).toHaveCount(0);
    const anchors = await collectNavAnchors(page);
    expect(anchors.length).toBeGreaterThan(1);
    const visIdx = anchors.map((a, i) => (a.visible ? i : -1)).filter((i) => i >= 0);
    expect(visIdx).toEqual(Array.from({ length: visIdx.length }, (_, i) => i));
    expect(await navEntryReachable(page, '/voracity'), '/voracity 入口必须可达（底栏或「更多」抽屉）').toBe(true);
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/voracity：hero 与首区块同轴（含分割线）', { tag: '@visual-detail' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/voracity');
    await expect(page.locator('.nk-vor-sec .nk-title').first()).toBeVisible();

    const axis = await page.evaluate(() => {
      const rect = (sel: string) => {
        const el = document.querySelector(sel);
        return el ? el.getBoundingClientRect() : null;
      };
      const hero = rect('.nk-vor-hero');
      const heroTitle = rect('.nk-vor-hero__title');
      const sec = rect('.nk-vor-sec');
      const secTitle = rect('.nk-vor-sec .nk-title');
      const after = getComputedStyle(document.querySelector('.nk-vor-hero')!, '::after');
      if (!hero || !heroTitle || !sec || !secTitle) return null;
      return {
        heroTitleLeft: Math.round(heroTitle.left),
        secTitleLeft: Math.round(secTitle.left),
        ruleLeft: Math.round(hero.left + parseFloat(after.left)),
        ruleRight: Math.round(hero.right - parseFloat(after.right)),
        secRight: Math.round(sec.right),
        heroWidth: Math.round(hero.width),
        secWidth: Math.round(sec.width),
      };
    });
    expect(axis, 'hero / 区块节点缺失').not.toBeNull();
    expect(axis!.heroTitleLeft, 'hero 标题必须与首区块标题同轴').toBe(axis!.secTitleLeft);
    expect(axis!.ruleLeft, 'hero 分割线左端必须落在同一条内容轴上').toBe(axis!.secTitleLeft);
    expect(axis!.ruleRight, 'hero 分割线右端必须与区块右缘对齐').toBe(axis!.secRight);
    expect(axis!.heroWidth).toBeGreaterThanOrEqual(axis!.secWidth);

    await noUnknownOverflow(page);
    assertNoErrors();
  });
});
