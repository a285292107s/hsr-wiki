/**
 * 角色详情页状态：数据加载 / 强化模式
 * 加载流程沿用原 character.js init()：
 *   manifest → character JSON → 校验 → 默认选最后一个强化键
 *   → 并行（物品库 + 配装名称）→ 渲染（视图层）→ 遗器套装/Spine（视图层）
 */
import { defineStore } from 'pinia';
import { computed, ref, toRaw } from 'vue';
import { loadLocalCharacter, loadLocalBuildNames } from '../../services/api';
import { getEnhancedKeys, getRenderData, validateCharData } from '../../lib/format';
import { useLoadGeneration } from '../composables/use-load-generation';
import { useAppStore } from './app';
import type { CharacterData } from '../../services/types';

export const useCharacterStore = defineStore('character', () => {
  const charId = ref('');
  const data = ref<CharacterData | null>(null);
  /** 当前强化版本键（null = 原始模式） */
  const enhKey = ref<string | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  /** 强化版本键列表（空 = 该角色无强化） */
  const enhKeys = computed(() => getEnhancedKeys(data.value));

  /** 渲染数据：强化模式 → 强化视图（deepClone + 覆盖）；原始模式 → 原数据
   *  注意：必须 toRaw 解包 reactive proxy——structuredClone 无法序列化 Proxy */
  const renderData = computed<CharacterData | null>(() => getRenderData(toRaw(data.value), enhKey.value));

  /** 加载代：单调递增（统一 useLoadGeneration 竞态保护，见 composables/use-load-generation） */
  const loadGen = useLoadGeneration();

  async function load(id: string): Promise<void> {
    const app = useAppStore();
    const gen = loadGen.begin();
    loading.value = true;
    error.value = null;
    try {
      charId.value = id;
      data.value = null;
      await app.initManifest();
      if (!loadGen.isCurrent(gen)) return; // 已被更新的加载取代
      const d = await loadLocalCharacter(id);
      if (!loadGen.isCurrent(gen)) return; // 已被更新的加载取代
      validateCharData(d);
      data.value = d;
      // 原实现行为：更新页面标题
      document.title = `${d.name} - 咸鱼百科`;
      // 默认选最后一个加强版本（原实现行为）
      const keys = getEnhancedKeys(d);
      enhKey.value = keys.length ? keys[keys.length - 1] : null;
      // 并行加载物品库 + 配装名称（名称失败回退 '#id'，不阻塞）
      const [, names] = await Promise.all([
        app.ensureItems(),
        loadLocalBuildNames(d, app.nameCache),
      ]);
      if (!loadGen.isCurrent(gen)) return; // 已被更新的加载取代
      app.mergeNames(names);
    } catch (e) {
      if (!loadGen.isCurrent(gen)) return; // 过期加载的失败静默丢弃，由最新加载接管 UI
      error.value = e instanceof Error ? e.message : String(e);
      throw e;
    } finally {
      if (loadGen.isCurrent(gen)) loading.value = false; // 过期加载不得复位最新加载持有的 loading
    }
  }

  function setEnhKey(k: string | null): void {
    enhKey.value = k;
  }

  /** 路由离开角色页时重置（避免旧数据闪现） */
  function reset(): void {
    charId.value = '';
    data.value = null;
    enhKey.value = null;
    loading.value = false;
    error.value = null;
  }

  return {
    charId, data, enhKey, loading, error,
    enhKeys, renderData,
    load, setEnhKey, reset,
  };
});
