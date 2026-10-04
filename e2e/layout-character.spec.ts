import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { collectConsoleIssues, computedNumber, readJson, resolveTokenColor } from './helpers';
import { charFamilyIds, charSkillNames, expectNoSkillsOverflow, noUnknownOverflow, pseudoBox, skillRailX, tableBoxWithinCard } from './layout.shared';

/**
 * 布局验收：角色详情页 —— layout 验收层（语义契约 + 数值规格）分文件之一。
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

test.describe('布局验收：角色详情页', () => {
  test('/character/1001：hero、概览面板、无溢出', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/character/1001');
    // CharHero 渲染（数据流最复杂的高频路径，P1-3）
    await expect(page.locator('.nk-hero--char')).toBeVisible();
    await expect(page.locator('.nk-hero__archive')).toContainText('1001');
    // 概览面板结构出现（PROFILE / TALENTS 等区块）
    await expect(page.locator('.nk-profile, .nk-title').first()).toBeVisible();
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  // 「档案馆」样张的版面契约（R1 铺开前先钉住，否则会被后续区块改造静默改掉）：
  //   00 属性 = 卷宗规格表 —— 单列、逐行一枚属性身份色、引导线夹在名称与取值之间、取值列右对齐。
  // 期望值一律派生：行首色从 `--prop-<data-prop>` 令牌解析、行索引从标题索引派生；不写死颜色与像素。
  test('/character/1001：00 属性为卷宗规格表（单列 / 属性身份色 = --prop-* / 无假进度条）', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/character/1001');
    await page.waitForSelector('.nk-stats__stat');

    const gridCols = await page.locator('.nk-stats__grid').evaluate((el) => getComputedStyle(el).gridTemplateColumns);
    expect(gridCols.trim().split(/\s+/), '属性表必须单列（双列削掉引导线长度）').toHaveLength(1);

    const rows = page.locator('.nk-stats__stat');
    const n = await rows.count();
    expect(n, '基础属性项数 = StatsPanel 输出项数').toBe(8);

    // 行首色：期望值只能从领域层令牌派生（`--prop-*`，不随主题 / 强调色）
    const props = await rows.evaluateAll((els) => els.map((el) => el.getAttribute('data-prop')));
    expect(props.filter(Boolean)).toHaveLength(n);
    expect(new Set(props).size, '属性键不得重复').toBe(n);
    for (let i = 0; i < n; i++) {
      const actual = await rows.nth(i).evaluate((el) => getComputedStyle(el, '::before').backgroundColor);
      expect(actual, `第 ${i + 1} 行行首色须等于 --prop-${props[i]}`).toBe(
        await resolveTokenColor(page, `--prop-${props[i]}`, '.nk-char-page'),
      );
    }

    // 索引刻度：行索引 = 标题索引 + 行序（期望值从标题派生，不写死 "00"）
    const secIdx = (await page.locator('.nk-title__idx').first().innerText()).trim();
    await expect(rows.locator('.nk-stats__idx')).toHaveText(props.map((_, i) => `${secIdx}-${i + 1}`));

    // 引导线：条数 = 行数，且必须真的夹在名称与取值之间（否则退化成装饰性满行线）
    await expect(page.locator('.nk-stats__lead')).toHaveCount(n);
    const [lead, label, val] = await rows.first().evaluate((row) => {
      const b = (sel: string) => row.querySelector(sel)!.getBoundingClientRect();
      return [b('.nk-stats__lead'), b('.nk-stats__label'), b('.nk-stats__val')] as const;
    });
    expect(lead.left, '引导线起点须在名称之后').toBeGreaterThanOrEqual(label.right - 1);
    expect(lead.right, '引导线终点须在取值之前').toBeLessThanOrEqual(val.left + 1);
    expect(lead.width, '引导线须填满中间列').toBeGreaterThan(0);

    // 取值列右对齐 = 等宽数字列：8 行右缘共线
    const rights = await rows.locator('.nk-stats__val').evaluateAll((els) => els.map((el) => el.getBoundingClientRect().right));
    for (const r of rights) expect(Math.abs(r - rights[0]), '取值列右缘共线').toBeLessThanOrEqual(1);

    // 恒定 100% 的假进度条（零信息量的「带填充轨道的评分条」）已退场，代之以铭文 + 发丝收口
    await expect(page.locator('.nk-stats__level-fill, .nk-stats__level-track')).toHaveCount(0);
    await expect(page.locator('.nk-stats__level-rule')).toHaveCount(1);

    await noUnknownOverflow(page);
    assertNoErrors();
  });

  // hero 可读性契约：压在媒体上的文字只靠字形自身（细软影）拉开，媒体上不得出现底板 / 整片压暗。
  // 用户判据——底板浓度无论怎么调都会明显影响立绘与 Spine，而文字与立绘重叠本就不多；
  // 重叠面积与最坏单像素的实测值见 `character-hero.css` 的 `--nk-hero-glyph-ink` 注释（此处不复述，避免漂移）。
  //
  // hero 素材对位契约（A2 收口）：1024~1439 档媒体盒贴到视口、容器无余量可移，故改**资产对位**
  // （`background-position: right`），≥1440 档改走容器整体位移（保持立绘与 Spine 对齐）。
  // 断言用相对关系而非像素：窄档对位必须比宽档更靠右（`background-position-x` 100% vs 50%），
  // 且 1440 起必须回到与 Spine 对齐的居中档——否则「窄档收益」会被一次无关改动静默抹掉。
  test('/character/1001：hero 素材对位分档（窄桌面档右对齐 / ≥1440 回到居中）', { tag: '@viewport-pinned' }, async ({ page }) => {
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
    // 相对关系：窄档对位必须严格更靠右（百分比定位下 100% > 50%）
    expect(narrow.x, `窄档 bgPositionX=${narrow.x} 须大于宽档 ${wide.x}`).toBeGreaterThan(wide.x);
    assertNoErrors();
  });

  test('/character/1001 桌面：hero 文字可读性只落在字形（媒体无底板 / 无整片遮罩）', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/character/1001');
    await page.waitForSelector('.nk-hero--char');
    await page.waitForSelector('.nk-stats__stat');

    // ① 三行文字（信息行 / 名称 / 简介）都带字形软影：墨色来自令牌、层数受控（原实现是 8 层描边盾）
    const ink = (await resolveTokenColor(page, '--nk-hero-glyph-ink', '.nk-char-page')).replace(/\s+/g, '');
    // 序列化随引擎而定（Chromium 给 `color(srgb 0 0 0 / 0.82)`），故只断言「不是全不透明」
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

    // ② 徽标为裸文字（用户判据：底板比页面更黑读作「洞」）；压绘处的可读性交给字形软影
    for (const b of await page.locator('.nk-hero__badge:not(.nk-hero__badge--enh)').all()) {
      expect(
        await b.evaluate((el) => getComputedStyle(el).backgroundColor.replace(/\s+/g, '')),
        '元素/命途徽标须为裸文字',
      ).toBe('rgba(0,0,0,0)');
    }

    // ③ 卷宗编号行不得压在媒体上：必须在信息面板盒内（head 首行），且无自身底板
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

    // ③ 面板不得有整块底板（`::before` 伪底 + 自身底色 / 底图）
    const panel = await page.locator('.nk-hero__panel').evaluate((el) => {
      const cs = getComputedStyle(el);
      return { before: getComputedStyle(el, '::before').content, bg: cs.backgroundColor.replace(/\s+/g, ''), bgImage: cs.backgroundImage };
    });
    expect(panel.before, '面板框整块底板已退场，不得回归').toBe('none');
    expect(panel.bg, '面板不得有整块底色').toBe('rgba(0,0,0,0)');
    expect(panel.bgImage, '面板不得有整块渐变底板').toBe('none');

    // ④ 媒体上不得有覆盖 >30% 媒体面积的压暗层（面板内文字区与小件铭牌 / 开关除外）
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

  // 触控热区契约：视觉盒 59×26 靠 `::before { inset: -12px }` 扩到 ≥44×44（WCAG 2.2 AA 目标尺寸）。
  // 判定必须按**命中区**：伪元素不返回自身、`elementFromPoint` 只返回宿主，故只能从中心向外扫边界。
  test('/character/1001：hero「动画」开关命中区不小于 44×44', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/character/1001');
    await page.waitForSelector('.nk-hero__toggle');
    const extent = await page.locator('.nk-hero__toggle').evaluate((btn) => {
      const b = btn.getBoundingClientRect();
      const cx = b.x + b.width / 2;
      const cy = b.y + b.height / 2;
      const hit = (x: number, y: number) => {
        const el = document.elementFromPoint(x, y);
        return !!el && (el === btn || btn.contains(el));
      };
      const scan = (dx: number, dy: number) => {
        let d = 0;
        while (d < 120 && hit(cx + dx * (d + 1), cy + dy * (d + 1))) d++;
        return d;
      };
      const l = scan(-1, 0);
      const r = scan(1, 0);
      const u = scan(0, -1);
      const dn = scan(0, 1);
      // 扫描得到的是自中心的半径，命中尺寸必须 left+right+1（把半径当宽度会得出翻倍的假值）
      return { w: l + r + 1, h: u + dn + 1 };
    });
    const MIN_TARGET = 44; // 跨会话不得漂移的契约值（WCAG 2.2 AA 目标尺寸）
    expect(extent.w, '命中区宽度').toBeGreaterThanOrEqual(MIN_TARGET);
    expect(extent.h, '命中区高度').toBeGreaterThanOrEqual(MIN_TARGET);
    assertNoErrors();
  });

  // 骨架态只代理「盒子」：同一角色下骨架面板与就绪面板必须同宽同高，且两态都不给媒体加底板
  // （底板绝对定位在面板上 ⇒ 面板一变高、底板顶边就跳；2026-09 记过同类 204px 高度跳变）。
  // 高度一处比对的是骨架盒高（`--nk-hero-panel-h`，全量中位数上取整）与就绪面板高——就绪侧同值
  // min-height 兜底，故这条断言 = 「就绪内容不得高过骨架盒高」，与字体度量无关（见 character-skeleton.css）。
  // `@font-calibrated`：就绪内容高仍是若干 `line-height: normal` 行盒之和（比例随解析到的回退字体变，
  // Linux runner 比标定源高 2~3px）⇒ 该断言判定依赖平台，CI 层不收集、本机全量判（见 docs/agents/testing.md）。
  test('/character/1001 桌面：骨架态与就绪态 hero 面板同框且两态均不给媒体加底板', { tag: ['@viewport-pinned', '@font-calibrated'] }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 1440, height: 900 });

    // 延迟主数据响应以停在骨架态（use-delayed-skeleton 的展示阈值远小于此）
    await page.route('**/data/cn/characters/1001.json', async (r) => {
      await new Promise((res) => setTimeout(res, 4000));
      await r.continue();
    });
    await page.goto('/character/1001');
    await page.waitForSelector('.nk-sk--stat', { timeout: 30_000 });
    const skel = await page.locator('.nk-skeleton__hero-panel').evaluate((el) => {
      const r = el.getBoundingClientRect();
      const first = el.firstElementChild as HTMLElement;
      return { w: r.width, h: r.height, barShadow: getComputedStyle(first).boxShadow };
    });
    await page.unroute('**/data/cn/characters/1001.json');
    await page.waitForSelector('.nk-stats__stat', { timeout: 30_000 });
    // 编号行用 hud 字体；worker 并发下量高会跑在字体就位之前（±2px 抖动 ⇒ 1px 容差误报）
    await page.evaluate(() => document.fonts.ready);
    const ready = await page.locator('.nk-hero__panel').evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { w: r.width, h: r.height, bgImage: getComputedStyle(el).backgroundImage };
    });

    expect(Math.abs(skel.w - ready.w), '骨架与就绪面板同宽').toBeLessThanOrEqual(1);
    expect(Math.abs(skel.h - ready.h), '骨架与就绪面板同高（骨架盒高 = 全量中位数，就绪侧同值 min-height 兜底）').toBeLessThanOrEqual(1);
    expect(skel.barShadow, '骨架条块不得带底板（骨架态同样不压暗媒体）').toBe('none');
    expect(ready.bgImage, '就绪态面板不得有整块底板').toBe('none');
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  // 平板档（768~1023）版式契约：改为「文字在左 · 媒体在右」并排（媒体竖幅）——竖排会在文字块右侧
  // 留近半个面板宽的空洞、媒体带居中后左右各留 113px，读作「手机版式被拉宽」。骨架态必须逐项同框。
  // 注：骨架/就绪之间恒有 ~1.4px 横向差（既有、三档一致、加载期不可见），故 x/y 取 2px 容差。
  test('/character/1001 平板档：文字与媒体并排且骨架同框', { tag: ['@viewport-pinned', '@font-calibrated'] }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 768, height: 1024 });
    const measure = (rootSel: string) => page.evaluate((sel) => {
      const root = document.querySelector(sel) as HTMLElement;
      const box = (s: string) => {
        const el = root.querySelector(s) as HTMLElement | null;
        if (!el) return null;
        const b = el.getBoundingClientRect();
        return { x: +b.x.toFixed(1), y: +b.y.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1) };
      };
      return {
        visual: box('.nk-skeleton__hero-visual, .nk-hero__visual'),
        panel: box('.nk-skeleton__hero-panel, .nk-hero__panel'),
      };
    }, rootSel);

    await page.route('**/data/cn/characters/1001.json', async (r) => {
      await new Promise((res) => setTimeout(res, 4000));
      await r.continue();
    });
    await page.goto('/character/1001');
    await page.waitForSelector('.nk-sk--stat', { timeout: 30_000 });
    const skel = await measure('.nk-skeleton--char');
    await page.unroute('**/data/cn/characters/1001.json');
    await page.waitForSelector('.nk-stats__stat', { timeout: 30_000 });
    await page.evaluate(() => document.fonts.ready);
    const ready = await measure('.nk-char-page');

    expect(ready.panel, '就绪态面板须存在').not.toBeNull();
    expect(ready.visual, '就绪态媒体须存在').not.toBeNull();
    expect(
      ready.panel!.x,
      '平板档须并排：面板左缘在媒体右缘之后（竖排时两者左缘相同）',
    ).toBeGreaterThan(ready.visual!.x + ready.visual!.w - 1);
    expect(ready.visual!.h, '平板档媒体须竖幅（高 > 宽）').toBeGreaterThan(ready.visual!.w);

    expect(Math.abs(skel.visual!.w - ready.visual!.w), '骨架媒体同宽').toBeLessThanOrEqual(1);
    expect(Math.abs(skel.visual!.h - ready.visual!.h), '骨架媒体同高').toBeLessThanOrEqual(1);
    expect(Math.abs(skel.panel!.x - ready.panel!.x), '骨架面板同列').toBeLessThanOrEqual(2);
    expect(Math.abs(skel.panel!.y - ready.panel!.y), '骨架面板纵向同位（居中）').toBeLessThanOrEqual(2);
    expect(Math.abs(skel.panel!.h - ready.panel!.h), '骨架面板同高（骨架盒高 = 平板档中位数，就绪侧同值 min-height 兜底）').toBeLessThanOrEqual(1);

    await noUnknownOverflow(page);
    assertNoErrors();
  });

  // 边界断点契约：最窄桌面档（1024×768）与矮横屏（1440×460，hero 取 min-height 560 会超出视口）下，
  // 面板必须整体留在 hero 内且不引出横向溢出。
  test('/character/1001：hero 面板在 1024 与矮横屏下仍落在 hero 内', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    for (const vp of [{ width: 1024, height: 768 }, { width: 1440, height: 460 }]) {
      await page.setViewportSize(vp);
      await page.goto('/character/1001');
      await page.waitForSelector('.nk-hero--char');
      await page.waitForSelector('.nk-stats__stat');
      const g = await page.evaluate(() => {
        const hero = document.querySelector('.nk-hero--char') as HTMLElement;
        const panel = document.querySelector('.nk-hero__panel') as HTMLElement;
        const name = document.querySelector('.nk-hero__name') as HTMLElement;
        const hb = hero.getBoundingClientRect();
        const pb = panel.getBoundingClientRect();
        return {
          glyphShadow: getComputedStyle(name).textShadow,
          panelInside:
            pb.left >= hb.left - 0.5 && pb.right <= hb.right + 0.5 &&
            pb.top >= hb.top - 0.5 && pb.bottom <= hb.bottom + 0.5,
        };
      });
      expect(g.glyphShadow, `${vp.width}×${vp.height}：文字可读性须由字形软影承担`).not.toBe('none');
      expect(g.panelInside, `${vp.width}×${vp.height}：面板须整体在 hero 内`).toBe(true);
      await noUnknownOverflow(page);
    }
    assertNoErrors();
  });

  // 卷宗封面结构契约：抬头行（编号 · 引导线 · 阵营）→ 规格行（星级 / 属性 / 命途）→ 名称族
  // （中文主字 + 拉丁注音）→ 摘要。阵营不再与游戏机制徽标混排；拉丁注音期望值从随站数据派生。
  test('/character/1001：hero 卷宗封面结构（阵营归抬头行 / 拉丁注音 = name_en / 名称族内距最紧）', async ({ page }) => {
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

    // 名称族是一个排版单元：主字 > 注音字号，且族内行距小于 head 各行的行距
    const geo = await page.evaluate(() => {
      const fs = (s: string) => parseFloat(getComputedStyle(document.querySelector(s)!).fontSize);
      const gap = (s: string) => parseFloat(getComputedStyle(document.querySelector(s)!).rowGap) || 0;
      return { name: fs('.nk-hero__name'), en: fs('.nk-hero__name-en'), titleGap: gap('.nk-hero__title'), headGap: gap('.nk-hero__head') };
    });
    expect(geo.name, '主字字号须大于拉丁注音').toBeGreaterThan(geo.en);
    expect(geo.titleGap, '名称族内距须小于抬头 / 规格行的行距').toBeLessThan(geo.headGap);
    expect(geo.titleGap, '名称族内距不得归零（中文主字与注音会贴死）').toBeGreaterThan(0);

    // 字阶档位：卷宗编号是主字与注记之间唯一的中档锚点（上游 id），
    // 必须大于抬头标签与注记、又必须小于主字——不得越档抢主字。
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

  // 抬头行断点形态契约：≥1024 文字列与立绘共享横向空间，阵营并排时必落在立绘亮部（1440 实测阵营
  // 起点 483 / 立绘左缘 452，高 DPI 取证可见灰字压在花瓣上）⇒ 拆两行、两项都退回文字列左缘；
  // <1024 面板在媒体下方、重叠为零，保持单行以省面板高度。纵向分隔只在单行形态里成立。
  // 判据用**纵向区间相交**而非 top 相等：抬头行两端字号不同（编号 1.25rem / 阵营 0.6875rem），
  // `align-items: center` 会让同一行的两项 top 差半个行高——top 差法会把「同行」误判成「拆行」。
  test('/character/1001：抬头行断点形态（≥1024 拆两行且分隔退场 / <1024 单行保留分隔）', { tag: '@viewport-pinned' }, async ({ page }) => {
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

  // 占位符契约：开拓者形态名上游为 {NICKNAME}（玩家命名），converter 输出空串，前端不得渲染、
  // 更不得回退拼造译名（禁止自建数据源）。
  test('/character/8001：开拓者形态无拉丁注音（占位符留空不渲染）', async ({ page }) => {
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

  // 入场编排契约：四行同一关键帧、一次性、延迟递增（stagger）；reduced-motion 下整体关闭——
  // 只断言 `animation-duration` 被压到 0.01ms 不够（tokens.css 的全局降级就是这么做的），
  // 故这里断言动画名归 none，证明页面级 opt-out 生效。
  test('/character/1001：hero 封面入场编排（延迟递增 + reduced-motion 关闭）', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/character/1001');
    await page.waitForSelector('.nk-hero__name');

    const rows = ['.nk-hero__rubric', '.nk-hero__meta-row', '.nk-hero__title', '.nk-hero__desc'];
    const anim = await page.evaluate((sels) => sels.map((s) => {
      const el = document.querySelector(s);
      if (!el) return null;
      const c = getComputedStyle(el);
      return { name: c.animationName, delay: parseFloat(c.animationDelay) || 0, count: c.animationIterationCount };
    }), rows);
    expect(anim.every(Boolean), '四行须齐备（1001 有简介）').toBe(true);
    expect(new Set(anim.map((a) => a!.name)), '四行须共用同一入场关键帧').toEqual(new Set(['nk-char-rise']));
    expect(new Set(anim.map((a) => a!.count)), '入场只播一次').toEqual(new Set(['1']));
    for (let i = 1; i < anim.length; i++) {
      expect(anim[i]!.delay, `第 ${i + 1} 行须晚于上一行（错峰）`).toBeGreaterThan(anim[i - 1]!.delay);
    }

    await page.emulateMedia({ reducedMotion: 'reduce' });
    const reduced = await page.evaluate((sels) => sels.map(
      (s) => getComputedStyle(document.querySelector(s)!).animationName,
    ), rows);
    expect(reduced, 'reduced-motion 下入场动画须整体退场').toEqual(['none', 'none', 'none', 'none']);
    await page.emulateMedia({ reducedMotion: 'no-preference' });

    assertNoErrors();
  });

  // 滚动视差契约：媒体层（含 Spine）随页面滚动滞后，文字面板不动 ⇒ 文字与素材分层。
  // 断言的是「timeline 驱动的位移随滚动推进、越界后封顶、面板不随动」；
  // reduced-motion 必须靠页面级 opt-out——全局降级只压 animation-duration，而 timeline 进度不看 duration。
  test('/character/1001 桌面：hero 媒体滚动视差（推进 / 封顶 / 面板不动 / reduced-motion 关闭）', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/character/1001');
    await page.waitForSelector('.nk-hero--char');
    await page.waitForSelector('.nk-stats__stat');

    const snap = () => page.evaluate(() => {
      const v = document.querySelector('.nk-hero__visual') as HTMLElement;
      const p = document.querySelector('.nk-hero__panel') as HTMLElement;
      return {
        shift: new DOMMatrixReadOnly(getComputedStyle(v).transform).m42,
        panelShift: new DOMMatrixReadOnly(getComputedStyle(p).transform).m42,
        anim: getComputedStyle(v).animationName,
      };
    });
    const scrollTo = (top: number) => page.evaluate((t) => {
      (document.querySelector('.nk-page--detail') as HTMLElement).scrollTop = t;
    }, top);

    const atTop = await snap();
    // 渐进增强契约：整条动画必须关在 `@supports (animation-timeline: scroll())` 里。
    // 不支持滚动时间轴的引擎（实测 Firefox）会忽略 `animation-timeline`，动画退回普通时间轴跑完并停在末帧
    // （`fill: both`）⇒ 媒体层被**永久下移 36px**，那不是「少个动效」而是构图位移 + 与文字列错层。
    // 故分两路断言：支持 ⇒ 挂上动画且首屏 0；不支持 ⇒ 必须**完全没有动画**且位移恒 0（静态构图）。
    const supportsScrollTimeline = await page.evaluate(() => CSS.supports('animation-timeline', 'scroll(nearest)'));
    if (supportsScrollTimeline) {
      expect(atTop.anim, '媒体须挂上滚动驱动动画').toBe('nk-hero-lag');
    } else {
      expect(atTop.anim, '不支持滚动时间轴时不得挂动画（否则会停在末帧并永久下移）').toBe('none');
    }
    expect(atTop.shift, '首屏不得有位移（与静态版面一致）').toBeCloseTo(0, 1);

    if (!supportsScrollTimeline) {
      // 不支持档：滚动任何距离都不得产生位移（静态构图），这正是本条存在的原因
      await scrollTo(4000);
      expect((await snap()).shift, '不支持滚动时间轴时媒体位移须恒为 0').toBeCloseTo(0, 1);
      await noUnknownOverflow(page);
      assertNoErrors();
      return;
    }

    await scrollTo(300);
    await expect.poll(async () => (await snap()).shift, { timeout: 3_000 }).toBeGreaterThan(8);
    const mid = await snap();
    expect(mid.panelShift, '文字面板不得随媒体位移').toBeCloseTo(0, 1);

    await scrollTo(600);
    await expect.poll(async () => (await snap()).shift, { timeout: 3_000 }).toBeGreaterThan(mid.shift);
    const far = await snap();

    // 滚过 animation-range 后位移封顶：继续滚不得再增长（容 0.5px 次像素）
    await scrollTo(4000);
    await expect.poll(
      async () => Math.abs((await snap()).shift - far.shift) <= 0.5,
      { timeout: 3_000 },
    ).toBe(true);

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect.poll(async () => (await snap()).anim, { timeout: 3_000 }).toBe('none');
    expect((await snap()).shift, 'reduced-motion 下媒体不得位移').toBeCloseTo(0, 1);
    await page.emulateMedia({ reducedMotion: 'no-preference' });

    await noUnknownOverflow(page);
    assertNoErrors();
  });

  // 宽档构图偏移契约：立绘整体右移（逐字形像素实测：1920 档抬头阵营行压绘 39% → 11.6%、
  // 规格行 32.7% → 0%、最坏对比度 2.88 → 4.03）。三条不变量：
  //   ① 偏移落在**布局层**（left），不走 transform —— transform 归滚动视差，两者互不覆盖；
  //   ② 构图不得依赖动画是否在跑（reduced-motion 下 left 不变）；
  //   ③ 偏移量从 CSS 变量派生，不在断言里写死像素。
  test('/character/1001 宽档：立绘横向偏移在布局层且不随动效偏好变化', { tag: '@viewport-pinned' }, async ({ page }) => {
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

  // 内容切换编排契约：换角色时 hero 必须**重挂**——store 的 load 先清 data ⇒ hero 卸载 → 数据到位后新挂载，  // 入场编排随之重播。判据用 DOM 节点身份（不依赖动画时序，慢机也不 flake）；
  // 若日后改成跨角色复用 data（不重置），本条会红——那正是要拦住的回归。
  test('/character/1001：换角色后 hero 重挂（入场编排随之重播）', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/character/1001');
    await page.waitForSelector('.nk-hero__name');
    const before = await page.evaluate(() => {
      (document.querySelector('.nk-hero__title') as HTMLElement & { __probe?: number }).__probe = 1;
      return (document.querySelector('.nk-hero__name') as HTMLElement).textContent;
    });

    const target = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('.nk-build__team-link[href^="/character/"]'));
      const hit = links.find((a) => a.getAttribute('href') !== '/character/1001');
      return hit ? hit.getAttribute('href') : null;
    });
    expect(target, '1001 的队伍里须有其他角色可跳（否则本用例失去区分力）').toBeTruthy();

    await page.locator(`.nk-build__team-link[href="${target}"]`).first().click();
    await expect.poll(
      async () => page.evaluate(() => (document.querySelector('.nk-hero__name') as HTMLElement).textContent),
      { timeout: 15_000 },
    ).not.toBe(before);

    const remounted = await page.evaluate(
      () => (document.querySelector('.nk-hero__title') as HTMLElement & { __probe?: number }).__probe !== 1,
    );
    expect(remounted, '换角色后 hero 须重挂（入场编排重播）').toBe(true);

    // 不断言整页无溢出：换角色后 Spine 画布已在场，而该画布（scale 1.15）恒被整页扫描判红，
    // 属已定性但未登记的既有缺陷（见 docs/memory/2026-09.md）——要断言须先由 Hero/spine 域裁决。
    assertNoErrors();
  });

  // 全页章标契约：实测页高 7140px / 10 个区块，章节边界全靠章标建立 ⇒ 章标必须压过它统领的正文
  // （页内正文最大 16px：星魂名 / 属性取值 / 队伍角色名；此前章标只有 13px = 字阶倒挂）。
  // 索引与 hero 卷宗编号共用 1.25rem 刻度位；章标横线走实心发丝线（与本页行内引导线同一套线语言，
  // 前缀档的渐隐渐变在本页被推翻）。
  test('/character/1204：区块章标压过正文且横线为实心发丝线', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/character/1204');
    await page.waitForSelector('.nk-stats__stat');
    const m = await page.evaluate(() => {
      const px = (s: string) => {
        const el = document.querySelector(s) as HTMLElement | null;
        return el ? parseFloat(getComputedStyle(el).fontSize) : 0;
      };
      const title = document.querySelector('[data-panel="stats"] .nk-title') as HTMLElement;
      const after = getComputedStyle(title, '::after');
      return {
        label: parseFloat(getComputedStyle(title).fontSize),
        idx: px('[data-panel="stats"] .nk-title__idx'),
        contentMax: Math.max(
          px('[data-panel="stats"] .nk-stats__val'),
          px('[data-panel="eidolons"] .nk-eidolon__name'),
          px('.nk-build__team-name'),
        ),
        afterBgImage: after.backgroundImage,
        afterBgColor: after.backgroundColor,
      };
    });
    expect(m.idx, '章标索引须大于章标标签（档案索引刻度位）').toBeGreaterThan(m.label);
    expect(m.label, '章标须压过它统领的正文（页内正文最大 16px）').toBeGreaterThan(m.contentMax);
    expect(m.afterBgImage, '章标横线不得用渐变（本页统一实心发丝线）').toBe('none');
    expect(m.afterBgColor, '章标横线须为发丝线令牌色').not.toBe('rgba(0, 0, 0, 0)');

    // 不断言整页无溢出：Spine 画布（scale 1.15）恒被整页扫描判红，属已定性未登记的既有缺陷
    // （docs/memory/2026-09.md）——要断言角色详情页整页溢出须先由 Hero/spine 域裁决。
    assertNoErrors();
  });

  // 圆角档位契约（全站反 AI 味立场）：本页圆角只允许四值 —— 0（直角）/ 内联档 / 容器档 / 50%（真圆形）。
  // 2026-10 清过 10px（全局卡片 token 与页面声明冲突）与 999px（手机档「备选队友簇」胶囊），随后把残留的
  // 1.5px（记号端头，半径已达宽度一半 = 全圆端头）与 3px（内联 chip）也并了档。
  // **期望值一律从页面令牌派生**（容器档解析 `--nk-char-radius-card`），只把内联档 4px 写成契约常量：
  // 它是「内联 chip / 小图标」这个尺寸类别的取值，页面没有对应令牌，写绝对值即跨会话不得漂移的契约。
  test('/character/1204：页面圆角只有四值（0 / 内联 / 容器令牌 / 圆形）', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/character/1204');
    await page.waitForSelector('.nk-stats__stat');
    const containerPx = await page
      .locator('.nk-char-page')
      .evaluate((el) => getComputedStyle(el).getPropertyValue('--nk-char-radius-card').trim());
    expect(containerPx, '容器圆角档须来自页面令牌（缺失即回到字面量时代）').not.toBe('');
    const containerNum = parseFloat(containerPx);

    const hits = await page.evaluate((container) => {
      const out: string[] = [];
      document.querySelectorAll('.nk-char-page *').forEach((el) => {
        const r = getComputedStyle(el).borderTopLeftRadius;
        if (!r || r === '0px') return;
        const n = parseFloat(r);
        if (r.endsWith('%')) return;              // 真圆形（头像 / 状态点）属形状，不属档位
        if (n === container) return;              // 容器档：期望值从页面令牌派生
        if (n === 4 || n <= 2) return;            // 内联档 4px；≤2px 的记号端头等同直角
        out.push(`${(el as HTMLElement).className}`.slice(0, 40) + ' = ' + r);
      });
      return Array.from(new Set(out)).slice(0, 8);
    }, containerNum);
    expect(hits, '页面圆角出现了四值之外的档位（含胶囊回潮）').toEqual([]);
    assertNoErrors();
  });

  test('/character/1001：技能卡折叠开关为可点外观（浅底 + 发丝描边 + 6px 圆角）且文案成对', async ({ page }) => {    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/character/1001');
    const toggles = page.locator('.nk-skill__toggle');
    // 1001 三类开关齐备：强化来源（3 技能有 rated_rank_id）/ 技能预览 / 技能数据
    await expect(toggles.first()).toBeVisible();
    // 技能预览随 animDb 异步就绪后挂载，用轮询而非一次性计数
    await expect.poll(() => toggles.count()).toBeGreaterThanOrEqual(3);
    // 可点外观：非裸文字——有发丝描边（>0 且 ≤1px）、有圆角（>0 且非胶囊）、有非全透明底色
    await expect(toggles.first()).toHaveCSS('border-top-style', 'solid');
    const toggleBorder = await computedNumber(toggles.first(), 'border-top-width');
    expect(toggleBorder).toBeGreaterThan(0);
    expect(toggleBorder, '描边必须是发丝线，不得变成粗边').toBeLessThanOrEqual(1);
    const toggleRadius = await computedNumber(toggles.first(), 'border-top-left-radius');
    const toggleBox = await toggles.first().boundingBox();
    expect(toggleRadius).toBeGreaterThan(0);
    expect(toggleRadius, '圆角不得退化成胶囊（999px）').toBeLessThan(toggleBox!.height / 2);
    const bg = await toggles.first().evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bg).not.toBe('rgba(0, 0, 0, 0)');
    // 热区 ≥44px：视觉高约 32px + ::after 上下各 8px（无障碍硬标准）
    const hot = await toggles.first().evaluate((el) => {
      const a = getComputedStyle(el, '::after');
      return { content: a.content, top: a.top, bottom: a.bottom };
    });
    expect(hot).toEqual({ content: '""', top: '-8px', bottom: '-8px' });
    // 文案成对：展开态 = 收起 + 原名（三处统一，不得回退为「收起数据」）
    await expect(page.getByRole('button', { name: '强化来源' }).first()).toHaveAttribute('aria-expanded', 'false');
    const dataBtn = page.getByRole('button', { name: '技能数据' }).first();
    const closed = await dataBtn.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { color: cs.color, border: cs.borderTopColor };
    });
    await dataBtn.click();
    const openedBtn = page.getByRole('button', { name: '收起技能数据' }).first();
    await expect(openedBtn).toHaveAttribute('aria-expanded', 'true');
    // 展开态换色换描边（状态可见，非仅箭头旋转）
    const opened = await openedBtn.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { color: cs.color, border: cs.borderTopColor };
    });
    expect(opened).not.toEqual(closed);
    const animBtn = page.getByRole('button', { name: '技能预览' }).first();
    await animBtn.click();
    await expect(page.getByRole('button', { name: '收起技能预览' }).first()).toHaveAttribute('aria-expanded', 'true');
    const linksBtn = page.getByRole('button', { name: '强化来源' }).first();
    await linksBtn.click();
    await expect(page.getByRole('button', { name: '收起强化来源' }).first()).toHaveAttribute('aria-expanded', 'true');
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/character/1001 手机断点：配队标头渲染、队间距 16px、无溢出', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    // 队数与编号取自角色数据（多队才渲染标头）
    const teams = readJson<{ teams: unknown[] }>('public/data/cn/characters/1001.json').teams;
    expect(teams.length, '1001 应为多队样本（否则标头不渲染）').toBeGreaterThan(1);
    const no = String(teams.length).padStart(2, '0');
    // 先量桌面档队间距（同一元素跨断点比较：手机档只放大不缩小，绝对值交 CSS）
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/character/1001');
    const desktopGap = await page.locator('.nk-build__teams').evaluate(
      (el) => parseFloat(getComputedStyle(el).rowGap),
    );
    expect(desktopGap).toBeGreaterThan(0);
    await page.setViewportSize({ width: 390, height: 844 });
    const heads = page.locator('.nk-build__team-head');
    await expect(heads).toHaveCount(teams.length);
    await expect(heads.first()).toContainText('配队 01');
    await expect(heads.last()).toContainText(`配队 ${no}`);
    await expect(heads.last()).toContainText(`/ ${no}`);
    const gap = await page.locator('.nk-build__teams').evaluate(
      (el) => parseFloat(getComputedStyle(el).rowGap),
    );
    expect(gap, `手机档队间距 ${gap} 不得小于桌面档 ${desktopGap}`).toBeGreaterThanOrEqual(desktopGap);
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  /* ─── 技能族层级 + 图标列折角线（ADR 0022）：真珠 1503 Point01 族 = 150301 + 150308/150310 ─── */

  test('/character/1503：族内首个为父卡（行笔，临摹断水）+ 2 子卡，子卡缩进一个图标空间、竖轨共线、折角接子图标中线', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/character/1503');
    const firstCard = page.locator('[data-panel="skills"] > .nk-skill').first();
    // 技能名一律从 characters/1503.json 的族数据派生（族 id 原序 → 名），不在断言里写死页面文案
    const familyIds = charFamilyIds('1503', 'Point01');
    const familyNames = charSkillNames('1503', familyIds);
    await expect(firstCard.locator('.nk-skill__name').first()).toHaveText(familyNames[0]);

    // 族内首个 = 基座技能 = 父卡，其余两条 = 形态技能 = 子卡（禁止 SkillList 顺序判父子）
    const children = firstCard.locator('.nk-skill--child');
    await expect(children).toHaveCount(familyIds.length - 1);
    await expect(children.locator('.nk-skill__name')).toHaveText(familyNames.slice(1));

    // 令牌：缩进 = 一个技能图标空间（= rail = 图标边长）、间距 = 半个图标空间，均由 rail 派生（不得有独立断点值）
    const tokens = await page.locator('.nk-char-page').evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        rail: cs.getPropertyValue('--nk-skill-rail').trim(),
        gutter: cs.getPropertyValue('--nk-skill-gutter').trim(),
        indent: cs.getPropertyValue('--nk-skill-child-indent').trim(),
        gap: cs.getPropertyValue('--nk-skill-child-gap').trim(),
      };
    });
    expect(tokens).toEqual({ rail: '48px', gutter: '0px', indent: '48px', gap: 'calc(48px / 2)' });
    const indent = parseFloat(tokens.indent);

    // 图标列：子卡整行右移恰好一个图标空间 → 子图标左缘 = 父图标右缘（±1px），两子卡彼此同列
    const iconBox = async (loc: Locator) =>
      loc.locator('.nk-skill__icon').first().evaluate((el) => {
        const r = el.getBoundingClientRect();
        return { left: r.left, right: r.right };
      });
    const parentIcon = await iconBox(firstCard);
    const childIcons = await children.locator('.nk-skill__icon').evaluateAll((els) =>
      els.map((el) => {
        const r = el.getBoundingClientRect();
        return { left: r.left, right: r.right };
      }),
    );
    expect(childIcons).toHaveLength(2);
    for (const box of childIcons) {
      expect(Math.abs(box.left - (parentIcon.left + indent)), '缩进应等于一个图标空间').toBeLessThanOrEqual(1);
      expect(Math.abs(box.left - parentIcon.right), '子图标左缘 = 父图标右缘').toBeLessThanOrEqual(1);
    }
    expect(Math.abs(childIcons[0].left - childIcons[1].left)).toBeLessThanOrEqual(1);

    // 左轴唯一：图标左缘必须与卡头领起元素（类型竖条）落在同一条轴上 = 卡片内容轴。
    // --nk-skill-gutter 一旦非 0 就把图标推出该轴，卡内出现第二条左轴 + 一段无承载物空档（用户报障项）。
    const dotLeft = await firstCard
      .locator('.nk-skill__type-dot')
      .first()
      .evaluate((el) => el.getBoundingClientRect().left);
    expect(Math.abs(parentIcon.left - dotLeft), '图标左缘 = 卡头左轴（gutter 必须为 0）').toBeLessThanOrEqual(1);

    // 竖轨共线：子卡竖轨 x 必须与父卡竖轨相等（父卡在 .nk-skill__body::before、子卡在卡片自身），
    // 且竖轨落点 = 父图标底边水平中点（x = 图标列左缘 + gutter + rail/2）
    const parentRailX = await skillRailX(firstCard);
    expect(Math.abs(parentRailX - (parentIcon.left + parentIcon.right) / 2), '竖轨 = 父图标中线').toBeLessThanOrEqual(1);
    for (let i = 0; i < 2; i++) {
      const childRailX = await skillRailX(children.nth(i));
      expect(Math.abs(childRailX - parentRailX), `第 ${i + 1} 张子卡竖轨应与父卡共线`).toBeLessThanOrEqual(1);
    }

    // └ 收口标记只挂在最后一张子卡上（DOM 序末位）
    expect(
      await children.evaluateAll((els) => els.map((el) => el.classList.contains('nk-skill--child-last'))),
    ).toEqual([false, true]);

    // 旧虚线语言退场：子卡上沿无边框（兄弟边界只由折角线与间距表达）
    await expect(children.first()).toHaveCSS('border-top-style', 'none');

    // 竖轨（::before）= --line-2 发丝线；折角（::after）= 1px 上边框
    const rail = await pseudoBox(children.first(), '::before');
    expect(rail.borderLeftWidth).toBe('1px');
    expect(rail.borderLeftColor, '竖轨颜色必须取自 --line-2 令牌').toBe(await resolveTokenColor(page, '--line-2'));
    const corner = await pseudoBox(children.first(), '::after');
    expect(corner.borderTopWidth).toBe('1px');
    expect(corner.borderTopStyle).toBe('solid');

    // 折角：横段 = 半个图标空间（由 --nk-skill-rail 派生，不钉 24px）→ 右端 x 恰为子卡图标左缘；y 恰为子卡图标中线
    // （包含块原点是卡顶，故 y = 卡顶 + child-gap + rail/2；pseudoBox 不得再加宿主 padding 换算，否则折角错位也会假通过）
    expect(corner.width).toBe(parseFloat(tokens.rail) / 2);
    expect(Math.abs(corner.rightX - childIcons[0].left)).toBeLessThanOrEqual(1);
    const iconCenterY = async (loc: Locator) =>
      loc.locator('.nk-skill__icon').first().evaluate((el) => {
        const r = el.getBoundingClientRect();
        return (r.top + r.bottom) / 2;
      });
    expect(Math.abs(corner.topY - (await iconCenterY(children.first()))), '折角 y = 子图标中线').toBeLessThanOrEqual(1);

    // 竖轨跨行不断：子轨上端顶到卡顶（= 包含块原点）、非末位下延越过本卡底部；
    // 且父卡体底 = 首子卡卡顶、兄弟卡底 = 下一张卡顶（接缝 = 0）
    const midRail = await pseudoBox(children.first(), '::before');
    const cardBox = async (i: number) =>
      children.nth(i).evaluate((el) => {
        const r = el.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom };
      });
    const [child0Box, child1Box] = [await cardBox(0), await cardBox(1)];
    const bodyBottom = await firstCard
      .locator('.nk-skill__body')
      .first()
      .evaluate((el) => el.getBoundingClientRect().bottom);
    expect(Math.abs(midRail.topY - child0Box.top), '子轨上端应顶到卡顶').toBeLessThanOrEqual(1);
    expect(midRail.bottomY).toBeGreaterThanOrEqual(child0Box.bottom - 1);
    expect(Math.abs(child0Box.top - bodyBottom), '父卡体底 = 首子卡卡顶（零缝）').toBeLessThanOrEqual(1);
    expect(Math.abs(child1Box.top - child0Box.bottom), '兄弟卡之间零缝').toBeLessThanOrEqual(1);
    // 末位子卡（└）竖轨止于本卡图标中线，折角横段与 ├ 同长
    const lastRail = await pseudoBox(children.last(), '::before');
    expect(lastRail.bottomY, '└ 竖轨止于子图标中线').toBeLessThanOrEqual((await iconCenterY(children.last())) + 1);
    expect(lastRail.width).toBe(parseFloat(tokens.rail) / 2);

    await expectNoSkillsOverflow(page);
    assertNoErrors();
  });

  test('/character/1503 手机断点 375×812：图标列退场、正文单列全宽、子卡虚线分区 + 12px 缩进（ADR 0023）', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/character/1503');
    const firstCard = page.locator('[data-panel="skills"] > .nk-skill').first();
    await expect(firstCard).toBeVisible();
    await expect(page.locator('.nk-skill--child').first()).toBeVisible();
    // 手机断点不得产生文档级横向滚动（判据按视口宽推导，不写死 376）
    const scrollOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth - (document.documentElement.clientWidth + 1),
    );
    expect(scrollOverflow, `文档宽超出可用宽 ${scrollOverflow}px`).toBeLessThanOrEqual(0);

    // 缩进/间距令牌：缩进 12px（4px 栅格档位），间距仍由 rail 派生
    const vars = await page.locator('.nk-char-page').evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        rail: cs.getPropertyValue('--nk-skill-rail').trim(),
        gutter: cs.getPropertyValue('--nk-skill-gutter').trim(),
        indent: cs.getPropertyValue('--nk-skill-child-indent').trim(),
        gap: cs.getPropertyValue('--nk-skill-child-gap').trim(),
      };
    });
    expect(vars).toEqual({ rail: '44px', gutter: '0px', indent: '12px', gap: 'calc(44px / 2)' });

    // 图标内联：手机断点图标列不渲染，图标换宿主进标题行（与标题同一行、同起左缘）。
    // 判据必须含**竖向重叠**——只比左缘时「图标堆在标题行上方」也成立（本轮实测盲区：+44px/卡）。
    await expect(firstCard.locator('.nk-skill__rail')).toHaveCount(0);
    const iconInRow = await firstCard.evaluate((el) => {
      const row = el.querySelector(':scope > .nk-skill__body > .nk-skill__content > .nk-skill__title-row')!;
      const icon = row.querySelector('.nk-skill__icon')!;
      const name = row.querySelector('.nk-skill__name')!;
      const r = row.getBoundingClientRect();
      const i = icon.getBoundingClientRect();
      return {
        iconParentIsRow: icon.parentElement === row,
        iconTop: i.top,
        iconLeft: i.left,
        rowTop: r.top,
        rowLeft: r.left,
        nameTop: name.getBoundingClientRect().top,
      };
    });
    expect(iconInRow.iconParentIsRow).toBe(true);
    expect(Math.abs(iconInRow.iconTop - iconInRow.rowTop), '图标应与标题行同起（不得堆在其上方）').toBeLessThanOrEqual(1);
    expect(Math.abs(iconInRow.iconLeft - iconInRow.rowLeft), '图标内联后应与标题行同起').toBeLessThanOrEqual(1);

    // 正文单列全宽：卡片体不再是网格（图标换宿主后 body 只剩内容列），内容列 = 卡内容宽
    const body = await firstCard.evaluate((el) => {
      const node = el.querySelector(':scope > .nk-skill__body')!;
      const content = node.querySelector(':scope > .nk-skill__content')!;
      const cs = getComputedStyle(el);
      return {
        display: getComputedStyle(node).display,
        contentWidth: content.getBoundingClientRect().width,
        cardContentWidth: el.getBoundingClientRect().width - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0),
      };
    });
    expect(body.display).toBe('block');
    expect(Math.abs(body.contentWidth - body.cardContentWidth), `内容列 ${body.contentWidth} vs 卡内容宽 ${body.cardContentWidth}`).toBeLessThanOrEqual(1);

    // 虚线分区：子卡上沿 1px dashed（颜色取自 --line-2 令牌）；父卡与单卡不加线
    const children = firstCard.locator('.nk-skill--child');
    await expect(children.first()).toHaveCSS('border-top-style', 'dashed');
    await expect(children.first()).toHaveCSS('border-top-width', '1px');
    await expect(children.first()).toHaveCSS('border-top-color', await resolveTokenColor(page, '--line-2'));
    await expect(firstCard).toHaveCSS('border-top-style', 'none');
    const monoCard = page.locator('[data-panel="skills"] > .nk-skill:not(:has(.nk-skill--child))').first();
    if (await monoCard.count()) await expect(monoCard).toHaveCSS('border-top-style', 'none');

    /* 虚线上下留白等距（用户报「分割虚线上方没有留空隙」）：线上方 = 线之前最后一个可见元素
       的底边到线；线下方 = 子卡 padding-top（半个图标空间）。父卡内容体必须留下等量余量，
       仅靠 padding-top 会让线上方只剩余量（实测 9px）而看着贴住上文。 */
    const dash = await firstCard.evaluate((card) => {
      const child = card.querySelector(':scope > .nk-skill--child')!;
      const lineY = child.getBoundingClientRect().top;
      let lastBottom = card.getBoundingClientRect().top;
      // DOM 序取「线之前」的最后一个可见元素：文档序保证它就是最近的上方内容
      for (const el of card.querySelectorAll('*')) {
        if (el === child || el.contains(child)) continue;
        const r = el.getBoundingClientRect();
        if (r.height > 0 && r.width > 0 && getComputedStyle(el).visibility !== 'hidden' && r.bottom <= lineY + 1) {
          lastBottom = r.bottom;
        }
      }
      return {
        above: +(lineY - lastBottom).toFixed(1),
        below: parseFloat(getComputedStyle(child).paddingTop),
      };
    });
    expect(dash.above, `虚线上方 ${dash.above} 应≈下方 ${dash.below}（±2px）`).toBeGreaterThanOrEqual(dash.below - 2);

    // 折角线语言退场：三个宿主伪元素的 computed content 必须是 none。
    // 判据只用 content——Chrome 对「未被 content 生成的伪元素」在 getComputedStyle 上仍返回
    // 声明侧数值（实测 forced content:'' 才出现 353.125px 盒），拿 width/height 当判据会漏判。
    for (const [host, pseudo] of [
      [firstCard.locator('.nk-skill__body').first(), '::before'],
      [children.first(), '::before'],
      [children.first(), '::after'],
    ] as const) {
      const content = await host.evaluate((el, p) => getComputedStyle(el, p).content, pseudo);
      expect(content, `${pseudo} 应被 content: none 抑制`).toBe('none');
    }

    // 左轴唯一：图标左缘 = 卡内容左缘 = 卡头类型竖条左轴
    const axis = await firstCard.evaluate((el) => {
      const icon = el.querySelector('.nk-skill__icon')!;
      const dot = el.querySelector(':scope > .nk-skill__head > .nk-skill__type-dot')!;
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        iconLeft: icon.getBoundingClientRect().left,
        dotLeft: dot.getBoundingClientRect().left,
        contentLeft: r.left + (parseFloat(cs.paddingLeft) || 0),
      };
    });
    expect(Math.abs(axis.iconLeft - axis.contentLeft), '图标左缘 = 卡内容左缘').toBeLessThanOrEqual(1);
    expect(Math.abs(axis.dotLeft - axis.contentLeft), '类型竖条左缘 = 卡内容左缘（左轴唯一）').toBeLessThanOrEqual(1);

    await expectNoSkillsOverflow(page);
    assertNoErrors();
  });

  test('/character/1503：手机断点不再右移子卡（旧「缩进一个图标空间」只在 ≥768px 成立）', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    /** 子卡图标相对父卡图标的右移量（手机断点只差 12px 缩进） */
    const measure = async () => {
      const firstCard = page.locator('[data-panel="skills"] > .nk-skill').first();
      const parentLeft = await firstCard
        .locator('.nk-skill__icon')
        .first()
        .evaluate((el) => el.getBoundingClientRect().left);
      const childLeft = await firstCard
        .locator('.nk-skill--child .nk-skill__icon')
        .first()
        .evaluate((el) => el.getBoundingClientRect().left);
      const indent = await page
        .locator('.nk-char-page')
        .evaluate((el) => getComputedStyle(el).getPropertyValue('--nk-skill-child-indent').trim());
      return { delta: childLeft - parentLeft, indent };
    };

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/character/1503');
    await expect(page.locator('.nk-skill--child').first()).toBeVisible();
    const wide = await measure();
    expect(wide.indent).toBe('48px');
    expect(Math.abs(wide.delta - 48), `桌面实测右移 ${wide.delta.toFixed(1)}px`).toBeLessThanOrEqual(1);
    expect(Math.abs(wide.delta - parseFloat(wide.indent))).toBeLessThanOrEqual(1);

    await page.setViewportSize({ width: 375, height: 812 });
    await expect.poll(async () => (await measure()).indent).toBe('12px');
    const narrow = await measure();
    expect(Math.abs(narrow.delta - 12), `375 实测右移 ${narrow.delta.toFixed(1)}px`).toBeLessThanOrEqual(1);
    expect(Math.abs(narrow.delta - parseFloat(narrow.indent))).toBeLessThanOrEqual(1);
    await expectNoSkillsOverflow(page);
    assertNoErrors();
  });

  test('/character/1212：战技族父节点以族序为准（父卡「无罅飞光」；SkillList 首位的「寒川映月」降为子卡）', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/character/1212');
    const topCards = page.locator('[data-panel="skills"] > .nk-skill');
    const bp = topCards.filter({ has: page.locator('[data-type="BPSkill"]') });
    await expect(bp).toHaveCount(1);
    await expect(bp.locator('.nk-skill__name').first()).toHaveText('无罅飞光');
    await expect(bp.locator('.nk-skill--child')).toHaveCount(1);
    await expect(bp.locator('.nk-skill--child .nk-skill__name')).toHaveText(['寒川映月']);
    // 形态不得同时充当平级卡的基座
    const topNames = await topCards.evaluateAll((els) =>
      els.map((el) => el.querySelector('.nk-skill__name')!.textContent!.trim()),
    );
    expect(topNames).toContain('无罅飞光');
    expect(topNames).not.toContain('寒川映月');
    assertNoErrors();
  });

  test('/character/1509：天赋族不再拆成两张平级卡（150904 之下挂 150905）', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    const ids = charFamilyIds('1509', 'Point04');
    expect(ids).toEqual([150904, 150905]);
    const [parentName, childName] = charSkillNames('1509', ids);
    await page.goto('/character/1509');
    const topCards = page.locator('[data-panel="skills"] > .nk-skill');
    const parent = topCards.filter({ hasText: parentName });
    await expect(parent).toHaveCount(1);
    await expect(parent.locator('.nk-skill__name').first()).toHaveText(parentName);
    await expect(parent.locator('.nk-skill--child')).toHaveCount(1);
    await expect(parent.locator('.nk-skill--child .nk-skill__name')).toHaveText([childName]);
    const topNames = await topCards.evaluateAll((els) =>
      els.map((el) => el.querySelector('.nk-skill__name')!.textContent!.trim()),
    );
    expect(topNames).toContain(parentName);
    expect(topNames).not.toContain(childName);
    assertNoErrors();
  });

  test('/character/1510：4 成员族（天赋 151004 + 3 条助战技）= 1 父卡 + 恰 3 子卡，子卡名按族序', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    const ids = charFamilyIds('1510', 'Point04');
    expect(ids).toEqual([151004, 151022, 151025, 151026]);
    const names = charSkillNames('1510', ids);
    await page.goto('/character/1510');
    // 数据侧 type=Assist 的三条助战技与 type=Passive 的天赋同族；选父卡用 data-type（唯一顶层 Passive 卡）
    const parent = page.locator('[data-panel="skills"] > .nk-skill[data-type="Passive"]');
    await expect(parent).toHaveCount(1);
    await expect(parent.locator('.nk-skill__name').first()).toHaveText(names[0]);
    await expect(parent.locator('.nk-skill--child')).toHaveCount(3);
    const domNames = await parent.locator('.nk-skill--child').evaluateAll((els) =>
      els.map((el) => el.querySelector('.nk-skill__name')!.textContent!.trim()),
    );
    expect(domNames).toEqual(names.slice(1));
    assertNoErrors();
  });

  /* 技能图标 CDN 契约：主源 404 时必须靠 data-cdn-fallback 换 jsDelivr（强化模式的 1{charId}
     伪目录名在 nanoka 缺失——镜流 1212 是实例）；两源皆失败才允许出现占位图形。 */
  test('/character/1212：强化技能图标（nanoka 404 名）必须经回退源加载成功，不得出现占位', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/character/1212');
    const icons = page.locator('[data-panel="skills"] .nk-skill__icon');
    await expect(icons.first()).toBeVisible();
    await expect.poll(() => icons.count()).toBeGreaterThanOrEqual(5);
    // 回退属性必须绑上（这条先于占位生效，否则本来能加载的资产会被占位盖住）
    await expect(icons.first()).toHaveAttribute('data-cdn-fallback', /cdn\.jsdelivr\.net\/.*skillicons\/avatar\//);
    // **先等位图真的到位再断言**：本用例原先直接读 `complete/naturalWidth`，等于把「图片尚未加载完」
    // 当成「加载失败」。Chromium 上因为有请求缓存与靠前用例预热而长期不显形；Firefox 冷跑必现
    // （实测：立即 5/6 未完成，6s 后 6/6 完成、零宽 0、占位 0 —— 说明是**测试竞态**不是引擎缺陷）。
    await expect
      .poll(async () => icons.evaluateAll((els) => els.every((el) => (el as HTMLImageElement).complete)), { timeout: 15_000 })
      .toBe(true);
    const states = await icons.evaluateAll((els) => els.map((el) => ({
      complete: (el as HTMLImageElement).complete,
      w: (el as HTMLImageElement).naturalWidth,
      down: (el as HTMLImageElement).hasAttribute('data-cdn-down'),
      ph: (el as HTMLImageElement).hasAttribute('data-cdn-placeholder'),
      src: (el as HTMLImageElement).currentSrc,
    })));
    for (const s of states) {
      expect(s.ph, `占位不应出现（src=${s.src}）`).toBe(false);
      expect(s.w, `图标应加载出位图（complete=${s.complete} src=${s.src}）`).toBeGreaterThan(0);
    }
    assertNoErrors();
  });

  test('/character/1212：两源皆 404 时显示占位图形（naturalWidth>0）', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.route('**/assets/hsr/skillicons/**', (route) => route.fulfill({ status: 404, body: '' }));
    await page.route('**/cdn.jsdelivr.net/**skillicons/**', (route) => route.fulfill({ status: 404, body: '' }));
    await page.goto('/character/1212');
    const icon = page.locator('[data-panel="skills"] .nk-skill__icon').first();
    await expect(icon).toBeVisible();
    await expect.poll(async () => icon.getAttribute('data-cdn-placeholder'), { timeout: 15000 }).toBe('1');
    // 占位是内联 SVG data URI：naturalWidth>0 才是「真画出来了」的最强信号（降级留白时为 0）
    const state = await icon.evaluate((el) => ({
      src: el.getAttribute('src') || '',
      w: (el as HTMLImageElement).naturalWidth,
      box: el.getBoundingClientRect().width,
      visibility: getComputedStyle(el).visibility,
    }));
    expect(state.src.startsWith('data:image/svg+xml,')).toBe(true);
    expect(state.w).toBeGreaterThan(0);
    expect(state.box).toBeGreaterThan(0);
    expect(state.visibility).toBe('visible');
    assertNoErrors();
  });

  test('/lightcone/首个 id：光锥技能卡不受技能族改动波及（标题行图标在，无图标列）', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    const cones = JSON.parse(readFileSync('public/data/cn/light_cones.json', 'utf8')) as Record<
      string,
      { id: number }
    >;
    const lcId = Object.values(cones)[0].id;
    await page.goto(`/lightcone/${lcId}`);
    const icon = page.locator('.nk-lc-skill .nk-skill__title-row .nk-skill__icon');
    await expect(icon).toHaveCount(1);
    await expect(icon).toBeVisible();
    // 光锥详情页复用 .nk-skill* 但走标题行内联图标，不得出现角色详情的图标列 / 层级线宿主
    await expect(page.locator('.nk-skill__rail')).toHaveCount(0);
    assertNoErrors();
  });

  // 缺陷史：属性网格是三列，但第 3 项命中基线 `.nk-hero__stat:last-child:nth-child(odd) { grid-column: 1/-1 }`
  // （两列网格的「末项满行」规则），DEF 被挤成独立整行。此处钉住「三项同行成列 + 网格不横溢」。
  test('/lightcone：hero 属性三项同行成列，窄屏回落两列且 DEF 满行，无溢出', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    const cones = readJson<Record<string, { id: number }>>('public/data/cn/light_cones.json');
    const lcId = Object.values(cones)[0].id;
    const grid = page.locator('.nk-hero__stats--lc');
    const stats = grid.locator('> .nk-hero__stat');
    const boxes = () =>
      stats.evaluateAll((els) =>
        els.map((el) => {
          const r = el.getBoundingClientRect();
          return { top: Math.round(r.top), left: Math.round(r.left), width: Math.round(r.width) };
        }),
      );
    const spill = () => grid.evaluate((el) => el.scrollWidth - el.clientWidth);

    for (const width of [1440, 375]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/lightcone/${lcId}`);
      await expect(stats).toHaveCount(3);
      const b = await boxes();
      expect(new Set(b.map((x) => x.top)).size, `${width}px：三项须同一行`).toBe(1);
      expect(b[1].left, `${width}px：ATK 须在 HP 右侧`).toBeGreaterThan(b[0].left);
      expect(b[2].left, `${width}px：DEF 须在 ATK 右侧`).toBeGreaterThan(b[1].left);
      expect(await spill(), `${width}px：属性网格不得横向溢出`).toBeLessThanOrEqual(1);
      await noUnknownOverflow(page);
    }

    // <360px：三列放不下 → 回落两列，DEF 独占第二行满宽（不得横溢）
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto(`/lightcone/${lcId}`);
    await expect(stats).toHaveCount(3);
    const b = await boxes();
    expect(b[0].top, '320px：HP 与 ATK 同行').toBe(b[1].top);
    expect(b[2].top, '320px：DEF 应落到第二行').toBeGreaterThan(b[0].top);
    expect(b[2].width, '320px：DEF 应满行').toBeGreaterThan((await grid.evaluate((el) => el.clientWidth)) * 0.8);
    expect(await spill(), '320px：属性网格不得横向溢出').toBeLessThanOrEqual(1);
    assertNoErrors();
  });

  // 8bit 等值线：视觉区两层浅 inset 暗角 + 稀有度椭圆晕染（各只有 3.7 / 4.0 每 255 深度却铺满全幅）
  // 与面板 90deg 浅渐变（整幅 8/255）都会塌成色带——前者是「一圈一圈的圆角矩形印记」，
  // 后者是「竖立的条纹」。此处钉住「不再有浅渐变覆层」，像素级外观交用户 RunPreview。
  test('/lightcone：hero 视觉层与信息面板不挂浅渐变覆层（等值线来源）', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    const cones = readJson<Record<string, { id: number }>>('public/data/cn/light_cones.json');
    const lcId = Object.values(cones)[0].id;
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/lightcone/${lcId}`);

    const visual = page.locator('.nk-hero--lc .nk-hero__visual');
    await expect(visual).toHaveCount(1);
    expect(await visual.evaluate((el) => getComputedStyle(el).boxShadow), '视觉区不得有 inset 暗角').toBe('none');
    expect(
      await visual.evaluate((el) => getComputedStyle(el, '::before').backgroundImage),
      '稀有度晕染层不得留渐变',
    ).toBe('none');

    const panel = await page.locator('.nk-hero--lc .nk-hero__panel').evaluate((el) => {
      const cs = getComputedStyle(el);
      return { image: cs.backgroundImage, color: cs.backgroundColor };
    });
    expect(panel.image, '信息面板底必须是纯色，不得是横向渐变').toBe('none');
    expect(panel.color, '纯色底须给出实际颜色而非透明').not.toBe('rgba(0, 0, 0, 0)');
    assertNoErrors();
  });

  // 「适配角色」= 官方配装推荐（AvatarEquipRecommend）的反向索引，与角色页「推荐光锥」是同一张表的两面：
  // 这里钉「chip 逐条 = 数据条目、链接指向该角色页、REC. 顺位与数据同源、两端不横滚」。
  // 数据只覆盖部分光锥（无记录的光锥整块不渲染），故取料按数据找「有记录的那把」。
  test('/lightcone：适配角色区块逐条对应反向索引（链接 / REC. 顺位 / 无溢出）', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    const cones = readJson<{ id: number }[]>('public/data/cn/light_cones.json');
    let target: { id: number; chars: { id: number; rank: number }[] } | null = null;
    for (const c of cones) {
      const chars = readJson<{ recommend_chars?: { id: number; rank: number }[] }>(
        `public/data/cn/light_cones/${c.id}.json`,
      ).recommend_chars || [];
      if (chars.length >= 2) { target = { id: c.id, chars }; break; }
    }
    expect(target, '数据集中必须存在带适配角色的光锥').not.toBeNull();
    const hit = target!;

    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/lightcone/${hit.id}`);
      await expect(page.getByRole('heading', { name: /适配角色/ })).toBeVisible();
      const items = page.locator('.nk-lc-adapt__item');
      await expect(items).toHaveCount(hit.chars.length);
      // 首条即数据首条（converter 按 (rank, id) 排序，前端不再重排）
      await expect(items.first()).toHaveAttribute('href', `/character/${hit.chars[0].id}`);
      await expect(items.first().locator('.nk-lc-adapt__rec')).toHaveText(`REC. ${hit.chars[0].rank}`);
      await noUnknownOverflow(page);
    }
    assertNoErrors();
  });

  // 竖轨几何只在 ≥768px 存在，故本用例钉桌面视口（否则 mobile-chromium project 会跑到无竖轨的断点上）
  test('/character/1503：展开技能数据表后，竖轨与表盒（含首列）不相交、表盒不出卡片内容区', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/character/1503');
    const card = page.locator('[data-panel="skills"] > .nk-skill').first();
    const indent = await page
      .locator('.nk-char-page')
      .evaluate((el) => parseFloat(getComputedStyle(el).getPropertyValue('--nk-skill-child-indent')));
    const wrapLeft: Record<string, number> = {};

    for (const target of ['父卡', '首张子卡'] as const) {
      const host = target === '父卡' ? card : card.locator('.nk-skill--child').first();
      const wrap = host.locator(':scope > .nk-skill__body > .nk-skill__table-wrap');
      await wrap.getByRole('button', { name: '技能数据' }).click();
      await expect(wrap.locator('.nk-table tbody tr').first()).toBeVisible();

      const railX = await skillRailX(host);
      const box = await tableBoxWithinCard(host);
      wrapLeft[target] = box.left;
      // 缺陷史：修复前数据表跨两列，竖轨横跨表盒、首列「#/Lv.N」文字左缘恰等于竖轨 x
      expect(railX + 8, `${target} 竖轨 x=${railX.toFixed(1)} 必须让开表盒左缘 ${box.left.toFixed(1)}`).toBeLessThan(box.left);
      const firstColLeft = await wrap
        .locator('.nk-table tbody td:first-child')
        .first()
        .evaluate((el) => el.getBoundingClientRect().left);
      expect(railX + 8, `${target} 首列左缘 ${firstColLeft.toFixed(1)}`).toBeLessThan(firstColLeft);
      // 卡片级横向溢出：表盒必须完整落在卡片内容区（表格自身溢出由 .nk-table-inner overflow-x 承担，不在此列）
      expect(box.left, `${target} 表盒左缘出内容区`).toBeGreaterThanOrEqual(box.contentLeft - 1);
      expect(box.right, `${target} 表盒右缘出内容区`).toBeLessThanOrEqual(box.contentRight + 1);
    }

    // 子卡表格随行缩进右移：子卡表盒左缘 = 父卡表盒左缘 + indent（±1px），不再左对齐
    expect(
      Math.abs(wrapLeft['首张子卡'] - wrapLeft['父卡'] - indent),
      `子卡表盒左移量 ${(wrapLeft['首张子卡'] - wrapLeft['父卡']).toFixed(1)}px，indent=${indent}px`,
    ).toBeLessThanOrEqual(1);

    await expectNoSkillsOverflow(page);
    assertNoErrors();
  });

  // hero 主字势能（名长度分档）：主字按角色名的码点数分两档，档位关系一律用相对断言表达——
  // 期望值不写 px，档位集合与名长度从随站数据派生，跨断点只断言「不缩小」。
  // 高度槽（`--nk-hero-name-slot`）是骨架屏固定盒高的前提：同档内名长度不得改变行盒数或把主字挤出族外。
  const NAME_CASES = [
    { id: '1205', len: 1, tier: 'short' },
    { id: '1204', len: 2, tier: 'long' },
    { id: '1001', len: 3, tier: 'long' },
  ] as const;

  interface NameMetrics {
    len: number; dataLen: number; font: number; slot: number;
    nameW: number; slotW: number; nameLines: number;
  }

  test('/character：hero 主字按名长度分档（1 字档 > 长名档；同档盒高不随名长度变化）', { tag: '@viewport-pinned' }, async ({ page }) => {
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
        const r = await read();
        expect(r.len, `${c.id} 的名长度须等于档位判据的期望（期望值派生自随站数据）`).toBe(c.len);
        expect(r.dataLen, `${c.id} 的 data-len 须等于名长度`).toBe(c.len);
        expect(r.nameLines, `${c.id} 主字在 ${vp.width} 档必须单行（宽度天花板判据）`).toBe(1);
        expect(r.nameW, `${c.id} 主字不得越出名称族`).toBeLessThanOrEqual(r.slotW + 1);
        seen[c.tier] = seen[c.tier] || r;
        seen[`f:${c.id}`] = r;
      }
      // 档位关系：1 字档主字必须严格大于长名档；两档槽高必须严格大于 0
      expect(seen.short.font, `${vp.width}：1 字档须大于 2 字名（长名档）`).toBeGreaterThan(seen['f:1204'].font);
      expect(seen.short.font, `${vp.width}：1 字档须大于 3 字名（长名档）`).toBeGreaterThan(seen['f:1001'].font);
      expect(seen.short.slot).toBeGreaterThan(0);
      expect(seen.long.slot).toBeGreaterThan(0);
      // 同档内名长度不改变槽高（骨架屏固定盒高的前提）与行盒数
      expect(seen['f:1204'].slot, '同档（2 字 / 3 字）槽高必须相等').toBe(seen['f:1001'].slot);
      expect(seen['f:1204'].nameLines, '同档行盒数必须一致').toBe(seen['f:1001'].nameLines);
      byVp[vp.width] = seen;
    }

    // 跨断点只放大：主字与槽高在宽档不得小于窄档
    for (const k of ['short', 'long'] as const) {
      expect(byVp[1440][k].font, `${k} 档主字随视口放大不得缩小`).toBeGreaterThan(byVp[390][k].font);
      expect(byVp[1440][k].slot, `${k} 档槽高随视口放大不得缩小`).toBeGreaterThan(byVp[390][k].slot);
    }

    await noUnknownOverflow(page);
    assertNoErrors();
  });

  // 长区块（技能 1800px+ / 星魂 1400px+）的可扫描性契约：区块内索引 = 纯锚点导航，条目与卡片一一对应，
  // 跳转落点必须落在吸顶工具条之下（否则「跳过去」被吸顶条盖住标题）。期望值一律派生：
  // 落点下界从吸顶条实测高度取，卡片间距与卡内距比大小，触控线用契约常量 44（跨会话不得漂移）。
  test('/character/1204：技能 / 星魂区块内索引（锚点一一对应 + 跳转落点在吸顶条之下 + 触控 44）', async ({ page }) => {
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
      // 条目数 = 该区块的锚点卡片数（一一对应，多一条就会跳到空气上）
      const anchors = page.locator(`.nk-panel[data-panel="${panelKey}"] [id^="nk-skill-"], .nk-panel[data-panel="${panelKey}"] [id^="nk-eidolon-"]`);
      expect(await buttons.count(), `${panelKey} 索引条目数须等于卡片数`).toBe(await anchors.count());

      // 每个条目必须绑一个存在的落点，且触控高度达 44
      const items = await buttons.evaluateAll((els) => els.map((el) => {
        const b = el.getBoundingClientRect();
        return { label: (el.textContent || '').trim(), h: b.height, top: b.top };
      }));
      for (const it of items) {
        expect(it.h, `${panelKey} 索引条目「${it.label}」触控高度`).toBeGreaterThanOrEqual(44);
      }

      // 跳转落点：点第一个条目，滚动后的卡片顶边必须在吸顶条之下且仍在视口内
      const first = buttons.first();
      const targetId = await first.evaluate((el) => {
        const panel = el.closest('.nk-panel');
        return panel!.querySelector('[id^="nk-skill-"], [id^="nk-eidolon-"]')!.id;
      });
      await first.click();
      await expect.poll(async () => (await page.locator(`#${targetId}`).boundingBox())!.y, { timeout: 4_000 }).toBeLessThan(barH + 80);
      const box = await page.locator(`#${targetId}`).boundingBox();
      expect(box!.y, `${panelKey} 首个索引项的落点须在吸顶条之下`).toBeGreaterThanOrEqual(barH);
      expect(await page.locator(`#${targetId}`).isVisible()).toBe(true);
    }

    // 卡片间距 > 卡内距：此前组间距 20px 比卡片自身 24px 内距还小，六张卡读成一片
    await page.goto('/character/1204');
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

  // 吸顶区块导航（页面外壳）契约：<1024 档导航横向溢出（手机 390 实测 scrollWidth 647 / clientWidth 358
  // ⇒ 10 项只有 5 项可见，且本页没有别的入口能到「遗器 / 档案 / 配音」）——
  // ① 被裁项必须可横滑到位（末项 scrollIntoView 后进入可视区）；
  // ② 溢出时必须有「还有内容」的几何提示（mask-image，纯几何、不引入颜色）；
  // ③ 触控目标达 44（WCAG 2.2 AA；本页原为 64×28），且吸顶条总高**不变**（条高变了会连带挪动
  //    全页 scroll-margin / 首屏避让，`.nk-page--detail` 的 padding-top 是按条高定的）。
  test('/character/1204：吸顶区块导航在 <1024 档可横滑到位 + 有溢出提示 + 触控 44 且条高不变', { tag: '@viewport-pinned' }, async ({ page }) => {
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

    // 被裁项可横滑到位：末项滚进可视区后，其右缘须落在导航可视区内
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

    // ≥1024 档三项全可见、无溢出：不得挂溢出提示（提示只在会裁的地方出现）
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

  // 配队可达名：备选队友头像是**图标链接**（无可见文字），`title` / `alt` 是它唯一对外的话。
  // `loadLocalBuildNames` 原先只收集 `member_list`、漏了 `backup_list1..N` ⇒ 备选头像只拿得到
  // `itemName` 的最后一跳 `#id`（实测 1204 有 8/13 个把上游 id 当名字念给读屏）。
  // 契约：队列表里不得出现纯 id 可达名（`#\d+` 或 `角色 <id>` 兜底形态），且命名必须来自随站数据。
  test('/character/1204：配队头像的可达名来自随站数据（不得是 #id 回退串）', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/character/1204');
    await page.waitForSelector('.nk-build__team-link');
    // 等名录合并（主数据先渲染、build 名录异步补名）
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

    // 名字来自随站数据：成员 id 在角色名录里能查到同名
    const catalog = readJson<{ id: number; name: string }[]>('public/data/cn/characters.json');
    for (const l of links) {
      const id = l.href.split('/').pop() || '';
      const hit = catalog.find((c) => String(c.id) === id);
      if (!hit) continue;
      expect([hit.name, '当前角色'], `${id} 的可达名须与角色名录一致`).toContain(l.title);
    }
    assertNoErrors();
  });

  // 键盘可达性契约：焦点环必须真的可见。全局焦点环选择器（tokens.css 的
  // `:where(#app) button/a/[tabindex]:focus-visible`）不含 `input`，而技能等级滑条是 `input[type=range]`
  // ⇒ 本页在页面作用域内补了 `input:focus-visible`。断言用**真实 Tab 遍历**取焦点态：
  // 合成 `el.focus()` 不触发 `:focus-visible`，用它会得出「滑条没有焦点环」的假结论。
  test('/character/1204：技能等级滑条在键盘 Tab 下有可见焦点环', async ({ page }) => {
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

    // 本用例等到了 Spine 画布挂载（1204 的 canvas 会就绪），而画布带 `scale 1.15`、恒越出视口被
    // `.nk-hero { overflow: clip }` 裁掉——这是 2026-09 已定性的既有未登记缺陷，故这里**不调**
    // `noUnknownOverflow`（与既有的「换角色重挂」用例同口径），只断言无 JS 异常。
    assertNoErrors();
  });

  // 视口矩阵契约（验收标准 B4）：320 极小手机 / 834 平板横 / 1440×460 矮横屏 / 2560 超大桌面。
  // 四条不变量（都是全页铺量扫过 12 视口 × 4 角色后确认可断言的部分）：
  //   ① hero 面板完整落在 hero 内（含最矮档 460 —— 面板是绝对定位，最容易被挤出去）；
  //   ② 主字恒为单行（分档的宽度天花板判据）；
  //   ③ 章标字号 ≥ 页内最大正文（层级不倒挂）；
  //   ④ 无未知横向溢出（Spine 画布是既定性缺陷，不在此列，与既有口径一致）。
  test('/character/1001：极端视口矩阵（320 / 834 / 矮横屏 / 2560）四条不变量', { tag: '@viewport-pinned' }, async ({ page }) => {
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
        // 页内最大**正文**：属性取值 / 星魂名 / 队伍角色名（三者取最大）。
        // 注意不要把 `.nk-eidolon__num`（20px）算进来——那与章标索引、卷宗编号同属「档案索引」刻度位，
        // 是索引不是正文；把它算成正文会让「章标 ≥ 正文」这条层级判据误报（本页口径见 character-hero.css）。
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

  // 区块导航「点哪节亮哪节」契约：命中判定取「区块顶边 ≤ 偏移线（吸顶条下沿）」，而 `jumpTo` 原先把顶边
  // 送到**正好等于**偏移线 ⇒ 落点 0.2~0.4px 的抖动（实测 58.625 / 59.156）就会翻转判定，
  // 表现为「点附件、亮技能」。修法 = 落点让出少量余量 + 滚动停止后复算一次（等布局稳定）。
  // 断言用 `expect.poll`：平滑滚动是动画，只在稳定态比较，避免把动画中态当成结论。
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
});
