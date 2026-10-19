import type { EnumLabelRow } from '../types';
import { singletonLocalData } from './local';

export const loadLocalElements = singletonLocalData<EnumLabelRow[]>('elements.json');

export const loadLocalPaths = singletonLocalData<EnumLabelRow[]>('paths.json');
