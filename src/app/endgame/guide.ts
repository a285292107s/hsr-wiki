import type { EndgameGuideDb, EndgameGuideMode, EndgameSystemChoice } from '../../services/types';
import { translate } from '../i18n';


export function fallbackSystemName(): string {
  return translate('egm.sec.buffs');
}

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

export function seasonBuffSystemName(
  guide: EndgameGuideDb | null | undefined,
  modeKey: string,
): string {
  return guideMode(guide, modeKey)?.system?.name ?? '';
}

export function seasonBuffCount(
  guide: EndgameGuideDb | null | undefined,
  modeKey: string,
): number {
  return guideMode(guide, modeKey)?.system?.count ?? 0;
}

export function seasonBuffChoiceLabel(
  guide: EndgameGuideDb | null | undefined,
  modeKey: string,
): string {
  const system = guideMode(guide, modeKey)?.system;
  if (!system) return '';
  return CHOICE_LABEL[system.choice] ?? '';
}
