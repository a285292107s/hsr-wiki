import { ref, shallowRef, type Ref } from 'vue';
import { useAppStore } from '../stores/app';
import { characterPage } from '../catalog/pages/character';
import { lightconePage } from '../catalog/pages/lightcone';
import { relicPage } from '../catalog/pages/relic';
import { loadLocalCharacterList, loadLocalLightCones, loadLocalRelicSets } from '../../services/api';
import type { CatalogContext, CatalogItem, CatalogPageConfig } from '../catalog/types';

export type ReleaseKind = 'character' | 'lightcone' | 'relic' | 'role' | 'trait';

export interface ReleaseTagged {
  id: number | string;
  release_version?: string;
  is_season_new?: boolean;
}

export interface ReleaseSection {
  kind: ReleaseKind;
  label: string;
  count: number;
  html: string;
}

export interface ReleaseSource {
  kind: ReleaseKind;
  label: string;
  tagged: readonly ReleaseTagged[];
  items: readonly CatalogItem[];
  renderCard: (item: CatalogItem, index: number) => string;
}

export function pickCurrentVersion<T extends ReleaseTagged>(
  list: readonly T[],
  label: string,
): T[] {
  const target = label.trim();
  if (!target) return [];
  return list.filter((item) => String(item.release_version ?? '').trim() === target);
}

export function pickSeasonNew<T extends ReleaseTagged>(list: readonly T[]): T[] {
  return list.filter((item) => item.is_season_new === true);
}

export function buildReleaseSectionsBy(
  sources: readonly ReleaseSource[],
  pick: (list: readonly ReleaseTagged[]) => readonly ReleaseTagged[],
): ReleaseSection[] {
  const sections: ReleaseSection[] = [];
  for (const source of sources) {
    const ids = new Set(pick(source.tagged).map((item) => String(item.id)));
    if (!ids.size) continue;
    const picked = source.items.filter((item) => ids.has(String(item.id)));
    if (!picked.length) continue;
    sections.push({
      kind: source.kind,
      label: source.label,
      count: picked.length,
      html: picked.map((item, i) => source.renderCard(item, i)).join(''),
    });
  }
  return sections;
}

export function buildReleaseSections(
  sources: readonly ReleaseSource[],
  label: string,
): ReleaseSection[] {
  return buildReleaseSectionsBy(sources, (list) => pickCurrentVersion(list, label));
}

const RELEASE_SOURCES: Array<{
  kind: ReleaseKind;
  label: string;
  page: CatalogPageConfig;
  loadTagged: () => Promise<readonly ReleaseTagged[]>;
}> = [
  { kind: 'character', label: '角色', page: characterPage, loadTagged: () => loadLocalCharacterList() },
  { kind: 'lightcone', label: '光锥', page: lightconePage, loadTagged: () => loadLocalLightCones() },
  { kind: 'relic', label: '遗器', page: relicPage, loadTagged: () => loadLocalRelicSets() },
];

const CW_RELEASE_SOURCES: Array<{
  kind: ReleaseKind;
  label: string;
  loadPage: () => Promise<CatalogPageConfig>;
}> = [
  {
    kind: 'role',
    label: '角色图鉴',
    loadPage: () => import('../catalog/pages/currency-role').then((m) => m.currencyRolePage),
  },
  {
    kind: 'trait',
    label: '羁绊图鉴',
    loadPage: () => import('../catalog/pages/currency-trait').then((m) => m.currencyTraitPage),
  },
];

export interface ReleaseShowcase {
  sections: Ref<ReleaseSection[]>;
  loaded: Ref<boolean>;
  load(): Promise<void>;
}

export function useReleaseShowcase(): ReleaseShowcase {
  const app = useAppStore();
  const sections = shallowRef<ReleaseSection[]>([]);
  const loaded = ref(false);

  async function load(): Promise<void> {
    await app.initVersion();
    const label = app.versionLabel;
    const ctx: CatalogContext = { version: app.version };
    const sources: ReleaseSource[] = [];
    for (const spec of RELEASE_SOURCES) {
      try {
        const [tagged, items] = await Promise.all([
          spec.loadTagged(),
          spec.page.fetchData ? spec.page.fetchData(ctx) : Promise.resolve<CatalogItem[]>([]),
        ]);
        sources.push({
          kind: spec.kind, label: spec.label, tagged, items, renderCard: spec.page.renderCard,
        });
      } catch {
      }
    }
    sections.value = buildReleaseSections(sources, label);
    loaded.value = true;
  }

  return { sections, loaded, load };
}

export function useCwReleaseShowcase(): ReleaseShowcase {
  const app = useAppStore();
  const sections = shallowRef<ReleaseSection[]>([]);
  const loaded = ref(false);

  async function load(): Promise<void> {
    await app.initVersion();
    const ctx: CatalogContext = { version: app.version };

    const sourced = await Promise.all(
      CW_RELEASE_SOURCES.map(async (spec): Promise<ReleaseSource | null> => {
        try {
          const page = await spec.loadPage();
          await Promise.all((page.styles ?? []).map((loadCss) => loadCss().catch(() => undefined)));
          const items = page.fetchData ? await page.fetchData(ctx) : [];
          return {
            kind: spec.kind,
            label: spec.label,
            tagged: items.map((item) => ({
              id: String(item.id),
              is_season_new: item.is_season_new === true,
            })),
            items,
            renderCard: page.renderCard,
          };
        } catch {
          return null;
        }
      }),
    );
    sections.value = buildReleaseSectionsBy(
      sourced.filter((s): s is ReleaseSource => s !== null),
      pickSeasonNew,
    );
    loaded.value = true;
  }

  return { sections, loaded, load };
}
