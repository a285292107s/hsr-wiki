
export interface CatalogFilterOption {
  val: string;
  /** 展示文案：数据派生（元素名 / 系列名等，已本地化）或**词典键的前置 HTML**（如星级图标） */
  label?: string;
  /** 词典键（界面自造文案：全部 / 仅专家…）；存在时渲染为 `label + t(labelKey)` */
  labelKey?: string;
  icon?: string;
  group?: string;
}

export interface CatalogFilter {
  key: string;
  /** 展示文案：数据派生，或词典键的前置 HTML */
  label?: string;
  /** 词典键（筛选器名：命途 / 稀有度…）；存在时渲染为 `label + t(labelKey)` */
  labelKey?: string;
  options: CatalogFilterOption[];
}

export interface CatalogItem {
  name: string;
  href?: string;
  avatar?: string;
  rarity?: number | string;
  front_back_type?: string;
  heal_or_shield_display?: string | null;
  charge_type?: string[];
  is_expert?: boolean;
  [k: string]: unknown;
}

export interface CatalogContext {
  version: string;
}

export interface CatalogTab {
  label: string;
  en: string;
  path: string;
}

export interface CatalogPageConfig {
  id: string;
  /** 页面标题的词典键；带插值时用 `titleArgs` 指定各参数取自哪个词典键 */
  titleKey: string;
  /** 标题插值参数（值是词典键）：如 `{ mode: 'catalog.currencyWar', name: 'nav.cwAugment' }` */
  titleArgs?: Record<string, string>;
  tabs?: CatalogTab[];
  fetchData?: (ctx: CatalogContext) => Promise<CatalogItem[]>;
  prefetch?: (ctx: CatalogContext) => void;
  /** 搜索框占位的词典键（配置只存键，视图解析） */
  searchKey: string;
  subtitle?: string;
  gridClass?: string;
  cardClass?: string;
  virtualMinColW?: number;
  virtualImgRatio?: number;
  virtualInfoH?: number;
  virtualMobileRowH?: number;
  filters?: CatalogFilter[];
  buildFilters?: (data: CatalogItem[]) => CatalogFilter[];
  renderColumns?: (items: CatalogItem[], renderCard: (item: CatalogItem, i: number) => string) => string;
  styles?: Array<() => Promise<unknown>>;
  renderCard: (item: CatalogItem, index: number) => string;
}
