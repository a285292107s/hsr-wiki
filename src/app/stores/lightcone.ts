import { defineStore } from 'pinia';
import { ref } from 'vue';
import { loadLocalLightConeDetail } from '../../services/api';
import { SITE_NAME } from '../../lib/constants';
import { createDetailCore } from './detail-core';
import type { LightConeDetail } from '../../services/types';

export const useLightconeStore = defineStore('lightcone', () => {
  const core = createDetailCore<LightConeDetail>();
  const rank = ref(1);

  async function load(id: string): Promise<void> {
    await core.load(id, async () => {
      const d = await loadLocalLightConeDetail(id);
      if (!d || !d.name || !d.skill) throw new Error('光锥数据不完整');
      rank.value = 1;
      return d;
    }, { title: (d) => `${d.name} - ${SITE_NAME}` });
  }

  function setRank(r: number): void {
    rank.value = r;
  }

  function reset(): void {
    core.reset();
  }

  return { lcId: core.id, data: core.data, rank, loading: core.loading, error: core.error, load, setRank, reset };
});
