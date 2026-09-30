import { defineStore } from 'pinia';
import { ref } from 'vue';
import { loadManifest, loadLocalVersion, resolveVersion, loadLocalItemDb } from '../../services/api';
import { isCdnDown } from '../../services/cdn/health';
import type { ItemDb, NameCache } from '../../services/types';

export type ToastType = 'error' | 'warn' | 'info' | 'success';

export interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
  duration: number;
}

export const useAppStore = defineStore('app', () => {
  const version = ref('');
  const latestVersion = ref('');
  const versions = ref<string[]>([]);
  const gameVersion = ref('');
  const versionLabel = ref('');
  const itemDb = ref<ItemDb>({});
  const nameCache = ref<NameCache>({});
  const toasts = ref<ToastItem[]>([]);
  let toastSeq = 0;
  /** manifest 最近失败时刻（冷却期：CDN 不可用时避免每次进页都等 15s 超时） */
  let manifestFailedAt = 0;
  const MANIFEST_COOLDOWN_MS = 60_000;

  async function initManifest(): Promise<void> {
    if (latestVersion.value) return;
    if (isCdnDown() || Date.now() - manifestFailedAt < MANIFEST_COOLDOWN_MS) return;
    try {
      const m = await loadManifest();
      versions.value = m.hsr?.available || [];
      version.value = resolveVersion(m);
      latestVersion.value = version.value;
    } catch {
      manifestFailedAt = Date.now();
    }
  }

  async function initVersion(): Promise<void> {
    if (gameVersion.value || versionLabel.value) return;
    try {
      const v = await loadLocalVersion();
      gameVersion.value = v.game_version || '';
      versionLabel.value = v.version_label || '';
    } catch {
    }
  }

  async function ensureItems(): Promise<void> {
    if (Object.keys(itemDb.value).length) return;
    await initManifest();
    try {
      itemDb.value = await loadLocalItemDb();
    } catch {
      itemDb.value = {};
    }
  }

  function mergeNames(names: NameCache): void {
    nameCache.value = { ...nameCache.value, ...names };
  }

  function toast(type: ToastType, message: string, duration = 3500): void {
    toasts.value.push({ id: ++toastSeq, type, message, duration });
  }

  function dismissToast(id: number): void {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }

  return {
    version, latestVersion, versions, gameVersion, versionLabel, itemDb, nameCache, toasts,
    initManifest, initVersion, ensureItems, mergeNames, toast, dismissToast,
  };
});
