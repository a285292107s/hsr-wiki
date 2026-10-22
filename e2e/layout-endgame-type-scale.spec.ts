import { test, expect } from '@playwright/test';
import { collectConsoleIssues, readToken, waitForSettled } from './helpers';

const ROUTES: Array<[string, string]> = [
  ['/endgame/maze', '玩法·忘却之庭'],
  ['/endgame/story', '玩法·虚构叙事'],
  ['/endgame/boss', '玩法·末日幻影'],
  ['/endgame/peak', '玩法·异相仲裁'],
  ['/endgame/maze/1034', '赛季·忘却之庭'],
  ['/endgame/story/2026', '赛季·虚构叙事'],
  ['/endgame/boss/3021', '赛季·末日幻影'],
  ['/endgame/peak/9', '赛季·异相仲裁'],
];

const FS_TOKENS = [
  '--nk-fs-1', '--nk-fs-2', '--nk-fs-3', '--nk-fs-4', '--nk-fs-5', '--nk-fs-6', '--nk-fs-7', '--nk-fs-8',
  '--nk-fs-title-1', '--nk-fs-title-2', '--nk-fs-title-3', '--nk-fs-title-4', '--nk-fs-title-5',
  '--nk-fs-hero', '--nk-fs-hero-lg',
];
const RADIUS_TOKENS = ['--nk-radius-1', '--nk-radius-2', '--nk-radius-3'];
const RADIUS_SHAPES = ['50%', '999px'];
const MAX_TIERS = 10;

for (const [route, label] of ROUTES) {
  test(`${label}（${route}）：字号与圆角全部来自刻度`, { tag: '@viewport-independent' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto(route);
    await page.waitForSelector('.nk-page--detail');
    await waitForSettled(page);

    const rootPx = await page.locator('html').evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    const toPx = (raw: string): number => {
      const v = parseFloat(raw);
      if (!Number.isFinite(v)) return 0;
      return raw.trim().endsWith('rem') ? v * rootPx : v;
    };
    const scale: number[] = [];
    for (const t of FS_TOKENS) scale.push(toPx(await readToken(page, t)));
    const radiusAllowed = [
      ...(await Promise.all(RADIUS_TOKENS.map(async (t) => toPx(await readToken(page, t))))).map((v) => `${v}px`),
      ...RADIUS_SHAPES, '0px',
    ];
    const floorPx = 0.6 * rootPx;
    const fs1 = scale[0];

    const measured = await page.evaluate(() => {
      const root = document.querySelector('.nk-page--detail');
      if (!root) return null;
      const sizes: number[] = [];
      const radiusSet = new Set<string>();
      for (const el of root.querySelectorAll('*')) {
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden') continue;
        const box = el.getBoundingClientRect();
        if (box.width <= 0 || box.height <= 0) continue;
        const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim());
        if (hasText) sizes.push(+parseFloat(cs.fontSize).toFixed(2));
        for (const part of cs.borderRadius.split(/\s+/)) if (part && part !== '0px') radiusSet.add(part);
      }
      return { sizes, radiusSet: [...radiusSet] };
    });
    expect(measured, '页面根 .nk-page--detail 必须存在').not.toBeNull();

    const offScale = [...new Set(measured!.sizes)].filter(
      (v) => !scale.some((s) => Math.abs(s - v) < 0.06),
    ).sort((a, b) => a - b);
    expect(offScale, `以下字号不在 --nk-fs-* 刻度上：${offScale.join(' / ')}px`).toEqual([]);

    const underFloor = [...new Set(measured!.sizes)].filter((v) => v < floorPx - 0.06);
    expect(underFloor, `以下字号低于 0.6rem（A5.3 合格线）：${underFloor.join(' / ')}px`).toEqual([]);

    const tiers = [...new Set(measured!.sizes)].length;
    expect(tiers, `字号档位 ${tiers} 超过目标线 ${MAX_TIERS}`).toBeLessThanOrEqual(MAX_TIERS);

    const badRadius = measured!.radiusSet.filter((v) => !radiusAllowed.includes(v));
    expect(badRadius, `以下圆角不在刻度/形态内：${badRadius.join(' / ')}`).toEqual([]);

    expect(scale.filter((v) => v > 0).length, '--nk-fs-* 令牌必须读到非零值').toBeGreaterThanOrEqual(8);
    expect(fs1, '--nk-fs-1 必须可用（A5.3 的对照档）').toBeGreaterThan(0);

    assertNoErrors();
  });
}
