/**
 * 通用目录引擎类型定义（迁移自 catalog.js 的 CATALOG_PAGES 注册表）
 */

export interface CatalogFilterOption {
  val: string;
  /** 支持内嵌 SVG 标记（渲染走 v-html，仅引擎内部静态字符串） */
  label: string;
  icon?: string;
}

export interface CatalogFilter {
  key: string;
  label: string;
  options: CatalogFilterOption[];
}

/** 目录条目：name 必填（搜索用），href 可选（卡片链接），其余按页面类型扩展 */
export interface CatalogItem {
  name: string;
  href?: string;
  [k: string]: unknown;
}

export interface CatalogContext {
  /** 当前数据版本（cdn 数据源使用） */
  version: string;
}

export interface CatalogPageConfig {
  id: string;
  title: string;
  /** dom = 抓取宿主 content-card（隐藏但持续渲染）；cdn = 直接拉取 JSON */
  dataSource: 'dom' | 'cdn';
  /** dom 模式：宿主卡片选择器（默认 [data-ui="content-card"]） */
  cardSelector?: string;
  /** dom 模式：校验宿主卡片是否属于本页 */
  cardValidator?: (card: Element) => boolean;
  /** dom 模式：宿主卡片 → 条目 */
  scrapeCard?: (card: Element) => CatalogItem | null;
  /** cdn 模式：拉取全量数据 */
  fetchData?: (ctx: CatalogContext) => Promise<CatalogItem[]>;
  searchPlaceholder: string;
  gridClass?: string;
  /** 卡片倾斜效果选择器（非虚拟模式） */
  cardClass?: string;
  /** 虚拟网格最小列宽 */
  virtualMinColW?: number;
  /** 虚拟网格图片宽高比 */
  virtualImgRatio?: number;
  /** 静态筛选组 */
  filters?: CatalogFilter[];
  /** 依据数据动态构建筛选组（优先于 filters） */
  buildFilters?: (data: CatalogItem[]) => CatalogFilter[];
  /** 卡片 HTML（v-html 渲染，--i 为入场序号） */
  renderCard: (item: CatalogItem, index: number) => string;
}
