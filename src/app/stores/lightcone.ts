import { defineStore } from 'pinia';
import { ref } from 'vue';
import { loadLocalLightConeDetail } from '../../services/api';
import { SITE_NAME } from '../../lib/constants';
import { useLoadGeneration } from '../composables/use-load-generation';
import type { LightConeDetail } from '../../services/types';

export const useLightconeStore = defineStore('lightcone', () => {
  const lcId = ref('');
  const data = ref<LightConeDetail | null>(null);
  const rank = ref(1);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const loadGen = useLoadGeneration();

  async function load(id: string): Promise<void> {
    const gen = loadGen.begin();
    loading.value = true;
    error.value = null;
    try {
      lcId.value = id;
      data.value = null;
      const d = await loadLocalLightConeDetail(id);
      if (!loadGen.isCurrent(gen)) return;
      if (!d || !d.name || !d.skill) throw new Error('光锥数据不完整');
      data.value = d;
      rank.value = 1;
      document.title = `${d.name} - ${SITE_NAME}`;
    } catch (e) {
      if (!loadGen.isCurrent(gen)) return;
      error.value = e instanceof Error ? e.message : String(e);
      throw e;
    } finally {
      if (loadGen.isCurrent(gen)) loading.value = false;
    }
  }

  function setRank(r: number): void {
    rank.value = r;
  }

  function reset(): void {
    lcId.value = '';
    data.value = null;
    rank.value = 1;
    loading.value = false;
    error.value = null;
  }

  return { lcId, data, rank, loading, error, load, setRank, reset };
});
