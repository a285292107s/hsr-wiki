
import type { VoracityDb } from '../types';
import { LOCAL_DATA_BASE } from './base';
import { singletonLoad } from './singleton';

export const loadLocalVoracity = singletonLoad<VoracityDb>(`${LOCAL_DATA_BASE}/voracity.json`);
