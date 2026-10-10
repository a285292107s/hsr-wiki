import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { CATALOG_PAGES } from '../pages';
import type { CatalogFilter } from '../types';
import { bySeasonDesc, mazeDateRange, modeDefaultArtUrl, seasonBannerUrl, seasonThemeIconUrl, seasonPosterTabUrl, seasonHeroBgUrl } from '../pages/endgame';
import cnMessages from '../../../lib/i18n/messages/cn.json';

/** cn 词典键集合：筛选器的 `labelKey` 必须在这里（打错字立刻红）。 */
const CN_KEYS = new Set(Object.keys(cnMessages));

/* ─── node 内建类型 shim（app tsconfig 无 @types/node；测试运行时由 vitest/node 提供） ─── */
declare const process: { cwd(): string };

const entries = Object.entries(CATALOG_PAGES);

/* ─── 数据驱动筛选契约工具（真实转换数据） ───
 * fetch 经全局 stub 落到 public/data/cn 本地文件（happy-dom FileReader 读取），不触发网络。 */

/** 读取本地文件为文本（fs/promises 经变量传递规避静态模块解析；happy-dom FileReader 解码） */
async function readLocalText(filePath: string): Promise<string> {
  const fsp = (await import('node:fs/promises' as string)) as { readFile(p: string): Promise<Uint8Array> };
  const data = await fsp.readFile(filePath);
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    // Uint8Array 可能带 ArrayBufferLike 泛型，Blob 构造仅接受 ArrayBuffer 视图 → 显式收窄
    reader.readAsText(new Blob([data as unknown as BlobPart]));
  });
}

function urlToFsPath(url: string): string {
  let pathname = url;
  try {
    pathname = new URL(url).pathname;
  } catch {
  }
  const p = decodeURIComponent(pathname).replace(/^\/+/, '').replace(/\\/g, '/');
  const rel = p.startsWith('data/') ? `public/${p}` : p;
  return `${process.cwd()}/${rel}`;
}

function matchesFilter(item: Record<string, unknown>, key: string, val: string): boolean {
  const cur = item[key];
  if (cur == null) return false;
  if (Array.isArray(cur)) return cur.map(String).includes(val);
  return String(cur) === val;
}

describe('renderCard', () => {
  it('endgame renderCard 输出紧凑赛季行（玩法图标+编号+名称+状态+日期），不含完整档案行徽章', () => {
    const egPage = CATALOG_PAGES.endgame;
    const item = { name: '琥珀恩赐', href: '/endgame/maze/101', mode: 'maze', id: 'ID 101', status: 'live', dateRange: '2023.01.01 – 01.15' };
    const html = egPage.renderCard(item, 0);
    expect(html).toContain('nk-eg-lrow');
    expect(html).toContain('nk-eg-lrow__icon');
    expect(html).toContain('ChallengeBossQuestTabImg1.png');
    expect(html).toContain('№ 101');
    expect(html).toContain('琥珀恩赐');
    expect(html).toContain('进行中');
    expect(html).toContain('2023.01.01 – 01.15');
    expect(html).not.toContain('nk-eg-card__perm');
    expect(html).not.toContain('nk-eg-card__test');
    expect(html).not.toContain('nk-eg-card__tier');
  });

  it('endgame renderCard 把「贪饕污染」徽标挂在赛季名之后（不进状态/日期行）', () => {
    const egPage = CATALOG_PAGES.endgame;
    const base = { name: '琥珀恩赐', href: '/endgame/maze/101', mode: 'maze', id: 'ID 101', status: 'live', dateRange: '2023.01.01 – 01.15' };
    const html = egPage.renderCard({ ...base, pollution: { count: 2, levels: [1, 2] } }, 0);
    expect(html).toContain('贪饕污染');
    expect(html).not.toContain('含污染');
    // 徽标紧贴赛季名（同一 head 行内），且整段位于 __meta（状态 + 日期）之前
    expect(html).toContain('<span class="nk-eg-lrow__name">琥珀恩赐</span><span class="nk-eg-lrow__poll"');
    expect(html.indexOf('nk-eg-lrow__poll')).toBeLessThan(html.indexOf('nk-eg-lrow__meta'));
    // 无污染不落徽标，日期行照旧
    const plain = egPage.renderCard(base, 0);
    expect(plain).not.toContain('nk-eg-lrow__poll');
    expect(plain).toContain('2023.01.01 – 01.15');
  });

  it('endgame renderColumns 按玩法分列（每列一玩法，列头含徽记/名称/英文/数量，列内次序保持）', () => {
    const egPage = CATALOG_PAGES.endgame;
    const items = [
      { name: '永屹之城遗秘', href: '/endgame/maze/100', mode: 'maze', id: 'ID 100', status: 'live' },
      { name: '琥珀恩赐', href: '/endgame/maze/101', mode: 'maze', id: 'ID 101', status: 'weird' },
      { name: '游辞漫说', href: '/endgame/story/2001', mode: 'story', id: 'ID 2001' },
    ];
    const colHtml = egPage.renderColumns!(items, (it, i) => egPage.renderCard(it, i));
    expect(colHtml).toContain('nk-eg-col');
    expect(colHtml).toContain('忘却之庭');
    expect(colHtml).toContain('FORGOTTEN HALL');
    expect(colHtml).toContain('2');
    expect(colHtml).toContain('虚构叙事');
    expect(colHtml).toContain('PURE FICTION');
    expect(colHtml).toContain('1');
    expect(colHtml.indexOf('琥珀恩赐')).toBeGreaterThan(colHtml.indexOf('永屹之城遗秘'));
  });
});

describe('filters validity', () => {
  function assertFiltersValid(filters: CatalogFilter[], key: string) {
    expect(Array.isArray(filters), `${key}.filters should be array`).toBe(true);
    for (const f of filters) {
      expect(typeof f.key, `${key} filter.key`).toBe('string');
      expect(f.key.length).toBeGreaterThan(0);
      /* 文案两种来源：词典键（界面自造，须在 cn 词典里）或数据派生 label（已本地化）。
         两边都空 = 筛选器没有可显示的名字；`labelKey` 打错字这里立刻红。 */
      const hasLabel = typeof f.label === 'string' && f.label.length > 0;
      const hasKey = typeof f.labelKey === 'string' && f.labelKey.length > 0;
      expect(hasLabel || hasKey, `${key} filter 必须有 label 或 labelKey`).toBe(true);
      if (hasKey) expect(CN_KEYS.has(f.labelKey!), `${key} filter.labelKey ${f.labelKey} 应在 cn 词典里`).toBe(true);
      expect(Array.isArray(f.options), `${key} filter.options`).toBe(true);
      for (const opt of f.options) {
        expect(typeof opt.val, `${key} option.val`).toBe('string');
        const optLabel = typeof opt.label === 'string' && opt.label.length > 0;
        const optKey = typeof opt.labelKey === 'string' && opt.labelKey.length > 0;
        expect(optLabel || optKey, `${key} option ${opt.val} 必须有 label 或 labelKey`).toBe(true);
        if (optKey) {
          expect(CN_KEYS.has(opt.labelKey!), `${key} option.labelKey ${opt.labelKey} 应在 cn 词典里`).toBe(true);
        }
      }
    }
  }

  it('static filters (if present) have valid structure', () => {
    for (const [key, cfg] of entries) {
      if (cfg.filters !== undefined) {
        assertFiltersValid(cfg.filters, key);
      }
    }
  });

  it('buildFilters returns valid filters given stub data', () => {
    const stubData = [
      { name: 'A', element: 'fire', path: 'Destruction', rarity: 5, subType: 'Material', quality: 'gold', cat: 'offense' },
      { name: 'B', element: 'ice', path: 'Preservation', rarity: 4, subType: 'AvatarExp', quality: 'silver', cat: 'defense' },
    ];
    for (const [key, cfg] of entries) {
      if (cfg.buildFilters) {
        const result = cfg.buildFilters(stubData);
        assertFiltersValid(result, `${key}.buildFilters()`);
      }
    }
  });
});

describe('data-driven filter contract (real data)', () => {
  beforeAll(() => {
    vi.stubGlobal('fetch', async (input: unknown) => {
      const url = input instanceof URL ? input.href : String(input);
      const text = await readLocalText(urlToFsPath(url));
      return { ok: true, status: 200, text: async () => text };
    });
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  it('every filter.key resolves on real fetchData items', async () => {
    for (const [key, cfg] of entries) {
      if (!cfg.fetchData) continue;
      const items = await cfg.fetchData({ version: '' });
      expect(items.length, `${key} 应产出非空数据`).toBeGreaterThan(0);
      const filters = cfg.buildFilters ? cfg.buildFilters(items) : (cfg.filters || []);
      for (const f of filters) {
        const hits = items.filter((it) => it[f.key] !== undefined && it[f.key] !== null);
        expect(hits.length, `${key}.${f.key} 应在真实数据上命中字段`).toBeGreaterThan(0);
      }
    }
  }, 30000);

  it('every non-empty option.val matches at least one item', async () => {
    for (const [key, cfg] of entries) {
      if (!cfg.fetchData) continue;
      const items = await cfg.fetchData({ version: '' });
      const filters = cfg.buildFilters ? cfg.buildFilters(items) : (cfg.filters || []);
      for (const f of filters) {
        for (const opt of f.options) {
          if (!opt.val) continue;
          const hits = items.filter((it) => matchesFilter(it as unknown as Record<string, unknown>, f.key, opt.val));
          expect(hits.length, `${key}.${f.key} 选项 "${opt.label}"(${opt.val}) 应至少命中一条数据`)
            .toBeGreaterThan(0);
        }
      }
    }
  }, 30000);

  it('endgame 赛季排序：单边排期参与排序，当期赛季不沉底（ADR 0038 回归）', async () => {
    const cfg = CATALOG_PAGES.endgame;
    if (!cfg.fetchData) return;
    const items = await cfg.fetchData({ version: '' });
    const maze = items.filter((it) => it.mode === 'maze');
    const pos = (id: string) => maze.findIndex((it) => it.id === id);
    // 1036（开始端 2026-11-02）与 1035（仅结束端 2026-11-02）同日 → 开始端在前
    expect(pos('ID 1036')).toBeLessThan(pos('ID 1035'));
    // 1035（结束端 2026-11-02）与 1034（仅开始端 2026-08-17）都新于 1033（开始 2026-07-06）
    expect(pos('ID 1035')).toBeLessThan(pos('ID 1033'));
    expect(pos('ID 1034')).toBeLessThan(pos('ID 1033'));
    expect(pos('ID 1034')).toBeGreaterThan(pos('ID 1035'));
  });
});

describe('endgame 赛季排序与日期区间（ADR 0038）', () => {
  const item = (id: string, liveBegin?: string, liveEnd?: string) => ({ id, name: id, liveBegin, liveEnd });

  it('bySeasonDesc：排序键取首个已知端点，同日开始端在前，无日期按编号降序沉底', () => {
    const scrambled = [
      item('ID 900'),                                     // 常驻，无日期
      item('ID 1033', '2026-07-06 04:00:00', '2026-08-17 04:00:00'),
      item('ID 1035', undefined, '2026-11-02 04:00:00'),  // 当期：仅结束端
      item('ID 100'),                                     // 常驻，无日期
      item('ID 1036', '2026-11-02 04:00:00'),             // 未来赛季：开始端与 1035 结束端同日
      item('ID 1034', '2026-08-17 04:00:00'),             // 上期：仅开始端
    ];
    expect([...scrambled].sort(bySeasonDesc).map((it) => it.id))
      .toEqual(['ID 1036', 'ID 1035', 'ID 1034', 'ID 1033', 'ID 900', 'ID 100']);
  });

  it('mazeDateRange：单边日期各取已知端（仅结束端渲染 – 截止日）', () => {
    expect(mazeDateRange({ live_begin: '2026-08-17 04:00:00', live_end: '' })).toBe('2026.08.17 –');
    expect(mazeDateRange({ live_begin: '', live_end: '2026-11-02 04:00:00' })).toBe('– 2026.11.02');
    expect(mazeDateRange({ live_begin: '', live_end: '' })).toBe('');
  });
});

describe('endgame 图标 URL（白名单 + 玩法级默认兜底）', () => {
  const BASE = 'https://cdn.jsdelivr.net/gh/a285292107s/StarRailTextures@main/assets/asbres/spriteoutput';

  it('modeDefaultArtUrl 四模式统一用玩法级默认图标（Img1-4，抛弃每季页签图）', () => {
    expect(modeDefaultArtUrl('maze')).toBe(`${BASE}/ui/challengeboss/ChallengeBossQuestTabImg1.png`);
    expect(modeDefaultArtUrl('story')).toBe(`${BASE}/ui/challengeboss/ChallengeBossQuestTabImg2.png`);
    expect(modeDefaultArtUrl('boss')).toBe(`${BASE}/ui/challengeboss/ChallengeBossQuestTabImg3.png`);
    // 异相仲裁有人工延展 Img4（ChallengeGeneralConfig 无 Peak 记录，ENDGAME_MODES 兜底）
    expect(modeDefaultArtUrl('peak')).toBe(`${BASE}/ui/challengeboss/ChallengeBossQuestTabImg4.png`);
  });

  it('modeDefaultArtUrl 未知/空模式回退空串', () => {
    expect(modeDefaultArtUrl('unknown')).toBe('');
    expect(modeDefaultArtUrl('')).toBe('');
  });

  it('seasonBannerUrl 解析横幅（DailyMission/Banner），白名单外返回空串', () => {
    expect(seasonBannerUrl({ theme_banner: 'SpriteOutput/DailyMission/Banner/ChallengeThemeBanner_2001.png' }))
      .toBe(`${BASE}/dailymission/banner/ChallengeThemeBanner_2001.png`);
    expect(seasonBannerUrl({ theme_banner: 'SpriteOutput/UI/Abyss/Process/TypeIcon/AbyssSwitchW01_Off.png' })).toBe('');
    expect(seasonBannerUrl(null)).toBe('');
  });

  it('seasonThemeIconUrl 解析主题图标（ChallengeTheme / ChallengeBoss）', () => {
    expect(seasonThemeIconUrl({ theme_icon: 'SpriteOutput/ChallengeTheme/ThemeIcon/ChallengeThemeIcon_2001.png' }))
      .toBe(`${BASE}/challengetheme/themeicon/ChallengeThemeIcon_2001.png`);
    expect(seasonThemeIconUrl({ theme_icon: 'SpriteOutput/ChallengeBoss/ChallengeBossIcon_3001.png' }))
      .toBe(`${BASE}/challengeboss/ChallengeBossIcon_3001.png`);
    expect(seasonThemeIconUrl({})).toBe('');
  });

  it('seasonPosterTabUrl 解析海报页签（Quest/TabIcon）', () => {
    expect(seasonPosterTabUrl({ poster_tab: 'SpriteOutput/Quest/TabIcon/BtnChallengePeak_4001.png' }))
      .toBe(`${BASE}/quest/tabicon/BtnChallengePeak_4001.png`);
    // UI/Abyss 开关图不在白名单（Abyss 前缀仅限场景背景 Abyss/UI3D_SceneBg）
    expect(seasonPosterTabUrl({ poster_tab: 'SpriteOutput/UI/Abyss/Process/TypeIcon/AbyssSwitchW01_Off.png' })).toBe('');
    expect(seasonPosterTabUrl(null)).toBe('');
  });

  it('seasonHeroBgUrl 按模式取唯一大图（background/theme_bg/handbook_banner），白名单外返回空串', () => {
    expect(seasonHeroBgUrl({ background: 'SpriteOutput/Abyss/UI3D_SceneBg/AbyssSenceBg_01.png' }))
      .toBe(`${BASE}/abyss/ui3d_scenebg/AbyssSenceBg_01.png`);
    expect(seasonHeroBgUrl({ theme_bg: 'SpriteOutput/ChallengeTheme/ThemeBg/ChallengeThemeBg_2001.png' }))
      .toBe(`${BASE}/challengetheme/themebg/ChallengeThemeBg_2001.png`);
    expect(seasonHeroBgUrl({ handbook_banner: 'SpriteOutput/DailyMission/Banner/ChallengePeakPanelBanner_4002.png' }))
      .toBe(`${BASE}/dailymission/banner/ChallengePeakPanelBanner_4002.png`);
    // 多字段并存时按 background → theme_bg → handbook_banner 优先级
    expect(seasonHeroBgUrl({ theme_bg: 'SpriteOutput/ChallengeTheme/ThemeBg/A.png', handbook_banner: 'SpriteOutput/DailyMission/Banner/B.png' }))
      .toBe(`${BASE}/challengetheme/themebg/A.png`);
    // boss 无大图 / 白名单外 → 空串
    expect(seasonHeroBgUrl({})).toBe('');
    expect(seasonHeroBgUrl({ background: 'SpriteOutput/UI/Abyss/Process/TypeIcon/AbyssSwitchW01_On.png' })).toBe('');
    expect(seasonHeroBgUrl(null)).toBe('');
  });
});
