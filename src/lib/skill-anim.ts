
import type { Skill, SkillAnimEntry } from '../services/types';

export function memoAnimKey(sk: Skill): string {
  return sk.type || 'ServantPassive';
}

export function assignAnimEntries(
  entries: SkillAnimEntry[] | null | undefined,
  skills: Skill[],
): Record<number, SkillAnimEntry[]> {
  const out: Record<number, SkillAnimEntry[]> = {};
  const pool = (entries || []).slice();
  if (!pool.length || !skills.length) return out;

  const untitled: Skill[] = [];
  for (const sk of skills) {
    const i = pool.findIndex((a) => !!a.title && a.title === sk.name);
    if (i >= 0) out[sk.id] = [pool.splice(i, 1)[0]];
    else untitled.push(sk);
  }
  for (const sk of untitled) {
    const a = pool.shift();
    if (!a) break;
    out[sk.id] = [a];
  }
  if (pool.length) out[skills[0].id] = [...(out[skills[0].id] || []), ...pool];
  return out;
}
