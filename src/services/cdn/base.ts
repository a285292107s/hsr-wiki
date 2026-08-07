/**
 * CDN 资源源与分类注册表（单一事实来源）。
 *
 * 外部图片资源统一经此解析：官方源优先（存在时），nanoka 兜底（复刻 Spine 双源语义）。
 * 经实测（bbs 黑盒 wiki / 官网）确认：游戏数据图标（avatarshopicon / skillicons 等）
 * 均无官方可热链 CDN，故当前各分类仅注册 nanoka 子路径；官方源留插槽（spec.official），
 * 待确认后填入即可，消费方无需改动。
 */
/** 资源源：official=官方 CDN（优先），nanoka=nanoka CDN（官方缺失/失效时回退） */
export type CdnSource = 'official' | 'nanoka';

/** CDN 分类：命名对应 nanoka 下 /assets/hsr/{nanoka 子路径} 的目录结构 */
export type CdnCategory =
  | 'avatarshopicon'
  | 'skillicons'
  | 'avatardrawcard'
  | 'itemfigures'
  | 'element'
  | 'pathicon'
  | 'lightconemediumicon'
  | 'monstermiddleicon'
  | 'monsterfigure'
  | 'relicfigures'
  | 'rank'
  | 'trace'
  | 'avatarroundicon'
  | 'gridfight-equipment'
  | 'gridfight-icon'
  | 'achievement'
  | 'bufficon';

export interface CdnCategorySpec {
  /** nanoka 子路径（相对 /assets/hsr/） */
  nanoka: string;
  /** 官方源子路径（相对 OFFICIAL_BASE；缺省 = 该分类仅 nanoka，无回退目标） */
  official?: string;
}

/** nanoka 资源挂载点（/assets/hsr/...） */
export const NANOKA_HUD = '/assets/hsr';

/**
 * 官方源基址（预留）。当前无确认可用的官方图片 CDN，置空即全部走 nanoka；
 * 仅当 某分类 spec.official 且 OEFICIAL_BASE 非空时才启用官方优先。
 */
export const OFFICIAL_BASE = '';

export const CDN_CATEGORIES: Record<CdnCategory, CdnCategorySpec> = {
  avatarshopicon: { nanoka: 'avatarshopicon' },
  skillicons: { nanoka: 'skillicons' },
  avatardrawcard: { nanoka: 'avatardrawcard' },
  itemfigures: { nanoka: 'itemfigures' },
  element: { nanoka: 'element' },
  pathicon: { nanoka: 'pathicon' },
  lightconemediumicon: { nanoka: 'lightconemediumicon' },
  monstermiddleicon: { nanoka: 'monstermiddleicon' },
  monsterfigure: { nanoka: 'monsterfigure' },
  relicfigures: { nanoka: 'relicfigures' },
  rank: { nanoka: 'rank/_dependencies/textures' },
  trace: { nanoka: 'trace' },
  avatarroundicon: { nanoka: 'avatarroundicon' },
  'gridfight-equipment': { nanoka: 'gridfight/equipment' },
  'gridfight-icon': { nanoka: 'gridfight/icon' },
  achievement: { nanoka: 'achievement' },
  bufficon: { nanoka: 'bufficon' },
};