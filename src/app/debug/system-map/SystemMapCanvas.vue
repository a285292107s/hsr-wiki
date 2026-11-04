<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import {
  DOMAIN_VAR, EDGES, LAYERS, NODES, TIERS,
  type EdgeKind, type MapEdge, type MapNode,
} from './map-data';
import {
  CELL, HALF_H, HALF_W,
  bandGeom, clampCamera, clampScale, decorGeom, degrees, edgeCurve, moduleGeom, moduleHeight,
  nodeBase, padViewport, unionBounds, viewportOf, zoomCamera, panCamera,
  type BandGeom, type Camera, type ModuleGeom, type Pt, type Viewport,
} from './geometry';

const props = defineProps<{
  selected: string | null;
  hovered: string | null;
  kind: EdgeKind | 'all';
  query: string;
  bootKey: number;
}>();

const emit = defineEmits<{
  select: [id: string | null];
  hover: [id: string | null];
}>();

const layerById = new Map(LAYERS.map((l) => [l.id, l]));
const degreeOf = degrees(EDGES);

interface ModuleView {
  node: MapNode;
  layerName: string;
  dom: string;
  decor: ReturnType<typeof decorGeom>;
  geom: ModuleGeom;
  order: number;
  label: string;
}

const modules: ModuleView[] = NODES.map((node) => {
  const layer = layerById.get(node.layer)!;
  const geom = moduleGeom(nodeBase(node), moduleHeight(degreeOf.get(node.id) ?? 0));
  return {
    node,
    layerName: layer.name,
    dom: DOMAIN_VAR[layer.domain],
    decor: decorGeom(layer.decor, geom.capTop),
    geom,
    order: node.gy * 5 + node.gx,
    label: node.name + (layer.name === node.name ? '' : '（' + layer.name + '）') + '：' + node.desc,
  };
});
const moduleById = new Map(modules.map((m) => [m.node.id, m]));

interface TierView { tier: string; gy: number; name: string; en: string; note: string; geom: BandGeom }

const tiers: TierView[] = TIERS.map((t) => {
  const row = NODES.filter((n) => n.gy === t.gy);
  const xs = row.map((n) => n.gx);
  return {
    tier: t.id,
    gy: t.gy,
    name: t.name,
    en: t.en,
    note: t.note,
    geom: bandGeom(Math.min(...xs), Math.max(...xs), t.gy),
  };
});

interface WireView { edge: MapEdge; d: string; mid: Pt; normal: Pt; order: number; labelOffset: number }

const LABEL_OFFSET = [-11, 11, 0];

const wires: WireView[] = EDGES.map((edge, i) => {
  const a = moduleById.get(edge.from)!.geom.base;
  const b = moduleById.get(edge.to)!.geom.base;
  const curve = edgeCurve(a, b, i + 3);
  return {
    edge,
    d: curve.d,
    mid: curve.mid,
    normal: curve.normal,
    order: i,
    labelOffset: LABEL_OFFSET[i % LABEL_OFFSET.length],
  };
});
const labModule = moduleById.get('lab');

const bounds: Viewport = (() => {
  const pts: Pt[] = [];
  for (const m of modules) {
    const { x, y } = m.geom.base;
    inPoints(pts, x - HALF_W - 10, y - m.geom.height - HALF_H - 34);
    inPoints(pts, x + HALF_W + 10, y + HALF_H + 10);
  }
  for (const t of tiers) {
    inPoints(pts, t.geom.label.x - 132, t.geom.label.y - 18);
    inPoints(pts, t.geom.label.x + 8, t.geom.label.y + 10);
  }
  if (labModule) inPoints(pts, labModule.geom.capTop.x + 54, labModule.geom.capTop.y - 30);
  return padViewport(unionBounds(pts), 20);
})();

function inPoints(out: Pt[], x: number, y: number): void {
  out.push({ x, y });
}

const stageEl = ref<HTMLElement | null>(null);
const cam = ref<Camera>({ scale: 1, ox: 0, oy: 0 });
const viewBox = computed(() => {
  const v = viewportOf(cam.value, bounds);
  return v.x + ' ' + v.y + ' ' + v.w + ' ' + v.h;
});
const zoomPct = computed(() => Math.round(cam.value.scale * 100));

const MIN_PX_PER_UNIT = 0.5;
const MIN_PX_PER_UNIT_NARROW = 0.78;
const PHONE_STAGE_WIDTH = 520;
const LABEL_LANE = CELL / 2;
let userAdjusted = false;

const stageSize = ref({ w: 0, h: 0 });
const effectiveScale = computed(() => {
  const { w, h } = stageSize.value;
  if (!w || !h) return 1;
  return Math.min(w / bounds.w, h / bounds.h) * cam.value.scale;
});
const dense = computed(() => effectiveScale.value < 0.76);
const phone = computed(() => stageSize.value.w > 0 && stageSize.value.w < PHONE_STAGE_WIDTH);
const cropped = computed(() => cam.value.scale > 1.001);

function measure(): void {
  const el = stageEl.value;
  if (!el) return;
  stageSize.value = { w: el.clientWidth, h: el.clientHeight };
}

function autoFit(): void {
  const el = stageEl.value;
  if (!el) return;
  measure();
  const w = el.clientWidth;
  const h = el.clientHeight;
  if (!w || !h) return;
  const fitScale = Math.min(w / bounds.w, h / bounds.h);
  let scale = clampScale(Math.max(1, MIN_PX_PER_UNIT / Math.max(fitScale, 0.0001)));
  if (w < PHONE_STAGE_WIDTH) {
    const laneW = Math.max(CELL, Math.floor(w / MIN_PX_PER_UNIT_NARROW / CELL) * CELL);
    scale = clampScale(Math.max(1, bounds.w / laneW));
  }
  const viewW = bounds.w / scale;
  let ox = (bounds.w - viewW) / 2;
  if (w < PHONE_STAGE_WIDTH && viewW < bounds.w) {
    ox = Math.round((bounds.x + ox - LABEL_LANE) / CELL) * CELL + LABEL_LANE - bounds.x;
  }
  cam.value = clampCamera({
    scale,
    ox,
    oy: (bounds.h - bounds.h / scale) * 0.4,
  }, bounds);
}

function fit(): void {
  userAdjusted = false;
  autoFit();
}

function zoomBy(factor: number, anchor = { fx: 0.5, fy: 0.5 }): void {
  userAdjusted = true;
  cam.value = zoomCamera(cam.value, bounds, factor, anchor);
}

function onWheel(e: WheelEvent): void {
  if (!e.ctrlKey && !e.metaKey) return;
  e.preventDefault();
  zoomBy(e.deltaY < 0 ? 1.1 : 1 / 1.1, pointerRatio(e));
}

const pointers = new Map<number, Pt>();
let dragOrigin: Pt | null = null;
let lastPoint: Pt | null = null;
let pinchState: { dist: number; mid: Pt } | null = null;
let moved = false;

function pointerRatio(e: { clientX: number; clientY: number }): { fx: number; fy: number } {
  const el = stageEl.value;
  if (!el) return { fx: 0.5, fy: 0.5 };
  const rect = el.getBoundingClientRect();
  return { fx: (e.clientX - rect.left) / Math.max(1, rect.width), fy: (e.clientY - rect.top) / Math.max(1, rect.height) };
}

function pinchPair(): { dist: number; mid: Pt } | null {
  const list = [...pointers.values()];
  if (list.length < 2) return null;
  const [a, b] = list;
  return {
    dist: Math.hypot(b.x - a.x, b.y - a.y),
    mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
  };
}

function onPointerDown(e: PointerEvent): void {
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  const target = e.target as Element | null;
  if (target?.closest?.('.nk-mod, button, input, a, label')) return;
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  moved = false;
  const pair = pinchPair();
  if (pair) {
    pinchState = pair;
    dragOrigin = null;
  } else {
    dragOrigin = { x: e.clientX, y: e.clientY };
    lastPoint = dragOrigin;
  }
  e.preventDefault();
}

function onPointerMove(e: PointerEvent): void {
  if (!pointers.has(e.pointerId)) return;
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  const el = stageEl.value;
  if (!el) return;
  const rect = el.getBoundingClientRect();

  const pair = pinchPair();
  if (pair && pinchState) {
    if (pinchState.dist > 4) zoomBy(pair.dist / pinchState.dist, pointerRatio(e));
    cam.value = panCamera(cam.value, bounds, pair.mid.x - pinchState.mid.x, pair.mid.y - pinchState.mid.y, rect.width, rect.height);
    pinchState = pair;
    moved = true;
    userAdjusted = true;
    return;
  }

  if (dragOrigin && lastPoint) {
    const dx = e.clientX - lastPoint.x;
    const dy = e.clientY - lastPoint.y;
    if (Math.abs(e.clientX - dragOrigin.x) + Math.abs(e.clientY - dragOrigin.y) > 4) moved = true;
    if (moved) {
      cam.value = panCamera(cam.value, bounds, dx, dy, rect.width, rect.height);
      userAdjusted = true;
    }
    lastPoint = { x: e.clientX, y: e.clientY };
  }
}

function endPointer(e: PointerEvent): void {
  pointers.delete(e.pointerId);
  if (pointers.size < 2) pinchState = null;
  if (pointers.size === 0) {
    dragOrigin = null;
    lastPoint = null;
  }
}

function onStageClick(e: MouseEvent): void {
  const dragged = moved;
  moved = false;
  if (dragged) return;
  if ((e.target as Element | null)?.closest?.('.nk-mod')) return;
  emit('select', null);
}

function onDblClick(e: MouseEvent): void {
  if ((e.target as Element | null)?.closest?.('.nk-mod')) return;
  zoomBy(1.4, pointerRatio(e));
}

function pick(id: string): void {
  emit('select', props.selected === id ? null : id);
}

function onKey(e: KeyboardEvent, id: string): void {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    pick(id);
  }
}

const activeIds = computed(() => {
  const set = new Set<string>();
  if (props.hovered) set.add(props.hovered);
  if (props.selected) set.add(props.selected);
  return set;
});
const hasActive = computed(() => activeIds.value.size > 0);

const linkedNodeIds = computed(() => {
  const set = new Set<string>();
  for (const id of activeIds.value) {
    set.add(id);
    for (const e of EDGES) {
      if (e.from === id) set.add(e.to);
      else if (e.to === id) set.add(e.from);
    }
  }
  return set;
});
const linkedWireIds = computed(() => {
  const set = new Set<string>();
  for (const e of EDGES) if (activeIds.value.has(e.from) || activeIds.value.has(e.to)) set.add(e.id);
  return set;
});

const query = computed(() => props.query.trim().toLowerCase());
const hitIds = computed(() => {
  const q = query.value;
  const set = new Set<string>();
  if (!q) return set;
  for (const n of NODES) {
    if (n.name.toLowerCase().includes(q) || n.en.toLowerCase().includes(q) || n.id.includes(q)) set.add(n.id);
  }
  return set;
});

const visibleWires = computed(() => wires.filter((w) => props.kind === 'all' || w.edge.kind === props.kind));
const traceWires = computed(() => visibleWires.value.filter((w) => linkedWireIds.value.has(w.edge.id)));

const booting = ref(true);
let bootTimer = 0;
let resizeObserver: ResizeObserver | null = null;
function playBoot(): void {
  window.clearTimeout(bootTimer);
  booting.value = false;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      booting.value = true;
      bootTimer = window.setTimeout(() => { booting.value = false; }, 1750);
    });
  });
}
onMounted(() => {
  stageEl.value?.addEventListener('wheel', onWheel, { passive: false });
  bootTimer = window.setTimeout(() => { booting.value = false; }, 1750);
  autoFit();
  if (stageEl.value) {
    resizeObserver = new ResizeObserver(() => {
      measure();
      if (!userAdjusted) autoFit();
    });
    resizeObserver.observe(stageEl.value);
  }
});
onBeforeUnmount(() => {
  window.clearTimeout(bootTimer);
  resizeObserver?.disconnect();
  stageEl.value?.removeEventListener('wheel', onWheel);
});
watch(() => props.bootKey, playBoot);

function wireClass(w: WireView): Record<string, boolean> {
  return {
    ['nk-wire--' + w.edge.kind]: true,
    'is-linked': linkedWireIds.value.has(w.edge.id),
    'is-dim': hasActive.value && !linkedWireIds.value.has(w.edge.id),
  };
}

function moduleClass(m: ModuleView): Record<string, boolean> {
  return {
    'is-sel': props.selected === m.node.id,
    'is-hover': props.hovered === m.node.id,
    'is-dim': hasActive.value && !linkedNodeIds.value.has(m.node.id),
    'is-hit': hitIds.value.has(m.node.id),
    'is-muted': query.value.length > 0 && !hitIds.value.has(m.node.id),
    'is-raw': m.node.gy === 5,
  };
}

</script>

<template>
  <div class="nk-atlas" :class="{ 'has-active': hasActive, 'is-booting': booting, 'is-dense': dense, 'is-phone': phone, 'is-cropped': cropped }">
    <div
      ref="stageEl"
      class="nk-atlas__stage"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="endPointer"
      @pointercancel="endPointer"
      @click="onStageClick"
      @dblclick="onDblClick"
    >
      <svg
        class="nk-atlas__svg"
        :viewBox="viewBox"
        preserveAspectRatio="xMidYMid meet"
        role="group"
        :aria-label="'系统架构等轴测地图：' + NODES.length + ' 个模块、' + EDGES.length + ' 条真实路径；Tab 可遍历模块，Enter 选中'"
      >
        <defs>
          <marker
            v-for="k in ['control', 'data', 'cdn', 'theme', 'build']"
            :id="'nk-tip-' + k"
            :key="k"
            viewBox="0 0 8 8"
            refX="6.4"
            refY="4"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M0 0 L8 4 L0 8 z" class="nk-atlas__tip" :class="'nk-atlas__tip--' + k" />
          </marker>
        </defs>

        <g class="nk-atlas__bands">
          <g
            v-for="t in tiers"
            :key="t.tier"
            class="nk-tier"
            :style="{ '--tier': t.gy, opacity: 1 - t.gy * 0.02 }"
          >
            <polygon class="nk-tier__top" :points="t.geom.top" />
            <polygon class="nk-tier__face" :points="t.geom.faceLeft" />
            <polygon class="nk-tier__face" :points="t.geom.faceRight" />
            <polyline class="nk-tier__lip" :points="t.geom.lip" />
            <line class="nk-tier__tick" :x1="t.geom.tick.x1" :y1="t.geom.tick.y1" :x2="t.geom.tick.x2" :y2="t.geom.tick.y2" />
            <text class="nk-tier__en" :x="t.geom.label.x" :y="t.geom.label.y - 13" text-anchor="end">{{ t.en }}</text>
            <text class="nk-tier__name" :x="t.geom.label.x" :y="t.geom.label.y + 1" text-anchor="end">{{ t.name }}</text>
            <text class="nk-tier__note" :x="t.geom.label.x" :y="t.geom.label.y + 14" text-anchor="end">{{ t.note }}</text>
          </g>
        </g>

        <g class="nk-atlas__wires">
          <g v-for="w in visibleWires" :key="w.edge.id" class="nk-wire-group" :class="wireClass(w)">
            <path class="nk-wire__casing" :d="w.d" />
            <path class="nk-wire" :d="w.d" />
            <path
              v-if="w.edge.kind !== 'control'"
              class="nk-wire__flow"
              :d="w.d"
              :style="{ animationDelay: (w.order % 7) * 0.42 + 's' }"
            />
          </g>
        </g>

        <g class="nk-atlas__modules">
          <g
            v-for="m in modules"
            :key="m.node.id"
            class="nk-mod"
            :class="moduleClass(m)"
            :style="{ '--nk-dom': m.dom, '--i': m.order }"
            role="button"
            tabindex="0"
            :aria-label="m.label"
            :aria-pressed="selected === m.node.id"
            @click.stop="pick(m.node.id)"
            @keydown="onKey($event, m.node.id)"
            @mouseenter="emit('hover', m.node.id)"
            @mouseleave="emit('hover', null)"
            @focus="emit('hover', m.node.id)"
            @blur="emit('hover', null)"
          >
            <polygon class="nk-mod__hit" :points="m.geom.silhouette" />
            <polygon class="nk-mod__shadow" :points="m.geom.shadow" />
            <polygon v-if="selected === m.node.id" class="nk-mod__ping nk-mod__ping--a" :points="m.geom.ring" />
            <polygon v-if="selected === m.node.id" class="nk-mod__ping nk-mod__ping--b" :points="m.geom.ring" />
            <polygon class="nk-mod__ring" :points="m.geom.ring" />
            <polygon class="nk-mod__face nk-mod__face--left" :points="m.geom.left" />
            <polygon class="nk-mod__face nk-mod__face--right" :points="m.geom.right" />
            <polygon class="nk-mod__roof" :points="m.geom.roof" />
            <polyline class="nk-mod__ridge" :points="m.geom.ridge" />
            <template v-for="(d, di) in m.decor" :key="di">
              <line v-if="d.el === 'line'" class="nk-mod__decor" :x1="d.x1" :y1="d.y1" :x2="d.x2" :y2="d.y2" />
              <path v-else-if="d.el === 'path'" class="nk-mod__decor" :d="d.d" />
              <rect v-else-if="d.el === 'rect'" class="nk-mod__decor nk-mod__decor--solid" :x="d.x" :y="d.y" :width="d.width" :height="d.height" />
              <circle v-else-if="d.el === 'circle'" class="nk-mod__decor nk-mod__decor--solid" :cx="d.cx" :cy="d.cy" :r="d.r" />
            </template>
            <polygon class="nk-mod__plate" :points="m.geom.plate" />
            <text class="nk-mod__name" :x="m.geom.base.x" :y="m.geom.labelY" text-anchor="middle">{{ m.node.name }}</text>
          </g>
        </g>

        <g class="nk-atlas__trace">
          <g v-for="w in traceWires" :key="'trace-' + w.edge.id" class="nk-trace" :class="'nk-trace--' + w.edge.kind">
            <path class="nk-trace__casing" :d="w.d" />
            <path class="nk-trace__core" :d="w.d" :marker-end="'url(#nk-tip-' + w.edge.kind + ')'" />
            <path class="nk-trace__pulse" :d="w.d" />
            <text
              class="nk-trace__label"
              :x="w.mid.x + w.normal.x * w.labelOffset"
              :y="w.mid.y + w.normal.y * w.labelOffset + 3"
              text-anchor="middle"
            >{{ w.edge.label }}</text>
          </g>
        </g>

        <g v-if="labModule" class="nk-here">
          <line class="nk-here__stem" :x1="labModule.geom.capTop.x" :y1="labModule.geom.capTop.y - 12" :x2="labModule.geom.capTop.x" :y2="labModule.geom.capTop.y - 25" />
          <circle class="nk-here__dot" :cx="labModule.geom.capTop.x" :cy="labModule.geom.capTop.y - 28" r="2.2" />
          <text class="nk-here__text" :x="labModule.geom.capTop.x + 8" :y="labModule.geom.capTop.y - 25">当前页</text>
        </g>
      </svg>

      <p class="nk-atlas__hint">拖拽平移 · 双指/滚轮缩放 · 双击放大</p>

      <div class="nk-atlas__zoom" role="group" aria-label="视图缩放">
        <button type="button" class="nk-atlas__zoom-btn" aria-label="缩小" @click="zoomBy(1 / 1.25)">−</button>
        <span class="nk-atlas__zoom-val">{{ zoomPct }}%</span>
        <button type="button" class="nk-atlas__zoom-btn" aria-label="放大" @click="zoomBy(1.25)">+</button>
        <button type="button" class="nk-atlas__zoom-btn nk-atlas__zoom-btn--wide" @click="fit">适应</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.nk-atlas {
  --nk-wire-control: var(--primary);
  --nk-wire-data: var(--em-400);
  --nk-wire-cdn: var(--gold-400);
  --nk-wire-theme: var(--sl-300);
  --nk-wire-build: var(--text2);
  position: relative;
  height: 100%;
  min-height: 0;
  color: var(--text);
}

.nk-atlas__stage {
  position: relative;
  height: 100%;
  overflow: hidden;
  touch-action: none;
  cursor: grab;
  background:
    radial-gradient(90% 70% at 50% 0%, color-mix(in srgb, var(--primary) 7%, transparent), transparent 72%),
    var(--bg);
  border: 1px solid var(--nk-sheet-border);
  border-radius: var(--nk-radius-card);
  box-shadow:
    inset 0 0 84px 0 color-mix(in srgb, var(--blk-950) 40%, transparent),
    var(--nk-shadow-card);
}
.nk-atlas__stage:active { cursor: grabbing; }

.nk-atlas__svg {
  display: block;
  width: 100%;
  height: 100%;
  user-select: none;
}

.nk-atlas.is-dense .nk-tier__note,
.nk-atlas.is-dense .nk-trace__label { display: none; }
.nk-atlas.is-phone .nk-tier text { display: none; }
.nk-atlas.is-cropped .nk-atlas__svg {
  -webkit-mask-image:
    linear-gradient(to right, transparent, black 16px, black calc(100% - 16px), transparent),
    linear-gradient(to bottom, transparent, black 16px, black calc(100% - 16px), transparent);
  mask-image:
    linear-gradient(to right, transparent, black 16px, black calc(100% - 16px), transparent),
    linear-gradient(to bottom, transparent, black 16px, black calc(100% - 16px), transparent);
  mask-composite: intersect;
  -webkit-mask-composite: source-in;
}
.nk-atlas.is-phone .nk-atlas__hint {
  padding: 2px 8px;
  border-radius: 4px;
  background: color-mix(in srgb, var(--bg) 74%, transparent);
}

.nk-atlas__bands { pointer-events: none; }

.nk-tier__top {
  fill: color-mix(in srgb, var(--sl-900) 58%, var(--blk-850));
  stroke: color-mix(in srgb, var(--sl-400) 34%, transparent);
  stroke-width: 1;
}
.nk-tier__face {
  fill: color-mix(in srgb, var(--sl-950) 62%, var(--blk-900));
  stroke: color-mix(in srgb, var(--sl-400) 20%, transparent);
  stroke-width: 0.7;
}
.nk-tier__lip {
  fill: none;
  stroke: color-mix(in srgb, var(--sl-300) 46%, transparent);
  stroke-width: 1.1;
}
.nk-tier__tick {
  stroke: color-mix(in srgb, var(--sl-300) 52%, transparent);
  stroke-width: 1;
}
.nk-tier__en {
  fill: var(--text3);
  font-family: var(--font-hud);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.2em;
}
.nk-tier__name {
  fill: var(--text);
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
}
.nk-tier__note {
  fill: var(--text3);
  font-family: var(--font-body);
  font-size: 9.5px;
  letter-spacing: 0.02em;
}

.nk-atlas__wires { pointer-events: none; }
.nk-wire__casing {
  fill: none;
  stroke: color-mix(in srgb, var(--bg) 82%, transparent);
  stroke-width: 4.6;
  stroke-linecap: round;
  stroke-dasharray: none;
  transition: opacity 0.2s ease;
}
.nk-wire {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
  opacity: 0.55;
  transition: opacity 0.2s ease;
}
.nk-wire--control .nk-wire { stroke: var(--nk-wire-control); stroke-width: 1.35; }
.nk-wire--data .nk-wire { stroke: var(--nk-wire-data); stroke-width: 1.6; stroke-dasharray: 7 6; }
.nk-wire--cdn .nk-wire { stroke: var(--nk-wire-cdn); stroke-width: 1.5; stroke-dasharray: 2 5 11 5; }
.nk-wire--theme .nk-wire { stroke: var(--nk-wire-theme); stroke-width: 1.5; stroke-dasharray: 1 5; }
.nk-wire--build .nk-wire { stroke: var(--nk-wire-build); stroke-width: 2.6; }
.nk-wire__flow {
  fill: none;
  stroke: var(--text-bright);
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-dasharray: 4 96;
  opacity: 0.55;
  animation: nk-wire-run 4.2s linear infinite;
}
.nk-atlas.has-active .nk-wire-group.is-dim .nk-wire,
.nk-atlas.has-active .nk-wire-group.is-dim .nk-wire__casing,
.nk-atlas.has-active .nk-wire-group.is-dim .nk-wire__flow { opacity: 0.08; }
.nk-atlas.has-active .nk-wire-group.is-linked .nk-wire { opacity: 0.95; }

.nk-atlas__trace { pointer-events: none; }
.nk-trace__casing {
  fill: none;
  stroke: var(--bg);
  stroke-width: 6.4;
  stroke-linecap: round;
  opacity: 0.9;
}
.nk-trace__core {
  fill: none;
  stroke-width: 2.4;
  stroke-linecap: round;
}
.nk-trace__pulse {
  fill: none;
  stroke: var(--text-bright);
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-dasharray: 9 320;
  opacity: 0.85;
  animation: nk-trace-run 2.1s linear infinite;
}
.nk-trace--control .nk-trace__core { stroke: var(--text); }
.nk-trace--data .nk-trace__core { stroke: var(--em-300); }
.nk-trace--cdn .nk-trace__core { stroke: var(--gold-300); }
.nk-trace--theme .nk-trace__core { stroke: var(--metric-val); }
.nk-trace--build .nk-trace__core { stroke: var(--text-bright); stroke-width: 3.2; }

.nk-trace__label {
  fill: var(--text-bright);
  font-family: var(--font-body);
  font-size: 10px;
  font-weight: 600;
  paint-order: stroke;
  stroke: var(--bg);
  stroke-width: 3.2px;
  stroke-linejoin: round;
}

.nk-atlas__tip { fill: var(--text2); }
.nk-atlas__tip--data { fill: var(--em-400); }
.nk-atlas__tip--cdn { fill: var(--gold-400); }
.nk-atlas__tip--theme { fill: var(--primary); }
.nk-atlas__tip--build { fill: var(--text-bright); }

.nk-mod {
  cursor: pointer;
  outline: none;
  transition: transform 0.26s var(--nk-ease-out), opacity 0.2s ease;
}
.nk-mod:hover,
.nk-mod.is-hover,
.nk-mod:focus-visible { transform: translateY(-3px); }
.nk-mod.is-sel { transform: translateY(-6px); }
.nk-atlas.has-active .nk-mod.is-dim { opacity: 0.28; }
.nk-atlas.has-active .nk-mod.is-hit { opacity: 1; }
.nk-mod.is-muted { opacity: 0.2; }
.nk-mod.is-muted.is-hit { opacity: 1; }

.nk-mod__hit { fill: transparent; }
.nk-mod__shadow {
  fill: color-mix(in srgb, var(--blk-950) 62%, transparent);
}
.nk-mod__ridge {
  fill: none;
  stroke: color-mix(in srgb, var(--text-bright) 55%, transparent);
  stroke-width: 1;
  stroke-linejoin: round;
  stroke-linecap: round;
}
.nk-mod__face {
  stroke: color-mix(in srgb, var(--nk-dom) 26%, var(--blk-950));
  stroke-width: 0.7;
  stroke-linejoin: round;
  transition: fill 0.2s ease;
}
.nk-mod__face--left { fill: color-mix(in srgb, var(--nk-dom) 26%, var(--blk-950)); }
.nk-mod__face--right { fill: color-mix(in srgb, var(--nk-dom) 12%, var(--blk-950)); }
.nk-mod__roof {
  fill: color-mix(in srgb, var(--nk-dom) 62%, var(--text-bright) 38%);
  stroke: color-mix(in srgb, var(--nk-dom) 40%, var(--blk-950));
  stroke-width: 0.9;
  stroke-linejoin: round;
  transition: fill 0.2s var(--nk-ease-out);
}
.nk-mod:hover .nk-mod__roof,
.nk-mod.is-hover .nk-mod__roof,
.nk-mod:focus-visible .nk-mod__roof { fill: color-mix(in srgb, var(--nk-dom) 48%, var(--text-bright) 52%); }
.nk-mod.is-raw .nk-mod__roof { fill: color-mix(in srgb, var(--nk-dom) 74%, var(--text-bright) 26%); }
.nk-mod.is-raw .nk-mod__face--left { fill: color-mix(in srgb, var(--nk-dom) 10%, var(--blk-950)); }
.nk-mod.is-raw .nk-mod__face--right { fill: color-mix(in srgb, var(--nk-dom) 20%, var(--blk-950)); }
.nk-mod__plate {
  fill: none;
  stroke: color-mix(in srgb, var(--blk-950) 16%, transparent);
  stroke-width: 0.6;
}
.nk-mod__decor {
  fill: none;
  stroke: color-mix(in srgb, var(--nk-dom) 45%, var(--blk-950) 55%);
  stroke-width: 1.3;
  stroke-linecap: round;
}
.nk-mod__decor--solid {
  fill: color-mix(in srgb, var(--nk-dom) 34%, var(--blk-900));
  stroke: color-mix(in srgb, var(--nk-dom) 52%, var(--blk-950));
  stroke-width: 1;
}
.nk-mod__name {
  fill: color-mix(in srgb, var(--blk-950) 88%, transparent);
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.01em;
  pointer-events: none;
}

.nk-mod__ring {
  fill: none;
  stroke: var(--nk-dom);
  stroke-width: 1.2;
  stroke-dasharray: 4 4;
  opacity: 0;
  transition: opacity 0.2s ease;
}
.nk-mod.is-sel .nk-mod__ring,
.nk-mod.is-hover .nk-mod__ring,
.nk-mod:focus-visible .nk-mod__ring,
.nk-mod.is-hit .nk-mod__ring { opacity: 0.95; }
.nk-mod.is-sel .nk-mod__ring { stroke: var(--text-bright); }
.nk-mod.is-hit .nk-mod__ring { stroke: var(--gold-300); }

.nk-mod__ping {
  fill: none;
  stroke: var(--text-bright);
  stroke-width: 1;
  transform-box: fill-box;
  transform-origin: center;
  animation: nk-mod-ping 2.6s var(--nk-ease-out) infinite;
  pointer-events: none;
}
.nk-mod__ping--b { animation-delay: 1.3s; }

.nk-here { pointer-events: none; }
.nk-here__stem {
  stroke: var(--text3);
  stroke-width: 1;
}
.nk-here__dot {
  fill: var(--text-bright);
  stroke: var(--bg);
  stroke-width: 1.5;
}
.nk-here__text {
  fill: var(--text2);
  font-family: var(--font-hud);
  font-size: 9.5px;
  letter-spacing: 0.14em;
  paint-order: stroke;
  stroke: var(--bg);
  stroke-width: 3px;
}

.nk-atlas__hint {
  position: absolute;
  left: 14px;
  bottom: 12px;
  margin: 0;
  font-family: var(--font-hud);
  font-size: 9.5px;
  letter-spacing: 0.08em;
  color: var(--text3);
  pointer-events: none;
}

.nk-atlas__zoom {
  position: absolute;
  right: 12px;
  bottom: 12px;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 3px;
  border: 1px solid var(--nk-sheet-border);
  border-radius: 999px;
  background: var(--nk-sheet-bg);
}
.nk-atlas__zoom-btn {
  min-width: 26px;
  height: 26px;
  padding: 0 6px;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: var(--text2);
  font-family: var(--font-hud);
  font-size: 12px;
  cursor: pointer;
  transition: background 0.18s var(--nk-ease-out), color 0.18s var(--nk-ease-out);
}
.nk-atlas__zoom-btn--wide { font-size: 10.5px; letter-spacing: 0.06em; }
.nk-atlas__zoom-btn:hover,
.nk-atlas__zoom-btn:focus-visible { background: var(--nk-shell-hover); color: var(--text-bright); }
.nk-atlas__zoom-val {
  min-width: 38px;
  text-align: center;
  font-family: var(--font-hud);
  font-size: 10px;
  color: var(--text3);
}

.nk-atlas.is-booting .nk-tier { animation: nk-tier-in 0.55s var(--nk-ease-out) both; animation-delay: calc(var(--tier) * 70ms); }
.nk-atlas.is-booting .nk-wire { animation: nk-wire-in 0.7s ease both; animation-delay: 620ms; }
.nk-atlas.is-booting .nk-mod {
  animation: nk-mod-in 0.52s var(--nk-ease-out) both;
  animation-delay: calc(240ms + var(--i) * 26ms);
}

@keyframes nk-tier-in {
  from { opacity: 0; translate: 0 10px; }
}
@keyframes nk-wire-in {
  from { opacity: 0; }
}
@keyframes nk-mod-in {
  from { opacity: 0; translate: 0 12px; }
}
@keyframes nk-trace-run {
  from { stroke-dashoffset: 340; }
  to { stroke-dashoffset: 0; }
}
@keyframes nk-wire-run {
  from { stroke-dashoffset: 100; }
  to { stroke-dashoffset: 0; }
}
@keyframes nk-mod-ping {
  0% { transform: scale(0.62); opacity: 0; }
  14% { opacity: 0.5; }
  100% { transform: scale(1.85); opacity: 0; }
}

@media (max-width: 767px) {
  .nk-atlas__hint {
    top: 12px;
    bottom: auto;
    left: 12px;
    right: auto;
    max-width: calc(100% - 176px);
  }
  .nk-atlas__zoom {
    top: 10px;
    bottom: auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  .nk-atlas.is-booting .nk-tier,
  .nk-atlas.is-booting .nk-wire,
  .nk-atlas.is-booting .nk-mod { animation: none; }
  .nk-trace__pulse,
  .nk-wire__flow,
  .nk-mod__ping { animation: none; opacity: 0; }
  .nk-mod { transition: none; }
}
</style>
