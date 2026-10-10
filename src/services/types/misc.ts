/** 跨域共享类型：名称缓存（键空间横跨角色 / 光锥 / 遗器，无单一归属域） */

/** id → 名称（光锥/遗器套装/角色，来自各自 JSON 的 name 字段） */
export type NameCache = Record<string, string>;

/** properties.json 行：属性枚举 → 官方词条名（令牌化，随语言包切语言） */
export interface PropertyRow {
  id: string;
  name: string;
}

/** 通用枚举查表行（elements.json / paths.json：枚举 → 官方名令牌） */
export interface EnumLabelRow {
  id: string;
  name: string;
}
