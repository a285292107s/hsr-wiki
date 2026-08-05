/** 货币战争 · 图鉴数据加载器（converter 落地，随站部署） */
import { fetchJSON } from '../cache';
import type {
  CurrencyRoleList, CurrencyRoleDetail, CurrencySeasonList,
  CurrencyEquipList, CurrencyPortalList, CurrencyAugmentList, CurrencyTraitList,
} from '../types';
import { LOCAL_DATA_BASE } from './base';

export function loadLocalCurrencyRoles(): Promise<CurrencyRoleList> {
  return fetchJSON<CurrencyRoleList>(`${LOCAL_DATA_BASE}/currency/role.json`);
}

export function loadLocalCurrencyRole(id: string): Promise<CurrencyRoleDetail> {
  return fetchJSON<CurrencyRoleDetail>(`${LOCAL_DATA_BASE}/currency/role/${id}.json`);
}

export function loadLocalCurrencySeasons(): Promise<CurrencySeasonList> {
  return fetchJSON<CurrencySeasonList>(`${LOCAL_DATA_BASE}/currency/season.json`);
}

export function loadLocalCurrencyEquipment(): Promise<CurrencyEquipList> {
  return fetchJSON<CurrencyEquipList>(`${LOCAL_DATA_BASE}/currency/equipment.json`);
}

export function loadLocalCurrencyPortals(): Promise<CurrencyPortalList> {
  return fetchJSON<CurrencyPortalList>(`${LOCAL_DATA_BASE}/currency/portals.json`);
}

export function loadLocalCurrencyAugments(): Promise<CurrencyAugmentList> {
  return fetchJSON<CurrencyAugmentList>(`${LOCAL_DATA_BASE}/currency/augments.json`);
}

export function loadLocalCurrencyTraits(): Promise<CurrencyTraitList> {
  return fetchJSON<CurrencyTraitList>(`${LOCAL_DATA_BASE}/currency/traits.json`);
}
