import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { collectConsoleIssues, readJson, resolveTokenColor } from './helpers';
import { noUnknownOverflow } from './layout.shared';

test.describe('布局验收：货币战争主题', () => {
  test('/currency：黑金主题挂载、本赛季新增两分区、无溢出', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/currency');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'cw');
    await expect(page.locator('.nk-hub-masthead__title')).toBeVisible();
    await expect(page.locator('.nk-hub-release__title')).toHaveText('本赛季新增');
    await expect(page.locator('.nk-hub-release__section, .nk-hub-release__empty').first()).toBeVisible();
    const kinds = await page
      .locator('.nk-hub-release__section')
      .evaluateAll((els) => els.map((el) => el.getAttribute('data-kind')));
    if (kinds.length === 0) {
      await expect(page.locator('.nk-hub-release__empty')).toHaveCount(1);
    } else {
      expect(kinds).toContain('role');
      const hrefs = await page
        .locator('.nk-hub-release__section[data-kind="role"] .nk-hub-release__band a')
        .evaluateAll((els) => els.map((el) => el.getAttribute('href') || ''));
      expect(hrefs.length).toBeGreaterThan(0);
      expect(hrefs.every((h) => h.startsWith('/currency/role/'))).toBe(true);
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

  test('/currency：1920×1080 首屏内可见本赛季新增（ADR 0020 核心验收）', { tag: ['@visual-detail', '@viewport-pinned'] }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/currency');
    await expect(page.locator('.nk-hub-masthead__title')).toBeVisible();
    const mastheadH = await page.locator('.nk-hub-masthead').evaluate((el) =>
      Math.round(el.getBoundingClientRect().height),
    );
    expect(mastheadH).toBeLessThanOrEqual(120);
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
    await expect(page.locator('.nk-cwhub-index')).toHaveCount(0);
    await expect(page.locator('.nk-hub-masthead__title')).toBeVisible();
    await expect(page.locator('.nk-hub-footer')).toHaveCount(1);
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/currency：加载期给分区骨架、索引全失败给错误态且可重试，都不冒充空态', { tag: ['@visual-detail', '@viewport-pinned'] }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    const INDEXES = '**/data/cn/currency/*.json';
    const isIndex = (url: string) => /(currency\/role|currency\/traits)\.json$/.test(url);

    await page.setViewportSize({ width: 1440, height: 900 });

    await page.route(INDEXES, async (route) => {
      if (isIndex(route.request().url())) await new Promise((resolve) => setTimeout(resolve, 3_000));
      await route.continue();
    });
    await page.goto('/currency', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.nk-hub-release__sk')).toBeVisible();
    await expect(page.locator('.nk-hub-release__sk-row')).toHaveCount(2);
    await expect(page.locator('.nk-hub-release__title')).toHaveText('本赛季新增');
    await expect(page.locator('.nk-hub-release__section')).toHaveCount(0);
    await expect(page.locator('.nk-hub-release__empty')).toHaveCount(0);
    const skRole = await page.locator(".nk-hub-release__sk-row[data-sk='role'] .nk-hub-release__sk-card")
      .evaluate((el) => Math.round(el.getBoundingClientRect().width));
    const skTrait = await page.locator(".nk-hub-release__sk-row[data-sk='trait'] .nk-hub-release__sk-card")
      .evaluate((el) => Math.round(el.getBoundingClientRect().width));
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

    await page.route(INDEXES, (route) =>
      (isIndex(route.request().url()) ? route.abort() : route.continue()));
    await page.goto('/currency');
    await expect(page.locator('.nk-error-state')).toBeVisible();
    await expect(page.locator('.nk-error-state__retry')).toBeVisible();
    await expect(page.locator('.nk-hub-release__empty')).toHaveCount(0);
    await expect(page.locator('.nk-hub-release__section')).toHaveCount(0);

    await page.unroute(INDEXES);
    await page.locator('.nk-error-state__retry').click();
    await expect.poll(() => page.locator('.nk-hub-release__section').count(), { timeout: 15_000 }).toBeGreaterThanOrEqual(1);
    await expect(page.locator('.nk-error-state')).toHaveCount(0);

    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/currency：羁绊卡描述截断有 title 复原（完整原文可读）', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/currency');
    const section = page.locator('.nk-hub-release__section[data-kind="trait"]');
    await expect(section).toBeVisible();
    const traits = readJson<{ traits: { name: string; simple_desc: string }[] }>('public/data/cn/currency/traits.json').traits;
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
