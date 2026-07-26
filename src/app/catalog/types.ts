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

export interface CatalogSubNavItem {
  label: string;
  en: string;
  href: string;
  active?: boolean;
}

export interface CatalogPageConfig {
  id: string;
  title: string;
  /** 子导航标签（如终局内容的 4 个子分类） */
  subNav?: CatalogSubNavItem[];
  /** 数据获取（所有页面统一走 CDN） */
  fetchData?: (ctx: CatalogContext) => Promise<CatalogItem[]>;
  /** 数据就绪后后台预热兄弟页数据（终局 4 页互取，保证 Tab 切换即时命中 L1） */
  prefetch?: (ctx: CatalogContext) => void;
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
