
export interface AchievementItem {
  id: number;
  title: string;
  desc: string;
  rarity: 'Low' | 'Mid' | 'High' | '';
  series_id: number;
  priority: number;
  show_type: '' | 'ShowAfterFinish' | 'HiddenDesc';
}

export type AchievementList = AchievementItem[];

export interface AchievementSeries {
  id: number;
  name: string;
  icon: string;
  icon_s: string;
  priority: number;
}

export type AchievementSeriesList = AchievementSeries[];
