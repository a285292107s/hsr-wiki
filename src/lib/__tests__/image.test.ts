import { describe, expect, it } from 'vitest';
import { LOCAL_ICONS_BASE, cdnUri } from '../../services/cdn';
import { bgStyle, bgVar, cdnImgAttrs, cdnSrc, hideImgOnError, imgAttrs, imgHtml, markImgError, swapImgOnError } from '../image';

describe('image 模块统一图片加载', () => {
  const localSrc = `${LOCAL_ICONS_BASE}/element/fire.webp`;
  const remoteSrc = cdnUri('monsterfigure', 'Monster_1002011.webp');

  it('cdnSrc 是 cdnUri 的统一入口', () => {
    expect(cdnSrc('element', 'fire.webp')).toBe(cdnUri('element', 'fire.webp'));
  });

  it('imgAttrs 只绑主源：回退链在失败时推导，不再逐图内联', () => {
    expect(imgAttrs(localSrc)).toEqual({ src: localSrc });
  });

  it('cdnImgAttrs 产出 data-cdn-src + 无障碍/加载属性', () => {
    const attrs = cdnImgAttrs(localSrc, '火焰', { loading: 'lazy', fetchpriority: 'high' });
    expect(attrs['data-cdn-src']).toBe(localSrc);
    expect(attrs.alt).toBe('火焰');
    expect(attrs.loading).toBe('lazy');
    expect(attrs.fetchpriority).toBe('high');
  });

  it('imgHtml 用 data-cdn-src 输出模板串图片，转义全部用户可见文本', () => {
    const html = imgHtml(remoteSrc, {
      className: 'nk-x',
      alt: 'a"b<c',
      title: 't"&x',
      loading: 'lazy',
    });
    expect(html).toContain('data-cdn-src=');
    expect(html).toContain('alt="a&quot;b&lt;c"');
    expect(html).toContain('title="t&quot;&amp;x"');
    expect(html).toContain('loading="lazy"');
    expect(html.startsWith('<img')).toBe(true);
  });
  it('imgHtml 空源不输出，避免渲染无意义 img', () => {
    expect(imgHtml('')).toBe('');
  });

  it('imgHtml 对 URL/className 中的引号也转义，杜绝属性注入', () => {
    const html = imgHtml('https://x.test/a"onload=alert(1).webp', { className: 'a"b' });
    expect(html).not.toContain('" onload=');
    expect(html).toContain('class="a&quot;b"');
    expect(html).toContain('data-cdn-src="https://x.test/a&quot;onload=alert(1).webp"');
  });

  it('bgStyle / bgVar 统一背景图 url 写法', () => {
    expect(bgStyle(remoteSrc)).toEqual({ backgroundImage: `url(${remoteSrc})` });
    expect(bgStyle('')).toEqual({});
    expect(bgVar(remoteSrc, '--nk-home-ground')).toEqual({ '--nk-home-ground': `url(${remoteSrc})` });
  });

  it('错误处理助手集中管理 img 失败表现', () => {
    const img = document.createElement('img');
    markImgError({ target: img } as unknown as Event);
    expect(img.classList.contains('nk-img-error')).toBe(true);
    hideImgOnError({ target: img } as unknown as Event);
    expect(img.style.display).toBe('none');
    swapImgOnError('/fallback.webp')({ target: img } as unknown as Event);
    expect(img.getAttribute('src')).toBe('/fallback.webp');
  });
});
