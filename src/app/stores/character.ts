/**
 * 角色详情页状态：数据加载 / 加强模式 / Tab 切换
 * 加载流程沿用原 character.js init()：
 *   manifest → character JSON → 校验 → 默认选最后一个加强键
 *   → 并行（物品库 + 配装名称）→ 渲染（视图层）→ 遗器套装/Spine（视图层）
 */
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { loadCharacter, loadBuildNames } from '../../services/api';
import { getEnhancedKeys, getRenderData, validateCharData } from '../../lib/format';
import { useAppStore } from './app';
import type { CharacterData } from '../../services/types';

export const CHAR_TAB_DEFAULT = 'overview';

export const useCharacterStore = defineStore('character', () => {
  const charId = ref('');
  const data = ref<CharacterData | null>(null);
  /** 当前加强版本键（null = 原始模式） */
  const enhKey = ref<string | null>(null);
  const activeTab = ref(CHAR_TAB_DEFAULT);
  const loading = ref(false);
  const error = ref<string | null>(null);

  /** 加强版本键列表（空 = 该角色无加强） */
  const enhKeys = computed(() => getEnhancedKeys(data.value));

  /** 渲染数据：加强模式 → { d: 加强视图, oldD: 重映射加强前视图 }；原始模式 → oldD=null */
  const renderData = computed(() => getRenderData(data.value, enhKey.value));

  async function load(id: string): Promise<void> {
    const app = useAppStore();
    loading.value = true;
    error.value = null;
    try {
      charId.value = id;
      data.value = null;
      await app.initManifest();
      const d = await loadCharacter(app.version, id);
      validateCharData(d);
      data.value = d;
      // 原脚本行为：更新页面标题
      document.title = `${d.name} - HSR Wiki`;
      // 默认选最后一个加强版本（原脚本行为）
      const keys = getEnhancedKeys(d);
      enhKey.value = keys.length ? keys[keys.length - 1] : null;
      activeTab.value = CHAR_TAB_DEFAULT;
      // 并行加载物品库 + 配装名称（名称失败回退 '#id'，不阻塞）
      const [, names] = await Promise.all([
        app.ensureItems(),
        loadBuildNames(app.version, d, app.nameCache),
      ]);
      app.mergeNames(names);
      app.markDataReady();
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e);
      throw e;
    } finally {
      loading.value = false;
    }
  }

  function setEnhKey(k: string | null): void {
    enhKey.value = k;
  }

  function setTab(tab: string): void {
    activeTab.value = tab;
  }

  /** 路由离开角色页时重置（避免旧数据闪现） */
  function reset(): void {
    charId.value = '';
    data.value = null;
    enhKey.value = null;
    activeTab.value = CHAR_TAB_DEFAULT;
    loading.value = false;
    error.value = null;
  }

  return {
    charId, data, enhKey, activeTab, loading, error,
    enhKeys, renderData,
    load, setEnhKey, setTab, reset,
  };
});
