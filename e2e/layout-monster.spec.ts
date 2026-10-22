import { test, expect } from '@playwright/test';
import { collectConsoleIssues, readJson, waitForCatalogCards } from './helpers';
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
const sampleLabel = (s: { name: string; activity?: string }): string =>
  s.activity ? `${s.activity} · ${s.name}` : s.name;
const appearGroups = (mon: MonsterDetailJson) => mon.appearances?.groups ?? [];
const appearSamples = (mon: MonsterDetailJson) => appearGroups(mon).flatMap((g) => g.samples ?? []);

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
    `/monster/${MONSTER_ID}：同族变体条覆盖全部同族档，「差分」标注逐格与详情数据一致`,
    { tag: '@viewport-independent' },
    async ({ page }) => {
      const { assertNoErrors } = collectConsoleIssues(page);
      const fam = familyOf(Number(MONSTER_ID));
      expect(fam.length, '冰锋族应有 4 档（断言的数据前提）').toBe(4);
      const cur = detailOf(Number(MONSTER_ID));
      const curSig = [
        JSON.stringify([...cur.weak].sort()),
        String(cur.stance),
        String(cur.stats.hp),
        String(cur.stats.speed),
        cur.skills.map((s) => s.id).join(','),
      ];

      await page.goto(`/monster/${MONSTER_ID}`);
      await expect(page.locator('.nk-mob-hero__name')).toBeVisible();
      const rows = page.locator('.nk-mob-var__row');
      await expect(rows, '同族条必须列出全部同族档（缺档 = 用户仍然走不到那一档）').toHaveCount(fam.length);

      const seen = await rows.evaluateAll((els) => els.map((el) => ({
        no: (el.querySelector('.nk-mob-var__id')?.textContent || '').replace(/\D/g, ''),
        current: el.classList.contains('is-current'),
        flag: (el.querySelector('.nk-mob-var__flag')?.textContent || '').trim(),
        diffCells: [...el.querySelectorAll('.nk-mob-var__cell')].map((c) => c.classList.contains('is-diff')),
        cellValues: [...el.querySelectorAll('.nk-mob-var__cell')].map((c) => {
          const k = c.querySelector('.nk-mob-var__k')?.textContent || '';
          return c.textContent.replace(k, '').trim();
        }),
      })));

      const num = (s: string): number => Number(s.replace(/[^\d.-]/g, ''));
      fam.forEach((m, i) => {
        const row = seen[i];
        const o = detailOf(m.id);
        const isCur = m.id === Number(MONSTER_ID);
        expect(row.no, `第 ${i + 1} 行必须是同族按 id 升序的第 ${i + 1} 档`).toBe(String(m.id));
        expect(row.current, `${m.id} 的「当前档」标记`).toBe(isCur);
        if (isCur) {
          expect(row.flag, '当前档必须有显式标记（不是靠颜色）').toBe('当前档');
        } else {
          expect(row.flag, `${m.id} 必须列出与当前档的差异字段`).toContain('差分');
        }
        expect(
          row.diffCells,
          `${m.id} 的差分格必须与详情数据逐格一致（谎报「一致」会让用户以为两档没差别）`,
        ).toEqual([
          JSON.stringify([...o.weak].sort()) !== curSig[0],
          String(o.stance) !== curSig[1],
          String(o.stats.hp) !== curSig[2],
          String(o.stats.speed) !== curSig[3],
          o.skills.map((s) => s.id).join(',') !== curSig[4],
        ]);
        expect(num(row.cellValues[1]), `${m.id} 韧性值`).toBe(o.stance);
        expect(num(row.cellValues[2]), `${m.id} HP 值`).toBe(o.stats.hp);
        expect(num(row.cellValues[3]), `${m.id} 速度值`).toBe(o.stats.speed);
        expect(num(row.cellValues[4]), `${m.id} 技能条数`).toBe(o.skills.length);
      });

      assertNoErrors();
    },
  );

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
    '/monster/1004017：战斗数值逐因子上屏，拖动等级时曲线系数与战斗值同步重算',
    { tag: '@viewport-independent' },
    async ({ page }) => {
      const { assertNoErrors } = collectConsoleIssues(page);
      const id = 1004017;
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
      const id = 1003014;
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
    '/monster/<id>：出没样本按关卡语境合成实战面板（Π精英组 = 自身组 × 关卡指派组）',
    { tag: '@viewport-independent' },
    async ({ page }) => {
      const { assertNoErrors } = collectConsoleIssues(page);
      const elite = readJson<Record<string, Record<string, number>>>('public/data/cn/monster-elite-group.json');
      const curve = readJson<Record<string, Record<string, Record<string, number>>>>('public/data/cn/monster-level-curve.json');
      const entry = readJson<{ id: number; name: string }[]>('public/data/cn/monsters.json')
        .map((m) => ({ m, mon: detailOf(m.id) }))
        .find(({ mon }) => appearSamples(mon).some(
          (s) => s.level != null && s.elite_group != null && curve[String(s.level_group ?? 1)]?.[String(s.level)],
        ));
      expect(entry, '应有样本带完整关卡语境的目录条目（断言前提）').toBeTruthy();
      const { m: entryMeta, mon } = entry!;
      const sample = appearSamples(mon).find(
        (s) => s.level != null && s.elite_group != null && curve[String(s.level_group ?? 1)]?.[String(s.level)],
      )!;

      const own = elite[String(mon.elite_group ?? 1)] ?? {};
      const stg = elite[String(sample.elite_group!)] ?? {};
      const row = curve[String(sample.level_group ?? 1)][String(sample.level!)];
      const v = (p: 'hp' | 'atk' | 'def' | 'speed'): string => {
        const add = p === 'speed' ? (mon.speed_modify ?? 0) : 0;
        const raw = mon.stats[p] * (mon.stat_ratio?.[p] ?? 1) * (own[p] ?? 1) * (stg[p] ?? 1) * row[p] + add;
        return (Math.round(raw * 10) / 10).toLocaleString('en-US');
      };
      const wantPanel = `等级 ${sample.level} · HP ${v('hp')} / ATK ${v('atk')} / DEF ${v('def')} / SPD ${v('speed')}`;

      await page.goto(`/monster/${entryMeta.id}`);
      await expect(page.locator('.nk-mob-hero__name')).toBeVisible();
      await expect(
        page.locator('.nk-mob-appear__sample-panel').first(),
        '样本面板逐字等于关卡语境独立折算（等级 + 四维）',
      ).toHaveText(wantPanel);

      assertNoErrors();
    },
  );

  test(
    '/monster/<id>：活动出处备注逐项等于数据（活动名/页签/档位来自源文本，非自撰）',
    { tag: '@viewport-independent' },
    async ({ page }) => {
      const { assertNoErrors } = collectConsoleIssues(page);
      const list = readJson<{ id: number; name: string }[]>('public/data/cn/monsters.json');
      let target: { id: number; name: string } | undefined;
      for (const m of list.slice(0, 200)) {
        if (detailOf(m.id).event) { target = m; break; }
      }
      expect(target, '前 200 个目录条目里应有带活动出处的怪物（断言前提）').toBeTruthy();
      const ev = detailOf(target!.id).event!;

      await page.goto(`/monster/${target!.id}`);
      await expect(page.locator('.nk-mob-hero__name')).toBeVisible();
      const note = page.locator('.nk-mob-event');
      await expect(note).toHaveCount(1);
      const text = ((await note.innerText()) || '').replace(/\s+/g, ' ');
      expect(text, '活动名来自源 ActivityPanel.TitleName').toContain(`「${ev.name}」`);
      if (ev.count === detailOf(target!.id).appearances?.total) {
        expect(text, '数量与总数相同时不重复报数').toContain('全部关卡都在');
        expect(text, '数量与总数相同时不重复报数').not.toContain(`${ev.count} 个`);
      } else {
        expect(text, '活动内关卡数来自源关卡引用次数').toContain(`其中 ${ev.count} 个`);
      }
      expect(text, '等级区间单档时只写一个数').not.toMatch(/等级 (\d+)–\1/);
      for (const tab of ev.tabs) expect(text, `页签「${tab}」来自源 ActivityQuestRewardData`).toContain(tab);

      const artTarget = list.slice(0, 200).find((m) => {
        const d = detailOf(m.id);
        return !!d.event && !!d.art_shared;
      });
      expect(artTarget, '前 200 个目录条目里应有「活动出处 + 同卡面同伴」的怪物（断言前提）').toBeTruthy();
      const art = detailOf(artTarget!.id).art_shared!;
      await page.goto(`/monster/${artTarget!.id}`);
      await expect(page.locator('.nk-mob-hero__name')).toBeVisible();
      const artText = ((await page.locator('.nk-mob-event').innerText()) || '').replace(/\s+/g, ' ');
      expect(artText, '立绘相同 → 说「卡面与立绘与其共用」').toContain(
        art.figure
          ? `卡面与立绘与「${art.name}」共用（同卡面共 ${art.forms} 个形态）`
          : `与「${art.name}」等 ${art.forms} 个形态同卡面图标，立绘不同`,
      );
      expect(artText, '不得声称站点证不了的「技能组复用」').not.toContain('技能组');

      const none = list.find((m) => !detailOf(m.id).event && m.id < 200);
      if (none) {
        await page.goto(`/monster/${none.id}`);
        await expect(page.locator('.nk-mob-hero__name')).toBeVisible();
        await expect(page.locator('.nk-mob-event'), '无活动出处时不渲染备注').toHaveCount(0);
      }

      assertNoErrors();
    },
  );

  test(
    '/monster/<id>：图鉴族互链逐项等于数据（官方 TemplateGroupID，排除同卡面档位）',
    { tag: '@viewport-independent' },
    async ({ page }) => {
      const { assertNoErrors } = collectConsoleIssues(page);
      const list = readJson<{ id: number; name: string; icon?: string; atlas_group?: number }[]>(
        'public/data/cn/monsters.json',
      );
      const key = (m: { name: string; icon?: string }): string =>
        `${m.name}\u0000${(m.icon || '').split('/').pop()?.replace(/\.png$/i, '') || ''}`;
      const othersOf = (self: typeof list[number]): typeof list =>
        list.filter((r) => r.atlas_group === self.atlas_group)
          .sort((a, b) => Number(a.id) - Number(b.id))
          .filter((r) => key(r) !== key(self));

      const target = list.find((m) => m.atlas_group != null && othersOf(m).length >= 2);
      expect(target, '应存在带图鉴族且含 ≥2 个非同卡面形态的怪物（断言前提）').toBeTruthy();
      const want = othersOf(target!);

      await page.goto(`/monster/${target!.id}`);
      await expect(page.locator('.nk-mob-hero__name')).toBeVisible();
      const links = await page.locator('.nk-mob-atlas__link').evaluateAll((els) => els.map((e) => ({
        name: (e.textContent || '').trim(),
        href: e.getAttribute('href') || '',
      })));
      expect(links.map((l) => l.name), '图鉴族互链的名称与顺序').toEqual(want.map((r) => r.name));
      expect(links.map((l) => l.href)).toEqual(want.map((r) => `/monster/${r.id}`));

      const soloGroup = list.find((m) => m.atlas_group != null
        && list.filter((r) => r.atlas_group === m.atlas_group).length > 1
        && othersOf(m).length === 0);
      if (soloGroup) {
        await page.goto(`/monster/${soloGroup.id}`);
        await expect(page.locator('.nk-mob-hero__name')).toBeVisible();
        await expect(page.locator('.nk-mob-atlas')).toHaveCount(0);
      }

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
    '/monster/<id>：掉落 / 出没 / 额外阶段三块逐项等于详情数据（期望值全部数据派生）',
    { tag: '@viewport-independent' },
    async ({ page }) => {
      const { assertNoErrors } = collectConsoleIssues(page);

      const dropMon = detailOf(Number(MONSTER_ID));
      expect(dropMon.drops?.length, `${MONSTER_ID} 应有掉落（断言前提）`).toBeGreaterThan(0);
      expect(dropMon.appearances?.total, `${MONSTER_ID} 应有出没统计（断言前提）`).toBeGreaterThan(0);

      await page.goto(`/monster/${MONSTER_ID}`);
      await expect(page.locator('.nk-mob-hero__name')).toBeVisible();

      const tiers = page.locator('.nk-mob-drop');
      await expect(tiers, '掉落档数 = 数据档数（少一档就是静默丢数据）').toHaveCount(dropMon.drops!.length);
      const rendered = await tiers.evaluateAll((els) => els.map((el) => ({
        tier: (el.querySelector('.nk-mob-drop__tier')?.textContent || '').trim(),
        items: [...el.querySelectorAll('.nk-mob-drop__item')].map((i) => (i.querySelector('span')?.textContent || '').trim()),
      })));
      dropMon.drops!.forEach((t, i) => {
        expect(rendered[i].tier, `第 ${i + 1} 档标签`).toBe(t.world_level == null ? '基准档' : `均衡等级 ${t.world_level}`);
        expect(rendered[i].items, `第 ${i + 1} 档物品名与顺序`).toEqual(t.items.map((x) => x.name));
      });
      await expect(
        page.locator('.nk-mob-appear__count strong'),
        '出没关卡数 = 数据 total',
      ).toHaveText(String(dropMon.appearances!.total));

      const cnDict = readJson<Record<string, string>>('src/lib/i18n/messages/cn.json');
      const dropGroups = appearGroups(dropMon);
      await expect(
        page.locator('.nk-mob-appear__group'),
        '玩法域行数 = 数据域数（少一行就是静默丢玩法）',
      ).toHaveCount(dropGroups.length);
      const renderedGroups = await page.locator('.nk-mob-appear__group').evaluateAll((els) => els.map((el) => ({
        key: el.getAttribute('data-domain'),
        name: (el.querySelector('.nk-mob-appear__group-name')?.textContent || '').trim(),
        count: (el.querySelector('.nk-mob-appear__group-count')?.textContent || '').trim(),
        subs: [...el.querySelectorAll('.nk-mob-appear__sub')].map((s) => ({
          name: (s.querySelector('.nk-mob-appear__sub-name')?.textContent || '').trim(),
          count: (s.querySelector('.nk-mob-appear__sub-count')?.textContent || '').trim(),
        })),
      })));
      dropGroups.forEach((g, i) => {
        expect(renderedGroups[i].key, `第 ${i + 1} 个玩法域键与数据一致`).toBe(g.key);
        expect(renderedGroups[i].name, `第 ${i + 1} 个玩法域名 = 词典 ${`mob.dom.${g.key}`}`).toBe(cnDict[`mob.dom.${g.key}`]);
        expect(renderedGroups[i].count, `第 ${i + 1} 个玩法域计数与数据一致`).toBe(String(g.count));
        expect(renderedGroups[i].subs.map((s) => s.name), `第 ${i + 1} 个玩法域子模式 = 词典`).toEqual(
          (g.subs ?? []).map((s) => cnDict[`mob.sub.${s.key}`]),
        );
        expect(renderedGroups[i].subs.map((s) => s.count), `第 ${i + 1} 个玩法域子模式计数与数据一致`).toEqual(
          (g.subs ?? []).map((s) => String(s.count)),
        );
      });

      const chips = page.locator('.nk-mob-appear__sample');
      await expect(chips, '样本 chip 数 = 数据样本数').toHaveCount(appearSamples(dropMon).length);
      expect(
        (await page.locator('.nk-mob-appear__sample .nk-mob-appear__sample-name').allTextContents()).map((t) => t.trim()),
        '样本名逐项与数据一致（顺序同 DOM；活动关卡为「活动名 · 关卡名」）',
      ).toEqual(appearSamples(dropMon).map(sampleLabel));

      const festMon = detailOf(1004015);
      await page.goto('/monster/1004015');
      await expect(page.locator('.nk-mob-hero__name')).toBeVisible();
      const festNames = (await page.locator('.nk-mob-appear__sample .nk-mob-appear__sample-name').allTextContents()).map((t) => t.trim());
      expect(festNames, '活动关卡样本名逐项与数据一致').toEqual(appearSamples(festMon).map(sampleLabel));
      expect(festNames, '活动级常量 StageName 不得作为关卡名上屏').not.toContain('承露天人');
      expect(festNames[0], '活动链样本名应带「活动名 · 关卡名」前缀').toMatch(/^星天演武仪典 · /);

      for (const id of [1003011, 1003012]) {
        const mon = detailOf(id);
        expect(mon.appearances!.total, `${id} 应有出没计数（断言前提）`).toBeGreaterThan(0);
        expect(appearSamples(mon).map((s) => s.name), `${id} 数据里不得出现自己名字`).not.toContain(mon.name);
        await page.goto(`/monster/${id}`);
        await expect(page.locator('.nk-mob-hero__name')).toBeVisible();
        const chipNames = (await page.locator('.nk-mob-appear__sample .nk-mob-appear__sample-name').allTextContents()).map((t) => t.trim());
        expect(chipNames, `${id} 自己名字不得上屏`).not.toContain(mon.name);
        expect(chipNames, `${id} chip 逐项等于数据`).toEqual(appearSamples(mon).map(sampleLabel));
      }

      const noChipId = readJson<MonsterListEntry[]>('public/data/cn/monsters.json')
        .slice(0, 120)
        .map((m) => m.id)
        .find((id) => {
          const a = detailOf(id).appearances;
          return !!a && a.total > 0 && appearSamples(detailOf(id)).length === 0;
        });
      expect(noChipId, '应有「有计数、无样本」的目录条目（断言前提）').toBeTruthy();
      const noChipMon = detailOf(noChipId!);
      await page.goto(`/monster/${noChipId}`);
      await expect(page.locator('.nk-mob-hero__name')).toBeVisible();
      await expect(page.locator('.nk-mob-appear__count strong')).toHaveText(String(noChipMon.appearances!.total));
      await expect(page.locator('.nk-mob-appear__sample'), '无实名源的关卡不得产出 chip').toHaveCount(0);
      await expect(
        page.locator('.nk-mob-appear__group'),
        '无实名源的页面仍按玩法域拆开（只给计数，不臆造关卡名）',
      ).toHaveCount(appearGroups(noChipMon).length);
      await expect(
        page.locator('.nk-mob-appear__tip'),
        '无样本时必须说明「游戏内没有关卡名」，不能用沉默代替口径',
      ).toContainText('没有关卡名');

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
            .map((i) => (i.getAttribute('src') || '').split('/').pop() || '');
        });
        expect(firstWeak, '形态弱点的元素图标逐项与数据一致').toEqual(
          want[0].weak.map((e) => `${e.toLowerCase()}.webp`),
        );
      };

      await checkPhases(3025010);
      const sibling = 4034015;
      await page.goto(`/monster/4034013`);
      await expect(page.locator('.nk-mob-atlas__links')).toBeVisible();
      expect(
        (await page.locator('.nk-mob-atlas__link').allTextContents()).map((t) => t.trim()),
        '同条目成员必须仍在「图鉴族」互链里',
      ).toContain(detailOf(sibling).name);
      await checkPhases(4034013);
      await checkPhases(8015022);

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
      await check(2004013);
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
          .map((i) => (i.getAttribute('src') || '').split('/').pop() || ''),
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
