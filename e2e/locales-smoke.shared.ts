import { readFileSync } from 'node:fs';
import { expect } from '@playwright/test';
import { readJsonIn } from './helpers';
import { LOCALES } from '../src/lib/i18n/locales';

export const dictOf = (code: string): Record<string, string> =>
  JSON.parse(readFileSync(`src/lib/i18n/messages/${code}.json`, 'utf8')) as Record<string, string>;

export const HAN_OK = new Set(['cn', 'cht', 'jp']);
export const HAN_RE = /[\u4e00-\u9fff]/;

const firstId = (file: string, listKey?: string): string => {
  const raw = readJsonIn<Record<string, unknown> | unknown[]>('cn', `public/data/cn/${file}`);
  const arr = Array.isArray(raw) ? raw : (raw as Record<string, unknown[]>)[listKey ?? '']!;
  const first = (Array.isArray(raw) ? raw[0] : arr[0]) as { id: number | string };
  return String(first.id);
};

export const collectI18nWarnings = (page: import('@playwright/test').Page): (() => string[]) => {
  const warns: string[] = [];
  page.on('console', (msg) => {
    const text = msg.text();
    if (text.includes('[intlify]') && text.includes('Not found')) warns.push(text);
  });
  return () => warns;
};

export const charId = (): string => firstId('characters.json');
const lightconeId = (): string => firstId('light_cones.json');
const relicId = (): string => firstId('relics.json');
const monsterId = (): string => firstId('monsters.json');
export const roleId = (): string => firstId('currency/role.json', 'roles');
const traitId = (): string => firstId('currency/traits.json', 'traits');

export const routeFamilies = (base: string): string[] => [
  `${base}/`,
  `${base}/character`,
  `${base}/character/${charId()}`,
  `${base}/lightcone`,
  `${base}/lightcone/${lightconeId()}`,
  `${base}/relic`,
  `${base}/relic/${relicId()}`,
  `${base}/item`,
  `${base}/monster`,
  `${base}/monster/${monsterId()}`,
  `${base}/achievement`,
  `${base}/endgame`,
  `${base}/endgame/maze`,
  `${base}/endgame/maze/1036`,
  `${base}/endgame/story`,
  `${base}/endgame/story/2026`,
  `${base}/endgame/boss`,
  `${base}/endgame/boss/3020`,
  `${base}/endgame/peak`,
  `${base}/endgame/peak/9`,
  `${base}/voracity`,
  `${base}/formula`,
  `${base}/currency`,
  `${base}/currency/role`,
  `${base}/currency/role/${roleId()}`,
  `${base}/currency/trait/${traitId()}`,
];

const SWEEP_FAST = ['cn', 'de', 'jp', 'ru'];
const SWEEP_ALL = LOCALES.map((l) => l.code);
export const SWEEP_LOCALES =
  process.env.SMOKE_SCOPE === 'fast' || process.env.SMOKE_FAST ? SWEEP_FAST : SWEEP_ALL;
export const SWEEP_SET = new Set(SWEEP_LOCALES);
