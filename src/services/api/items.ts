import type { ItemDb, LocalItemList, LocalLightConeList, LocalMonsterList, LightConeDetail, MonsterDetail } from '../types';
import type { MonsterEliteGroups, MonsterLevelCurve } from '../../lib/monster-stats';
import { loadLocalJSON, singletonLocalData } from './local';

export const RARITY_NUM_TO_KEY: Record<number, string> = {
  5: 'SuperRare', 4: 'VeryRare', 3: 'Rare', 2: 'NotNormal', 1: 'Normal',
};

export const loadLocalItems = singletonLocalData<LocalItemList>('items.json');

export async function loadLocalItemDb(): Promise<ItemDb> {
  const list = await loadLocalItems();
  const db: ItemDb = {};
  for (const it of list) {
    db[String(it.id)] = {
      item_name: it.name,
      item_sub_type: it.sub_type,
      purpose_type: it.purpose_type,
      rarity: RARITY_NUM_TO_KEY[it.rarity] || 'Normal',
      item_figure_icon_path: it.figure_icon,
    };
  }
  return db;
}
export const loadLocalMonsterList = singletonLocalData<LocalMonsterList>('monsters.json');

export const loadLocalMonsterLevelCurve = singletonLocalData<MonsterLevelCurve>('monster-level-curve.json');

export const loadLocalMonsterEliteGroups = singletonLocalData<MonsterEliteGroups>('monster-elite-group.json');

export function loadLocalMonsterDetail(id: string): Promise<MonsterDetail> {
  return loadLocalJSON<MonsterDetail>(`monsters/${id}.json`, `monster_${id}`);
}

export const loadLocalLightCones = singletonLocalData<LocalLightConeList>('light_cones.json');

export function loadLocalLightConeDetail(id: string): Promise<LightConeDetail> {
  return loadLocalJSON<LightConeDetail>(`light_cones/${id}.json`, `lightcone_${id}`);
}
