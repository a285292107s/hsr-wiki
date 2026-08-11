/**
 * 光锥详情页状态：数据加载 / 叠影等级切换
 * 加载流程：light_cones/{id}.json → 校验 → 更新标题
 */
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { loadLocalLightConeDetail } from '../../services/api';
import { SITE_NAME } from '../../lib/constants';
import { useLoadGeneration } from '../composables/use-load-generation';
import type { LightConeDetail } from '../../services/types';

export const useLightconeStore = defineStore('lightcone', () => {
  const lcId = ref('');
  const data = ref<LightConeDetail | null>(null);
  /** 当前叠影等级（1-5） */
  const rank = ref(1);
  const loading = ref(false);
  const error = ref<string | null>(null);

  /** 加载代：光锥间快速导航时防止旧数据覆盖新数据（统一 useLoadGeneration 模式） */
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

  /** 路由离开时重置（避免旧数据闪现） */
  function reset(): void {
    lcId.value = '';
    data.value = null;
    rank.value = 1;
    loading.value = false;
    error.value = null;
  }

  return { lcId, data, rank, loading, error, load, setRank, reset };
});
