import { test, expect } from '@playwright/test';
import { collectConsoleIssues, computedNumber, readJson, readTokenPx } from './helpers';
import { cnBigNumber, PEAK_HARD_NODE, PEAK_KING_NODE, noUnknownOverflow, peakKnightLevels, peakKnightNodeTabId, peakKnightsTabId, peakNodeTabId, peakTabId, peakTabLabels, seasonData } from './layout.shared';
import type { MechanicLike, MonsterLike } from './layout.shared';

/**
 * 布局验收：终局赛季详情页（/endgame/<mode>/<id> 的增益与子 tab） —— layout 验收层（语义契约 + 数值规格）分文件之一。
 *
 * 分文件判据（为何按域拆、单文件该多小）见 docs/agents/testing.md「layout 必须按 describe 边界分文件」。
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

test.describe('异相仲裁赛季页并入关卡子 tab 编排（ADR 0043）', () => {
  test('/endgame/peak/9：关卡子 tab + 单关面板（星级奖励垫底），无固定条', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    const peak = seasonData('maze_peak.json', '9');
    await page.goto('/endgame/peak/9');

    // ① 四个玩法的赛季页现在同构：无固定条、无区块导航，关卡定位由页内子 tab 承担
    await expect(page.locator('.nk-egd-bar')).toHaveCount(0);
    await expect(page.locator('.nk-egd-secnav')).toHaveCount(0);
    await expect(page.locator('.nk-egd.nk-page--detail')).toHaveCSS('padding-top', '0px'); // e2e-literal-ok: 无固定条 ⇒ 避让内距必须为 0（定义性契约值，非可漂移设计值）
    await expect(page.locator('#egd-level-tabs [role="tab"]')).toHaveText(peakTabLabels(peak));
    // 默认激活清单首位（倒序：王棋最终关打头；异相仲裁无星启模式，见 `defaultLevelKey`）
    await expect(page.locator('#egd-level-tabs [role="tab"]').first()).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#egd-level-tabs [role="tab"]').first()).toHaveText(peakTabLabels(peak)[0]);

    // ② 一次只渲染一个节点：王棋档的两档难度（普通难度 / 绝境难度）由卡片切换；
    //    关卡身份与推荐属性归卡片 ⇒ 面板头退场
    await expect(page.locator('.nk-egd-peak')).toHaveCount(1);
    await expect(page.locator('.nk-egd-floor.nk-egd-peak .nk-egd-floor__title')).toHaveCount(0);
    const king = (peak.levels ?? []).find((l) => l.kind === 'king');
    expect(king, '当期应有王棋关').toBeTruthy();
    expect(king!.hard, '当期王棋关应有绝境变体（断言前提）').toBeTruthy();
    await expect(page.locator('#egd-level-panel .nk-egd-nodecard .nk-egd-nodecard__name'))
      .toHaveText(['普通难度', '绝境难度']);
    // 危险标识（红色三角警告图标）只挂在绝境难度那张卡上：图形不带文字，
    // 语义走 role="img" 的无障碍名 + 悬停提示（官方变体名「绝境」）
    const dangerBadge = page.locator(peakNodeTabId(PEAK_HARD_NODE)).locator('.nk-egd-nodecard__danger');
    await expect(dangerBadge).toHaveCount(1);
    await expect(dangerBadge).toHaveAttribute('role', 'img');
    await expect(dangerBadge).toHaveAttribute('aria-label', '绝境');
    await expect(dangerBadge.locator('svg')).toHaveCount(1);
    await expect(page.locator(peakNodeTabId(PEAK_KING_NODE)).locator('.nk-egd-nodecard__danger'))
      .toHaveCount(0);
    await expect(page.locator(peakNodeTabId(PEAK_KING_NODE))).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('.nk-egd-peak .nk-egd-floor__head')).toHaveCount(0);

    // ③ 档内切换换的是这一节点那份数据（节点一 = 普通王棋 / 节点二 = 绝境王棋）；
    //    三关骑士合并成另一档，档内同样由节点卡片切换（卡片文案 = 官方关名）。
    //    定位一律按 DOM id：绝境节点与主关节点的文案/数据同源，按文案取会串档
    await page.locator(peakNodeTabId(PEAK_HARD_NODE)).click();
    await expect(page.locator('#egd-peak-board'))
      .toHaveAttribute('aria-labelledby', 'egd-peak-node-tab-hard');
    await expect(page.locator('.nk-egd-peak .nk-egd-mon__name').first())
      .toHaveText(king!.hard!.monsters![0].name);
    const knights = peakKnightLevels(peak);
    expect(knights.length, '当期应有 3 关骑士试炼（断言前提）').toBe(3);
    await page.locator(peakKnightsTabId).click();
    await expect(page.locator('#egd-level-panel'))
      .toHaveAttribute('aria-labelledby', 'egd-level-tab-peak-knights');
    await expect(page.locator('#egd-level-panel .nk-egd-nodecard')).toHaveCount(knights.length);
    await expect(page.locator(peakKnightNodeTabId(knights[0]))).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('.nk-egd-peak .nk-egd-floor__head')).toHaveCount(0);
    const third = knights[2];
    await page.locator(peakKnightNodeTabId(third, 2)).click();
    await expect(page.locator('#egd-peak-board'))
      .toHaveAttribute('aria-labelledby', `egd-peak-node-tab-${third.id}`);
    await expect(page.locator('.nk-egd-peak .nk-egd-mon__name').first()).toHaveText(third.monsters![0].name);
    // 切回王棋档：节点激活态回到节点一（不残留上一档的节点序号）
    await page.locator(peakTabId(king!)).click();
    await expect(page.locator('#egd-level-panel'))
      .toHaveAttribute('aria-labelledby', `egd-level-tab-peak-${king!.id}`);
    await expect(page.locator(peakNodeTabId(PEAK_KING_NODE))).toHaveCount(1);
    await expect(page.locator('#egd-level-tabs [role="tab"]')).toHaveText(peakTabLabels(peak));
    await expect(page.locator(peakNodeTabId(PEAK_KING_NODE))).toHaveAttribute('aria-selected', 'true');

    // ④ 段位徽章区块已退场（用户裁决）：关卡子 tab 之上不再有赛季级块，
    //    星数奖励改挂**关卡面板内**（每关一份，垫在面板底部，见 test 下方与 `EndgamePeak`）
    await expect(page.locator('#egd-badges, .nk-egd-badges')).toHaveCount(0);
    await expect(page.locator('.nk-egd-starrewards')).toHaveCount(0);
    const panelOrder = await page.locator('.nk-egd-panel > *').evaluateAll((els) =>
      els.map((el) => el.className.split(' ')[0]));
    expect(panelOrder[0], '子 tab 之上不再有赛季级块（星数奖励已下放单关面板）').toBe('nk-egd-tabs');

    // ⑤ 赛季增益不再在关卡子 tab 外单独显示；王棋面板承载该关增益，且排在敌人配置之前（用户裁决）
    await expect(page.locator('#egd-buffs')).toHaveCount(0);
    await page.locator(peakTabId(king!)).click();
    await expect(page.locator('.nk-egd-peak .nk-egd-floor__label').filter({ hasText: '裁决象限' })).toHaveCount(1);
    await expect(page.locator('.nk-egd-peak .nk-egd-floor__buffname'))
      .toHaveText(king!.buffs!.map((b) => b.name));
    const peakBlocks = await page.locator('.nk-egd-peak .nk-egd-peak__body').evaluate((el) =>
      [...el.children].map((c) => (c as HTMLElement).className.split(' ')[0]));
    // 星级奖励列表（含该关星级挑战要求）是面板末块，垫在裁决象限与敌方配置之后
    expect(peakBlocks[peakBlocks.length - 1], '星级奖励列表应在关卡面板底部').toBe('nk-egd-head');
    expect(peakBlocks.indexOf('nk-egd-floor__buffs'))
      .toBeLessThan(peakBlocks.indexOf('nk-egd-floor__stage'));

    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/endgame/peak/1：无徽章的期只有子 tab + 单关面板', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    const peak = seasonData('maze_peak.json', '1');
    await page.goto('/endgame/peak/1');
    await expect(page.locator('#egd-pollution, .nk-egd-poll')).toHaveCount(0);
    await expect(page.locator('#egd-badges, .nk-egd-badges')).toHaveCount(0);
    // 赛季增益跟随具体关卡节点面板，不再单独占用赛季级区块
    await expect(page.locator('#egd-buffs')).toHaveCount(0);
    await expect(page.locator('#egd-level-tabs [role="tab"]')).toHaveText(peakTabLabels(peak));
    await expect(page.locator('.nk-egd-peak')).toHaveCount(1);
    const king = peak.levels!.find((level) => level.kind === 'king');
    // 默认停在清单首位（倒序 → 王棋最终关）：裁决象限增益随该关面板承载
    await expect(page.locator('.nk-egd-peak .nk-egd-floor__buffname'))
      .toHaveText(king!.buffs!.map((b) => b.name));
    // 骑士关不带裁决象限增益（增益只在王棋关那场下发）；三关合并在同一档里
    await page.locator(peakKnightsTabId).click();
    await expect(page.locator('.nk-egd-peak .nk-egd-floor__buffname')).toHaveCount(0);
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/endgame/peak/9：单关敌方走敌方详情卡（与末日幻影层看板同源 StageContent）', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    const peak = seasonData('maze_peak.json', '9');
    await page.goto('/endgame/peak/9');
    const panel = page.locator('.nk-egd-peak');

    // 每一档（含「绝境」变体、含三关骑士各自那一场）只渲染**自己那一场**的敌方：卡片条数 = 该场敌方数
    const king = (peak.levels ?? []).find((l) => l.kind === 'king');
    expect(king?.hard, '当期王棋关应有绝境变体档').toBeTruthy();

    /** 敌方详情卡逐项核对：立绘（可跳详情）+ 名称 + 弱点/抗性/效果抵抗 + 技能全集 */
    const assertCards = async (mono: MonsterLike[]): Promise<void> => {
      const cards = panel.locator('.nk-egd-mon');
      await expect(cards).toHaveCount(mono.length);
      await expect(panel.locator('.nk-egd-floor__moncell, .nk-egd-floor__monlink')).toHaveCount(0);
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
      // 技能全字段只随详情卡出现（末日幻影楼层同口径；期级列表仍是轻形态）。
      // 跨 ≥2 阶段的敌方按阶段拆行后，**全阶段技能会在多行重复出现**（每行 = 该阶段可用技能全集，
      // 见 `PhaseList` 的字面含义）⇒ 这里按去重集合核对「一个不多一个不少」，逐阶段断言见下一用例。
      const shownSkills = await card.locator('.nk-egd-mon__skill').evaluateAll(
        (els) => [...new Set(els.map((el) => (el.textContent ?? '').trim()))].sort());
      expect(shownSkills).toEqual([...(first.skills ?? []).map((s) => s.name)].sort());
    };

    // 每个节点只渲染**自己那一场**的敌方；推荐属性统一由节点卡片承担（面板内只剩「敌方配置」一行）
    const openKingNode = async (node: string): Promise<void> => {
      await page.locator(peakTabId(king!)).click();
      await page.locator(peakNodeTabId(node)).click();
    };
    for (const [node, stage] of [
      [PEAK_KING_NODE, king!],
      [PEAK_HARD_NODE, king!.hard!],
    ] as const) {
      await openKingNode(node);
      await expect(panel.locator('.nk-egd-floor__row > .nk-egd-floor__label')).toHaveText('敌方配置');
      await expect(panel.locator('.nk-egd-floor__moncount')).toHaveCount(0);
      // 绝境节点的推荐属性挂主关（数据事实）⇒ 卡片沿用主关那组属性
      await expect(page.locator(peakNodeTabId(node)).locator('.nk-egd-nodecard__elems .nk-egd-elem'))
        .toHaveCount((king!.damage ?? []).length);
      await assertCards(stage.monsters ?? []);
    }

    // 三关骑士合并档：每一关的敌方各一份；推荐属性同样由**节点卡片**承担
    const knights = peakKnightLevels(peak);
    await page.locator(peakKnightsTabId).click();
    for (let i = 0; i < knights.length; i += 1) {
      const lv = knights[i];
      await page.locator(peakKnightNodeTabId(lv, i)).click();
      await expect(panel.locator('.nk-egd-floor__row > .nk-egd-floor__label').first()).toHaveText('敌方配置');
      await expect(panel.locator('.nk-egd-floor__moncount')).toHaveCount(0);
      await expect(page.locator(peakKnightNodeTabId(lv, i)).locator('.nk-egd-nodecard__elems .nk-egd-elem'))
        .toHaveCount((lv.damage ?? []).length);
      await assertCards(lv.monsters ?? []);
    }

    // 绝境节点带自己的机制标签与星数档（与主关各自一份，不串档）：挑战目标已随星级奖励列表
    // 垫在关卡面板底部（一档一行），故目标条数 = 该关星数档吃到的目标数（绝境 1 目标 = 1 行）
    await openKingNode(PEAK_HARD_NODE);
    await expect(panel.locator('.nk-egd-floor__tags .nk-egd-peak__tag'))
      .toHaveText(king!.hard!.tags!.map((m) => m.name));
    await expect(panel.locator('.nk-egd-tierlist .nk-egd-tier')).toHaveCount(king!.hard!.star_rewards!.length);
    await expect(panel.locator('.nk-egd-tierlist .nk-egd-node'))
      .toHaveCount(king!.hard!.targets!.length);
    await expect(panel.locator('.nk-egd-tierlist .nk-egd-tier__badge'))
      .toHaveText(king!.hard!.star_rewards!.map((t) => `累计 ${t.star}★`));
    await expect(panel.locator('.nk-egd-floor__hardname, .nk-egd-floor__hard')).toHaveCount(0);
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/endgame/peak/9：机制词条直出效果说明（名称 + 描述，主关与绝境各一份）', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    const peak = seasonData('maze_peak.json', '9');
    await page.goto('/endgame/peak/9');
    const panel = page.locator('.nk-egd-peak');
    const king = (peak.levels ?? []).find((l) => l.kind === 'king');
    expect(king?.tags?.length, '当期王棋关应有机制词条（断言前提）').toBeGreaterThan(0);
    expect(king!.hard?.tags?.length, '绝境档应有自己的机制词条（断言前提）').toBeGreaterThan(0);

    /** 描述里最长的一段纯文本（占位符 #N[..] 与富文本标签都拆掉）：
     *  「文案逐字在场」断言用，避免在 e2e 里复刻 fmtDesc 的取值算法。 */
    const plainChunk = (m: MechanicLike): string => (m.desc ?? '')
      .replace(/<[^>]+>/g, '').replace(/#\d+(\[[^\]]*\])?/g, '\u0000')
      .split('\u0000').map((s) => s.trim()).sort((a, b) => b.length - a.length)[0] ?? '';

    for (const [node, tags] of [
      [PEAK_KING_NODE, king!.tags!],
      [PEAK_HARD_NODE, king!.hard!.tags!],
    ] as const) {
      await page.locator(peakTabId(king!)).click();
      await page.locator(peakNodeTabId(node)).click();
      // 分区名与「裁决象限」同一档（面板内的 h2 分区标题），不再是一行内联标签
      await expect(panel.locator('.nk-egd-floor__mechs > .nk-egd-floor__label')).toHaveText('机制');
      await expect(panel.locator('.nk-egd-peak__mech')).toHaveCount(tags.length);
      await expect(panel.locator('.nk-egd-peak__mech > .nk-egd-peak__tag'))
        .toHaveText(tags.map((m) => m.name));
      // 有描述的条目一条一段说明（缺描述的词条不落空段）
      const chunks = tags.filter((m) => m.desc).map(plainChunk);
      await expect(panel.locator('.nk-egd-peak__mechdesc')).toHaveCount(chunks.length);
      for (let i = 0; i < chunks.length; i += 1) {
        await expect(panel.locator('.nk-egd-peak__mechdesc').nth(i)).toContainText(chunks[i]);
      }
    }
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/endgame/peak/9：敌方技能按战斗阶段分组（阶段专属技能各归其位）', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    const peak = seasonData('maze_peak.json', '9');
    await page.goto('/endgame/peak/9');
    const panel = page.locator('.nk-egd-peak');
    const king = (peak.levels ?? []).find((l) => l.kind === 'king');
    expect(king, '当期应有王棋关').toBeTruthy();

    /** 期望值全部数据派生：阶段 = 该敌方技能 `phase_list` 的正数去重升序（`0` 是上游哨兵，不是阶段） */
    const phasesOf = (m: { skills?: { phase_list?: number[] }[] }): number[] =>
      [...new Set((m.skills ?? []).flatMap((s) => s.phase_list ?? []))]
        .filter((p) => p > 0).sort((a, b) => a - b);
    const phaseSkills = (
      m: { skills?: { name: string; phase_list?: number[] }[] }, p: number,
    ): string[] => (m.skills ?? []).filter((s) => (s.phase_list ?? []).includes(p)).map((s) => s.name);

    // 王棋 boss 的技能跨 3 个阶段（默认停在该档）⇒ 走分组形态：一阶段一行「阶段 N + 该阶段技能」
    const boss = king!.monsters![0];
    const phases = phasesOf(boss);
    expect(phases.length, '王棋 boss 应跨多阶段（断言前提）').toBeGreaterThan(1);
    const skills = panel.locator('.nk-egd-mon__skills--grouped');
    await expect(skills).toHaveCount(1);
    const groups = skills.locator('.nk-egd-mon__skillgroup');
    await expect(groups).toHaveCount(phases.length);
    for (let i = 0; i < phases.length; i += 1) {
      await expect(groups.nth(i).locator('.nk-egd-mon__skillphase')).toHaveText(`阶段 ${phases[i]}`);
      await expect(groups.nth(i).locator('.nk-egd-mon__skill')).toHaveText(phaseSkills(boss, phases[i]));
    }

    // 单阶段敌方（骑士关全档）保持平铺 chip 行：不长阶段小标题，技能一个不少且按数据序
    const knights = peakKnightLevels(peak);
    const knight = knights[0];
    await page.locator(peakKnightsTabId).click();
    await page.locator(peakKnightNodeTabId(knight)).click();
    await expect(panel.locator('.nk-egd-mon__skills--grouped')).toHaveCount(0);
    await expect(panel.locator('.nk-egd-mon__skillphase')).toHaveCount(0);
    const flatSkills = (knight.monsters ?? [])
      .flatMap((m) => (m.skills ?? []).map((s) => s.name));
    expect(flatSkills.length, '该骑士关应有技能（断言前提）').toBeGreaterThan(0);
    await expect(panel.locator('.nk-egd-mon__skill')).toHaveText(flatSkills);
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/endgame/peak/9：敌方卡逐战斗阶段列血量（多阶段一行一段，单阶段退回单值）', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    const peak = seasonData('maze_peak.json', '9');
    await page.goto('/endgame/peak/9');
    const panel = page.locator('.nk-egd-peak');
    const king = (peak.levels ?? []).find((l) => l.kind === 'king');
    expect(king, '当期应有王棋关').toBeTruthy();

    // 王棋 boss（默认停在主关档）= 3 个战斗阶段 ⇒ 立绘下方一阶段一行「阶段 N + 数值」，
    // 期望值全部由该敌方的 `phase_hp` 派生（cn 数制），阶段号即下标 + 1
    const boss = king!.monsters![0];
    const phases = boss.phase_hp;
    expect(phases?.length, '王棋 boss 应带逐阶段血量（断言前提）').toBeGreaterThan(1);
    const card = panel.locator('.nk-egd-mon').first();
    await expect(card.locator('.nk-egd-mon__hp')).toHaveCount(1);
    await expect(card.locator('.nk-egd-mon__hprow')).toHaveCount(phases!.length);
    await expect(card.locator('.nk-egd-mon__hp-label'))
      .toHaveText(phases!.map((_, i) => `阶段 ${i + 1}`));
    await expect(card.locator('.nk-egd-mon__hp-val')).toHaveText(phases!.map((v) => cnBigNumber(v)));
    // 逐阶段形态只出阶段行：不再另出一个「HP」单值行（两键并存时逐阶段优先）
    await expect(card.locator('.nk-egd-mon__hp-label').filter({ hasText: /^HP$/ })).toHaveCount(0);
    // 逐阶段数值确实随阶段变化（否则这条断言等于没测：全等值时会与单值形态同形）
    expect(new Set(phases!).size, '该 boss 各阶段血量应不全等（断言前提）').toBeGreaterThan(1);

    // 绝境节点同形、不同数值（等级 120）：王棋档内切到节点二
    await page.locator(peakTabId(king!)).click();
    await page.locator(peakNodeTabId(PEAK_HARD_NODE)).click();
    const hardPhases = king!.hard!.monsters![0].phase_hp!;
    const hardCard = panel.locator('.nk-egd-mon').first();
    await expect(hardCard.locator('.nk-egd-mon__hp-val')).toHaveText(hardPhases.map((v) => cnBigNumber(v)));

    // 单阶段敌方（骑士关全档）退回单值一行「HP」：`phase_hp` 缺位即不长阶段行
    const knight = peakKnightLevels(peak)[0];
    await page.locator(peakKnightsTabId).click();
    await page.locator(peakKnightNodeTabId(knight)).click();
    expect(knight.monsters!.every((m) => !m.phase_hp), '该骑士关不应带 phase_hp').toBe(true);
    await expect(panel.locator('.nk-egd-mon__hp-label')).toHaveText(knight.monsters!.map(() => 'HP'));
    await expect(panel.locator('.nk-egd-mon__hprow')).toHaveCount(knight.monsters!.length);
    await noUnknownOverflow(page);
    assertNoErrors();
  });
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

/**
 * Hero 状态徽标的状态文案契约。
 *
 * 存在理由：徽标曾直接渲染 `mazeStatus()` 的**裸枚举**（实测 DOM 文本 `live` / `ended`）——
 * 13 语言下都是英文内部键，与目录页 `mazeStatusLabelKey` 的口径分叉。判据 = 徽标文本必须等于
 * 语言包里 `endgame.status.<状态>` 的值。
 *
 * 期望值**数据派生**：状态按 `src/app/catalog/pages/endgame.ts mazeStatus` 的同一规则、
 * 从页面同源数据（`public/data/cn/maze_boss.json`）算出，再查语言包取文案——不写死「进行中」，
 * 否则用例会随该期赛季到期而变红。
 */
test.describe('赛季页 Hero 状态文案走词典', () => {
  /** 与 `mazeStatus` 同规则：`live_begin`/`begin` 取先有者，`live_end`/`end` 取先有者 */
  function seasonStatus(d: { live_begin?: string; live_end?: string; begin?: string; end?: string }): string {
    const parse = (s?: string): number | null => {
      if (!s) return null;
      const t = new Date(s).getTime();
      return Number.isNaN(t) ? null : t;
    };
    const start = parse(d.live_begin) ?? parse(d.begin);
    const end = parse(d.live_end) ?? parse(d.end);
    const now = Date.now();
    if (start != null && now < start) return 'upcoming';
    if (end != null && now > end) return 'ended';
    if (start != null || end != null) return 'live';
    return 'unknown';
  }

  test('/endgame/boss/3021：状态徽标 = 词典文案（不渲染裸枚举）', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    const season = readJson<Record<string, { live_begin?: string; live_end?: string; begin?: string; end?: string }>>(
      'public/data/cn/maze_boss.json',
    );
    const dict = readJson<Record<string, string>>('src/lib/i18n/messages/cn.json');
    const status = seasonStatus(season['3021'] ?? {});
    const label = dict[`endgame.status.${status}`];
    expect(label, `语言包应有 endgame.status.${status}`).toBeTruthy();

    await page.goto('/endgame/boss/3021');
    await expect(page.locator('.nk-egd-hero__status')).toHaveText(label);
    // 反向判据（防回退到裸枚举）：徽标文本不得是枚举字面
    await expect(page.locator('.nk-egd-hero__status')).not.toHaveText(/^(live|ended|upcoming|unknown)$/);
    assertNoErrors();
  });
});
