
import type { AchievementList, AchievementSeriesList } from '../types';
import { singletonLocalData } from './local';

export const loadLocalAchievements = singletonLocalData<AchievementList>('achievements.json');
export const loadLocalAchievementSeries = singletonLocalData<AchievementSeriesList>('achievement_series.json');
