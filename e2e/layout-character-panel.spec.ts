import { test, expect } from '@playwright/test';
import { collectConsoleIssues, computedNumber, readJson, resolveTokenColor, settleAnimations } from './helpers';
import {
  charFamilyIds,
  charSkillNames,
  expectNoSkillsOverflow,
  noUnknownOverflow,
  pseudoBox,
  skillRailX,
  tableBoxWithinCard,
} from './layout.shared';

test.describe('布局验收：角色详情页', () => {

  test('/character/1001：00 属性为规格铭牌（两层各自等分 / 无行索引 / 区块内恰 1 条发丝线）', { tag: '@visual-detail' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/character/1001');
    await page.waitForSelector('.nk-stats__stat');

    const panel = page.locator('.nk-stats__tier--panel .nk-stats__stat');
    const param = page.locator('.nk-stats__tier--param .nk-stats__stat');
    await expect(panel, '面板层 = 随等级线性成长的三项').toHaveCount(3);
    await expect(param, '参数层 = 满级即定值的五项').toHaveCount(5);

    await expect(page.locator('.nk-stats__idx')).toHaveCount(0);
    const text = await page.locator('[data-panel="stats"] .nk-stats').innerText();
    expect(text, '属性面板不得再出现 `00-N` 行索引').not.toMatch(/\d\d-\d/);

    const hairlines = await page.evaluate(() => {
      const sides = ['borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth'] as const;
      const styles = ['borderTopStyle', 'borderRightStyle', 'borderBottomStyle', 'borderLeftStyle'] as const;
      let n = 0;
      document.querySelectorAll('.nk-stats__tier, .nk-stats__tier *').forEach((el) => {
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden') return;
        sides.forEach((w, i) => {
          const v = parseFloat(cs[w]);
          if (v > 0 && v <= 1.5 && cs[styles[i]] !== 'none') n++;
        });
        const r = el.getBoundingClientRect();
        if (r.width > 12 && r.height <= 2 && cs.backgroundColor !== 'rgba(0, 0, 0, 0)') n++;
      });
      return n;
    });
    expect(hairlines, '区块体内只允许 1 条结构性发丝线（两层分界）').toBe(1);
    const rule = await page.locator('.nk-stats__tier--param').evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        w: parseFloat(cs.borderTopWidth), style: cs.borderTopStyle, color: cs.borderTopColor,
        others: [cs.borderBottomWidth, cs.borderLeftWidth, cs.borderRightWidth],
      };
    });
    expect(rule.style, '分界线须为实线（本页唯一线语言）').toBe('solid');
    expect(rule.w, '分界线须为发丝线').toBeLessThanOrEqual(1);
    expect(rule.others, '分界只走一条上边线，不得四面加框').toEqual(['0px', '0px', '0px']); // e2e-literal-ok: 0px 在这里是「不得加框」的定义性契约值（语义即值），不是可漂移的设计值
    expect(rule.color, '分界线须为发丝线令牌色').not.toBe('rgba(0, 0, 0, 0)');

    const cols = await page.evaluate(() => {
      const g = (s: string) => getComputedStyle(document.querySelector(s) as Element)
        .gridTemplateColumns.split(/\s+/).map(parseFloat);
      const tok = (n: string) => parseFloat(
        getComputedStyle(document.querySelector('.nk-stats') as Element).getPropertyValue(n),
      );
      const block = document.querySelector('.nk-stats') as Element;
      const note = document.querySelector('.nk-stats__note') as Element;
      const param = document.querySelector('.nk-stats__tier--param') as Element;
      return {
        panelToken: tok('--nk-stats-panel-cols'),
        paramToken: tok('--nk-stats-cols'),
        panelItems: document.querySelectorAll('.nk-stats__tier--panel .nk-stats__stat').length,
        panel: g('.nk-stats__tier--panel'),
        param: g('.nk-stats__tier--param'),
        noteFlushRight: Math.abs(note.getBoundingClientRect().right - block.getBoundingClientRect().right),
        noteAboveDivider: note.getBoundingClientRect().bottom <= param.getBoundingClientRect().top,
        noteLines: Math.round(
          note.getBoundingClientRect().height / parseFloat(getComputedStyle(note).lineHeight),
        ),
      };
    });
    expect(cols.panelToken, '面板层列轴档位').toBeGreaterThanOrEqual(2);
    expect(cols.paramToken, '参数层列轴档位').toBeGreaterThanOrEqual(2);
    expect(cols.panel, '面板层列数 = 令牌档位').toHaveLength(cols.panelToken);
    expect(cols.param, '参数层列数 = 令牌档位').toHaveLength(cols.paramToken);
    expect(cols.panel, '面板层不得留尾列空位（窄档由换行承担）')
      .toHaveLength(Math.min(cols.panelItems, cols.panelToken));
    const spread = (a: number[]): number => Math.max(...a) - Math.min(...a);
    expect(spread(cols.panel), '面板层各列等宽').toBeLessThanOrEqual(1);
    expect(spread(cols.param), '参数层各列等宽').toBeLessThanOrEqual(1);
    expect(Math.abs(cols.panel[0] - cols.param[0]), '两层的列宽须相等（同一套列距）').toBeLessThanOrEqual(1);
    if (cols.panelToken > cols.panelItems) {
      expect(cols.noteFlushRight, '注记须贴区块右缘（占用空列）').toBeLessThanOrEqual(1);
      expect(cols.noteAboveDivider, '注记须落在面板层内（分界线之上）').toBe(true);
      expect(cols.noteLines, '注记须单行（文案长度与槽宽绑定）').toBe(1);
    }

    const rows = page.locator('.nk-stats__stat');
    const props = await rows.evaluateAll((els) => els.map((el) => el.getAttribute('data-prop')));
    expect(new Set(props).size, '属性键不得重复').toBe(8);
    for (let i = 0; i < props.length; i++) {
      const actual = await rows.nth(i).evaluate((el) => getComputedStyle(el.querySelector('.nk-stats__mark') as Element).backgroundColor);
      expect(actual, `第 ${i + 1} 项色标须等于 --prop-${props[i]}`).toBe(
        await resolveTokenColor(page, `--prop-${props[i]}`, '.nk-char-page'),
      );
    }

    const offsets = await rows.evaluateAll((els) => els.map((el) => {
      const label = el.querySelector('.nk-stats__label')!.getBoundingClientRect();
      const val = el.querySelector('.nk-stats__val')!.getBoundingClientRect();
      return Math.abs(val.left - label.left);
    }));
    expect(offsets.every((d) => d <= 1), `取值与标签左缘须共线（实测偏差 ${offsets.join(' / ')}）`).toBe(true);

    const st = readJson<{ stats: Record<string, { hp_add: number; attack_add: number; defence_add: number }> }>(
      'public/data/cn/characters/1001.json',
    ).stats;
    const last = st[String(Math.max(...Object.keys(st).map(Number)))];
    const adds = await panel.locator('.nk-stats__add').allInnerTexts();
    expect(adds, '面板三项各带一条成长注记').toHaveLength(3);
    for (const t of adds) expect(t, '注记格式 = 「每级 +数值」').toMatch(/^每级 \+\d/);
    expect(
      adds.map((t) => Number(t.replace(/^每级 \+/, ''))),
      '成长注记须等于数据里的每级增量（生命 / 攻击 / 防御）',
    ).toEqual([last.hp_add, last.attack_add, last.defence_add]);
    await expect(param.locator('.nk-stats__add'), '参数层满级即定值，不得出现成长注记').toHaveCount(0);

    const slider = page.locator('.nk-stats__level input[type=range]');
    await expect(slider, '滑条须存在且默认满级（= 自身上限）').toHaveValue(String(await slider.getAttribute('max')));
    await expect(page.locator('.nk-stats__level-val')).toHaveText(/^Lv\.\d+\/\d+$/);
    await expect(page.locator('.nk-stats__level-stage')).toHaveText(/^突破 \d$/);
    await expect(page.locator('.nk-stats__level-rule, .nk-stats__level-fill, .nk-stats__level-track')).toHaveCount(0);

    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/character/1001：等级滑条按档位口径驱动面板层（参数层不动 / 键盘可达）', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/character/1001');
    await page.waitForSelector('.nk-stats__stat');

    const slider = page.locator('.nk-stats__level input[type=range]');
    await expect(slider, '滑条范围 = 1…满级').toHaveAttribute('min', '1');
    const maxLv = Number(await slider.getAttribute('max'));
    expect(maxLv, '滑条上限 = 角色满级').toBeGreaterThan(1);
    await expect(slider, '默认满级').toHaveValue(String(maxLv));

    const stats = readJson<{ stats: Record<string, Record<string, number>> }>(
      'public/data/cn/characters/1001.json',
    ).stats;
    const readVals = () => page.locator('.nk-stats__val').allInnerTexts();
    const grow = (base: number, add: number, lv: number) => Math.round(base + add * (lv - 1)).toLocaleString('en-US');
    const panelAt = (stage: string, lv: number) =>
      [['hp_base', 'hp_add'], ['attack_base', 'attack_add'], ['defence_base', 'defence_add']]
        .map(([b, a]) => grow(stats[stage][b], stats[stage][a], lv));
    const setLevel = async (lv: number) => {
      await slider.evaluate((el, v) => {
        (el as HTMLInputElement).value = String(v);
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }, lv);
    };

    const at80 = await readVals();
    expect(at80.slice(0, 3), '默认 = 满级档曲线在满级').toEqual(panelAt('6', maxLv));

    await setLevel(25);
    const at25 = await readVals();
    expect(at25.slice(0, 3), 'Lv.25 = 档位 1 曲线').toEqual(panelAt('1', 25));
    expect(at25.slice(3), '参数层不随等级变化').toEqual(at80.slice(3));
    await expect(page.locator('.nk-stats__level-val')).toHaveText('Lv.25/80');
    await expect(page.locator('.nk-stats__level-stage')).toHaveText('突破 1');

    await setLevel(30);
    expect((await readVals()).slice(0, 3), 'Lv.30 = 档位 2 曲线').toEqual(panelAt('2', 30));
    await expect(page.locator('.nk-stats__level-stage')).toHaveText('突破 2');

    await slider.focus();
    await page.keyboard.press('ArrowRight');
    await expect(slider, '方向键 = 步进 1').toHaveValue('31');
    await expect(page.locator('.nk-stats__level-val')).toHaveText('Lv.31/80');
    await expect(
      (await readVals()).slice(0, 3),
      'Lv.31 = 档位 2 曲线',
    ).toEqual(panelAt('2', 31));

    assertNoErrors();
  });

  test('/character/1208 窄档（320 / 375）：列轴降档正确且文本不侵入相邻列', { tag: ['@visual-detail', '@viewport-pinned'] }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    for (const [w, wantCols] of [[320, 2], [375, 3]] as const) {
      await page.setViewportSize({ width: w, height: 700 });
      await page.goto('/character/1208');
      await settleAnimations(page);
      await page.waitForSelector('.nk-stats__stat');
      const r = await page.evaluate(() => {
        const rows = [...document.querySelectorAll('.nk-stats__stat')];
        const collide: string[] = [];
        rows.forEach((st, i) => {
          const sb = st.getBoundingClientRect();
          const next = rows[i + 1]?.getBoundingClientRect();
          st.querySelectorAll('.nk-stats__label, .nk-stats__val, .nk-stats__add').forEach((el) => {
            const rg = document.createRange();
            rg.selectNodeContents(el);
            const eb = rg.getBoundingClientRect();
            if (next && Math.abs(next.top - sb.top) < 2 && eb.right > next.left - 1) {
              collide.push(`${(el as HTMLElement).className}=${el.textContent}`);
            }
          });
        });
        return {
          cols: parseFloat(
            getComputedStyle(document.querySelector('.nk-stats') as Element).getPropertyValue('--nk-stats-cols'),
          ),
          panelCols: parseFloat(
            getComputedStyle(document.querySelector('.nk-stats') as Element).getPropertyValue('--nk-stats-panel-cols'),
          ),
          collide,
          spill: [...document.querySelectorAll('.nk-stats, .nk-stats *')]
            .filter((el) => {
              const cs = getComputedStyle(el);
              if (cs.display === 'none' || cs.visibility === 'hidden') return false;
              const b = el.getBoundingClientRect();
              return b.width > 0 && (b.right > document.documentElement.clientWidth + 1 || b.left < -1);
            })
            .map((el) => `${(el as HTMLElement).className}`),
        };
      });
      expect(r.cols, `${w}px 参数层档列轴`).toBe(wantCols);
      expect(r.panelCols, `${w}px 面板层档列轴`).toBe(wantCols);
      expect(r.collide, `${w}px：文本不得侵入同一行的相邻列`).toEqual([]);
      expect(r.spill, `${w}px：区块不得横向越出视口`).toEqual([]);
    }
    assertNoErrors();
  });

  test('/character/1204：区块章标压过正文且横线为实心发丝线', { tag: '@visual-detail' }, async ({ page }) => {
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

    assertNoErrors();
  });

  test('/character/1204：页面圆角只走刻度三档（+ 直角与圆形）', { tag: '@visual-detail' }, async ({ page }) => {
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
        if (r.endsWith('%')) return;
        const n = parseFloat(r);
        if (allowed.has(n)) return;
        if (n <= t.one) return;
        out.push(`${(el as HTMLElement).className}`.slice(0, 40) + ' = ' + r);
      });
      return Array.from(new Set(out)).slice(0, 8);
    }, tiers);
    expect(hits, '页面圆角出现了刻度三档之外的档位（含胶囊回潮）').toEqual([]);
    expect(containerNum).toBe(tiers.three);
    assertNoErrors();
  });

  test('/character/1001：技能卡折叠开关为可点外观（浅底 + 发丝描边 + 6px 圆角）且文案成对', { tag: '@visual-detail' }, async ({ page }) => {    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/character/1001');
    const toggles = page.locator('.nk-skill__toggle');
    await expect(toggles.first()).toBeVisible();
    await expect.poll(() => toggles.count()).toBeGreaterThanOrEqual(3);
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
    const hot = await toggles.first().evaluate((el) => {
      const a = getComputedStyle(el, '::after');
      return { content: a.content, top: a.top, bottom: a.bottom };
    });
    expect(hot).toEqual({ content: '""', top: '-8px', bottom: '-8px' });
    await expect(page.getByRole('button', { name: '强化来源' }).first()).toHaveAttribute('aria-expanded', 'false');
    const dataBtn = page.getByRole('button', { name: '技能数据' }).first();
    const closed = await dataBtn.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { color: cs.color, border: cs.borderTopColor };
    });
    await dataBtn.click();
    const openedBtn = page.getByRole('button', { name: '收起技能数据' }).first();
    await expect(openedBtn).toHaveAttribute('aria-expanded', 'true');
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

  test('/character/1001 手机断点：配队标头渲染、队间距 16px、无溢出', { tag: ['@visual-detail', '@viewport-pinned'] }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    const teams = readJson<{ teams: unknown[] }>('public/data/cn/characters/1001.json').teams;
    expect(teams.length, '1001 应为多队样本（否则标头不渲染）').toBeGreaterThan(1);
    const no = String(teams.length).padStart(2, '0');
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
