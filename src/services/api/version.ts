/** 本地游戏版本信息（converter 输出，共享单例） */
import { LOCAL_DATA_BASE } from './base';
import { singletonLoad } from './singleton';
import type { LocalVersionInfo } from '../types';

/** 加载本地 version.json（git 不可用/未生成时为 {}，调用方兜底显示 —） */
export const loadLocalVersion: () => Promise<LocalVersionInfo> = singletonLoad<LocalVersionInfo>(
  `${LOCAL_DATA_BASE}/version.json`,
);
