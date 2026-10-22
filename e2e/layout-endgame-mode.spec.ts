import { test, expect } from '@playwright/test';
import { collectConsoleIssues, computedNumber, readJson, readTokenPx, waitForSettled } from './helpers';
import { noUnknownOverflow } from './layout.shared';

test.describe('布局验收：终局玩法详情页（第四种页面形态）', () => {
  const MODES = [
    { key: 'maze', label: '忘却之庭', system: '记忆紊流' },
    { key: 'story', label: '虚构叙事', system: '荒腔走板' },
    { key: 'boss', label: '末日幻影', system: '终焉公理' },
    { key: 'peak', label: '异相仲裁', system: '裁决象限' },
  ] as const;

  for (const m of MODES) {
    test(`/endgame/${m.key}：规则正文 + 体系名 + 赛季内链可达`, async ({ page }) => {
      const { assertNoErrors } = collectConsoleIssues(page);
      await page.goto(`/endgame/${m.key}`);

      const h1 = page.locator('.nk-egm__hero h1');
      await expect(h1).toBeVisible();
      await expect(h1).toHaveText(m.label);
      const heroBox = await page.locator('.nk-egm__hero').boundingBox();
      const h1Box = await h1.boundingBox();
      expect(heroBox?.height ?? 0, 'Hero 高度必须是内容高（column flex + overflow:hidden 会压塌它）').toBeGreaterThanOrEqual(96);
      expect(h1Box?.height ?? 0, 'h1 必须有真实高度').toBeGreaterThan(0);
      expect((h1Box?.y ?? 0) + (h1Box?.height ?? 0), 'h1 必须完整落在 Hero 盒内')
        .toBeLessThanOrEqual((heroBox?.y ?? 0) + (heroBox?.height ?? 0) + 1);
      expect(
        await page.locator('.nk-egm__hero').evaluate((el) => getComputedStyle(el).backgroundImage.includes('url(')),
        'Hero 不得用 UI 页签小图当背景（144px cover 到 1000px 会放大 6.9×）',
      ).toBe(false);
      const guide = readJson<{ modes: Record<string, { sections: unknown[]; system?: { name: string; count: number } }> }>(
        'public/data/cn/endgame_guide.json',
      );
      const g = guide.modes[m.key];
      expect(g, `产物应含模式 ${m.key}`).toBeTruthy();
      expect(await page.locator('.nk-egm__rule').count(), '规则分节数应与产物一致').toBe(g.sections.length);

      const proseMax = await page.evaluate(() =>
        getComputedStyle(document.documentElement).getPropertyValue('--nk-prose-max').trim(),
      );
      expect(proseMax, '阅读列宽令牌必须按字号缩放（em）；px 定值会让每行字数随字号漂移').toMatch(/em$/);
      const firstLineEm = await page.locator('.nk-egm__para, .nk-egm__list li').evaluateAll((els) =>
        els.map((el) => {
          const textNode = [...el.childNodes].find(
            (n) => n.nodeType === 3 && (n.textContent ?? '').trim().length > 20,
          );
          if (!textNode) return 0;
          const range = document.createRange();
          range.selectNodeContents(textNode);
          const rects = [...range.getClientRects()];
          if (!rects.length) return 0;
          return rects[0].width / parseFloat(getComputedStyle(el).fontSize);
        }),
      );
      expect(firstLineEm.length, '规则正文应有可测量的段落').toBeGreaterThan(0);
      for (const em of firstLineEm) {
        expect(em, `规则正文每行不得超过令牌列宽（+2 容差）全角字，实测 ${em.toFixed(1)}`)
          .toBeLessThanOrEqual(parseFloat(proseMax) + 2);
      }

      const sysTitle = page.locator('.nk-egm__panel .nk-title').filter({ hasText: g.system!.name });
      await expect(sysTitle.first()).toBeVisible();
      expect(g.system!.name, `该玩法体系名应为 ${m.system}`).toBe(m.system);

      await expect(page.locator('.nk-egm__system')).toContainText('每期');
      await expect(page.locator('.nk-egm__buffs .nk-egm__buff')).toHaveCount(0);
      const cta = page.locator('.nk-egm__system-cta');
      await expect(cta).toBeVisible();
      await expect(cta).toHaveAttribute('href', new RegExp(`^/endgame/${m.key}/\\d+$`));

      expect(await page.locator('.nk-egm__seasons a[href^="/endgame/"]').count()).toBeGreaterThanOrEqual(3);
      await expect(page.locator('.nk-egm__other')).toHaveCount(3);
      await expect(page.locator('.nk-snapshot__entry')).toHaveCount(0);

      await noUnknownOverflow(page);
      assertNoErrors();
    });
  }

  test('/endgame/xyz：未登记玩法名落 404（正则白名单），不被玩法页吃下', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/endgame/xyz');
    await expect(page.locator('.nk-egm__rule')).toHaveCount(0);
    await expect(page.getByText('404')).toBeVisible();
    assertNoErrors();
  });
});

test.describe('玩法说明入口可发现性（目录页列头 + 赛季详情页 Hero）', () => {
  test('两处入口都可见、命中区达标，且点击进入玩法页', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);

    await page.goto('/endgame');
    const chips = page.locator('.nk-eg-col__head .nk-guide-link');
    await expect(chips.first()).toBeVisible();
    expect(await chips.count(), '目录页每个模式列头各一个入口').toBeGreaterThanOrEqual(1);
    for (let i = 0; i < await chips.count(); i += 1) {
      await expect(chips.nth(i)).toHaveAttribute('aria-label', /玩法说明$/);
    }
    const chipBox = await chips.first().boundingBox();
    expect(chipBox?.height ?? 0, '入口命中区应达 WCAG 2.2 下限 24px').toBeGreaterThanOrEqual(24);

    await page.goto('/endgame/boss/3020');
    const heroLink = page.locator('.nk-egd-hero__camp .nk-guide-link');
    await expect(heroLink).toBeVisible();
    await expect(heroLink).toHaveText(/玩法说明/);
    await heroLink.click();
    await expect(page).toHaveURL(/\/endgame\/boss$/);
    await expect(page.locator('.nk-egm__hero h1')).toHaveText('末日幻影');

    assertNoErrors();
  });
});

test.describe('玩法页「当期赛季」判据（不得取未开始的那一期）', () => {
  for (const mode of ['maze', 'story', 'boss', 'peak'] as const) {
    test(`/endgame/${mode}：当期 = 列表中状态为「进行中」的那一期`, async ({ page }) => {
      const { assertNoErrors } = collectConsoleIssues(page);
      await page.goto(`/endgame/${mode}`);
      await expect(page.locator('.nk-egm__note .nk-egm__link')).toBeVisible();
      await waitForSettled(page);

      const r = await page.evaluate(() => {
        const link = document.querySelector('.nk-egm__note .nk-egm__link');
        const rows = [...document.querySelectorAll('.nk-egm__seasons .nk-eg-lrow')];
        const live = rows.find((x) => x.getAttribute('data-status') === 'live');
        return {
          note: link?.closest('.nk-egm__note')?.textContent?.trim().replace(/\s+/g, ' ') ?? null,
          href: link?.getAttribute('href') ?? null,
          liveHref: live?.getAttribute('href') ?? null,
          firstStatus: rows[0]?.getAttribute('data-status') ?? null,
        };
      });
      expect(r.note, '必须显式标注是当期还是最新一期').toBeTruthy();
      if (r.liveHref) {
        expect(r.href, `当期应取进行中的 ${r.liveHref}（列表首行状态 ${r.firstStatus}）`).toBe(r.liveHref);
        expect(r.note).toContain('当期赛季');
      } else {
        expect(r.note, '没有进行中的赛季时不得写成「当期赛季」').not.toContain('当期赛季');
        expect(r.note).toContain('最新赛季');
      }
      assertNoErrors();
    });
  }

});

test.describe('终局详情页 Hero 大图口径（赛季 banner 翻转铺底）', () => {
  test('/endgame 详情页 Hero：赛季 banner 翻转作背景（保留徽标盘、无右侧画框），无 banner 的期不翻', { tag: ['@visual-detail', '@viewport-pinned'] }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    const bannerOf = (file: string, id: string) => readJson<Record<string, { arts?: { theme_banner?: string } }>>(
      `public/data/cn/${file}`,
    )[id].arts?.theme_banner?.split('/').pop() || '';
    for (const [route, file, id] of [
      ['/endgame/maze/1035', 'maze.json', '1035'],
      ['/endgame/boss/3021', 'maze_boss.json', '3021'],
    ] as const) {
      await page.goto(route);
      const bg = page.locator('.nk-egd-hero__bg');
      await expect(bg, `${route} 应以赛季 banner 铺底`).toHaveCount(1);
      await expect
        .poll(() => bg.evaluate((el) => (el as HTMLImageElement).dataset.cdnSrc || el.getAttribute('src') || ''), {
          message: `${route} 应以赛季 banner 铺底（CDN 不可达时读 data-cdn-src，占位图不算换图）`,
        })
        .toMatch(new RegExp(bannerOf(file, id).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      await expect(bg).toHaveClass(/nk-egd-hero__bg--flip/);
      const m = await bg.evaluate((el) => getComputedStyle(el).transform);
      expect(m, `期望镜像矩阵，实得 ${m}`).toMatch(/^matrix\(-/);
      await expect(page.locator('.nk-egd-hero__banner'), 'banner 已改作背景，右侧画框退场').toHaveCount(0);
      await expect(page.locator('.nk-egd-hero__plate'), '徽标盘保留').toHaveCount(1);
      await expect(page.locator('.nk-egd-hero__plate .nk-egd-hero__art')).toHaveCount(1);
      await expect(page.locator('.nk-egd-hero__emblem')).toHaveCount(0);
    }
    await page.goto('/endgame/peak/9');
    const bg = page.locator('.nk-egd-hero__bg');
    await expect(bg).toHaveCount(1);
    await expect(bg).not.toHaveClass(/nk-egd-hero__bg--flip/);
    assertNoErrors();
  });
});

test.describe('玩法页赛季增益 CTA 不被裁切（长语言最坏档）', () => {
  for (const [prefix, mode, vw] of [
    ['/de', 'maze', 320], ['/de', 'maze', 390], ['/ru', 'story', 320], ['', 'maze', 320],
  ] as const) {
    test(`玩法页 CTA 不越出面板：${prefix}/endgame/${mode} @${vw}`, { tag: ['@visual-detail', '@viewport-pinned'] }, async ({ page }) => {
      const { assertNoErrors } = collectConsoleIssues(page);
      await page.setViewportSize({ width: vw, height: 900 });
      await page.goto(`${prefix}/endgame/${mode}`);
      const cta = page.locator('.nk-egm__system-cta');
      await expect(cta).toBeVisible();
      const box = await cta.evaluate((el) => {
        const panel = el.closest('.nk-egm__panel');
        return {
          right: el.getBoundingClientRect().right,
          panelRight: panel?.getBoundingClientRect().right ?? 0,
        };
      });
      expect(box.right, `CTA 右缘 ${box.right.toFixed(1)} 不得越出面板右缘 ${box.panelRight.toFixed(1)}`)
        .toBeLessThanOrEqual(box.panelRight + 1);
      assertNoErrors();
    });
  }
});
