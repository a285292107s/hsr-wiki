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

  test('/character/1001：技能卡折叠开关为可点外观（浅底 + 发丝描边 + 6px 圆角）且文案成对', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
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
});
