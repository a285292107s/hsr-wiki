/**
 * API 层入口（barrel）：全部为纯函数（显式传参，无全局状态），由 Pinia store 编排调用。
 *
 * 按域拆分为子模块：manifest / items / characters / relics / endgame / currency / spine。
 * 调用方统一 `import ... from '../../services/api'`，不直接引用子模块。
 *
 * 数据源（第二期已完成统一）：
 * - 角色（列表/详情/配装名/遗器套装）走本地转换数据（public/data/cn，随站部署）；
 * - 光锥/遗器/物品/敌对/终局目录均走本地数据（converter 输出）；
 * - 图片资源与 Spine 动画仍走 CDN（static.nanoka.cc）。
 */
export { LOCAL_DATA_BASE } from './base';
export { loadManifest, resolveVersion } from './manifest';
export {
  RARITY_NUM_TO_KEY, loadLocalItems, loadLocalItemDb,
  loadLocalMonsterList, loadLocalLightCones, loadLocalLightConeDetail,
} from './items';
export {
  loadLocalCharacterList, loadLocalCharacter, loadSkillAnimations, loadLocalBuildNames,
} from './characters';
export {
  loadLocalRelicSets, loadLocalRelicDetail, loadLocalRelicMainAffixes,
  loadLocalRelicSubAffixes, loadLocalRelicStories, loadLocalRelicSet,
} from './relics';
export {
  loadLocalMazeList, loadLocalStoryList, loadLocalBossList, loadLocalPeakList,
  prefetchEndgameAll,
} from './endgame';
export {
  loadLocalCurrencyRoles, loadLocalCurrencyRole, loadLocalCurrencySeasons,
  loadLocalCurrencyEquipment, loadLocalCurrencyPortals, loadLocalCurrencyAugments,
  loadLocalCurrencyTraits,
} from './currency';
export {
  expandSpineUrl, loadSpineOfficialManifest, loadSpineNanokaManifest, loadSpineManifests,
  resolveSpine, resolveSpineSource, loadSpineSceneKeys, spineBaseUrl,
} from './spine';
