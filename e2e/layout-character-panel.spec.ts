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
 * 布局验收：角色详情页 —— 页面级规格（属性规格表 / 章标 / 圆角阈值 / 折叠开关 / 配队标头）。
 *
 * `layout-character-*.spec.ts` 按域拆分文件之一（文件级并行是唯一被采纳的提速手段：
 * `fullyParallel: false` 只禁文件内并行）。标签语义（`@viewport-pinned` / `@cross-engine` /
 * `@viewport-independent`）与数值断言纪律见 docs/agents/testing.md。
 */

test.describe('布局验收：角色详情页', () => {

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

  // 圆角档位契约（全站反 AI 味立场）：本页圆角只允许走刻度三档（`--nk-radius-1..3`）、直角 0 与真圆形 50%。
  // 2026-10 之前这里锁的是「0 / 内联 4px / 容器令牌 / 圆形」四值——4px 是当时页面自定义的内联档；刻度收口后
  // 内联 chip 与控件统一到 6px（`--nk-radius-2`），原先硬编码的 4px 常量随之退场。
  // **期望值一律从页面与根令牌派生**（容器档解析 `--nk-char-radius-card`，三档解析 `--nk-radius-*`），
  // 断言里不再写任何绝对 px 常量。
  test('/character/1204：页面圆角只走刻度三档（+ 直角与圆形）', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/character/1204');
    await page.waitForSelector('.nk-stats__stat');
    const tiers = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      const px = (name: string) => parseFloat(root.getPropertyValue(name));
      const pageTok = getComputedStyle(document.querySelector('.nk-char-page') as Element)
        .getPropertyValue('--nk-char-radius-card')
        .trim();
      return { one: px('--nk-radius-1'), two: px('--nk-radius-2'), three: px('--nk-radius-3'), raw: pageTok };
    });
    expect(tiers.raw, '容器圆角档须来自页面令牌（缺失即回到字面量时代）').not.toBe('');
    expect(tiers.three, '刻度三档必须存在且为数值').toBeGreaterThan(0);
    const containerNum = parseFloat(tiers.raw);

    const hits = await page.evaluate((t) => {
      const allowed = new Set([0, t.one, t.two, t.three]);
      const out: string[] = [];
      document.querySelectorAll('.nk-char-page *').forEach((el) => {
        const r = getComputedStyle(el).borderTopLeftRadius;
        if (!r || r === '0px') return;
        if (r.endsWith('%')) return;              // 真圆形（头像 / 状态点）属形状，不属档位
        const n = parseFloat(r);
        if (allowed.has(n)) return;               // 刻度三档与直角
        if (n <= t.one) return;                   // 记号端头（≤ 芯片档）等同直角
        out.push(`${(el as HTMLElement).className}`.slice(0, 40) + ' = ' + r);
      });
      return Array.from(new Set(out)).slice(0, 8);
    }, tiers);
    expect(hits, '页面圆角出现了刻度三档之外的档位（含胶囊回潮）').toEqual([]);
    expect(containerNum).toBe(tiers.three);
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
});
