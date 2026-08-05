/**
 * 遗器详情页状态：套装数据 + 主副词条表 + 来历加载
 * 加载流程：relics.json（按 ID 查找）+ relic_main_affixes.json + relic_sub_affixes.json + relic_stories.json → 校验 → 更新标题
 */
import { defineStore } from 'pinia';
import { ref } from 'vue';
import {
  loadLocalRelicDetail, loadLocalRelicMainAffixes, loadLocalRelicSubAffixes, loadLocalRelicStories,
} from '../../services/api';
import { useLoadGeneration } from '../composables/use-load-generation';
import type {
  LocalRelicEntry, RelicMainAffixList, RelicSubAffixList, RelicStoriesMap,
} from '../../services/types';

export const useRelicStore = defineStore('relic', () => {
  const relicId = ref('');
  const data = ref<LocalRelicEntry | null>(null);
  /** 主词条表（全站共享，加载一次即可） */
  const mainAffixes = ref<RelicMainAffixList>([]);
  /** 副词条表 */
  const subAffixes = ref<RelicSubAffixList>([]);
  /** 来历表（set_id → 部位类型 → 故事，全站共享） */
  const stories = ref<RelicStoriesMap>({});
  const loading = ref(false);
  const error = ref<string | null>(null);

  /** 当前激活的 Tab */
  type RelicTab = 'effect' | 'main' | 'sub' | 'story';
  const TABS: ReadonlyArray<{ key: RelicTab; label: string }> = [
    { key: 'effect', label: '套装效果' },
    { key: 'main', label: '主词条' },
    { key: 'sub', label: '副词条' },
    { key: 'story', label: '来历' },
  ];
  const activeTab = ref<RelicTab>('effect');
  function setTab(key: string): void {
    if (TABS.some((t) => t.key === key)) activeTab.value = key as RelicTab;
  }

  /** 加载代：遗器间快速导航时防止旧数据覆盖新数据（统一 useLoadGeneration 模式） */
  const loadGen = useLoadGeneration();

  async function load(id: string): Promise<void> {
    const gen = loadGen.begin();
    loading.value = true;
    error.value = null;
    try {
      relicId.value = id;
      data.value = null;
      // 套装详情 + 主副词条表 + 来历表并行加载（表已缓存时几乎零开销）
      const [d, main, sub, storyMap] = await Promise.all([
        loadLocalRelicDetail(id),
        mainAffixes.value.length ? Promise.resolve(mainAffixes.value) : loadLocalRelicMainAffixes(),
        subAffixes.value.length ? Promise.resolve(subAffixes.value) : loadLocalRelicSubAffixes(),
        Object.keys(stories.value).length ? Promise.resolve(stories.value) : loadLocalRelicStories(),
      ]);
      if (!loadGen.isCurrent(gen)) return;
      if (!d || !d.name) throw new Error('遗器数据不完整');
      data.value = d;
      mainAffixes.value = main;
      subAffixes.value = sub;
      stories.value = storyMap;
      document.title = `${d.name} - HSR Wiki`;
    } catch (e) {
      if (!loadGen.isCurrent(gen)) return;
      error.value = e instanceof Error ? e.message : String(e);
      throw e;
    } finally {
      if (loadGen.isCurrent(gen)) loading.value = false;
    }
  }

  /** 路由离开时重置（避免旧数据闪现；表数据保留以复用） */
  function reset(): void {
    relicId.value = '';
    data.value = null;
    loading.value = false;
    error.value = null;
    activeTab.value = 'effect';
  }

  return { relicId, data, mainAffixes, subAffixes, stories, loading, error, load, reset, TABS, activeTab, setTab };
});
