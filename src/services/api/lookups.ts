/** 元素 / 命途查表（elements.json / paths.json；共享单例） */
import type { EnumLabelRow } from '../types';
import { singletonLocalData } from './local';

/** 元素枚举 → 官方名（令牌，随语言包切语言） */
export const loadLocalElements = singletonLocalData<EnumLabelRow[]>('elements.json');

/** 命途枚举 → 官方名（令牌，随语言包切语言） */
export const loadLocalPaths = singletonLocalData<EnumLabelRow[]>('paths.json');
