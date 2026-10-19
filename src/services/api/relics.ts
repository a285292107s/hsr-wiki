import { NkError } from '../../lib/errors';
import type {
  LocalRelicList, LocalRelicEntry, RelicSetData,
  RelicMainAffixList, RelicSubAffixList, RelicStoriesMap,
} from '../types';
import { singletonLocalData } from './local';

export const loadLocalRelicSets = singletonLocalData<LocalRelicList>('relics.json');

export async function loadLocalRelicDetail(id: string): Promise<LocalRelicEntry> {
  const list = await loadLocalRelicSets();
  const item = list.find((r) => String(r.id) === String(id));
  if (!item) throw new NkError(`遗器套装不存在: ${id}`);
  return item;
}

export const loadLocalRelicMainAffixes = singletonLocalData<RelicMainAffixList>('relic_main_affixes.json');

export const loadLocalRelicSubAffixes = singletonLocalData<RelicSubAffixList>('relic_sub_affixes.json');

export const loadLocalRelicStories = singletonLocalData<RelicStoriesMap>('relic_stories.json');

export async function loadLocalRelicSet(id: number | string): Promise<RelicSetData | null> {
  try {
    const list = await loadLocalRelicSets();
    const item = list.find((r) => String(r.id) === String(id));
    if (!item) return null;

    const require_num: Record<string, { desc?: string; param_list?: number[] }> = {};
    if (item.descriptions) {
      for (const [pc, desc] of Object.entries(item.descriptions)) {
        require_num[pc] = {
          desc,
          param_list: (item.param_list && item.param_list[pc]) || [],
        };
      }
    }
    return { name: item.name, icon: item.icon, require_num };
  } catch {
    return null;
  }
}
