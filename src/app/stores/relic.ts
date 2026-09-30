import { defineStore } from 'pinia';
import { ref } from 'vue';
import {
  loadLocalRelicDetail, loadLocalRelicMainAffixes, loadLocalRelicSubAffixes, loadLocalRelicStories,
} from '../../services/api';
import { useLoadGeneration } from '../composables/use-load-generation';
import { SITE_NAME } from '../../lib/constants';
import type {
  LocalRelicEntry, RelicMainAffixList, RelicSubAffixList, RelicStoriesMap,
} from '../../services/types';

export const useRelicStore = defineStore('relic', () => {
  const relicId = ref('');
  const data = ref<LocalRelicEntry | null>(null);
  const mainAffixes = ref<RelicMainAffixList>([]);
  const subAffixes = ref<RelicSubAffixList>([]);
  const stories = ref<RelicStoriesMap>({});
  const loading = ref(false);
  const error = ref<string | null>(null);

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

  const loadGen = useLoadGeneration();

  async function load(id: string): Promise<void> {
    const gen = loadGen.begin();
    loading.value = true;
    error.value = null;
    try {
      relicId.value = id;
      data.value = null;
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
      document.title = `${d.name} - ${SITE_NAME}`;
    } catch (e) {
      if (!loadGen.isCurrent(gen)) return;
      error.value = e instanceof Error ? e.message : String(e);
      throw e;
    } finally {
      if (loadGen.isCurrent(gen)) loading.value = false;
    }
  }

  function reset(): void {
    relicId.value = '';
    data.value = null;
    loading.value = false;
    error.value = null;
    activeTab.value = 'effect';
  }

  return { relicId, data, mainAffixes, subAffixes, stories, loading, error, load, reset, TABS, activeTab, setTab };
});
