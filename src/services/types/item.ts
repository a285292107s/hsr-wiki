export interface ItemInfo {
  item_name: string;
  item_sub_type: string;
  main_type?: string;
  purpose_type?: number;
  rarity: string;
  item_figure_icon_path?: string;
}

export type ItemDb = Record<string, ItemInfo>;

export interface LocalItemEntry {
  id: number;
  name: string;
  desc: string;
  bg_desc: string;
  main_type: string;
  sub_type: string;
  rarity: number;
  purpose_type: number;
  icon: string;
  figure_icon: string;
}
export type LocalItemList = LocalItemEntry[];
