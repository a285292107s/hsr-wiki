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
 * 布局验收：角色详情页 —— 区块导航与视口矩阵（区块内索引 / 吸顶横滑 / 高亮落点 / 极端视口）。
 *
 * `layout-character-*.spec.ts` 按域拆分文件之一（文件级并行是唯一被采纳的提速手段：
 * `fullyParallel: false` 只禁文件内并行）。标签语义（`@viewport-pinned` / `@cross-engine` /
 * `@viewport-independent`）与数值断言纪律见 docs/agents/testing.md。
 */

test.describe('布局验收：角色详情页', () => {

  // 长区块（技能 1800px+ / 星魂 1400px+）的可扫描性契约：区块内索引 = 纯锚点导航，条目与卡片一一对应，
  // 跳转落点必须落在吸顶工具条之下（否则「跳过去」被吸顶条盖住标题）。期望值一律派生：
  // 落点下界从吸顶条实测高度取，卡片间距与卡内距比大小，触控线用契约常量 44（跨会话不得漂移）。
  // 用例自钉 1440×900 ⇒ **必须**带 `@viewport-pinned`：否则 mobile project 会以 Pixel 7（`isMobile` +
  // 触摸仿真）重跑同一条桌面几何契约，实测在 CI 上 `boundingBox()` 等不到元素稳定态而 30s 超时（3 次重试全红）。
  // 该纪律由 `tools/check-e2e-viewport-tags.mjs` 机检。
  test('/character/1204：技能 / 星魂区块内索引（锚点一一对应 + 跳转落点在吸顶条之下 + 触控 44）', { tag: '@viewport-pinned' }, async ({ page }) => {
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
      // 用 `evaluate(getBoundingClientRect)` 而非 `boundingBox()` 取值：后者会等元素「稳定」，平滑滚动期间
      // 可能长时间不返回（实测曾把整条用例拖到 30s 超时、且超时信息里看不到断言值）。这里判的是**滚动中的
      // 目标位置**是否已进入可接受区间，轮询值本身不该有稳定性前置条件。
      const targetY = () => page.locator(`#${targetId}`).evaluate((el) => el.getBoundingClientRect().y);
      await expect.poll(targetY, { timeout: 4_000 }).toBeLessThan(barH + 80);
      expect(await targetY(), `${panelKey} 首个索引项的落点须在吸顶条之下`).toBeGreaterThanOrEqual(barH);
      expect(await page.locator(`#${targetId}`).isVisible()).toBe(true);
    }

    // 卡片间距 > 卡内距：此前组间距 20px 比卡片自身 24px 内距还小，六张卡读成一片。
    // 不重新 goto：上面只改了滚动位置与选中态，DOM 未变，重导航纯属白付一次首屏成本。
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
  test('/character/1204：吸顶区块导航在 <1024 档可横滑到位 + 有溢出提示 + 触控 44 且条高不变', { tag: ['@viewport-pinned', '@cross-engine'] }, async ({ page }) => {
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
  test('/character/1204：配队头像的可达名来自随站数据（不得是 #id 回退串）', { tag: '@viewport-independent' }, async ({ page }) => {
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
  test('/character/1204：技能等级滑条在键盘 Tab 下有可见焦点环', { tag: '@cross-engine' }, async ({ page }) => {
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
  test('/character/1001：极端视口矩阵（320 / 834 / 矮横屏 / 2560）四条不变量', { tag: ['@viewport-pinned', '@cross-engine'] }, async ({ page }) => {
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
