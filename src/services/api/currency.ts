
import { cachedFetch } from '../cache';
import type {
  CurrencyRoleList, CurrencyRoleDetail,
  CurrencyEquipList, CurrencyPortalList, CurrencyAugmentList, CurrencyTraitList,
  CurrencyPropIconMap,
} from '../types';
import { LOCAL_DATA_BASE } from './base';
import { singletonLoad } from './singleton';

export const loadLocalCurrencyRoles = singletonLoad<CurrencyRoleList>(`${LOCAL_DATA_BASE}/currency/role.json`);
export const loadLocalCurrencyEquipment = singletonLoad<CurrencyEquipList>(`${LOCAL_DATA_BASE}/currency/equipment.json`);
export const loadLocalCurrencyPortals = singletonLoad<CurrencyPortalList>(`${LOCAL_DATA_BASE}/currency/portals.json`);
export const loadLocalCurrencyAugments = singletonLoad<CurrencyAugmentList>(`${LOCAL_DATA_BASE}/currency/augments.json`);
export const loadLocalCurrencyTraits = singletonLoad<CurrencyTraitList>(`${LOCAL_DATA_BASE}/currency/traits.json`);

export const loadLocalCurrencyPropIcons = singletonLoad<CurrencyPropIconMap>(`${LOCAL_DATA_BASE}/currency/prop_icons.json`);

export function loadLocalCurrencyRole(id: string): Promise<CurrencyRoleDetail> {
  return cachedFetch<CurrencyRoleDetail>(`${LOCAL_DATA_BASE}/currency/role/${id}.json`, `cw_role_${id}`);
}
