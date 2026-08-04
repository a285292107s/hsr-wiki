/**
 * 骨架混合模式实验工具（调试验收台专用：诊断黑块来源）
 *
 * 隐藏/恢复非 normal 混合 slot、强制 normal、光效后置，均对骨架运行时对象就地操作，
 * 供 SpineDebugView 单层诊断页做对照实验（与生产渲染共用同一骨架形态契约）。
 */
import type { DebugDrawOrderSlot, SkelLike } from './types';

/** 隐藏/恢复 screen(3)/additive(1) 混合的 slot（诊断黑块来源） */
export function applyBlendsHiddenOn(skel: SkelLike, hidden: boolean): void {
  for (const slot of skel.slots) {
    const bm = slot.data.blendMode;
    if (bm !== 1 && bm !== 3) continue;
    if (hidden) {
      slot.setAttachment(null);
    } else if (slot.data.attachmentName) {
      slot.setAttachment(skel.getAttachment(slot.data.index, slot.data.attachmentName));
    }
  }
}

/** 强制把非 normal slot 的混合模式改为 normal（saved 记录原值用于恢复） */
export function applyForceNormalOn(skel: SkelLike, on: boolean, saved: Map<number, number>): void {
  for (const slot of skel.slots) {
    const bm = slot.data.blendMode;
    if (bm === 0) continue;
    if (on) {
      saved.set(slot.data.index, bm);
      slot.data.blendMode = 0;
    } else {
      slot.data.blendMode = saved.get(slot.data.index) ?? bm;
    }
  }
}

/** 光效后置：把 screen/additive 混合的 slot 移到 drawOrder 末尾（模拟 Three.js 透明后置） */
export function applyBlendLastOn(skel: SkelLike, on: boolean, holder: { savedDrawOrder: DebugDrawOrderSlot[] | null }): void {
  const order = skel.drawOrder;
  if (!order) return;
  if (on) {
    holder.savedDrawOrder = order.slice();
    const normal = order.filter((s) => s.data.blendMode === 0);
    const blended = order.filter((s) => s.data.blendMode !== 0);
    order.length = 0;
    order.push(...normal, ...blended);
  } else if (holder.savedDrawOrder) {
    order.length = 0;
    order.push(...holder.savedDrawOrder);
  }
}
