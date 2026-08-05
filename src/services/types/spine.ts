/** Spine 动画清单相关数据类型（双清单：官网源优先 + nanoka 回退源） */

/** 官网资源抓取来源（诊断/回溯用；wayback 条目需先剥离 web.archive.org 前缀） */
export type SpineFetchSource = 'home' | 'character' | 'wayback';

/** Spine 资源源：official=官网 CDN（优先），nanoka=nanoka CDN（官方缺失/失效时回退） */
export type SpineSource = 'official' | 'nanoka';

/** nanoka 源条目：.skel 二进制（Spine 4.1.23），name 多段以 | 分隔（如 "bg|tibao1"，解析时跳过 bg）；
 *  注意：name 与 nanoka CDN 目录名逐字一致（含大小写/数字风格，勿规范化为统一风格，否则 404） */
export interface SpineSkelEntry {
  kind: 'skel';
  name: string;
}

/** 官网源条目（折叠格式）：Spine 4.2.43 JSON 骨架 + atlas + 纹理映射。
 *  atlas/json/textures 均为 base+dir 下的相对文件名（hash 名），由 api 层展开为完整 URL；
 *  textures 键为 atlas 逻辑纹理名（含 .png 扩展名，必须与 atlas page 行逐字一致） */
export interface SpineOfficialEntry {
  kind: 'official';
  /** 对应游戏版本（如 "3.4"；按抓取时的 publish_key 对照表归档） */
  version?: string;
  /** 抓取来源（官网首页轮播 / 角色页 / Wayback 快照） */
  source?: SpineFetchSource;
  /** publish_key + 资源目录路径段（拼接于 manifest.base 之后） */
  dir: string;
  atlas: string;
  json: string;
  textures: Record<string, string>;
}

/** 官网源多层场景的单层（折叠格式，同 SpineOfficialEntry 的资源段约定） */
export interface SpineSceneLayer {
  dir: string;
  atlas: string;
  json: string;
  textures: Record<string, string>;
}

/** 官网源多层场景条目（如枢纽页背景）：各层共享统一骨架坐标系，
 *  渲染时所有层使用同一固定 viewport 叠加对齐（官网 1920×1080 设计画布同款方案） */
export interface SpineSceneEntry {
  kind: 'official-scene';
  /** 对应游戏版本（如 "4.4"） */
  version?: string;
  /** 抓取来源 */
  source?: SpineFetchSource;
  /** 全部层共用的固定世界视口（spine 世界坐标，y 轴向上） */
  viewport: { x: number; y: number; width: number; height: number };
  /** 按叠加顺序（底 → 顶）排列的骨架层 */
  layers: SpineSceneLayer[];
}

/** 官方源清单（spine-manifest-official.json）：version 必须与 lib/constants.ts 的
 *  SPINE_MANIFEST_VERSION 一致（一致性由测试强制，防止缓存键漏 bump）；
 *  base 为官网 CDN 公共前缀，official 条目的 dir+文件名拼接于其后 */
export interface SpineOfficialManifest {
  version: number;
  base: string;
  /** 条目键 → spine 资源描述（角色 ID 或场景标识；仅 official / official-scene） */
  entries: Record<string, SpineOfficialEntry | SpineSceneEntry>;
}

/** nanoka 源清单（spine-manifest-nanoka.json）：无 base（CDN 基址在 lib/constants.ts），仅 skel 条目 */
export interface SpineNanokaManifest {
  version: number;
  /** 条目键 → nanoka .skel 资源描述（角色 ID） */
  entries: Record<string, SpineSkelEntry>;
}

/** 解析后的 spine 资源描述（渲染层消费；official/scene 的 URL 已由 api 层展开为完整地址） */
export type SpineResolved =
  | { kind: 'skel'; base: string }
  | { kind: 'official'; atlas: string; json: string; textures: Record<string, string> }
  | { kind: 'official-scene'; viewport: SpineSceneEntry['viewport']; layers: SpineResolvedSceneLayer[] };

/** 展开后的场景层（渲染层消费，不含折叠字段 dir） */
export interface SpineResolvedSceneLayer {
  atlas: string;
  json: string;
  textures: Record<string, string>;
}
