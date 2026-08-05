/** 遗器相关数据类型（套装列表/详情 + 主副词条 + 来历） */

/* ─── relicset/{id}.json（CDN 兼容结构） ─── */

export interface RelicSetData {
  name?: string;
  /** 图标路径（取末段数字 → itemfigures/{id}.webp） */
  icon?: string;
  /** 套装效果：件数 → { desc, param_list } */
  require_num?: Record<string, { desc?: string; param_list?: number[] }>;
  [k: string]: unknown;
}

/* ─── 本地遗器数据（converter 输出） ─── */

/** 遗器套装列表条目 */
export interface LocalRelicEntry {
  id: number;
  name: string;
  icon: string;
  icon_figure: string;
  descriptions: Record<string, string>;
  param_list?: Record<string, number[]>;
  /** 套装效果所需件数，如 [2,4]（隧洞遗器）或 [2]（位面饰品） */
  require_num: number[];
  pieces: LocalRelicPiece[];
  release_version: string;
}
export type LocalRelicList = LocalRelicEntry[];

/** 遗器部位条目（5 星） */
export interface LocalRelicPiece {
  id: number;
  /** HEAD/HAND/BODY/FOOT/NECK/OBJECT */
  type: string;
  type_name: string;
  rarity: number;
  max_level: number;
  /** 主词条组 ID（关联 relic_main_affixes.json 的 group_id） */
  main_affix_group: number;
  /** 副词条组 ID（关联 relic_sub_affixes.json 的 group_id） */
  sub_affix_group: number;
}

/** 遗器主词条条目（relic_main_affixes.json） */
export interface RelicMainAffix {
  group_id: number;
  affix_id: number;
  /** 属性类型（HPDelta/AttackAddedRatio/...） */
  property: string;
  /** 初始值（Lv.0） */
  base_value: number;
  /** 每级成长 */
  level_add: number;
}
export type RelicMainAffixList = RelicMainAffix[];

/** 遗器副词条条目（relic_sub_affixes.json） */
export interface RelicSubAffix {
  group_id: number;
  affix_id: number;
  property: string;
  /** 初始值 */
  base_value: number;
  /** 每次强化步进值 */
  step_value: number;
  /** 步进次数上限 */
  step_num: number;
}
export type RelicSubAffixList = RelicSubAffix[];

/** 遗器部位来历条目（relic_stories.json，按部位类型索引） */
export interface RelicPieceStory {
  /** 部位名（作为故事标题） */
  name: string;
  /** 短描述（题记） */
  desc: string;
  /** 完整来历（保留 \\n 与 <i> 标签，前端转 <br> 渲染） */
  story: string;
}
/** set_id → { piece_type → RelicPieceStory } */
export type RelicStoriesMap = Record<string, Record<string, RelicPieceStory>>;
