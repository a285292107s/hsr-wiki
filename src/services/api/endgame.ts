/** 终局内容（忘却之庭 / 虚构叙事 / 末日幻影 / 异相仲裁）加载器 */
import type { MazeListDb } from '../types';
import { LOCAL_DATA_BASE } from './base';
import { singletonLoad } from './singleton';

/** 四模式赛季列表（共享单例：只请求一次，失败自动重置允许重试；目录页与详情页同源） */
export const loadLocalMazeList = singletonLoad<MazeListDb>(`${LOCAL_DATA_BASE}/maze.json`);
export const loadLocalStoryList = singletonLoad<MazeListDb>(`${LOCAL_DATA_BASE}/maze_extra.json`);
export const loadLocalBossList = singletonLoad<MazeListDb>(`${LOCAL_DATA_BASE}/maze_boss.json`);
export const loadLocalPeakList = singletonLoad<MazeListDb>(`${LOCAL_DATA_BASE}/maze_peak.json`);
