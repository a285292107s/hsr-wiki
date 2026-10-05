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
  /** 该分区全部条目的模板串（来自各目录页 renderCard），在带内横向排列 */
  html: string;
  /**
   * 特写档（**恰 1 条**）：这一行只有主条目，故额外给「名字 + 详情入口」的规格块，
   * 由它在行右端承担排版权重与显式动作。
   * 2 条及以上一律平权卡带——每条的名字就在卡上、卡本身就是入口（判据见 FEATURE_MAX）。
   */
  leadMeta?: ReleaseLeadMeta;
  feature: boolean;
  /** 分区级入口（该族图鉴页）：任何条数下都恰好一个显式动作，不偏袒任何条目 */
  listHref: string;
}

export interface ReleaseLeadMeta {
  name: string;
  href?: string;
}

/* 特写规格（count ≤ 2）的**文字块**：只放条目自身可推出、且卡上没有的事实。
   实测卡内文字（`nk-idx-card` 真珠/★★★★★/冰/欢愉、`nk-lc-card` 献给明日的色彩/挥墨、
   `nk-relic-card` 4件套/贪噬禁果的异端）——元素、命途、技能名、套装标签**都已在卡上**，
   故本块只留「名字 + 详情链接」：名字是特写的排版权重，链接是卡之外唯一的显式动作。 */
export interface ReleaseSource {
  kind: ReleaseKind;
  label: string;
  /** 分区级入口目标：该族图鉴页（任何条数下唯一且不偏袒条目的显式动作） */
  listHref: string;
  tagged: readonly ReleaseTagged[];
  items: readonly CatalogItem[];
  renderCard: (item: CatalogItem, index: number) => string;
  leadMeta?: (item: CatalogItem) => ReleaseLeadMeta;
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

/* 特写档判据：**恰 1 条**。
   2 条时「挑一条特写」没有任何判据——旧判据是 `count ≤ 2` 且取 `picked[0]`，实测 4.6 的遗器两套里
   只有第一套拿到大名字 + 查看档案，另一套权重相同却什么都没有，读起来像漏了一条；
   反过来给两条都加，则是每个分区多出一排与卡内标签重复的名字 + 按钮（原型实测 4 条档：
   分区高 446 → 584px、同屏 4 个大名字 + 4 个指向同一 href 的按钮）。
   故 ≥2 条一律平权卡带：名字与入口由卡本身承担（卡是 `<a>`、名在卡上、hover/焦点态齐全）。 */
const FEATURE_MAX = 1;

/** 单源失败只丢该分区，但要**计数**：全失败与「本版本无新增」在页面上必须可区分，
    否则一次网络故障会被渲染成「本版本暂无新增条目」——把故障说成事实。 */
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
      leadMeta: feature && source.leadMeta ? source.leadMeta(picked[0]) : undefined,
      feature,
      listHref: source.listHref,
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
  listHref: string;
  page: CatalogPageConfig;
  loadTagged: () => Promise<readonly ReleaseTagged[]>;
  leadMeta: (item: CatalogItem) => ReleaseLeadMeta;
}> = [
  {
    kind: 'character', label: '角色', listHref: '/character', page: characterPage, loadTagged: () => loadLocalCharacterList(),
    leadMeta: (item) => ({
      name: String(item.name || ''),
      href: item.href ? String(item.href) : undefined,
    }),
  },
  {
    kind: 'lightcone', label: '光锥', listHref: '/lightcone', page: lightconePage, loadTagged: () => loadLocalLightCones(),
    leadMeta: (item) => ({
      name: String(item.name || ''),
      href: item.href ? String(item.href) : undefined,
    }),
  },
  {
    kind: 'relic', label: '遗器', listHref: '/relic', page: relicPage, loadTagged: () => loadLocalRelicSets(),
    leadMeta: (item) => ({
      name: String(item.name || ''),
      href: item.href ? String(item.href) : undefined,
    }),
  },
];

/** 加载期骨架的标签来源：与分区标签同源（骨架不显示条数，条数要等数据） */
const RELEASE_LABELS: readonly string[] = RELEASE_SOURCES.map((s) => s.label);

const CW_RELEASE_SOURCES: Array<{
  kind: ReleaseKind;
  label: string;
  listHref: string;
  loadPage: () => Promise<CatalogPageConfig>;
}> = [
  {
    kind: 'role',
    label: '角色图鉴',
    listHref: '/currency/role',
    loadPage: () => import('../catalog/pages/currency-role').then((m) => m.currencyRolePage),
  },
  {
    kind: 'trait',
    label: '羁绊图鉴',
    listHref: '/currency/trait',
    loadPage: () => import('../catalog/pages/currency-trait').then((m) => m.currencyTraitPage),
  },
];

const CW_RELEASE_LABELS: readonly string[] = CW_RELEASE_SOURCES.map((s) => s.label);

export interface ReleaseShowcase {
  sections: Ref<ReleaseSection[]>;
  loaded: Ref<boolean>;
  /** 失败的源个数（0 = 全部成功）。等于源总数时视图必须渲染错误态，不得回落空态 */
  failedCount: Ref<number>;
  /** 加载期骨架用的分区标签：与分区标签同源，不另写一份文案 */
  labels: readonly string[];
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
    /* 三个源彼此独立 ⇒ 并发取（原先的 for + await 是 3 段串行往返，弱网下首屏空窗 = 3×RTT；
       版本判定只依赖 version.json，与条目索引无关，故并发不影响判据）。 */
    const sourced = await Promise.all(
      RELEASE_SOURCES.map(async (spec): Promise<ReleaseSource | null> => {
        try {
          const [tagged, items] = await Promise.all([
            spec.loadTagged(),
            spec.page.fetchData ? spec.page.fetchData(ctx) : Promise.resolve<CatalogItem[]>([]),
          ]);
          return {
            kind: spec.kind, label: spec.label, listHref: spec.listHref, tagged, items,
            renderCard: spec.page.renderCard, leadMeta: spec.leadMeta,
          };
        } catch {
          return null;
        }
      }),
    );
    const { ok, failed } = splitSources(sourced);
    failedCount.value = failed;
    sections.value = buildReleaseSections(ok, label);
    loaded.value = true;
  }

  return { sections, loaded, failedCount, labels: RELEASE_LABELS, load };
}

export function useCwReleaseShowcase(): ReleaseShowcase {
  const app = useAppStore();
  const sections = shallowRef<ReleaseSection[]>([]);
  const loaded = ref(false);
  const failedCount = ref(0);

  async function load(): Promise<void> {
    loaded.value = false;
    failedCount.value = 0;
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
            listHref: spec.listHref,
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
    const { ok, failed } = splitSources(sourced);
    failedCount.value = failed;
    sections.value = buildReleaseSectionsBy(ok, pickSeasonNew);
    loaded.value = true;
  }

  return { sections, loaded, failedCount, labels: CW_RELEASE_LABELS, load };
}
