/**
 * 虚拟网格（>400 条目，如物品页）
 *
 * 迁移自 catalog.js 的 initVirtualGrid / renderVirtualRows，适配点：
 * - 原实现增量 DOM 补丁（insertAdjacentHTML / remove）；此处重建 cells 数组，
 *   由 Vue 按 key（条目索引）diff——滚动时保留的单元格 DOM 复用，新增的挂载即观察。
 * - 滚动容器是 #nk-catalog-app（Shadow DOM 内自滚动容器），不再是 window。
 * - 动态 buffer（滚动速度越快缓冲行越多）与 reveal 延迟策略原样保留。
 */
import { nextTick, ref, type Directive, type Ref } from 'vue';
import type { CatalogItem, CatalogPageConfig } from './types';

export interface VirtualCell {
  /** 条目在 filtered 中的索引（稳定 key） */
  key: number;
  /** renderCard 输出（v-html） */
  html: string;
  /** 定位样式串：top / left / width / padding / --reveal-delay */
  style: string;
}

const BUFFER_MIN = 2;
const BUFFER_MAX = 6;
const REVEAL_COL_DELAY = 40;
const REVEAL_ROW_DELAY = 80;
const REVEAL_LARGE_JUMP_MAX = 480;
const REVEAL_LARGE_JUMP_MIN_ROW = 15;
const GAP = 10;

/* ─── Reveal 观察器（模块级单例 + 指令） ─── */

let revealObserver: IntersectionObserver | null = null;

function getRevealObserver(): IntersectionObserver {
  if (!revealObserver) {
    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('nk-revealed');
            revealObserver?.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 },
    );
  }
  return revealObserver;
}

/** 虚拟单元格入场观察：进入视口后添加 .nk-revealed 触发动画 */
export const vReveal: Directive<HTMLElement> = {
  mounted(el) {
    getRevealObserver().observe(el);
  },
  unmounted(el) {
    getRevealObserver().unobserve(el);
  },
};

/* ─── composable ─── */

export interface VirtualGridOptions {
  filtered: Ref<CatalogItem[]>;
  /** 页面配置（支持 getter，保证组件复用时始终读取最新 config） */
  config: CatalogPageConfig | (() => CatalogPageConfig);
  /** 滚动容器（#nk-catalog-app） */
  scroller: Ref<HTMLElement | null>;
  /** 网格元素（.nk-virtual-grid） */
  grid: Ref<HTMLElement | null>;
}

export function useVirtualGrid(opts: VirtualGridOptions) {
  const { filtered, scroller, grid } = opts;
  const cfg = (): CatalogPageConfig =>
    typeof opts.config === 'function' ? opts.config() : opts.config;

  const cells = ref<VirtualCell[]>([]);
  const gridMinHeight = ref('0px');
  const fastJump = ref(false);

  let cols = 4;
  let rowH = 200;
  let lastStart = -1;
  let lastEnd = -1;
  let lastScrollTop = 0;
  let gridTop: number | null = null;
  let scrollRaf: number | null = null;
  let resizeTimer: ReturnType<typeof setTimeout> | null = null;

  function recalcMetrics(): void {
    const g = grid.value;
    const gridWidth = (g && g.clientWidth) || 800;
    const minColW = cfg().virtualMinColW || 150;
    cols = Math.max(2, Math.floor((gridWidth + GAP) / (minColW + GAP)));
    const colW = (gridWidth - (cols - 1) * GAP) / cols;
    const imgRatio = cfg().virtualImgRatio || 1;
    const infoH = 36;
    rowH = colW * imgRatio + infoH + 12 + GAP;
  }

  function calcDynamicBuffer(scrollTop: number): number {
    const velocity = Math.abs(scrollTop - lastScrollTop);
    const rowsPerFrame = velocity / rowH;
    return Math.min(BUFFER_MAX, Math.max(BUFFER_MIN, Math.ceil(BUFFER_MIN + rowsPerFrame)));
  }

  function calcRowDelay(visibleOnly: number): number {
    return Math.max(
      REVEAL_LARGE_JUMP_MIN_ROW,
      Math.min(REVEAL_ROW_DELAY, Math.floor(REVEAL_LARGE_JUMP_MAX / visibleOnly)),
    );
  }

  function calcRevealDelay(
    r: number, c: number, startRow: number, endRow: number,
    buffer: number, baseRow: number, rowDelay: number, direction: 'up' | 'down',
  ): number {
    if (r < startRow + buffer) {
      return REVEAL_COL_DELAY * c + REVEAL_ROW_DELAY * (startRow + buffer - 1 - r);
    }
    if (r >= endRow - buffer) {
      return REVEAL_COL_DELAY * c + REVEAL_ROW_DELAY * (r - (endRow - buffer));
    }
    const relRow = direction === 'up' ? baseRow - r : r - baseRow;
    return REVEAL_COL_DELAY * c + rowDelay * relRow;
  }

  function buildCells(
    startRow: number, endRow: number, buffer: number,
    direction: 'up' | 'down', isFastJump: boolean,
  ): VirtualCell[] {
    const items = filtered.value;
    const colW = 100 / cols;
    const visibleOnly = Math.max(1, endRow - startRow - 2 * buffer);
    const rowDelay = isFastJump ? 0 : calcRowDelay(visibleOnly);
    const baseRow = startRow + buffer;
    const out: VirtualCell[] = [];
    for (let r = startRow; r < endRow; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        if (idx >= items.length) break;
        const delay = calcRevealDelay(r, c, startRow, endRow, buffer, baseRow, rowDelay, direction);
        const left = c * colW;
        out.push({
          key: idx,
          html: cfg().renderCard(items[idx], idx),
          style:
            `position:absolute;top:${r * rowH}px;left:${left.toFixed(2)}%;width:${colW.toFixed(2)}%;` +
            `padding:0 ${GAP / 2}px ${GAP}px ${GAP / 2}px;box-sizing:border-box;--reveal-delay:${delay}ms;`,
        });
      }
    }
    return out;
  }

  function markImagesLoaded(): void {
    const g = grid.value;
    if (!g) return;
    g.querySelectorAll('img:not(.loaded)').forEach((img) => {
      const el = img as HTMLImageElement;
      if (el.complete) {
        el.classList.add('loaded');
      } else {
        const done = (): void => el.classList.add('loaded');
        el.addEventListener('load', done, { once: true });
        el.addEventListener('error', done, { once: true });
      }
    });
  }

  function render(force = false): void {
    const s = scroller.value;
    const g = grid.value;
    if (!s || !g) return;
    const totalRows = Math.ceil(filtered.value.length / cols);
    const scrollTop = s.scrollTop;
    const viewH = s.clientHeight;

    const buffer = force ? BUFFER_MIN : calcDynamicBuffer(scrollTop);

    if (gridTop === null || force) {
      gridTop = g.getBoundingClientRect().top - s.getBoundingClientRect().top + scrollTop;
    }

    const startRow = Math.max(0, Math.floor((scrollTop - gridTop) / rowH) - buffer);
    const endRow = Math.min(totalRows, Math.ceil((scrollTop - gridTop + viewH) / rowH) + buffer);

    if (!force && startRow === lastStart && endRow === lastEnd) {
      lastScrollTop = scrollTop;
      return;
    }

    const prevStart = lastStart;
    const prevEnd = lastEnd;
    lastStart = startRow;
    lastEnd = endRow;

    gridMinHeight.value = `${totalRows * rowH}px`;

    const direction: 'up' | 'down' = scrollTop < lastScrollTop ? 'up' : 'down';
    lastScrollTop = scrollTop;

    const noOverlap = prevStart < 0 || endRow <= prevStart || startRow >= prevEnd;
    const isFastJump = noOverlap && !force;
    fastJump.value = isFastJump;

    cells.value = buildCells(startRow, endRow, buffer, direction, isFastJump);
    void nextTick(markImagesLoaded);
  }

  function onScroll(): void {
    if (scrollRaf !== null) return;
    scrollRaf = requestAnimationFrame(() => {
      scrollRaf = null;
      render();
    });
  }

  function onResize(): void {
    if (resizeTimer !== null) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      gridTop = null;
      lastStart = -1;
      lastEnd = -1;
      recalcMetrics();
      render(true);
    }, 150);
  }

  /** 挂载后调用：计算度量、首屏渲染、绑定监听 */
  function start(): void {
    recalcMetrics();
    lastScrollTop = scroller.value ? scroller.value.scrollTop : 0;
    render(true);
    scroller.value?.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
  }

  /** 卸载时调用：解绑监听与计时器 */
  function stop(): void {
    if (scrollRaf !== null) cancelAnimationFrame(scrollRaf);
    scrollRaf = null;
    if (resizeTimer !== null) clearTimeout(resizeTimer);
    resizeTimer = null;
    scroller.value?.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onResize);
  }

  /** 筛选变化 / 面板折叠后调用：重置度量缓存并强制重渲染 */
  function refresh(): void {
    gridTop = null;
    lastStart = -1;
    lastEnd = -1;
    render(true);
  }

  return { cells, gridMinHeight, fastJump, start, stop, refresh, render };
}
