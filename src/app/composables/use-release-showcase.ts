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
  /** 该分区全部条目的模板串（来自各目录页 renderCard），在带内横向排列 */
  html: string;
  /**
   * 特写档（**恰 1 条**）：这一行只有主条目，故额外给「名字 + 档案正文 + 详情入口」的规格块，
   * 由它在主卡旁承担排版权重、数据正文与显式动作。
   * 2 条及以上一律平权卡带——每条的名字就在卡上、卡本身就是入口（判据见 FEATURE_MAX）。
   */
  leadMeta?: ReleaseLeadMeta;
  /** 特写主条目的 id（feature = 恰 1 条 ⇒ 恰一个）：数据正文加载器按它取条目 */
  leadId?: string;
  feature: boolean;
  /** 分区级入口（该族图鉴页）：任何条数下都恰好一个显式动作，不偏袒任何条目 */
  listHref: string;
}

export interface ReleaseLeadMeta {
  name: string;
  href?: string;
  /** 特写行的数据正文（fmtDesc 产出的 HTML）：只允许「卡上没有的」内容——
      角色一句话简介 / 光锥技能效果 / 遗器四件套效果。与分区同批就绪（骨架期完成取数，无 CLS）。 */
  brief?: string;
}

/* 特写规格（count ≤ 2）的**文字块**：只放条目自身可推出、且卡上没有的事实。
   实测卡内文字（`nk-idx-card` 真珠/★★★★★/冰/欢愉、`nk-lc-card` 献给明日的色彩/挥墨、
   `nk-relic-card` 4件套/贪噬禁果的异端）——元素、命途、技能名、套装标签**都已在卡上**，
   故本块只留「名字 + 数据正文 + 详情链接」：名字是特写的排版权重，正文是该条目在列表数据
   之外的定义性事实（技能效果 / 套装效果 / 一句话简介），链接是卡之外唯一的显式动作。 */
export interface ReleaseSource {
  kind: ReleaseKind;
  label: string;
  /** 分区级入口目标：该族图鉴页（任何条数下唯一且不偏袒条目的显式动作） */
  listHref: string;
  tagged: readonly ReleaseTagged[];
  items: readonly CatalogItem[];
  renderCard: (item: CatalogItem, index: number) => string;
  leadMeta?: (item: CatalogItem) => ReleaseLeadMeta;
  /** 特写档的数据正文加载器：返回 fmtDesc 后的 HTML；空串 / 抛错 = 该条没有正文（规格块保底名字+入口） */
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
      leadMeta: feature && source.leadMeta ? source.leadMeta(picked[0]!) : undefined,
      leadId: feature ? String(picked[0]!.id) : undefined,
      feature,
      listHref: source.listHref,
    });
  }
  return sections;
}

/** 特写档数据正文：**与分区同批就绪**（loaded 翻转前 await）——正文若后到，规格块会在
    页面已渲染后长高，把下方分区整体推下去（CLS）。单条正文失败只丢正文（规格块保底
    名字 + 入口），不影响分区渲染。 */
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
    } catch { /* 正文失败静默：保底形态 */ }
  }));
}

export function buildReleaseSections(
  sources: readonly ReleaseSource[],
  label: string,
): ReleaseSection[] {
  return buildReleaseSectionsBy(sources, (list) => pickCurrentVersion(list, label));
}

/** 特写行的数据正文（fmtDesc 产出 HTML）：只取「卡上没有」的定义性事实。
    空串 / 抛错 = 该条没有正文，规格块保底为名字 + 入口。 */
async function characterBrief(item: CatalogItem): Promise<string> {
  const d = await loadLocalCharacter(String(item.id));
  return fmtDesc(characterBlurb(d.chara_info?.stories));
}

/* 光锥技能参数取最低档（叠影 1）：与详情页 rank 默认值同口径（stores/lightcone rank ref(1)） */
async function lightconeBrief(item: CatalogItem): Promise<string> {
  const d = await loadLocalLightConeDetail(String(item.id));
  const levels = Object.keys(d.skill.level).sort((a, b) => Number(a) - Number(b));
  const lv = levels.length ? d.skill.level[levels[0]!] : undefined;
  return fmtDesc(d.skill.desc, lv ? lv.param_list : []);
}

/* 遗器取 4 件套效果（套装的定义性事实；2 件套多为单条数值），来源是已加载的列表数据（无额外请求） */
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
    }),
  },
  {
    kind: 'lightcone', label: translate('nav.lightcone'), listHref: '/lightcone', page: lightconePage, loadTagged: () => loadLocalLightCones(),
    loadBrief: lightconeBrief,
    leadMeta: (item) => ({
      name: String(item.name || ''),
      href: item.href ? String(item.href) : undefined,
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

/** 加载期骨架的标签来源：与分区标签同源（骨架不显示条数，条数要等数据） */
const RELEASE_LABELS: readonly string[] = RELEASE_SOURCES.map((s) => s.label);
/** 骨架行的形态标记：与 RELEASE_LABELS 同序 */
const RELEASE_SK_KINDS: readonly ReleaseKind[] = RELEASE_SOURCES.map((s) => s.kind);

const CW_RELEASE_SOURCES: Array<{
  kind: ReleaseKind;
  label: string;
  listHref: string;
  loadPage: () => Promise<CatalogPageConfig>;
}> = [
  {
    kind: 'role',
    label: translate('nav.cwRole'),
    listHref: '/currency/role',
    loadPage: () => import('../catalog/pages/currency-role').then((m) => m.currencyRolePage),
  },
  {
    kind: 'trait',
    label: translate('nav.cwTrait'),
    listHref: '/currency/trait',
    loadPage: () => import('../catalog/pages/currency-trait').then((m) => m.currencyTraitPage),
  },
];

const CW_RELEASE_LABELS: readonly string[] = CW_RELEASE_SOURCES.map((s) => s.label);
const CW_RELEASE_SK_KINDS: readonly ReleaseKind[] = CW_RELEASE_SOURCES.map((s) => s.kind);

export interface ReleaseShowcase {
  sections: Ref<ReleaseSection[]>;
  loaded: Ref<boolean>;
  /** 失败的源个数（0 = 全部成功）。等于源总数时视图必须渲染错误态，不得回落空态 */
  failedCount: Ref<number>;
  /** 加载期骨架用的分区标签：与分区标签同源，不另写一份文案 */
  labels: readonly string[];
  /** 骨架行的 data-sk 取值（与 labels 同序）：页面用它给骨架卡按该族真实卡形定几何 */
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
    const built = buildReleaseSectionsBy(ok, pickSeasonNew);
    await fillFeatureBriefs(ok, built);
    sections.value = built;
    loaded.value = true;
  }

  return { sections, loaded, failedCount, labels: CW_RELEASE_LABELS, skKinds: CW_RELEASE_SK_KINDS, load };
}
