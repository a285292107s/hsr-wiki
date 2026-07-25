/**
 * 路由门（document-start 纯 vanilla 判定）
 *
 * 在 main.ts 创建平台（initFailsafe 隐藏宿主）之前同步调用：
 * 仅当当前 URL 属于第一期接管范围时才激活脚本，否则保持静默、
 * 宿主原站正常渲染（如光锥/遗器详情等未迁移页面）。
 *
 * ⚠️ 本模块不得 import 任何 Vue 生态模块——它在 Vue 加载前执行。
 */

/**
 * 第一期接管路径（base 可为 /hsr 或 /，尾斜杠可选）：
 *   首页 / 角色目录 / 角色详情 / 6 个通用目录（含终局 4 路由） / 成就占位页
 * 反例：/hsr/lightcone/23063（光锥详情）→ 不匹配 → 交还宿主
 */
const HANDLED_RE =
  /^\/(hsr\/?)?(character\/?(\d+\/?)?|lightcone\/?|relic\/?|item\/?|monster\/?|maze\/?|story\/?|boss\/?|peak\/?|currency\/?|achievement\/?)?$/;

export function shouldTakeOver(pathname: string): boolean {
  return HANDLED_RE.test(pathname);
}
