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
 * 布局验收：角色详情页 —— hero 封面结构与素材（阵营/注音/抬头行/素材对位/主字分档）。
 *
 * `layout-character-*.spec.ts` 按域拆分文件之一（文件级并行是唯一被采纳的提速手段：
 * `fullyParallel: false` 只禁文件内并行）。标签语义（`@viewport-pinned` / `@cross-engine` /
 * `@viewport-independent`）与数值断言纪律见 docs/agents/testing.md。
 */

test.describe('布局验收：角色详情页', () => {
  test('/character/1001：hero、概览面板、无溢出', { tag: '@cross-engine' }, async ({ page }) => {
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

  // hero 可读性契约：压在媒体上的文字只靠字形自身（细软影）拉开，媒体上不得出现底板 / 整片压暗。
  // 用户判据——底板浓度无论怎么调都会明显影响立绘与 Spine，而文字与立绘重叠本就不多；
  // 重叠面积与最坏单像素的实测值见 `character-hero.css` 的 `--nk-hero-glyph-ink` 注释（此处不复述，避免漂移）。
  //
  // hero 素材对位契约（A2 收口）：1024~1439 档媒体盒贴到视口、容器无余量可移，故改**资产对位**
  // （`background-position: right`），≥1440 档改走容器整体位移（保持立绘与 Spine 对齐）。
  // 断言用相对关系而非像素：窄档对位必须比宽档更靠右（`background-position-x` 100% vs 50%），
  // 且 1440 起必须回到与 Spine 对齐的居中档——否则「窄档收益」会被一次无关改动静默抹掉。
  test('/character/1001：hero 素材对位分档（窄桌面档右对齐 / ≥1440 回到居中）', { tag: ['@viewport-pinned', '@cross-engine'] }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    const read = () =>
      page.evaluate(() => {
        const bg = document.querySelector('.nk-hero__bg') as HTMLElement;
        const cs = getComputedStyle(bg);
        return { x: parseFloat(cs.backgroundPositionX) || 0, pos: cs.backgroundPosition };
      });

    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/character/1001');
    await page.waitForSelector('.nk-hero--char');
    const narrow = await read();

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/character/1001');
    await page.waitForSelector('.nk-hero--char');
    const wide = await read();

    expect(narrow.pos, '1024 档素材须右对齐（窄档文字列与立绘共享空间，容器无余量可移）').not.toBe('50% 40%');
    expect(wide.pos, '≥1440 档素材须回到居中（该档走容器位移，保持立绘与 Spine 对齐）').toBe('50% 40%');
    // 相对关系：窄档对位必须严格更靠右（百分比定位下 100% > 50%）
    expect(narrow.x, `窄档 bgPositionX=${narrow.x} 须大于宽档 ${wide.x}`).toBeGreaterThan(wide.x);
    assertNoErrors();
  });

  test('/character/1001 桌面：hero 文字可读性只落在字形（媒体无底板 / 无整片遮罩）', { tag: ['@viewport-pinned', '@cross-engine'] }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/character/1001');
    await page.waitForSelector('.nk-hero--char');
    await page.waitForSelector('.nk-stats__stat');

    // ① 三行文字（信息行 / 名称 / 简介）都带字形软影：墨色来自令牌、层数受控（原实现是 8 层描边盾）
    const ink = (await resolveTokenColor(page, '--nk-hero-glyph-ink', '.nk-char-page')).replace(/\s+/g, '');
    // 序列化随引擎而定（Chromium 给 `color(srgb 0 0 0 / 0.82)`），故只断言「不是全不透明」
    const alphaOf = (c: string) => {
      const m = c.match(/rgba\([^)]*,\s*([\d.]+)\)/) || c.match(/\/\s*([\d.]+)\)/);
      return m ? Number(m[1]) : 1;
    };
    expect(alphaOf(ink), '软影墨色须为半透明（不透明描边会啃掉字形本身）').toBeLessThan(1);
    for (const sel of ['.nk-hero__meta-row', '.nk-hero__name', '.nk-hero__desc']) {
      const s = await page.locator(sel).evaluate((el) => {
        const shadow = getComputedStyle(el).textShadow.replace(/\s+/g, '');
        return { shadow, layers: (shadow.match(/(?:rgb|rgba)\(/g) || []).length };
      });
      expect(s.shadow, `${sel} 须带字形软影`).toContain(ink);
      expect(s.layers, `${sel} 软影层数须 ≤ 2`).toBeLessThanOrEqual(2);
    }

    // ② 徽标为裸文字（用户判据：底板比页面更黑读作「洞」）；压绘处的可读性交给字形软影
    for (const b of await page.locator('.nk-hero__badge:not(.nk-hero__badge--enh)').all()) {
      expect(
        await b.evaluate((el) => getComputedStyle(el).backgroundColor.replace(/\s+/g, '')),
        '元素/命途徽标须为裸文字',
      ).toBe('rgba(0,0,0,0)');
    }

    // ③ 卷宗编号行不得压在媒体上：必须在信息面板盒内（head 首行），且无自身底板
    const geo = await page.evaluate(() => {
      const r = (s: string) => { const el = document.querySelector(s) as HTMLElement; const b = el.getBoundingClientRect(); return { x: b.x, y: b.y, x2: b.x + b.width, y2: b.y + b.height }; };
      return {
        archiveBg: getComputedStyle(document.querySelector('.nk-hero__archive')!).backgroundColor.replace(/\s+/g, ''),
        ar: r('.nk-hero__archive'), panel: r('.nk-hero__panel'),
      };
    });
    expect(geo.archiveBg, '编号行须无底板').toBe('rgba(0,0,0,0)');
    expect(
      geo.ar.x >= geo.panel.x && geo.ar.x2 <= geo.panel.x2 && geo.ar.y >= geo.panel.y && geo.ar.y2 <= geo.panel.y2,
      '编号行须整体落在信息面板盒内（卷宗抬头，不压绘）',
    ).toBe(true);

    // ③ 面板不得有整块底板（`::before` 伪底 + 自身底色 / 底图）
    const panel = await page.locator('.nk-hero__panel').evaluate((el) => {
      const cs = getComputedStyle(el);
      return { before: getComputedStyle(el, '::before').content, bg: cs.backgroundColor.replace(/\s+/g, ''), bgImage: cs.backgroundImage };
    });
    expect(panel.before, '面板框整块底板已退场，不得回归').toBe('none');
    expect(panel.bg, '面板不得有整块底色').toBe('rgba(0,0,0,0)');
    expect(panel.bgImage, '面板不得有整块渐变底板').toBe('none');

    // ④ 媒体上不得有覆盖 >30% 媒体面积的压暗层（面板内文字区与小件铭牌 / 开关除外）
    const washes = await page.evaluate(() => {
      const hero = document.querySelector('.nk-hero--char') as HTMLElement;
      const vis = document.querySelector('.nk-hero__visual') as HTMLElement;
      const vb = vis.getBoundingClientRect();
      const area = vb.width * vb.height;
      const hits: string[] = [];
      for (const el of Array.from(hero.querySelectorAll<HTMLElement>('*'))) {
        if (el === hero || el === vis) continue;
        if (el.closest('.nk-hero__panel, .nk-hero__archive, .nk-hero__toggle, .nk-hero__spine')) continue;
        const bg = getComputedStyle(el).backgroundColor;
        if (!bg || bg === 'rgba(0, 0, 0, 0)') continue;
        const r = el.getBoundingClientRect();
        if (r.width * r.height > area * 0.3) hits.push(`${el.className}:${bg}`);
      }
      return hits;
    });
    expect(washes, '媒体上不得出现整片压暗遮罩').toEqual([]);
    expect(
      await page.locator('.nk-hero__visual').evaluate((el) => getComputedStyle(el, '::before').backgroundImage),
      '桌面档媒体侧向渐隐须退场（覆盖媒体的最后一处压暗）',
    ).toBe('none');

    await noUnknownOverflow(page);
    assertNoErrors();
  });

  // 卷宗封面结构契约：抬头行（编号 · 引导线 · 阵营）→ 规格行（星级 / 属性 / 命途）→ 名称族
  // （中文主字 + 拉丁注音）→ 摘要。阵营不再与游戏机制徽标混排；拉丁注音期望值从随站数据派生。
  test('/character/1001：hero 卷宗封面结构（阵营归抬头行 / 拉丁注音 = name_en / 名称族内距最紧）', { tag: '@cross-engine' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    const d = readJson<{ name_en: string }>('public/data/cn/characters/1001.json');
    expect(d.name_en, '1001 应有拉丁转写（否则本用例失去区分力）').not.toBe('');

    await page.goto('/character/1001');
    await page.waitForSelector('.nk-hero__name');

    const rubric = page.locator('.nk-hero__rubric');
    await expect(rubric.locator('.nk-hero__archive')).toContainText('ARCHIVE');
    await expect(rubric.locator('.nk-hero__camp')).toHaveCount(1);
    await expect(page.locator('.nk-hero__meta-row .nk-hero__camp'), '阵营已归抬头行').toHaveCount(0);
    await expect(page.locator('.nk-hero__name-en')).toHaveText(d.name_en);

    // 名称族是一个排版单元：主字 > 注音字号，且族内行距小于 head 各行的行距
    const geo = await page.evaluate(() => {
      const fs = (s: string) => parseFloat(getComputedStyle(document.querySelector(s)!).fontSize);
      const gap = (s: string) => parseFloat(getComputedStyle(document.querySelector(s)!).rowGap) || 0;
      return { name: fs('.nk-hero__name'), en: fs('.nk-hero__name-en'), titleGap: gap('.nk-hero__title'), headGap: gap('.nk-hero__head') };
    });
    expect(geo.name, '主字字号须大于拉丁注音').toBeGreaterThan(geo.en);
    expect(geo.titleGap, '名称族内距须小于抬头 / 规格行的行距').toBeLessThan(geo.headGap);
    expect(geo.titleGap, '名称族内距不得归零（中文主字与注音会贴死）').toBeGreaterThan(0);

    // 字阶档位：卷宗编号是主字与注记之间唯一的中档锚点（上游 id），
    // 必须大于抬头标签与注记、又必须小于主字——不得越档抢主字。
    const scale = await page.evaluate(() => {
      const px = (s: string) => parseFloat(getComputedStyle(document.querySelector(s)!).fontSize);
      return { label: px('.nk-hero__archive'), no: px('.nk-hero__archive-no'), camp: px('.nk-hero__camp'), name: px('.nk-hero__name') };
    });
    expect(scale.no, '编号档须大于抬头标签').toBeGreaterThan(scale.label);
    expect(scale.no, '编号档须大于阵营').toBeGreaterThan(scale.camp);
    expect(scale.no, '编号档须小于主字（主字仍唯一主角）').toBeLessThan(scale.name);

    await noUnknownOverflow(page);
    assertNoErrors();
  });

  // 抬头行断点形态契约：≥1024 文字列与立绘共享横向空间，阵营并排时必落在立绘亮部（1440 实测阵营
  // 起点 483 / 立绘左缘 452，高 DPI 取证可见灰字压在花瓣上）⇒ 拆两行、两项都退回文字列左缘；
  // <1024 面板在媒体下方、重叠为零，保持单行以省面板高度。纵向分隔只在单行形态里成立。
  // 判据用**纵向区间相交**而非 top 相等：抬头行两端字号不同（编号 1.25rem / 阵营 0.6875rem），
  // `align-items: center` 会让同一行的两项 top 差半个行高——top 差法会把「同行」误判成「拆行」。
  test('/character/1001：抬头行断点形态（≥1024 拆两行且分隔退场 / <1024 单行保留分隔）', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    const read = () => page.evaluate(() => {
      const box = (s: string) => document.querySelector(s)!.getBoundingClientRect();
      const a = box('.nk-hero__archive');
      const c = box('.nk-hero__camp');
      const rule = document.querySelector('.nk-hero__rubric-rule') as HTMLElement;
      return {
        sameRow: Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top) > 0,
        campBelow: c.top >= a.bottom - 1,
        ruleShown: getComputedStyle(rule).display !== 'none',
      };
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/character/1001');
    await page.waitForSelector('.nk-hero__camp');
    const desktop = await read();
    expect(desktop.campBelow, '桌面档阵营须另起一行（不在编号的行区间内）').toBe(true);
    expect(desktop.sameRow, '桌面档两项不得同行').toBe(false);
    expect(desktop.ruleShown, '拆行后纵向分隔退场').toBe(false);

    await page.setViewportSize({ width: 390, height: 844 });
    await expect.poll(async () => (await read()).sameRow, { timeout: 3_000 }).toBe(true);
    expect((await read()).ruleShown, '单行形态保留纵向分隔').toBe(true);

    await noUnknownOverflow(page);
    assertNoErrors();
  });

  // 占位符契约：开拓者形态名上游为 {NICKNAME}（玩家命名），converter 输出空串，前端不得渲染、
  // 更不得回退拼造译名（禁止自建数据源）。
  test('/character/8001：开拓者形态无拉丁注音（占位符留空不渲染）', { tag: '@viewport-independent' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    const d = readJson<{ name: string; name_en?: string }>('public/data/cn/characters/8001.json');
    expect(d.name_en, '开拓者形态的 name_en 须为空串').toBe('');

    await page.goto('/character/8001');
    await page.waitForSelector('.nk-hero__name');
    await expect(page.locator('.nk-hero__name')).not.toBeEmpty();
    await expect(page.locator('.nk-hero__name-en')).toHaveCount(0);

    await noUnknownOverflow(page);
    assertNoErrors();
  });

  // 宽档构图偏移契约：立绘整体右移（逐字形像素实测：1920 档抬头阵营行压绘 39% → 11.6%、
  // 规格行 32.7% → 0%、最坏对比度 2.88 → 4.03）。三条不变量：
  //   ① 偏移落在**布局层**（left），不走 transform —— transform 归滚动视差，两者互不覆盖；
  //   ② 构图不得依赖动画是否在跑（reduced-motion 下 left 不变）；
  //   ③ 偏移量从 CSS 变量派生，不在断言里写死像素。
  test('/character/1001 宽档：立绘横向偏移在布局层且不随动效偏好变化', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/character/1001');
    await page.waitForSelector('.nk-hero--char');
    await page.waitForSelector('.nk-stats__stat');

    const read = () => page.evaluate(() => {
      const host = document.querySelector('.nk-char-page') as HTMLElement;
      const v = document.querySelector('.nk-hero__visual') as HTMLElement;
      const cs = getComputedStyle(v);
      return {
        token: parseFloat(getComputedStyle(host).getPropertyValue('--nk-hero-media-shift')) || 0,
        left: parseFloat(cs.left) || 0,
        right: parseFloat(cs.right) || 0,
        transformX: new DOMMatrixReadOnly(cs.transform).m41,
      };
    });

    const off = await read();
    expect(off.token, '宽档须有非零横向偏移（否则本条失去区分力）').toBeGreaterThan(0);
    expect(off.left, '偏移须落在布局层 left').toBeCloseTo(off.token, 0);
    expect(off.transformX, 'transform 不得承载横向偏移（留给滚动视差）').toBeCloseTo(0, 1);

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect.poll(async () => (await read()).left, { timeout: 3_000 }).toBeCloseTo(off.left, 0);
    expect((await read()).right, '右缘外移量与左缘相同（保持媒体盒宽不变）').toBeCloseTo(-off.token, 0);
    await page.emulateMedia({ reducedMotion: 'no-preference' });

    await noUnknownOverflow(page);
    assertNoErrors();
  });

  // hero 主字势能（名长度分档）：主字按角色名的码点数分两档，档位关系一律用相对断言表达——
  // 期望值不写 px，档位集合与名长度从随站数据派生，跨断点只断言「不缩小」。
  // 高度槽（`--nk-hero-name-slot`）是骨架屏固定盒高的前提：同档内名长度不得改变行盒数或把主字挤出族外。
  const NAME_CASES = [
    { id: '1205', len: 1, tier: 'short' },
    { id: '1204', len: 2, tier: 'long' },
    { id: '1001', len: 3, tier: 'long' },
  ] as const;

  interface NameMetrics {
    len: number; dataLen: number; font: number; slot: number;
    nameW: number; slotW: number; nameLines: number;
  }

  test('/character：hero 主字按名长度分档（1 字档 > 长名档；同档盒高不随名长度变化）', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    const read = () =>
      page.evaluate((): NameMetrics => {
        const name = document.querySelector('.nk-hero__name') as HTMLElement;
        const host = document.querySelector('.nk-char-page') as HTMLElement;
        const slotEl = document.querySelector('.nk-hero__name-slot') as HTMLElement;
        const lh = parseFloat(getComputedStyle(name).lineHeight);
        return {
          len: [...(name.textContent || '').trim()].length,
          dataLen: Number(name.dataset.len),
          font: parseFloat(getComputedStyle(name).fontSize),
          slot: parseFloat(getComputedStyle(host).getPropertyValue('--nk-hero-name-slot')),
          nameW: name.getBoundingClientRect().width,
          slotW: slotEl.getBoundingClientRect().width,
          nameLines: Math.round(name.getBoundingClientRect().height / lh),
        };
      });

    const byVp: Record<number, Record<string, NameMetrics>> = {};
    for (const vp of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
      await page.setViewportSize(vp);
      const seen: Record<string, NameMetrics> = {};
      for (const c of NAME_CASES) {
        await page.goto(`/character/${c.id}`);
        await page.waitForSelector('.nk-hero__name');
        const r = await read();
        expect(r.len, `${c.id} 的名长度须等于档位判据的期望（期望值派生自随站数据）`).toBe(c.len);
        expect(r.dataLen, `${c.id} 的 data-len 须等于名长度`).toBe(c.len);
        expect(r.nameLines, `${c.id} 主字在 ${vp.width} 档必须单行（宽度天花板判据）`).toBe(1);
        expect(r.nameW, `${c.id} 主字不得越出名称族`).toBeLessThanOrEqual(r.slotW + 1);
        seen[c.tier] = seen[c.tier] || r;
        seen[`f:${c.id}`] = r;
      }
      // 档位关系：1 字档主字必须严格大于长名档；两档槽高必须严格大于 0
      expect(seen.short.font, `${vp.width}：1 字档须大于 2 字名（长名档）`).toBeGreaterThan(seen['f:1204'].font);
      expect(seen.short.font, `${vp.width}：1 字档须大于 3 字名（长名档）`).toBeGreaterThan(seen['f:1001'].font);
      expect(seen.short.slot).toBeGreaterThan(0);
      expect(seen.long.slot).toBeGreaterThan(0);
      // 同档内名长度不改变槽高（骨架屏固定盒高的前提）与行盒数
      expect(seen['f:1204'].slot, '同档（2 字 / 3 字）槽高必须相等').toBe(seen['f:1001'].slot);
      expect(seen['f:1204'].nameLines, '同档行盒数必须一致').toBe(seen['f:1001'].nameLines);
      byVp[vp.width] = seen;
    }

    // 跨断点只放大：主字与槽高在宽档不得小于窄档
    for (const k of ['short', 'long'] as const) {
      expect(byVp[1440][k].font, `${k} 档主字随视口放大不得缩小`).toBeGreaterThan(byVp[390][k].font);
      expect(byVp[1440][k].slot, `${k} 档槽高随视口放大不得缩小`).toBeGreaterThan(byVp[390][k].slot);
    }

    await noUnknownOverflow(page);
    assertNoErrors();
  });
});
