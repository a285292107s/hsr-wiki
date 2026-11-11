import { describe, expect, it } from 'vitest';
import { gridFightIconUrl } from '../icons';
import { LOCAL_ICONS_BASE } from '../../services/cdn';

describe('gridFightIconUrl 目录归一（4.7 源数据首段 GridFight 不再多拼一层 gridfight/）', () => {
  it('AugmentBig：SpriteOutput/GridFight/AugmentBig/100101.png → augmentbig/100101.webp', () => {
    expect(gridFightIconUrl('SpriteOutput/GridFight/AugmentBig/100101.png'))
      .toBe(`${LOCAL_ICONS_BASE}/gridfight-asset/augmentbig/100101.webp`);
  });

  it('Portal：SpriteOutput/GridFight/Portal/101.png → portal/101.webp', () => {
    expect(gridFightIconUrl('SpriteOutput/GridFight/Portal/101.png'))
      .toBe(`${LOCAL_ICONS_BASE}/gridfight-asset/portal/101.webp`);
  });

  it('历史小写首段形态输出一致', () => {
    expect(gridFightIconUrl('SpriteOutput/gridfight/augmentbig/100101.png'))
      .toBe(`${LOCAL_ICONS_BASE}/gridfight-asset/augmentbig/100101.webp`);
  });
});
