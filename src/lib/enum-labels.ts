/**
 * 枚举标签表：展示名不再写死在 `lib/constants.ts`，而是取**官方词条名**（随语言包切语言）。
 *
 * 词条名由 converter 解析成令牌落在 `public/data/cn/properties.json`（见 `tools/converter/enum_labels.py`），
 * 本模块在 `bootstrap()` **挂载前**加载一次并常驻。为啥要阻塞挂载：标签是同步读取的，若改成挂载后
 * 再填，首帧会先显示原始枚举键（`CriticalChanceBase`）再跳变——那种闪变比多等一个小请求更糟。
 * 加载失败不阻断启动：调用方回退原始枚举键（可见、不至于白屏）。
 */
import { loadLocalProperties } from '../services/api/properties';
import { loadLocalElements, loadLocalPaths } from '../services/api/lookups';
import type { PropertyRow, EnumLabelRow } from '../services/types';
import { labelTextOr } from './label-translator';

let propLabels: Record<string, string> = {};
let elemLabels: Record<string, string> = {};
let pathLabels: Record<string, string> = {};

/** 加载并常驻属性 / 元素 / 命途标签表（幂等；`bootstrap()` 挂载前 await）。 */
export function loadEnumLabels(): Promise<void> {
  return Promise.all([
    loadLocalProperties().then((rows: PropertyRow[]) => {
      const map: Record<string, string> = {};
      for (const row of rows) if (row.name) map[row.id] = row.name;
      propLabels = map;
    }),
    loadLocalElements().then((rows) => fill(elemLabels = {}, rows)),
    loadLocalPaths().then((rows) => fill(pathLabels = {}, rows)),
  ])
    /* 标签表缺失不阻断启动：调用方回退原始枚举键（可见、不至于白屏） */
    .then(() => undefined)
    .catch(() => undefined);
}

function fill(target: Record<string, string>, rows: EnumLabelRow[]): void {
  for (const row of rows) {
    if (!row.id || !row.name) continue;
    target[row.id] = row.name;
    /* 大小写兼容：数据里同一枚举出现过 `Knight` 与 `knight` 两种写法（旧手写表两套都登记过） */
    target[row.id.toLowerCase()] = row.name;
  }
}

/** 属性枚举 → 官方词条名；未收录（或标签表未就绪）时用 `fallback`，再退回枚举键本身。 */
export function propLabel(id: string, fallback?: string): string {
  return propLabels[id] ?? fallback ?? id;
}

/** 元素枚举（`DamageType`）→ 官方名（`elements.json` 令牌，随语言包切语言）。 */
export function elemLabel(id: string): string {
  return elemLabels[id] ?? elemLabels[id.toLowerCase()] ?? id;
}

/** 命途枚举（`AvatarBaseType`）→ 官方名（`paths.json` 令牌）。 */
export function pathLabel(id: string): string {
  return pathLabels[id] ?? pathLabels[id.toLowerCase()] ?? id;
}

/* 技能类型 / 削韧架势：没有数据载体（`data` 里只有枚举，官方表未落名）⇒ 走词典；词典值取自官方词条。 */
/** 技能类型枚举 → 展示名；缺键时回退调用方给的 `type_name`（数据里已有官方名）或枚举键。 */
export function skillTypeLabel(type: string | null | undefined, fallback?: string): string {
  return type ? labelTextOr(`skillType.${type}`, fallback || type) : (fallback ?? '');
}

/** 削韧架势枚举（`SingleAttack`/`AoEAttack`/`Blast`）→ 展示名。 */
export function stanceTagLabel(stance: string): string {
  return labelTextOr(`stanceTag.${stance}`, stance);
}

/** 遗器部位标签：取结构层里的官方部位名（令牌化），缺字段时回退枚举键。 */
export function relicSlotLabel(piece: { type: string; type_name?: string }): string {
  return piece.type_name || piece.type;
}

/* 怪物分类（Minion/Elite/LittleBoss/BigBoss）走**词典**而不是数据字段：它没有数据载体
   （`monsters.json` 只落枚举，且共享聚合表新增键会漏进 endgame / voracity 的 payload，见
   docs/memory/data-pipeline.md 的坑位），而分类名是官方术语 ⇒ 词典值是官方译文。 */
const MONSTER_RANK_SUFFIX: Record<string, string> = {
  Minion: 'minion',
  MinionLv2: 'minion',  // 与 Minion 同文案（上游的档位变体）
  Elite: 'elite',
  LittleBoss: 'littleBoss',
  BigBoss: 'boss',
};

/** 怪物分类枚举 → 词典键（`monster.rank.*`）；未登记回退 `minion`。 */
export function monsterRankKey(rank: string | null | undefined): string {
  return `monster.rank.${MONSTER_RANK_SUFFIX[rank ?? ''] ?? 'minion'}`;
}

/* 货币战争的枚举展示名（前后台 / 充能类型 / 特质分类 / 费用档）：与怪物分类同理——没有数据载体，
   故走词典；枚举 → 键的映射收在这里，配置（筛选选项）与视图（卡面标签）共用一份。 */
const CW_POSITION_KEY: Record<string, string> = {
  Front: 'catalog.position.front', Back: 'catalog.position.back', Both: 'catalog.position.both',
};

const CW_CHARGE_KEY: Record<string, string> = {
  Speed: 'catalog.charge.speed', EnergyBar: 'catalog.charge.specialEnergy',
  MaxSP: 'catalog.charge.ultEnergy', MaxHP: 'catalog.charge.maxHp', SP: 'catalog.charge.sp',
};

const CW_TRAIT_CAT_KEY: Record<string, string> = {
  faction: 'catalog.traitCat.faction', combat: 'catalog.traitCat.combat', special: 'catalog.traitCat.special',
};

const CW_COST_KEY: Record<string, string> = {
  '1': 'catalog.cost.1', '2': 'catalog.cost.2', '3': 'catalog.cost.3',
  '4': 'catalog.cost.4', '5': 'catalog.cost.5', '6+': 'catalog.cost.special',
};

/** 前后台 → 词典键；未登记返回 undefined（调用方回退原始枚举值，不编文案）。 */
export function cwPositionKey(v: string | null | undefined): string | undefined {
  return CW_POSITION_KEY[v ?? ''];
}

/** 充能类型 → 词典键；未登记返回 undefined。 */
export function cwChargeKey(v: string | null | undefined): string | undefined {
  return CW_CHARGE_KEY[v ?? ''];
}

/** 特质分类 → 词典键；未登记返回 undefined。 */
export function cwTraitCatKey(v: string | null | undefined): string | undefined {
  return CW_TRAIT_CAT_KEY[v ?? ''];
}

/** 费用档 → 词典键；未登记返回 undefined（更高档位无对应词条 ⇒ 回退数值本身）。 */
export function cwCostKey(v: string | null | undefined): string | undefined {
  return CW_COST_KEY[v ?? ''];
}

/** 羁绊层级品质 → 词典键（与货币图鉴的品质枚举不同：这里是 Multicolor/Unique）；未登记返回 undefined。 */
const CW_TRAIT_QUALITY_KEY: Record<string, string> = {
  Silver: 'catalog.quality.silver',
  Gold: 'catalog.quality.gold',
  Multicolor: 'catalog.quality.multicolor',
  Unique: 'catalog.quality.unique',
};

export function cwTraitQualityKey(v: string | null | undefined): string | undefined {
  return CW_TRAIT_QUALITY_KEY[v ?? ''];
}
