
import { fmtDesc } from './format';
import { labelText as tr, labelTextOr as trAuto } from './label-translator';
import { elemLabel } from './enum-labels';
import './constants';
import type {
  CharacterData, CurrencyRoleRank, CurrencyRoleRecommend, CurrencyRoleRecommendItem,
  CurrencyRoleSkill, CurrencyRoleStar, CurrencyRoleTrait,
} from '../services/types';


/* 充能类型标签：用词依据 TextMap 官方文本——EnergyBar →「特殊充能」（技能描述「获得充能/充能达到N点」）、
   MaxSP →「终结技能量」（「初始终结技能量/恢复N终结技能量」） */
const SKILL_GROUP_KEY: Record<string, string> = {
  front_show_skill: 'skillGroup.front',
  back_show_skill: 'skillGroup.back',
  servant_show_skill: 'skillGroup.servant',
};

/* 属性名称映射：对齐 GridFightRolePropertyConfig.PropertyName（TextMap 官方名称）。
   无前缀键 = 常规模式属性体系（GridFightRolePropertyConfig 未收录 → 数据无 prop_name，改查词典 `prop.*`）；
   词典值取自官方词条（见 tools/fill-ui-messages.py 的 PROP_LABEL 回填块）。 */
/** 属性名解析：优先 converter 落地的 prop_name（TextMap 官方名，官方改称呼自动同步）；
    缺失时查词典 `prop.*`，再回退去前缀（Extra/AddedRatio 噪声）。
    参数为结构化类型（非 Record）：调用方传 CurrencyPropMod / CurrencyEquipProp 等 interface 无需索引签名。 */
export function propLabel(m: { prop_name?: unknown; property_type?: unknown; name?: unknown }): string {
  const official = m.prop_name;
  if (typeof official === 'string' && official) return official;
  const key = String(m.property_type || m.name || '');
  const cleaned = key.replace(/^Extra/, '').replace(/AddedRatio\d*$/, '');
  return key ? trAuto(`prop.${key}`, cleaned) : cleaned;
}

/** 属性值格式化：绝对值 < 1 视为比率转百分比 */
export function propValue(v: number): string {
  return Math.abs(v) < 1 ? `${(v * 100).toFixed(0)}%` : String(v);
}

/** 跨星级合并技能：同名技能在各星级的参数集合并，描述以斜杠分隔多星级值 */
export interface MergedSkill {
  key: string;
  name: string;
  /** 技能图标源路径（透传首星级；gridFightSkillIconSrc 解析双源） */
  icon: string;
  type: string | null;
  tag: string | null;
  desc: string;
  simple_desc: string;
  sp_base: number | null;
  sp_need: number | null;
  bp_need: number | null;
  bp_add: number | null;
  show_stance_list: number[] | null;
  /** 削韧属性（官方展示值配套，ELEM 映射中文） */
  stance_damage_type: string | null;
  /** 削韧显示值（官方 UI 展示值；show_stance_list 为引擎参数，两者无对应关系） */
  stance_damage_display: number | null;
  /** 该技能存在的星级（与 paramSets 一一对应，升序；技能可能仅在部分星级出现） */
  stars: number[];
  paramSets: number[][];
  extraSets: Array<{ name: string; desc: string; paramSets: number[][] }>;
}

const SKILL_GROUPS = ['front_show_skill', 'back_show_skill', 'servant_show_skill'] as const;

export function mergeSkillGroups(
  stars: Record<string, CurrencyRoleStar> | null | undefined,
): Array<{ key: string; label: string; skills: MergedSkill[] }> {
  if (!stars) return [];
  const cols = Object.keys(stars).sort((a, b) => Number(a) - Number(b));
  if (!cols.length) return [];
  const out: Array<{ key: string; label: string; skills: MergedSkill[] }> = [];
  for (const g of SKILL_GROUPS) {

    const byName = new Map<string, Array<{ sk: CurrencyRoleSkill; star: number }>>();
    for (const c of cols) {
      for (const sk of (stars[c]?.[g] || [])) {
        const k = sk.name || `#${sk.id}`;
        if (!byName.has(k)) byName.set(k, []);
        byName.get(k)!.push({ sk, star: Number(c) });
      }
    }
    if (!byName.size) continue;
    const skills: MergedSkill[] = [];
    for (const [name, list] of byName) {
      const first = list[0].sk;
      const paramSets = list.map(({ sk }) => {
        const lv = sk.level && sk.level['1'];
        return lv ? lv.param_list : [];
      });
      const stars = list.map((x) => x.star);

      const extraSets: MergedSkill['extraSets'] = [];
      const exKeys = new Set<string>();
      list.forEach(({ sk }) => Object.keys(sk.extra || {}).forEach((ek) => exKeys.add(ek)));
      for (const ek of exKeys) {
        const exList = list.map(({ sk }) => (sk.extra || {})[ek]).filter(Boolean);
        if (!exList.length) continue;
        extraSets.push({
          name: exList[0].name,
          desc: exList[0].desc,
          paramSets: exList.map((ex) => ex.param || []),
        });
      }
      skills.push({
        key: `${g}-${name}`,
        name,
        icon: first.icon || '',
        type: first.type,
        tag: first.tag,
        desc: first.desc,
        simple_desc: first.simple_desc,
        sp_base: first.sp_base,
        sp_need: first.sp_need,
        bp_need: first.bp_need,
        bp_add: first.bp_add,
        show_stance_list: first.show_stance_list,
        stance_damage_type: first.stance_damage_type,
        stance_damage_display: first.stance_damage_display,
        stars,
        paramSets,
        extraSets,
      });
    }
    out.push({ key: g, label: trAuto(SKILL_GROUP_KEY[g] ?? '', g), skills });
  }
  return out;
}

const PROP_GROUP_KEY: Record<string, string> = {
  ExtraFrontPowerBase: 'power',
  ExtraFrontPowerAddedRatio1: 'power',
  ExtraFrontPowerAddedRatio2: 'power',
  ExtraBackPowerBase: 'power',
  ExtraBackPowerAddedRatio1: 'power',
  ExtraBackPowerAddedRatio2: 'power',
  ExtraTotalFrontPower: 'power',
  ExtraTotalBackPower: 'power',
  ExtraHPAddedRatio1: 'survival',
  ExtraHPAddedRatio2: 'survival',
  ExtraHealBase: 'survival',
  ExtraHealRatioBase: 'survival',
  ExtraHealAddedRatio: 'survival',
  ExtraTotalHealPower: 'survival',
  ExtraShieldBase: 'survival',
  ExtraShieldRatioBase: 'survival',
  ExtraShieldAddedRatio: 'survival',
  ExtraTotalShieldPower: 'survival',
  ExtraSpeedAddedRatio1: 'speed',
  ExtraSpeedAddedRatio2: 'speed',
  ExtraTotalSpeedAddedRatio: 'speed',
  SpeedAddedRatio: 'speed',
  ExtraAllDamageTypeAddedRatio1: 'damage',
  ExtraAllDamageTypeAddedRatio4: 'damage',
  ExtraAllDamageTypeAddedRatio5: 'damage',
  ExtraAttackAddedRatio: 'damage',
  ExtraDefenceAddedRatio: 'damage',
  ExtraCriticalChanceBase: 'damage',
  ExtraCriticalDamageBase: 'damage',
  ExtraBreakDamageAddedRatio: 'damage',
  StanceBreakAddedRatio: 'damage',
  ExtraUltraDamageAddedRatio1: 'damage',
  ExtraSkillDamageAddedRatio1: 'damage',
  ExtraNormalDamageAddedRatio1: 'damage',
  ExtraInsertDamageAddedRatio1: 'damage',
  ExtraDOTDamageAddedRatio1: 'damage',
  ExtraElementDamageAddedRatio1: 'damage',
  ExtraElationDamageAddedRatio1: 'damage',
  ExtraDamageAddedRatio1: 'damage',
  ExtraInitSP: 'mechanic',
  ExtraEnergyBar: 'mechanic',
  ExtraLuckChance: 'mechanic',
  ExtraLuckDamage: 'mechanic',
  BackEnergyBar: 'mechanic',
  BackInitialEnergyBar: 'mechanic',
  BackMaxSP: 'mechanic',
  BackInitialSP: 'mechanic',
  BackSpeedRewrite: 'speed',
  BackSpeedAddedRatio: 'speed',
};

export const GROUP_ORDER = ['power', 'survival', 'speed', 'damage', 'mechanic'] as const;

export interface MatrixRow {
  key: string;
  label: string;
  values: Array<{ text: string; raw: number | null }>;

  icon?: string;
}

export interface MatrixGroup {
  group: string;
  rows: MatrixRow[];
}

export function buildGrowthMatrix(
  stars: Record<string, CurrencyRoleStar> | null | undefined,
  propIcons?: Record<string, string> | null,
): MatrixGroup[] {
  if (!stars) return [];
  const cols = Object.keys(stars).sort((a, b) => Number(a) - Number(b));
  if (!cols.length) return [];

  const extract = (s: CurrencyRoleStar | undefined): Array<{ key: string; label: string; raw: number; icon?: string }> => {
    if (!s) return [];
    const items: Array<{ key: string; label: string; raw: number; icon?: string }> = [];
    const list = s.general_property_modify_list;
    if (Array.isArray(list)) {
      for (const m of list) {
        if (!m || typeof m !== 'object') continue;
        const key = String((m as Record<string, unknown>).property_type || '');
        items.push({
          key,
          label: propLabel(m as Record<string, unknown>),
          raw: Number((m as Record<string, unknown>).value),
          icon: String((m as Record<string, unknown>).icon || ''),
        });
      }
    }
    if (s.luck_chance != null) items.push({ key: 'ExtraLuckChance', label: trAuto('prop.ExtraLuckChance', 'ExtraLuckChance'), raw: s.luck_chance, icon: propIcons?.['ExtraLuckChance'] });
    if (s.luck_damage != null) items.push({ key: 'ExtraLuckDamage', label: trAuto('prop.ExtraLuckDamage', 'ExtraLuckDamage'), raw: s.luck_damage, icon: propIcons?.['ExtraLuckDamage'] });
    if (s.extra_heal_base != null) items.push({ key: 'ExtraHealBase', label: trAuto('prop.ExtraHealBase', 'ExtraHealBase'), raw: s.extra_heal_base, icon: propIcons?.['ExtraHealBase'] });
    if (s.extra_shield_base != null) items.push({ key: 'ExtraShieldBase', label: trAuto('prop.ExtraShieldBase', 'ExtraShieldBase'), raw: s.extra_shield_base, icon: propIcons?.['ExtraShieldBase'] });

    if (s.back_energy_bar != null) items.push({ key: 'BackEnergyBar', label: tr('cwRole.backEnergyBar'), raw: s.back_energy_bar, icon: propIcons?.['ExtraEnergyBar'] });
    if (s.back_initial_energy_bar != null) items.push({ key: 'BackInitialEnergyBar', label: tr('cwRole.backInitialEnergy'), raw: s.back_initial_energy_bar, icon: propIcons?.['ExtraEnergyBar'] });
    if (s.back_max_sp != null) items.push({ key: 'BackMaxSP', label: tr('cwRole.backMaxEnergy'), raw: s.back_max_sp, icon: propIcons?.['ExtraInitSP'] });
    if (s.back_initial_sp != null) items.push({ key: 'BackInitialSP', label: tr('cwRole.backInitialSp'), raw: s.back_initial_sp, icon: propIcons?.['ExtraInitSP'] });
    if (s.back_speed_rewrite != null) items.push({ key: 'BackSpeedRewrite', label: tr('cwRole.backSpeedRewrite'), raw: s.back_speed_rewrite, icon: propIcons?.['ExtraSpeedAddedRatio1'] });
    if (s.back_speed_added_ratio != null) items.push({ key: 'BackSpeedAddedRatio', label: tr('cwRole.backSpeedBoost'), raw: s.back_speed_added_ratio, icon: propIcons?.['ExtraSpeedAddedRatio1'] });
    return items;
  };

  const keyOrder: string[] = [];
  const keyLabel = new Map<string, string>();
  const keyIcon = new Map<string, string>();
  for (const c of cols) {
    for (const item of extract(stars[c])) {
      if (!keyLabel.has(item.key)) { keyOrder.push(item.key); keyLabel.set(item.key, item.label); }
      if (!keyIcon.has(item.key) && item.icon) keyIcon.set(item.key, item.icon);
    }
  }

  const starMaps = cols.map((c) => {
    const map = new Map<string, number>();
    for (const item of extract(stars[c])) map.set(item.key, item.raw);
    return map;
  });

  const groupMap = new Map<string, MatrixRow[]>();
  for (const key of keyOrder) {
    const g = PROP_GROUP_KEY[key] || 'other';
    if (!groupMap.has(g)) groupMap.set(g, []);
    groupMap.get(g)!.push({
      key,
      label: keyLabel.get(key) || key,
      values: starMaps.map((m) => {
        const raw = m.get(key) ?? null;
        return { text: raw != null ? (key === 'ExtraLuckDamage' ? `${raw}×` : propValue(raw)) : '—', raw };
      }),
      icon: keyIcon.get(key),
    });
  }

  const powerRows: MatrixRow[] = [];
  const powOf = (field: 'front_power_base' | 'back_power_base') =>
    cols.map((c) => { const raw = stars[c]?.[field] ?? null; return { text: raw != null ? String(raw) : '—', raw }; });
  if (cols.some((c) => stars[c]?.front_power_base != null)) {
    powerRows.push({ key: '__front_power', label: tr('cwRole.frontPowerBase'), values: powOf('front_power_base'), icon: propIcons?.['ExtraFrontPowerBase'] });
  }
  if (cols.some((c) => stars[c]?.back_power_base != null)) {
    powerRows.push({ key: '__back_power', label: tr('cwRole.backPowerBase'), values: powOf('back_power_base'), icon: propIcons?.['ExtraBackPowerBase'] });
  }
  const out: MatrixGroup[] = [];
  /* 分组字段输出**译文**（内部按枚举归并）：`propGroup.*` 是界面分类名，与属性名同源走词典 */
  const groupLabel = (g: string): string => trAuto(`propGroup.${g}`, g);
  if (powerRows.length) {
    out.push({ group: groupLabel('power'), rows: [...powerRows, ...(groupMap.get('power') || [])] });
  }
  for (const g of GROUP_ORDER) {
    if (g === 'power') continue;
    const rows = groupMap.get(g);
    if (rows?.length) out.push({ group: groupLabel(g), rows });
  }
  for (const [g, rows] of groupMap) {
    if (!(GROUP_ORDER as readonly string[]).includes(g)) out.push({ group: groupLabel('other'), rows });
  }
  return out;
}

export function matrixUp(row: MatrixRow, colIdx: number): boolean {
  if (colIdx <= 0) return false;
  const cur = row.values[colIdx]?.raw;
  const prev = row.values[colIdx - 1]?.raw;
  return cur != null && prev != null && cur !== prev;
}

export function resolveRecommend(
  stars: Record<string, CurrencyRoleStar> | null | undefined,
  selected: CurrencyRoleStar | null | undefined,
): CurrencyRoleRecommend | null {
  if (!stars) return null;
  if (selected?.recommend) return selected.recommend;
  for (const k of Object.keys(stars)) {
    const r = stars[k]?.recommend;
    if (r) return r;
  }
  return null;
}

/** 推荐优先级：**稳定枚举**（不是文案）——视图按它选样式，文案由视图取词典。
 *  旧实现返回中文文案并让视图拿它做 `=== '首选'` 比较，多语言后该分支恒假（首/次选样式失效）。 */
export type RecommendPriority = 'first' | 'second';

export function buildRecommendRows(
  rec: CurrencyRoleRecommend | null,
): Array<{ pos: string; groups: Array<{ priority: RecommendPriority; items: CurrencyRoleRecommendItem[] }> }> {
  if (!rec) return [];
  const rows: Array<{
    pos: string;
    groups: Array<{ priority: RecommendPriority; items: CurrencyRoleRecommendItem[] }>;
  }> = [];
  const POS: Array<[keyof CurrencyRoleRecommend, string]> = [
    ['front', tr('catalog.position.front')], ['back', tr('catalog.position.back')],
  ];
  for (const [key, posLabel] of POS) {
    const node = rec[key];
    if (!node) continue;
    const groups: Array<{ priority: RecommendPriority; items: CurrencyRoleRecommendItem[] }> = [];
    if (node.first?.length) groups.push({ priority: 'first', items: node.first });
    if (node.second?.length) groups.push({ priority: 'second', items: node.second });
    if (groups.length) rows.push({ pos: posLabel, groups });
  }
  return rows;
}

/** 推荐优先级 → 展示文案的词典键。 */
export function recommendPriorityKey(p: RecommendPriority): string {
  return p === 'first' ? 'cwRole.priorityFirst' : 'cwRole.prioritySecond';
}

export const TRAIT_CATEGORY = {
  faction: { range: [1000, 2000] as [number, number] },
  combat: { range: [2000, 3000] as [number, number] },
  special: { range: [3000, 4000] as [number, number] },
} as const;

export type TraitCat = keyof typeof TRAIT_CATEGORY;

export function catOfTrait(id: number): TraitCat {
  for (const [key, cfg] of Object.entries(TRAIT_CATEGORY)) {
    if (id >= cfg.range[0] && id < cfg.range[1]) return key as TraitCat;
  }
  return 'special';
}

export function groupTraits(traits: CurrencyRoleTrait[] | null | undefined): Array<{ cat: TraitCat; items: CurrencyRoleTrait[] }> {
  if (!traits || traits.length === 0) return [];
  const groups: Array<{ cat: TraitCat; items: CurrencyRoleTrait[] }> = [];
  for (const cat of Object.keys(TRAIT_CATEGORY) as TraitCat[]) {
    const items = traits.filter((tr) => catOfTrait(tr.id) === cat);
    if (items.length) groups.push({ cat, items });
  }
  return groups;
}

export function resolveServantAttr(
  ref: string | number | null | undefined,
  skillId: number | null | undefined,
  charData: CharacterData | null,
): string | null {
  if (ref == null || ref === '') return null;
  if (typeof ref === 'number') return String(ref);
  if (!/^#\d+$/.test(ref)) return String(ref);
  const idx = parseInt(ref.slice(1), 10) - 1;
  const pl = charData?.skills?.[String(skillId)]?.level?.['1']?.param_list;
  if (pl && pl[idx] != null) return String(pl[idx]);
  return null;
}

export function buildServantAttrs(
  servant: CurrencyRoleStar['servant'] | null | undefined,
  charData: CharacterData | null,
): Array<{ label: string; value: string }> {
  if (!servant) return [];
  const items: Array<{ label: string; value: string }> = [];
  const hp = resolveServantAttr(servant.hp_base, servant.hp_skill, charData);
  const hpInh = resolveServantAttr(servant.hp_inherit, servant.hp_skill, charData);
  const spd = resolveServantAttr(servant.speed_base, servant.speed_skill, charData);
  const spdInh = resolveServantAttr(servant.speed_inherit, servant.speed_skill, charData);
  if (hp) items.push({ label: 'HP', value: hp });
  if (hpInh) items.push({ label: tr('cwRole.hpInherit'), value: `${(Number(hpInh) * 100).toFixed(0)}%` });
  if (spd) items.push({ label: tr('catalog.charge.speed'), value: spd });
  if (spdInh) items.push({ label: tr('cwRole.speedInherit'), value: `${(Number(spdInh) * 100).toFixed(0)}%` });
  return items;
}

export function buildSkillNameMap(
  stars: Record<string, CurrencyRoleStar> | null | undefined,
): Map<number, string> {
  const map = new Map<number, string>();
  if (!stars) return map;
  for (const s of Object.values(stars)) {
    for (const g of SKILL_GROUPS) {
      for (const sk of s[g] || []) map.set(sk.id, sk.name || `#${sk.id}`);
    }
  }
  return map;
}

export function rankMech(rk: CurrencyRoleRank, nameMap: Map<number, string>): string {
  const parts: string[] = [];
  if (rk.modify_skill_list && rk.modify_skill_list.length) {
    const names = rk.modify_skill_list.map((id) => nameMap.get(id) || `#${id}`);
    parts.push(tr('cwRole.enhancedSkills').replace('{names}', names.join('、')));
  }
  if (rk.modify_energy_bar != null) parts.push(tr('cwRole.energyBar').replace('{n}', String(rk.modify_energy_bar)));
  return parts.join(' · ');
}

export function rankDesc(rk: CurrencyRoleRank): string {
  if (rk.param_list && rk.param_list.length) return fmtDesc(rk.desc, rk.param_list);
  return fmtDesc(rk.desc).replace(/#\d+\[i\]/g, '');
}

export function stanceText(list: number[] | null): string {
  if (!list || list.every((v) => !v)) return '';
  return list.join(' / ');
}

export function stanceLine(sk: {
  stance_damage_type: string | null;
  stance_damage_display: number | null;
  show_stance_list: number[] | null;
}): string {
  const t = sk.stance_damage_type;
  const d = sk.stance_damage_display;
  if (t && d != null) return `${elemLabel(t)} ${d}`.trim();
  return stanceText(sk.show_stance_list);
}
