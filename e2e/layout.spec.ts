import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { collectConsoleIssues, findHorizontalOverflow, splitKnownOverflow, waitForCatalogCards } from './helpers';

/**
 * 布局验收（AGENTS.md T1b/T2 的自动化落地）
 *
 * 覆盖四类关键页面：
 * - /          常规枢纽页（hero + 导航行；meta.bareNav → 全断点无导航条）
 * - /character 目录页（虚拟滚动网格，卡片模板字符串渲染）
 * - /endgame   终局合并单页
 * - /currency  货币战争枢纽页（meta.cw → <html data-theme="cw"> 主题，同 meta.bareNav）
 * - /currency/settings  货币战争设置（CW 主题色选择 → <html data-cw-accent>）
 *
 * 每页统一断言：无未捕获 JS 异常 + 无横向溢出 + 关键结构存在。
 * 侧栏结构用例（折叠 / 调试台入口）一律落在非枢纽页——枢纽页按设计全断点不渲染导航条。
 *
 * **`@viewport-pinned` 标签（禁止随意增删）**：凡用例内自行 `page.setViewportSize(...)` 固定视口者，
 * 必须在 `test(...)` 第二参传 `{ tag: '@viewport-pinned' }`。`mobile-chromium` project 以
 * `grepInvert` 跳过该类用例——其视口由用例自身钉死，在两个 project 下行为完全重复（纯耗时）。
 * **唯一例外**：「手机（<768px）：调试台入口隐藏」有意不打标签，作为 `isMobile` + `<meta name="viewport">`
 * 契约的哨兵（理由见该用例上方注释）。增删标签后必须核对：不带该标签的用例在 Pixel 7 视口下确实有意义。
 * 理由见 playwright.config.ts。
 */

test.describe('布局验收：常规主题', () => {
  test('首页 /：hero 标题、板块导航、无溢出', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/');
    await expect(page.locator('.nk-home-hero__title')).toBeVisible();
    // 站点名易变（更名进行中：咸鱼百科→星铁档案馆，后者未提交），不断言具体文案，只验非空
    await expect(page.locator('.nk-home-hero__title')).toHaveText(/\S/);
    // 板块导航行数量 = 配置的 indexGroups（≥4 个板块）
    const rowCount = await page.locator('.nk-home-row').count();
    expect(rowCount).toBeGreaterThanOrEqual(4);
    // 常规模式不得挂 cw 主题
    await expect(page.locator('html')).not.toHaveAttribute('data-theme', 'cw');
    // L3 溢出
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
    // 320px 常规模式 8 导航项放不下 → 至少折叠出"更多"入口
    await expect(page.locator('.ui-sidebar-more')).toBeVisible();
    const anchors = await collectNavAnchors(page);
    expect(anchors.length).toBeGreaterThan(1);
    // 前缀性质：可见锚点在 DOM 序中恒为前 k 个（不放乱序/交错）
    const visIdx = anchors.map((a, i) => (a.visible ? i : -1)).filter((i) => i >= 0);
    expect(visIdx).toEqual(Array.from({ length: visIdx.length }, (_, i) => i));
    // 有折叠（可见项 < 全量）→ 抽屉内容 = 隐藏尾部，顺序一致
    const foldedHrefs = anchors.filter((a) => !a.visible).map((a) => a.href);
    expect(foldedHrefs.length).toBeGreaterThan(0);
    await page.locator('.ui-sidebar-more').click();
    const drawerHrefs = await page.locator('.ui-more__item').evaluateAll((els) =>
      els.map((el) => el.getAttribute('href')),
    );
    expect(drawerHrefs).toEqual(foldedHrefs);
    // 320px 低于**最小声明断点 374**，属未声明支持区间。已知项（.nk-seg 手机宽被裁，登记于
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

test.describe('布局验收：枢纽页无侧栏', () => {
  test('桌面（1280px）：/ 与 /currency 不渲染侧栏，避让回退为 48px 页面留白', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 1280, height: 720 });

    await page.goto('/');
    await expect(page.locator('.nk-home-hero__title')).toBeVisible();
    await expect(page.locator('.ui-sidebar')).toHaveCount(0);
    await expect(page.locator('html')).toHaveAttribute('data-nav', 'bare');
    expect(await readContentOffset(page)).toBe(48);
    // 令牌真实生效：Hero 标题区左缘 = 页面留白，与自身右缘（48px）对称
    await expect(page.locator('.nk-home-hero__content')).toHaveCSS('padding-left', '48px');

    await page.goto('/currency');
    await expect(page.locator('.nk-cwhub-hero__title')).toBeVisible();
    await expect(page.locator('.ui-sidebar')).toHaveCount(0);
    await expect(page.locator('html')).toHaveAttribute('data-nav', 'bare');
    expect(await readContentOffset(page)).toBe(48);
    await expect(page.locator('.nk-cwhub-index')).toHaveCSS('padding-left', '48px');

    // 客户端路由切换（非整页加载）的主流程：从枢纽页进入板块后侧栏回归、data-nav 撤下
    // （App.vue 的 v-if 与 bareNav watcher 生效，令牌回到 148px 侧栏避让）
    // 行筛选必须用 href 而非 to：RouterLink 渲染的是 href（`:not([to="/"])` 在真实 DOM 里匹配不到任何元素、
    // 等于没过滤），返回行 `.nk-cwhub-index__row` 与板块行同类名，只靠 `.first()` 依赖行序。
    await page.locator('.nk-cwhub-index__row:not([href="/"])').first().click();
    // 落点断言（期望值取自 CW_NAV_ITEMS[0].path，勿凭直觉）：防「行序变化后点到返回行」却只因后续断言而失败
    await expect(page).toHaveURL(/\/currency\/role$/);
    await expect(page.locator('.ui-sidebar')).toBeVisible();
    await expect(page.locator('html')).not.toHaveAttribute('data-nav', 'bare');
    expect(await readContentOffset(page)).toBe(148);
    expect(splitKnownOverflow(await findHorizontalOverflow(page)).unknown).toEqual([]);
    assertNoErrors();
  });

  test('平板（800px）：/ 无侧栏，避让回退为 32px 页面留白', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 800, height: 900 });
    await page.goto('/');
    await expect(page.locator('.ui-sidebar')).toHaveCount(0);
    expect(await readContentOffset(page)).toBe(32);
    await expect(page.locator('.nk-home-nav')).toHaveCSS('padding-left', '32px');
    expect(splitKnownOverflow(await findHorizontalOverflow(page)).unknown).toEqual([]);
    assertNoErrors();
  });

  test('手机（390px）：枢纽页不渲染导航条（全断点无导航），无左侧避让', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/currency');
    // data-nav 恒挂（断点无关）；手机底部栏同样隐藏——枢纽页身份是「选路」，页内索引即导航
    await expect(page.locator('html')).toHaveAttribute('data-nav', 'bare');
    await expect(page.locator('.ui-sidebar')).toHaveCount(0);
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
    await expect(page.locator('html')).not.toHaveAttribute('data-nav', 'bare');
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
      // 桌面：右缘 40 + 枢纽页无侧栏回退的 48 左缘留白
      await expect(footer).toHaveCSS('padding-left', '48px');
      await expect(footer).toHaveCSS('padding-right', '40px');
      // 拉丁格言消费全站等宽令牌 --font-mono（令牌缺失会回退默认字体，视觉不易察觉）
      const font = await footer.locator('.nk-hub-footer__latin').evaluate(
        (el) => getComputedStyle(el).fontFamily,
      );
      expect(font).toContain('ui-monospace');
    }
    // 手机：枢纽页无导航条（全断点），页脚不再为旧底部栏预留 56px——
    // 仅 24px 呼吸 + safe-area（headless 无 safe-area，故恰好为 24）
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await expect(page.locator('.ui-sidebar')).toHaveCount(0);
    const padBottom = await page.locator('.nk-hub-footer').evaluate(
      (el) => parseFloat(getComputedStyle(el).paddingBottom),
    );
    expect(padBottom).toBeGreaterThanOrEqual(16);
    expect(padBottom).toBeLessThan(56);
    expect(splitKnownOverflow(await findHorizontalOverflow(page)).unknown).toEqual([]);
    assertNoErrors();
  });

  test('全站等宽令牌 --font-mono：单点声明 + 目录页消费（裸字面量回归防线）', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/character');
    await waitForCatalogCards(page);
    // 令牌缺失时 var(--font-mono) 会静默继承父级字体（视觉不易察觉），故同时锁声明点与一个消费方；
    // 全站裸字面量已收口为 0 处（收口裁定见 docs/memory/2026-09.md）
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
   * **本条有意不带 `@viewport-pinned`**：它是 mobile project 里唯一「便宜且宽度敏感」的哨兵——
   * `devices['Pixel 7']` 的 `isMobile: true` 使 `<meta name="viewport">`（index.html）参与布局；
   * 该标签一旦被删/改名，layout viewport 退回 980px，此处 `.ui-sidebar-debug` 由隐藏转可见（tokens.css 断点）
   * → 本条硬失败。其余 9 条留在 mobile project 的用例均不足以察觉该场景（它们对 980px 不敏感）。
   * 删除本条或在 playwright.config.ts 里把它一并排除，等于放弃 isMobile + meta viewport 契约的唯一防线。
   */
  test('手机（<768px）：调试台入口隐藏，导航折叠不受影响', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 390, height: 844 });
    // 必须落在非枢纽页：枢纽页（meta.bareNav）全断点不渲染导航条，折叠断言会退化为空断言
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
});

test.describe('布局验收：货币战争主题', () => {
  test('/currency：黑金主题挂载、导航齐全、无溢出', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/currency');
    // meta.cw → <html data-theme="cw">
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'cw');
    // CW Hub 导航（索引目录行，5 板块全部上线）
    await expect(page.locator('.nk-cwhub-hero__title')).toBeVisible();
    const sectionCards = await page.locator('.nk-cwhub-index__row').count();
    expect(sectionCards).toBeGreaterThanOrEqual(5);
    expect(splitKnownOverflow(await findHorizontalOverflow(page)).unknown).toEqual([]);
    assertNoErrors();
  });

  test('/currency/settings：CW 主题色选择（黑金语境、区块顺序固定、data-cw-accent 写入）', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/currency/settings');
    // meta.cw → <html data-theme="cw">；缺省无 data-cw-accent（默认香槟金不挂属性）
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'cw');
    await expect(page.locator('html')).not.toHaveAttribute('data-cw-accent');
    // CW 主题色区：5 个预置色板；区块顺序固定（01 常规模式主题色在 02 货币战争主题色上方，不随语境置前/交换）
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
    // 绕开 dev public 索引缓存（rolldown-vite 8 运行期新增文件未入索引，本机复用中的旧 dev 实例）：
    // prop_icons.json 直接注入磁盘内容，CI 新起实例无此问题，本拦截对两者均无害
    await page.route('**/data/cn/currency/prop_icons.json', (route) =>
      route.fulfill({ contentType: 'application/json', body: readFileSync('public/data/cn/currency/prop_icons.json', 'utf8') }),
    );
    await page.goto('/currency/role/1001');
    // 名册扉页 Hero：名字 + 编号行（v5 名册重构后结构签名；品牌 HUD 标签已移除）
    await expect(page.locator('.nk-crole-hero__name')).toHaveText('三月七');
    await expect(page.locator('.nk-crole-hero__id')).toHaveText('NO.1001');
    // 吸顶导航：五区块固定常驻（无内容区块显示空态提示，不隐藏；v5 去 01-05 编号前缀）
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
    // 技能图标：nanoka 主源 + jsDelivr 回退属性（98daff3 反转后主源 = nanoka，jsDelivr 退居旧档补全）
    const icon = page.locator('.nk-crole-skill__icon').first();
    await expect(icon).toBeVisible();
    await expect(icon).toHaveAttribute('src', /static\.nanoka\.cc\/assets\/hsr\/skillicons\/SkillIcon_1001_BP\.webp/);
    await expect(icon).toHaveAttribute('data-cdn-fallback', /cdn\.jsdelivr\.net\/gh\/a285292107s\/StarRailTextures@main\/assets\/asbres\/spriteoutput\/skillicons\/avatar\/1001\/SkillIcon_1001_BP\.png/);
    // 属性图标：矩阵行（基础前台强度 → IconFrontRow，jsDelivr 目录小写规则）
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
    // 光锥本体：名字/稀有度/命途/编号（帮助用户理解「专属光锥」指哪个光锥）
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
});

