/* 页面标题的**唯一**拼装点（`document.title`）。
 *
 * 为什么标题里必须有游戏名：此前全站 1432 份快照的 `<title>` 只有品牌名
 * （`黄泉 - 星铁档案馆` / `角色图鉴 - 星铁档案馆`），主关键词「崩坏：星穹铁道」
 * 在任何标题里都不出现——这是最大的 on-page 缺口（品牌名本身不承载搜索需求）。
 * 为什么品牌排最后：标题被搜索引擎截断时丢的是尾部，关键词必须在前。
 *
 * 与快照的同步要求：`tools/gen-ai-endpoints.mjs` 的 `TITLE_TAIL` 用同一格式。
 * 两份实现必须同批改——否则执行 JS 的爬虫（Googlebot 渲染后）读到的 title
 * 与无 JS 爬虫读到的快照 title 不一致，属同一页面的两个事实源。
 *
 * 游戏名取自词典 `meta.gameName`（13 语言，官方名）；缺键时 vue-i18n 回退缺省语言。
 */
import { SITE_NAME } from '../lib/constants';
import { translate } from './i18n';

/** `name` 省略即站点级标题（首页）。 */
export function pageTitle(name?: string): string {
  const game = `${translate('meta.gameName')} Wiki`;
  return name ? `${name} - ${game} | ${SITE_NAME}` : `${game} | ${SITE_NAME}`;
}
