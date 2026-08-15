import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { collectConsoleIssues, findHorizontalOverflow, waitForCatalogCards } from './helpers';

/**
 * 布局验收（AGENTS.md T1b/T2 的自动化落地）
 *
 * 覆盖四类关键页面：
 * - /          常规首页（hero + 导航行）
 * - /character 目录页（虚拟滚动网格，卡片模板字符串渲染）
 * - /endgame   终局合并单页
 * - /currency  货币战争 Hub（meta.cw → <html data-theme="cw"> 主题）
 * - /currency/settings  货币战争设置（CW 主题色选择 → <html data-cw-accent>）
 *
 * 每页统一断言：无未捕获 JS 异常 + 无横向溢出 + 关键结构存在。
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
    expect(await findHorizontalOverflow(page)).toEqual([]);
    assertNoErrors();
  });

  test('角色图鉴 /character：卡片渲染、筛选工具条、无溢出', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/character');
    await waitForCatalogCards(page);
    const cardCount = await page.locator('[class$="-grid"] a').count();
    expect(cardCount).toBeGreaterThan(0);
    // 工具条存在（搜索 + 筛选下拉）
    await expect(page.locator('.nk-cat-toolbar').first()).toBeVisible();
    expect(await findHorizontalOverflow(page)).toEqual([]);
    assertNoErrors();
  });

  test('角色图鉴 /character：手机断点行式卡（圆头像、单列、无溢出）', async ({ page }) => {
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
    expect(await findHorizontalOverflow(page)).toEqual([]);
    assertNoErrors();
  });
});

test.describe('布局验收：终局合并单页', () => {
  test('/endgame：四模式筛选、卡片渲染、无溢出', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/endgame');
    await waitForCatalogCards(page);
    const cardCount = await page.locator('[class$="-grid"] a').count();
    expect(cardCount).toBeGreaterThan(0);
    expect(await findHorizontalOverflow(page)).toEqual([]);
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
    expect(await findHorizontalOverflow(page)).toEqual([]);
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
    expect(await findHorizontalOverflow(page)).toEqual([]);
    assertNoErrors();
  });

  test('/currency/role/1001：名册扉页 Hero、星级切换、无溢出', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    // 绕开 dev public 索引缓存（rolldown-vite 8 运行期新增文件未入索引，本机 5173 旧实例）：
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
    // 技能图标：jsDelivr 官方镜像优先 + nanoka 兜底属性（v4 数据链路签名）
    const icon = page.locator('.nk-crole-skill__icon').first();
    await expect(icon).toBeVisible();
    await expect(icon).toHaveAttribute('src', /cdn\.jsdelivr\.net\/gh\/a285292107s\/StarRailTextures@main\/assets\/asbres\/spriteoutput\/skillicons\/avatar\/1001\/SkillIcon_1001_BP\.png/);
    await expect(icon).toHaveAttribute('data-cdn-fallback', /static\.nanoka\.cc\/assets\/hsr\/skillicons\/SkillIcon_1001_BP\.webp/);
    // 属性图标：矩阵行（基础前台强度 → IconFrontRow，jsDelivr 目录小写规则）
    const gmIcon = page.locator('.nk-crole-gm__label', { hasText: '基础前台强度' }).first().locator('.nk-crole-gm__icon');
    await expect(gmIcon).toBeVisible();
    await expect(gmIcon).toHaveAttribute('src', /spriteoutput\/gridfight\/attributeicon\/normalicon\/IconFrontRow\.png/);
    // 星魂展示图：常规模式同源 ui/ui3d/rank（jsDelivr 优先 + nanoka 兜底属性）
    const rankIcon = page.locator('.nk-crole-timeline__icon img').first();
    await expect(rankIcon).toBeVisible();
    await expect(rankIcon).toHaveAttribute('src', /ui\/ui3d\/rank\/_dependencies\/textures\/1001\/1001_Rank_1\.png/);
    await expect(rankIcon).toHaveAttribute('data-cdn-fallback', /static\.nanoka\.cc\/assets\/hsr\/rank\/_dependencies\/textures\/1001\/1001_Rank_1\.webp/);
    // 无内容区块：1001 无专属光锥 → 面板常驻 + 空态提示
    await expect(page.locator('[data-panel="cones"] .nk-crole-empty')).toHaveText('该角色没有专属光锥数据');
    expect(await findHorizontalOverflow(page)).toEqual([]);
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
    await expect(cone.locator('.nk-crole-cone__icon')).toHaveAttribute('src', /lightconemediumicon\/23000\.png/);
    // 等级递进列表保留（5 级）
    await expect(page.locator('[data-panel="cones"] .nk-crole-equip')).toHaveCount(5);
    expect(await findHorizontalOverflow(page)).toEqual([]);
    assertNoErrors();
  });

  test('/currency/role/1001 手机断点：方块星级切换、矩阵横向滚动、无溢出', async ({ page }) => {
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
    expect(await findHorizontalOverflow(page)).toEqual([]);
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
    expect(await findHorizontalOverflow(page)).toEqual([]);
    assertNoErrors();
  });

  test('/character/1001 手机断点：配队标头渲染、队间距 16px、无溢出', async ({ page }) => {
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
    expect(await findHorizontalOverflow(page)).toEqual([]);
    assertNoErrors();
  });
});
