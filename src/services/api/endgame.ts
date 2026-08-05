/** 终局内容（忘却之庭 / 虚构叙事 / 末日幻影 / 异相仲裁）加载器 */
import { fetchJSON } from '../cache';
import type { MazeListDb } from '../types';
import { LOCAL_DATA_BASE } from './base';

export function loadLocalMazeList(): Promise<MazeListDb> {
  return fetchJSON<MazeListDb>(`${LOCAL_DATA_BASE}/maze.json`);
}

export function loadLocalStoryList(): Promise<MazeListDb> {
  return fetchJSON<MazeListDb>(`${LOCAL_DATA_BASE}/maze_extra.json`);
}

export function loadLocalBossList(): Promise<MazeListDb> {
  return fetchJSON<MazeListDb>(`${LOCAL_DATA_BASE}/maze_boss.json`);
}

export function loadLocalPeakList(): Promise<MazeListDb> {
  return fetchJSON<MazeListDb>(`${LOCAL_DATA_BASE}/maze_peak.json`);
}

/**
 * 终局 4 页数据并行预热入 L1 内存，保证 Tab 切换即时命中（失败静默）。
 * 注意：源数据无"赛季→版本"时间线，四季统一按 ID 降序展示，无需 version 预取。
 */
export function prefetchEndgameAll(_ver: string): void {
  void Promise.allSettled([
    loadLocalMazeList(),
    loadLocalStoryList(), loadLocalBossList(),
    loadLocalPeakList(),
  ]);
}
