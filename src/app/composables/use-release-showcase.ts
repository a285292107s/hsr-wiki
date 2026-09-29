/**
 * 枢纽页「新增」分区编排（两页共用；ADR 0019 决策 2/3/9/10 + ADR 0020 决策 1/2/4/6）。
 *
 * 两页判据口径**禁止混用**：
 * - 首页 `/` = 版本增量：条目 `release_version` **恰等于**本版本 = version.json 的 `version_label`（见 pickCurrentVersion）；
 * - 货币战争 `/currency` = 赛季代际差集：converter 写在条目上的布尔 `is_season_new`（见 pickSeasonNew，ADR 0020 决策 4）。
 * 复用纪律（决策 9）：取数与映射走各目录配置的 `fetchData()`、卡片 HTML 走其 `renderCard()`；
 * **禁止**另写卡片模板或复制卡片 CSS，**禁止** import `catalog/pages.ts` 注册表（那是路由层清单）。
 * 无增量的分区不产出（决策 9 / ADR 0020 决策 6）；全部分区皆无增量时由视图渲染唯一一行空态（决策 10）。
 * 单个数据源失败只跳过该分区，其余分区照常渲染——枢纽页不因一个来源失败而空白。
 * 取数为何分两步（首页）或一步（CW）见 buildReleaseSections 与 useCwReleaseShowcase。
 */
import { ref, shallowRef, type Ref } from 'vue';
import { useAppStore } from '../stores/app';
import { characterPage } from '../catalog/pages/character';
import { lightconePage } from '../catalog/pages/lightcone';
import { relicPage } from '../catalog/pages/relic';
import { loadLocalCharacterList, loadLocalLightCones, loadLocalRelicSets } from '../../services/api';
import type { CatalogContext, CatalogItem, CatalogPageConfig } from '../catalog/types';

/** 分区标识；同时是 DOM 契约 `[data-kind]` 的取值，**禁止改名**
 *  （首页 = character / lightcone / relic；CW 本赛季新增 = role / trait） */
export type ReleaseKind = 'character' | 'lightcone' | 'relic' | 'role' | 'trait';

/** 带判据字段的最小条目形态：首页三类原始条目（角色 / 光锥 / 遗器）与 CW 两类条目都满足 */
export interface ReleaseTagged {
  /** 与 `items` 按字符串比对（两页来源的 id 类型不一：number / 数字串），故只要求可字符串化 */
  id: number | string;
  /** 首页判据字段（见 pickCurrentVersion） */
  release_version?: string;
  /** CW 判据字段（见 pickSeasonNew；字段缺失视为 false，ADR 0020 决策 4） */
  is_season_new?: boolean;
}

/** 一个已渲染分区 */
export interface ReleaseSection {
  kind: ReleaseKind;
  /** 分区名（既有板块术语：角色 / 光锥 / 遗器 / 角色图鉴 / 羁绊图鉴） */
  label: string;
  count: number;
  /** 卡片 HTML 串（renderCard 产出，已 escHtml），由容器 v-html 渲染 */
  html: string;
}

/** 待渲染分区的数据包（已取数，供纯函数组装） */
export interface ReleaseSource {
  kind: ReleaseKind;
  label: string;
  /** 原始条目：判据字段的唯一来源 */
  tagged: readonly ReleaseTagged[];
  /** 目录配置 fetchData() 的产物：负责映射（图标 URL / 副标 / 稀有度）与排序 */
  items: readonly CatalogItem[];
  renderCard: (item: CatalogItem, index: number) => string;
}

/**
 * 首页本版本条目判据：`release_version` 恰等于 label，顺序与入参一致，不改写入参。
 * 字段来源（决策 4）：角色 / 光锥 = converter 的「与上一版输出 id 差集」推导；遗器 = 源数据权威 ReleaseVersion。
 * label 为空（converter 未产出 version.json / 无基线）时返回空数组——
 * **禁止**把「未打标（空串）条目」误判为本版本条目。
 */
export function pickCurrentVersion<T extends ReleaseTagged>(
  list: readonly T[],
  label: string,
): T[] {
  const target = label.trim();
  if (!target) return [];
  return list.filter((item) => String(item.release_version ?? '').trim() === target);
}

/**
 * CW 本赛季新增条目判据：`is_season_new === true`，顺序与入参一致，不改写入参。
 * 字段来源（ADR 0020 决策 4）：converter 用 `GridFightRoleBasicInfoOld` / `GridFightTraitLayerOld` 的
 * `ExistSeason` 最大代算「当前代名册 − 上一代名册」后写入；**前端只读该字段，禁止在本层再比较任何版本/赛季号**。
 * `*Old` 代际表缺失或代数 < 2 时字段为 false / 缺失——两者一律视为非新增，
 * **禁止**退化为「字段缺失 = 全量新增」（那会把整个图鉴当成新增展示）。
 */
export function pickSeasonNew<T extends ReleaseTagged>(list: readonly T[]): T[] {
  return list.filter((item) => item.is_season_new === true);
}

/**
 * 组装分区列表的共用内核：`pick` 决定「哪些条目算增量」（两页判据不同，故外提为参数）。
 * 无增量的分区不产出；全部分区皆无增量 → 返回空数组，由视图渲染唯一一行空态。
 * 两级过滤缺一不可：`pick` 判增量，`items` 再按 id 命中一次——
 * 目录配置自身规则（如名称解析失败条目被丢弃）挡掉的条目不出现在带里，避免渲染空带。
 */
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

/**
 * 首页版本上新分区：判据 = `release_version` 恰等于本版本 label（ADR 0019 决策 3）。
 * 取数分两步：目录配置的 fetchData() 产出 CatalogItem（无 release_version），判据字段只在原始条目上，
 * 故先按 id 筛出本版本条目，再用 fetchData() 的结果做映射与排序（两者均为 services 单例，不产生额外请求）。
 */
export function buildReleaseSections(
  sources: readonly ReleaseSource[],
  label: string,
): ReleaseSection[] {
  return buildReleaseSectionsBy(sources, (list) => pickCurrentVersion(list, label));
}

/** 首页三分区的取数 / 映射 / 卡片来源（顺序即页面渲染顺序） */
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

/**
 * CW 本赛季新增两分区的取数 / 映射 / 卡片来源（顺序即页面渲染顺序）。
 * 目录配置用**动态** import：本模块被首页共享，静态引入会把 CW 两个目录配置并进首页的 chunk
 * （首页不消费 CW 配置），故按需取回。
 * 判据字段由这两个配置的 fetchData() 透传到 CatalogItem（is_season_new），故 tagged 直接取 fetchData() 产物。
 */
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
  /** 首次取数结束（成功或降级）后才为 true：此前不渲染空态，避免加载期闪一次「暂无新增」 */
  loaded: Ref<boolean>;
  load(): Promise<void>;
}

/**
 * 首页版本上新编排：等 `versionLabel` 就绪 → 并行取三份数据 → 组装分区。
 * 单个数据源失败只跳过该分区（首页不因一个来源失败而整页空白），**不抛错**。
 */
export function useReleaseShowcase(): ReleaseShowcase {
  const app = useAppStore();
  const sections = shallowRef<ReleaseSection[]>([]);
  const loaded = ref(false);

  async function load(): Promise<void> {
    // 判据版本必须先于过滤就绪（initVersion 幂等，与品牌带/页脚同一次 version.json 加载）
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
        // 该来源不可用（文件缺失 / 请求失败）：跳过本分区，其余分区照常
      }
    }
    sections.value = buildReleaseSections(sources, label);
    loaded.value = true;
  }

  return { sections, loaded, load };
}

/**
 * CW 本赛季新增编排（ADR 0020 决策 1/2/4/6）：取两分区数据 → 按 `is_season_new` 过滤 → 组装分区。
 * 每分区先从自己的目录配置取回 `styles`（卡片 CSS 依赖的单一事实源）并等其加载完成，再取数：
 * 样式先于渲染到达，且 CSS 依赖清单不在本模块重写一份（漏 currency-role.css 时角色卡会整块无样式）。
 * 单个来源失败只跳过该分区，**不抛错**。
 */
export function useCwReleaseShowcase(): ReleaseShowcase {
  const app = useAppStore();
  const sections = shallowRef<ReleaseSection[]>([]);
  const loaded = ref(false);

  async function load(): Promise<void> {
    // CW 数据是本地转换 JSON（fetchData 不用 ctx.version），仍先 initVersion 以保证标题口径与站点同一份 version.json
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
            // 判据字段取 fetchData() 的透传值（字符串化后与本层 items 的 id 比对口径一致）
            tagged: items.map((item) => ({
              id: String(item.id),
              is_season_new: item.is_season_new === true,
            })),
            items,
            renderCard: page.renderCard,
          };
        } catch {
          // 该来源不可用（配置 chunk 加载失败 / 文件缺失 / 请求失败）：跳过本分区，其余分区照常
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
