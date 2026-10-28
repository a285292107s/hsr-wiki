import { test, expect } from '@playwright/test';
import { collectConsoleIssues, computedNumber, fontPx, readJson, readTokenPx, waitForCatalogCards } from './helpers';
import { CN_NUM, cnBigNumber, expectTokenNumber, floorBossName, floorGuide, grouped, itemNameMap, lastWaveMonster, levelTabLabels, monsterBadge, noUnknownOverflow, PEAK_HARD_NODE, peakKnightLevels, peakKnightNodeTabId, peakKnightsTabId, peakNodeTabId, peakTabId, peakTabLabels, pollutedMonsters, pollutedSeasonHrefs, pollutedSummons, pollutionEntries, rewardNames, rewardNums, seasonData, seasonRewardGroups, seasonTabLabels, stageGuide, summonBadge, summonsOf, tierBadges, tierceNodeBossNames, tierRuns, tierUnits } from './layout.shared';

test.describe('布局验收：终局层级与看板 · 忘却之庭 / 虚构叙事 / 异相仲裁', () => {
  test('/endgame/maze：统一压缩（共享头 + 完整阶梯）+ 例外回退按层分组', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    const season = seasonData('maze.json', '1035');
    const ladder = season.star_rewards!;
    expect(ladder[0].star).toBe(3);
    expect(ladder[ladder.length - 1].star).toBe((season.floor_details ?? []).length * 3);
    expect(season.floor_details!.every((f) => f.star_rewards!.length === 1)).toBe(true);
    expect(season.floor_details!.map((f) => f.star_rewards![0].star)).toEqual(ladder.map((t) => t.star));
    await page.goto('/endgame/maze/1035');
    await expect(page.locator('#egd-level-panel .nk-egd-head')).toHaveCount(0);
    await expect(page.locator('.nk-egd-buffzone--solo .nk-egd-floor__buffname')).toHaveText('记忆紊流');
    await expect(page.locator('#egd-level-panel .nk-egd-floor__buff')).toHaveCount(0);
    const flat = page.locator('#egd-season-rewards .nk-egd-season-flat');
    await expect(flat).toHaveCount(1);
    await expect(flat.locator('.nk-egd-season-flat__conditions .nk-egd-node'))
      .toHaveCount(season.floor_details![0].targets!.length);
    await expect(flat.locator('.nk-egd-season-flat__conditions .nk-egd-node').last())
      .toContainText(String(season.floor_details![0].targets!.at(-1)!.param));
    const ladderRuns = tierRuns(ladder);
    await expect(flat.locator('.nk-egd-tier__badge')).toHaveText(tierBadges(ladderRuns));
    await expect(flat.locator('.nk-egd-tier__unit')).toHaveText(tierUnits(ladderRuns));
    await expect(flat.locator('.nk-egd-tier__reward .nk-egd-reward__name'))
      .toHaveText(ladderRuns.flatMap((run) => rewardNames(run.items, itemNameMap())));
    await expect(page.locator('#egd-season-rewards .nk-egd-season-shared .nk-egd-season-group__rewards .nk-egd-reward__name'))
      .toHaveText(rewardNames(season.floor_details![0].reward!, itemNameMap()));
    await expect(page.locator('#egd-season-rewards .nk-egd-season__note')).toHaveText('第 1–12 层适用');
    await expect(page.locator('#egd-season-rewards .nk-egd-season-group')).toHaveCount(1);
    await expect(page.locator('#egd-season-rewards .nk-egd-season-group__title')).toHaveText('星启模式');
    await noUnknownOverflow(page);
    assertNoErrors();

    const permanent = seasonData('maze.json', '100');
    const own = new Set(permanent.floor_details!.map((f) => JSON.stringify(f.reward)));
    expect(own.size, '该期逐层通关奖励应有两种载荷（用于证明列跟层走）').toBe(2);
    await page.goto('/endgame/maze/100');
    await expect(page.locator('.nk-egd-buffzone--solo'), '逐层增益各异的期不上提').toHaveCount(0);
    await expect(page.locator('#egd-level-panel .nk-egd-floor__buff')).toHaveCount(1);
    const permGroups = seasonRewardGroups(page);
    await expect(permGroups).toHaveCount(permanent.floor_details!.length);
    await expect(permGroups.nth(0).locator('.nk-egd-season-group__rewards .nk-egd-reward__num'))
      .toHaveText(rewardNums(permanent.floor_details![0].reward!));
    await expect(permGroups.nth(5).locator('.nk-egd-season-group__rewards .nk-egd-reward__num'))
      .toHaveText(rewardNums(permanent.floor_details![5].reward!));
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/endgame/peak/9：本期奖励板块按口径分关（骑士 / 王棋 / 绝境）', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    const peak = seasonData('maze_peak.json', '9');
    const ladder = peak.star_rewards!;
    expect(new Set(ladder.map((r) => r.label))).toEqual(new Set(['骑士星数', '王棋星数']));
    await page.goto('/endgame/peak/9');
    await expect(page.locator('#egd-badges, .nk-egd-badges')).toHaveCount(0);
    await expect(page.locator('.nk-egd-starrewards')).toHaveCount(0);
    await expect(page.locator('#egd-level-panel .nk-egd-head')).toHaveCount(0);
    await expect(page.locator('#egd-level-panel .nk-egd-clear')).toHaveCount(0);

    const king = (peak.levels ?? []).find((l) => l.kind === 'king')!;
    const knights = peakKnightLevels(peak);
    const groups = seasonRewardGroups(page);
    await expect(groups).toHaveCount(knights.length + 2);

    const expectGroup = async (index: number, tiers: { star: number }[], targets: number): Promise<void> => {
      const group = groups.nth(index);
      await expect(group.locator('.nk-egd-tier__badge'))
        .toHaveText(tiers.map((t) => `累计 ${t.star}★`));
      await expect(group.locator('.nk-egd-tiers li')).toHaveCount(tiers.length);
      await expect(group.locator('.nk-egd-node')).toHaveCount(targets);
    };

    for (let i = 0; i < knights.length; i += 1) {
      await expect(groups.nth(i).locator('.nk-egd-season-group__title')).toHaveText(knights[i].name!);
      await expectGroup(i, knights[i].star_rewards!, knights[i].targets!.length);
    }
    const kingIndex = knights.length;
    await expect(groups.nth(kingIndex).locator('.nk-egd-season-group__title')).toHaveText(king.name!);
    await expectGroup(kingIndex, king.star_rewards!, king.targets!.length);
    await expect(groups.nth(kingIndex + 1).locator('.nk-egd-season-group__title')).toHaveText(king.hard!.name!);
    await expectGroup(kingIndex + 1, king.hard!.star_rewards!, king.hard!.targets!.length);

    const knightTiers = ladder.filter((r) => r.label === '骑士星数');
    const kingTiers = ladder.filter((r) => r.label === '王棋星数');
    expect((peak.levels ?? []).filter((l) => l.kind === 'knight')
      .flatMap((l) => l.star_rewards!)).toHaveLength(knightTiers.length);
    expect(king.star_rewards!).toHaveLength(kingTiers.length);
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/endgame/story/2026：统一压缩（共享头 + 完整阶梯）', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    const story = seasonData('maze_extra.json', '2026');
    const names = itemNameMap();
    await page.goto('/endgame/story/2026');
    await expect(page.locator('#egd-level-panel .nk-egd-head')).toHaveCount(0);
    await expect(page.locator('#egd-level-panel .nk-egd-lvl__rules')).toHaveCount(0);
    const shared = page.locator('#egd-season-rewards .nk-egd-season-shared');
    await expect(shared).toHaveCount(1);
    await expect(shared.locator('.nk-egd-clear')).toHaveCount(1);
    await expect(shared.locator('.nk-egd-season-group__rewards .nk-egd-reward__name'))
      .toHaveText(rewardNames(story.floor_details![0].reward!, names));
    const flat = page.locator('#egd-season-rewards .nk-egd-season-flat');
    await expect(flat).toHaveCount(1);
    await expect(flat.locator('.nk-egd-season-flat__conditions .nk-egd-node'))
      .toHaveCount(story.floor_details![0].targets!.length);
    await expect(flat.locator('.nk-egd-season-flat__conditions .nk-egd-node').first().locator('.nk-egd-node__text'))
      .toContainText(String(story.floor_details![0].targets![0].param));
    const storyRuns = tierRuns(story.star_rewards!);
    await expect(flat.locator('.nk-egd-tier__badge')).toHaveText(tierBadges(storyRuns));
    await expect(flat.locator('.nk-egd-tier__unit')).toHaveText(tierUnits(storyRuns));
    await expect(flat.locator('.nk-egd-tier__reward .nk-egd-reward__name'))
      .toHaveText(storyRuns.flatMap((run) => rewardNames(run.items, names)));
    expect(story.floor_details![3].star_rewards!.map((t) => t.star)).toEqual([10, 11, 12]);
    await expect(page.locator('#egd-season-rewards .nk-egd-season-group')).toHaveCount(1);
    await expect(page.locator('#egd-season-rewards .nk-egd-season-group__title')).toHaveText('星启模式');
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/endgame/maze/1035：层级 tab 固定单行 + 倒序（星启最前），可左右滚动', { tag: ['@visual-detail', '@viewport-pinned'] }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    const season = seasonData('maze.json', '1035');
    await page.setViewportSize({ width: 1024, height: 800 });
    await page.goto('/endgame/maze/1035');
    const row = page.locator('#egd-level-tabs');
    const tabs = row.locator('[role="tab"]');
    await expect(tabs).toHaveCount((season.floor_details ?? []).length + 1);
    await expect(tabs.first()).toHaveText('星启模式');
    await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
    await expect(row).toHaveCSS('flex-wrap', 'nowrap');
    const metrics = await row.evaluate((el) => ({
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
      rows: new Set([...el.querySelectorAll('[role="tab"]')]
        .map((t) => Math.round(t.getBoundingClientRect().top))).size,
    }));
    expect(metrics.rows, '层级 tab 必须同处一行（折行即多行 top）').toBe(1);
    expect(metrics.scrollWidth, '层级过多时整行应可左右滚动').toBeGreaterThan(metrics.clientWidth);
    await row.evaluate((el) => { el.scrollLeft = el.scrollWidth; });
    await expect(tabs.last()).toBeInViewport();
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/endgame/maze/1036 + /endgame/story/2026：层级子 tab + 目标栏 + 半场卡片 + 单半场看板（ADR 0037）', { tag: ['@visual-detail', '@viewport-pinned'] }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 1440, height: 900 });

    await page.goto('/endgame/maze/1036');
    const maze = seasonData('maze.json', '1036');
    const mazeFloor1 = maze.floor_details![0];
    await expect(page.locator('.nk-egd-bar')).toHaveCount(0);
    await expect(page.locator('#egd-level-tabs [role="tab"]')).toHaveText(seasonTabLabels(maze));
    await expect(page.locator('#egd-level-tab-tierce')).toHaveAttribute('aria-selected', 'true');

    await page.locator('#egd-level-tab-floor-1').click();
    const mazePanel = page.locator('#egd-level-panel');
    const mazeFlat = page.locator('#egd-season-rewards .nk-egd-season-flat');
    await expect(mazeFlat).toHaveCount(1);
    await expect(mazeFlat.locator('.nk-egd-season-flat__conditions .nk-egd-node'))
      .toHaveCount(mazeFloor1.targets!.length);
    await expect(mazeFlat.locator('.nk-egd-season-flat__conditions .nk-egd-node__star'))
      .toHaveCount(mazeFloor1.targets!.length);
    await expect(mazeFlat.locator('.nk-egd-season-flat__conditions .nk-egd-node').last())
      .toContainText(String(mazeFloor1.targets!.at(-1)!.param));
    await expect(mazeFlat.locator('.nk-egd-season-flat__conditions .nk-egd-node__type'))
      .toHaveCount(mazeFloor1.targets!.length);
    const mazeRuns = tierRuns(maze.star_rewards!);
    await expect(mazeFlat.locator('.nk-egd-season-flat__ladder .nk-egd-tier'))
      .toHaveCount(mazeRuns.length);
    await expect(mazeFlat.locator('.nk-egd-season-flat__ladder .nk-egd-tier__lead'))
      .toHaveCount(mazeRuns.length);
    await expect(mazeFlat.locator('.nk-egd-season-flat__ladder .nk-egd-tier__reward'))
      .toHaveCount(mazeRuns.length);
    await expect(mazeFlat.locator('.nk-egd-season-flat__ladder .nk-egd-tier__brace'))
      .toHaveCount(0);
    await expect(page.locator('.nk-egd-buffzone--solo .nk-egd-floor__buffname')).toHaveText(mazeFloor1.buff!.name);
    await expect(mazePanel.locator('.nk-egd-group')).toHaveCount(0);
    await expect(mazePanel.locator('.nk-egd-board__body > :first-child'))
      .toHaveClass(/nk-egd-floor__stage/);
    const mazeClear = page.locator('#egd-season-rewards .nk-egd-season-shared .nk-egd-clear');
    await expect(mazeClear.locator('.nk-egd-rules__label')).toHaveText('回合上限 CYCLES');
    await expect(mazeClear.locator('.nk-egd-rules__val'))
      .toHaveText(String(mazeFloor1.countdown));

    const mazeHalves = mazePanel.locator('.nk-egd-nodecards[aria-label="半场"] [role="tab"]');
    await expect(mazeHalves).toHaveCount(2);
    await expect(mazeHalves.locator('.nk-egd-nodecard__name')).toHaveText(['上半场', '下半场']);
    await expect(mazeHalves.first().locator('.nk-egd-nodecard__img'))
      .toHaveAttribute('src', new RegExp(lastWaveMonster(mazeFloor1.stage1).icon!));
    await expect(mazeHalves.first().locator('.nk-egd-nodecard__label'))
      .toHaveText(['推荐属性', '等级', '回合']);
    await expect(mazeHalves.first().locator('.nk-egd-nodecard__val'))
      .toHaveText([String(mazeFloor1.level), String(mazeFloor1.countdown)]);
    await expect(mazePanel.locator('.nk-egd-board')).toHaveCount(1);
    await expect(mazePanel.locator('.nk-egd-board__body > .nk-egd-floor__stage')).toHaveCount(1);
    await expect(mazePanel.locator('.nk-egd-mon__name').first())
      .toHaveText(mazeFloor1.stage1!.monsters![0].name);
    await expect(mazePanel.locator('.nk-egd-stage__title')).toHaveText('敌方配置');
    await expect(mazePanel.locator('.nk-egd-mon__hp-label'))
      .toHaveText(mazeFloor1.stage1!.monsters!.map(() => 'HP'));
    await expect(mazePanel.locator('.nk-egd-mon__hp-val'))
      .toHaveText(mazeFloor1.stage1!.monsters!.map((m) => cnBigNumber(m.hp!)));
    await mazeHalves.nth(1).click();
    await expect(mazePanel.locator('.nk-egd-mon__name').first())
      .toHaveText(mazeFloor1.stage2!.monsters![0].name);
    await expect(mazePanel.locator('.nk-egd-mon__hp-val'))
      .toHaveText(mazeFloor1.stage2!.monsters!.map((m) => cnBigNumber(m.hp!)));
    await page.locator('#egd-level-tab-tierce').click();
    await mazePanel.locator('.nk-egd-nodecards[aria-label="星启节点"] [role="tab"]').nth(2).click();
    await expect(page.locator('.nk-egd-buffzone--solo .nk-egd-floor__buffname'))
      .toHaveText(maze.tierce!.nodes![2].buff!.name);
    await noUnknownOverflow(page);
    assertNoErrors();

    await page.goto('/endgame/story/2026');
    const story = seasonData('maze_extra.json', '2026');
    const storyFloor1 = story.floor_details![0];
    await expect(page.locator('#egd-buffs-title')).toHaveText('赛季增益');
    await expect(page.locator('#egd-season-buffs .nk-egd-group__title')).toHaveText('荒腔走板');
    await expect(page.locator('#egd-season-buffs .nk-egd-buff__name'))
      .toHaveText(story.buffs!.map((b) => b.name));
    await expect(page.locator('.nk-egd-bar')).toHaveCount(0);
    await expect(page.locator('#egd-level-tabs [role="tab"]')).toHaveText(seasonTabLabels(story));

    await page.locator('#egd-level-tab-floor-1').click();
    const storyPanel = page.locator('#egd-level-panel');
    const storyFlat = page.locator('#egd-season-rewards .nk-egd-season-flat');
    await expect(page.locator('#egd-season-rewards .nk-egd-season-shared .nk-egd-season-group__rewards .nk-egd-head__label'))
      .toHaveText('通关奖励');
    await expect(storyFlat.locator('.nk-egd-season-flat__conditions .nk-egd-node')).toHaveCount(storyFloor1.targets!.length);
    await expect(storyFlat.locator('.nk-egd-season-flat__conditions .nk-egd-node__star')).toHaveCount(storyFloor1.targets!.length);
    await expect(storyFlat.locator('.nk-egd-season-flat__ladder .nk-egd-tier')).toHaveCount(tierRuns(story.star_rewards!).length);
    await expect(storyFlat.locator('.nk-egd-season-flat__ladder .nk-egd-tier__brace')).toHaveCount(0);
    const storyClear = page.locator('#egd-season-rewards .nk-egd-season-shared .nk-egd-clear');
    await expect(storyClear.locator('.nk-egd-rules__label'))
      .toHaveText(['通关分数线 SCORE', '回合上限 CYCLES']);
    await expect(storyClear.locator('.nk-egd-rules__val'))
      .toHaveText([grouped(story.clear_score!), String(story.countdown)]);
    await expect(storyPanel.locator('.nk-egd-group')).toHaveCount(0);
    const storyBlocks = await storyPanel.locator('.nk-egd-board__body').evaluate((el) =>
      [...el.children].map((c) => (c as HTMLElement).className.split(' ')[0]));
    expect(storyBlocks).toEqual(['nk-egd-floor__stage']);
    const storyHalves = storyPanel.locator('.nk-egd-nodecards[aria-label="半场"] [role="tab"]');
    await expect(storyHalves.first().locator('.nk-egd-nodecard__label'))
      .toHaveText(['推荐属性', '等级']);
    await expect(storyPanel.locator('.nk-egd-floor__buff')).toHaveCount(0);
    const storyPollFloor = (story.floor_details ?? []).find((f) => f.stage2?.invasion);
    expect(storyPollFloor, '虚构叙事应有下半场污染关卡').toBeTruthy();
    await page.locator(`#egd-level-tab-floor-${storyPollFloor!.floor}`).click();
    await page.locator('#egd-floor-half-tab-stage2').click();
    const storyPolledMons = pollutedMonsters(storyPollFloor!.stage2!.invasion, storyPollFloor!.stage2!.monsters);
    expect(storyPolledMons.length, '该半场应有被污染的敌方卡').toBeGreaterThan(0);
    await expect(storyPanel.locator('.nk-egd-mon__art .nk-egd-pollchip'))
      .toHaveText(storyPolledMons.map(() => monsterBadge(storyPollFloor!.stage2!.invasion!)));
    await expect(storyPanel.locator('.nk-egd-mon__meta .nk-egd-pollchip')).toHaveCount(0);
    await page.locator('#egd-level-tab-tierce').click();
    await expect(storyPanel.locator('.nk-egd-nodecards[aria-label="星启节点"] .nk-egd-nodecard__name'))
      .toHaveText(['节点一', '节点二', '节点三']);
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/endgame/maze/1036：父子层级刻度（ADR 0028）桌面', { tag: ['@visual-detail', '@viewport-pinned'] }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/endgame/maze/1036');
    const maze = seasonData('maze.json', '1036');
    await expect(page.locator('.nk-egd-tierce__nodezh')).toHaveCount(0);
    await expect(page.locator('#egd-tierce-board .nk-egd-floor__moncount')).toHaveCount(0);
    const activeCardName = page.locator('.nk-egd-nodecard--active .nk-egd-nodecard__name');
    await expect(activeCardName).toHaveText(`节点${CN_NUM[0]}`);
    await expect(activeCardName).toHaveCSS('font-weight', '700');
    expect(await fontPx(activeCardName)).toBeGreaterThan(
      await fontPx(page.locator('.nk-egd-board .nk-egd-floor__wavelabel').first()) + 0.5,
    );
    await expect(page.locator('.nk-egd-nodecards[aria-label="星启节点"] [role="tab"]').first()
      .locator('.nk-egd-nodecard__img'))
      .toHaveAttribute('src', new RegExp(lastWaveMonster(maze.tierce!.nodes![0]).icon!));
    await expect(page.locator('.nk-egd-nodecard').first().locator('.nk-egd-nodecard__val'))
      .toHaveText(String(maze.tierce!.nodes![0].level));
    const egIndent = await readTokenPx(page, '--eg-indent', '.nk-egd');
    expect(egIndent, '父子层级缩进令牌必须在 .nk-egd 上声明').toBeGreaterThan(0);
    const child = page.locator('.nk-egd-board__body').first();
    await expectTokenNumber(child, 'padding-left', egIndent, '星启看板体缩进');
    const childRailWidth = await child.evaluate((el) => parseFloat(getComputedStyle(el, '::before').width) || 0);
    expect(childRailWidth, '星启看板体的层级竖轨应已移除（缩进保留）').toBe(0);
    expect(await fontPx(page.locator('.nk-egd-board .nk-egd-floor__wavelabel').first()))
      .toBe(await fontPx(page.locator('.nk-egd-floor__wavelabel').first()));
    const waveGridMargins = await page.locator('.nk-egd-board .nk-egd-floor__monswrap').first()
      .evaluate((wrap) => [...wrap.querySelectorAll(':scope > .nk-egd-floor__wave > .nk-egd-mons')]
        .map((g) => parseFloat(getComputedStyle(g).marginBottom) || 0));
    expect(waveGridMargins.length, '忘却之庭星启节点应有多波敌方网格').toBeGreaterThan(1);
    expect(waveGridMargins.slice(0, -1), '非末波网格保留 8px 间隔').toEqual(
      waveGridMargins.slice(0, -1).map(() => 8),
    );
    expect(waveGridMargins[waveGridMargins.length - 1], '末波网格不应有尾随下外边距').toBe(0);
    await noUnknownOverflow(page);
    assertNoErrors();

    await page.goto('/endgame/peak/9');
    const peakBody = page.locator('.nk-egd-peak__body').first();
    await expect(peakBody).toBeVisible();
    await expectTokenNumber(peakBody, 'padding-left', egIndent, '异相仲裁单关面板体缩进');
    const railWidth = await peakBody.evaluate((el) => parseFloat(getComputedStyle(el, '::before').width) || 0);
    expect(railWidth, '异相仲裁单关面板体的层级竖轨已移除（缩进保留）').toBe(0);
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/endgame/maze/1036：父子层级刻度（ADR 0028）手机断点', { tag: ['@visual-detail', '@viewport-pinned'] }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/endgame/maze/1036');
    const egIndent = await readTokenPx(page, '--eg-indent', '.nk-egd');
    expect(egIndent, '手机档缩进令牌必须在 .nk-egd 上声明').toBeGreaterThan(0);
    const child = page.locator('.nk-egd-board__body').first();
    await expect(child).toBeVisible();
    await expectTokenNumber(child, 'padding-left', egIndent, '手机档星启看板体缩进');
    expect(await child.evaluate((el) => parseFloat(getComputedStyle(el, '::before').width) || 0),
      '手机档星启看板体同样不画层级竖轨').toBe(0);
    const cardFs = await fontPx(page.locator('.nk-egd-nodecard--active .nk-egd-nodecard__name'));
    const waveFs = await fontPx(page.locator('.nk-egd-board .nk-egd-floor__wavelabel').first());
    expect(cardFs).toBeGreaterThan(waveFs);
    await page.goto('/endgame/peak/9');
    const peakBody = page.locator('.nk-egd-peak__body').first();
    await expectTokenNumber(peakBody, 'padding-left', egIndent, '手机档异相仲裁单关面板体缩进');
    expect(await peakBody.evaluate((el) => parseFloat(getComputedStyle(el, '::before').width) || 0),
      '手机档异相仲裁单关面板体同样不画层级竖轨').toBe(0);
    await noUnknownOverflow(page);
    assertNoErrors();
  });
});