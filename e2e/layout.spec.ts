import { test, expect, type Locator } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { collectConsoleIssues, findHorizontalOverflow, splitKnownOverflow, waitForCatalogCards } from './helpers';

/**
 * 布局验收
 * 页面：/（版本上新页）/ /character（目录网格）/ /endgame（终局单页）
 *      /currency（CW 枢纽＝本赛季新增两分区，meta.cw → <html data-theme="cw">）/ /currency/settings（CW 主题色）
 * 每页统一断言：无未捕获 JS 异常 + 无横向溢出 + 关键结构存在。
 *
 * `@viewport-pinned` 标签：凡用例内自行 `page.setViewportSize(...)` 固定视口者，
 * 必须在 `test(...)` 第二参传 `{ tag: '@viewport-pinned' }`：`mobile-chromium` 以 `grepInvert` 跳过该类用例
 * （其视口由用例自身钉死，两个 project 下行为完全重复）。唯一例外：「手机（<768px）：调试台入口隐藏」
 * 有意不打标签，作为 `isMobile` + `<meta name="viewport">` 契约的哨兵。
 */

test.describe('布局验收：常规主题', () => {
  test('首页 /：品牌带标题、版本上新三分区、无溢出', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/');
    await expect(page.locator('.nk-hub-brand__title')).toBeVisible();
    // 站点名易变，不断言具体文案，只验非空
    await expect(page.locator('.nk-hub-brand__title')).toHaveText(/\S/);
    await expect(page.locator('.nk-hub-release__title')).toContainText('版本上新');
    // 已渲染分区数 ≥1 同时是「版本增量打标管线」的端到端哨兵：整页退化为空态必须让本断言变红
    const sectionCount = await page.locator('.nk-hub-release__section').count();
    expect(sectionCount).toBeGreaterThanOrEqual(1);
    // 常规模式不得挂 cw 主题
    await expect(page.locator('html')).not.toHaveAttribute('data-theme', 'cw');
    // L3 溢出
    expect(splitKnownOverflow(await findHorizontalOverflow(page)).unknown).toEqual([]);
    assertNoErrors();
  });

  test('首页 /：1920×1080 首屏内完整可见品牌带 + 三分区标题与各自首行卡片（ADR 0019 核心验收）', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await expect(page.locator('.nk-hub-brand__title')).toBeVisible();
    // 品牌带不得回到「独占首屏」形态：高度必须显著小于视口
    const bandH = await page.locator('.nk-hub-brand').evaluate((el) =>
      Math.round(el.getBoundingClientRect().height),
    );
    expect(bandH).toBeLessThanOrEqual(240);
    // 逐区测量：每个已渲染分区的标题与首行卡片都要落在首屏内。分区数量由数据决定（无增量的分区不渲染），
    // 故不写死 3——一旦某分区把后面的分区顶出首屏，本断言即红。
    await expect(page.locator('.nk-hub-release__section').first()).toBeVisible();
    const marks = await page.locator('.nk-hub-release__section').evaluateAll((els) =>
      els.map((el) => ({
        kind: el.getAttribute('data-kind'),
        labelBottom: Math.round(el.querySelector('.nk-hub-release__label')!.getBoundingClientRect().bottom),
        firstCardBottom: Math.round(el.querySelector('.nk-hub-release__band > *')!.getBoundingClientRect().bottom),
      })),
    );
    expect(marks.length).toBeGreaterThanOrEqual(1);
    for (const m of marks) {
      expect(m.labelBottom, `分区 ${m.kind} 的标题应在首屏内`).toBeLessThanOrEqual(1080);
      expect(m.firstCardBottom, `分区 ${m.kind} 的首行卡片应在首屏内`).toBeLessThanOrEqual(1080);
    }
    expect(splitKnownOverflow(await findHorizontalOverflow(page)).unknown).toEqual([]);
    assertNoErrors();
  });

  test('首页 /：三分区皆无增量时只显示一行空态（ADR 0019 决策 10）', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    // 拦截 version.json 抹掉 version_label → 「本版本」不可判定 → 三分区全空。
    // 深链直达 / 是整页加载，启动时读到的就是被拦截的 version.json（无 store 缓存干扰）。
    await page.route('**/data/cn/version.json', (route) =>
      route.fulfill({ contentType: 'application/json', body: JSON.stringify({ game_version: '9.9.9' }) }),
    );
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await expect(page.locator('.nk-hub-release__empty')).toHaveCount(1);
    await expect(page.locator('.nk-hub-release__section')).toHaveCount(0);
    await expect(page.locator('.nk-hub-release__title')).toHaveText('版本上新');
    // 空态不回退板块索引、不改显历史版本；品牌带与共享页脚仍在
    await expect(page.locator('.nk-hub-brand__title')).toBeVisible();
    await expect(page.locator('.nk-hub-footer')).toHaveCount(1);
    expect(splitKnownOverflow(await findHorizontalOverflow(page)).unknown).toEqual([]);
    assertNoErrors();
  });

  test('角色图鉴 /character：卡片渲染、筛选工具条、无溢出', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/character');
    await waitForCatalogCards(page);
    const cardCount = await page.locator('[class*="-grid"] a').count();
    expect(cardCount).toBeGreaterThan(0);
    // 工具条存在（搜索 + 筛选下拉）
    await expect(page.locator('.nk-cat-toolbar').first()).toBeVisible();
    expect(splitKnownOverflow(await findHorizontalOverflow(page)).unknown).toEqual([]);
    assertNoErrors();
  });

  test('角色图鉴 /character：手机断点行式卡（圆头像、单列、无溢出）', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/character');
    await waitForCatalogCards(page);
    const cards = page.locator('.nk-idx-grid a.nk-idx-card');
    await expect(cards.first()).toBeVisible();
    // 单列：第二张卡 top ＞ 第一张（行式堆叠，而非并排）
    const tops = await cards.evaluateAll((els) =>
      els.slice(0, 3).map((el) => Math.round(el.getBoundingClientRect().top)),
    );
    expect(tops[1]).toBeGreaterThan(tops[0]);
    // picture 双源命中：手机断点 currentSrc 为 127px 圆头像（非半身立绘）
    const src = await cards.first().locator('img').first().evaluate(
      (el) => (el as HTMLImageElement).currentSrc,
    );
    expect(src).toContain('avatarroundicon');
    // 行卡：44px 圆头像 + 总高 ≤ 80px（半身立绘大卡让位）
    const size = await cards.first().locator('.nk-idx-card__portrait').evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height) };
    });
    expect(size).toEqual({ w: 44, h: 44 });
    const cardH = await cards.first().evaluate((el) => Math.round(el.getBoundingClientRect().height));
    expect(cardH).toBeLessThanOrEqual(80);
    expect(splitKnownOverflow(await findHorizontalOverflow(page)).unknown).toEqual([]);
    assertNoErrors();
  });
});

/** 收集侧栏导航锚点（排除 设置/交换/更多/调试台入口——仅统计 navItems 板块）；返回 DOM 序（= 规范序）下的可见性 */
async function collectNavAnchors(page: import('@playwright/test').Page) {
  return page.locator('a.ui-sidebar-link:not(.ui-sidebar-settings):not(.ui-sidebar-debug)').evaluateAll((els) =>
    els.map((el) => ({
      href: el.getAttribute('href'),
      visible: (el as HTMLElement).offsetParent !== null,
    })),
  );
}

test.describe('布局验收：导航动态溢出折叠', () => {

  test('窄视口：可见项恒为规范序前缀，尾部折叠进"更多"抽屉', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto('/settings');
    // 320px 常规模式 9 导航项放不下 → 至少折叠出"更多"入口
    await expect(page.locator('.ui-sidebar-more')).toBeVisible();
    const anchors = await collectNavAnchors(page);
    expect(anchors.length).toBeGreaterThan(1);
    // 前缀性质：可见锚点在 DOM 序中恒为前 k 个（不放乱序/交错）
    const visIdx = anchors.map((a, i) => (a.visible ? i : -1)).filter((i) => i >= 0);
    expect(visIdx).toEqual(Array.from({ length: visIdx.length }, (_, i) => i));
    // 只有折叠（可见项 < 全量）→ 抽屉内容 = 隐藏尾部，顺序一致
    const foldedHrefs = anchors.filter((a) => !a.visible).map((a) => a.href);
    expect(foldedHrefs.length).toBeGreaterThan(0);
    await page.locator('.ui-sidebar-more').click();
    const drawerHrefs = await page.locator('.ui-more__item').evaluateAll((els) =>
      els.map((el) => el.getAttribute('href')),
    );
    expect(drawerHrefs).toEqual(foldedHrefs);
    // 320px 低于最小声明断点 374，属未声明支持区间。已知项（.nk-seg 手机宽被裁，登记于
    // helpers.ts 的 KNOWN_OVERFLOWS）过滤后断言：其余任何溢出仍然失败。
    expect(splitKnownOverflow(await findHorizontalOverflow(page)).unknown).toEqual([]);
    assertNoErrors();
  });

  test('宽视口（≥768px）：全部平铺，无折叠、"更多"入口隐藏', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/settings');
    await expect(page.locator('.ui-sidebar-more')).toBeHidden();
    // 无折叠项渲染；全部导航锚点可见
    await expect(page.locator('a.ui-sidebar-link--in-more')).toHaveCount(0);
    const anchors = await collectNavAnchors(page);
    expect(anchors.length).toBeGreaterThan(1);
    expect(anchors.every((a) => a.visible)).toBe(true);
    expect(splitKnownOverflow(await findHorizontalOverflow(page)).unknown).toEqual([]);
    assertNoErrors();
  });
});

/** 读取 <html> 上的内容区避让令牌（断言 --nk-content-offset 的实际落值，单位 px）。
 *  注意：自定义属性按原样返回（手机断点声明为无单位 `0`），故必须 parseFloat 归一化。 */
async function readContentOffset(page: import('@playwright/test').Page): Promise<number> {
  return page.locator('html').evaluate((el) =>
    parseFloat(getComputedStyle(el).getPropertyValue('--nk-content-offset')) || 0,
  );
}

test.describe('布局验收：枢纽页导航条回归（ADR 0019）', () => {
  test('桌面（1280px）：/ 与 /currency 渲染侧栏，避让 148px，无 data-nav', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 1280, height: 720 });

    await page.goto('/');
    await expect(page.locator('.nk-hub-brand__title')).toBeVisible();
    await expect(page.locator('.ui-sidebar')).toBeVisible();
    // 无侧栏枢纽形态已移除——data-nav 属性与避让回退一并退场
    await expect(page.locator('html')).not.toHaveAttribute('data-nav');
    expect(await readContentOffset(page)).toBe(148);
    // 令牌真实生效：品牌带标题区左缘 = 侧栏避让 148px
    await expect(page.locator('.nk-hub-brand__content')).toHaveCSS('padding-left', '148px');

    await page.goto('/currency');
    await expect(page.locator('.nk-hub-brand__title')).toBeVisible();
    await expect(page.locator('.ui-sidebar')).toBeVisible();
    await expect(page.locator('html')).not.toHaveAttribute('data-nav');
    expect(await readContentOffset(page)).toBe(148);
    await expect(page.locator('.nk-hub-release')).toHaveCSS('padding-left', '148px');

    // 客户端路由切换（非整页加载）主流程：枢纽页 → 板块页全程导航条在位。
    await page.locator('.ui-sidebar a[href="/currency/role"]').first().click();
    // 落点断言（期望值取自 CW_NAV_ITEMS[0].path，勿凭直觉）
    await expect(page).toHaveURL(/\/currency\/role$/);
    await expect(page.locator('.ui-sidebar')).toBeVisible();
    await expect(page.locator('html')).not.toHaveAttribute('data-nav');
    expect(await readContentOffset(page)).toBe(148);
    expect(splitKnownOverflow(await findHorizontalOverflow(page)).unknown).toEqual([]);
    assertNoErrors();
  });

  test('平板（800px）：/ 渲染侧栏，避让 88px', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 800, height: 900 });
    await page.goto('/');
    await expect(page.locator('.ui-sidebar')).toBeVisible();
    await expect(page.locator('html')).not.toHaveAttribute('data-nav');
    expect(await readContentOffset(page)).toBe(88);
    await expect(page.locator('.nk-hub-release')).toHaveCSS('padding-left', '88px');
    expect(splitKnownOverflow(await findHorizontalOverflow(page)).unknown).toEqual([]);
    assertNoErrors();
  });

  test('手机（390px）：枢纽页渲染底部栏（全断点无导航的特例已作废）', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/currency');
    await expect(page.locator('.ui-sidebar')).toBeVisible();
    await expect(page.locator('html')).not.toHaveAttribute('data-nav');
    // 手机端侧面无避让：底部栏不占左缘，避让令牌维持 0
    expect(await readContentOffset(page)).toBe(0);
    expect(splitKnownOverflow(await findHorizontalOverflow(page)).unknown).toEqual([]);
    assertNoErrors();
  });

  test('非枢纽页（/character）：侧栏与 148px 避让照常，无 data-nav', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/character');
    await waitForCatalogCards(page);
    await expect(page.locator('.ui-sidebar')).toBeVisible();
    await expect(page.locator('html')).not.toHaveAttribute('data-nav');
    expect(await readContentOffset(page)).toBe(148);
    assertNoErrors();
  });
});

test.describe('布局验收：枢纽页共享页脚原语', () => {
  test('/ 与 /currency 共用 .nk-hub-footer（声明于 tokens.css），全断点留白正确', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 1280, height: 720 });
    for (const path of ['/', '/currency'] as const) {
      await page.goto(path);
      const footer = page.locator('.nk-hub-footer');
      await expect(footer).toHaveCount(1);
      // 旧首页命名类必须已消失（跨页原语中性化的回归防线）
      await expect(page.locator('.nk-home-footer')).toHaveCount(0);
      // 桌面：右缘 40 + 侧栏避让 148
      await expect(footer).toHaveCSS('padding-left', '148px');
      await expect(footer).toHaveCSS('padding-right', '40px');
      // 拉丁格言消费全站等宽令牌 --font-mono（令牌缺失会回退默认字体，视觉不易察觉）
      const font = await footer.locator('.nk-hub-footer__latin').evaluate(
        (el) => getComputedStyle(el).fontFamily,
      );
      expect(font).toContain('ui-monospace');
    }
    // 手机：页脚为导航高度预留——计算值 72 = 56 底部栏 + 16 呼吸。
    // 预留低于底部栏实际高度（56）时页脚会被压在栏下，故下限锁 56 而非固定值。
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await expect(page.locator('.ui-sidebar')).toBeVisible();
    const padBottom = await page.locator('.nk-hub-footer').evaluate(
      (el) => parseFloat(getComputedStyle(el).paddingBottom),
    );
    expect(padBottom).toBeGreaterThanOrEqual(56);
    expect(splitKnownOverflow(await findHorizontalOverflow(page)).unknown).toEqual([]);
    assertNoErrors();
  });

  test('全站等宽令牌 --font-mono：单点声明 + 目录页消费（裸字面量回归防线）', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/character');
    await waitForCatalogCards(page);
    // 令牌缺失时 var(--font-mono) 会静默继承父级字体（视觉不易察觉），故同时锁声明点与一个消费方
    const token = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--font-mono'),
    );
    expect(token).toContain('ui-monospace');
    await expect(page.locator('.nk-cat-count').first()).toHaveCSS('font-family', /ui-monospace/);
    assertNoErrors();
  });
});

test.describe('布局验收：研究线调试台 dev 入口', () => {
  /** e2e 全程 dev server（import.meta.env.DEV=true）：调试台入口应渲染。
   *  手机隐藏由 CSS 承担；平板/桌面竖排侧栏显示于设置按钮上方。 */
  test('平板/桌面（≥768px）：调试台入口可见且位于设置上方', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/settings');
    const debugLink = page.locator('.ui-sidebar-debug');
    await expect(debugLink).toBeVisible();
    await expect(debugLink).toHaveAttribute('href', '/debug');
    // 位置：设置按钮上方（DOM 序中紧随其后，且 top 更小）
    const settingsLink = page.locator('.ui-sidebar-settings');
    await expect(settingsLink).toBeVisible();
    const debugY = await debugLink.evaluate((el) => el.getBoundingClientRect().top);
    const settingsY = await settingsLink.evaluate((el) => el.getBoundingClientRect().top);
    expect(debugY).toBeLessThan(settingsY);
    expect(splitKnownOverflow(await findHorizontalOverflow(page)).unknown).toEqual([]);
    assertNoErrors();
  });

  /**
   * 本条有意不带 `@viewport-pinned`：它是 mobile project 里唯一「便宜且宽度敏感」的哨兵——
   * `devices['Pixel 7']` 的 `isMobile: true` 使 `<meta name="viewport">`（index.html）参与布局；
   * 该标签一旦被删/改名，layout viewport 退回 980px，此处 `.ui-sidebar-debug` 由隐藏转可见（tokens.css 断点）
   * → 本条硬失败。删除本条或在 playwright.config.ts 里把它一并排除，等于放弃该契约的唯一防线。
   */
  test('手机（<768px）：调试台入口隐藏，导航折叠不受影响', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/character');
    await waitForCatalogCards(page);
    await expect(page.locator('.ui-sidebar-debug')).toBeHidden();
    const anchors = await collectNavAnchors(page);
    expect(anchors.length).toBeGreaterThan(1);
    expect(splitKnownOverflow(await findHorizontalOverflow(page)).unknown).toEqual([]);
    assertNoErrors();
  });

  test('/debug 可达：调试台页挂载、四 Tab 渲染（dev-only 路由）', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/debug');
    // 调试台 HUD + 四功能 Tab 静态结构（面板数据经 CDN 异步加载，不作断言）
    await expect(page.locator('.nk-spine-debug__head h1')).toHaveText('Spine 调试台');
    const tabs = page.locator('.nk-spine-debug__tab');
    await expect(tabs).toHaveCount(4);
    await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
    assertNoErrors();
  });
});

test.describe('布局验收：终局合并单页', () => {
  test('/endgame：四模式筛选、卡片渲染、无溢出', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/endgame');
    await waitForCatalogCards(page);
    const cardCount = await page.locator('[class*="-grid"] a').count();
    expect(cardCount).toBeGreaterThan(0);
    expect(splitKnownOverflow(await findHorizontalOverflow(page)).unknown).toEqual([]);
    assertNoErrors();
  });

  test('/endgame/boss/3021：层级子 tab + 污染等级区块（ADR 0026 / 0030）', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/endgame/boss/3021');
    // 末日幻影不渲染顶部固定条（`padding-top` 归零），导航交给页内一行子 tab
    await expect(page.locator('.nk-egd-bar')).toHaveCount(0);
    await expect(page.locator('.nk-egd.nk-page--detail')).toHaveCSS('padding-top', '0px');
    await expect(page.locator('.nk-egd-secnav')).toHaveCount(0);
    // 赛季级区块保留在子 tab 之上（本模式下它是唯一赛季级区块，序号为 01）
    await expect(page.locator('#egd-pollution')).toBeVisible();
    await expect(page.locator('#egd-pollution')).toHaveText(/污染等级/);
    // 子 tab：紧接污染等级区块（并列一行）、第 1..4 层 + 星启模式，默认停在第 1 层
    await expect(page.locator('.nk-egd-poll + .nk-egd-tabs')).toHaveCount(1);
    const tabs = page.locator('.nk-egd-tabs [role="tab"]');
    await expect(tabs).toHaveText(['第 1 层', '第 2 层', '第 3 层', '第 4 层', '星启模式']);
    await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
    const tabBoxes = await tabs.evaluateAll((els) => els.map((el) => {
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.x), y: Math.round(r.y) };
    }));
    expect(new Set(tabBoxes.map((b) => b.y)).size).toBe(1);
    const xs = tabBoxes.map((b) => b.x);
    expect(xs).toEqual([...xs].sort((a, b) => a - b));
    // 本季 2 处污染关卡（第 4 层上半场 Lv.3 / 第 3 层上半场 Lv.2）：徽标随层级面板切换
    await expect(page.locator('.nk-egd-lvl__poll .nk-egd-pollchip')).toHaveCount(0);
    await page.locator('#egd-level-tab-floor-4').click();
    await expect(page.locator('.nk-egd-lvl__poll .nk-egd-pollchip')).toHaveCount(1);
    await expect(page.locator('.nk-egd-lvl__poll .nk-egd-pollchip')).toContainText('污染等级 3');
    await expect(page.locator('.nk-egd-lvl__poll .nk-egd-pollchip__half')).toHaveText('上半场');
    await page.locator('#egd-level-tab-floor-3').click();
    await expect(page.locator('.nk-egd-lvl__poll .nk-egd-pollchip')).toContainText('污染等级 2');
    // 赛季级汇总仍列两处（难度 04 上半场 Lv.3 / 难度 03 上半场 Lv.2），等级词条只列出现过的档位
    await expect(page.locator('.nk-egd-poll__item')).toHaveCount(2);
    await expect(page.locator('.nk-egd-poll__level')).toHaveCount(2);
    const levels = await page.locator('.nk-egd-poll__item .nk-egd-poll__badge')
      .evaluateAll((els) => els.map((el) => el.textContent?.trim()));
    expect(levels).toEqual(['污染等级 3', '污染等级 2']);
    // 被污染怪物不在本页敌方配置里（末日幻影只登记首领）→ 只能由污染数据给出
    await expect(page.locator('.nk-egd-poll__mon')).toHaveCount(4);
    // 回链专题页
    await expect(page.locator('.nk-egd-poll .nk-egd-poll__link')).toHaveAttribute('href', '/voracity');
    expect(splitKnownOverflow(await findHorizontalOverflow(page)).unknown).toEqual([]);
    assertNoErrors();
  });

  test('/endgame/boss/3020：层级只为上下半场 + 星启 3 节点各自完整（ADR 0029 / 0030 / 0031 / 0032）', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/endgame/boss/3020');
    const tabs = page.locator('.nk-egd-tabs [role="tab"]');
    await expect(tabs).toHaveCount(5);
    await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
    // 第 1 层：只有上下半场两个战斗节点，各挂该场次的赛季增益 3 条 + 首领特性 4 条
    const nodes = page.locator('.nk-egd-lvl__node');
    await expect(nodes).toHaveCount(2);
    await expect(nodes.nth(0).locator('.nk-egd-floor__stagelabel')).toHaveText('上半场');
    await expect(nodes.nth(1).locator('.nk-egd-floor__stagelabel')).toHaveText('下半场');
    // 下半场敌方取实际战斗数据（影将军），不是 ChallengeBossMazeExtra 的指南别名蚀心兽（ADR 0031）
    await expect(nodes.nth(0).locator('.nk-egd-mon__name')).toHaveText('弗有垂暮的不老仙');
    await expect(nodes.nth(1).locator('.nk-egd-mon__name')).toHaveText('业火焚心的影将军');
    const firstNodeGroups = nodes.nth(0).locator('.nk-egd-group');
    await expect(firstNodeGroups.nth(0).locator('.nk-egd-group__title')).toHaveText('赛季增益');
    await expect(firstNodeGroups.nth(0).locator('.nk-egd-group__label')).toHaveText('上半场');
    await expect(firstNodeGroups.nth(0).locator('.nk-egd-buff')).toHaveCount(3);
    await expect(firstNodeGroups.nth(1).locator('.nk-egd-group__title')).toHaveText('首领特性');
    await expect(firstNodeGroups.nth(1).locator('.nk-egd-trait')).toHaveCount(4);
    // 坚防守备（#1/#2 参数按 ParameterList 渲染为 50% / 100%）
    const trait0 = firstNodeGroups.nth(1).locator('.nk-egd-trait').first();
    await expect(trait0).toContainText('坚防守备');
    await expect(trait0).toContainText('50%');
    await expect(trait0).toContainText('100%');
    // 第 4 层：仍只有上下半场两场战斗——星启附加关（超偶像）只在星启模式 tab 出现
    await page.locator('#egd-level-tab-floor-4').click();
    await expect(page.locator('.nk-egd-lvl__node')).toHaveCount(2);
    await expect(page.locator('.nk-egd-lvl__node').nth(1).locator('.nk-egd-mon__name')).toHaveText('业火焚心的影将军');
    await expect(page.locator('.nk-egd-lvl')).not.toContainText('万众瞩目的超偶像');
    // 该层挑战目标仍是层级自己的 3 档（4000/5200/6600），不含星启的 4 档
    const floorTargets = page.locator('.nk-egd-floor__target');
    await expect(floorTargets).toHaveCount(3);
    await expect(floorTargets.nth(2)).toContainText('6600');
    // 记录第 4 层上下半场的推荐属性与赛季增益，用于与星启节点 1/2 逐字比对
    const floor4Elems = await page.locator('.nk-egd-lvl__node .nk-egd-floor__elems')
      .evaluateAll((els) => els.map((el) => el.innerHTML));
    const floor4Buffs = await page.locator('.nk-egd-lvl__node .nk-egd-buff__name')
      .evaluateAll((els) => els.map((el) => el.textContent?.trim() || ''));
    // 星启模式 tab：3 节点各自是完整场次（推荐属性 + 敌方 + 等级 + 该场次增益/特性）+ 4 档目标 + 8 项奖励
    await page.locator('#egd-level-tab-tierce').click();
    const tierce = page.locator('#egd-level-panel .nk-egd-tierce');
    await expect(tierce).toBeVisible();
    const starNodes = tierce.locator('.nk-egd-tierce__node');
    await expect(starNodes).toHaveCount(3);
    // 节点标题走场次口径（节点编号不上屏），节点 1/2 标出同源层
    await expect(tierce.locator('.nk-egd-tierce__nodezh')).toHaveText(['上半场', '下半场', '星启附加关']);
    await expect(tierce.locator('.nk-egd-tierce__nodefrom')).toHaveText(['同第 4 层', '同第 4 层']);
    // 每个节点都补齐了层 tab 口径的场次内容（此前只有敌方配置）
    await expect(starNodes.nth(0).locator('.nk-egd-floor__row')).toHaveCount(2);
    await expect(starNodes.nth(0).locator('.nk-egd-floor__data')).toContainText('90');
    await expect(starNodes.nth(0).locator('.nk-egd-group__title')).toHaveText(['赛季增益', '首领特性']);
    await expect(starNodes.nth(0).locator('.nk-egd-buff')).toHaveCount(3);
    await expect(starNodes.nth(0).locator('.nk-egd-trait')).toHaveCount(4);
    // 层级可用增益（末法余烬）随节点出现，与层 tab 同一份数据
    await expect(starNodes.nth(0).locator('.nk-egd-floor__bufflabel')).toHaveText('可用增益');
    await expect(starNodes.nth(0).locator('.nk-egd-mon__name')).toHaveText('弗有垂暮的不老仙');
    await expect(starNodes.nth(1).locator('.nk-egd-mon__name')).toHaveText('业火焚心的影将军');
    // 节点 1/2 与第 4 层上下半场逐字同源：推荐属性与赛季增益同源同值（ADR 0032 决策 3）
    const starElems = await starNodes.nth(0).locator('.nk-egd-floor__elems')
      .evaluateAll((els) => els.map((el) => el.innerHTML));
    expect(starElems).toEqual([floor4Elems[0]]);
    await expect(starNodes.nth(0).locator('.nk-egd-buff__name')).toHaveText(floor4Buffs.slice(0, 3));
    await expect(starNodes.nth(1).locator('.nk-egd-buff__name')).toHaveText(floor4Buffs.slice(3, 6));
    // 节点 3 = 星启附加关：敌方是超偶像，增益/特性走 tierce 那一组（不是节点 1/2 的常规那组）
    await expect(starNodes.nth(2)).toContainText('万众瞩目的超偶像');
    await expect(starNodes.nth(2).locator('.nk-egd-trait')).toHaveCount(4);
    // 节点 3 也有自己的推荐属性（星启表整场弱点口径），与节点 1/2 同一套渲染
    await expect(starNodes.nth(2).locator('.nk-egd-floor__row')).toHaveCount(2);
    await expect(starNodes.nth(2).locator('.nk-egd-floor__label').first()).toHaveText('推荐属性');
    const node3Elems = await starNodes.nth(2).locator('.nk-egd-floor__elems').innerHTML();
    expect(node3Elems.length).toBeGreaterThan(0);
    const node3Buffs = await starNodes.nth(2).locator('.nk-egd-buff__name')
      .evaluateAll((els) => els.map((el) => el.textContent?.trim() || ''));
    expect(node3Buffs).toHaveLength(3);
    expect(node3Buffs).not.toEqual(floor4Buffs.slice(0, 3));
    // 赛季增益不再有面板级副本：6 个分组全部长在节点里（3 节点 × 增益/特性）
    await expect(tierce.locator('.nk-egd-group__title')).toHaveCount(6);
    // 面板级统计行只剩回合限制：推荐属性与敌人等级随场次卡下移，不再在上方重复一份
    const statLabels = await tierce.locator('.nk-egd-tierce__label')
      .evaluateAll((els) => els.map((el) => el.textContent?.trim() || ''));
    expect(statLabels).not.toContain('推荐属性 RECOMMENDED');
    expect(statLabels).not.toContain('敌人等级 ENEMY LV');
    await expect(tierce.locator('.nk-egd-tierce__targets li')).toHaveCount(4);
    await expect(tierce.locator('.nk-egd-tierce__targets li').nth(3)).toContainText('10200');
    await expect(tierce.locator('.nk-egd-reward__name')).toHaveCount(8);
    expect(splitKnownOverflow(await findHorizontalOverflow(page)).unknown).toEqual([]);
    assertNoErrors();
  });

  test('/endgame/boss/3020：星启面板头部「挑战目标｜通关奖励」左右并排，窄屏堆叠', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/endgame/boss/3020');
    await page.locator('#egd-level-tab-tierce').click();
    const head = page.locator('#egd-level-panel .nk-egd-tierce__head');
    await expect(head).toBeVisible();
    // 两栏各带区块标签：左 = 挑战目标（4 档分数），右 = 通关奖励（8 项）
    await expect(head.locator('.nk-egd-tierce__headlabel')).toHaveText(['挑战目标', '通关奖励']);
    await expect(head.locator('.nk-egd-tierce__targets li')).toHaveCount(4);
    await expect(head.locator('.nk-egd-reward__name')).toHaveCount(8);
    // 分数档之间靠行距分行，不画分隔线（同级只读条目，线不承载层级）
    await expect(head.locator('.nk-egd-node').first()).toHaveCSS('border-bottom-width', '0px');
    // 几何必须同帧取：点 tab 后的滚动动画会让先后两次 boundingBox 落在不同滚动位置
    const desktop = await page.evaluate(() => {
      const box = (el: Element) => el.getBoundingClientRect().toJSON() as DOMRect;
      const h = document.querySelector('#egd-level-panel .nk-egd-tierce__head') as HTMLElement;
      const cols = [...h.children];
      return {
        head: box(h),
        tabs: box(document.querySelector('.nk-egd-tabs') as HTMLElement),
        left: box(cols[0]),
        right: box(cols[1]),
        nodes: box(document.querySelector('#egd-level-panel .nk-egd-tierce__nodes') as HTMLElement),
      };
    });
    // 头部标签不与子 tab 行的发丝线相贴（面板首元素留出区块间距）
    expect(desktop.head.top - desktop.tabs.bottom).toBeGreaterThanOrEqual(12);
    // 左右并排：两栏顶边齐平、右栏起点接在左栏右边界（中缝发丝线）
    expect(Math.round(desktop.right.y)).toBe(Math.round(desktop.left.y));
    expect(desktop.right.x).toBeGreaterThanOrEqual(desktop.left.x + desktop.left.width);
    // 左栏按内容收敛（不占半屏），且被 fit-content(40%) 的上限约束
    expect(desktop.left.width).toBeLessThan(desktop.right.width);
    expect(desktop.left.width).toBeLessThanOrEqual(desktop.head.width * 0.4 + 1);
    // 通关奖励已从面板底部上移到头部：整块位于星启节点之上
    expect(desktop.right.bottom).toBeLessThanOrEqual(desktop.nodes.y);
    // 窄屏堆叠为单列：两栏同左边界、右栏在左栏之下
    await page.setViewportSize({ width: 390, height: 844 });
    const narrow = await page.evaluate(() => {
      const box = (el: Element) => el.getBoundingClientRect().toJSON() as DOMRect;
      const cols = [...(document.querySelector('#egd-level-panel .nk-egd-tierce__head') as HTMLElement).children];
      return { left: box(cols[0]), right: box(cols[1]) };
    });
    expect(Math.round(narrow.right.x)).toBe(Math.round(narrow.left.x));
    expect(narrow.right.y).toBeGreaterThanOrEqual(narrow.left.bottom);
    expect(splitKnownOverflow(await findHorizontalOverflow(page)).unknown).toEqual([]);
    assertNoErrors();
  });

  test('/endgame/boss/3020：场次单列纵向（无两栏）+ 字号五档与 4px 间距节奏', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/endgame/boss/3020');
    await expect(page.locator('.nk-egd-tabs [role="tab"]').first()).toBeVisible();
    const node = page.locator('.nk-egd-lvl__node').first();
    // 全宽场次行头；节点/层尾一律单列纵向（禁两栏：grid-template-columns 必须为 none）
    await expect(node.locator('.nk-egd-lvl__nodehead .nk-egd-floor__stagelabel')).toHaveText('上半场');
    const nodeBox = await node.boundingBox();
    const headBox = await node.locator('.nk-egd-lvl__nodehead').boundingBox();
    expect(Math.round(headBox!.width)).toBe(Math.round(nodeBox!.width));
    await expect(node).toHaveCSS('display', 'flex');
    await expect(node).toHaveCSS('grid-template-columns', 'none');
    const stageBox = await node.locator('.nk-egd-floor__stage').boundingBox();
    const effectsBox = await node.locator('.nk-egd-lvl__effects').boundingBox();
    expect(effectsBox!.y).toBeGreaterThanOrEqual(stageBox!.y + stageBox!.height);
    expect(Math.round(stageBox!.x)).toBe(Math.round(effectsBox!.x));
    // 分组行头单行：标题与场次标签同一 y（此前是纵向两行）
    const group = node.locator('.nk-egd-group').first();
    const titleBox = await group.locator('.nk-egd-group__title').boundingBox();
    const labelBox = await group.locator('.nk-egd-group__label').boundingBox();
    expect(Math.round(titleBox!.y)).toBe(Math.round(labelBox!.y));
    // 层尾纵向收束：可用增益在挑战目标之上，目标列表带区块标签
    await expect(page.locator('.nk-egd-floor__goalslabel')).toHaveText('挑战目标');
    // 各档同级条目靠行距分行，不画分隔线（与星启头部同一判据）
    await expect(page.locator('.nk-egd-floor__target').first()).toHaveCSS('border-bottom-width', '0px');
    const buffBox = await page.locator('.nk-egd-lvl > .nk-egd-floor__buff').boundingBox();
    const goalsBox = await page.locator('.nk-egd-lvl > .nk-egd-floor__goals').boundingBox();
    expect(goalsBox!.y).toBeGreaterThanOrEqual(buffBox!.y + buffBox!.height);
    // 字号契约：卡片标题一档；行首标签一档；污染徽标与同行关卡位置同档（历史 bug：徽标继承 1rem）
    await expect(page.locator('.nk-egd-buff__name').first()).toHaveCSS('font-size', '15.2px');
    await expect(page.locator('.nk-egd-trait__name').first()).toHaveCSS('font-size', '15.2px');
    await expect(page.locator('.nk-egd-floor__label').first()).toHaveCSS('font-size', '11.52px');
    await expect(page.locator('.nk-egd-buff__desc').first()).toHaveCSS('font-size', '13.44px');
    const badgeVsPos = await page.evaluate(() => {
      const fs = (s: string): string => getComputedStyle(document.querySelector(s) as Element).fontSize;
      return [fs('.nk-egd-poll__badge'), fs('.nk-egd-poll__pos')];
    });
    expect(badgeVsPos[0]).toBe(badgeVsPos[1]);
    // 间距契约：同族卡片同内边距、同 gap；正文行高不缩水
    const padAndGap = await page.evaluate(() => {
      const cs = (s: string): CSSStyleDeclaration => getComputedStyle(document.querySelector(s) as Element);
      return {
        buffPad: [cs('.nk-egd-buff').paddingTop, cs('.nk-egd-buff').paddingLeft],
        traitPad: [cs('.nk-egd-trait').paddingTop, cs('.nk-egd-trait').paddingLeft],
        buffsGap: cs('.nk-egd-buffs').rowGap,
        traitsGap: cs('.nk-egd-traits').rowGap,
        descLh: cs('.nk-egd-trait__desc').lineHeight,
      };
    });
    expect(padAndGap.traitPad).toEqual(padAndGap.buffPad);
    expect(padAndGap.buffsGap).toBe(padAndGap.traitsGap);
    expect(padAndGap.descLh).toBe('24.192px');
    // 窄屏仍单列且小字不回退（手机档 ≥ 桌面档）
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(node).toHaveCSS('display', 'flex');
    await expect(page.locator('.nk-egd-mon__label').first()).toHaveCSS('font-size', '11.52px');
    expect(splitKnownOverflow(await findHorizontalOverflow(page)).unknown).toEqual([]);
    assertNoErrors();
  });

  test('/endgame/boss/3019：星启附加关推荐属性取星启表整场弱点（≠ 附加关登记敌方的韧性弱点）', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/endgame/boss/3019');
    await page.locator('#egd-level-tab-tierce').click();
    const tierce = page.locator('#egd-level-panel .nk-egd-tierce');
    const node3 = tierce.locator('.nk-egd-tierce__node').nth(2);
    await expect(node3.locator('.nk-egd-trait')).toHaveCount(4);
    await expect(node3.locator('.nk-egd-floor__label').first()).toHaveText('推荐属性');
    // 该赛季附加关关卡内登记的是无弱点机制本体「心蕉如火的猴把戏」；
    // 推荐属性只认星启表 LOJCIDLKPKG，不从敌方 weak 推导
    const node3Elems = await node3.locator('.nk-egd-floor__elems').innerHTML();
    expect(node3Elems.length).toBeGreaterThan(0);
    // 面板级统计行已无推荐属性副本：该赛季头部属性只能从节点 3 的场次卡读到
    await expect(tierce.locator('.nk-egd-tierce__stat .nk-egd-floor__elems')).toHaveCount(0);
    // 整场推荐属性恰好是附加关登记敌方的 4 个弱点，而不是节点 1/2 的推荐属性
    const node1Elems = await tierce.locator('.nk-egd-tierce__node').nth(0)
      .locator('.nk-egd-floor__elems').innerHTML();
    expect(node3Elems).not.toBe(node1Elems);
    expect(splitKnownOverflow(await findHorizontalOverflow(page)).unknown).toEqual([]);
    assertNoErrors();
  });

  test('/endgame：含污染赛季卡片带标记，无污染赛季不带', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/endgame');
    await waitForCatalogCards(page);
    const marks = await page.locator('.nk-eg-lrow__poll').evaluateAll((els) =>
      els.map((el) => (el.closest('a')?.getAttribute('href') || '')),
    );
    expect(marks).toContain('/endgame/boss/3021');
    expect(marks).not.toContain('/endgame/boss/3001');
    expect(splitKnownOverflow(await findHorizontalOverflow(page)).unknown).toEqual([]);
    assertNoErrors();
  });

  test('/endgame 另两种污染形态：星启附加关（maze/1036）与异相仲裁单关（peak/9）', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    // 忘却之庭：层半场 + 星启附加关（同一赛季两种位置）
    await page.goto('/endgame/maze/1036');
    await expect(page.locator('#egd-pollution')).toBeVisible();
    const mazeLevels = await page.locator('.nk-egd-poll__item .nk-egd-poll__badge')
      .evaluateAll((els) => els.map((el) => el.textContent?.trim()));
    expect(mazeLevels).toEqual(['污染等级 2', '污染等级 3']);
    await expect(page.locator('.nk-egd-poll__pos')).toHaveText(['第 11 层 · 下半场', '星启附加关']);
    // 星启区块自身也标出污染节点（节点 3 = 星启附加关）
    await expect(page.locator('.nk-egd-tierce__node .nk-egd-pollchip')).toHaveCount(1);
    // 星启附加关同样带自己的推荐属性（三模式共用的补全，不只在末日幻影）
    await expect(page.locator('.nk-egd-tierce__node').nth(2).locator('.nk-egd-floor__label').first()).toHaveText('推荐属性');
    expect(splitKnownOverflow(await findHorizontalOverflow(page)).unknown).toEqual([]);
    assertNoErrors();

    // 异相仲裁：无层/半场，污染直接落在单关上，且区块排在「关卡组成」之前
    await page.goto('/endgame/peak/9');
    await expect(page.locator('#egd-pollution')).toBeVisible();
    const secnav = page.locator('.nk-egd-secnav .nk-secnav__btn');
    await expect(secnav).toHaveCount(2);
    await expect(secnav.first()).toContainText('污染等级');
    await expect(secnav.last()).toContainText('关卡组成');
    await expect(page.locator('.nk-egd-poll__pos')).toHaveText(['骑士（二）']);
    await expect(page.locator('.nk-egd-poll__leveldesc')).toHaveCount(1);
    await expect(page.locator('.nk-egd-peak .nk-egd-pollchip')).toHaveCount(1);
    expect(splitKnownOverflow(await findHorizontalOverflow(page)).unknown).toEqual([]);
    assertNoErrors();
  });

  test('/endgame/maze/1036：父子层级刻度（ADR 0028）桌面', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/endgame/maze/1036');
    // 父档：场次主字 1rem/800 亮色（星启节点编号不上屏，ADR 0032）
    const nodezh = page.locator('.nk-egd-tierce__nodezh').first();
    await expect(nodezh).toBeVisible();
    await expect(nodezh).toHaveText('上半场');
    await expect(nodezh).toHaveCSS('font-size', '16px');
    await expect(nodezh).toHaveCSS('font-weight', '800');
    // 子档：16px 缩进 + 3px 竖轨；孙档：节点内「第 N 波」标签与楼层同档
    const child = page.locator('.nk-egd-tierce__nodebody').first();
    await expect(child).toHaveCSS('padding-left', '16px');
    expect(await child.evaluate((el) => getComputedStyle(el, '::before').width)).toBe('3px');
    await expect(page.locator('.nk-egd-tierce__node .nk-egd-floor__wavelabel').first()).toHaveCSS('font-size', '10.56px');
    // 楼层与异相仲裁子块同档：整个卡体缩进 + 模式色竖轨
    await expect(page.locator('.nk-egd-floor__body-inner').first()).toHaveCSS('padding-left', '16px');
    await expect(page.locator('.nk-egd-floor__stagelabel').first()).toHaveCSS('font-size', '11.52px');
    // 孙档：波标签小于子档（该赛季 24 个半场全为多波）
    await expect(page.locator('.nk-egd-floor__wavelabel').first()).toHaveCSS('font-size', '10.56px');
    expect(splitKnownOverflow(await findHorizontalOverflow(page)).unknown).toEqual([]);
    assertNoErrors();

    // 异相仲裁（无折叠体）：卡体即子块
    await page.goto('/endgame/peak/9');
    const peakBody = page.locator('.nk-egd-peak__body').first();
    await expect(peakBody).toBeVisible();
    await expect(peakBody).toHaveCSS('padding-left', '16px');
    expect(await peakBody.evaluate((el) => getComputedStyle(el, '::before').width)).toBe('3px');
    expect(splitKnownOverflow(await findHorizontalOverflow(page)).unknown).toEqual([]);
    assertNoErrors();
  });

  test('/endgame/maze/1036：父子层级刻度（ADR 0028）手机断点', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/endgame/maze/1036');
    // 手机端缩进降为 12px、轨线保留；父行字号仍大于子行（修掉旧的 0.7rem < 0.72rem 倒挂）
    const child = page.locator('.nk-egd-tierce__nodebody').first();
    await expect(child).toBeVisible();
    await expect(child).toHaveCSS('padding-left', '12px');
    expect(await child.evaluate((el) => getComputedStyle(el, '::before').width)).toBe('3px');
    await expect(page.locator('.nk-egd-tierce__nodezh').first()).toHaveCSS('font-size', '14.72px');
    await expect(page.locator('.nk-egd-tierce__node .nk-egd-floor__wavelabel').first()).toHaveCSS('font-size', '11.2px');
    await expect(page.locator('.nk-egd-floor__body-inner').first()).toHaveCSS('padding-left', '12px');
    expect(splitKnownOverflow(await findHorizontalOverflow(page)).unknown).toEqual([]);
    assertNoErrors();
  });
});

test.describe('布局验收：货币战争主题', () => {
  test('/currency：黑金主题挂载、本赛季新增两分区、无溢出', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/currency');
    // meta.cw → <html data-theme="cw">
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'cw');
    await expect(page.locator('.nk-hub-brand__title')).toBeVisible();
    // 标题恒不带赛季号 / 版本号
    await expect(page.locator('.nk-hub-release__title')).toHaveText('本赛季新增');
    const kinds = await page
      .locator('.nk-hub-release__section')
      .evaluateAll((els) => els.map((el) => el.getAttribute('data-kind')));
    // 分区按数据渲染；无增量时退化为唯一一行空态
    if (kinds.length === 0) {
      await expect(page.locator('.nk-hub-release__empty')).toHaveCount(1);
    } else {
      expect(kinds).toContain('role');
      // 分区卡片 href 必须指向对应图鉴详情页——证明 renderCard 复用生效
      const hrefs = await page
        .locator('.nk-hub-release__section[data-kind="role"] .nk-hub-release__band a')
        .evaluateAll((els) => els.map((el) => el.getAttribute('href') || ''));
      expect(hrefs.length).toBeGreaterThan(0);
      expect(hrefs.every((h) => h.startsWith('/currency/role/'))).toBe(true);
    }
    expect(splitKnownOverflow(await findHorizontalOverflow(page)).unknown).toEqual([]);
    assertNoErrors();
  });

  test('/currency：1920×1080 首屏内可见本赛季新增（ADR 0020 核心验收）', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/currency');
    await expect(page.locator('.nk-hub-brand__title')).toBeVisible();
    // 品牌带不得回到「独占首屏」形态（与 `/` 同口径）
    const bandH = await page.locator('.nk-hub-brand').evaluate((el) =>
      Math.round(el.getBoundingClientRect().height),
    );
    expect(bandH).toBeLessThanOrEqual(240);
    await expect(page.locator('.nk-hub-release__section').first()).toBeVisible();
    // 逐区测量：每个已渲染分区的标题与首行卡片都要落在首屏内（分区数由数据决定，不写死 2）
    const marks = await page.locator('.nk-hub-release__section').evaluateAll((els) =>
      els.map((el) => ({
        kind: el.getAttribute('data-kind'),
        labelBottom: Math.round(el.querySelector('.nk-hub-release__label')!.getBoundingClientRect().bottom),
        firstCardBottom: Math.round(el.querySelector('.nk-hub-release__band > *')!.getBoundingClientRect().bottom),
      })),
    );
    expect(marks.length).toBeGreaterThanOrEqual(1);
    for (const m of marks) {
      expect(m.labelBottom, `分区 ${m.kind} 的标题应在首屏内`).toBeLessThanOrEqual(1080);
      expect(m.firstCardBottom, `分区 ${m.kind} 的首行卡片应在首屏内`).toBeLessThanOrEqual(1080);
    }
    expect(splitKnownOverflow(await findHorizontalOverflow(page)).unknown).toEqual([]);
    assertNoErrors();
  });

  test('/currency：本赛季无新增时只显示一行空态（ADR 0020 决策 6）', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    // 拦截两份 CW 索引，把 is_season_new 全部抹为 false（模拟「*Old 表缺失 / 本赛季无扩充」）
    for (const [file, listKey] of [['role', 'roles'], ['traits', 'traits']] as const) {
      await page.route(`**/data/cn/currency/${file}.json`, async (route) => {
        const body = JSON.parse(readFileSync(`public/data/cn/currency/${file}.json`, 'utf8'));
        body[listKey] = body[listKey].map((item: Record<string, unknown>) => ({ ...item, is_season_new: false }));
        await route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) });
      });
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/currency');
    await expect(page.locator('.nk-hub-release__empty')).toHaveCount(1);
    await expect(page.locator('.nk-hub-release__section')).toHaveCount(0);
    await expect(page.locator('.nk-hub-release__title')).toHaveText('本赛季新增');
    // 空态不回退板块索引；品牌带与共享页脚仍在
    await expect(page.locator('.nk-cwhub-index')).toHaveCount(0);
    await expect(page.locator('.nk-hub-brand__title')).toBeVisible();
    await expect(page.locator('.nk-hub-footer')).toHaveCount(1);
    expect(splitKnownOverflow(await findHorizontalOverflow(page)).unknown).toEqual([]);
    assertNoErrors();
  });

  test('/currency/settings：CW 主题色选择（黑金语境、区块顺序固定、data-cw-accent 写入）', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/currency/settings');
    // meta.cw → <html data-theme="cw">；缺省无 data-cw-accent（默认香槟金不挂属性）
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'cw');
    await expect(page.locator('html')).not.toHaveAttribute('data-cw-accent');
    // CW 主题色区：5 个预置色板；区块顺序固定（01 常规模式主题色在 02 货币战争主题色上方）
    const cwTitle = page.locator('#cw-accent-title');
    const normalTitle = page.locator('#accent-title');
    await expect(cwTitle).toBeVisible();
    await expect(page.getByRole('listbox', { name: '货币战争主题强调色' }).locator('button')).toHaveCount(5);
    const cwY = await cwTitle.evaluate((el) => el.getBoundingClientRect().top);
    const normalY = await normalTitle.evaluate((el) => el.getBoundingClientRect().top);
    expect(normalY).toBeLessThan(cwY);
    // 选择玫瑰金 → <html data-cw-accent="rose">（tokens [data-theme="cw"][data-cw-accent] 规则生效）
    await page.getByRole('button', { name: /玫瑰金/ }).click();
    await expect(page.locator('html')).toHaveAttribute('data-cw-accent', 'rose');
    expect(splitKnownOverflow(await findHorizontalOverflow(page)).unknown).toEqual([]);
    assertNoErrors();
  });

  test('/currency/role/1001：名册扉页 Hero、星级切换、无溢出', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    // 绕开 dev public 索引缓存（rolldown-vite 8 运行期新增文件未入索引）：prop_icons.json 直接注入磁盘内容
    await page.route('**/data/cn/currency/prop_icons.json', (route) =>
      route.fulfill({ contentType: 'application/json', body: readFileSync('public/data/cn/currency/prop_icons.json', 'utf8') }),
    );
    await page.goto('/currency/role/1001');
    // 名册扉页 Hero：名字 + 编号行
    await expect(page.locator('.nk-crole-hero__name')).toHaveText('三月七');
    await expect(page.locator('.nk-crole-hero__id')).toHaveText('NO.1001');
    // 吸顶导航：五区块固定常驻（无内容区块显示空态提示，不隐藏）
    const labels = await page.locator('.nk-crole-bar .nk-secnav__btn').allTextContents();
    expect(labels.map((t) => t.replace(/\s+/g, ''))).toEqual(['成长总览', '技能详情', '后台星魂', '专属光锥', '推荐装备']);
    // 钢印肖像章：直角（radius 0）+ 宽高相等
    const portrait = await page.locator('.nk-crole-hero__portrait').evaluate((el) => {
      const r = el.getBoundingClientRect();
      return {
        w: Math.round(r.width),
        h: Math.round(r.height),
        radius: getComputedStyle(el).borderRadius,
      };
    });
    expect(portrait.w).toBe(portrait.h);
    expect(portrait.radius).toBe('0px');
    // 星级分段控件激活态：亮金底 + 黑字（无渐变/无 glow 的方形控件，4px 直角系）
    const pill = await page.locator('.nk-crole-gm-pill.is-active').first().evaluate((el) => {
      const cs = getComputedStyle(el);
      return { bg: cs.backgroundColor, color: cs.color, radius: cs.borderRadius };
    });
    expect(pill.bg).toBe('rgb(252, 211, 77)'); // gold-300
    expect(pill.color).toBe('rgb(10, 10, 11)'); // blk-900 近黑（禁纯黑）
    expect(pill.radius).toBe('4px');
    // 成长矩阵（结算单）与技能条款卡渲染
    await expect(page.locator('.nk-crole-gm__table')).toBeVisible();
    await expect(page.locator('.nk-crole-skill').first()).toBeVisible();
    // 技能图标：nanoka 主源 + jsDelivr 回退属性
    const icon = page.locator('.nk-crole-skill__icon').first();
    await expect(icon).toBeVisible();
    await expect(icon).toHaveAttribute('src', /static\.nanoka\.cc\/assets\/hsr\/skillicons\/SkillIcon_1001_BP\.webp/);
    await expect(icon).toHaveAttribute('data-cdn-fallback', /cdn\.jsdelivr\.net\/gh\/a285292107s\/StarRailTextures@main\/assets\/asbres\/spriteoutput\/skillicons\/avatar\/1001\/SkillIcon_1001_BP\.png/);
    // 属性图标：矩阵行（基础前台强度 → IconFrontRow）
    const gmIcon = page.locator('.nk-crole-gm__label', { hasText: '基础前台强度' }).first().locator('.nk-crole-gm__icon');
    await expect(gmIcon).toBeVisible();
    await expect(gmIcon).toHaveAttribute('src', /spriteoutput\/gridfight\/attributeicon\/normalicon\/IconFrontRow\.png/);
    // 星魂展示图：常规模式同源 ui/ui3d/rank（nanoka 主源 + jsDelivr 回退属性）
    const rankIcon = page.locator('.nk-crole-timeline__icon img').first();
    await expect(rankIcon).toBeVisible();
    await expect(rankIcon).toHaveAttribute('src', /static\.nanoka\.cc\/assets\/hsr\/rank\/_dependencies\/textures\/1001\/1001_Rank_1\.webp/);
    await expect(rankIcon).toHaveAttribute('data-cdn-fallback', /cdn\.jsdelivr\.net\/gh\/a285292107s\/StarRailTextures@main\/assets\/asbres\/ui\/ui3d\/rank\/_dependencies\/textures\/1001\/1001_Rank_1\.png/);
    // 无内容区块：1001 无专属光锥 → 面板常驻 + 空态提示
    await expect(page.locator('[data-panel="cones"] .nk-crole-empty')).toHaveText('该角色没有专属光锥数据');
    expect(splitKnownOverflow(await findHorizontalOverflow(page)).unknown).toEqual([]);
    assertNoErrors();
  });

  test('/currency/role/1003：专属光锥本体卡（EquipmentID → 常规光锥表）', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/currency/role/1003');
    await expect(page.locator('.nk-crole-hero__name')).toBeVisible();
    await page.locator('[data-panel="cones"]').scrollIntoViewIfNeeded();
    // 光锥本体：名字/稀有度/命途/编号
    const cone = page.locator('.nk-crole-cone');
    await expect(cone).toBeVisible();
    await expect(cone.locator('.nk-crole-cone__name')).toHaveText('银河铁道之夜');
    await expect(cone.locator('.nk-crole-cone__rarity')).toHaveText('★★★★★');
    await expect(cone.locator('.nk-crole-cone__path')).toHaveText('智识');
    await expect(cone.locator('.nk-crole-cone__icon')).toHaveAttribute('src', /static\.nanoka\.cc\/assets\/hsr\/lightconemediumicon\/23000\.webp/);
    // 等级递进列表保留（5 级）
    await expect(page.locator('[data-panel="cones"] .nk-crole-equip')).toHaveCount(5);
    expect(splitKnownOverflow(await findHorizontalOverflow(page)).unknown).toEqual([]);
    assertNoErrors();
  });

  test('/currency/role/1001 手机断点：方块星级切换、矩阵横向滚动、无溢出', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/currency/role/1001');
    await expect(page.locator('.nk-crole-hero__name')).toBeVisible();
    // 定位描述在档案 Hero（面板 01 无 oneliner），且不随星级切换变化（跨星级一致的数据事实）
    // v5.1：定位状态由行首方章承担（双字「后台」+ 描述），无「前台/后台」文字前缀
    await expect(page.locator('.nk-crole-hero__role .nk-crole-slot--role').first()).toHaveText('后台');
    const roleText = await page.locator('.nk-crole-hero__role').innerText();
    expect(roleText.trim()).toMatch(/^后台/);
    await expect(page.locator('[data-panel="stars"] .nk-crole-hero__role, [data-panel="stars"] .nk-crole-oneliner')).toHaveCount(0);
    // 方形分段控件：激活项 6px 圆角（非 999px pill）
    const star = await page.locator('.nk-crole-skill__star.is-on').first().evaluate((el) =>
      getComputedStyle(el).borderRadius,
    );
    expect(star).toBe('4px');
    // 星级切换联动：点 2★ → 激活项切换（矩阵列高亮/技能参数同源 selectedStar）
    // 排版稳定：切星前后列宽逐列一致（table-layout: fixed + 零尺寸 ▲，2026-08-15 防跳动回归）
    const colsBefore = await page.locator('.nk-crole-gm__table thead th').evaluateAll((els) =>
      els.map((el) => Math.round(el.getBoundingClientRect().width)),
    );
    await page.locator('.nk-crole-gm-pill', { hasText: '2★' }).click();
    await expect(page.locator('.nk-crole-gm-pill.is-active')).toHaveText('2★');
    const colsAfter = await page.locator('.nk-crole-gm__table thead th').evaluateAll((els) =>
      els.map((el) => Math.round(el.getBoundingClientRect().width)),
    );
    expect(colsAfter).toEqual(colsBefore);
    // 星级切换不触发定位描述重渲染（Hero 内文本保持）
    await expect(page.locator('.nk-crole-hero__role')).toHaveText(roleText);
    expect(splitKnownOverflow(await findHorizontalOverflow(page)).unknown).toEqual([]);
    assertNoErrors();
  });
});

/* ─── 技能族层级（ADR 0022）取证工具 ───
   期望文案一律从 characters/*.json 读（族成员 id 原序 → 名），不在断言里写死页面文案；
   族 id 原序与 src/lib/skill-family.ts 同口径（取锚点首个非空 level_up_skill_id 级）。 */
function charFamilyIds(charId: string, anchor: string): number[] {
  const d = JSON.parse(readFileSync(`public/data/cn/characters/${charId}.json`, 'utf8')) as {
    skill_trees: Record<string, Record<string, { level_up_skill_id?: number[] }>>;
  };
  for (const node of Object.values(d.skill_trees[anchor] || {})) {
    if (node.level_up_skill_id?.length) return node.level_up_skill_id;
  }
  throw new Error(`characters/${charId}.json 锚点 ${anchor} 无 level_up_skill_id`);
}

function charSkillNames(charId: string, ids: number[]): string[] {
  const d = JSON.parse(readFileSync(`public/data/cn/characters/${charId}.json`, 'utf8')) as {
    skills: Record<string, { name: string }>;
  };
  return ids.map((id) => d.skills[String(id)].name);
}

/**
 * 层级线竖轨的页面 x。三种宿主都必须支持：
 * - 子卡自身（竖轨在 `.nk-skill--child::before`，left 用负偏移抵消行缩进）；
 * - 父卡（竖轨在其 `.nk-skill__body::before`）；
 * - 直接传 `.nk-skill__body`。
 * left 是相对宿主 padding box 的值，故必须 host.rect.left + left 换算成页面 x 后比较（父/子宿主不同，不可直接比数值）。
 */
async function skillRailX(host: Locator): Promise<number> {
  return host.evaluate((el) => {
    const node = el.classList.contains('nk-skill--child') || el.classList.contains('nk-skill__body')
      ? el
      : el.querySelector(':scope > .nk-skill__body')!;
    const left = parseFloat(getComputedStyle(node, '::before').left) || 0;
    return node.getBoundingClientRect().left + left;
  });
}

interface PseudoBox {
  top: number;
  height: number;
  /** 伪元素左端页面 x（宿主 rect.left + 计算 left；宿主与伪元素均无横向边框） */
  left: number;
  width: number;
  /** 伪元素右端页面 x（left + 计算 width） */
  rightX: number;
  /** 伪元素顶边页面 y（宿主 rect.top + 计算 top） */
  topY: number;
  /** 伪元素底边页面 y（宿主 rect.top + 计算 top + 计算 height） */
  bottomY: number;
  borderLeftWidth: string;
  borderLeftColor: string;
  borderTopWidth: string;
  borderTopStyle: string;
  content: string;
}

async function pseudoBox(loc: Locator, pseudo: '::before' | '::after'): Promise<PseudoBox> {
  return loc.evaluate((el, p) => {
    const cs = getComputedStyle(el, p);
    const r = el.getBoundingClientRect();
    const hostCs = getComputedStyle(el);
    // 绝对定位伪元素的包含块是宿主 padding box 的**外缘**（= border box + border 宽度）——
    // 宿主的 padding 不属于偏移量。曾误按「padding box 内缘」加 paddingTop 换算，整套坐标被抬低
    // 一个 child-gap，掩盖了「折角必须落在子图标中线」的公式错误（见 docs/memory/2026-09.md「包含块原点实测」）。
    const bt = parseFloat(hostCs.borderTopWidth) || 0;
    const bl = parseFloat(hostCs.borderLeftWidth) || 0;
    const top = parseFloat(cs.top) || 0;
    const height = parseFloat(cs.height) || 0;
    const left = parseFloat(cs.left) || 0;
    const width = parseFloat(cs.width) || 0;
    return {
      top,
      height,
      left: r.left + bl + left,
      width,
      rightX: r.left + bl + left + width,
      topY: r.top + bt + top,
      bottomY: r.top + bt + top + height,
      borderLeftWidth: cs.borderLeftWidth,
      borderLeftColor: cs.borderLeftColor,
      borderTopWidth: cs.borderTopWidth,
      borderTopStyle: cs.borderTopStyle,
      content: cs.content,
    };
  }, pseudo);
}

/** 技能数据表盒 vs 卡片内容区（左/右缘）——用于断言「表格不侵入图标列、不产生卡片级横向溢出」 */
async function tableBoxWithinCard(card: Locator): Promise<{
  left: number;
  right: number;
  contentLeft: number;
  contentRight: number;
}> {
  return card.evaluate((el) => {
    const wrap = el.querySelector(':scope > .nk-skill__body > .nk-skill__table-wrap')!;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const w = wrap.getBoundingClientRect();
    return {
      left: w.left,
      right: w.right,
      contentLeft: r.left + (parseFloat(cs.paddingLeft) || 0),
      contentRight: r.right - (parseFloat(cs.paddingRight) || 0),
    };
  });
}

/**
 * 技能区横向溢出（与 helpers.ts findHorizontalOverflow 同判据，但限定 `[data-panel="skills"]` 子树）。
 * **为何不直接对整页断言**：角色详情页 Hero 的 `canvas.spine-player-canvas` 实测恒越出视口
 * （1212/1503/1509 实测 1280 宽下 right=1289、375 宽下 left=-28 right=403；`.nk-hero__visual { overflow-x: hidden }`
 * 把它裁掉，故 documentElement.scrollWidth 不越界），属 Hero/spine 域的既有条件，与本轮技能层级改动无关；
 * 整页断言会把无关缺陷算进技能区用例。此处只对技能区子树取证。
 */
async function skillsPanelOverflow(page: import('@playwright/test').Page): Promise<string[]> {
  return page.evaluate(() => {
    const root = document.querySelector('[data-panel="skills"]');
    if (!root) return ['[data-panel="skills"] 缺失'];
    const vw = window.innerWidth;
    const bad: string[] = [];
    const inScrollable = (el: Element): boolean => {
      let cur = el.parentElement;
      while (cur && cur !== root.parentElement) {
        const o = getComputedStyle(cur).overflowX;
        if (o === 'auto' || o === 'scroll') return true;
        cur = cur.parentElement;
      }
      return false;
    };
    root.querySelectorAll('*').forEach((el) => {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') return;
      const r = el.getBoundingClientRect();
      if (r.right > vw + 1 || r.left < -1) {
        if (cs.position !== 'fixed' && !inScrollable(el)) {
          bad.push(
            `${el.tagName.toLowerCase()}${el.className ? '.' + String(el.className).trim().split(/\s+/).slice(0, 2).join('.') : ''} right=${Math.round(r.right)} left=${Math.round(r.left)}`,
          );
        }
      }
    });
    return bad.slice(0, 20);
  });
}

test.describe('布局验收：角色详情页', () => {
  test('/character/1001：hero、概览面板、无溢出', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/character/1001');
    // CharHero 渲染（数据流最复杂的高频路径，P1-3）
    await expect(page.locator('.nk-hero--char')).toBeVisible();
    await expect(page.locator('.nk-hero__archive')).toContainText('1001');
    // 概览面板结构出现（PROFILE / TALENTS 等区块）
    await expect(page.locator('.nk-profile, .nk-title').first()).toBeVisible();
    expect(splitKnownOverflow(await findHorizontalOverflow(page)).unknown).toEqual([]);
    assertNoErrors();
  });

  test('/character/1001：技能卡折叠开关为可点外观（浅底 + 发丝描边 + 6px 圆角）且文案成对', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/character/1001');
    const toggles = page.locator('.nk-skill__toggle');
    // 1001 三类开关齐备：强化来源（3 技能有 rated_rank_id）/ 技能预览 / 技能数据
    await expect(toggles.first()).toBeVisible();
    // 技能预览随 animDb 异步就绪后挂载，用轮询而非一次性计数
    await expect.poll(() => toggles.count()).toBeGreaterThanOrEqual(3);
    // 可点外观：非裸文字——有描边、有圆角、有非全透明底色（回归「看起来不像按钮」）
    await expect(toggles.first()).toHaveCSS('border-top-style', 'solid');
    await expect(toggles.first()).toHaveCSS('border-top-width', '1px');
    await expect(toggles.first()).toHaveCSS('border-top-left-radius', '6px');
    const bg = await toggles.first().evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bg).not.toBe('rgba(0, 0, 0, 0)');
    // 热区 ≥44px：视觉高约 32px + ::after 上下各 8px（无障碍硬标准）
    const hot = await toggles.first().evaluate((el) => {
      const a = getComputedStyle(el, '::after');
      return { content: a.content, top: a.top, bottom: a.bottom };
    });
    expect(hot).toEqual({ content: '""', top: '-8px', bottom: '-8px' });
    // 文案成对：展开态 = 收起 + 原名（三处统一，不得回退为「收起数据」）
    await expect(page.getByRole('button', { name: '强化来源' }).first()).toHaveAttribute('aria-expanded', 'false');
    const dataBtn = page.getByRole('button', { name: '技能数据' }).first();
    const closed = await dataBtn.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { color: cs.color, border: cs.borderTopColor };
    });
    await dataBtn.click();
    const openedBtn = page.getByRole('button', { name: '收起技能数据' }).first();
    await expect(openedBtn).toHaveAttribute('aria-expanded', 'true');
    // 展开态换色换描边（状态可见，非仅箭头旋转）
    const opened = await openedBtn.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { color: cs.color, border: cs.borderTopColor };
    });
    expect(opened).not.toEqual(closed);
    const animBtn = page.getByRole('button', { name: '技能预览' }).first();
    await animBtn.click();
    await expect(page.getByRole('button', { name: '收起技能预览' }).first()).toHaveAttribute('aria-expanded', 'true');
    const linksBtn = page.getByRole('button', { name: '强化来源' }).first();
    await linksBtn.click();
    await expect(page.getByRole('button', { name: '收起强化来源' }).first()).toHaveAttribute('aria-expanded', 'true');
    expect(splitKnownOverflow(await findHorizontalOverflow(page)).unknown).toEqual([]);
    assertNoErrors();
  });

  test('/character/1001 手机断点：配队标头渲染、队间距 16px、无溢出', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/character/1001'); // 1001 有 2 队（多队才渲染标头）
    const heads = page.locator('.nk-build__team-head');
    await expect(heads).toHaveCount(2);
    await expect(heads.first()).toContainText('配队 01');
    await expect(heads.last()).toContainText('配队 02');
    await expect(heads.last()).toContainText('/ 02');
    // 队间 gap = 16px（手机断点覆盖全局 12px）
    const gap = await page.locator('.nk-build__teams').evaluate(
      (el) => parseFloat(getComputedStyle(el).rowGap),
    );
    expect(gap).toBe(16);
    expect(splitKnownOverflow(await findHorizontalOverflow(page)).unknown).toEqual([]);
    assertNoErrors();
  });

  /* ─── 技能族层级 + 图标列折角线（ADR 0022）：真珠 1503 Point01 族 = 150301 + 150308/150310 ─── */

  test('/character/1503：族内首个为父卡（行笔，临摹断水）+ 2 子卡，子卡缩进一个图标空间、竖轨共线、折角接子图标中线', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/character/1503');
    const firstCard = page.locator('[data-panel="skills"] > .nk-skill').first();
    await expect(firstCard.locator('.nk-skill__name').first()).toHaveText('行笔，临摹断水');

    // 族内首个 = 基座技能 = 父卡，其余两条 = 形态技能 = 子卡（禁止 SkillList 顺序判父子）
    const children = firstCard.locator('.nk-skill--child');
    await expect(children).toHaveCount(2);
    await expect(children.locator('.nk-skill__name')).toHaveText(['行笔，幻造星月', '行笔，绘制末浪']);

    // 令牌：缩进 = 一个技能图标空间（= rail = 图标边长）、间距 = 半个图标空间，均由 rail 派生（不得有独立断点值）
    const tokens = await page.locator('.nk-char-page').evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        rail: cs.getPropertyValue('--nk-skill-rail').trim(),
        gutter: cs.getPropertyValue('--nk-skill-gutter').trim(),
        indent: cs.getPropertyValue('--nk-skill-child-indent').trim(),
        gap: cs.getPropertyValue('--nk-skill-child-gap').trim(),
      };
    });
    expect(tokens).toEqual({ rail: '48px', gutter: '0px', indent: '48px', gap: 'calc(48px / 2)' });
    const indent = parseFloat(tokens.indent);

    // 图标列：子卡整行右移恰好一个图标空间 → 子图标左缘 = 父图标右缘（±1px），两子卡彼此同列
    const iconBox = async (loc: Locator) =>
      loc.locator('.nk-skill__icon').first().evaluate((el) => {
        const r = el.getBoundingClientRect();
        return { left: r.left, right: r.right };
      });
    const parentIcon = await iconBox(firstCard);
    const childIcons = await children.locator('.nk-skill__icon').evaluateAll((els) =>
      els.map((el) => {
        const r = el.getBoundingClientRect();
        return { left: r.left, right: r.right };
      }),
    );
    expect(childIcons).toHaveLength(2);
    for (const box of childIcons) {
      expect(Math.abs(box.left - (parentIcon.left + indent)), '缩进应等于一个图标空间').toBeLessThanOrEqual(1);
      expect(Math.abs(box.left - parentIcon.right), '子图标左缘 = 父图标右缘').toBeLessThanOrEqual(1);
    }
    expect(Math.abs(childIcons[0].left - childIcons[1].left)).toBeLessThanOrEqual(1);

    // 左轴唯一：图标左缘必须与卡头领起元素（类型竖条）落在同一条轴上 = 卡片内容轴。
    // --nk-skill-gutter 一旦非 0 就把图标推出该轴，卡内出现第二条左轴 + 一段无承载物空档（用户报障项）。
    const dotLeft = await firstCard
      .locator('.nk-skill__type-dot')
      .first()
      .evaluate((el) => el.getBoundingClientRect().left);
    expect(Math.abs(parentIcon.left - dotLeft), '图标左缘 = 卡头左轴（gutter 必须为 0）').toBeLessThanOrEqual(1);

    // 竖轨共线：子卡竖轨 x 必须与父卡竖轨相等（父卡在 .nk-skill__body::before、子卡在卡片自身），
    // 且竖轨落点 = 父图标底边水平中点（x = 图标列左缘 + gutter + rail/2）
    const parentRailX = await skillRailX(firstCard);
    expect(Math.abs(parentRailX - (parentIcon.left + parentIcon.right) / 2), '竖轨 = 父图标中线').toBeLessThanOrEqual(1);
    for (let i = 0; i < 2; i++) {
      const childRailX = await skillRailX(children.nth(i));
      expect(Math.abs(childRailX - parentRailX), `第 ${i + 1} 张子卡竖轨应与父卡共线`).toBeLessThanOrEqual(1);
    }

    // └ 收口标记只挂在最后一张子卡上（DOM 序末位）
    expect(
      await children.evaluateAll((els) => els.map((el) => el.classList.contains('nk-skill--child-last'))),
    ).toEqual([false, true]);

    // 旧虚线语言退场：子卡上沿无边框（兄弟边界只由折角线与间距表达）
    await expect(children.first()).toHaveCSS('border-top-style', 'none');

    // 竖轨（::before）= --line-2 1px；折角（::after）= 1px 上边框
    const rail = await pseudoBox(children.first(), '::before');
    expect(rail.borderLeftWidth).toBe('1px');
    expect(rail.borderLeftColor).toBe('rgba(255, 255, 255, 0.13)');
    const corner = await pseudoBox(children.first(), '::after');
    expect(corner.borderTopWidth).toBe('1px');
    expect(corner.borderTopStyle).toBe('solid');

    // 折角：横段 = 半个图标空间（桌面 24px）→ 右端 x 恰为子卡图标左缘；y 恰为子卡图标中线
    // （包含块原点是卡顶，故 y = 卡顶 + child-gap + rail/2；pseudoBox 不得再加宿主 padding 换算，否则折角错位也会假通过）
    expect(corner.width).toBe(24);
    expect(Math.abs(corner.rightX - childIcons[0].left)).toBeLessThanOrEqual(1);
    const iconCenterY = async (loc: Locator) =>
      loc.locator('.nk-skill__icon').first().evaluate((el) => {
        const r = el.getBoundingClientRect();
        return (r.top + r.bottom) / 2;
      });
    expect(Math.abs(corner.topY - (await iconCenterY(children.first()))), '折角 y = 子图标中线').toBeLessThanOrEqual(1);

    // 竖轨跨行不断：子轨上端顶到卡顶（= 包含块原点）、非末位下延越过本卡底部；
    // 且父卡体底 = 首子卡卡顶、兄弟卡底 = 下一张卡顶（接缝 = 0）
    const midRail = await pseudoBox(children.first(), '::before');
    const cardBox = async (i: number) =>
      children.nth(i).evaluate((el) => {
        const r = el.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom };
      });
    const [child0Box, child1Box] = [await cardBox(0), await cardBox(1)];
    const bodyBottom = await firstCard
      .locator('.nk-skill__body')
      .first()
      .evaluate((el) => el.getBoundingClientRect().bottom);
    expect(Math.abs(midRail.topY - child0Box.top), '子轨上端应顶到卡顶').toBeLessThanOrEqual(1);
    expect(midRail.bottomY).toBeGreaterThanOrEqual(child0Box.bottom - 1);
    expect(Math.abs(child0Box.top - bodyBottom), '父卡体底 = 首子卡卡顶（零缝）').toBeLessThanOrEqual(1);
    expect(Math.abs(child1Box.top - child0Box.bottom), '兄弟卡之间零缝').toBeLessThanOrEqual(1);
    // 末位子卡（└）竖轨止于本卡图标中线，折角横段与 ├ 同长
    const lastRail = await pseudoBox(children.last(), '::before');
    expect(lastRail.bottomY, '└ 竖轨止于子图标中线').toBeLessThanOrEqual((await iconCenterY(children.last())) + 1);
    expect(lastRail.width).toBe(24);

    expect(splitKnownOverflow(await skillsPanelOverflow(page)).unknown).toEqual([]);
    assertNoErrors();
  });

  test('/character/1503 手机断点 375×812：图标列退场、正文单列全宽、子卡虚线分区 + 12px 缩进（ADR 0023）', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/character/1503');
    const firstCard = page.locator('[data-panel="skills"] > .nk-skill').first();
    await expect(firstCard).toBeVisible();
    await expect(page.locator('.nk-skill--child').first()).toBeVisible();
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(376);

    // 缩进/间距令牌：缩进 12px（4px 栅格档位），间距仍由 rail 派生
    const vars = await page.locator('.nk-char-page').evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        rail: cs.getPropertyValue('--nk-skill-rail').trim(),
        gutter: cs.getPropertyValue('--nk-skill-gutter').trim(),
        indent: cs.getPropertyValue('--nk-skill-child-indent').trim(),
        gap: cs.getPropertyValue('--nk-skill-child-gap').trim(),
      };
    });
    expect(vars).toEqual({ rail: '44px', gutter: '0px', indent: '12px', gap: 'calc(44px / 2)' });

    // 图标内联：手机断点图标列不渲染，图标换宿主进标题行（与标题同一行、同起左缘）。
    // 判据必须含**竖向重叠**——只比左缘时「图标堆在标题行上方」也成立（本轮实测盲区：+44px/卡）。
    await expect(firstCard.locator('.nk-skill__rail')).toHaveCount(0);
    const iconInRow = await firstCard.evaluate((el) => {
      const row = el.querySelector(':scope > .nk-skill__body > .nk-skill__content > .nk-skill__title-row')!;
      const icon = row.querySelector('.nk-skill__icon')!;
      const name = row.querySelector('.nk-skill__name')!;
      const r = row.getBoundingClientRect();
      const i = icon.getBoundingClientRect();
      return {
        iconParentIsRow: icon.parentElement === row,
        iconTop: i.top,
        iconLeft: i.left,
        rowTop: r.top,
        rowLeft: r.left,
        nameTop: name.getBoundingClientRect().top,
      };
    });
    expect(iconInRow.iconParentIsRow).toBe(true);
    expect(Math.abs(iconInRow.iconTop - iconInRow.rowTop), '图标应与标题行同起（不得堆在其上方）').toBeLessThanOrEqual(1);
    expect(Math.abs(iconInRow.iconLeft - iconInRow.rowLeft), '图标内联后应与标题行同起').toBeLessThanOrEqual(1);

    // 正文单列全宽：卡片体不再是网格（图标换宿主后 body 只剩内容列），内容列 = 卡内容宽
    const body = await firstCard.evaluate((el) => {
      const node = el.querySelector(':scope > .nk-skill__body')!;
      const content = node.querySelector(':scope > .nk-skill__content')!;
      const cs = getComputedStyle(el);
      return {
        display: getComputedStyle(node).display,
        contentWidth: content.getBoundingClientRect().width,
        cardContentWidth: el.getBoundingClientRect().width - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0),
      };
    });
    expect(body.display).toBe('block');
    expect(Math.abs(body.contentWidth - body.cardContentWidth), `内容列 ${body.contentWidth} vs 卡内容宽 ${body.cardContentWidth}`).toBeLessThanOrEqual(1);

    // 虚线分区：子卡上沿 1px dashed --line-2；父卡与单卡不加线
    const children = firstCard.locator('.nk-skill--child');
    await expect(children.first()).toHaveCSS('border-top-style', 'dashed');
    await expect(children.first()).toHaveCSS('border-top-width', '1px');
    await expect(children.first()).toHaveCSS('border-top-color', 'rgba(255, 255, 255, 0.13)');
    await expect(firstCard).toHaveCSS('border-top-style', 'none');
    const monoCard = page.locator('[data-panel="skills"] > .nk-skill:not(:has(.nk-skill--child))').first();
    if (await monoCard.count()) await expect(monoCard).toHaveCSS('border-top-style', 'none');

    /* 虚线上下留白等距（用户报「分割虚线上方没有留空隙」）：线上方 = 线之前最后一个可见元素
       的底边到线；线下方 = 子卡 padding-top（半个图标空间）。父卡内容体必须留下等量余量，
       仅靠 padding-top 会让线上方只剩余量（实测 9px）而看着贴住上文。 */
    const dash = await firstCard.evaluate((card) => {
      const child = card.querySelector(':scope > .nk-skill--child')!;
      const lineY = child.getBoundingClientRect().top;
      let lastBottom = card.getBoundingClientRect().top;
      // DOM 序取「线之前」的最后一个可见元素：文档序保证它就是最近的上方内容
      for (const el of card.querySelectorAll('*')) {
        if (el === child || el.contains(child)) continue;
        const r = el.getBoundingClientRect();
        if (r.height > 0 && r.width > 0 && getComputedStyle(el).visibility !== 'hidden' && r.bottom <= lineY + 1) {
          lastBottom = r.bottom;
        }
      }
      return {
        above: +(lineY - lastBottom).toFixed(1),
        below: parseFloat(getComputedStyle(child).paddingTop),
      };
    });
    expect(dash.above, `虚线上方 ${dash.above} 应≈下方 ${dash.below}（±2px）`).toBeGreaterThanOrEqual(dash.below - 2);

    // 折角线语言退场：三个宿主伪元素的 computed content 必须是 none。
    // 判据只用 content——Chrome 对「未被 content 生成的伪元素」在 getComputedStyle 上仍返回
    // 声明侧数值（实测 forced content:'' 才出现 353.125px 盒），拿 width/height 当判据会漏判。
    for (const [host, pseudo] of [
      [firstCard.locator('.nk-skill__body').first(), '::before'],
      [children.first(), '::before'],
      [children.first(), '::after'],
    ] as const) {
      const content = await host.evaluate((el, p) => getComputedStyle(el, p).content, pseudo);
      expect(content, `${pseudo} 应被 content: none 抑制`).toBe('none');
    }

    // 左轴唯一：图标左缘 = 卡内容左缘 = 卡头类型竖条左轴
    const axis = await firstCard.evaluate((el) => {
      const icon = el.querySelector('.nk-skill__icon')!;
      const dot = el.querySelector(':scope > .nk-skill__head > .nk-skill__type-dot')!;
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        iconLeft: icon.getBoundingClientRect().left,
        dotLeft: dot.getBoundingClientRect().left,
        contentLeft: r.left + (parseFloat(cs.paddingLeft) || 0),
      };
    });
    expect(Math.abs(axis.iconLeft - axis.contentLeft), '图标左缘 = 卡内容左缘').toBeLessThanOrEqual(1);
    expect(Math.abs(axis.dotLeft - axis.contentLeft), '类型竖条左缘 = 卡内容左缘（左轴唯一）').toBeLessThanOrEqual(1);

    expect(splitKnownOverflow(await skillsPanelOverflow(page)).unknown).toEqual([]);
    assertNoErrors();
  });

  test('/character/1503：手机断点不再右移子卡（旧「缩进一个图标空间」只在 ≥768px 成立）', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    /** 子卡图标相对父卡图标的右移量（手机断点只差 12px 缩进） */
    const measure = async () => {
      const firstCard = page.locator('[data-panel="skills"] > .nk-skill').first();
      const parentLeft = await firstCard
        .locator('.nk-skill__icon')
        .first()
        .evaluate((el) => el.getBoundingClientRect().left);
      const childLeft = await firstCard
        .locator('.nk-skill--child .nk-skill__icon')
        .first()
        .evaluate((el) => el.getBoundingClientRect().left);
      const indent = await page
        .locator('.nk-char-page')
        .evaluate((el) => getComputedStyle(el).getPropertyValue('--nk-skill-child-indent').trim());
      return { delta: childLeft - parentLeft, indent };
    };

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/character/1503');
    await expect(page.locator('.nk-skill--child').first()).toBeVisible();
    const wide = await measure();
    expect(wide.indent).toBe('48px');
    expect(Math.abs(wide.delta - 48), `桌面实测右移 ${wide.delta.toFixed(1)}px`).toBeLessThanOrEqual(1);
    expect(Math.abs(wide.delta - parseFloat(wide.indent))).toBeLessThanOrEqual(1);

    await page.setViewportSize({ width: 375, height: 812 });
    await expect.poll(async () => (await measure()).indent).toBe('12px');
    const narrow = await measure();
    expect(Math.abs(narrow.delta - 12), `375 实测右移 ${narrow.delta.toFixed(1)}px`).toBeLessThanOrEqual(1);
    expect(Math.abs(narrow.delta - parseFloat(narrow.indent))).toBeLessThanOrEqual(1);
    expect(splitKnownOverflow(await skillsPanelOverflow(page)).unknown).toEqual([]);
    assertNoErrors();
  });

  test('/character/1212：战技族父节点以族序为准（父卡「无罅飞光」；SkillList 首位的「寒川映月」降为子卡）', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/character/1212');
    const topCards = page.locator('[data-panel="skills"] > .nk-skill');
    const bp = topCards.filter({ has: page.locator('[data-type="BPSkill"]') });
    await expect(bp).toHaveCount(1);
    await expect(bp.locator('.nk-skill__name').first()).toHaveText('无罅飞光');
    await expect(bp.locator('.nk-skill--child')).toHaveCount(1);
    await expect(bp.locator('.nk-skill--child .nk-skill__name')).toHaveText(['寒川映月']);
    // 形态不得同时充当平级卡的基座
    const topNames = await topCards.evaluateAll((els) =>
      els.map((el) => el.querySelector('.nk-skill__name')!.textContent!.trim()),
    );
    expect(topNames).toContain('无罅飞光');
    expect(topNames).not.toContain('寒川映月');
    assertNoErrors();
  });

  test('/character/1509：天赋族不再拆成两张平级卡（150904 之下挂 150905）', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    const ids = charFamilyIds('1509', 'Point04');
    expect(ids).toEqual([150904, 150905]);
    const [parentName, childName] = charSkillNames('1509', ids);
    await page.goto('/character/1509');
    const topCards = page.locator('[data-panel="skills"] > .nk-skill');
    const parent = topCards.filter({ hasText: parentName });
    await expect(parent).toHaveCount(1);
    await expect(parent.locator('.nk-skill__name').first()).toHaveText(parentName);
    await expect(parent.locator('.nk-skill--child')).toHaveCount(1);
    await expect(parent.locator('.nk-skill--child .nk-skill__name')).toHaveText([childName]);
    const topNames = await topCards.evaluateAll((els) =>
      els.map((el) => el.querySelector('.nk-skill__name')!.textContent!.trim()),
    );
    expect(topNames).toContain(parentName);
    expect(topNames).not.toContain(childName);
    assertNoErrors();
  });

  test('/character/1510：4 成员族（天赋 151004 + 3 条助战技）= 1 父卡 + 恰 3 子卡，子卡名按族序', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    const ids = charFamilyIds('1510', 'Point04');
    expect(ids).toEqual([151004, 151022, 151025, 151026]);
    const names = charSkillNames('1510', ids);
    await page.goto('/character/1510');
    // 数据侧 type=Assist 的三条助战技与 type=Passive 的天赋同族；选父卡用 data-type（唯一顶层 Passive 卡）
    const parent = page.locator('[data-panel="skills"] > .nk-skill[data-type="Passive"]');
    await expect(parent).toHaveCount(1);
    await expect(parent.locator('.nk-skill__name').first()).toHaveText(names[0]);
    await expect(parent.locator('.nk-skill--child')).toHaveCount(3);
    const domNames = await parent.locator('.nk-skill--child').evaluateAll((els) =>
      els.map((el) => el.querySelector('.nk-skill__name')!.textContent!.trim()),
    );
    expect(domNames).toEqual(names.slice(1));
    assertNoErrors();
  });

  /* 技能图标 CDN 契约：主源 404 时必须靠 data-cdn-fallback 换 jsDelivr（强化模式的 1{charId}
     伪目录名在 nanoka 缺失——镜流 1212 是实例）；两源皆失败才允许出现占位图形。 */
  test('/character/1212：强化技能图标（nanoka 404 名）必须经回退源加载成功，不得出现占位', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/character/1212');
    const icons = page.locator('[data-panel="skills"] .nk-skill__icon');
    await expect(icons.first()).toBeVisible();
    await expect.poll(() => icons.count()).toBeGreaterThanOrEqual(5);
    // 回退属性必须绑上（这条先于占位生效，否则本来能加载的资产会被占位盖住）
    await expect(icons.first()).toHaveAttribute('data-cdn-fallback', /cdn\.jsdelivr\.net\/.*skillicons\/avatar\//);
    const states = await icons.evaluateAll((els) => els.map((el) => ({
      complete: (el as HTMLImageElement).complete,
      w: (el as HTMLImageElement).naturalWidth,
      down: (el as HTMLImageElement).hasAttribute('data-cdn-down'),
      ph: (el as HTMLImageElement).hasAttribute('data-cdn-placeholder'),
      src: (el as HTMLImageElement).currentSrc,
    })));
    for (const s of states) {
      expect(s.ph, `占位不应出现（src=${s.src}）`).toBe(false);
      expect(s.w, `图标应加载出位图（complete=${s.complete} src=${s.src}）`).toBeGreaterThan(0);
    }
    assertNoErrors();
  });

  test('/character/1212：两源皆 404 时显示占位图形（naturalWidth>0）', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.route('**/assets/hsr/skillicons/**', (route) => route.fulfill({ status: 404, body: '' }));
    await page.route('**/cdn.jsdelivr.net/**skillicons/**', (route) => route.fulfill({ status: 404, body: '' }));
    await page.goto('/character/1212');
    const icon = page.locator('[data-panel="skills"] .nk-skill__icon').first();
    await expect(icon).toBeVisible();
    await expect.poll(async () => icon.getAttribute('data-cdn-placeholder'), { timeout: 15000 }).toBe('1');
    // 占位是内联 SVG data URI：naturalWidth>0 才是「真画出来了」的最强信号（降级留白时为 0）
    const state = await icon.evaluate((el) => ({
      src: el.getAttribute('src') || '',
      w: (el as HTMLImageElement).naturalWidth,
      box: el.getBoundingClientRect().width,
      visibility: getComputedStyle(el).visibility,
    }));
    expect(state.src.startsWith('data:image/svg+xml,')).toBe(true);
    expect(state.w).toBeGreaterThan(0);
    expect(state.box).toBeGreaterThan(0);
    expect(state.visibility).toBe('visible');
    assertNoErrors();
  });

  test('/lightcone/首个 id：光锥技能卡不受技能族改动波及（标题行图标在，无图标列）', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    const cones = JSON.parse(readFileSync('public/data/cn/light_cones.json', 'utf8')) as Record<
      string,
      { id: number }
    >;
    const lcId = Object.values(cones)[0].id;
    await page.goto(`/lightcone/${lcId}`);
    const icon = page.locator('.nk-lc-skill .nk-skill__title-row .nk-skill__icon');
    await expect(icon).toHaveCount(1);
    await expect(icon).toBeVisible();
    // 光锥详情页复用 .nk-skill* 但走标题行内联图标，不得出现角色详情的图标列 / 层级线宿主
    await expect(page.locator('.nk-skill__rail')).toHaveCount(0);
    assertNoErrors();
  });

  // 竖轨几何只在 ≥768px 存在，故本用例钉桌面视口（否则 mobile-chromium project 会跑到无竖轨的断点上）
  test('/character/1503：展开技能数据表后，竖轨与表盒（含首列）不相交、表盒不出卡片内容区', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/character/1503');
    const card = page.locator('[data-panel="skills"] > .nk-skill').first();
    const indent = await page
      .locator('.nk-char-page')
      .evaluate((el) => parseFloat(getComputedStyle(el).getPropertyValue('--nk-skill-child-indent')));
    const wrapLeft: Record<string, number> = {};

    for (const target of ['父卡', '首张子卡'] as const) {
      const host = target === '父卡' ? card : card.locator('.nk-skill--child').first();
      const wrap = host.locator(':scope > .nk-skill__body > .nk-skill__table-wrap');
      await wrap.getByRole('button', { name: '技能数据' }).click();
      await expect(wrap.locator('.nk-table tbody tr').first()).toBeVisible();

      const railX = await skillRailX(host);
      const box = await tableBoxWithinCard(host);
      wrapLeft[target] = box.left;
      // 缺陷史：修复前数据表跨两列，竖轨横跨表盒、首列「#/Lv.N」文字左缘恰等于竖轨 x
      expect(railX + 8, `${target} 竖轨 x=${railX.toFixed(1)} 必须让开表盒左缘 ${box.left.toFixed(1)}`).toBeLessThan(box.left);
      const firstColLeft = await wrap
        .locator('.nk-table tbody td:first-child')
        .first()
        .evaluate((el) => el.getBoundingClientRect().left);
      expect(railX + 8, `${target} 首列左缘 ${firstColLeft.toFixed(1)}`).toBeLessThan(firstColLeft);
      // 卡片级横向溢出：表盒必须完整落在卡片内容区（表格自身溢出由 .nk-table-inner overflow-x 承担，不在此列）
      expect(box.left, `${target} 表盒左缘出内容区`).toBeGreaterThanOrEqual(box.contentLeft - 1);
      expect(box.right, `${target} 表盒右缘出内容区`).toBeLessThanOrEqual(box.contentRight + 1);
    }

    // 子卡表格随行缩进右移：子卡表盒左缘 = 父卡表盒左缘 + indent（±1px），不再左对齐
    expect(
      Math.abs(wrapLeft['首张子卡'] - wrapLeft['父卡'] - indent),
      `子卡表盒左移量 ${(wrapLeft['首张子卡'] - wrapLeft['父卡']).toFixed(1)}px，indent=${indent}px`,
    ).toBeLessThanOrEqual(1);

    expect(splitKnownOverflow(await skillsPanelOverflow(page)).unknown).toEqual([]);
    assertNoErrors();
  });
});

test.describe('布局验收：贪饕污染专题页（ADR 0025）', () => {
  test('/voracity：H1、八区块、怪物内链、侧栏前缀性、无溢出', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/voracity');
    await expect(page.locator('.nk-vor-hero__title')).toHaveText('贪饕污染');
    // 区块数与首末区块（分区顺序 = 信息层级；数据决定的中段区块不逐个写死）
    const secnav = page.locator('.nk-vor-secnav .nk-secnav__btn');
    await expect(secnav).toHaveCount(8);
    await expect(secnav.first()).toContainText('玩法概览');
    await expect(secnav.last()).toContainText('同形词说明');
    await expect(page.locator('#vor-affixes .nk-vor-affix')).toHaveCount(3);
    // 波及关卡的怪物项必须内链到敌人详情（detail_id 非空口径）
    await expect.poll(() => page.locator('.nk-vor-mon__name--link').count()).toBeGreaterThan(0);
    expect(
      await page.locator('.nk-vor-mon__name--link').evaluateAll((els) =>
        els.every((el) => /^\/monster\/\d+$/.test(el.getAttribute('href') || '')),
      ),
    ).toBe(true);
    // 关卡 → 所属终局赛季的闭环（ADR 0026）：14 个污染关卡里 13 个有已发布赛季归属
    // （420533/420534 同属未发布赛季 3022 的那一份按判据省略），每关至少 1 条可达链接
    const scopeHrefs = await page.locator('.nk-vor-scope').evaluateAll((els) =>
      els.map((el) => el.getAttribute('href') || ''),
    );
    expect(scopeHrefs.length).toBeGreaterThanOrEqual(13);
    expect(scopeHrefs.every((h) => /^\/endgame\/(maze|story|boss|peak)\/\d+$/.test(h))).toBe(true);
    expect(scopeHrefs).toContain('/endgame/boss/3020');
    await expect(page.locator('.nk-vor-stgroup__badge').first()).toContainText('污染等级');
    // 侧栏：本页为内容板块，锚点可见性仍是规范序前缀（不写死项数）
    const anchors = await collectNavAnchors(page);
    expect(anchors.length).toBeGreaterThan(1);
    const visIdx = anchors.map((a, i) => (a.visible ? i : -1)).filter((i) => i >= 0);
    expect(visIdx).toEqual(Array.from({ length: visIdx.length }, (_, i) => i));
    // 当前板块在侧栏内处于激活态（导航第 8 项入口可达）
    await expect(page.locator('.ui-sidebar a[href="/voracity"]')).toHaveCount(1);
    expect(splitKnownOverflow(await findHorizontalOverflow(page)).unknown).toEqual([]);
    assertNoErrors();
  });
});
