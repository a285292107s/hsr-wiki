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

  test('/character/1001：hero「动画」开关命中区不小于 44×44', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/character/1001');
    await page.waitForSelector('.nk-hero__toggle');
    const extent = await page.locator('.nk-hero__toggle').evaluate((btn) => {
      const b = btn.getBoundingClientRect();
      const cx = b.x + b.width / 2;
      const cy = b.y + b.height / 2;
      const hit = (x: number, y: number) => {
        const el = document.elementFromPoint(x, y);
        return !!el && (el === btn || btn.contains(el));
      };
      const scan = (dx: number, dy: number) => {
        let d = 0;
        while (d < 120 && hit(cx + dx * (d + 1), cy + dy * (d + 1))) d++;
        return d;
      };
      const l = scan(-1, 0);
      const r = scan(1, 0);
      const u = scan(0, -1);
      const dn = scan(0, 1);
      return { w: l + r + 1, h: u + dn + 1 };
    });
    const MIN_TARGET = 44;
    expect(extent.w, '命中区宽度').toBeGreaterThanOrEqual(MIN_TARGET);
    expect(extent.h, '命中区高度').toBeGreaterThanOrEqual(MIN_TARGET);
    assertNoErrors();
  });

  test('/character/1001 桌面：骨架态与就绪态 hero 面板同框且两态均不给媒体加底板', { tag: ['@visual-detail', '@viewport-pinned', '@font-calibrated'] }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 1440, height: 900 });

    let releaseData = () => {};
    const dataGate = new Promise<void>((res) => { releaseData = res; });
    let heldRequests = 0;
    await page.route('**/data/cn/characters/1001.json', async (r) => {
      heldRequests += 1;
      try {
        await dataGate;
        await r.continue();
      } finally {
        heldRequests -= 1;
      }
    });
    await page.goto('/character/1001');
    await expect
      .poll(() => heldRequests, { timeout: 10_000, message: '主数据未被拦下：骨架态不是「数据未达」而是页面坏了' })
      .toBeGreaterThan(0);
    await page.waitForSelector('.nk-sk--stat', { timeout: 30_000 });
    const skel = await page.locator('.nk-skeleton__hero-panel').evaluate((el) => {
      const r = el.getBoundingClientRect();
      const first = el.firstElementChild as HTMLElement;
      return { w: r.width, h: r.height, barShadow: getComputedStyle(first).boxShadow };
    });
    releaseData();
    await expect.poll(() => heldRequests, { timeout: 10_000, message: '放行后主数据处理器未结算' }).toBe(0);
    await page.unroute('**/data/cn/characters/1001.json');
    await page.waitForSelector('.nk-stats__stat', { timeout: 30_000 });
    await page.evaluate(() => document.fonts.ready);
    const ready = await page.locator('.nk-hero__panel').evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { w: r.width, h: r.height, bgImage: getComputedStyle(el).backgroundImage };
    });

    expect(Math.abs(skel.w - ready.w), '骨架与就绪面板同宽').toBeLessThanOrEqual(1);
    expect(Math.abs(skel.h - ready.h), '骨架与就绪面板同高（骨架盒高 = 全量中位数，就绪侧同值 min-height 兜底）').toBeLessThanOrEqual(1);
    expect(skel.barShadow, '骨架条块不得带底板（骨架态同样不压暗媒体）').toBe('none');
    expect(ready.bgImage, '就绪态面板不得有整块底板').toBe('none');
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/character/1001 平板档：文字与媒体并排且骨架同框', { tag: ['@visual-detail', '@viewport-pinned', '@font-calibrated', '@cross-engine'] }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 768, height: 1024 });
    const measure = (rootSel: string) => page.evaluate((sel) => {
      const root = document.querySelector(sel) as HTMLElement;
      const box = (s: string) => {
        const el = root.querySelector(s) as HTMLElement | null;
        if (!el) return null;
        const b = el.getBoundingClientRect();
        return { x: +b.x.toFixed(1), y: +b.y.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1) };
      };
      return {
        visual: box('.nk-skeleton__hero-visual, .nk-hero__visual'),
        panel: box('.nk-skeleton__hero-panel, .nk-hero__panel'),
      };
    }, rootSel);

    let releaseData = () => {};
    const dataGate = new Promise<void>((res) => { releaseData = res; });
    let heldRequests = 0;
    await page.route('**/data/cn/characters/1001.json', async (r) => {
      heldRequests += 1;
      try {
        await dataGate;
        await r.continue();
      } finally {
        heldRequests -= 1;
      }
    });
    await page.goto('/character/1001');
    await expect
      .poll(() => heldRequests, { timeout: 10_000, message: '主数据未被拦下：骨架态不是「数据未达」而是页面坏了' })
      .toBeGreaterThan(0);
    await page.waitForSelector('.nk-sk--stat', { timeout: 30_000 });
    const skel = await measure('.nk-skeleton--char');
    releaseData();
    await expect.poll(() => heldRequests, { timeout: 10_000, message: '放行后主数据处理器未结算' }).toBe(0);
    await page.unroute('**/data/cn/characters/1001.json');
    await page.waitForSelector('.nk-stats__stat', { timeout: 30_000 });
    await page.evaluate(() => document.fonts.ready);
    const ready = await measure('.nk-char-page');

    expect(ready.panel, '就绪态面板须存在').not.toBeNull();
    expect(ready.visual, '就绪态媒体须存在').not.toBeNull();
    expect(
      ready.panel!.x,
      '平板档须并排：面板左缘在媒体右缘之后（竖排时两者左缘相同）',
    ).toBeGreaterThan(ready.visual!.x + ready.visual!.w - 1);
    expect(ready.visual!.h, '平板档媒体须竖幅（高 > 宽）').toBeGreaterThan(ready.visual!.w);

    expect(Math.abs(skel.visual!.w - ready.visual!.w), '骨架媒体同宽').toBeLessThanOrEqual(1);
    expect(Math.abs(skel.visual!.h - ready.visual!.h), '骨架媒体同高').toBeLessThanOrEqual(1);
    expect(Math.abs(skel.panel!.x - ready.panel!.x), '骨架面板同列').toBeLessThanOrEqual(2);
    expect(Math.abs(skel.panel!.y - ready.panel!.y), '骨架面板纵向同位（居中）').toBeLessThanOrEqual(2);
    expect(Math.abs(skel.panel!.h - ready.panel!.h), '骨架面板同高（骨架盒高 = 平板档中位数，就绪侧同值 min-height 兜底）').toBeLessThanOrEqual(1);

    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/character/1001：hero 面板在 1024 与矮横屏下仍落在 hero 内', { tag: ['@visual-detail', '@viewport-pinned', '@cross-engine'] }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    for (const vp of [{ width: 1024, height: 768 }, { width: 1440, height: 460 }]) {
      await page.setViewportSize(vp);
      await page.goto('/character/1001');
      await page.waitForSelector('.nk-hero--char');
      await page.waitForSelector('.nk-stats__stat');
      const g = await page.evaluate(() => {
        const hero = document.querySelector('.nk-hero--char') as HTMLElement;
        const panel = document.querySelector('.nk-hero__panel') as HTMLElement;
        const name = document.querySelector('.nk-hero__name') as HTMLElement;
        const hb = hero.getBoundingClientRect();
        const pb = panel.getBoundingClientRect();
        return {
          glyphShadow: getComputedStyle(name).textShadow,
          panelInside:
            pb.left >= hb.left - 0.5 && pb.right <= hb.right + 0.5 &&
            pb.top >= hb.top - 0.5 && pb.bottom <= hb.bottom + 0.5,
        };
      });
      expect(g.glyphShadow, `${vp.width}×${vp.height}：文字可读性须由字形软影承担`).not.toBe('none');
      expect(g.panelInside, `${vp.width}×${vp.height}：面板须整体在 hero 内`).toBe(true);
      await noUnknownOverflow(page);
    }
    assertNoErrors();
  });

  test('/character/1001：hero 封面入场编排（延迟递增 + reduced-motion 关闭）', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/character/1001');
    await page.waitForSelector('.nk-hero__name');

    const rows = ['.nk-hero__rubric', '.nk-hero__meta-row', '.nk-hero__title', '.nk-hero__desc'];
    const anim = await page.evaluate((sels) => sels.map((s) => {
      const el = document.querySelector(s);
      if (!el) return null;
      const c = getComputedStyle(el);
      return { name: c.animationName, delay: parseFloat(c.animationDelay) || 0, count: c.animationIterationCount };
    }), rows);
    expect(anim.every(Boolean), '四行须齐备（1001 有简介）').toBe(true);
    expect(new Set(anim.map((a) => a!.name)), '四行须共用同一入场关键帧').toEqual(new Set(['nk-char-rise']));
    expect(new Set(anim.map((a) => a!.count)), '入场只播一次').toEqual(new Set(['1']));
    for (let i = 1; i < anim.length; i++) {
      expect(anim[i]!.delay, `第 ${i + 1} 行须晚于上一行（错峰）`).toBeGreaterThan(anim[i - 1]!.delay);
    }

    await page.emulateMedia({ reducedMotion: 'reduce' });
    const reduced = await page.evaluate((sels) => sels.map(
      (s) => getComputedStyle(document.querySelector(s)!).animationName,
    ), rows);
    expect(reduced, 'reduced-motion 下入场动画须整体退场').toEqual(['none', 'none', 'none', 'none']);
    await page.emulateMedia({ reducedMotion: 'no-preference' });

    assertNoErrors();
  });

  test('/character/1001 桌面：hero 媒体滚动视差（推进 / 封顶 / 面板不动 / reduced-motion 关闭）', { tag: ['@visual-detail', '@viewport-pinned', '@cross-engine'] }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/character/1001');
    await page.waitForSelector('.nk-hero--char');
    await page.waitForSelector('.nk-stats__stat');

    const snap = () => page.evaluate(() => {
      const v = document.querySelector('.nk-hero__visual') as HTMLElement;
      const p = document.querySelector('.nk-hero__panel') as HTMLElement;
      return {
        shift: new DOMMatrixReadOnly(getComputedStyle(v).transform).m42,
        panelShift: new DOMMatrixReadOnly(getComputedStyle(p).transform).m42,
        anim: getComputedStyle(v).animationName,
      };
    });
    const scrollTo = (top: number) => page.evaluate((t) => {
      (document.querySelector('.nk-page--detail') as HTMLElement).scrollTo({ top: t, behavior: 'instant' as ScrollBehavior });
    }, top);
    const nextFrames = () => page.evaluate(
      () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
    );

    const atTop = await snap();
    const supportsScrollTimeline = await page.evaluate(() => CSS.supports('animation-timeline', 'scroll(nearest)'));
    if (supportsScrollTimeline) {
      expect(atTop.anim, '媒体须挂上滚动驱动动画').toBe('nk-hero-lag');
    } else {
      expect(atTop.anim, '不支持滚动时间轴时不得挂动画（否则会停在末帧并永久下移）').toBe('none');
    }
    expect(atTop.shift, '首屏不得有位移（与静态版面一致）').toBeCloseTo(0, 1);

    if (!supportsScrollTimeline) {
      await scrollTo(4000);
      expect((await snap()).shift, '不支持滚动时间轴时媒体位移须恒为 0').toBeCloseTo(0, 1);
      await noUnknownOverflow(page);
      assertNoErrors();
      return;
    }

    await scrollTo(300);
    await expect.poll(async () => (await snap()).shift, { timeout: 3_000 }).toBeGreaterThan(8);
    const mid = await snap();
    expect(mid.panelShift, '文字面板不得随媒体位移').toBeCloseTo(0, 1);

    await scrollTo(600);
    await expect.poll(async () => (await snap()).shift, { timeout: 3_000 }).toBeGreaterThan(mid.shift);
    let farShift: number | null = null;
    await expect.poll(
      async () => {
        const a = (await snap()).shift;
        await nextFrames();
        const b = (await snap()).shift;
        if (Math.abs(a - b) > 0.5) return false;
        farShift = a;
        return true;
      },
      { timeout: 5_000 },
    ).toBe(true);

    await scrollTo(4000);
    await expect.poll(
      async () => Math.abs((await snap()).shift - farShift!) <= 0.5,
      { timeout: 3_000 },
    ).toBe(true);

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect.poll(async () => (await snap()).anim, { timeout: 3_000 }).toBe('none');
    expect((await snap()).shift, 'reduced-motion 下媒体不得位移').toBeCloseTo(0, 1);
    await page.emulateMedia({ reducedMotion: 'no-preference' });

    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/character/1001：换角色后 hero 重挂（入场编排随之重播）', { tag: '@viewport-independent' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/character/1001');
    await page.waitForSelector('.nk-hero__name');
    const before = await page.evaluate(() => {
      (document.querySelector('.nk-hero__title') as HTMLElement & { __probe?: number }).__probe = 1;
      return (document.querySelector('.nk-hero__name') as HTMLElement).textContent;
    });

    const target = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('.nk-build__team-link[href^="/character/"]'));
      const hit = links.find((a) => a.getAttribute('href') !== '/character/1001');
      return hit ? hit.getAttribute('href') : null;
    });
    expect(target, '1001 的队伍里须有其他角色可跳（否则本用例失去区分力）').toBeTruthy();

    await page.locator(`.nk-build__team-link[href="${target}"]`).first().click();
    await expect.poll(
      async () => page.evaluate(() => (document.querySelector('.nk-hero__name') as HTMLElement).textContent),
      { timeout: 15_000 },
    ).not.toBe(before);

    const remounted = await page.evaluate(
      () => (document.querySelector('.nk-hero__title') as HTMLElement & { __probe?: number }).__probe !== 1,
    );
    expect(remounted, '换角色后 hero 须重挂（入场编排重播）').toBe(true);

    assertNoErrors();
  });
});
