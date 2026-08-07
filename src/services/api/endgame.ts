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
