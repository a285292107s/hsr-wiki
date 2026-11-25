import { describe, it, expect } from 'vitest';
import { spriteLocalRel, isCdnBacked, SPRITE_MAP_CATEGORIES } from '../sprite-map';
import spriteMap from '../../../../config/sprite-map.json';

describe('sprite-map 路由（ADR 0070）', () => {
  it('扁平类：目录压平到 leaf', () => {
    expect(spriteLocalRel('SpriteOutput/GridFight/Equipment/350101.png'))
      .toEqual({ category: 'gridfight-equipment', file: '350101.webp' });
    expect(spriteLocalRel('SpriteOutput/AvatarCutinFigures/1001.png'))
      .toEqual({ category: 'avatarcutinfigures', file: '1001.webp' });
  });

  it('MosterIcon / MonsterRoundIcon 归到 monstermiddleicon（官方拼错目录）', () => {
    expect(spriteLocalRel('SpriteOutput/MosterIcon/Monster_1002011.png')?.category).toBe('monstermiddleicon');
    expect(spriteLocalRel('SpriteOutput/MonsterRoundIcon/Monster_1002011.png')?.category).toBe('monstermiddleicon');
    expect(spriteLocalRel('SpriteOutput/MonsterMiddleIcon/Monster_1002011.png')?.category).toBe('monstermiddleicon');
  });

  it('ItemIcon 与 ItemFigures 共用 itemfigures 分类', () => {
    expect(spriteLocalRel('SpriteOutput/ItemIcon/2.png')).toEqual({ category: 'itemfigures', file: '2.webp' });
    expect(spriteLocalRel('SpriteOutput/ItemFigures/100000.png')).toEqual({ category: 'itemfigures', file: '100000.webp' });
  });

  it('skillicons 压平、文件名保留大小写', () => {
    expect(spriteLocalRel('SpriteOutput/SkillIcons/Avatar/1001/SkillIcon_1001_BP.png'))
      .toEqual({ category: 'skillicons', file: 'SkillIcon_1001_BP.webp' });
  });

  it('gridfight 按子路径分流到 4 个分类', () => {
    expect(spriteLocalRel('SpriteOutput/GridFight/Equipment/350101.png')?.category).toBe('gridfight-equipment');
    expect(spriteLocalRel('SpriteOutput/GridFight/TraitIcon/Icon/1001.png')?.category).toBe('gridfight-icon');
    expect(spriteLocalRel('SpriteOutput/GridFight/TraitIcon/MiniIcon/1001S.png')?.category).toBe('gridfight-icon');
    expect(spriteLocalRel('SpriteOutput/GridFight/BattleIcon/BuffIcon/Icon_GridFight_1014Ultra.png'))
      .toEqual({ category: 'gridfight-affix', file: 'icon_gridfight_1014ultra.webp' });
  });

  it('gridfight-asset 保留子目录但目录段小写', () => {
    expect(spriteLocalRel('SpriteOutput/GridFight/AugmentBig/100101.png'))
      .toEqual({ category: 'gridfight-asset', file: 'augmentbig/100101.webp' });
    expect(spriteLocalRel('SpriteOutput/GridFight/Portal/101.png'))
      .toEqual({ category: 'gridfight-asset', file: 'portal/101.webp' });
  });

  it('element / pathicon 改名派生', () => {
    expect(spriteLocalRel('SpriteOutput/IconDamageType/IconDamageTypeFire.png')).toEqual({ category: 'element', file: 'fire.webp' });
    expect(spriteLocalRel('SpriteOutput/ProfessionIconMiddle/IconProfessionKnightMiddle.png')).toEqual({ category: 'pathicon', file: 'knight.webp' });
    // 官方错拼：Priest→Pirest、Elation→Joy
    expect(spriteLocalRel('SpriteOutput/ProfessionIconMiddle/IconProfessionPirestMiddle.png')?.file).toBe('priest.webp');
    expect(spriteLocalRel('SpriteOutput/ProfessionIconMiddle/IconProfessionJoyMiddle.png')?.file).toBe('elation.webp');
  });

  it('tutorialpic / bufficon 保留多出来的那层', () => {
    expect(spriteLocalRel('SpriteOutput/TutorialPic/TutorialPage_1050101.png'))
      .toEqual({ category: 'tutorialpic', file: 'TutorialPic/TutorialPage_1050101.webp' });
    expect(spriteLocalRel('SpriteOutput/BuffIcon/Inlevel/IconBuffHPBoost.png'))
      .toEqual({ category: 'bufficon', file: 'BuffIcon/Inlevel/IconBuffHPBoost.webp' });
  });

  it('未命中具名路由时走 uiart 透传兜底（目录小写）', () => {
    expect(spriteLocalRel('SpriteOutput/ChallengeTheme/ThemeBg/ChallengeThemeBg_2001.png'))
      .toEqual({ category: 'uiart', file: 'challengetheme/themebg/ChallengeThemeBg_2001.webp' });
    expect(spriteLocalRel('SpriteOutput/Abyss/UI3D_SceneBg/AbyssSenceBg_01.png'))
      .toEqual({ category: 'uiart', file: 'abyss/ui3d_scenebg/AbyssSenceBg_01.webp' });
  });

  it('空/异常输入返回 null', () => {
    expect(spriteLocalRel('')).toBeNull();
    expect(spriteLocalRel('SpriteOutput/')).toBeNull();
  });

  it('cdnBacked 分类标记正确', () => {
    expect(isCdnBacked('uiart')).toBe(true);
    expect(isCdnBacked('rank')).toBe(true);
    expect(isCdnBacked('skillicons')).toBe(false);
  });
});

describe('sprite-map 与 CDN_CATEGORIES 对齐', () => {
  it('CDN_CATEGORIES 与 sprite-map 分类名对齐（uiart 走独立解析器，不在 CDN_CATEGORIES）', async () => {
    const { CDN_CATEGORIES } = await import('../base');
    const cdn = Object.keys(CDN_CATEGORIES).sort();
    // uiart 由 services/cdn/uiart.ts 独立解析（官方 CDN 透传），不进 CDN_CATEGORIES
    const map = SPRITE_MAP_CATEGORIES.filter((c) => c !== 'uiart').sort();
    expect(map).toEqual(cdn);
    expect(SPRITE_MAP_CATEGORIES).toContain('uiart');
  });
});

describe('sprite-map.json 结构自检', () => {
  it('每条路由都有 first 与 local', () => {
    for (const r of (spriteMap.routes as Array<Record<string, unknown>>)) {
      expect(typeof r.first).toBe('string');
      expect(typeof r.local).toBe('string');
      expect(Boolean(r.category || r.categories)).toBe(true);
    }
  });

  it('路由引用的分类都在 categories 里登记', () => {
    for (const r of (spriteMap.routes as Array<{ category?: string; categories?: string[] }>)) {
      for (const c of r.categories || [r.category!]) {
        expect(Object.prototype.hasOwnProperty.call(spriteMap.categories, c), `未登记 ${c}`).toBe(true);
      }
    }
    const fb = spriteMap.fallback;
    expect(Object.prototype.hasOwnProperty.call(spriteMap.categories, fb.category)).toBe(true);
  });

  it('knownDeadRefs 正则可编译', () => {
    for (const p of spriteMap.knownDeadRefs.patterns) expect(() => new RegExp(p)).not.toThrow();
  });

  it('路由顺序：带 sub 的路由必须排在同类 first 的无 sub 路由之前', () => {
    const routes = spriteMap.routes as Array<{ first: string; sub?: string }>;
    for (let i = 0; i < routes.length; i++) {
      const r = routes[i];
      if (r.sub) continue;
      for (let j = i + 1; j < routes.length; j++) {
        const later = routes[j];
        if (later.first === r.first && later.sub) {
          throw new Error(`路由顺序错误：${r.first} 的无 sub 路由排在 ${r.first}/${later.sub} 之前`);
        }
      }
    }
  });
});
