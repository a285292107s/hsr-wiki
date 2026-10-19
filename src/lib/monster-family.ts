
export interface MonsterFamilyInput {
  id: number | string;
  name: string;
  icon?: string | null;
}

export function monsterIconStem(icon: string | null | undefined): string {
  return (icon || '').split('/').pop()?.replace(/\.png$/i, '') || '';
}

export function monsterFamilyKey(m: MonsterFamilyInput): string {
  return `${m.name}\u0000${monsterIconStem(m.icon)}`;
}

export function groupMonsterFamilies<T extends MonsterFamilyInput>(
  rows: readonly T[],
): Map<string, T[]> {
  const out = new Map<string, T[]>();
  for (const row of rows) {
    const key = monsterFamilyKey(row);
    const bucket = out.get(key);
    if (bucket) bucket.push(row);
    else out.set(key, [row]);
  }
  for (const bucket of out.values()) {
    bucket.sort((a, b) => Number(a.id) - Number(b.id));
  }
  return out;
}

export function monsterFamilyOf<T extends MonsterFamilyInput>(
  rows: readonly T[],
  self: MonsterFamilyInput,
): T[] {
  const key = monsterFamilyKey(self);
  return groupMonsterFamilies(rows).get(key) ?? [self as unknown as T];
}

export interface MonsterAtlasInput extends MonsterFamilyInput {
  atlas_group?: number | null;
}

export function atlasFormsOf<T extends MonsterAtlasInput>(
  rows: readonly T[],
  self: MonsterAtlasInput,
): T[] {
  const group = self.atlas_group;
  if (group == null) return [];
  return rows
    .filter((r) => r.atlas_group === group)
    .sort((a, b) => Number(a.id) - Number(b.id));
}
