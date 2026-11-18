import { ref, shallowRef, type Ref, type ShallowRef } from 'vue';
import { useAppStore } from '../stores/app';
import {
  loadLocalCurrencyAugments,
  loadLocalCurrencyEquipment,
  loadLocalCurrencyPortals,
  loadLocalCurrencySeasons,
  loadLocalCurrencyRoles,
  loadLocalCurrencyTraits,
  loadLocalVersion,
} from '../../services/api';
import { getSavedCwSeason, setSavedCwSeason } from '../../lib/cw-season';
import type { CurrencySeasonEntry } from '../../services/types';
import { avatarDrawCardUrl, avatarShopIconUrl, gridFightTraitIconById } from '../../lib/icons';
import { cwChargeKey, cwCostKey, cwPositionKey, cwTraitCatKey, cwTraitQualityKey } from '../../lib/enum-labels';
import { activeHref } from '../../lib/i18n/active';
import type { CatalogContext, CatalogItem, CatalogPageConfig } from '../catalog/types';

export type CwTraitCat = 'faction' | 'combat' | 'special';

export const CW_TRAIT_CATS: readonly CwTraitCat[] = ['faction', 'combat', 'special'];

export interface CwTraitChip {
  id: string;
  name: string;
  icon: string;
  cat: string;
  isNew: boolean;
}

export interface CwRoleVariant {
  id: string;
  href: string;
  cost: number;
}

export interface CwRoleCard {
  avatarId: string;
  name: string;
  avatar: string;
  art: string;
  href: string;
  cost: number;
  costs: number[];
  variants: CwRoleVariant[];
  positionKey?: string;
  charges: Array<{ key?: string; text: string }>;
  traits: CwTraitChip[];
}

export interface CwTraitPackage {
  invite: boolean;
  stock: boolean;
  badge: boolean;
}

export interface CwTraitCard {
  id: string;
  seq: number;
  seqCat: number;
  name: string;
  href: string;
  icon: string;
  cat: CwTraitCat;
  catKey: string;
  layers: number;
  qualityKeys: string[];
  desc: string;
  carriers: Array<{ id: string; name: string; isNew: boolean; cost: number }>;
  pkg: CwTraitPackage;
}

export interface CwDomainStat {
  key: 'portals' | 'augments' | 'equipment';
  navKey: string;
  href: string;
  season: number;
  total: number;
}

export interface CwSeason {
  seasonId: number | null;
  version: string;
  syncedAt: string;
  roles: CwRoleCard[];
  traits: CwTraitCard[];
  byCat: Record<CwTraitCat, CwTraitCard[]>;
  costDist: Array<{ cost: number; key: string; count: number }>;
  posDist: Array<{ position: string; key: string; count: number }>;
  ledger: CwDomainStat[];
  totals: { roles: number; traits: number };
  packages: { invite: number; stock: number; badge: number; complete: number; partial: number };
}

const EMPTY_PACKAGE: CwTraitPackage = { invite: false, stock: false, badge: false };
const POSITION_ORDER = ['Front', 'Both', 'Back'];

function roleTraits(item: CatalogItem): Array<{ id: number | string; name?: string; cat?: string }> {
  return Array.isArray(item.traits) ? (item.traits as Array<{ id: number | string; name?: string; cat?: string }>) : [];
}

function traitPackageOf(item: CatalogItem): CwTraitPackage {
  const pkg = item.package as { invite?: number | null; stock?: number | null; badge?: number | null } | undefined;
  if (!pkg) return EMPTY_PACKAGE;
  return { invite: pkg.invite != null, stock: pkg.stock != null, badge: pkg.badge != null };
}

function normalizeDesc(value: unknown): string {
  return String(value ?? '').replace(/\\n/g, ' ').replace(/\s+/g, ' ').trim();
}

function groupRoles(roleItems: readonly CatalogItem[]): CwRoleCard[] {
  const order: string[] = [];
  const groups = new Map<string, CwRoleCard>();
  for (const item of roleItems) {
    const avatarId = String(item.avatar_id ?? item.id);
    const cost = Number(item.rarity) || 0;
    const variant: CwRoleVariant = {
      id: String(item.id),
      href: String(item.href ?? ''),
      cost,
    };
    const existing = groups.get(avatarId);
    if (existing) {
      existing.variants.push(variant);
      existing.costs.push(cost);
      existing.cost = Math.max(existing.cost, cost);
      continue;
    }
    order.push(avatarId);
    groups.set(avatarId, {
      avatarId,
      name: String(item.name ?? ''),
      avatar: String(item.avatar ?? avatarShopIconUrl(avatarId)),
      art: avatarDrawCardUrl(avatarId),
      href: variant.href,
      cost,
      costs: [cost],
      variants: [variant],
      positionKey: cwPositionKey(String(item.front_back_type ?? '')),
      charges: (Array.isArray(item.charge_type) ? item.charge_type : []).map((charge) => ({
        key: cwChargeKey(charge),
        text: charge,
      })),
      traits: roleTraits(item).map((ref) => {
        const id = String(ref.id);
        return {
          id,
          name: String(ref.name ?? ''),
          icon: gridFightTraitIconById(Number(id)),
          cat: String(ref.cat ?? 'special'),
          isNew: false,
        };
      }),
    });
  }
  return order.map((key) => groups.get(key)!);
}

export function buildCwSeason(
  roleItems: readonly CatalogItem[],
  traitItems: readonly CatalogItem[],
  ledger: readonly CwDomainStat[],
  seasonId: number | null = null,
  meta: { version?: string; syncedAt?: string } = {},
): CwSeason {
  const traitIds = new Set(traitItems.map((item) => String(item.id)));
  const carriersByTrait = new Map<string, CwTraitCard['carriers']>();
  for (const item of roleItems) {
    for (const ref of roleTraits(item)) {
      const id = String(ref.id);
      if (!traitIds.has(id)) continue;
      const bucket = carriersByTrait.get(id) ?? [];
      bucket.push({
        id: String(item.id),
        name: String(item.name ?? ''),
        isNew: false,
        cost: Number(item.rarity) || 0,
      });
      carriersByTrait.set(id, bucket);
    }
  }

  const traits = traitItems.map((item, index): CwTraitCard => {
    const id = String(item.id);
    const cat = (item.cat as CwTraitCat) ?? 'special';
    const layers = Array.isArray(item.layers) ? (item.layers as Array<{ quality?: string | null }>) : [];
    const qualityKeys = [...new Set(layers.map((layer) => cwTraitQualityKey(layer.quality)).filter(Boolean))] as string[];
    return {
      id,
      seq: index + 1,
      seqCat: 0,
      name: String(item.name ?? ''),
      href: String(item.href ?? ''),
      icon: gridFightTraitIconById(Number(id)),
      cat,
      catKey: cwTraitCatKey(cat) ?? 'catalog.traitCat.special',
      layers: layers.length,
      qualityKeys,
      desc: normalizeDesc(item.simple_desc),
      carriers: carriersByTrait.get(id) ?? [],
      pkg: traitPackageOf(item),
    };
  });

  const byCat = {} as Record<CwTraitCat, CwTraitCard[]>;
  for (const cat of CW_TRAIT_CATS) {
    byCat[cat] = traits.filter((trait) => trait.cat === cat);
    byCat[cat].forEach((trait, i) => { trait.seqCat = i + 1; });
  }

  const packages = traits.reduce(
    (acc, trait) => {
      if (trait.pkg.invite) acc.invite += 1;
      if (trait.pkg.stock) acc.stock += 1;
      if (trait.pkg.badge) acc.badge += 1;
      const owned = Number(trait.pkg.invite) + Number(trait.pkg.stock) + Number(trait.pkg.badge);
      if (owned === 3) acc.complete += 1;
      else if (owned > 0) acc.partial += 1;
      return acc;
    },
    { invite: 0, stock: 0, badge: 0, complete: 0, partial: 0 },
  );

  const roles = groupRoles(roleItems);

  const costCounts = new Map<number, number>();
  for (const role of roles) {
    for (const cost of role.costs) costCounts.set(cost, (costCounts.get(cost) ?? 0) + 1);
  }
  const costDist = [...costCounts.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([cost, count]) => ({ cost, key: cwCostKey(String(cost)) ?? '', count }));

  const posCounts = new Map<string, number>();
  for (const item of roleItems) {
    const raw = String(item.front_back_type ?? '');
    const position = POSITION_ORDER.includes(raw) ? raw : 'Both';
    posCounts.set(position, (posCounts.get(position) ?? 0) + 1);
  }
  const posDist = POSITION_ORDER.filter((position) => posCounts.has(position)).map((position) => ({
    position,
    key: cwPositionKey(position) ?? '',
    count: posCounts.get(position) ?? 0,
  }));

  return {
    seasonId,
    version: meta.version ?? '',
    syncedAt: meta.syncedAt ?? '',
    roles,
    traits,
    byCat,
    costDist,
    posDist,
    ledger: [...ledger],
    totals: { roles: roleItems.length, traits: traitItems.length },
    packages,
  };
}

const CW_SEASON_SOURCES = 5;

export interface CwSeasonShowcase {
  season: ShallowRef<CwSeason | null>;
  seasons: ShallowRef<CurrencySeasonEntry[]>;
  seasonScale: ShallowRef<Record<number, { roles: number; traits: number }>>;
  currentSeasonId: Ref<number | null>;
  selectedSeasonId: Ref<number | null>;
  loaded: Ref<boolean>;
  switching: Ref<boolean>;
  failedCount: Ref<number>;
  intakeFailed: Ref<number>;
  sourceCount: number;
  selectSeason(id: number): Promise<void>;
  load(): Promise<void>;
}

async function loadCatalogItems(
  loadPage: () => Promise<CatalogPageConfig>,
  ctx: CatalogContext,
): Promise<CatalogItem[] | null> {
  try {
    const page = await loadPage();
    return page.fetchData ? await page.fetchData(ctx) : [];
  } catch {
    return null;
  }
}

interface DomainCount {
  season: number;
  total: number;
}

interface DomainSnapshot {
  portals: DomainCount | null;
  augments: DomainCount | null;
  equipment: DomainCount | null;
  failed: number;
}

async function safeLoad<T>(load: () => Promise<T>): Promise<T | null> {
  try {
    return await load();
  } catch {
    return null;
  }
}

async function loadDomainSnapshot(seasonId: number | null): Promise<DomainSnapshot> {
  const [portals, augments, equipment] = await Promise.all([
    safeLoad(async () => {
      const list = await loadLocalCurrencyPortals();
      return {
        season: list.portals.filter((item) => seasonId != null && item.season_id === seasonId).length,
        total: list.portals.length,
      };
    }),
    safeLoad(async () => {
      const list = await loadLocalCurrencyAugments();
      return {
        season: list.augments.filter((item) => seasonId != null && item.season_id === seasonId).length,
        total: list.augments.length,
      };
    }),
    safeLoad(async () => {
      const list = await loadLocalCurrencyEquipment();
      return {
        season: list.items.filter((item) => seasonId != null && (item.season_ids ?? []).includes(seasonId)).length,
        total: list.items.length,
      };
    }),
  ]);
  return {
    portals: portals ?? null,
    augments: augments ?? null,
    equipment: equipment ?? null,
    failed: [portals, augments, equipment].filter((item) => item === null).length,
  };
}

function toLedger(snapshot: DomainSnapshot): CwDomainStat[] {
  const rows: CwDomainStat[] = [];
  if (snapshot.portals) {
    rows.push({
      key: 'portals',
      navKey: 'nav.cwPortal',
      href: activeHref('/currency/buff'),
      season: snapshot.portals.season,
      total: snapshot.portals.total,
    });
  }
  if (snapshot.augments) {
    rows.push({
      key: 'augments',
      navKey: 'nav.cwAugment',
      href: activeHref('/currency/augment'),
      season: snapshot.augments.season,
      total: snapshot.augments.total,
    });
  }
  if (snapshot.equipment) {
    rows.push({
      key: 'equipment',
      navKey: 'nav.cwEquipment',
      href: activeHref('/currency/item'),
      season: snapshot.equipment.season,
      total: snapshot.equipment.total,
    });
  }
  return rows;
}

export function useCwSeason(): CwSeasonShowcase {
  const app = useAppStore();
  const season = shallowRef<CwSeason | null>(null);
  const seasons = shallowRef<CurrencySeasonEntry[]>([]);
  const loaded = ref(false);
  const switching = ref(false);
  const failedCount = ref(0);
  const intakeFailed = ref(0);
  const currentSeasonId = ref<number | null>(null);
  const selectedSeasonId = ref<number | null>(null);
  const seasonScale = shallowRef<Record<number, { roles: number; traits: number }>>({});

  async function build(targetId: number | null): Promise<void> {
    const ctx: CatalogContext = { version: app.version, cwSeason: targetId ?? undefined };
    const [roleItems, traitItems, domains, version] = await Promise.all([
      loadCatalogItems(() => import('../catalog/pages/currency-role').then((m) => m.currencyRolePage), ctx),
      loadCatalogItems(() => import('../catalog/pages/currency-trait').then((m) => m.currencyTraitPage), ctx),
      loadDomainSnapshot(targetId),
      safeLoad(() => loadLocalVersion()),
    ]);
    intakeFailed.value = (roleItems === null ? 1 : 0) + (traitItems === null ? 1 : 0);
    failedCount.value = intakeFailed.value + domains.failed;
    season.value = buildCwSeason(roleItems ?? [], traitItems ?? [], toLedger(domains), targetId, {
      version: version?.version_label ?? '',
      syncedAt: version?.synced_at ?? '',
    });
  }

  async function load(): Promise<void> {
    loaded.value = false;
    await app.initVersion();
    const data = await safeLoad(() => loadLocalCurrencySeasons());
    const entries = data?.seasons ?? [];
    seasons.value = entries;
    const [roleList, traitList] = await Promise.all([
      safeLoad(() => loadLocalCurrencyRoles()),
      safeLoad(() => loadLocalCurrencyTraits()),
    ]);
    const roles = roleList?.roles ?? [];
    const traits = traitList?.traits ?? [];
    seasonScale.value = Object.fromEntries(entries.map((entry) => [
      entry.id,
      {
        roles: roles.filter((role) => (role.season_ids ?? []).includes(entry.id)).length,
        traits: traits.filter((trait) => trait.season_id === entry.id).length,
      },
    ]));
    currentSeasonId.value = data?.current_season ?? entries[entries.length - 1]?.id ?? null;
    const ids = new Set(entries.map((entry) => entry.id));
    const saved = getSavedCwSeason();
    const target = saved != null && ids.has(saved) ? saved : currentSeasonId.value;
    selectedSeasonId.value = target;
    await build(target);
    loaded.value = true;
  }

  async function selectSeason(id: number): Promise<void> {
    if (id === selectedSeasonId.value) return;
    switching.value = true;
    selectedSeasonId.value = id;
    setSavedCwSeason(id);
    await build(id);
    switching.value = false;
  }

  return { season, seasons, seasonScale, currentSeasonId, selectedSeasonId, loaded, switching, failedCount, intakeFailed, sourceCount: CW_SEASON_SOURCES, selectSeason, load };
}
