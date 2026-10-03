import { test, expect, type Locator } from '@playwright/test';
import { readFileSync } from 'node:fs';
import {
  collectConsoleIssues, computedNumber, expectNoUnknownOverflow, fontPx, readJson, readTokenPx,
  resolveTokenColor, splitKnownOverflow, waitForCatalogCards,
} from './helpers';

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
 *
 * ── 数值断言的三种合法形态（UI 重构期纪律）──────────────────────────────
 * 1) 令牌派生：期望值从 CSS 令牌读（`readTokenPx`），实际值从计算样式读（`computedNumber`）；
 * 2) 相对关系：元素之间的序（`>`）、等值（`=`）、整数倍（`= rail/2`）；
 * 3) 数据派生：期望值从 `public/data/cn/**.json` 读（见下方 charFamilyIds / seasonData 一族）。
 * 绝对 px 只允许出现在「跨会话不得漂移的契约值」：侧栏避让 148/88、断点 768/767、底部栏高度下限。
 * **禁止新增** `toHaveCSS('font-size', '<绝对值>')` 一类断言——字号档位只锁相对序与档位一致，
 * 绝对值归 CSS，一次字号微调不该让整份 e2e 变红。
 *
 * 不变量层（无 JS 异常 / 无未知溢出 / 关键容器可达）在 `guards.spec.ts`，本文件只留语义契约与数值规格。
 */

/** 元素计算样式必须等于令牌落值（令牌缺失时读数为 0，断言随之变红） */
async function expectTokenNumber(loc: Locator, prop: string, tokenValue: number, label: string): Promise<void> {
  expect(await computedNumber(loc, prop), `${label} 应等于令牌值 ${tokenValue}`).toBe(tokenValue);
}

/** 未知横向溢出（整页判据；技能区子树见 expectNoSkillsOverflow） */
const noUnknownOverflow = expectNoUnknownOverflow;

/** 技能区子树未知溢出（见 skillsPanelOverflow 注释：Hero spine 画布恒越出视口，整页判据会误伤） */
async function expectNoSkillsOverflow(page: import('@playwright/test').Page): Promise<void> {
  expect(splitKnownOverflow(await skillsPanelOverflow(page)).unknown).toEqual([]);
}

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
    await noUnknownOverflow(page);
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
    await noUnknownOverflow(page);
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
    await noUnknownOverflow(page);
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
    await noUnknownOverflow(page);
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
    await noUnknownOverflow(page);
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
    await noUnknownOverflow(page);
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
    await noUnknownOverflow(page);
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
    // 令牌真实生效：品牌带标题区左缘 = 侧栏避让令牌落值
    await expectTokenNumber(page.locator('.nk-hub-brand__content'), 'padding-left', await readContentOffset(page), '品牌带内容区左避让');

    await page.goto('/currency');
    await expect(page.locator('.nk-hub-brand__title')).toBeVisible();
    await expect(page.locator('.ui-sidebar')).toBeVisible();
    await expect(page.locator('html')).not.toHaveAttribute('data-nav');
    expect(await readContentOffset(page)).toBe(148);
    await expectTokenNumber(page.locator('.nk-hub-release'), 'padding-left', await readContentOffset(page), '枢纽版块左避让');

    // 客户端路由切换（非整页加载）主流程：枢纽页 → 板块页全程导航条在位。
    await page.locator('.ui-sidebar a[href="/currency/role"]').first().click();
    // 落点断言（期望值取自 CW_NAV_ITEMS[0].path，勿凭直觉）
    await expect(page).toHaveURL(/\/currency\/role$/);
    await expect(page.locator('.ui-sidebar')).toBeVisible();
    await expect(page.locator('html')).not.toHaveAttribute('data-nav');
    expect(await readContentOffset(page)).toBe(148);
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('平板（800px）：/ 渲染侧栏，避让 88px', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 800, height: 900 });
    await page.goto('/');
    await expect(page.locator('.ui-sidebar')).toBeVisible();
    await expect(page.locator('html')).not.toHaveAttribute('data-nav');
    expect(await readContentOffset(page)).toBe(88);
    await expectTokenNumber(page.locator('.nk-hub-release'), 'padding-left', await readContentOffset(page), '平板档枢纽版块左避让');
    await noUnknownOverflow(page);
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
    await noUnknownOverflow(page);
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
      // 桌面：左缘 = 侧栏避让令牌；右缘 = 版块同一栅格（与 .nk-hub-release 的右留白逐值一致，改一处两处同步）
      await expectTokenNumber(footer, 'padding-left', await readContentOffset(page), '页脚左避让');
      const releaseGutter = await computedNumber(page.locator('.nk-hub-release').first(), 'padding-right');
      expect(releaseGutter).toBeGreaterThan(0);
      await expectTokenNumber(footer, 'padding-right', releaseGutter, '页脚右留白（=枢纽版块右留白）');
      // 拉丁格言消费全站等宽令牌 --font-mono（令牌缺失会回退默认字体，视觉不易察觉）
      const font = await footer.locator('.nk-hub-footer__latin').evaluate(
        (el) => getComputedStyle(el).fontFamily,
      );
      expect(font).toContain('ui-monospace');
    }
    // 手机：页脚底部留白必须容得下底部导航栏——预留低于栏体实际高度时页脚会被压在栏下。
    // 判据取「≥ 实测栏高」而非写死 56：栏高本身随设计变动，页脚被压才是要防的缺陷。
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await expect(page.locator('.ui-sidebar')).toBeVisible();
    const barHeight = await page.locator('.ui-sidebar').evaluate((el) => el.getBoundingClientRect().height);
    expect(barHeight, '底部导航栏高度应大于 0（否则本判据失去意义）').toBeGreaterThan(0);
    const padBottom = await computedNumber(page.locator('.nk-hub-footer'), 'padding-bottom');
    expect(padBottom, `页脚底部留白 ${padBottom} 应容得下底部栏 ${barHeight}`).toBeGreaterThanOrEqual(barHeight);
    await noUnknownOverflow(page);
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
    await noUnknownOverflow(page);
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
    await noUnknownOverflow(page);
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

/* ─── 期望值从随站数据派生（沿用 charFamilyIds 模式）───
   页面文案 / 计数 / 分数档一律不在断言里写死：数据一改，断言跟着数据走；页面写错才红。
   无法派生的只剩两类：① 站点自创文案（如 H1「贪饕污染」、区块标题「首领特性」）；
   ② UI 格式（「第 N 层」「污染等级 N」「NO.<id>」的拼装方式）——这两类保留字面量并注明理由。 */

interface MonsterLike { name: string; icon?: string; wave?: number; summons?: SummonLike[] }
interface InvasionLike { level: number; stage_id?: number; monsters?: MonsterLike[] }
/** 召唤物（ADR 0036 修订）：轻形态 + 受污染者带 polluted（污染等级）；挂在召唤者自己的敌方条目上 */
interface SummonLike { id: string; name: string; tpl?: string; polluted?: number }
interface StageLike { monsters?: MonsterLike[]; invasion?: InvasionLike; damage?: string[] }
interface FloorLike {
  floor: number;
  name?: string;
  level?: number;
  countdown?: number;
  buff?: { name: string };
  targets?: { param: number; type?: string }[];
  stage1?: StageLike;
  stage2?: StageLike;
}
interface SeasonLike {
  id: string;
  zh?: string;
  floors?: number;
  countdown?: number;
  clear_score?: number;
  buffs?: { id: number; name: string }[];
  sub_buffs?: { id: number; name: string }[];
  floor_details?: FloorLike[];
  buff_groups?: Record<string, { name: string }[]>;
  boss_traits?: Record<string, { name: string; param_list?: number[] }[]>;
  tierce?: {
    targets?: { param: number }[];
    rewards?: unknown[];
    monsters?: MonsterLike[];
    nodes?: { idx: number; level?: number; damage?: string[]; monsters?: MonsterLike[]; invasion?: InvasionLike; buff?: { name: string } }[];
  };
  levels?: {
    name?: string;
    damage?: string[];
    monsters?: MonsterLike[];
    invasion?: InvasionLike;
    hard?: { monsters?: MonsterLike[] };
  }[];
  buffs?: { name: string }[];
  pollution?: { count: number; levels: number[] };
}

/** 读某个终局赛季的原始数据（maze_boss / maze / maze_peak 三表同构） */
function seasonData(file: 'maze_boss.json' | 'maze.json' | 'maze_extra.json' | 'maze_peak.json', id: string): SeasonLike {
  const all = readJson<Record<string, SeasonLike>>(`public/data/cn/${file}`);
  const found = all[id];
  if (!found) throw new Error(`public/data/cn/${file} 缺少赛季 ${id}`);
  return found;
}

/** 节点卡片序号文案的中文数字（站点自创格式，非数据字段） */
const CN_NUM = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];

/** 末波首领（= 战斗卡片「打谁」的判据，与 `renders.lastWaveBoss` 同源：最后一波的第 1 只） */
function lastWaveMonster(stage: { monsters?: MonsterLike[] } | undefined): MonsterLike {
  const mons = stage?.monsters ?? [];
  if (!mons.length) throw new Error('该节点/场次无敌方数据，无法派生末波首领');
  const lastWave = Math.max(...mons.map((m) => m.wave ?? 1));
  return mons.filter((m) => (m.wave ?? 1) === lastWave)[0];
}

/** 末波首领名 */
function lastWaveBossName(stage: StageLike | undefined): string {
  return lastWaveMonster(stage).name;
}

/** 层级 tab 文案：数据层序 + 星启模式（不写死层数） */
function levelTabLabels(season: SeasonLike): string[] {
  return [...(season.floor_details ?? []).map((f) => `第 ${f.floor} 层`), '星启模式'];
}

/** 子 tab 文案（层 tab + 有星启才有的星启 tab；层级模式三玩法共用） */
function seasonTabLabels(season: SeasonLike): string[] {
  const floors = (season.floor_details ?? []).map((f) => `第 ${f.floor} 层`);
  return season.tierce ? [...floors, '星启模式'] : floors;
}

/** 千分位（页面数值档用 toLocaleString 渲染，断言不依赖运行环境的 locale） */
function grouped(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** 某层半场的末波首领名 */
function floorBossName(season: SeasonLike, floor: number, half: 'stage1' | 'stage2'): string {
  const f = (season.floor_details ?? []).find((x) => x.floor === floor);
  if (!f) throw new Error(`赛季 ${season.id} 缺少第 ${floor} 层`);
  return lastWaveBossName(f[half]);
}

/** 星启节点看板的敌方（看板只渲染当前节点，敌方同源于 tierce.nodes） */
function tierceNodeBossNames(season: SeasonLike): string[] {
  return (season.tierce?.nodes ?? []).map((nd) => lastWaveMonster(nd).name);
}

interface PollutionEntry {
  half: 'stage1' | 'stage2' | 'level' | 'tierce';
  floor?: number;
  title?: string;
  invasion: InvasionLike;
}

/** 污染节点（与 src/app/endgame/pollution.ts 同口径：层序倒置 → 异相仲裁单关 → 星启节点，按 stage_id 去重） */
function pollutionEntries(season: SeasonLike): PollutionEntry[] {
  const out: PollutionEntry[] = [];
  const seen = new Set<number>();
  const push = (e: PollutionEntry): void => {
    const sid = e.invasion.stage_id;
    if (sid != null) {
      if (seen.has(sid)) return;
      seen.add(sid);
    }
    out.push(e);
  };
  for (const f of [...(season.floor_details ?? [])].reverse()) {
    for (const half of ['stage1', 'stage2'] as const) {
      const invasion = f[half]?.invasion;
      if (invasion) push({ half, floor: f.floor, title: f.name, invasion });
    }
  }
  for (const lv of season.levels ?? []) {
    if (lv.invasion) push({ half: 'level', title: lv.name, invasion: lv.invasion });
  }
  for (const nd of season.tierce?.nodes ?? []) {
    if (nd.invasion) push({ half: 'tierce', invasion: nd.invasion });
  }
  return out;
}

/** 污染徽标文案（站点术语「污染等级 N」，勿简写成侵蚀等级） */
const pollutionBadge = (e: PollutionEntry): string => `污染等级 ${e.invasion.level}`;

/** 某场次/某节点敌方条目上的召唤物（按召唤者分发，见 ADR 0036 修订） */
function summonsOf(mons: MonsterLike[] | undefined): SummonLike[] {
  return (mons ?? []).flatMap((m) => m.summons ?? []);
}

/** 其中受污染的那些（站点在它们身上挂污染徽标） */
function pollutedSummons(mons: MonsterLike[] | undefined): SummonLike[] {
  return summonsOf(mons).filter((s) => s.polluted);
}

/** 污染徽标文案（召唤物条目上的 polluted = 该场次 InvasionID） */
const summonBadge = (s: SummonLike): string => `污染等级 ${s.polluted}`;

/** 污染节点位置文案（与 pollutionPosition 同口径） */
function pollutionPosition(e: PollutionEntry): string {
  if (e.half === 'tierce') return '星启附加关';
  if (e.half === 'level') return e.title || '关卡';
  return `第 ${e.floor} 层 · ${e.half === 'stage1' ? '上半场' : '下半场'}`;
}

/** 被污染怪物总数（污染数据自带，不在本页敌方配置里） */
function pollutedMonsterCount(season: SeasonLike): number {
  return pollutionEntries(season).reduce((n, e) => n + (e.invasion.monsters?.length ?? 0), 0);
}

/** 已登记的污染赛季（四张终局目录的 `pollution` 字段 = 目录页标记的唯一判据；目录文件 → 路由 mode 一一对应） */
function pollutedSeasonHrefs(): string[] {
  const sources: [file: string, mode: 'boss' | 'maze' | 'story' | 'peak'][] = [
    ['maze_boss.catalog.json', 'boss'],
    ['maze.catalog.json', 'maze'],
    ['maze_extra.catalog.json', 'story'],
    ['maze_peak.catalog.json', 'peak'],
  ];
  return sources.flatMap(([file, mode]) =>
    Object.values(readJson<Record<string, { id: string; pollution?: { count?: number } | null }>>(`public/data/cn/${file}`))
      .filter((e) => (e.pollution?.count ?? 0) > 0)
      .map((e) => `/endgame/${mode}/${e.id}`),
  );
}

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
    // 末法余烬与星启看板同位：看板首块，只显示增益名（「可用增益」标签全站已移除）
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
      await selectHalf(entry.floor!, entry.half === 'stage1' ? 'stage1' : 'stage2');
      // 徽标只认看板头那一枚：卡内召唤物条目上的徽标属于召唤物（ADR 0036），不参与这里的断言
      await expect(page.locator('#egd-floor-board .nk-egd-board__head .nk-egd-pollchip')).toHaveText(pollutionBadge(entry));
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
    const stageTraits = season.boss_traits?.stage1 ?? [];
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
    await expect(boardGroups).toHaveCount(2);
    await expect(boardGroups.nth(0).locator('.nk-egd-group__title')).toHaveText('首领特性');
    // 首领特性 = 整组一张卡（与星启看板同形），条数取自该半场数据
    await expect(boardGroups.nth(0).locator('.nk-egd-traits')).toHaveCount(1);
    await expect(boardGroups.nth(0).locator('.nk-egd-trait')).toHaveCount(stageTraits.length);
    // 坚防守备（#1/#2 参数按 ParameterList 渲染为百分比，期望值取自 param_list）
    const trait0 = boardGroups.nth(0).locator('.nk-egd-trait').first();
    await expect(trait0).toContainText(stageTraits[0].name);
    await expect(trait0).toContainText(`${stageTraits[0].param_list![0] * 100}%`);
    await expect(trait0).toContainText(`${stageTraits[0].param_list![1] * 100}%`);
    await expect(boardGroups.nth(1).locator('.nk-egd-group__title')).toHaveText('赛季增益');
    await expect(boardGroups.nth(1).locator('.nk-egd-buff')).toHaveCount(stageBuffs.length);
    // 第 1 层上半场：本层无污染，但召唤物照样在首领卡内列出（触发条件 = 该敌方有召唤表），且全程无徽标
    await expect(floorBoard.locator('.nk-egd-board__head .nk-egd-pollchip')).toHaveCount(0);
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
    // 3020 节点 1 带污染：徽标只在看板头出现一次（特性行右端那份已按用户裁决移除）
    await expect(board.locator('.nk-egd-board__head .nk-egd-pollchip')).toHaveCount(1);
    await expect(board.locator('.nk-egd-group__head .nk-egd-pollchip')).toHaveCount(0);
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
    // 看板体块序：末法余烬 → 首领特性 → 敌方配置 → 赛季增益（末法余烬行只留增益名，标签「可用增益」已移除）
    await expect(board.locator('.nk-egd-floor__buffhead')).toHaveText(tierceData.nodes![0].buff!.name);
    await expect(board.locator('.nk-egd-floor__bufflabel')).toHaveCount(0);
    await expect(board.locator('.nk-egd-group__title')).toHaveText(['首领特性', '赛季增益']);
    await expect(board.locator('.nk-egd-buff')).toHaveCount(stageBuffs.length);
    // 首领特性 = 整组一张卡片 + 组内逐条平铺（用户裁决：不再用子 tab 切换说明）
    await expect(board.locator('.nk-egd-pilltabs')).toHaveCount(0);
    const traitCard = board.locator('.nk-egd-traits');
    await expect(traitCard).toHaveCount(1);
    const traitItems = traitCard.locator('.nk-egd-trait');
    await expect(traitItems).toHaveCount(stageTraits.length);
    await expect(traitItems.locator('.nk-egd-trait__name')).toHaveText(stageTraits.map((t) => t.name));
    // 机制参数按 ParameterList 渲染成百分比（期望值取自 param_list）：四条说明同屏，不再需要点击展开
    await expect(traitItems.first()).toContainText(`${stageTraits[0].param_list![0] * 100}%`);
    await expect(traitItems.first()).toContainText(`${stageTraits[0].param_list![1] * 100}%`);
    // 「一张卡片」是可判定形态：卡形整组承担（1px 四边描边 + 填充 + 圆角），组内条目自身归零、
    // 只靠行距分节（不画分隔线，也不加模式色左沿——与赛季增益 / 末法余烬同一套中性卡形）
    expect(await computedNumber(traitCard, 'border-top-width'), '整组卡片应有四边描边').toBe(1);
    expect(await computedNumber(traitCard, 'border-left-width'), '整组卡片不设模式色左沿').toBe(1);
    expect(await computedNumber(traitCard, 'border-top-left-radius'), '整组卡片应有圆角').toBeGreaterThan(0);
    expect(await traitCard.evaluate((el) => getComputedStyle(el).backgroundColor), '整组卡片应有填充')
      .not.toBe('rgba(0, 0, 0, 0)');
    // 左沿既不能加粗也不得上模式色：卡片四边同一支发丝线（与中性卡形判据一致）
    const cardBorders = await traitCard.evaluate((el) => {
      const cs = getComputedStyle(el);
      return [cs.borderTopColor, cs.borderLeftColor, cs.borderLeftStyle];
    });
    expect(cardBorders[1], '左沿不得使用模式色').toBe(cardBorders[0]);
    expect(cardBorders[2], '左沿不得加宽为竖条').toBe('solid');
    expect(await computedNumber(traitCard, 'border-left-width')).toBe(await computedNumber(traitCard, 'border-top-width'));
    const cardGap = await computedNumber(traitCard, 'row-gap');
    const itemGap = await computedNumber(traitItems.first(), 'row-gap');
    expect(cardGap, '组内条目间距须大于条目内名行与正文的间距').toBeGreaterThan(itemGap);
    expect(await computedNumber(traitItems.first(), 'border-top-width'), '条目不应再各自套卡').toBe(0);
    expect(await computedNumber(traitItems.first(), 'padding-top'), '条目内边距归整组卡片').toBe(0);
    expect(await traitItems.first().evaluate((el) => getComputedStyle(el).animationName), '条目不应有入场动画')
      .toBe('none');
    const descRatio = await traitItems.first().locator('.nk-egd-trait__desc').evaluate((el) => {
      const c = getComputedStyle(el);
      return parseFloat(c.lineHeight) / parseFloat(c.fontSize);
    });
    expect(descRatio, '正文档行高不得缩水').toBeGreaterThan(1.6);
    // 敌方配置块下方不得留尾随空白：末波敌方网格的 8px 下外边距只服务多波之间
    // （`.nk-egd-floor__monswrap` 已有 9px gap），末位归零。召唤物并入敌方卡内（ADR 0036 修订）后
    // 「敌方配置」重回场次块末行，`.nk-egd-floor__row:last-child` 收掉下内距与发丝线。
    const monsSpacing = await board.evaluate((el) => {
      const body = el.querySelector('.nk-egd-board__body') as HTMLElement;
      const stage = body.querySelector('.nk-egd-floor__stage') as HTMLElement;
      const grid = stage.querySelector('.nk-egd-mons') as HTMLElement;
      const wrap = stage.querySelector('.nk-egd-floor__monswrap') as HTMLElement;
      const monsRow = stage.querySelector('.nk-egd-floor__row--mons') as HTMLElement;
      const last = stage.lastElementChild as HTMLElement;
      const next = stage.nextElementSibling as HTMLElement | null;
      return {
        gap: parseFloat(getComputedStyle(body).rowGap) || 0,
        gridMargin: parseFloat(getComputedStyle(grid).marginBottom) || 0,
        wrapTail: Math.round(wrap.getBoundingClientRect().bottom - grid.getBoundingClientRect().bottom),
        belowWrap: Math.round(monsRow.getBoundingClientRect().bottom - wrap.getBoundingClientRect().bottom),
        lastIsMons: last === monsRow,
        tail: Math.round(stage.getBoundingClientRect().bottom - last.getBoundingClientRect().bottom),
        toNext: next ? Math.round(next.getBoundingClientRect().top - stage.getBoundingClientRect().bottom) : -1,
      };
    });
    expect(monsSpacing.gap, '看板体应声明区块间距').toBeGreaterThan(0);
    expect(monsSpacing.gridMargin, '末波敌方网格下外边距应归零').toBe(0);
    expect(monsSpacing.wrapTail, '敌方卡组下方不应有余白').toBe(0);
    expect(monsSpacing.belowWrap, '敌方配置块下方不应有余白').toBe(0);
    expect(monsSpacing.lastIsMons, '敌方配置应重新成为场次块末行').toBe(true);
    expect(monsSpacing.tail, '场次块末行下方不应有余白').toBe(0);
    expect(monsSpacing.toNext, '敌方配置与下一区块的间距 = 看板体 gap').toBe(monsSpacing.gap);
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
      .toHaveText(season.boss_traits!.tierce.map((t) => t.name));
    const node3Elems = await nodeTabs.nth(2).locator('.nk-egd-nodecard__elems').innerHTML();
    expect(node3Elems.length).toBeGreaterThan(0);
    expect(node3Elems).not.toBe(node1Elems);
    const node3Buffs = await board.locator('.nk-egd-buff__name')
      .evaluateAll((els) => els.map((el) => el.textContent?.trim() || ''));
    const tierceBuffs = season.buff_groups!.tierce;
    expect(node3Buffs).toHaveLength(tierceBuffs.length);
    expect(node3Buffs).not.toEqual(floor4Buffs.slice(0, stageBuffs.length));
    expect(node3Buffs).toEqual(tierceBuffs.map((b) => b.name));
    // 赛季增益不再有面板级副本：一份分组只长在当前节点的看板里
    await expect(tierce.locator('.nk-egd-group__title')).toHaveCount(2);
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
    // 看板：一次一个半场，块序 = 首领特性 → 敌方配置 → 赛季增益；层内不复述半场身份
    const board = page.locator('#egd-floor-board');
    await expect(board).toHaveCount(1);
    await expect(board).toHaveCSS('display', 'flex');
    await expect(board.locator('.nk-egd-group__title')).toHaveText(['首领特性', '赛季增益']);
    await expect(board.locator('.nk-egd-group__label')).toHaveCount(0);
    // 块序与星启看板逐字同序：末法余烬 → 首领特性 → 敌方配置 → 赛季增益（层共用块随看板显示）
    const boardBlocks = await board.locator('.nk-egd-board__body').evaluate((el) =>
      [...el.children].map((c) => (c as HTMLElement).className.split(' ')[0]));
    expect(boardBlocks).toEqual(['nk-egd-floor__buff', 'nk-egd-group', 'nk-egd-floor__stage', 'nk-egd-group']);
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
      label: await fontPx(page.locator('.nk-egd-floor__label').first()),
      desc: await fontPx(page.locator('.nk-egd-buff__desc').first()),
    };
    expect(tier.cardName, '赛季增益 / 首领特性标题同档').toBe(tier.traitName);
    expect(tier.cardName).toBeGreaterThan(tier.desc + 0.5);
    expect(tier.desc).toBeGreaterThan(tier.label + 0.5);
    const badgeVsPos = await page.evaluate(() => {
      const fs = (s: string): string => getComputedStyle(document.querySelector(s) as Element).fontSize;
      return [fs('.nk-egd-poll__badge'), fs('.nk-egd-poll__pos')];
    });
    // 历史 bug：污染徽标继承 1rem，与同行关卡位置不同档
    expect(badgeVsPos[0]).toBe(badgeVsPos[1]);
    // 间距契约：首领特性改整组单卡（与星启看板同形）后，卡形（内距 / 填充 / 描边）由容器承担、
    // 条目自身归零——同族的赛季增益卡与它共用一套内距；正文行高不缩水（行高倍数而非钉死像素）
    const padAndGap = await page.evaluate(() => {
      const cs = (s: string): CSSStyleDeclaration => getComputedStyle(document.querySelector(s) as Element);
      return {
        buffPad: [cs('.nk-egd-buff').paddingTop, cs('.nk-egd-buff').paddingLeft],
        traitCardPad: [cs('.nk-egd-traits').paddingTop, cs('.nk-egd-traits').paddingLeft],
        traitPad: [cs('.nk-egd-trait').paddingTop, cs('.nk-egd-trait').paddingLeft],
        buffsGap: parseFloat(cs('.nk-egd-buffs').rowGap) || 0,
        traitsGap: parseFloat(cs('.nk-egd-traits').rowGap) || 0,
        descLh: parseFloat(cs('.nk-egd-trait__desc').lineHeight),
        descFs: parseFloat(cs('.nk-egd-trait__desc').fontSize),
      };
    });
    expect(padAndGap.traitCardPad, '整组卡片与赛季增益卡同内距').toEqual(padAndGap.buffPad);
    expect(padAndGap.traitPad, '条目内距归整组卡片').toEqual(['0px', '0px']);
    expect(padAndGap.buffsGap).toBeGreaterThan(0);
    expect(padAndGap.traitsGap).toBeGreaterThan(0);
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
    await expect(board.locator('.nk-egd-traits .nk-egd-trait'))
      .toHaveCount(season.boss_traits!.tierce.length);
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
    // 星启看板自身也标出污染节点（数据里带 invasion 的那个节点）：看板头是污染徽标在板内的唯一位置
    const mazeNode = (maze.tierce?.nodes ?? []).findIndex((nd) => nd.invasion);
    expect(mazeNode, '忘却之庭星启节点里应有污染节点').toBeGreaterThanOrEqual(0);
    await page.locator('.nk-egd-nodecards[aria-label="星启节点"] [role="tab"]').nth(mazeNode).click();
    const mazeHead = page.locator('.nk-egd-board__head');
    await expect(mazeHead.locator('.nk-egd-pollchip')).toHaveCount(1);
    await expect(mazeHead).toHaveText(pollutionBadge(pollutionEntries(maze).find((e) => e.half === 'tierce')!));
    // 受污染的召唤物：挂在召唤者自己的敌方卡片里（星启看板一律用敌方卡，四模式共用同一判据，ADR 0036）
    const mazeNodeData = maze.tierce!.nodes![mazeNode];
    const mazeNodeSummons = summonsOf(mazeNodeData.monsters);
    const mazeNodePolled = pollutedSummons(mazeNodeData.monsters);
    expect(mazeNodePolled.length, '该星启节点应有受污染的召唤物').toBeGreaterThan(0);
    const mazeSummonCards = page.locator('#egd-tierce-board .nk-egd-mon .nk-egd-summon');
    await expect(mazeSummonCards).toHaveCount(mazeNodeSummons.length);
    await expect(page.locator('#egd-tierce-board .nk-egd-mon .nk-egd-pollchip'))
      .toHaveText(mazeNodePolled.map(summonBadge));
    await expect(page.locator('#egd-tierce-board .nk-egd-floor__row--summons')).toHaveCount(0);
    // 星启附加关同样带自己的推荐属性（三模式共用的补全，不只在末日幻影）——落在节点卡片上
    await expect(page.locator('.nk-egd-nodecard--active .nk-egd-nodecard__label').first()).toHaveText('推荐属性');
    await noUnknownOverflow(page);
    assertNoErrors();

    // 异相仲裁：无层/半场，污染直接落在单关上，且区块排在「关卡组成」之前
    const peak = seasonData('maze_peak.json', '9');
    const peakPoll = pollutionEntries(peak);
    expect(peakPoll.length).toBeGreaterThan(0);
    await page.goto('/endgame/peak/9');
    await expect(page.locator('#egd-pollution')).toBeVisible();
    const secnav = page.locator('.nk-egd-secnav .nk-secnav__btn');
    await expect(secnav).toHaveCount(2);
    await expect(secnav.first()).toContainText('污染等级');
    await expect(secnav.last()).toContainText('关卡组成');
    await expect(page.locator('.nk-egd-poll__pos')).toHaveText(peakPoll.map(pollutionPosition));
    await expect(page.locator('.nk-egd-poll__leveldesc')).toHaveCount(peakPoll.length);
    await expect(page.locator('.nk-egd-peak .nk-egd-pollchip')).toHaveCount(peakPoll.length);
    // 异相仲裁的层级增益与楼层同一渲染位（内联一份），标签一并移除；增益名取自该赛季增益表
    await expect(page.locator('.nk-egd-floor__buffname').first()).toHaveText(peak.buffs![0].name);
    await expect(page.locator('.nk-egd-floor__bufflabel')).toHaveCount(0);
    // 异相仲裁单关与绝境变体同样把召唤物并进敌方图标格（触发条件 = 该敌方有召唤表）：条数由该期数据派生
    const peakSummons = (peak.levels ?? []).flatMap(
      (l) => [...summonsOf(l.monsters), ...summonsOf(l.hard?.monsters)],
    );
    expect(peakSummons.length, '异相仲裁应有带召唤物的单关').toBeGreaterThan(0);
    await expect(page.locator('.nk-egd-peak .nk-egd-floor__moncell .nk-egd-summon'))
      .toHaveCount(peakSummons.length);
    await expect(page.locator('.nk-egd-peak .nk-egd-summons__label').first()).toHaveText('召唤物');
    await expect(page.locator('.nk-egd-peak .nk-egd-floor__row--summons')).toHaveCount(0);
    // 图标格顶边对齐（带召唤物的格子更高，居中会让同级图标错位）
    expect(await page.locator('.nk-egd-peak .nk-egd-floor__mons').first()
      .evaluate((el) => getComputedStyle(el).alignItems)).toBe('flex-start');
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/endgame/maze/1036 + /endgame/story/2026：层级子 tab + 目标栏 + 半场卡片 + 单半场看板（ADR 0037）', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 1440, height: 900 });

    // ── 忘却之庭：目标为回合 / 减员档，栏名是「挑战目标」；回合与增益都随层走 ──
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
    // 赛季增益与每层的层级增益同文（「记忆紊流」）→ 赛季级区块整块退场，不重复陈述
    await expect(page.locator('#egd-buffs')).toHaveCount(0);
    // 赛季回合上限 = 每层回合上限 → 不进赛季规则右栏，改由半场卡片承担
    await expect(mazePanel.locator('.nk-egd-rules__item')).toHaveCount(0);
    // 层内增益随看板首块（末法余烬位），不再是层尾
    await expect(mazePanel.locator('.nk-egd-floor__buffname')).toHaveText(mazeFloor1.buff!.name);

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
    // 战意机制 / 赛季增益仍留在子 tab 之上的赛季级区块（这两项无逐层对应）
    await expect(page.locator('#egd-sub-buffs')).toBeVisible();
    await expect(page.locator('#egd-buffs')).toBeVisible();
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
    // 层级改由「缩进 + 字号档」承担），轨线只保留在异相仲裁卡体。
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

    // 异相仲裁（唯一的非子 tab 卡体）：卡体即子块，缩进 + 模式色竖轨都在
    await page.goto('/endgame/peak/9');
    const peakBody = page.locator('.nk-egd-peak__body').first();
    await expect(peakBody).toBeVisible();
    await expectTokenNumber(peakBody, 'padding-left', egIndent, '异相仲裁卡体缩进');
    const railWidth = await peakBody.evaluate((el) => parseFloat(getComputedStyle(el, '::before').width) || 0);
    expect(railWidth, '异相仲裁卡体的层级竖轨必须保留（只在战斗看板移除）').toBeGreaterThan(0);
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/endgame/maze/1036：父子层级刻度（ADR 0028）手机断点', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/endgame/maze/1036');
    // 手机端缩进降档（仍由同一令牌声明）、轨线只保留在异相仲裁卡体；
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
    await expectTokenNumber(peakBody, 'padding-left', egIndent, '手机档异相仲裁卡体缩进');
    expect(await peakBody.evaluate((el) => parseFloat(getComputedStyle(el, '::before').width) || 0),
      '手机档异相仲裁卡体的层级竖轨必须保留').toBeGreaterThan(0);
    await noUnknownOverflow(page);
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
    await noUnknownOverflow(page);
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
    await noUnknownOverflow(page);
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
    await noUnknownOverflow(page);
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
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/currency/role/1001：名册扉页 Hero、星级切换、无溢出', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    // 绕开 dev public 索引缓存（rolldown-vite 8 运行期新增文件未入索引）：prop_icons.json 直接注入磁盘内容
    await page.route('**/data/cn/currency/prop_icons.json', (route) =>
      route.fulfill({ contentType: 'application/json', body: readFileSync('public/data/cn/currency/prop_icons.json', 'utf8') }),
    );
    await page.goto('/currency/role/1001');
    // 名册扉页 Hero：名字 + 编号行（期望值取自 currency/role.json；NO.<id> 是站点自创格式）
    const role1001 = readJson<{ roles: { id: number; name: string }[] }>('public/data/cn/currency/role.json')
      .roles.find((r) => r.id === 1001);
    expect(role1001, 'currency/role.json 应含角色 1001').toBeTruthy();
    await expect(page.locator('.nk-crole-hero__name')).toHaveText(role1001!.name);
    await expect(page.locator('.nk-crole-hero__id')).toHaveText(`NO.${role1001!.id}`);
    // 吸顶导航：五区块固定常驻（无内容区块显示空态提示，不隐藏）——区块清单是站点信息架构，非数据
    const labels = await page.locator('.nk-crole-bar .nk-secnav__btn').allTextContents();
    expect(labels.map((t) => t.replace(/\s+/g, ''))).toEqual(['成长总览', '技能详情', '后台星魂', '专属光锥', '推荐装备']);
    // 钢印肖像章：直角（radius 0，直角系语言契约）+ 宽高相等
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
    // 星级分段控件激活态：亮金底 + 黑字（无渐变/无 glow 的方形控件，直角系）
    const pill = await page.locator('.nk-crole-gm-pill.is-active').first().evaluate((el) => {
      const cs = getComputedStyle(el);
      return { bg: cs.backgroundColor, color: cs.color, radius: cs.borderRadius };
    });
    // 颜色从令牌派生（消费层令牌 → 期望色），不再钉死 rgb 值
    expect(pill.bg).toBe(await resolveTokenColor(page, '--crole-seg-bg', '.nk-crole-gm-pill.is-active'));
    expect(pill.color).toBe(await resolveTokenColor(page, '--blk-900'));
    // 直角系：同页方形控件（星级 pill / 技能星级按钮）圆角同档，且不得退化成胶囊
    const starRadius = await page.locator('.nk-crole-skill__star').first()
      .evaluate((el) => getComputedStyle(el).borderRadius);
    expect(pill.radius, '同页方形控件圆角必须同档').toBe(starRadius);
    const pillBox = await page.locator('.nk-crole-gm-pill.is-active').first().boundingBox();
    expect(parseFloat(pill.radius)).toBeGreaterThan(0);
    expect(parseFloat(pill.radius)).toBeLessThan(pillBox!.height / 2);
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
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/currency/role/1003：专属光锥本体卡（EquipmentID → 常规光锥表）', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    // 期望值全部由数据派生：role.json 的 equipment_id → 常规光锥表 + 命途表
    const role1003 = readJson<{ roles: { id: number; equipment_id: number | null }[] }>(
      'public/data/cn/currency/role.json',
    ).roles.find((r) => r.id === 1003);
    expect(role1003?.equipment_id, 'currency/role.json 里 1003 应登记专属光锥').toBeTruthy();
    const coneData = readJson<{ id: number; name: string; rarity: number; path: string }[]>(
      'public/data/cn/light_cones.json',
    ).find((c) => c.id === role1003!.equipment_id);
    expect(coneData, `light_cones.json 应含光锥 ${role1003!.equipment_id}`).toBeTruthy();
    const pathName = readJson<{ id: string; name: string }[]>('public/data/cn/paths.json')
      .find((p) => p.id === coneData!.path)?.name;
    await page.goto('/currency/role/1003');
    await expect(page.locator('.nk-crole-hero__name')).toBeVisible();
    await page.locator('[data-panel="cones"]').scrollIntoViewIfNeeded();
    // 光锥本体：名字/稀有度/命途/编号（稀有度 → ★ 串、编号 → 图标路径均为站点自创格式）
    const cone = page.locator('.nk-crole-cone');
    await expect(cone).toBeVisible();
    await expect(cone.locator('.nk-crole-cone__name')).toHaveText(coneData!.name);
    await expect(cone.locator('.nk-crole-cone__rarity')).toHaveText('★'.repeat(coneData!.rarity));
    await expect(cone.locator('.nk-crole-cone__path')).toHaveText(pathName!);
    await expect(cone.locator('.nk-crole-cone__icon'))
      .toHaveAttribute('src', new RegExp(`static\\.nanoka\\.cc/.*lightconemediumicon/${coneData!.id}\\.webp`));
    // 等级递进列表保留（5 级）
    await expect(page.locator('[data-panel="cones"] .nk-crole-equip')).toHaveCount(5);
    await noUnknownOverflow(page);
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
    // 方形分段控件：与同行星级 pill 同档圆角（非 999px 胶囊）
    const mobilePillRadius = await page.locator('.nk-crole-gm-pill').first()
      .evaluate((el) => getComputedStyle(el).borderRadius);
    const starBox = await page.locator('.nk-crole-skill__star.is-on').first().boundingBox();
    const star = await page.locator('.nk-crole-skill__star.is-on').first().evaluate((el) =>
      getComputedStyle(el).borderRadius,
    );
    expect(star, '同页方形控件圆角必须同档').toBe(mobilePillRadius);
    expect(parseFloat(star)).toBeGreaterThan(0);
    expect(parseFloat(star)).toBeLessThan(starBox!.height / 2);
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
    await noUnknownOverflow(page);
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
    await noUnknownOverflow(page);
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
    // 可点外观：非裸文字——有发丝描边（>0 且 ≤1px）、有圆角（>0 且非胶囊）、有非全透明底色
    await expect(toggles.first()).toHaveCSS('border-top-style', 'solid');
    const toggleBorder = await computedNumber(toggles.first(), 'border-top-width');
    expect(toggleBorder).toBeGreaterThan(0);
    expect(toggleBorder, '描边必须是发丝线，不得变成粗边').toBeLessThanOrEqual(1);
    const toggleRadius = await computedNumber(toggles.first(), 'border-top-left-radius');
    const toggleBox = await toggles.first().boundingBox();
    expect(toggleRadius).toBeGreaterThan(0);
    expect(toggleRadius, '圆角不得退化成胶囊（999px）').toBeLessThan(toggleBox!.height / 2);
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
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/character/1001 手机断点：配队标头渲染、队间距 16px、无溢出', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    // 队数与编号取自角色数据（多队才渲染标头）
    const teams = readJson<{ teams: unknown[] }>('public/data/cn/characters/1001.json').teams;
    expect(teams.length, '1001 应为多队样本（否则标头不渲染）').toBeGreaterThan(1);
    const no = String(teams.length).padStart(2, '0');
    // 先量桌面档队间距（同一元素跨断点比较：手机档只放大不缩小，绝对值交 CSS）
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/character/1001');
    const desktopGap = await page.locator('.nk-build__teams').evaluate(
      (el) => parseFloat(getComputedStyle(el).rowGap),
    );
    expect(desktopGap).toBeGreaterThan(0);
    await page.setViewportSize({ width: 390, height: 844 });
    const heads = page.locator('.nk-build__team-head');
    await expect(heads).toHaveCount(teams.length);
    await expect(heads.first()).toContainText('配队 01');
    await expect(heads.last()).toContainText(`配队 ${no}`);
    await expect(heads.last()).toContainText(`/ ${no}`);
    const gap = await page.locator('.nk-build__teams').evaluate(
      (el) => parseFloat(getComputedStyle(el).rowGap),
    );
    expect(gap, `手机档队间距 ${gap} 不得小于桌面档 ${desktopGap}`).toBeGreaterThanOrEqual(desktopGap);
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  /* ─── 技能族层级 + 图标列折角线（ADR 0022）：真珠 1503 Point01 族 = 150301 + 150308/150310 ─── */

  test('/character/1503：族内首个为父卡（行笔，临摹断水）+ 2 子卡，子卡缩进一个图标空间、竖轨共线、折角接子图标中线', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/character/1503');
    const firstCard = page.locator('[data-panel="skills"] > .nk-skill').first();
    // 技能名一律从 characters/1503.json 的族数据派生（族 id 原序 → 名），不在断言里写死页面文案
    const familyIds = charFamilyIds('1503', 'Point01');
    const familyNames = charSkillNames('1503', familyIds);
    await expect(firstCard.locator('.nk-skill__name').first()).toHaveText(familyNames[0]);

    // 族内首个 = 基座技能 = 父卡，其余两条 = 形态技能 = 子卡（禁止 SkillList 顺序判父子）
    const children = firstCard.locator('.nk-skill--child');
    await expect(children).toHaveCount(familyIds.length - 1);
    await expect(children.locator('.nk-skill__name')).toHaveText(familyNames.slice(1));

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

    // 竖轨（::before）= --line-2 发丝线；折角（::after）= 1px 上边框
    const rail = await pseudoBox(children.first(), '::before');
    expect(rail.borderLeftWidth).toBe('1px');
    expect(rail.borderLeftColor, '竖轨颜色必须取自 --line-2 令牌').toBe(await resolveTokenColor(page, '--line-2'));
    const corner = await pseudoBox(children.first(), '::after');
    expect(corner.borderTopWidth).toBe('1px');
    expect(corner.borderTopStyle).toBe('solid');

    // 折角：横段 = 半个图标空间（由 --nk-skill-rail 派生，不钉 24px）→ 右端 x 恰为子卡图标左缘；y 恰为子卡图标中线
    // （包含块原点是卡顶，故 y = 卡顶 + child-gap + rail/2；pseudoBox 不得再加宿主 padding 换算，否则折角错位也会假通过）
    expect(corner.width).toBe(parseFloat(tokens.rail) / 2);
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
    expect(lastRail.width).toBe(parseFloat(tokens.rail) / 2);

    await expectNoSkillsOverflow(page);
    assertNoErrors();
  });

  test('/character/1503 手机断点 375×812：图标列退场、正文单列全宽、子卡虚线分区 + 12px 缩进（ADR 0023）', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/character/1503');
    const firstCard = page.locator('[data-panel="skills"] > .nk-skill').first();
    await expect(firstCard).toBeVisible();
    await expect(page.locator('.nk-skill--child').first()).toBeVisible();
    // 手机断点不得产生文档级横向滚动（判据按视口宽推导，不写死 376）
    const scrollOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth - (document.documentElement.clientWidth + 1),
    );
    expect(scrollOverflow, `文档宽超出可用宽 ${scrollOverflow}px`).toBeLessThanOrEqual(0);

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

    // 虚线分区：子卡上沿 1px dashed（颜色取自 --line-2 令牌）；父卡与单卡不加线
    const children = firstCard.locator('.nk-skill--child');
    await expect(children.first()).toHaveCSS('border-top-style', 'dashed');
    await expect(children.first()).toHaveCSS('border-top-width', '1px');
    await expect(children.first()).toHaveCSS('border-top-color', await resolveTokenColor(page, '--line-2'));
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

    await expectNoSkillsOverflow(page);
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
    await expectNoSkillsOverflow(page);
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

  // 缺陷史：属性网格是三列，但第 3 项命中基线 `.nk-hero__stat:last-child:nth-child(odd) { grid-column: 1/-1 }`
  // （两列网格的「末项满行」规则），DEF 被挤成独立整行。此处钉住「三项同行成列 + 网格不横溢」。
  test('/lightcone：hero 属性三项同行成列，窄屏回落两列且 DEF 满行，无溢出', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    const cones = readJson<Record<string, { id: number }>>('public/data/cn/light_cones.json');
    const lcId = Object.values(cones)[0].id;
    const grid = page.locator('.nk-hero__stats--lc');
    const stats = grid.locator('> .nk-hero__stat');
    const boxes = () =>
      stats.evaluateAll((els) =>
        els.map((el) => {
          const r = el.getBoundingClientRect();
          return { top: Math.round(r.top), left: Math.round(r.left), width: Math.round(r.width) };
        }),
      );
    const spill = () => grid.evaluate((el) => el.scrollWidth - el.clientWidth);

    for (const width of [1440, 375]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/lightcone/${lcId}`);
      await expect(stats).toHaveCount(3);
      const b = await boxes();
      expect(new Set(b.map((x) => x.top)).size, `${width}px：三项须同一行`).toBe(1);
      expect(b[1].left, `${width}px：ATK 须在 HP 右侧`).toBeGreaterThan(b[0].left);
      expect(b[2].left, `${width}px：DEF 须在 ATK 右侧`).toBeGreaterThan(b[1].left);
      expect(await spill(), `${width}px：属性网格不得横向溢出`).toBeLessThanOrEqual(1);
      await noUnknownOverflow(page);
    }

    // <360px：三列放不下 → 回落两列，DEF 独占第二行满宽（不得横溢）
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto(`/lightcone/${lcId}`);
    await expect(stats).toHaveCount(3);
    const b = await boxes();
    expect(b[0].top, '320px：HP 与 ATK 同行').toBe(b[1].top);
    expect(b[2].top, '320px：DEF 应落到第二行').toBeGreaterThan(b[0].top);
    expect(b[2].width, '320px：DEF 应满行').toBeGreaterThan((await grid.evaluate((el) => el.clientWidth)) * 0.8);
    expect(await spill(), '320px：属性网格不得横向溢出').toBeLessThanOrEqual(1);
    assertNoErrors();
  });

  // 8bit 等值线：视觉区两层浅 inset 暗角 + 稀有度椭圆晕染（各只有 3.7 / 4.0 每 255 深度却铺满全幅）
  // 与面板 90deg 浅渐变（整幅 8/255）都会塌成色带——前者是「一圈一圈的圆角矩形印记」，
  // 后者是「竖立的条纹」。此处钉住「不再有浅渐变覆层」，像素级外观交用户 RunPreview。
  test('/lightcone：hero 视觉层与信息面板不挂浅渐变覆层（等值线来源）', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    const cones = readJson<Record<string, { id: number }>>('public/data/cn/light_cones.json');
    const lcId = Object.values(cones)[0].id;
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/lightcone/${lcId}`);

    const visual = page.locator('.nk-hero--lc .nk-hero__visual');
    await expect(visual).toHaveCount(1);
    expect(await visual.evaluate((el) => getComputedStyle(el).boxShadow), '视觉区不得有 inset 暗角').toBe('none');
    expect(
      await visual.evaluate((el) => getComputedStyle(el, '::before').backgroundImage),
      '稀有度晕染层不得留渐变',
    ).toBe('none');

    const panel = await page.locator('.nk-hero--lc .nk-hero__panel').evaluate((el) => {
      const cs = getComputedStyle(el);
      return { image: cs.backgroundImage, color: cs.backgroundColor };
    });
    expect(panel.image, '信息面板底必须是纯色，不得是横向渐变').toBe('none');
    expect(panel.color, '纯色底须给出实际颜色而非透明').not.toBe('rgba(0, 0, 0, 0)');
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

    await expectNoSkillsOverflow(page);
    assertNoErrors();
  });
});

test.describe('布局验收：贪饕污染专题页（ADR 0025）', () => {
  test('/voracity：H1、八区块、怪物内链、侧栏前缀性、无溢出', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    // 期望值取自 voracity.json：区块数由数据存在性驱动，关卡→赛季链接逐条同序
    const vor = readJson<{
      activity?: { scores?: number[]; progress_steps?: unknown[]; buff_levels?: unknown[] };
      invasion?: { levels?: unknown[]; stages?: { invasion_id: number; scopes?: { mode: string; season_id: string }[] }[] };
      statuses?: unknown[];
      tutorials?: unknown[];
      affixes?: { name: string }[];
    }>('public/data/cn/voracity.json');
    await page.goto('/voracity');
    // H1 是站点自创页面名（数据里的活动名是「镇伏『贪饕』，汇聚愿力」，不承担页面标题）
    await expect(page.locator('.nk-vor-hero__title')).toHaveText('贪饕污染');
    // 区块数 = 数据存在性驱动的区块数（overview/scores/invasion/stages/statuses/tutorials/affixes）+ 恒在的同形词说明
    const dataDrivenSections = [
      !!vor.activity,
      !!(vor.activity?.scores?.length || vor.activity?.progress_steps?.length),
      !!(vor.invasion?.levels?.length || vor.activity?.buff_levels?.length),
      !!vor.invasion?.stages?.length,
      !!vor.statuses?.length,
      !!vor.tutorials?.length,
      !!vor.affixes?.length,
    ].filter(Boolean).length;
    const secnav = page.locator('.nk-vor-secnav .nk-secnav__btn');
    await expect(secnav).toHaveCount(dataDrivenSections + 1);
    await expect(secnav.first()).toContainText('玩法概览');
    await expect(secnav.last()).toContainText('同形词说明');
    await expect(page.locator('#vor-affixes .nk-vor-affix')).toHaveCount(vor.affixes!.length);
    // 波及关卡的怪物项必须内链到敌人详情（detail_id 非空口径）
    await expect.poll(() => page.locator('.nk-vor-mon__name--link').count()).toBeGreaterThan(0);
    expect(
      await page.locator('.nk-vor-mon__name--link').evaluateAll((els) =>
        els.every((el) => /^\/monster\/\d+$/.test(el.getAttribute('href') || '')),
      ),
    ).toBe(true);
    // 关卡 → 所属终局赛季的闭环（ADR 0026）：链接逐条同序等于数据里的 scopes（同组内按 invasion_id 升序）
    const expectedScopes = [...(vor.invasion?.stages ?? [])]
      .sort((a, b) => a.invasion_id - b.invasion_id)
      .flatMap((s) => s.scopes ?? []);
    expect(expectedScopes.length).toBeGreaterThan(0);
    const scopeHrefs = await page.locator('.nk-vor-scope').evaluateAll((els) =>
      els.map((el) => el.getAttribute('href') || ''),
    );
    expect(scopeHrefs).toEqual(expectedScopes.map((sc) => `/endgame/${sc.mode}/${sc.season_id}`));
    expect(scopeHrefs.every((h) => /^\/endgame\/(maze|story|boss|peak)\/\d+$/.test(h))).toBe(true);
    // 侵蚀等级徽标文案（站点术语「污染等级 N」）与数据里的分组号一致
    const firstInvasionId = Math.min(...(vor.invasion?.stages ?? []).map((s) => s.invasion_id));
    await expect(page.locator('.nk-vor-stgroup__badge').first()).toHaveText(`污染等级 ${firstInvasionId}`);
    // 侧栏：本页为内容板块，锚点可见性仍是规范序前缀（不写死项数）
    const anchors = await collectNavAnchors(page);
    expect(anchors.length).toBeGreaterThan(1);
    const visIdx = anchors.map((a, i) => (a.visible ? i : -1)).filter((i) => i >= 0);
    expect(visIdx).toEqual(Array.from({ length: visIdx.length }, (_, i) => i));
    // 当前板块在侧栏内处于激活态（导航第 8 项入口可达）
    await expect(page.locator('.ui-sidebar a[href="/voracity"]')).toHaveCount(1);
    await noUnknownOverflow(page);
    assertNoErrors();
  });
});
