import { loadLocalProperties } from '../services/api/properties';
import { loadLocalElements, loadLocalPaths } from '../services/api/lookups';
import type { PropertyRow, EnumLabelRow } from '../services/types';
import { labelTextOr } from './label-translator';

let propLabels: Record<string, string> = {};
let elemLabels: Record<string, string> = {};
let pathLabels: Record<string, string> = {};

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
    .then(() => undefined)
    .catch(() => undefined);
}

function fill(target: Record<string, string>, rows: EnumLabelRow[]): void {
  for (const row of rows) {
    if (!row.id || !row.name) continue;
    target[row.id] = row.name;
    target[row.id.toLowerCase()] = row.name;
  }
}

export function propLabel(id: string, fallback?: string): string {
  return propLabels[id] ?? fallback ?? id;
}

export function elemLabel(id: string): string {
  return elemLabels[id] ?? elemLabels[id.toLowerCase()] ?? id;
}

export function pathLabel(id: string): string {
  return pathLabels[id] ?? pathLabels[id.toLowerCase()] ?? id;
}

export function skillTypeLabel(type: string | null | undefined, fallback?: string): string {
  return type ? labelTextOr(`skillType.${type}`, fallback || type) : (fallback ?? '');
}

export function stanceTagLabel(stance: string): string {
  return labelTextOr(`stanceTag.${stance}`, stance);
}

export function relicSlotLabel(piece: { type: string; type_name?: string }): string {
  return piece.type_name || piece.type;
}

const MONSTER_RANK_SUFFIX: Record<string, string> = {
  Minion: 'minion',
  MinionLv2: 'minion',
  Elite: 'elite',
  LittleBoss: 'littleBoss',
  BigBoss: 'boss',
};

export function monsterRankKey(rank: string | null | undefined): string {
  return `monster.rank.${MONSTER_RANK_SUFFIX[rank ?? ''] ?? 'minion'}`;
}

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

export function cwPositionKey(v: string | null | undefined): string | undefined {
  return CW_POSITION_KEY[v ?? ''];
}

export function cwChargeKey(v: string | null | undefined): string | undefined {
  return CW_CHARGE_KEY[v ?? ''];
}

export function cwTraitCatKey(v: string | null | undefined): string | undefined {
  return CW_TRAIT_CAT_KEY[v ?? ''];
}

export function cwCostKey(v: string | null | undefined): string | undefined {
  return CW_COST_KEY[v ?? ''];
}

const CW_TRAIT_QUALITY_KEY: Record<string, string> = {
  Silver: 'catalog.quality.silver',
  Gold: 'catalog.quality.gold',
  Multicolor: 'catalog.quality.multicolor',
  Unique: 'catalog.quality.unique',
};

export function cwTraitQualityKey(v: string | null | undefined): string | undefined {
  return CW_TRAIT_QUALITY_KEY[v ?? ''];
}
