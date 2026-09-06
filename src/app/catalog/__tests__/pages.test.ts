/**
 * 目录页配置注册表行为测试
 * 验证所有注册的 CatalogPageConfig 均满足引擎契约：
 * - id 唯一且与注册 key 一致
 * - renderCard 函数存在且返回字符串
 * - filters / buildFilters 字段结构合法
 * - （数据驱动）filter.key 与 option.val 在真实转换数据上可命中（stringly-typed 契约锁）
 */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { CATALOG_PAGES } from '../pages';
import type { CatalogFilter } from '../types';
import { modeDefaultArtUrl, seasonBannerUrl, seasonThemeIconUrl, seasonPosterTabUrl, seasonHeroBgUrl } from '../pages/endgame';

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

/** 数据 URL → 本地文件绝对路径（Vite 静态根为 public/：URL /data/... 对应 public/data/...；
 *  正斜杠拼接即可，Node fs 在 Windows 亦兼容） */
function urlToFsPath(url: string): string {
  let pathname = url;
  try {
    pathname = new URL(url).pathname;
  } catch {
    /* 相对路径原样处理 */
  }
  const p = decodeURIComponent(pathname).replace(/^\/+/, '').replace(/\\/g, '/');
  const rel = p.startsWith('data/') ? `public/${p}` : p;
  return `${process.cwd()}/${rel}`;
}

/** 复刻 CatalogPage 的筛选匹配语义：item[key] 为数组按元素匹配，否则字符串严格相等 */
function matchesFilter(item: Record<string, unknown>, key: string, val: string): boolean {
  const cur = item[key];
  if (cur == null) return false;
  if (Array.isArray(cur)) return cur.map(String).includes(val);
  return String(cur) === val;
}

describe('CATALOG_PAGES registry', () => {
  it('should register at least one page', () => {
    expect(entries.length).toBeGreaterThan(0);
  });

  it('all ids are unique', () => {
    const ids = entries.map(([, cfg]) => cfg.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('each config id matches its registry key', () => {
    for (const [key, cfg] of entries) {
      expect(cfg.id, `key "${key}" should match config.id`).toBe(key);
    }
  });

  it('each config has required string fields', () => {
    for (const [key, cfg] of entries) {
      expect(cfg.title, `${key}.title`).toBeTruthy();
      expect(typeof cfg.title).toBe('string');
      expect(typeof cfg.searchPlaceholder).toBe('string');
    }
  });
});

describe('renderCard', () => {
  it('every config exposes renderCard as a function', () => {
    for (const [key, cfg] of entries) {
      expect(typeof cfg.renderCard, `${key}.renderCard`).toBe('function');
    }
  });

  it('renderCard returns a non-empty HTML string for a minimal item', () => {
    const stub = { name: 'Test', href: '/test' };
    for (const [key, cfg] of entries) {
      const html = cfg.renderCard(stub, 0);
      expect(typeof html, `${key}.renderCard return type`).toBe('string');
      expect(html.length, `${key}.renderCard should produce non-empty html`).toBeGreaterThan(0);
    }
  });

  it('endgame renderCard 输出紧凑赛季行（玩法图标+编号+名称+状态+日期），不含完整档案行徽章', () => {
    const egPage = CATALOG_PAGES.endgame;
    const item = { name: '琥珀恩赐', href: '/endgame/maze/101', mode: 'maze', id: 'ID 101', status: '进行中', dateRange: '2023.01.01 – 01.15' };
    const html = egPage.renderCard(item, 0);
    expect(html).toContain('nk-eg-lrow');
    // 玩法级默认图标（modeDefaultArtUrl＝模式筛选项同款 Img1-4）
    expect(html).toContain('nk-eg-lrow__icon');
    expect(html).toContain('ChallengeBossQuestTabImg1.png');
    expect(html).toContain('№ 101');
    expect(html).toContain('琥珀恩赐');
    expect(html).toContain('进行中');
    expect(html).toContain('2023.01.01 – 01.15');
    // 紧凑行去掉完整档案行的徽章/增益/敌方，仅图标+编号+名称+状态+日期
    expect(html).not.toContain('nk-eg-card__perm');
    expect(html).not.toContain('nk-eg-card__test');
    expect(html).not.toContain('nk-eg-card__tier');
  });

  it('endgame renderColumns 按玩法分列（每列一玩法，列头含徽记/名称/英文/数量，列内次序保持）', () => {
    const egPage = CATALOG_PAGES.endgame;
    const items = [
      { name: '永屹之城遗秘', href: '/endgame/maze/100', mode: 'maze', id: 'ID 100', status: '进行中' },
      { name: '琥珀恩赐', href: '/endgame/maze/101', mode: 'maze', id: 'ID 101', status: '测试期' },
      { name: '游辞漫说', href: '/endgame/story/2001', mode: 'story', id: 'ID 2001' },
    ];
    const colHtml = egPage.renderColumns!(items, (it, i) => egPage.renderCard(it, i));
    // 两列（maze/story），各带列头中文名 + 英文名 + 数量
    expect(colHtml).toContain('nk-eg-col');
    expect(colHtml).toContain('忘却之庭');
    expect(colHtml).toContain('FORGOTTEN HALL');
    expect(colHtml).toContain('2');
    expect(colHtml).toContain('虚构叙事');
    expect(colHtml).toContain('PURE FICTION');
    expect(colHtml).toContain('1');
    // 列内保持传入次序（最新在前由 fetchData 排序保证）
    expect(colHtml.indexOf('琥珀恩赐')).toBeGreaterThan(colHtml.indexOf('永屹之城遗秘'));
  });
});

describe('filters validity', () => {
  function assertFiltersValid(filters: CatalogFilter[], key: string) {
    expect(Array.isArray(filters), `${key}.filters should be array`).toBe(true);
    for (const f of filters) {
      expect(typeof f.key, `${key} filter.key`).toBe('string');
      expect(f.key.length).toBeGreaterThan(0);
      expect(typeof f.label, `${key} filter.label`).toBe('string');
      expect(f.label.length).toBeGreaterThan(0);
      expect(Array.isArray(f.options), `${key} filter.options`).toBe(true);
      for (const opt of f.options) {
        expect(typeof opt.val, `${key} option.val`).toBe('string');
        expect(typeof opt.label, `${key} option.label`).toBe('string');
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

  it('buildFilters (if present) is a function', () => {
    for (const [key, cfg] of entries) {
      if (cfg.buildFilters !== undefined) {
        expect(typeof cfg.buildFilters, `${key}.buildFilters`).toBe('function');
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
  /* 读入真实转换数据（public/data/cn）跑 fetchData，把「filter.key 能命中字段」的
   * stringly-typed 契约固化为回归闸门：目录配置与数据演化（如新增/改名字段）一旦漂移即报错。 */
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
    // maze：场景背景
    expect(seasonHeroBgUrl({ background: 'SpriteOutput/Abyss/UI3D_SceneBg/AbyssSenceBg_01.png' }))
      .toBe(`${BASE}/abyss/ui3d_scenebg/AbyssSenceBg_01.png`);
    // story：海报背景
    expect(seasonHeroBgUrl({ theme_bg: 'SpriteOutput/ChallengeTheme/ThemeBg/ChallengeThemeBg_2001.png' }))
      .toBe(`${BASE}/challengetheme/themebg/ChallengeThemeBg_2001.png`);
    // peak：图鉴横幅
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
