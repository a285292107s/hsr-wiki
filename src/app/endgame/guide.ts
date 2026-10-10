import type { EndgameGuideDb, EndgameGuideMode, EndgameSystemChoice } from '../../services/types';
import { translate } from '../i18n';

/**
 * 终局增益体系的展示口径（纯函数，便于单测）。
 *
 * 背景：站点长期把每期增益统称「**赛季增益**」，而它**不是游戏内词**（TextMap 命中 0）——游戏内按玩法
 * 各有一套体系名（记忆紊流 / 荒腔走板 / 终焉公理 / 裁决象限）。体系名由转换器从官方规则正文
 * （`IntroData` 分节标题）派生并落在 `endgame_guide.json` 的 `system.name`，本模块只负责取用与回退：
 * **产物缺省或某玩法未命中分节标题时回退站点工作名**，一处开关即可全站退回旧文案。
 */

/** 站点工作名：仅在体系名不可用时兜底（不得用于给体系命名，见文件头） */
/* 模块加载期不能翻译（会把缺省语言冻死）⇒ 常量改函数，展示时求值 */
export function fallbackSystemName(): string {
  return translate('egm.sec.buffs');
}

/** 选择语义 → 说明文案。枚举（`choice`）由转换器产出，文案只在本表维护。
 *  措辞逐条对齐 `endgame_guide.json` 里该体系分节的**官方原话**（判据，不是我的概括）：
 *  maze「每一关都有其独特的效果且仅在当前关卡内生效」／story「挑战…关卡前，可以为每支队伍选择其中一种」
 *  ／boss「在首领挑战前，可以为每支队伍选择其中一种」（数据是**每个首领投影一套**＝上/下半场各一套，
 *  故必须写明，否则「每场战斗选 1」会被读成整期只有一套）／peak「在挑战王棋前，可以为队伍选择其中一种」。 */
export const CHOICE_LABEL: Record<EndgameSystemChoice, string> = {
  fixed: translate('egd.choice.fixed'),
  per_team: translate('egd.choice.perTeam'),
  per_stage: translate('egd.choice.perStage'),
  per_king: translate('egd.choice.perKing'),
};

export function guideMode(
  guide: EndgameGuideDb | null | undefined,
  modeKey: string,
): EndgameGuideMode | null {
  return guide?.modes?.[modeKey] ?? null;
}

/** 体系名（**取不到时返回空串**，由消费方决定是否回退站点工作名）。
 *  不在这里回退是刻意的：回退串是 truthy，调用方就无法区分「没有体系数据」与「体系名恰好叫赛季增益」——
 *  实测那样会让标题出现「赛季增益赛季增益」的双写（`EndgameBuffs` 的次标判据依赖真值）。 */
export function seasonBuffSystemName(
  guide: EndgameGuideDb | null | undefined,
  modeKey: string,
): string {
  return guideMode(guide, modeKey)?.system?.name ?? '';
}

/** 该玩法的增益条数（无体系数据时为 0） */
export function seasonBuffCount(
  guide: EndgameGuideDb | null | undefined,
  modeKey: string,
): number {
  return guideMode(guide, modeKey)?.system?.count ?? 0;
}

/** 选法说明（无体系数据时为空串，调用方据此决定是否渲染该行） */
export function seasonBuffChoiceLabel(
  guide: EndgameGuideDb | null | undefined,
  modeKey: string,
): string {
  const system = guideMode(guide, modeKey)?.system;
  if (!system) return '';
  return CHOICE_LABEL[system.choice] ?? '';
}

/** 一句话口径：`每期 3 条 · 每场首领挑战前选 1 条（上/下半场各一套）`。
 *  条数与选法都是**常青规格**（不随赛季轮换），故口径行不带「本期」字样——带「本期」会把它说成每期数据。 */
export function seasonBuffSystemLine(
  guide: EndgameGuideDb | null | undefined,
  modeKey: string,
): string {
  const count = seasonBuffCount(guide, modeKey);
  const choice = seasonBuffChoiceLabel(guide, modeKey);
  return [count ? translate('egm.buffCount', { n: count }) : '', choice].filter(Boolean).join(' · ');
}
