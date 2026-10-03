/** 跨域共享类型：名称缓存（键空间横跨角色 / 光锥 / 遗器，无单一归属域） */

/** id → 名称（光锥/遗器套装/角色，来自各自 JSON 的 name 字段） */
export type NameCache = Record<string, string>;
