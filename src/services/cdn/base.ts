/**
 * CDN 资源源与分类注册表（单一事实来源）。
 *
 * 外部图片资源统一经此解析：本地图标优先（spec.local 声明的分类），官方源次之（存在时），
 * nanoka 兜底（复刻 Spine 双源语义）。
 * 经实测（bbs 黑盒 wiki / 官网）确认：游戏数据图标（avatarshopicon / skillicons 等）
 * 均无官方可热链 CDN，故当前各分类仅注册 nanoka 子路径；官方源留插槽（spec.official），
 * 待确认后填入即可，消费方无需改动。
 */
/** 资源源：local=随站本地图标（首选），official=官方 CDN（优先），nanoka=nanoka CDN（官方缺失/失效时回退） */
export type CdnSource = 'official' | 'nanoka' | 'local';

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
  /** 本地图标目录名（相对 LOCAL_ICONS_BASE；声明即该分类 local-first）。
   *  文件为构建期一次性入库（converter 不产出）；新版本新增图标未入库时按远端最优源回退，
   *  禁止在本地目录缺文件时改为维护多套路径规则——回退链已覆盖该场景 */
  local?: string;
  /** 本地化文件名白名单（与 local 同用；缺省 = 该分类全量文件本地化）。
   *  relicfigures 分类整体为套装件图（量大走 jsDelivr），仅 4 个通用部位图标入库 */
  localFiles?: RegExp;
}

/** nanoka 资源挂载点（/assets/hsr/...） */
export const NANOKA_HUD = '/assets/hsr';

/** 本地图标资产根（public/data/cn/assets/icons，随站部署，同源加载不经外网） */
export const LOCAL_ICONS_BASE = '/data/cn/assets/icons';

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
  // 本地化三分类：全站公共小图标（KB 级、高频复用、永不更新）；trace 的 nanoka 源为占位图，
  // 真源是 jsDelivr（ui/avatar/icon/Icon{key}.png），故本地缺失时回退 jsDelivr 而非 nanoka
  element: { nanoka: 'element', local: 'element' },
  pathicon: { nanoka: 'pathicon', local: 'pathicon' },
  trace: { nanoka: 'trace', local: 'trace' },
  lightconemediumicon: { nanoka: 'lightconemediumicon' },
  monstermiddleicon: { nanoka: 'monstermiddleicon' },
  monsterfigure: { nanoka: 'monsterfigure' },
  // 仅通用部位图标本地化（官方仓库无对应文件、nanoka 唯一源）；套装件图走 jsDelivr
  relicfigures: { nanoka: 'relicfigures', local: 'relicfigures', localFiles: /^IconRelic(?:Body|Foot|Neck|Goods)\.webp$/ },
  rank: { nanoka: 'rank/_dependencies/textures' },
  avatarroundicon: { nanoka: 'avatarroundicon' },
  'gridfight-equipment': { nanoka: 'gridfight/equipment' },
  'gridfight-icon': { nanoka: 'gridfight/icon' },
  achievement: { nanoka: 'achievement' },
  bufficon: { nanoka: 'bufficon' },
};