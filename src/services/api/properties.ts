import type { PropertyRow } from '../types';
import { singletonLocalData } from './local';

export const loadLocalProperties = singletonLocalData<PropertyRow[]>('properties.json');
