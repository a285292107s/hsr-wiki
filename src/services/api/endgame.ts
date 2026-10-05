
import type { MazeListDb, MazeCatalogDb, EndgameGuideDb } from '../types';
import { LOCAL_DATA_BASE } from './base';
import { singletonLoad } from './singleton';

/** 终局玩法说明（四玩法规则正文 + 增益体系名/条数/选法；单例，失败可重试） */
export const loadLocalEndgameGuide = singletonLoad<EndgameGuideDb>(`${LOCAL_DATA_BASE}/endgame_guide.json`);

export const loadLocalMazeList = singletonLoad<MazeListDb>(`${LOCAL_DATA_BASE}/maze.json`);
export const loadLocalStoryList = singletonLoad<MazeListDb>(`${LOCAL_DATA_BASE}/maze_extra.json`);
export const loadLocalBossList = singletonLoad<MazeListDb>(`${LOCAL_DATA_BASE}/maze_boss.json`);
export const loadLocalPeakList = singletonLoad<MazeListDb>(`${LOCAL_DATA_BASE}/maze_peak.json`);

export const loadLocalMazeCatalog = singletonLoad<MazeCatalogDb>(`${LOCAL_DATA_BASE}/maze.catalog.json`);
export const loadLocalStoryCatalog = singletonLoad<MazeCatalogDb>(`${LOCAL_DATA_BASE}/maze_extra.catalog.json`);
export const loadLocalBossCatalog = singletonLoad<MazeCatalogDb>(`${LOCAL_DATA_BASE}/maze_boss.catalog.json`);
export const loadLocalPeakCatalog = singletonLoad<MazeCatalogDb>(`${LOCAL_DATA_BASE}/maze_peak.catalog.json`);
