
import type { CharacterData, LocalCharList, NameCache, SkillAnimationsDb } from '../types';
import { loadLocalJSON, singletonLocalData } from './local';
import { loadLocalLightCones } from './items';
import { loadLocalRelicSets } from './relics';
import { isTrailblazerId, pickGenderVariant, trailblazerGenderOfId } from '../../lib/trailblazer';

function fixTrailblazerName<T extends { id: number | string; name: string }>(row: T): T {
  if (!isTrailblazerId(row.id)) return row;
  const name = pickGenderVariant(row.name, trailblazerGenderOfId(row.id));
  return name === row.name ? row : { ...row, name };
}

const charList = singletonLocalData<LocalCharList>('characters.json');

export function loadLocalCharacterList(): Promise<LocalCharList> {
  return charList().then((list) => list.map(fixTrailblazerName));
}

export async function loadLocalCharacter(charId: string): Promise<CharacterData> {
  const d = await loadLocalJSON<CharacterData>(`characters/${charId}.json`, `char_${charId}`);
  if (!isTrailblazerId(charId)) return d;
  const name = pickGenderVariant(d.name, trailblazerGenderOfId(charId));
  return name === d.name ? d : { ...d, name };
}

export const loadSkillAnimations = singletonLocalData<SkillAnimationsDb>('skill_animations.json');

export async function loadLocalBuildNames(
  d: CharacterData,
  existing: NameCache = {},
): Promise<NameCache> {
  const result: NameCache = { ...existing };
  const needed = new Set<string>();

  (d.lightcones || []).forEach((id) => needed.add(String(id)));
  if (d.relics) {
    (d.relics.set4_id_list || []).concat(d.relics.set2_id_list || []).forEach((id) => needed.add(String(id)));
  }
  if (d.teams) {
    d.teams.forEach((t) => {
      (t.member_list || []).forEach((id) => needed.add(String(id)));
      const raw = t as unknown as Record<string, unknown>;
      for (const key of Object.keys(raw)) {
        if (!key.startsWith('backup_list')) continue;
        const list = raw[key];
        if (Array.isArray(list)) for (const id of list as number[]) needed.add(String(id));
      }
    });
  }

  try {
    const [lc, relics, chars] = await Promise.all([
      loadLocalLightCones(),
      loadLocalRelicSets(),
      loadLocalCharacterList(),
    ]);
    for (const item of lc) if (needed.has(String(item.id)) && !result[String(item.id)]) result[String(item.id)] = item.name;
    for (const item of relics) if (needed.has(String(item.id)) && !result[String(item.id)]) result[String(item.id)] = item.name;
    for (const item of chars) if (needed.has(String(item.id)) && !result[String(item.id)]) result[String(item.id)] = item.name;
  } catch { }

  for (const id of needed) {
    if (!result[id]) result[id] = '#' + id;
  }
  return result;
}
