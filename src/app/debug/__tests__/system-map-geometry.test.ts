// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  CELL, HALF_H, HALF_W, MIN_SCALE, MAX_SCALE,
  bandGeom, clampCamera, clampScale, degrees, edgeCurve, moduleGeom, moduleHeight,
  neighbourhood, nodeBase, padViewport, panCamera, project, unionBounds, viewportOf, zoomCamera,
  type Camera, type Viewport,
} from '../system-map/geometry';
import { EDGES, NODES } from '../system-map/map-data';

const BASE: Viewport = { x: 0, y: 0, w: 1000, h: 600 };
const FIT: Camera = { scale: 1, ox: 0, oy: 0 };

function pointsOf(s: string): { x: number; y: number }[] {
  return s.split(' ').map((pair) => {
    const [x, y] = pair.split(',');
    return { x: Number(x), y: Number(y) };
  });
}

describe('system map geometry', () => {
  it('projects grid cells onto a 2:1 isometric lattice', () => {
    const origin = project(0, 0, 0);
    expect(origin).toEqual({ x: 0, y: 0 });
    expect(project(1, 0, 0)).toEqual({ x: CELL, y: CELL / 2 });
    expect(project(0, 1, 0)).toEqual({ x: -CELL, y: CELL / 2 });
  });

  it('gives every node a footprint four times its half extents', () => {
    const geom = moduleGeom({ x: 100, y: 200 }, 40);
    const roof = pointsOf(geom.roof);
    const silhouette = pointsOf(geom.silhouette);
    expect(roof).toHaveLength(4);
    expect(silhouette).toHaveLength(6);
    const xs = roof.map((p) => p.x);
    expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(HALF_W * 2, 0);
    const plate = pointsOf(geom.plate);
    expect(Math.max(...plate.map((p) => p.x)) - Math.min(...plate.map((p) => p.x))).toBeLessThan(HALF_W * 2);
    expect(geom.labelY).toBeCloseTo(160 + 3.4, 1);
  });

  it('keeps module height inside the gap between tiers', () => {
    expect(moduleHeight(0)).toBe(20);
    expect(moduleHeight(30)).toBe(moduleHeight(6));
    expect(moduleHeight(6)).toBeLessThan(85);
    for (let d = 0; d <= 40; d++) expect(moduleHeight(d + 1)).toBeGreaterThanOrEqual(moduleHeight(d));
  });

  it('counts degrees on both ends of every edge', () => {
    const deg = degrees(EDGES);
    const manual = new Map<string, number>();
    for (const e of EDGES) {
      manual.set(e.from, (manual.get(e.from) ?? 0) + 1);
      manual.set(e.to, (manual.get(e.to) ?? 0) + 1);
    }
    expect([...deg.entries()].sort()).toEqual([...manual.entries()].sort());
    expect(deg.get('router')).toBe(EDGES.filter((e) => e.from === 'router' || e.to === 'router').length);
  });

  it('splits neighbourhoods by direction without dropping shared edges', () => {
    const id = 'router';
    const nb = neighbourhood(id, EDGES);
    expect(nb.downstream).toContain('detail');
    expect(nb.upstream).toContain('shell');
    expect(nb.edges).toHaveLength(EDGES.filter((e) => e.from === id || e.to === id).length);
    expect(neighbourhood('nobody', EDGES).edges).toHaveLength(0);
  });

  it('anchors edge curves between the two module bases', () => {
    const a = { x: 0, y: 0 };
    const b = { x: 300, y: 120 };
    const curve = edgeCurve(a, b, 0);
    expect(curve.d.startsWith('M ')).toBe(true);
    expect(curve.d).toContain(' C ');
    expect(curve.mid.x).toBeGreaterThan(0);
    expect(curve.mid.x).toBeLessThan(300);
    expect(curve.mid.y).toBeGreaterThan(0);
    expect(curve.mid.y).toBeLessThan(120 + 40);
    expect(edgeCurve(a, b, 1).d).not.toBe(curve.d);
  });

  it('draws tier bands as a closed four corner parcel left of every module', () => {
    const band = bandGeom(0, 4, 2);
    const top = pointsOf(band.top);
    expect(top).toHaveLength(4);
    expect(band.label.x).toBeLessThan(Math.min(...top.map((p) => p.x)));
    expect(pointsOf(band.faceLeft)).toHaveLength(4);
    expect(pointsOf(band.faceRight)).toHaveLength(4);
    const south = top.reduce((acc, p) => (p.y > acc.y ? p : acc));
    expect(pointsOf(band.faceLeft)[1]).toEqual(south);
  });

  it('places every node inside the computed drawing bounds', () => {
    const pts = NODES.map((n) => nodeBase(n));
    const box = padViewport(unionBounds(pts), 20);
    for (const p of pts) {
      expect(p.x).toBeGreaterThanOrEqual(box.x);
      expect(p.x).toBeLessThanOrEqual(box.x + box.w);
      expect(p.y).toBeGreaterThanOrEqual(box.y);
      expect(p.y).toBeLessThanOrEqual(box.y + box.h);
    }
  });

  it('clamps zoom into the supported range', () => {
    expect(clampScale(0.1)).toBe(MIN_SCALE);
    expect(clampScale(99)).toBe(MAX_SCALE);
    expect(clampScale(1.5)).toBe(1.5);
  });

  it('keeps the anchor point fixed while zooming', () => {
    const anchor = { fx: 0.25, fy: 0.75 };
    const before = viewportOf(FIT, BASE);
    const anchorX = before.x + before.w * anchor.fx;
    const anchorY = before.y + before.h * anchor.fy;
    const zoomed = zoomCamera(FIT, BASE, 1.6, anchor);
    const after = viewportOf(zoomed, BASE);
    expect(after.x + after.w * anchor.fx).toBeCloseTo(anchorX, 6);
    expect(after.y + after.h * anchor.fy).toBeCloseTo(anchorY, 6);
  });

  it('never lets the view drift more than the slack allowance away from the drawing', () => {
    const zoomed = zoomCamera(FIT, BASE, 2, { fx: 0.5, fy: 0.5 });
    const pushed = panCamera(zoomed, BASE, 100000, 100000, 1000, 600);
    const view = viewportOf(pushed, BASE);
    expect(view.x).toBeGreaterThanOrEqual(-BASE.w * 0.23);
    expect(view.y).toBeGreaterThanOrEqual(-BASE.h * 0.23);
    const back = panCamera(zoomed, BASE, -100000, -100000, 1000, 600);
    const view2 = viewportOf(back, BASE);
    expect(view2.x + view2.w).toBeLessThanOrEqual(BASE.w * 1.23);
    expect(view2.y + view2.h).toBeLessThanOrEqual(BASE.h * 1.23);
  });

  it('keeps a zoomed-out view centred instead of pinned to one edge', () => {
    const cam = clampCamera({ scale: MIN_SCALE, ox: 5000, oy: -5000 }, BASE);
    const view = viewportOf(cam, BASE);
    expect(view.w).toBeGreaterThan(BASE.w);
    expect(Math.abs(view.x + view.w / 2 - (BASE.x + BASE.w / 2))).toBeLessThan(1);
    expect(Math.abs(view.y + view.h / 2 - (BASE.y + BASE.h / 2))).toBeLessThan(1);
  });

  it('maps drag distance to drawing units at the current scale', () => {
    const zoomed = zoomCamera(FIT, BASE, 2, { fx: 0.5, fy: 0.5 });
    const panned = panCamera(zoomed, BASE, 100, 0, 1000, 600);
    expect(panned.ox - zoomed.ox).toBeCloseTo(-(100 / 1000) * (BASE.w / 2), 6);
    expect(panned.scale).toBe(zoomed.scale);
  });

  it('half extents stay consistent with the cell pitch', () => {
    expect(HALF_W).toBeCloseTo(CELL * 0.48, 6);
    expect(HALF_H).toBeCloseTo(HALF_W / 2, 6);
  });
});
