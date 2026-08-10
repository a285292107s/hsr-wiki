/**
 * 通用目录引擎类型定义（对应原 catalog.js 的 CATALOG_PAGES 注册表）
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
  /** 头像/图标 URL */
  avatar?: string;
  rarity?: number | string;
  /** 货币战争角色扩展字段 */
  front_back_type?: string;
  heal_or_shield_display?: string | null;
  charge_type?: string[];
  is_expert?: boolean;
  [k: string]: unknown;
}

export interface CatalogContext {
  /** 当前数据版本（cdn 数据源使用） */
  version: string;
}

/** 目录页子导航 Tab（终局内容 4 页共享；渲染于吸顶工具条下方、内容区之前） */
export interface CatalogTab {
  label: string;
  en: string;
  path: string;
}

export interface CatalogPageConfig {
  id: string;
  title: string;
  /** 子导航 Tab（吸顶工具条下方）；仅需子导航的目录页提供 */
  tabs?: CatalogTab[];
  /** 数据获取：角色走本地转换数据；其余目录走 CDN */
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
  /** 虚拟网格信息区高度（虚拟行高 = colW * imgRatio + infoH + 12 + gap；缺省 36） */
  virtualInfoH?: number;
  /** 静态筛选组 */
  filters?: CatalogFilter[];
  /** 依据数据动态构建筛选组（优先于 filters） */
  buildFilters?: (data: CatalogItem[]) => CatalogFilter[];
  /**
   * 目录专属样式 loader（静态 import 闭包，随路由并行加载，样式先于渲染到达）。
   * CSS 依赖的单一事实源：路由层统一消费，无需为每个带样式目录手写路由工厂。
   * 缺省无（character/lightcone/relic/item/monster 等目录仅依赖全局 catalog.css）。
   */
  styles?: Array<() => Promise<unknown>>;
  /** 卡片 HTML（v-html 渲染，--i 为入场序号） */
  renderCard: (item: CatalogItem, index: number) => string;
}
