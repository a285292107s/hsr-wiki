/** 成就数据加载器（converter 落地，随站部署） */
import { fetchJSON } from '../cache';
import type { AchievementList, AchievementSeriesList } from '../types';
import { LOCAL_DATA_BASE } from './base';

export function loadLocalAchievements(): Promise<AchievementList> {
  return fetchJSON<AchievementList>(`${LOCAL_DATA_BASE}/achievements.json`);
}

export function loadLocalAchievementSeries(): Promise<AchievementSeriesList> {
  return fetchJSON<AchievementSeriesList>(`${LOCAL_DATA_BASE}/achievement_series.json`);
}