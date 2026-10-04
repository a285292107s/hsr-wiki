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
 * 布局验收：角色详情页 —— 技能族结构（父卡与子卡归属、缩进与竖轨、手机断点形态）。
 *
 * `layout-character-*.spec.ts` 按域拆分文件之一（文件级并行是唯一被采纳的提速手段：
 * `fullyParallel: false` 只禁文件内并行）。标签语义（`@viewport-pinned` / `@cross-engine` /
 * `@viewport-independent`）与数值断言纪律见 docs/agents/testing.md。
 */

test.describe('布局验收：角色详情页', () => {

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

  test('/character/1212：战技族父节点以族序为准（父卡「无罅飞光」；SkillList 首位的「寒川映月」降为子卡）', { tag: '@viewport-independent' }, async ({ page }) => {
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

  test('/character/1509：天赋族不再拆成两张平级卡（150904 之下挂 150905）', { tag: '@viewport-independent' }, async ({ page }) => {
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

  test('/character/1510：4 成员族（天赋 151004 + 3 条助战技）= 1 父卡 + 恰 3 子卡，子卡名按族序', { tag: '@viewport-independent' }, async ({ page }) => {
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
});
