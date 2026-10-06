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
      /* 分区级入口（与首页同一条原语）：每个分区指向自己的图鉴页，且右缘与内容列右缘齐平——
         它是任何条数下唯一、且不偏袒条目的显式动作（本赛季角色 4 条 / 羁绊 3 条，都不该只特写第一条）。 */
      const entries = await page.locator('.nk-hub-release__section').evaluateAll((els) =>
        els.map((el) => {
          const kind = el.getAttribute('data-kind');
          const a = el.querySelector('.nk-hub-release__all') as HTMLAnchorElement | null;
          const band = el.querySelector('.nk-hub-release__band')!.getBoundingClientRect();
          return {
            kind,
            text: a ? a.textContent.replace(/\s+/g, ' ').trim() : null,
            href: a ? a.getAttribute('href') : null,
            delta: a ? Math.round(band.right - a.getBoundingClientRect().right) : null,
          };
        }),
      );
      expect(entries.map((e) => e.href)).toEqual(kinds.map((k) => `/currency/${k}`));
      for (const e of entries) {
        expect(e.text, `${e.kind}：入口文案应与分区标签同源`).toMatch(/^全部\S+$/);
        expect(Math.abs(e.delta!), `${e.kind}：入口未与内容列右缘齐平`).toBeLessThanOrEqual(1);
      }
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
    // 首屏契约（ADR 0019 决策 11 同步收窄）：标题 + 第一分区标题与首行卡片完整可见；
    // 后续分区随滚动进入，不再钉进首屏。
    await expect(page.locator('.nk-hub-release__title')).toBeVisible();
    await expect(page.locator('.nk-hub-release__section').first()).toBeVisible();
    const marks = await page.locator('.nk-hub-release__section').evaluateAll((els) =>
      els.slice(0, 1).map((el) => ({
        kind: el.getAttribute('data-kind'),
        labelBottom: Math.round(el.querySelector('.nk-hub-release__label')!.getBoundingClientRect().bottom),
        firstCardBottom: Math.round(el.querySelector('.nk-hub-release__band > *')!.getBoundingClientRect().bottom),
      })),
    );
    expect(marks.length).toBeGreaterThanOrEqual(1);
    for (const m of marks) {
      expect(m.labelBottom, `第一分区 ${m.kind} 的标题应在首屏内`).toBeLessThanOrEqual(1080);
      expect(m.firstCardBottom, `第一分区 ${m.kind} 的首行卡片应在首屏内`).toBeLessThanOrEqual(1080);
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

  /* 三态（UI质量验收标准 A4.6）：与首页同一套判据——加载期与「索引没取到」都不许冒充
     「本赛季暂无新增条目」。实测旧行为：加载期整块空白；两份索引全失败时空态文案把一次网络故障
     写成了事实陈述；只失败一份时该分区静默消失。骨架行带 data-sk，就绪后按该族真实卡形占位。 */
  test('/currency：加载期给分区骨架、索引全失败给错误态且可重试，都不冒充空态', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    const INDEXES = '**/data/cn/currency/*.json';
    const isIndex = (url: string) => /(currency\/role|currency\/traits)\.json$/.test(url);

    await page.setViewportSize({ width: 1440, height: 900 });

    // ① 加载期：两份索引各延后 3s
    await page.route(INDEXES, async (route) => {
      if (isIndex(route.request().url())) await new Promise((resolve) => setTimeout(resolve, 3_000));
      await route.continue();
    });
    await page.goto('/currency', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.nk-hub-release__sk')).toBeVisible();
    // 骨架行数 = 分区数（标签来自同一份源，与数据无关）
    await expect(page.locator('.nk-hub-release__sk-row')).toHaveCount(2);
    await expect(page.locator('.nk-hub-release__title')).toHaveText('本赛季新增');
    await expect(page.locator('.nk-hub-release__section')).toHaveCount(0);
    await expect(page.locator('.nk-hub-release__empty')).toHaveCount(0);
    // 骨架卡宽 = 就绪卡宽（A3.5 骨架↔就绪同量级）：竖版角色卡与横排羁绊卡各按带内真卡占位
    const skRole = await page.locator(".nk-hub-release__sk-row[data-sk='role'] .nk-hub-release__sk-card")
      .evaluate((el) => Math.round(el.getBoundingClientRect().width));
    const skTrait = await page.locator(".nk-hub-release__sk-row[data-sk='trait'] .nk-hub-release__sk-card")
      .evaluate((el) => Math.round(el.getBoundingClientRect().width));
    // 数据到位：骨架退场、真实分区上位
    await expect.poll(() => page.locator('.nk-hub-release__section').count(), { timeout: 15_000 }).toBeGreaterThanOrEqual(1);
    await expect(page.locator('.nk-hub-release__sk')).toHaveCount(0);
    const roleCard = await page
      .locator('.nk-hub-release__section[data-kind="role"] .nk-hub-release__band .nk-crole-card')
      .first().evaluate((el) => Math.round(el.getBoundingClientRect().width));
    const traitCard = await page
      .locator('.nk-hub-release__section[data-kind="trait"] .nk-hub-release__band .nk-cw-trait-card')
      .first().evaluate((el) => Math.round(el.getBoundingClientRect().width));
    expect(Math.abs(skRole - roleCard), `角色行骨架卡 ${skRole}px ↔ 就绪卡 ${roleCard}px 应同宽`).toBeLessThanOrEqual(1);
    expect(Math.abs(skTrait - traitCard), `羁绊行骨架卡 ${skTrait}px ↔ 就绪卡 ${traitCard}px 应同宽`).toBeLessThanOrEqual(1);
    await page.unroute(INDEXES);

    // ② 两份索引全失败：错误态 + 重试入口；空态必须缺席
    await page.route(INDEXES, (route) =>
      (isIndex(route.request().url()) ? route.abort() : route.continue()));
    await page.goto('/currency');
    await expect(page.locator('.nk-error-state')).toBeVisible();
    await expect(page.locator('.nk-error-state__retry')).toBeVisible();
    await expect(page.locator('.nk-hub-release__empty')).toHaveCount(0);
    await expect(page.locator('.nk-hub-release__section')).toHaveCount(0);

    // ③ 重试必须真能恢复（共享列表单例失败后重置槽位，故无需刷新页面）
    await page.unroute(INDEXES);
    await page.locator('.nk-error-state__retry').click();
    await expect.poll(() => page.locator('.nk-hub-release__section').count(), { timeout: 15_000 }).toBeGreaterThanOrEqual(1);
    await expect(page.locator('.nk-error-state')).toHaveCount(0);

    await noUnknownOverflow(page);
    assertNoErrors();
  });

  /* 截断复原（A5.5）：羁绊卡描述是**字符串级** 60 字截断（文本以…结束，不产生 CSS 溢出，
     CSS 溢出探针不可见）⇒ 完整原文必须挂在卡根 title 上，触屏没有 hover 也要可复原。
     期望值全部从 traits.json 派生。 */
  test('/currency：羁绊卡描述截断有 title 复原（完整原文可读）', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/currency');
    const section = page.locator('.nk-hub-release__section[data-kind="trait"]');
    await expect(section).toBeVisible();
    const traits = readJson<{ traits: { name: string; simple_desc: string }[] }>('public/data/cn/currency/traits.json').traits;
    // 与渲染器同一归一化管线：字面 `\n`（数据源为两字符）与真实换行都折成空格再收空白
    const normalize = (s: string) => s.replace(/\\n/g, ' ').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    const rows = await section.locator('.nk-cw-trait-card').evaluateAll((cards) =>
      cards.map((c) => ({
        name: (c.querySelector('.nk-cw-trait-card__name')?.textContent || '').trim(),
        desc: (c.querySelector('.nk-cw-trait-card__desc')?.textContent || '').trim(),
        title: c.getAttribute('title') || '',
      })),
    );
    expect(rows.length, '本赛季新增羁绊卡应在带内渲染').toBeGreaterThanOrEqual(1);
    for (const r of rows) {
      const full = normalize(traits.find((t) => t.name === r.name)?.simple_desc || '');
      expect(full, `${r.name}：数据里应有 simple_desc`).toBeTruthy();
      expect(
        r.title.includes(full),
        `${r.name}：卡根 title 必须含完整描述原文（实测 title ${r.title.length} 字 / 全文 ${full.length} 字）`,
      ).toBe(true);
      if (full.length >= 60) {
        expect(r.desc.endsWith('…'), `${r.name}：超 60 字应以…截断`).toBe(true);
        expect(full.startsWith(r.desc.replace(/…$/, '')), `${r.name}：截断前缀必须与全文一致`).toBe(true);
      }
    }
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/currency/settings：单一主题色通道（货币战争不再有自己的色板）', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/currency/settings');
    // meta.cw → <html data-theme="cw">：仅作模式标记，不再重映射任何颜色（ADR 0041）
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'cw');
    // 货币战争专属主题色区块与属性整体退场
    await expect(page.locator('#cw-accent-title')).toHaveCount(0);
    await expect(page.getByRole('listbox', { name: '货币战争主题强调色' })).toHaveCount(0);
    await expect(page.locator('html')).not.toHaveAttribute('data-cw-accent');
    // 全站只剩一个主题色区块（5 个预置色板）
    await expect(page.locator('#accent-title')).toBeVisible();
    await expect(page.getByRole('listbox', { name: '主题强调色' }).locator('button')).toHaveCount(5);
    // 换色走常规通道：同一套强调色在货币战争语境里也生效（页面主色随之改变）
    const terracotta = await resolveTokenColor(page, '--primary', '.nk-settings');
    await page.getByRole('button', { name: /暮山紫/ }).click();
    await expect(page.locator('html')).toHaveAttribute('data-accent', 'iris');
    const iris = await resolveTokenColor(page, '--primary', '.nk-settings');
    expect(iris).not.toBe(terracotta);
    // 进货币战争页复核：主色 = 同一通道解析出的值（证明两模式共用一套配色）
    await page.goto('/currency/role/1001');
    expect(await resolveTokenColor(page, '--primary', '.nk-crole')).toBe(iris);
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
    // 星级分段控件激活态：主色底 + 族内亮端文字（单强调色通道后不再有「浅金底 + 深色字」的补偿，
    // 与同页 `.nk-crole-slot.is-on` 的 --text-bright 口径一致；无渐变/无 glow 的方形控件，直角系）
    const pill = await page.locator('.nk-crole-gm-pill.is-active').first().evaluate((el) => {
      const cs = getComputedStyle(el);
      return { bg: cs.backgroundColor, color: cs.color, radius: cs.borderRadius };
    });
    // 颜色从令牌派生（消费层令牌 → 期望色），不再钉死 rgb 值
    expect(pill.bg).toBe(await resolveTokenColor(page, '--crole-seg-bg', '.nk-crole-gm-pill.is-active'));
    expect(pill.color).toBe(await resolveTokenColor(page, '--crole-seg-text', '.nk-crole-gm-pill.is-active'));
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
    await expect(page.locator('[data-panel="cones"] .nk-slot-empty')).toHaveText('该角色没有专属光锥数据');
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

  /* 羁绊详情：正文阅读列宽 + 区块内容左对齐（UI质量验收标准 A5.1 / A1）
     实测缺陷（2026-10）：① `.nk-ctrait-layer__desc` 无列宽 ⇒ 首行 58.4 全角字（令牌 44em ≈ 44 字）；
     ② `.nk-ctrait-desc` 带 `margin-inline: auto` ⇒ 同一页 3 个区块里它居中、另两个左对齐（盒左缘 484 vs 310）。
     判据取「每行全角字数」与「区块首个内容块与区块标题的盒左缘」——两者都不依赖具体类名或绝对值。 */
  test('/currency/trait/3006：正文阅读列宽 + 区块内容与标题同左缘', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/currency/trait/3006');
    await expect(page.locator('.nk-ctrait-section').first()).toBeVisible();

    const proseMax = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--nk-prose-max').trim(),
    );
    expect(proseMax, '阅读列宽令牌必须按字号缩放（em）；px 定值会让每行字数随字号漂移').toMatch(/em$/);
    const firstLineEm = await page
      .locator('.nk-ctrait-desc, .nk-ctrait-layer__desc')
      .evaluateAll((els) =>
        els.map((el) => {
          const textNode = [...el.childNodes].find(
            (n) => n.nodeType === 3 && (n.textContent ?? '').trim().length > 30,
          );
          if (!textNode) return 0;
          const range = document.createRange();
          range.selectNodeContents(textNode);
          const rects = [...range.getClientRects()];
          if (!rects.length) return 0;
          return rects[0].width / parseFloat(getComputedStyle(el).fontSize);
        }),
      );
    expect(firstLineEm.length, '应有可测量的正文块').toBeGreaterThan(0);
    for (const em of firstLineEm) {
      expect(em, `羁绊正文每行不得超过令牌列宽（+2 容差）全角字，实测 ${em.toFixed(1)}`)
        .toBeLessThanOrEqual(parseFloat(proseMax) + 2);
    }

    // 盒左缘而非文字左缘：区块标题自带 12px 内距 + 3px 边线，用文字对齐会假红。
    const misaligned = await page.evaluate(() =>
      [...document.querySelectorAll('.nk-ctrait-section')]
        .map((section) => {
          const title = section.querySelector('.nk-ctrait-section__title');
          const first = title?.nextElementSibling;
          if (!title || !first) return null;
          return {
            title: (title.textContent ?? '').trim().slice(0, 10),
            delta: Math.round(first.getBoundingClientRect().left - title.getBoundingClientRect().left),
          };
        })
        .filter((row): row is { title: string; delta: number } => row !== null)
        .filter((row) => Math.abs(row.delta) > 1),
    );
    expect(misaligned, '区块内容必须与区块标题同左缘（内容块不得居中）').toEqual([]);

    await noUnknownOverflow(page);
    assertNoErrors();
  });
});
