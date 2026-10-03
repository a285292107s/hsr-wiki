import { defineStore } from 'pinia';
import { computed, ref, toRaw } from 'vue';
import { loadLocalCharacter, loadLocalBuildNames } from '../../services/api';
import { getEnhancedKeys, getRenderData, validateCharData } from '../../lib/format';
import { SITE_NAME } from '../../lib/constants';
import { useAppStore } from './app';
import { createDetailCore } from './detail-core';
import type { CharacterData } from '../../services/types';

export const useCharacterStore = defineStore('character', () => {
  const core = createDetailCore<CharacterData>();
  const enhKey = ref<string | null>(null);
  const compareOn = ref(false);

  const enhKeys = computed(() => getEnhancedKeys(core.data.value));

  // 注意：必须 toRaw 解包 reactive proxy——structuredClone 无法序列化 Proxy
  const renderData = computed<CharacterData | null>(() => getRenderData(toRaw(core.data.value), enhKey.value));

  async function load(id: string): Promise<void> {
    const app = useAppStore();
    void app.initManifest();
    await core.load(id, async ({ isCurrent, submit }) => {
      const d = await loadLocalCharacter(id);
      if (!isCurrent()) return d;
      validateCharData(d);
      // 主数据先提交先渲染，build 名录异步合并（同代际才落）
      submit(d);
      const keys = getEnhancedKeys(d);
      enhKey.value = keys.length ? keys[keys.length - 1] : null;
      const [, names] = await Promise.all([
        app.ensureItems(),
        loadLocalBuildNames(d, app.nameCache),
      ]);
      if (!isCurrent()) return d;
      app.mergeNames(names);
      return d;
    }, { title: (d) => `${d.name} - ${SITE_NAME}` });
  }

  function setEnhKey(k: string | null): void {
    enhKey.value = k;
    compareOn.value = false;
  }

  function setCompareOn(v: boolean): void {
    if (v && enhKey.value == null) {
      const keys = getEnhancedKeys(core.data.value);
      if (keys.length) enhKey.value = keys[keys.length - 1];
    }
    compareOn.value = v;
  }

  function reset(): void {
    core.reset();
    enhKey.value = null;
    compareOn.value = false;
  }

  return {
    charId: core.id, data: core.data, enhKey, loading: core.loading, error: core.error,
    enhKeys, renderData, compareOn,
    load, setEnhKey, setCompareOn, reset,
  };
});
