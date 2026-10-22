import { test, expect } from '@playwright/test';
import { collectConsoleIssues, computedNumber, readJson, resolveTokenColor, waitForSettled } from './helpers';
import {
  charFamilyIds,
  charSkillNames,
  expectNoSkillsOverflow,
  noUnknownOverflow,
  pseudoBox,
  skillRailX,
  tableBoxWithinCard,
} from './layout.shared';

test.describe('布局验收：角色详情页', () => {
  test('/character/1001：hero、概览面板、无溢出', { tag: '@cross-engine' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/character/1001');
    await expect(page.locator('.nk-hero--char')).toBeVisible();
    await expect(page.locator('.nk-hero__archive')).toContainText('1001');
    await expect(page.locator('.nk-profile, .nk-title').first()).toBeVisible();
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/character/1001：hero 素材对位分档（窄桌面档右对齐 / ≥1440 回到居中）', { tag: ['@visual-detail', '@viewport-pinned', '@cross-engine'] }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    const read = () =>
      page.evaluate(() => {
        const bg = document.querySelector('.nk-hero__bg') as HTMLElement;
        const cs = getComputedStyle(bg);
        return { x: parseFloat(cs.backgroundPositionX) || 0, pos: cs.backgroundPosition };
      });

    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/character/1001');
    await page.waitForSelector('.nk-hero--char');
    const narrow = await read();

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/character/1001');
    await page.waitForSelector('.nk-hero--char');
    const wide = await read();

    expect(narrow.pos, '1024 档素材须右对齐（窄档文字列与立绘共享空间，容器无余量可移）').not.toBe('50% 40%');
    expect(wide.pos, '≥1440 档素材须回到居中（该档走容器位移，保持立绘与 Spine 对齐）').toBe('50% 40%');
    expect(narrow.x, `窄档 bgPositionX=${narrow.x} 须大于宽档 ${wide.x}`).toBeGreaterThan(wide.x);
    assertNoErrors();
  });

  test('/character/1001 桌面：hero 文字可读性只落在字形（媒体无底板 / 无整片遮罩）', { tag: ['@visual-detail', '@viewport-pinned', '@cross-engine'] }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/character/1001');
    await page.waitForSelector('.nk-hero--char');
    await page.waitForSelector('.nk-stats__stat');

    const ink = (await resolveTokenColor(page, '--nk-hero-glyph-ink', '.nk-char-page')).replace(/\s+/g, '');
    const alphaOf = (c: string) => {
      const m = c.match(/rgba\([^)]*,\s*([\d.]+)\)/) || c.match(/\/\s*([\d.]+)\)/);
      return m ? Number(m[1]) : 1;
    };
    expect(alphaOf(ink), '软影墨色须为半透明（不透明描边会啃掉字形本身）').toBeLessThan(1);
    for (const sel of ['.nk-hero__meta-row', '.nk-hero__name', '.nk-hero__desc']) {
      const s = await page.locator(sel).evaluate((el) => {
        const shadow = getComputedStyle(el).textShadow.replace(/\s+/g, '');
        return { shadow, layers: (shadow.match(/(?:rgb|rgba)\(/g) || []).length };
      });
      expect(s.shadow, `${sel} 须带字形软影`).toContain(ink);
      expect(s.layers, `${sel} 软影层数须 ≤ 2`).toBeLessThanOrEqual(2);
    }

    for (const b of await page.locator('.nk-hero__badge:not(.nk-hero__badge--enh)').all()) {
      expect(
        await b.evaluate((el) => getComputedStyle(el).backgroundColor.replace(/\s+/g, '')),
        '元素/命途徽标须为裸文字',
      ).toBe('rgba(0,0,0,0)');
    }

    const geo = await page.evaluate(() => {
      const r = (s: string) => { const el = document.querySelector(s) as HTMLElement; const b = el.getBoundingClientRect(); return { x: b.x, y: b.y, x2: b.x + b.width, y2: b.y + b.height }; };
      return {
        archiveBg: getComputedStyle(document.querySelector('.nk-hero__archive')!).backgroundColor.replace(/\s+/g, ''),
        ar: r('.nk-hero__archive'), panel: r('.nk-hero__panel'),
      };
    });
    expect(geo.archiveBg, '编号行须无底板').toBe('rgba(0,0,0,0)');
    expect(
      geo.ar.x >= geo.panel.x && geo.ar.x2 <= geo.panel.x2 && geo.ar.y >= geo.panel.y && geo.ar.y2 <= geo.panel.y2,
      '编号行须整体落在信息面板盒内（卷宗抬头，不压绘）',
    ).toBe(true);

    const panel = await page.locator('.nk-hero__panel').evaluate((el) => {
      const cs = getComputedStyle(el);
      return { before: getComputedStyle(el, '::before').content, bg: cs.backgroundColor.replace(/\s+/g, ''), bgImage: cs.backgroundImage };
    });
    expect(panel.before, '面板框整块底板已退场，不得回归').toBe('none');
    expect(panel.bg, '面板不得有整块底色').toBe('rgba(0,0,0,0)');
    expect(panel.bgImage, '面板不得有整块渐变底板').toBe('none');

    const washes = await page.evaluate(() => {
      const hero = document.querySelector('.nk-hero--char') as HTMLElement;
      const vis = document.querySelector('.nk-hero__visual') as HTMLElement;
      const vb = vis.getBoundingClientRect();
      const area = vb.width * vb.height;
      const hits: string[] = [];
      for (const el of Array.from(hero.querySelectorAll<HTMLElement>('*'))) {
        if (el === hero || el === vis) continue;
        if (el.closest('.nk-hero__panel, .nk-hero__archive, .nk-hero__toggle, .nk-hero__spine')) continue;
        const bg = getComputedStyle(el).backgroundColor;
        if (!bg || bg === 'rgba(0, 0, 0, 0)') continue;
        const r = el.getBoundingClientRect();
        if (r.width * r.height > area * 0.3) hits.push(`${el.className}:${bg}`);
      }
      return hits;
    });
    expect(washes, '媒体上不得出现整片压暗遮罩').toEqual([]);
    expect(
      await page.locator('.nk-hero__visual').evaluate((el) => getComputedStyle(el, '::before').backgroundImage),
      '桌面档媒体侧向渐隐须退场（覆盖媒体的最后一处压暗）',
    ).toBe('none');

    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/character/1001：hero 卷宗封面结构（阵营归抬头行 / 拉丁注音 = name_en / 名称族内距最紧）', { tag: '@cross-engine' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    const d = readJson<{ name_en: string }>('public/data/cn/characters/1001.json');
    expect(d.name_en, '1001 应有拉丁转写（否则本用例失去区分力）').not.toBe('');

    await page.goto('/character/1001');
    await page.waitForSelector('.nk-hero__name');

    const rubric = page.locator('.nk-hero__rubric');
    await expect(rubric.locator('.nk-hero__archive')).toContainText('ARCHIVE');
    await expect(rubric.locator('.nk-hero__camp')).toHaveCount(1);
    await expect(page.locator('.nk-hero__meta-row .nk-hero__camp'), '阵营已归抬头行').toHaveCount(0);
    await expect(page.locator('.nk-hero__name-en')).toHaveText(d.name_en);

    const geo = await page.evaluate(() => {
      const fs = (s: string) => parseFloat(getComputedStyle(document.querySelector(s)!).fontSize);
      const gap = (s: string) => parseFloat(getComputedStyle(document.querySelector(s)!).rowGap) || 0;
      return { name: fs('.nk-hero__name'), en: fs('.nk-hero__name-en'), titleGap: gap('.nk-hero__title'), headGap: gap('.nk-hero__head') };
    });
    expect(geo.name, '主字字号须大于拉丁注音').toBeGreaterThan(geo.en);
    expect(geo.titleGap, '名称族内距须小于抬头 / 规格行的行距').toBeLessThan(geo.headGap);
    expect(geo.titleGap, '名称族内距不得归零（中文主字与注音会贴死）').toBeGreaterThan(0);

    const scale = await page.evaluate(() => {
      const px = (s: string) => parseFloat(getComputedStyle(document.querySelector(s)!).fontSize);
      return { label: px('.nk-hero__archive'), no: px('.nk-hero__archive-no'), camp: px('.nk-hero__camp'), name: px('.nk-hero__name') };
    });
    expect(scale.no, '编号档须大于抬头标签').toBeGreaterThan(scale.label);
    expect(scale.no, '编号档须大于阵营').toBeGreaterThan(scale.camp);
    expect(scale.no, '编号档须小于主字（主字仍唯一主角）').toBeLessThan(scale.name);

    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/character/1001：抬头行断点形态（≥1024 拆两行且分隔退场 / <1024 单行保留分隔）', { tag: ['@visual-detail', '@viewport-pinned'] }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    const read = () => page.evaluate(() => {
      const box = (s: string) => document.querySelector(s)!.getBoundingClientRect();
      const a = box('.nk-hero__archive');
      const c = box('.nk-hero__camp');
      const rule = document.querySelector('.nk-hero__rubric-rule') as HTMLElement;
      return {
        sameRow: Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top) > 0,
        campBelow: c.top >= a.bottom - 1,
        ruleShown: getComputedStyle(rule).display !== 'none',
      };
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/character/1001');
    await page.waitForSelector('.nk-hero__camp');
    const desktop = await read();
    expect(desktop.campBelow, '桌面档阵营须另起一行（不在编号的行区间内）').toBe(true);
    expect(desktop.sameRow, '桌面档两项不得同行').toBe(false);
    expect(desktop.ruleShown, '拆行后纵向分隔退场').toBe(false);

    await page.setViewportSize({ width: 390, height: 844 });
    await expect.poll(async () => (await read()).sameRow, { timeout: 3_000 }).toBe(true);
    expect((await read()).ruleShown, '单行形态保留纵向分隔').toBe(true);

    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/character/8001：开拓者形态无拉丁注音（占位符留空不渲染）', { tag: '@viewport-independent' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    const d = readJson<{ name: string; name_en?: string }>('public/data/cn/characters/8001.json');
    expect(d.name_en, '开拓者形态的 name_en 须为空串').toBe('');

    await page.goto('/character/8001');
    await page.waitForSelector('.nk-hero__name');
    await expect(page.locator('.nk-hero__name')).not.toBeEmpty();
    await expect(page.locator('.nk-hero__name-en')).toHaveCount(0);

    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/character/1001 宽档：立绘横向偏移在布局层且不随动效偏好变化', { tag: ['@visual-detail', '@viewport-pinned'] }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/character/1001');
    await page.waitForSelector('.nk-hero--char');
    await page.waitForSelector('.nk-stats__stat');

    const read = () => page.evaluate(() => {
      const host = document.querySelector('.nk-char-page') as HTMLElement;
      const v = document.querySelector('.nk-hero__visual') as HTMLElement;
      const cs = getComputedStyle(v);
      return {
        token: parseFloat(getComputedStyle(host).getPropertyValue('--nk-hero-media-shift')) || 0,
        left: parseFloat(cs.left) || 0,
        right: parseFloat(cs.right) || 0,
        transformX: new DOMMatrixReadOnly(cs.transform).m41,
      };
    });

    const off = await read();
    expect(off.token, '宽档须有非零横向偏移（否则本条失去区分力）').toBeGreaterThan(0);
    expect(off.left, '偏移须落在布局层 left').toBeCloseTo(off.token, 0);
    expect(off.transformX, 'transform 不得承载横向偏移（留给滚动视差）').toBeCloseTo(0, 1);

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect.poll(async () => (await read()).left, { timeout: 3_000 }).toBeCloseTo(off.left, 0);
    expect((await read()).right, '右缘外移量与左缘相同（保持媒体盒宽不变）').toBeCloseTo(-off.token, 0);
    await page.emulateMedia({ reducedMotion: 'no-preference' });

    await noUnknownOverflow(page);
    assertNoErrors();
  });

  const NAME_CASES = [
    { id: '1205', len: 1, tier: 'short' },
    { id: '1204', len: 2, tier: 'long' },
    { id: '1001', len: 3, tier: 'long' },
  ] as const;

  interface NameMetrics {
    len: number; dataLen: number; font: number; slot: number;
    nameW: number; slotW: number; nameLines: number;
  }

  test('/character：hero 主字按名长度分档（1 字档 > 长名档；同档盒高不随名长度变化）', { tag: ['@visual-detail', '@viewport-pinned'] }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    const read = () =>
      page.evaluate((): NameMetrics => {
        const name = document.querySelector('.nk-hero__name') as HTMLElement;
        const host = document.querySelector('.nk-char-page') as HTMLElement;
        const slotEl = document.querySelector('.nk-hero__name-slot') as HTMLElement;
        const lh = parseFloat(getComputedStyle(name).lineHeight);
        return {
          len: [...(name.textContent || '').trim()].length,
          dataLen: Number(name.dataset.len),
          font: parseFloat(getComputedStyle(name).fontSize),
          slot: parseFloat(getComputedStyle(host).getPropertyValue('--nk-hero-name-slot')),
          nameW: name.getBoundingClientRect().width,
          slotW: slotEl.getBoundingClientRect().width,
          nameLines: Math.round(name.getBoundingClientRect().height / lh),
        };
      });

    const byVp: Record<number, Record<string, NameMetrics>> = {};
    for (const vp of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
      await page.setViewportSize(vp);
      const seen: Record<string, NameMetrics> = {};
      for (const c of NAME_CASES) {
        await page.goto(`/character/${c.id}`);
        await page.waitForSelector('.nk-hero__name');
        await waitForSettled(page);
        const r = await read();
        expect(r.len, `${c.id} 的名长度须等于档位判据的期望（期望值派生自随站数据）`).toBe(c.len);
        expect(r.dataLen, `${c.id} 的 data-len 须等于名长度`).toBe(c.len);
        expect(r.nameLines, `${c.id} 主字在 ${vp.width} 档必须单行（宽度天花板判据）`).toBe(1);
        expect(r.nameW, `${c.id} 主字不得越出名称族`).toBeLessThanOrEqual(r.slotW + 1);
        seen[c.tier] = seen[c.tier] || r;
        seen[`f:${c.id}`] = r;
      }
      expect(seen.short.font, `${vp.width}：1 字档须大于 2 字名（长名档）`).toBeGreaterThan(seen['f:1204'].font);
      expect(seen.short.font, `${vp.width}：1 字档须大于 3 字名（长名档）`).toBeGreaterThan(seen['f:1001'].font);
      expect(seen.short.slot).toBeGreaterThan(0);
      expect(seen.long.slot).toBeGreaterThan(0);
      expect(seen['f:1204'].slot, '同档（2 字 / 3 字）槽高必须相等').toBe(seen['f:1001'].slot);
      expect(seen['f:1204'].nameLines, '同档行盒数必须一致').toBe(seen['f:1001'].nameLines);
      byVp[vp.width] = seen;
    }

    for (const k of ['short', 'long'] as const) {
      expect(byVp[1440][k].font, `${k} 档主字随视口放大不得缩小`).toBeGreaterThan(byVp[390][k].font);
      expect(byVp[1440][k].slot, `${k} 档槽高随视口放大不得缩小`).toBeGreaterThan(byVp[390][k].slot);
    }

    await noUnknownOverflow(page);
    assertNoErrors();
  });
});
