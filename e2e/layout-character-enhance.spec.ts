import { test, expect } from '@playwright/test';
import { collectConsoleIssues } from './helpers';

test.describe('布局验收：角色详情页', () => {

  test('/character/1212：形态卡片组是唯一入口（三选一严格互斥），不占区块编号', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/character/1212');
    await page.waitForSelector('.nk-forms__card');
    await page.waitForSelector('.nk-skill');

    const cards = page.locator('.nk-forms__card');
    await expect(cards, '三张卡片：原始 / 强化 / 对比').toHaveCount(3);
    await expect(page.locator('.nk-hero__forms, .nk-enh-tabs, .nk-enh-module'), '旧入口（hero 形态行 / 模块 tab）已退场').toHaveCount(0);
    await expect(
      page.locator('.nk-hero__badge--enh, .nk-skill__enh-badge, .nk-eidolon__enh-badge'),
      'hero 强化徽标与技能 / 星魂强化角标均已移除',
    ).toHaveCount(0);

    const geo = await page.evaluate(() => {
      const sc = document.querySelector('.nk-char-page') as HTMLElement;
      const top = (s: string) => {
        const el = document.querySelector(s);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return Math.round(r.top - sc.getBoundingClientRect().top + sc.scrollTop);
      };
      return { hero: top('.nk-hero--char'), cards: top('.nk-forms'), firstPanel: top('[data-panel="stats"]') };
    });
    expect(geo.cards, '卡片组须在 hero 之后').toBeGreaterThan(geo.hero!);
    expect(geo.firstPanel, '卡片组须在内容区块之前').toBeGreaterThan(geo.cards!);

    const titles = () => page.locator('.nk-title').evaluateAll((els) => els.map((e) => (e.textContent || '').replace(/\s+/g, '')));
    expect(await titles(), '对比开关不得占用区块编号（不存在「01 对比」标题）').not.toContain('01对比');

    const pressed = () =>
      cards.evaluateAll((els) =>
        els.filter((el) => el.getAttribute('aria-pressed') === 'true').map((el) => (el.textContent || '').replace(/\s+/g, '')),
      );
    expect(await pressed(), '默认态为强化且唯一按下').toEqual(['V1强化']);

    await cards.nth(2).click();
    await expect.poll(async () => (await pressed()).length, '三选一：任意时刻恰有一张按下').toBe(1);
    expect((await pressed())[0]).toContain('DIFF对比');
    await expect(page.locator('.nk-secnav__btn'), '对比态导航收窄为三区块').toHaveCount(3);
    await expect(page.locator('[data-panel="skills"] .nk-cmp-row')).not.toHaveCount(0);
    await expect(page.locator('.nk-cmp-badge'), '对比卡不再挂「变化」角标').toHaveCount(0);
    expect(await titles(), '对比态同样不新增编号标题').not.toContain('01对比');

    await cards.first().click();
    expect(await pressed(), '选原始即退出对比（严格互斥）').toEqual(['BASE原始']);
    await expect(page.locator('.nk-secnav__btn')).toHaveCount(10);
    await expect(page.locator('.nk-forms__notes'), '原始态不列强化摘要').toHaveCount(0);
    await expect(page.locator('[data-panel="skills"] .nk-cmp-row')).toHaveCount(0);

    await cards.nth(1).click();
    expect(await pressed(), '选强化即回到强化态').toEqual(['V1强化']);
    await expect(page.locator('.nk-forms__nt')).not.toHaveCount(0);

    assertNoErrors();
  });

  test('/character/1212：形态卡片在窄档不溢出，三卡等高且触控高度可点', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    for (const vp of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 1023, height: 800 }]) {
      await page.setViewportSize(vp);
      await page.goto('/character/1212');
      await page.waitForSelector('.nk-forms__card');
      const geo = await page.evaluate(() => {
        const slot = document.querySelector('.nk-forms-slot') as HTMLElement;
        const hb = slot.getBoundingClientRect();
        const cards = [...slot.querySelectorAll<HTMLElement>('.nk-forms__card')];
        const rows = new Map<number, number[]>();
        for (const el of cards) {
          const r = el.getBoundingClientRect();
          const key = Math.round(r.top);
          rows.set(key, [...(rows.get(key) ?? []), Math.round(r.height)]);
        }
        return {
          overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          outside: cards
            .filter((el) => {
              const r = el.getBoundingClientRect();
              return r.left < hb.left - 1 || r.right > hb.right + 1;
            })
            .length,
          rowHeights: [...rows.values()],
          heights: cards.map((el) => Math.round(el.getBoundingClientRect().height)),
        };
      });
      expect(geo.overflowX, `${vp.width} 档出现横向滚动`).toBeLessThanOrEqual(0);
      expect(geo.outside, `${vp.width} 档卡片越出内容列`).toBe(0);
      expect(geo.heights.length).toBe(3);
      for (const row of geo.rowHeights) {
        expect(new Set(row).size, `${vp.width} 档同一行卡片须等高`).toBe(1);
      }
      for (const h of geo.heights) expect(h, `${vp.width} 档卡片触控高度`).toBeGreaterThanOrEqual(44);
    }
    assertNoErrors();
  });
});
