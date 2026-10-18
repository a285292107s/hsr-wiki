import { test, expect } from '@playwright/test';
import { collectConsoleIssues, computedNumber, fontPx, readJson, readTokenPx, waitForCatalogCards } from './helpers';
import { CN_NUM, cnBigNumber, expectTokenNumber, floorBossName, floorGuide, grouped, itemNameMap, lastWaveMonster, levelTabLabels, monsterBadge, noUnknownOverflow, peakTabId, peakTabLabels, pollutedMonsters, pollutedSeasonHrefs, pollutedSummons, pollutionEntries, rewardNames, rewardNums, seasonData, seasonTabLabels, stageGuide, summonBadge, summonsOf, tierceNodeBossNames } from './layout.shared';

/**
 * 布局验收：终局层级与看板 · 末日幻影（boss）。
 *
 * 与 `layout-endgame-board-season.spec.ts` 分文件的理由：`--shard` 只在**文件**边界生效，
 * 一个巨型文件就是 CI 墙钟下界——拆开才能让两块并行。判据见 docs/agents/testing.md
 * 「layout 必须按 describe 边界分文件」（此处不重复该规则，也不记耗时数字：它们必然过期）。
 * 按「玩法」切分：本文件是 boss 的上/下半场投影。
 *
 * `@viewport-pinned` 标签：凡用例内自行 `setViewportSize(...)` 固定视口者，必须在 `test(...)`
 * 第二参传该标签（mobile-chromium 以 `grepInvert` 跳过）。标签须静态书写，动态 annotation 对收集期过滤无效。
 *
 * 数值断言三种合法形态（令牌派生 / 相对关系 / 数据派生）与裸 px 禁令见 `layout-endgame.spec.ts` 文件头。
 */
test.describe('布局验收：终局层级与看板 · 末日幻影', () => {
  test('/endgame/boss/3021：层级子 tab（ADR 0026 / 0030）', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/endgame/boss/3021');
    const season = seasonData('maze_boss.json', '3021');
    // 末日幻影不渲染顶部固定条（`padding-top` 归零），导航交给页内一行子 tab
    await expect(page.locator('.nk-egd-bar')).toHaveCount(0);
    await expect(page.locator('.nk-egd.nk-page--detail')).toHaveCSS('padding-top', '0px');
    await expect(page.locator('.nk-egd-secnav')).toHaveCount(0);
    // 赛季级「污染等级」区块已退场（用户裁决）：面板首块即关卡子 tab，污染只挂到被污染的敌方 / 召唤物卡上
    await expect(page.locator('#egd-pollution, .nk-egd-poll')).toHaveCount(0);
    await expect(page.locator('.nk-egd-panel > *').first()).toHaveClass(/nk-egd-tabs/);
    // 子 tab：星启模式在最前（默认项）+ 第 N..1 层倒序；默认停在星启模式（用户裁决）
    const tabs = page.locator('.nk-egd-tabs [role="tab"]');
    await expect(tabs).toHaveText(levelTabLabels(season));
    await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
    // 默认停在星启模式，故先显式切到第 1 层：层口径的断言（星级目标 / 半场卡片 / 看板）都在层 tab 分支下
    await page.locator('#egd-level-tab-floor-1').click();
    // 层没有标题行（用户裁决）：面板首块即半场卡片行（奖励板已垫到底部）
    await expect(page.locator('.nk-egd-lvl__head')).toHaveCount(0);
    // 星级奖励列表：目标逐档一行（档数取自层数据），每行 = 档位徽章 + 该档条件 + 该档奖励
    await expect(page.locator('#egd-level-panel .nk-egd-tierlist .nk-egd-head__label'))
      .toHaveText('星级目标 · 星级奖励');
    const floor1Targets = season.floor_details![0].targets!;
    const starRows = page.locator('#egd-level-panel .nk-egd-tiers .nk-egd-node');
    await expect(starRows).toHaveCount(floor1Targets.length);
    await expect(starRows.last()).toContainText(String(floor1Targets[floor1Targets.length - 1].param));
    // 末日幻影节点看板中的末法余烬仍只显示该层绑定增益名
    await expect(page.locator('#egd-floor-board > .nk-egd-board__body > .nk-egd-floor__buff .nk-egd-floor__buffhead'))
      .toHaveText(season.floor_details![0].buff!.name);
    await expect(page.locator('.nk-egd-floor__bufflabel')).toHaveCount(0);
    const tabBoxes = await tabs.evaluateAll((els) => els.map((el) => {
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.x), y: Math.round(r.y) };
    }));
    expect(new Set(tabBoxes.map((b) => b.y)).size).toBe(1);
    const xs = tabBoxes.map((b) => b.x);
    expect(xs).toEqual([...xs].sort((a, b) => a - b));
    // 污染判据全部由数据派生：条目数 / 徽标 / 档位数 / 被污染怪物数
    const poll = pollutionEntries(season);
    const polledFloors = poll.filter((e) => e.floor != null);
    expect(polledFloors.length).toBeGreaterThan(0);
    const cleanFloor = (season.floor_details ?? []).find(
      (f) => !polledFloors.some((e) => e.floor === f.floor),
    );
    // 层标题不再承载逐半场污染徽标（用户裁决）：徽标随所属半场落在看板内（与星启看板同一规则）
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
      // 面板级污染徽标已退场（用户裁决）：污染等级只挂到被污染的那一只敌方卡上。
      // 末日幻影楼层只登记首领、被污染小怪不在敌方配置里 → 它们以召唤物形式带徽标（ADR 0036）。
      await expect(page.locator('#egd-floor-board .nk-egd-board__head, #egd-floor-board .nk-egd-floor__head .nk-egd-pollchip'))
        .toHaveCount(0);
      const stage = (season.floor_details ?? []).find((f) => f.floor === entry.floor)![half]!;
      const polledSummons = pollutedSummons(stage.monsters);
      expect(polledSummons.length, `第 ${entry.floor} 层 ${half} 应有受污染的召唤物`).toBeGreaterThan(0);
      await expect(page.locator('#egd-floor-board .nk-egd-mon__data .nk-egd-summons .nk-egd-pollchip'))
        .toHaveText(polledSummons.map(summonBadge));
      // 该层敌方配置里没有登记被污染小怪 → 敌方卡自身不带徽标（徽标落点 = 立绘列内，见 ADR 0026 补记三）
      await expect(page.locator('#egd-floor-board .nk-egd-mon__art .nk-egd-pollchip')).toHaveCount(0);
    }
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/endgame/boss/3020：层级只为上下半场 + 星启单节点看板（ADR 0029 / 0030 / 0031 / 0032 / 0033）', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/endgame/boss/3020');
    const season = seasonData('maze_boss.json', '3020');
    const stageNum = (season.floor_details ?? []).slice(0, 1).flatMap((f) => [f.stage1, f.stage2]).filter(Boolean).length;
    const nodeBoss = tierceNodeBossNames(season);
    const stageBuffs = season.buff_groups?.stage1 ?? [];
    // 首领机制随敌方卡呈现（ADR 0029 修订）：正文按敌方 `boss_guide` 指针从赛季级 boss_guides 取
    const floor1Guide = floorGuide(season, 1, 'stage1');
    const stageTraits = floor1Guide?.traits ?? [];
    const floor1Phases = floor1Guide?.phases ?? [];
    const tierceData = season.tierce!;
    const tabs = page.locator('.nk-egd-tabs [role="tab"]');
    await expect(tabs).toHaveText(levelTabLabels(season));
    // 默认停在星启模式（用户裁决，推翻 ADR 0030 决策 6）；层口径的断言在下方显式切到第 1 层后取
    await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
    await page.locator('#egd-level-tab-floor-1').click();
    await expect(page.locator('#egd-level-tab-floor-1')).toHaveAttribute('aria-selected', 'true');
    // 第 1 层：半场卡片行（两张）+ 一次只渲染一个半场的看板；看板块序 = 首领特性 → 敌方配置 → 赛季增益
    const halfCards = page.locator('.nk-egd-nodecards[aria-label="半场"] [role="tab"]');
    await expect(halfCards).toHaveCount(stageNum);
    await expect(halfCards.locator('.nk-egd-nodecard__name')).toHaveText(['上半场', '下半场']);
    await expect(halfCards.first()).toHaveAttribute('aria-selected', 'true');
    const floorBoard = page.locator('#egd-floor-board');
    await expect(floorBoard).toHaveCount(1);
    await expect(floorBoard).toHaveAttribute('aria-labelledby', 'egd-floor-half-tab-stage1');
    // 敌方取实际战斗数据（影将军），不是 ChallengeBossMazeExtra 的指南别名蚀心兽（ADR 0031）
    await expect(floorBoard.locator('.nk-egd-mon__name')).toHaveText(floorBossName(season, 1, 'stage1'));
    // 半场身份只在卡片上出现一次：看板内不复述场次标签 / 场次行头 / 波次·敌数
    await expect(floorBoard.locator('.nk-egd-group__label')).toHaveCount(0);
    await expect(floorBoard.locator('.nk-egd-floor__stagelabel')).toHaveCount(0);
    await expect(floorBoard.locator('.nk-egd-floor__moncount')).toHaveCount(0);
    const boardGroups = floorBoard.locator('.nk-egd-group');
    // 场次级区块只剩赛季增益：首领机制已随敌方卡走（ADR 0029 修订），不再有场次级整组卡片
    await expect(boardGroups).toHaveCount(1);
    await expect(boardGroups.nth(0).locator('.nk-egd-group__title')).toHaveText('终焉公理');
    await expect(floorBoard.locator('.nk-egd-traits')).toHaveCount(0);
    // 首领特性 = 首领卡内的一个分区（与「技能」「召唤物」同一套卡内语言），条数取自该半场数据
    const guideSec = floorBoard.locator('.nk-egd-mon__data > .nk-egd-guide');
    await expect(guideSec).toHaveCount(1);
    await expect(guideSec.locator('.nk-egd-guide__label')).toHaveText('首领特性');
    await expect(guideSec.locator('.nk-egd-trait')).toHaveCount(stageTraits.length);
    // 坚防守备（#1/#2 参数按 ParameterList 渲染为百分比，期望值取自 param_list）
    const trait0 = guideSec.locator('.nk-egd-trait').first();
    await expect(trait0).toContainText(stageTraits[0].name);
    await expect(trait0).toContainText(`${stageTraits[0].param_list![0] * 100}%`);
    await expect(trait0).toContainText(`${stageTraits[0].param_list![1] * 100}%`);
    // 阶段机制（MonsterGuidePhase × MonsterGuideSkillText）：同一只卡内另起一段，文案逐字取自数据
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
    // 卡内分区序（结构断言，抓顺序翻转）：名称/标签 → 弱点抗性 → 首领特性 → 阶段机制 → 技能 → 召唤物
    const dataOrder = await floorBoard.locator('.nk-egd-mon__data').first()
      .evaluate((el) => [...el.children].map((c) => c.className.split(' ')[0]));
    expect(dataOrder).toEqual([
      'nk-egd-mon__meta', 'nk-egd-mon__rows',
      'nk-egd-guide', 'nk-egd-phase', 'nk-egd-mon__skills', 'nk-egd-summons',
    ]);
    // 效果抵抗（MonsterConfig.DebuffResist × MonsterStatusResistanceType）：上游只有图标没有文字名，
    // 故呈现 = 图标 + 百分比（期望值取自数据）；图标是本地入库的 statusimmune 资源，
    // 用 naturalWidth 证明路径真的命中（否则只是 src 字符串对得上），并锁住本地缺失时的 jsDelivr 回退
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
    // 图标是 lazy 加载：先滚进视口再等 naturalWidth（否则懒加载不触发，poll 永远拿到 0）
    await immImg.scrollIntoViewIfNeeded();
    await expect.poll(() => immImg.evaluate((el) => (el as HTMLImageElement).naturalWidth),
      { timeout: 10_000 }).toBeGreaterThan(0);
    await expect(floorBoard.locator('.nk-egd-buff')).toHaveCount(stageBuffs.length);
    // 第 1 层上半场：本层无污染，但召唤物照样在首领卡内列出（触发条件 = 该敌方有召唤表），且全程无徽标
    await expect(floorBoard.locator('.nk-egd-board__head, .nk-egd-pollchip')).toHaveCount(0);
    const floor1Stage = (season.floor_details ?? []).find((f) => f.floor === 1)!.stage1!;
    const floor1Summons = summonsOf(floor1Stage.monsters);
    expect(floor1Summons.length).toBeGreaterThan(0);
    await expect(floorBoard.locator('.nk-egd-mon > .nk-egd-mon__data > .nk-egd-summons .nk-egd-summon'))
      .toHaveCount(floor1Summons.length);
    await expect(floorBoard.locator('.nk-egd-mon > .nk-egd-mon__data > .nk-egd-summons .nk-egd-pollchip')).toHaveCount(0);
    // 召唤物不再是独立一行（ADR 0036 修订）：归属落在召唤者卡片内
    await expect(floorBoard.locator('.nk-egd-floor__row--summons')).toHaveCount(0);
    // 下半场：切卡片即换看板（敌方随子切换），身份只在卡片上变
    await halfCards.nth(1).click();
    await expect(halfCards.nth(1)).toHaveAttribute('aria-selected', 'true');
    await expect(floorBoard).toHaveAttribute('aria-labelledby', 'egd-floor-half-tab-stage2');
    await expect(floorBoard.locator('.nk-egd-mon__name')).toHaveText(floorBossName(season, 1, 'stage2'));
    // 第 3 层上半场（污染关卡）：同一首领的召唤物里只有一部分受污染，其余不挂徽标
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
    // 第 4 层：仍只有上下半场两场战斗——星启附加关（超偶像）只在星启模式 tab 出现
    await page.locator('#egd-level-tab-floor-4').click();
    await expect(page.locator('.nk-egd-nodecards[aria-label="半场"] [role="tab"]')).toHaveCount(stageNum);
    await page.locator('#egd-floor-half-tab-stage2').click();
    await expect(floorBoard.locator('.nk-egd-mon__name')).toHaveText(floorBossName(season, 4, 'stage2'));
    await expect(page.locator('.nk-egd-lvl')).not.toContainText(nodeBoss[2]);
    // 该层星级目标仍是层级自己的档位（不含星启的 4 档）：档数与末档分数都取自层数据
    const floor4Targets = (season.floor_details ?? []).find((f) => f.floor === 4)!.targets!;
    const floorTargets = page.locator('.nk-egd-tiers .nk-egd-node');
    await expect(floorTargets).toHaveCount(floor4Targets.length);
    await expect(floorTargets.last()).toContainText(String(floor4Targets[floor4Targets.length - 1].param));
    // 记录第 4 层上下半场的推荐属性（卡片）与赛季增益（逐半场取），用于与星启节点 1/2 逐字比对
    const floor4Elems = await page.locator('.nk-egd-nodecards[aria-label="半场"] .nk-egd-nodecard__elems')
      .evaluateAll((els) => els.map((el) => el.innerHTML));
    const floor4Buffs: string[] = [];
    for (const key of ['stage1', 'stage2'] as const) {
      await page.locator(`#egd-floor-half-tab-${key}`).click();
      floor4Buffs.push(...await floorBoard.locator('.nk-egd-buff__name')
        .evaluateAll((els) => els.map((el) => el.textContent?.trim() || '')));
    }
    // 星启模式 tab：面板级「星级目标｜通关奖励」在顶，其下是节点子切换 + 单节点看板
    await page.locator('#egd-level-tab-tierce').click();
    const tierce = page.locator('#egd-level-panel .nk-egd-tierce');
    await expect(tierce).toBeVisible();
    // 节点卡片：三张并列一行，每张带节点号 + 末波首领图 + 推荐属性 + 等级（一次只渲染一个看板）
    const nodeTabs = tierce.locator('.nk-egd-nodecards[aria-label="星启节点"] [role="tab"]');
    await expect(nodeTabs).toHaveCount(nodeBoss.length);
    // 卡片节点号文案是站点自创格式（idx → 中文序号），条数与顺序随数据
    await expect(nodeTabs.locator('.nk-egd-nodecard__name')).toHaveText(
      tierceData.nodes!.map((nd) => `节点${CN_NUM[nd.idx - 1] ?? nd.idx}`),
    );
    await expect(nodeTabs.first()).toHaveAttribute('aria-selected', 'true');
    // 三张卡片同一行（同一 y）且等宽
    const cardBoxes = await nodeTabs.evaluateAll((els) => els.map((el) => {
      const r = el.getBoundingClientRect();
      return { y: Math.round(r.y), w: Math.round(r.width) };
    }));
    expect(new Set(cardBoxes.map((b) => b.y)).size).toBe(1);
    expect(new Set(cardBoxes.map((b) => b.w)).size).toBe(1);
    // 三卡一行排得下（手机断点卡片内改上下排版后同样成立）：行不横滚、卡内不溢出、末卡不出行右边界
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
    // 卡面：推荐属性（该节点 damage 的元素图标）+ 敌人等级（都随节点数据）
    await expect(nodeTabs.nth(0).locator('.nk-egd-nodecard__row')).toHaveCount(2);
    await expect(nodeTabs.nth(0).locator('.nk-egd-nodecard__label')).toHaveText(['推荐属性', '等级']);
    const tierceNodes = tierceData.nodes!;
    await expect(nodeTabs.nth(0).locator('.nk-egd-nodecard__elems .nk-egd-elem'))
      .toHaveCount(tierceNodes[0].damage!.length);
    for (const nd of tierceNodes) {
      await expect(nodeTabs.nth(nd.idx - 1).locator('.nk-egd-nodecard__val')).toHaveText(String(nd.level));
    }
    // boss 图 = 该节点末波首领（末日幻影每节点 1 敌即首领本体）：图源随数据走，等真图出位图
    const nodeBossImgs = nodeTabs.locator('.nk-egd-nodecard__img');
    await expect(nodeBossImgs).toHaveCount(tierceNodes.length);
    for (const nd of tierceNodes) {
      await expect(nodeBossImgs.nth(nd.idx - 1)).toHaveAttribute('src', new RegExp(lastWaveMonster(nd).icon!));
    }
    // 逐张滚进视口再等出位图：手机端横向滚动区外的懒加载图不会自行取图（naturalWidth 恒 0）
    for (let i = 0; i < tierceNodes.length; i += 1) {
      await nodeTabs.nth(i).scrollIntoViewIfNeeded();
      await expect.poll(
        async () => nodeBossImgs.nth(i).evaluate((el) => (el as HTMLImageElement).naturalWidth),
        { timeout: 15_000 },
      ).toBeGreaterThan(0);
    }
    const board = tierce.locator('.nk-egd-board');
    await expect(board).toHaveCount(1);
    // 看板行头整块退场（用户裁决）：节点身份由卡片子切换承担，看板内不再复述节点号与波次·敌数
    await expect(board.locator('.nk-egd-tierce__nodezh')).toHaveCount(0);
    await expect(board.locator('.nk-egd-tierce__nodefrom')).toHaveCount(0);
    // 3020 节点 1 带污染：面板级徽标已退场（用户裁决）——污染等级只挂到被污染的那一只（此处是召唤物）上
    await expect(board.locator('.nk-egd-board__head, .nk-egd-floor__head .nk-egd-pollchip')).toHaveCount(0);
    await expect(board.locator('.nk-egd-mon__art .nk-egd-pollchip')).toHaveCount(0);
    await expect(board).toHaveAttribute('aria-labelledby', 'egd-tierce-node-tab-1');
    await expect(board.locator('.nk-egd-mon__name')).toHaveText(nodeBoss[0]);
    // 看板行头不重复等级与推荐属性（卡片已承载）：只剩敌方配置一行
    await expect(board.locator('.nk-egd-tierce__damagerow')).toHaveCount(0);
    await expect(board.locator('.nk-egd-floor__row')).toHaveCount(1);
    await expect(board.locator('.nk-egd-floor__row--mons')).toHaveCount(1);
    await expect(board.locator('.nk-egd-floor__moncount')).toHaveCount(0);
    // 召唤物（ADR 0036 修订）：并入召唤者自己的敌方卡片——末日幻影每场只登记首领本体，
    // 召唤物由该首领的 SummonIDList 得到；受污染者挂污染等级徽标，未挂徽标即未受污染
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
    // 召唤物不再另起一行：场次块里没有召唤物行，只有卡片内部这一处
    await expect(board.locator('.nk-egd-floor__row--summons')).toHaveCount(0);
    // 卡内分区语言：召唤物块与「弱点/抗性」「技能」同构（上发丝线 + 上内距），不是贴在卡外的旁注
    const cardSummons = board.locator('.nk-egd-mon > .nk-egd-mon__data > .nk-egd-summons');
    expect(await computedNumber(cardSummons, 'border-top-width'), '卡内召唤物块应有上发丝线').toBe(1);
    expect(await computedNumber(cardSummons, 'padding-top'), '卡内召唤物块应有上内距').toBeGreaterThan(0);
    // 字号档位（绝对值交 CSS，这里只锁相对序与「档位真的拉开」）：
    // 卡片节点号 > 区块标题（= 敌方配置标题，同一处声明）> 正文 > 卡片内行首标签
    // 同一条用例在桌面与手机两种断点下都要成立
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
    // 「敌方配置」已提为区块标题（用户裁决）：与「首领特性 / 赛季增益」同档、共用一处字号声明
    expect(scale.monsTitle, '敌方配置标题与区块标题同档').toBe(scale.groupTitle);
    for (const [name, lower, higher] of [
      ['卡片节点号 > 区块标题', scale.groupTitle, scale.card],
      ['区块标题 > 卡片内行首标签', scale.rowLabel, scale.groupTitle],
      ['正文 > 卡片内行首标签', scale.rowLabel, scale.prose],
    ] as const) {
      expect(higher, `${name}（${higher} vs ${lower}）`).toBeGreaterThan(lower + 0.5);
    }
    // 敌方卡 = 左右结构（用户裁决）：左列立绘、右列数据。
    // 判据取几何而非类名：数据列整体在立绘列右侧且水平不重叠；两列顶边对齐；
    // 立绘保持 376×512 竖版原比例（不做圆形裁切 → 宽高比 ~0.73、非 1:1），且未被裁到 62px 的旧圆形尺寸。
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
    // 立绘列宽度 = 该卡内容区里立绘的渲染宽；数据列占满剩余宽
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
    // 敌方配置 = 标题在上、卡组在下（消掉原「左标签列 + 右卡片」在桌面端标签下方那一整列空列）：
    // 卡组顶边在标题底边之下、左缘与标题齐平、并占满行的内容宽
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
    // 同页两个正文档位（特性描述 / 增益描述）必须同值：档位漂移会在这里暴露，而非靠钉死 13.44px
    expect(await fontPx(board.locator('.nk-egd-trait__desc').first()))
      .toBe(await fontPx(board.locator('.nk-egd-buff__desc').first()));
    // 看板体块序：末法余烬 → 赛季增益（正名后 = 该玩法体系名；末法余烬行只留增益名）→ 敌方配置
    await expect(board.locator('.nk-egd-floor__buffhead')).toHaveText(tierceData.nodes![0].buff!.name);
    await expect(board.locator('.nk-egd-floor__bufflabel')).toHaveCount(0);
    await expect(board.locator('.nk-egd-group__title')).toHaveText(['终焉公理']);
    await expect(board.locator('.nk-egd-buff')).toHaveCount(stageBuffs.length);
    // 首领机制改随敌方卡呈现（ADR 0029 修订）：看板层不再有场次级整组卡片，也没有标签切换形态
    await expect(board.locator('.nk-egd-pilltabs')).toHaveCount(0);
    await expect(board.locator('.nk-egd-traits')).toHaveCount(0);
    const tierceGuideSec = board.locator('.nk-egd-mon__data > .nk-egd-guide');
    await expect(tierceGuideSec).toHaveCount(1);
    const traitItems = tierceGuideSec.locator('.nk-egd-trait');
    await expect(traitItems).toHaveCount(stageTraits.length);
    await expect(traitItems.locator('.nk-egd-trait__name')).toHaveText(stageTraits.map((t) => t.name));
    // 机制参数按 ParameterList 渲染成百分比（期望值取自 param_list）：四条说明同屏，不再需要点击展开
    await expect(traitItems.first()).toContainText(`${stageTraits[0].param_list![0] * 100}%`);
    await expect(traitItems.first()).toContainText(`${stageTraits[0].param_list![1] * 100}%`);
    // 卡内分区语言：上发丝线 + 上内距（与「技能」「召唤物」同构）；**不再另套一层盒子**——
    // 卡本身就是盒子，分区若再带填充 / 圆角 / 描边就是同一事实套两层（ADR 0029 修订判据）
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
    // 发丝线与卡内同族分区同一支中性线（不是模式色）
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
    // 敌方配置块下方不得留尾随空白：末波敌方网格的 8px 下外边距只服务多波之间
    // （`.nk-egd-floor__monswrap` 已有 9px gap），末位归零。召唤物并入敌方卡内（ADR 0036 修订）后
    // 「敌方配置」重回场次块末行，`.nk-egd-floor__row:last-child` 收掉下内距与发丝线；
    // 赛季增益改到敌方配置之前（用户裁决），故场次块现在是看板体的**末块**。
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
    // 节点 1/2 与第 4 层上下半场逐字同源：推荐属性（卡片）与赛季增益同源同值（ADR 0032 决策 3）
    const node1Elems = await nodeTabs.nth(0).locator('.nk-egd-nodecard__elems').innerHTML();
    expect(node1Elems).toBe(floor4Elems[0]);
    await expect(board.locator('.nk-egd-buff__name')).toHaveText(floor4Buffs.slice(0, stageBuffs.length));
    // 节点二：同一套看板，内容随节点子切换（身份只在卡片上换）
    await nodeTabs.nth(1).click();
    await expect(nodeTabs.nth(1)).toHaveAttribute('aria-selected', 'true');
    await expect(board).toHaveAttribute('aria-labelledby', 'egd-tierce-node-tab-2');
    await expect(board.locator('.nk-egd-mon__name')).toHaveText(nodeBoss[1]);
    await expect(board.locator('.nk-egd-buff__name'))
      .toHaveText(floor4Buffs.slice(stageBuffs.length, stageBuffs.length * 2));
    // 节点三 = 星启附加关：敌方是附加关首领，增益/特性走 tierce 那一组（不是节点 1/2 的常规那组）
    await nodeTabs.nth(2).click();
    await expect(nodeTabs.nth(2)).toHaveAttribute('aria-selected', 'true');
    await expect(board).toHaveAttribute('aria-labelledby', 'egd-tierce-node-tab-3');
    await expect(board).toContainText(nodeBoss[2]);
    // 节点三也有末法余烬：来源是附加关关卡自身绑定的增益（ADR 0032 2026-10-02 修订），不再整块退场
    await expect(board.locator('.nk-egd-floor__buffhead')).toHaveText(tierceData.nodes![2].buff!.name);
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
    // 赛季增益不再有面板级副本：一份分组只长在当前节点的看板里（首领机制已移入敌方卡，不再占区块）
    await expect(tierce.locator('.nk-egd-group__title')).toHaveCount(1);
    await expect(tierce.locator('.nk-egd-group__title')).toHaveText(['终焉公理']);
    // 赛季级统计条退场（用户裁决）：回合限制 / 分数限制改由「通关条件」格承担，同一事实只留一处
    await expect(tierce.locator('.nk-egd-tierce__stats')).toHaveCount(0);
    // 面板级奖励板 = 通关条件｜通关奖励 / 星级奖励列表（一档一行，含棱彩星档，见 ADR 0051 补记三 / 四）
    await expect(tierce.locator('.nk-egd-head__label'))
      .toHaveText(['通关条件', '通关奖励', '星级目标 · 星级奖励']);
    const tierceTargets = tierceData.targets!.filter((t) => !t.prism);
    const prismTarget = tierceData.targets!.find((t) => t.prism)!;
    // 一档一行：3 星档 + 棱彩星档（末位），每行 = 档位徽章 + 该档条件 + 该档奖励 chips
    const tierRows = tierce.locator('.nk-egd-tiers li');
    // 分数档不带行首星标（星数由档位徽章给）；末日幻影目标全是分数档 → 无语义胶囊
    await expect(tierce.locator('.nk-egd-tiers .nk-egd-node__type')).toHaveCount(0);
    await expect(tierce.locator('.nk-egd-tiers .nk-egd-tier__brace')).toHaveCount(0);
    await expect(tierce.locator('.nk-egd-tiers .nk-egd-tier__lead')).toHaveCount(tierceData.targets!.length);
    await expect(tierce.locator('.nk-egd-tiers .nk-egd-node')).toHaveCount(tierceData.targets!.length);
    await expect(tierRows.nth(tierceTargets.length - 1).locator('.nk-egd-node__text'))
      .toContainText(String(tierceTargets[tierceTargets.length - 1].param));
    await expect(tierRows).toHaveCount(tierceTargets.length + 1);
    await expect(tierRows.last().locator('.nk-egd-tier__badge')).toHaveText('棱彩星');
    await expect(tierRows.last().locator('.nk-egd-node__text')).toContainText(String(prismTarget.param));
    await expect(tierRows.last().locator('.nk-egd-reward__name'))
      .toHaveText(rewardNames(tierceData.prism_reward!, itemNameMap()));
    // 通关奖励仍是独立的左栏（chips 数取自 EGEEJLHBALB）
    await expect(page.locator('#egd-level-panel .nk-egd-head > .nk-egd-reward .nk-egd-reward__name'))
      .toHaveCount(tierceData.rewards!.length);
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/endgame/boss/3020：节点卡片窄屏（375px）一行三卡 + 卡内上下排版', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/endgame/boss/3020');
    const season = seasonData('maze_boss.json', '3020');
    // 默认停在星启模式，故先切到第 1 层再取层分支的半场卡片几何
    await page.locator('#egd-level-tab-floor-1').click();
    // 层 tab 的半场卡片同形：375px 下两张同一行、卡内上下排版、行不横滚
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
    // 最密的元素图标行（数量取自节点数据）在 1/3 屏宽里也排得下
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
    // 卡内：图在上、信息在下。几何必须同帧取——卡面 boss 图是 CDN 懒加载，先后两次
    // boundingBox 之间图片出位图会让 fig 高度变化，实测出现 8px 假失败（判据不变，只去掉测量竞态）
    const stacked = await card.evaluate((el) => {
      const fig = el.querySelector('.nk-egd-nodecard__fig')!.getBoundingClientRect();
      const body = el.querySelector('.nk-egd-nodecard__body')!.getBoundingClientRect();
      return { figBottom: Math.round(fig.bottom), bodyTop: Math.round(body.top) };
    });
    expect(stacked.figBottom).toBeLessThanOrEqual(stacked.bodyTop);
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/endgame/boss/3021：底部相邻赛季导航窄屏（375px）维持一行两栏', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/endgame/boss/3021');
    // 相邻赛季 id 取自目录数据（同一排序口径），不在断言里写死 3020/3022
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
    // 同一行两栏：行数 1、实测栏间距 = 容器声明的 column-gap（间距被内容吞掉才红）、两栏各自不横向溢出
    expect(narrow.rows).toBe(1);
    expect(narrow.gap).toBe(Math.round(navGap));
    expect(narrow.itemsSpill).toBeLessThanOrEqual(1);
    // 缩略图收窄后「← 上一赛季」仍是单行（折行会翻倍到 ~29px）
    expect(narrow.dirHeight).toBeLessThan(24);
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/endgame/boss/3020：星启面板两栏 + 星级奖励列表，窄屏堆叠', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/endgame/boss/3020');
    // 层 tab 分支（星启 tab 之前测）：同一处面板级内距必须同时承担两条分支的留白
    // （历史教训：把留白加在 head 自身只修好星启 tab，层 tab 分支仍贴着发丝线）
    // 默认停在星启模式，故显式切到第 1 层取层分支几何，再切回星启 tab 取另一条分支
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
    const head = page.locator('#egd-level-panel .nk-egd-head');
    await expect(head).toBeVisible();
    // 六格齐备（2×2 + 星启专属的棱彩星行），星级目标不含满分档
    const tierceData = seasonData('maze_boss.json', '3020').tierce!;
    await expect(head.locator('.nk-egd-head__label'))
      .toHaveText(['通关条件', '通关奖励', '星级目标 · 星级奖励']);
    await expect(head.locator('.nk-egd-tiers .nk-egd-node')).toHaveCount(tierceData.targets!.length);
    await expect(head.locator('.nk-egd-tiers li')).toHaveCount(tierceData.targets!.length);
    await expect(page.locator('#egd-level-panel .nk-egd-head > .nk-egd-reward')
      .locator('.nk-egd-reward__name')).toHaveCount(tierceData.rewards!.length);
    // 分数档之间靠行距分行，不画分隔线（同级只读条目，线不承载层级）
    await expect(head.locator('.nk-egd-node').first()).toHaveCSS('border-bottom-width', '0px');
    // 几何必须同帧取：点 tab 后的滚动动画会让先后两次 boundingBox 落在不同滚动位置
    const desktop = await page.evaluate(() => {
      const box = (el: Element) => el.getBoundingClientRect().toJSON() as DOMRect;
      const panel = document.querySelector('#egd-level-panel') as HTMLElement;
      const h = document.querySelector('#egd-level-panel .nk-egd-head') as HTMLElement;
      const cols = [...h.children];
      return {
        head: box(h),
        wrap: box(panel.firstElementChild as HTMLElement),
        tabs: box(document.querySelector('.nk-egd-tabs') as HTMLElement),
        left: box(cols[0]),
        right: box(cols[1]),
        nodes: box(document.querySelector('#egd-level-panel .nk-egd-board') as HTMLElement),
        panelPadTop: parseFloat(getComputedStyle(panel).paddingTop) || 0,
      };
    });
    /* 面板首块不与子 tab 行的发丝线相贴（用户报障项）：留白必须来自**面板级 padding-top** 且 >0。
       判据取「实测留白 = 面板计算 padding-top」而非具体像素——数值从 20 改成别的断言不动，
       贴死或塌成 0 立刻红；单锁首块自身的 margin 只修好星启 tab，层 tab 分支会漏（故两条分支都测）。
       奖励板垫底后首块是卡片行（或看板），故留白一律按**面板首个子元素**取，不再按奖励板取。 */
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
    // 左右并排：两栏顶边齐平、右栏起点接在左栏右边界（中缝发丝线）
    expect(Math.round(desktop.right.y)).toBe(Math.round(desktop.left.y));
    expect(desktop.right.x).toBeGreaterThanOrEqual(desktop.left.x + desktop.left.width);
    // 2×2 板：两列等宽（内容自适应换成了对称两栏，见 ADR 0051 补记二）
    expect(Math.abs(desktop.left.width - desktop.right.width)).toBeLessThanOrEqual(1);
    expect(desktop.left.width).toBeLessThanOrEqual(desktop.head.width * 0.55);
    // 奖励板垫在星启看板之后（奖励载荷逐期恒定，首屏让给当期会变的内容）
    expect(desktop.head.top, '奖励板应位于看板之下').toBeGreaterThanOrEqual(desktop.nodes.bottom - 1);
    // 窄屏堆叠为单列：可见格同左边界、后一格在前一格之下（读序＝通关条件 → 通关奖励 → 星级列表）
    await page.setViewportSize({ width: 390, height: 844 });
    const narrow = await page.evaluate(() => {
      const box = (el: Element) => el.getBoundingClientRect().toJSON() as DOMRect;
      const cols = [...(document.querySelector('#egd-level-panel .nk-egd-head') as HTMLElement).children];
      return { cols: cols.map((c) => box(c)) };
    });
    for (const c of narrow.cols) expect(Math.round(c.x)).toBe(Math.round(narrow.cols[0].x));
    for (let i = 1; i < narrow.cols.length; i += 1) {
      expect(narrow.cols[i].y).toBeGreaterThanOrEqual(narrow.cols[i - 1].bottom - 1);
    }
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/endgame/boss/3020：层 tab 单看板（星级奖励列表 + 半场卡片）+ 字号五档与间距节奏', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/endgame/boss/3020');
    await expect(page.locator('.nk-egd-tabs [role="tab"]').first()).toBeVisible();
    // 默认停在星启模式，故显式切到第 1 层：本用例断的是层分支的块序与间距（层无标题行，面板首块 = 半场卡片行）
    await page.locator('#egd-level-tab-floor-1').click();
    // 层没有标题行（用户裁决）：纵向顺序 = 半场卡片行 → 看板 → 奖励板（奖励载荷逐期恒定，垫底）
    await expect(page.locator('.nk-egd-lvl__head')).toHaveCount(0);
    await expect(page.locator('#egd-level-panel .nk-egd-tierlist .nk-egd-head__label'))
      .toHaveText('星级目标 · 星级奖励');
    const stack = await page.evaluate(() => {
      const box = (sel: string) => (document.querySelector(sel) as HTMLElement).getBoundingClientRect().toJSON() as DOMRect;
      return {
        head: box('#egd-level-panel .nk-egd-head'),
        cards: box('#egd-level-panel .nk-egd-nodecards'),
        board: box('#egd-level-panel .nk-egd-board'),
      };
    });
    expect(stack.board.y).toBeGreaterThanOrEqual(stack.cards.bottom - 1);
    expect(stack.head.y, '奖励板应在看板之下').toBeGreaterThanOrEqual(stack.board.bottom - 1);
    // 各档同级条目靠行距分行，不画分隔线（与星启奖励板同一判据）
    await expect(page.locator('.nk-egd-tiers .nk-egd-node').first()).toHaveCSS('border-bottom-width', '0px');
    // 半场卡片行：两张同一行等宽（层内半场不再纵向铺开）
    const cardBoxes = await page.locator('.nk-egd-nodecards[aria-label="半场"] [role="tab"]').evaluateAll((els) => els.map((el) => {
      const r = el.getBoundingClientRect();
      return { y: Math.round(r.y), w: Math.round(r.width) };
    }));
    expect(new Set(cardBoxes.map((b) => b.y)).size).toBe(1);
    expect(new Set(cardBoxes.map((b) => b.w)).size).toBe(1);
    // 看板：一次一个半场，块序 = 赛季增益（= 终焉公理）→ 敌方配置；层内不复述半场身份
    const board = page.locator('#egd-floor-board');
    await expect(board).toHaveCount(1);
    await expect(board).toHaveCSS('display', 'flex');
    await expect(board.locator('.nk-egd-group__title')).toHaveText(['终焉公理']);
    await expect(board.locator('.nk-egd-group__label')).toHaveCount(0);
    // 首领机制不再占看板层的一个块（ADR 0029 修订）：它长在敌方卡内，
    // 故看板体块序 = 末法余烬 → 赛季增益 → 敌方配置（赛季增益排在敌方配置之前）
    const boardBlocks = await board.locator('.nk-egd-board__body').evaluate((el) =>
      [...el.children].map((c) => (c as HTMLElement).className.split(' ')[0]));
    expect(boardBlocks).toEqual(['nk-egd-floor__buff', 'nk-egd-group', 'nk-egd-floor__stage']);
    // 卡内分区序（结构断言，抓顺序翻转）：名称/标签 → 弱点抗性 → 首领特性 → 阶段机制 → 技能 → 召唤物
    const cardBlocks = await board.locator('.nk-egd-mon__data').first().evaluate((el) =>
      [...el.children].map((c) => (c as HTMLElement).className.split(' ')[0]));
    expect(cardBlocks).toEqual([
      'nk-egd-mon__meta', 'nk-egd-mon__rows',
      'nk-egd-guide', 'nk-egd-phase', 'nk-egd-mon__skills', 'nk-egd-summons',
    ]);
    await expect(board.locator('.nk-egd-floor__stagelabel')).toHaveCount(0);
    await expect(board.locator('.nk-egd-floor__moncount')).toHaveCount(0);
    // 「敌方配置」提为区块标题、卡组在其下方占满行内容宽（无空列）
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
    // 看板体走 ADR 0028 的缩进档但不画模式色竖轨（与星启看板同判据：缩进保留、轨宽归零）
    const egIndent = await readTokenPx(page, '--eg-indent', '.nk-egd');
    const boardBody = page.locator('.nk-egd-board__body');
    await expectTokenNumber(boardBody, 'padding-left', egIndent, '层看板体缩进');
    expect(await boardBody.evaluate((el) => parseFloat(getComputedStyle(el, '::before').width) || 0),
      '层看板体的层级竖轨应归零（缩进保留）').toBe(0);
    // 字号档位（绝对值交 CSS）：同族卡片标题同档、档位严格拉开、行首标签最小档
    const tier = {
      cardName: await fontPx(page.locator('.nk-egd-buff__name').first()),
      traitName: await fontPx(page.locator('.nk-egd-trait__name').first()),
      phaseName: await fontPx(page.locator('.nk-egd-phase__name').first()),
      label: await fontPx(page.locator('.nk-egd-floor__label').first()),
      desc: await fontPx(page.locator('.nk-egd-buff__desc').first()),
      // 卡内分区的区块标签与「召唤物」同族（两者都是敌方卡内的分区标签）
      guideLabel: await fontPx(page.locator('.nk-egd-guide__label').first()),
      summonsLabel: await fontPx(page.locator('.nk-egd-summons__label').first()),
    };
    expect(tier.cardName, '赛季增益 / 首领特性标题同档').toBe(tier.traitName);
    expect(tier.phaseName, '阶段名与首领特性名同档（都是读者要扫的机制名）').toBe(tier.traitName);
    expect(tier.guideLabel, '首领机制标签与召唤物标签同档').toBe(tier.summonsLabel);
    expect(tier.cardName).toBeGreaterThan(tier.desc + 0.5);
    expect(tier.desc).toBeGreaterThan(tier.label + 0.5);
    // 间距契约：首领机制改随敌方卡呈现（ADR 0029 修订）后，它是**卡内分区**而不是独立盒子——
    // 只有上发丝线 + 上内距（与「技能」「召唤物」同一套语言），左右内距归卡、条目自身归零；
    // 正文行高不缩水（行高倍数而非钉死像素）
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
    // 窄屏：小字不回退（同一元素跨断点比较，不钉绝对值），两张半场卡片仍同一行且卡内上下排版
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
    // 该赛季附加关关卡内登记的是无弱点机制本体「心蕉如火的猴把戏」；
    // 推荐属性只认星启表 LOJCIDLKPKG，不从敌方 weak 推导
    const node3Elems = await nodeCardTabs.nth(2).locator('.nk-egd-nodecard__elems').innerHTML();
    expect(node3Elems.length).toBeGreaterThan(0);
    // 面板级统计条已退场：推荐属性只能从节点卡片读到（不再有面板级副本）
    await expect(tierce.locator('.nk-egd-tierce__stats')).toHaveCount(0);
    // 整场推荐属性恰好是附加关登记敌方的 4 个弱点，而不是节点 1/2 的推荐属性
    await nodeCardTabs.nth(0).click();
    const node1Elems = await nodeCardTabs.nth(0).locator('.nk-egd-nodecard__elems').innerHTML();
    expect(node3Elems).not.toBe(node1Elems);
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/endgame/boss/3021：星级奖励一档一行逐层取数（通关条件 / 通关奖励 + 星级列表）', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    const season = seasonData('maze_boss.json', '3021');
    const names = itemNameMap();
    await page.goto('/endgame/boss/3021');
    await page.locator('#egd-level-tab-floor-1').click();
    // 层面板底部「通关奖励」列（与星启面板同形）= 该层 RewardID 解析出的物品
    const headReward = page.locator('#egd-level-panel .nk-egd-head > .nk-egd-reward');
    await expect(headReward).toHaveCount(1);
    await expect(headReward.locator('.nk-egd-head__label')).toHaveText('通关奖励');
    const floor1 = season.floor_details![0];
    await expect(headReward.locator('.nk-egd-reward__name'))
      .toHaveText(rewardNames(floor1.reward!, names));
    await expect(headReward.locator('.nk-egd-reward__num'))
      .toHaveText(rewardNums(floor1.reward!));
    // 星级奖励随层展示（不再有赛季级阶梯块）：本层 3 档 = 数据里该层的切片，
    // 一档一行（档位徽章 + 该档条件 + 该档奖励 chips）
    await expect(page.locator('.nk-egd-starrewards')).toHaveCount(0);
    const list = page.locator('#egd-level-panel .nk-egd-tierlist');
    await expect(list).toHaveCount(1);
    await expect(list.locator('.nk-egd-head__label')).toHaveText('星级目标 · 星级奖励');
    const tierRows = list.locator('.nk-egd-tiers li');
    await expect(tierRows).toHaveCount(floor1.star_rewards!.length);
    await expect(list.locator('.nk-egd-tier__badge'))
      .toHaveText(floor1.star_rewards!.map((t) => `累计 ${t.star}★`));
    await expect(list.locator('.nk-egd-reward__name'))
      .toHaveText(floor1.star_rewards!.flatMap((t) => rewardNames(t.items, names)));
    // 切层后换成该层自己的切片（末日幻影每层 3 目标 = 3 档，层序顺延）
    const floor2 = season.floor_details![1];
    await page.locator('#egd-level-tab-floor-2').click();
    await expect(list.locator('.nk-egd-tier__badge'))
      .toHaveText(floor2.star_rewards!.map((t) => `累计 ${t.star}★`));
    await expect(headReward.locator('.nk-egd-reward__num'))
      .toHaveText(rewardNums(floor2.reward!));
    // 全期档位 = 各层切片拼起来（前端不推层序，切片由转换器按层序算出）
    expect(season.floor_details!.flatMap((f) => f.star_rewards!.map((t) => t.star)))
      .toEqual(season.star_rewards!.map((t) => t.star));
    await noUnknownOverflow(page);
    assertNoErrors();
  });
});