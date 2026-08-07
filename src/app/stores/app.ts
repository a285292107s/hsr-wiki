/**
 * 应用级状态：版本信息 / 物品库 / 名称缓存 / Toast 队列
 */
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
  /** 当前数据版本（manifest.hsr.latest） */
  const version = ref('');
  const latestVersion = ref('');
  const versions = ref<string[]>([]);
  /** 游戏版本（本地 version.json，converter 从子模块 git 提交解析） */
  const gameVersion = ref('');
  /** 物品数据库（item.json） */
  const itemDb = ref<ItemDb>({});
  /** id → 名称（光锥/遗器套装/角色） */
  const nameCache = ref<NameCache>({});
  const toasts = ref<ToastItem[]>([]);
  let toastSeq = 0;
  /** manifest 最近失败时刻（冷却期：CDN 不可用时避免每次进页都等 15s 超时） */
  let manifestFailedAt = 0;
  const MANIFEST_COOLDOWN_MS = 60_000;

  /** 加载 manifest 并设置版本（幂等：SPA 生命周期内只请求一次；CDN 不可用时静默回退） */
  async function initManifest(): Promise<void> {
    if (latestVersion.value) return;
    // CDN 不可用（健康探测判定 / 最近失败冷却期内）：立即返回，不发 15s 超时请求
    if (isCdnDown() || Date.now() - manifestFailedAt < MANIFEST_COOLDOWN_MS) return;
    try {
      const m = await loadManifest();
      versions.value = m.hsr?.available || [];
      version.value = resolveVersion(m);
      latestVersion.value = version.value;
    } catch {
      manifestFailedAt = Date.now();
      // CDN 不可用：静默回退，不阻塞页面加载
    }
  }

  /** 加载游戏版本（本地 version.json；未生成/失败静默回退，不阻塞页面） */
  async function initVersion(): Promise<void> {
    if (gameVersion.value) return;
    try {
      const v = await loadLocalVersion();
      gameVersion.value = v.game_version || '';
    } catch {
      // 本地 JSON 缺失：静默回退，页面仍可用
    }
  }

  /** 确保物品库就绪（失败回退空对象，不阻塞页面） */
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

  /* ─── Toast ─── */

  function toast(type: ToastType, message: string, duration = 3500): void {
    toasts.value.push({ id: ++toastSeq, type, message, duration });
  }

  function dismissToast(id: number): void {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }

  return {
    version, latestVersion, versions, gameVersion, itemDb, nameCache, toasts,
    initManifest, initVersion, ensureItems, mergeNames, toast, dismissToast,
  };
});
