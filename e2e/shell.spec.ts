import { test, expect } from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const PAGE = '/character';

test.describe('应用外壳契约', () => {
  test('字体由同源入口 CSS 承载且 CSS 内无 @import；两款字体真的可用', async ({ page }) => {
    const html = readFileSync('index.html', 'utf8');
    expect(html, 'index.html 不得直连 Google Fonts 样式表（跨域渲染阻塞 + 大陆不可达）')
      .not.toContain('fonts.googleapis.com');
    expect(html, 'index.html 不得残留已下线的 Google Fonts preconnect（死声明）')
      .not.toContain('fonts.gstatic.com');

    const cssDir = 'src/styles';
    const cssFiles = readdirSync(cssDir).filter((f) => f.endsWith('.css'));
    const offenders = cssFiles.filter((f) => /^\s*@import\b/m.test(readFileSync(join(cssDir, f), 'utf8')));
    expect(offenders, 'CSS 内不得有 @import（串行阻塞字体加载）').toEqual([]);
    const fontCss = readFileSync(join(cssDir, 'fonts.css'), 'utf8');
    expect(fontCss, '字体声明应为同源自托管 woff2').toMatch(/src:\s*url\(\/fonts\/[^)]+\.woff2\)/);
    for (const family of ['IBM Plex Mono', 'Noto Sans SC']) {
      expect(fontCss, `自托管声明缺字体族 ${family}`).toContain(`font-family: '${family}'`);
    }

    await page.goto(PAGE);
    const fonts = await page.evaluate(async () => {
      await Promise.race([
        (async () => {
          await document.fonts.load('12px "Noto Sans SC"', '角色图鉴');
          await document.fonts.load('12px "IBM Plex Mono"', '1234');
          await document.fonts.ready;
        })(),
        new Promise((resolve) => setTimeout(resolve, 10_000)),
      ]);
      return {
        hud: document.fonts.check('12px "IBM Plex Mono"', '1234'),
        body: document.fonts.check('12px "Noto Sans SC"', '角色'),
      };
    });
    expect(fonts.hud, 'HUD 字体（IBM Plex Mono）应可用').toBe(true);
    expect(fonts.body, '正文字体（Noto Sans SC）应可用').toBe(true);
  });

  test('声明 color-scheme: dark（原生控件与过度滚动背景按深色绘制）', async ({ page }) => {
    const html = readFileSync('index.html', 'utf8');
    expect(html, 'index.html 应有 color-scheme meta（CSS 生效前即避免浅色闪白）').toContain('name="color-scheme" content="dark"');

    await page.goto(PAGE);
    const scheme = await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme);
    expect(scheme, '根元素 color-scheme 应为 dark').toBe('dark');
  });

  test('输入框光标色 = 当前强调色（--primary）', async ({ page }) => {
    await page.goto('/item');
    await expect(page.locator('.nk-virtual-cell').first()).toBeVisible();

    const r = await page.evaluate(() => {
      const input = document.querySelector('.nk-cat-search input');
      if (!input) return null;
      const toRgb = (value: string): string => {
        const s = value.trim();
        const hex = s.match(/^#([0-9a-f]{6})$/i);
        if (hex) {
          return [0, 2, 4].map((i) => parseInt(hex[1].slice(i, i + 2), 16)).join(',');
        }
        const nums = s.match(/\d+/g);
        return nums ? nums.slice(0, 3).join(',') : s;
      };
      return {
        caret: toRgb(getComputedStyle(input).caretColor),
        primary: toRgb(getComputedStyle(document.documentElement).getPropertyValue('--primary')),
      };
    });
    expect(r, '应存在目录检索框').not.toBeNull();
    expect(r!.caret, 'caret-color 应等于 --primary').toBe(r!.primary);
  });

  test('同类交互的动效同曲线、同时长档（时长与曲线都从令牌读）', async ({ page, browserName }) => {
    test.skip(browserName === 'chromium' && process.env.E2E_PREVIEW === '1', '构建产物里 cubic-bezier 数值序列化与 dev 不同（0.16 vs .16），本契约只能在 dev 档判');
    await page.goto('/character');
    await expect(page.locator('.nk-idx-card').first()).toBeVisible();

    const collectOn = (route: string, selectors: string[]) =>
      page.evaluate(
        ({ selectors }) => {
          const ms = (v: string) => (v.trim().endsWith('ms') ? parseFloat(v) : parseFloat(v) * 1000);
          const splitTop = (s: string) => s.split(/,(?![^(]*\))/).map((x) => x.trim());
          const out: Array<{ prop: string; dur: number; ease: string; sel: string }> = [];
          for (const sel of selectors) {
            const el = document.querySelector(sel);
            if (!el) continue;
            const cs = getComputedStyle(el);
            if (cs.transitionProperty === 'none' || cs.transitionDuration === '0s') continue;
            const props = splitTop(cs.transitionProperty);
            const durs = splitTop(cs.transitionDuration);
            const eases = splitTop(cs.transitionTimingFunction);
            props.forEach((p, i) => out.push({ prop: p, dur: ms(durs[i % durs.length]), ease: eases[i % eases.length], sel }));
          }
          return out;
        },
        { selectors },
      );

    const SURFACE = [
      '.nk-idx-card', '.nk-relic-card__plate', '.nk-crole-card', '.nk-cw-trait-card',
      '.nk-ach-card', '.nk-cwrole', '.nkcwtrait',
    ];
    const LABEL = ['.nk-idx-card__name', '.nk-mob-card__name', '.nk-relic-card__name', '.nk-lc-card__name'];
    const surf: Array<{ prop: string; dur: number; ease: string; sel: string }> = [];
    const lbl: Array<{ prop: string; dur: number; ease: string; sel: string }> = [];
    for (const route of ['/character', '/relic', '/currency', '/monster']) {
      await page.goto(route);
      const anyCard = SURFACE.join(', ') + ', ' + LABEL.join(', ') + ', .nk-mob-card, .nk-lc-card, .nk-relic-card';
      await expect(page.locator(anyCard).first()).toBeVisible();
      if (route.startsWith('/currency')) {
        await page
          .waitForFunction(() => document.documentElement.classList.contains('theme-transitioning'), undefined, { timeout: 1_500 })
          .catch(() => {});
      }
      await page.waitForFunction(() => !document.documentElement.classList.contains('theme-transitioning'));
      await page.waitForTimeout(250);
      surf.push(...(await collectOn(route, SURFACE)));
      lbl.push(...(await collectOn(route, LABEL)));
    }

    const r = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      const token = (n: string) => root.getPropertyValue(n).trim();
      const ms = (v: string) => (v.trim().endsWith('ms') ? parseFloat(v) : parseFloat(v) * 1000);
      return {
        easeOut: token('--nk-ease-out'),
        tiers: ['--nk-dur-fast', '--nk-dur-hover', '--nk-dur-normal', '--nk-dur-slow', '--nk-dur-zoom']
          .map((n) => ms(token(n)))
          .filter((n) => !Number.isNaN(n)),
        durNormal: ms(token('--nk-dur-normal')),
        durHover: ms(token('--nk-dur-hover')),
        hasHoverToken: token('--nk-dur-hover') !== '',
        hasZoomToken: token('--nk-dur-zoom') !== '',
      };
    });

    expect(r.easeOut, '--nk-ease-out 令牌应存在').not.toBe('');
    expect(r.hasHoverToken, '--nk-dur-hover 令牌应存在').toBe(true);
    expect(r.hasZoomToken, '--nk-dur-zoom 令牌应存在').toBe(true);
    expect(r.tiers.length, '动效分档令牌应齐全').toBeGreaterThanOrEqual(4);
    expect(surf.length + lbl.length, '应采到交互反馈的 transition').toBeGreaterThan(6);

    for (const t of [...surf, ...lbl]) {
      expect(t.ease, `${t.sel} 的 ${t.prop} 缓动应为 --nk-ease-out（不得落到浏览器默认 ease）`).toBe(r.easeOut);
    }
    for (const t of surf) {
      if (t.prop === 'border-color' || t.prop === 'box-shadow') {
        expect(t.dur, `${t.sel} 的 ${t.prop} 表面反馈应落在 --nk-dur-normal 档（${r.durNormal}ms）`).toBe(r.durNormal);
      }
    }
    for (const t of lbl) {
      if (t.prop === 'color') {
        expect(t.dur, `${t.sel} 的 ${t.prop} 文字反馈应落在 --nk-dur-hover 档（${r.durHover}ms）`).toBe(r.durHover);
      }
    }
    for (const t of [...surf, ...lbl]) {
      expect(r.tiers, `${t.sel} 的 ${t.prop} 时长 ${t.dur}ms 必须落在既有分档 ${r.tiers.join('/')}ms 内`).toContain(t.dur);
    }
  });
});

test.describe('焦点可见性（键盘 Tab 后元素周边像素必须变化）', () => {
  const CASES = [
    { route: '/', label: '侧栏链接', sel: '.ui-sidebar-link' },
    { route: '/character', label: '目录卡片', sel: '.nk-idx-card, .nk-cat-card' },
    { route: '/character', label: '搜索框', sel: '.nk-cat-search input' },
    { route: '/character/1212', label: '技能滑条（input[type=range]）', sel: 'input[type="range"]' },
    { route: '/debug', label: '下拉框（select）', sel: 'select', devOnly: true },
    { route: '/endgame/maze', label: '玩法页面包屑链接', sel: '.nk-egm__crumbs a' },
  ];

  for (const c of CASES) {
    test(`${c.label}：Tab 到它之后周边像素变化`, { tag: c.devOnly ? '@dev-only' : [] }, async ({ page }) => {
      test.setTimeout(90_000);
      await page.goto(c.route);
      await page.waitForTimeout(900);

      let reached = false;
      for (let i = 0; i < 60 && !reached; i += 1) {
        await page.keyboard.press('Tab');
        reached = await page.evaluate((s) => !!document.activeElement?.matches(s), c.sel);
      }
      expect(reached, `Tab 应能到达 ${c.sel}`).toBe(true);

      const target = page.locator(c.sel).first();
      await target.scrollIntoViewIfNeeded();
      const box = await target.boundingBox();
      expect(box, `${c.label} 必须有可测盒`).not.toBeNull();
      const vp = page.viewportSize() ?? { width: 1280, height: 720 };
      const region = {
        x: Math.max(0, Math.round(box!.x - 10)),
        y: Math.max(0, Math.round(box!.y - 10)),
        width: Math.min(Math.round(box!.width + 20), 420, vp.width - Math.max(0, Math.round(box!.x - 10))),
        height: Math.min(Math.round(box!.height + 20), 220, vp.height - Math.max(0, Math.round(box!.y - 10))),
      };
      const focused = await page.screenshot({ clip: region });
      await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
      await page.waitForTimeout(150);
      const blurred = await page.screenshot({ clip: region });
      expect(focused.equals(blurred), `${c.label} 聚焦后周边像素必须变化（否则键盘用户看不到焦点）`).toBe(false);
    });
  }
});
for (const route of ['/', '/character', '/character/1212', '/endgame/maze', '/currency', '/voracity']) {
  test(`${route}：320px 无横向溢出且无未裁剪越界元素`, { tag: ['@visual-detail', '@viewport-pinned'] }, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto(route);
    await page.waitForTimeout(900);
    const r = await page.evaluate(() => {
      const de = document.documentElement;
      const culprits: string[] = [];
      for (const el of document.querySelectorAll('body *')) {
        const b = el.getBoundingClientRect();
        if (b.width === 0 || b.height === 0 || b.right <= de.clientWidth + 1) continue;
        let clipped = false;
        for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
          if (getComputedStyle(p).overflowX !== 'visible') { clipped = true; break; }
        }
        if (!clipped) culprits.push(`${el.tagName.toLowerCase()}.${(el.className || '').toString().trim().split(/\s+/)[0] || '(无类)'}@${Math.round(b.right)}`);
      }
      return { overflow: de.scrollWidth - de.clientWidth, culprits: [...new Set(culprits)].slice(0, 5) };
    });
    expect(r.overflow, `${route} 在 320px 不得横向溢出`).toBeLessThanOrEqual(1);
    expect(r.culprits, `${route} 320px 不得有未裁剪的越界元素`).toEqual([]);
  });
}
for (const route of ['/', '/character', '/character/1212', '/endgame/maze', '/currency', '/settings']) {
  test(`${route}：强制色模式可读且不溢出`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, locale: 'zh-CN', forcedColors: 'active' });
    const page = await ctx.newPage();
    try {
      await page.goto(route);
      await page.waitForTimeout(800);
      const r = await page.evaluate(() => {
        const de = document.documentElement;
        const bodyBg = getComputedStyle(document.body).backgroundColor;
        const canvasBg = getComputedStyle(de).backgroundColor;
        const linkColor = getComputedStyle(document.querySelector('a, button, h1') ?? de).color;
        const canvasActive = linkColor === 'rgb(255, 255, 255)';
        let dim = 0;
        const samples: string[] = [];
        for (const el of document.querySelectorAll('h1, h2, h3, p, span, a, button, li, td')) {
          const text = (el.textContent || '').trim();
          if (!text || el.children.length) continue;
          const b = el.getBoundingClientRect();
          if (b.width === 0 || b.height === 0) continue;
          const m = getComputedStyle(el).color.match(/rgba?\(([^)]+)\)/);
          const parts = m ? m[1].split(',').map((s) => parseFloat(s)) : [];
          const alpha = parts.length === 4 ? parts[3] : 1;
          if (alpha < 0.5) { dim += 1; if (samples.length < 3) samples.push(`${el.tagName.toLowerCase()}.${(el.className || '').toString().split(' ')[0]} α=${alpha}`); }
        }
        return { bodyBg, canvasBg, linkColor, canvasActive, dim, samples, overflow: de.scrollWidth - de.clientWidth };
      });
      expect(r.canvasActive || r.bodyBg === 'rgb(255, 255, 255)', `forcedColors 模拟未生效（body=${r.bodyBg} html=${r.canvasBg} link=${r.linkColor}），本用例会假绿`).toBe(true);
      expect(r.bodyBg === 'rgb(255, 255, 255)' || r.canvasBg === 'rgb(255, 255, 255)' || r.canvasActive, '强制色模式下画布底色应为白').toBe(true);      expect(r.dim, `${route} 强制色模式下不得有半透明文字：${r.samples.join(' / ')}`).toBe(0);
      expect(r.overflow, `${route} 强制色模式不得横向溢出`).toBeLessThanOrEqual(1);
    } finally {
      await ctx.close();
    }
  });
}
