import { test, expect } from '@playwright/test';
import { collectConsoleIssues, readJson, settleAnimations, waitForCatalogCards } from './helpers';
import { CN_NUM, expectTokenNumber, noUnknownOverflow, readContentOffset } from './layout.shared';

interface MonsterListEntry { id: number; name: string; icon: string; weak?: string[]; atlas_group?: number }
interface MonsterDropTierJson { world_level: number | null; avatar_exp: number; items: { id: number; name: string; icon: string }[] }
interface MonsterDetailJson {
  id: number;
  weak: string[];
  resist: Record<string, number>;
  stance: number;
  stats: { hp: number; atk: number; def: number; speed: number };
  stat_ratio?: { hp?: number; atk?: number; def?: number; speed?: number };
  level_group?: number;
  elite_group?: number;
  stance_modify?: number;
  speed_modify?: number;
  skills: {
    id: number;
    name: string;
    desc?: string;
    param_list?: number[];
    extra_effects?: { id: number; name: string; desc?: string; param_list?: number[] }[];
  }[];
  event?: { name: string; tabs: string[]; levels: number[]; count: number };
  art_shared?: { id: number; name: string; figure: boolean; forms: number };
  drops?: MonsterDropTierJson[];
  appearances?: {
    total: number;
    groups: {
      key: string;
      count: number;
      subs?: { key: string; count: number }[];
      samples?: { id: number; name: string; activity?: string; level?: number; level_group?: number; elite_group?: number }[];
    }[];
  };
  phases?: { phase_id: number; weak: string[]; resist: Record<string, number>; name?: string; intro?: string }[];
}

const MONSTER_ID = '1002011';
const IMG_DELAY_MS = 2500;

const iconStem = (p: string): string => (p.split('/').pop() || '').replace(/\.png$/i, '');
const statText = (v: number | null): string => (v == null ? '—' : v.toLocaleString('zh-CN'));
const ratioText = (v: number): string => (v === 1 ? '×1.00' : `×${v}`);
const modifyText = (v: number | null | undefined): string =>
  (v == null ? '—' : v > 0 ? `+${v}` : v === 0 ? '+0' : String(v));
const round1 = (n: number): number => Math.round(n * 10) / 10;
const numberCell = (s: string): number => (s === '—' ? 0 : Number(s.replace(/^[×+]/, '')));
const familyOf = (id: number): MonsterListEntry[] => {
  const list = readJson<MonsterListEntry[]>('public/data/cn/monsters.json').filter((m) => m.name);
  const key = (m: MonsterListEntry): string => `${m.name}\u0000${iconStem(m.icon)}`;
  const self = list.find((m) => m.id === id);
  return self ? list.filter((m) => key(m) === key(self)).sort((a, b) => a.id - b.id) : [];
};
const detailOf = (id: number): MonsterDetailJson => readJson<MonsterDetailJson>(`public/data/cn/monsters/${id}.json`);

test.describe('布局验收：敌方详情页', () => {
  test(`/monster/${MONSTER_ID}：立绘延迟到达时 hero 高度不得变化`, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);

    await page.addInitScript(() => {
      const w = window as unknown as { __heroSamples: Array<{ h: number; fig: number; loaded: boolean; fonts: boolean }> };
      w.__heroSamples = [];
      setInterval(() => {
        const hero = document.querySelector('.nk-mob-hero');
        const figure = document.querySelector('.nk-mob-hero__figure');
        const img = document.querySelector('.nk-mob-hero__figure img');
        if (!hero || !figure) return;
        w.__heroSamples.push({
          h: Math.round(hero.getBoundingClientRect().height),
          fig: Math.round(figure.getBoundingClientRect().height),
          loaded: Boolean(img && img.complete && img.naturalWidth > 0),
          fonts: document.fonts ? document.fonts.status === 'loaded' : true,
        });
      }, 50);
    });
    await page.route(/\.(webp|png|jpe?g|avif)(\?|$)/, async (route) => {
      await new Promise((r) => setTimeout(r, IMG_DELAY_MS));
      await route.continue().catch(() => {});
    });

    await page.goto(`/monster/${MONSTER_ID}`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.nk-mob-hero')).toBeVisible();
    await page.waitForTimeout(IMG_DELAY_MS + 1800);

    const samples = await page.evaluate(
      () => (window as unknown as { __heroSamples: Array<{ h: number; fig: number; loaded: boolean; fonts: boolean }> }).__heroSamples,
    );
    const figures = samples.map((s) => s.fig);
    expect(samples.length, '应采到 hero 高度样本').toBeGreaterThan(5);
    expect(samples.some((s) => s.loaded), '立绘最终应加载完成（否则断言会变成空转）').toBe(true);

    expect(
      Math.max(...figures) - Math.min(...figures),
      '立绘方框高度在立绘到达前后必须恒定（`aspect-ratio: 1` 提前给盒子）',
    ).toBe(0);

    const settled = samples.filter((s) => s.fonts);
    expect(settled.length, '应采到字体落定后的样本（否则 ② 会变成空转）').toBeGreaterThan(5);
    const heights = settled.map((s) => s.h);
    expect(
      Math.max(...heights) - Math.min(...heights),
      'hero 总高变化不得超过内容级收尾（≤2px）',
    ).toBeLessThanOrEqual(2);

    assertNoErrors();
  });

  test(
    '/monster/<实例>：修正值按「基准值 × 实例倍率 × 精英组倍率 × 等级曲线倍率 ＋ 修正值」合成，缺省等级 = 该组曲线最高档',
    { tag: '@viewport-independent' },
    async ({ page }) => {
      const { assertNoErrors } = collectConsoleIssues(page);
      const id = 100201502;
      const mon = detailOf(id);
      expect(mon.stance_modify, `${id} 应带韧性修正（断言前提）`).toBeGreaterThan(0);
      const curve = readJson<Record<string, Record<string, { speed: number; hp: number }>>>(
        'public/data/cn/monster-level-curve.json',
      );
      const elite = readJson<Record<string, Record<string, number>>>('public/data/cn/monster-elite-group.json');
      const group = String(mon.level_group ?? 1);
      const eliteRow = elite[String(mon.elite_group ?? 1)] ?? {};
      const maxLevel = Math.max(...Object.keys(curve[group]).map(Number));
      const levelRow = curve[group][String(maxLevel)];
      const speedRatio = mon.stat_ratio?.speed ?? 1;
      const wantSpeed = Math.round((mon.stats.speed * speedRatio * (eliteRow.speed ?? 1) * levelRow.speed
        + (mon.speed_modify ?? 0)) * 10) / 10;
      const wantStance = mon.stance * (eliteRow.stance ?? 1) + mon.stance_modify!;

      await page.goto(`/monster/${id}`);
      await expect(page.locator('.nk-mob-hero__name')).toBeVisible();
      await expect(
        page.locator('.nk-mob-level__label'),
        '缺省等级 = 该难度组曲线的最高档（不再写死 100）',
      ).toHaveText(`等级 ${maxLevel}`);
      await expect(
        page.locator('.nk-mob-calc__row[data-prop="speed"] .nk-mob-calc__val'),
        '速度 = 基准 × 修饰比 × 精英组倍率 × 曲线 + 修正值（修正值不被曲线缩放）',
      ).toHaveText(statText(wantSpeed));
      await expect(
        page.locator('.nk-mob-calc__row[data-prop="speed"] .nk-mob-calc__cell--curve'),
        '速度行的等级曲线系数 = 该难度组该等级曲线值（合成因子必须可核对）',
      ).toHaveText(`×${levelRow.speed}`);
      await expect(
        page.locator('.nk-mob-calc__row[data-prop="speed"] .nk-mob-calc__cell--modify'),
        '修正值单列展示，供玩家核对加法位置',
      ).toHaveText(modifyText(mon.speed_modify));
      await expect(
        page.locator('.nk-mob-calc__row--stance .nk-mob-calc__val'),
        '韧性 = 韧性基准 × 精英组韧性倍率 + 修正值',
      ).toHaveText(statText(wantStance));
      await expect(
        page.locator('.nk-mob-calc__row--stance .nk-mob-calc__cell--modify'),
        '韧性修正值单列展示（+30 不被任何倍率缩放）',
      ).toHaveText(modifyText(mon.stance_modify));
      await expect(page.locator('.nk-mob-calc__terms'), '术语口径必须写明修正值').toContainText('修正值');

      assertNoErrors();
    },
  );

  test(
    '/monster/<实例>：精英组倍率进合成链（组 2 = HP×1.7 / ATK×0.8，参考站同档逐位吻合）',
    { tag: '@viewport-independent' },
    async ({ page }) => {
      const { assertNoErrors } = collectConsoleIssues(page);
      const id = 100205006;
      const mon = detailOf(id);
      expect(mon.elite_group, `${id} 应带精英组 2（断言前提）`).toBe(2);
      const curve = readJson<Record<string, Record<string, { hp: number; atk: number }>>>(
        'public/data/cn/monster-level-curve.json',
      );
      const elite = readJson<Record<string, { hp: number; atk: number }>>(
        'public/data/cn/monster-elite-group.json',
      );
      const group = String(mon.level_group ?? 1);
      const maxLevel = Math.max(...Object.keys(curve[group]).map(Number));
      const row = curve[group][String(maxLevel)];
      const eliteRow = elite['2']!;
      const wantHp = Math.round(
        mon.stats.hp * (mon.stat_ratio?.hp ?? 1) * eliteRow.hp * row.hp * 10,
      ) / 10;
      const wantAtk = Math.round(
        mon.stats.atk * (mon.stat_ratio?.atk ?? 1) * eliteRow.atk * row.atk * 10,
      ) / 10;

      await page.goto(`/monster/${id}`);
      await expect(page.locator('.nk-mob-hero__name')).toBeVisible();
      await expect(
        page.locator('.nk-mob-calc__row[data-prop="hp"] .nk-mob-calc__val'),
        'HP = 基准 × 修饰比 × 精英组倍率 × 曲线',
      ).toHaveText(statText(wantHp));
      await expect(
        page.locator('.nk-mob-calc__row[data-prop="atk"] .nk-mob-calc__val'),
        'ATK = 基准 × 修饰比 × 精英组倍率 × 曲线',
      ).toHaveText(statText(wantAtk));
      await expect(
        page.locator('.nk-mob-calc__row[data-prop="hp"] .nk-mob-calc__cell--elite'),
        'HP 行的精英组倍率因子 = 组 2 的 HPRatio（不是黑箱）',
      ).toHaveText(ratioText(eliteRow.hp));
      await expect(
        page.locator('.nk-mob-calc__row[data-prop="atk"] .nk-mob-calc__cell--elite'),
        'ATK 行的精英组倍率因子 = 组 2 的 AttackRatio',
      ).toHaveText(ratioText(eliteRow.atk));
      await expect(
        page.locator('.nk-mob-calc__row[data-prop="hp"] .nk-mob-calc__cell--curve'),
        'HP 行的等级曲线系数 = 该难度组该等级曲线值',
      ).toHaveText(`×${row.hp}`);
      const heads = (await page.locator('.nk-mob-calc__h').allTextContents())
        .map((s) => s.replace(/\s+/g, ' ').trim());
      expect(heads.some((h) => h.includes('精英组倍率')), `表头必须写明精英组倍率段：${heads}`).toBe(true);

      assertNoErrors();
    },
  );

  test(
    '/monster/1004014：战斗数值逐因子上屏，拖动等级时曲线系数与战斗值同步重算',
    { tag: '@viewport-independent' },
    async ({ page }) => {
      const { assertNoErrors } = collectConsoleIssues(page);
      const id = 1004014;
      const mon = detailOf(id);
      const curve = readJson<Record<string, Record<string, Record<string, number>>>>(
        'public/data/cn/monster-level-curve.json',
      );
      const elite = readJson<Record<string, Record<string, number>>>('public/data/cn/monster-elite-group.json');
      const group = String(mon.level_group ?? 1);
      const eliteGroup = String(mon.elite_group ?? 1);
      const eliteRow = elite[eliteGroup] ?? {};
      const maxLevel = Math.max(...Object.keys(curve[group]).map(Number));
      expect(maxLevel, '断言前提：该难度组曲线覆盖到 80 级以上').toBeGreaterThanOrEqual(80);
      const props = ['hp', 'atk', 'def', 'speed'] as const;
      const derive = (prop: (typeof props)[number], level: number) => {
        const levelRow = curve[group][String(level)]!;
        const base = mon.stats[prop];
        const ratio = mon.stat_ratio?.[prop] ?? 1;
        const eliteRatio = eliteRow[prop] ?? 1;
        const coeff = levelRow[prop]!;
        const modify = prop === 'speed' ? (mon.speed_modify ?? null) : null;
        const value = round1(base * ratio * eliteRatio * coeff + (modify ?? 0));
        return { base, ratio, eliteRatio, coeff, modify, value };
      };

      await page.goto(`/monster/${id}`);
      await expect(page.locator('.nk-mob-hero__name')).toBeVisible();
      await expect(page.locator('.nk-mob-level__label')).toHaveText(`等级 ${maxLevel}`);
      await expect(page.locator('.nk-mob-level__chip')).toHaveText([
        `难度组 ${group}`,
        `精英组 ${eliteGroup}`,
      ]);

      for (const prop of props) {
        const want = derive(prop, maxLevel);
        const row = page.locator(`.nk-mob-calc__row[data-prop="${prop}"]`);
        await expect(row.locator('.nk-mob-calc__cell--base'), `${prop} 行基准值（原始全精度）`)
          .toHaveText(String(want.base));
        await expect(row.locator('.nk-mob-calc__cell--ratio'), `${prop} 行实例倍率`).toHaveText(ratioText(want.ratio));
        await expect(row.locator('.nk-mob-calc__cell--elite'), `${prop} 行精英组倍率`).toHaveText(ratioText(want.eliteRatio));
        await expect(row.locator('.nk-mob-calc__cell--curve'), `${prop} 行等级曲线系数`).toHaveText(`×${want.coeff}`);
        await expect(row.locator('.nk-mob-calc__cell--modify'), `${prop} 行修正值`).toHaveText(modifyText(want.modify));
        await expect(row.locator('.nk-mob-calc__val'), `${prop} 行战斗值`).toHaveText(statText(want.value));

        const shown = await row.evaluate((el) => {
          const text = (sel: string): string => (el.querySelector(sel)?.textContent ?? '').trim();
          return {
            base: text('.nk-mob-calc__cell--base'),
            ratio: text('.nk-mob-calc__cell--ratio'),
            elite: text('.nk-mob-calc__cell--elite'),
            curve: text('.nk-mob-calc__cell--curve'),
            modify: text('.nk-mob-calc__cell--modify'),
            value: text('.nk-mob-calc__val'),
          };
        });
        const product = numberCell(shown.base) * numberCell(shown.ratio) * numberCell(shown.elite)
          * numberCell(shown.curve) + numberCell(shown.modify);
        expect(
          shown.value,
          `${prop} 行「屏上因子相乘」必须复得屏上战斗值（基准值若被舍入就会对不上）`,
        ).toBe(statText(round1(product)));
      }

      const stanceRow = page.locator('.nk-mob-calc__row--stance');
      const wantStance = mon.stance * (eliteRow.stance ?? 1) + (mon.stance_modify ?? 0);
      await expect(stanceRow.locator('.nk-mob-calc__val'), '韧性不随等级变化').toHaveText(statText(wantStance));
      await expect(stanceRow.locator('.nk-mob-calc__cell--curve'), '韧性不入等级曲线，曲线格必须留空').toHaveText('—');

      const target = 80;
      const beforeStance = await stanceRow.locator('.nk-mob-calc__val').innerText();
      await page.locator('.nk-mob-level input[type="range"]').evaluate((el, v) => {
        const input = el as HTMLInputElement;
        input.value = String(v);
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }, target);
      await expect(page.locator('.nk-mob-level__label'), '拖动等级后标签同步').toHaveText(`等级 ${target}`);
      const wantHp = derive('hp', target);
      await expect(
        page.locator('.nk-mob-calc__row[data-prop="hp"] .nk-mob-calc__cell--curve'),
        '拖动等级后等级曲线系数同步重算',
      ).toHaveText(`×${wantHp.coeff}`);
      await expect(
        page.locator('.nk-mob-calc__row[data-prop="hp"] .nk-mob-calc__val'),
        '拖动等级后战斗值同步重算',
      ).toHaveText(statText(wantHp.value));
      await expect(stanceRow.locator('.nk-mob-calc__val'), '拖等级不影响韧性').toHaveText(beforeStance);

      assertNoErrors();
    },
  );

  test(
    '/monster/<id>：基准值按源数据全精度上屏（3 位小数截断会让屏上因子乘不出战斗值）',
    { tag: '@viewport-independent' },
    async ({ page }) => {
      const { assertNoErrors } = collectConsoleIssues(page);
      const id = 300304401;
      const mon = detailOf(id);
      expect(String(mon.stats.hp), `${id} 的基准 HP 应有 4 位以上小数（断言前提）`).toMatch(/\.\d{4,}$/);
      expect(String(mon.stats.atk), `${id} 的基准 ATK 应有 4 位以上小数（断言前提）`).toMatch(/\.\d{4,}$/);

      await page.goto(`/monster/${id}`);
      await expect(page.locator('.nk-mob-hero__name')).toBeVisible();
      await expect(
        page.locator('.nk-mob-calc__row[data-prop="hp"] .nk-mob-calc__cell--base'),
        'HP 基准值必须原样上屏（不能被 locale 格式化截到 3 位小数）',
      ).toHaveText(String(mon.stats.hp));
      await expect(
        page.locator('.nk-mob-calc__row[data-prop="atk"] .nk-mob-calc__cell--base'),
        'ATK 基准值必须原样上屏',
      ).toHaveText(String(mon.stats.atk));

      const shown = await page.locator('.nk-mob-calc__row[data-prop="hp"]').evaluate((el) => {
        const text = (sel: string): string => (el.querySelector(sel)?.textContent ?? '').trim();
        return {
          base: text('.nk-mob-calc__cell--base'),
          ratio: text('.nk-mob-calc__cell--ratio'),
          elite: text('.nk-mob-calc__cell--elite'),
          curve: text('.nk-mob-calc__cell--curve'),
          value: text('.nk-mob-calc__val'),
        };
      });
      const product = numberCell(shown.base) * numberCell(shown.ratio) * numberCell(shown.elite)
        * numberCell(shown.curve);
      expect(shown.value, '屏上因子相乘必须复得屏上 HP').toBe(statText(round1(product)));

      assertNoErrors();
    },
  );

  test(
    '/monster/<id>：缺基准值不假造因子、负修正值原样上屏',
    { tag: '@viewport-independent' },
    async ({ page }) => {
      const { assertNoErrors } = collectConsoleIssues(page);
      const blankId = 3004010;
      const blank = detailOf(blankId);
      const curve = readJson<Record<string, Record<string, Record<string, number>>>>(
        'public/data/cn/monster-level-curve.json',
      );
      const blankGroup = String(blank.level_group ?? 1);
      const blankMax = Math.max(...Object.keys(curve[blankGroup]).map(Number));
      const blankRow = curve[blankGroup][String(blankMax)]!;
      expect(blank.stats.speed, `${blankId} 应缺速度基准（断言前提）`).toBeUndefined();
      expect(blank.stance, `${blankId} 应缺韧性（断言前提）`).toBeUndefined();

      await page.goto(`/monster/${blankId}`);
      await expect(page.locator('.nk-mob-hero__name')).toBeVisible();
      const speedRow = page.locator('.nk-mob-calc__row[data-prop="speed"]');
      await expect(speedRow.locator('.nk-mob-calc__cell--base'), '缺基准值的行不得显示因子').toHaveText('—');
      await expect(speedRow.locator('.nk-mob-calc__cell--curve')).toHaveText('—');
      await expect(speedRow.locator('.nk-mob-calc__val'), '缺基准值不得给战斗值').toHaveText('—');
      await expect(
        page.locator('.nk-mob-calc__row--stance'),
        '韧性基准与修正都缺时整行不渲染（宁缺不假）',
      ).toHaveCount(0);
      await expect(
        page.locator('.nk-mob-calc__row[data-prop="hp"] .nk-mob-calc__val'),
        '其余维度照常合成',
      ).toHaveText(statText(round1(blank.stats.hp * blankRow.hp)));

      const negId = 401202001;
      const neg = detailOf(negId);
      const negGroup = String(neg.level_group ?? 1);
      const negMax = Math.max(...Object.keys(curve[negGroup]).map(Number));
      const negRow = curve[negGroup][String(negMax)]!;
      expect(neg.speed_modify, `${negId} 应带负速度修正（断言前提）`).toBeLessThan(0);
      expect(neg.stance_modify, `${negId} 应带负韧性修正（断言前提）`).toBeLessThan(0);
      await page.goto(`/monster/${negId}`);
      await expect(page.locator('.nk-mob-hero__name')).toBeVisible();
      await expect(
        page.locator('.nk-mob-calc__row[data-prop="speed"] .nk-mob-calc__cell--modify'),
        '负修正值按源数据原样展示',
      ).toHaveText(String(neg.speed_modify));
      await expect(
        page.locator('.nk-mob-calc__row[data-prop="speed"] .nk-mob-calc__val'),
        '速度 = 基准 × 曲线 + 负修正（先加后乘会得错值）',
      ).toHaveText(statText(round1(neg.stats.speed * negRow.speed + neg.speed_modify!)));
      await expect(
        page.locator('.nk-mob-calc__row--stance .nk-mob-calc__cell--modify'),
      ).toHaveText(String(neg.stance_modify));
      await expect(
        page.locator('.nk-mob-calc__row--stance .nk-mob-calc__val'),
      ).toHaveText(statText(neg.stance + neg.stance_modify!));

      assertNoErrors();
    },
  );

  test(
    '/monster/<id>：状态词条逐项等于数据（命名约定归属的安全子集，非外键）',
    { tag: '@viewport-independent' },
    async ({ page }) => {
      const { assertNoErrors } = collectConsoleIssues(page);
      const list = readJson<{ id: number; name: string }[]>('public/data/cn/monsters.json');
      let target: { id: number; name: string } | undefined;
      for (const m of list.slice(0, 120)) {
        if (detailOf(m.id).statuses?.length) { target = m; break; }
      }
      expect(target, '前 120 个目录条目里应有带状态词条的怪物（断言前提）').toBeTruthy();
      const rows = detailOf(target!.id).statuses!;
      const TYPE: Record<string, string> = { Buff: '增益', Debuff: '减益', Other: '其他' };

      await page.goto(`/monster/${target!.id}`);
      await settleAnimations(page);
      await expect(page.locator('.nk-mob-hero__name')).toBeVisible();
      const cards = page.locator('.nk-mob-status');
      await expect(cards, '词条行数 = 数据条数').toHaveCount(rows.length);
      const rendered = await cards.evaluateAll((els) => els.map((el) => ({
        name: (el.querySelector('.nk-mob-status__name')?.textContent || '').trim(),
        type: (el.querySelector('.nk-mob-status__type')?.textContent || '').trim(),
        dispel: Boolean(el.querySelector('.nk-mob-status__dispel')),
        desc: (el.querySelector('.nk-mob-status__desc')?.textContent || '').trim(),
        iconSlot: Boolean(el.querySelector('.nk-mob-status__icon svg')),
      })));
      rows.forEach((s, i) => {
        expect(rendered[i].name, `第 ${i + 1} 条词条名`).toBe(s.name);
        expect(rendered[i].type, `${s.name} 的类型标签`).toBe(TYPE[s.type] || s.type || '其他');
        expect(rendered[i].dispel, `${s.name} 的可驱散标记`).toBe(Boolean(s.dispel));
        expect(rendered[i].iconSlot, `${s.name} 的图标位占位符`).toBe(true);
        if (s.desc) expect(rendered[i].desc.length, `${s.name} 的描述应上屏`).toBeGreaterThan(0);
        expect(rendered[i].desc, `${s.name} 不得出现未替换的占位符`).not.toContain('#');
      });

      assertNoErrors();
    },
  );

  test(
    '/monster/<id>：技能附带效果按技能逐项等于数据（ExtraEffectIDList × ExtraEffectConfig 完整外键）',
    { tag: '@viewport-independent' },
    async ({ page }) => {
      const { assertNoErrors } = collectConsoleIssues(page);
      const id = 1004014;
      const mon = detailOf(id);
      const withFx = (mon.skills || []).filter((s) => s.extra_effects?.length);
      expect(withFx.length, `${id} 应有带附带效果的技能（断言前提）`).toBeGreaterThan(0);

      await page.goto(`/monster/${id}`);
      await settleAnimations(page);
      await expect(page.locator('.nk-mob-hero__name')).toBeVisible();
      await expect(
        page.locator('.nk-mob-skill__fx'),
        '带附带效果的技能数必须与数据一致',
      ).toHaveCount(withFx.length);

      const rendered = await page.locator('.nk-mob-skill').evaluateAll((els) => els.map((el) => ({
        name: (el.querySelector('.nk-mob-skill__name')?.textContent || '').trim(),
        fx: [...el.querySelectorAll('.nk-mob-skill__fxitem')].map((i) => ({
          name: (i.querySelector('.nk-mob-skill__fxname')?.textContent || '').trim(),
          hasDesc: Boolean(i.querySelector('.nk-mob-skill__fxdesc')),
        })),
      })));
      (mon.skills || []).forEach((s, i) => {
        expect(rendered[i].name, `第 ${i + 1} 张技能卡`).toBe(s.name);
        const fx = s.extra_effects || [];
        expect(rendered[i].fx.map((x) => x.name), `${s.name} 的附带效果名与顺序`).toEqual(fx.map((f) => f.name));
        fx.forEach((f, j) => {
          if (f.desc) expect(rendered[i].fx[j].hasDesc, `${f.name} 的描述应上屏`).toBe(true);
        });
      });

      assertNoErrors();
    },
  );

  test(
    '/monster/<id>：额外阶段逐项等于详情数据；已下线的掉落 / 出没 / 活动出处 / 同族变体区块不渲染',
    { tag: '@viewport-independent' },
    async ({ page }) => {
      const { assertNoErrors } = collectConsoleIssues(page);

      const dropMon = detailOf(Number(MONSTER_ID));
      expect(dropMon.drops?.length, `${MONSTER_ID} 数据里仍有掉落（断言前提）`).toBeGreaterThan(0);
      expect(dropMon.appearances?.total, `${MONSTER_ID} 数据里仍有出没统计（断言前提）`).toBeGreaterThan(0);
      expect(familyOf(Number(MONSTER_ID)).length, `${MONSTER_ID} 数据里仍有 4 个同族档（断言前提）`).toBe(4);
      const eventMon = readJson<MonsterListEntry[]>('public/data/cn/monsters.json')
        .map((m) => ({ m, d: detailOf(m.id) }))
        .find(({ d }) => d.event);
      expect(eventMon, '目录里应有带活动出处的条目（断言前提）').toBeTruthy();

      await page.goto(`/monster/${MONSTER_ID}`);
      await settleAnimations(page);
      await expect(page.locator('.nk-mob-hero__name')).toBeVisible();
      await expect(page.locator('.nk-mob-drop'), '掉落区块已下线').toHaveCount(0);
      await expect(page.locator('.nk-mob-appear__count'), '出没区块已下线').toHaveCount(0);
      await expect(page.locator('.nk-mob-appear__sample'), '出没区块已下线').toHaveCount(0);
      await expect(page.locator('.nk-mob-var'), '同族变体条已下线').toHaveCount(0);
      await expect(page.locator('.nk-mob-atlas'), '图鉴族互链已下线').toHaveCount(0);
      const secTitles = (await page.locator('.nk-mob-sec__title').allTextContents()).map((t) => t.trim());
      expect(secTitles, '区块标题里不得再有出没关卡 / 掉落 / 同族变体').not.toContain('出没关卡');
      expect(secTitles, '区块标题里不得再有出没关卡 / 掉落 / 同族变体').not.toContain('掉落');
      expect(secTitles, '区块标题里不得再有出没关卡 / 掉落 / 同族变体').not.toContain('同族变体');
      await page.goto(`/monster/${eventMon!.m.id}`);
      await settleAnimations(page);
      await expect(page.locator('.nk-mob-hero__name')).toBeVisible();
      await expect(page.locator('.nk-mob-event'), '活动出处区块已下线').toHaveCount(0);

      const sig = (weak: string[], resist: Record<string, number>): string => JSON.stringify([
        [...(weak || [])].sort(),
        Object.entries(resist || {}).sort(([a], [b]) => a.localeCompare(b)),
      ]);
      const listEntry = (id: number): MonsterListEntry | undefined =>
        readJson<MonsterListEntry[]>('public/data/cn/monsters.json').find((m) => m.id === id);
      const atlasMembers = (group: number | undefined): MonsterListEntry[] =>
        group == null ? [] : readJson<MonsterListEntry[]>('public/data/cn/monsters.json')
          .filter((m) => m.atlas_group === group);
      const phaseRows = (id: number): { weak: string[]; label: string }[] => {
        const mon = detailOf(id);
        const group = listEntry(id)?.atlas_group;
        const canon = group != null && group !== id
          ? readJson<MonsterDetailJson>(`public/data/cn/monsters/${group}.json`)
          : mon;
        const base = sig(mon.weak, mon.resist);
        const canonSig = sig(canon.weak, canon.resist);
        const siblings = new Set(atlasMembers(group).map((m) => m.name));
        const rows: { weak: string[]; label: string }[] = [];
        const seen = new Set<string>();
        for (const p of mon.phases || []) {
          const s = sig(p.weak, p.resist);
          if (s === base) continue;
          if (p.name && siblings.has(p.name)) continue;
          if (s === canonSig && !p.name && !p.intro) continue;
          const key = `${s}\u0000${p.name ?? ''}`;
          if (seen.has(key)) continue;
          seen.add(key);
          rows.push({ weak: p.weak, label: p.name || '其他形态' });
        }
        return rows;
      };

      const checkPhases = async (id: number): Promise<void> => {
        const want = phaseRows(id);
        await page.goto(`/monster/${id}`);
        await expect(page.locator('.nk-mob-hero__name')).toBeVisible();
        const blocks = page.locator('.nk-mob-phase');
        await expect(blocks, `${id} 形态块数量`).toHaveCount(want.length);
        if (!want.length) return;
        expect(
          await blocks.evaluateAll((els) => els.map((el) =>
            (el.querySelector('.nk-mob-phase__name, .nk-mob-phase__label')?.textContent || '').trim())),
          '标签只能是官方形态名或「其他形态」——不得出现无来源的阶段号',
        ).toEqual(want.map((r) => r.label));
        const firstWeak = await blocks.first().evaluate((el) => {
          const row = el.querySelector('.nk-mob-resist__row');
          return [...(row?.querySelectorAll('.nk-mob-resist__tags img') ?? [])]
            .map((i) => ((i.getAttribute('data-cdn-src') || i.getAttribute('src')) || '').split('/').pop() || '');
        });
        expect(firstWeak, '形态弱点的元素图标逐项与数据一致').toEqual(
          want[0].weak.map((e) => `${e.toLowerCase()}.webp`),
        );
      };

      await checkPhases(4014010);
      await checkPhases(4034013);
      await checkPhases(4034014);

      assertNoErrors();
    },
  );

  test(
    '/monster/<id>：技能参数行与 ParamList 逐值一致（/ 分隔；描述引用与否都展示）',
    { tag: '@viewport-independent' },
    async ({ page }) => {
      const { assertNoErrors } = collectConsoleIssues(page);
      const wantsRow = (s: MonsterDetailJson['skills'][number]): boolean =>
        (s.param_list?.length ?? 0) > 0;
      const check = async (id: number): Promise<void> => {
        const mon = detailOf(id);
        expect(mon.skills.some(wantsRow), `${id} 应有带参数的技能（样本前提）`).toBe(true);
        expect(
          Math.max(...mon.skills.flatMap((s) => (s.param_list ?? [0]).map(Math.abs))),
          `${id} 参数值应全部 <1000（页面按 fmtStatValue 加千分位，样本越界即换样本）`,
        ).toBeLessThan(1000);
        await page.goto(`/monster/${id}`);
        await settleAnimations(page);
        await expect(page.locator('.nk-mob-hero__name')).toBeVisible();
        await expect(
          page.locator('.nk-mob-skill__params'),
          `${id} 参数行数 = 带参数的技能数`,
        ).toHaveCount(mon.skills.filter(wantsRow).length);
        const rendered = await page.locator('.nk-mob-skill').evaluateAll((els) => els.map((el) => ({
          name: (el.querySelector('.nk-mob-skill__name')?.textContent || '').trim(),
          params: (el.querySelector('.nk-mob-skill__paramsvals')?.textContent || '').trim(),
        })));
        mon.skills.forEach((s, i) => {
          expect(rendered[i].name, `第 ${i + 1} 张技能卡`).toBe(s.name);
          expect(rendered[i].params.length > 0, `${s.name} 参数行有无`).toBe(wantsRow(s));
          if (wantsRow(s)) {
            expect(rendered[i].params, `${s.name} 参数逐值一致`).toBe(s.param_list!.map(String).join(' / '));
          }
        });
      };
      await check(2023030);
      await check(1002012);
      assertNoErrors();
    },
  );

  test(
    '/monster/<id>：阶段机制逐项等于官方文案，无登记的条目整块不渲染',
    { tag: '@viewport-independent' },
    async ({ page }) => {
      const { assertNoErrors } = collectConsoleIssues(page);
      const norm = (s: string): string => s.replace(/\s+/g, ' ').trim();
      const PREFIX = /^阶段\s*([一二三四五六七八九十\d]+)\s*[：:]\s*/;
      const shownName = (name: string, i: number): string => {
        const m = name.match(PREFIX);
        return m && m[1] === CN_NUM[i] ? name.slice(m[0].length) : name;
      };

      const check = async (id: number): Promise<void> => {
        const mon = detailOf(id);
        const phases = mon.guide_phases || [];
        expect(phases.length, `${id} 应有阶段机制（断言前提）`).toBeGreaterThan(0);

        await page.goto(`/monster/${id}`);
        await settleAnimations(page);
        await expect(page.locator('.nk-mob-hero__name')).toBeVisible();
        const blocks = page.locator('.nk-mob-guide');
        await expect(blocks, '阶段块数 = 数据阶段数').toHaveCount(phases.length);
        const seen = await blocks.evaluateAll((els) => els.map((el) => ({
          no: (el.querySelector('.nk-mob-guide__no')?.textContent || '').trim(),
          name: (el.querySelector('.nk-mob-guide__name')?.textContent || '').trim(),
          desc: (el.querySelector('.nk-mob-guide__desc')?.textContent || '').trim(),
          answer: (el.querySelector('.nk-mob-guide__answer')?.textContent || '').trim(),
          qas: [...el.querySelectorAll('.nk-mob-guide__qa')].map((q) => ({
            q: (q.querySelector('.nk-mob-guide__q')?.textContent || '').trim(),
            a: (q.querySelector('.nk-mob-guide__a')?.textContent || '').trim(),
          })),
        })));
        phases.forEach((p, i) => {
          const got = seen[i];
          const prefix = p.name.match(PREFIX);
          if (prefix) {
            expect(CN_NUM.indexOf(prefix[1]), `「${p.name}」的前缀序号必须等于官方阶段顺序`).toBe(i);
          }
          expect(got.no, `第 ${i + 1} 段的编号位`).toBe(`阶段 ${i + 1}`);
          expect(got.name, `第 ${i + 1} 段标题`).toBe(norm(shownName(p.name, i)));
          expect(got.desc, `${p.name} 机制说明`).toBe(norm(p.desc || ''));
          expect(got.answer, `${p.name} 官方应对策略`).toBe(norm(p.answer || ''));
          expect(got.qas.map((q) => q.q), `${p.name} 小节问答问句`).toEqual((p.skills || []).map((s) => norm(s.name)));
          expect(got.qas.map((q) => q.a), `${p.name} 小节问答答句`).toEqual((p.skills || []).map((s) => norm(s.desc || '')));
        });
      };

      await check(8015022);
      await check(4034013);

      await page.goto(`/monster/${MONSTER_ID}`);
      await expect(page.locator('.nk-mob-hero__name')).toBeVisible();
      await expect(page.locator('.nk-mob-guide'), '无官方文案的条目不得渲染空壳').toHaveCount(0);
      assertNoErrors();
    },
  );

  test(
    '敌方详情页全断点避让侧栏：内容左缘落在侧栏右侧，且无未知横向溢出',
    { tag: ['@visual-detail', '@viewport-pinned'] },
    async ({ page }) => {
      const { assertNoErrors } = collectConsoleIssues(page);
      const cases = [
        { w: 1024, h: 900, offset: 148 },
        { w: 800, h: 900, offset: 88 },
        { w: 390, h: 844, offset: 0 },
      ];
      for (const { w, h, offset } of cases) {
        await page.setViewportSize({ width: w, height: h });
        await page.goto(`/monster/${MONSTER_ID}`);
        await expect(page.locator('.nk-mob-hero__name')).toBeVisible();
        expect(await readContentOffset(page), `${w}px 档避让令牌`).toBe(offset);
        await expectTokenNumber(page.locator('.nk-mob-page'), 'padding-left', offset, `${w}px 档内容区左避让`);
        if (offset > 0) {
          const sidebar = await page.locator('.ui-sidebar').boundingBox();
          const title = await page.locator('.nk-mob-sec__title').first().boundingBox();
          expect(sidebar, `${w}px 档侧栏应可见`).toBeTruthy();
          expect(
            title!.x - (sidebar!.x + sidebar!.width),
            `${w}px 档区块标题必须落在侧栏右侧（不得被压住）`,
          ).toBeGreaterThanOrEqual(0);
        }
        await noUnknownOverflow(page);
      }
      assertNoErrors();
    },
  );
});

test.describe('布局验收：敌方目录（同族各档必须可辨）', () => {
  test(
    '/monster：同族各档在卡面给出弱点图标与档位序号（否则同名同图的多张卡彼此无法区分）',
    { tag: '@viewport-independent' },
    async ({ page }) => {
      const { assertNoErrors } = collectConsoleIssues(page);
      const fam = familyOf(Number(MONSTER_ID));
      expect(fam.length).toBeGreaterThan(1);

      await page.goto('/monster');
      await waitForCatalogCards(page);
      await page.locator('.nk-cat-search input').fill(fam[0].name);
      await expect(page.locator('.nk-mob-card')).toHaveCount(fam.length);

      const cards = await page.locator('.nk-mob-card').evaluateAll((els) => els.map((el) => ({
        href: el.getAttribute('href') || '',
        variant: (el.querySelector('.nk-mob-card__var')?.textContent || '').trim(),
        weakIcons: [...el.querySelectorAll('.nk-mob-card__weak img')]
          .map((i) => ((i.getAttribute('data-cdn-src') || i.getAttribute('src')) || '').split('/').pop() || ''),
        title: el.getAttribute('title') || '',
      })));

      fam.forEach((m, i) => {
        const card = cards.find((c) => c.href === `/monster/${m.id}`);
        expect(card, `同族第 ${i + 1} 档 ${m.id} 必须出现在目录里`).toBeTruthy();
        expect(card!.variant, `${m.id} 的档位序号`).toBe(`变体 ${i + 1}/${fam.length}`);
        expect(card!.weakIcons, `${m.id} 的卡面弱点图标`).toEqual(
          (m.weak ?? []).map((e) => `${e.toLowerCase()}.webp`),
        );
        expect(card!.title).toContain(m.name);
        expect(card!.title).toContain(`变体 ${i + 1}/${fam.length}`);
      });

      assertNoErrors();
    },
  );
});
