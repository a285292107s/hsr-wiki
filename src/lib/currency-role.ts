/**
 * 货币战争角色详情页数据转换（纯函数，无状态）
 *
 * 自 CurrencyRoleView.vue 提取（该视图原内联 40+ 条映射与跨星级合并逻辑）：
 * - 标签映射：前后台 / 充能类型 / 技能分组 / 属性名 / 属性语义分组
 * - 数据合并：跨星级技能合并（mergeSkillGroups）、成长矩阵（buildGrowthMatrix）
 * - 视图辅助：推荐装备分组 / 特质分类 / 随从 #N 引用解析 / 星魂机制文案
 *
 * 视图层只保留编排（加载 / Tab / 选中态）与模板渲染，本模块可独立单测。
 */
import { fmtDesc } from './format';
import type {
  CharacterData, CurrencyRoleRank, CurrencyRoleRecommend, CurrencyRoleRecommendItem,
  CurrencyRoleSkill, CurrencyRoleStar, CurrencyRoleTrait,
} from '../services/types';

/* ─── 标签映射 ─── */

/** 前后台定位标签 */
export const FB_LABEL: Record<string, string> = { Front: '前台', Back: '后台', Both: '前后台' };

/** 充能类型标签（用词依据 TextMap 官方文本：EnergyBar→「特殊充能」（技能描述「获得充能/充能达到N点」）,MaxSP→「终结技能量」（「初始终结技能量/恢复N终结技能量」）） */
export const CHARGE_LABEL: Record<string, string> = {
  Speed: '速度', EnergyBar: '特殊充能', MaxSP: '终结技能量', MaxHP: '生命上限', SP: '战技点',
};

/** 技能分组标签 */
export const SKILL_GROUP_LABEL: Record<string, string> = {
  front_show_skill: '前台技能',
  back_show_skill: '后台技能',
  servant_show_skill: '随从技能',
};

/** 属性名称映射：对齐 GridFightRolePropertyConfig.PropertyName（TextMap 官方名称） */
export const PROP_LABEL: Record<string, string> = {
  ExtraAllDamageTypeAddedRatio4: '伤害增幅',
  ExtraAllDamageTypeAddedRatio1: '伤害增幅',
  ExtraAllDamageTypeAddedRatio5: '伤害增幅',
  ExtraDamageAddedRatio1: '伤害增幅',
  ExtraInitSP: '初始能量',
  ExtraHPAddedRatio1: '生命增幅',
  ExtraHPAddedRatio2: '生命增幅',
  ExtraSpeedAddedRatio1: '速度增幅',
  ExtraSpeedAddedRatio2: '速度增幅',
  ExtraAttackAddedRatio: '攻击增幅',
  ExtraDefenceAddedRatio: '防御增幅',
  ExtraCriticalChanceBase: '暴击率增幅',
  ExtraCriticalDamageBase: '暴击伤害增幅',
  StanceBreakAddedRatio: '击破效率',
  ExtraBreakDamageAddedRatio: '击破特攻',
  BreakDamageAddedRatioBase: '击破特攻',
  ExtraHealBase: '基础治疗强度',
  ExtraHealRatioBase: '治疗强度',
  ExtraHealAddedRatio: '治疗强度',
  ExtraShieldBase: '基础护盾强度',
  ExtraShieldRatioBase: '护盾强度',
  ExtraShieldAddedRatio: '护盾强度',
  ExtraLuckChance: '幸运一击率',
  ExtraLuckDamage: '幸运一击伤害',
  ExtraFrontPowerAddedRatio1: '前台强度',
  ExtraBackPowerAddedRatio1: '后台强度',
  ExtraDOTDamageAddedRatio1: '持续伤害增幅',
  ExtraElementDamageAddedRatio1: '击破伤害增幅',
  ExtraInsertDamageAddedRatio1: '追加攻击伤害增幅',
  ExtraNormalDamageAddedRatio1: '普攻伤害增幅',
  ExtraSkillDamageAddedRatio1: '战技伤害增幅',
  ExtraUltraDamageAddedRatio1: '终结技伤害增幅',
  ExtraElationDamageAddedRatio1: '欢愉伤害增幅',
  ExtraAllDamageReduce: '伤害减免',
  ExtraQuantumResonance: '同频',
  SpeedAddedRatio: '速度增幅',
  AttackAddedRatio: '攻击增幅',
  DefenceAddedRatio: '防御增幅',
  HPAddedRatio: '生命增幅',
};

/** 属性名解析：优先 converter 落地的 prop_name（TextMap 官方名，官方改称呼自动同步）；
 *  缺失时查映射表，再回退去前缀（Extra/AddedRatio 噪声）。
 *  参数为结构化类型（非 Record）：调用方传 CurrencyPropMod / CurrencyEquipProp 等 interface 无需索引签名。 */
export function propLabel(m: { prop_name?: unknown; property_type?: unknown; name?: unknown }): string {
  const official = m.prop_name;
  if (typeof official === 'string' && official) return official;
  const key = String(m.property_type || m.name || '');
  return PROP_LABEL[key] || key.replace(/^Extra/, '').replace(/AddedRatio\d*$/, '');
}

/** 属性值格式化：绝对值 < 1 视为比率转百分比 */
export function propValue(v: number): string {
  return Math.abs(v) < 1 ? `${(v * 100).toFixed(0)}%` : String(v);
}

/* ─── 技能跨星级合并 ─── */

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
  /** 该技能存在的星级（与 paramSets 一一对应，升序；技能可能仅在部分星级出现） */
  stars: number[];
  paramSets: number[][];
  extraSets: Array<{ name: string; desc: string; paramSets: number[][] }>;
}

const SKILL_GROUPS = ['front_show_skill', 'back_show_skill', 'servant_show_skill'] as const;

/** 跨星级技能合并：按技能组 × 技能名收集各星级同名技能，参数集跨星级并置 */
export function mergeSkillGroups(
  stars: Record<string, CurrencyRoleStar> | null | undefined,
): Array<{ key: string; label: string; skills: MergedSkill[] }> {
  if (!stars) return [];
  const cols = Object.keys(stars).sort((a, b) => Number(a) - Number(b));
  if (!cols.length) return [];
  const out: Array<{ key: string; label: string; skills: MergedSkill[] }> = [];
  for (const g of SKILL_GROUPS) {
    // 以名称为键收集各星级的同名技能（附带星级号：技能可能在部分星级缺失，下标不能等价星级）
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
      // 附加条件（触发条件）同样跨星级合并
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
        stars,
        paramSets,
        extraSets,
      });
    }
    out.push({ key: g, label: SKILL_GROUP_LABEL[g], skills });
  }
  return out;
}

/* ─── 成长矩阵 ─── */

/** PropertyType → 语义分组标签（源数据 GridFightRolePropertyConfig.Order 映射） */
export const PROP_GROUP: Record<string, string> = {
  ExtraFrontPowerBase: '强度', ExtraFrontPowerAddedRatio1: '强度', ExtraFrontPowerAddedRatio2: '强度',
  ExtraBackPowerBase: '强度', ExtraBackPowerAddedRatio1: '强度', ExtraBackPowerAddedRatio2: '强度',
  ExtraTotalFrontPower: '强度', ExtraTotalBackPower: '强度',
  ExtraHPAddedRatio1: '生存', ExtraHPAddedRatio2: '生存',
  ExtraHealBase: '生存', ExtraHealRatioBase: '生存', ExtraHealAddedRatio: '生存', ExtraTotalHealPower: '生存',
  ExtraShieldBase: '生存', ExtraShieldRatioBase: '生存', ExtraShieldAddedRatio: '生存', ExtraTotalShieldPower: '生存',
  ExtraSpeedAddedRatio1: '速度', ExtraSpeedAddedRatio2: '速度', ExtraTotalSpeedAddedRatio: '速度', SpeedAddedRatio: '速度',
  ExtraAllDamageTypeAddedRatio1: '伤害', ExtraAllDamageTypeAddedRatio4: '伤害', ExtraAllDamageTypeAddedRatio5: '伤害',
  ExtraAttackAddedRatio: '伤害', ExtraDefenceAddedRatio: '伤害',
  ExtraCriticalChanceBase: '伤害', ExtraCriticalDamageBase: '伤害',
  ExtraBreakDamageAddedRatio: '伤害', StanceBreakAddedRatio: '伤害',
  ExtraUltraDamageAddedRatio1: '伤害', ExtraSkillDamageAddedRatio1: '伤害',
  ExtraNormalDamageAddedRatio1: '伤害', ExtraInsertDamageAddedRatio1: '伤害',
  ExtraDOTDamageAddedRatio1: '伤害', ExtraElementDamageAddedRatio1: '伤害',
  ExtraElationDamageAddedRatio1: '伤害', ExtraDamageAddedRatio1: '伤害',
  ExtraInitSP: '机制', ExtraEnergyBar: '机制',
  ExtraLuckChance: '机制', ExtraLuckDamage: '机制',
  /* 后台机制值（独立字段，非 PropertyType；充能条体系与终结技能量体系互斥出现） */
  BackEnergyBar: '机制', BackInitialEnergyBar: '机制',
  BackMaxSP: '机制', BackInitialSP: '机制',
  BackSpeedRewrite: '速度', BackSpeedAddedRatio: '速度',
};

/** 分组展示顺序 */
export const GROUP_ORDER = ['强度', '生存', '速度', '伤害', '机制'] as const;

/** 成长矩阵行（跨星级属性值列） */
export interface MatrixRow {
  key: string;
  label: string;
  values: Array<{ text: string; raw: number | null }>;
  /** 属性图标源路径（prop mod 自带或 propIcons 查表；空 = 无图标不渲染） */
  icon?: string;
}

/** 成长矩阵分组 */
export interface MatrixGroup {
  group: string;
  rows: MatrixRow[];
}

/**
 * 成长矩阵：跨星级全属性聚合（合并原「成长总览」表 + 「星级属性」分组）。
 * 属性按语义分组（PROP_GROUP），强度分组额外注入 front/back_power_base 行。
 * propIcons：PropertyType → 图标源路径（converter 落地 currency/prop_icons.json）；
 * 独立字段（幸运一击/治疗强度等）与 power 行靠它补图标，prop mod 自带 icon 优先。
 */
export function buildGrowthMatrix(
  stars: Record<string, CurrencyRoleStar> | null | undefined,
  propIcons?: Record<string, string> | null,
): MatrixGroup[] {
  if (!stars) return [];
  const cols = Object.keys(stars).sort((a, b) => Number(a) - Number(b));
  if (!cols.length) return [];
  /** 提取单星级全属性（GeneralPropertyModifyList + 独立字段），保持源序 */
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
    if (s.luck_chance != null) items.push({ key: 'ExtraLuckChance', label: '幸运一击率', raw: s.luck_chance, icon: propIcons?.['ExtraLuckChance'] });
    if (s.luck_damage != null) items.push({ key: 'ExtraLuckDamage', label: '幸运一击伤害', raw: s.luck_damage, icon: propIcons?.['ExtraLuckDamage'] });
    if (s.extra_heal_base != null) items.push({ key: 'ExtraHealBase', label: '基础治疗强度', raw: s.extra_heal_base, icon: propIcons?.['ExtraHealBase'] });
    if (s.extra_shield_base != null) items.push({ key: 'ExtraShieldBase', label: '基础护盾强度', raw: s.extra_shield_base, icon: propIcons?.['ExtraShieldBase'] });
    /* 后台机制值（数据存在才入矩阵；back_speed_* 为预留字段，当前全量 null 自动跳过） */
    if (s.back_energy_bar != null) items.push({ key: 'BackEnergyBar', label: '后台充能条', raw: s.back_energy_bar, icon: propIcons?.['ExtraEnergyBar'] });
    if (s.back_initial_energy_bar != null) items.push({ key: 'BackInitialEnergyBar', label: '后台初始充能', raw: s.back_initial_energy_bar, icon: propIcons?.['ExtraEnergyBar'] });
    if (s.back_max_sp != null) items.push({ key: 'BackMaxSP', label: '后台最大能量', raw: s.back_max_sp, icon: propIcons?.['ExtraInitSP'] });
    if (s.back_initial_sp != null) items.push({ key: 'BackInitialSP', label: '后台初始能量', raw: s.back_initial_sp, icon: propIcons?.['ExtraInitSP'] });
    if (s.back_speed_rewrite != null) items.push({ key: 'BackSpeedRewrite', label: '后台速度重写', raw: s.back_speed_rewrite, icon: propIcons?.['ExtraSpeedAddedRatio1'] });
    if (s.back_speed_added_ratio != null) items.push({ key: 'BackSpeedAddedRatio', label: '后台速度提升', raw: s.back_speed_added_ratio, icon: propIcons?.['ExtraSpeedAddedRatio1'] });
    return items;
  };
  // 以首现顺序收集全部属性 key
  const keyOrder: string[] = [];
  const keyLabel = new Map<string, string>();
  const keyIcon = new Map<string, string>();
  for (const c of cols) {
    for (const item of extract(stars[c])) {
      if (!keyLabel.has(item.key)) { keyOrder.push(item.key); keyLabel.set(item.key, item.label); }
      if (!keyIcon.has(item.key) && item.icon) keyIcon.set(item.key, item.icon);
    }
  }
  // 每星级 key → raw 索引
  const starMaps = cols.map((c) => {
    const map = new Map<string, number>();
    for (const item of extract(stars[c])) map.set(item.key, item.raw);
    return map;
  });
  // 按语义分组构建行
  const groupMap = new Map<string, MatrixRow[]>();
  for (const key of keyOrder) {
    const g = PROP_GROUP[key] || '其它';
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
  // 强度行：front/back_power_base 注入「强度」分组首位
  const powerRows: MatrixRow[] = [];
  const powOf = (field: 'front_power_base' | 'back_power_base') =>
    cols.map((c) => { const raw = stars[c]?.[field] ?? null; return { text: raw != null ? String(raw) : '—', raw }; });
  if (cols.some((c) => stars[c]?.front_power_base != null)) {
    powerRows.push({ key: '__front_power', label: '基础前台强度', values: powOf('front_power_base'), icon: propIcons?.['ExtraFrontPowerBase'] });
  }
  if (cols.some((c) => stars[c]?.back_power_base != null)) {
    powerRows.push({ key: '__back_power', label: '基础后台强度', values: powOf('back_power_base'), icon: propIcons?.['ExtraBackPowerBase'] });
  }
  const out: MatrixGroup[] = [];
  if (powerRows.length) out.push({ group: '强度', rows: [...powerRows, ...(groupMap.get('强度') || [])] });
  for (const g of GROUP_ORDER) {
    if (g === '强度') continue;
    const rows = groupMap.get(g);
    if (rows?.length) out.push({ group: g, rows });
  }
  for (const [g, rows] of groupMap) {
    if (!(GROUP_ORDER as readonly string[]).includes(g)) out.push({ group: g, rows });
  }
  return out;
}

/** 矩阵单元格增量标记：选中列值 ≠ 前一列值 */
export function matrixUp(row: MatrixRow, colIdx: number): boolean {
  if (colIdx <= 0) return false;
  const cur = row.values[colIdx]?.raw;
  const prev = row.values[colIdx - 1]?.raw;
  return cur != null && prev != null && cur !== prev;
}

/* ─── 推荐装备 ─── */

/** 推荐装备解析：各星级数据一致，取当前选中星级，回退首个非空星级 */
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

/** 推荐装备按行分组：前台一行、后台一行，每行内含首选/次选 */
export function buildRecommendRows(
  rec: CurrencyRoleRecommend | null,
): Array<{ pos: string; groups: Array<{ priority: string; items: CurrencyRoleRecommendItem[] }> }> {
  if (!rec) return [];
  const rows: Array<{ pos: string; groups: Array<{ priority: string; items: CurrencyRoleRecommendItem[] }> }> = [];
  const POS: Array<[keyof CurrencyRoleRecommend, string]> = [['front', '前台'], ['back', '后台']];
  for (const [key, posLabel] of POS) {
    const node = rec[key];
    if (!node) continue;
    const groups: Array<{ priority: string; items: CurrencyRoleRecommendItem[] }> = [];
    if (node.first?.length) groups.push({ priority: '首选', items: node.first });
    if (node.second?.length) groups.push({ priority: '次选', items: node.second });
    if (groups.length) rows.push({ pos: posLabel, groups });
  }
  return rows;
}

/* ─── 特质分类（头图羁绊图标分组，按 ID 段判定分类） ─── */

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

/** 特质按分类分组（仅含非空分类，分类顺序固定） */
export function groupTraits(traits: CurrencyRoleTrait[] | null | undefined): Array<{ cat: TraitCat; items: CurrencyRoleTrait[] }> {
  if (!traits || traits.length === 0) return [];
  const groups: Array<{ cat: TraitCat; items: CurrencyRoleTrait[] }> = [];
  for (const cat of Object.keys(TRAIT_CATEGORY) as TraitCat[]) {
    const items = traits.filter((tr) => catOfTrait(tr.id) === cat);
    if (items.length) groups.push({ cat, items });
  }
  return groups;
}

/* ─── 随从属性 #N 参数解析（#N → 常规模式角色技能 param_list） ─── */

/** 解析 #N 引用；字面值原样；无法解析返回 null（隐藏） */
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

/** 随从属性展示项（仅显示可解析项） */
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
  if (hpInh) items.push({ label: '生命继承', value: `${(Number(hpInh) * 100).toFixed(0)}%` });
  if (spd) items.push({ label: '速度', value: spd });
  if (spdInh) items.push({ label: '速度继承', value: `${(Number(spdInh) * 100).toFixed(0)}%` });
  return items;
}

/* ─── 星魂辅助 ─── */

/** 技能 ID → 技能名（星魂机制「强化技能」映射用；星级间同名同义） */
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

/** 星魂机制效果：强化技能（映射为技能名）+ 能量条修改 */
export function rankMech(rk: CurrencyRoleRank, nameMap: Map<number, string>): string {
  const parts: string[] = [];
  if (rk.modify_skill_list && rk.modify_skill_list.length) {
    const names = rk.modify_skill_list.map((id) => nameMap.get(id) || `#${id}`);
    parts.push(`强化技能：${names.join('、')}`);
  }
  if (rk.modify_energy_bar != null) parts.push(`能量条 +${rk.modify_energy_bar}`);
  return parts.join(' · ');
}

/** 后台星魂描述：用 param_list 渲染 */
export function rankDesc(rk: CurrencyRoleRank): string {
  if (rk.param_list && rk.param_list.length) return fmtDesc(rk.desc, rk.param_list);
  return fmtDesc(rk.desc).replace(/#\d+\[i\]/g, '');
}

/* ─── 杂项 ─── */

/** 韧性值文本：全零列表返回空串，否则以 ' / ' 分隔 */
export function stanceText(list: number[] | null): string {
  if (!list || list.every((v) => !v)) return '';
  return list.join(' / ');
}
