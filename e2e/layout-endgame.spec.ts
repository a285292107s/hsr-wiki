import { test, expect } from '@playwright/test';
import { collectConsoleIssues, computedNumber, fontPx, readJson, readTokenPx, waitForCatalogCards } from './helpers';
import { CN_NUM, cnBigNumber, expectTokenNumber, floorBossName, floorGuide, grouped, itemNameMap, lastWaveMonster, levelTabLabels, monsterBadge, noUnknownOverflow, PEAK_HARD_NODE, peakKnightLevels, peakKnightNodeTabId, peakKnightsTabId, peakNodeTabId, peakTabId, peakTabLabels, pollutedMonsters, pollutedSeasonHrefs, pollutedSummons, pollutionEntries, rewardNames, rewardNums, seasonData, seasonTabLabels, stageGuide, summonBadge, summonsOf, tierceNodeBossNames } from './layout.shared';

test.describe('布局验收：终局目录页', () => {
  test('/endgame：四模式筛选、卡片渲染、无溢出', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/endgame');
    await waitForCatalogCards(page);
    const cardCount = await page.locator('[class*="-grid"] a').count();
    expect(cardCount).toBeGreaterThan(0);
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/endgame：列头子项不越出列框（长译文语言）', { tag: '@viewport-pinned' }, async ({ page }) => {
    test.setTimeout(180_000);
    const { assertNoErrors } = collectConsoleIssues(page);
    const failures: string[] = [];

    for (const code of ['cn', 'de', 'ru', 'es', 'fr', 'pt', 'vi', 'th'] as const) {
      await page.goto(code === 'cn' ? '/endgame' : `/${code}/endgame`);
      await waitForCatalogCards(page);
      await page.waitForFunction(() => document.fonts.status === 'loaded', undefined, { timeout: 5000 }).catch(() => {});
      const bad = await page.evaluate(() => {
        const out: string[] = [];
        for (const col of document.querySelectorAll('.nk-eg-col')) {
          const cr = col.getBoundingClientRect();
          const head = col.querySelector('.nk-eg-col__head');
          if (head) {
            const over = head.getBoundingClientRect().right - cr.right;
            if (over > 1) out.push(`${col.getAttribute('data-mode')} .nk-eg-col__head 越出列框 ${Math.round(over)}px`);
          }
          for (const sel of ['.nk-eg-col__name', '.nk-eg-col__en', '.nk-guide-link']) {
            const el = col.querySelector(sel);
            if (!el) continue;
            const r = el.getBoundingClientRect();
            const over = r.right - cr.right;
            if (over > 1) {
              const cs = getComputedStyle(el);
              const clippedByEllipsis = cs.textOverflow === 'ellipsis' && (el as HTMLElement).scrollWidth > (el as HTMLElement).clientWidth + 1;
              if (!clippedByEllipsis) {
                out.push(`${col.getAttribute('data-mode')} ${sel} 越出列框 ${Math.round(over)}px「${(el.textContent || '').trim().slice(0, 28)}」`);
              }
            }
          }
        }
        return out;
      });
      for (const b of bad) failures.push(`${code}: ${b}`);
    }

    expect(failures, '列头子项越出列框（会压到相邻列）').toEqual([]);
    assertNoErrors();
  });

  test('/endgame：并排列的列头结构一致（放得下即一行；过长则整排等长）', { tag: '@viewport-pinned' }, async ({ page }) => {
    test.setTimeout(180_000);
    const { assertNoErrors } = collectConsoleIssues(page);
    const failures: string[] = [];

    for (const code of ['cn', 'de', 'ru', 'es', 'fr', 'pt', 'vi', 'th'] as const) {
      for (const width of [1024, 1280, 1440, 1920]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(code === 'cn' ? '/endgame' : `/${code}/endgame`);
        await waitForCatalogCards(page);
        await page.waitForFunction(() => document.fonts.status === 'loaded', undefined, { timeout: 5000 }).catch(() => {});
        const bad = await page.evaluate(() => {
          const out: string[] = [];
          const grid = document.querySelector('.nk-eg-grid');
          if (!grid) return ['找不到 .nk-eg-grid'];
          const cols = [...grid.querySelectorAll(':scope > .nk-eg-col')];
          const bands: { top: number; cols: Element[] }[] = [];
          for (const col of cols) {
            const t = Math.round(col.getBoundingClientRect().top);
            const b = bands.find((x) => Math.abs(x.top - t) <= 10);
            if (b) b.cols.push(col); else bands.push({ top: t, cols: [col] });
          }
          const headOf = (c: Element) => c.querySelector('.nk-eg-col__head')!.getBoundingClientRect();
          const linkOf = (c: Element) => c.querySelector('.nk-guide-link')!.getBoundingClientRect();
          const listOf = (c: Element) => c.querySelector('.nk-eg-col__list')!.getBoundingClientRect();
          for (const band of bands) {
            if (band.cols.length < 2) continue;
            const spread = (xs: number[]) => Math.max(...xs) - Math.min(...xs);
            const modes = band.cols.map((c) => c.getAttribute('data-mode')).join('/');
            const metaGeom = (c: Element) => {
              const meta = c.querySelector('.nk-eg-col__meta')!;
              const kids = [...meta.children].filter((el) => getComputedStyle(el).display !== 'none');
              const boxes: { top: number; bottom: number }[] = [];
              for (const el of kids) {
                const r = document.createRange();
                r.selectNodeContents(el);
                for (const rect of r.getClientRects()) {
                  if (rect.width > 0 && rect.height > 0) boxes.push({ top: rect.top, bottom: rect.bottom });
                }
              }
              if (!boxes.length) return { lines: 1, lineH: 0, top: 0, bottom: 0 };
              boxes.sort((a, b) => a.top - b.top);
              const merged: { top: number; bottom: number }[] = [];
              for (const b of boxes) {
                const hit = merged.find((l) => b.top < l.bottom - 2 && b.bottom > l.top + 2);
                if (hit) { hit.top = Math.min(hit.top, b.top); hit.bottom = Math.max(hit.bottom, b.bottom); }
                else merged.push({ top: b.top, bottom: b.bottom });
              }
              return {
                lines: merged.length,
                lineH: merged[0].bottom - merged[0].top,
                top: merged[0].top,
                bottom: merged[merged.length - 1].bottom,
              };
            };
            const geoms = band.cols.map(metaGeom);
            const maxLines = Math.max(...geoms.map((g) => g.lines));

            if (maxLines === 1) {
              band.cols.forEach((c, i) => {
                const g = geoms[i];
                const head = c.querySelector('.nk-eg-col__head')!;
                const cs = getComputedStyle(head);
                const pad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
                const h = headOf(c);
                if (h.height > pad + g.lineH + 2) {
                  out.push(`${modes} 元信息放得下却非一行（列头高 ${Math.round(h.height)}px > 内距 ${Math.round(pad)} + 行高 ${Math.round(g.lineH)}px）`);
                }
                const lr = linkOf(c);
                if (!(lr.top < g.bottom && lr.bottom > g.top) && Math.abs(lr.top - g.top) > 12) {
                  out.push(`${modes} 一行形态下徽章不在文字所在行（徽章 top ${Math.round(lr.top)} vs 文字 ${Math.round(g.top)}~${Math.round(g.bottom)}）`);
                }
              });
            }

            const checks: [string, number[]][] = [
              ['列头盒高', band.cols.map((c) => headOf(c).height)],
              ['徽章行位', band.cols.map((c) => linkOf(c).top - headOf(c).top)],
              ['徽章底缘', band.cols.map((c) => headOf(c).bottom - linkOf(c).bottom)],
              ['列表起点', band.cols.map((c) => listOf(c).top - headOf(c).bottom)],
            ];
            for (const [label, vals] of checks) {
              const d = spread(vals);
              if (d > 2) out.push(`${modes} 排内${label}参差 ${Math.round(d)}px（${vals.map((v) => Math.round(v)).join('/')}）`);
            }
            const enFlags = band.cols.map((c) => {
              const en = c.querySelector('.nk-eg-col__en');
              return en && getComputedStyle(en).display !== 'none' ? 1 : 0;
            });
            if (enFlags.some((f) => f !== enFlags[0])) {
              out.push(`${modes} 排内英文副题显隐不一致（${enFlags.join('/')}）`);
            }
            for (const c of band.cols) {
              const cw = c.getBoundingClientRect().width;
              const hw = headOf(c).width;
              if (Math.abs(hw - cw) > 2) out.push(`${modes} 列头盒宽 ${Math.round(hw)}px ≠ 列框宽 ${Math.round(cw)}px`);
            }
            const colW = band.cols[0].getBoundingClientRect().width;
            for (const c of band.cols) {
              const lw = linkOf(c).width;
              if (lw > colW - 40) out.push(`${modes} 徽章被拉宽到 ${Math.round(lw)}px（列宽 ${Math.round(colW)}px）`);
            }
          }
          return out;
        });
        for (const b of bad) failures.push(`${code}@${width}: ${b}`);
      }
    }

    expect(failures, '并排列的列头结构不一致（参差即为回归）').toEqual([]);
    assertNoErrors();
  });

  test('/endgame：贪饕污染赛季卡片带标记（挂赛季名后），无污染赛季不带', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/endgame');
    await waitForCatalogCards(page);
    const polluted = pollutedSeasonHrefs();
    expect(polluted.length, '目录数据里应有已登记的污染赛季').toBeGreaterThan(0);
    const badges = await page.locator('.nk-eg-lrow__poll').evaluateAll((els) => els.map((el) => ({
      text: el.textContent?.trim() || '',
      afterName: el.previousElementSibling?.classList.contains('nk-eg-lrow__name') ?? false,
      inMeta: el.closest('.nk-eg-lrow__meta') !== null,
    })));
    expect(badges.length, '渲染窗口内应有带标记的赛季（取样为空 = 位置契约没被验到）').toBeGreaterThan(0);
    for (const b of badges) expect(b).toEqual({ text: '贪饕污染', afterName: true, inMeta: false });
    const marks = await page.locator('.nk-eg-lrow__poll').evaluateAll((els) =>
      els.map((el) => (el.closest('a')?.getAttribute('href') || '')),
    );
    const rendered = await page.locator('[class*="-grid"] a').evaluateAll((els) =>
      els.map((el) => el.getAttribute('href') || ''),
    );
    const expectedMarks = rendered.filter((h) => polluted.includes(h));
    expect(expectedMarks.length, '当前渲染窗口内应至少有一个污染赛季（管线静默失效会红）').toBeGreaterThan(0);
    expect(marks.slice().sort()).toEqual(expectedMarks.slice().sort());
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/endgame：分模式列不窄于 --nk-grid-min（日期整串不被截断也不越到相邻列）', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    for (const width of [768, 1024, 1280, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/endgame');
      await waitForCatalogCards(page);
      const min = await readTokenPx(page, '--nk-grid-min', '.nk-eg-grid');
      expect(min, '下限必须是正数（列数落档全靠它）').toBeGreaterThan(0);
      const colWidths = await page.locator('.nk-eg-col').evaluateAll((els) =>
        els.map((el) => Math.round(el.getBoundingClientRect().width)),
      );
      expect(colWidths.length, `视口 ${width}：四个模式列都应在`).toBe(4);
      for (const w of colWidths) expect(w, `视口 ${width}：列宽 ${w} < 下限 ${min}`).toBeGreaterThanOrEqual(min - 0.5);

      const clipped = await page.locator('.nk-eg-lrow').evaluateAll((els) =>
        els
          .filter((el) => {
            const meta = el.querySelector('.nk-eg-lrow__meta');
            const date = el.querySelector('.nk-eg-lrow__date');
            if (!meta || !date) return false;
            if (date.scrollWidth > date.clientWidth + 1) return true;
            if (meta.scrollWidth > meta.clientWidth + 1) return true;
            const col = date.closest('.nk-eg-col');
            return !!col && date.getBoundingClientRect().right > col.getBoundingClientRect().right + 0.5;
          })
          .map((el) => el.getAttribute('href') || '')
          .slice(0, 3),
      );
      expect(clipped, `视口 ${width}：这些行的日期被截断或越出列框`).toEqual([]);
      await noUnknownOverflow(page);
    }
    assertNoErrors();
  });

  test('/endgame 另两种污染形态：星启附加关（maze/1036）与异相仲裁单关（peak/9）', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    const maze = seasonData('maze.json', '1036');
    await page.goto('/endgame/maze/1036');
    const mazeNode = (maze.tierce?.nodes ?? []).findIndex((nd) => nd.invasion);
    expect(mazeNode, '忘却之庭星启节点里应有污染节点').toBeGreaterThanOrEqual(0);
    await page.locator('.nk-egd-nodecards[aria-label="星启节点"] [role="tab"]').nth(mazeNode).click();
    await expect(page.locator('#egd-tierce-board .nk-egd-board__head, #egd-tierce-board .nk-egd-floor__head .nk-egd-pollchip'))
      .toHaveCount(0);
    const mazeNodeData = maze.tierce!.nodes![mazeNode];
    const mazeInv = mazeNodeData.invasion!;
    const mazePolledMons = pollutedMonsters(mazeInv, mazeNodeData.monsters);
    expect(mazePolledMons.length, '该星启节点应有登记在敌方配置里的被污染敌方').toBeGreaterThan(0);
    const mazePolledCards = page.locator('#egd-tierce-board .nk-egd-mon__art .nk-egd-pollchip');
    await expect(mazePolledCards).toHaveText(mazePolledMons.map(() => monsterBadge(mazeInv)));
    const mazeCardWithPoll = page.locator('#egd-tierce-board .nk-egd-mon')
      .filter({ has: page.locator('.nk-egd-mon__art .nk-egd-pollchip') }).first();
    const badgePlace = await mazeCardWithPoll.evaluate((card) => {
      const art = card.querySelector('.nk-egd-mon__art') as HTMLElement;
      const img = card.querySelector('.nk-egd-mon__img') as HTMLElement;
      const chip = card.querySelector('.nk-egd-mon__art > .nk-egd-pollchip') as HTMLElement;
      const a = art.getBoundingClientRect();
      const i = img.getBoundingClientRect();
      const c = chip.getBoundingClientRect();
      return {
        belowFig: c.top - i.bottom,
        insideLeft: Math.round(c.left - a.left),
        insideRight: Math.round(a.right - c.right),
        artW: Math.round(a.width),
        imgW: Math.round(i.width),
      };
    });
    expect(badgePlace.belowFig, '污染徽标应排在立绘下方').toBeGreaterThanOrEqual(0);
    expect(badgePlace.insideLeft, '徽标左缘不应越出立绘列').toBeGreaterThanOrEqual(-1);
    expect(badgePlace.insideRight, '徽标右缘不应越出立绘列').toBeGreaterThanOrEqual(-1);
    expect(badgePlace.artW, '立绘列宽应贴合立绘图宽（徽标不得反撑列宽）').toBe(badgePlace.imgW);
    const hpPlace = await mazeCardWithPoll.evaluate((card) => {
      const art = card.querySelector('.nk-egd-mon__art') as HTMLElement;
      const img = card.querySelector('.nk-egd-mon__img') as HTMLElement;
      const hp = card.querySelector('.nk-egd-mon__art > .nk-egd-mon__hp') as HTMLElement;
      const a = art.getBoundingClientRect();
      const i = img.getBoundingClientRect();
      const h = hp.getBoundingClientRect();
      return {
        belowFig: Math.round(h.top - i.bottom),
        insideLeft: Math.round(h.left - a.left),
        insideRight: Math.round(a.right - h.right),
        artW: Math.round(a.width),
        imgW: Math.round(i.width),
      };
    });
    expect(hpPlace.belowFig, 'HP 应排在立绘下方').toBeGreaterThanOrEqual(0);
    expect(hpPlace.insideLeft, 'HP 左缘不应越出立绘列').toBeGreaterThanOrEqual(-1);
    expect(hpPlace.insideRight, 'HP 右缘不应越出立绘列').toBeGreaterThanOrEqual(-1);
    expect(hpPlace.artW, 'HP 不得反撑立绘列宽').toBe(hpPlace.imgW);
    const mazeNodeSummons = summonsOf(mazeNodeData.monsters);
    const mazeNodePolled = pollutedSummons(mazeNodeData.monsters);
    expect(mazeNodePolled.length, '该星启节点应有受污染的召唤物').toBeGreaterThan(0);
    const mazeSummonCards = page.locator('#egd-tierce-board .nk-egd-mon .nk-egd-summon');
    await expect(mazeSummonCards).toHaveCount(mazeNodeSummons.length);
    await expect(page.locator('#egd-tierce-board .nk-egd-summons .nk-egd-pollchip'))
      .toHaveText(mazeNodePolled.map(summonBadge));
    await expect(page.locator('#egd-tierce-board .nk-egd-floor__row--summons')).toHaveCount(0);
    await expect(page.locator('.nk-egd-nodecard--active .nk-egd-nodecard__label').first()).toHaveText('推荐属性');
    await noUnknownOverflow(page);
    assertNoErrors();

    const peak = seasonData('maze_peak.json', '9');
    await page.goto('/endgame/peak/9');
    await expect(page.locator('.nk-egd-bar')).toHaveCount(0);
    await expect(page.locator('#egd-level-tabs [role="tab"]')).toHaveText(peakTabLabels(peak));
    const knights = peakKnightLevels(peak);
    const pollLevel = (peak.levels ?? []).find((l) => l.invasion);
    expect(pollLevel?.name, '当期应有受污染的单关').toBeTruthy();
    const pollIdx = knights.findIndex((l) => l.id === pollLevel!.id);
    if (pollIdx >= 0) {
      await page.locator(peakKnightsTabId).click();
      await page.locator(peakKnightNodeTabId(knights[pollIdx], pollIdx)).click();
    } else {
      await page.locator(peakTabId(pollLevel!)).click();
    }
    await expect(page.locator('.nk-egd-peak .nk-egd-floor__head')).toHaveCount(0);
    const peakLevelInv = pollLevel!.invasion!;
    const peakLevelPolled = pollutedMonsters(peakLevelInv, pollLevel!.monsters);
    expect(peakLevelPolled.length, '该单关应有登记在敌方配置里的被污染敌方').toBeGreaterThan(0);
    await expect(page.locator('.nk-egd-peak .nk-egd-mon__art .nk-egd-pollchip'))
      .toHaveText(peakLevelPolled.map(() => monsterBadge(peakLevelInv)));
    await expect(page.locator('.nk-egd-peak .nk-egd-mon__meta .nk-egd-pollchip')).toHaveCount(0);
    await expect(page.locator('.nk-egd-peak')).toHaveCount(1);
    await expect(page.locator('#egd-level-panel')).toHaveAttribute(
      'aria-labelledby',
      pollIdx >= 0 ? 'egd-level-tab-peak-knights' : `egd-level-tab-peak-${pollLevel!.id}`,
    );
    const king = (peak.levels ?? []).find((l) => l.kind === 'king');
    expect(king?.buffs?.length, '王棋关应带裁决象限增益').toBeGreaterThan(0);
    await page.locator(peakTabId(king!)).click();
    await expect(page.locator('.nk-egd-peak .nk-egd-floor__buffname')).toHaveText(king!.buffs!.map((b) => b.name));
    await expect(page.locator('.nk-egd-peak .nk-egd-floor__bufflabel')).toHaveCount(0);
    const peakSummons = (peak.levels ?? []).flatMap(
      (l) => [...summonsOf(l.monsters), ...summonsOf(l.hard?.monsters)],
    );
    expect(peakSummons.length, '异相仲裁应有带召唤物的单关').toBeGreaterThan(0);
    await page.locator(peakKnightsTabId).click();
    for (let i = 0; i < knights.length; i += 1) {
      await page.locator(peakKnightNodeTabId(knights[i], i)).click();
      await expect(page.locator('.nk-egd-peak .nk-egd-mon .nk-egd-summon'))
        .toHaveCount(summonsOf(knights[i].monsters).length);
    }
    const kingHard = king!.hard!;
    await page.locator(peakTabId(king!)).click();
    await page.locator(peakNodeTabId(PEAK_HARD_NODE)).click();
    await expect(page.locator('.nk-egd-peak .nk-egd-mon .nk-egd-summon'))
      .toHaveCount(summonsOf(kingHard.monsters).length);
    await page.locator(peakKnightsTabId).click();
    await expect(page.locator('.nk-egd-peak .nk-egd-summons__label').first()).toHaveText('召唤物');
    await expect(page.locator('.nk-egd-peak .nk-egd-floor__row--summons')).toHaveCount(0);
    await expect(page.locator('.nk-egd-peak .nk-egd-floor__moncell')).toHaveCount(0);
    await noUnknownOverflow(page);
    assertNoErrors();
  });
});
