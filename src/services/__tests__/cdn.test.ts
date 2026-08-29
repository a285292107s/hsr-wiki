/**
 * CDN 资源解析模块单测（纯函数 + DOM 副作用）。
 * - nanokaUrl / cdnUri / cdnRawUrl：URL 构造契约
 * - resolveCdnUri：双源解析 + 官方源守卫（OFFICIAL_BASE 为空 → 全部走 nanoka）
 * - cdnFallbackFromPrimary / cdnImgFallbackAttr：v-html 卡片回退属性生成
 * - installCdnImgFallback：全局图片回退事件委托（双源回退一次 → 最终降级 data-cdn-down →
 *   CDN down 短路 / 恢复重载；仅回退一次防循环）
 * - 官方分支：vi.doMock 注入非空 OFFICIAL_BASE 验证官方优先 + nanoka 回退
 */
import { afterEach, beforeEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { CDN, setUseOfficialPaths } from '../../lib/constants';
import {
  CDN_CATEGORIES,
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

// 本文件验证 cdn 模块的双源解析与回退机制（nanoka 主源 + jsDelivr 旧档回退，trace 经
// spec.jdPrimary 例外保持 jsDelivr 主源）。USE_OFFICIAL_PATHS=true 直拼模式不经 cdn 解析层。
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

  it('cdnUri 返回首选源（当前全部走 nanoka）', () => {
    expect(cdnUri('bufficon', 'IconBuffAttackUp.webp')).toBe(`${BASE}/bufficon/IconBuffAttackUp.webp`);
  });

  it('cdnRawUrl 拼接任意原始子路径（分类子路径不固定的场景）', () => {
    expect(cdnRawUrl('gridfight/equipment/350101.webp')).toBe(`${BASE}/gridfight/equipment/350101.webp`);
  });
});

describe('resolveCdnUri 双源解析', () => {
  it('jsDelivr 注册分类：nanoka 主源 + jsDelivr 旧档回退', () => {
    const r = resolveCdnUri('lightconemediumicon', '23000.webp');
    expect(r.primary).toBe(`${BASE}/lightconemediumicon/23000.webp`);
    expect(r.fallback).toBe(`${JS_DELIVR_BASE}/lightconemediumicon/23000.png`);
    expect(r.source).toBe('nanoka');
  });

  it('本地图标分类：element / pathicon local-first，本地缺失回退远端主源（nanoka，新增内容仅此源有）', () => {
    expect(resolveCdnUri('element', 'fire.webp')).toEqual({
      primary: `${LOCAL_ICONS_BASE}/element/fire.webp`,
      fallback: `${BASE}/element/fire.webp`,
      source: 'local',
    });
    expect(resolveCdnUri('pathicon', 'priest.webp').fallback).toBe(`${BASE}/pathicon/priest.webp`);
    expect(resolveCdnUri('pathicon', 'elation.webp').fallback).toBe(`${BASE}/pathicon/elation.webp`);
    // trace：nanoka 源为占位图，jdPrimary 保持 jsDelivr 主源（真源），本地缺失必须回退 jsDelivr，禁改回 nanoka
    expect(resolveCdnUri('trace', 'IconAttack.webp')).toEqual({
      primary: `${LOCAL_ICONS_BASE}/trace/IconAttack.webp`,
      fallback: `${JS_DELIVR_BASE}/ui/avatar/icon/IconAttack.png`,
      source: 'local',
    });
  });

  it('jsDelivr 映射分类：skillicons 主源 nanoka 平铺，回退按角色 id 分目录', () => {
    const r = resolveCdnUri('skillicons', 'SkillIcon_1001_Normal.webp');
    expect(r.primary).toBe(`${BASE}/skillicons/SkillIcon_1001_Normal.webp`);
    expect(r.fallback).toBe(`${JS_DELIVR_BASE}/skillicons/avatar/1001/SkillIcon_1001_Normal.png`);
  });

  it('jsDelivr 映射分类：skillicons 回退目录按角色 id（忆灵文件名 id - 10000）', () => {
    // 忆灵图标文件名以忆灵 ID 为前缀，回退仓库目录按角色 ID 组织（11402 → 1402）
    expect(resolveCdnUri('skillicons', 'SkillIcon_11402_Servant01.webp').fallback)
      .toBe(`${JS_DELIVR_BASE}/skillicons/avatar/1402/SkillIcon_11402_Servant01.png`);
    expect(resolveCdnUri('skillicons', 'SkillIcon_11402_ServantPassive.webp').fallback)
      .toBe(`${JS_DELIVR_BASE}/skillicons/avatar/1402/SkillIcon_11402_ServantPassive.png`);
    // 开拓者特例：18007 → 8007
    expect(resolveCdnUri('skillicons', 'SkillIcon_18007_Servant01.webp').fallback)
      .toBe(`${JS_DELIVR_BASE}/skillicons/avatar/8007/SkillIcon_18007_Servant01.png`);
  });

  it('jsDelivr 映射分类：rank 星魂图标 nanoka 主源，回退官方 ui/ui3d/rank（含 Rank3/5 全套）', () => {
    const r = resolveCdnUri('rank', '1403/1403_Rank_3.webp');
    expect(r.primary).toBe(`${BASE}/rank/_dependencies/textures/1403/1403_Rank_3.webp`);
    // 回退官方源与 spriteoutput/ 平级 → 用 JS_DELIVR_UI3D_BASE（无 /spriteoutput 段）
    expect(r.fallback).toBe(`${JS_DELIVR_UI3D_BASE}/ui/ui3d/rank/_dependencies/textures/1403/1403_Rank_3.png`);
    expect(r.source).toBe('nanoka');
    // E6 同规则
    expect(resolveCdnUri('rank', '1510/1510_Rank_6.webp').fallback)
      .toBe(`${JS_DELIVR_UI3D_BASE}/ui/ui3d/rank/_dependencies/textures/1510/1510_Rank_6.png`);
  });

  it('jsDelivr 映射分类：monstermiddleicon / relicfigures（套装件不受本地化影响）', () => {
    expect(resolveCdnUri('monstermiddleicon', 'Monster_1002011.webp').primary)
      .toBe(`${BASE}/monstermiddleicon/Monster_1002011.webp`);
    expect(resolveCdnUri('relicfigures', 'IconRelic_101_1.webp').fallback)
      .toBe(`${JS_DELIVR_BASE}/relicfigures/IconRelic_101_1.png`);
    // relicfigures 仅通用部位图标本地化（白名单），套装件走远端
    expect(resolveCdnUri('relicfigures', 'IconRelicBody.webp').source).toBe('local');
    expect(resolveCdnUri('relicfigures', 'IconRelic_101_1.webp').source).toBe('nanoka');
  });

  it('未注册 jsDelivr 的分类：仅 nanoka 首选，无回退', () => {
    const r = resolveCdnUri('bufficon', 'IconBuffAttackUp.webp');
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
    // 局部 mock base 模块的 OFFICIAL_BASE，并重置模块缓存重新加载 resolve
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
    // rank 保留 charId 子目录，回退用 ui3d 基址
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
    // relic 部位图标规则不适用 → nanoka；非本地路径 → ''
    expect(localFallbackFromPrimary(`${LOCAL_ICONS_BASE}/relicfigures/IconRelicBody.webp`))
      .toBe(`${BASE}/relicfigures/IconRelicBody.webp`);
    // 白名单外文件（套装件在本地目录无对应物）不反查
    expect(localFallbackFromPrimary(`${LOCAL_ICONS_BASE}/relicfigures/IconRelic_101_1.webp`)).toBe('');
    expect(localFallbackFromPrimary('https://example.com/x.webp')).toBe('');
    // cdnFallbackFromPrimary 对本地主源同样生效（v-html 属性路径）
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

  it('捕获 <img> 的 error 事件并替换为回退源，仅回退一次', () => {
    const off = installCdnImgFallback();
    const img = document.createElement('img');
    img.setAttribute('data-cdn-fallback', 'https://fb.example/x.webp');
    img.src = 'https://primary.example/x.webp';
    document.body.appendChild(img);
    try {
      img.dispatchEvent(new Event('error', { bubbles: true }));
      expect(img.src).toBe('https://fb.example/x.webp');
      expect(img.hasAttribute('data-cdn-fallback')).toBe(false);
      // 再次触发 error：属性已清除，不再替换（防回退源循环）
      img.dispatchEvent(new Event('error', { bubbles: true }));
      expect(img.src).toBe('https://fb.example/x.webp');
    } finally {
      off();
      img.remove();
    }
  });

  it('无回退属性且首选源（nanoka）失败 → 标记 data-cdn-down（src 不变，CSS 隐藏破图）', () => {
    const off = installCdnImgFallback();
    const img = document.createElement('img');
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

  it('回退源再失败 → 标记 data-cdn-down', () => {
    const off = installCdnImgFallback();
    const img = document.createElement('img');
    img.setAttribute('data-cdn-fallback', 'https://fb.example/x.webp');
    img.src = 'https://primary.example/x.webp';
    document.body.appendChild(img);
    try {
      img.dispatchEvent(new Event('error', { bubbles: true }));
      img.dispatchEvent(new Event('error', { bubbles: true }));
      expect(img.src).toBe('https://fb.example/x.webp');
      expect(img.dataset.cdnDown).toBe('1');
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
      // 远端再失败：src 已是 http(s)，无回退属性 → data-cdn-down
      img.dispatchEvent(new Event('error', { bubbles: true }));
      expect(img.dataset.cdnDown).toBe('1');
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
    // 健康探测失败 → down
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
      expect(img.src).toBe('https://primary.example/x.webp'); // 未替换
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
      // 恢复：重探周期后探测成功 → 订阅触发重载
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

  it('挂起超时：img 长时间未 complete → 走同一回退链（替换 fallback）', async () => {
    vi.useFakeTimers();
    const off = installCdnImgFallback();
    const img = document.createElement('img');
    // happy-dom 的 img.complete 恒为 true，用 defineProperty 模拟真实浏览器的挂起态
    Object.defineProperty(img, 'complete', { configurable: true, value: false });
    img.setAttribute('data-cdn-fallback', 'https://fb.example/x.webp');
    img.src = 'https://primary.example/x.webp';
    document.body.appendChild(img);
    await vi.advanceTimersByTimeAsync(CDN_STALL_TIMEOUT_MS + 100);
    expect(img.src).toBe('https://fb.example/x.webp');
    expect(img.hasAttribute('data-cdn-fallback')).toBe(false);
    off();
    img.remove();
  });

  it('挂起超时：无回退属性的首选源 img → 标记 data-cdn-down 降级', async () => {
    vi.useFakeTimers();
    const off = installCdnImgFallback();
    const img = document.createElement('img');
    Object.defineProperty(img, 'complete', { configurable: true, value: false });
    img.src = 'https://primary.example/x.webp';
    document.body.appendChild(img);
    await vi.advanceTimersByTimeAsync(CDN_STALL_TIMEOUT_MS + 100);
    expect(img.dataset.cdnDown).toBe('1');
    // 慢响应自愈：最终 load 成功 → 清除降级标记恢复显示
    img.dispatchEvent(new Event('load'));
    expect(img.hasAttribute('data-cdn-down')).toBe(false);
    off();
    img.remove();
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
    // 远超挂起阈值：未开始加载的 lazy 图不是请求挂起 → 不降级、src 不变
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
    // 进入视口开始加载：loadstart 触发 → watchStall 重入启动定时器
    Object.defineProperty(img, 'currentSrc', { configurable: true, value: 'https://primary.example/x.webp' });
    img.dispatchEvent(new Event('loadstart'));
    await vi.advanceTimersByTimeAsync(CDN_STALL_TIMEOUT_MS + 100);
    expect(img.dataset.cdnDown).toBe('1');
    off();
    img.remove();
  });
});

describe('CDN_CATEGORIES 注册表完整性', () => {
  it('全部分类均注册 nanoka 子路径且非空', () => {
    for (const [cat, spec] of Object.entries(CDN_CATEGORIES)) {
      expect(spec.nanoka.length, `${cat} nanoka 子路径为空`).toBeGreaterThan(0);
      expect(spec.nanoka.endsWith('/'), `${cat} 子路径不应以 / 结尾`).toBe(false);
    }
  });
});