/**
 * Spine 引擎层常量（随引擎自包含：运行时版本 + 多 CDN 兜底列表）
 *
 * - SPINE_RUNTIME_VERSION / SPINE_RUNTIME_41_VERSION 为双运行时版本单一来源，
 *   升级需回归验证：4.2.x 向后兼容 4.1 JSON 数据、二进制格式不兼容 4.1 .skel
 * - 版本分派逻辑见 ./runtime.ts（双运行时访问器代理隔离 window.spine）；
 *   验收报告等业务展示运行时版本时直接引用 SPINE_RUNTIME_VERSION
 */

/** spine-player 主运行时版本（服务官方源 official JSON / official-scene 场景；nanoka skel 走 41 系列） */
export const SPINE_RUNTIME_VERSION = '4.2.43';

/** spine-player 备用运行时版本（4.1.x：仅 nanoka skel 源使用）。
 *  4.1→4.2 二进制格式为位域级重构（IK/Transform/Path 约束 flags 化），必须按源分派版本加载 */
export const SPINE_RUNTIME_41_VERSION = '4.1.23';

/** spine-player 主运行时（多 CDN 兜底，jsdelivr 优先以兼顾国内可达性） */
export const SPINE_RUNTIME_CDNS = [
  `https://cdn.jsdelivr.net/npm/@esotericsoftware/spine-player@${SPINE_RUNTIME_VERSION}/dist/iife/spine-player.js`,
  `https://fastly.jsdelivr.net/npm/@esotericsoftware/spine-player@${SPINE_RUNTIME_VERSION}/dist/iife/spine-player.js`,
  `https://unpkg.com/@esotericsoftware/spine-player@${SPINE_RUNTIME_VERSION}/dist/iife/spine-player.js`,
];

/** spine-player 备用运行时 4.1（多 CDN 兜底同款；懒加载，仅 skel 条目首次渲染时注入） */
export const SPINE_RUNTIME_41_CDNS = [
  `https://cdn.jsdelivr.net/npm/@esotericsoftware/spine-player@${SPINE_RUNTIME_41_VERSION}/dist/iife/spine-player.js`,
  `https://fastly.jsdelivr.net/npm/@esotericsoftware/spine-player@${SPINE_RUNTIME_41_VERSION}/dist/iife/spine-player.js`,
  `https://unpkg.com/@esotericsoftware/spine-player@${SPINE_RUNTIME_41_VERSION}/dist/iife/spine-player.js`,
];
