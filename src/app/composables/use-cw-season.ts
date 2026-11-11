import { ref, shallowRef, type Ref, type ShallowRef } from 'vue';
import { useAppStore } from '../stores/app';
import {
  loadLocalCurrencyAugments,
  loadLocalCurrencyEquipment,
  loadLocalCurrencyPortals,
  loadLocalVersion,
} from '../../services/api';
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
  season: number | null;
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
  const newTraits = traitItems.filter((item) => item.is_season_new === true);
  const newTraitIds = new Set(newTraits.map((item) => String(item.id)));
  const carriersByTrait = new Map<string, CwTraitCard['carriers']>();
  for (const item of roleItems) {
    for (const ref of roleTraits(item)) {
      const id = String(ref.id);
      if (!newTraitIds.has(id)) continue;
      const bucket = carriersByTrait.get(id) ?? [];
      bucket.push({
        id: String(item.id),
        name: String(item.name ?? ''),
        isNew: item.is_season_new === true,
        cost: Number(item.rarity) || 0,
      });
      carriersByTrait.set(id, bucket);
    }
  }

  const traits = newTraits.map((item, index): CwTraitCard => {
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

  const newRoles = roleItems.filter((item) => item.is_season_new === true);
  const roles = groupRoles(newRoles);
  const newTraitChips = new Map(traits.map((trait) => [trait.id, trait]));
  for (const role of roles) {
    role.traits = role.traits.map((chip) => ({ ...chip, isNew: newTraitChips.has(chip.id) }));
  }

  const costCounts = new Map<number, number>();
  for (const role of roles) {
    for (const cost of role.costs) costCounts.set(cost, (costCounts.get(cost) ?? 0) + 1);
  }
  const costDist = [...costCounts.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([cost, count]) => ({ cost, key: cwCostKey(String(cost)) ?? '', count }));

  const posCounts = new Map<string, number>();
  for (const item of newRoles) {
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
  loaded: Ref<boolean>;
  failedCount: Ref<number>;
  intakeFailed: Ref<number>;
  sourceCount: number;
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

interface DomainSnapshot {
  seasonId: number | null;
  portals: { season: number; total: number } | null;
  augments: { season: number; total: number } | null;
  equipment: { total: number } | null;
  failed: number;
}

async function safeLoad<T>(load: () => Promise<T>): Promise<T | null> {
  try {
    return await load();
  } catch {
    return null;
  }
}

async function loadDomainSnapshot(): Promise<DomainSnapshot> {
  const [portals, augments, equipment] = await Promise.all([
    safeLoad(async () => {
      const list = await loadLocalCurrencyPortals();
      const seasonId = list.season?.id ?? null;
      return {
        seasonId,
        season: list.portals.filter((item) => seasonId != null && item.season_id === seasonId).length,
        total: list.portals.length,
      };
    }),
    safeLoad(async () => {
      const list = await loadLocalCurrencyAugments();
      const seasonId = list.season?.id ?? null;
      return {
        seasonId,
        season: list.augments.filter((item) => seasonId != null && item.season_id === seasonId).length,
        total: list.augments.length,
      };
    }),
    safeLoad(async () => {
      const list = await loadLocalCurrencyEquipment();
      return { total: list.items.length };
    }),
  ]);
  return {
    seasonId: portals?.seasonId ?? augments?.seasonId ?? null,
    portals: portals ? { season: portals.season, total: portals.total } : null,
    augments: augments ? { season: augments.season, total: augments.total } : null,
    equipment,
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
      season: null,
      total: snapshot.equipment.total,
    });
  }
  return rows;
}

export function useCwSeason(): CwSeasonShowcase {
  const app = useAppStore();
  const season = shallowRef<CwSeason | null>(null);
  const loaded = ref(false);
  const failedCount = ref(0);
  const intakeFailed = ref(0);

  async function load(): Promise<void> {
    loaded.value = false;
    failedCount.value = 0;
    intakeFailed.value = 0;
    await app.initVersion();
    const ctx: CatalogContext = { version: app.version };
    const [roleItems, traitItems, domains, version] = await Promise.all([
      loadCatalogItems(() => import('../catalog/pages/currency-role').then((m) => m.currencyRolePage), ctx),
      loadCatalogItems(() => import('../catalog/pages/currency-trait').then((m) => m.currencyTraitPage), ctx),
      loadDomainSnapshot(),
      safeLoad(() => loadLocalVersion()),
    ]);
    intakeFailed.value = (roleItems === null ? 1 : 0) + (traitItems === null ? 1 : 0);
    failedCount.value = intakeFailed.value + domains.failed;
    season.value = buildCwSeason(roleItems ?? [], traitItems ?? [], toLedger(domains), domains.seasonId, {
      version: version?.version_label ?? '',
      syncedAt: version?.synced_at ?? '',
    });
    loaded.value = true;
  }

  return { season, loaded, failedCount, intakeFailed, sourceCount: CW_SEASON_SOURCES, load };
}
