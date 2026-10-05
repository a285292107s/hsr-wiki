import { test, expect } from '@playwright/test';
import { collectConsoleIssues, waitForCatalogCards } from './helpers';
import { noUnknownOverflow } from './layout.shared';

/**
 * 布局验收：常规主题 —— layout 验收层（语义契约 + 数值规格）分文件之一。
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

test.describe('布局验收：常规主题', () => {
  test('首页 /：品牌带标题、版本上新三分区、无溢出', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/');
    await expect(page.locator('.nk-hub-brand__title')).toBeVisible();
    // 站点名易变，不断言具体文案，只验非空
    await expect(page.locator('.nk-hub-brand__title')).toHaveText(/\S/);
    await expect(page.locator('.nk-hub-release__title')).toContainText('版本上新');
    // 已渲染分区数 ≥1 同时是「版本增量打标管线」的端到端哨兵：整页退化为空态必须让本断言变红。
    // 用 `expect.poll` 而不是一次性 `count()`——分区是**数据驱动渲染**（version.json + 版本差集），
    // 上面两条等待只覆盖静态品牌带/标题；慢 runner 上首读可能是 0（就绪竞态，CI 实测首跑红、retry 绿），
    // 而真空态会让 poll 超时照样变红（空态形态由下一条用例单独锁定）。
    await expect.poll(() => page.locator('.nk-hub-release__section').count(), { timeout: 10_000 }).toBeGreaterThanOrEqual(1);
    // 常规模式不得挂 cw 主题
    await expect(page.locator('html')).not.toHaveAttribute('data-theme', 'cw');
    // L3 溢出
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('首页 /：版本上新特写块不复述卡片内容，且行骨架横跨整行（无尾空）', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/');
    await expect(page.locator('.nk-hub-release__section').first()).toBeVisible();

    /* 判据（2026-10 修订）：特写块的规格列**只承担排版权重与显式动作**，不得复述卡上已有的文字。
       实测旧形态：卡内「真珠 / ★★★★★ / 冰 / 欢愉」与规格列「真珠 / 冰 / 欢愉」逐字重复，
       两处链接还同指详情页——同一屏里同一信息出现两遍是「没做完」的观感。允许重复的只有名字
       （它是特写的排版权重），其余任何逐字重复都算回归。 */
    const rows = await page.evaluate(() => {
      const leafTexts = (root: Element) =>
        [...root.querySelectorAll('*')]
          .filter((el) => el.children.length === 0)
          .map((el) => (el.textContent || '').replace(/\s+/g, ' ').trim())
          .filter(Boolean);
      return [...document.querySelectorAll('.nk-hub-release__section')].map((sec) => {
        const cell = sec.querySelector('.nk-hub-release__cell');
        const spec = sec.querySelector('.nk-hub-release__spec');
        if (!cell || !spec) return null;
        const card = leafTexts(cell);
        const specTexts = leafTexts(spec);
        const band = sec.querySelector('.nk-hub-release__band')!.getBoundingClientRect();
        const specBox = spec.getBoundingClientRect();
        const cardLink = cell.querySelector('a')?.getAttribute('href') ?? null;
        const specLink = spec.querySelector('a')?.getAttribute('href') ?? null;
        return {
          kind: sec.getAttribute('data-kind'),
          duplicated: specTexts.filter((t) => card.includes(t)),
          shownName: spec.querySelector('.nk-hub-release__spec-name')?.textContent?.trim() ?? '',
          trailing: Math.round(band.right - specBox.right),
          cardLink,
          specLink,
        };
      }).filter(Boolean);
    });
    expect(rows.length).toBeGreaterThanOrEqual(1);
    for (const r of rows as Array<{ kind: string; duplicated: string[]; shownName: string; trailing: number; cardLink: string | null; specLink: string | null }>) {
      expect(
        r.duplicated.filter((t) => t !== r.shownName),
        `${r.kind}：特写块复述了卡片内容——规格列只保留名字与入口`,
      ).toEqual([]);
      // 行骨架（规格块的顶线）必须横跨到整行右缘：否则右下角是一片无来由的空档
      expect(Math.abs(r.trailing), `${r.kind}：特写行尾部留空 ${r.trailing}px`).toBeLessThanOrEqual(2);
      // 入口指向的必须是这张主卡条目
      expect(r.specLink, `${r.kind}：特写块入口缺失`).toBeTruthy();
      expect(r.specLink).toBe(r.cardLink);
    }

    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('首页 /：1920×1080 首屏内完整可见品牌带 + 版本上新标题与第一分区首行卡片（ADR 0019 核心验收）', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await expect(page.locator('.nk-hub-brand__title')).toBeVisible();
    // 品牌带不得回到「独占首屏」形态：高度必须显著小于视口
    const bandH = await page.locator('.nk-hub-brand').evaluate((el) =>
      Math.round(el.getBoundingClientRect().height),
    );
    expect(bandH).toBeLessThanOrEqual(240);
    // 首屏契约（ADR 0019 决策 11 收窄）：品牌带 + 版本上新标题 + 第一分区标题与首行卡片完整可见。
    // 后续分区随滚动进入（scroll-driven reveal 编排），不再钉进首屏——那会把上新卡压回仪表盘尺度。
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

  test('首页 /：三分区皆无增量时只显示一行空态（ADR 0019 决策 10）', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    // 拦截 version.json 抹掉 version_label → 「本版本」不可判定 → 三分区全空。
    // 深链直达 / 是整页加载，启动时读到的就是被拦截的 version.json（无 store 缓存干扰）。
    await page.route('**/data/cn/version.json', (route) =>
      route.fulfill({ contentType: 'application/json', body: JSON.stringify({ game_version: '9.9.9' }) }),
    );
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await expect(page.locator('.nk-hub-release__empty')).toHaveCount(1);
    await expect(page.locator('.nk-hub-release__section')).toHaveCount(0);
    await expect(page.locator('.nk-hub-release__title')).toHaveText('版本上新');
    // 空态不回退板块索引、不改显历史版本；品牌带与共享页脚仍在
    await expect(page.locator('.nk-hub-brand__title')).toBeVisible();
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
    // 工具条存在（搜索 + 筛选下拉）
    await expect(page.locator('.nk-cat-toolbar').first()).toBeVisible();
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('角色图鉴 /character：手机断点行式卡（圆头像、单列、无溢出）', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/character');
    await waitForCatalogCards(page);
    const cards = page.locator('.nk-idx-grid a.nk-idx-card');
    await expect(cards.first()).toBeVisible();
    // 单列：第二张卡 top ＞ 第一张（行式堆叠，而非并排）
    const tops = await cards.evaluateAll((els) =>
      els.slice(0, 3).map((el) => Math.round(el.getBoundingClientRect().top)),
    );
    expect(tops[1]).toBeGreaterThan(tops[0]);
    // picture 双源命中：手机断点 currentSrc 为 127px 圆头像（非半身立绘）
    // `currentSrc` 要等浏览器**异步**完成资源选择后才有值（元素插入 ≠ 已选源，实测首读可能是空串），
    // 故用 poll 等待而不是一次性读——与 `layout-character-skill-data.spec.ts` 的「先等位图真的到位再断言」同一判据。
    const portraitImg = cards.first().locator('img').first();
    await expect
      .poll(() => portraitImg.evaluate((el) => (el as HTMLImageElement).currentSrc), { timeout: 10_000 })
      .toContain('avatarroundicon');
    // 行卡：44px 圆头像 + 总高 ≤ 80px（半身立绘大卡让位）
    const size = await cards.first().locator('.nk-idx-card__portrait').evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height) };
    });
    expect(size).toEqual({ w: 44, h: 44 });
    const cardH = await cards.first().evaluate((el) => Math.round(el.getBoundingClientRect().height));
    expect(cardH).toBeLessThanOrEqual(80);
    await noUnknownOverflow(page);
    assertNoErrors();
  });
});
