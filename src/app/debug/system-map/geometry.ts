import type { MapEdge, MapNode } from './map-data';

export const CELL = 88;
export const HALF_W = CELL * 0.48;
export const HALF_H = HALF_W / 2;
export const EDGE_TRIM = 26;
export const BAND_DEPTH = 13;
export const MIN_SCALE = 0.82;
export const MAX_SCALE = 4;

const ROW_SHIFT = [0, 44, 84, 126, 166, 208];

export interface Pt { x: number; y: number }
export interface Viewport { x: number; y: number; w: number; h: number }
export interface Camera { scale: number; ox: number; oy: number }

const round = (v: number): number => Math.round(v * 10) / 10;

export function rowShift(gy: number): number {
  return ROW_SHIFT[gy] ?? 0;
}

export function project(gx: number, gy: number, shift: number): Pt {
  return { x: (gx - gy) * CELL, y: (gx + gy) * (CELL / 2) + shift };
}

export function poly(points: Pt[]): string {
  return points.map((p) => round(p.x) + ',' + round(p.y)).join(' ');
}

export function nodeBase(node: MapNode): Pt {
  return project(node.gx, node.gy, rowShift(node.gy));
}

export interface ModuleGeom {
  base: Pt;
  height: number;
  roof: string;
  left: string;
  right: string;
  silhouette: string;
  plate: string;
  ring: string;
  shadow: string;
  ridge: string;
  capTop: Pt;
  labelY: number;
}

export function moduleGeom(base: Pt, height: number): ModuleGeom {
  const { x, y } = base;
  const h = height;
  const capY = y - h;
  return {
    base,
    height: h,
    roof: poly([
      { x, y: capY - HALF_H },
      { x: x + HALF_W, y: capY },
      { x, y: capY + HALF_H },
      { x: x - HALF_W, y: capY },
    ]),
    left: poly([
      { x: x - HALF_W, y },
      { x, y: y + HALF_H },
      { x, y: y + HALF_H - h },
      { x: x - HALF_W, y: capY },
    ]),
    right: poly([
      { x, y: y + HALF_H },
      { x: x + HALF_W, y },
      { x: x + HALF_W, y: capY },
      { x, y: y + HALF_H - h },
    ]),
    silhouette: poly([
      { x, y: capY - HALF_H },
      { x: x + HALF_W, y: capY },
      { x: x + HALF_W, y },
      { x, y: y + HALF_H },
      { x: x - HALF_W, y },
      { x: x - HALF_W, y: capY },
    ]),
    plate: poly([
      { x, y: capY - HALF_H * 0.84 },
      { x: x + HALF_W * 0.86, y: capY },
      { x, y: capY + HALF_H * 0.84 },
      { x: x - HALF_W * 0.86, y: capY },
    ]),
    ring: poly([
      { x, y: y - HALF_H - 7 },
      { x: x + HALF_W + 8, y },
      { x, y: y + HALF_H + 7 },
      { x: x - HALF_W - 8, y },
    ]),
    shadow: poly([
      { x: x + 4, y: y - HALF_H + 5 },
      { x: x + HALF_W + 4, y: y + 5 },
      { x: x + 4, y: y + HALF_H + 5 },
      { x: x - HALF_W + 4, y: y + 5 },
    ]),
    ridge: poly([
      { x: x + HALF_W, y: capY },
      { x, y: capY - HALF_H },
      { x: x - HALF_W, y: capY },
    ]),
    capTop: { x, y: capY },
    labelY: capY + 3.4,
  };
}

export type DecorPrim =
  | { el: 'line'; x1: number; y1: number; x2: number; y2: number }
  | { el: 'path'; d: string }
  | { el: 'rect'; x: number; y: number; width: number; height: number }
  | { el: 'circle'; cx: number; cy: number; r: number };

export function decorGeom(decor: string, cap: Pt): DecorPrim[] {
  const { x, y } = cap;
  switch (decor) {
    case 'mast':
      return [
        { el: 'line', x1: x, y1: y - 4, x2: x, y2: y - 26 },
        { el: 'circle', cx: x, cy: y - 28, r: 2.2 },
      ];
    case 'dish':
      return [
        { el: 'path', d: 'M ' + round(x - 15) + ' ' + round(y - 16) + ' A 15 11 0 0 1 ' + round(x + 15) + ' ' + round(y - 16) },
        { el: 'line', x1: x, y1: y - 16, x2: x, y2: y - 2 },
        { el: 'circle', cx: x, cy: y - 19, r: 1.6 },
      ];
    case 'chimney':
      return [
        { el: 'rect', x: round(x - 5), y: round(y - 24), width: 9, height: 24 },
        { el: 'rect', x: round(x - 7), y: round(y - 27), width: 13, height: 4 },
      ];
    case 'tank':
      return [
        { el: 'path', d: 'M ' + round(x - 13) + ' ' + round(y - 2) + ' A 13 6 0 0 1 ' + round(x + 13) + ' ' + round(y - 2) },
        { el: 'line', x1: round(x - 13), y1: round(y - 2), x2: round(x - 13), y2: round(y - 15) },
        { el: 'line', x1: round(x + 13), y1: round(y - 2), x2: round(x + 13), y2: round(y - 15) },
        { el: 'path', d: 'M ' + round(x - 13) + ' ' + round(y - 15) + ' A 13 6 0 0 1 ' + round(x + 13) + ' ' + round(y - 15) },
      ];
    case 'dome':
      return [{ el: 'path', d: 'M ' + round(x - 12) + ' ' + round(y - 12) + ' A 12 12 0 0 1 ' + round(x + 12) + ' ' + round(y - 12) }];
    default:
      return [];
  }
}

export interface BandGeom {
  top: string;
  faceLeft: string;
  faceRight: string;
  lip: string;
  label: Pt;
  tick: { x1: number; y1: number; x2: number; y2: number };
  center: Pt;
}

export function bandGeom(minGx: number, maxGx: number, gy: number): BandGeom {
  const shift = rowShift(gy);
  const north = project(minGx - 0.5, gy - 0.5, shift);
  const east = project(maxGx + 0.5, gy - 0.5, shift);
  const south = project(maxGx + 0.5, gy + 0.5, shift);
  const west = project(minGx - 0.5, gy + 0.5, shift);
  const d = BAND_DEPTH;
  return {
    top: poly([north, east, south, west]),
    faceLeft: poly([west, south, { x: south.x, y: south.y + d }, { x: west.x, y: west.y + d }]),
    faceRight: poly([south, east, { x: east.x, y: east.y + d }, { x: south.x, y: south.y + d }]),
    lip: poly([west, south, east]),
    label: { x: west.x - 18, y: west.y - 8 },
    tick: { x1: west.x - 16, y1: west.y - 7, x2: west.x - 4, y2: west.y - 2 },
    center: { x: (west.x + east.x) / 2, y: (north.y + south.y) / 2 },
  };
}

export interface CurveGeom {
  d: string;
  mid: Pt;
  normal: Pt;
}

export function edgeCurve(from: Pt, to: Pt, seed: number): CurveGeom {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const sx = from.x + ux * EDGE_TRIM;
  const sy = from.y + uy * EDGE_TRIM;
  const ex = to.x - ux * EDGE_TRIM;
  const ey = to.y - uy * EDGE_TRIM;
  const sag = Math.min(30, len * 0.14);
  const bow = (((seed % 5) + 5) % 5 - 2) * Math.min(7, len * 0.035);
  const px = -uy;
  const py = ux;
  const c1 = { x: sx + dx * 0.3 + px * bow, y: sy + dy * 0.3 + py * bow + sag };
  const c2 = { x: ex - dx * 0.3 + px * bow, y: ey - dy * 0.3 + py * bow + sag };
  const tx = 0.75 * (c1.x - sx) + 1.5 * (c2.x - c1.x) + 0.75 * (ex - c2.x);
  const ty = 0.75 * (c1.y - sy) + 1.5 * (c2.y - c1.y) + 0.75 * (ey - c2.y);
  const tlen = Math.hypot(tx, ty) || 1;
  return {
    d: 'M ' + round(sx) + ' ' + round(sy)
      + ' C ' + round(c1.x) + ' ' + round(c1.y)
      + ' ' + round(c2.x) + ' ' + round(c2.y)
      + ' ' + round(ex) + ' ' + round(ey),
    mid: {
      x: (sx + 3 * c1.x + 3 * c2.x + ex) / 8,
      y: (sy + 3 * c1.y + 3 * c2.y + ey) / 8,
    },
    normal: { x: -ty / tlen, y: tx / tlen },
  };
}

export function degrees(edges: MapEdge[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const e of edges) {
    map.set(e.from, (map.get(e.from) ?? 0) + 1);
    map.set(e.to, (map.get(e.to) ?? 0) + 1);
  }
  return map;
}

export function moduleHeight(deg: number): number {
  return 20 + 7 * Math.min(deg, 6);
}

export interface Neighbourhood {
  upstream: string[];
  downstream: string[];
  edges: MapEdge[];
}

export function neighbourhood(id: string, edges: MapEdge[]): Neighbourhood {
  const upstream: string[] = [];
  const downstream: string[] = [];
  const hits: MapEdge[] = [];
  for (const e of edges) {
    if (e.from === id) {
      downstream.push(e.to);
      hits.push(e);
    } else if (e.to === id) {
      upstream.push(e.from);
      hits.push(e);
    }
  }
  return { upstream, downstream, edges: hits };
}

export function unionBounds(points: Pt[]): Viewport {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

export function padViewport(box: Viewport, pad: number): Viewport {
  return { x: box.x - pad, y: box.y - pad, w: box.w + pad * 2, h: box.h + pad * 2 };
}

export function clampScale(scale: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}

export function clampCamera(cam: Camera, base: Viewport): Camera {
  const w = base.w / cam.scale;
  const h = base.h / cam.scale;
  const slackX = base.w * 0.22;
  const slackY = base.h * 0.22;
  const centre = (span: number, size: number): number => (size >= span ? (span - size) / 2 : 0);
  const loX = -slackX;
  const hiX = base.w - w + slackX;
  const loY = -slackY;
  const hiY = base.h - h + slackY;
  return {
    scale: cam.scale,
    ox: w >= base.w ? centre(base.w, w) : Math.min(hiX, Math.max(loX, cam.ox)),
    oy: h >= base.h ? centre(base.h, h) : Math.min(hiY, Math.max(loY, cam.oy)),
  };
}

export function viewportOf(cam: Camera, base: Viewport): Viewport {
  return { x: base.x + cam.ox, y: base.y + cam.oy, w: base.w / cam.scale, h: base.h / cam.scale };
}

export function zoomCamera(cam: Camera, base: Viewport, factor: number, anchor: { fx: number; fy: number }): Camera {
  const scale = clampScale(cam.scale * factor);
  const view = viewportOf(cam, base);
  const ax = view.x + view.w * anchor.fx;
  const ay = view.y + view.h * anchor.fy;
  const next = {
    scale,
    ox: ax - (base.w / scale) * anchor.fx - base.x,
    oy: ay - (base.h / scale) * anchor.fy - base.y,
  };
  return clampCamera(next, base);
}

export function panCamera(cam: Camera, base: Viewport, dxPx: number, dyPx: number, boxW: number, boxH: number): Camera {
  const w = base.w / cam.scale;
  const h = base.h / cam.scale;
  return clampCamera(
    {
      scale: cam.scale,
      ox: cam.ox - (dxPx / Math.max(1, boxW)) * w,
      oy: cam.oy - (dyPx / Math.max(1, boxH)) * h,
    },
    base,
  );
}
