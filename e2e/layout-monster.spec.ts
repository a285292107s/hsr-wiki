import { test, expect } from '@playwright/test';
import { collectConsoleIssues, readJson, waitForCatalogCards } from './helpers';

/**
 * 布局验收：敌方页（`/monster` 列表 + `/monster/<id>` 详情）。
 *
 * 域独立成文件：本页此前没有任何 layout 分域文件——它的骨架几何由探针背书（第 11 轮），
 * 但「加载态与就绪态不产生位移」这条**契约**一直没人守。第 19 轮抓到真缺陷（见下），故立此文件。
 *
 * 本文件锁两组契约（都属「敌方页」，故同域共存）：
 *  ① 详情页 hero 高度在立绘到达前后不得变化（原判据，保住）；
 *  ② 同族各档必须**在卡面上可辨、在详情页里可对照**（后续新增）。
 *
 * ②的背景（数据实测，判据单点在 `src/lib/monster-family.ts`）：目录 632 条里 392 条与另一条
 * 名称+卡面图标全同，只有弱点火雷/量子、韧性、速度、技能这些**页面上没显示的**字段不同；
 * 卡片只画名称+分类时 400/632 张卡彼此无法区分。故两处断言都从 `public/data/cn/**` 派生期望值，
 * 不写死序号与数值。
 *
 * ①的缺陷原型：`.nk-mob-hero__figure` 桌面档只有 `min-height: 300px`，立绘用 `max-width: 88%`
 * 在**未解码时不产生盒子**（高 0）⇒ hero 首帧 301px，立绘到达后内容高 357px ⇒ hero 变 358px，
 * 把下方 `.nk-panels` 整体推下 57px。实测该页 CLS 0.0288（全 632 个敌方详情页同构）。
 * 判据写法与像素/文案无关：只断言「采样窗口内 hero 高度恒定」——立绘尺寸、字体度量变化都不会让它变红，
 * 而一旦有人把 `aspect-ratio` 摘掉就会立刻变红。
 */

interface MonsterListEntry { id: number; name: string; icon: string; weak?: string[] }
interface MonsterDropTierJson { world_level: number | null; avatar_exp: number; items: { id: number; name: string; icon: string }[] }
interface MonsterDetailJson {
  id: number;
  weak: string[];
  stance: number;
  stats: { hp: number; atk: number; def: number; speed: number };
  /** 战斗数值合成链字段（ADR 0040/0049）：维度修饰比 / 难度组 / 精英组 / 实例修正值 */
  stat_ratio?: { hp?: number; atk?: number; def?: number; speed?: number };
  level_group?: number;
  elite_group?: number;
  stance_modify?: number;
  speed_modify?: number;
  skills: {
    id: number;
    name: string;
    /** 效果描述（原始富文本，含 #N 占位符）与占位符替换参数 */
    desc?: string;
    param_list?: number[];
    /** 技能附带效果（ExtraEffectIDList × ExtraEffectConfig，完整外键） */
    extra_effects?: { id: number; name: string; desc?: string; param_list?: number[] }[];
  }[];
  /** 活动出处（仅被活动关卡引用的怪物有值） */
  event?: { name: string; tabs: string[]; levels: number[]; count: number };
  /** 同卡面图标但名字不同的其他形态（活动出处的「美术复用」用它） */
  art_shared?: { id: number; name: string; figure: boolean; forms: number };
  /** 掉落 / 出没 / 额外阶段（monster_extra.py 的三块） */
  drops?: MonsterDropTierJson[];
  appearances?: { total: number; samples: { id: number; name: string; activity?: string }[] };
  phases?: { phase_id: number; weak: string[]; resist: Record<string, number> }[];
}

const MONSTER_ID = '1002011';
const IMG_DELAY_MS = 2500;

/** 同族判据（与 `src/lib/monster-family.ts` 同式：名称 + 卡面图标 stem；e2e 不引 src） */
const iconStem = (p: string): string => (p.split('/').pop() || '').replace(/\.png$/i, '');
const familyOf = (id: number): MonsterListEntry[] => {
  const list = readJson<MonsterListEntry[]>('public/data/cn/monsters.json').filter((m) => m.name);
  const key = (m: MonsterListEntry): string => `${m.name}\u0000${iconStem(m.icon)}`;
  const self = list.find((m) => m.id === id);
  return self ? list.filter((m) => key(m) === key(self)).sort((a, b) => a.id - b.id) : [];
};
const detailOf = (id: number): MonsterDetailJson => readJson<MonsterDetailJson>(`public/data/cn/monsters/${id}.json`);
/** 样本 chip 的屏上文本 = 「活动名 · 关卡名」（活动名缺位时只有关卡名；分隔符与视图逐字一致） */
const sampleLabel = (s: { name: string; activity?: string }): string =>
  s.activity ? `${s.activity} · ${s.name}` : s.name;

test.describe('布局验收：敌方详情页', () => {
  test(`/monster/${MONSTER_ID}：立绘延迟到达时 hero 高度不得变化`, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);

    // 采样器要在页面脚本之前装好；只记录几何，不做任何样式注入
    await page.addInitScript(() => {
      const w = window as unknown as { __heroSamples: Array<{ h: number; fig: number; loaded: boolean }> };
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
        });
      }, 50);
    });
    // 延迟而非中断：中断会触发 `<img onerror>` 换备用源，量到的就不是「立绘未到达」了
    await page.route(/\.(webp|png|jpe?g|avif)(\?|$)/, async (route) => {
      await new Promise((r) => setTimeout(r, IMG_DELAY_MS));
      await route.continue().catch(() => {});
    });

    await page.goto(`/monster/${MONSTER_ID}`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.nk-mob-hero')).toBeVisible();
    await page.waitForTimeout(IMG_DELAY_MS + 1800);

    const samples = await page.evaluate(
      () => (window as unknown as { __heroSamples: Array<{ h: number; fig: number; loaded: boolean }> }).__heroSamples,
    );
    const heights = samples.map((s) => s.h);
    const figures = samples.map((s) => s.fig);
    expect(heights.length, '应采到 hero 高度样本').toBeGreaterThan(5);
    expect(samples.some((s) => s.loaded), '立绘最终应加载完成（否则断言会变成空转）').toBe(true);

    // ① 立绘方框必须恒定——这正是缺陷原型破掉的性质（桌面档 300 → 357）
    expect(
      Math.max(...figures) - Math.min(...figures),
      '立绘方框高度在立绘到达前后必须恒定（`aspect-ratio: 1` 提前给盒子）',
    ).toBe(0);
    // ② hero 总高只允许 ≤2px 的内容级收尾：手机档实测 +2px，来自信息列的中文行盒随字体落定
    //    （与立绘无关；缺陷原型是桌面档 +57px，量级差 28 倍，阈值仍能区分二者）
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
        // 5 个值格顺序：弱点 / 韧性 / HP / 速度 / 技能
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
    '/monster/<实例>：修正值按「基准 × 修饰比 × 曲线 ＋ 修正值」合成，缺省等级 = 该组曲线最高档',
    { tag: '@viewport-independent' },
    async ({ page }) => {
      const { assertNoErrors } = collectConsoleIssues(page);
      /* ADR 0045：修正值加在曲线**之后**（实测同族同模板 `144×1.32=190` 带 −44 的那一档显示 146，
         先加后乘会得到 132）。期望值在这里由**原始数据独立算一遍**（payload + 曲线表），
         与页面合成实现互为对照。100201502 实测带 `stance_modify +30`（目录 632 条都不带修正值，
         故只能取实例页；该页虽不在目录里，详情文件与路由都存在）。 */
      const id = 100201502;
      const mon = detailOf(id);
      expect(mon.stance_modify, `${id} 应带韧性修正（断言前提）`).toBeGreaterThan(0);
      const curve = readJson<Record<string, Record<string, { speed: number }>>>(
        'public/data/cn/monster-level-curve.json',
      );
      const group = String(mon.level_group ?? 1);
      const maxLevel = Math.max(...Object.keys(curve[group]).map(Number));
      const speedRatio = mon.stat_ratio?.speed ?? 1;
      const wantSpeed = Math.round((mon.stats.speed * speedRatio * curve[group][String(maxLevel)].speed
        + (mon.speed_modify ?? 0)) * 10) / 10;
      const wantStance = mon.stance + mon.stance_modify!;

      await page.goto(`/monster/${id}`);
      await expect(page.locator('.nk-mob-hero__name')).toBeVisible();
      await expect(
        page.locator('.nk-mob-level__label'),
        '缺省等级 = 该难度组曲线的最高档（不再写死 100）',
      ).toHaveText(`等级 ${maxLevel}`);
      await expect(
        page.locator('.nk-mob-stat--stance .nk-mob-stat__val'),
        '韧性 = 韧性基准 + 修正值',
      ).toHaveText(String(wantStance));
      await expect(
        page.locator('.nk-mob-stat__val[data-prop="spd"]'),
        '速度 = 基准 × 修饰比 × 曲线 + 修正值（修正值不被曲线缩放）',
      ).toHaveText(String(wantSpeed));
      await expect(page.locator('.nk-mob-stat-note'), '口径注记必须写明含实例修正值').toContainText('实例修正值');

      assertNoErrors();
    },
  );

  test(
    '/monster/<实例>：精英组倍率进合成链（组 2 = HP×1.7 / ATK×0.8，参考站同档逐位吻合）',
    { tag: '@viewport-independent' },
    async ({ page }) => {
      const { assertNoErrors } = collectConsoleIssues(page);
      /* ADR 0049：`基准 × 修饰比 × 精英组倍率 × 曲线 + 修正值`。100205006 实测带 EliteGroup 2
         （银鬃射手家族变体，修饰比全 1、无修正值——面板差异只能来自精英组）；参考站同页该档
         显示 51,203 / 574，与本仓数据独立折算逐位吻合，不含精英组的旧链会算出 30,119 / 718。 */
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
      const wantHp = Math.round(
        mon.stats.hp * (mon.stat_ratio?.hp ?? 1) * elite['2'].hp * row.hp * 10,
      ) / 10;
      const wantAtk = Math.round(
        mon.stats.atk * (mon.stat_ratio?.atk ?? 1) * elite['2'].atk * row.atk * 10,
      ) / 10;

      await page.goto(`/monster/${id}`);
      await expect(page.locator('.nk-mob-hero__name')).toBeVisible();
      await expect(
        page.locator('.nk-mob-stat__val[data-prop="hp"]'),
        'HP = 基准 × 修饰比 × 精英组倍率 × 曲线',
      ).toHaveText(wantHp.toLocaleString('en-US'));
      await expect(
        page.locator('.nk-mob-stat__val[data-prop="atk"]'),
        'ATK = 基准 × 修饰比 × 精英组倍率 × 曲线',
      ).toHaveText(wantAtk.toLocaleString('en-US'));
      await expect(page.locator('.nk-mob-stat-note'), '口径注记必须写明精英组倍率段').toContainText('精英组倍率');

      assertNoErrors();
    },
  );

  test(
    '/monster/<id>：出没样本按关卡语境合成实战面板（Π精英组 = 自身组 × 关卡指派组）',
    { tag: '@viewport-independent' },
    async ({ page }) => {
      const { assertNoErrors } = collectConsoleIssues(page);
      /* ADR 0050：样本面板 = 基准 × 修饰比 × (自身精英组 × 关卡精英组) × 曲线[关卡难度组][关卡等级] + 修正值。
         期望值由 payload + 双共享表独立折算；目标条目从数据派生（第一个带完整语境的样本）。 */
      const elite = readJson<Record<string, Record<string, number>>>('public/data/cn/monster-elite-group.json');
      const curve = readJson<Record<string, Record<string, Record<string, number>>>>('public/data/cn/monster-level-curve.json');
      const entry = readJson<{ id: number; name: string }[]>('public/data/cn/monsters.json')
        .map((m) => ({ m, mon: detailOf(m.id) }))
        .find(({ mon }) => (mon.appearances?.samples ?? []).some(
          (s) => s.level != null && s.elite_group != null && curve[String(s.level_group ?? 1)]?.[String(s.level)],
        ));
      expect(entry, '应有样本带完整关卡语境的目录条目（断言前提）').toBeTruthy();
      const { m: entryMeta, mon } = entry!;
      const sample = mon.appearances!.samples.find(
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
      /* 期望值全部数据派生：挑第一只带 `event` 的目录条目，断言备注里的活动名、档位数与页签
         都来自详情 payload；再挑一只没有 `event` 的，断言该块整块不渲染。 */
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
      /* 活动内关卡数只在**与上方总数不同**时才写（相同＝信息重复，此时改说「全部关卡都在…」） */
      if (ev.count === detailOf(target!.id).appearances?.total) {
        expect(text, '数量与总数相同时不重复报数').toContain('全部关卡都在');
        expect(text, '数量与总数相同时不重复报数').not.toContain(`${ev.count} 个`);
      } else {
        expect(text, '活动内关卡数来自源关卡引用次数').toContain(`其中 ${ev.count} 个`);
      }
      expect(text, '等级区间单档时只写一个数').not.toMatch(/等级 (\d+)–\1/);
      for (const tab of ev.tabs) expect(text, `页签「${tab}」来自源 ActivityQuestRewardData`).toContain(tab);

      /* 美术复用（ADR 0048）：口径按转换器给的 `art_shared` 两个维度走，且**禁止**声称站点证不了的
         「技能组复用」（旧文案的过度断言：实测 26/42 个活动敌人的技能集与同伴不同）。 */
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

      /* 期望值全部数据派生：图鉴族 = 官方 TemplateGroupID 的同组形态，**排除同卡面的档位**
         （那些已由上方「同族变体」列出，两处不得重复列同一批卡）。 */
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

      /* 反向：同组全为同卡面档位的怪 → 该行整块不渲染（否则与同族变体条重复列同一批卡） */
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
      /* 归属是命名约定桥（`MonsterStatusConfig.ModifierName` 含怪物配置名 + 去形态后缀同名），
         不是外键 ⇒ 数据里只有「安全子集」；期望值仍全部从详情 payload 派生。
         取第一只有词条的目录条目（测试成本：按 id 升序读若干详情文件，通常前几十条即命中）。 */
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
        // 图标位占位：状态图标资源双侧 404，先占住格子（图标入库后换成 <img>）
        iconSlot: Boolean(el.querySelector('.nk-mob-status__icon svg')),
      })));
      rows.forEach((s, i) => {
        expect(rendered[i].name, `第 ${i + 1} 条词条名`).toBe(s.name);
        expect(rendered[i].type, `${s.name} 的类型标签`).toBe(TYPE[s.type] || s.type || '其他');
        expect(rendered[i].dispel, `${s.name} 的可驱散标记`).toBe(Boolean(s.dispel));
        expect(rendered[i].iconSlot, `${s.name} 的图标位占位符`).toBe(true);
        // 描述按「无占位符才落」的规则走：有源文本就该有渲染文本（且不含未替换的占位符残留）
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
      /* 断言前提由数据派生：实测 215/632 个目录模板的技能带附带效果（937 次引用），
         这里取其中一个（1004014 的「无望冽风 / 逃无可逃」）；数据若变，下面的前提断言先红。 */
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
        // 描述经 fmtDesc 渲染（#N[i] 已被参数替换），故只断言「有源文本就该有渲染文本」
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
      /* 样本 chip 的名字必须逐项等于数据：活动关卡的名来自活动表（ADR 0046），
         不是 `StageConfig.StageName` 的活动级常量——写成别的一律红。名字挂在
         `.nk-mob-appear__sample-name` 上（chip 内还有 ADR 0050 的关卡面板行）。 */
      const chips = page.locator('.nk-mob-appear__sample');
      await expect(chips, '样本 chip 数 = 数据样本数').toHaveCount(dropMon.appearances!.samples.length);
      expect(
        (await page.locator('.nk-mob-appear__sample .nk-mob-appear__sample-name').allTextContents()).map((t) => t.trim()),
        '样本名逐项与数据一致（顺序同 DOM；活动关卡为「活动名 · 关卡名」）',
      ).toEqual(dropMon.appearances!.samples.map(sampleLabel));

      /* 活动关卡与终局/入口/强敌表（ADR 0046 / 0047）：以用户报过的 1004015（托帕幻象，星天演武仪典）
         为回归哨——它的 14 个关卡在 `StageConfig` 里共用同一个 `StageName`「承露天人」（同活动里的
         另一只敌人），若有人把名称来源退回 `StageConfig.StageName`，这里会读出「承露天人」。 */
      const festMon = detailOf(1004015);
      await page.goto('/monster/1004015');
      await expect(page.locator('.nk-mob-hero__name')).toBeVisible();
      const festNames = (await page.locator('.nk-mob-appear__sample .nk-mob-appear__sample-name').allTextContents()).map((t) => t.trim());
      expect(festNames, '活动关卡样本名逐项与数据一致').toEqual(festMon.appearances!.samples.map(sampleLabel));
      expect(festNames, '活动级常量 StageName 不得作为关卡名上屏').not.toContain('承露天人');
      expect(festNames[0], '活动链样本名应带「活动名 · 关卡名」前缀').toMatch(/^星天演武仪典 · /);

      /* 回归哨（ADR 0047）：**自己名字不得作为关卡名上屏**。取用户报过的 1003011（银鬃尉官（错误））
         与 1003012（银鬃尉官（完整））——它们的关卡全在 VerseSimulation / RogueChallengeActivity，
         源里没有玩家可见关卡名，`StageConfig.StageName` 只是敌方标识（1003011 那条与自己的名字逐字相同，
         1003012 那条是另一只怪的名字）。若有人把名称来源退回 StageName，这两条断言立刻红。 */
      for (const id of [1003011, 1003012]) {
        const mon = detailOf(id);
        expect(mon.appearances!.total, `${id} 应有出没计数（断言前提）`).toBeGreaterThan(0);
        expect(mon.appearances!.samples.map((s) => s.name), `${id} 数据里不得出现自己名字`).not.toContain(mon.name);
        await page.goto(`/monster/${id}`);
        await expect(page.locator('.nk-mob-hero__name')).toBeVisible();
        const chipNames = (await page.locator('.nk-mob-appear__sample .nk-mob-appear__sample-name').allTextContents()).map((t) => t.trim());
        expect(chipNames, `${id} 自己名字不得上屏`).not.toContain(mon.name);
        expect(chipNames, `${id} chip 逐项等于数据`).toEqual(mon.appearances!.samples.map(sampleLabel));
      }

      /* 数据派生的一遍补充：任取一个「total>0 且 samples 为空」的目录条目，chips 区整块不渲染、
         计数照旧、说明行说清「没有关卡名」（与上面两条硬编码哨互不替代：这条跟着数据走，哨跟着规则走）。 */
      const noChipId = readJson<MonsterListEntry[]>('public/data/cn/monsters.json')
        .slice(0, 120)
        .map((m) => m.id)
        .find((id) => {
          const a = detailOf(id).appearances;
          return !!a && a.total > 0 && a.samples.length === 0;
        });
      expect(noChipId, '应有「有计数、无样本」的目录条目（断言前提）').toBeTruthy();
      const noChipMon = detailOf(noChipId!);
      await page.goto(`/monster/${noChipId}`);
      await expect(page.locator('.nk-mob-hero__name')).toBeVisible();
      await expect(page.locator('.nk-mob-appear__count strong')).toHaveText(String(noChipMon.appearances!.total));
      await expect(page.locator('.nk-mob-appear__sample'), '无实名源的关卡不得产出 chip').toHaveCount(0);
      await expect(
        page.locator('.nk-mob-appear__tip'),
        '无样本时必须说明「游戏内没有关卡名」，不能用沉默代替口径',
      ).toContainText('没有关卡名');

      /* 额外阶段：只渲染与本体现值不同的阶段（实测 48 条阶段行里 36 条与本体逐字相同），
         故期望值也要按同一判据从数据派生，而不是 `phases.length`。 */
      const phaseId = 3025010;
      const phaseMon = detailOf(phaseId);
      const sig = (weak: string[], resist: Record<string, number>): string => JSON.stringify([
        [...(weak || [])].sort(),
        Object.entries(resist || {}).sort(([a], [b]) => a.localeCompare(b)),
      ]);
      const baseSig = sig(phaseMon.weak, phaseMon.resist);
      const expectPhases = (phaseMon.phases || []).filter((p) => sig(p.weak, p.resist) !== baseSig);
      expect(expectPhases.length, `${phaseId} 应有与本体现值不同的阶段（断言前提）`).toBeGreaterThan(0);

      await page.goto(`/monster/${phaseId}`);
      await expect(page.locator('.nk-mob-hero__name')).toBeVisible();
      const blocks = page.locator('.nk-mob-phase');
      await expect(blocks, '仅渲染与本体现值不同的阶段').toHaveCount(expectPhases.length);
      expect(await blocks.evaluateAll((els) => els.map((el) => (el.querySelector('.nk-mob-phase__no')?.textContent || '').trim())))
        .toEqual(expectPhases.map((p) => `阶段 ${p.phase_id}`));
      // 取阶段块**第一行**（韧性弱点）的图标；直接查块内所有 tags 会把下面的抗性行也算进来
      const firstWeak = await blocks.first().evaluate((el) => {
        const row = el.querySelector('.nk-mob-resist__row');
        return [...(row?.querySelectorAll('.nk-mob-resist__tags img') ?? [])]
          .map((i) => (i.getAttribute('src') || '').split('/').pop() || '');
      });
      expect(firstWeak, '阶段弱点的元素图标逐项与数据一致').toEqual(
        expectPhases[0].weak.map((e) => `${e.toLowerCase()}.webp`),
      );

      assertNoErrors();
    },
  );

  test(
    '/monster/<id>：技能参数行与 ParamList 逐值一致（/ 分隔；描述引用与否都展示）',
    { tag: '@viewport-independent' },
    async ({ page }) => {
      const { assertNoErrors } = collectConsoleIssues(page);
      /* 判据与页面同式：param_list 非空即出参数行——描述里 #N 已展开的技能也重复展示
         （重复供对照，缺行更困惑）。2023030 四个技能带参数、一个空数组；
         2004013 混有描述带 #1[i] 的「压迫」（值已展开进文本，行照出）。 */
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
        // 弱点图标：元素图标名即属性小写（数据源 StanceWeakList 逐项、保序）
        expect(card!.weakIcons, `${m.id} 的卡面弱点图标`).toEqual(
          (m.weak ?? []).map((e) => `${e.toLowerCase()}.webp`),
        );
        // 同名同图的卡靠 title 才能落全「弱点/分类/阵营/档位」（触屏上尤其如此）
        expect(card!.title).toContain(m.name);
        expect(card!.title).toContain(`变体 ${i + 1}/${fam.length}`);
      });

      assertNoErrors();
    },
  );
});
