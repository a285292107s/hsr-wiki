/** 物品 / 光锥 / 敌对物种加载器 */
import { fetchJSON } from '../cache';
import type { ItemDb, LocalItemList, LocalLightConeList, LocalMonsterList, LightConeDetail, MonsterDetail } from '../types';
import { LOCAL_DATA_BASE } from './base';
import { singletonLoad } from './singleton';

/** 数字稀有度 → 字符串键（与 ItemInfo.rarity 及目录页 ITEM_RARITY_MAP 对齐） */
export const RARITY_NUM_TO_KEY: Record<number, string> = {
  5: 'SuperRare', 4: 'VeryRare', 3: 'Rare', 2: 'NotNormal', 1: 'Normal',
};

export function loadLocalItems(): Promise<LocalItemList> {
  return fetchJSON<LocalItemList>(`${LOCAL_DATA_BASE}/items.json`);
}

/** 物品库（Record 形态，供角色详情页 itemName 解析；由本地数组转换） */
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

export function loadLocalMonsterList(): Promise<LocalMonsterList> {
  return fetchJSON<LocalMonsterList>(`${LOCAL_DATA_BASE}/monsters.json`);
}

/** 敌对物种详情（monsters/{id}.json，按 ID 按需加载不走单例） */
export function loadLocalMonsterDetail(id: string): Promise<MonsterDetail> {
  return fetchJSON<MonsterDetail>(`${LOCAL_DATA_BASE}/monsters/${id}.json`);
}

/** 光锥列表（共享单例：只请求一次，失败自动重置允许重试） */
export const loadLocalLightCones = singletonLoad<LocalLightConeList>(`${LOCAL_DATA_BASE}/light_cones.json`);

export function loadLocalLightConeDetail(id: string): Promise<LightConeDetail> {
  return fetchJSON<LightConeDetail>(`${LOCAL_DATA_BASE}/light_cones/${id}.json`);
}
