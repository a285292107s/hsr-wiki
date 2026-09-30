
import { LOCAL_DATA_BASE } from './base';
import { singletonLoad } from './singleton';
import type { LocalVersionInfo } from '../types';

export const loadLocalVersion: () => Promise<LocalVersionInfo> = singletonLoad<LocalVersionInfo>(
  `${LOCAL_DATA_BASE}/version.json`,
);
