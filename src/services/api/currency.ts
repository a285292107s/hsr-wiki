
import type {
  CurrencyRoleList, CurrencyRoleDetail,
  CurrencyEquipList, CurrencyPortalList, CurrencyAugmentList, CurrencyTraitList,
  CurrencyPropIconMap,
} from '../types';
import { loadLocalJSON, singletonLocalData } from './local';
import { getSavedTrailblazerGender, isTrailblazerId, pickGenderVariant } from '../../lib/trailblazer';

/* 开拓者形态名取支（货币战争域）：与角色域**同因不同源**，判据必须分开——
   本域每个命途**只有一条**（`id=8007` 带 `female_avatar_id=8008`），立绘随**用户设置**切换，
   而条目 id 恒为奇数（8007/8009）⇒ 若照角色域那样按 id 判性别，选女性的玩家会看到
   「Pionnier」配女立绘（名字与立绘互相矛盾）。故本域取支依据是 `getSavedTrailblazerGender()`，
   与 `currency-role.ts` / `CurrencyRoleView.vue` 取 `displayAvatarId` 用同一个源。
   非开拓者条目原样返回（`pickGenderVariant` 对无标记文本是恒等变换，此处显式短路省一次 replace）。 */
function fixTrailblazerName<T extends { id: number | string; name: string }>(row: T): T {
  if (!isTrailblazerId(row.id)) return row;
  const name = pickGenderVariant(row.name, getSavedTrailblazerGender());
  return name === row.name ? row : { ...row, name };
}

/* 取支在**缓存之外**做：底层单例存的是原始数据（代次只需语言），性别在每次调用时现读 ——
   故玩家在设置里切性别后立刻生效，无需给缓存加性别维度，也无需失效重建。
   返回新对象而非就地改：缓存里那份按语言共享，就地改会让二次调用叠加处理。 */
const rawCurrencyRoles = singletonLocalData<CurrencyRoleList>('currency/role.json');

/** 货币战争角色列表（单例；语言变化即重建）。羁绊页成员名也走本函数，故一处覆盖列表 / 详情 / 羁绊。 */
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
