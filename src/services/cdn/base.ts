
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
  | 'gridfight-affix'
  | 'achievement'
  | 'bufficon'
  | 'tutorialpic'
  | 'statusimmune';

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
  /* 保持 jsDelivr 为该分类主源（nanoka 退居回退）。两个使用场景：
     - trace：nanoka 源为占位图（真源是 jsDelivr ui/avatar/icon/）；
     - statusimmune：nanoka 完全没有这批免疫图标（实测四条候选子路径全 404），
       故「本地为主 + jsDelivr 兜底」，jdPrimary 的作用是让**本地缺失时的回退**落到 jsDelivr
       而不是必然 404 的 nanoka。
     **其余分类禁止设置**（fork 停更后 jsDelivr 仅作旧档补全源）。 */
  jdPrimary?: boolean;
}

/** nanoka 资源挂载点（/assets/hsr/...） */
export const NANOKA_HUD = '/assets/hsr';

/* 本地图标资产根（public/data/assets/icons，随站部署，同源加载不经外网）。
   **在结构层之外**：`public/data/cn/` 是缺省语言的**结构层**（全令牌化数据），图标是语言
   中立媒体、消费路径也不经 `LOCAL_DATA_BASE`，故与 `data/cn/`、`data/i18n/` 平级另立
   `data/assets/`——同时解除「静态媒体被语言包分组规则当成一个分组」的错误耦合。 */
export const LOCAL_ICONS_BASE = '/data/assets/icons';

/* 官方源基址（预留）。当前无确认可用的官方图片 CDN，置空即全部走 nanoka；
   仅当某分类声明 spec.official 且本基址非空时才启用官方优先。 */
export const OFFICIAL_BASE = '';

export const CDN_CATEGORIES: Record<CdnCategory, CdnCategorySpec> = {
  avatarshopicon: { nanoka: 'avatarshopicon', local: 'avatarshopicon' },
  skillicons: { nanoka: 'skillicons' },
  /* 立绘卡（桌面 Hero）：本地为主。官方仓库只有 2048×2048 PNG（实测 2.9–4.9 MB），
     同分辨率 webp 约 1/4；`avatarDrawCardWebpUrl` 仍是 nanoka webp 直链（移动端专用），
     `avatarDrawCardJdUrl` 仍是 jsDelivr PNG（第二源）——三者互为不同 URL，回退链不退化。 */
  avatardrawcard: { nanoka: 'avatardrawcard', local: 'avatardrawcard' },
  itemfigures: { nanoka: 'itemfigures' },
  // 本地化三分类：全站公共小图标（KB 级、高频复用、永不更新）；trace 的 nanoka 源为占位图，
  // 真源是 jsDelivr（ui/avatar/icon/Icon{key}.png），故以 jdPrimary 保持 jsDelivr 主源
  element: { nanoka: 'element', local: 'element' },
  pathicon: { nanoka: 'pathicon', local: 'pathicon' },
  trace: { nanoka: 'trace', local: 'trace', jdPrimary: true },
  lightconemediumicon: { nanoka: 'lightconemediumicon', local: 'lightconemediumicon' },
  monstermiddleicon: { nanoka: 'monstermiddleicon', local: 'monstermiddleicon' },
  monsterfigure: { nanoka: 'monsterfigure', local: 'monsterfigure' },
  // 仅通用部位图标本地化（官方仓库无对应文件、nanoka 唯一源）；套装件图走 jsDelivr
  relicfigures: { nanoka: 'relicfigures', local: 'relicfigures', localFiles: /^IconRelic(?:Body|Foot|Neck|Goods)\.webp$/ },
  rank: { nanoka: 'rank/_dependencies/textures' },
  /* 真珠 1503 圆头像 override：上游解包资产（nanoka 与官方镜像两源）该文件内容为游戏内
     「TEST No.999」占位贴图且返回 HTTP 200——绕过 dom.ts 的 error/挂起回退链，故以本地
     128px 圆像顶替（来源 = 官方 avatarshopicon/1503.webp 裁切，非手绘）。
     localFiles 白名单把本地化限定为该单文件：其余角色仍走远端主源，新角色不受影响。
     移除时机：nanoka avatarroundicon/1503.webp 内容变为真珠本人后，删除本行 local/localFiles
     与 public/data/assets/icons/avatarroundicon/1503.webp——**禁止本地覆盖长期压过上游更新**。 */
  avatarroundicon: { nanoka: 'avatarroundicon', local: 'avatarroundicon', localFiles: /^1503\.webp$/ },
  'gridfight-equipment': { nanoka: 'gridfight/equipment' },
  'gridfight-icon': { nanoka: 'gridfight/icon' },
  /* 货币战争位面词条图标（SpriteOutput/GridFight/BattleIcon/BuffIcon/*，`voracity.json` 的
     `affixes[].icon`）：nanoka 无该目录，fork 冻结前也无 Affix 图标 ⇒ 本地入库为主。
     调用方 `gridFightAffixIconUrl` 传 basename 小写（目录段与文件名均小写）。 */
  'gridfight-affix': { nanoka: 'gridfight/battleicon/bufficon', local: 'gridfight-affix' },
  achievement: { nanoka: 'achievement' },
  /* 位面增益图标：nanoka **没有该分类**（实测扁平与各子路径全 404），真源是 jsDelivr
     （`BuffIcon/{子目录}/X` → `bufficon/{子目录小写}/X.png`，见
     docs/audit/终局内容图标数据源审计.md §3.6）。本次仅入库 4.5 新增、fork 冻结前不存在的
     4 个图标，故以 localFiles 限定范围——其余图标仍走远端，避免给全站无谓增加本地 404。 */
  bufficon: {
    nanoka: 'bufficon',
    local: 'bufficon',
    localFiles: /^BuffIcon\/Inlevel\/(?:IconActivity_StageInvasion_Support|IconBuffShield|IconDeBuffDamageTakenRatioElement|IconMonster_W5_StageInvasion)\.webp$/,
  },
  /* 教程图文（/voracity 06 区块）：调用方传 `TutorialPic/X.webp`（含源表子目录段）。
     该分类全量 1504 张 / 960 MB 不适合入库，仅 4.5 新增的 3 张（nanoka 与 jsDelivr 双侧皆无）
     以 localFiles 入库。 */
  tutorialpic: {
    nanoka: 'tutorialpic',
    local: 'tutorialpic',
    localFiles: /^TutorialPic\/TutorialPage_1050(?:101|201|202)\.webp$/,
  },
  /* 免疫图标（`MonsterStatusResistanceType` 的 `Type → SpriteOutput/UI/Avatar/Icon/IconImmune*.png`，
     128×128 纯白字形 + 透明底，随站入库 11 个 webp）：本地为主（构建期一次性入库、永不更新），
     nanoka 无该批文件故其子路径仅作占位（与 trace 同源目录），缺失时回退 jsDelivr 官方镜像。 */
  statusimmune: { nanoka: 'trace', local: 'statusimmune', jdPrimary: true },
};
