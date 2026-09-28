/**
 * 首页「版本上新」三分区编排（ADR 0019 决策 2/3/9/10）。
 *
 * 判据（决策 3）：条目 `release_version` **恰等于**本版本 = version.json 的 `version_label`。
 * 复用纪律（决策 9）：取数与映射走各目录配置的 `fetchData()`、卡片 HTML 走其 `renderCard()`；
 * **禁止**另写卡片模板或复制卡片 CSS，**禁止** import `catalog/pages.ts` 注册表（那是路由层清单）。
 * 无增量的分区不产出（决策 9）；三分区皆无增量时由视图渲染唯一一行空态（决策 10）。
 * 单个数据源失败只跳过该分区，其余分区照常渲染——首页不因一个来源失败而空白。
 * 取数为何分两步见 buildReleaseSections；判据字段的来源见 pickCurrentVersion。
 */
import { ref, shallowRef, type Ref } from 'vue';
import { useAppStore } from '../stores/app';
import { characterPage } from '../catalog/pages/character';
import { lightconePage } from '../catalog/pages/lightcone';
import { relicPage } from '../catalog/pages/relic';
import { loadLocalCharacterList, loadLocalLightCones, loadLocalRelicSets } from '../../services/api';
import type { CatalogContext, CatalogItem, CatalogPageConfig } from '../catalog/types';

/** 三分区标识；同时是 DOM 契约 `[data-kind]` 的取值，**禁止改名** */
export type ReleaseKind = 'character' | 'lightcone' | 'relic';

/** 带版本判据的最小条目形态：三类原始条目（角色 / 光锥 / 遗器）都满足 */
export interface ReleaseTagged {
  id: number;
  release_version?: string;
}

/** 一个已渲染分区 */
export interface ReleaseSection {
  kind: ReleaseKind;
  /** 分区名（既有板块术语：角色 / 光锥 / 遗器） */
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
 * 本版本条目判据：`release_version` 恰等于 label，顺序与入参一致，不改写入参。
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
 * 组装分区列表：无本版本条目的分区不产出（决策 9「无增量的分区不渲染」）；
 * 三分区皆无增量 → 返回空数组，由视图渲染唯一一行空态（决策 10）。
 * 取数分两步：目录配置的 fetchData() 产出 CatalogItem（无 release_version），判据字段只在原始条目上，
 * 故先按 id 筛出本版本条目，再用 fetchData() 的结果做映射与排序（两者均为 services 单例，不产生额外请求）。
 */
export function buildReleaseSections(
  sources: readonly ReleaseSource[],
  label: string,
): ReleaseSection[] {
  const sections: ReleaseSection[] = [];
  for (const source of sources) {
    const ids = new Set(pickCurrentVersion(source.tagged, label).map((item) => String(item.id)));
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

/** 三分区的取数 / 映射 / 卡片来源（顺序即页面渲染顺序） */
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
