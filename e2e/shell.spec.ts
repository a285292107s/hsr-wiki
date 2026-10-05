import { test, expect } from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * 应用外壳层契约（与像素/文案无关，视觉迭代不得让其变红）。
 *
 * 覆盖三类「外壳级」事实：
 *   1) **字体加载链路**：字体必须由 `index.html` 的 `<link>` 承载，**CSS 里不得出现 `@import`**——
 *      CSS 内的 `@import` 是串行的（先取到并解析本文件才会去请求被导入的样式表），实测把字体 CSS
 *      推到 +65ms（应用 CSS 之后）、往返 531ms；改为 HTML `<link>` + `preconnect` 后提前到 +10ms。
 *   2) **深色方案声明**：`color-scheme: dark` 决定原生滚动条 / 表单控件下拉 / iOS 过度滚动背景的
 *      绘制色，漏声明时它们按浅色画（目录页滚动条、原生 select 弹层会是白的）。
 *   3) **输入光标随强调色**：`caret-color` 必须等于当前 `--primary`（强调色可切换，故按运行时取值比）。
 *   4) **动效分档**：同类交互必须同曲线、同时长档 —— 全都从令牌读（不写字面量），见文件末尾用例。
 *      动因：目录卡悬停曾同时存在 `0.2s+ease`（浏览器默认曲线）/0.24s/0.25s/0.28s/0.3s 五种，
 *      侧栏与标签页的裸时长也走默认 `ease`，与自定义曲线的手感不同。
 */

const PAGE = '/character';

test.describe('应用外壳契约', () => {
  test('字体由 HTML <link> 承载且 CSS 内无 @import；两款字体真的可用', async ({ page }) => {
    const html = readFileSync('index.html', 'utf8');
    expect(html, 'index.html 应 preconnect 字体源').toContain('rel="preconnect" href="https://fonts.gstatic.com"');
    expect(html, 'index.html 应以 <link rel="stylesheet"> 加载字体').toMatch(/rel="stylesheet"[\s\S]{0,200}fonts\.googleapis\.com/);

    const cssDir = 'src/styles';
    const offenders = readdirSync(cssDir)
      .filter((f) => f.endsWith('.css'))
      .filter((f) => /^\s*@import\b/m.test(readFileSync(join(cssDir, f), 'utf8')));
    expect(offenders, 'CSS 内不得有 @import（串行阻塞字体加载）').toEqual([]);

    await page.goto(PAGE);
    const fonts = await page.evaluate(async () => {
      await document.fonts.ready;
      return {
        hud: document.fonts.check('12px "IBM Plex Mono"'),
        body: document.fonts.check('12px "Noto Sans SC"'),
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
      // 把 hex 令牌与 rgb 计算值都归一成 "r,g,b" 再比（两者写法不同）
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

  test('同类交互的动效同曲线、同时长档（时长与曲线都从令牌读）', async ({ page }) => {
    /* 判据：① 任何交互反馈的 `transitionTimingFunction` 都必须等于 `--nk-ease-out`（不允许裸时长
       落到浏览器默认 `ease`）；② 目录卡「表面反馈」（border-color/box-shadow/transform）时长必须等于
       `--nk-dur-normal`，「标签反馈」（color）等于 `--nk-dur-hover`。期望值全部从 `:root` 令牌读，
       故调整分档不会让用例变红、只有「某个组件自己写了别的值」才会。 */
    await page.goto('/character');
    await expect(page.locator('.nk-idx-card').first()).toBeVisible();

    /* 目录卡各族分布在不同页面（角色/遗器/货币战争/敌人），必须逐页采集后再比较。
       只读**该元素自身**的 transition（不递归子树）：卡片子树里还有各自的微交互
       （图片放大走 zoom 档、揭示淡入等），把它们混进来会把不同档误判成不一致。 */
    const collectOn = (route: string, selectors: string[]) =>
      page.evaluate(
        ({ selectors }) => {
          const ms = (v: string) => (v.trim().endsWith('ms') ? parseFloat(v) : parseFloat(v) * 1000);
          // 注意：`cubic-bezier(0.16, 1, 0.3, 1)` 自带逗号，必须只按**顶层**逗号切分
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

    const SURFACE = ['.nk-idx-card', '.nk-relic-card__plate', '.nk-crole-card', '.nk-cw-trait-card', '.nk-ach-card'];
    const LABEL = ['.nk-idx-card__name', '.nk-mob-card__name', '.nk-relic-card__name', '.nk-lc-card__name'];
    const surf: Array<{ prop: string; dur: number; ease: string; sel: string }> = [];
    const lbl: Array<{ prop: string; dur: number; ease: string; sel: string }> = [];
    for (const route of ['/character', '/relic', '/currency', '/monster']) {
      await page.goto(route);
      // ① 等主题过渡窗口关闭：强调色/模式在挂载后落到 `data-accent`，`App.vue` 会临时加
      //    `.theme-transitioning`（400ms `!important` 覆盖所有组件的 transition），窗口内读到的是它
      await page.waitForFunction(() => !document.documentElement.classList.contains('theme-transitioning'));
      // ② 等卡片真的渲染出来再采集：并发跑（2 worker）时只在窗口关闭后立刻采集会读到挂载中途的状态
      const anyCard = SURFACE.join(', ') + ', ' + LABEL.join(', ') + ', .nk-mob-card, .nk-lc-card, .nk-relic-card';
      await expect(page.locator(anyCard).first()).toBeVisible();
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
    // 分档判据：表面（border-color / box-shadow）落在 normal 档；文字（color）落在 hover 档；
    // 其余（transform / opacity / filter / background）只要求**落在既有分档内**（不得自造值）
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

/**
 * 焦点可见性契约（像素差法，实现无关）。
 *
 * 为什么不查 `outline`：指示可能落在**宿主**上（如 `.nk-cat-search:focus-within` 改边框+内投影，
 * 内部 `input` 本身 `outline: none`）——只读被聚焦元素的计算样式会误报。像素差对「自身环」与
 * 「宿主变化」一视同仁。
 * 为什么必须真按 Tab：合成 `el.focus()` 不触发 `:focus-visible`（仓库既有先例）。
 * 为什么用「聚焦态 vs blur 后」而不是「聚焦前 vs 后」：Tab 会把目标滚进视野，两次截图的取景会漂移；
 * blur 不滚动，取景完全一致。
 * 覆盖面：外壳（a/button）、目录卡片、表单控件（input/select）、玩法页内链。
 */
test.describe('焦点可见性（键盘 Tab 后元素周边像素必须变化）', () => {
  const CASES = [
    { route: '/', label: '侧栏链接', sel: '.ui-sidebar-link' },
    { route: '/character', label: '目录卡片', sel: '.nk-idx-card, .nk-cat-card' },
    { route: '/character', label: '搜索框', sel: '.nk-cat-search input' },
    { route: '/character/1212', label: '技能滑条（input[type=range]）', sel: 'input[type="range"]' },
    { route: '/debug', label: '下拉框（select）', sel: 'select' },
    { route: '/endgame/maze', label: '玩法页面包屑链接', sel: '.nk-egm__crumbs a' },
  ];

  for (const c of CASES) {
    test(`${c.label}：Tab 到它之后周边像素变化`, async ({ page }) => {
      await page.goto(c.route);
      await page.waitForTimeout(900); // 等入场动画与主题过渡结束

      // 真按 Tab 走到目标（最多 60 次，覆盖目录页大量卡片）
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
      // blur 不滚动 ⇒ 取景不变，只少了焦点指示
      await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
      await page.waitForTimeout(150);
      const blurred = await page.screenshot({ clip: region });
      expect(focused.equals(blurred), `${c.label} 聚焦后周边像素必须变化（否则键盘用户看不到焦点）`).toBe(false);
    });
  }
});
/**
 * 最窄宽度重排契约（320px ≈ iPhone SE 1 代 / 桌面 200% 缩放等效）。
 *
 * 为什么单独钉 320px：e2e 的 mobile-chromium 项目是 Pixel 7（412px），320px 此前没有任何契约——
 * 横向溢出会让整页左右滑动，是最容易被一眼看到的重排缺陷。
 * 断言口径：① `scrollWidth ≤ clientWidth + 1`；② 越界元素扫描为空（遍历所有元素，排除被祖先
 * `overflow-x` 裁剪者，失败时打印元凶，比单纯溢出值更有诊断力，且不依赖任何类名）。
 * 注意：用例在**顶层 for 里声明**（缩进 2 空格），守卫 `check-e2e-viewport-tags` 只识别 ≤2 空格
 * 缩进的 `test(`，放进 `describe → for` 会让它把 setViewportSize 误归属给上一个用例。
 */
for (const route of ['/', '/character', '/character/1212', '/endgame/maze', '/currency', '/voracity']) {
  test(`${route}：320px 无横向溢出且无未裁剪越界元素`, { tag: '@viewport-pinned' }, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto(route);
    await page.waitForTimeout(900); // 等入场动画结束，避免动画中间态误判
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
/**
 * 强制色模式（Windows 高对比 / `forced-colors: active`）冒烟契约。
 *
 * 这一档此前完全没有覆盖：本站大量用 `color-mix()` 与渐变做层次，若某处文字依赖「低不透明度」
 * 表达次要层级，进入强制色模式后会变成不可读或消失。判据只用两件实现无关的事实：
 * ① 可见文本不得是半透明（α < 0.5）——强制色模式下 UA 会把 `color` 换成系统色，**仍半透明**
 *    说明作者用 `opacity` 或 rgba 把文字压淡了；
 * ② 不得横向溢出（系统字体/边框宽度变化会挤破版心）。
 * 自带正控：先断言 body 背景确实被 UA 换成了白色——否则说明模拟没生效，用例会静静地假绿。
 */
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
        return { bodyBg, dim, samples, overflow: de.scrollWidth - de.clientWidth };
      });
      // 正控：模拟必须真的生效（UA 强制底色）
      expect(r.bodyBg, 'forcedColors 模拟未生效，本用例会假绿').toBe('rgb(255, 255, 255)');
      expect(r.dim, `${route} 强制色模式下不得有半透明文字：${r.samples.join(' / ')}`).toBe(0);
      expect(r.overflow, `${route} 强制色模式不得横向溢出`).toBeLessThanOrEqual(1);
    } finally {
      await ctx.close();
    }
  });
}
