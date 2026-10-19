import { afterEach, beforeEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { CDN, setUseOfficialPaths } from '../../lib/constants';
import {
  CDN_STALL_TIMEOUT_MS,
  JS_DELIVR_BASE,
  JS_DELIVR_UI3D_BASE,
  LOCAL_ICONS_BASE,
  NANOKA_HUD,
  cdnFallbackFromPrimary,
  cdnImgFallbackAttr,
  cdnRawUrl,
  cdnUri,
  installCdnImgFallback,
  localFallbackFromPrimary,
  nanokaUrl,
  resetCdnHealthForTest,
  resolveCdnUri,
  startCdnHealthProbe,
} from '../cdn';

beforeAll(() => {
  setUseOfficialPaths(false);
});

const BASE = `${CDN}${NANOKA_HUD}`;

describe('nanokaUrl / cdnUri / cdnRawUrl', () => {
  it('nanokaUrl 按分类子路径拼接 CDN 基址', () => {
    expect(nanokaUrl('skillicons', 'abc.webp')).toBe(`${BASE}/skillicons/abc.webp`);
    expect(nanokaUrl('rank', '1001/1001_Rank_1.webp')).toBe(
      `${BASE}/rank/_dependencies/textures/1001/1001_Rank_1.webp`,
    );
  });

  it('cdnUri 返回首选源（分类已全量本地化 ⇒ 恒为本地主源）', () => {
    expect(cdnUri('bufficon', 'IconBuffAttackUp.webp')).toBe(`${LOCAL_ICONS_BASE}/bufficon/IconBuffAttackUp.webp`);
  });

  it('cdnRawUrl 拼接任意原始子路径（分类子路径不固定的场景）', () => {
    expect(cdnRawUrl('gridfight/equipment/350101.webp')).toBe(`${BASE}/gridfight/equipment/350101.webp`);
  });
});

describe('resolveCdnUri 双源解析', () => {
  it('jsDelivr 注册分类：nanoka 主源 + jsDelivr 旧档回退', () => {
    const r = resolveCdnUri('lightconemediumicon', '23000.webp', { nanoka: 'lightconemediumicon' });
    expect(r.primary).toBe(`${BASE}/lightconemediumicon/23000.webp`);
    expect(r.fallback).toBe(`${JS_DELIVR_BASE}/lightconemediumicon/23000.png`);
    expect(r.source).toBe('nanoka');
  });

  it('monstermiddleicon / monsterfigure（已全量入库）：local-first（怪物图鉴与立绘量大，仍全量随站）', () => {
    expect(resolveCdnUri('monstermiddleicon', 'Monster_1002011.webp')).toEqual({
      primary: `${LOCAL_ICONS_BASE}/monstermiddleicon/Monster_1002011.webp`,
      fallback: `${BASE}/monstermiddleicon/Monster_1002011.webp`,
      source: 'local',
    });
    expect(resolveCdnUri('monsterfigure', 'Monster_1002011.webp')).toEqual({
      primary: `${LOCAL_ICONS_BASE}/monsterfigure/Monster_1002011.webp`,
      fallback: `${BASE}/monsterfigure/Monster_1002011.webp`,
      source: 'local',
    });
  });

  it('avatarshopicon / avatardrawcard（已全量入库）：local-first，本地缺失回退远端主源 nanoka', () => {
    expect(resolveCdnUri('avatarshopicon', '1001.webp')).toEqual({
      primary: `${LOCAL_ICONS_BASE}/avatarshopicon/1001.webp`,
      fallback: `${BASE}/avatarshopicon/1001.webp`,
      source: 'local',
    });
    expect(resolveCdnUri('avatardrawcard', '1001.webp')).toEqual({
      primary: `${LOCAL_ICONS_BASE}/avatardrawcard/1001.webp`,
      fallback: `${BASE}/avatardrawcard/1001.webp`,
      source: 'local',
    });
  });

  it('lightconemediumicon（光锥图标，全量入库）：local-first，本地缺失回退远端主源 nanoka', () => {
    expect(resolveCdnUri('lightconemediumicon', '20000.webp')).toEqual({
      primary: `${LOCAL_ICONS_BASE}/lightconemediumicon/20000.webp`,
      fallback: `${BASE}/lightconemediumicon/20000.webp`,
      source: 'local',
    });
  });

  it('本地图标分类：element / pathicon local-first，本地缺失回退远端主源（nanoka，新增内容仅此源有）', () => {
    expect(resolveCdnUri('element', 'fire.webp')).toEqual({
      primary: `${LOCAL_ICONS_BASE}/element/fire.webp`,
      fallback: `${BASE}/element/fire.webp`,
      source: 'local',
    });
    expect(resolveCdnUri('pathicon', 'priest.webp').fallback).toBe(`${BASE}/pathicon/priest.webp`);
    expect(resolveCdnUri('pathicon', 'elation.webp').fallback).toBe(`${BASE}/pathicon/elation.webp`);
    expect(resolveCdnUri('trace', 'IconAttack.webp')).toEqual({
      primary: `${LOCAL_ICONS_BASE}/trace/IconAttack.webp`,
      fallback: `${JS_DELIVR_BASE}/ui/avatar/icon/IconAttack.png`,
      source: 'local',
    });
    expect(resolveCdnUri('statusimmune', 'IconImmuneFrozen.webp')).toEqual({
      primary: `${LOCAL_ICONS_BASE}/statusimmune/IconImmuneFrozen.webp`,
      fallback: `${JS_DELIVR_BASE}/ui/avatar/icon/IconImmuneFrozen.png`,
      source: 'local',
    });
    expect(localFallbackFromPrimary(`${LOCAL_ICONS_BASE}/statusimmune/IconImmuneFrozen.webp`))
      .toBe(`${JS_DELIVR_BASE}/ui/avatar/icon/IconImmuneFrozen.png`);
  });

  it('/voracity 缺图补入：bufficon / achievement 整分类本地，tutorialpic 白名单 local-first', () => {
    expect(resolveCdnUri('bufficon', 'BuffIcon/Inlevel/IconBuffShield.webp')).toEqual({
      primary: `${LOCAL_ICONS_BASE}/bufficon/BuffIcon/Inlevel/IconBuffShield.webp`,
      fallback: `${BASE}/bufficon/BuffIcon/Inlevel/IconBuffShield.webp`,
      source: 'local',
    });
    expect(resolveCdnUri('bufficon', 'BuffIcon/Inlevel/IconMonster_W5_StageInvasion.webp').source).toBe('local');
    expect(resolveCdnUri('bufficon', 'BuffIcon/Inlevel/IconBuffCommon.webp').source).toBe('local');
    expect(resolveCdnUri('achievement', 'ExploreAchievementIcon_s.webp').source).toBe('local');
    expect(resolveCdnUri('tutorialpic', 'TutorialPic/TutorialPage_1050101.webp').source).toBe('local');
    expect(resolveCdnUri('tutorialpic', 'TutorialPic/TutorialPage_1050202.webp').source).toBe('local');
    expect(resolveCdnUri('tutorialpic', 'TutorialPic/TutorialPage_1000001.webp').source).toBe('nanoka');
    expect(resolveCdnUri('gridfight-affix', 'icon_gridfight_affix_09.webp')).toEqual({
      primary: `${LOCAL_ICONS_BASE}/gridfight-affix/icon_gridfight_affix_09.webp`,
      fallback: `${BASE}/gridfight/battleicon/bufficon/icon_gridfight_affix_09.webp`,
      source: 'local',
    });
    expect(localFallbackFromPrimary(`${LOCAL_ICONS_BASE}/gridfight-affix/icon_gridfight_affix_09.webp`))
      .toBe(`${BASE}/gridfight/battleicon/bufficon/icon_gridfight_affix_09.webp`);
    expect(localFallbackFromPrimary(`${LOCAL_ICONS_BASE}/bufficon/BuffIcon/Inlevel/IconBuffShield.webp`))
      .toBe(`${BASE}/bufficon/BuffIcon/Inlevel/IconBuffShield.webp`);
    expect(localFallbackFromPrimary(`${LOCAL_ICONS_BASE}/tutorialpic/TutorialPic/TutorialPage_1050101.webp`))
      .toBe(`${BASE}/tutorialpic/TutorialPic/TutorialPage_1050101.webp`);
  });

  it('jsDelivr 映射分类：skillicons 主源 nanoka 平铺，回退按角色 id 分目录', () => {
    const r = resolveCdnUri('skillicons', 'SkillIcon_1001_Normal.webp', { nanoka: 'skillicons' });
    expect(r.primary).toBe(`${BASE}/skillicons/SkillIcon_1001_Normal.webp`);
    expect(r.fallback).toBe(`${JS_DELIVR_BASE}/skillicons/avatar/1001/SkillIcon_1001_Normal.png`);
  });

  it('jsDelivr 映射分类：skillicons 回退目录按角色 id（忆灵文件名 id - 10000）', () => {
    const SKILLICONS_REMOTE = { nanoka: 'skillicons' };
    expect(resolveCdnUri('skillicons', 'SkillIcon_11402_Servant01.webp', SKILLICONS_REMOTE).fallback)
      .toBe(`${JS_DELIVR_BASE}/skillicons/avatar/1402/SkillIcon_11402_Servant01.png`);
    expect(resolveCdnUri('skillicons', 'SkillIcon_11402_ServantPassive.webp', SKILLICONS_REMOTE).fallback)
      .toBe(`${JS_DELIVR_BASE}/skillicons/avatar/1402/SkillIcon_11402_ServantPassive.png`);
    expect(resolveCdnUri('skillicons', 'SkillIcon_18007_Servant01.webp', SKILLICONS_REMOTE).fallback)
      .toBe(`${JS_DELIVR_BASE}/skillicons/avatar/8007/SkillIcon_18007_Servant01.png`);
  });

  it('skillicons（技能图标，全量入库）：local-first，本地缺失回退 nanoka 主源', () => {
    expect(resolveCdnUri('skillicons', 'SkillIcon_1001_Normal.webp')).toEqual({
      primary: `${LOCAL_ICONS_BASE}/skillicons/SkillIcon_1001_Normal.webp`,
      fallback: `${BASE}/skillicons/SkillIcon_1001_Normal.webp`,
      source: 'local',
    });
  });

  it('gridfight-equipment / gridfight-icon（已全量入库）：local-first', () => {
    expect(resolveCdnUri('gridfight-equipment', '350101.webp').source).toBe('local');
    expect(resolveCdnUri('gridfight-icon', '1001.webp').source).toBe('local');
  });

  it('jsDelivr 映射分类：rank 星魂图标的 jsDelivr 规则（官方 ui/ui3d/rank，含 Rank3/5 全套）', () => {
    const r = resolveCdnUri('rank', '1403/1403_Rank_3.webp', { nanoka: 'rank/_dependencies/textures' });
    expect(r.primary).toBe(`${BASE}/rank/_dependencies/textures/1403/1403_Rank_3.webp`);
    expect(r.fallback).toBe(`${JS_DELIVR_UI3D_BASE}/ui/ui3d/rank/_dependencies/textures/1403/1403_Rank_3.png`);
    expect(r.source).toBe('nanoka');
    expect(resolveCdnUri('rank', '1510/1510_Rank_6.webp', { nanoka: 'rank/_dependencies/textures' }).fallback)
      .toBe(`${JS_DELIVR_UI3D_BASE}/ui/ui3d/rank/_dependencies/textures/1510/1510_Rank_6.png`);
  });

  it('rank（星魂图标，全量入库）：local-first，本地缺失回退 nanoka 主源', () => {
    expect(resolveCdnUri('rank', '1403/1403_Rank_3.webp')).toEqual({
      primary: `${LOCAL_ICONS_BASE}/rank/1403/1403_Rank_3.webp`,
      fallback: `${BASE}/rank/_dependencies/textures/1403/1403_Rank_3.webp`,
      source: 'local',
    });
  });

  it('jsDelivr 映射分类：monstermiddleicon / relicfigures（套装件不受本地化影响）', () => {
    expect(resolveCdnUri('monstermiddleicon', 'Monster_1002011.webp', { nanoka: 'monstermiddleicon' }).primary)
      .toBe(`${BASE}/monstermiddleicon/Monster_1002011.webp`);
    expect(resolveCdnUri('relicfigures', 'IconRelic_101_1.webp').fallback)
      .toBe(`${JS_DELIVR_BASE}/relicfigures/IconRelic_101_1.png`);
    expect(resolveCdnUri('relicfigures', 'IconRelicBody.webp').source).toBe('local');
    expect(resolveCdnUri('relicfigures', 'IconRelic_101_1.webp').source).toBe('nanoka');
  });

  it('avatarroundicon：全量入库（含 1503 真珠 override），本地缺失回退远端主源', () => {
    expect(resolveCdnUri('avatarroundicon', '1503.webp')).toEqual({
      primary: `${LOCAL_ICONS_BASE}/avatarroundicon/1503.webp`,
      fallback: `${BASE}/avatarroundicon/1503.webp`,
      source: 'local',
    });
    expect(localFallbackFromPrimary(`${LOCAL_ICONS_BASE}/avatarroundicon/1503.webp`))
      .toBe(`${BASE}/avatarroundicon/1503.webp`);
    expect(resolveCdnUri('avatarroundicon', '1502.webp')).toEqual({
      primary: `${LOCAL_ICONS_BASE}/avatarroundicon/1502.webp`,
      fallback: `${BASE}/avatarroundicon/1502.webp`,
      source: 'local',
    });
  });

  it('未注册 jsDelivr 的分类：仅 nanoka 首选，无回退', () => {
    const r = resolveCdnUri('bufficon', 'IconBuffAttackUp.webp', { nanoka: 'bufficon' });
    expect(r.primary).toBe(`${BASE}/bufficon/IconBuffAttackUp.webp`);
    expect(r.fallback).toBe('');
    expect(r.source).toBe('nanoka');
  });

  it('声明 official 但 OFFICIAL_BASE 为空 → 仍走 nanoka（守卫：官方源未启用）', () => {
    const spec = { nanoka: 'bufficon', official: 'bufficon' };
    const r = resolveCdnUri('bufficon', 'IconBuffAttackUp.webp', spec);
    expect(r.source).toBe('nanoka');
    expect(r.primary).toBe(`${BASE}/bufficon/IconBuffAttackUp.webp`);
    expect(r.fallback).toBe('');
  });

  it('声明 official 且 OFFICIAL_BASE 非空 → 官方优先 + nanoka 回退', async () => {
    const OFF_BASE = 'https://official.example/sr';
    vi.doMock('../cdn/base', async () => {
      const actual = await vi.importActual<typeof import('../cdn/base')>('../cdn/base');
      return { ...actual, OFFICIAL_BASE: OFF_BASE };
    });
    vi.resetModules();
    const { resolveCdnUri: resolveWithOfficial } = await import('../cdn/resolve');
    const spec = { nanoka: 'bufficon', official: 'bufficon' };
    const r = resolveWithOfficial('bufficon', 'IconBuffAttackUp.webp', spec);
    expect(r.source).toBe('official');
    expect(r.primary).toBe(`${OFF_BASE}/bufficon/IconBuffAttackUp.webp`);
    expect(r.fallback).toBe(`${BASE}/bufficon/IconBuffAttackUp.webp`);
  });
});

describe('cdnFallbackFromPrimary / cdnImgFallbackAttr（v-html 卡片）', () => {
  it('jsDelivr 主源反查 nanoka 回退（lightconemediumicon）', () => {
    const src = `${JS_DELIVR_BASE}/lightconemediumicon/23000.png`;
    expect(cdnFallbackFromPrimary(src)).toBe(`${BASE}/lightconemediumicon/23000.webp`);
    expect(cdnImgFallbackAttr(src)).toBe(` data-cdn-fallback="${BASE}/lightconemediumicon/23000.webp"`);
  });

  it('jsDelivr 主源反查 nanoka 回退（element 大小写还原）', () => {
    const src = `${JS_DELIVR_BASE}/icondamagetype/IconDamageTypeFire.png`;
    expect(cdnFallbackFromPrimary(src)).toBe(`${BASE}/element/fire.webp`);
  });

  it('jsDelivr 主源反查 nanoka 回退（pathicon 拼写还原）', () => {
    const src = `${JS_DELIVR_BASE}/professioniconmiddle/IconProfessionPirestMiddle.png`;
    expect(cdnFallbackFromPrimary(src)).toBe(`${BASE}/pathicon/priest.webp`);
  });

  it('jsDelivr 主源反查 nanoka 回退（rank 保留 charId 子目录）', () => {
    const src = `${JS_DELIVR_UI3D_BASE}/ui/ui3d/rank/_dependencies/textures/1403/1403_Rank_3.png`;
    expect(cdnFallbackFromPrimary(src)).toBe(`${BASE}/rank/_dependencies/textures/1403/1403_Rank_3.webp`);
  });

  it('nanoka 主源反查 jsDelivr 旧档回退（主源反转后的主路径）', () => {
    expect(cdnFallbackFromPrimary(`${BASE}/lightconemediumicon/23000.webp`))
      .toBe(`${JS_DELIVR_BASE}/lightconemediumicon/23000.png`);
    expect(cdnImgFallbackAttr(`${BASE}/lightconemediumicon/23000.webp`))
      .toBe(` data-cdn-fallback="${JS_DELIVR_BASE}/lightconemediumicon/23000.png"`);
    expect(cdnFallbackFromPrimary(`${BASE}/rank/_dependencies/textures/1403/1403_Rank_3.webp`))
      .toBe(`${JS_DELIVR_UI3D_BASE}/ui/ui3d/rank/_dependencies/textures/1403/1403_Rank_3.png`);
  });

  it('nanoka 主源无 jsDelivr 规则的分类不产生回退', () => {
    expect(cdnFallbackFromPrimary(`${BASE}/bufficon/IconBuffAttackUp.webp`)).toBe('');
  });

  it('nanoka 主源规则不适用（skillicons 文件名无数字）时不产生回退', () => {
    expect(cdnFallbackFromPrimary(`${BASE}/skillicons/abc.webp`)).toBe('');
  });

  it('空串 / 非 CDN 主源无回退', () => {
    expect(cdnFallbackFromPrimary('')).toBe('');
    expect(cdnFallbackFromPrimary('https://example.com/x.webp')).toBe('');
  });

  it('本地主源反查远端回退（localFallbackFromPrimary，回退 = 远端主源 nanoka）', () => {
    expect(localFallbackFromPrimary(`${LOCAL_ICONS_BASE}/element/fire.webp`))
      .toBe(`${BASE}/element/fire.webp`);
    expect(localFallbackFromPrimary(`${LOCAL_ICONS_BASE}/relicfigures/IconRelicBody.webp`))
      .toBe(`${BASE}/relicfigures/IconRelicBody.webp`);
    expect(localFallbackFromPrimary(`${LOCAL_ICONS_BASE}/relicfigures/IconRelic_101_1.webp`)).toBe('');
    expect(localFallbackFromPrimary('https://example.com/x.webp')).toBe('');
    expect(cdnFallbackFromPrimary(`${LOCAL_ICONS_BASE}/element/fire.webp`))
      .toBe(`${BASE}/element/fire.webp`);
    expect(cdnImgFallbackAttr(`${LOCAL_ICONS_BASE}/element/fire.webp`))
      .toBe(` data-cdn-fallback="${BASE}/element/fire.webp"`);
  });

  it('trace（jdPrimary）jsDelivr 主源反查 nanoka 回退属性', () => {
    const src = `${JS_DELIVR_BASE}/ui/avatar/icon/IconAttack.png`;
    expect(cdnFallbackFromPrimary(src)).toBe(`${BASE}/trace/IconAttack.webp`);
    expect(cdnImgFallbackAttr(src)).toBe(` data-cdn-fallback="${BASE}/trace/IconAttack.webp"`);
  });
});

describe('installCdnImgFallback（DOM 副作用）', () => {
  beforeEach(() => {
    resetCdnHealthForTest();
  });
  afterEach(() => {
    resetCdnHealthForTest();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('捕获 <img> 的 error 事件并替换为回退源，仅回退一次；回退源再失败 → 降级 + 占位顶替', () => {
    const off = installCdnImgFallback();
    const img = document.createElement('img');
    img.setAttribute('data-cdn-fallback', 'https://fb.example/x.webp');
    img.src = 'https://primary.example/x.webp';
    document.body.appendChild(img);
    try {
      img.dispatchEvent(new Event('error', { bubbles: true }));
      expect(img.src).toBe('https://fb.example/x.webp');
      expect(img.hasAttribute('data-cdn-fallback')).toBe(false);
      img.dispatchEvent(new Event('error', { bubbles: true }));
      expect(img.dataset.cdnDown).toBe('1');
      expect(img.dataset.cdnSrc).toBe('https://fb.example/x.webp');
      expect(img.getAttribute('src')!.startsWith('data:image/svg+xml,')).toBe(true);
    } finally {
      off();
      img.remove();
    }
  });

  it('无回退属性且首选源（nanoka）失败 → 标记 data-cdn-down 并换占位图形（原 URL 存 dataset.cdnSrc）', () => {
    const off = installCdnImgFallback();
    const img = document.createElement('img');
    img.src = 'https://primary.example/x.webp';
    document.body.appendChild(img);
    try {
      img.dispatchEvent(new Event('error', { bubbles: true }));
      expect(img.dataset.cdnDown).toBe('1');
      expect(img.dataset.cdnPlaceholder).toBe('1');
      expect(img.dataset.cdnSrc).toBe('https://primary.example/x.webp');
      expect(img.getAttribute('src')!.startsWith('data:image/svg+xml,')).toBe(true);
    } finally {
      off();
      img.remove();
    }
  });

  it('已降级 img 在 CDN 恢复后 load 成功 → 清除降级标记（慢响应自愈）', () => {
    const off = installCdnImgFallback();
    const img = document.createElement('img');
    img.setAttribute('data-cdn-noph', '1');
    img.src = 'https://primary.example/x.webp';
    document.body.appendChild(img);
    try {
      img.dispatchEvent(new Event('error', { bubbles: true }));
      expect(img.dataset.cdnDown).toBe('1');
      img.dispatchEvent(new Event('load'));
      expect(img.hasAttribute('data-cdn-down')).toBe(false);
    } finally {
      off();
      img.remove();
    }
  });

  it('占位后组件换上自带兜底源并 load 成功 → 降级态干净退场（无残留标记）', async () => {
    const off = installCdnImgFallback();
    const img = document.createElement('img');
    img.src = 'https://primary.example/x.webp';
    document.body.appendChild(img);
    try {
      img.dispatchEvent(new Event('error', { bubbles: true }));
      expect(img.dataset.cdnPlaceholder).toBe('1');
      img.src = 'https://component-fallback.example/slot-icon.webp';
      img.dispatchEvent(new Event('load'));
      await Promise.resolve();
      expect(img.hasAttribute('data-cdn-down')).toBe(false);
      expect(img.hasAttribute('data-cdn-placeholder')).toBe(false);
      expect(img.dataset.cdnSrc).toBeUndefined();
    } finally {
      off();
      img.remove();
    }
  });

  it('占位后同源重试成功（放行原失败源）→ 降级态退场', async () => {
    const off = installCdnImgFallback();
    const img = document.createElement('img');
    img.src = 'https://primary.example/x.webp';
    document.body.appendChild(img);
    try {
      img.dispatchEvent(new Event('error', { bubbles: true }));
      expect(img.dataset.cdnPlaceholder).toBe('1');
      img.dispatchEvent(new Event('load'));
      img.src = 'https://primary.example/x.webp';
      img.dispatchEvent(new Event('load'));
      await Promise.resolve();
      expect(img.hasAttribute('data-cdn-down')).toBe(false);
      expect(img.hasAttribute('data-cdn-placeholder')).toBe(false);
    } finally {
      off();
      img.remove();
    }
  });

  it('占位后组件换新源又失败 → 允许重新落占位（不因早退而露出可见破图）', async () => {
    const off = installCdnImgFallback();
    const img = document.createElement('img');
    img.src = 'https://primary.example/x.webp';
    document.body.appendChild(img);
    try {
      img.dispatchEvent(new Event('error', { bubbles: true }));
      img.dispatchEvent(new Event('load'));
      expect(img.dataset.cdnPlaceholder).toBe('1');
      img.src = 'https://other.example/y.webp';
      await Promise.resolve();
      expect(img.hasAttribute('data-cdn-down')).toBe(false);
      img.dispatchEvent(new Event('error', { bubbles: true }));
      expect(img.dataset.cdnDown).toBe('1');
      expect(img.dataset.cdnPlaceholder).toBe('1');
      expect(img.getAttribute('src')!.startsWith('data:image/svg+xml,')).toBe(true);
      expect(img.dataset.cdnSrc).toBe('https://other.example/y.webp');
    } finally {
      off();
      img.remove();
    }
  });

  it('data-cdn-noph（组件自带占位 / 有意空图）→ 只标记降级，不换占位图形', () => {
    const off = installCdnImgFallback();
    const img = document.createElement('img');
    img.setAttribute('data-cdn-noph', '1');
    img.src = 'https://primary.example/x.webp';
    document.body.appendChild(img);
    try {
      img.dispatchEvent(new Event('error', { bubbles: true }));
      expect(img.dataset.cdnDown).toBe('1');
      expect(img.getAttribute('src')).toBe('https://primary.example/x.webp');
      expect(img.hasAttribute('data-cdn-placeholder')).toBe(false);
    } finally {
      off();
      img.remove();
    }
  });

  it('本地主源 img 失败：现场反查远端主源回退（不依赖 data-cdn-fallback 属性），远端再失败最终降级', () => {
    const off = installCdnImgFallback();
    const img = document.createElement('img');
    img.src = `${LOCAL_ICONS_BASE}/element/fire.webp`;
    document.body.appendChild(img);
    try {
      img.dispatchEvent(new Event('error', { bubbles: true }));
      expect(img.src).toBe(`${BASE}/element/fire.webp`);
      img.dispatchEvent(new Event('error', { bubbles: true }));
      expect(img.dataset.cdnDown).toBe('1');
      expect(img.dataset.cdnSrc).toBe(`${BASE}/element/fire.webp`);
    } finally {
      off();
      img.remove();
    }
  });

  it('本地主源 img 失败且无远端回退（白名单外）→ 直接降级', () => {
    const off = installCdnImgFallback();
    const img = document.createElement('img');
    img.src = `${LOCAL_ICONS_BASE}/relicfigures/IconRelic_101_1.webp`;
    document.body.appendChild(img);
    try {
      img.dispatchEvent(new Event('error', { bubbles: true }));
      expect(img.getAttribute('src')).toBe(`${LOCAL_ICONS_BASE}/relicfigures/IconRelic_101_1.webp`);
      expect(img.dataset.cdnDown).toBe('1');
    } finally {
      off();
      img.remove();
    }
  });

  it('非 http(s) src（data URI / 相对路径）不受委托影响', () => {
    const off = installCdnImgFallback();
    const img = document.createElement('img');
    img.src = 'data:image/svg+xml;utf8,<svg/>';
    document.body.appendChild(img);
    try {
      img.dispatchEvent(new Event('error', { bubbles: true }));
      expect(img.hasAttribute('data-cdn-down')).toBe(false);
    } finally {
      off();
      img.remove();
    }
  });

  it('CDN 判定不可用时短路：直接标记降级，不做回退替换', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('network down'); }));
    startCdnHealthProbe();
    await vi.advanceTimersByTimeAsync(0);
    const off = installCdnImgFallback();
    const img = document.createElement('img');
    img.setAttribute('data-cdn-fallback', 'https://fb.example/x.webp');
    img.src = 'https://primary.example/x.webp';
    document.body.appendChild(img);
    try {
      img.dispatchEvent(new Event('error', { bubbles: true }));
      expect(img.src).toBe('https://primary.example/x.webp');
      expect(img.dataset.cdnDown).toBe('1');
    } finally {
      off();
      img.remove();
    }
  });

  it('CDN 恢复时重载全部已降级图片（移除标记 + 重设 src）', async () => {
    vi.useFakeTimers();
    let ok = false;
    vi.stubGlobal('fetch', vi.fn(async () => {
      if (!ok) throw new Error('network down');
      return { ok: true, status: 200 };
    }));
    startCdnHealthProbe();
    await vi.advanceTimersByTimeAsync(0);
    const off = installCdnImgFallback();
    const img = document.createElement('img');
    img.src = 'https://primary.example/x.webp';
    document.body.appendChild(img);
    img.dispatchEvent(new Event('error', { bubbles: true }));
    expect(img.dataset.cdnDown).toBe('1');
    try {
      ok = true;
      await vi.advanceTimersByTimeAsync(30000);
      await vi.advanceTimersByTimeAsync(0);
      expect(img.hasAttribute('data-cdn-down')).toBe(false);
      expect(img.src).toBe('https://primary.example/x.webp');
    } finally {
      off();
      img.remove();
    }
  });

  it('返回的卸载函数移除事件监听', () => {
    const off = installCdnImgFallback();
    const img = document.createElement('img');
    img.setAttribute('data-cdn-fallback', 'https://fb.example/x.webp');
    img.src = 'https://primary.example/x.webp';
    document.body.appendChild(img);
    off();
    img.dispatchEvent(new Event('error', { bubbles: true }));
    expect(img.src).toBe('https://primary.example/x.webp');
    img.remove();
  });

  it('挂起超时：img 长时间未 complete → 走同一回退链（有 fallback 替换 / 无 fallback 降级占位）', async () => {
    vi.useFakeTimers();
    const off = installCdnImgFallback();
    const img = document.createElement('img');
    Object.defineProperty(img, 'complete', { configurable: true, value: false });
    img.setAttribute('data-cdn-fallback', 'https://fb.example/x.webp');
    img.src = 'https://primary.example/x.webp';
    document.body.appendChild(img);
    await vi.advanceTimersByTimeAsync(CDN_STALL_TIMEOUT_MS + 100);
    expect(img.src).toBe('https://fb.example/x.webp');
    expect(img.hasAttribute('data-cdn-fallback')).toBe(false);
    const img2 = document.createElement('img');
    Object.defineProperty(img2, 'complete', { configurable: true, value: false });
    img2.src = 'https://primary.example/x.webp';
    document.body.appendChild(img2);
    await vi.advanceTimersByTimeAsync(CDN_STALL_TIMEOUT_MS + 100);
    expect(img2.dataset.cdnDown).toBe('1');
    expect(img2.dataset.cdnSrc).toBe('https://primary.example/x.webp');
    expect(img2.getAttribute('src')!.startsWith('data:image/svg+xml,')).toBe(true);
    off();
    img.remove();
    img2.remove();
  });

  it('挂起检测跳过未开始加载的 lazy 图（屏外不启动定时器，不误标降级）', async () => {
    vi.useFakeTimers();
    const off = installCdnImgFallback();
    const img = document.createElement('img');
    Object.defineProperty(img, 'complete', { configurable: true, value: false });
    Object.defineProperty(img, 'loading', { configurable: true, value: 'lazy' });
    Object.defineProperty(img, 'currentSrc', { configurable: true, value: '' });
    img.src = 'https://primary.example/x.webp';
    document.body.appendChild(img);
    await vi.advanceTimersByTimeAsync(CDN_STALL_TIMEOUT_MS * 2);
    expect(img.hasAttribute('data-cdn-down')).toBe(false);
    expect(img.src).toBe('https://primary.example/x.webp');
    off();
    img.remove();
  });

  it('lazy 图开始加载（loadstart）后才启动挂起定时器，真挂起仍走降级链', async () => {
    vi.useFakeTimers();
    const off = installCdnImgFallback();
    const img = document.createElement('img');
    Object.defineProperty(img, 'complete', { configurable: true, value: false });
    Object.defineProperty(img, 'loading', { configurable: true, value: 'lazy' });
    Object.defineProperty(img, 'currentSrc', { configurable: true, value: '' });
    img.src = 'https://primary.example/x.webp';
    document.body.appendChild(img);
    await vi.advanceTimersByTimeAsync(CDN_STALL_TIMEOUT_MS * 2);
    expect(img.hasAttribute('data-cdn-down')).toBe(false);
    Object.defineProperty(img, 'currentSrc', { configurable: true, value: 'https://primary.example/x.webp' });
    img.dispatchEvent(new Event('loadstart'));
    await vi.advanceTimersByTimeAsync(CDN_STALL_TIMEOUT_MS + 100);
    expect(img.dataset.cdnDown).toBe('1');
    off();
    img.remove();
  });
});
