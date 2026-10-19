
import type {
  CurrencyRoleList, CurrencyRoleDetail,
  CurrencyEquipList, CurrencyPortalList, CurrencyAugmentList, CurrencyTraitList,
  CurrencyPropIconMap,
} from '../types';
import { loadLocalJSON, singletonLocalData } from './local';
import { getSavedTrailblazerGender, isTrailblazerId, pickGenderVariant } from '../../lib/trailblazer';

function fixTrailblazerName<T extends { id: number | string; name: string }>(row: T): T {
  if (!isTrailblazerId(row.id)) return row;
  const name = pickGenderVariant(row.name, getSavedTrailblazerGender());
  return name === row.name ? row : { ...row, name };
}

const rawCurrencyRoles = singletonLocalData<CurrencyRoleList>('currency/role.json');

export function loadLocalCurrencyRoles(): Promise<CurrencyRoleList> {
  return rawCurrencyRoles().then((d) => ({ ...d, roles: d.roles.map(fixTrailblazerName) }));
}

export const loadLocalCurrencyEquipment = singletonLocalData<CurrencyEquipList>('currency/equipment.json');
export const loadLocalCurrencyPortals = singletonLocalData<CurrencyPortalList>('currency/portals.json');
export const loadLocalCurrencyAugments = singletonLocalData<CurrencyAugmentList>('currency/augments.json');
export const loadLocalCurrencyTraits = singletonLocalData<CurrencyTraitList>('currency/traits.json');

export const loadLocalCurrencyPropIcons = singletonLocalData<CurrencyPropIconMap>('currency/prop_icons.json');

export async function loadLocalCurrencyRole(id: string): Promise<CurrencyRoleDetail> {
  const d = await loadLocalJSON<CurrencyRoleDetail>(`currency/role/${id}.json`, `cw_role_${id}`);
  if (!isTrailblazerId(id)) return d;
  const name = pickGenderVariant(d.name, getSavedTrailblazerGender());
  return name === d.name ? d : { ...d, name };
}
