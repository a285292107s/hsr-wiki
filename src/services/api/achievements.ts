/** 成就数据加载器（converter 落地，随站部署） */
import type { AchievementList, AchievementSeriesList } from '../types';
import { LOCAL_DATA_BASE } from './base';
import { singletonLoad } from './singleton';

/** 成就列表 / 成就系列（共享单例：只请求一次，失败自动重置允许重试） */
export const loadLocalAchievements = singletonLoad<AchievementList>(`${LOCAL_DATA_BASE}/achievements.json`);
export const loadLocalAchievementSeries = singletonLoad<AchievementSeriesList>(`${LOCAL_DATA_BASE}/achievement_series.json`);