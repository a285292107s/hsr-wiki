import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { collectConsoleIssues, readJson, resolveTokenColor } from './helpers';
import { noUnknownOverflow } from './layout.shared';

/**
 * 布局验收：货币战争主题 —— layout 验收层（语义契约 + 数值规格）分文件之一。
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
