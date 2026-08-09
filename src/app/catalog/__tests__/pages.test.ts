/**
 * 目录页配置注册表行为测试
 * 验证所有注册的 CatalogPageConfig 均满足引擎契约：
 * - id 唯一且与注册 key 一致
 * - renderCard 函数存在且返回字符串
 * - filters / buildFilters 字段结构合法
 */
import { describe, it, expect } from 'vitest';
import { CATALOG_PAGES } from '../pages';
import type { CatalogFilter } from '../types';
import { tabIconUrl, seasonArtUrl, seasonBannerUrl, seasonThemeIconUrl, seasonPosterTabUrl } from '../pages/endgame';

const entries = Object.entries(CATALOG_PAGES);

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

describe('endgame 图标 URL（白名单 + 玩法级默认兜底）', () => {
  const BASE = 'https://cdn.jsdelivr.net/gh/umaichanuwu/StarRailTextures@2a4b9a7eb7ac9db7f48d627fa5cdfd3822c902ce/assets/asbres/spriteoutput';

  it('tabIconUrl 解析白名单前缀（目录段小写、文件名保留）', () => {
    expect(tabIconUrl({ tab: 'SpriteOutput/TabIcon/Abyss/ChallengeBossTabIcon_3001.png' }))
      .toBe(`${BASE}/tabicon/abyss/ChallengeBossTabIcon_3001.png`);
    expect(tabIconUrl({ tab: 'SpriteOutput/ChallengePeak/ChallengePeakIcon_4001.png' }))
      .toBe(`${BASE}/challengepeak/ChallengePeakIcon_4001.png`);
    expect(tabIconUrl({ tab: 'SpriteOutput/UI/ChallengeBoss/ChallengeBossQuestTabImg1.png' }))
      .toBe(`${BASE}/ui/challengeboss/ChallengeBossQuestTabImg1.png`);
  });

  it('tabIconUrl 拒绝白名单外路径（忘却之庭 AbyssSwitch 共用开关图）', () => {
    expect(tabIconUrl({ tab: 'SpriteOutput/UI/Abyss/Process/TypeIcon/AbyssSwitchW01_Off.png' })).toBe('');
    expect(tabIconUrl(null)).toBe('');
    expect(tabIconUrl({})).toBe('');
  });

  it('seasonArtUrl 优先赛季专属，缺失回退玩法级默认', () => {
    const dflt = 'SpriteOutput/UI/ChallengeBoss/ChallengeBossQuestTabImg2.png';
    // 有赛季专属 → 用专属
    expect(seasonArtUrl({ tab: 'SpriteOutput/TabIcon/Abyss/ChallengeThemeTabIcon_2001.png', default: dflt }))
      .toBe(`${BASE}/tabicon/abyss/ChallengeThemeTabIcon_2001.png`);
    // 专属不匹配白名单 → 回退玩法级默认
    expect(seasonArtUrl({ tab: 'SpriteOutput/UI/Abyss/Process/TypeIcon/AbyssSwitchW01_Off.png', default: dflt }))
      .toBe(`${BASE}/ui/challengeboss/ChallengeBossQuestTabImg2.png`);
    // 两者皆无 → 空串
    expect(seasonArtUrl(null)).toBe('');
    expect(seasonArtUrl({})).toBe('');
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
    expect(seasonPosterTabUrl({ poster_tab: 'SpriteOutput/Abyss/UI3D_SceneBg/AbyssSenceBg_01.png' })).toBe('');
    expect(seasonPosterTabUrl(null)).toBe('');
  });
});
