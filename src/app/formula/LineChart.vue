<script setup lang="ts">
import { computed } from 'vue';
import { areaPath, clamp, linePath, linearScale } from '../../lib/chart';
import type { ChartPoint } from '../../lib/chart';

interface ChartSeries {
  name: string;
  points: ChartPoint[];
  tone?: 'a' | 'b' | 'c' | 'd';
}

interface Tick {
  v: number;
  label: string;
}

const props = defineProps<{
  series: ChartSeries[];
  xTicks: Tick[];
  yTicks: Tick[];
  xLabel?: string;
  yLabel?: string;
  ariaLabel: string;
  height?: number;
  baseline?: { value: number; label: string };
  marker?: { x: number; y: number; label?: string };
}>();

const VB_W = 640;
const VB_H = 220;

function spanOf(ticks: Tick[], axis: 'x' | 'y'): [number, number] {
  let lo = Number.POSITIVE_INFINITY;
  let hi = Number.NEGATIVE_INFINITY;
  for (const tick of ticks) {
    if (!Number.isFinite(tick.v)) continue;
    lo = Math.min(lo, tick.v);
    hi = Math.max(hi, tick.v);
  }
  for (const item of props.series) {
    for (const point of item.points) {
      const v = point[axis];
      if (!Number.isFinite(v)) continue;
      lo = Math.min(lo, v);
      hi = Math.max(hi, v);
    }
  }
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return [0, 1];
  if (hi - lo < 1e-9) return [lo - 0.5, hi + 0.5];
  return [lo, hi];
}

const xSpan = computed(() => spanOf(props.xTicks, 'x'));
const ySpan = computed(() => {
  const [lo, hi] = spanOf(props.yTicks, 'y');
  const pad = (hi - lo) * 0.06;
  return [lo - pad, hi + pad];
});
const sx = computed(() => linearScale(xSpan.value[0], xSpan.value[1], 0, VB_W));
const sy = computed(() => linearScale(ySpan.value[0], ySpan.value[1], VB_H, 0));

const paths = computed(() =>
  props.series.map((item, index) => {
    const fx = sx.value;
    const fy = sy.value;
    const points = item.points
      .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y))
      .map((point) => ({ x: clamp(fx(point.x), 0, VB_W), y: clamp(fy(point.y), 0, VB_H) }));
    return {
      tone: item.tone ?? 'a',
      line: points.length ? linePath(points) : '',
      area: index === 0 && points.length > 1 ? areaPath(points, VB_H) : '',
    };
  }),
);

const guides = computed(() =>
  props.yTicks
    .filter((tick) => Number.isFinite(tick.v))
    .map((tick) => ({ y: sy.value(tick.v), zero: Math.abs(tick.v) < 1e-9 })),
);

const yMarks = computed(() =>
  props.yTicks
    .filter((tick) => Number.isFinite(tick.v))
    .map((tick) => ({ key: String(tick.v), label: tick.label, top: (sy.value(tick.v) / VB_H) * 100 })),
);

const xMarks = computed(() =>
  props.xTicks
    .filter((tick) => Number.isFinite(tick.v))
    .map((tick) => ({ label: tick.label, left: (sx.value(tick.v) / VB_W) * 100 })),
);

const svgStyle = computed(() => (props.height ? { height: `${props.height}px` } : undefined));

const baselineY = computed(() => (props.baseline ? sy.value(props.baseline.value) : 0));
const baselineTop = computed(() => (baselineY.value / VB_H) * 100);

const markerStyle = computed(() => {
  const marker = props.marker;
  if (!marker || !Number.isFinite(marker.x) || !Number.isFinite(marker.y)) return null;
  return {
    left: `${(sx.value(marker.x) / VB_W) * 100}%`,
    top: `${(sy.value(marker.y) / VB_H) * 100}%`,
  };
});
</script>

<template>
  <figure class="nk-formula-chart">
    <div class="nk-formula-chart__head">
      <span v-if="yLabel" class="nk-formula-chart__unit">{{ yLabel }}</span>
      <ul v-if="series.length > 1" class="nk-formula-chart__legend">
        <li v-for="item in series" :key="item.name" class="nk-formula-chart__legend-item">
          <span class="nk-formula-chart__tone" :class="`nk-formula-chart__tone--${item.tone ?? 'a'}`" aria-hidden="true"></span>
          {{ item.name }}
        </li>
      </ul>
    </div>

    <div class="nk-formula-chart__plot">
      <div class="nk-formula-chart__yaxis" aria-hidden="true">
        <span
          v-for="mark in yMarks"
          :key="mark.key"
          class="nk-formula-chart__ytick"
          :style="{ top: `${mark.top}%` }"
        >{{ mark.label }}</span>
      </div>

      <div class="nk-formula-chart__stage">
        <svg
          class="nk-formula-chart__svg"
          :viewBox="`0 0 ${VB_W} ${VB_H}`"
          preserveAspectRatio="none"
          role="img"
          :aria-label="ariaLabel"
          :style="svgStyle"
        >
          <line
            v-for="(guide, gi) in guides"
            :key="`g${gi}`"
            class="nk-formula-chart__grid"
            :class="{ 'nk-formula-chart__grid--zero': guide.zero }"
            x1="0"
            :x2="VB_W"
            :y1="guide.y"
            :y2="guide.y"
            vector-effect="non-scaling-stroke"
          />
          <line
            v-if="baseline"
            class="nk-formula-chart__baseline-line"
            x1="0"
            :x2="VB_W"
            :y1="baselineY"
            :y2="baselineY"
            vector-effect="non-scaling-stroke"
          />
          <template v-for="(item, ai) in paths" :key="`a${ai}`">
            <path
              v-if="item.area"
              class="nk-formula-chart__area"
              :class="`nk-formula-chart__area--${item.tone}`"
              :d="item.area"
            />
          </template>
          <template v-for="(item, li) in paths" :key="`l${li}`">
            <path
              v-if="item.line"
              class="nk-formula-chart__line"
              :class="`nk-formula-chart__line--${item.tone}`"
              :d="item.line"
              vector-effect="non-scaling-stroke"
            />
          </template>
        </svg>
        <span
          v-if="baseline"
          class="nk-formula-chart__baseline-tag"
          :style="{ top: `${baselineTop}%` }"
        >{{ baseline.label }}</span>
        <span
          v-if="markerStyle"
          class="nk-formula-chart__marker"
          :style="markerStyle"
          :title="marker?.label"
        ></span>
      </div>

      <div class="nk-formula-chart__xaxis" aria-hidden="true">
        <span
          v-for="(mark, i) in xMarks"
          :key="mark.label"
          class="nk-formula-chart__xtick"
          :class="{
            'nk-formula-chart__xtick--first': i === 0,
            'nk-formula-chart__xtick--last': i === xMarks.length - 1,
          }"
          :style="{ left: `${mark.left}%` }"
        >{{ mark.label }}</span>
      </div>
    </div>

    <figcaption v-if="xLabel" class="nk-formula-chart__caption">{{ xLabel }}</figcaption>
  </figure>
</template>
