import { test, expect } from '@playwright/test';
import { collectConsoleIssues, computedNumber, readJson, readTokenPx } from './helpers';
import { cnBigNumber, monCountLabel, noUnknownOverflow, peakHardTabId, peakTabId, peakTabLabels, seasonData } from './layout.shared';

/**
 * 布局验收：终局赛季详情页（/endgame/<mode>/<id> 的增益与子 tab） —— layout 验收层（语义契约 + 数值规格）分文件之一。
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
  test('/endgame/peak/9：关卡子 tab + 单关面板（星级奖励进关卡头部），无固定条', async ({ page }) => {
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

    // ② 一次只渲染一关：关卡名不再在面板内复述（身份由激活 tab 承担），面板头只留类别 + 等级
    await expect(page.locator('.nk-egd-peak')).toHaveCount(1);
    await expect(page.locator('.nk-egd-floor.nk-egd-peak .nk-egd-floor__title')).toHaveCount(0);
    const king = (peak.levels ?? []).find((l) => l.kind === 'king');
    expect(king, '当期应有王棋关').toBeTruthy();
    await expect(page.locator('.nk-egd-peak .nk-egd-floor__head .nk-egd-peak__kind')).toHaveText('王棋');
    await expect(page.locator('.nk-egd-peak .nk-egd-floor__head .nk-egd-floor__dataval')).toHaveText(String(king!.level));

    // ③ 切 tab 换的是这一关那份数据（敌方等级 + 关卡 ID 都跟随）：切到骑士关再切回王棋
    //    定位一律按 tab 的 DOM id：变体名包含主关名（「将杀王棋•绝境」含「将杀王棋」），按文案取会命中两个 tab
    const knight = (peak.levels ?? [])[0];
    await page.locator(peakTabId(knight)).click();
    await expect(page.locator('#egd-level-panel'))
      .toHaveAttribute('aria-labelledby', `egd-level-tab-peak-${knight.id}`);
    await expect(page.locator('.nk-egd-peak .nk-egd-floor__head .nk-egd-peak__kind')).toHaveText('骑士');
    await expect(page.locator('.nk-egd-peak .nk-egd-floor__head .nk-egd-floor__dataval')).toHaveText(String(knight.level));
    await page.locator(peakTabId(king!)).click();
    await expect(page.locator('#egd-level-panel'))
      .toHaveAttribute('aria-labelledby', `egd-level-tab-peak-${king!.id}`);
    // 绝境变体是**独立的一档**，紧跟其主关之后（将杀王棋 → 将杀王棋•绝境 → 骑士（三）…），不再嵌在主关面板内
    await expect(page.locator('.nk-egd-peak .nk-egd-floor__hard')).toHaveCount(0);
    await page.locator(peakHardTabId(king!)).click();
    await expect(page.locator('#egd-level-panel'))
      .toHaveAttribute('aria-labelledby', `egd-level-tab-peak-${king!.id}-hard`);
    await expect(page.locator('#egd-level-tabs [role="tab"]')).toHaveText(peakTabLabels(peak));
    await expect(page.locator('.nk-egd-peak .nk-egd-floor__head .nk-egd-peak__kind--hard')).toHaveText('绝境');
    await expect(page.locator('.nk-egd-peak .nk-egd-floor__head .nk-egd-floor__dataval')).toHaveText(String(king!.hard!.level));

    // ④ 段位徽章区块已退场（用户裁决）：关卡子 tab 之上不再有赛季级块，
    //    星数奖励改挂**关卡头部**（每关一份，见 test 下方与 `EndgamePeak`）
    await expect(page.locator('#egd-badges, .nk-egd-badges')).toHaveCount(0);
    await expect(page.locator('.nk-egd-starrewards')).toHaveCount(0);
    const panelOrder = await page.locator('.nk-egd-panel > *').evaluateAll((els) =>
      els.map((el) => el.className.split(' ')[0]));
    expect(panelOrder[0], '子 tab 之上不再有赛季级块（星数奖励已下放单关头部）').toBe('nk-egd-tabs');

    // ⑤ 赛季增益不再在关卡子 tab 外单独显示；王棋面板承载该关增益，且排在敌人配置之前（用户裁决）
    await expect(page.locator('#egd-buffs')).toHaveCount(0);
    await page.locator(peakTabId(king!)).click();
    await expect(page.locator('.nk-egd-peak .nk-egd-floor__label').filter({ hasText: '裁决象限' })).toHaveCount(1);
    await expect(page.locator('.nk-egd-peak .nk-egd-floor__buffname'))
      .toHaveText(king!.buffs!.map((b) => b.name));
    const peakBlocks = await page.locator('.nk-egd-peak .nk-egd-peak__body').evaluate((el) =>
      [...el.children].map((c) => (c as HTMLElement).className.split(' ')[0]));
    // 星级奖励列表（含该关星级挑战要求）是面板首块，排在裁决象限之前
    expect(peakBlocks[0], '星级奖励列表应在关卡头部').toBe('nk-egd-head');
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
    // 骑士关不带裁决象限增益（增益只在王棋关那场下发）
    await page.locator(peakTabId(peak.levels![0])).click();
    await expect(page.locator('.nk-egd-peak .nk-egd-floor__buffname')).toHaveCount(0);
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/endgame/peak/9：单关敌方走敌方详情卡（与末日幻影层看板同源 StageContent）', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    const peak = seasonData('maze_peak.json', '9');
    await page.goto('/endgame/peak/9');
    const panel = page.locator('.nk-egd-peak');

    // 每一档（含「绝境」变体这一档）只渲染**自己那一场**的敌方：卡片条数 = 该档敌方数
    const king = (peak.levels ?? []).find((l) => l.kind === 'king');
    expect(king?.hard, '当期王棋关应有绝境变体档').toBeTruthy();
    const stages = [
      ...(peak.levels ?? []).map((lv) => ({ tab: peakTabId(lv), stage: lv, damage: lv.damage ?? [] })),
      { tab: peakHardTabId(king!), stage: king!.hard!, damage: king!.damage ?? [] },
    ];
    for (const { tab, stage, damage } of stages) {
      await page.locator(tab).click();
      const mono = stage.monsters ?? [];
      const cards = panel.locator('.nk-egd-mon');
      await expect(cards).toHaveCount(mono.length);
      await expect(panel.locator('.nk-egd-floor__moncell, .nk-egd-floor__monlink')).toHaveCount(0);
      // 推荐属性与「N 波 · M 敌」摘要只由没有卡片行的异相仲裁保留（变体档沿用主关的推荐属性）
      await expect(panel.locator('.nk-egd-floor__row > .nk-egd-floor__label').first()).toHaveText('推荐属性');
      await expect(panel.locator('.nk-egd-floor__elems .nk-egd-elem')).toHaveCount(damage.length);
      await expect(panel.locator('.nk-egd-floor__moncount')).toHaveText(monCountLabel(mono));

      // 卡面 = 立绘（可跳详情）+ 名称 + 阵营/韧性/速度标签 + 弱点/抗性/效果抵抗 + 技能
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
    }

    // 绝境档带自己的机制标签与星数档（与主关各自一份，不串档）：挑战目标已随星级奖励列表
    // 进关卡头部（一档一行），故目标条数 = 该关星数档吃到的目标数（绝境 1 目标 = 1 行）
    await page.locator(peakHardTabId(king!)).click();
    await expect(panel.locator('.nk-egd-floor__tags .nk-egd-peak__tag'))
      .toHaveText(king!.hard!.tags!);
    await expect(panel.locator('.nk-egd-tierlist .nk-egd-tier')).toHaveCount(king!.hard!.star_rewards!.length);
    await expect(panel.locator('.nk-egd-tierlist .nk-egd-node'))
      .toHaveCount(king!.hard!.targets!.length);
    await expect(panel.locator('.nk-egd-tierlist .nk-egd-tier__badge'))
      .toHaveText(king!.hard!.star_rewards!.map((t) => `累计 ${t.star}★`));
    await expect(panel.locator('.nk-egd-floor__hardname, .nk-egd-floor__hard')).toHaveCount(0);
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
    await page.locator(peakTabId(peak.levels![0])).click();
    await expect(panel.locator('.nk-egd-mon__skills--grouped')).toHaveCount(0);
    await expect(panel.locator('.nk-egd-mon__skillphase')).toHaveCount(0);
    const flatSkills = (peak.levels![0].monsters ?? [])
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

    // 绝境档同形、不同数值（等级 120）
    await page.locator(peakHardTabId(king!)).click();
    const hardPhases = king!.hard!.monsters![0].phase_hp!;
    const hardCard = panel.locator('.nk-egd-mon').first();
    await expect(hardCard.locator('.nk-egd-mon__hp-val')).toHaveText(hardPhases.map((v) => cnBigNumber(v)));

    // 单阶段敌方（骑士关全档）退回单值一行「HP」：`phase_hp` 缺位即不长阶段行
    await page.locator(peakTabId(peak.levels![0])).click();
    expect(peak.levels![0].monsters!.every((m) => !m.phase_hp), '该骑士关不应带 phase_hp').toBe(true);
    await expect(panel.locator('.nk-egd-mon__hp-label')).toHaveText(
      peak.levels![0].monsters!.map(() => 'HP'));
    await expect(panel.locator('.nk-egd-mon__hprow')).toHaveCount(peak.levels![0].monsters!.length);
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
