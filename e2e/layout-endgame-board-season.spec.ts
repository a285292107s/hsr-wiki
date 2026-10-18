import { test, expect } from '@playwright/test';
import { collectConsoleIssues, computedNumber, fontPx, readJson, readTokenPx, waitForCatalogCards } from './helpers';
import { CN_NUM, cnBigNumber, expectTokenNumber, floorBossName, floorGuide, grouped, itemNameMap, lastWaveMonster, levelTabLabels, monsterBadge, noUnknownOverflow, PEAK_HARD_NODE, peakKnightLevels, peakKnightNodeTabId, peakKnightsTabId, peakNodeTabId, peakTabId, peakTabLabels, pollutedMonsters, pollutedSeasonHrefs, pollutedSummons, pollutionEntries, rewardNames, rewardNums, seasonData, seasonTabLabels, stageGuide, summonBadge, summonsOf, tierceNodeBossNames } from './layout.shared';

/**
 * 布局验收：终局层级与看板 · 忘却之庭 / 虚构叙事 / 异相仲裁（maze / story / peak）。
 *
 * 与 `layout-endgame-board.spec.ts` 分文件的理由：`--shard` 只在**文件**边界生效，
 * 一个巨型文件就是 CI 墙钟下界——拆开才能让两块并行。判据见 docs/agents/testing.md
 * 「layout 必须按 describe 边界分文件」（此处不重复该规则，也不记耗时数字：它们必然过期）。
 * 按「玩法」切分：本文件是 maze / story / peak 的层级与奖励切片。
 *
 * `@viewport-pinned` 标签：凡用例内自行 `setViewportSize(...)` 固定视口者，必须在 `test(...)`
 * 第二参传该标签（mobile-chromium 以 `grepInvert` 跳过）。标签须静态书写，动态 annotation 对收集期过滤无效。
 *
 * 数值断言三种合法形态（令牌派生 / 相对关系 / 数据派生）与裸 px 禁令见 `layout-endgame.spec.ts` 文件头。
 */
test.describe('布局验收：终局层级与看板 · 忘却之庭 / 虚构叙事 / 异相仲裁', () => {
  test('/endgame/maze：星级奖励按层切片 + 逐层通关奖励跟本层数据', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    const season = seasonData('maze.json', '1035');
    const ladder = season.star_rewards!;
    // 12 层 × 3 目标 = 36 星：档位为 3..36（每层满星一档），末档 36★
    expect(ladder[0].star).toBe(3);
    expect(ladder[ladder.length - 1].star).toBe((season.floor_details ?? []).length * 3);
    // 忘却之庭每层恰好一档（奖励线按 3 星一档），故层序切片 = 单档且与全期阶梯等长
    expect(season.floor_details!.every((f) => f.star_rewards!.length === 1)).toBe(true);
    expect(season.floor_details!.map((f) => f.star_rewards![0].star)).toEqual(ladder.map((t) => t.star));
    await page.goto('/endgame/maze/1035');
    const list = page.locator('#egd-level-panel .nk-egd-tierlist');
    await page.locator('#egd-level-tab-floor-1').click();
    // 忘却之庭一层 3 个目标只推进 1 档：该档行内条件逐目标一行
    await expect(list.locator('.nk-egd-tier__badge')).toHaveText(['累计 3★']);
    await expect(list.locator('.nk-egd-tiers li').first().locator('.nk-egd-node'))
      .toHaveCount(season.floor_details![0].targets!.length);
    await page.locator('#egd-level-tab-floor-12').click();
    await expect(list.locator('.nk-egd-tier__badge')).toHaveText(['累计 36★']);
    await expect(list.locator('.nk-egd-reward__name'))
      .toHaveText(rewardNames(season.floor_details![11].star_rewards![0].items, itemNameMap()));
    await noUnknownOverflow(page);
    assertNoErrors();

    // 逐层通关奖励跟本层 RewardID 走：永屹之城遗秘 1-5 层一份、6-15 层另一份（实测两种载荷）
    const permanent = seasonData('maze.json', '100');
    const own = new Set(permanent.floor_details!.map((f) => JSON.stringify(f.reward)));
    expect(own.size, '该期逐层通关奖励应有两种载荷（用于证明列跟层走）').toBe(2);
    await page.goto('/endgame/maze/100');
    await page.locator('#egd-level-tab-floor-1').click();
    const reward = page.locator('#egd-level-panel .nk-egd-head > .nk-egd-reward');
    await expect(reward.locator('.nk-egd-reward__num'))
      .toHaveText(rewardNums(permanent.floor_details![0].reward!));
    await page.locator('#egd-level-tab-floor-6').click();
    await expect(reward.locator('.nk-egd-reward__num'))
      .toHaveText(rewardNums(permanent.floor_details![5].reward!));
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/endgame/peak/9：星级奖励列表垫在关卡面板底部（按口径分关切片，ADR 0051 补记）', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    const peak = seasonData('maze_peak.json', '9');
    /** 赛季级阶梯仍完整产出（单关切片的来源），两类口径都有 */
    const ladder = peak.star_rewards!;
    expect(new Set(ladder.map((r) => r.label))).toEqual(new Set(['骑士星数', '王棋星数']));
    await page.goto('/endgame/peak/9');
    // 段位徽章区块退场 + 赛季级阶梯块整体退场（星数奖励下放单关面板底部，用户裁决）
    await expect(page.locator('#egd-badges, .nk-egd-badges')).toHaveCount(0);
    await expect(page.locator('.nk-egd-starrewards')).toHaveCount(0);
    // 异相仲裁的单关面板不出「通关奖励」列（奖励只随星级奖励列表逐档给，卡片行也不承担奖励）
    await expect(page.locator('#egd-level-panel .nk-egd-head > .nk-egd-reward')).toHaveCount(0);
    await expect(page.locator('#egd-level-panel .nk-egd-clear')).toHaveCount(0);

    const king = (peak.levels ?? []).find((l) => l.kind === 'king')!;
    const head = page.locator('.nk-egd-peak .nk-egd-head');
    const list = head.locator('.nk-egd-tierlist');

    /** 每关面板底部的星级奖励列表 = 该关自己那份切片（口径分关：骑士关吃骑士星数、王棋关吃王棋星数）。
     *  节点定位由上一步切开（王棋档与骑士档各是一档，档内再用节点卡片切换）。 */
    const expectHead = async (tiers: { star: number }[], targets: number): Promise<void> => {
      await expect(head).toHaveCount(1);
      await expect(list.locator('.nk-egd-tier__badge'))
        .toHaveText(tiers.map((t) => `累计 ${t.star}★`));
      // 一档一行：行内条件即该档吃到的挑战目标
      await expect(list.locator('.nk-egd-tiers li')).toHaveCount(tiers.length);
      await expect(list.locator('.nk-egd-node')).toHaveCount(targets);
    };

    // 王棋档的节点一：3 目标 3 档（1★/2★/3★，每档 1 目标）
    await page.locator(peakTabId(king)).click();
    await expectHead(king.star_rewards!, king.targets!.length);
    // 节点二（绝境）：取王棋口径最高档 3★，配它自己那 1 个目标（官方「视同 3 星通关全部骑士关卡」）
    await page.locator(peakNodeTabId(PEAK_HARD_NODE)).click();
    await expectHead(king.hard!.star_rewards!, king.hard!.targets!.length);
    // 骑士三关：合并档内逐张节点卡片切换（骑士口径逐关累计 → 3★ / 6★ / 9★ 各落一关）
    const knights = peakKnightLevels(peak);
    await page.locator(peakKnightsTabId).click();
    for (let i = 0; i < knights.length; i += 1) {
      await page.locator(peakKnightNodeTabId(knights[i], i)).click();
      await expectHead(knights[i].star_rewards!, knights[i].targets!.length);
    }
    // 全期切片不重不漏：两口径各自的档数 = 该口径在赛季级阶梯里的档数
    const knightTiers = ladder.filter((r) => r.label === '骑士星数');
    const kingTiers = ladder.filter((r) => r.label === '王棋星数');
    expect((peak.levels ?? []).filter((l) => l.kind === 'knight')
      .flatMap((l) => l.star_rewards!)).toHaveLength(knightTiers.length);
    expect(king.star_rewards!).toHaveLength(kingTiers.length);
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/endgame/story/2026：星级奖励列表一档一行（目标 × 奖励配对）', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    const story = seasonData('maze_extra.json', '2026');
    const names = itemNameMap();
    await page.goto('/endgame/story/2026');
    await page.locator('#egd-level-tab-floor-1').click();
    const head = page.locator('#egd-level-panel .nk-egd-head');
    // 三格：通关条件｜通关奖励 两栏 + 星级奖励列表跨满整行
    await expect(page.locator('#egd-level-panel .nk-egd-head > *')).toHaveCount(3);
    await expect(head.locator('.nk-egd-clear')).toHaveCount(1);
    await expect(head.locator('.nk-egd-tierlist')).toHaveCount(1);
    await expect(page.locator('#egd-level-panel .nk-egd-head > .nk-egd-reward')).toHaveCount(1);
    await expect(page.locator('#egd-level-panel .nk-egd-head > .nk-egd-reward .nk-egd-reward__name'))
      .toHaveText(rewardNames(story.floor_details![0].reward!, names));
    const list = head.locator('.nk-egd-tierlist');
    await expect(list.locator('.nk-egd-tier__badge'))
      .toHaveText(story.floor_details![0].star_rewards!.map((t) => `累计 ${t.star}★`));
    // 每档一行：档位徽章 + 该档条件（1 目标）+ 该档奖励 chips
    const storyTierRows = list.locator('.nk-egd-tiers li');
    await expect(storyTierRows).toHaveCount(story.floor_details![0].star_rewards!.length);
    await expect(storyTierRows.nth(0).locator('.nk-egd-node'))
      .toHaveCount(1);
    await expect(storyTierRows.nth(0).locator('.nk-egd-node__text'))
      .toContainText(String(story.floor_details![0].targets![0].param));
    await expect(storyTierRows.nth(0).locator('.nk-egd-reward__name'))
      .toHaveText(rewardNames(story.floor_details![0].star_rewards![0].items, names));
    // 虚构叙事每层 3 目标 = 3 档（每档 1 星），末层收到 12★
    expect(story.floor_details![3].star_rewards!.map((t) => t.star)).toEqual([10, 11, 12]);
    await page.locator('#egd-level-tab-floor-4').click();
    await expect(list.locator('.nk-egd-tier__badge')).toHaveText(['累计 10★', '累计 11★', '累计 12★']);
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/endgame/maze/1035：层级 tab 固定单行 + 倒序（星启最前），可左右滚动 @viewport-pinned', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    const season = seasonData('maze.json', '1035');
    // 收窄视口逼出溢出：13 个 tab（星启 + 12 层）超过一行宽度
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
    // 滚到最右端：末位 tab（第 1 层，倒序末位）进视口，行内不产生整页横向溢出
    await row.evaluate((el) => { el.scrollLeft = el.scrollWidth; });
    await expect(tabs.last()).toBeInViewport();
    await noUnknownOverflow(page);
    assertNoErrors();
  });


  test('/endgame/maze/1036 + /endgame/story/2026：层级子 tab + 目标栏 + 半场卡片 + 单半场看板（ADR 0037）', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 1440, height: 900 });

    // ── 忘却之庭：目标为回合 / 减员档，栏名是「挑战目标」；增益在半场节点面板 ──
    await page.goto('/endgame/maze/1036');
    const maze = seasonData('maze.json', '1036');
    const mazeFloor1 = maze.floor_details![0];
    // 顶部固定条退场：层级模式由页内子 tab 承担导航（仅异相仲裁保留固定条）
    await expect(page.locator('.nk-egd-bar')).toHaveCount(0);
    await expect(page.locator('#egd-level-tabs [role="tab"]')).toHaveText(seasonTabLabels(maze));
    // 默认激活星启模式（有星启的赛季；无星启的赛季回退第 1 层）
    await expect(page.locator('#egd-level-tab-tierce')).toHaveAttribute('aria-selected', 'true');

    await page.locator('#egd-level-tab-floor-1').click();
    const mazePanel = page.locator('#egd-level-panel');
    await expect(mazePanel.locator('.nk-egd-tierlist .nk-egd-head__label'))
      .toHaveText('挑战目标 · 星级奖励');
    await expect(mazePanel.locator('.nk-egd-tiers .nk-egd-node'))
      .toHaveCount(mazeFloor1.targets!.length);
    // 一档吃 3 个目标（3 星一档）：逐目标标出它那 1 星，条件块右侧一个**横跨这三个目标的括号**，
    // 括号外再接**一条**引导虚线到该档奖励（奖励只一份，不复制三遍）
    await expect(mazePanel.locator('.nk-egd-tiers .nk-egd-node__star'))
      .toHaveCount(mazeFloor1.targets!.length);
    await expect(mazePanel.locator('.nk-egd-tiers .nk-egd-tier__brace')).toHaveCount(1);
    await expect(mazePanel.locator('.nk-egd-tiers .nk-egd-tier__lead')).toHaveCount(1);
    await expect(mazePanel.locator('.nk-egd-tiers .nk-egd-tier__reward')).toHaveCount(1);
    await expect(mazePanel.locator('.nk-egd-tiers .nk-egd-node').last())
      .toContainText(String(mazeFloor1.targets!.at(-1)!.param));
    // 非分数档：行首走语义标签（回合 / 减员）
    await expect(mazePanel.locator('.nk-egd-tiers .nk-egd-node__type'))
      .toHaveCount(mazeFloor1.targets!.length);
    // 忘却之庭「记忆紊流」= 层级增益，由每个层 / 半场看板首块的末法余烬位呈现一次（用户裁决：统一到头部）
    await expect(mazePanel.locator('.nk-egd-floor__buffname')).toHaveText(mazeFloor1.buff!.name);
    await expect(mazePanel.locator('.nk-egd-group')).toHaveCount(0);
    await expect(mazePanel.locator('.nk-egd-board__body > :first-child'))
      .toHaveClass(/nk-egd-floor__buff/);
    // 通关条件：忘却之庭无数值分数线，取该层回合上限（超过即挑战失败）
    await expect(mazePanel.locator('.nk-egd-clear .nk-egd-rules__label')).toHaveText('回合上限 CYCLES');
    await expect(mazePanel.locator('.nk-egd-clear .nk-egd-rules__val'))
      .toHaveText(String(mazeFloor1.countdown));

    // 半场卡片两张同一行：卡面 = 半场名 + 末波首领图 + 推荐属性 + 等级 + 回合
    const mazeHalves = mazePanel.locator('.nk-egd-nodecards[aria-label="半场"] [role="tab"]');
    await expect(mazeHalves).toHaveCount(2);
    await expect(mazeHalves.locator('.nk-egd-nodecard__name')).toHaveText(['上半场', '下半场']);
    await expect(mazeHalves.first().locator('.nk-egd-nodecard__img'))
      .toHaveAttribute('src', new RegExp(lastWaveMonster(mazeFloor1.stage1).icon!));
    await expect(mazeHalves.first().locator('.nk-egd-nodecard__label'))
      .toHaveText(['推荐属性', '等级', '回合']);
    await expect(mazeHalves.first().locator('.nk-egd-nodecard__val'))
      .toHaveText([String(mazeFloor1.level), String(mazeFloor1.countdown)]);
    // 一次一个看板：看板只渲染当前半场，且不复述场次身份
    await expect(mazePanel.locator('.nk-egd-board')).toHaveCount(1);
    await expect(mazePanel.locator('.nk-egd-board__body > .nk-egd-floor__stage')).toHaveCount(1);
    await expect(mazePanel.locator('.nk-egd-mon__name').first())
      .toHaveText(mazeFloor1.stage1!.monsters![0].name);
    await expect(mazePanel.locator('.nk-egd-floor__label')).toHaveText('敌方配置');
    // 关卡内 HP（ADR 0055）：每张敌方卡的立绘下方显示**该关卡语境**下的生命值——
    // 期望值由 payload 的 hp 独立折算（cn 数制），且随半场切换（上下半场等级不同 ⇒ 数值不同）
    await expect(mazePanel.locator('.nk-egd-mon__hp-label'))
      .toHaveText(mazeFloor1.stage1!.monsters!.map(() => 'HP'));
    await expect(mazePanel.locator('.nk-egd-mon__hp-val'))
      .toHaveText(mazeFloor1.stage1!.monsters!.map((m) => cnBigNumber(m.hp!)));
    // 切半场：换的是当前半场那份战斗数据
    await mazeHalves.nth(1).click();
    await expect(mazePanel.locator('.nk-egd-mon__name').first())
      .toHaveText(mazeFloor1.stage2!.monsters![0].name);
    await expect(mazePanel.locator('.nk-egd-mon__hp-val'))
      .toHaveText(mazeFloor1.stage2!.monsters!.map((m) => cnBigNumber(m.hp!)));
    // 星启节点三 = 附加关：增益位与节点 1/2 同源（该关卡自身未登记绑定，回退同赛季末层的层级增益）
    await page.locator('#egd-level-tab-tierce').click();
    await mazePanel.locator('.nk-egd-nodecards[aria-label="星启节点"] [role="tab"]').nth(2).click();
    await expect(mazePanel.locator('.nk-egd-floor__buffname'))
      .toHaveText(maze.tierce!.nodes![2].buff!.name);
    await noUnknownOverflow(page);
    assertNoErrors();

    // ── 虚构叙事：分数档 → 栏名是「星级目标」；回合限制与通关分数线是赛季维度 ──
    await page.goto('/endgame/story/2026');
    const story = seasonData('maze_extra.json', '2026');
    const storyFloor1 = story.floor_details![0];
    // 战意机制保留赛季级区块；赛季增益改由当前节点 tab 看板展示
    await expect(page.locator('#egd-sub-buffs')).toBeVisible();
    await expect(page.locator('#egd-buffs')).toHaveCount(0);
    await expect(page.locator('.nk-egd-bar')).toHaveCount(0);
    await expect(page.locator('#egd-level-tabs [role="tab"]')).toHaveText(seasonTabLabels(story));

    await page.locator('#egd-level-tab-floor-1').click();
    const storyPanel = page.locator('#egd-level-panel');
    // 板读序：通关条件 → 通关奖励 → 星级奖励列表（一档一行）
    await expect(storyPanel.locator('.nk-egd-head__label'))
      .toHaveText(['通关条件', '通关奖励', '星级目标 · 星级奖励']);
    await expect(storyPanel.locator('.nk-egd-tiers .nk-egd-node')).toHaveCount(storyFloor1.targets!.length);
    await expect(storyPanel.locator('.nk-egd-tiers .nk-egd-node__star')).toHaveCount(0);
    await expect(storyPanel.locator('.nk-egd-tiers .nk-egd-tier__brace')).toHaveCount(0);
    await expect(storyPanel.locator('.nk-egd-rules__label'))
      .toHaveText(['通关分数线 SCORE', '回合上限 CYCLES']);
    await expect(storyPanel.locator('.nk-egd-rules__val'))
      .toHaveText([grouped(story.clear_score!), String(story.countdown)]);
    await expect(storyPanel.locator('.nk-egd-group__title')).toHaveText('荒腔走板');
    await expect(storyPanel.locator('.nk-egd-group .nk-egd-buff__name'))
      .toHaveText(story.buffs!.map((b) => b.name));
    // 赛季增益排在敌人配置之前（用户裁决）：看板体块序 = 赛季增益 → 敌方配置
    const storyBlocks = await storyPanel.locator('.nk-egd-board__body').evaluate((el) =>
      [...el.children].map((c) => (c as HTMLElement).className.split(' ')[0]));
    expect(storyBlocks).toEqual(['nk-egd-group', 'nk-egd-floor__stage']);
    // 层内回合为 0 → 卡片不出现「回合」行（层内增益缺省 → 看板首块无末法余烬）
    const storyHalves = storyPanel.locator('.nk-egd-nodecards[aria-label="半场"] [role="tab"]');
    await expect(storyHalves.first().locator('.nk-egd-nodecard__label'))
      .toHaveText(['推荐属性', '等级']);
    await expect(storyPanel.locator('.nk-egd-floor__buff')).toHaveCount(0);
    // 污染徽标落点（用户裁决，ADR 0026 补记三）：本页第 3/4 层下半场有登记在敌方配置里的被污染敌方，
    // 徽标挂在**立绘正下方**的立绘列内，不再进名称旁的标签行
    const storyPollFloor = (story.floor_details ?? []).find((f) => f.stage2?.invasion);
    expect(storyPollFloor, '虚构叙事应有下半场污染关卡').toBeTruthy();
    await page.locator(`#egd-level-tab-floor-${storyPollFloor!.floor}`).click();
    await page.locator('#egd-floor-half-tab-stage2').click();
    const storyPolledMons = pollutedMonsters(storyPollFloor!.stage2!.invasion, storyPollFloor!.stage2!.monsters);
    expect(storyPolledMons.length, '该半场应有被污染的敌方卡').toBeGreaterThan(0);
    await expect(storyPanel.locator('.nk-egd-mon__art .nk-egd-pollchip'))
      .toHaveText(storyPolledMons.map(() => monsterBadge(storyPollFloor!.stage2!.invasion!)));
    await expect(storyPanel.locator('.nk-egd-mon__meta .nk-egd-pollchip')).toHaveCount(0);
    // 星启 tab 仍在末位，且用同一套节点卡片 + 看板
    await page.locator('#egd-level-tab-tierce').click();
    await expect(storyPanel.locator('.nk-egd-nodecards[aria-label="星启节点"] .nk-egd-nodecard__name'))
      .toHaveText(['节点一', '节点二', '节点三']);
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/endgame/maze/1036：父子层级刻度（ADR 0028）桌面', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/endgame/maze/1036');
    const maze = seasonData('maze.json', '1036');
    // 父档＝节点卡片（身份位）：看板行头整块退场后，节点号只在卡片上出现一次（ADR 0033 决策 11）
    await expect(page.locator('.nk-egd-tierce__nodezh')).toHaveCount(0);
    await expect(page.locator('#egd-tierce-board .nk-egd-floor__moncount')).toHaveCount(0);
    const activeCardName = page.locator('.nk-egd-nodecard--active .nk-egd-nodecard__name');
    // 卡片节点号是站点自创文案（idx → 中文序号）
    await expect(activeCardName).toHaveText(`节点${CN_NUM[0]}`);
    await expect(activeCardName).toHaveCSS('font-weight', '700');
    // 父档字号必须严格大于孙档「第 N 波」标签（档位序，绝对值交 CSS）
    expect(await fontPx(activeCardName)).toBeGreaterThan(
      await fontPx(page.locator('.nk-egd-board .nk-egd-floor__wavelabel').first()) + 0.5,
    );
    // 卡片 boss 图取末波首领（忘却之庭一个节点 3 敌、波 1 是小怪）：图源随节点数据
    await expect(page.locator('.nk-egd-nodecards[aria-label="星启节点"] [role="tab"]').first()
      .locator('.nk-egd-nodecard__img'))
      .toHaveAttribute('src', new RegExp(lastWaveMonster(maze.tierce!.nodes![0]).icon!));
    // 卡片带推荐属性与等级：等级取自节点数据
    await expect(page.locator('.nk-egd-nodecard').first().locator('.nk-egd-nodecard__val'))
      .toHaveText(String(maze.tierce!.nodes![0].level));
    // 子档：缩进 = --eg-indent 令牌落值；**星启看板体不画层级竖轨**（用户裁决：通体模式色线重复点题，
    // 层级改由「缩进 + 字号档」承担），轨线只保留在异相仲裁单关面板体。
    // 孙档：看板内「第 N 波」标签与层级刻度无关，但两处取值同源（字号不得分叉）
    const egIndent = await readTokenPx(page, '--eg-indent', '.nk-egd');
    expect(egIndent, '父子层级缩进令牌必须在 .nk-egd 上声明').toBeGreaterThan(0);
    const child = page.locator('.nk-egd-board__body').first();
    await expectTokenNumber(child, 'padding-left', egIndent, '星启看板体缩进');
    const childRailWidth = await child.evaluate((el) => parseFloat(getComputedStyle(el, '::before').width) || 0);
    expect(childRailWidth, '星启看板体的层级竖轨应已移除（缩进保留）').toBe(0);
    expect(await fontPx(page.locator('.nk-egd-board .nk-egd-floor__wavelabel').first()))
      .toBe(await fontPx(page.locator('.nk-egd-floor__wavelabel').first()));
    // 敌方卡网格的 8px 下外边距只服务多波之间：非末波仍为 8px，末波归零（尾随留白不进入块间距）
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

    // 异相仲裁单关面板（子 tab 承载关卡后仍是「无卡片行」的唯一模式）：缩进与另三模式同刻度，竖轨已整条退场
    await page.goto('/endgame/peak/9');
    const peakBody = page.locator('.nk-egd-peak__body').first();
    await expect(peakBody).toBeVisible();
    await expectTokenNumber(peakBody, 'padding-left', egIndent, '异相仲裁单关面板体缩进');
    const railWidth = await peakBody.evaluate((el) => parseFloat(getComputedStyle(el, '::before').width) || 0);
    expect(railWidth, '异相仲裁单关面板体的层级竖轨已移除（缩进保留）').toBe(0);
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/endgame/maze/1036：父子层级刻度（ADR 0028）手机断点', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/endgame/maze/1036');
    // 手机端缩进降档（仍由同一令牌声明）、层级竖轨整条退场（看板体与单关面板体都不画）；
    // 父档（卡片节点号）字号仍严格大于孙档「第 N 波」标签
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