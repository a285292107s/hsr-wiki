
/** 资源源：local=随站本地图标（首选），official=jsDelivr 官方镜像（jdPrimary 例外分类主源），nanoka=nanoka CDN（主源） */
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
  /* 本地图标目录名（相对 LOCAL_ICONS_BASE；声明即该分类 local-first）。
     文件为构建期一次性入库（converter 不产出）；新版本新增图标未入库时按远端最优源回退——
     **禁止**在本地目录缺文件时改为维护多套路径规则，回退链已覆盖该场景 */
  local?: string;
  /* 本地化文件名白名单（与 local 同用；缺省 = 该分类全量文件本地化）。
     relicfigures 分类整体为套装件图（量大走 jsDelivr），仅 4 个通用部位图标入库 */
  localFiles?: RegExp;
  /* 保持 jsDelivr 为该分类主源（nanoka 退居回退）。
     唯一使用场景：trace 的 nanoka 源为占位图（真源是 jsDelivr ui/avatar/icon/），
     本地缺失回退必须落到 jsDelivr；**其余分类禁止设置**（fork 停更后 jsDelivr 仅作旧档补全源） */
  jdPrimary?: boolean;
}

/** nanoka 资源挂载点（/assets/hsr/...） */
export const NANOKA_HUD = '/assets/hsr';

/** 本地图标资产根（public/data/cn/assets/icons，随站部署，同源加载不经外网） */
export const LOCAL_ICONS_BASE = '/data/cn/assets/icons';

/* 官方源基址（预留）。当前无确认可用的官方图片 CDN，置空即全部走 nanoka；
   仅当某分类声明 spec.official 且本基址非空时才启用官方优先。 */
export const OFFICIAL_BASE = '';

export const CDN_CATEGORIES: Record<CdnCategory, CdnCategorySpec> = {
  avatarshopicon: { nanoka: 'avatarshopicon' },
  skillicons: { nanoka: 'skillicons' },
  avatardrawcard: { nanoka: 'avatardrawcard' },
  itemfigures: { nanoka: 'itemfigures' },
  // 本地化三分类：全站公共小图标（KB 级、高频复用、永不更新）；trace 的 nanoka 源为占位图，
  // 真源是 jsDelivr（ui/avatar/icon/Icon{key}.png），故以 jdPrimary 保持 jsDelivr 主源
  element: { nanoka: 'element', local: 'element' },
  pathicon: { nanoka: 'pathicon', local: 'pathicon' },
  trace: { nanoka: 'trace', local: 'trace', jdPrimary: true },
  lightconemediumicon: { nanoka: 'lightconemediumicon' },
  monstermiddleicon: { nanoka: 'monstermiddleicon' },
  monsterfigure: { nanoka: 'monsterfigure' },
  // 仅通用部位图标本地化（官方仓库无对应文件、nanoka 唯一源）；套装件图走 jsDelivr
  relicfigures: { nanoka: 'relicfigures', local: 'relicfigures', localFiles: /^IconRelic(?:Body|Foot|Neck|Goods)\.webp$/ },
  rank: { nanoka: 'rank/_dependencies/textures' },
  /* 真珠 1503 圆头像 override：上游解包资产（nanoka 与官方镜像两源）该文件内容为游戏内
     「TEST No.999」占位贴图且返回 HTTP 200——绕过 dom.ts 的 error/挂起回退链，故以本地
     128px 圆像顶替（来源 = 官方 avatarshopicon/1503.webp 裁切，非手绘）。
     localFiles 白名单把本地化限定为该单文件：其余角色仍走远端主源，新角色不受影响。
     移除时机：nanoka avatarroundicon/1503.webp 内容变为真珠本人后，删除本行 local/localFiles
     与 public/data/cn/assets/icons/avatarroundicon/1503.webp——**禁止本地覆盖长期压过上游更新**。 */
  avatarroundicon: { nanoka: 'avatarroundicon', local: 'avatarroundicon', localFiles: /^1503\.webp$/ },
  'gridfight-equipment': { nanoka: 'gridfight/equipment' },
  'gridfight-icon': { nanoka: 'gridfight/icon' },
  achievement: { nanoka: 'achievement' },
  bufficon: { nanoka: 'bufficon' },
};
