
import { singletonLocalData } from './local';
import type { LocalVersionInfo } from '../types';

export const loadLocalVersion: () => Promise<LocalVersionInfo> = singletonLocalData<LocalVersionInfo>(
  'version.json',
);
