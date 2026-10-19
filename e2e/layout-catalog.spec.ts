import { test, expect } from '@playwright/test';
import { collectConsoleIssues, readJson } from './helpers';
import { noUnknownOverflow } from './layout.shared';

const VIRTUAL_PAGES = ['/achievement', '/item', '/monster'];

test.describe('布局验收：目录引擎 · 虚拟网格', () => {

  for (const route of VIRTUAL_PAGES) {
    test(`${route}：卡片内容不得超出单元格（固定行高会静默裁掉溢出内容）`, async ({ page }) => {
      const { assertNoErrors } = collectConsoleIssues(page);
      await page.goto(route);
      await expect(page.locator('.nk-virtual-cell').first()).toBeVisible();

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

  for (const route of ['/item', '/monster', '/achievement']) {
    test(`${route}：被截断的卡片文本必须给出完整文本（title / aria-label）`, async ({ page }) => {
      const { assertNoErrors } = collectConsoleIssues(page);
      await page.goto(route);
      await expect(page.locator('.nk-virtual-cell').first()).toBeVisible();
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

  test.describe('角色卡副行：任何视口不折行，且信息不因视觉隐藏而丢失', () => {
    for (const locale of ['', '/pt']) {
      for (const width of [390, 1440]) {
        test(`${locale || '/cn'} @${width}`, { tag: '@viewport-pinned' }, async ({ page }) => {
          await page.setViewportSize({ width, height: 900 });
          await page.goto(`${locale}/character`);
          await expect(page.locator('a.nk-idx-card').first()).toBeVisible();
          await page.waitForTimeout(500);

          const r = await page.evaluate(() => {
            const cards = [...document.querySelectorAll('a.nk-idx-card')].filter(
              (c) => c.querySelectorAll('.nk-idx-card__tag').length === 2,
            );
            const wrapped: string[] = [];
            for (const c of cards) {
              const tops = [...c.querySelectorAll('.nk-idx-card__tag')].map((t) =>
                Math.round(t.getBoundingClientRect().top),
              );
              if (new Set(tops).size > 1) {
                wrapped.push((c.querySelector('.nk-idx-card__name')?.textContent || '').trim());
              }
            }
            const t = cards[0]?.querySelector('.nk-idx-card__tag-text');
            const cs = t ? getComputedStyle(t) : null;
            const box = t?.getBoundingClientRect();
            const srOnly = !!cs && cs.display !== 'none' && !!box && box.width <= 2 && box.height <= 2;
            const vis = !!box && box.width > 2;
            return {
              n: cards.length,
              wrapped,
              text: (t?.textContent || '').trim(),
              srOnly,
              visible: vis,
              a11yText: (cards[0]?.textContent || '').replace(/\s+/g, ' ').trim(),
            };
          });

          expect(r.n, '应渲染出带两项元信息的角色卡').toBeGreaterThan(0);
          expect(r.wrapped, '副行折成两行的卡片').toEqual([]);
          expect(r.text.length, '副行文字必须有内容（无论是否可见）').toBeGreaterThan(0);
          expect(r.srOnly || r.visible, '副行文字须「可见」或「sr-only 隐藏」二者之一').toBe(true);
          expect(r.a11yText, '属性文本必须在无障碍树中').toContain(r.text);

          await noUnknownOverflow(page);
        });
      }
    }
  });
});
