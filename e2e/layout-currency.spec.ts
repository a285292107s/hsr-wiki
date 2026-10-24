import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { collectConsoleIssues, readJson, resolveTokenColor } from './helpers';
import { noUnknownOverflow } from './layout.shared';

test.describe('布局验收：货币战争主题', () => {
  const CURRENCY_INDEXES = '**/data/cn/currency/*.json';
  const isSeasonIndex = (url: string): boolean => /(currency\/role|currency\/traits)\.json$/.test(url);

  const normalizeDesc = (s: string): string =>
    s.replace(/\\n/g, ' ').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

  test('/currency：赛季账头计数 = 分区卡数、两分区结构与入口对齐、无溢出', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/currency');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'cw');
    await expect(page.locator('main.nk-hub-release')).toBeVisible();
    await expect(page.locator('.nk-hub-masthead__title')).toBeVisible();
    await expect(page.locator('.nk-hub-release__title')).toHaveText('本赛季新增');
    await expect(page.locator('.nk-cwseas__head .nk-hub-release__rule')).toHaveCount(1);
    await expect(page.locator('.nk-hub-release__section[data-kind="role"] a.nk-cwrole').first()).toBeVisible();

    const kinds = await page
      .locator('.nk-hub-release__section')
      .evaluateAll((els) => els.map((el) => el.getAttribute('data-kind')));
    expect(kinds, '分区顺序固定为角色 → 羁绊').toEqual(['role', 'trait']);

    const roleCards = page.locator('.nk-hub-release__section[data-kind="role"] ul.nk-cwseas__roster a.nk-cwrole');
    const traitCards = page.locator('.nk-hub-release__section[data-kind="trait"] ul.nk-cwseas__traits a.nkcwtrait');
    const roleCount = await roleCards.count();
    const traitCount = await traitCards.count();
    expect(roleCount, '本赛季应至少有一名新增角色').toBeGreaterThan(0);
    expect(traitCount, '本赛季应至少有一条新增羁绊').toBeGreaterThan(0);

    const figures = await page.locator('.nk-cwseas__figure').evaluateAll((els) =>
      els.map((el) => ({
        label: (el.querySelector('.nk-cwseas__figure-label')?.textContent ?? '').trim(),
        value: Number((el.querySelector('.nk-cwseas__figure-value')?.textContent ?? '').trim()),
      })),
    );
    expect(figures.map((f) => f.label), '两个账头依次是角色 / 羁绊').toEqual(['角色', '羁绊']);
    expect(figures.map((f) => f.value), '账头数字必须是本赛季新增卡数').toEqual([roleCount, traitCount]);

    const labelCounts = await page.locator('.nk-hub-release__section').evaluateAll((els) =>
      els.map((el) => Number((el.querySelector('.nk-hub-release__label-count')?.textContent ?? '').trim())),
    );
    expect(labelCounts, '分区头计数与账头同源').toEqual([roleCount, traitCount]);

    const roleHrefs = await roleCards.evaluateAll((els) => els.map((el) => el.getAttribute('href') ?? ''));
    expect(
      roleHrefs.every((h) => /\/currency\/role\/\d+$/.test(h)),
      `角色卡 href 应指向角色详情，实测 ${roleHrefs.join(', ')}`,
    ).toBe(true);
    const traitHrefs = await traitCards.evaluateAll((els) => els.map((el) => el.getAttribute('href') ?? ''));
    expect(
      traitHrefs.every((h) => /\/currency\/trait\/\d+$/.test(h)),
      `羁绊卡 href 应指向羁绊详情，实测 ${traitHrefs.join(', ')}`,
    ).toBe(true);

    const cats = await traitCards.evaluateAll((els) =>
      els.map((el) => ({
        root: el.getAttribute('data-cat'),
        badge: (el.querySelector('.nkcwtrait__cat')?.textContent ?? '').trim(),
      })),
    );
    for (const c of cats) {
      expect(['faction', 'combat', 'special'], `羁绊卡 data-cat 应为已知类别，实测 ${c.root}`).toContain(c.root);
      expect(c.badge, '羁绊类别徽标不得为空').not.toBe('');
    }

    const entries = await page.locator('.nk-hub-release__section').evaluateAll((els) =>
      els.map((el) => {
        const a = el.querySelector('.nk-hub-release__all');
        const grid = el.querySelector('.nk-cwseas__roster, .nk-cwseas__traits');
        return {
          kind: el.getAttribute('data-kind'),
          text: a ? (a.textContent ?? '').replace(/\s+/g, ' ').trim() : null,
          href: a ? a.getAttribute('href') : null,
          delta: a && grid ? Math.round(grid.getBoundingClientRect().right - a.getBoundingClientRect().right) : null,
        };
      }),
    );
    expect(entries.map((e) => e.href)).toEqual(['/currency/role', '/currency/trait']);
    for (const e of entries) {
      expect(e.text ?? '', `${e.kind}：入口文案应与分区标签同源`).toMatch(/^全部\S+$/);
      expect(Math.abs(e.delta!), `${e.kind}：入口未与内容列右缘齐平（差 ${e.delta}px）`).toBeLessThanOrEqual(1);
    }

    const holds = await page.locator('.nk-cwseas__hold').evaluateAll((els) =>
      els.map((el) => ({
        href: el.getAttribute('href'),
        num: Number((el.querySelector('.nk-cwseas__hold-num')?.textContent ?? '').trim()),
      })),
    );
    expect(holds, '页脚档案存量恰两条（角色 / 羁绊）').toHaveLength(2);
    expect(holds.map((h) => h.href)).toEqual(['/currency/role', '/currency/trait']);
    expect(holds[0].num, '档案存量是全量档案数，不得小于新增数').toBeGreaterThanOrEqual(roleCount);
    expect(holds[1].num, '档案存量是全量档案数，不得小于新增数').toBeGreaterThanOrEqual(traitCount);
    await expect(page.locator('.nk-cwseas__holds-label')).toHaveText('档案存量');

    const traitData = readJson<{ traits: { id: number; name: string; layers: unknown[] }[] }>(
      'public/data/cn/currency/traits.json',
    ).traits;
    const roleData = readJson<{ roles: { id: number; name: string; traits: { id: number }[] }[] }>(
      'public/data/cn/currency/role.json',
    ).roles;
    const traitRows = await traitCards.evaluateAll((els) =>
      els.map((el) => ({
        name: (el.querySelector('.nkcwtrait__name')?.textContent ?? '').trim(),
        carriers: (el.querySelector('.nkcwtrait__carriers')?.textContent ?? '').replace(/\s+/g, ' ').trim(),
        layers: (el.querySelector('.nkcwtrait__layers')?.textContent ?? '').replace(/\s+/g, ' ').trim(),
      })),
    );
    for (const row of traitRows) {
      const trait = traitData.find((t) => t.name === row.name);
      expect(trait, `${row.name}：应能在 currency/traits.json 里按名字定位`).toBeTruthy();
      const holders = roleData
        .filter((r) => r.traits.some((t) => t.id === trait!.id))
        .map((r) => r.name);
      const expectedCarriers = holders.length ? `关联角色：${holders.join(' · ')}` : '';
      expect(row.carriers, `${row.name}：关联角色行应列出持有该羁绊的全部角色`).toBe(expectedCarriers);
      expect(row.layers, `${row.name}：层数文案应与数据层数一致`).toBe(
        trait!.layers.length ? `${trait!.layers.length}层` : '',
      );
    }

    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/currency：1920×1080 首屏内可见本赛季新增（ADR 0020 核心验收）', { tag: ['@visual-detail', '@viewport-pinned'] }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/currency');
    await expect(page.locator('.nk-hub-masthead__title')).toBeVisible();
    const mastheadH = await page.locator('.nk-hub-masthead').evaluate((el) =>
      Math.round(el.getBoundingClientRect().height),
    );
    expect(mastheadH, '报头不得高过 120px').toBeLessThanOrEqual(120);
    await expect(page.locator('.nk-hub-release__title')).toBeVisible();
    const first = page.locator('.nk-hub-release__section[data-kind="role"] a.nk-cwrole').first();
    await expect(first).toBeVisible();
    const mark = await first.evaluate((el) => ({
      bottom: Math.round(el.getBoundingClientRect().bottom),
      artTop: Math.round(el.querySelector('.nk-cwrole__art')!.getBoundingClientRect().top),
    }));
    expect(mark.artTop, '首张角色卡（立绘顶边）应落在首屏内').toBeLessThanOrEqual(1080);
    expect(mark.bottom, '首张角色卡底边应落在首屏内').toBeLessThanOrEqual(1080);
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/currency：本赛季无新增时只显示一行空态（ADR 0020 决策 6）', { tag: ['@visual-detail', '@viewport-pinned'] }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
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
    await expect(page.locator('.nk-cwseas__figures'), '空态不显示「0 角色 / 0 羁绊」账头').toHaveCount(0);
    const holds = await page.locator('.nk-cwseas__hold').evaluateAll((els) =>
      els.map((el) => ({
        href: el.getAttribute('href'),
        num: Number((el.querySelector('.nk-cwseas__hold-num')?.textContent ?? '').trim()),
      })),
    );
    const archiveTotals = [
      readJson<{ roles: unknown[] }>('public/data/cn/currency/role.json').roles.length,
      readJson<{ traits: unknown[] }>('public/data/cn/currency/traits.json').traits.length,
    ];
    expect(holds, '档案存量是页面级全量入口，空态仍保留两条').toHaveLength(2);
    expect(holds.map((h) => h.href)).toEqual(['/currency/role', '/currency/trait']);
    expect(holds.map((h) => h.num), '空态档案存量仍是全量档案数，不随本赛季新增归零').toEqual(archiveTotals);
    await expect(page.locator('.nk-cwseas__holds-label')).toHaveText('档案存量');
    await expect(page.locator('.nk-hub-masthead__title')).toBeVisible();
    await expect(page.locator('.nk-hub-footer')).toHaveCount(1);
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/currency：加载期给两行骨架、索引全失败给错误态且可重试，都不冒充空态', { tag: ['@visual-detail', '@viewport-pinned'] }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 1440, height: 900 });

    await page.route(CURRENCY_INDEXES, async (route) => {
      if (isSeasonIndex(route.request().url())) await new Promise((resolve) => setTimeout(resolve, 3_000));
      await route.continue();
    });
    await page.goto('/currency', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.nk-hub-release__sk')).toBeVisible();
    await expect(page.locator('.nk-cwseas__sk-role')).toHaveCount(4);
    await expect(page.locator('.nk-cwseas__sk-trait')).toHaveCount(3);
    await expect(page.locator('[data-sk="role"]')).toHaveCount(1);
    await expect(page.locator('[data-sk="trait"]')).toHaveCount(1);
    await expect(page.locator('.nk-hub-release__title')).toHaveText('本赛季新增');
    await expect(page.locator('.nk-hub-release__section[data-kind]')).toHaveCount(0);
    await expect(page.locator('.nk-hub-release__empty')).toHaveCount(0);
    const skRole = await page.locator('.nk-cwseas__sk-role').first()
      .evaluate((el) => Math.round(el.getBoundingClientRect().width));
    const skTrait = await page.locator('.nk-cwseas__sk-trait').first()
      .evaluate((el) => Math.round(el.getBoundingClientRect().width));
    await expect.poll(() => page.locator('.nk-hub-release__section').count(), { timeout: 15_000 }).toBeGreaterThanOrEqual(1);
    await expect(page.locator('.nk-hub-release__sk')).toHaveCount(0);
    const roleCard = await page
      .locator('.nk-hub-release__section[data-kind="role"] a.nk-cwrole')
      .first().evaluate((el) => Math.round(el.getBoundingClientRect().width));
    const traitCard = await page
      .locator('.nk-hub-release__section[data-kind="trait"] a.nkcwtrait')
      .first().evaluate((el) => Math.round(el.getBoundingClientRect().width));
    expect(Math.abs(skRole - roleCard), `角色骨架卡 ${skRole}px ↔ 就绪卡 ${roleCard}px 应同宽`).toBeLessThanOrEqual(1);
    expect(Math.abs(skTrait - traitCard), `羁绊骨架卡 ${skTrait}px ↔ 就绪卡 ${traitCard}px 应同宽`).toBeLessThanOrEqual(1);
    await page.unroute(CURRENCY_INDEXES);

    await page.route(CURRENCY_INDEXES, (route) =>
      (isSeasonIndex(route.request().url()) ? route.abort() : route.continue()));
    await page.goto('/currency');
    await expect(page.locator('.nk-error-state')).toBeVisible();
    await expect(page.locator('.nk-error-state__retry')).toBeVisible();
    await expect(page.locator('.nk-hub-release__empty')).toHaveCount(0);
    await expect(page.locator('.nk-hub-release__section')).toHaveCount(0);

    await page.unroute(CURRENCY_INDEXES);
    await page.locator('.nk-error-state__retry').click();
    await expect.poll(() => page.locator('.nk-hub-release__section').count(), { timeout: 15_000 }).toBeGreaterThanOrEqual(1);
    await expect(page.locator('.nk-error-state')).toHaveCount(0);

    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/currency：羁绊卡根 title 与卡内正文都是完整 simple_desc（截断只由 CSS 负责）', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/currency');
    const section = page.locator('.nk-hub-release__section[data-kind="trait"]');
    await expect(section).toBeVisible();
    const traits = readJson<{ traits: { name: string; simple_desc: string }[] }>(
      'public/data/cn/currency/traits.json',
    ).traits;
    const rows = await section.locator('a.nkcwtrait').evaluateAll((cards) =>
      cards.map((c) => ({
        name: (c.querySelector('.nkcwtrait__name')?.textContent ?? '').trim(),
        desc: (c.querySelector('.nkcwtrait__desc')?.textContent ?? '').trim(),
        title: c.getAttribute('title') ?? '',
      })),
    );
    expect(rows.length, '本赛季新增羁绊卡应在带内渲染').toBeGreaterThanOrEqual(1);
    for (const r of rows) {
      const full = normalizeDesc(traits.find((t) => t.name === r.name)?.simple_desc ?? '');
      expect(full, `${r.name}：数据里应有 simple_desc`).toBeTruthy();
      expect(
        r.title.includes(full),
        `${r.name}：卡根 title 必须含完整描述原文（实测 title ${r.title.length} 字 / 全文 ${full.length} 字）`,
      ).toBe(true);
      expect(r.desc, `${r.name}：卡内正文必须与全文逐字一致（视觉截断不得改写文本）`).toBe(full);
      expect(r.desc.endsWith('…'), `${r.name}：截断应由 CSS 行数钳制负责，正文不得带省略号`).toBe(false);
    }
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/currency：羁绊卡与角色卡交叉高亮（鼠标进入 / 键盘聚焦，离开归零）', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/currency');
    await expect(page.locator('a.nkcwtrait').first()).toBeVisible();

    const traitData = readJson<{ traits: { id: number; name: string; is_season_new?: boolean }[] }>(
      'public/data/cn/currency/traits.json',
    ).traits;
    const roleData = readJson<{
      roles: { id: number; name: string; is_season_new?: boolean; traits: { id: number; name: string }[] }[];
    }>('public/data/cn/currency/role.json').roles;
    const newRoles = roleData.filter((r) => r.is_season_new === true);
    const newTraitIds = new Set(traitData.filter((t) => t.is_season_new === true).map((t) => t.id));
    expect(newRoles.length, '应有本赛季新增角色').toBeGreaterThan(0);

    const newRoleIds = new Set(newRoles.map((r) => r.id));
    const renderedHolders = (traitId: number): number[] =>
      roleData.filter((r) => r.traits.some((t) => t.id === traitId) && newRoleIds.has(r.id)).map((r) => r.id);
    let target = newRoles[0].traits.filter((t) => newTraitIds.has(t.id))[0];
    for (const trait of traitData.filter((t) => t.is_season_new === true)) {
      if (renderedHolders(trait.id).length > renderedHolders(target.id).length) target = trait;
    }
    const expectedHolders = renderedHolders(target.id);
    expect(expectedHolders.length, `${target.name}：应至少有一名本赛季新增角色持有该羁绊（否则无法验证交叉高亮）`)
      .toBeGreaterThan(0);
    const expectedHrefs = expectedHolders.map((id) => `/currency/role/${id}`);

    const traitCard = page.locator('a.nkcwtrait').filter({ hasText: target.name }).first();
    await traitCard.scrollIntoViewIfNeeded();
    await traitCard.hover();
    const hlHrefs = await page.locator('a.nk-cwrole[data-hl]').evaluateAll((els) =>
      els.map((el) => el.getAttribute('href') ?? ''),
    );
    expect(hlHrefs, `${target.name}：持有该羁绊的角色卡应被高亮`).toEqual(expectedHrefs);
    const hlChips = await page.locator('.nk-cwrole__trait[data-hl]').evaluateAll((els) =>
      els.map((el) => (el.getAttribute('title') ?? el.textContent ?? '').trim()),
    );
    expect(hlChips, '每张被高亮的角色卡上，该羁绊 chip 也应被高亮').toHaveLength(expectedHolders.length);
    for (const title of hlChips) expect(title).toContain(target.name);

    await page.mouse.move(0, 0);
    await expect(page.locator('[data-hl]')).toHaveCount(0);

    const firstNewTraitNames = newRoles[0].traits.filter((t) => newTraitIds.has(t.id)).map((t) => t.name);
    expect(firstNewTraitNames.length, '首张角色卡应至少带一枚本赛季新增羁绊 chip').toBeGreaterThan(0);
    await page.locator('a.nk-cwrole').first().focus();
    await expect(page.locator('a.nkcwtrait[data-hl]')).toHaveCount(firstNewTraitNames.length);
    const focusedTraitNames = (await page.locator('a.nkcwtrait[data-hl] .nkcwtrait__name').allTextContents())
      .map((s) => s.trim())
      .sort();
    expect(focusedTraitNames, '聚焦角色卡时，高亮的应恰是它的新增羁绊卡').toEqual([...firstNewTraitNames].sort());

    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/currency/settings：单一主题色通道（货币战争不再有自己的色板）', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/currency/settings');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'cw');
    await expect(page.locator('#cw-accent-title')).toHaveCount(0);
    await expect(page.getByRole('listbox', { name: '货币战争主题强调色' })).toHaveCount(0);
    await expect(page.locator('html')).not.toHaveAttribute('data-cw-accent');
    await expect(page.locator('#accent-title')).toBeVisible();
    await expect(page.getByRole('listbox', { name: '主题强调色' }).locator('button')).toHaveCount(5);
    const terracotta = await resolveTokenColor(page, '--primary', '.nk-settings');
    await page.getByRole('button', { name: /暮山紫/ }).click();
    await expect(page.locator('html')).toHaveAttribute('data-accent', 'iris');
    const iris = await resolveTokenColor(page, '--primary', '.nk-settings');
    expect(iris).not.toBe(terracotta);
    await page.goto('/currency/role/1001');
    expect(await resolveTokenColor(page, '--primary', '.nk-crole')).toBe(iris);
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/currency/role/1001：名册扉页 Hero、星级切换、无溢出', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.route('**/data/cn/currency/prop_icons.json', (route) =>
      route.fulfill({ contentType: 'application/json', body: readFileSync('public/data/cn/currency/prop_icons.json', 'utf8') }),
    );
    await page.goto('/currency/role/1001');
    const role1001 = readJson<{ roles: { id: number; name: string }[] }>('public/data/cn/currency/role.json')
      .roles.find((r) => r.id === 1001);
    expect(role1001, 'currency/role.json 应含角色 1001').toBeTruthy();
    await expect(page.locator('.nk-crole-hero__name')).toHaveText(role1001!.name);
    await expect(page.locator('.nk-crole-hero__id')).toHaveText(`NO.${role1001!.id}`);
    const labels = await page.locator('.nk-crole-bar .nk-secnav__btn').allTextContents();
    expect(labels.map((t) => t.replace(/\s+/g, ''))).toEqual(['成长总览', '技能详情', '后台星魂', '专属光锥', '推荐装备']);
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
    const pill = await page.locator('.nk-crole-gm-pill.is-active').first().evaluate((el) => {
      const cs = getComputedStyle(el);
      return { bg: cs.backgroundColor, color: cs.color, radius: cs.borderRadius };
    });
    expect(pill.bg).toBe(await resolveTokenColor(page, '--crole-seg-bg', '.nk-crole-gm-pill.is-active'));
    expect(pill.color).toBe(await resolveTokenColor(page, '--crole-seg-text', '.nk-crole-gm-pill.is-active'));
    const starRadius = await page.locator('.nk-crole-skill__star').first()
      .evaluate((el) => getComputedStyle(el).borderRadius);
    expect(pill.radius, '同页方形控件圆角必须同档').toBe(starRadius);
    const pillBox = await page.locator('.nk-crole-gm-pill.is-active').first().boundingBox();
    expect(parseFloat(pill.radius)).toBeGreaterThan(0);
    expect(parseFloat(pill.radius)).toBeLessThan(pillBox!.height / 2);
    await expect(page.locator('.nk-crole-gm__table')).toBeVisible();
    await expect(page.locator('.nk-crole-skill').first()).toBeVisible();
    const icon = page.locator('.nk-crole-skill__icon').first();
    await expect(icon).toBeVisible();
    await expect(icon).toHaveAttribute('src', /\/skillicons\/SkillIcon_1001_BP\.webp$/);
    await expect(icon).toHaveAttribute('data-cdn-fallback', /\/skillicons\/SkillIcon_1001_BP\.webp$/);
    const gmIcon = page.locator('.nk-crole-gm__label', { hasText: '基础前台强度' }).first().locator('.nk-crole-gm__icon');
    await expect(gmIcon).toBeVisible();
    await expect(gmIcon).toHaveAttribute('src', /spriteoutput\/gridfight\/attributeicon\/normalicon\/IconFrontRow\.png/);
    const rankIcon = page.locator('.nk-crole-timeline__icon img').first();
    await expect(rankIcon).toBeVisible();
    await expect(rankIcon).toHaveAttribute('src', /\/rank\/1001\/1001_Rank_1\.webp$/);
    await expect(rankIcon).toHaveAttribute('data-cdn-fallback', /\/rank\/_dependencies\/textures\/1001\/1001_Rank_1\.webp$/);
    await expect(page.locator('[data-panel="cones"] .nk-slot-empty')).toHaveText('该角色没有专属光锥数据');
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/currency/role/1003：专属光锥本体卡（EquipmentID → 常规光锥表）', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
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
    const cone = page.locator('.nk-crole-cone');
    await expect(cone).toBeVisible();
    await expect(cone.locator('.nk-crole-cone__name')).toHaveText(coneData!.name);
    await expect(cone.locator('.nk-crole-cone__rarity')).toHaveText('★'.repeat(coneData!.rarity));
    await expect(cone.locator('.nk-crole-cone__path')).toHaveText(pathName!);
    await expect(cone.locator('.nk-crole-cone__icon'))
      .toHaveAttribute('src', new RegExp(`/lightconemediumicon/${coneData!.id}\\.webp$`));
    await expect(page.locator('[data-panel="cones"] .nk-crole-equip')).toHaveCount(5);
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/currency/role/1001 手机断点：方块星级切换、矩阵横向滚动、无溢出', { tag: ['@visual-detail', '@viewport-pinned'] }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/currency/role/1001');
    await expect(page.locator('.nk-crole-hero__name')).toBeVisible();
    await expect(page.locator('.nk-crole-hero__role .nk-crole-slot--role').first()).toHaveText('后台');
    const roleText = await page.locator('.nk-crole-hero__role').innerText();
    expect(roleText.trim()).toMatch(/^后台/);
    await expect(page.locator('[data-panel="stars"] .nk-crole-hero__role, [data-panel="stars"] .nk-crole-oneliner')).toHaveCount(0);
    const mobilePillRadius = await page.locator('.nk-crole-gm-pill').first()
      .evaluate((el) => getComputedStyle(el).borderRadius);
    const starBox = await page.locator('.nk-crole-skill__star.is-on').first().boundingBox();
    const star = await page.locator('.nk-crole-skill__star.is-on').first().evaluate((el) =>
      getComputedStyle(el).borderRadius,
    );
    expect(star, '同页方形控件圆角必须同档').toBe(mobilePillRadius);
    expect(parseFloat(star)).toBeGreaterThan(0);
    expect(parseFloat(star)).toBeLessThan(starBox!.height / 2);
    const colsBefore = await page.locator('.nk-crole-gm__table thead th').evaluateAll((els) =>
      els.map((el) => Math.round(el.getBoundingClientRect().width)),
    );
    await page.locator('.nk-crole-gm-pill', { hasText: '2★' }).click();
    await expect(page.locator('.nk-crole-gm-pill.is-active')).toHaveText('2★');
    const colsAfter = await page.locator('.nk-crole-gm__table thead th').evaluateAll((els) =>
      els.map((el) => Math.round(el.getBoundingClientRect().width)),
    );
    expect(colsAfter).toEqual(colsBefore);
    await expect(page.locator('.nk-crole-hero__role')).toHaveText(roleText);
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/currency/trait/3006：正文阅读列宽 + 区块内容与标题同左缘', { tag: '@visual-detail' }, async ({ page }) => {
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
