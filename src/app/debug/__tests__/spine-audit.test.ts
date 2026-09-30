import { describe, expect, it } from 'vitest';
import {
  analyzePixels, buildDiagnosis, createAuditEntry, parseAtlasPages,
} from '../spine-audit';

describe('parseAtlasPages', () => {
  it('标准 atlas：顶格 page 名 + 紧随 size 行', () => {
    const text = [
      'hero.png',
      'size: 1024, 1024',
      'format: RGBA8888',
      'filter: Linear, Linear',
      'repeat: none',
      'arm',
      '  rotate: false',
      '  xy: 0, 0',
      '  size: 64, 64',
      '  orig: 64, 64',
      '  offset: 0, 0',
      '  index: -1',
      'hero_2.png',
      'size: 512, 512',
    ].join('\n');
    expect(parseAtlasPages(text)).toEqual(['hero.png', 'hero_2.png']);
  });

  it('Windows 换行兼容', () => {
    expect(parseAtlasPages('a.png\r\nsize: 4, 4\r\n')).toEqual(['a.png']);
  });

  it('空文本 / 纯缩进行 → 空数组', () => {
    expect(parseAtlasPages('')).toEqual([]);
    expect(parseAtlasPages('  size: 100, 100\n')).toEqual([]);
  });

  it('region 名带 .png 后缀不误判（缩进行不算 page）', () => {
    const text = ['a.png', 'size: 8, 8', '  icon.png', '  xy: 0, 0', '  size: 4, 4'].join('\n');
    expect(parseAtlasPages(text)).toEqual(['a.png']);
  });
});

describe('analyzePixels', () => {
  /** 构造 RGBA 缓冲：alphaAt(x, bufRow) 返回 true 的行填 alpha=255（y 为 WebGL readPixels 行序，底部为 0） */
  const mk = (w: number, h: number, alphaAt: (x: number, bufRow: number) => boolean): Uint8Array => {
    const buf = new Uint8Array(w * h * 4);
    for (let row = 0; row < h; row++) {
      for (let x = 0; x < w; x++) {
        buf[(row * w + x) * 4 + 3] = alphaAt(x, row) ? 255 : 0;
      }
    }
    return buf;
  };

  it('全透明 → visible 0 + ratio 0 + bbox null', () => {
    const r = analyzePixels(new Uint8Array(4 * 4 * 4), 4, 4);
    expect(r.visible).toBe(0);
    expect(r.ratio).toBe(0);
    expect(r.bbox).toBeNull();
  });

  it('局部可见：数量统计 + 左上原点 bbox（readPixels 底部行 → 屏幕顶部行翻转）', () => {
    const buf = mk(4, 4, (x, row) => x >= 1 && x <= 2 && row >= 2 && row <= 3);
    const r = analyzePixels(buf, 4, 4);
    expect(r.visible).toBe(4);
    expect(r.total).toBe(16);
    expect(r.ratio).toBe(4 / 16);
    expect(r.bbox).toEqual({ x0: 1, y0: 0, x1: 2, y1: 1 });
  });

  it('部分透明（alpha=1）也计入可见', () => {
    const buf = new Uint8Array(2 * 2 * 4);
    buf[3] = 1;
    const r = analyzePixels(buf, 2, 2);
    expect(r.visible).toBe(1);
    expect(r.bbox).toEqual({ x0: 0, y0: 1, x1: 0, y1: 1 });
  });
});

describe('buildDiagnosis', () => {
  const entry = (errs: string[], warns: string[] = []): ReturnType<typeof createAuditEntry> => {
    const e = createAuditEntry('1', 'official', 'x');
    e.errors.push(...errs);
    e.warnings.push(...warns);
    return e;
  };

  it('404 → 资源失效 + publish_key 建议', () => {
    const d = buildDiagnosis(entry(['HTTP 404: https://act-webstatic/x.atlas']));
    expect(d.some((t) => t.includes('publish_key'))).toBe(true);
  });

  it('纹理映射缺失 → 键对齐建议（含扩展名）', () => {
    const d = buildDiagnosis(entry(['纹理映射缺失于 atlas: hero.png']));
    expect(d.some((t) => t.includes('.png 扩展名'))).toBe(true);
  });

  it('渲染全透明 → 视口建议', () => {
    const d = buildDiagnosis(entry(['层 1渲染全透明']));
    expect(d.some((t) => t.includes('视口'))).toBe(true);
  });

  it('混合占比过高 → 黑块风险建议', () => {
    const d = buildDiagnosis(entry([], ['混合 slot 占比过高 8/10']));
    expect(d.some((t) => t.includes('黑块'))).toBe(true);
  });

  it('skel 条目解析失败 → 4.1 备用运行时建议', () => {
    const e = createAuditEntry('1005', 'skel', 'kafuka');
    e.errors.push('渲染失败: Could not load skeleton data: Bone name must not be null');
    const d = buildDiagnosis(e);
    expect(d.some((t) => t.includes('4.1.23') && t.includes('备用运行时'))).toBe(true);
  });

  it('official 条目解析失败 → 通用版本兼容建议', () => {
    const e = createAuditEntry('1508', 'official', 'x');
    e.errors.push('渲染失败: Offset is outside the bounds of the DataView');
    const d = buildDiagnosis(e);
    expect(d.some((t) => t.includes('Spine 版本兼容'))).toBe(true);
    expect(d.some((t) => t.includes('备用运行时'))).toBe(false);
  });

  it('无关键词匹配 → 空建议', () => {
    expect(buildDiagnosis(entry([], ['小警告'])).length).toBe(0);
  });
});

