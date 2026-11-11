import { ref, shallowRef, type Ref } from 'vue';
import { useAppStore } from '../stores/app';
import { characterPage } from '../catalog/pages/character';
import { lightconePage } from '../catalog/pages/lightcone';
import { relicPage } from '../catalog/pages/relic';
import {
  loadLocalCharacter, loadLocalCharacterList, loadLocalLightCones, loadLocalLightConeDetail,
  loadLocalRelicSets, loadLocalRelicDetail,
} from '../../services/api';
import { fmtDesc } from '../../lib/format';
import { avatarCutinFigureUrl, avatarDrawCardUrl, lightConeMaxFigureUrl } from '../../lib/icons';
import { elemLabel, pathLabel } from '../../lib/enum-labels';
import { characterBlurb } from '../../lib/character-blurb';
import type { CatalogContext, CatalogItem, CatalogPageConfig } from '../catalog/types';
import { translate } from '../i18n';

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
  leadMeta?: ReleaseLeadMeta;
  leadId?: string;
  feature: boolean;
  listHref: string;
}

export interface ReleaseLeadMeta {
  name: string;
  href?: string;
  brief?: string;
  artSrc?: string;
  plateSrc?: string;
  facts?: string[];
  rarity?: number;
}

export interface ReleaseSource {
  kind: ReleaseKind;
  label: string;
  listHref: string;
  tagged: readonly ReleaseTagged[];
  items: readonly CatalogItem[];
  renderCard: (item: CatalogItem, index: number) => string;
  leadMeta?: (item: CatalogItem) => ReleaseLeadMeta;
  loadBrief?: (item: CatalogItem) => Promise<string>;
}

export function pickCurrentVersion<T extends ReleaseTagged>(
  list: readonly T[],
  label: string,
): T[] {
  const target = label.trim();
  if (!target) return [];
  return list.filter((item) => String(item.release_version ?? '').trim() === target);
}

const FEATURE_MAX = 1;

export function splitSources<T>(sourced: readonly (T | null)[]): { ok: T[]; failed: number } {
  const ok = sourced.filter((s): s is T => s !== null);
  return { ok, failed: sourced.length - ok.length };
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
    const feature = picked.length <= FEATURE_MAX;
    sections.push({
      kind: source.kind,
      label: source.label,
      count: picked.length,
      html: picked.map((item, i) => source.renderCard(item, i)).join(''),
      leadMeta: feature && source.leadMeta ? source.leadMeta(picked[0]!) : undefined,
      leadId: feature ? String(picked[0]!.id) : undefined,
      feature,
      listHref: source.listHref,
    });
  }
  return sections;
}

export async function fillFeatureBriefs(
  sources: readonly ReleaseSource[],
  sections: readonly ReleaseSection[],
): Promise<void> {
  await Promise.all(sections.map(async (sec) => {
    if (!sec.feature || !sec.leadMeta) return;
    const src = sources.find((s) => s.kind === sec.kind);
    const item = src?.items.find((it) => String(it.id) === String(sec.leadId));
    if (!src?.loadBrief || !item) return;
    try {
      const brief = await src.loadBrief(item);
      if (brief) sec.leadMeta = { ...sec.leadMeta, brief };
    } catch { }
  }));
}

export function buildReleaseSections(
  sources: readonly ReleaseSource[],
  label: string,
): ReleaseSection[] {
  return buildReleaseSectionsBy(sources, (list) => pickCurrentVersion(list, label));
}

async function characterBrief(item: CatalogItem): Promise<string> {
  const d = await loadLocalCharacter(String(item.id));
  return fmtDesc(characterBlurb(d.chara_info?.stories));
}

async function lightconeBrief(item: CatalogItem): Promise<string> {
  const d = await loadLocalLightConeDetail(String(item.id));
  const levels = Object.keys(d.skill.level).sort((a, b) => Number(a) - Number(b));
  const lv = levels.length ? d.skill.level[levels[0]!] : undefined;
  return fmtDesc(d.skill.desc, lv ? lv.param_list : []);
}

async function relicBrief(item: CatalogItem): Promise<string> {
  const d = await loadLocalRelicDetail(String(item.id));
  const pc = d.descriptions['4'] != null ? '4' : Object.keys(d.descriptions)[0];
  if (!pc) return '';
  return fmtDesc(d.descriptions[pc] ?? '', (d.param_list && d.param_list[pc]) || []);
}

const RELEASE_SOURCES: Array<{
  kind: ReleaseKind;
  label: string;
  listHref: string;
  page: CatalogPageConfig;
  loadTagged: () => Promise<readonly ReleaseTagged[]>;
  leadMeta: (item: CatalogItem) => ReleaseLeadMeta;
  loadBrief: (item: CatalogItem) => Promise<string>;
}> = [
  {
    kind: 'character', label: translate('nav.character'), listHref: '/character', page: characterPage, loadTagged: () => loadLocalCharacterList(),
    loadBrief: characterBrief,
    leadMeta: (item) => ({
      name: String(item.name || ''),
      href: item.href ? String(item.href) : undefined,
      artSrc: avatarDrawCardUrl(String(item.id)),
      plateSrc: avatarCutinFigureUrl(String(item.id)),
      facts: [elemLabel(String(item.element || '')), pathLabel(String(item.path || ''))].filter(Boolean),
      rarity: Number(item.rarity) || undefined,
    }),
  },
  {
    kind: 'lightcone', label: translate('nav.lightcone'), listHref: '/lightcone', page: lightconePage, loadTagged: () => loadLocalLightCones(),
    loadBrief: lightconeBrief,
    leadMeta: (item) => ({
      name: String(item.name || ''),
      href: item.href ? String(item.href) : undefined,
      plateSrc: lightConeMaxFigureUrl(String(item.id)),
      facts: [pathLabel(String(item.path || ''))].filter(Boolean),
      rarity: Number(item.rarity) || undefined,
    }),
  },
  {
    kind: 'relic', label: translate('nav.relic'), listHref: '/relic', page: relicPage, loadTagged: () => loadLocalRelicSets(),
    loadBrief: relicBrief,
    leadMeta: (item) => ({
      name: String(item.name || ''),
      href: item.href ? String(item.href) : undefined,
    }),
  },
];

const RELEASE_LABELS: readonly string[] = RELEASE_SOURCES.map((s) => s.label);
const RELEASE_SK_KINDS: readonly ReleaseKind[] = RELEASE_SOURCES.map((s) => s.kind);

export interface ReleaseShowcase {
  sections: Ref<ReleaseSection[]>;
  loaded: Ref<boolean>;
  failedCount: Ref<number>;
  labels: readonly string[];
  skKinds: readonly ReleaseKind[];
  load(): Promise<void>;
}

export function useReleaseShowcase(): ReleaseShowcase {
  const app = useAppStore();
  const sections = shallowRef<ReleaseSection[]>([]);
  const loaded = ref(false);
  const failedCount = ref(0);

  async function load(): Promise<void> {
    loaded.value = false;
    failedCount.value = 0;
    await app.initVersion();
    const label = app.versionLabel;
    const ctx: CatalogContext = { version: app.version };
    const sourced = await Promise.all(
      RELEASE_SOURCES.map(async (spec): Promise<ReleaseSource | null> => {
        try {
          const [tagged, items] = await Promise.all([
            spec.loadTagged(),
            spec.page.fetchData ? spec.page.fetchData(ctx) : Promise.resolve<CatalogItem[]>([]),
          ]);
          return {
            kind: spec.kind, label: spec.label, listHref: spec.listHref, tagged, items,
            renderCard: spec.page.renderCard, leadMeta: spec.leadMeta, loadBrief: spec.loadBrief,
          };
        } catch {
          return null;
        }
      }),
    );
    const { ok, failed } = splitSources(sourced);
    failedCount.value = failed;
    const built = buildReleaseSections(ok, label);
    await fillFeatureBriefs(ok, built);
    sections.value = built;
    loaded.value = true;
  }

  return { sections, loaded, failedCount, labels: RELEASE_LABELS, skKinds: RELEASE_SK_KINDS, load };
}
