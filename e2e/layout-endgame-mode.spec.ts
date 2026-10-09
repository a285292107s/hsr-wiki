import { test, expect } from '@playwright/test';
import { collectConsoleIssues, computedNumber, readJson, readTokenPx, waitForSettled } from './helpers';
import { noUnknownOverflow } from './layout.shared';

/**
 * 布局验收：终局玩法常青页（/endgame/<mode>） —— layout 验收层（语义契约 + 数值规格）分文件之一。
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

test.describe('玩法页「当期赛季」判据（不得取未开始的那一期）', () => {
  for (const mode of ['maze', 'story', 'boss', 'peak'] as const) {
    test(`/endgame/${mode}：当期 = 列表中状态为「进行中」的那一期`, async ({ page }) => {
      const { assertNoErrors } = collectConsoleIssues(page);
      await page.goto(`/endgame/${mode}`);
      // 本页正文整体在 `phase === 'ready'` 内，`goto` 的 load 事件早于路由 chunk + 数据 JSON 落地
      // （CI trace 实测：数据请求晚于 load 约 160ms）——不等就取值会拿到 null，属竞态而非数据缺陷。
      await waitForSettled(page);

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

test.describe('终局详情页 Hero 大图口径（赛季 banner 翻转铺底）', () => {
  /** Hero 大图口径（用户裁决，含一次当天改主意后的回退）：有 `theme_banner` 的期（maze / story / boss）
   *  用它**左右翻转**后当背景（不再出右侧画框）；无该字段的期（peak 只有 `handbook_banner`）回退
   *  赛季大图且不翻。左栏徽标盘保留（用户看版后要求回到这一版）。 */
  test('/endgame 详情页 Hero：赛季 banner 翻转作背景（保留徽标盘、无右侧画框），无 banner 的期不翻', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    const bannerOf = (file: string, id: string) => readJson<Record<string, { arts?: { theme_banner?: string } }>>(
      `public/data/cn/${file}`,
    )[id].arts?.theme_banner?.split('/').pop() || '';
    for (const [route, file, id] of [
      ['/endgame/maze/1035', 'maze.json', '1035'],
      ['/endgame/boss/3021', 'maze_boss.json', '3021'],
    ] as const) {
      await page.goto(route);
      const bg = page.locator('.nk-egd-hero__bg');
      await expect(bg, `${route} 应以赛季 banner 铺底`).toHaveCount(1);
      await expect(bg).toHaveAttribute('src', new RegExp(bannerOf(file, id).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      await expect(bg).toHaveClass(/nk-egd-hero__bg--flip/);
      // 翻转是关系而非绝对值：x 轴缩放为负（镜像）
      const m = await bg.evaluate((el) => getComputedStyle(el).transform);
      expect(m, `期望镜像矩阵，实得 ${m}`).toMatch(/^matrix\(-/);
      await expect(page.locator('.nk-egd-hero__banner'), 'banner 已改作背景，右侧画框退场').toHaveCount(0);
      await expect(page.locator('.nk-egd-hero__plate'), '徽标盘保留').toHaveCount(1);
      // 徽标盘只放官方玩法图标：自绘 EMBLEMS 圆环曾叠在它上面，已删（用户裁决）
      await expect(page.locator('.nk-egd-hero__plate .nk-egd-hero__art')).toHaveCount(1);
      await expect(page.locator('.nk-egd-hero__emblem')).toHaveCount(0);
    }
    // 异相仲裁无 theme_banner：回退 handbook_banner，不翻转
    await page.goto('/endgame/peak/9');
    const bg = page.locator('.nk-egd-hero__bg');
    await expect(bg).toHaveCount(1);
    await expect(bg).not.toHaveClass(/nk-egd-hero__bg--flip/);
    assertNoErrors();
  });
});
