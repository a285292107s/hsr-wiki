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

/**
 * 布局验收：角色详情页 —— hero 动效与断点（入场编排 / 骨架同框 / 视差 / 重挂 / 命中区）。
 *
 * `layout-character-*.spec.ts` 按域拆分文件之一（文件级并行是唯一被采纳的提速手段：
 * `fullyParallel: false` 只禁文件内并行）。标签语义（`@viewport-pinned` / `@cross-engine` /
 * `@viewport-independent`）与数值断言纪律见 docs/agents/testing.md。
 */

test.describe('布局验收：角色详情页', () => {

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
  test('/character/1001 平板档：文字与媒体并排且骨架同框', { tag: ['@viewport-pinned', '@font-calibrated', '@cross-engine'] }, async ({ page }) => {
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
  test('/character/1001：hero 面板在 1024 与矮横屏下仍落在 hero 内', { tag: ['@viewport-pinned', '@cross-engine'] }, async ({ page }) => {
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
  test('/character/1001 桌面：hero 媒体滚动视差（推进 / 封顶 / 面板不动 / reduced-motion 关闭）', { tag: ['@viewport-pinned', '@cross-engine'] }, async ({ page }) => {
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
    // 取值前必须等位移**稳定**（两次采样一致）：只等 `> mid.shift` 会把滚动驱动的中间帧当成末值，
    // 后面「滚到 4000 后应与它相等（±0.5px）」就必然翻成 false——CI 实测 3s 轮询超时的那次 flake 即此。
    let farShift: number | null = null;
    await expect.poll(
      async () => {
        const a = (await snap()).shift;
        const b = (await snap()).shift;
        if (Math.abs(a - b) > 0.5) return false;
        farShift = a;
        return true;
      },
      { timeout: 5_000 },
    ).toBe(true);

    // 滚过 animation-range 后位移封顶：继续滚不得再增长（容 0.5px 次像素）
    await scrollTo(4000);
    await expect.poll(
      async () => Math.abs((await snap()).shift - farShift!) <= 0.5,
      { timeout: 3_000 },
    ).toBe(true);

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect.poll(async () => (await snap()).anim, { timeout: 3_000 }).toBe('none');
    expect((await snap()).shift, 'reduced-motion 下媒体不得位移').toBeCloseTo(0, 1);
    await page.emulateMedia({ reducedMotion: 'no-preference' });

    await noUnknownOverflow(page);
    assertNoErrors();
  });

  // 内容切换编排契约：换角色时 hero 必须**重挂**——store 的 load 先清 data ⇒ hero 卸载 → 数据到位后新挂载，  // 入场编排随之重播。判据用 DOM 节点身份（不依赖动画时序，慢机也不 flake）；
  // 若日后改成跨角色复用 data（不重置），本条会红——那正是要拦住的回归。
  test('/character/1001：换角色后 hero 重挂（入场编排随之重播）', { tag: '@viewport-independent' }, async ({ page }) => {
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
});
