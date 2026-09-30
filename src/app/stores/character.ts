import { defineStore } from 'pinia';
import { computed, ref, toRaw } from 'vue';
import { loadLocalCharacter, loadLocalBuildNames } from '../../services/api';
import { getEnhancedKeys, getRenderData, validateCharData } from '../../lib/format';
import { SITE_NAME } from '../../lib/constants';
import { useLoadGeneration } from '../composables/use-load-generation';
import { useAppStore } from './app';
import type { CharacterData } from '../../services/types';

export const useCharacterStore = defineStore('character', () => {
  const charId = ref('');
  const data = ref<CharacterData | null>(null);
  const enhKey = ref<string | null>(null);
  const compareOn = ref(false);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const enhKeys = computed(() => getEnhancedKeys(data.value));

  // 注意：必须 toRaw 解包 reactive proxy——structuredClone 无法序列化 Proxy
  const renderData = computed<CharacterData | null>(() => getRenderData(toRaw(data.value), enhKey.value));

  const loadGen = useLoadGeneration();

  async function load(id: string): Promise<void> {
    const app = useAppStore();
    const gen = loadGen.begin();
    loading.value = true;
    error.value = null;
    try {
      charId.value = id;
      data.value = null;
      void app.initManifest();
      if (!loadGen.isCurrent(gen)) return;
      const d = await loadLocalCharacter(id);
      if (!loadGen.isCurrent(gen)) return;
      validateCharData(d);
      data.value = d;
      document.title = `${d.name} - ${SITE_NAME}`;
      const keys = getEnhancedKeys(d);
      enhKey.value = keys.length ? keys[keys.length - 1] : null;
      const [, names] = await Promise.all([
        app.ensureItems(),
        loadLocalBuildNames(d, app.nameCache),
      ]);
      if (!loadGen.isCurrent(gen)) return;
      app.mergeNames(names);
    } catch (e) {
      if (!loadGen.isCurrent(gen)) return;
      error.value = e instanceof Error ? e.message : String(e);
      throw e;
    } finally {
      if (loadGen.isCurrent(gen)) loading.value = false;
    }
  }

  function setEnhKey(k: string | null): void {
    enhKey.value = k;
    compareOn.value = false;
  }

  function setCompareOn(v: boolean): void {
    if (v && enhKey.value == null) {
      const keys = getEnhancedKeys(data.value);
      if (keys.length) enhKey.value = keys[keys.length - 1];
    }
    compareOn.value = v;
  }

  function reset(): void {
    charId.value = '';
    data.value = null;
    enhKey.value = null;
    compareOn.value = false;
    loading.value = false;
    error.value = null;
  }

  return {
    charId, data, enhKey, loading, error,
    enhKeys, renderData, compareOn,
    load, setEnhKey, setCompareOn, reset,
  };
});
