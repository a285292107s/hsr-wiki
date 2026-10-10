
import type { MazeListDb, MazeCatalogDb, EndgameGuideDb } from '../types';
import { singletonLocalData } from './local';

/** 终局玩法说明（四玩法规则正文 + 增益体系名/条数/选法；单例，失败可重试） */
export const loadLocalEndgameGuide = singletonLocalData<EndgameGuideDb>('endgame_guide.json');

export const loadLocalMazeList = singletonLocalData<MazeListDb>('maze.json');
export const loadLocalStoryList = singletonLocalData<MazeListDb>('maze_extra.json');
export const loadLocalBossList = singletonLocalData<MazeListDb>('maze_boss.json');
export const loadLocalPeakList = singletonLocalData<MazeListDb>('maze_peak.json');

export const loadLocalMazeCatalog = singletonLocalData<MazeCatalogDb>('maze.catalog.json');
export const loadLocalStoryCatalog = singletonLocalData<MazeCatalogDb>('maze_extra.catalog.json');
export const loadLocalBossCatalog = singletonLocalData<MazeCatalogDb>('maze_boss.catalog.json');
export const loadLocalPeakCatalog = singletonLocalData<MazeCatalogDb>('maze_peak.catalog.json');
