
import type {
  CurrencyRoleList, CurrencyRoleDetail,
  CurrencyEquipList, CurrencyPortalList, CurrencyAugmentList, CurrencyTraitList,
  CurrencyPropIconMap,
} from '../types';
import { loadLocalJSON, singletonLocalData } from './local';

export const loadLocalCurrencyRoles = singletonLocalData<CurrencyRoleList>('currency/role.json');
export const loadLocalCurrencyEquipment = singletonLocalData<CurrencyEquipList>('currency/equipment.json');
export const loadLocalCurrencyPortals = singletonLocalData<CurrencyPortalList>('currency/portals.json');
export const loadLocalCurrencyAugments = singletonLocalData<CurrencyAugmentList>('currency/augments.json');
export const loadLocalCurrencyTraits = singletonLocalData<CurrencyTraitList>('currency/traits.json');

export const loadLocalCurrencyPropIcons = singletonLocalData<CurrencyPropIconMap>('currency/prop_icons.json');

export function loadLocalCurrencyRole(id: string): Promise<CurrencyRoleDetail> {
  return loadLocalJSON<CurrencyRoleDetail>(`currency/role/${id}.json`, `cw_role_${id}`);
}
