
import { SKILL_ORDER } from './constants';
import type { CharacterData, Skill, SkillTree } from '../services/types';

export interface SkillFamily {
  anchor: string;
  main: Skill;
  children: Skill[];
}

function isVisible(sk: Skill): boolean {
  return !!sk.type_name && SKILL_ORDER.includes(sk.type);
}

function anchorIds(levels: Record<string, SkillTree> | undefined): number[] | null {
  for (const node of Object.values(levels || {})) {
    const ids = node && node.level_up_skill_id;
    if (ids && ids.length) return ids;
  }
  return null;
}

export function groupSkillsByFamily(
  skills: Record<string, Skill>,
  skillTrees: CharacterData['skill_trees'] | null | undefined,
): SkillFamily[] {
  const visible = Object.values(skills).filter(isVisible);
  const byId = new Map(visible.map((sk) => [sk.id, sk]));
  const families: SkillFamily[] = [];
  const claimed = new Set<number>();

  for (const [anchor, levels] of Object.entries(skillTrees || {})) {
    const ids = anchorIds(levels);
    if (!ids) continue;

    const members: Skill[] = [];
    for (const id of ids) {
      const sk = byId.get(id);
      if (sk && !claimed.has(id)) members.push(sk);
    }
    if (members.length < 2) continue;
    for (const sk of members) claimed.add(sk.id);
    families.push({ anchor, main: members[0], children: members.slice(1) });
  }

  for (const sk of visible) {
    if (!claimed.has(sk.id)) families.push({ anchor: '', main: sk, children: [] });
  }

  return families.sort(
    (a, b) => SKILL_ORDER.indexOf(a.main.type) - SKILL_ORDER.indexOf(b.main.type),
  );
}
