import { defineStore } from 'pinia';
import { ref } from 'vue';
import {
  loadLocalRelicDetail, loadLocalRelicMainAffixes, loadLocalRelicSubAffixes, loadLocalRelicStories,
} from '../../services/api';
import { createDetailCore } from './detail-core';
import { pageTitle } from '../seo';
import type {
  LocalRelicEntry, RelicMainAffixList, RelicSubAffixList, RelicStoriesMap,
} from '../../services/types';

export const useRelicStore = defineStore('relic', () => {
  const core = createDetailCore<LocalRelicEntry>();
  const mainAffixes = ref<RelicMainAffixList>([]);
  const subAffixes = ref<RelicSubAffixList>([]);
  const stories = ref<RelicStoriesMap>({});

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
    }, { title: (d) => pageTitle(d.name) });
  }

  function reset(): void {
    core.reset();
  }

  return { relicId: core.id, data: core.data, mainAffixes, subAffixes, stories, loading: core.loading, error: core.error, load, reset };
});
