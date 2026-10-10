/** 属性枚举查表（properties.json；共享单例） */
import type { PropertyRow } from '../types';
import { singletonLocalData } from './local';

/** 属性枚举 → 官方词条名（`name` 是令牌，随语言包切语言；见 tools/converter/enum_labels.py） */
export const loadLocalProperties = singletonLocalData<PropertyRow[]>('properties.json');
