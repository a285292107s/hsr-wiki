import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { collectConsoleIssues, readJson, resolveTokenColor } from './helpers';
import { noUnknownOverflow } from './layout.shared';

test.describe('布局验收：货币战争主题', () => {
  const CURRENCY_INDEXES = '**/data/cn/currency/*.json';
  const isSeasonIndex = (url: string): boolean => /(currency\/role|currency\/traits)\.json$/.test(url);

  const normalizeDesc = (s: string): string =>
    s.replace(/\\n/g, ' ').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

  const traitIdOfHref = (href: string): number => Number((href.match(/\/currency\/trait\/(\d+)$/) ?? [])[1]);

  const traitCardHref = (id: number): string => `/currency/trait/${id}`;

  test('/currency：四幕结构、账头与数据同源、四件套三点', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/currency');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'cw');
    await expect(page.locator('main.nk-cwsc')).toBeVisible();
    await expect(page.locator('.nk-hub-masthead__title')).toBeVisible();
    await expect(page.locator('.nk-cwsc-act')).toHaveCount(4);

    const acts = await page.locator('.nk-cwsc-act').evaluateAll((els) =>
      els.map((el) => el.getAttribute('data-act')),
    );
    expect(acts, '长卷固定四幕：启幕 → 板块 → 名册 → 账房').toEqual(['premiere', 'traits', 'roles', 'ledger']);

    const roleDb = readJson<{
      season?: { id: number | null };
      roles: { id: number; name: string; avatar_id: number; rarity: number; season_ids: number[]; is_season_new?: boolean; traits: { id: number }[] }[];
    }>('public/data/cn/currency/role.json');
    const traitDb = readJson<{
      season?: { id: number | null };
      traits: {
        id: number; name: string; cat: string; simple_desc: string; season_id: number; is_season_new?: boolean;
        package?: { invite: number | null; stock: number | null; badge: number | null };
      }[];
    }>('public/data/cn/currency/traits.json');
    const seasonId = roleDb.season?.id ?? null;
    const roleData = roleDb.roles;
    const traitData = traitDb.traits;
    const roleS2 = seasonId == null ? roleData : roleData.filter((role) => role.season_ids.includes(seasonId));
    const traitS2 = seasonId == null ? traitData : traitData.filter((trait) => trait.season_id === seasonId);
    const newRoles = roleData.filter((role) => role.is_season_new === true);
    const newTraits = traitData.filter((trait) => trait.is_season_new === true);

    const figures = await page.locator('.nk-cwsc-figure__num').evaluateAll((els) =>
      els.map((el) => (el.textContent ?? '').replace(/\s+/g, '').trim()),
    );
    expect(figures, '账头两个数是「本季新增 / 本赛季全量」').toEqual([
      `${newRoles.length}/${roleS2.length}`,
      `${newTraits.length}/${traitS2.length}`,
    ]);

    const catRows = await page.locator('.nk-cwsc-traits__col').evaluateAll((els) =>
      els.map((el) => ({
        cat: el.getAttribute('data-cat'),
        rows: [...el.querySelectorAll('a.nk-cwsc-trait')].map((a) => ({
          no: (a.querySelector('.nk-cwsc-trait__no')?.textContent ?? '').trim(),
          href: a.getAttribute('href') ?? '',
          title: a.getAttribute('title') ?? '',
          dots: a.querySelectorAll('.nk-cwsc-pkg__slot').length,
          on: a.querySelectorAll('.nk-cwsc-pkg__slot[data-on]').length,
        })),
      })),
    );
    expect(catRows.map((row) => row.cat), '板块按阵营 / 流派 / 特殊三列').toEqual(['faction', 'combat', 'special']);
    for (const column of catRows) {
      const expected = newTraits.filter((trait) => trait.cat === column.cat);
      expect(column.rows.length, `${column.cat} 列行数应等于该类别的新增羁绊数`).toBe(expected.length);
      expect(column.rows.map((row) => row.no), `${column.cat} 列按类别内序号编号`).toEqual(
        expected.map((_, index) => String(index + 1).padStart(2, '0')),
      );
      for (const [index, row] of column.rows.entries()) {
        const trait = expected[index]!;
        expect(row.href, `${trait.name}：行应指向羁绊详情`).toBe(`/currency/trait/${trait.id}`);
        expect(row.title.startsWith(`${trait.name}：`), `${trait.name}：行 title 应以名称为前缀`).toBe(true);
        expect(row.dots, `${trait.name}：四件套固定三格`).toBe(3);
        const pkg = trait.package ?? { invite: null, stock: null, badge: null };
        const owned = [pkg.invite, pkg.stock, pkg.badge].filter((value) => value != null).length;
        expect(row.on, `${trait.name}：点亮的格数应与 package 登记一致`).toBe(owned);
      }
    }

    const roleRows = await page.locator('a.nk-cwsc-role').evaluateAll((els) =>
      els.map((el) => ({
        href: el.getAttribute('href') ?? '',
        avatars: el.querySelectorAll('.nk-cwsc-role__avatars img').length,
      })),
    );
    const avatarGroups = new Set(newRoles.map((role) => String(role.avatar_id ?? role.id)));
    expect(roleRows.length, '同一角色按 avatar_id 归并成一行').toBe(avatarGroups.size);
    expect(roleRows.reduce((sum, row) => sum + row.avatars, 0), '变体头像总数应等于新增角色条数').toBe(newRoles.length);
    for (const row of roleRows) {
      expect(row.href, '角色行应指向角色详情').toMatch(/\/currency\/role\/\d+$/);
    }

    const ledger = await page.locator('a.nk-cwsc-ledger__row').evaluateAll((els) =>
      els.map((el) => el.getAttribute('href')),
    );
    expect(ledger, '账房三本账：环境 / 策略 / 装备').toEqual(['/currency/buff', '/currency/augment', '/currency/item']);

    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/currency：1920×1080 首屏内闭合第一幕（报头 + 幻月舞台 + 账头）', { tag: ['@visual-detail', '@viewport-pinned'] }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/currency');
    await expect(page.locator('.nk-hub-masthead__title')).toBeVisible();
    const mastheadH = await page.locator('.nk-hub-masthead').evaluate((el) =>
      Math.round(el.getBoundingClientRect().height),
    );
    expect(mastheadH, '报头不得高过 120px').toBeLessThanOrEqual(120);

    const premiere = page.locator('.nk-cwsc-act[data-act="premiere"]');
    await expect(premiere.locator('.nk-cwsc-act__title')).toBeVisible();
    const facts = premiere.locator('.nk-cwsc-figure');
    await expect(facts).toHaveCount(2);
    const bottom = await facts.last().evaluate((el) => Math.round(el.getBoundingClientRect().bottom));
    expect(bottom, '第一幕的账头应落在首屏内').toBeLessThanOrEqual(1080);
    const art = premiere.locator('.nk-cwsc-premiere__art img');
    await expect(art).toBeVisible();
    expect(await art.evaluate((el) => el.getAttribute('src'))).toMatch(/avatardrawcard\//);
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
    await expect(page.locator('.nk-cwsc-empty')).toHaveCount(1);
    await expect(page.locator('.nk-cwsc-act')).toHaveCount(0);
    await expect(page.locator('.nk-cwsc-figures')).toHaveCount(0);
    const archiveTotals = [
      readJson<{ season?: { id: number | null }; roles: { season_ids: number[] }[] }>('public/data/cn/currency/role.json'),
      readJson<{ season?: { id: number | null }; traits: { season_id: number }[] }>('public/data/cn/currency/traits.json'),
    ];
    const archiveCount = archiveTotals.map((db) => {
      const sid = db.season?.id ?? null;
      return sid == null
        ? (('roles' in db ? db.roles : db.traits) as unknown[]).length
        : ('roles' in db ? db.roles.filter((r) => r.season_ids.includes(sid)).length : db.traits.filter((t) => t.season_id === sid).length);
    });
    const holds = await page.locator('.nk-cwsc-hold').evaluateAll((els) =>
      els.map((el) => Number((el.querySelector('.nk-cwsc-hold__num')?.textContent ?? '').trim())),
    );
    expect(holds, '空态仍保留档案存量，且是本赛季全量').toEqual(archiveCount);
    await expect(page.locator('.nk-hub-masthead__title')).toBeVisible();
    await expect(page.locator('.nk-hub-footer')).toHaveCount(1);
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/currency：加载期给第一幕骨架、索引全失败给错误态且可重试，都不冒充空态', { tag: ['@visual-detail', '@viewport-pinned'] }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 1440, height: 900 });

    await page.route(CURRENCY_INDEXES, async (route) => {
      if (isSeasonIndex(route.request().url())) await new Promise((resolve) => setTimeout(resolve, 3_000));
      await route.continue();
    });
    await page.goto('/currency', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.nk-cwsc-sk')).toBeVisible();
    await expect(page.locator('.nk-cwsc-sk__art')).toHaveCount(1);
    await expect(page.locator('.nk-cwsc-act')).toHaveCount(0);
    await expect(page.locator('.nk-cwsc-empty')).toHaveCount(0);
    await expect.poll(() => page.locator('.nk-cwsc-act').count(), { timeout: 15_000 }).toBeGreaterThanOrEqual(1);
    await expect(page.locator('.nk-cwsc-sk')).toHaveCount(0);
    await page.unroute(CURRENCY_INDEXES);

    await page.route(CURRENCY_INDEXES, (route) =>
      (isSeasonIndex(route.request().url()) ? route.abort() : route.continue()));
    await page.goto('/currency');
    await expect(page.locator('.nk-error-state')).toBeVisible();
    await expect(page.locator('.nk-error-state__retry')).toBeVisible();
    await expect(page.locator('.nk-cwsc-empty')).toHaveCount(0);
    await expect(page.locator('.nk-cwsc-act')).toHaveCount(0);

    await page.unroute(CURRENCY_INDEXES);
    await page.locator('.nk-error-state__retry').click();
    await expect.poll(() => page.locator('.nk-cwsc-act').count(), { timeout: 15_000 }).toBeGreaterThanOrEqual(1);
    await expect(page.locator('.nk-error-state')).toHaveCount(0);

    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/currency：羁绊行 title 带完整描述，四件套三格与 package 登记一致', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/currency');
    const section = page.locator('.nk-cwsc-act[data-act="traits"]');
    await expect(section).toBeVisible();
    const traits = readJson<{
      traits: { id: number; name: string; simple_desc: string; package?: { invite: unknown; stock: unknown; badge: unknown } }[];
    }>('public/data/cn/currency/traits.json').traits;

    const rows = await section.locator('a.nk-cwsc-trait').evaluateAll((cards) =>
      cards.map((card) => ({
        href: card.getAttribute('href') ?? '',
        title: card.getAttribute('title') ?? '',
        on: card.querySelectorAll('.nk-cwsc-pkg__slot[data-on]').length,
      })),
    );
    expect(rows.length, '本季新增羁绊应全部渲染').toBeGreaterThanOrEqual(1);
    for (const row of rows) {
      const id = traitIdOfHref(row.href);
      const trait = traits.find((item) => item.id === id);
      expect(trait, `${row.href}：应能在 traits.json 里按 id 定位`).toBeTruthy();
      const full = normalizeDesc(trait!.simple_desc);
      expect(full, `${trait!.name}：数据里应有 simple_desc`).toBeTruthy();
      expect(row.title.includes(full), `${trait!.name}：行 title 必须含完整描述原文`).toBe(true);
      const owned = trait!.package
        ? [trait!.package.invite, trait!.package.stock, trait!.package.badge].filter((v) => v != null).length
        : 0;
      expect(row.on, `${trait!.name}：点亮格数应与 package 一致`).toBe(owned);
    }
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/currency：羁绊行与角色行交叉高亮（鼠标进入 / 键盘聚焦，离开归零）', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/currency');
    await expect(page.locator('a.nk-cwsc-trait').first()).toBeVisible();

    const traitData = readJson<{ traits: { id: number; name: string; is_season_new?: boolean }[] }>(
      'public/data/cn/currency/traits.json',
    ).traits;
    const roleData = readJson<{
      roles: { id: number; name: string; is_season_new?: boolean; traits: { id: number }[] }[];
    }>('public/data/cn/currency/role.json').roles;
    const newRoles = roleData.filter((role) => role.is_season_new === true);
    const newTraitIds = new Set(traitData.filter((trait) => trait.is_season_new === true).map((trait) => trait.id));
    const newRoleIds = new Set(newRoles.map((role) => role.id));

    const renderedHolders = (traitId: number): number[] =>
      roleData.filter((role) => newRoleIds.has(role.id) && role.traits.some((trait) => trait.id === traitId))
        .map((role) => role.id);
    let target = traitData.filter((trait) => trait.is_season_new === true && renderedHolders(trait.id).length > 0)[0];
    for (const trait of traitData.filter((item) => item.is_season_new === true)) {
      if (renderedHolders(trait.id).length > renderedHolders(target.id).length) target = trait;
    }
    const avatarOf = new Map(newRoles.map((role) => [role.id, String(role.avatar_id ?? role.id)]));
    const expectedHolders = renderedHolders(target.id);
    expect(expectedHolders.length, `${target.name}：应至少有一名本季新角色持有该羁绊`).toBeGreaterThan(0);
    const expectedHrefs = [...new Set(expectedHolders.map((id) => avatarOf.get(id)!))].map((avatarId) => {
      const owner = newRoles.find((role) => String(role.avatar_id ?? role.id) === avatarId)!;
      return `/currency/role/${owner.id}`;
    });

    const traitRow = page.locator(`a.nk-cwsc-trait[href$="/currency/trait/${target.id}"]`).first();
    await traitRow.scrollIntoViewIfNeeded();
    await traitRow.hover();
    const hlHrefs = await page.locator('a.nk-cwsc-role[data-hl]').evaluateAll((els) =>
      els.map((el) => el.getAttribute('href') ?? ''),
    );
    expect(
      hlHrefs.sort(),
      `${target.name}：持有该羁绊的角色行应被高亮`,
    ).toEqual(expectedHrefs.sort());
    const hlChips = await page.locator('.nk-cwsc-role__trait[data-hl]').evaluateAll((els) => els.length);
    expect(hlChips, '被高亮的角色行内，该羁绊 chip 也应高亮').toBe(expectedHrefs.length);

    await page.mouse.move(0, 0);
    await expect(page.locator('[data-hl]')).toHaveCount(0);

    const firstNewTraits = newRoles[0]!.traits.filter((trait) => newTraitIds.has(trait.id)).map((trait) => trait.id);
    expect(firstNewTraits.length, '首张角色行应至少带一枚本季新增羁绊').toBeGreaterThan(0);
    await page.locator('a.nk-cwsc-role').first().focus();
    const focusedTraits = (await page.locator('a.nk-cwsc-trait[data-hl]').evaluateAll((els) =>
      els.map((el) => el.getAttribute('href') ?? ''),
    )).map((href) => traitIdOfHref(href));
    expect(focusedTraits.sort(), '聚焦角色行时，高亮的应恰是它的新增羁绊行').toEqual([...firstNewTraits].sort());

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
