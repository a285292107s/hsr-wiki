export interface VoracityProgressStep {
  progress?: number | null;
  desc: string;
}

export interface VoracityBuffLevel {
  level: number;
  buff_id: number;
  name?: string;
  desc?: string;
  param_list?: number[];
  icon?: string;
  progress_percent?: number | null;
}

export interface VoracityActivity {
  panel_id?: number;
  name: string;
  intro?: string;
  unlock_mission_id?: number;
  scores?: number[];
  progress_steps?: VoracityProgressStep[];
  buff_levels?: VoracityBuffLevel[];
}

export interface VoracityInvasionLevel {
  invasion_id: number;
  maze_buff_id?: number;
  desc?: string;
  param_list?: number[];
  binding?: string;
  icon?: string;
}

export interface VoracityStageMonster {
  monster_id?: number;
  detail_id?: number | null;
  name?: string;
  icon?: string;
}

export interface VoracityStageScope {
  mode: string;
  season_id: string;
  season_name: string;
  half: string;
  floor?: number;
  title?: string;
}

export interface VoracityStage {
  stage_id: number;
  invasion_id: number;
  scopes?: VoracityStageScope[];
  monsters?: VoracityStageMonster[];
}

export interface VoracityInvasion {
  levels?: VoracityInvasionLevel[];
  stages?: VoracityStage[];
}

export interface VoracityStatus {
  status_id: number;
  name: string;
  type?: string;
  desc?: string;
  param_list?: number[];
  icon?: string;
  modifier?: string;
  can_dispel?: boolean;
}

export interface VoracityTutorial {
  id: number;
  image?: string;
  desc?: string;
}

export interface VoracityAffix {
  id: number;
  name: string;
  desc?: string;
  icon?: string;
  params?: number[];
}

export interface VoracityDb {
  activity?: VoracityActivity;
  invasion?: VoracityInvasion;
  statuses?: VoracityStatus[];
  tutorials?: VoracityTutorial[];
  affixes?: VoracityAffix[];
}
