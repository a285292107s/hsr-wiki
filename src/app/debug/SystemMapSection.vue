<script setup lang="ts">
/**
 * 系统地图（研究线 Tab）：交互式等轴测架构地图
 *
 * 研究线（spine-lab）为独立附属子应用（5174），本面板不进入主项目（数据展示型 wiki）。
 * 数据全部来自 spine-lab/src/system-map/map-data.ts（单一事实源）——建筑 = 模块，
 * 连线 = 真实控制/数据路径；文件路径、加载链均为仓库内事实，禁止在视图层编造。
 * 渲染：2:1 等轴测投影（菱形网格 S=88，基座 BW=0.48S），CSS 3D 风格 cuboid（三面 + 屋顶装饰），
 * 建筑按 painter 序（gx+gy 升序）绘制；hover/选中建筑 → 高亮关联路径 + 解释面板。
 * 颜色：--nk-c 由 layer.color 令牌注入，面/边/装饰全部 color-mix 派生（色彩收口）。
 * a11y：建筑为 role=button（Enter/Space 等效）；SVG role=img + aria-label。
 */
import { computed, ref } from 'vue';
import {
  EDGES, EDGE_KINDS, LAYERS, NODES,
  type EdgeKind, type MapEdge, type MapNode,
} from './system-map/map-data';

/** 等轴测投影：2:1 菱形网格（单元半宽 88）。
 *  基座 BW=0.48S：相邻单元中心距 S=88 > 基座宽 0.96S，模块间留出空隙，连线可辨。 */
const S = 88;
/** 建筑基座半宽（菱形）；必须 < S/2 防单元重叠 */
const BW = S * 0.48;
/** 基座半高（2:1 菱形） */
const BHY = BW / 2;
/** 行区（gy）累计垂直偏移：云端/网关/视图/核心/引擎/数据矿区逐区拉开，留出路径走廊。
 *  最小行距 = 44 + 40 = 84px ≥ 最高楼顶（h_max×20 + BHY = 81px），楼顶不越上一行基线 */
const ROW_OFFSETS: Record<number, number> = { 0: 0, 1: 44, 2: 84, 3: 126, 4: 166, 5: 208 };

const sel = ref<string | null>(null);
const hover = ref<string | null>(null);
const kindFilter = ref<EdgeKind | 'all'>('all');
/** 手机端面板开关（≥768px 常驻，开关仅影响折叠） */
const legendOpen = ref(window.matchMedia('(min-width: 768px)').matches);
const infoOpen = ref(true);

interface Geom {
  x: number; y: number; h: number; rc: number;
  top: string; left: string; right: string;
}

/** 网格坐标 → 屏幕坐标（2:1 等轴测；y 附加 ROW_OFFSETS 分区走廊偏移） */
function gridToScreen(gx: number, gy: number): { x: number; y: number } {
  return { x: (gx - gy) * S, y: (gx + gy) * (S / 2) + (ROW_OFFSETS[gy] ?? 0) };
}

/** 建筑几何：地面菱形（top 面）+ 左右立面 + 屋顶中心 rc */
function nodeGeom(n: MapNode): Geom {
  const { x, y } = gridToScreen(n.gx, n.gy);
  const h = n.h * 20;
  const rc = y - h;
  return {
    x, y, h, rc,
    top: x + ',' + (y - BHY - h) + ' ' + (x + BW) + ',' + (y - h) + ' ' + x + ',' + (y + BHY - h) + ' ' + (x - BW) + ',' + (y - h),
    left: x + ',' + (y + BHY) + ' ' + (x - BW) + ',' + y + ' ' + (x - BW) + ',' + (y - h) + ' ' + x + ',' + (y + BHY - h),
    right: x + ',' + (y + BHY) + ' ' + (x + BW) + ',' + y + ' ' + (x + BW) + ',' + (y - h) + ' ' + x + ',' + (y + BHY - h),
  };
}

const layerById = new Map(LAYERS.map((l) => [l.id, l]));
const nodes = NODES.map((n) => ({ node: n, layer: layerById.get(n.layer)!, g: nodeGeom(n) }));
const byId = new Map(nodes.map((e) => [e.node.id, e]));
/** painter 序：gx+gy 升序（近景后绘） */
const sortedNodes = [...nodes].sort(
  (a, b) => (a.node.gx + a.node.gy) - (b.node.gx + b.node.gy) || a.node.gx - b.node.gx,
);

/** 视口自适应建筑 + 网格范围 */
const vb = computed(() => {
  let minX = Infinity; let minY = Infinity; let maxX = -Infinity; let maxY = -Infinity;
  const feed = (x: number, y: number): void => {
    minX = Math.min(minX, x); minY = Math.min(minY, y);
    maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
  };
  for (const e of nodes) {
    feed(e.g.x - BW - 34, e.g.y - BHY - e.g.h - 48);
    feed(e.g.x + BW + 34, e.g.y + BHY + 8);
  }
  const pad = 28;
  return (minX - pad) + ' ' + (minY - pad) + ' ' + (maxX - minX + pad * 2) + ' ' + (maxY - minY + pad * 2);
});

interface EdgeGeom { edge: MapEdge; d: string; mx: number; my: number }

/** 按路径筛选（图例「路径筛选」）后的边 + 几何 */
const visibleEdges = computed<EdgeGeom[]>(() =>
  EDGES
    .filter((e) => kindFilter.value === 'all' || e.kind === kindFilter.value)
    .map((e) => {
      const a = byId.get(e.from)!; const b = byId.get(e.to)!;
      const dx = b.g.x - a.g.x; const dy = b.g.y - a.g.y;
      const len = Math.hypot(dx, dy) || 1;
      const ux = dx / len; const uy = dy / len;
      // 锚点外推到基座边缘外 8px：线头线尾露出建筑，数据流方向不被立面遮挡
      const off = BW + 8;
      const ax = a.g.x + ux * off; const ay = a.g.y + uy * off;
      const bx = b.g.x - ux * off; const by = b.g.y - uy * off;
      return { edge: e, d: 'M ' + ax + ' ' + ay + ' L ' + bx + ' ' + by, mx: (ax + bx) / 2, my: (ay + by) / 2 };
    }),
);

/** 当前激活（hover/选中）节点集合 */
const activeIds = computed(() => {
  const s = new Set<string>();
  if (hover.value) s.add(hover.value);
  if (sel.value) s.add(sel.value);
  return s;
});
/** 与激活节点相连的边 */
const linked = computed(() => {
  const s = new Set<string>();
  for (const id of activeIds.value) {
    for (const e of EDGES) if (e.from === id || e.to === id) s.add(e.id);
  }
  return s;
});
const hasActive = computed(() => activeIds.value.size > 0);

const selNode = computed(() => (sel.value ? byId.get(sel.value) ?? null : null));
const selEdges = computed(() => EDGES.filter((e) => e.from === sel.value || e.to === sel.value));

const kindLabel = (k: EdgeKind): string => EDGE_KINDS.find((s) => s.id === k)?.label ?? k;

const kindCounts = computed(() => {
  const m = new Map<EdgeKind | 'all', number>();
  m.set('all', EDGES.length);
  for (const e of EDGES) m.set(e.kind, (m.get(e.kind) ?? 0) + 1);
  return m;
});

const filters: { id: EdgeKind | 'all'; label: string }[] = [
  { id: 'all', label: '全部' },
  ...EDGE_KINDS.map((k) => ({ id: k.id, label: k.label })),
];

/** 边标签仅在被选中建筑的关联路径上展示（避免地图噪声） */
function showEdgeLabel(e: MapEdge): boolean {
  return !!sel.value && linked.value.has(e.id);
}

function select(id: string | null): void {
  sel.value = sel.value === id ? null : id;
}

function onKey(e: KeyboardEvent, id: string): void {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(id); }
}

/** 点击空白区域取消选中 */
function onStageClick(e: MouseEvent): void {
  if (!(e.target as Element | null)?.closest?.('.nk-bld')) select(null);
}

/* ─── 屋顶装饰（建筑形态多样性） ─── */

interface DecorEl {
  el: 'polygon' | 'line' | 'ellipse' | 'rect' | 'circle' | 'path';
  cls?: string;
  a: Record<string, string | number>;
}

function roofDecor(n: MapNode, g: Geom): DecorEl[] {
  const { x, rc, h } = g;
  const out: DecorEl[] = [];
  const R = BW * 0.72; // 装饰基准半径（随基座缩放）
  switch (n.shape) {
    case 'tower':
      out.push({ el: 'line', a: { x1: x, y1: rc - 10, x2: x, y2: rc - 26 } });
      out.push({ el: 'circle', a: { cx: x, cy: rc - 28, r: 2 } });
      break;
    case 'spire':
      out.push({ el: 'polygon', a: { points: (x - R * 0.5) + ',' + (rc - 4) + ' ' + (x + R * 0.5) + ',' + (rc - 4) + ' ' + x + ',' + (rc - 34) } });
      break;
    case 'dome':
      out.push({ el: 'path', a: { d: 'M ' + (x - R) + ' ' + (rc - 2) + ' A ' + R + ' ' + (R * 1.35) + ' 0 0 1 ' + (x + R) + ' ' + (rc - 2) }, cls: 'nk-decor--dome' });
      break;
    case 'sat':
      out.push({ el: 'path', a: { d: 'M ' + (x - R * 0.9) + ' ' + (rc - 4) + ' A ' + (R * 0.9) + ' ' + (R * 0.9) + ' 0 0 1 ' + (x + R * 0.9) + ' ' + (rc - 4) }, cls: 'nk-decor--dish' });
      out.push({ el: 'line', a: { x1: x, y1: rc - 4, x2: x, y2: rc - 22 } });
      out.push({ el: 'circle', a: { cx: x, cy: rc - 24, r: 2 } });
      break;
    case 'twin': {
      const mh = Math.round(h * 0.6);
      const sm = Math.round(BW * 0.6);
      const rc2 = rc + 2; // 双子塔底座落在屋顶面上
      for (const off of [-BW * 0.52, BW * 0.52]) {
        const cx = Math.round(x + off);
        out.push({ el: 'polygon', cls: 'nk-decor--side', a: { points: (cx - sm) + ',' + rc2 + ' ' + cx + ',' + (rc2 + sm / 2) + ' ' + cx + ',' + (rc2 + sm / 2 - mh) + ' ' + (cx - sm) + ',' + (rc2 - mh) } });
        out.push({ el: 'polygon', cls: 'nk-decor--side2', a: { points: cx + ',' + (rc2 + sm / 2) + ' ' + (cx + sm) + ',' + rc2 + ' ' + (cx + sm) + ',' + (rc2 - mh) + ' ' + cx + ',' + (rc2 + sm / 2 - mh) } });
        out.push({ el: 'polygon', cls: 'nk-decor--top2', a: { points: (cx - sm) + ',' + rc2 + ' ' + cx + ',' + (rc2 - sm / 2) + ' ' + (cx + sm) + ',' + rc2 + ' ' + cx + ',' + (rc2 + sm / 2) } });
      }
      break;
    }
    case 'silo':
      // 顶面为椭圆（主面已画），补中心接缝线增强筒仓感
      out.push({ el: 'line', a: { x1: x, y1: rc - BHY, x2: x, y2: rc + BHY } });
      break;
    case 'factory':
      out.push({ el: 'rect', a: { x: x + BW * 0.3, y: rc - 20, width: 7, height: 15 } });
      out.push({ el: 'rect', a: { x: x - BW * 0.55, y: rc - 14, width: 5, height: 9 } });
      out.push({ el: 'circle', a: { cx: Math.round(x + BW * 0.3 + 3.5), cy: rc - 23, r: 2.5 } });
      break;
    case 'bunker':
      out.push({ el: 'rect', a: { x: x - 7, y: rc - 11, width: 14, height: 6, rx: 1.5 } });
      out.push({ el: 'line', a: { x1: x - 13, y1: rc - 3, x2: x - 6, y2: rc - 3 } });
      out.push({ el: 'line', a: { x1: x + 6, y1: rc - 3, x2: x + 13, y2: rc - 3 } });
      break;
    case 'bank':
      // 山花饰（pediment）贴右面顶边
      out.push({ el: 'polygon', cls: 'nk-decor--pediment', a: { points: x + ',' + (rc + BHY) + ' ' + (x + BW) + ',' + rc + ' ' + (x + BW / 2) + ',' + Math.round(rc + BHY / 2 - 14) } });
      break;
    case 'flat':
    default:
      break;
  }
  return out;
}
</script>

<template>
  <div
    class="nk-sysmap"
    :class="{ 'has-active': hasActive, 'is-legend-open': legendOpen, 'is-info-open': infoOpen }"
  >
    <div class="nk-sysmap__grid">
      <!-- ─── 图例面板 ─── -->
      <aside class="nk-sysmap__legend">
        <header class="nk-sysmap__legend-head">
          <h2 class="nk-sysmap__panel-title">图例</h2>
          <button
            type="button"
            class="nk-sysmap__legend-toggle"
            :aria-expanded="legendOpen"
            aria-label="展开或收起图例"
            @click="legendOpen = !legendOpen"
          >−</button>
        </header>
        <div v-show="legendOpen" class="nk-sysmap__legend-body">
          <h3 class="nk-sysmap__sub">分层 · 建筑颜色</h3>
          <div class="nk-sysmap__chips">
            <button
              v-for="l in LAYERS"
              :key="l.id"
              type="button"
              class="nk-sysmap__chip"
              :style="{ '--nk-c': 'var(' + l.color + ')' }"
              :title="l.desc"
            >
              <span class="nk-sysmap__chip-swatch" />
              <span class="nk-sysmap__chip-text">{{ l.name }}</span>
              <span class="nk-sysmap__chip-en">{{ l.en }}</span>
            </button>
          </div>
          <h3 class="nk-sysmap__sub">线型 · 路径类型</h3>
          <ul class="nk-sysmap__kinds">
            <li v-for="k in EDGE_KINDS" :key="k.id" class="nk-sysmap__kind">
              <svg class="nk-sysmap__kind-swatch" width="52" height="12" aria-hidden="true">
                <line x1="2" y1="6" x2="50" y2="6" class="nk-sysmap__kind-line" :class="'is-' + k.id" />
              </svg>
              <div class="nk-sysmap__kind-meta">
                <b>{{ k.label }}</b>
                <span>{{ k.desc }}</span>
              </div>
            </li>
          </ul>
          <h3 class="nk-sysmap__sub">路径筛选</h3>
          <div class="nk-sysmap__filters" role="group" aria-label="按路径类型筛选">
            <button
              v-for="f in filters"
              :key="f.id"
              type="button"
              class="nk-sysmap__filter"
              :class="{ 'is-on': kindFilter === f.id }"
              @click="kindFilter = f.id"
            >{{ f.label }}<em>{{ kindCounts.get(f.id) ?? 0 }}</em></button>
          </div>
          <p class="nk-sysmap__hint">点击建筑查看解释面板 · Enter/Space 等效 · 色块 = 分层</p>
        </div>
      </aside>

      <!-- ─── 地图舞台 ─── -->
      <section class="nk-sysmap__stage">
        <svg
          class="nk-sysmap__svg"
          :viewBox="vb"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="系统架构等轴测地图：建筑为代码模块，连线为真实控制与数据路径"
          @click="onStageClick"
        >
          <defs>
            <marker
              v-for="k in EDGE_KINDS"
              :key="k.id"
              :id="'nk-arr-' + k.id"
              viewBox="0 0 8 8"
              refX="7"
              refY="4"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M0 0 L8 4 L0 8 z" :style="{ fill: 'var(--nk-edge-' + k.id + ')' }" />
            </marker>
          </defs>

          <!-- 地面节点：替代平行网格线，随建筑行区偏移，无折线断裂 -->
          <g class="nk-sysmap__plots">
            <polygon
              v-for="en in sortedNodes"
              :key="en.node.id"
              class="nk-plot"
              :points="(en.g.x - BW) + ',' + en.g.y + ' ' + en.g.x + ',' + (en.g.y + BHY) + ' ' + (en.g.x + BW) + ',' + en.g.y + ' ' + en.g.x + ',' + (en.g.y - BHY)"
            />
          </g>

          <g class="nk-sysmap__edges">
            <g
              v-for="e in visibleEdges"
              :key="e.edge.id"
              class="nk-edge"
              :class="['nk-edge--' + e.edge.kind, { 'is-linked': linked.has(e.edge.id), 'is-dim': hasActive && !linked.has(e.edge.id) }]"
            >
              <path class="nk-edge__casing" :d="e.d" />
              <path class="nk-edge__core" :d="e.d" :marker-end="'url(#nk-arr-' + e.edge.kind + ')'" />
              <path class="nk-edge__flow" :d="e.d" />
            </g>
          </g>

          <g class="nk-sysmap__blds">
            <g
              v-for="en in sortedNodes"
              :key="en.node.id"
              class="nk-bld"
              :class="{
                'is-sel': sel === en.node.id,
                'is-hover': hover === en.node.id,
                'is-dim': hasActive && sel !== en.node.id && hover !== en.node.id,
              }"
              :style="{ '--nk-c': 'var(' + en.layer.color + ')' }"
              role="button"
              tabindex="0"
              :aria-label="en.node.name + '（' + en.layer.name + '）：' + en.node.desc"
              :aria-pressed="sel === en.node.id"
              @click="select(en.node.id)"
              @keydown="onKey($event, en.node.id)"
              @mouseenter="hover = en.node.id"
              @mouseleave="hover = null"
              @focus="hover = en.node.id"
              @blur="hover = null"
            >
              <polygon class="nk-face nk-face--left" :points="en.g.left" />
              <polygon class="nk-face nk-face--right" :points="en.g.right" />
              <ellipse
                v-if="en.node.shape === 'silo'"
                class="nk-face nk-face--top"
                :cx="en.g.x"
                :cy="en.g.rc"
                :rx="BW"
                :ry="BHY * 1.1"
              />
              <polygon v-else class="nk-face nk-face--top" :points="en.g.top" />

              <template v-for="(d, i) in roofDecor(en.node, en.g)" :key="i">
                <polygon v-if="d.el === 'polygon'" v-bind="d.a" class="nk-decor" :class="d.cls ?? ''" />
                <line v-else-if="d.el === 'line'" v-bind="d.a" class="nk-decor nk-decor--line" :class="d.cls ?? ''" />
                <ellipse v-else-if="d.el === 'ellipse'" v-bind="d.a" class="nk-decor" :class="d.cls ?? ''" />
                <rect v-else-if="d.el === 'rect'" v-bind="d.a" class="nk-decor" :class="d.cls ?? ''" />
                <circle v-else-if="d.el === 'circle'" v-bind="d.a" class="nk-decor" :class="d.cls ?? ''" />
                <path v-else-if="d.el === 'path'" v-bind="d.a" class="nk-decor" :class="d.cls ?? ''" />
              </template>

              <rect class="nk-bld__plate" :x="en.g.x - 36" :y="en.g.rc - 10" width="72" height="24" rx="3" />
              <text class="nk-bld-name" :x="en.g.x" :y="en.g.rc + 1" text-anchor="middle">{{ en.node.name }}</text>
              <text class="nk-bld-en" :x="en.g.x" :y="en.g.rc + 12" text-anchor="middle">{{ en.node.en }}</text>
            </g>
          </g>

          <!-- 高亮覆盖层：选中/hover 建筑的关联路径在建筑之上加粗渲染，流动方向不被遮挡 -->
          <g class="nk-sysmap__edges nk-sysmap__edges--top">
            <g
              v-for="e in visibleEdges"
              :key="e.edge.id"
              v-show="linked.has(e.edge.id)"
              class="nk-edge nk-edge--top"
              :class="'nk-edge--' + e.edge.kind"
            >
              <path class="nk-edge__casing" :d="e.d" />
              <path class="nk-edge__core" :d="e.d" :marker-end="'url(#nk-arr-' + e.edge.kind + ')'" />
              <path class="nk-edge__flow" :d="e.d" />
              <text v-if="showEdgeLabel(e.edge)" class="nk-edge__label" :x="e.mx" :y="e.my" text-anchor="middle">{{ e.edge.label }}</text>
            </g>
          </g>
        </svg>
      </section>

      <!-- ─── 解释面板 ─── -->
      <aside class="nk-sysmap__info" aria-live="polite">
        <template v-if="selNode">
          <header class="nk-sysmap__info-head">
            <div>
              <span class="nk-sysmap__info-layer" :style="{ '--nk-c': 'var(' + selNode.layer.color + ')' }">{{ selNode.layer.name }}</span>
              <h2 class="nk-sysmap__info-name">{{ selNode.node.name }}</h2>
              <p class="nk-sysmap__info-en">{{ selNode.node.en }}</p>
            </div>
            <button type="button" class="nk-sysmap__close" aria-label="关闭详情" @click="select(null)">×</button>
          </header>
          <p class="nk-sysmap__info-desc">{{ selNode.node.desc }}</p>

          <h3 class="nk-sysmap__sub">关键文件</h3>
          <ul class="nk-sysmap__files">
            <li v-for="f in selNode.node.files" :key="f"><code>{{ f }}</code></li>
          </ul>

          <h3 class="nk-sysmap__sub">关联路径</h3>
          <ul class="nk-sysmap__edge-list">
            <li v-for="e in selEdges" :key="e.id" class="nk-sysmap__edge-item">
              <span class="nk-sysmap__edge-kind" :class="'is-' + e.kind">{{ kindLabel(e.kind) }}</span>
              <b>{{ e.label }}</b>
              <code>{{ e.from }} → {{ e.to }}</code>
            </li>
          </ul>
        </template>
        <template v-else>
          <h2 class="nk-sysmap__info-name">站点架构总览</h2>
          <p class="nk-sysmap__info-desc">
            本图由当前 main 分支源码静态推导：{{ NODES.length }} 座建筑（模块）承载 {{ EDGES.length }} 条真实控制/数据路径。
            建筑颜色对应分层（见图例），线型对应路径类型；选中建筑可查看其关键文件与关联加载链。
          </p>
          <h3 class="nk-sysmap__sub">读取方式</h3>
          <ol class="nk-sysmap__guide">
            <li>云端行（上）＝外部依赖：nanoka / jsDelivr 镜像 / 官网源 / Vercel</li>
            <li>中段＝运行时：入口 → 壳 → 路由 → 视图 → Store → API → 缓存 → 本地 JSON</li>
            <li>前沿行（下）＝数据生产：converter 工厂 → public/data/cn 仓库</li>
            <li>数据路径＝流动虚线；CDN 路径＝点划线；主题＝点线；构建＝粗实线</li>
          </ol>
        </template>
      </aside>
    </div>

    <!-- 手机端面板开关 -->
    <nav class="nk-sysmap__bar" aria-label="面板开关">
      <button type="button" :aria-expanded="legendOpen" @click="legendOpen = !legendOpen">图例</button>
      <button type="button" :aria-expanded="infoOpen" @click="infoOpen = !infoOpen">说明</button>
    </nav>
  </div>
</template>

<style scoped>
/**
 * 系统地图（研究线 Tab）样式：scoped 内联（lab 组件惯例，不进主项目）
 *
 * 色彩收口（ADR 0012）：全部颜色经 tokens 三层令牌 + color-mix 派生，
 * 本文件不出现裸彩色值（豁免：中性黑/白/灰 rgba）。
 * 分层色由视图内联 --nk-c（layer.color 令牌），面/边/装饰在下方派生；
 * 边类型色 --nk-edge-* 定义于本文件根（控制/数据/CDN/主题/构建）。
 */
.nk-sysmap {
  --nk-edge-control: var(--ir-400);
  --nk-edge-data: var(--em-500);
  --nk-edge-cdn: var(--gold-400);
  --nk-edge-theme: var(--tc-400);
  --nk-edge-build: var(--sl-500);
  padding-left: var(--nk-content-offset);
  color: var(--text);
}

/* ─── 三栏布局：≥1536 三列；768-1535 图例折叠为顶栏、地图+说明两列；<768 单列 + 底栏 ─── */
.nk-sysmap__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  grid-template-areas: 'legend legend' 'stage info';
  gap: 14px;
  padding: 14px;
  align-items: start;
}
.nk-sysmap__legend { grid-area: legend; }
.nk-sysmap__stage { grid-area: stage; }
.nk-sysmap__info { grid-area: info; }

@media (min-width: 1536px) {
  .nk-sysmap__grid {
    grid-template-columns: 250px minmax(0, 1fr) 340px;
    grid-template-areas: 'legend stage info';
  }
}

/* ─── 面板通用 ─── */
.nk-sysmap__legend,
.nk-sysmap__info {
  background: var(--nk-sheet-bg);
  border: 1px solid var(--nk-sheet-border);
  border-radius: var(--nk-radius-card);
  box-shadow: var(--nk-shadow-card);
}
.nk-sysmap__legend { padding: 12px; }
.nk-sysmap__info { padding: 16px; }

.nk-sysmap__panel-title,
.nk-sysmap__info-name {
  margin: 0;
  font-family: var(--font-hud);
  font-size: 13px;
  letter-spacing: 2px;
  color: var(--text-bright);
  text-transform: uppercase;
}
.nk-sysmap__legend-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.nk-sysmap__legend-toggle {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: 1px solid var(--nk-sheet-item-border);
  background: var(--nk-shell-hover);
  color: var(--text2);
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
}
.nk-sysmap__legend-toggle:hover {
  background: var(--nk-shell-press);
  color: var(--text-bright);
}

.nk-sysmap__sub {
  margin: 14px 0 8px;
  font-family: var(--font-hud);
  font-size: 10px;
  letter-spacing: 1.5px;
  color: var(--text3);
  text-transform: uppercase;
}
.nk-sysmap__sub:first-child { margin-top: 0; }

/* ─── 分层色块 chips ─── */
.nk-sysmap__chips {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(148px, 1fr));
  gap: 6px;
}
.nk-sysmap__chip {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 5px 8px;
  border: 1px solid var(--nk-sheet-item-border);
  border-radius: 6px;
  background: var(--nk-sheet-item-bg);
  color: var(--text2);
  font-size: 11px;
  text-align: left;
  cursor: default;
}
.nk-sysmap__chip-swatch {
  flex: none;
  width: 12px;
  height: 12px;
  border-radius: 3px;
  background: var(--nk-c);
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.35);
}
.nk-sysmap__chip-text { white-space: nowrap; }
.nk-sysmap__chip-en {
  margin-left: auto;
  font-family: var(--font-hud);
  font-size: 7px;
  letter-spacing: 1px;
  color: var(--text3);
}

/* ─── 线型图例 ─── */
.nk-sysmap__kinds { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
.nk-sysmap__kind {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px 8px;
  border-radius: 6px;
  background: var(--nk-sheet-item-bg);
}
.nk-sysmap__kind-swatch { flex: none; }
.nk-sysmap__kind-line {
  stroke-width: 2.5;
  stroke: var(--text3);
}
.nk-sysmap__kind-line.is-control { stroke: var(--nk-edge-control); }
.nk-sysmap__kind-line.is-data { stroke: var(--nk-edge-data); stroke-dasharray: 9 6; }
.nk-sysmap__kind-line.is-cdn { stroke: var(--nk-edge-cdn); stroke-dasharray: 3 5 10 5; }
.nk-sysmap__kind-line.is-theme { stroke: var(--nk-edge-theme); stroke-dasharray: 0.5 6; stroke-linecap: round; }
.nk-sysmap__kind-line.is-build { stroke: var(--nk-edge-build); stroke-width: 4; }
.nk-sysmap__kind-meta { display: flex; flex-direction: column; gap: 1px; }
.nk-sysmap__kind-meta b { font-size: 11px; font-weight: 600; color: var(--text); }
.nk-sysmap__kind-meta span { font-size: 10px; color: var(--text3); }

/* ─── 路径筛选 ─── */
.nk-sysmap__filters { display: flex; flex-wrap: wrap; gap: 6px; }
.nk-sysmap__filter {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 9px;
  border-radius: 999px;
  border: 1px solid var(--nk-sheet-item-border);
  background: var(--nk-sheet-item-bg);
  color: var(--text2);
  font-size: 11px;
  cursor: pointer;
}
.nk-sysmap__filter:hover { color: var(--text-bright); background: var(--nk-shell-hover); }
.nk-sysmap__filter.is-on {
  color: var(--text-bright);
  background: var(--nk-shell-active-bg);
  border-color: var(--nk-shell-active-border);
}
.nk-sysmap__filter em {
  font-style: normal;
  font-family: var(--font-hud);
  font-size: 9px;
  color: var(--text3);
}
.nk-sysmap__filter.is-on em { color: var(--highlight); }
.nk-sysmap__hint { margin: 12px 0 0; font-size: 10px; line-height: 1.6; color: var(--text3); }

/* ─── 地图舞台 ─── */
.nk-sysmap__stage {
  overflow: auto;
  border: 1px solid var(--nk-sheet-border);
  border-radius: var(--nk-radius-card);
  background:
    radial-gradient(120% 100% at 50% 0%, var(--nk-page-tint), transparent 70%),
    var(--bg);
  box-shadow: var(--nk-shadow-card);
}
.nk-sysmap__svg {
  display: block;
  width: 100%;
  min-width: 720px;
  height: auto;
  user-select: none;
}

/* ─── 地面节点（替代平行网格线） ─── */
.nk-sysmap__plots {
  pointer-events: none;
}
.nk-plot {
  fill: none;
  stroke: var(--line-1);
  stroke-width: 1;
}

/* ─── 路径连线（casing + core + 流动层） ─── */
.nk-edge { pointer-events: none; }
.nk-edge__casing {
  fill: none;
  stroke: rgba(0, 0, 0, 0.55);
  stroke-width: 6;
  stroke-linecap: round;
}
.nk-edge__core {
  fill: none;
  stroke-width: 2.2;
  stroke-linecap: round;
}
.nk-edge--control { --ec: var(--nk-edge-control); }
.nk-edge--data { --ec: var(--nk-edge-data); }
.nk-edge--cdn { --ec: var(--nk-edge-cdn); }
.nk-edge--theme { --ec: var(--nk-edge-theme); }
.nk-edge--build { --ec: var(--nk-edge-build); }
.nk-edge--control .nk-edge__core { stroke: var(--ec); }
.nk-edge--data .nk-edge__core { stroke: var(--ec); stroke-dasharray: 10 8; }
.nk-edge--cdn .nk-edge__core { stroke: var(--ec); stroke-dasharray: 3 6 12 6; }
.nk-edge--theme .nk-edge__core { stroke: var(--ec); stroke-dasharray: 0.5 7; stroke-linecap: round; }
.nk-edge--build .nk-edge__core { stroke: var(--ec); stroke-width: 3.4; }
.nk-edge__flow {
  fill: none;
  stroke: var(--text-bright);
  stroke-width: 2.4;
  stroke-dasharray: 12 10;
  opacity: 0.9;
  animation: nk-map-flow 0.9s linear infinite;
  display: none;
}
.nk-edge--data .nk-edge__flow,
.nk-edge--cdn .nk-edge__flow { display: block; }

@keyframes nk-map-flow {
  to { stroke-dashoffset: -20; }
}

/* 高亮与弱化（底层边随激活节点降透明；顶层高亮边常显） */
.nk-sysmap.has-active .nk-sysmap__edges:not(.nk-sysmap__edges--top) .nk-edge:not(.is-linked) { opacity: 0.16; }
.nk-edge.is-linked .nk-edge__core { stroke-width: 3; }

/* 顶层高亮：建筑之上的路由可视化（hover/选中时浮现） */
.nk-sysmap__edges--top { pointer-events: none; }
.nk-sysmap__edges--top .nk-edge { opacity: 1; }
.nk-sysmap__edges--top .nk-edge__casing {
  stroke: rgba(0, 0, 0, 0.72);
  stroke-width: 7;
}
.nk-sysmap__edges--top .nk-edge__core { stroke-width: 3.6; }
.nk-sysmap__edges--top .nk-edge__flow { display: block; }
.nk-sysmap__edges--top .nk-edge__core {
  filter: drop-shadow(0 0 3px color-mix(in srgb, var(--ec) 55%, transparent));
}
.nk-edge--top .nk-edge__label {
  fill: var(--text-bright);
  font-size: 9px;
  font-weight: 700;
  paint-order: stroke;
  stroke: rgba(0, 0, 0, 0.75);
  stroke-width: 3px;
  pointer-events: none;
}

/* ─── 建筑（cuboid 三面 + 屋顶 + 标签板） ─── */
.nk-bld {
  cursor: pointer;
  transition: transform 0.25s var(--nk-ease-out), opacity 0.2s ease;
  outline: none;
}
.nk-bld:hover,
.nk-bld.is-hover,
.nk-bld:focus-visible { transform: translateY(-4px); }
.nk-bld.is-sel { transform: translateY(-8px); }
.nk-sysmap.has-active .nk-bld:not(.is-sel):not(.is-hover) { opacity: 0.35; }

.nk-face {
  stroke: color-mix(in srgb, var(--nk-c) 38%, var(--blk-900) 62%);
  stroke-width: 0.8;
  stroke-linejoin: round;
}
.nk-face--left { fill: color-mix(in srgb, var(--nk-c) 52%, var(--blk-900) 48%); }
.nk-face--right { fill: color-mix(in srgb, var(--nk-c) 66%, var(--blk-900) 34%); }
.nk-face--top { fill: color-mix(in srgb, var(--nk-c) 84%, var(--text-bright) 16%); }

/* 屋顶装饰 */
.nk-decor {
  fill: color-mix(in srgb, var(--nk-c) 80%, var(--text-bright) 20%);
  stroke: color-mix(in srgb, var(--nk-c) 55%, var(--blk-900) 45%);
  stroke-width: 1;
}
.nk-decor--line { fill: none; }
.nk-decor--dish { fill: none; stroke-width: 1.4; }
.nk-decor--dome { fill: color-mix(in srgb, var(--nk-c) 72%, var(--text-bright) 28%); }
.nk-decor--side { fill: color-mix(in srgb, var(--nk-c) 58%, var(--blk-900) 42%); }
.nk-decor--side2 { fill: color-mix(in srgb, var(--nk-c) 70%, var(--blk-900) 30%); }
.nk-decor--top2 { fill: color-mix(in srgb, var(--nk-c) 88%, var(--text-bright) 12%); }
.nk-decor--pediment { fill: color-mix(in srgb, var(--nk-c) 90%, var(--text-bright) 10%); }

/* 屋顶标签板（深色底保证任意屋顶色下可读/对比度） */
.nk-bld__plate {
  fill: rgba(0, 0, 0, 0.72);
  stroke: rgba(255, 255, 255, 0.1);
  stroke-width: 0.5;
  pointer-events: none;
}
.nk-bld-name {
  fill: var(--text-bright);
  font-size: 9px;
  font-weight: 700;
  font-family: var(--font-body);
  pointer-events: none;
}
.nk-bld-en {
  fill: var(--text2);
  font-size: 5.5px;
  font-family: var(--font-hud);
  letter-spacing: 1.2px;
  pointer-events: none;
}

/* ─── 解释面板 ─── */
.nk-sysmap__info-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}
.nk-sysmap__info-layer {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--nk-c) 24%, var(--blk-900) 76%);
  border: 1px solid color-mix(in srgb, var(--nk-c) 45%, transparent);
  color: var(--text-bright);
  font-size: 10px;
  font-family: var(--font-hud);
  letter-spacing: 1px;
}
.nk-sysmap__info-name { margin-top: 8px; font-size: 15px; }
.nk-sysmap__info-en {
  margin: 3px 0 0;
  font-family: var(--font-hud);
  font-size: 9px;
  letter-spacing: 2px;
  color: var(--text3);
}
.nk-sysmap__close {
  flex: none;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  border: 1px solid var(--nk-sheet-item-border);
  background: var(--nk-shell-hover);
  color: var(--text2);
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
}
.nk-sysmap__close:hover { background: var(--nk-shell-press); color: var(--text-bright); }
.nk-sysmap__info-desc {
  margin: 10px 0 0;
  font-size: 12px;
  line-height: 1.7;
  color: var(--text2);
}

.nk-sysmap__files {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 5px;
}
.nk-sysmap__files code,
.nk-sysmap__edge-item code {
  display: block;
  padding: 5px 8px;
  border-radius: 5px;
  background: var(--nk-sheet-item-bg);
  border: 1px solid var(--nk-sheet-item-border);
  font-family: ui-monospace, 'SF Mono', Consolas, monospace;
  font-size: 10.5px;
  color: var(--text);
  word-break: break-all;
}

.nk-sysmap__edge-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 7px; }
.nk-sysmap__edge-item {
  display: grid;
  gap: 3px;
  padding: 7px 8px;
  border-radius: 6px;
  background: var(--nk-sheet-item-bg);
}
.nk-sysmap__edge-item b { font-size: 11.5px; font-weight: 600; color: var(--text); }
.nk-sysmap__edge-kind {
  justify-self: start;
  padding: 1px 7px;
  border-radius: 999px;
  font-size: 9px;
  font-family: var(--font-hud);
  letter-spacing: 0.5px;
  color: var(--text-bright);
  background: var(--nk-edge-control);
}
.nk-sysmap__edge-kind.is-data { background: var(--nk-edge-data); }
.nk-sysmap__edge-kind.is-cdn { background: var(--nk-edge-cdn); }
.nk-sysmap__edge-kind.is-theme { background: var(--nk-edge-theme); }
.nk-sysmap__edge-kind.is-build { background: var(--nk-edge-build); }

.nk-sysmap__guide {
  margin: 0;
  padding-left: 18px;
  display: grid;
  gap: 6px;
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--text2);
}

/* ─── 手机端：底栏 + 底部抽屉面板 ─── */
.nk-sysmap__bar {
  display: flex;
  gap: 8px;
  position: fixed;
  left: 50%;
  bottom: 14px;
  transform: translateX(-50%);
  z-index: 30;
  padding: 6px;
  border-radius: 999px;
  border: 1px solid var(--nk-sheet-border);
  background: var(--nk-sheet-bg);
  box-shadow: var(--nk-shadow-lift);
}
.nk-sysmap__bar button {
  padding: 7px 18px;
  border-radius: 999px;
  border: 1px solid var(--nk-sheet-item-border);
  background: var(--nk-sheet-item-bg);
  color: var(--text2);
  font-size: 12px;
  cursor: pointer;
}
.nk-sysmap__bar button:hover { color: var(--text-bright); background: var(--nk-shell-hover); }

@media (max-width: 767px) {
  .nk-sysmap__grid {
    display: block;
    padding: 10px;
  }
  .nk-sysmap__legend,
  .nk-sysmap__info {
    position: fixed;
    left: 10px;
    right: 10px;
    bottom: 66px;
    z-index: 20;
    max-height: 56vh;
    overflow: auto;
    transform: translateY(120%);
    visibility: hidden;
    transition: transform 0.3s var(--nk-ease-out), visibility 0.3s;
  }
  .nk-sysmap.is-legend-open .nk-sysmap__legend,
  .nk-sysmap.is-info-open .nk-sysmap__info {
    transform: none;
    visibility: visible;
  }
  .nk-sysmap__stage { min-width: 0; }
}

/* 动效偏好：关闭流动动画 */
@media (prefers-reduced-motion: reduce) {
  .nk-edge__flow { animation: none; }
  .nk-bld { transition: none; }
}
</style>