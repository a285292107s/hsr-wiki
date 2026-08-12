/** 货币战争 · 图鉴数据加载器（converter 落地，随站部署） */
import { cachedFetch } from '../cache';
import type {
  CurrencyRoleList, CurrencyRoleDetail, CurrencySeasonList,
  CurrencyEquipList, CurrencyPortalList, CurrencyAugmentList, CurrencyTraitList,
} from '../types';
import { LOCAL_DATA_BASE } from './base';
import { singletonLoad } from './singleton';

/** 各图鉴列表（共享单例：只请求一次，失败自动重置允许重试） */
export const loadLocalCurrencyRoles = singletonLoad<CurrencyRoleList>(`${LOCAL_DATA_BASE}/currency/role.json`);
export const loadLocalCurrencySeasons = singletonLoad<CurrencySeasonList>(`${LOCAL_DATA_BASE}/currency/season.json`);
export const loadLocalCurrencyEquipment = singletonLoad<CurrencyEquipList>(`${LOCAL_DATA_BASE}/currency/equipment.json`);
export const loadLocalCurrencyPortals = singletonLoad<CurrencyPortalList>(`${LOCAL_DATA_BASE}/currency/portals.json`);
export const loadLocalCurrencyAugments = singletonLoad<CurrencyAugmentList>(`${LOCAL_DATA_BASE}/currency/augments.json`);
export const loadLocalCurrencyTraits = singletonLoad<CurrencyTraitList>(`${LOCAL_DATA_BASE}/currency/traits.json`);

/** 角色详情（按 ID 按需加载，走请求缓存） */
export function loadLocalCurrencyRole(id: string): Promise<CurrencyRoleDetail> {
  return cachedFetch<CurrencyRoleDetail>(`${LOCAL_DATA_BASE}/currency/role/${id}.json`, `cw_role_${id}`);
}
