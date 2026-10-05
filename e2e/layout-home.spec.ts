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
    // 分区标题的条数不得与标签连写（"角色1" 会被读成一个词 / 一条文本）：必须是「标签 + 空白 + 数字」
    const labelTexts = await page.locator('.nk-hub-release__label').allTextContents();
    expect(labelTexts.length).toBeGreaterThanOrEqual(1);
    for (const t of labelTexts) expect(t).toMatch(/^\S+\s+\d+$/);
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
       （它是特写的排版权重），其余任何逐字重复都算回归。

       判据（2026-11 追加，名字落位）：允许重复的名字也不能**并排同基线**——旧形态规格名贴主卡右缘起排，
       与卡自带的小名横向只隔 310px（1440 档光锥实测 y=1135 ↔ 1174），读起来仍是复读。
       单条目行（1 张卡）⇒ 名字是这一行的「值」，必须落到行的右半区；
       多条目行（≥2 张卡）⇒ 规格块是主卡的注脚，仍须贴住主卡左缘（靠右会读成在描述右边那条）。 */
    const rows = await page.evaluate(() => {
      const leafTexts = (root: Element) =>
        [...root.querySelectorAll('*')]
          .filter((el) => el.children.length === 0)
          .map((el) => (el.textContent || '').replace(/\s+/g, ' ').trim())
          .filter(Boolean);
      const nameBox = (el: Element | null) => {
        if (!el) return null;
        const b = el.getBoundingClientRect();
        return b.width ? { x: Math.round(b.x) } : null;
      };
      return [...document.querySelectorAll('.nk-hub-release__section')].map((sec) => {
        const cell = sec.querySelector('.nk-hub-release__cell');
        const spec = sec.querySelector('.nk-hub-release__spec');
        if (!cell || !spec) return null;
        const card = leafTexts(cell);
        const specTexts = leafTexts(spec);
        const band = sec.querySelector('.nk-hub-release__band')!.getBoundingClientRect();
        const specBox = spec.getBoundingClientRect();
        const cells = [...sec.querySelectorAll('.nk-hub-release__cell')];
        return {
          kind: sec.getAttribute('data-kind'),
          duplicated: specTexts.filter((t) => card.includes(t)),
          shownName: spec.querySelector('.nk-hub-release__spec-name')?.textContent?.trim() ?? '',
          trailing: Math.round(band.right - specBox.right),
          cardLink: cell.querySelector('a')?.getAttribute('href') ?? null,
          specLink: spec.querySelector('a')?.getAttribute('href') ?? null,
          // 手机档规格名 `display: none`（卡内已有名）⇒ 该档不参与名字落位断言
          vw: window.innerWidth,
          single: cells.length === 1,
          bandWidth: Math.round(band.width),
          cardName: nameBox(cells[0].querySelector('.nk-idx-card__name, .nk-lc-card__name, .nk-relic-card__name')),
          specName: nameBox(spec.querySelector('.nk-hub-release__spec-name')),
        };
      }).filter(Boolean);
    });
    expect(rows.length).toBeGreaterThanOrEqual(1);
    type Row = {
      kind: string; duplicated: string[]; shownName: string; trailing: number;
      cardLink: string | null; specLink: string | null; vw: number; single: boolean;
      bandWidth: number; cardName: { x: number } | null; specName: { x: number } | null;
    };
    for (const r of rows as Row[]) {
      expect(
        r.duplicated.filter((t) => t !== r.shownName),
        `${r.kind}：特写块复述了卡片内容——规格列只保留名字与入口`,
      ).toEqual([]);
      // 行骨架（规格块的顶线）必须横跨到整行右缘：否则右下角是一片无来由的空档
      expect(Math.abs(r.trailing), `${r.kind}：特写行尾部留空 ${r.trailing}px`).toBeLessThanOrEqual(2);
      // 入口指向的必须是这张主卡条目
      expect(r.specLink, `${r.kind}：特写块入口缺失`).toBeTruthy();
      expect(r.specLink).toBe(r.cardLink);
      if (r.vw < 768 || !r.cardName) continue;
      if (r.single) {
        expect(r.specName, `${r.kind}：单条目行的规格名缺失`).toBeTruthy();
        expect(
          r.specName!.x - r.cardName.x,
          `${r.kind}：单条目行的名字与主卡自带名并排（实测横向相距 ${r.specName!.x - r.cardName.x}px）`,
        ).toBeGreaterThanOrEqual(r.bandWidth / 2);
      } else if (r.specName) {
        expect(
          Math.abs(r.specName.x - r.cardName.x),
          `${r.kind}：多条目行的规格块应贴住主卡（实测偏移 ${r.specName.x - r.cardName.x}px）`,
        ).toBeLessThanOrEqual(8);
      }
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

  /* 三态（UI质量验收标准 A4.6）：加载期与「索引没取到」都不许冒充「本版本暂无新增条目」。
     实测旧行为：加载期整块空白（无骨架）；三份索引全失败时显示空态文案——把一次网络故障写成了
     一句事实陈述；只失败一份时该分区静默消失。加载期的骨架不带 `.nk-hub-release__section`，
     因为那个类名同时是「数据已就绪」的判定依据（上面几条用例都靠它等就绪），骨架不能自己骗过它。 */
  test('首页 /：加载期给分区骨架、索引全失败给错误态且可重试，都不冒充空态', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    const INDEXES = '**/data/cn/*.json';
    const isIndex = (url: string) => /(characters|light_cones|relics)\.json$/.test(url);

    await page.setViewportSize({ width: 1440, height: 900 });

    // ① 加载期：三份索引各延后 3s
    await page.route(INDEXES, async (route) => {
      if (isIndex(route.request().url())) await new Promise((resolve) => setTimeout(resolve, 3_000));
      await route.continue();
    });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.nk-hub-release__sk')).toBeVisible();
    // 骨架行数 = 分区数（标签来自同一份源，与数据无关）
    await expect(page.locator('.nk-hub-release__sk-row')).toHaveCount(3);
    await expect(page.locator('.nk-hub-release__title')).toHaveText(/版本上新/);
    await expect(page.locator('.nk-hub-release__section')).toHaveCount(0);
    await expect(page.locator('.nk-hub-release__empty')).toHaveCount(0);
    // 数据到位：骨架退场、真实分区上位
    await expect.poll(() => page.locator('.nk-hub-release__section').count(), { timeout: 15_000 }).toBeGreaterThanOrEqual(1);
    await expect(page.locator('.nk-hub-release__sk')).toHaveCount(0);
    await page.unroute(INDEXES);

    // ② 三份索引全失败：错误态 + 重试入口；空态必须缺席
    await page.route(INDEXES, (route) =>
      (isIndex(route.request().url()) ? route.abort() : route.continue()));
    await page.goto('/');
    await expect(page.locator('.nk-error-state')).toBeVisible();
    await expect(page.locator('.nk-error-state__retry')).toBeVisible();
    await expect(page.locator('.nk-hub-release__empty')).toHaveCount(0);
    await expect(page.locator('.nk-hub-release__section')).toHaveCount(0);

    // ③ 重试必须真能恢复（共享列表单例失败后重置槽位，故无需刷新页面）
    await page.unroute(INDEXES);
    await page.locator('.nk-error-state__retry').click();
    await expect.poll(() => page.locator('.nk-hub-release__section').count(), { timeout: 15_000 }).toBeGreaterThanOrEqual(1);
    await expect(page.locator('.nk-error-state')).toHaveCount(0);

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

  /* 版本上新特写行：盒宽**不得依赖图片是否加载**。
     实测缺陷（2026-10）：第二列轨写成 `max-content`，而该列的 max-content 由卡内懒加载图的固有宽度决定
     —— 图未就绪（`naturalWidth = 0`）时塌成卡名文字宽，遗器卡实测 `96.1×122`、图就绪后变 `240×266`，
     列轨随之从 `306│95.84│818` 跳到 `306│240│674` ⇒ 首页每次首屏都有一次 144px 的布局位移，
     同屏第二张卡大小差 2.5 倍。判据取两件实现无关的事实：① 同一行内各卡等宽；② 把图片响应**延迟**
     （不是 abort，避免走进 CDN 降级链）测得的盒宽/行高与正常加载逐项一致。 */
  test('首页 /：版本上新特写行的盒宽不依赖图片加载（禁 max-content 塌缩）', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);

    const measure = async (delayImages: boolean) => {
      if (delayImages) {
        await page.route('**/*.{webp,png}', async (route) => {
          await new Promise((resolve) => setTimeout(resolve, 8_000));
          await route.continue();
        });
      }
      await page.goto('/');
      await expect(page.locator('.nk-hub-release__section').first()).toBeVisible();
      const rows = await page.evaluate(() =>
        [...document.querySelectorAll('.nk-hub-release__section')].map((section) => {
          const band = section.querySelector('.nk-hub-release__band') as HTMLElement;
          return {
            kind: section.getAttribute('data-kind') ?? '',
            // 量**卡本体**而不是网格单元：手机档主卡单元的轨是 `1fr`（262px）而卡只有 104px，
            // 单元等宽是没有意义的判据；要锁的是「同屏两张卡看起来一样大」。
            widths: [...section.querySelectorAll('.nk-hub-release__cell')].map((cell) => {
              const card = cell.firstElementChild as HTMLElement | null;
              return Math.round((card ?? cell).getBoundingClientRect().width);
            }),
            bandHeight: Math.round(band.getBoundingClientRect().height),
          };
        }),
      );
      if (delayImages) await page.unroute('**/*.{webp,png}');
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
