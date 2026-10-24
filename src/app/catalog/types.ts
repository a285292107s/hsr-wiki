
export interface CatalogFilterOption {
  val: string;
  label?: string;
  labelKey?: string;
  icon?: string;
  group?: string;
}

export interface CatalogFilter {
  key: string;
  label?: string;
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

export type CatalogSkeletonVariant = 'card' | 'text' | 'row' | 'columns';

export interface CatalogSkeleton {
  variant?: CatalogSkeletonVariant;
  count?: number;
  rows?: number;
}

export interface CatalogPageConfig {
  id: string;
  titleKey: string;
  titleArgs?: Record<string, string>;
  tabs?: CatalogTab[];
  fetchData?: (ctx: CatalogContext) => Promise<CatalogItem[]>;
  prefetch?: (ctx: CatalogContext) => void;
  searchKey: string;
  subtitle?: string;
  gridClass?: string;
  skeleton?: CatalogSkeleton;
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
