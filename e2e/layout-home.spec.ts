import { test, expect } from '@playwright/test';
import { collectConsoleIssues, readJson, waitForCatalogCards, waitForSettled } from './helpers';
import { noUnknownOverflow } from './layout.shared';

/**
 * 布局验收：常规主题 —— layout 验收层（语义契约 + 数值规格）分文件之一。
 *
 * 分文件判据（为何按域拆、单文件该多小）见 docs/agents/testing.md「layout 必须按 describe 边界分文件」。
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
  /** 当前版本的 version_label（数据派生；抬头断言与空态断言共用同一来源，不写死版本号） */
  const versionLabelRaw = String(readJson<{ version_label?: string }>('public/data/cn/version.json').version_label ?? '');

  test('首页 /：品牌带标题、版本上新三分区、无溢出', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/');
    await expect(page.locator('.nk-hub-masthead__title')).toBeVisible();
    // 站点名易变，不断言具体文案，只验非空
    await expect(page.locator('.nk-hub-masthead__title')).toHaveText(/\S/);
    /* 版本抬头（2026-10 重构）：版本号是这一页的主语，故它是首屏最大的字，且与
       `version.json` 的 `version_label` 同源；「版本上新」跟在数字旁当单位。
       旧形态的 eyebrow（KICKER 小字）与类别索引条（CHARACTER · LIGHT CONE · RELIC）
       是「小字压在大字上方」与「家具式字符串」，随本轮一并删除，不再有断言对象。 */
    const versionLabel = String(readJson<{ version_label?: string }>('public/data/cn/version.json').version_label ?? '');
    expect(versionLabel, 'version.json 缺 version_label：本用例的抬头判据失去数据来源').toBeTruthy();
    await expect(page.locator('.nk-intake__batch-num')).toHaveText(versionLabel);
    await expect(page.locator('.nk-intake__batch-note')).toHaveText('版本上新');
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

  test('首页 /：特写块只属于恰 1 条的分区，≥2 条一律平权卡带（不偏袒第一条）', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/');
    await expect(page.locator('.nk-hub-release__section').first()).toBeVisible();

    /* 判据（2026-10 修订）：特写块的规格列**只承担排版权重与显式动作**，不得复述卡上已有的文字。
       实测旧形态：卡内「真珠 / ★★★★★ / 冰 / 欢愉」与规格列「真珠 / 冰 / 欢愉」逐字重复，
       两处链接还同指详情页——同一屏里同一信息出现两遍是「没做完」的观感。允许重复的只有名字。

       判据（2026-11 修订 b，≥2 条不再特写某一条）：旧判据是 `count ≤ 2` 且取 `picked[0]`，实测 4.6
       遗器两套里只有第一套拿到大名字 + 入口，另一套权重相同却什么都没有——「特写哪一条」没有判据，
       纯由数据顺序决定。故 **≥2 条的分区不得出现规格块**：每条的名字在卡上、卡本身就是入口。

       判据（2026-11 修订 c，注释栏）：单条目行的规格块升级为编辑式「图 + 注释栏」——名字领先、
       **数据正文承中**（该条目卡上没有的定义性事实：角色一句话简介 / 光锥技能效果 / 遗器四件套
       效果，来自详情 JSON，与分区同批就绪）、入口殿后。中段 940px 的空档由真实内容承载；
       正文若有任何与卡面逐字重复的片段，仍由 duplicated 判红。
       （旧「名字落右半区」判据随成组靠右形态一并退场：名字现在领先注释栏。） */
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
        // 卡本体：特写档是 cell 内的卡，平权档直接是带的子元素（`<a>`）
        const cards = [...band.children].filter((el) => el !== spec);
        const bandBox = band.getBoundingClientRect();
        const specBox = spec ? spec.getBoundingClientRect() : null;
        return {
          kind: sec.getAttribute('data-kind'),
          count: Number(sec.querySelector('.nk-hub-release__label-count')?.textContent?.trim() || '0'),
          labelText: (sec.querySelector('.nk-hub-release__label')?.textContent || '').replace(/\s+/g, ' ').trim(),
          // 分区级入口（图鉴页）：任何条数下唯一、且不偏袒条目的显式动作
          entry: (() => {
            const a = sec.querySelector('.nk-hub-release__all') as HTMLAnchorElement | null;
            if (!a) return null;
            const b = a.getBoundingClientRect();
            return { text: a.textContent.replace(/\s+/g, ' ').trim(), href: a.getAttribute('href'), right: Math.round(b.right) };
          })(),
          /* 入口要对齐的是**内容列的右缘**（= 分区抬头行的右缘），不是「带的右缘」：
             ≥2 条分区的登记架有轨宽上限，带会比内容列窄（实测遗器架 648 vs 内容列 1252）。 */
          headRight: Math.round(sec.querySelector('.nk-hub-release__sechead')!.getBoundingClientRect().right),
          specCount: sec.querySelectorAll('.nk-hub-release__spec').length,
          duplicated: spec ? leafTexts(spec).filter((t) => leafTexts(cell ?? band).includes(t)) : [],
          shownName: spec?.querySelector('.nk-hub-release__spec-name')?.textContent?.trim() ?? '',
          briefChars: (spec?.querySelector('.nk-hub-release__spec-brief')?.textContent || '').replace(/\s+/g, '').length,
          trailing: specBox ? Math.round(bandBox.right - specBox.right) : null,
          // 注释栏压在**内容列的外缘**上：角色分区（板在左）取右缘，光锥分区（镜像版式）取左缘
          mirrored: sec.getAttribute('data-kind') === 'lightcone',
          edgeGap: specBox
            ? (sec.getAttribute('data-kind') === 'lightcone'
              ? Math.round(specBox.left - bandBox.left)
              : Math.round(bandBox.right - specBox.right))
            : null,
          cardLink: cell?.querySelector('a')?.getAttribute('href') ?? null,
          specLink: spec?.querySelector('a')?.getAttribute('href') ?? null,
          bandRight: Math.round(bandBox.right),
          // 平权档：每条都必须自己是链接、且卡内写着自己的名字
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
    /* 分区级入口：三个分区各指向自己的图鉴页，且右缘与内容列右缘（= 带的右缘）齐平——
       它与特写注释栏共用同一条右基准线，页面只有一条右列。 */
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
        // 注释栏必须**压在内容列的外缘**（角色在右、光锥镜像在左）：否则外缘留出一片无来由的空档
        expect(Math.abs(r.edgeGap!), `${r.kind}：注释栏离内容列外缘 ${r.edgeGap}px`).toBeLessThanOrEqual(2);
        // 入口指向的必须是这张主卡条目
        expect(r.specLink, `${r.kind}：特写块入口缺失`).toBeTruthy();
        expect(r.specLink).toBe(r.cardLink);
        // 数据正文（注释栏承中）：卡上没有的定义性事实，必须有真实内容（防退回「名字+按钮」空档形态）
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
    // 数据侧哨兵：两条形态都要在真实数据里被覆盖到，否则本用例会空转
    expect(singleRows, '应至少有一个单条目分区').toBeGreaterThanOrEqual(1);
    expect(plainRows, '应至少有一个 ≥2 条分区').toBeGreaterThanOrEqual(1);

    await noUnknownOverflow(page);
    assertNoErrors();
  });

  /* 版本抬头的编辑层级（2026-10 重构后）：一级＝版本号（首屏最大的字），二级＝「版本上新」，
     三级＝一行 claim（件数）。旧形态的 KICKER 小字（eyebrow）与 `CHARACTER · LIGHT CONE · RELIC`
     类别索引条（家具式字符串 + 小号大写字母距标签）一并删除——两者都在反 AI 味清单里，
     故本用例的判据从「小字压在大字上方」改成「版本号必须是这一页最大的字」。 */
  test('首页 /：版本抬头——版本号是首屏最大的字，claim 与分区件数同源', async ({ page }) => {
    await page.goto('/');
    const batchNum = page.locator('.nk-intake__batch-num');
    const batch = page.locator('.nk-intake__batch');
    const claim = page.locator('.nk-intake__claim');
    await expect(batchNum).toBeVisible();
    await expect(claim).toBeVisible();
    // 可访问名复原成一句完整的话（视觉上拆成「4.6」+「版本上新」两段，读屏要读成一句）
    await expect(batch).toHaveAttribute('aria-label', /^\S.*版本上新$/);

    // 分区条数之和 == claim 里的件数（两处若各写一份口径就会漂移）
    const total = await page.locator('.nk-hub-release__label-count').evaluateAll((els) =>
      els.reduce((n, el) => n + Number(el.textContent?.trim() || '0'), 0),
    );
    await expect(claim).toContainText(String(total));

    // 层级判据（数值形态：相对关系）：版本号字号必须严格大于页面里其余任何可见文字
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
    /* 报头不得退回「带」形态：它必须是紧凑的一行文字，而不是一块带固定高度的面板。
       上限取 120px（实测约 93px）——旧带是 210~240px，且会在其下沿截断页面地面的材质。 */
    const mastheadH = await page.locator('.nk-hub-masthead').evaluate((el) =>
      Math.round(el.getBoundingClientRect().height),
    );
    expect(mastheadH).toBeLessThanOrEqual(120);
    // 首屏契约（ADR 0019 决策 11）：报头 + 版本抬头 + 第一分区标题与首行卡片完整可见。
    // 后续分区随滚动进入（scroll-driven reveal 编排），不再钉进首屏——那会把上新卡压回仪表盘尺度。
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
    // 抬头在任何一态下都必须已经成立：版本号来自 version.json（不被本用例延后），单位行紧随其后
    await expect(page.locator('.nk-intake__batch-num')).toHaveText(versionLabelRaw);
    await expect(page.locator('.nk-intake__batch-note')).toHaveText('版本上新');
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
    // 无 version_label ⇒ 抬头落回「版本上新」四个字（版本号缺席时它不是数字位，仍是这一页的主语）
    await expect(page.locator('.nk-intake__batch-num')).toHaveText('版本上新');
    // 空态不回退板块索引、不改显历史版本；品牌带与共享页脚仍在
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
    // 工具条存在（搜索 + 筛选下拉）
    await expect(page.locator('.nk-cat-toolbar').first()).toBeVisible();
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  /* 角色图鉴在手机与桌面**同一套排版**：曾经 <768 是一整套行式头像卡（单列发丝线行 + 44px 圆头像
     + 圆环 + `__body` 流式 + 圆头像双源切图），本轮按用户指令退场。判据取「与桌面同构」而不是
     逐个数值：卡片 `display` / 立绘框比例 / 文字叠压位 / 图源四项逐个与 1440 档比对——
     光断言「有网格、无溢出」时，行式卡形态同样能满分通过（它也是一个网格的 1 列）。
     数值档位（列宽下限）仍允许按档收窄，故不断言列数，只断言「列数随可用宽单调不回跳」这一相对关系。 */
  test('角色图鉴 /character：手机断点与桌面同一套网格卡（无行式头像卡形态）', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);

    /** 卡片形态指纹：四项都是「同一套排版」的可判定判据，且都不随列宽变化。
     *  图源判据取 `currentSrc` 的**目录段**：圆头像与商店立绘的文件名同形（都是 `1513.webp`），
     *  只有 `avatarroundicon/` 与 `avatarshopicon/` 之分 ⇒ 比文件名等于没比。 */
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
          // 文字叠压在立绘下缘（桌面形态）⇒ body 绝对定位；行式卡是 static 流式
          bodyPos: getComputedStyle(body).position,
          // 双源切图（`<picture>` + `source[media]`）整体退场：它是行式卡形态的组成部分
          hasPicture: !!el.querySelector('picture'),
          columns: getComputedStyle(el.parentElement as HTMLElement).gridTemplateColumns.split(' ').length,
        };
      });
      // `currentSrc` 要等浏览器**异步**完成资源选择后才有值（元素插入 ≠ 已选源，首读常为空串）
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

    // 手机档：形态五项逐项与桌面一致，只有列数变少
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

    // 列数随可用宽单调不回跳（视口由宽到窄取样 ⇒ 列数应非递增），且手机档不再恒为 1 列
    const cols = narrows.map((n) => n.columns as number);
    const shape = JSON.stringify(narrows.map((n) => [n.w, n.columns]));
    expect(cols[0], `767 档应比 320 档列数多：${shape}`).toBeGreaterThan(cols[2]);
    expect(cols[2], '320 档应至少 1 列').toBeGreaterThanOrEqual(1);
    for (let i = 1; i < cols.length; i++) {
      expect(cols[i - 1], `列数随视口变窄不得增加（取样序为宽→窄）：${shape}`).toBeGreaterThanOrEqual(cols[i]);
    }
    assertNoErrors();
  });

  /* 版本上新各档：盒宽**不得依赖图片是否加载**。
     实测缺陷（2026-10）：第二列轨写成 `max-content`，而该列的 max-content 由卡内懒加载图的固有宽度决定
     —— 图未就绪（`naturalWidth = 0`）时塌成卡名文字宽，遗器卡实测 `96.1×122`、图就绪后变 `240×266`，
     列轨随之从 `306│95.84│818` 跳到 `306│240│674` ⇒ 首页每次首屏都有一次 144px 的布局位移，
     同屏第二张卡大小差 2.5 倍（特写档现已是 `306px + 1fr` 两条确定轨，该结构已不可能出现，
     用例继续覆盖两种档：① 同一行内各卡等宽；② 把图片响应**延迟**（不是 abort，避免走进 CDN 降级链）
     测得的盒宽/行高与正常加载逐项一致）。 */
  test('首页 /：版本上新各档的盒宽不依赖图片加载（禁 max-content 塌缩）', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);

    const measure = async (delayImages: boolean) => {
      /* 延迟档必须**真按住**图片响应，且处理器不得跨过本趟导航：
         · `setTimeout(8_000)` 会让处理器在第二次 `goto('/')` 换掉文档之后才醒来，`route.continue()`
           抛 `Route is already handled!`——CI 首跑第 3 条失败即此；改用可放行闸门，量完立刻全部放行并解绑。
         · 闸门按住时 `goto` **不能**等 `load`：被按住的请求本身阻塞 `load`（实测闸门不放行则 6s 超时，
           而闸门在测量之后才放行 ⇒ 变成 30s 用例超时）。用 `domcontentloaded` 才对得上本用例语义——
           「图片未就绪时量」，旧写法因等 `load` 实际量的是放行后的态。 */
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
      // 延迟档的前提：确实拦下了图片请求（图片 URL 来自本地 JSON，不依赖 CDN 可达）。
      // 少了这条，拦截失效时两趟都会是「已加载」，用例会静默退化成空断言。
      if (delayImages) await expect.poll(() => gated, { timeout: 10_000 }).toBeGreaterThan(0);
      /* 两趟必须落在**同一稳定态**：本页「查看档案」按钮用的是 webfont 的中文行盒（`line-height: normal`），
         字体换装会让规格块 +2px、带高随之 +2px（实测 187.75 → 189.75，无规格块的遗器档 Δ0），
         超 ≤1px 容差——首跑第 3 条 `character：行高不得随图片加载变化` 的真凶就是它（与图片无关）。
         `waitForSettled` 的字体等待是**非致命**的（5s 上限 + swallow），不足以为 ≤1px 容差定型，故显式断言。 */
      await waitForSettled(page);
      await expect
        .poll(() => page.evaluate(() => document.fonts.status), { timeout: 10_000, message: '字体未就绪：两趟测量不可比' })
        .toBe('loaded');
      const rows = await page.evaluate(() =>
        [...document.querySelectorAll('.nk-hub-release__section')].map((section) => {
          const band = section.querySelector('.nk-hub-release__band') as HTMLElement;
          return {
            kind: section.getAttribute('data-kind') ?? '',
            // 量**卡本体**而不是网格单元：特写档卡在 `__cell` 里（手机档该单元的轨是 `1fr` 而卡只有
            // 104~300px），平权档带内直接就是卡。单元等宽没有意义，要锁的是「同屏各卡一样大」。
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
        // 量完立刻放行，并等在途处理器退场，再解绑（否则解绑后仍可能有处理器在跑）
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
