export interface MazeBuffInfo {
  id: number;
  name: string;
  desc?: string;
  param_list?: number[];
  icon?: string;
}

export interface MazeBossTrait {
  id: number;
  name: string;
  desc?: string;
  param_list?: number[];
}

export interface MazeBossPhaseSkill {
  name: string;
  desc?: string;
}

export interface MazeBossPhase {
  id: number;
  name: string;
  desc?: string;
  answer?: string;
  skills?: MazeBossPhaseSkill[];
}

export interface MazeBossGuide {
  traits?: MazeBossTrait[];
  phases?: MazeBossPhase[];
}

export interface MazeHalfGroups<T> {
  stage1?: T;
  stage2?: T;
  tierce?: T;
}

export interface FloorDamageInfo {
  floor: number;
  stage1?: string[];
  stage2?: string[];
}

export interface MazeMonsterInfo {
  id: string;
  name: string;
  icon: string;
  weak?: string[];
  resist?: Record<string, number>;
  rank?: string;
  camp?: string;
  intro?: string;
  skills?: { name: string; tag?: string; phase_list?: number[] }[];
  stance?: number;
  speed?: number;
  tpl?: string;
  wave?: number;
  summons?: MazeSummonInfo[];
  boss_guide?: string;
  debuff_resist?: MazeDebuffResistInfo[];
  hp?: number;
  phase_hp?: number[];
}

export interface MazeDebuffResistInfo {
  key: string;
  value: number;
  icon: string;
}

export interface MazeSummonInfo {
  id: string;
  tpl?: string;
  name: string;
  icon: string;
  polluted?: number;
}

export interface MazeStageInvasion {
  level: number;
  stage_id?: number;
  monsters?: MazeMonsterInfo[];
}

export interface MazeStageDetail {
  damage?: string[];
  monsters?: MazeMonsterInfo[];
  invasion?: MazeStageInvasion;
}

export interface MazeTargetInfo {
  text: string;
  param?: number;
  type?: string;
  prism?: boolean;
}

export interface MazeFloorDetail {
  floor: number;
  name?: string;
  countdown?: number;
  level?: number;
  stage1?: MazeStageDetail;
  stage2?: MazeStageDetail;
  buff?: MazeBuffInfo | null;
  targets?: MazeTargetInfo[];
  reward?: MazeRewardItem[];
  star_rewards?: MazeStarReward[];
}

export interface MazeRewardItem {
  id: number;
  num?: number;
}

export interface MazeStarReward {
  star: number;
  items: MazeRewardItem[];
  label?: string;
}

export interface MazeBadgeInfo {
  level: string;
  name: string;
  desc?: string;
  icon: string;
}

export interface PeakLevelInfo {
  id?: number;
  kind: 'knight' | 'king';
  name?: string;
  damage?: string[];
  level?: number;
  monsters?: MazeMonsterInfo[];
  targets?: MazeTargetInfo[];
  tags?: MazeBuffInfo[];
  buffs?: MazeBuffInfo[];
  invasion?: MazeStageInvasion;
  star_rewards?: MazeStarReward[];
  hard?: {
    name?: string;
    level?: number;
    monsters?: MazeMonsterInfo[];
    targets?: MazeTargetInfo[];
    tags?: MazeBuffInfo[];
    star_rewards?: MazeStarReward[];
  };
}

export interface MazeTierceNode extends MazeStageDetail {
  idx: number;
  origin: 'stage1' | 'stage2' | 'tierce';
  level?: number;
  countdown?: number;
  buff?: MazeBuffInfo | null;
}

export interface MazeTierceInfo {
  id: number;
  damage_types?: string[];
  countdown?: number;
  score?: number;
  level?: number;
  targets?: MazeTargetInfo[];
  monsters?: MazeMonsterInfo[];
  nodes?: MazeTierceNode[];
  rewards?: MazeRewardItem[];
  prism_reward?: MazeRewardItem[];
}

export interface MazeListEntry {
  param?: number[];
  id?: string;
  begin?: string;
  end?: string;
  live_begin?: string;
  live_end?: string;
  permanent?: boolean;
  test?: boolean;
  en?: string;
  zh?: string;
  ja?: string;
  ko?: string;
  damage_types?: string[];
  floors?: number;
  stage_num?: number;
  countdown?: number;
  clear_score?: number;
  arts?: {
    background?: string;
    tab?: string;
    default?: string;
    tab_select?: string;
    theme_banner?: string;
    theme_toast?: string;
    theme_icon?: string;
    theme_bg?: string;
    poster_tab?: string;
    handbook_banner?: string;
  };
  buffs?: MazeBuffInfo[];
  buff_groups?: MazeHalfGroups<MazeBuffInfo[]>;
  boss_guides?: Record<string, MazeBossGuide>;
  sub_buffs?: MazeBuffInfo[];
  monsters?: MazeMonsterInfo[];
  final_monsters?: MazeMonsterInfo[];
  targets?: MazeTargetInfo[];
  floor_damage?: FloorDamageInfo[];
  floor_details?: MazeFloorDetail[];
  tierce?: MazeTierceInfo;
  levels?: PeakLevelInfo[];
  badges?: MazeBadgeInfo[];
  pollution?: PollutionSummary;
  star_rewards?: MazeStarReward[];
}
export type MazeListDb = Record<string, MazeListEntry>;

export interface PollutionSummary {
  count: number;
  levels: number[];
}

export interface MazeCatalogEntry {
  id: string;
  zh: string;
  live_begin?: string;
  live_end?: string;
  permanent?: boolean;
  test?: boolean;
  buffs?: { id: number; name: string }[];
  monsters?: MazeMonsterInfo[];
  final_monsters?: MazeMonsterInfo[];
  tierce?: Pick<MazeTierceInfo, 'id' | 'damage_types' | 'countdown'>;
  levels?: { kind: 'knight' | 'king' }[];
  pollution?: PollutionSummary;
}

export type MazeCatalogDb = Record<string, MazeCatalogEntry>;

export type EndgameSystemChoice = 'fixed' | 'per_team' | 'per_stage' | 'per_king';

export interface EndgameGuideSection {
  title: string;
  text: string;
}

export interface EndgameGuideSystem {
  name: string;
  count: number;
  choice: EndgameSystemChoice;
}

export interface EndgameGuideMode {
  key: string;
  label: string;
  en: string;
  intro_id: number;
  sections: EndgameGuideSection[];
  system?: EndgameGuideSystem;
}

export interface EndgameGuideDb {
  modes: Record<string, EndgameGuideMode>;
}
