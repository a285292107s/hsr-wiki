import { test, expect } from '@playwright/test';
import { collectConsoleIssues, computedNumber, readJson, readTokenPx, settleAnimations } from './helpers';
import { cnBigNumber, PEAK_HARD_NODE, PEAK_KING_NODE, noUnknownOverflow, peakKnightLevels, peakKnightNodeTabId, peakKnightsTabId, peakNodeTabId, peakTabId, peakTabLabels, seasonData, seasonRewardGroups } from './layout.shared';
import type { MechanicLike, MonsterLike } from './layout.shared';

test.describe('布局验收：赛季级区块（行式排版 + 数据驱动上提）', () => {
  test('/endgame/story/2026：增益三行横排，1440×900 首屏露出关卡子 tab 与节点卡', { tag: ['@viewport-pinned'] }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/endgame/story/2026');
    const story = seasonData('maze_extra.json', '2026');
    const zone = page.locator('.nk-egd-buffzone');
    await expect(zone).toHaveCount(1);
    await expect(page.locator('#egd-buffs-title')).toHaveText('赛季增益');
    await expect(zone.locator('.nk-egd-row__label')).toHaveText(['战意机制', '战意效果']);
    const group = page.locator('#egd-season-buffs');
    await expect(group).toHaveCount(1);
    await expect(group.locator('.nk-egd-group__title')).toHaveText('荒腔走板');
    await expect(group.locator('.nk-egd-buff__name')).toHaveText(story.buffs!.map((b) => b.name));
    await settleAnimations(page);
    const sameRow = async (cards: ReturnType<typeof page.locator>): Promise<number> => new Set(
      await cards.evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().top))),
    ).size;
    expect(await sameRow(zone.locator('.nk-egd-row').last().locator('.nk-egd-buff')),
      '战意效果两卡应同排').toBe(1);
    expect(await sameRow(group.locator('.nk-egd-buff')), '荒腔走板三卡应同排').toBe(1);
    const blocks = await page.locator('.nk-egd-panel > *').evaluateAll((els) =>
      els.map((el) => (el as HTMLElement).className.split(' ')[0]));
    expect(blocks.indexOf('nk-egd-tabs')).toBe(blocks.indexOf('nk-egd-buffzone') + 1);
    const tabs = await page.locator('#egd-level-tabs').boundingBox();
    expect((tabs?.y ?? Infinity) + (tabs?.height ?? 0), '关卡子 tab 必须在首屏内完整可见')
      .toBeLessThanOrEqual(900);
    const nodeCards = await page.locator('#egd-level-panel .nk-egd-nodecards').first().boundingBox();
    expect((nodeCards?.y ?? Infinity) + (nodeCards?.height ?? 0), '首屏必须带出节点卡行（余量 6px：字体/视口舍入会让边界值在 900~906 间抖动）')
      .toBeLessThanOrEqual(906);
    await page.locator('#egd-level-tab-floor-1').click();
    await expect(page.locator('#egd-level-panel .nk-egd-group')).toHaveCount(0);
    await page.locator('#egd-level-tab-tierce').click();
    await expect(page.locator('#egd-level-panel .nk-egd-group')).toHaveCount(0);
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/endgame/maze/1036：该期各节点同 ID → 记忆紊流上提为赛季级区块', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/endgame/maze/1036');
    const maze = seasonData('maze.json', '1036');
    await expect(page.locator('.nk-egd-buffzone--solo .nk-egd-floor__buffname'))
      .toHaveText(maze.floor_details![0].buff!.name);
    await page.locator('#egd-level-tab-floor-1').click();
    await expect(page.locator('#egd-level-panel .nk-egd-floor__buff')).toHaveCount(0);
    await expect(page.locator('#egd-level-panel .nk-egd-group')).toHaveCount(0);
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/endgame/maze/100：逐层增益各异 → 保持板内承载、不上提', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/endgame/maze/100');
    const maze = seasonData('maze.json', '100');
    expect(new Set(maze.floor_details!.map((f) => f.buff!.id)).size, '该期逐层增益应各异（断言前提）')
      .toBeGreaterThan(1);
    await expect(page.locator('.nk-egd-buffzone--solo')).toHaveCount(0);
    await expect(page.locator('#egd-level-panel .nk-egd-floor__buff')).toHaveCount(1);
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/endgame/story/2001：Normal 期层内增益同 ID → 上提为赛季级区块', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/endgame/story/2001');
    const story = seasonData('maze_extra.json', '2001');
    await expect(page.locator('.nk-egd-buffzone--solo .nk-egd-floor__buffname'))
      .toHaveText(story.floor_details![0].buff!.name);
    await page.locator('#egd-level-tab-floor-1').click();
    await expect(page.locator('#egd-level-panel .nk-egd-floor__buff')).toHaveCount(0);
    await noUnknownOverflow(page);
    assertNoErrors();
  });
});

test.describe('异相仲裁赛季页并入关卡子 tab 编排（ADR 0043）', () => {
  test('/endgame/peak/9：关卡子 tab + 单关面板（奖励在页面底部），无固定条', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    const peak = seasonData('maze_peak.json', '9');
    await page.goto('/endgame/peak/9');

    await expect(page.locator('.nk-egd-bar')).toHaveCount(0);
    await expect(page.locator('.nk-egd-secnav')).toHaveCount(0);
    await expect(page.locator('.nk-egd.nk-page--detail')).toHaveCSS('padding-top', '0px'); // e2e-literal-ok: 无固定条 ⇒ 避让内距必须为 0（定义性契约值，非可漂移设计值）
    await expect(page.locator('#egd-level-tabs [role="tab"]')).toHaveText(peakTabLabels(peak));
    await expect(page.locator('#egd-level-tabs [role="tab"]').first()).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#egd-level-tabs [role="tab"]').first()).toHaveText(peakTabLabels(peak)[0]);

    await expect(page.locator('.nk-egd-peak')).toHaveCount(1);
    await expect(page.locator('.nk-egd-floor.nk-egd-peak .nk-egd-floor__title')).toHaveCount(0);
    const king = (peak.levels ?? []).find((l) => l.kind === 'king');
    expect(king, '当期应有王棋关').toBeTruthy();
    expect(king!.hard, '当期王棋关应有绝境变体（断言前提）').toBeTruthy();
    await expect(page.locator('#egd-level-panel .nk-egd-nodecard .nk-egd-nodecard__name'))
      .toHaveText(['普通难度', '绝境难度']);
    const dangerBadge = page.locator(peakNodeTabId(PEAK_HARD_NODE)).locator('.nk-egd-nodecard__danger');
    await expect(dangerBadge).toHaveCount(1);
    await expect(dangerBadge).toHaveAttribute('role', 'img');
    await expect(dangerBadge).toHaveAttribute('aria-label', '绝境');
    await expect(dangerBadge.locator('svg')).toHaveCount(1);
    await expect(page.locator(peakNodeTabId(PEAK_KING_NODE)).locator('.nk-egd-nodecard__danger'))
      .toHaveCount(0);
    await expect(page.locator(peakNodeTabId(PEAK_KING_NODE))).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('.nk-egd-peak .nk-egd-floor__head')).toHaveCount(0);

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
    await page.locator(peakTabId(king!)).click();
    await expect(page.locator('#egd-level-panel'))
      .toHaveAttribute('aria-labelledby', `egd-level-tab-peak-${king!.id}`);
    await expect(page.locator(peakNodeTabId(PEAK_KING_NODE))).toHaveCount(1);
    await expect(page.locator('#egd-level-tabs [role="tab"]')).toHaveText(peakTabLabels(peak));
    await expect(page.locator(peakNodeTabId(PEAK_KING_NODE))).toHaveAttribute('aria-selected', 'true');

    await expect(page.locator('#egd-badges, .nk-egd-badges')).toHaveCount(0);
    await expect(page.locator('.nk-egd-starrewards')).toHaveCount(0);
    const panelOrder = await page.locator('.nk-egd-panel > *').evaluateAll((els) =>
      els.map((el) => el.className.split(' ')[0]));
    expect(panelOrder[0], '子 tab 之上不再有赛季级块（星数奖励已下放本期奖励板块）').toBe('nk-egd-tabs');
    await expect(page.locator('#egd-season-rewards')).toHaveCount(1);
    const seasonAfterPanel = await page.evaluate(() => {
      const panel = document.querySelector('#egd-level-panel')!.getBoundingClientRect();
      const season = document.querySelector('#egd-season-rewards')!.getBoundingClientRect();
      return { panelBottom: panel.bottom, seasonTop: season.top };
    });
    expect(seasonAfterPanel.seasonTop, '本期奖励板块应在关卡面板之后').toBeGreaterThanOrEqual(seasonAfterPanel.panelBottom - 1);

    await expect(page.locator('#egd-buffs')).toHaveCount(0);
    await page.locator(peakTabId(king!)).click();
    await expect(page.locator('.nk-egd-peak .nk-egd-group__title')).toHaveText('裁决象限');
    await expect(page.locator('.nk-egd-peak .nk-egd-buff__name'))
      .toHaveText(king!.buffs!.map((b) => b.name));
    const peakBlocks = await page.locator('.nk-egd-peak .nk-egd-peak__body > *').evaluateAll((els) =>
      els.map((el) => (el as HTMLElement).className));
    expect(peakBlocks[0], '裁决象限在最前').toContain('nk-egd-group');
    expect(peakBlocks[1], '机制应在敌方配置之前').toContain('nk-egd-mechs');
    expect(peakBlocks[2], '敌方配置在最后').toContain('nk-egd-floor__stage');

    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/endgame/peak/9：裁决象限三卡同排 + 机制在敌方配置之前（1440×900）', { tag: ['@viewport-pinned'] }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/endgame/peak/9');
    await page.waitForSelector('#egd-peak-board');
    const buffTops = await page.locator('.nk-egd-peak .nk-egd-buff')
      .evaluateAll((els) => els.map((el) => Math.round((el as HTMLElement).offsetTop)));
    expect(new Set(buffTops).size, '裁决象限三卡应同排').toBe(1);
    const bodyKids = await page.locator('.nk-egd-peak .nk-egd-peak__body > *').evaluateAll((els) =>
      els.map((el) => (el as HTMLElement).className));
    expect(bodyKids[1]).toContain('nk-egd-mechs');
    const peakType = await page.locator('.nk-egd-peak').evaluate((panel) => {
      const fs = (sel: string): number => {
        const el = panel.querySelector(sel);
        return el ? parseFloat(getComputedStyle(el).fontSize) : 0;
      };
      const stageHead = panel.querySelector('.nk-egd-stage__head');
      const body = panel.querySelector('.nk-egd-peak__body') as HTMLElement;
      const tags = panel.querySelector('.nk-egd-floor__tags') as HTMLElement;
      const titles = ['.nk-egd-group__title', '.nk-egd-mechs__title', '.nk-egd-stage__title'];
      return {
        titles: titles.map((s) => fs(s)),
        headingTags: titles.map((s) => panel.querySelector(s)?.tagName ?? ''),
        itemName: fs('.nk-egd-peak__tag'),
        prose: fs('.nk-egd-peak__mechdesc'),
        stageHairline: stageHead ? parseFloat(getComputedStyle(stageHead).borderBottomWidth) || 0 : 0,
        blockGap: parseFloat(getComputedStyle(body).rowGap) || 0,
        listGap: parseFloat(getComputedStyle(tags).rowGap) || 0,
        tagColumns: getComputedStyle(tags).gridTemplateColumns.split(' ').length,
        tagStacked: (() => {
          const item = panel.querySelector('.nk-egd-peak__mech') as HTMLElement;
          const name = item.querySelector('.nk-egd-peak__tag') as HTMLElement;
          const desc = item.querySelector('.nk-egd-peak__mechdesc') as HTMLElement;
          if (!desc) return false;
          return Math.round(desc.getBoundingClientRect().top) >= Math.round(name.getBoundingClientRect().bottom) - 1;
        })(),
      };
    });
    expect(peakType.titles.every((v) => Math.abs(v - peakType.titles[0]) < 0.06),
      `三块区块标题必须同档（${peakType.titles.join(' / ')}）`).toBe(true);
    expect(peakType.headingTags, '三块都必须有标题元素（h2）').toEqual(['H2', 'H2', 'H2']);
    expect(peakType.titles[0], '区块标题必须压过机制词条名').toBeGreaterThan(peakType.itemName + 0.5);
    expect(peakType.titles[0], '区块标题必须压过机制正文').toBeGreaterThan(peakType.prose + 0.5);
    expect(peakType.stageHairline, '敌方配置区块头下沿发丝线').toBe(1);
    expect(peakType.blockGap, '区块间距必须大于块内条目行距').toBeGreaterThan(peakType.listGap);
    expect(peakType.tagColumns, '机制词条桌面档两列').toBe(2);
    expect(peakType.tagStacked, '机制名称压在正文之上').toBe(true);
    const stage = await page.locator('.nk-egd-peak .nk-egd-floor__stage').boundingBox();
    expect(stage?.y ?? Infinity, '首屏应带出敌方配置').toBeLessThan(900);
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/endgame/peak/1：无徽章的期只有子 tab + 单关面板', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    const peak = seasonData('maze_peak.json', '1');
    await page.goto('/endgame/peak/1');
    await expect(page.locator('#egd-pollution, .nk-egd-poll')).toHaveCount(0);
    await expect(page.locator('#egd-badges, .nk-egd-badges')).toHaveCount(0);
    await expect(page.locator('#egd-buffs')).toHaveCount(0);
    await expect(page.locator('#egd-level-tabs [role="tab"]')).toHaveText(peakTabLabels(peak));
    await expect(page.locator('.nk-egd-peak')).toHaveCount(1);
    const king = peak.levels!.find((level) => level.kind === 'king');
    await expect(page.locator('.nk-egd-peak .nk-egd-buff__name'))
      .toHaveText(king!.buffs!.map((b) => b.name));
    await page.locator(peakKnightsTabId).click();
    await expect(page.locator('.nk-egd-peak .nk-egd-group')).toHaveCount(0);
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/endgame/peak/9：单关敌方走敌方详情卡（与末日幻影层看板同源 StageContent）', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    const peak = seasonData('maze_peak.json', '9');
    await page.goto('/endgame/peak/9');
    const panel = page.locator('.nk-egd-peak');

    const king = (peak.levels ?? []).find((l) => l.kind === 'king');
    expect(king?.hard, '当期王棋关应有绝境变体档').toBeTruthy();

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
      const debuffs = first.debuff_resist ?? [];
      await expect(card.locator('.nk-egd-mon__label'))
        .toHaveText(['弱点', '抗性', ...(debuffs.length ? ['效果抵抗'] : [])]);
      await expect(card.locator('.nk-egd-mon__weak .nk-egd-elem')).toHaveCount((first.weak ?? []).length);
      await expect(card.locator('.nk-egd-mon__immicon')).toHaveCount(debuffs.length);
      const shownSkills = await card.locator('.nk-egd-mon__skill').evaluateAll(
        (els) => [...new Set(els.map((el) => (el.textContent ?? '').trim()))].sort());
      const phaseOneSkills = (first.skills ?? [])
        .filter((s) => {
          const phases = (s.phase_list ?? []).filter((p) => p > 0);
          return phases.length === 0 || phases.includes(1);
        })
        .map((s) => s.name);
      expect(shownSkills).toEqual([...new Set(phaseOneSkills)].sort());
    };

    const openKingNode = async (node: string): Promise<void> => {
      await page.locator(peakTabId(king!)).click();
      await page.locator(peakNodeTabId(node)).click();
    };
    for (const [node, stage] of [
      [PEAK_KING_NODE, king!],
      [PEAK_HARD_NODE, king!.hard!],
    ] as const) {
      await openKingNode(node);
      await expect(panel.locator('.nk-egd-stage__title')).toHaveText('敌方配置');
      await expect(panel.locator('.nk-egd-floor__moncount')).toHaveCount(0);
      await expect(page.locator(peakNodeTabId(node)).locator('.nk-egd-nodecard__elems .nk-egd-elem'))
        .toHaveCount((king!.damage ?? []).length);
      await assertCards(stage.monsters ?? []);
    }

    const knights = peakKnightLevels(peak);
    await page.locator(peakKnightsTabId).click();
    for (let i = 0; i < knights.length; i += 1) {
      const lv = knights[i];
      await page.locator(peakKnightNodeTabId(lv, i)).click();
      await expect(panel.locator('.nk-egd-stage__title').first()).toHaveText('敌方配置');
      await expect(panel.locator('.nk-egd-floor__moncount')).toHaveCount(0);
      await expect(page.locator(peakKnightNodeTabId(lv, i)).locator('.nk-egd-nodecard__elems .nk-egd-elem'))
        .toHaveCount((lv.damage ?? []).length);
      await assertCards(lv.monsters ?? []);
    }

    await openKingNode(PEAK_HARD_NODE);
    await expect(panel.locator('.nk-egd-floor__tags .nk-egd-peak__tag'))
      .toHaveText(king!.hard!.tags!.map((m) => m.name));
    const hardGroup = seasonRewardGroups(page).last();
    await expect(hardGroup.locator('.nk-egd-season-group__title')).toHaveText(king!.hard!.name!);
    await expect(hardGroup.locator('.nk-egd-tier')).toHaveCount(king!.hard!.star_rewards!.length);
    await expect(hardGroup.locator('.nk-egd-node'))
      .toHaveCount(king!.hard!.targets!.length);
    await expect(hardGroup.locator('.nk-egd-tier__badge'))
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

    const plainChunk = (m: MechanicLike): string => (m.desc ?? '')
      .replace(/<[^>]+>/g, '').replace(/#\d+(\[[^\]]*\])?/g, '\u0000')
      .split('\u0000').map((s) => s.trim()).sort((a, b) => b.length - a.length)[0] ?? '';

    for (const [node, tags] of [
      [PEAK_KING_NODE, king!.tags!],
      [PEAK_HARD_NODE, king!.hard!.tags!],
    ] as const) {
      await page.locator(peakTabId(king!)).click();
      await page.locator(peakNodeTabId(node)).click();
      await expect(panel.locator('.nk-egd-mechs__title')).toHaveText('机制');
      await expect(panel.locator('.nk-egd-peak__mech')).toHaveCount(tags.length);
      await expect(panel.locator('.nk-egd-peak__mech > .nk-egd-peak__tag'))
        .toHaveText(tags.map((m) => m.name));
      const chunks = tags.filter((m) => m.desc).map(plainChunk);
      await expect(panel.locator('.nk-egd-peak__mechdesc')).toHaveCount(chunks.length);
      for (let i = 0; i < chunks.length; i += 1) {
        await expect(panel.locator('.nk-egd-peak__mechdesc').nth(i)).toContainText(chunks[i]);
      }
    }
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/endgame/peak/9：多阶段敌方卡按阶段切换血量与技能', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    const peak = seasonData('maze_peak.json', '9');
    await page.goto('/endgame/peak/9');
    const panel = page.locator('.nk-egd-peak');
    const king = (peak.levels ?? []).find((l) => l.kind === 'king');
    expect(king, '当期应有王棋关').toBeTruthy();
    const boss = king!.monsters![0];

    const phasesOf = (m: MonsterLike): number[] => {
      const fromHp = (m.phase_hp ?? []).map((_, i) => i + 1);
      const fromSkills = (m.skills ?? []).flatMap((s) => (s.phase_list ?? []).filter((p) => p > 0));
      const count = Math.max(fromHp.length, ...fromSkills, 0);
      return Array.from({ length: count }, (_, i) => i + 1);
    };
    const skillsAt = (m: MonsterLike, phase: number): string[] => (m.skills ?? [])
      .filter((s) => {
        const phases = (s.phase_list ?? []).filter((p) => p > 0);
        return phases.length === 0 || phases.includes(phase);
      })
      .map((s) => s.name);

    const phases = phasesOf(boss);
    expect(phases.length, '王棋 boss 应跨多阶段（断言前提）').toBeGreaterThan(1);
    const labels = phases.map((p) => `阶段 ${p}`);
    const card = panel.locator('.nk-egd-mon').first();
    const tabs = card.locator('.nk-egd-mon__phases [role="tab"]');
    await expect(tabs).toHaveText(labels);
    await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
    await expect(card.locator('.nk-egd-mon__hp-label')).toHaveText(labels[0]);
    await expect(card.locator('.nk-egd-mon__hp-val')).toHaveText(cnBigNumber(boss.phase_hp![0]));
    await expect(card.locator('.nk-egd-mon__skill')).toHaveText(skillsAt(boss, phases[0]));

    const panelId = await tabs.first().getAttribute('aria-controls');
    expect(panelId, '阶段 tab 应指向技能面板').toBeTruthy();
    const skillPanel = card.locator(`#${panelId}`);
    await expect(skillPanel).toHaveAttribute('role', 'tabpanel');
    await expect(skillPanel).toHaveAttribute('aria-labelledby', await tabs.first().getAttribute('id') as string);

    for (let i = 0; i < phases.length; i += 1) {
      const phase = phases[i];
      await tabs.nth(i).click();
      await expect(tabs.nth(i)).toHaveAttribute('aria-selected', 'true');
      await expect(card.locator('.nk-egd-mon__hp-label')).toHaveText(`阶段 ${phase}`);
      await expect(card.locator('.nk-egd-mon__hp-val')).toHaveText(cnBigNumber(boss.phase_hp![phase - 1]));
      await expect(card.locator('.nk-egd-mon__skill')).toHaveText(skillsAt(boss, phase));
      await expect(skillPanel).toHaveAttribute('aria-labelledby', await tabs.nth(i).getAttribute('id') as string);
    }

    await tabs.first().focus();
    await page.keyboard.press('ArrowRight');
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
    await expect(tabs.nth(1)).toBeFocused();

    const hardPhases = king!.hard!.monsters![0].phase_hp!;
    await page.locator(peakTabId(king!)).click();
    await page.locator(peakNodeTabId(PEAK_HARD_NODE)).click();
    const hardCard = panel.locator('.nk-egd-mon').first();
    await expect(hardCard.locator('.nk-egd-mon__phases [role="tab"]')).toHaveCount(hardPhases.length);
    const hardLast = hardCard.locator('.nk-egd-mon__phases [role="tab"]').last();
    await hardLast.click();
    await expect(hardCard.locator('.nk-egd-mon__hp-val')).toHaveText(cnBigNumber(hardPhases[hardPhases.length - 1]));
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/endgame/peak/9：单阶段敌方卡不出现阶段切换，血量标签回落 HP', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    const peak = seasonData('maze_peak.json', '9');
    await page.goto('/endgame/peak/9');
    const panel = page.locator('.nk-egd-peak');
    const knight = peakKnightLevels(peak)[0];
    const phaseCountOf = (m: MonsterLike): number => Math.max(
      (m.phase_hp ?? []).length,
      ...(m.skills ?? []).flatMap((s) => (s.phase_list ?? []).filter((p) => p > 0)),
      0,
    );
    expect(
      (knight.monsters ?? []).every((m) => phaseCountOf(m) <= 1),
      '该骑士关应全为单阶段敌方（断言前提）',
    ).toBe(true);

    await page.locator(peakKnightsTabId).click();
    await page.locator(peakKnightNodeTabId(knight)).click();
    await expect(panel.locator('.nk-egd-mon')).toHaveCount(knight.monsters!.length);
    await expect(panel.locator('.nk-egd-mon__phases')).toHaveCount(0);
    await expect(panel.locator('.nk-egd-mon__hp-label')).toHaveText(knight.monsters!.map(() => 'HP'));
    await expect(panel.locator('.nk-egd-mon__hprow')).toHaveCount(knight.monsters!.length);
    await noUnknownOverflow(page);
    assertNoErrors();
  });
});

test.describe('赛季增益上提后节点看板不再复述', () => {
  test('/endgame/story/2026：切换层级 / 星启节点后看板内均无增益组', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/endgame/story/2026');
    await expect(page.locator('#egd-level-tab-floor-1')).toBeVisible();
    for (const tab of ['#egd-level-tab-floor-1', '#egd-level-tab-tierce']) {
      await page.locator(tab).click();
      await expect(page.locator('#egd-level-panel .nk-egd-group')).toHaveCount(0);
    }
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
      expect(await page.locator('.nk-egd-mon__tag--mod').count()).toBe(0);

      await noUnknownOverflow(page);
      assertNoErrors();
    },
  );
});

test.describe('赛季页 Hero 状态文案走词典', () => {
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
    await expect(page.locator('.nk-egd-hero__status')).not.toHaveText(/^(live|ended|upcoming|unknown)$/);
    assertNoErrors();
  });
});
