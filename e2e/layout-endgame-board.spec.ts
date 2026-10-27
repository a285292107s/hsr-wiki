import { test, expect } from '@playwright/test';
import { collectConsoleIssues, computedNumber, fontPx, readJson, readTokenPx, waitForCatalogCards } from './helpers';
import { CN_NUM, cnBigNumber, expectTokenNumber, floorBossName, floorGuide, grouped, itemNameMap, lastWaveMonster, levelTabLabels, monsterBadge, noUnknownOverflow, peakTabId, peakTabLabels, pollutedMonsters, pollutedSeasonHrefs, pollutedSummons, pollutionEntries, rewardNames, rewardNums, seasonData, seasonRewardGroups, seasonTabLabels, stageGuide, summonBadge, summonsOf, tierceNodeBossNames } from './layout.shared';

test.describe('布局验收：终局层级与看板 · 末日幻影', () => {
  test('/endgame/boss/3021：层级子 tab（ADR 0026 / 0030）', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/endgame/boss/3021');
    const season = seasonData('maze_boss.json', '3021');
    await expect(page.locator('.nk-egd-bar')).toHaveCount(0);
    await expect(page.locator('.nk-egd.nk-page--detail')).toHaveCSS('padding-top', '0px');
    await expect(page.locator('.nk-egd-secnav')).toHaveCount(0);
    await expect(page.locator('#egd-pollution, .nk-egd-poll')).toHaveCount(0);
    await expect(page.locator('.nk-egd-panel > .nk-egd-buffzone .nk-egd-floor__buffname')).toHaveText('末法余烬');
    const panelBlocks = await page.locator('.nk-egd-panel > *').evaluateAll((els) =>
      els.map((el) => (el as HTMLElement).className.split(' ')[0]));
    expect(panelBlocks.slice(0, 2), '整期一份的末法余烬在关卡子 tab 之上').toEqual(['nk-egd-buffzone', 'nk-egd-tabs']);
    const tabs = page.locator('.nk-egd-tabs [role="tab"]');
    await expect(tabs).toHaveText(levelTabLabels(season));
    await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
    await page.locator('#egd-level-tab-floor-1').click();
    await expect(page.locator('.nk-egd-lvl__head')).toHaveCount(0);
    await expect(page.locator('#egd-level-panel .nk-egd-head')).toHaveCount(0);
    await expect(page.locator('#egd-level-panel .nk-egd-lvl__rules')).toHaveCount(0);
    const flat = page.locator('#egd-season-rewards .nk-egd-season-flat');
    await expect(flat).toHaveCount(1);
    const floor1Targets = season.floor_details![0].targets!;
    const starRows = flat.locator('.nk-egd-season-flat__conditions .nk-egd-node');
    await expect(starRows).toHaveCount(floor1Targets.length);
    await expect(starRows.last()).toContainText(String(floor1Targets[floor1Targets.length - 1].param));
    await expect(page.locator('#egd-season-rewards .nk-egd-season-group')).toHaveCount(1);
    await expect(page.locator('.nk-egd-buffzone .nk-egd-floor__buffhead'))
      .toHaveText(season.floor_details![0].buff!.name);
    await expect(page.locator('.nk-egd-buffzone .nk-egd-floor__bufflabel')).toHaveCount(0);
    await expect(page.locator('#egd-floor-board .nk-egd-floor__buff')).toHaveCount(0);
    const tabBoxes = await tabs.evaluateAll((els) => els.map((el) => {
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.x), y: Math.round(r.y) };
    }));
    expect(new Set(tabBoxes.map((b) => b.y)).size).toBe(1);
    const xs = tabBoxes.map((b) => b.x);
    expect(xs).toEqual([...xs].sort((a, b) => a - b));
    const poll = pollutionEntries(season);
    const polledFloors = poll.filter((e) => e.floor != null);
    expect(polledFloors.length).toBeGreaterThan(0);
    const cleanFloor = (season.floor_details ?? []).find(
      (f) => !polledFloors.some((e) => e.floor === f.floor),
    );
    await expect(page.locator('.nk-egd-lvl__poll')).toHaveCount(0);
    const selectHalf = async (floor: number, half: 'stage1' | 'stage2'): Promise<void> => {
      await page.locator(`#egd-level-tab-floor-${floor}`).click();
      await page.locator(`#egd-floor-half-tab-${half}`).click();
    };
    if (cleanFloor) {
      await selectHalf(cleanFloor.floor, 'stage1');
      await expect(page.locator('#egd-floor-board .nk-egd-pollchip')).toHaveCount(0);
    }
    for (const entry of polledFloors) {
      const half = entry.half === 'stage1' ? 'stage1' : 'stage2';
      await selectHalf(entry.floor!, half);
      await expect(page.locator('#egd-floor-board .nk-egd-board__head, #egd-floor-board .nk-egd-floor__head .nk-egd-pollchip'))
        .toHaveCount(0);
      const stage = (season.floor_details ?? []).find((f) => f.floor === entry.floor)![half]!;
      const polledSummons = pollutedSummons(stage.monsters);
      expect(polledSummons.length, `第 ${entry.floor} 层 ${half} 应有受污染的召唤物`).toBeGreaterThan(0);
      await expect(page.locator('#egd-floor-board .nk-egd-mon__data .nk-egd-summons .nk-egd-pollchip'))
        .toHaveText(polledSummons.map(summonBadge));
      await expect(page.locator('#egd-floor-board .nk-egd-mon__art .nk-egd-pollchip')).toHaveCount(0);
    }
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/endgame/boss/3020：末法余烬上提赛季级 + 终焉公理三卡同排，1440×900 首屏带出敌方配置', { tag: ['@viewport-pinned'] }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/endgame/boss/3020');
    const season = seasonData('maze_boss.json', '3020');
    await expect(page.locator('.nk-egd-buffzone .nk-egd-floor__buffhead')).toHaveText('末法余烬');
    const panelBlocks = await page.locator('.nk-egd-panel > *').evaluateAll((els) =>
      els.map((el) => (el as HTMLElement).className.split(' ')[0]));
    expect(panelBlocks.slice(0, 2), '整期一份的末法余烬在关卡子 tab 之上').toEqual(['nk-egd-buffzone', 'nk-egd-tabs']);
    const sameRow = async (cards: ReturnType<typeof page.locator>): Promise<number> => new Set(
      await cards.evaluateAll((els) => els.map((el) => Math.round((el as HTMLElement).offsetTop))),
    ).size;
    const tierceBoard = page.locator('#egd-tierce-board');
    await expect(tierceBoard.locator('.nk-egd-floor__buff')).toHaveCount(0);
    await expect(tierceBoard.locator('.nk-egd-group__title')).toHaveText('终焉公理');
    await expect(tierceBoard.locator('.nk-egd-group .nk-egd-buff'))
      .toHaveCount(season.buff_groups!.tierce!.length);
    expect(await sameRow(tierceBoard.locator('.nk-egd-group .nk-egd-buff')), '星启档终焉公理三卡应同排').toBe(1);
    const stage = await tierceBoard.locator('.nk-egd-floor__stage').boundingBox();
    expect(stage?.y ?? Infinity, '首屏必须带出敌方配置').toBeLessThan(900);
    await page.locator('#egd-level-tab-floor-1').click();
    const floorBoard = page.locator('#egd-floor-board');
    await expect(floorBoard.locator('.nk-egd-floor__buff')).toHaveCount(0);
    await expect(floorBoard.locator('.nk-egd-group .nk-egd-buff'))
      .toHaveCount(season.buff_groups!.stage1!.length);
    expect(await sameRow(floorBoard.locator('.nk-egd-group .nk-egd-buff')), '层档终焉公理三卡应同排').toBe(1);
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/endgame/boss/3020：层级只为上下半场 + 星启单节点看板（ADR 0029 / 0030 / 0031 / 0032 / 0033）', { tag: ['@visual-detail', '@viewport-pinned'] }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/endgame/boss/3020');
    const season = seasonData('maze_boss.json', '3020');
    const stageNum = (season.floor_details ?? []).slice(0, 1).flatMap((f) => [f.stage1, f.stage2]).filter(Boolean).length;
    const nodeBoss = tierceNodeBossNames(season);
    const stageBuffs = season.buff_groups?.stage1 ?? [];
    const floor1Guide = floorGuide(season, 1, 'stage1');
    const stageTraits = floor1Guide?.traits ?? [];
    const floor1Phases = floor1Guide?.phases ?? [];
    const tierceData = season.tierce!;
    const tabs = page.locator('.nk-egd-tabs [role="tab"]');
    await expect(tabs).toHaveText(levelTabLabels(season));
    await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
    await page.locator('#egd-level-tab-floor-1').click();
    await expect(page.locator('#egd-level-tab-floor-1')).toHaveAttribute('aria-selected', 'true');
    const halfCards = page.locator('.nk-egd-nodecards[aria-label="半场"] [role="tab"]');
    await expect(halfCards).toHaveCount(stageNum);
    await expect(halfCards.locator('.nk-egd-nodecard__name')).toHaveText(['上半场', '下半场']);
    await expect(halfCards.first()).toHaveAttribute('aria-selected', 'true');
    const floorBoard = page.locator('#egd-floor-board');
    await expect(floorBoard).toHaveCount(1);
    await expect(floorBoard).toHaveAttribute('aria-labelledby', 'egd-floor-half-tab-stage1');
    await expect(floorBoard.locator('.nk-egd-mon__name')).toHaveText(floorBossName(season, 1, 'stage1'));
    await expect(floorBoard.locator('.nk-egd-group__label')).toHaveCount(0);
    await expect(floorBoard.locator('.nk-egd-floor__stagelabel')).toHaveCount(0);
    await expect(floorBoard.locator('.nk-egd-floor__moncount')).toHaveCount(0);
    const boardGroups = floorBoard.locator('.nk-egd-group');
    await expect(boardGroups).toHaveCount(1);
    await expect(boardGroups.nth(0).locator('.nk-egd-group__title')).toHaveText('终焉公理');
    await expect(floorBoard.locator('.nk-egd-traits')).toHaveCount(0);
    const guideSec = floorBoard.locator('.nk-egd-mon__data > .nk-egd-guide');
    await expect(guideSec).toHaveCount(1);
    await expect(guideSec.locator('.nk-egd-guide__label')).toHaveText('首领特性');
    await expect(guideSec.locator('.nk-egd-trait')).toHaveCount(stageTraits.length);
    const trait0 = guideSec.locator('.nk-egd-trait').first();
    await expect(trait0).toContainText(stageTraits[0].name);
    await expect(trait0).toContainText(`${stageTraits[0].param_list![0] * 100}%`);
    await expect(trait0).toContainText(`${stageTraits[0].param_list![1] * 100}%`);
    const phaseSec = floorBoard.locator('.nk-egd-mon__data > .nk-egd-phase');
    await expect(phaseSec).toHaveCount(1);
    await expect(phaseSec.locator('.nk-egd-phase__label')).toHaveText('阶段机制');
    await expect(phaseSec.locator('.nk-egd-phase__item')).toHaveCount(floor1Phases.length);
    const phase0 = phaseSec.locator('.nk-egd-phase__item').first();
    await expect(phase0.locator('.nk-egd-phase__name')).toHaveText(floor1Phases[0].name);
    await expect(phase0).toContainText(floor1Phases[0].desc!);
    await expect(phase0).toContainText(floor1Phases[0].answer!);
    await expect(phase0.locator('.nk-egd-phase__skill')).toHaveCount(floor1Phases[0].skills!.length);
    await expect(phase0.locator('.nk-egd-phase__skillname')).toHaveText(floor1Phases[0].skills!.map((s) => s.name));
    const dataOrder = await floorBoard.locator('.nk-egd-mon__data').first()
      .evaluate((el) => [...el.children].map((c) => c.className.split(' ')[0]));
    expect(dataOrder).toEqual([
      'nk-egd-mon__meta', 'nk-egd-mon__rows',
      'nk-egd-guide', 'nk-egd-phase', 'nk-egd-mon__skills', 'nk-egd-summons',
    ]);
    const floor1Boss = (season.floor_details ?? []).find((f) => f.floor === 1)!.stage1!.monsters![0];
    const debuffs = floor1Boss.debuff_resist ?? [];
    expect(debuffs.length).toBeGreaterThan(0);
    const immRow = floorBoard.locator('.nk-egd-mon__row', { hasText: '效果抵抗' });
    await expect(immRow.locator('.nk-egd-mon__immicon')).toHaveCount(debuffs.length);
    await expect(immRow.locator('.nk-egd-mon__resval'))
      .toHaveText(debuffs.map((d) => `${Math.round(d.value * 100)}%`));
    const immImg = immRow.locator('.nk-egd-mon__immicon').first();
    await expect(immImg).toHaveAttribute('src', new RegExp(debuffs[0].icon));
    await expect(immImg).toHaveAttribute('data-cdn-fallback', /IconImmune.*\.png$/);
    await immImg.scrollIntoViewIfNeeded();
    await expect.poll(() => immImg.evaluate((el) => (el as HTMLImageElement).naturalWidth),
      { timeout: 10_000 }).toBeGreaterThan(0);
    await expect(floorBoard.locator('.nk-egd-buff')).toHaveCount(stageBuffs.length);
    await expect(floorBoard.locator('.nk-egd-board__head, .nk-egd-pollchip')).toHaveCount(0);
    const floor1Stage = (season.floor_details ?? []).find((f) => f.floor === 1)!.stage1!;
    const floor1Summons = summonsOf(floor1Stage.monsters);
    expect(floor1Summons.length).toBeGreaterThan(0);
    await expect(floorBoard.locator('.nk-egd-mon > .nk-egd-mon__data > .nk-egd-summons .nk-egd-summon'))
      .toHaveCount(floor1Summons.length);
    await expect(floorBoard.locator('.nk-egd-mon > .nk-egd-mon__data > .nk-egd-summons .nk-egd-pollchip')).toHaveCount(0);
    await expect(floorBoard.locator('.nk-egd-floor__row--summons')).toHaveCount(0);
    await halfCards.nth(1).click();
    await expect(halfCards.nth(1)).toHaveAttribute('aria-selected', 'true');
    await expect(floorBoard).toHaveAttribute('aria-labelledby', 'egd-floor-half-tab-stage2');
    await expect(floorBoard.locator('.nk-egd-mon__name')).toHaveText(floorBossName(season, 1, 'stage2'));
    await page.locator('#egd-level-tab-floor-3').click();
    await page.locator('#egd-floor-half-tab-stage1').click();
    const floor3Stage = (season.floor_details ?? []).find((f) => f.floor === 3)!.stage1!;
    const floor3Summons = summonsOf(floor3Stage.monsters);
    const floor3Polled = pollutedSummons(floor3Stage.monsters);
    expect(floor3Polled.length, '污染关卡应有受污染的召唤物').toBeGreaterThan(0);
    expect(floor3Polled.length).toBeLessThan(floor3Summons.length);
    await expect(floorBoard.locator('.nk-egd-mon > .nk-egd-mon__data > .nk-egd-summons .nk-egd-summon'))
      .toHaveCount(floor3Summons.length);
    await expect(floorBoard.locator('.nk-egd-mon > .nk-egd-mon__data > .nk-egd-summons .nk-egd-pollchip'))
      .toHaveText(floor3Polled.map(summonBadge));
    await page.locator('#egd-level-tab-floor-4').click();
    await expect(page.locator('.nk-egd-nodecards[aria-label="半场"] [role="tab"]')).toHaveCount(stageNum);
    await page.locator('#egd-floor-half-tab-stage2').click();
    await expect(floorBoard.locator('.nk-egd-mon__name')).toHaveText(floorBossName(season, 4, 'stage2'));
    await expect(page.locator('.nk-egd-lvl')).not.toContainText(nodeBoss[2]);
    const floor4Targets = (season.floor_details ?? []).find((f) => f.floor === 4)!.targets!;
    const flatConditions = page.locator('#egd-season-rewards .nk-egd-season-flat__conditions .nk-egd-node');
    await expect(flatConditions).toHaveCount(floor4Targets.length);
    await expect(flatConditions.last()).toContainText(String(floor4Targets[floor4Targets.length - 1].param));
    const floor4Elems = await page.locator('.nk-egd-nodecards[aria-label="半场"] .nk-egd-nodecard__elems')
      .evaluateAll((els) => els.map((el) => el.innerHTML));
    const floor4Buffs: string[] = [];
    for (const key of ['stage1', 'stage2'] as const) {
      await page.locator(`#egd-floor-half-tab-${key}`).click();
      floor4Buffs.push(...await floorBoard.locator('.nk-egd-buff__name')
        .evaluateAll((els) => els.map((el) => el.textContent?.trim() || '')));
    }
    await page.locator('#egd-level-tab-tierce').click();
    const tierce = page.locator('#egd-level-panel .nk-egd-tierce');
    await expect(tierce).toBeVisible();
    const nodeTabs = tierce.locator('.nk-egd-nodecards[aria-label="星启节点"] [role="tab"]');
    await expect(nodeTabs).toHaveCount(nodeBoss.length);
    await expect(nodeTabs.locator('.nk-egd-nodecard__name')).toHaveText(
      tierceData.nodes!.map((nd) => `节点${CN_NUM[nd.idx - 1] ?? nd.idx}`),
    );
    await expect(nodeTabs.first()).toHaveAttribute('aria-selected', 'true');
    const cardBoxes = await nodeTabs.evaluateAll((els) => els.map((el) => {
      const r = el.getBoundingClientRect();
      return { y: Math.round(r.y), w: Math.round(r.width) };
    }));
    expect(new Set(cardBoxes.map((b) => b.y)).size).toBe(1);
    expect(new Set(cardBoxes.map((b) => b.w)).size).toBe(1);
    const cardFit = await tierce.locator('.nk-egd-nodecards').evaluate((el) => {
      const row = el.getBoundingClientRect();
      const cards = [...el.children] as HTMLElement[];
      return {
        rowScroll: el.scrollWidth - el.clientWidth,
        cardsSpill: Math.max(...cards.map((c) => c.scrollWidth - c.clientWidth)),
        lastRight: Math.round(cards[cards.length - 1].getBoundingClientRect().right - row.right),
      };
    });
    expect(cardFit.rowScroll).toBeLessThanOrEqual(1);
    expect(cardFit.cardsSpill).toBeLessThanOrEqual(1);
    expect(cardFit.lastRight).toBeLessThanOrEqual(1);
    await expect(nodeTabs.nth(0).locator('.nk-egd-nodecard__row')).toHaveCount(2);
    await expect(nodeTabs.nth(0).locator('.nk-egd-nodecard__label')).toHaveText(['推荐属性', '等级']);
    const tierceNodes = tierceData.nodes!;
    await expect(nodeTabs.nth(0).locator('.nk-egd-nodecard__elems .nk-egd-elem'))
      .toHaveCount(tierceNodes[0].damage!.length);
    for (const nd of tierceNodes) {
      await expect(nodeTabs.nth(nd.idx - 1).locator('.nk-egd-nodecard__val')).toHaveText(String(nd.level));
    }
    const nodeBossImgs = nodeTabs.locator('.nk-egd-nodecard__img');
    await expect(nodeBossImgs).toHaveCount(tierceNodes.length);
    for (const nd of tierceNodes) {
      await expect(nodeBossImgs.nth(nd.idx - 1)).toHaveAttribute('src', new RegExp(lastWaveMonster(nd).icon!));
    }
    for (let i = 0; i < tierceNodes.length; i += 1) {
      await nodeTabs.nth(i).scrollIntoViewIfNeeded();
      await expect.poll(
        async () => nodeBossImgs.nth(i).evaluate((el) => (el as HTMLImageElement).naturalWidth),
        { timeout: 15_000 },
      ).toBeGreaterThan(0);
    }
    const board = tierce.locator('.nk-egd-board');
    await expect(board).toHaveCount(1);
    await expect(board.locator('.nk-egd-tierce__nodezh')).toHaveCount(0);
    await expect(board.locator('.nk-egd-tierce__nodefrom')).toHaveCount(0);
    await expect(board.locator('.nk-egd-board__head, .nk-egd-floor__head .nk-egd-pollchip')).toHaveCount(0);
    await expect(board.locator('.nk-egd-mon__art .nk-egd-pollchip')).toHaveCount(0);
    await expect(board).toHaveAttribute('aria-labelledby', 'egd-tierce-node-tab-1');
    await expect(board.locator('.nk-egd-mon__name')).toHaveText(nodeBoss[0]);
    await expect(board.locator('.nk-egd-tierce__damagerow')).toHaveCount(0);
    await expect(board.locator('.nk-egd-floor__row')).toHaveCount(1);
    await expect(board.locator('.nk-egd-floor__row--mons')).toHaveCount(1);
    await expect(board.locator('.nk-egd-floor__moncount')).toHaveCount(0);
    const node1Summons = summonsOf(tierceNodes[0].monsters);
    expect(node1Summons.length).toBeGreaterThan(0);
    const bossCard = board.locator('.nk-egd-mon');
    await expect(bossCard).toHaveCount(1);
    await expect(board.locator('.nk-egd-mon > .nk-egd-mon__data > .nk-egd-summons')).toHaveCount(1);
    await expect(bossCard.locator('.nk-egd-summons__label')).toHaveText('召唤物');
    await expect(bossCard.locator('.nk-egd-summon')).toHaveCount(node1Summons.length);
    await expect(bossCard.locator('.nk-egd-summon__name')).toHaveText(node1Summons.map((s) => s.name));
    const node1Polled = pollutedSummons(tierceNodes[0].monsters);
    expect(node1Polled.length, '同批召唤物里只有一部分受污染').toBeGreaterThan(0);
    expect(node1Polled.length).toBeLessThan(node1Summons.length);
    await expect(bossCard.locator('.nk-egd-pollchip')).toHaveCount(node1Polled.length);
    await expect(bossCard.locator('.nk-egd-pollchip')).toHaveText(node1Polled.map(summonBadge));
    await expect(board.locator('.nk-egd-floor__row--summons')).toHaveCount(0);
    const cardSummons = board.locator('.nk-egd-mon > .nk-egd-mon__data > .nk-egd-summons');
    expect(await computedNumber(cardSummons, 'border-top-width'), '卡内召唤物块应有上发丝线').toBe(1);
    expect(await computedNumber(cardSummons, 'padding-top'), '卡内召唤物块应有上内距').toBeGreaterThan(0);
    const scale = await page.evaluate(() => {
      const fs = (sel: string) => {
        const el = document.querySelector(sel);
        return el ? parseFloat(getComputedStyle(el).fontSize) : 0;
      };
      return {
        card: fs('.nk-egd-nodecard__name'),
        groupTitle: fs('.nk-egd-board .nk-egd-group__title'),
        monsTitle: fs('.nk-egd-board .nk-egd-floor__row--mons > .nk-egd-floor__label'),
        prose: fs('.nk-egd-board .nk-egd-trait__desc'),
        rowLabel: fs('.nk-egd-board .nk-egd-mon__label'),
      };
    });
    expect(scale.monsTitle, '敌方配置标题与区块标题同档').toBe(scale.groupTitle);
    await page.setViewportSize({ width: 390, height: 844 });
    const narrowScale = await page.evaluate(() => {
      const fs = (sel: string) => {
        const el = document.querySelector(sel);
        return el ? parseFloat(getComputedStyle(el).fontSize) : 0;
      };
      return {
        groupTitle: fs('.nk-egd-board .nk-egd-group__title'),
        monsTitle: fs('.nk-egd-board .nk-egd-floor__row--mons > .nk-egd-floor__label'),
        rowLabel: fs('.nk-egd-board .nk-egd-mon__label'),
        prose: fs('.nk-egd-board .nk-egd-trait__desc'),
      };
    });
    expect(narrowScale.monsTitle, '手机档敌方配置标题与区块标题同档').toBe(narrowScale.groupTitle);
    expect(narrowScale.groupTitle, '手机档区块标题必须高于卡片内行首标签').toBeGreaterThan(narrowScale.rowLabel + 0.5);
    expect(narrowScale.prose, '手机档正文必须高于卡片内行首标签').toBeGreaterThan(narrowScale.rowLabel + 0.5);
    expect(narrowScale.prose, '手机档正文必须高于区块标题').toBeGreaterThan(narrowScale.groupTitle + 0.5);
    await page.setViewportSize({ width: 1280, height: 720 });
    for (const [name, lower, higher] of [
      ['区块标题 > 卡片内行首标签', scale.rowLabel, scale.groupTitle],
      ['正文 > 卡片内行首标签', scale.rowLabel, scale.prose],
      ['卡片节点号 > 卡片内行首标签', scale.rowLabel, scale.card],
    ] as const) {
      expect(higher, `${name}（${higher} vs ${lower}）`).toBeGreaterThan(lower + 0.5);
    }
    const monLayout = await board.locator('.nk-egd-mon').first().evaluate((card) => {
      const art = card.querySelector('.nk-egd-mon__art') as HTMLElement;
      const data = card.querySelector('.nk-egd-mon__data') as HTMLElement;
      const img = card.querySelector('.nk-egd-mon__img') as HTMLImageElement;
      const a = art.getBoundingClientRect();
      const d = data.getBoundingClientRect();
      const i = img.getBoundingClientRect();
      const cs = getComputedStyle(card);
      return {
        cardDisplay: cs.display,
        artRight: Math.round(a.right),
        dataLeft: Math.round(d.left),
        artTop: Math.round(a.top),
        dataTop: Math.round(d.top),
        imgW: Math.round(i.width),
        imgH: Math.round(i.height),
        radius: parseFloat(getComputedStyle(img).borderTopLeftRadius) || 0,
      };
    });
    expect(monLayout.cardDisplay, '敌方卡应为左右两列网格').toBe('grid');
    expect(monLayout.dataLeft, '数据列应在立绘列右侧').toBeGreaterThanOrEqual(monLayout.artRight);
    expect(monLayout.dataTop, '两列顶边应对齐').toBe(monLayout.artTop);
    expect(monLayout.imgH, '立绘应为竖版原比例（高 > 宽）').toBeGreaterThan(monLayout.imgW);
    expect(monLayout.radius, '立绘不应再做圆形裁切').toBe(0);
    const colFit = await board.locator('.nk-egd-mon').first().evaluate((card) => {
      const art = card.querySelector('.nk-egd-mon__art') as HTMLElement;
      const data = card.querySelector('.nk-egd-mon__data') as HTMLElement;
      const cs = getComputedStyle(card);
      const inner = card.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const a = art.getBoundingClientRect();
      const d = data.getBoundingClientRect();
      return {
        sum: Math.round(a.width + d.width),
        inner: Math.round(inner),
        spill: Math.max(art.scrollWidth - art.clientWidth, data.scrollWidth - data.clientWidth),
      };
    });
    expect(Math.abs(colFit.sum - colFit.inner), '两列宽度应占满卡内容宽').toBeLessThanOrEqual(20);
    expect(colFit.spill, '两列均不应横向溢出').toBeLessThanOrEqual(1);
    const monsHeading = await board.locator('.nk-egd-floor__row--mons').evaluate((row) => {
      const label = row.querySelector('.nk-egd-floor__label') as HTMLElement;
      const wrap = row.querySelector('.nk-egd-floor__monswrap') as HTMLElement;
      const cs = getComputedStyle(row);
      const l = label.getBoundingClientRect();
      const w = wrap.getBoundingClientRect();
      const r = row.getBoundingClientRect();
      const contentW = r.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      return {
        stacked: Math.round(w.top) >= Math.round(l.bottom),
        sameLeft: Math.abs(Math.round(w.left) - Math.round(l.left)) <= 1,
        fullWidth: Math.abs(Math.round(w.width) - Math.round(contentW)) <= 1,
      };
    });
    expect(monsHeading.stacked, '敌方卡组应排在标题下方').toBe(true);
    expect(monsHeading.sameLeft, '敌方卡组左缘应与标题齐平').toBe(true);
    expect(monsHeading.fullWidth, '敌方卡组应占满行内容宽').toBe(true);
    expect(await fontPx(board.locator('.nk-egd-trait__desc').first()))
      .toBe(await fontPx(board.locator('.nk-egd-buff__desc').first()));
    await expect(page.locator('.nk-egd-buffzone .nk-egd-floor__buffhead')).toHaveText(tierceData.nodes![0].buff!.name);
    await expect(page.locator('.nk-egd-floor__bufflabel')).toHaveCount(0);
    await expect(board.locator('.nk-egd-group__title')).toHaveText(['终焉公理']);
    await expect(board.locator('.nk-egd-buff')).toHaveCount(stageBuffs.length);
    await expect(board.locator('.nk-egd-pilltabs')).toHaveCount(0);
    await expect(board.locator('.nk-egd-traits')).toHaveCount(0);
    const tierceGuideSec = board.locator('.nk-egd-mon__data > .nk-egd-guide');
    await expect(tierceGuideSec).toHaveCount(1);
    const traitItems = tierceGuideSec.locator('.nk-egd-trait');
    await expect(traitItems).toHaveCount(stageTraits.length);
    await expect(traitItems.locator('.nk-egd-trait__name')).toHaveText(stageTraits.map((t) => t.name));
    await expect(traitItems.first()).toContainText(`${stageTraits[0].param_list![0] * 100}%`);
    await expect(traitItems.first()).toContainText(`${stageTraits[0].param_list![1] * 100}%`);
    expect(await computedNumber(tierceGuideSec, 'border-top-width'), '卡内分区应有上发丝线').toBe(1);
    expect(await computedNumber(tierceGuideSec, 'padding-top'), '卡内分区应有上内距').toBeGreaterThan(0);
    expect(await computedNumber(tierceGuideSec, 'border-top-left-radius'), '卡内分区不应套圆角盒子').toBe(0);
    expect(await tierceGuideSec.evaluate((el) => getComputedStyle(el).backgroundColor), '卡内分区不应再填充')
      .toBe('rgba(0, 0, 0, 0)');
    const sectionBorders = await tierceGuideSec.evaluate((el) => {
      const cs = getComputedStyle(el);
      return [cs.borderTopWidth, cs.borderLeftWidth, cs.borderLeftStyle];
    });
    expect(sectionBorders[0], '分区只有上发丝线').toBe('1px');
    expect(sectionBorders[1], '分区左沿不得加宽为竖条').toBe('0px');
    expect(sectionBorders[2]).toBe('none');
    const hairlines = await page.evaluate(() => {
      const cs = (s: string): CSSStyleDeclaration => getComputedStyle(document.querySelector(s) as Element);
      return [cs('.nk-egd-guide').borderTopColor, cs('.nk-egd-mon__skills').borderTopColor,
        cs('.nk-egd-summons').borderTopColor];
    });
    expect(hairlines[0], '分区发丝线与「技能」同一支线').toBe(hairlines[1]);
    expect(hairlines[0], '分区发丝线与「召唤物」同一支线').toBe(hairlines[2]);
    const sectionGap = await computedNumber(tierceGuideSec, 'row-gap');
    const itemGap = await computedNumber(traitItems.first(), 'row-gap');
    expect(sectionGap, '分区内条目间距须大于条目内名行与正文的间距').toBeGreaterThan(itemGap);
    expect(await computedNumber(traitItems.first(), 'padding-top'), '条目内距归分区承担').toBe(0);
    const descRatio = await traitItems.first().locator('.nk-egd-trait__desc').evaluate((el) => {
      const c = getComputedStyle(el);
      return parseFloat(c.lineHeight) / parseFloat(c.fontSize);
    });
    expect(descRatio, '正文档行高不得缩水').toBeGreaterThan(1.6);
    const monsSpacing = await board.evaluate((el) => {
      const body = el.querySelector('.nk-egd-board__body') as HTMLElement;
      const stage = body.querySelector('.nk-egd-floor__stage') as HTMLElement;
      const grid = stage.querySelector('.nk-egd-mons') as HTMLElement;
      const wrap = stage.querySelector('.nk-egd-floor__monswrap') as HTMLElement;
      const monsRow = stage.querySelector('.nk-egd-floor__row--mons') as HTMLElement;
      const last = stage.lastElementChild as HTMLElement;
      const prev = stage.previousElementSibling as HTMLElement | null;
      return {
        gap: parseFloat(getComputedStyle(body).rowGap) || 0,
        gridMargin: parseFloat(getComputedStyle(grid).marginBottom) || 0,
        wrapTail: Math.round(wrap.getBoundingClientRect().bottom - grid.getBoundingClientRect().bottom),
        belowWrap: Math.round(monsRow.getBoundingClientRect().bottom - wrap.getBoundingClientRect().bottom),
        lastIsMons: last === monsRow,
        tail: Math.round(stage.getBoundingClientRect().bottom - last.getBoundingClientRect().bottom),
        stageIsLast: !stage.nextElementSibling,
        prevGap: prev ? Math.round(stage.getBoundingClientRect().top - prev.getBoundingClientRect().bottom) : -1,
      };
    });
    expect(monsSpacing.gap, '看板体应声明区块间距').toBeGreaterThan(0);
    expect(monsSpacing.gridMargin, '末波敌方网格下外边距应归零').toBe(0);
    expect(monsSpacing.wrapTail, '敌方卡组下方不应有余白').toBe(0);
    expect(monsSpacing.belowWrap, '敌方配置块下方不应有余白').toBe(0);
    expect(monsSpacing.lastIsMons, '敌方配置应重新成为场次块末行').toBe(true);
    expect(monsSpacing.tail, '场次块末行下方不应有余白').toBe(0);
    expect(monsSpacing.stageIsLast, '敌方配置应为看板体末块（赛季增益在其之前）').toBe(true);
    expect(monsSpacing.prevGap, '赛季增益与敌方配置的间距 = 看板体 gap').toBe(monsSpacing.gap);
    const node1Elems = await nodeTabs.nth(0).locator('.nk-egd-nodecard__elems').innerHTML();
    expect(node1Elems).toBe(floor4Elems[0]);
    await expect(board.locator('.nk-egd-buff__name')).toHaveText(floor4Buffs.slice(0, stageBuffs.length));
    await nodeTabs.nth(1).click();
    await expect(nodeTabs.nth(1)).toHaveAttribute('aria-selected', 'true');
    await expect(board).toHaveAttribute('aria-labelledby', 'egd-tierce-node-tab-2');
    await expect(board.locator('.nk-egd-mon__name')).toHaveText(nodeBoss[1]);
    await expect(board.locator('.nk-egd-buff__name'))
      .toHaveText(floor4Buffs.slice(stageBuffs.length, stageBuffs.length * 2));
    await nodeTabs.nth(2).click();
    await expect(nodeTabs.nth(2)).toHaveAttribute('aria-selected', 'true');
    await expect(board).toHaveAttribute('aria-labelledby', 'egd-tierce-node-tab-3');
    await expect(board).toContainText(nodeBoss[2]);
    await expect(page.locator('.nk-egd-buffzone .nk-egd-floor__buffhead')).toHaveText(tierceData.nodes![2].buff!.name);
    await expect(board.locator('.nk-egd-trait__name'))
      .toHaveText(stageGuide(season, tierceData.nodes![2])!.traits!.map((t) => t.name));
    const node3Elems = await nodeTabs.nth(2).locator('.nk-egd-nodecard__elems').innerHTML();
    expect(node3Elems.length).toBeGreaterThan(0);
    expect(node3Elems).not.toBe(node1Elems);
    const node3Buffs = await board.locator('.nk-egd-buff__name')
      .evaluateAll((els) => els.map((el) => el.textContent?.trim() || ''));
    const tierceBuffs = season.buff_groups!.tierce;
    expect(node3Buffs).toHaveLength(tierceBuffs.length);
    expect(node3Buffs).not.toEqual(floor4Buffs.slice(0, stageBuffs.length));
    expect(node3Buffs).toEqual(tierceBuffs.map((b) => b.name));
    await expect(tierce.locator('.nk-egd-group__title')).toHaveCount(1);
    await expect(tierce.locator('.nk-egd-group__title')).toHaveText(['终焉公理']);
    await expect(tierce.locator('.nk-egd-tierce__stats')).toHaveCount(0);
    await expect(tierce.locator('.nk-egd-head')).toHaveCount(0);
    await expect(tierce.locator('.nk-egd-lvl__rules')).toHaveCount(0);
    const tierceGroup = seasonRewardGroups(page).last();
    await expect(tierceGroup.locator('.nk-egd-season-group__title')).toHaveText('星启模式');
    await expect(tierceGroup.locator('.nk-egd-clear')).toHaveCount(1);
    const tierceTargets = tierceData.targets!.filter((t) => !t.prism);
    const prismTarget = tierceData.targets!.find((t) => t.prism)!;
    const tierRows = tierceGroup.locator('.nk-egd-tiers li');
    await expect(tierceGroup.locator('.nk-egd-tiers .nk-egd-node__type')).toHaveCount(0);
    await expect(tierceGroup.locator('.nk-egd-tiers .nk-egd-tier__brace')).toHaveCount(0);
    await expect(tierceGroup.locator('.nk-egd-tiers .nk-egd-tier__lead')).toHaveCount(tierceData.targets!.length);
    await expect(tierceGroup.locator('.nk-egd-tiers .nk-egd-node')).toHaveCount(tierceData.targets!.length);
    await expect(tierRows.nth(tierceTargets.length - 1).locator('.nk-egd-node__text'))
      .toContainText(String(tierceTargets[tierceTargets.length - 1].param));
    await expect(tierRows).toHaveCount(tierceTargets.length + 1);
    await expect(tierRows.last().locator('.nk-egd-tier__badge')).toHaveText('棱彩星');
    await expect(tierRows.last().locator('.nk-egd-node__text')).toContainText(String(prismTarget.param));
    await expect(tierRows.last().locator('.nk-egd-reward__name'))
      .toHaveText(rewardNames(tierceData.prism_reward!, itemNameMap()));
    await expect(tierceGroup.locator('.nk-egd-season-group__rewards .nk-egd-reward__name'))
      .toHaveCount(tierceData.rewards!.length);
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/endgame/boss/3020：节点卡片窄屏（375px）一行三卡 + 卡内上下排版', { tag: ['@visual-detail', '@viewport-pinned'] }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/endgame/boss/3020');
    const season = seasonData('maze_boss.json', '3020');
    await page.locator('#egd-level-tab-floor-1').click();
    const floorCards = await page.locator('.nk-egd-nodecards[aria-label="半场"]').evaluate((el) => {
      const items = [...el.children] as HTMLElement[];
      return {
        scroll: el.scrollWidth - el.clientWidth,
        rows: new Set(items.map((c) => Math.round(c.getBoundingClientRect().y))).size,
        dir: getComputedStyle(items[0]).flexDirection,
      };
    });
    expect(floorCards.scroll).toBeLessThanOrEqual(1);
    expect(floorCards.rows).toBe(1);
    expect(floorCards.dir).toBe('column');
    await page.locator('#egd-level-tab-tierce').click();
    const cards = page.locator('.nk-egd-nodecards');
    const card = page.locator('.nk-egd-nodecard').first();
    await expect(card.locator('.nk-egd-nodecard__elems .nk-egd-elem'))
      .toHaveCount(season.tierce!.nodes![0].damage!.length);
    await expect(card).toHaveCSS('flex-direction', 'column');
    const narrow = await cards.evaluate((el) => {
      const row = el.getBoundingClientRect();
      const items = [...el.children] as HTMLElement[];
      return {
        rowScroll: el.scrollWidth - el.clientWidth,
        cardsSpill: Math.max(...items.map((c) => c.scrollWidth - c.clientWidth)),
        lastRight: Math.round(items[items.length - 1].getBoundingClientRect().right - row.right),
        rows: new Set(items.map((c) => Math.round(c.getBoundingClientRect().y))).size,
      };
    });
    expect(narrow.rowScroll).toBeLessThanOrEqual(1);
    expect(narrow.cardsSpill).toBeLessThanOrEqual(1);
    expect(narrow.lastRight).toBeLessThanOrEqual(1);
    expect(narrow.rows).toBe(1);
    const stacked = await card.evaluate((el) => {
      const fig = el.querySelector('.nk-egd-nodecard__fig')!.getBoundingClientRect();
      const body = el.querySelector('.nk-egd-nodecard__body')!.getBoundingClientRect();
      return { figBottom: Math.round(fig.bottom), bodyTop: Math.round(body.top) };
    });
    expect(stacked.figBottom).toBeLessThanOrEqual(stacked.bodyTop);
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/endgame/boss/3021：底部相邻赛季导航窄屏（375px）维持一行两栏', { tag: ['@visual-detail', '@viewport-pinned'] }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/endgame/boss/3021');
    const seasonIds = Object.values(readJson<Record<string, { id: string }>>('public/data/cn/maze_boss.catalog.json'))
      .map((e) => e.id)
      .sort((a, b) => Number(a) - Number(b));
    const at = seasonIds.indexOf('3021');
    expect(at, '目录数据里应存在 3021 且它两侧都有相邻赛季').toBeGreaterThan(0);
    const nav = page.locator('.nk-egd-nav');
    await expect(nav).toBeVisible();
    await expect(nav.locator('.nk-egd-nav__item')).toHaveCount(2);
    await expect(nav.locator('.nk-egd-nav__item--prev .nk-egd-nav__id')).toHaveText(seasonIds[at - 1]);
    await expect(nav.locator('.nk-egd-nav__item--next .nk-egd-nav__id')).toHaveText(seasonIds[at + 1]);
    const navGap = await nav.evaluate((el) => parseFloat(getComputedStyle(el).columnGap) || 0);
    expect(navGap, '栏间距必须由导航容器自己声明（不得写死断言值）').toBeGreaterThan(0);
    const narrow = await nav.evaluate((el) => {
      const items = [...el.children] as HTMLElement[];
      const rects = items.map((i) => i.getBoundingClientRect());
      const dir = el.querySelector('.nk-egd-nav__dir') as HTMLElement;
      return {
        rows: new Set(rects.map((r) => Math.round(r.y))).size,
        gap: Math.round(rects[1].left - rects[0].right),
        itemsSpill: Math.max(...items.map((i) => i.scrollWidth - i.clientWidth)),
        dirHeight: dir.getBoundingClientRect().height,
      };
    });
    expect(narrow.rows).toBe(1);
    expect(narrow.gap).toBe(Math.round(navGap));
    expect(narrow.itemsSpill).toBeLessThanOrEqual(1);
    expect(narrow.dirHeight).toBeLessThan(24);
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/endgame/boss/3020：统一压缩（共享头 + 完整阶梯）+ 星启分组 + 窄屏堆叠', { tag: ['@visual-detail', '@viewport-pinned'] }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/endgame/boss/3020');
    await page.locator('#egd-level-tab-floor-1').click();
    const floorBranch = await page.evaluate(() => {
      const panel = document.querySelector('#egd-level-panel') as HTMLElement;
      const first = panel.firstElementChild as HTMLElement;
      return {
        gap: first.getBoundingClientRect().top - document.querySelector('.nk-egd-tabs')!.getBoundingClientRect().bottom,
        panelPadTop: parseFloat(getComputedStyle(panel).paddingTop) || 0,
      };
    });
    await page.locator('#egd-level-tab-tierce').click();
    await expect(page.locator('#egd-level-panel .nk-egd-head')).toHaveCount(0);
    await expect(page.locator('#egd-level-panel .nk-egd-lvl__rules')).toHaveCount(0);
    const tierceData = seasonData('maze_boss.json', '3020').tierce!;
    const groups = seasonRewardGroups(page);
    await expect(groups).toHaveCount(1);
    const tierceGroup = groups.last();
    await expect(tierceGroup.locator('.nk-egd-season-group__title')).toHaveText('星启模式');
    await expect(tierceGroup.locator('.nk-egd-clear')).toHaveCount(1);
    await expect(tierceGroup.locator('.nk-egd-tiers .nk-egd-node')).toHaveCount(tierceData.targets!.length);
    await expect(tierceGroup.locator('.nk-egd-tiers li')).toHaveCount(tierceData.targets!.length);
    await expect(tierceGroup.locator('.nk-egd-season-group__rewards .nk-egd-reward__name'))
      .toHaveCount(tierceData.rewards!.length);
    await expect(tierceGroup.locator('.nk-egd-node').first()).toHaveCSS('border-bottom-width', '0px');
    const desktop = await page.evaluate(() => {
      const box = (el: Element) => el.getBoundingClientRect().toJSON() as DOMRect;
      const panel = document.querySelector('#egd-level-panel') as HTMLElement;
      const season = document.querySelector('#egd-season-rewards') as HTMLElement;
      const tierce = season.querySelector('.nk-egd-season-group:last-child') as HTMLElement;
      return {
        panel: box(panel),
        season: box(season),
        wrap: box(panel.firstElementChild as HTMLElement),
        tabs: box(document.querySelector('.nk-egd-tabs') as HTMLElement),
        clear: box(tierce.querySelector('.nk-egd-season-group__clear') as HTMLElement),
        condition: box(tierce.querySelector('.nk-egd-clear') as HTMLElement),
        rewards: box(tierce.querySelector('.nk-egd-season-group__rewards') as HTMLElement),
        stars: box(tierce.querySelector('.nk-egd-season-group__stars') as HTMLElement),
        panelPadTop: parseFloat(getComputedStyle(panel).paddingTop) || 0,
      };
    });
    expect(desktop.panelPadTop, '面板级 padding-top 必须 >0（它是本留白的唯一来源）').toBeGreaterThan(0);
    for (const [branch, gap] of [
      ['层 tab', floorBranch.gap],
      ['星启 tab', desktop.wrap.top - desktop.tabs.bottom],
    ] as const) {
      expect(
        Math.abs(gap - desktop.panelPadTop),
        `${branch} 分支的留白 ${gap.toFixed(1)}px 应等于面板 padding-top ${desktop.panelPadTop}px`,
      ).toBeLessThanOrEqual(1);
    }
    expect(floorBranch.panelPadTop, '两条分支必须共用同一面板内距').toBe(desktop.panelPadTop);
    expect(desktop.season.top, '本期奖励板块应在关卡面板之后').toBeGreaterThanOrEqual(desktop.panel.bottom - 1);
    expect(Math.round(desktop.condition.y), '通关条件与通关奖励应并排（同一行顶边）').toBe(Math.round(desktop.rewards.y));
    expect(desktop.condition.right, '通关条件在左、通关奖励在右').toBeLessThanOrEqual(desktop.rewards.x + 1);
    expect(desktop.stars.y, '星级列表应在通关条件 / 奖励行之下').toBeGreaterThanOrEqual(desktop.clear.bottom - 1);
    const tierCols = await tierceGroup.locator('.nk-egd-tiers .nk-egd-tier').evaluateAll((rows) => rows.map((row) => ({
      cond: Math.round((row.querySelector('.nk-egd-tier__cond') as HTMLElement).getBoundingClientRect().left),
      reward: Math.round((row.querySelector('.nk-egd-tier__reward') as HTMLElement).getBoundingClientRect().left),
    })));
    expect(tierCols.length).toBeGreaterThan(1);
    expect(
      new Set(tierCols.map((r) => r.cond)).size,
      '星级奖励各行必须共用同一条条件列左基准（棱彩星行的 badge 更窄不得内缩）',
    ).toBe(1);
    expect(
      new Set(tierCols.map((r) => r.reward)).size,
      '星级奖励各行必须共用同一条奖励列左基准',
    ).toBe(1);
    await page.setViewportSize({ width: 390, height: 844 });
    const narrow = await page.evaluate(() => {
      const box = (el: Element) => el.getBoundingClientRect().toJSON() as DOMRect;
      const tierce = document.querySelector('#egd-season-rewards .nk-egd-season-group:last-child') as HTMLElement;
      return {
        clear: box(tierce.querySelector('.nk-egd-season-group__clear') as HTMLElement),
        condition: box(tierce.querySelector('.nk-egd-clear') as HTMLElement),
        rewards: box(tierce.querySelector('.nk-egd-season-group__rewards') as HTMLElement),
        stars: box(tierce.querySelector('.nk-egd-season-group__stars') as HTMLElement),
      };
    });
    expect(Math.round(narrow.condition.x)).toBe(Math.round(narrow.rewards.x));
    expect(narrow.rewards.y, '窄屏通关条件在上、通关奖励在下').toBeGreaterThanOrEqual(narrow.condition.bottom - 1);
    expect(narrow.stars.y, '窄屏星级列表在通关条件 / 奖励行之下').toBeGreaterThanOrEqual(narrow.clear.bottom - 1);
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/endgame/boss/3020：层 tab 单看板 + 面板底部通关条件（奖励在页面底部）与字号五档与间距节奏', { tag: ['@visual-detail', '@viewport-pinned'] }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/endgame/boss/3020');
    await expect(page.locator('.nk-egd-tabs [role="tab"]').first()).toBeVisible();
    await page.locator('#egd-level-tab-floor-1').click();
    await expect(page.locator('.nk-egd-lvl__head')).toHaveCount(0);
    await expect(page.locator('#egd-level-panel .nk-egd-head')).toHaveCount(0);
    await expect(page.locator('#egd-level-panel .nk-egd-lvl__rules')).toHaveCount(0);
    const stack = await page.evaluate(() => {
      const box = (sel: string) => (document.querySelector(sel) as HTMLElement).getBoundingClientRect().toJSON() as DOMRect;
      return {
        cards: box('#egd-level-panel .nk-egd-nodecards'),
        board: box('#egd-level-panel .nk-egd-board'),
      };
    });
    expect(stack.board.y).toBeGreaterThanOrEqual(stack.cards.bottom - 1);
    await expect(page.locator('#egd-season-rewards .nk-egd-tiers .nk-egd-node').first()).toHaveCSS('border-bottom-width', '0px');
    const cardBoxes = await page.locator('.nk-egd-nodecards[aria-label="半场"] [role="tab"]').evaluateAll((els) => els.map((el) => {
      const r = el.getBoundingClientRect();
      return { y: Math.round(r.y), w: Math.round(r.width) };
    }));
    expect(new Set(cardBoxes.map((b) => b.y)).size).toBe(1);
    expect(new Set(cardBoxes.map((b) => b.w)).size).toBe(1);
    const board = page.locator('#egd-floor-board');
    await expect(board).toHaveCount(1);
    await expect(board).toHaveCSS('display', 'flex');
    await expect(board.locator('.nk-egd-group__title')).toHaveText(['终焉公理']);
    await expect(board.locator('.nk-egd-group__label')).toHaveCount(0);
    const boardBlocks = await board.locator('.nk-egd-board__body').evaluate((el) =>
      [...el.children].map((c) => (c as HTMLElement).className.split(' ')[0]));
    expect(boardBlocks).toEqual(['nk-egd-group', 'nk-egd-floor__stage']);
    const cardBlocks = await board.locator('.nk-egd-mon__data').first().evaluate((el) =>
      [...el.children].map((c) => (c as HTMLElement).className.split(' ')[0]));
    expect(cardBlocks).toEqual([
      'nk-egd-mon__meta', 'nk-egd-mon__rows',
      'nk-egd-guide', 'nk-egd-phase', 'nk-egd-mon__skills', 'nk-egd-summons',
    ]);
    await expect(board.locator('.nk-egd-floor__stagelabel')).toHaveCount(0);
    await expect(board.locator('.nk-egd-floor__moncount')).toHaveCount(0);
    const monsHeading = await board.locator('.nk-egd-floor__row--mons').evaluate((row) => {
      const label = row.querySelector('.nk-egd-floor__label') as HTMLElement;
      const wrap = row.querySelector('.nk-egd-floor__monswrap') as HTMLElement;
      const cs = getComputedStyle(row);
      const l = label.getBoundingClientRect();
      const w = wrap.getBoundingClientRect();
      const r = row.getBoundingClientRect();
      const contentW = r.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      return {
        stacked: Math.round(w.top) >= Math.round(l.bottom),
        sameLeft: Math.abs(Math.round(w.left) - Math.round(l.left)) <= 1,
        fullWidth: Math.abs(Math.round(w.width) - Math.round(contentW)) <= 1,
      };
    });
    expect(monsHeading.stacked, '敌方卡组应排在标题下方').toBe(true);
    expect(monsHeading.sameLeft, '敌方卡组左缘应与标题齐平').toBe(true);
    expect(monsHeading.fullWidth, '敌方卡组应占满行内容宽').toBe(true);
    const egIndent = await readTokenPx(page, '--eg-indent', '.nk-egd');
    const boardBody = page.locator('.nk-egd-board__body');
    await expectTokenNumber(boardBody, 'padding-left', egIndent, '层看板体缩进');
    expect(await boardBody.evaluate((el) => parseFloat(getComputedStyle(el, '::before').width) || 0),
      '层看板体的层级竖轨应归零（缩进保留）').toBe(0);
    const tier = {
      cardName: await fontPx(page.locator('.nk-egd-buff__name').first()),
      traitName: await fontPx(page.locator('.nk-egd-trait__name').first()),
      phaseName: await fontPx(page.locator('.nk-egd-phase__name').first()),
      label: await fontPx(page.locator('.nk-egd-floor__label').first()),
      desc: await fontPx(page.locator('.nk-egd-buff__desc').first()),
      guideLabel: await fontPx(page.locator('.nk-egd-guide__label').first()),
      summonsLabel: await fontPx(page.locator('.nk-egd-summons__label').first()),
    };
    expect(tier.cardName, '赛季增益 / 首领特性标题同档').toBe(tier.traitName);
    expect(tier.phaseName, '阶段名与首领特性名同档（都是读者要扫的机制名）').toBe(tier.traitName);
    expect(tier.guideLabel, '首领机制标签与召唤物标签同档').toBe(tier.summonsLabel);
    expect(tier.cardName).toBeGreaterThan(tier.desc + 0.5);
    expect(tier.desc).toBeGreaterThan(tier.label + 0.5);
    const padAndGap = await page.evaluate(() => {
      const cs = (s: string): CSSStyleDeclaration => getComputedStyle(document.querySelector(s) as Element);
      return {
        buffPad: [cs('.nk-egd-buff').paddingTop, cs('.nk-egd-buff').paddingLeft],
        guidePad: [cs('.nk-egd-guide').paddingTop, cs('.nk-egd-guide').paddingLeft],
        traitPad: [cs('.nk-egd-trait').paddingTop, cs('.nk-egd-trait').paddingLeft],
        skillsPad: [cs('.nk-egd-mon__skills').paddingTop, cs('.nk-egd-mon__skills').paddingLeft],
        buffsGap: parseFloat(cs('.nk-egd-buffs').rowGap) || 0,
        guideGap: parseFloat(cs('.nk-egd-guide').rowGap) || 0,
        descLh: parseFloat(cs('.nk-egd-trait__desc').lineHeight),
        descFs: parseFloat(cs('.nk-egd-trait__desc').fontSize),
      };
    });
    expect(padAndGap.guidePad, '卡内分区与「技能」同一套内距（上内距 + 左右归卡）').toEqual(padAndGap.skillsPad);
    expect(padAndGap.traitPad, '条目内距归分区承担').toEqual(['0px', '0px']); // e2e-literal-ok: 条目内距归分区承担 ⇒ 0px 是语义即值的定义性契约（非可漂移设计值）
    expect(padAndGap.buffsGap).toBeGreaterThan(0);
    expect(padAndGap.guideGap).toBeGreaterThan(0);
    expect(padAndGap.descLh, '正文档行高不得缩水（≥1.5 倍字号）').toBeGreaterThanOrEqual(padAndGap.descFs * 1.5);
    const desktopMonLabel = await fontPx(page.locator('.nk-egd-mon__label').first());
    expect(desktopMonLabel).toBeGreaterThan(0);
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(board).toHaveCSS('display', 'flex');
    const mobileMonLabel = await fontPx(page.locator('.nk-egd-mon__label').first());
    expect(mobileMonLabel, `手机档 ${mobileMonLabel} 不得小于桌面档 ${desktopMonLabel}`)
      .toBeGreaterThanOrEqual(desktopMonLabel);
    const mobileCards = await page.locator('.nk-egd-nodecards[aria-label="半场"]').evaluate((el) => {
      const items = [...el.children] as HTMLElement[];
      return {
        scroll: el.scrollWidth - el.clientWidth,
        rows: new Set(items.map((c) => Math.round(c.getBoundingClientRect().y))).size,
        dir: getComputedStyle(items[0]).flexDirection,
      };
    });
    expect(mobileCards.scroll).toBeLessThanOrEqual(1);
    expect(mobileCards.rows).toBe(1);
    expect(mobileCards.dir).toBe('column');
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/endgame/boss/3019：星启附加关推荐属性取星启表整场弱点（≠ 附加关登记敌方的韧性弱点）', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/endgame/boss/3019');
    await page.locator('#egd-level-tab-tierce').click();
    const tierce = page.locator('#egd-level-panel .nk-egd-tierce');
    const nodeCardTabs = tierce.locator('.nk-egd-nodecards[aria-label="星启节点"] [role="tab"]');
    await nodeCardTabs.nth(2).click();
    const board = tierce.locator('.nk-egd-board');
    const season = seasonData('maze_boss.json', '3019');
    await expect(board.locator('.nk-egd-guide .nk-egd-trait'))
      .toHaveCount(stageGuide(season, season.tierce!.nodes![2])!.traits!.length);
    await expect(nodeCardTabs.nth(2).locator('.nk-egd-nodecard__label')).toHaveText(['推荐属性', '等级']);
    const node3Elems = await nodeCardTabs.nth(2).locator('.nk-egd-nodecard__elems').innerHTML();
    expect(node3Elems.length).toBeGreaterThan(0);
    await expect(tierce.locator('.nk-egd-tierce__stats')).toHaveCount(0);
    await nodeCardTabs.nth(0).click();
    const node1Elems = await nodeCardTabs.nth(0).locator('.nk-egd-nodecard__elems').innerHTML();
    expect(node3Elems).not.toBe(node1Elems);
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/endgame/boss/3020：区块标题与敌方配置标题同档（桌面 / 手机），且高于卡片内行首标签', { tag: ['@visual-detail', '@viewport-pinned'] }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/endgame/boss/3020');
    await page.locator('#egd-level-tab-floor-1').click();
    const board = page.locator('#egd-floor-board');
    await expect(board.locator('.nk-egd-group__title')).toHaveText(['终焉公理']);
    await expect(board.locator('.nk-egd-mon__label').first()).toBeVisible();
    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: 844 });
      const groupTitle = await fontPx(board.locator('.nk-egd-group__title'));
      const monsTitle = await fontPx(board.locator('.nk-egd-floor__row--mons > .nk-egd-floor__label'));
      const rowLabel = await fontPx(board.locator('.nk-egd-mon__label').first());
      expect(groupTitle, `${width} 档敌方配置标题与区块标题同档`).toBe(monsTitle);
      expect(groupTitle, `${width} 档区块标题必须高于卡片内行首标签（${groupTitle} vs ${rowLabel}）`)
        .toBeGreaterThan(rowLabel + 0.5);
    }
    const guideLabel = await fontPx(board.locator('.nk-egd-guide__label').first());
    const summonsLabel = await fontPx(board.locator('.nk-egd-summons__label').first());
    expect(guideLabel, '首领机制标签与召唤物标签同档').toBe(summonsLabel);
    assertNoErrors();
  });

  test('/endgame/boss/3021：统一压缩取数（共享通关奖励 + 完整阶梯）', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    const season = seasonData('maze_boss.json', '3021');
    const names = itemNameMap();
    await page.goto('/endgame/boss/3021');
    await expect(page.locator('#egd-level-panel .nk-egd-head')).toHaveCount(0);
    const flat = page.locator('#egd-season-rewards .nk-egd-season-flat');
    await expect(flat).toHaveCount(1);
    const floor1 = season.floor_details![0];
    const clearReward = page.locator('#egd-season-rewards .nk-egd-season-shared .nk-egd-season-group__rewards');
    await expect(clearReward.locator('.nk-egd-head__label')).toHaveText('通关奖励');
    await expect(clearReward.locator('.nk-egd-reward__name'))
      .toHaveText(rewardNames(floor1.reward!, names));
    await expect(clearReward.locator('.nk-egd-reward__num'))
      .toHaveText(rewardNums(floor1.reward!));
    await expect(flat.locator('.nk-egd-tier__badge'))
      .toHaveText(season.star_rewards!.map((t) => `累计 ${t.star}★`));
    await expect(flat.locator('.nk-egd-tier__reward .nk-egd-reward__name'))
      .toHaveText(season.star_rewards!.flatMap((t) => rewardNames(t.items, names)));
    expect(season.floor_details!.flatMap((f) => f.star_rewards!.map((t) => t.star)))
      .toEqual(season.star_rewards!.map((t) => t.star));
    await noUnknownOverflow(page);
    assertNoErrors();
  });
});