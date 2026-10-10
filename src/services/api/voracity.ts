
import type { VoracityDb } from '../types';
import { singletonLocalData } from './local';

export const loadLocalVoracity = singletonLocalData<VoracityDb>('voracity.json');
