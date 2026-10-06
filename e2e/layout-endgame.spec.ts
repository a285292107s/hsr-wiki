import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { collectConsoleIssues, computedNumber, fontPx, readJson, readTokenPx, resolveTokenColor, waitForCatalogCards } from './helpers';
import { CN_NUM, expectTokenNumber, floorBossName, floorGuide, grouped, lastWaveBossName, lastWaveMonster, levelTabLabels, monCountLabel, monsterBadge, noUnknownOverflow, peakTabLabels, pollutedMonsterCount, pollutedMonsters, pollutedSeasonHrefs, pollutedSummons, pollutionBadge, pollutionEntries, pollutionPosition, seasonData, seasonTabLabels, stageGuide, summonBadge, summonsOf, tierceNodeBossNames } from './layout.shared';

/**
 * 布局验收：终局合并单页 —— layout 验收层（语义契约 + 数值规格）分文件之一。
 *
 * 拆分动因：`fullyParallel: false` 下**文件内**串行，单文件 layout（74 用例 / 469s）把全量墙钟
 * 锁死在 6.6 分钟（a11y 仅 85s 跑完后两个 worker 空转）。按 describe 边界拆开后文件级并行生效，
 * 每条用例的隔离性与拆分前完全一致（文件内本就串行），故已记录的并发 flake 纪律不受影响。
 *
 * `@viewport-pinned` 标签：凡用例内自行 `setViewportSize(...)` 固定视口者，必须在 `test(...)`
 * 第二参传该标签（mobile-chromium 以 `grepInvert` 跳过，视口已由用例钉死）。标签须静态书写，
 * 动态 annotation 对收集期过滤无效。
 *
 * 数值断言的三种合法形态：① 令牌派生（`readTokenPx` / `computedNumber`）；② 相对关系（序、等值、
 * 整数倍、跨断点只放大不缩小）；③ 数据派生（期望值从 `public/data/cn/**.json` 读）。
 * 绝对 px 只允许出现在跨会话不得漂移的契约值。**禁止新增** `toHaveCSS(<绝对值>)` 一类断言。
 *
 * 跨块共用的取值原语与数据派生在 `e2e/layout.shared.ts`；不变量层在 `e2e/guards.spec.ts`。
 */

test.describe('布局验收：终局合并单页', () => {
  test('/endgame：四模式筛选、卡片渲染、无溢出', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/endgame');
    await waitForCatalogCards(page);
    const cardCount = await page.locator('[class*="-grid"] a').count();
    expect(cardCount).toBeGreaterThan(0);
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/endgame/boss/3021：层级子 tab + 污染等级区块（ADR 0026 / 0030）', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/endgame/boss/3021');
    const season = seasonData('maze_boss.json', '3021');
    // 末日幻影不渲染顶部固定条（`padding-top` 归零），导航交给页内一行子 tab
    await expect(page.locator('.nk-egd-bar')).toHaveCount(0);
    await expect(page.locator('.nk-egd.nk-page--detail')).toHaveCSS('padding-top', '0px');
    await expect(page.locator('.nk-egd-secnav')).toHaveCount(0);
    // 赛季级区块保留在子 tab 之上（本模式下它是唯一赛季级区块，序号为 01）
    await expect(page.locator('#egd-pollution')).toBeVisible();
    await expect(page.locator('#egd-pollution')).toHaveText(/污染等级/);
    // 子 tab：紧接污染等级区块（并列一行）、数据层序 + 星启模式；默认停在星启模式（用户裁决，推翻 ADR 0030 决策 6）
    await expect(page.locator('.nk-egd-poll + .nk-egd-tabs')).toHaveCount(1);
    const tabs = page.locator('.nk-egd-tabs [role="tab"]');
    await expect(tabs).toHaveText(levelTabLabels(season));
    await expect(tabs.last()).toHaveAttribute('aria-selected', 'true');
    // 默认停在星启模式，故先显式切到第 1 层：层口径的断言（星级目标 / 半场卡片 / 看板）都在层 tab 分支下
    await page.locator('#egd-level-tab-floor-1').click();
    // 层没有标题行（用户裁决）：面板首块即星级目标
    await expect(page.locator('.nk-egd-lvl__head')).toHaveCount(0);
    // 星级目标逐档一行（档数取自层数据）
    await expect(page.locator('#egd-level-panel .nk-egd-head__label')).toHaveText('星级目标');
    const floor1Targets = season.floor_details![0].targets!;
    const starRows = page.locator('#egd-level-panel .nk-egd-startargets li');
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
      // 该层敌方配置里没有登记被污染小怪 → 敌方卡自身不带徽标
      await expect(page.locator('#egd-floor-board .nk-egd-mon__meta .nk-egd-pollchip')).toHaveCount(0);
    }
    // 赛季级汇总条数与徽标 = 污染节点数据；等级词条只列数据里出现过的档位
    await expect(page.locator('.nk-egd-poll__item')).toHaveCount(poll.length);
    await expect(page.locator('.nk-egd-poll__level')).toHaveCount(season.pollution!.levels.length);
    const levels = await page.locator('.nk-egd-poll__item .nk-egd-poll__badge')
      .evaluateAll((els) => els.map((el) => el.textContent?.trim()));
    expect(levels).toEqual(poll.map(pollutionBadge));
    // 被污染怪物不在本页敌方配置里（末日幻影只登记首领）→ 只能由污染数据给出
    await expect(page.locator('.nk-egd-poll__mon')).toHaveCount(pollutedMonsterCount(season));
    // 回链专题页
    await expect(page.locator('.nk-egd-poll .nk-egd-poll__link')).toHaveAttribute('href', '/voracity');
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
    await expect(tabs.last()).toHaveAttribute('aria-selected', 'true');
    await page.locator('#egd-level-tab-floor-1').click();
    await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
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
    // 卡内分区序（结构断言，抓顺序翻转）：名称/标签 → 弱点抗性 → 图鉴介绍 → 首领特性 → 阶段机制 → 技能 → 召唤物
    const dataOrder = await floorBoard.locator('.nk-egd-mon__data').first()
      .evaluate((el) => [...el.children].map((c) => c.className.split(' ')[0]));
    expect(dataOrder).toEqual([
      'nk-egd-mon__meta', 'nk-egd-mon__rows', 'nk-egd-mon__intro',
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
    const floorTargets = page.locator('.nk-egd-startargets li');
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
    await expect(board.locator('.nk-egd-mon__meta .nk-egd-pollchip')).toHaveCount(0);
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
    // 面板级统计行只剩回合限制：推荐属性与敌人等级随看板头部走，不再在上方重复一份
    const statLabels = await tierce.locator('.nk-egd-tierce__label')
      .evaluateAll((els) => els.map((el) => el.textContent?.trim() || ''));
    expect(statLabels).not.toContain('推荐属性 RECOMMENDED');
    expect(statLabels).not.toContain('敌人等级 ENEMY LV');
    // 面板级目标区 = 星级目标（档数与分数取自 tierce 数据）+ 通关奖励（项数取自数据）
    await expect(tierce.locator('.nk-egd-head__label')).toHaveText(['星级目标', '通关奖励']);
    const tierceTargets = tierceData.targets!;
    await expect(tierce.locator('.nk-egd-startargets__star')).toHaveCount(tierceTargets.length);
    await expect(tierce.locator('.nk-egd-startargets li')).toHaveCount(tierceTargets.length);
    await expect(tierce.locator('.nk-egd-startargets li').last())
      .toContainText(String(tierceTargets[tierceTargets.length - 1].param));
    await expect(tierce.locator('.nk-egd-reward__name')).toHaveCount(tierceData.rewards!.length);
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

  test('/endgame/boss/3020：星启面板头部「星级目标｜通关奖励」左右并排，窄屏堆叠', { tag: '@viewport-pinned' }, async ({ page }) => {
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
    // 两栏各带区块标签：左 = 星级目标（档数与分数取自数据），右 = 通关奖励（项数取自数据）
    const tierceData = seasonData('maze_boss.json', '3020').tierce!;
    await expect(head.locator('.nk-egd-head__label')).toHaveText(['星级目标', '通关奖励']);
    await expect(head.locator('.nk-egd-startargets li')).toHaveCount(tierceData.targets!.length);
    await expect(head.locator('.nk-egd-reward__name')).toHaveCount(tierceData.rewards!.length);
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
        tabs: box(document.querySelector('.nk-egd-tabs') as HTMLElement),
        left: box(cols[0]),
        right: box(cols[1]),
        nodes: box(document.querySelector('#egd-level-panel .nk-egd-board') as HTMLElement),
        panelPadTop: parseFloat(getComputedStyle(panel).paddingTop) || 0,
      };
    });
    /* 头部标签不与子 tab 行的发丝线相贴（用户报障项）：留白必须来自**面板级 padding-top** 且 >0。
       判据取「实测留白 = 面板计算 padding-top」而非具体像素——数值从 20 改成别的断言不动，
       贴死或塌成 0 立刻红；单锁 head 自身的 margin 只修好星启 tab，层 tab 分支会漏（故两条分支都测）。 */
    expect(desktop.panelPadTop, '面板级 padding-top 必须 >0（它是本留白的唯一来源）').toBeGreaterThan(0);
    for (const [branch, gap] of [
      ['层 tab', floorBranch.gap],
      ['星启 tab', desktop.head.top - desktop.tabs.bottom],
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
    // 左栏按内容收敛（不占半屏），且被 fit-content(40%) 的上限约束
    expect(desktop.left.width).toBeLessThan(desktop.right.width);
    expect(desktop.left.width).toBeLessThanOrEqual(desktop.head.width * 0.4 + 1);
    // 通关奖励已从面板底部上移到头部：整块位于星启看板之上
    expect(desktop.right.bottom).toBeLessThanOrEqual(desktop.nodes.y);
    // 窄屏堆叠为单列：两栏同左边界、右栏在左栏之下
    await page.setViewportSize({ width: 390, height: 844 });
    const narrow = await page.evaluate(() => {
      const box = (el: Element) => el.getBoundingClientRect().toJSON() as DOMRect;
      const cols = [...(document.querySelector('#egd-level-panel .nk-egd-head') as HTMLElement).children];
      return { left: box(cols[0]), right: box(cols[1]) };
    });
    expect(Math.round(narrow.right.x)).toBe(Math.round(narrow.left.x));
    expect(narrow.right.y).toBeGreaterThanOrEqual(narrow.left.bottom);
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/endgame/boss/3020：层 tab 单看板（星级目标 + 半场卡片）+ 字号五档与间距节奏', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/endgame/boss/3020');
    await expect(page.locator('.nk-egd-tabs [role="tab"]').first()).toBeVisible();
    // 默认停在星启模式，故显式切到第 1 层：本用例断的是层分支的块序与间距（层无标题行，面板首块 = 星级目标）
    await page.locator('#egd-level-tab-floor-1').click();
    // 层没有标题行（用户裁决）：面板首块 = 星级目标；纵向顺序 = 目标 → 卡片行 → 看板
    await expect(page.locator('.nk-egd-lvl__head')).toHaveCount(0);
    await expect(page.locator('.nk-egd-head__label')).toHaveText('星级目标');
    const stack = await page.evaluate(() => {
      const box = (sel: string) => (document.querySelector(sel) as HTMLElement).getBoundingClientRect().toJSON() as DOMRect;
      return {
        head: box('#egd-level-panel .nk-egd-head'),
        cards: box('#egd-level-panel .nk-egd-nodecards'),
        board: box('#egd-level-panel .nk-egd-board'),
      };
    });
    expect(stack.cards.y).toBeGreaterThanOrEqual(stack.head.bottom - 1);
    expect(stack.board.y).toBeGreaterThanOrEqual(stack.cards.bottom - 1);
    // 各档同级条目靠行距分行，不画分隔线（与星启头部同一判据）
    await expect(page.locator('.nk-egd-startargets .nk-egd-node').first()).toHaveCSS('border-bottom-width', '0px');
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
    // 卡内分区序（结构断言，抓顺序翻转）：图鉴介绍 → 首领特性 → 阶段机制 → 技能 → 召唤物
    const cardBlocks = await board.locator('.nk-egd-mon__data').first().evaluate((el) =>
      [...el.children].map((c) => (c as HTMLElement).className.split(' ')[0]));
    expect(cardBlocks).toEqual([
      'nk-egd-mon__meta', 'nk-egd-mon__rows', 'nk-egd-mon__intro',
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
    const badgeVsPos = await page.evaluate(() => {
      const fs = (s: string): string => getComputedStyle(document.querySelector(s) as Element).fontSize;
      return [fs('.nk-egd-poll__badge'), fs('.nk-egd-poll__pos')];
    });
    // 历史 bug：污染徽标继承 1rem，与同行关卡位置不同档
    expect(badgeVsPos[0]).toBe(badgeVsPos[1]);
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
    expect(padAndGap.traitPad, '条目内距归分区承担').toEqual(['0px', '0px']);
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
    // 面板级统计行已无推荐属性副本：该赛季头部属性只能从节点卡片读到
    await expect(tierce.locator('.nk-egd-tierce__stat .nk-egd-floor__elems')).toHaveCount(0);
    // 整场推荐属性恰好是附加关登记敌方的 4 个弱点，而不是节点 1/2 的推荐属性
    await nodeCardTabs.nth(0).click();
    const node1Elems = await nodeCardTabs.nth(0).locator('.nk-egd-nodecard__elems').innerHTML();
    expect(node3Elems).not.toBe(node1Elems);
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/endgame：含污染赛季卡片带标记，无污染赛季不带', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/endgame');
    await waitForCatalogCards(page);
    const polluted = pollutedSeasonHrefs();
    expect(polluted.length, '目录数据里应有已登记的污染赛季').toBeGreaterThan(0);
    const marks = await page.locator('.nk-eg-lrow__poll').evaluateAll((els) =>
      els.map((el) => (el.closest('a')?.getAttribute('href') || '')),
    );
    // 双向判据（数据 → 页面）：渲染出来的污染赛季必须全部带标记，且带标记的必须都是污染赛季
    const rendered = await page.locator('[class*="-grid"] a').evaluateAll((els) =>
      els.map((el) => el.getAttribute('href') || ''),
    );
    const expectedMarks = rendered.filter((h) => polluted.includes(h));
    expect(expectedMarks.length, '当前渲染窗口内应至少有一个污染赛季（管线静默失效会红）').toBeGreaterThan(0);
    expect(marks.slice().sort()).toEqual(expectedMarks.slice().sort());
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/endgame 另两种污染形态：星启附加关（maze/1036）与异相仲裁单关（peak/9）', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    // 忘却之庭：层半场 + 星启附加关（同一赛季两种位置）；节点数/徽标/位置文案全部由数据派生
    const maze = seasonData('maze.json', '1036');
    const mazePoll = pollutionEntries(maze);
    expect(mazePoll.length).toBeGreaterThanOrEqual(2);
    await page.goto('/endgame/maze/1036');
    await expect(page.locator('#egd-pollution')).toBeVisible();
    const mazeLevels = await page.locator('.nk-egd-poll__item .nk-egd-poll__badge')
      .evaluateAll((els) => els.map((el) => el.textContent?.trim()));
    expect(mazeLevels).toEqual(mazePoll.map(pollutionBadge));
    await expect(page.locator('.nk-egd-poll__pos')).toHaveText(mazePoll.map(pollutionPosition));
    // 污染等级不再有面板级徽标（用户裁决）：只挂到被污染的那一只身上——
    // 忘却之庭星启节点里，被污染敌方在敌方配置里按实例 ID 命中，故敌方卡自带徽标
    const mazeNode = (maze.tierce?.nodes ?? []).findIndex((nd) => nd.invasion);
    expect(mazeNode, '忘却之庭星启节点里应有污染节点').toBeGreaterThanOrEqual(0);
    await page.locator('.nk-egd-nodecards[aria-label="星启节点"] [role="tab"]').nth(mazeNode).click();
    await expect(page.locator('#egd-tierce-board .nk-egd-board__head, #egd-tierce-board .nk-egd-floor__head .nk-egd-pollchip'))
      .toHaveCount(0);
    const mazeNodeData = maze.tierce!.nodes![mazeNode];
    const mazeInv = mazeNodeData.invasion!;
    const mazePolledMons = pollutedMonsters(mazeInv, mazeNodeData.monsters);
    expect(mazePolledMons.length, '该星启节点应有登记在敌方配置里的被污染敌方').toBeGreaterThan(0);
    await expect(page.locator('#egd-tierce-board .nk-egd-mon__meta .nk-egd-pollchip'))
      .toHaveText(mazePolledMons.map(() => monsterBadge(mazeInv)));
    // 受污染的召唤物：挂在召唤者自己的敌方卡片里（星启看板一律用敌方卡，四模式共用同一判据，ADR 0036）
    const mazeNodeSummons = summonsOf(mazeNodeData.monsters);
    const mazeNodePolled = pollutedSummons(mazeNodeData.monsters);
    expect(mazeNodePolled.length, '该星启节点应有受污染的召唤物').toBeGreaterThan(0);
    const mazeSummonCards = page.locator('#egd-tierce-board .nk-egd-mon .nk-egd-summon');
    await expect(mazeSummonCards).toHaveCount(mazeNodeSummons.length);
    await expect(page.locator('#egd-tierce-board .nk-egd-summons .nk-egd-pollchip'))
      .toHaveText(mazeNodePolled.map(summonBadge));
    await expect(page.locator('#egd-tierce-board .nk-egd-floor__row--summons')).toHaveCount(0);
    // 星启附加关同样带自己的推荐属性（三模式共用的补全，不只在末日幻影）——落在节点卡片上
    await expect(page.locator('.nk-egd-nodecard--active .nk-egd-nodecard__label').first()).toHaveText('推荐属性');
    await noUnknownOverflow(page);
    assertNoErrors();

    // 异相仲裁：关卡由子 tab 承载（ADR 0043），面板一次只渲染一关；污染落在单关上
    const peak = seasonData('maze_peak.json', '9');
    const peakPoll = pollutionEntries(peak);
    expect(peakPoll.length).toBeGreaterThan(0);
    await page.goto('/endgame/peak/9');
    await expect(page.locator('#egd-pollution')).toBeVisible();
    // 无固定条（四模式一致；ADR 0043 撤销 ADR 0037 决策 1 的「只剩异相仲裁」）
    await expect(page.locator('.nk-egd-bar')).toHaveCount(0);
    await expect(page.locator('#egd-level-tabs [role="tab"]')).toHaveText(peakTabLabels(peak));
    await expect(page.locator('.nk-egd-poll__pos')).toHaveText(peakPoll.map(pollutionPosition));
    await expect(page.locator('.nk-egd-poll__leveldesc')).toHaveCount(peakPoll.length);
    // 污染等级只出现在被污染的那一关、且只挂到被污染的敌方身上（面板级徽标已退场，用户裁决）
    const pollLevel = (peak.levels ?? []).find((l) => l.invasion);
    expect(pollLevel?.name, '当期应有受污染的单关').toBeTruthy();
    await page.locator('#egd-level-tabs [role="tab"]', { hasText: pollLevel!.name! }).click();
    await expect(page.locator('.nk-egd-peak .nk-egd-floor__head .nk-egd-pollchip')).toHaveCount(0);
    const peakLevelInv = pollLevel!.invasion!;
    const peakLevelPolled = pollutedMonsters(peakLevelInv, pollLevel!.monsters);
    expect(peakLevelPolled.length, '该单关应有登记在敌方配置里的被污染敌方').toBeGreaterThan(0);
    await expect(page.locator('.nk-egd-peak .nk-egd-mon__meta .nk-egd-pollchip'))
      .toHaveText(peakLevelPolled.map(() => monsterBadge(peakLevelInv)));
    // 单关面板一次只渲染一关：容器数与 aria-labelledby 都跟随激活 tab
    await expect(page.locator('.nk-egd-peak')).toHaveCount(1);
    await expect(page.locator('#egd-level-panel'))
      .toHaveAttribute('aria-labelledby', `egd-level-tab-peak-${pollLevel!.id}`);
    // 王棋关的层级增益：增益名与描述同渲染位，标签仍不出现（ADR 0033 决策 8）
    const king = (peak.levels ?? []).find((l) => l.kind === 'king');
    expect(king?.buffs?.length, '王棋关应带裁决象限增益').toBeGreaterThan(0);
    await page.locator('#egd-level-tabs [role="tab"]', { hasText: king!.name! }).click();
    await expect(page.locator('.nk-egd-peak .nk-egd-floor__buffname')).toHaveText(king!.buffs!.map((b) => b.name));
    await expect(page.locator('.nk-egd-peak .nk-egd-floor__bufflabel')).toHaveCount(0);
    // 单关与绝境变体的敌方走同一套敌方详情卡（与末日幻影层看板同源 `StageContent`）：
    // 召唤物挂在召唤者卡内，条数由该关数据派生
    const peakSummons = (peak.levels ?? []).flatMap(
      (l) => [...summonsOf(l.monsters), ...summonsOf(l.hard?.monsters)],
    );
    expect(peakSummons.length, '异相仲裁应有带召唤物的单关').toBeGreaterThan(0);
    for (const lv of peak.levels ?? []) {
      await page.locator('#egd-level-tabs [role="tab"]', { hasText: lv.name! }).click();
      await expect(page.locator('.nk-egd-peak .nk-egd-mon .nk-egd-summon'))
        .toHaveCount(summonsOf(lv.monsters).length + summonsOf(lv.hard?.monsters).length);
    }
    await page.locator('#egd-level-tabs [role="tab"]', { hasText: (peak.levels ?? [])[0].name! }).click();
    await expect(page.locator('.nk-egd-peak .nk-egd-summons__label').first()).toHaveText('召唤物');
    await expect(page.locator('.nk-egd-peak .nk-egd-floor__row--summons')).toHaveCount(0);
    // 敌方详情卡的图标格与卡片表格分离：旧图标格形态（圆形小图标 + 格内召唤物）已整批退场
    await expect(page.locator('.nk-egd-peak .nk-egd-floor__moncell')).toHaveCount(0);
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
    await expect(mazePanel.locator('.nk-egd-head__label')).toHaveText('挑战目标');
    await expect(mazePanel.locator('.nk-egd-startargets li'))
      .toHaveCount(mazeFloor1.targets!.length);
    await expect(mazePanel.locator('.nk-egd-startargets li').last())
      .toContainText(String(mazeFloor1.targets!.at(-1)!.param));
    // 非分数档：行首走语义标签（回合 / 减员），不出现星标
    await expect(mazePanel.locator('.nk-egd-startargets__star')).toHaveCount(0);
    // 忘却之庭「记忆紊流」= 层级增益，由每个层 / 半场看板首块的末法余烬位呈现一次（用户裁决：统一到头部）
    await expect(mazePanel.locator('.nk-egd-floor__buffname')).toHaveText(mazeFloor1.buff!.name);
    await expect(mazePanel.locator('.nk-egd-group')).toHaveCount(0);
    await expect(mazePanel.locator('.nk-egd-board__body > :first-child'))
      .toHaveClass(/nk-egd-floor__buff/);
    // 赛季回合上限 = 每层回合上限 → 不进赛季规则右栏，改由半场卡片承担
    await expect(mazePanel.locator('.nk-egd-rules__item')).toHaveCount(0);

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
    // 切半场：换的是当前半场那份战斗数据
    await mazeHalves.nth(1).click();
    await expect(mazePanel.locator('.nk-egd-mon__name').first())
      .toHaveText(mazeFloor1.stage2!.monsters![0].name);
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
    await expect(storyPanel.locator('.nk-egd-head__label')).toHaveText(['星级目标', '赛季规则']);
    await expect(storyPanel.locator('.nk-egd-startargets__star'))
      .toHaveCount(storyFloor1.targets!.length);
    await expect(storyPanel.locator('.nk-egd-rules__label'))
      .toHaveText(['回合限制 CYCLES', '通关分数线 SCORE']);
    await expect(storyPanel.locator('.nk-egd-rules__val'))
      .toHaveText([String(story.countdown), grouped(story.clear_score!)]);
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

      // h1 = 玩法名；正文分节数与体系名都来自产物（endgame_guide.json），故期望值从产物读。
      // 必须用 toBeVisible + 盒模型，不能只 toHaveText：h1 被 Hero 的 overflow 裁掉时 toHaveText
      // 依然通过（实测踩过：Hero 缺 `flex: none` 被压成 51px、h1 不可见而用例全绿）。
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

      /* 阅读列宽：规则正文此前没有任何 max-width ⇒ 实测首行铺满 960px 面板、每行 72 全角字
         （站点里唯一一处长文没有阅读列宽）。判据取「每行全角字数」而非 px——列宽令牌是 em 定值、
         随字号缩放，字数是读者真正感知的量；期望上限从令牌读，不写绝对值。 */
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

      // 体系名必须上屏：区块标题含体系名，且与产物逐字一致
      const sysTitle = page.locator('.nk-egm__panel .nk-title').filter({ hasText: g.system!.name });
      await expect(sysTitle.first()).toBeVisible();
      expect(g.system!.name, `该玩法体系名应为 ${m.system}`).toBe(m.system);

      // 玩法页是**常青页**：只讲规格（条数/时机/作用范围），**不得列具体增益条目**
      // （条目每期都换，boss 同期上/下半场还各一套——列一份必然误导；条目与效果由赛季页承载）
      await expect(page.locator('.nk-egm__system')).toContainText('每期');
      await expect(page.locator('.nk-egm__buffs .nk-egm__buff')).toHaveCount(0);
      const cta = page.locator('.nk-egm__system-cta');
      await expect(cta).toBeVisible();
      // 入口必须指向当期（进行中的）赛季详情页，而不是泛泛回目录
      await expect(cta).toHaveAttribute('href', new RegExp(`^/endgame/${m.key}/\\d+$`));

      // 赛季内链 ≥3 条 + 其它玩法入口 3 条
      expect(await page.locator('.nk-egm__seasons a[href^="/endgame/"]').count()).toBeGreaterThanOrEqual(3);
      await expect(page.locator('.nk-egm__other')).toHaveCount(3);
      // 单页数据页形态：不得出现条目级覆盖率的标记
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

test.describe('布局验收：赛季页增益体系在节点面板展示', () => {
  test('/endgame/story/2026：赛季增益名在节点看板中展示', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/endgame/story/2026');
    await expect(page.locator('#egd-buffs')).toHaveCount(0);
    const story = seasonData('maze_extra.json', '2026');
    await page.locator('#egd-level-tab-floor-1').click();
    const board = page.locator('#egd-level-panel .nk-egd-board');
    await expect(board.locator('.nk-egd-group__title')).toHaveText('荒腔走板');
    await expect(board.locator('.nk-egd-buff__name')).toHaveText(story.buffs!.map((b) => b.name));
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/endgame/maze/1036：增益体系由当前半场节点看板承载', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/endgame/maze/1036');
    // ADR 0037 的「整块退场」不得因正名而恢复
    await expect(page.locator('#egd-buffs')).toHaveCount(0);
    await page.locator('#egd-level-tab-floor-1').click();
    // 记忆紊流 = 层内增益，只在看板首块的末法余烬位出现一次；赛季增益组不复述（同 ID 去重）
    await expect(page.locator('#egd-level-panel .nk-egd-floor__buffname')).toHaveText('记忆紊流');
    await expect(page.locator('#egd-level-panel .nk-egd-group')).toHaveCount(0);
    await noUnknownOverflow(page);
    assertNoErrors();
  });
});

test.describe('玩法说明入口可发现性（目录页列头 + 赛季详情页 Hero）', () => {
  test('两处入口都可见、命中区达标，且点击进入玩法页', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);

    // ① 目录页：每个模式列头一个显式入口（此前只有「列标题即链接」这一零提示性入口）
    await page.goto('/endgame');
    const chips = page.locator('.nk-eg-col__head .nk-guide-link');
    await expect(chips.first()).toBeVisible();
    expect(await chips.count(), '目录页每个模式列头各一个入口').toBeGreaterThanOrEqual(1);
    for (let i = 0; i < await chips.count(); i += 1) {
      await expect(chips.nth(i)).toHaveAttribute('aria-label', /玩法说明$/);
    }
    const chipBox = await chips.first().boundingBox();
    expect(chipBox?.height ?? 0, '入口命中区应达 WCAG 2.2 下限 24px').toBeGreaterThanOrEqual(24);

    // ② 赛季详情页：Hero 的模式行此前是纯文本、完全没有入口
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

test.describe('异相仲裁赛季页并入关卡子 tab 编排（ADR 0043）', () => {
  test('/endgame/peak/9：关卡子 tab + 单关面板 + 段位徽章区块，无固定条', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    const peak = seasonData('maze_peak.json', '9');
    await page.goto('/endgame/peak/9');

    // ① 四个玩法的赛季页现在同构：无固定条、无区块导航，关卡定位由页内子 tab 承担
    await expect(page.locator('.nk-egd-bar')).toHaveCount(0);
    await expect(page.locator('.nk-egd-secnav')).toHaveCount(0);
    await expect(page.locator('.nk-egd.nk-page--detail')).toHaveCSS('padding-top', '0px'); // e2e-literal-ok: 无固定条 ⇒ 避让内距必须为 0（定义性契约值，非可漂移设计值）
    await expect(page.locator('#egd-level-tabs [role="tab"]')).toHaveText(peakTabLabels(peak));
    // 默认激活首个关卡 tab（异相仲裁无星启模式，见 `defaultLevelKey`）
    await expect(page.locator('#egd-level-tabs [role="tab"]').first()).toHaveAttribute('aria-selected', 'true');

    // ② 一次只渲染一关：关卡名不再在面板内复述（身份由激活 tab 承担），面板头只留类别 + 等级
    await expect(page.locator('.nk-egd-peak')).toHaveCount(1);
    await expect(page.locator('.nk-egd-floor.nk-egd-peak .nk-egd-floor__title')).toHaveCount(0);
    const first = (peak.levels ?? [])[0];
    await expect(page.locator('.nk-egd-peak .nk-egd-floor__head .nk-egd-peak__kind')).toHaveText('骑士');
    await expect(page.locator('.nk-egd-peak .nk-egd-floor__head .nk-egd-floor__dataval')).toHaveText(String(first.level));

    // ③ 切 tab 换的是这一关那份数据（敌方等级 + 关卡 ID 都跟随）
    const king = (peak.levels ?? []).find((l) => l.kind === 'king');
    expect(king, '当期应有王棋关').toBeTruthy();
    await page.locator('#egd-level-tabs [role="tab"]', { hasText: king!.name! }).click();
    await expect(page.locator('#egd-level-panel'))
      .toHaveAttribute('aria-labelledby', `egd-level-tab-peak-${king!.id}`);
    await expect(page.locator('.nk-egd-peak .nk-egd-floor__head .nk-egd-peak__kind')).toHaveText('王棋');
    await expect(page.locator('.nk-egd-peak .nk-egd-floor__head .nk-egd-floor__dataval')).toHaveText(String(king!.level));
    // 绝境变体是同一关内的子块，不是第二个 tab
    await expect(page.locator('.nk-egd-peak .nk-egd-floor__hardname')).toHaveText(king!.hard!.name!);
    await expect(page.locator('#egd-level-tabs [role="tab"]')).toHaveCount((peak.levels ?? []).length);

    // ④ 段位徽章升为赛季级区块（不再埋在「关卡组成」里）：条数与数据一致，标题进区块序号
    await expect(page.locator('#egd-badges')).toBeVisible();
    await expect(page.locator('#egd-badges')).toContainText('段位徽章');
    await expect(page.locator('.nk-egd-badges__item')).toHaveCount((peak.badges ?? []).length);
    await expect(page.locator('.nk-egd-badges__item').first()).toContainText(peak.badges![0].name);
    await expect(page.locator('#egd-badges .nk-title__idx')).toHaveText('02');

    // ⑤ 赛季增益不再在关卡子 tab 外单独显示；王棋面板承载该关增益，且排在敌人配置之前（用户裁决）
    await expect(page.locator('#egd-buffs')).toHaveCount(0);
    await page.locator('#egd-level-tabs [role="tab"]', { hasText: king!.name! }).click();
    await expect(page.locator('.nk-egd-peak .nk-egd-floor__label').filter({ hasText: '裁决象限' })).toHaveCount(1);
    await expect(page.locator('.nk-egd-peak .nk-egd-floor__buffname'))
      .toHaveText(king!.buffs!.map((b) => b.name));
    const peakBlocks = await page.locator('.nk-egd-peak .nk-egd-peak__body').evaluate((el) =>
      [...el.children].map((c) => (c as HTMLElement).className.split(' ')[0]));
    expect(peakBlocks.indexOf('nk-egd-floor__buffs'))
      .toBeLessThan(peakBlocks.indexOf('nk-egd-floor__stage'));

    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/endgame/peak/1：无污染无徽章的期只有子 tab + 单关面板', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    const peak = seasonData('maze_peak.json', '1');
    await page.goto('/endgame/peak/1');
    await expect(page.locator('#egd-pollution')).toHaveCount(0);
    await expect(page.locator('#egd-badges')).toHaveCount(0);
    // 赛季增益跟随具体关卡节点面板，不再单独占用赛季级区块
    await expect(page.locator('#egd-buffs')).toHaveCount(0);
    await expect(page.locator('#egd-level-tabs [role="tab"]')).toHaveText(peakTabLabels(peak));
    await expect(page.locator('.nk-egd-peak')).toHaveCount(1);
    const king = peak.levels!.find((level) => level.kind === 'king');
    await expect(page.locator('.nk-egd-peak .nk-egd-floor__buffname')).toHaveCount(0);
    await page.locator('#egd-level-tabs [role="tab"]', { hasText: king!.name! }).click();
    await expect(page.locator('.nk-egd-peak .nk-egd-floor__buffname'))
      .toHaveText(king!.buffs!.map((b) => b.name));
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/endgame/peak/9：单关敌方走敌方详情卡（与末日幻影层看板同源 StageContent）', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    const peak = seasonData('maze_peak.json', '9');
    await page.goto('/endgame/peak/9');

    for (const lv of peak.levels ?? []) {
      await page.locator('#egd-level-tabs [role="tab"]', { hasText: lv.name! }).click();
      const panel = page.locator('.nk-egd-peak');
      const mono = lv.monsters ?? [];
      const hardMons = lv.hard?.monsters ?? [];
      const cards = panel.locator('.nk-egd-mon');
      // 卡片条数 = 该关敌方 + 绝境变体敌方（卡片是唯一的敌方渲染形态；旧图标格不得复活）
      await expect(cards).toHaveCount(mono.length + hardMons.length);
      await expect(panel.locator('.nk-egd-floor__moncell, .nk-egd-floor__monlink')).toHaveCount(0);
      // 推荐属性与「N 波 · M 敌」摘要只由没有卡片行的异相仲裁保留
      await expect(panel.locator('.nk-egd-floor__row > .nk-egd-floor__label').first()).toHaveText('推荐属性');
      await expect(panel.locator('.nk-egd-floor__elems .nk-egd-elem')).toHaveCount((lv.damage ?? []).length);
      await expect(panel.locator('.nk-egd-floor__moncount'))
        .toHaveText([monCountLabel(mono), monCountLabel(hardMons)].filter(Boolean));

      // 卡面 = 立绘（可跳详情）+ 名称 + 阵营/韧性/速度标签 + 弱点/抗性/效果抵抗 + 图鉴介绍 + 技能
      const card = cards.first();
      const first = mono[0];
      await expect(card.locator('.nk-egd-mon__name')).toHaveText(first.name);
      await expect(card.locator('.nk-egd-mon__img'))
        .toHaveAttribute('src', new RegExp(first.icon!));
      await expect(card.locator('.nk-egd-mon__figlink'))
        .toHaveAttribute('aria-label', `查看 ${first.name} 详情`);
      // 行首标签随数据：效果抵抗行只在 `debuff_resist` 非空时出现（ADR 0044，全字段形态）
      const debuffs = first.debuff_resist ?? [];
      await expect(card.locator('.nk-egd-mon__label'))
        .toHaveText(['弱点', '抗性', ...(debuffs.length ? ['效果抵抗'] : [])]);
      await expect(card.locator('.nk-egd-mon__weak .nk-egd-elem')).toHaveCount((first.weak ?? []).length);
      await expect(card.locator('.nk-egd-mon__immicon')).toHaveCount(debuffs.length);
      // 图鉴介绍与技能全字段只随详情卡出现（末日幻影楼层同口径；期级列表仍是轻形态）
      expect(first.intro, '该期首关首个敌方应带图鉴介绍').toBeTruthy();
      await expect(card.locator('.nk-egd-mon__intro')).toContainText(first.intro!.slice(0, 12));
      await expect(card.locator('.nk-egd-mon__skill'))
        .toHaveText((first.skills ?? []).map((s) => s.name));
    }

    // 绝境变体同样走卡片（含它自己的召唤物），不是另一套内联行
    const king = (peak.levels ?? []).find((l) => l.kind === 'king');
    await page.locator('#egd-level-tabs [role="tab"]', { hasText: king!.name! }).click();
    const hardCard = page.locator('.nk-egd-peak .nk-egd-floor__hard .nk-egd-mon');
    await expect(hardCard).toHaveCount((king!.hard?.monsters ?? []).length);
    await expect(hardCard.locator('.nk-egd-mon__name'))
      .toHaveText((king!.hard!.monsters ?? []).map((m) => m.name));
    await noUnknownOverflow(page);
    assertNoErrors();
  });
});

test.describe('玩法页「当期赛季」判据（不得取未开始的那一期）', () => {
  for (const mode of ['maze', 'story', 'boss', 'peak'] as const) {
    test(`/endgame/${mode}：当期 = 列表中状态为「进行中」的那一期`, async ({ page }) => {
      const { assertNoErrors } = collectConsoleIssues(page);
      await page.goto(`/endgame/${mode}`);

      const r = await page.evaluate(() => {
        const link = document.querySelector('.nk-egm__note .nk-egm__link');
        const rows = [...document.querySelectorAll('.nk-egm__seasons .nk-eg-lrow')];
        const live = rows.find((x) => x.getAttribute('data-status') === '进行中');
        return {
          note: link?.closest('.nk-egm__note')?.textContent?.trim().replace(/\s+/g, ' ') ?? null,
          href: link?.getAttribute('href') ?? null,
          liveHref: live?.getAttribute('href') ?? null,
          firstStatus: rows[0]?.getAttribute('data-status') ?? null,
        };
      });
      expect(r.note, '必须显式标注是当期还是最新一期').toBeTruthy();
      if (r.liveHref) {
        // 有进行中的一期：必须选它，且文案说「当期赛季」（不能把未开始的那期当现状陈述）
        expect(r.href, `当期应取进行中的 ${r.liveHref}（列表首行状态 ${r.firstStatus}）`).toBe(r.liveHref);
        expect(r.note).toContain('当期赛季');
      } else {
        // 赛季间隙：回落到最新一期，但必须如实标注，不得冒充当期
        expect(r.note, '没有进行中的赛季时不得写成「当期赛季」').not.toContain('当期赛季');
        expect(r.note).toContain('最新赛季');
      }
      assertNoErrors();
    });
  }
});

test.describe('赛季页增益体系节点展示', () => {
  test('/endgame/story/2026：增益位于节点面板，玩法说明入口仍可从指南导航访问', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/endgame/story/2026');
    await expect(page.locator('#egd-buffs')).toHaveCount(0);
    await expect(page.locator('#egd-level-tab-floor-1')).toBeVisible();
    await page.locator('#egd-level-tab-floor-1').click();
    await expect(page.locator('#egd-level-panel .nk-egd-board .nk-egd-group__title')).toContainText('荒腔走板');
    await noUnknownOverflow(page);
    assertNoErrors();
  });
});

test.describe('敌方数值口径', () => {
  test(
    '/endgame/boss/<id>：敌方卡上的韧性/速度等于数据里的值（实例修正值已在转换期并入）',
    { tag: '@viewport-independent' },
    async ({ page }) => {
      const { assertNoErrors } = collectConsoleIssues(page);
      /* 期望值全部数据派生：把该赛季 payload 里所有 (名称, 韧性) 对收成集合，页面上任何
         「韧性 N」标签都必须能在其中找到——少了合并（或合并错）就会红。
         合并判据与算式见 ADR 0045（敌方卡无等级语境：基准 + 修正值）。 */
      const catalog = readJson<Record<string, { zh?: string }>>('public/data/cn/maze_boss.catalog.json');
      const data = readJson<Record<string, unknown>>('public/data/cn/maze_boss.json');
      const seasonId = Object.keys(catalog).find(
        (id) => catalog[id]?.zh && JSON.stringify(data[id] ?? {}).includes('"stance"'),
      );
      expect(seasonId, '应存在带敌方韧性的已上线赛季（断言前提）').toBeTruthy();

      const allowed = new Set<string>();
      const walk = (o: unknown): void => {
        if (!o || typeof o !== 'object') return;
        if (Array.isArray(o)) { o.forEach(walk); return; }
        const rec = o as { id?: string; name?: string; stance?: number };
        if (rec.id && rec.name && typeof rec.stance === 'number') allowed.add(`${rec.name}\u0000${rec.stance}`);
        Object.values(o).forEach(walk);
      };
      walk(data[seasonId]);
      expect(allowed.size, '该赛季应至少有一条敌方韧性记录（断言前提）').toBeGreaterThan(0);

      await page.goto(`/endgame/boss/${seasonId}`);
      await expect(page.locator('.nk-egd-mon').first()).toBeVisible();
      const cards = await page.locator('.nk-egd-mon').evaluateAll((els) => els.map((el) => ({
        name: (el.querySelector('.nk-egd-mon__name')?.textContent || '').trim(),
        tags: [...el.querySelectorAll('.nk-egd-mon__tag')].map((t) => (t.textContent || '').trim()),
      })));
      const withStance = cards.filter((c) => c.tags.some((t) => t.startsWith('韧性 ')));
      expect(withStance.length, '默认视图应至少有一张带韧性的敌方卡').toBeGreaterThan(0);
      for (const c of withStance) {
        const text = c.tags.find((t) => t.startsWith('韧性 '))!;
        const value = text.replace('韧性 ', '');
        expect(allowed.has(`${c.name}\u0000${value}`), `${c.name} 的 ${text} 必须能在数据里找到`).toBe(true);
      }
      // 已并入则不再有独立标注（该标注在 ADR 0045 后被撤掉，此处防回归）
      expect(await page.locator('.nk-egd-mon__tag--mod').count()).toBe(0);

      await noUnknownOverflow(page);
      assertNoErrors();
    },
  );
});
