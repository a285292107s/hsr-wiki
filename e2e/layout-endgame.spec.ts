import { test, expect } from '@playwright/test';
import { collectConsoleIssues, computedNumber, fontPx, readJson, readTokenPx, waitForCatalogCards } from './helpers';
import { CN_NUM, cnBigNumber, expectTokenNumber, floorBossName, floorGuide, grouped, itemNameMap, lastWaveMonster, levelTabLabels, monsterBadge, noUnknownOverflow, PEAK_HARD_NODE, peakKnightLevels, peakKnightNodeTabId, peakKnightsTabId, peakNodeTabId, peakTabId, peakTabLabels, pollutedMonsters, pollutedSeasonHrefs, pollutedSummons, pollutionEntries, rewardNames, rewardNums, seasonData, seasonTabLabels, stageGuide, summonBadge, summonsOf, tierceNodeBossNames } from './layout.shared';

/**
 * 布局验收：终局目录页（/endgame 的筛选列与卡片） —— layout 验收层分文件之一。
 *
 * 与 `layout-endgame-board.spec.ts`（层级与看板）分文件的理由：`--shard` 只在**文件**边界生效，
 * 一个巨型文件就是 CI 墙钟下界——拆开才能让两块并行。判据见 docs/agents/testing.md
 * 「layout 必须按 describe 边界分文件」（此处不重复该规则，也不记耗时数字：它们必然过期）。
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
test.describe('布局验收：终局目录页', () => {
  test('/endgame：四模式筛选、卡片渲染、无溢出', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/endgame');
    await waitForCatalogCards(page);
    const cardCount = await page.locator('[class*="-grid"] a').count();
    expect(cardCount).toBeGreaterThan(0);
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  /**
   * 列头 4 个子项都不得越出列框。
   *
   * 为什么必须逐项量而不是只测整页溢出：`<html>` 上是 `overflow: clip`，长文本被撑出列框时
   * 整页 `scrollWidth` 恒等于 `clientWidth`（页面级断言永远是 0），而列框与祖先链全是
   * `overflow: visible` ⇒ 越出的部分**直接压到相邻列**上。这是本仓已踩过的坑：
   * `layout-locales-smoke.spec.ts` 曾把同一现象（`.nk-guide-link` 在 1280 下 right=1422）
   * 记成「检测口径问题」，实际是真实缺陷（i18n 迁移把含模式名的 aria 模板当成了可见文本，
   * 徽章宽度涨成「名宽 + 前缀」，145/208 个列头被撑破、最重 de +216px）。
   *
   * 判据用**几何相对关系**（不写死 px）：子项右缘 ≤ 所属列框右缘 + 1。真值随语言与视口变，
   * 故按 `RISK_LOCALES`（长译文语言）逐个跑，而不是只跑缺省语言。
   */
  test('/endgame：列头子项不越出列框（长译文语言）', { tag: '@viewport-pinned' }, async ({ page }) => {
    test.setTimeout(180_000);
    const { assertNoErrors } = collectConsoleIssues(page);
    const failures: string[] = [];

    for (const code of ['cn', 'de', 'ru', 'es', 'fr', 'pt', 'vi', 'th'] as const) {
      await page.goto(code === 'cn' ? '/endgame' : `/${code}/endgame`);
      await waitForCatalogCards(page);
      await page.waitForFunction(() => document.fonts.status === 'loaded', undefined, { timeout: 5000 }).catch(() => {});
      const bad = await page.evaluate(() => {
        const out: string[] = [];
        for (const col of document.querySelectorAll('.nk-eg-col')) {
          const cr = col.getBoundingClientRect();
          /* 必须先量**列头盒本身**：`.nk-eg-col` 改 grid 后其内部那一列是隐式 auto 轨，
             最小尺寸函数是 min-content，会被最长列头项撑开 ⇒ 列头盒比列框宽、子项却不越出列头盒。
             只量子项会漏判（旧形态列头是块级盒、宽度恒等于列框，故这条是 subgrid 结构带进来的回归）。 */
          const head = col.querySelector('.nk-eg-col__head');
          if (head) {
            const over = head.getBoundingClientRect().right - cr.right;
            if (over > 1) out.push(`${col.getAttribute('data-mode')} .nk-eg-col__head 越出列框 ${Math.round(over)}px`);
          }
          for (const sel of ['.nk-eg-col__name', '.nk-eg-col__en', '.nk-guide-link']) {
            const el = col.querySelector(sel);
            if (!el) continue;
            const r = el.getBoundingClientRect();
            const over = r.right - cr.right;
            if (over > 1) {
              // 该子项是否自身在被裁剪（有 ellipsis 的有意省略不算越界）
              const cs = getComputedStyle(el);
              const clippedByEllipsis = cs.textOverflow === 'ellipsis' && (el as HTMLElement).scrollWidth > (el as HTMLElement).clientWidth + 1;
              if (!clippedByEllipsis) {
                out.push(`${col.getAttribute('data-mode')} ${sel} 越出列框 ${Math.round(over)}px「${(el.textContent || '').trim().slice(0, 28)}」`);
              }
            }
          }
        }
        return out;
      });
      for (const b of bad) failures.push(`${code}: ${b}`);
    }

    expect(failures, '列头子项越出列框（会压到相邻列）').toEqual([]);
    assertNoErrors();
  });

  /**
   * 并排各列的列头必须**结构一致**：放得下时一行，有列过长时整排等长（盒高 / 徽章行位 /
   * 徽章底缘 / 列表起点四项齐平）。
   *
   * 用户报的原始现象是「有的列徽章在第一行、有的在第二行」——这是**整排**性质，不是单列性质。
   * 成因是列头「折几行」由各列自己的内容决定：并排四列各折各的（实测 13 语言 × 12 宽度下 33/156
   * 组合参差）。治法不是逐列硬压，而是让整排**共用行轨**（`.nk-eg-col` 跨父网格两轨 +
   * `grid-template-rows: subgrid`），列头内部再排成「两列网格」（列 1 元信息 / 列 2 徽章，行轨 `1fr`）
   * ⇒ 轨高由共享轨决定：整排放得下就是一行，某列过长才整排等长。
   *
   * **判定必须含「放得下就必须一行」这一条**（本用例的第二组断言）。缺它时「无条件两行」也全绿——
   * 曾经就是这么漏的：列头写成固定两行、徽章恒在第二行，cn 的元信息自然宽仅 95~198px、宽列可用 249px+
   * 明明放得下却仍占两行。所以两组断言都要有：① 放得下 ⇒ 盒高回到一行、徽章与文字同一视觉行；
   * ② 有列过长 ⇒ 排内四项参差为 0。真值随语言与视口变，故按长译文语言逐个跑。
   */
  test('/endgame：并排列的列头结构一致（放得下即一行；过长则整排等长）', { tag: '@viewport-pinned' }, async ({ page }) => {
    test.setTimeout(180_000);
    const { assertNoErrors } = collectConsoleIssues(page);
    const failures: string[] = [];

    for (const code of ['cn', 'de', 'ru', 'es', 'fr', 'pt', 'vi', 'th'] as const) {
      for (const width of [1024, 1280, 1440, 1920]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(code === 'cn' ? '/endgame' : `/${code}/endgame`);
        await waitForCatalogCards(page);
        await page.waitForFunction(() => document.fonts.status === 'loaded', undefined, { timeout: 5000 }).catch(() => {});
        const bad = await page.evaluate(() => {
          const out: string[] = [];
          const grid = document.querySelector('.nk-eg-grid');
          if (!grid) return ['找不到 .nk-eg-grid'];
          const cols = [...grid.querySelectorAll(':scope > .nk-eg-col')];
          // 按列框顶边把列分「排」：同排 = 顶边差 ≤ 10px（auto-fit 换行后可能有第二排）
          const bands: { top: number; cols: Element[] }[] = [];
          for (const col of cols) {
            const t = Math.round(col.getBoundingClientRect().top);
            const b = bands.find((x) => Math.abs(x.top - t) <= 10);
            if (b) b.cols.push(col); else bands.push({ top: t, cols: [col] });
          }
          const headOf = (c: Element) => c.querySelector('.nk-eg-col__head')!.getBoundingClientRect();
          const linkOf = (c: Element) => c.querySelector('.nk-guide-link')!.getBoundingClientRect();
          const listOf = (c: Element) => c.querySelector('.nk-eg-col__list')!.getBoundingClientRect();
          for (const band of bands) {
            if (band.cols.length < 2) continue; // 单列排无「排内一致性」可言
            const spread = (xs: number[]) => Math.max(...xs) - Math.min(...xs);
            const modes = band.cols.map((c) => c.getAttribute('data-mode')).join('/');
            /* 元信息（名 / en）的**视觉文字行数**。它决定该排应当是一行还是多行 —— 这是
               「放得下就必须一行」判据的输入。

               **必须数「文字行盒」（Range.getClientRects），不能数子元素的盒底。**
               子项是 flex 项（blockified）：名字自己折成两行时，它的**盒底仍只有一个**
               ⇒ 按盒底去重恒得 1 行，判据会误判成「放得下」。这个错一度被 `__count` 的存在
               掩盖（那项停在第 1 行、名字占第 2 行，两个子项盒底不同，侥幸得 2 行）；
               `__count` 移除后同一仪器立刻开始假红。**仪器错与布局错要分开归因**。 */
            const metaGeom = (c: Element) => {
              const meta = c.querySelector('.nk-eg-col__meta')!;
              const kids = [...meta.children].filter((el) => getComputedStyle(el).display !== 'none');
              const boxes: { top: number; bottom: number }[] = [];
              for (const el of kids) {
                const r = document.createRange();
                r.selectNodeContents(el);
                for (const rect of r.getClientRects()) {
                  if (rect.width > 0 && rect.height > 0) boxes.push({ top: rect.top, bottom: rect.bottom });
                }
              }
              if (!boxes.length) return { lines: 1, lineH: 0, top: 0, bottom: 0 };
              boxes.sort((a, b) => a.top - b.top);
              const merged: { top: number; bottom: number }[] = [];
              for (const b of boxes) {
                // 纵向重叠 ⇒ 同一视觉行（en 与 name 基线对齐时即为此情形）
                const hit = merged.find((l) => b.top < l.bottom - 2 && b.bottom > l.top + 2);
                if (hit) { hit.top = Math.min(hit.top, b.top); hit.bottom = Math.max(hit.bottom, b.bottom); }
                else merged.push({ top: b.top, bottom: b.bottom });
              }
              return {
                lines: merged.length,
                lineH: merged[0].bottom - merged[0].top,
                top: merged[0].top,
                bottom: merged[merged.length - 1].bottom,
              };
            };
            const geoms = band.cols.map(metaGeom);
            const maxLines = Math.max(...geoms.map((g) => g.lines));

            if (maxLines === 1) {
              /* ① 放得下 ⇒ 必须真的一行。判据**全部来自实测几何**（不外写 px）：
                    一行列头的盒高 = 上下内距 + 一个文字行高；而徽章必须与文字**同一视觉行**
                    （被顶到第二行去正是上一版「无条件两行」的形态）。 */
              band.cols.forEach((c, i) => {
                const g = geoms[i];
                const head = c.querySelector('.nk-eg-col__head')!;
                const cs = getComputedStyle(head);
                const pad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
                const h = headOf(c);
                if (h.height > pad + g.lineH + 2) {
                  out.push(`${modes} 元信息放得下却非一行（列头高 ${Math.round(h.height)}px > 内距 ${Math.round(pad)} + 行高 ${Math.round(g.lineH)}px）`);
                }
                const lr = linkOf(c);
                // 徽章比文字高，允许上下各探出一点；只在「完全错开」时判失败
                if (!(lr.top < g.bottom && lr.bottom > g.top) && Math.abs(lr.top - g.top) > 12) {
                  out.push(`${modes} 一行形态下徽章不在文字所在行（徽章 top ${Math.round(lr.top)} vs 文字 ${Math.round(g.top)}~${Math.round(g.bottom)}）`);
                }
              });
            }

            const checks: [string, number[]][] = [
              ['列头盒高', band.cols.map((c) => headOf(c).height)],
              ['徽章行位', band.cols.map((c) => linkOf(c).top - headOf(c).top)],
              ['徽章底缘', band.cols.map((c) => headOf(c).bottom - linkOf(c).bottom)],
              ['列表起点', band.cols.map((c) => listOf(c).top - headOf(c).bottom)],
            ];
            for (const [label, vals] of checks) {
              const d = spread(vals);
              if (d > 2) out.push(`${modes} 排内${label}参差 ${Math.round(d)}px（${vals.map((v) => Math.round(v)).join('/')}）`);
            }
            /* 英文副题的显隐在容器查询下**逐列**求值，故必须另断言「同排结论一致」：
               若哪天阈值调得比列宽粗（例如改成挂 `.nk-eg-col` 或按视口断点），同排四列就会
               有的隐有的显，正好重演用户报的「有的这样有的那样」。列宽相同 ⇒ 结论必须相同。
               注意本断言**不能**加强成「有收益才隐藏」：容器查询看不见「模式名多长」，
               同列宽下必然有一部分语言被一并隐藏（已知代价，见 `endgame.css` 列头注释）。 */            const enFlags = band.cols.map((c) => {
              const en = c.querySelector('.nk-eg-col__en');
              return en && getComputedStyle(en).display !== 'none' ? 1 : 0;
            });
            if (enFlags.some((f) => f !== enFlags[0])) {
              out.push(`${modes} 排内英文副题显隐不一致（${enFlags.join('/')}）`);
            }
            /* 容器查询不得改变列头盒的宽度：`.nk-eg-col` 一旦成为容器，subgrid 行轨会塌陷。 */
            for (const c of band.cols) {
              const cw = c.getBoundingClientRect().width;
              const hw = headOf(c).width;
              if (Math.abs(hw - cw) > 2) out.push(`${modes} 列头盒宽 ${Math.round(hw)}px ≠ 列框宽 ${Math.round(cw)}px`);
            }
            // 徽章必须保持自然宽（紧凑胶囊），不得被拉成整列宽
            const colW = band.cols[0].getBoundingClientRect().width;
            for (const c of band.cols) {
              const lw = linkOf(c).width;
              if (lw > colW - 40) out.push(`${modes} 徽章被拉宽到 ${Math.round(lw)}px（列宽 ${Math.round(colW)}px）`);
            }
          }
          return out;
        });
        for (const b of bad) failures.push(`${code}@${width}: ${b}`);
      }
    }

    expect(failures, '并排列的列头结构不一致（参差即为回归）').toEqual([]);
    assertNoErrors();
  });

  test('/endgame：贪饕污染赛季卡片带标记（挂赛季名后），无污染赛季不带', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/endgame');
    await waitForCatalogCards(page);
    const polluted = pollutedSeasonHrefs();
    expect(polluted.length, '目录数据里应有已登记的污染赛季').toBeGreaterThan(0);
    const badges = await page.locator('.nk-eg-lrow__poll').evaluateAll((els) => els.map((el) => ({
      text: el.textContent?.trim() || '',
      // 位置契约：与赛季名同一行且紧跟其后，不在状态/日期行里
      afterName: el.previousElementSibling?.classList.contains('nk-eg-lrow__name') ?? false,
      inMeta: el.closest('.nk-eg-lrow__meta') !== null,
    })));
    expect(badges.length, '渲染窗口内应有带标记的赛季（取样为空 = 位置契约没被验到）').toBeGreaterThan(0);
    for (const b of badges) expect(b).toEqual({ text: '贪饕污染', afterName: true, inMeta: false });
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

  test('/endgame：分模式列不窄于 --nk-grid-min（日期整串不被截断也不越到相邻列）', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    /* 列数是 auto-fit 按可用宽度落档的结果（1920 → 4 列、1280 → 4 列、1024 → 3 列、768 → 2 列），
       断言的是**每列都不窄于下限**这件不变量：列数与下限都由 CSS 给出，测试不钉列数（断点改档不该红）。 */
    for (const width of [768, 1024, 1280, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/endgame');
      await waitForCatalogCards(page);
      const min = await readTokenPx(page, '--nk-grid-min', '.nk-eg-grid');
      expect(min, '下限必须是正数（列数落档全靠它）').toBeGreaterThan(0);
      const colWidths = await page.locator('.nk-eg-col').evaluateAll((els) =>
        els.map((el) => Math.round(el.getBoundingClientRect().width)),
      );
      expect(colWidths.length, `视口 ${width}：四个模式列都应在`).toBe(4);
      for (const w of colWidths) expect(w, `视口 ${width}：列宽 ${w} < 下限 ${min}`).toBeGreaterThanOrEqual(min - 0.5);

      /* 日期是行内最长的不可换行串（「YYYY.MM.DD – YYYY.MM.DD」）：列不够宽时旧实现会
         ① 截断成省略号（scrollWidth > clientWidth）或 ② 整串越出列框压到相邻列上（flex-shrink: 0）。 */
      const clipped = await page.locator('.nk-eg-lrow').evaluateAll((els) =>
        els
          .filter((el) => {
            const meta = el.querySelector('.nk-eg-lrow__meta');
            const date = el.querySelector('.nk-eg-lrow__date');
            if (!meta || !date) return false;
            if (date.scrollWidth > date.clientWidth + 1) return true;
            if (meta.scrollWidth > meta.clientWidth + 1) return true;
            const col = date.closest('.nk-eg-col');
            return !!col && date.getBoundingClientRect().right > col.getBoundingClientRect().right + 0.5;
          })
          .map((el) => el.getAttribute('href') || '')
          .slice(0, 3),
      );
      expect(clipped, `视口 ${width}：这些行的日期被截断或越出列框`).toEqual([]);
      await noUnknownOverflow(page);
    }
    assertNoErrors();
  });

  test('/endgame 另两种污染形态：星启附加关（maze/1036）与异相仲裁单关（peak/9）', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    // 忘却之庭：污染落在层半场 + 星启附加关（同一赛季两种位置）
    const maze = seasonData('maze.json', '1036');
    await page.goto('/endgame/maze/1036');
    // 污染等级不再有面板级徽标、也不再出赛季级区块（用户裁决）：只挂到被污染的那一只身上——
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
    const mazePolledCards = page.locator('#egd-tierce-board .nk-egd-mon__art .nk-egd-pollchip');
    await expect(mazePolledCards).toHaveText(mazePolledMons.map(() => monsterBadge(mazeInv)));
    // 徽标落点 = 立绘**正下方**、且不出立绘列（用户裁决，ADR 0026 补记三）：
    // 不与右侧数据标签行抢位；列宽仍由立绘图宽决定（徽标换行而不是把列反撑宽）
    const mazeCardWithPoll = page.locator('#egd-tierce-board .nk-egd-mon')
      .filter({ has: page.locator('.nk-egd-mon__art .nk-egd-pollchip') }).first();
    const badgePlace = await mazeCardWithPoll.evaluate((card) => {
      const art = card.querySelector('.nk-egd-mon__art') as HTMLElement;
      const img = card.querySelector('.nk-egd-mon__img') as HTMLElement;
      const chip = card.querySelector('.nk-egd-mon__art > .nk-egd-pollchip') as HTMLElement;
      const a = art.getBoundingClientRect();
      const i = img.getBoundingClientRect();
      const c = chip.getBoundingClientRect();
      return {
        belowFig: c.top - i.bottom,
        insideLeft: Math.round(c.left - a.left),
        insideRight: Math.round(a.right - c.right),
        artW: Math.round(a.width),
        imgW: Math.round(i.width),
      };
    });
    expect(badgePlace.belowFig, '污染徽标应排在立绘下方').toBeGreaterThanOrEqual(0);
    expect(badgePlace.insideLeft, '徽标左缘不应越出立绘列').toBeGreaterThanOrEqual(-1);
    expect(badgePlace.insideRight, '徽标右缘不应越出立绘列').toBeGreaterThanOrEqual(-1);
    expect(badgePlace.artW, '立绘列宽应贴合立绘图宽（徽标不得反撑列宽）').toBe(badgePlace.imgW);
    // 关卡内 HP（ADR 0055）同一纪律：排在立绘下方、留在立绘列内，且**不得反撑列宽**
    //（`.nk-egd-mon` 是 `auto minmax(0,1fr)` 网格，列内长内容会把 auto 轨撑宽、挤窄数据列）
    const hpPlace = await mazeCardWithPoll.evaluate((card) => {
      const art = card.querySelector('.nk-egd-mon__art') as HTMLElement;
      const img = card.querySelector('.nk-egd-mon__img') as HTMLElement;
      const hp = card.querySelector('.nk-egd-mon__art > .nk-egd-mon__hp') as HTMLElement;
      const a = art.getBoundingClientRect();
      const i = img.getBoundingClientRect();
      const h = hp.getBoundingClientRect();
      return {
        belowFig: Math.round(h.top - i.bottom),
        insideLeft: Math.round(h.left - a.left),
        insideRight: Math.round(a.right - h.right),
        artW: Math.round(a.width),
        imgW: Math.round(i.width),
      };
    });
    expect(hpPlace.belowFig, 'HP 应排在立绘下方').toBeGreaterThanOrEqual(0);
    expect(hpPlace.insideLeft, 'HP 左缘不应越出立绘列').toBeGreaterThanOrEqual(-1);
    expect(hpPlace.insideRight, 'HP 右缘不应越出立绘列').toBeGreaterThanOrEqual(-1);
    expect(hpPlace.artW, 'HP 不得反撑立绘列宽').toBe(hpPlace.imgW);
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

    // 异相仲裁：关卡由子 tab 承载（ADR 0043），面板一次只渲染一关；污染落在单关上。
    // 三关骑士合并成一档（ADR 0043 补记七）：档内由节点卡片切到具体那一关
    const peak = seasonData('maze_peak.json', '9');
    await page.goto('/endgame/peak/9');
    // 无固定条（四模式一致；ADR 0043 撤销 ADR 0037 决策 1 的「只剩异相仲裁」）
    await expect(page.locator('.nk-egd-bar')).toHaveCount(0);
    await expect(page.locator('#egd-level-tabs [role="tab"]')).toHaveText(peakTabLabels(peak));
    // 污染等级只出现在被污染的那一关、且只挂到被污染的敌方身上（面板级徽标与赛季级区块均已退场，用户裁决）
    const knights = peakKnightLevels(peak);
    const pollLevel = (peak.levels ?? []).find((l) => l.invasion);
    expect(pollLevel?.name, '当期应有受污染的单关').toBeTruthy();
    const pollIdx = knights.findIndex((l) => l.id === pollLevel!.id);
    if (pollIdx >= 0) {
      // 合并档里的骑士关：先切档，再按节点卡片定位到那一关
      await page.locator(peakKnightsTabId).click();
      await page.locator(peakKnightNodeTabId(knights[pollIdx], pollIdx)).click();
    } else {
      // 污染落在王棋关上的兜底路径（数据驱动，不按赛季写死）：王棋档默认节点就是污染那一场
      await page.locator(peakTabId(pollLevel!)).click();
    }
    await expect(page.locator('.nk-egd-peak .nk-egd-floor__head')).toHaveCount(0);
    const peakLevelInv = pollLevel!.invasion!;
    const peakLevelPolled = pollutedMonsters(peakLevelInv, pollLevel!.monsters);
    expect(peakLevelPolled.length, '该单关应有登记在敌方配置里的被污染敌方').toBeGreaterThan(0);
    await expect(page.locator('.nk-egd-peak .nk-egd-mon__art .nk-egd-pollchip'))
      .toHaveText(peakLevelPolled.map(() => monsterBadge(peakLevelInv)));
    await expect(page.locator('.nk-egd-peak .nk-egd-mon__meta .nk-egd-pollchip')).toHaveCount(0);
    // 单关面板一次只渲染一关：容器数与 aria-labelledby 都跟随激活档
    await expect(page.locator('.nk-egd-peak')).toHaveCount(1);
    await expect(page.locator('#egd-level-panel')).toHaveAttribute(
      'aria-labelledby',
      pollIdx >= 0 ? 'egd-level-tab-peak-knights' : `egd-level-tab-peak-${pollLevel!.id}`,
    );
    // 王棋关的层级增益：增益名与描述同渲染位，标签仍不出现（ADR 0033 决策 8）
    const king = (peak.levels ?? []).find((l) => l.kind === 'king');
    expect(king?.buffs?.length, '王棋关应带裁决象限增益').toBeGreaterThan(0);
    await page.locator(peakTabId(king!)).click();
    await expect(page.locator('.nk-egd-peak .nk-egd-floor__buffname')).toHaveText(king!.buffs!.map((b) => b.name));
    await expect(page.locator('.nk-egd-peak .nk-egd-floor__bufflabel')).toHaveCount(0);
    // 王棋主关、绝境变体与三关骑士的敌方都走同一套敌方详情卡（与末日幻影层看板同源 `StageContent`）：
    // 召唤物挂在召唤者卡内，条数由**该场**数据派生（不串档：变体档不再复述主关敌方）
    const peakSummons = (peak.levels ?? []).flatMap(
      (l) => [...summonsOf(l.monsters), ...summonsOf(l.hard?.monsters)],
    );
    expect(peakSummons.length, '异相仲裁应有带召唤物的单关').toBeGreaterThan(0);
    await page.locator(peakKnightsTabId).click();
    for (let i = 0; i < knights.length; i += 1) {
      await page.locator(peakKnightNodeTabId(knights[i], i)).click();
      await expect(page.locator('.nk-egd-peak .nk-egd-mon .nk-egd-summon'))
        .toHaveCount(summonsOf(knights[i].monsters).length);
    }
    const kingHard = king!.hard!;
    await page.locator(peakTabId(king!)).click();
    await page.locator(peakNodeTabId(PEAK_HARD_NODE)).click();
    await expect(page.locator('.nk-egd-peak .nk-egd-mon .nk-egd-summon'))
      .toHaveCount(summonsOf(kingHard.monsters).length);
    await page.locator(peakKnightsTabId).click();
    await expect(page.locator('.nk-egd-peak .nk-egd-summons__label').first()).toHaveText('召唤物');
    await expect(page.locator('.nk-egd-peak .nk-egd-floor__row--summons')).toHaveCount(0);
    // 敌方详情卡的图标格与卡片表格分离：旧图标格形态（圆形小图标 + 格内召唤物）已整批退场
    await expect(page.locator('.nk-egd-peak .nk-egd-floor__moncell')).toHaveCount(0);
    await noUnknownOverflow(page);
    assertNoErrors();
  });
});
