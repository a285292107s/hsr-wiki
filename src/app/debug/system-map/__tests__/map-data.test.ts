/**
 * 系统地图数据一致性测试
 *
 * 锁定 map-data.ts（单一事实源）的内部一致性（研究线独立测试体系，不进主项目 pnpm test）：
 * - 建筑 id / 网格坐标唯一；分层引用有效；路径端点与类型引用有效；
 * - 文件与职责字段非空（地图解释面板依赖它们，禁止缺省）。
 * 修改地图内容（增删建筑/路径）后本测试即回归防线。
 */
import { describe, expect, it } from 'vitest';
import { EDGES, EDGE_KINDS, LAYERS, NODES, type EdgeKind } from '../map-data';

const nodeIds = new Set(NODES.map((n) => n.id));
const layerIds = new Set(LAYERS.map((l) => l.id));
const kindIds = new Set<EdgeKind>(EDGE_KINDS.map((k) => k.id));

describe('system map data consistency', () => {
  it('建筑 id 唯一', () => {
    expect(nodeIds.size).toBe(NODES.length);
  });

  it('建筑网格坐标唯一（同一 (gx,gy) 不得重叠放置）', () => {
    const keys = NODES.map((n) => `${n.gx},${n.gy}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('每个建筑的分层引用有效', () => {
    for (const n of NODES) {
      expect(layerIds.has(n.layer), `node ${n.id} layer ${n.layer}`).toBe(true);
    }
  });

  it('建筑高度在有效范围（1..4）', () => {
    for (const n of NODES) {
      expect(n.h, `node ${n.id} h`).toBeGreaterThanOrEqual(1);
      expect(n.h, `node ${n.id} h`).toBeLessThanOrEqual(4);
    }
  });

  it('路径端点引用有效', () => {
    for (const e of EDGES) {
      expect(nodeIds.has(e.from), `edge ${e.id} from ${e.from}`).toBe(true);
      expect(nodeIds.has(e.to), `edge ${e.id} to ${e.to}`).toBe(true);
    }
  });

  it('路径类型在 EDGE_KINDS 注册表内', () => {
    for (const e of EDGES) {
      expect(kindIds.has(e.kind), `edge ${e.id} kind ${e.kind}`).toBe(true);
    }
  });

  it('路径 id 唯一', () => {
    const ids = EDGES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('文件与职责字段非空（解释面板依赖）', () => {
    for (const n of NODES) {
      expect(n.files.length, `node ${n.id} files`).toBeGreaterThan(0);
      expect(n.desc.length, `node ${n.id} desc`).toBeGreaterThan(0);
    }
    for (const e of EDGES) {
      expect(e.files.length, `edge ${e.id} files`).toBeGreaterThan(0);
      expect(e.label.length, `edge ${e.id} label`).toBeGreaterThan(0);
    }
  });

  it('每条边两个端点不重合（自环无意义）', () => {
    for (const e of EDGES) {
      expect(e.from, `edge ${e.id} self-loop`).not.toBe(e.to);
    }
  });
});