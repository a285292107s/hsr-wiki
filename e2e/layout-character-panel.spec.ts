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

  // 「规格铭牌」的版面契约（推翻了 R1 的卷宗规格表：8 行等高表格 + `00-N` 行索引 + 行底发丝线 +
  //   名称与取值之间的引导线 = 一屏 16 条同权重线，区块被读成账本，且行索引与章标的 `00` 重复）。
  // 00 属性 = 面板三项（生命 / 攻击 / 防御，随等级线性成长，带「每级 +N」注记）+ 参数五项（满级即定值）。
  // 期望值一律派生：身份色从 `--prop-<data-prop>` 令牌解析、成长注记从 characters/*.json 取、列轴与左轴实测几何。
  // 三条防回流硬判据：① `00-N` 行索引不得回潮；② 区块体内结构性发丝线**恰 1 条**（两层分界）；
  // ③ 两层各自等分且面板层不留尾列空位（空列会让分界线比内容宽 1.7 倍）。
  test('/character/1001：00 属性为规格铭牌（两层各自等分 / 无行索引 / 区块内恰 1 条发丝线）', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/character/1001');
    await page.waitForSelector('.nk-stats__stat');

    const panel = page.locator('.nk-stats__tier--panel .nk-stats__stat');
    const param = page.locator('.nk-stats__tier--param .nk-stats__stat');
    await expect(panel, '面板层 = 随等级线性成长的三项').toHaveCount(3);
    await expect(param, '参数层 = 满级即定值的五项').toHaveCount(5);

    // ① 行索引退场：DOM 与可见文本都不得再出现 `00-N`
    await expect(page.locator('.nk-stats__idx')).toHaveCount(0);
    const text = await page.locator('[data-panel="stats"] .nk-stats').innerText();
    expect(text, '属性面板不得再出现 `00-N` 行索引').not.toMatch(/\d\d-\d/);

    // ② 发丝线预算：区块体内恰 1 条（两层分界的上边线）。判据同时覆盖「边框画的线」与「背景色画的线」——
    //    旧的引导线正是后者，只数边框会让它静默复活。
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
    expect(rule.others, '分界只走一条上边线，不得四面加框').toEqual(['0px', '0px', '0px']);
    expect(rule.color, '分界线须为发丝线令牌色').not.toBe('rgba(0, 0, 0, 0)');

    // ③ 列轴：两层**列宽逐列相等**（≥768 面板层占 5 列栅格的前 3 列，空列由注记占用），且面板层不得留空列。
    //    面板三项落在五列格线上会空出 41% 宽的尾列，而下方分界线仍横贯整幅 ⇒ 线比内容宽 1.7 倍、
    //    上部读成「表格缺了两格」。断言不钉视口：档位从页面令牌读，两个视口项目下同一条判据都成立。
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
    // 各列等宽：`1fr` 的计算值会因亚像素取整差 0.02px 级，故比「极差 ≤1px」而不是比集合相等
    const spread = (a: number[]): number => Math.max(...a) - Math.min(...a);
    expect(spread(cols.panel), '面板层各列等宽').toBeLessThanOrEqual(1);
    expect(spread(cols.param), '参数层各列等宽').toBeLessThanOrEqual(1);
    // 两层共用同一条列距 = 面板层列宽与参数层列宽逐列相等（面板层只占前 3 列，不另开一套列宽）
    expect(Math.abs(cols.panel[0] - cols.param[0]), '两层的列宽须相等（同一套列距）').toBeLessThanOrEqual(1);
    // 出现空列时（桌面档 5 列只放三项），空列必须由注记占用：注记贴区块右缘、落在分界线之上，且**单行**——
    // 该槽在 768 档仅 238px，注记文案一旦超过 ~20 字就会折行并留下孤字行（`StatsPanel.vue` 里有同一条约束）。
    if (cols.panelToken > cols.panelItems) {
      expect(cols.noteFlushRight, '注记须贴区块右缘（占用空列）').toBeLessThanOrEqual(1);
      expect(cols.noteAboveDivider, '注记须落在面板层内（分界线之上）').toBe(true);
      expect(cols.noteLines, '注记须单行（文案长度与槽宽绑定）').toBe(1);
    }

    // ④ 身份色每项恰好一次（行首色标），值从领域层 `--prop-*` 派生（不随主题 / 强调色）
    const rows = page.locator('.nk-stats__stat');
    const props = await rows.evaluateAll((els) => els.map((el) => el.getAttribute('data-prop')));
    expect(new Set(props).size, '属性键不得重复').toBe(8);
    for (let i = 0; i < props.length; i++) {
      const actual = await rows.nth(i).evaluate((el) => getComputedStyle(el.querySelector('.nk-stats__mark') as Element).backgroundColor);
      expect(actual, `第 ${i + 1} 项色标须等于 --prop-${props[i]}`).toBe(
        await resolveTokenColor(page, `--prop-${props[i]}`, '.nk-char-page'),
      );
    }

    // ⑤ 标签与取值共用同一条左轴：色标 + 图标作为悬挂记号占左槽，取值不得压到色标下方
    const offsets = await rows.evaluateAll((els) => els.map((el) => {
      const label = el.querySelector('.nk-stats__label')!.getBoundingClientRect();
      const val = el.querySelector('.nk-stats__val')!.getBoundingClientRect();
      return Math.abs(val.left - label.left);
    }));
    expect(offsets.every((d) => d <= 1), `取值与标签左缘须共线（实测偏差 ${offsets.join(' / ')}）`).toBe(true);

    // ⑥ 成长注记 = 数据里的每级增量（期望值从 characters/*.json 取，不在断言里写数字）
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

    // ⑦ 等级滑条在章标之下、默认取满级（面板取值 = 满级档曲线在满级的取值，与改版前逐字一致）
    const slider = page.locator('.nk-stats__level input[type=range]');
    await expect(slider, '滑条须存在且默认满级（= 自身上限）').toHaveValue(String(await slider.getAttribute('max')));
    await expect(page.locator('.nk-stats__level-val')).toHaveText(/^Lv\.\d+\/\d+$/);
    await expect(page.locator('.nk-stats__level-stage')).toHaveText(/^突破 \d$/);
    await expect(page.locator('.nk-stats__level-rule, .nk-stats__level-fill, .nk-stats__level-track')).toHaveCount(0);

    await noUnknownOverflow(page);
    assertNoErrors();
  });

  // 等级滑条契约：滑条驱动**面板层**（生命 / 攻击 / 防御），参数层原地不动；键盘可达。
  // 口径（不是随手取的档）：每档 Base/Add 是该档自己的曲线、相邻档 Base 递进 8×Add ⇒ 突破立刻加面板，
  // 故某等级取「上限 ≤ 该等级的档位数」那一档（每档上限一到就突破）。期望值全部从 characters/*.json 派生。
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

    // Lv.25：上限 ≤ 25 的档位只有 20 一个 ⇒ 档位 1
    await setLevel(25);
    const at25 = await readVals();
    expect(at25.slice(0, 3), 'Lv.25 = 档位 1 曲线').toEqual(panelAt('1', 25));
    expect(at25.slice(3), '参数层不随等级变化').toEqual(at80.slice(3));
    await expect(page.locator('.nk-stats__level-val')).toHaveText('Lv.25/80');
    await expect(page.locator('.nk-stats__level-stage')).toHaveText('突破 1');

    // Lv.30 已可突破到档 2（不是档 1）：突破立刻加面板，不走「过了上限才跳档」的读法
    await setLevel(30);
    expect((await readVals()).slice(0, 3), 'Lv.30 = 档位 2 曲线').toEqual(panelAt('2', 30));
    await expect(page.locator('.nk-stats__level-stage')).toHaveText('突破 2');

    // 键盘可达：原生 range 的方向键改一档，读数与层取值同步
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

  // 窄档列轴与列内贴合（最坏样本）：`1208` 的成长注记「每级 +10.032」是全量 98 只里最长的一条，
  // 因而是列宽的本征最坏样本（逐只扫描 `*_add` 得）。判据用 `Range` 取**文本实际外延**——
  // 标签 / 取值 / 注记都是撑满列宽的块元素，量元素盒永远等于列宽、抓不到文本溢出。
  // **不判「必须落在本列盒内」**：注记略微探进 24px 列间距并不可见，而该字宽随平台 CJK 回退字体浮动
  // （会变成一条依平台判定的断言）；真正可见的硬边界是「不得侵入同一行的相邻列内容」+「区块不得横向溢出」。
  test('/character/1208 窄档（320 / 375）：列轴降档正确且文本不侵入相邻列', { tag: '@viewport-pinned' }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    for (const [w, wantCols] of [[320, 2], [375, 3]] as const) {
      await page.setViewportSize({ width: w, height: 700 });
      await page.goto('/character/1208');
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
          // 区块自身的横向越界（**不整页判**：本页 Spine 画布恒越出视口，是已定性的既有缺陷，
          // 整页判据会把无关缺陷算进来——同 `noUnknownOverflow` 在 1204 用例的注释）。
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
