
import type { AchievementList, AchievementSeriesList } from '../types';
import { LOCAL_DATA_BASE } from './base';
import { singletonLoad } from './singleton';

export const loadLocalAchievements = singletonLoad<AchievementList>(`${LOCAL_DATA_BASE}/achievements.json`);
export const loadLocalAchievementSeries = singletonLoad<AchievementSeriesList>(`${LOCAL_DATA_BASE}/achievement_series.json`);
