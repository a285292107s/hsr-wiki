/**
 * 应用级状态：版本信息 / 物品库 / 名称缓存 / Toast 队列
 */
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { loadManifest, resolveVersion, loadItems } from '../../services/api';
import type { ItemDb, NameCache } from '../../services/types';

export type ToastType = 'error' | 'warn' | 'info' | 'success';

export interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
  duration: number;
}

export const useAppStore = defineStore('app', () => {
  /** 当前数据版本（manifest.hsr.latest） */
  const version = ref('');
  const latestVersion = ref('');
  const versions = ref<string[]>([]);
  /** 物品数据库（item.json） */
  const itemDb = ref<ItemDb>({});
  /** id → 名称（光锥/遗器套装/角色） */
  const nameCache = ref<NameCache>({});
  const toasts = ref<ToastItem[]>([]);
  let toastSeq = 0;

  /** 加载 manifest 并设置版本（幂等：SPA 生命周期内只请求一次） */
  async function initManifest(): Promise<void> {
    if (latestVersion.value) return;
    const m = await loadManifest();
    versions.value = m.hsr?.available || [];
    version.value = resolveVersion(m);
    latestVersion.value = version.value;
  }

  /** 确保物品库就绪（失败回退空对象，不阻塞页面） */
  async function ensureItems(): Promise<void> {
    if (Object.keys(itemDb.value).length) return;
    await initManifest();
    try {
      itemDb.value = await loadItems(version.value);
    } catch {
      itemDb.value = {};
    }
  }

  function mergeNames(names: NameCache): void {
    nameCache.value = { ...nameCache.value, ...names };
  }

  /* ─── Toast ─── */

  function toast(type: ToastType, message: string, duration = 3500): void {
    toasts.value.push({ id: ++toastSeq, type, message, duration });
  }

  function dismissToast(id: number): void {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }

  return {
    version, latestVersion, versions, itemDb, nameCache, toasts,
    initManifest, ensureItems, mergeNames, toast, dismissToast,
  };
});
