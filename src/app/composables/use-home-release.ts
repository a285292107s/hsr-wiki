import { ref, shallowRef } from 'vue';
import type { Ref, ShallowRef } from 'vue';
import { characterBlurb } from '../../lib/character-blurb';
import { elemLabel, pathLabel } from '../../lib/enum-labels';
import { fmtDesc } from '../../lib/format';
import {
  avatarCutinFigureUrl, avatarDrawCardUrl, eidolonIconUrl, elementIconUrl,
  itemIconUrl, lightConeMaxFigureUrl, pathIconUrl,
} from '../../lib/icons';
import {
  loadLocalCharacter, loadLocalCharacterList, loadLocalLightConeDetail,
  loadLocalLightCones, loadLocalRelicSets, loadLocalVersion,
} from '../../services/api';
import { cdnFallbackFromPrimary } from '../../services/cdn';
import type {
  CharacterData, LocalCharEntry, LocalLightConeEntry, LocalRelicEntry,
} from '../../services/types';
import { translate } from '../i18n';
import { useAppStore } from '../stores/app';

export type HomeKind = 'character' | 'lightcone' | 'relic';

export interface HomeFact {
  text: string;
  icon?: string;
}

export interface HomeIcon {
  name: string;
  icon: string;
  fallback: string;
}

export interface HomeEntry {
  kind: HomeKind;
  id: string;
  name: string;
  to: string;
  rarity: number;
  facts: HomeFact[];
  plate: string;
  plateFallback: string;
  art: string;
  artFallback: string;
  brief: string;
  eidolons: HomeIcon[];
  skillName: string;
  skillDesc: string;
  set2: string;
  set4: string;
}

export interface HomeSearchEntry {
  kind: HomeKind;
  id: string;
  name: string;
  to: string;
  rarity: number;
}

export interface HomeCover {
  src: string;
  fallback: string;
  alt: string;
}

export interface HomeRelease {
  version: string;
  syncedAt: string;
  total: number;
  characters: HomeEntry[];
  lightcones: HomeEntry[];
  relics: HomeEntry[];
  cover: HomeCover[];
  totals: { characters: number; lightcones: number; relics: number };
  searchable: HomeSearchEntry[];
}

const KIND_LABEL: Record<HomeKind, string> = {
  character: translate('nav.character'),
  lightcone: translate('nav.lightcone'),
  relic: translate('nav.relic'),
};

export const HOME_LABELS: readonly string[] = [KIND_LABEL.character, KIND_LABEL.lightcone, KIND_LABEL.relic];

export function homeKindLabel(kind: HomeKind): string {
  return KIND_LABEL[kind];
}

function toIcon(name: string, src: string): HomeIcon | null {
  return src ? { name, icon: src, fallback: cdnFallbackFromPrimary(src) } : null;
}

function pickEidolons(data: CharacterData, charId: string): HomeIcon[] {
  const out: HomeIcon[] = [];
  const keys = Object.keys(data.ranks ?? {}).sort((a, b) => Number(a) - Number(b)).slice(0, 6);
  for (const key of keys) {
    const rank = data.ranks[key];
    if (!rank) continue;
    const icon = toIcon(rank.name, eidolonIconUrl(charId, key));
    if (icon) out.push(icon);
  }
  return out;
}

async function buildCharacter(item: LocalCharEntry): Promise<HomeEntry> {
  const id = String(item.id);
  const detail = await loadLocalCharacter(id).catch(() => null);
  const plate = avatarCutinFigureUrl(id);
  const art = avatarDrawCardUrl(id);
  const element = String(item.element || '');
  const path = String(item.path || '');
  const facts: HomeFact[] = [];
  if (element) facts.push({ text: elemLabel(element), icon: elementIconUrl(element.toLowerCase()) });
  if (path) facts.push({ text: pathLabel(path), icon: pathIconUrl(path.toLowerCase()) });
  return {
    kind: 'character',
    id,
    name: item.name,
    to: `/character/${id}`,
    rarity: Number(item.rarity) || 5,
    facts,
    plate,
    plateFallback: cdnFallbackFromPrimary(plate),
    art,
    artFallback: cdnFallbackFromPrimary(art),
    brief: detail ? fmtDesc(characterBlurb(detail.chara_info?.stories)) : '',
    eidolons: detail ? pickEidolons(detail, id) : [],
    skillName: '',
    skillDesc: '',
    set2: '',
    set4: '',
  };
}

async function buildLightCone(item: LocalLightConeEntry): Promise<HomeEntry> {
  const id = String(item.id);
  const detail = await loadLocalLightConeDetail(id).catch(() => null);
  const levels = detail ? Object.keys(detail.skill.level ?? {}).sort((a, b) => Number(a) - Number(b)) : [];
  const level = detail && levels.length ? detail.skill.level[levels[0] as string] : undefined;
  const plate = lightConeMaxFigureUrl(id);
  const path = String(item.path || '');
  return {
    kind: 'lightcone',
    id,
    name: item.name,
    to: `/lightcone/${id}`,
    rarity: Number(item.rarity) || 5,
    facts: path ? [{ text: pathLabel(path), icon: pathIconUrl(path.toLowerCase()) }] : [],
    plate,
    plateFallback: cdnFallbackFromPrimary(plate),
    art: plate,
    artFallback: cdnFallbackFromPrimary(plate),
    brief: '',
    eidolons: [],
    skillName: detail?.skill?.name || item.skill_name || '',
    skillDesc: detail
      ? fmtDesc(detail.skill.desc, level?.param_list ?? [])
      : fmtDesc(item.skill_desc),
    set2: '',
    set4: '',
  };
}

function buildRelic(item: LocalRelicEntry): HomeEntry {
  const id = String(item.id);
  const plate = itemIconUrl(item.icon_figure);
  return {
    kind: 'relic',
    id,
    name: item.name,
    to: `/relic/${id}`,
    rarity: Number(item.pieces?.[0]?.rarity) || 5,
    facts: [],
    plate,
    plateFallback: cdnFallbackFromPrimary(plate),
    art: plate,
    artFallback: cdnFallbackFromPrimary(plate),
    brief: '',
    eidolons: [],
    skillName: '',
    skillDesc: '',
    set2: fmtDesc(item.descriptions?.['2'], item.param_list?.['2'] ?? []),
    set4: fmtDesc(item.descriptions?.['4'], item.param_list?.['4'] ?? []),
  };
}

function buildSearchIndex(
  characters: readonly LocalCharEntry[],
  lightcones: readonly LocalLightConeEntry[],
  relics: readonly LocalRelicEntry[],
): HomeSearchEntry[] {
  const out: HomeSearchEntry[] = [];
  for (const item of characters) {
    if (item.name) out.push({ kind: 'character', id: String(item.id), name: item.name, to: `/character/${item.id}`, rarity: Number(item.rarity) || 5 });
  }
  for (const item of lightcones) {
    if (item.name) out.push({ kind: 'lightcone', id: String(item.id), name: item.name, to: `/lightcone/${item.id}`, rarity: Number(item.rarity) || 5 });
  }
  for (const item of relics) {
    if (item.name) out.push({ kind: 'relic', id: String(item.id), name: item.name, to: `/relic/${item.id}`, rarity: Number(item.pieces?.[0]?.rarity) || 5 });
  }
  return out;
}

export function searchHome(index: readonly HomeSearchEntry[], raw: string, limit = 8): HomeSearchEntry[] {
  const needle = raw.trim().toLowerCase();
  if (!needle) return [];
  const hits: { entry: HomeSearchEntry; rank: number }[] = [];
  for (const entry of index) {
    const at = entry.name.toLowerCase().indexOf(needle);
    if (at < 0) continue;
    hits.push({ entry, rank: at });
  }
  hits.sort((a, b) => a.rank - b.rank);
  return hits.slice(0, limit).map((hit) => hit.entry);
}

export interface HomeReleaseState {
  release: ShallowRef<HomeRelease | null>;
  loaded: Ref<boolean>;
  failedCount: Ref<number>;
  labels: readonly string[];
  load(): Promise<void>;
}

export function useHomeRelease(): HomeReleaseState {
  const app = useAppStore();
  const release = shallowRef<HomeRelease | null>(null);
  const loaded = ref(false);
  const failedCount = ref(0);

  async function load(): Promise<void> {
    loaded.value = false;
    failedCount.value = 0;
    await app.initVersion();
    const label = app.versionLabel.trim();
    const results = await Promise.allSettled([
      loadLocalVersion(),
      loadLocalCharacterList(),
      loadLocalLightCones(),
      loadLocalRelicSets(),
    ]);
    const [versionResult, charResult, coneResult, relicResult] = results;
    if (versionResult.status === 'rejected') {
      failedCount.value = HOME_LABELS.length;
      release.value = null;
      loaded.value = true;
      return;
    }
    const failed = [charResult, coneResult, relicResult].filter((result) => result.status === 'rejected').length;
    const chars = charResult.status === 'fulfilled' ? charResult.value : [];
    const cones = coneResult.status === 'fulfilled' ? coneResult.value : [];
    const relics = relicResult.status === 'fulfilled' ? relicResult.value : [];
    const current = <T extends { release_version?: string }>(list: readonly T[]): T[] =>
      label ? list.filter((item) => String(item.release_version ?? '').trim() === label) : [];
    const [characters, lightcones] = await Promise.all([
      Promise.all(current(chars).map((item) => buildCharacter(item))),
      Promise.all(current(cones).map((item) => buildLightCone(item))),
    ]);
    const relicEntries = current(relics).map((item) => buildRelic(item));
    const coverSource = characters.length ? characters : lightcones;
    const version = versionResult.value;
    release.value = {
      version: String(version.version_label || label || ''),
      syncedAt: String(version.synced_at || ''),
      total: characters.length + lightcones.length + relicEntries.length,
      characters,
      lightcones,
      relics: relicEntries,
      cover: coverSource
        .slice(0, 2)
        .filter((entry) => entry.art)
        .map((entry) => ({ src: entry.art, fallback: entry.artFallback, alt: entry.name })),
      totals: { characters: chars.length, lightcones: cones.length, relics: relics.length },
      searchable: buildSearchIndex(chars, cones, relics),
    };
    failedCount.value = failed;
    loaded.value = true;
  }

  return { release, loaded, failedCount, labels: HOME_LABELS, load };
}
