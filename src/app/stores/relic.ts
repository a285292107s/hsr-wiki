import { defineStore } from 'pinia';
import { ref } from 'vue';
import {
  loadLocalRelicDetail, loadLocalRelicMainAffixes, loadLocalRelicSubAffixes, loadLocalRelicStories,
} from '../../services/api';
import { createDetailCore } from './detail-core';
import { SITE_NAME } from '../../lib/constants';
import type {
  LocalRelicEntry, RelicMainAffixList, RelicSubAffixList, RelicStoriesMap,
} from '../../services/types';

export const useRelicStore = defineStore('relic', () => {
  const core = createDetailCore<LocalRelicEntry>();
  const mainAffixes = ref<RelicMainAffixList>([]);
  const subAffixes = ref<RelicSubAffixList>([]);
  const stories = ref<RelicStoriesMap>({});

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

  async function load(id: string): Promise<void> {
    await core.load(id, async ({ isCurrent }) => {
      const [d, main, sub, storyMap] = await Promise.all([
        loadLocalRelicDetail(id),
        mainAffixes.value.length ? Promise.resolve(mainAffixes.value) : loadLocalRelicMainAffixes(),
        subAffixes.value.length ? Promise.resolve(subAffixes.value) : loadLocalRelicSubAffixes(),
        Object.keys(stories.value).length ? Promise.resolve(stories.value) : loadLocalRelicStories(),
      ]);
      if (!isCurrent()) return d;
      if (!d || !d.name) throw new Error('遗器数据不完整');
      mainAffixes.value = main;
      subAffixes.value = sub;
      stories.value = storyMap;
      return d;
    }, { title: (d) => `${d.name} - ${SITE_NAME}` });
  }

  function reset(): void {
    core.reset();
    activeTab.value = 'effect';
  }

  return { relicId: core.id, data: core.data, mainAffixes, subAffixes, stories, loading: core.loading, error: core.error, load, reset, TABS, activeTab, setTab };
});
