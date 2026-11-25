import { OFFICIAL_ICON_BASE } from '../../lib/constants';
import { LOCAL_ICONS_BASE } from './base';

export const UIART_LOCAL_FILES: ReadonlySet<string> = new Set([
  'bufficon/inlevel/avatar/Icon1314Rank04.png',
  'bufficon/inlevel/IconBuffAttackUpInsert.png',
  'bufficon/inlevel/IconBuffHPBoost.png',
  'bufficon/inlevel/IconBuffSPRatioUp.png',
  'gridfight/attributeicon/normalicon/IconAccele.png',
  'gridfight/attributeicon/normalicon/IconBackRow.png',
  'gridfight/attributeicon/normalicon/IconCM.png',
  'gridfight/attributeicon/normalicon/IconCombo.png',
  'gridfight/attributeicon/normalicon/IconFrontRow.png',
  'gridfight/attributeicon/normalicon/IconIncreasedDamage.png',
  'gridfight/attributeicon/normalicon/IconInitialPower.png',
  'gridfight/attributeicon/normalicon/IconLuckyHit.png',
  'gridfight/attributeicon/normalicon/IconLuckyProbability.png',
  'gridfight/attributeicon/normalicon/IconReduceInjuries.png',
  'gridfight/attributeicon/normalicon/IconShieldStrength.png',
  'gridfight/attributeicon/normalicon/IconTreatmentIntensity.png',
  'gridfight/attributeicon/normalicon/IconWeakenToughness.png',
  'gridfight/attributeicon/texticon/IconQuantum.png',
  'ui/challengeboss/ChallengeBossQuestTabImg1.png',
  'ui/challengeboss/ChallengeBossQuestTabImg2.png',
  'ui/challengeboss/ChallengeBossQuestTabImg3.png',
  'ui/challengeboss/ChallengeBossQuestTabImg4.png',
  'ui/quest/chimera/ChimeraTextIconAtk.png',
  'ui/quest/chimera/ChimeraTextIconHP.png',
  'dailymission/banner/ChallengeBossBanner_3020.png',
]);

export function uiartUri(rel: string): string {
  if (UIART_LOCAL_FILES.has(rel)) return `${LOCAL_ICONS_BASE}/uiart/${rel}`;
  return `${OFFICIAL_ICON_BASE}/${rel}`;
}
