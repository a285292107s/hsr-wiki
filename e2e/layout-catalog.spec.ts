import { test, expect } from '@playwright/test';
import { collectConsoleIssues, readJson } from './helpers';
import { noUnknownOverflow } from './layout.shared';

/**
 * 布局验收：目录引擎（虚拟滚动网格）—— layout 验收层（语义契约 + 数值规格）分域文件之一。
 *
 * 只放**引擎级**契约（对配置驱动目录页普遍成立），页面专属刻度放各自分域文件。
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

/** 走虚拟滚动的目录页（单元格是绝对定位的固定行高盒，卡是它的子元素） */
const VIRTUAL_PAGES = ['/achievement', '/item', '/monster'];

test.describe('布局验收：目录引擎 · 虚拟网格', () => {

  for (const route of VIRTUAL_PAGES) {
    test(`${route}：卡片内容不得超出单元格（固定行高会静默裁掉溢出内容）`, async ({ page }) => {
      const { assertNoErrors } = collectConsoleIssues(page);
      await page.goto(route);
      await expect(page.locator('.nk-virtual-cell').first()).toBeVisible();

      /* 行高是引擎按配置算出的**常数**，卡内容却是数据驱动的（标题长度 / 描述行数 / 图片比例）。
         两者对不上时卡片的 `overflow: hidden` 会把尾部内容静默裁掉——这类缺陷肉眼极难发现
         （少一行描述、系列名被切），但 `scrollHeight > clientHeight` 一测即出。 */
      const overflowing = await page.locator('.nk-virtual-cell > *').evaluateAll((els) =>
        els
          .map((el) => ({
            card: el.className.split(' ')[0],
            over: el.scrollHeight - el.clientHeight,
            text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 24),
          }))
          .filter((x) => x.over > 1),
      );
      expect(overflowing, '卡片内容超出单元格高度（行高刻度 < 内容高）').toEqual([]);

      await noUnknownOverflow(page);
      assertNoErrors();
    });
  }

  test('/character：搜索域整块可落焦（点内距 / 放大镜一带也必须聚焦到 input）', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/character');
    await expect(page.locator('.nk-idx-card').first()).toBeVisible();

    /* 交互契约：视觉域 = 点击域。旧形态宿主是 `<div>`、input 只有 21px 高，
       点 40px 高输入域的边缘或放大镜没有任何反应（看着能点、点不动）。 */
    const box = await page.locator('.nk-cat-search').boundingBox();
    expect(box).not.toBeNull();
    for (const [dx, label] of [
      [8, '放大镜一带'],
      [box!.width - 6, '右侧内距'],
    ] as const) {
      await page.mouse.click(box!.x + dx, box!.y + box!.height / 2);
      await expect(page.locator('.nk-cat-search input'), `点${label}应聚焦输入框`).toBeFocused();
    }
    await page.keyboard.type('镜');
    await expect(page.locator('.nk-cat-search input')).toHaveValue('镜');

    await noUnknownOverflow(page);
    assertNoErrors();
  });

  /* 触屏没有 hover：目录卡上的名字被 `nowrap + ellipsis` 截掉之后，若不留复原手段，
     那段文字在手机上就**永久读不到**（第 7 轮光锥适配角色名同类问题）。这里锁的判据是
     「被截断 ⇒ 自身或祖先必须有含该文本的 title / aria-label」。 */
  for (const route of ['/item', '/monster', '/achievement']) {
    test(`${route}：被截断的卡片文本必须给出完整文本（title / aria-label）`, async ({ page }) => {
      const { assertNoErrors } = collectConsoleIssues(page);
      await page.goto(route);
      await expect(page.locator('.nk-virtual-cell').first()).toBeVisible();
      // 滚一屏，让第二批卡（长名字多集中在这里）进入渲染
      await page.evaluate(() => {
        const sc = [...document.querySelectorAll('*')].find(
          (e) => e.scrollHeight > e.clientHeight + 100 && /auto|scroll/.test(getComputedStyle(e).overflowY),
        );
        if (sc) sc.scrollTop = 800;
        else window.scrollTo(0, 800);
      });
      await page.waitForTimeout(400);

      const gaps = await page.evaluate(() => {
        const out: string[] = [];
        for (const el of document.querySelectorAll('*')) {
          if (el.children.length) continue;
          const text = (el.textContent || '').trim();
          if (!text) continue;
          const cs = getComputedStyle(el);
          // 视觉隐藏（a11y 专用）：1×1 + clip-path 是 sr-only 的标准写法，不算被截断
          if (cs.clipPath && cs.clipPath.includes('inset(50%)')) continue;
          if (el.clientWidth <= 2 && el.clientHeight <= 2) continue;
          const clipped =
            (cs.overflow !== 'visible' || cs.textOverflow === 'ellipsis') &&
            el.scrollWidth > el.clientWidth + 1 &&
            el.clientWidth > 0;
          if (!clipped) continue;
          let cur: Element | null = el;
          let found = false;
          for (let i = 0; i < 5 && cur && cur !== document.body; i++) {
            const t = cur.getAttribute('title');
            const a = cur.getAttribute('aria-label');
            if ((t && t.includes(text)) || (a && a.includes(text))) { found = true; break; }
            cur = cur.parentElement;
          }
          if (!found) {
            const cls = (el.className || '').toString().split(' ').slice(0, 2).join('.');
            out.push(`${cls || el.tagName.toLowerCase()}「${text.slice(0, 16)}」${el.clientWidth}/${el.scrollWidth}px`);
          }
        }
        return out;
      });
      expect(gaps, `${route}：截断但无可复原文本`).toEqual([]);

      await noUnknownOverflow(page);
      assertNoErrors();
    });
  }

  test('/item：物品描述可检索、且卡片 title 带描述（此前既不显示也不可检索）', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    /* 数据事实：2606 条物品里 1609 条有 `desc`、2058 条有 `bg_desc`，而 10 列 × 127px 的图标栅格
       放不下正文、卡片也不是链接 ⇒ 描述此前在 UI 里**完全不可达**。本用例锁两件事：
       ① 描述进检索域（按成就页 `searchText: 标题 + 描述` 的同口径）；② 描述挂在卡片 `title` 上。
       期望值全部数据派生：取一条「描述里有、名字里没有」的片段去搜。 */
    const items = readJson<{ name: string; desc?: string }[]>('public/data/cn/items.json');
    const names = new Set(items.map((i) => i.name));
    const sample = items
      .map((i) => ({ item: i, desc: String(i.desc || '') }))
      .find(({ desc }) => desc.length >= 16 && !names.has(desc.slice(6, 12)) && !/[「」]/.test(desc.slice(6, 12)));
    expect(sample, '数据里应存在可用于检索的描述样本').toBeTruthy();
    const frag = sample!.desc.slice(6, 12);

    await page.goto('/item');
    await expect(page.locator('.nk-item-card').first()).toBeVisible();

    await page.fill('.nk-cat-search input', frag);
    await expect(
      page.locator('.nk-item-card').filter({ hasText: sample!.item.name }).first(),
      `按描述片段「${frag}」应命中「${sample!.item.name}」`,
    ).toBeVisible();

    await page.fill('.nk-cat-search input', sample!.item.name);
    const titled = await page.locator('.nk-item-card').evaluateAll(
      (els, target) =>
        els
          .filter((e) => e.getAttribute('data-name') === target)
          .map((e) => e.getAttribute('title') || ''),
      sample!.item.name,
    );
    expect(titled.length, '检索到目标卡片').toBe(1);
    expect(titled[0], '卡片 title 应含描述').toContain(sample!.desc.slice(0, 8));

    /* 检索序：名字命中必须排在**仅描述命中**之前。把描述纳入检索域后，若不排序，
       精确同名会被埋在描述命中之后（实测 /item 搜「信用点」时同名卡排到第 8 位）。 */
    const order = await page.locator('.nk-item-card').evaluateAll(
      (els, q) => els.map((e) => String(e.getAttribute('data-name') || '').toLowerCase().includes(q)),
      sample!.item.name.toLowerCase(),
    );
    const targetIdx = order.indexOf(true);
    const firstDescOnly = order.indexOf(false);
    expect(targetIdx, '目标卡片应在结果里').toBeGreaterThanOrEqual(0);
    if (firstDescOnly >= 0) {
      expect(targetIdx, '名字命中必须排在仅描述命中之前').toBeLessThan(firstDescOnly);
    }

    await noUnknownOverflow(page);
    assertNoErrors();
  });
});
