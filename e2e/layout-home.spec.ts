import { test, expect } from '@playwright/test';
import { collectConsoleIssues, readJson, waitForCatalogCards, waitForSettled } from './helpers';
import { noUnknownOverflow } from './layout.shared';

test.describe('布局验收：常规主题', () => {
  const versionLabelRaw = String(readJson<{ version_label?: string }>('public/data/cn/version.json').version_label ?? '');

  test('首页 /：品牌带标题、版本上新三分区、无溢出', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/');
    await expect(page.locator('.nk-hub-masthead__title')).toBeVisible();
    await expect(page.locator('.nk-hub-masthead__title')).toHaveText(/\S/);
    const versionLabel = String(readJson<{ version_label?: string }>('public/data/cn/version.json').version_label ?? '');
    expect(versionLabel, 'version.json 缺 version_label：本用例的抬头判据失去数据来源').toBeTruthy();
    await expect(page.locator('.nk-intake__batch-num')).toHaveText(versionLabel);
    await expect(page.locator('.nk-intake__batch-note')).toHaveText('版本上新');
    await expect.poll(() => page.locator('.nk-hub-release__section').count(), { timeout: 10_000 }).toBeGreaterThanOrEqual(1);
    const labelTexts = await page.locator('.nk-hub-release__label').allTextContents();
    expect(labelTexts.length).toBeGreaterThanOrEqual(1);
    for (const t of labelTexts) expect(t).toMatch(/^\S+\s+\d+$/);
    await expect(page.locator('html')).not.toHaveAttribute('data-theme', 'cw');
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('首页 /：特写块只属于恰 1 条的分区，≥2 条一律平权卡带（不偏袒第一条）', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/');
    await expect(page.locator('.nk-hub-release__section').first()).toBeVisible();

    const rows = await page.evaluate(() => {
      const leafTexts = (root: Element) =>
        [...root.querySelectorAll('*')]
          .filter((el) => el.children.length === 0)
          .map((el) => (el.textContent || '').replace(/\s+/g, ' ').trim())
          .filter(Boolean);
      return [...document.querySelectorAll('.nk-hub-release__section')].map((sec) => {
        const band = sec.querySelector('.nk-hub-release__band') as HTMLElement;
        const cell = sec.querySelector('.nk-hub-release__cell');
        const spec = sec.querySelector('.nk-hub-release__spec');
        const cards = [...band.children].filter((el) => el !== spec);
        const bandBox = band.getBoundingClientRect();
        const specBox = spec ? spec.getBoundingClientRect() : null;
        return {
          kind: sec.getAttribute('data-kind'),
          count: Number(sec.querySelector('.nk-hub-release__label-count')?.textContent?.trim() || '0'),
          labelText: (sec.querySelector('.nk-hub-release__label')?.textContent || '').replace(/\s+/g, ' ').trim(),
          entry: (() => {
            const a = sec.querySelector('.nk-hub-release__all') as HTMLAnchorElement | null;
            if (!a) return null;
            const b = a.getBoundingClientRect();
            return { text: a.textContent.replace(/\s+/g, ' ').trim(), href: a.getAttribute('href'), right: Math.round(b.right) };
          })(),
          headRight: Math.round(sec.querySelector('.nk-hub-release__sechead')!.getBoundingClientRect().right),
          specCount: sec.querySelectorAll('.nk-hub-release__spec').length,
          duplicated: spec ? leafTexts(spec).filter((t) => leafTexts(cell ?? band).includes(t)) : [],
          shownName: spec?.querySelector('.nk-hub-release__spec-name')?.textContent?.trim() ?? '',
          briefChars: (spec?.querySelector('.nk-hub-release__spec-brief')?.textContent || '').replace(/\s+/g, '').length,
          trailing: specBox ? Math.round(bandBox.right - specBox.right) : null,
          mirrored: sec.getAttribute('data-kind') === 'lightcone',
          edgeGap: specBox
            ? (sec.getAttribute('data-kind') === 'lightcone'
              ? Math.round(specBox.left - bandBox.left)
              : Math.round(bandBox.right - specBox.right))
            : null,
          cardLink: cell?.querySelector('a')?.getAttribute('href') ?? null,
          specLink: spec?.querySelector('a')?.getAttribute('href') ?? null,
          bandRight: Math.round(bandBox.right),
          plainCards: cards.map((c) => ({
            isLink: c.tagName === 'A',
            href: c.getAttribute('href'),
            name: (c.querySelector('.nk-idx-card__name, .nk-lc-card__name, .nk-relic-card__name')?.textContent || '').trim(),
          })),
          bandOverflow: band.scrollWidth > band.clientWidth + 1,
        };
      });
    });
    expect(rows.length).toBeGreaterThanOrEqual(1);
    type Row = {
      kind: string; count: number; specCount: number; duplicated: string[]; shownName: string; briefChars: number;
      trailing: number | null; mirrored: boolean; edgeGap: number | null;
      cardLink: string | null; specLink: string | null; bandRight: number;
      plainCards: { isLink: boolean; href: string | null; name: string }[]; bandOverflow: boolean;
      labelText: string; entry: { text: string; href: string | null; right: number } | null; headRight: number;
    };
    const LIST_ROUTE: Record<string, string> = { character: '/character', lightcone: '/lightcone', relic: '/relic' };
    let singleRows = 0;
    let plainRows = 0;
    for (const r of rows as Row[]) {
      expect(r.entry, `${r.kind}：分区级入口缺失`).toBeTruthy();
      expect(r.entry!.href, `${r.kind}：分区级入口目标应为该族图鉴页`).toBe(LIST_ROUTE[r.kind]);
      expect(r.entry!.text, `${r.kind}：入口文案应与分区标签同源`).toBe(`全部${r.labelText.split(/\s+/)[0]}`);
      expect(Math.abs(r.headRight - r.entry!.right), `${r.kind}：入口未与内容列右缘齐平`).toBeLessThanOrEqual(1);
      if (r.count === 1) {
        singleRows++;
        expect(r.specCount, `${r.kind}：单条目分区应有且只有一个规格块`).toBe(1);
        expect(
          r.duplicated.filter((t) => t !== r.shownName),
          `${r.kind}：特写块复述了卡片内容——注释栏只保留名字、数据正文与入口`,
        ).toEqual([]);
        expect(Math.abs(r.edgeGap!), `${r.kind}：注释栏离内容列外缘 ${r.edgeGap}px`).toBeLessThanOrEqual(2);
        expect(r.specLink, `${r.kind}：特写块入口缺失`).toBeTruthy();
        expect(r.specLink).toBe(r.cardLink);
        expect(r.briefChars, `${r.kind}：特写行缺数据正文（实测 ${r.briefChars} 字）`).toBeGreaterThanOrEqual(20);
      } else {
        plainRows++;
        expect(r.specCount, `${r.kind}：≥2 条的分区不得有规格块（不偏袒第一条）`).toBe(0);
        expect(r.plainCards.length, `${r.kind}：平权档的条目数应等于分区条数`).toBe(r.count);
        for (const c of r.plainCards) {
          expect(c.isLink, `${r.kind}：平权档每条必须是卡片自身链接`).toBe(true);
          expect(c.name, `${r.kind}：平权档卡内必须写着条目名`).toBeTruthy();
        }
      }
    }
    expect(singleRows, '应至少有一个单条目分区').toBeGreaterThanOrEqual(1);
    expect(plainRows, '应至少有一个 ≥2 条分区').toBeGreaterThanOrEqual(1);

    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('首页 /：版本抬头——版本号是首屏最大的字，claim 与分区件数同源', async ({ page }) => {
    await page.goto('/');
    const batchNum = page.locator('.nk-intake__batch-num');
    const batch = page.locator('.nk-intake__batch');
    const claim = page.locator('.nk-intake__claim');
    await expect(batchNum).toBeVisible();
    await expect(claim).toBeVisible();
    await expect(batch).toHaveAttribute('aria-label', /^\S.*版本上新$/);

    const total = await page.locator('.nk-hub-release__label-count').evaluateAll((els) =>
      els.reduce((n, el) => n + Number(el.textContent?.trim() || '0'), 0),
    );
    await expect(claim).toContainText(String(total));

    const geometry = await page.evaluate(() => {
      const num = document.querySelector('.nk-intake__batch-num') as HTMLElement;
      const numSize = parseFloat(getComputedStyle(num).fontSize);
      let maxOther = 0;
      let maxOtherText = '';
      for (const el of document.querySelectorAll('#nk-home-app *')) {
        if (el.children.length > 0) continue;
        const text = (el.textContent || '').trim();
        if (!text || el === num) continue;
        const size = parseFloat(getComputedStyle(el).fontSize);
        if (size > maxOther) { maxOther = size; maxOtherText = text.slice(0, 20); }
      }
      const numBox = num.getBoundingClientRect();
      const masthead = document.querySelector('.nk-hub-masthead')!.getBoundingClientRect();
      return { numSize, maxOther, maxOtherText, belowMasthead: numBox.top >= masthead.bottom - 1 };
    });
    expect(geometry.numSize, '版本号应显著大于其余文字').toBeGreaterThan(geometry.maxOther);
    expect(geometry.belowMasthead, '版本抬头应在报头之下（报头不得被抬头挤掉）').toBe(true);
    await noUnknownOverflow(page);
  });

  test('首页 /：1920×1080 首屏内完整可见报头 + 版本上新标题与第一分区首行卡片（ADR 0019 核心验收）', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await expect(page.locator('.nk-hub-masthead__title')).toBeVisible();
    const mastheadH = await page.locator('.nk-hub-masthead').evaluate((el) =>
      Math.round(el.getBoundingClientRect().height),
    );
    expect(mastheadH).toBeLessThanOrEqual(120);
    await expect(page.locator('.nk-intake__batch-num')).toBeVisible();
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

  test('首页 /：加载期给分区骨架、索引全失败给错误态且可重试，都不冒充空态', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    const INDEXES = '**/data/cn/*.json';
    const isIndex = (url: string) => /(characters|light_cones|relics)\.json$/.test(url);

    await page.setViewportSize({ width: 1440, height: 900 });

    await page.route(INDEXES, async (route) => {
      if (isIndex(route.request().url())) await new Promise((resolve) => setTimeout(resolve, 3_000));
      await route.continue();
    });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.nk-hub-release__sk')).toBeVisible();
    await expect(page.locator('.nk-hub-release__sk-row')).toHaveCount(3);
    await expect(page.locator('.nk-intake__batch-num')).toHaveText(versionLabelRaw);
    await expect(page.locator('.nk-intake__batch-note')).toHaveText('版本上新');
    await expect(page.locator('.nk-hub-release__section')).toHaveCount(0);
    await expect(page.locator('.nk-hub-release__empty')).toHaveCount(0);
    await expect.poll(() => page.locator('.nk-hub-release__section').count(), { timeout: 15_000 }).toBeGreaterThanOrEqual(1);
    await expect(page.locator('.nk-hub-release__sk')).toHaveCount(0);
    await page.unroute(INDEXES);

    await page.route(INDEXES, (route) =>
      (isIndex(route.request().url()) ? route.abort() : route.continue()));
    await page.goto('/');
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

  test('首页 /：三分区皆无增量时只显示一行空态（ADR 0019 决策 10）', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.route('**/data/cn/version.json', (route) =>
      route.fulfill({ contentType: 'application/json', body: JSON.stringify({ game_version: '9.9.9' }) }),
    );
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await expect(page.locator('.nk-hub-release__empty')).toHaveCount(1);
    await expect(page.locator('.nk-hub-release__section')).toHaveCount(0);
    await expect(page.locator('.nk-intake__batch-num')).toHaveText('版本上新');
    await expect(page.locator('.nk-hub-masthead__title')).toBeVisible();
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
    await expect(page.locator('.nk-cat-toolbar').first()).toBeVisible();
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('角色图鉴 /character：手机断点与桌面同一套网格卡（无行式头像卡形态）', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);

    const fingerprint = async () => {
      await waitForCatalogCards(page);
      const cards = page.locator('.nk-idx-grid a.nk-idx-card');
      await expect(cards.first()).toBeVisible();
      const base = await cards.first().evaluate((el) => {
        const portrait = el.querySelector('.nk-idx-card__portrait') as HTMLElement;
        const body = el.querySelector('.nk-idx-card__body') as HTMLElement;
        const pcs = getComputedStyle(portrait);
        return {
          display: getComputedStyle(el).display,
          portraitAspect: pcs.aspectRatio,
          portraitRadius: pcs.borderRadius,
          bodyPos: getComputedStyle(body).position,
          hasPicture: !!el.querySelector('picture'),
          columns: getComputedStyle(el.parentElement as HTMLElement).gridTemplateColumns.split(' ').length,
        };
      });
      const img = cards.first().locator('img').first();
      await expect.poll(() => img.evaluate((el) => (el as HTMLImageElement).currentSrc), { timeout: 10_000 })
        .toContain('/avatar');
      const curSrc = await img.evaluate((el) => (el as HTMLImageElement).currentSrc);
      return { ...base, imgDir: curSrc.includes('avatarroundicon') ? 'avatarroundicon' : 'avatarshopicon' };
    };

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/character');
    const wide = await fingerprint();
    expect(wide.display, '桌面卡应为块级网格卡').toBe('block');
    expect(wide.portraitAspect, '桌面立绘框为 3:4').toBe('3 / 4');
    expect(wide.bodyPos, '桌面文字叠压在立绘下缘').toBe('absolute');
    expect(wide.hasPicture, '不得存在按断点切图的双源 <picture>').toBe(false);
    expect(wide.imgDir, '桌面图源应为商店立绘').toBe('avatarshopicon');

    const narrows = [] as Array<Record<string, unknown>>;
    for (const w of [767, 390, 320]) {
      await page.setViewportSize({ width: w, height: 900 });
      await expect.poll(async () => (await fingerprint()).display).toBe('block');
      const f = await fingerprint();
      narrows.push({ w, ...f });
      expect(f.display, `${w}：手机档卡应为块级网格卡（不得是行式 flex）`).toBe('block');
      expect(f.portraitAspect, `${w}：立绘框比例应与桌面同值`).toBe(wide.portraitAspect);
      expect(f.portraitRadius, `${w}：立绘框不得是圆形`).toBe(wide.portraitRadius);
      expect(f.bodyPos, `${w}：文字应与桌面同套叠压位`).toBe(wide.bodyPos);
      expect(f.hasPicture, `${w}：不得按断点切圆头像`).toBe(false);
      expect(f.imgDir, `${w}：图源应与桌面同源（不得切圆头像）`).toBe(wide.imgDir);
      await noUnknownOverflow(page);
    }

    const cols = narrows.map((n) => n.columns as number);
    const shape = JSON.stringify(narrows.map((n) => [n.w, n.columns]));
    expect(cols[0], `767 档应比 320 档列数多：${shape}`).toBeGreaterThan(cols[2]);
    expect(cols[2], '320 档应至少 1 列').toBeGreaterThanOrEqual(1);
    for (let i = 1; i < cols.length; i++) {
      expect(cols[i - 1], `列数随视口变窄不得增加（取样序为宽→窄）：${shape}`).toBeGreaterThanOrEqual(cols[i]);
    }
    assertNoErrors();
  });

  test('首页 /：版本上新各档的盒宽不依赖图片加载（禁 max-content 塌缩）', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);

    const measure = async (delayImages: boolean) => {
      let openGate = () => {};
      const gate = new Promise<void>((resolve) => { openGate = resolve; });
      let gated = 0;
      let pendingResponses = 0;
      if (delayImages) {
        await page.route('**/*.{webp,png}', async (route) => {
          gated += 1;
          pendingResponses += 1;
          try {
            await gate;
            await route.continue();
          } finally {
            pendingResponses -= 1;
          }
        });
      }
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await expect(page.locator('.nk-hub-release__section').first()).toBeVisible();
      if (delayImages) await expect.poll(() => gated, { timeout: 10_000 }).toBeGreaterThan(0);
      await waitForSettled(page);
      await expect
        .poll(() => page.evaluate(() => document.fonts.status), { timeout: 10_000, message: '字体未就绪：两趟测量不可比' })
        .toBe('loaded');
      const rows = await page.evaluate(() =>
        [...document.querySelectorAll('.nk-hub-release__section')].map((section) => {
          const band = section.querySelector('.nk-hub-release__band') as HTMLElement;
          return {
            kind: section.getAttribute('data-kind') ?? '',
            widths: [...band.children]
              .filter((el) => !el.classList.contains('nk-hub-release__spec'))
              .map((el) => {
                const card = el.classList.contains('nk-hub-release__cell')
                  ? (el.firstElementChild as HTMLElement | null)
                  : (el as HTMLElement);
                return Math.round((card ?? el).getBoundingClientRect().width);
              }),
            bandHeight: Math.round(band.getBoundingClientRect().height),
          };
        }),
      );
      if (delayImages) {
        openGate();
        await expect.poll(() => pendingResponses, { timeout: 10_000 }).toBe(0);
        await page.unroute('**/*.{webp,png}');
      }
      return rows;
    };

    const pending = await measure(true);
    const loaded = await measure(false);
    expect(loaded.length, '版本上新应有分区').toBeGreaterThan(0);
    for (let i = 0; i < loaded.length; i++) {
      const row = loaded[i];
      const pendingRow = pending[i];
      expect(pendingRow?.kind).toBe(row.kind);
      for (const w of row.widths) {
        expect(
          Math.abs(w - row.widths[0]),
          `${row.kind}：同一行内各卡必须等宽，实测 ${row.widths.join(' / ')}`,
        ).toBeLessThanOrEqual(1);
      }
      expect(
        row.widths,
        `${row.kind}：卡片盒宽不得依赖图片是否加载（加载前 ${pendingRow.widths.join('/')} ↔ 加载后 ${row.widths.join('/')}）`,
      ).toEqual(pendingRow.widths);
      expect(
        Math.abs(row.bandHeight - pendingRow.bandHeight),
        `${row.kind}：行高不得随图片加载变化`,
      ).toBeLessThanOrEqual(1);
    }
    assertNoErrors();
  });
});
