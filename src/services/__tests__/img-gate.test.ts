import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { IMAGE_GATE_ATTR, IMAGE_GATE_MAX_INFLIGHT, gateImagesIn, installImageGate } from '../cdn';

const JSD = 'https://cdn.jsdelivr.net/gh/a285292107s/hsr-wiki@main/public/data/assets/icons/element/quantum.webp';
const RAW = 'https://raw.githubusercontent.com/a285292107s/hsr-wiki/main/public/data/assets/icons/element/ice.webp';

const flush = (): Promise<void> => new Promise((r) => setTimeout(r, 60));

let cleanup: (() => void) | null = null;

function mkImg(attrs: Record<string, string>): HTMLImageElement {
  const img = document.createElement('img');
  for (const [k, v] of Object.entries(attrs)) img.setAttribute(k, v);
  document.body.appendChild(img);
  return img;
}

const realSrc = (img: HTMLImageElement): string => img.getAttribute('src') || '';
const isBlank = (img: HTMLImageElement): boolean => realSrc(img).startsWith('data:image/gif');

beforeEach(() => {
  document.body.innerHTML = '';
  cleanup = installImageGate();
});

afterEach(() => {
  cleanup?.();
  cleanup = null;
  document.body.innerHTML = '';
});

describe('img-gate 并发闸门', () => {
  it('属性赋值(:src)超并发上限时排队，仅上限数量的图拿到真实 src', async () => {
    const imgs = Array.from({ length: 15 }, () => {
      const img = document.createElement('img');
      document.body.appendChild(img);
      img.src = JSD; // property assignment path
      return img;
    });
    await flush();
    const loaded = imgs.filter((i) => !isBlank(i)).length;
    expect(loaded).toBe(IMAGE_GATE_MAX_INFLIGHT);
    expect(imgs.filter(isBlank).length).toBe(15 - IMAGE_GATE_MAX_INFLIGHT);
  });

  it('模板 data-cdn-src（innerHTML/v-html）也被纳入闸门', async () => {
    const wrap = document.createElement('div');
    wrap.innerHTML = Array.from({ length: 12 }, () => `<img ${IMAGE_GATE_ATTR}="${JSD}">`).join('');
    document.body.appendChild(wrap);
    gateImagesIn(wrap);
    await flush();
    const imgs = [...wrap.querySelectorAll('img')] as HTMLImageElement[];
    expect(imgs.filter((i) => !isBlank(i)).length).toBe(IMAGE_GATE_MAX_INFLIGHT);
  });

  it('一张图完成后释放名额，队列中的下一张被放行', async () => {
    const imgs = Array.from({ length: 8 }, () => {
      const img = document.createElement('img');
      document.body.appendChild(img);
      img.src = JSD;
      return img;
    });
    await flush();
    const first = imgs.filter((i) => !isBlank(i));
    expect(first.length).toBe(IMAGE_GATE_MAX_INFLIGHT);
    first[0].dispatchEvent(new Event('load'));
    await flush();
    expect(imgs.filter((i) => !isBlank(i)).length).toBe(IMAGE_GATE_MAX_INFLIGHT + 1);
  });

  it('fetchpriority="high" 的图立即放行（不受并发上限约束），并移除该提示属性', async () => {
    for (let i = 0; i < IMAGE_GATE_MAX_INFLIGHT; i++) {
      const img = document.createElement('img');
      document.body.appendChild(img);
      img.src = JSD;
    }
    const prio = document.createElement('img');
    prio.setAttribute('fetchpriority', 'high');
    document.body.appendChild(prio);
    prio.src = RAW;
    await flush();
    expect(isBlank(prio)).toBe(false);
    expect(prio.hasAttribute('fetchpriority')).toBe(false);
  });

  it('非 CDN 图（data: / 第三方域）不被延迟', async () => {
    const dataImg = document.createElement('img');
    document.body.appendChild(dataImg);
    dataImg.src = 'data:image/svg+xml,<svg/>';
    const third = document.createElement('img');
    document.body.appendChild(third);
    third.src = 'https://example.com/x.png';
    await flush();
    expect(realSrc(dataImg).startsWith('data:image/svg+xml')).toBe(true);
    expect(realSrc(third)).toBe('https://example.com/x.png');
  });

  it('卸载后恢复原生 src setter，不再拦截', async () => {
    cleanup?.();
    cleanup = null;
    const img = document.createElement('img');
    document.body.appendChild(img);
    img.src = JSD;
    expect(img.src).toBe(JSD);
  });

  it('闸门只作用于本域图片（jsdelivr / raw / nanoka），元素一旦入闸保持排队', async () => {
    const img = mkImg({ [IMAGE_GATE_ATTR]: JSD });
    gateImagesIn(img);
    expect(isBlank(img)).toBe(true);
    // 重复扫描不重复入队
    gateImagesIn(img);
    await flush();
    expect(realSrc(img)).toBe(JSD);
  });
});
