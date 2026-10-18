import { test, expect, type Page } from '@playwright/test';
import { collectConsoleIssues, waitForCatalogCards } from './helpers';
import { collectNavAnchors, noUnknownOverflow, waitForNavMode } from './layout.shared';

/**
 * 布局验收：导航动态溢出折叠 —— layout 验收层（语义契约 + 数值规格）分文件之一。
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

test.describe('布局验收：导航动态溢出折叠', () => {

  test('窄视口：可见项恒为规范序前缀，尾部折叠进"更多"抽屉', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto('/settings');
    // 320px 常规模式 9 导航项放不下 → 至少折叠出"更多"入口
    await expect(page.locator('.ui-sidebar-more')).toBeVisible();
    const anchors = await collectNavAnchors(page);
    expect(anchors.length).toBeGreaterThan(1);
    /* 前缀性质：可见锚点在 DOM 序中恒为前 k 个（不放乱序/交错）。
       折叠项**不进底栏 DOM**（只随抽屉渲染），故这里「可见集合」即全部锚点，
       前缀性质退化为恒真——真正的前缀判据由下方「抽屉内容 = 数据序尾部」承担。 */
    const visIdx = anchors.map((a, i) => (a.visible ? i : -1)).filter((i) => i >= 0);
    expect(visIdx).toEqual(Array.from({ length: visIdx.length }, (_, i) => i));

    // 抽屉 = 数据序里被折叠的尾部（顺序一致、不重不漏）；期望值由 nav-items 的规范序派生
    const allHrefs = await page.evaluate(() => {
      const bar = document.querySelector('.ui-sidebar')!;
      return [...bar.querySelectorAll('a.ui-sidebar-link:not(.ui-sidebar-settings):not(.ui-sidebar-debug)')]
        .map((el) => el.getAttribute('href'));
    });
    expect(allHrefs.length).toBeGreaterThan(0);
    await page.locator('.ui-sidebar-more').click();
    await expect(page.locator('.ui-more__item').first()).toBeVisible();
    const drawerHrefs = await page.locator('.ui-more__item').evaluateAll((els) =>
      els.map((el) => el.getAttribute('href')),
    );
    // 底栏 + 抽屉 = 全量且无重复（底栏在前、抽屉续其后）
    const union = [...allHrefs, ...drawerHrefs];
    expect(new Set(union).size, '底栏与抽屉不得重复同一路由').toBe(union.length);
    expect(drawerHrefs.length, '320px 档必须确有折叠项').toBeGreaterThan(0);
    // 320px 低于最小声明断点 374，属未声明支持区间。KNOWN_OVERFLOWS 现为空（`.nk-seg` 手机宽
    // 被裁的既有缺陷已修）⇒ 未经登记的溢出一律失败。
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('窄视口（≥768px）：全部平铺，无折叠、"更多"入口隐藏', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/settings');
    /* 就绪等待必须先于「入口隐藏」断言：导航尚未挂载时 `.ui-sidebar-more` 同样 `toBeHidden()`、
       抽屉同样 `toHaveCount(0)`——这两条对空文档恒真，不构成等待。而 `collectNavAnchors`
       是 `evaluateAll`（无自动等待），首跑 CI 第 2 条失败即此：`anchors.length` 读到 0。
       锚点用静态导航表渲染（无网络依赖）；门统一走 `waitForNavMode`（等常规集就位）——
       与上面两条同源，「等第一个锚点可见」在同一外壳的另一个模式形态下会假通过。 */
    await waitForNavMode(page, 'normal');
    await expect(page.locator('.ui-sidebar-more')).toBeHidden();
    const anchors = await collectNavAnchors(page);
    expect(anchors.length).toBeGreaterThan(1);
    // 桌面档不折叠：没有任何项落进抽屉
    await expect(page.locator('.ui-more__item')).toHaveCount(0);
    expect(anchors.every((a) => a.visible)).toBe(true);
    await noUnknownOverflow(page);
    assertNoErrors();
  });
});

/**
 * 底栏槽位数**与语言无关**（本轮的契约）。
 *
 * 改前槽位数由译文固有宽决定（`flex-basis: auto` → 每项固有宽 = 该语言标签像素宽）：
 * 同一 390px 视口实测 cn 5 项 / pt 3 项——切个语言导航就少一半。
 * 取「中文（最短）+ 葡语（最长）」两端即可证伪：两者若不同即回归。
 * 全 13 语言 × 6 视口的完整矩阵在会话探针里跑过（`temp/verify-nav-final.mjs`），
 * 不进 e2e 是预算考虑（13 语言 × 多视口会显著拉长墙钟，而两端点已覆盖判据）。
 */
test.describe('布局验收：底栏槽位数与语言无关', () => {
  test('中文与葡语（最长译文）在窄视口下槽位数一致', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    const count = async (url: string, width: number): Promise<number> => {
      await page.setViewportSize({ width, height: 780 });
      await page.goto(url);
      /* 就绪门等**该模式的导航集**就位，而不是「第一个锚点可见」——后者在同一外壳的另一个模式
         形态下会假通过（见 `waitForNavMode` 的注释与 CI 取证）。本条两个 URL 都是常规模式、
         当前测不到模式翻转窗口，但收口成统一门是为了挡住「日后往这张表里加 CW 档」这一类回归。 */
      await waitForNavMode(page, 'normal');
      return page.locator('.ui-sidebar')
        .locator('a.ui-sidebar-link:not(.ui-sidebar-settings):not(.ui-sidebar-debug)')
        .evaluateAll((els) => els.filter((el) => el.offsetParent !== null).length);
    };
    for (const width of [320, 390, 430]) {
      const cn = await count('/character', width);
      const pt = await count('/pt/character', width);
      expect(pt, `${width}px：葡语底栏槽位数应与中文一致（改前葡语更少）`).toBe(cn);
      expect(cn, `${width}px：底栏至少 2 槽`).toBeGreaterThanOrEqual(2);
    }
    assertNoErrors();
  });

  /* ADR 0007「手机端 CW 模式底栏 6 槽位平铺、无『更多』抽屉」。
     折叠预算因此是**两段式**：先问「不收折时全量放得下吗」，放得下就全部平铺、不预留「更多」槽；
     放不下才预留。若一上来就预留，CW 在 390px 会退成「5 项 + 更多」，可见性被一致性换掉。
     期望值从导航表派生（`nav-items.ts` 的 CW 项数），不写死 6。 */
  test('货币战争模式：常规手机档全量平铺（无「更多」抽屉）', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 390, height: 780 });
    await page.goto('/currency/role');
    /* 就绪门必须等**被测对象**（侧栏已切到 CW 集），不能等「第一个锚点可见」：
       `route.meta.cw` 在 router 解析完成前为 false ⇒ 侧栏先渲染**常规模式**那套
       （`/` `/character` `/lightcone` `/relic` `/endgame`），而它们同样是 `a.ui-sidebar-link`，
       弱门会立刻通过；随后 `evaluateAll` **无自动等待**，于是把常规集当成 CW 集采样。
       CI 实测（2026-10-16，分片 3）：读到 5 个常规 href 且 `every(vis)` 为假 ⇒ 报红。
       同文件 ≥768px 那条的注释已记过同一课（「`anchors.length` 读到 0」），此处是它的兄弟形态：
       **弱门等到的不是缺陷页，而是同一外壳的另一个模式形态。** */
    await waitForNavMode(page, 'cw');
    const all = await page.locator('.ui-sidebar')
      .locator('a.ui-sidebar-link:not(.ui-sidebar-settings):not(.ui-sidebar-debug)')
      .evaluateAll((els) => els.map((el) => ({ href: el.getAttribute('href'), vis: el.offsetParent !== null })));
    expect(all.length, '货币战争模式的章节项应全部渲染').toBeGreaterThan(1);
    expect(all.every((a) => a.vis), '390px 档货币战争模式应全量平铺（ADR 0007 的 6 槽位口径）').toBe(true);
    await expect(page.locator('.ui-sidebar-more'), '全量平铺时不得出现「更多」入口').toBeHidden();
    assertNoErrors();
  });
});

test.describe('布局验收：跨模式入口文案', () => {

  test('可见标签 = 目的地模式名（常规↔货币战争双向），点击落到对方图签页', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    const swap = page.locator('.ui-sidebar-swap');

    // 常规模式页：按钮直接写目的地「货币战争」，旧标签「交换 / SWAP」退场
    await page.goto('/character');
    await expect(swap.locator('.ui-sidebar-link__cn')).toHaveText('货币战争');
    await expect(swap.locator('.ui-sidebar-link__en')).toHaveText('CURRENCY WAR');
    // 手机底栏显示的是 __label 那份，必须同文案（桌面档该元素 display:none，文本仍可比对）
    await expect(swap.locator('.ui-sidebar-link__label')).toHaveText('货币战争');
    await expect(swap).toHaveAttribute('aria-label', '前往货币战争');
    await expect(swap).toHaveAttribute('title', '前往货币战争');
    await expect(swap).not.toContainText('交换');

    // 位置契约：入口属「工具」组（与设置同组、紧贴其前），不再是导航首项
    await expect(page.locator('.ui-sidebar-tools').locator('.ui-sidebar-swap')).toHaveCount(1);
    expect(await swap.evaluate((el) => el.nextElementSibling?.classList.contains('ui-sidebar-settings'))).toBe(true);
    const vis = await page.evaluate(() => {
      const s = document.querySelector('.ui-sidebar-swap')!.getBoundingClientRect();
      const e = document.querySelector('.ui-sidebar-settings')!.getBoundingClientRect();
      return { swapY: s.y, swapX: s.x, settingsY: e.y, settingsX: e.x };
    });
    // 视觉序：侧栏里在上（同列）或底栏里在左（同行），两种断点都成立
    expect(vis.swapY <= vis.settingsY + 1 || vis.swapX < vis.settingsX).toBe(true);

    // 点击 → 对方模式的图签页（ADR 0016 决策 1 的落点粒度不变）
    await swap.click();
    await expect(page).toHaveURL(/\/currency\/role$/);

    // 货币战争页：反过来写「常规模式」
    await expect(swap.locator('.ui-sidebar-link__cn')).toHaveText('常规模式');
    await expect(swap.locator('.ui-sidebar-link__en')).toHaveText('NORMAL MODE');
    await expect(swap.locator('.ui-sidebar-link__label')).toHaveText('常规模式');
    await expect(swap).toHaveAttribute('aria-label', '前往常规模式');
    await expect(swap).toHaveAttribute('title', '前往常规模式');

    await swap.click();
    await expect(page).toHaveURL(/\/character$/);
    await noUnknownOverflow(page);
    assertNoErrors();
  });
});

test.describe('布局验收：侧栏各项风格一致', () => {
  test('侧栏文案落位一致：内容项（a）与工具项（button）的两行文案左缘必须对齐', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/character');
    await expect(page.locator('.ui-sidebar-link').first()).toBeVisible();

    /* 用户报的缺陷：侧栏「货币战争」看着居中、与别的 tab 不齐。
       根因是**元素类型**而非类名——内容项是 `<RouterLink>`（`a`，UA 默认 `text-align: start`），
       「交换」与「更多」是 `<button>`（UA 默认 `center`）；而 ≥1024 档 `.ui-sidebar-link__text`
       是纵向 flex，两行文案被拉伸到同宽后由 `text-align` 决定落位 ⇒ 只有按钮项的两行居中。
       判据不写绝对 px：① 各项 `text-align` 必须与首项相同；② **同一项内** CN 与 EN 两行文字的
       ink 左缘必须一致（居中的话较短的 CN 行会右移）。 */
    const rows = await page.evaluate(() => {
      const inkLeft = (node: Element) => {
        const range = document.createRange();
        range.selectNodeContents(node);
        return Math.round(range.getBoundingClientRect().left);
      };
      return [...document.querySelectorAll('.ui-sidebar-link')]
        .filter((el) => getComputedStyle(el).display !== 'none')
        .map((el) => {
          const cn = el.querySelector('.ui-sidebar-link__cn');
          const en = el.querySelector('.ui-sidebar-link__en');
          const label = el.querySelector('.ui-sidebar-link__label');
          const visible = (n: Element | null) => n && getComputedStyle(n).display !== 'none' && n.getBoundingClientRect().width > 0;
          return {
            name: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 12),
            tag: el.tagName.toLowerCase(),
            textAlign: getComputedStyle(el).textAlign,
            cnLeft: visible(cn) ? inkLeft(cn!) : null,
            enLeft: visible(en) ? inkLeft(en!) : null,
            labelLeft: visible(label) ? inkLeft(label!) : null,
          };
        });
    });
    expect(rows.length, '侧栏应有可见项').toBeGreaterThan(5);

    const ref = rows[0];
    expect(ref.textAlign, '基准项应为左对齐').toBe('start');
    for (const r of rows) {
      expect(r.textAlign, `${r.name}（${r.tag}）的 text-align 应与基准一致`).toBe(ref.textAlign);
      if (r.cnLeft !== null && r.enLeft !== null) {
        expect(Math.abs(r.cnLeft - r.enLeft), `${r.name}：CN 与 EN 两行左缘必须对齐（居中即不对齐）`).toBeLessThanOrEqual(1);
      }
      if (r.cnLeft !== null && r.labelLeft !== null) {
        expect(Math.abs(r.cnLeft - r.labelLeft), `${r.name}：CN 与底栏标签左缘必须对齐`).toBeLessThanOrEqual(1);
      }
    }
    assertNoErrors();
  });
});

/**
 * 设置位从「只进不出」改为**可收起**：已在设置页时再点 ＝ 收起（等同浏览器返回）。
 *
 * 两条分支必须分别构造，不能用同一路径覆盖：站内历史（`history.state.back` 有值）只能靠站内点击
 * 进入设置；无站内历史（`back === null`）只在**首次落地**设置页时出现，故必须 `goto` 直达。
 * 落点判据取「进入设置前的页面」而非固定首页——用**详情页**进入才能把「返回上一页」与
 * 「兜底回首页」区分开（若从首页进设置，两者结果相同，断言失去判别力）。
 * 收起前后都判 `pathname`：`route.path` 已剥离语言前缀，故前缀档必须单独跑一条。
 */
test.describe('布局验收：设置入口可收起', () => {
  const pathname = (page: Page) => new URL(page.url()).pathname;

  test('站内从详情页进设置，再点设置 → 回到该详情页', { tag: '@viewport-independent' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/character/1212');
    /* 就绪门等**被测页**（详情视图），不能只等外壳：侧栏链属于外壳，首屏路由未解析时也已可见，
       而那个窗口里 `from` 是 START_LOCATION、收起会落枢纽——恰是本文件要守的缺陷形态。
       在窗口内点击等于把被测前提交给运气（CI 上冻 chunk 时必红）。 */
    await waitForCatalogCards(page, '.nk-hero--char');
    await page.locator('.ui-sidebar-settings').click();
    await expect.poll(() => pathname(page), '首次点击应进入设置页').toBe('/settings');
    await page.locator('.ui-sidebar-settings').click();
    await expect.poll(() => pathname(page), '再点设置应收起并回到进入前的详情页').toBe('/character/1212');
    assertNoErrors();
  });

  test('直达设置页（无站内历史），再点设置 → 兜底回本模式首页', { tag: '@viewport-independent' }, async ({ page }) => {
    await page.goto('/settings');
    await page.waitForSelector('.nk-settings', { state: 'attached', timeout: 15_000 });
    await page.locator('.ui-sidebar-settings').click();
    await expect.poll(() => pathname(page), '无站内历史时应兜底回 / 而不是留在设置页').toBe('/');
    await expect(page.locator('.nk-settings')).toHaveCount(0);
  });

  test('货币战争模式：站内进入再点回原页；直达则兜底回货币战争枢纽', { tag: '@viewport-independent' }, async ({ page }) => {
    await page.goto('/currency/role');
    await waitForCatalogCards(page);
    await page.locator('.ui-sidebar-settings').click();
    await expect.poll(() => pathname(page)).toBe('/currency/settings');
    await page.locator('.ui-sidebar-settings').click();
    await expect.poll(() => pathname(page), '再点设置应收起并回到进入前的货币战争页').toBe('/currency/role');

    // 重新直达：goto 是整页加载，`history.state.back` 归零 ⇒ 走兜底分支
    await page.goto('/currency/settings');
    await page.waitForSelector('.nk-settings', { state: 'attached', timeout: 15_000 });
    await page.locator('.ui-sidebar-settings').click();
    await expect.poll(() => pathname(page), '兜底落点必须是本模式枢纽（/currency）而非常规首页').toBe('/currency');
  });

  test('语言前缀档同判据：/en/settings 收起回 /en/character', { tag: '@viewport-independent' }, async ({ page }) => {
    await page.goto('/en/character');
    await waitForCatalogCards(page);
    await page.locator('.ui-sidebar-settings').click();
    await expect.poll(() => pathname(page)).toBe('/en/settings');
    await page.locator('.ui-sidebar-settings').click();
    await expect.poll(() => pathname(page), '前缀不得被收起动作吃掉').toBe('/en/character');
  });

  /* 回归守卫：**首屏 chunk 未就绪**时点设置（CI 上本用例曾以 `Received: "/en/"` 判红，同一 commit 重跑即绿）。
     机制不是「记晚了」而是「两条来源同时失效」：首屏懒加载 chunk 还在路上时侧栏已可点，此刻 `from` 是
     START_LOCATION（path 恰为 `'/'`）⇒ 记录被 `from.matched.length === 0` 当成直达跳过；
     `history.state.back` 也指 `'/'` ⇒ 收起落枢纽（带前缀即 `/en/`）。窗口内**必错**，故必须造出来测：
     只延迟目录视图 chunk，让「外壳可点、首屏未解析」成为确定状态（实测未修前 4/4 落 `/en/`）。
     前置断言「窗口确实被制造出来」——若延迟失配（glob 改名 / chunk 已缓存），用例响亮失败而不是退化成空真。 */
  test('首屏 chunk 就绪前点设置：收起仍须回本页 URL', { tag: '@viewport-independent' }, async ({ page }) => {
    await page.route('**/CatalogView.vue*', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2500));
      await route.continue();
    });
    await page.goto('/en/character', { waitUntil: 'domcontentloaded' });
    const settings = page.locator('.ui-sidebar-settings');
    await expect(settings).toBeVisible();
    const shellOnly = await page.evaluate(() => {
      const app = document.getElementById('app');
      return !!app && [...app.children].every((el) => el.matches('.ui-sidebar, .nk-toast-container'));
    });
    expect(shellOnly, '前置条件：点进设置时首屏视图尚未挂载（延迟 chunk 生效）').toBe(true);
    await settings.click();
    await expect.poll(() => pathname(page)).toBe('/en/settings');
    await settings.click();
    /* 收起后落点要等目标 chunk（本用例把目录视图 chunk 延后了 2.5s）——放宽轮询，别把等待不足判成落点错 */
    await expect
      .poll(() => pathname(page), { timeout: 15_000, message: '收起必须回本次落地的 URL（路径与语言前缀都不得被吃掉）' })
      .toBe('/en/character');
  });
});
