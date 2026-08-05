/** 遗器套装 / 词条 / 来历加载器 */
import { fetchJSON } from '../cache';
import { NkError } from '../../lib/errors';
import type {
  LocalRelicList, LocalRelicEntry, RelicSetData,
  RelicMainAffixList, RelicSubAffixList, RelicStoriesMap,
} from '../types';
import { LOCAL_DATA_BASE } from './base';
import { singletonLoad } from './singleton';

/** 遗器套装列表（共享单例：只请求一次，失败自动重置允许重试） */
export const loadLocalRelicSets = singletonLoad<LocalRelicList>(`${LOCAL_DATA_BASE}/relics.json`);

/** 从本地 relics.json 加载单个遗器套装详情（按 ID 查找） */
export async function loadLocalRelicDetail(id: string): Promise<LocalRelicEntry> {
  const list = await loadLocalRelicSets();
  const item = list.find((r) => String(r.id) === String(id));
  if (!item) throw new NkError(`遗器套装不存在: ${id}`);
  return item;
}

/** 遗器主词条表（relic_main_affixes.json） */
export function loadLocalRelicMainAffixes(): Promise<RelicMainAffixList> {
  return fetchJSON<RelicMainAffixList>(`${LOCAL_DATA_BASE}/relic_main_affixes.json`);
}

/** 遗器副词条表（relic_sub_affixes.json） */
export function loadLocalRelicSubAffixes(): Promise<RelicSubAffixList> {
  return fetchJSON<RelicSubAffixList>(`${LOCAL_DATA_BASE}/relic_sub_affixes.json`);
}

/** 遗器来历表（relic_stories.json，set_id → 部位类型 → 故事） */
export function loadLocalRelicStories(): Promise<RelicStoriesMap> {
  return fetchJSON<RelicStoriesMap>(`${LOCAL_DATA_BASE}/relic_stories.json`);
}

/**
 * 从本地 relics.json 加载遗器套装信息，返回与 CDN RelicSetData 兼容的结构。
 */
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
