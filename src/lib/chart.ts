export interface ChartPoint {
  x: number;
  y: number;
}

function finitePoints(points: ChartPoint[]): ChartPoint[] {
  return points.filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
}

function pathOf(points: ChartPoint[]): string {
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x} ${point.y}`).join(' ');
}

export function linearScale(d0: number, d1: number, r0: number, r1: number): (v: number) => number {
  const span = d1 - d0;
  const ratio = Number.isFinite(span) && span !== 0 ? (r1 - r0) / span : 0;
  return (v: number) => r0 + (v - d0) * ratio;
}

export function clamp(v: number, lo: number, hi: number): number {
  const min = Math.min(lo, hi);
  const max = Math.max(lo, hi);
  if (Number.isNaN(v)) return min;
  if (v < min) return min;
  if (v > max) return max;
  return v;
}

const NICE_FACTORS = [1, 2, 5] as const;
const FINE_FACTORS = [1, 2, 2.5, 5] as const;

function candidateSteps(span: number, divisions: number, fine: boolean): number[] {
  const raw = span / divisions;
  const exponent = Math.floor(Math.log10(raw));
  const factors = fine ? FINE_FACTORS : NICE_FACTORS;
  const steps: number[] = [];
  for (let offset = -1; offset <= 1; offset += 1) {
    for (const factor of factors) steps.push(factor * 10 ** (exponent + offset));
  }
  return steps;
}

function ticksFor(lo: number, hi: number, step: number): number[] {
  if (!Number.isFinite(step) || step <= 0) return [];
  const first = Math.floor(lo / step + 1e-9);
  const last = Math.ceil(hi / step - 1e-9);
  const ticks: number[] = [];
  for (let index = first; index <= last; index += 1) {
    ticks.push(Number((index * step).toFixed(10)));
  }
  return ticks;
}

function tickScore(ticks: number[], target: number, lo: number, hi: number): number {
  const inRange = Math.abs(ticks.length - target) <= 1;
  const padding = lo - ticks[0] + (ticks[ticks.length - 1] - hi);
  return (inRange ? 0 : 100) + Math.abs(ticks.length - target) + (padding / (hi - lo)) * 0.001;
}

function evenlySpacedTicks(lo: number, hi: number, target: number): number[] {
  const ticks: number[] = [];
  for (let index = 0; index < target; index += 1) {
    ticks.push(Number((lo + ((hi - lo) * index) / (target - 1)).toFixed(10)));
  }
  return ticks;
}

export function niceTicks(min: number, max: number, count = 5): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [];
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  if (lo === hi) return [lo];
  const divisions = Math.max(2, Math.floor(count)) - 1;
  const target = divisions + 1;
  for (const fine of [false, true]) {
    let best: number[] | null = null;
    let bestScore = Number.POSITIVE_INFINITY;
    for (const step of candidateSteps(hi - lo, divisions, fine)) {
      const ticks = ticksFor(lo, hi, step);
      if (!ticks.length) continue;
      const score = tickScore(ticks, target, lo, hi);
      if (score < bestScore) {
        bestScore = score;
        best = ticks;
      }
    }
    if (best && bestScore < 100) return best;
  }
  return evenlySpacedTicks(lo, hi, target);
}

export function linePath(points: ChartPoint[]): string {
  return pathOf(finitePoints(points));
}

export function areaPath(points: ChartPoint[], baseY: number): string {
  const valid = finitePoints(points);
  if (valid.length === 0) return '';
  const line = pathOf(valid);
  const first = valid[0];
  const last = valid[valid.length - 1];
  const floor = Number.isFinite(baseY) ? baseY : 0;
  return `${line} L${last.x} ${floor} L${first.x} ${floor} Z`;
}

export function barLength(value: number, max: number): number {
  if (!Number.isFinite(max) || max <= 0) return 0;
  return clamp(value / max, 0, 1);
}
