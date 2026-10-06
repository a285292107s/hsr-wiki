import { test, expect } from '@playwright/test';
import { collectConsoleIssues, computedNumber, readJson, readTokenPx } from './helpers';
import { monCountLabel, noUnknownOverflow, peakTabLabels, seasonData } from './layout.shared';

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
