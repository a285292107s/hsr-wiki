export interface RelicSetData {
  name?: string;
  icon?: string;
  require_num?: Record<string, { desc?: string; param_list?: number[] }>;
  [k: string]: unknown;
}

export interface LocalRelicEntry {
  id: number;
  name: string;
  icon: string;
  icon_figure: string;
  descriptions: Record<string, string>;
  param_list?: Record<string, number[]>;
  require_num: number[];
  pieces: LocalRelicPiece[];
  release_version: string;
}
export type LocalRelicList = LocalRelicEntry[];

export interface LocalRelicPiece {
  id: number;
  type: string;
  type_name: string;
  rarity: number;
  max_level: number;
  main_affix_group: number;
  sub_affix_group: number;
}

export interface RelicMainAffix {
  group_id: number;
  affix_id: number;
  property: string;
  base_value: number;
  level_add: number;
}
export type RelicMainAffixList = RelicMainAffix[];

export interface RelicSubAffix {
  group_id: number;
  affix_id: number;
  property: string;
  base_value: number;
  step_value: number;
  step_num: number;
}
export type RelicSubAffixList = RelicSubAffix[];

export interface RelicPieceStory {
  name: string;
  desc: string;
  story: string;
}

export type RelicStoriesMap = Record<string, Record<string, RelicPieceStory>>;
