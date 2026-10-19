import { test, expect } from '@playwright/test';
import { collectConsoleIssues, computedNumber, readJson, resolveTokenColor } from './helpers';
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

  test('/character/1204：技能 / 星魂区块内索引（锚点一一对应 + 跳转落点在吸顶条之下 + 触控 44）', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/character/1204');
    await page.waitForSelector('.nk-idxstrip__item');
    await page.waitForSelector('.nk-stats__stat');

    const barH = await page.locator('.nk-enh-bar').evaluate((el) => el.getBoundingClientRect().height);

    for (const panelKey of ['skills', 'eidolons'] as const) {
      const nav = page.locator(`.nk-panel[data-panel="${panelKey}"] .nk-idxstrip`);
      await expect(nav, `${panelKey} 须有区块内索引`).toHaveCount(1);
      const buttons = nav.locator('.nk-idxstrip__item');
      const anchors = page.locator(`.nk-panel[data-panel="${panelKey}"] [id^="nk-skill-"], .nk-panel[data-panel="${panelKey}"] [id^="nk-eidolon-"]`);
      expect(await buttons.count(), `${panelKey} 索引条目数须等于卡片数`).toBe(await anchors.count());

      const items = await buttons.evaluateAll((els) => els.map((el) => {
        const b = el.getBoundingClientRect();
        return { label: (el.textContent || '').trim(), h: b.height, top: b.top };
      }));
      for (const it of items) {
        expect(it.h, `${panelKey} 索引条目「${it.label}」触控高度`).toBeGreaterThanOrEqual(44);
      }

      const first = buttons.first();
      const targetId = await first.evaluate((el) => {
        const panel = el.closest('.nk-panel');
        return panel!.querySelector('[id^="nk-skill-"], [id^="nk-eidolon-"]')!.id;
      });
      await first.click();
      const targetY = () => page.locator(`#${targetId}`).evaluate((el) => el.getBoundingClientRect().y);
      await expect.poll(targetY, { timeout: 4_000 }).toBeLessThan(barH + 80);
      expect(await targetY(), `${panelKey} 首个索引项的落点须在吸顶条之下`).toBeGreaterThanOrEqual(barH);
      expect(await page.locator(`#${targetId}`).isVisible()).toBe(true);
    }

    await page.waitForSelector('.nk-panel[data-panel="skills"] > .nk-skill');
    const gapVsPad = await page.evaluate(() => {
      const cards = [...document.querySelectorAll('.nk-panel[data-panel="skills"] > .nk-skill')];
      const gap = cards[1].getBoundingClientRect().top - cards[0].getBoundingClientRect().bottom;
      const pad = parseFloat(getComputedStyle(cards[0]).paddingTop);
      return { gap, pad };
    });
    expect(gapVsPad.gap, '同级卡片间距须大于卡内距（否则组界不可辨）').toBeGreaterThan(gapVsPad.pad);

    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/character/1204：吸顶区块导航在 <1024 档可横滑到位 + 有溢出提示 + 触控 44 且条高不变', { tag: ['@viewport-pinned', '@cross-engine'] }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/character/1204');
    await page.waitForSelector('.nk-secnav__btn');
    const narrow = await page.evaluate(() => {
      const nav = document.querySelector('.nk-secnav') as HTMLElement;
      const bar = document.querySelector('.nk-enh-bar') as HTMLElement;
      const btn = nav.querySelector('.nk-secnav__btn') as HTMLElement;
      const last = [...nav.querySelectorAll('.nk-secnav__btn')].pop() as HTMLElement;
      return {
        overflow: nav.scrollWidth > nav.clientWidth + 1,
        btnH: btn.getBoundingClientRect().height,
        barH: bar.getBoundingClientRect().height,
        mask: getComputedStyle(nav).maskImage || getComputedStyle(nav).webkitMaskImage,
        scrollLeftBefore: nav.scrollLeft,
      };
    });
    expect(narrow.overflow, '390 档导航须横向溢出（否则本契约失去区分力）').toBe(true);
    expect(narrow.btnH, '窄档导航按钮触控高度').toBeGreaterThanOrEqual(44);
    expect(narrow.mask, '溢出档必须有「还有内容」的几何提示（mask-image）').not.toBe('none');
    expect(narrow.barH, '导航撑到 44 不得改变吸顶条总高').toBeLessThanOrEqual(48);

    const reached = await page.evaluate(() => {
      const nav = document.querySelector('.nk-secnav') as HTMLElement;
      const last = [...nav.querySelectorAll('.nk-secnav__btn')].pop() as HTMLElement;
      last.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      const nb = nav.getBoundingClientRect();
      const lb = last.getBoundingClientRect();
      return { reached: lb.left >= nb.left - 1 && lb.right <= nb.right + 1, scrollLeft: nav.scrollLeft };
    });
    expect(reached.scrollLeft, '末项须真的把导航滚起来').toBeGreaterThan(narrow.scrollLeftBefore);
    expect(reached.reached, '末项横滑后须完整落在导航可视区内').toBe(true);

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/character/1204');
    await page.waitForSelector('.nk-secnav__btn');
    const wide = await page.evaluate(() => {
      const nav = document.querySelector('.nk-secnav') as HTMLElement;
      return { overflow: nav.scrollWidth > nav.clientWidth + 1, mask: getComputedStyle(nav).maskImage || getComputedStyle(nav).webkitMaskImage };
    });
    expect(wide.overflow, '1440 档导航不得溢出').toBe(false);
    expect(wide.mask, '无溢出档不得出现渐隐提示').toBe('none');

    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/character/1204：配队头像的可达名来自随站数据（不得是 #id 回退串）', { tag: '@viewport-independent' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/character/1204');
    await page.waitForSelector('.nk-build__team-link');
    await expect(page.locator('.nk-build__team-link[title="星期日"]')).toHaveCount(1, { timeout: 10_000 });

    const links = await page.locator('.nk-build__team-link').evaluateAll((els) =>
      els.map((el) => ({
        href: el.getAttribute('href') || '',
        title: el.getAttribute('title') || '',
        alt: el.querySelector('img')?.getAttribute('alt') || '',
      })));
    expect(links.length, '1204 应有配队头像（否则本契约失去区分力）').toBeGreaterThan(3);
    const idLike = /^#\d+$|^角色 \d+$/;
    const bad = links.filter((l) => idLike.test(l.title) || idLike.test(l.alt));
    expect(bad, '配队头像的 title/alt 不得是上游 id 回退串').toEqual([]);

    const catalog = readJson<{ id: number; name: string }[]>('public/data/cn/characters.json');
    for (const l of links) {
      const id = l.href.split('/').pop() || '';
      const hit = catalog.find((c) => String(c.id) === id);
      if (!hit) continue;
      expect([hit.name, '当前角色'], `${id} 的可达名须与角色名录一致`).toContain(l.title);
    }
    assertNoErrors();
  });

  test('/character/1204：技能等级滑条在键盘 Tab 下有可见焦点环', { tag: '@cross-engine' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/character/1204');
    await page.waitForSelector('.nk-stats__stat');
    await expect(page.locator('.nk-skill__slider input[type="range"]').first()).toBeAttached();

    let focused: { tag: string; outlineStyle: string; outlineWidth: string } | null = null;
    for (let i = 0; i < 80 && !focused; i++) {
      await page.keyboard.press('Tab');
      focused = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el || el.tagName !== 'INPUT') return null;
        const cs = getComputedStyle(el);
        return { tag: el.tagName, outlineStyle: cs.outlineStyle, outlineWidth: cs.outlineWidth };
      });
    }
    expect(focused, 'Tab 遍历须能走到滑条（否则键盘用户根本够不到等级控制）').not.toBeNull();
    expect(focused!.outlineStyle, '滑条焦点态须有实线轮廓').toBe('solid');
    expect(parseFloat(focused!.outlineWidth), '轮廓宽度须 > 0').toBeGreaterThan(0);

    assertNoErrors();
  });

  test('/character/1001：极端视口矩阵（320 / 834 / 矮横屏 / 2560）四条不变量', { tag: ['@viewport-pinned', '@cross-engine'] }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    for (const vp of [
      { width: 320, height: 568 },
      { width: 834, height: 1112 },
      { width: 1440, height: 460 },
      { width: 2560, height: 1440 },
    ]) {
      await page.setViewportSize(vp);
      await page.goto('/character/1001');
      await page.waitForSelector('.nk-stats__stat');
      const r = await page.evaluate(() => {
        const q = (s: string) => document.querySelector(s) as HTMLElement;
        const hero = q('.nk-hero--char').getBoundingClientRect();
        const panel = q('.nk-hero__panel').getBoundingClientRect();
        const name = q('.nk-hero__name');
        const nb = name.getBoundingClientRect();
        const lh = parseFloat(getComputedStyle(name).lineHeight);
        const titleFs = parseFloat(getComputedStyle(q('.nk-title')).fontSize);
        const bodyMax = Math.max(...['.nk-stats__val', '.nk-eidolon__name', '.nk-build__team-name']
          .map((s) => { const e = document.querySelector(s); return e ? parseFloat(getComputedStyle(e).fontSize) : 0; }));
        return {
          panelInside: panel.left >= hero.left - 0.5 && panel.right <= hero.right + 0.5
            && panel.top >= hero.top - 0.5 && panel.bottom <= hero.bottom + 0.5,
          lines: Math.round(nb.height / lh),
          titleFs,
          bodyMax,
        };
      });
      expect(r.panelInside, `${vp.width}×${vp.height}：hero 面板须完整落在 hero 内`).toBe(true);
      expect(r.lines, `${vp.width}×${vp.height}：主字须单行`).toBe(1);
      expect(r.titleFs, `${vp.width}×${vp.height}：章标须 ≥ 页内最大正文（层级不得倒挂）`).toBeGreaterThanOrEqual(r.bodyMax);
      await noUnknownOverflow(page);
    }
    assertNoErrors();
  });

  test('/character/1205：点区块导航后高亮落在被点的那一节（逐项）', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/character/1205');
    await page.waitForSelector('.nk-secnav__btn');
    await page.waitForSelector('.nk-stats__stat');

    const btns = page.locator('.nk-secnav__btn');
    const n = await btns.count();
    expect(n, '该角色应有 10 个区块（否则本契约失去区分力）').toBe(10);
    for (let i = 0; i < n; i++) {
      const label = ((await btns.nth(i).innerText()) || '').replace(/\s+/g, '');
      await btns.nth(i).click();
      await expect
        .poll(
          async () => ((await page.locator('.nk-secnav__btn--active').first().innerText()) || '').replace(/\s+/g, ''),
          { timeout: 8_000, message: `点「${label}」后高亮须落在同一节` },
        )
        .toBe(label);
    }
    assertNoErrors();
  });

  test('/character/1513：吸顶区块导航跟随当前区块 + 渐隐按滚动位置双向开关', { tag: ['@viewport-pinned', '@cross-engine'] }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/character/1513');
    await page.waitForSelector('.nk-secnav__btn');

    const nav = page.locator('.nk-secnav');
    const bar = page.locator('.nk-enh-bar');

    const fadeSides = () =>
      nav.evaluate((el) => {
        const m = getComputedStyle(el).maskImage || getComputedStyle(el).webkitMaskImage || '';
        const clearIdx = m.indexOf('rgba(0, 0, 0, 0)');
        const solidIdx = m.indexOf('rgb(0, 0, 0)');
        return {
          none: m === 'none',
          left: clearIdx >= 0 && (solidIdx < 0 || clearIdx < solidIdx),
          clearCount: (m.match(/rgba\(0, 0, 0, 0\)/g) || []).length,
        };
      });

    const activeGeom = () =>
      page.evaluate(() => {
        const n = document.querySelector('.nk-secnav') as HTMLElement;
        const b = document.querySelector('.nk-secnav__btn--active') as HTMLElement | null;
        if (!b) return null;
        const nb = n.getBoundingClientRect();
        const bb = b.getBoundingClientRect();
        return {
          label: (b.textContent || '').replace(/\s+/g, ''),
          scrollLeft: n.scrollLeft,
          insetLeft: bb.left - nb.left,
          insetRight: nb.right - bb.right,
        };
      });

    await page.evaluate(() => {
      (document.querySelector('.nk-char-page') as HTMLElement).scrollTo({ top: 8200, behavior: 'instant' });
    });
    await expect
      .poll(
        async () => {
          const g = await activeGeom();
          return g ? g.insetLeft >= 28 && g.insetRight >= 28 : false;
        },
        { timeout: 6_000, message: '吸顶条须把当前区块滚进可视区（含渐隐带以内）' },
      )
      .toBe(true);
    const followed = await activeGeom();
    expect(followed!.scrollLeft, '跟随须真的把条滚起来（此前恒为 0）').toBeGreaterThan(0);
    expect(followed!.label, '该视口位置须落在靠后的区块上（否则本契约失去区分力）').not.toMatch(/^0[0-3]/);

    const setNavScrollLeft = (v: number | 'max') =>
      nav.evaluate((el, x) => { el.scrollLeft = x === 'max' ? el.scrollWidth : (x as number); }, v);

    await setNavScrollLeft(0);
    await expect.poll(() => bar.getAttribute('data-nav-fade')).toBe('start');
    const atStart = await fadeSides();
    expect(atStart.none, '390 档导航须溢出（否则本契约失去区分力）').toBe(false);
    expect(atStart.left, '起始档左端不得渐隐（左端没有可裁内容）').toBe(false);
    expect(atStart.clearCount, '起始档只有右端一处渐隐').toBe(1);

    await setNavScrollLeft('max');
    await expect.poll(() => bar.getAttribute('data-nav-fade')).toBe('end');
    const atEnd = await fadeSides();
    expect(atEnd.left, '到底档必须有左端渐隐（否则左端文字被硬切）').toBe(true);
    expect(atEnd.clearCount, '到底档只有左端一处渐隐').toBe(1);

    await setNavScrollLeft(120);
    await expect.poll(() => bar.getAttribute('data-nav-fade')).toBe('middle');
    const atMid = await fadeSides();
    expect(atMid.left, '中段须有左端渐隐').toBe(true);
    expect(atMid.clearCount, '中段两端各一处渐隐').toBe(2);

    const underlineBottom = await page
      .locator('.nk-secnav__btn--active')
      .evaluate((el) => parseFloat(getComputedStyle(el, '::after').bottom));
    expect(underlineBottom, '激活下划线的 bottom 偏移不得为负').toBeGreaterThanOrEqual(0);

    const inkGaps = await page.locator('.nk-secnav__btn').first().evaluate((el) => {
      const btn = el.getBoundingClientRect();
      const textNode = [...el.childNodes].find((n) => n.nodeType === 3) as Text;
      const range = document.createRange();
      range.selectNodeContents(textNode);
      const ink = range.getBoundingClientRect();
      return { above: ink.top - btn.top, below: btn.bottom - ink.bottom };
    });
    expect(
      Math.abs(inkGaps.above - inkGaps.below),
      `标签墨迹须在按钮内垂直居中（实测上 ${inkGaps.above.toFixed(1)} / 下 ${inkGaps.below.toFixed(1)}）`,
    ).toBeLessThanOrEqual(2);

    await page.setViewportSize({ width: 1023, height: 900 });
    await page.goto('/character/1513');
    await page.waitForSelector('.nk-secnav__btn');
    const roomy = await page.evaluate(() => {
      const n = document.querySelector('.nk-secnav') as HTMLElement;
      const b = document.querySelector('.nk-enh-bar') as HTMLElement;
      return {
        overflow: n.scrollWidth - n.clientWidth > 1,
        fade: b.dataset.navFade,
        mask: getComputedStyle(n).maskImage || getComputedStyle(n).webkitMaskImage,
      };
    });
    expect(roomy.overflow, '1023 档导航不得溢出（否则本契约失去区分力）').toBe(false);
    expect(roomy.fade, '1023 档无溢出 ⇒ 渐隐状态须为 none（溢出状态必须跟着布局走，不能只在挂载时算一次）').toBe('none');
    expect(roomy.mask, '1023 档无溢出 ⇒ 不得出现渐隐').toBe('none');

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/character/1513');
    await page.waitForSelector('.nk-secnav__btn');
    await page.locator('.nk-secnav__btn').nth(3).click();
    await expect(page.locator('.nk-secnav__btn--active')).toHaveCount(1);
    const wideUnderlineBottom = await page
      .locator('.nk-secnav__btn--active')
      .evaluate((el) => parseFloat(getComputedStyle(el, '::after').bottom));
    expect(wideUnderlineBottom, '宽档激活下划线的 bottom 偏移不得为负（与横滑档同一不变量）').toBeGreaterThanOrEqual(0);

    await noUnknownOverflow(page);
    assertNoErrors();
  });
});
