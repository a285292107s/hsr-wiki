
import { SKILL_ORDER } from './constants';
import type { CharacterData, Skill, SkillTree } from '../services/types';

export interface SkillFamily {
  /** 行迹锚点 key（skill_trees 的键，如 'Point01'）；未被任何族覆盖的单卡族为 '' */
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

/* 族 = skill_trees 某锚点的 level_up_skill_id 与可见技能的交集（原序，首个为基座 = 父卡）。
   一个可见技能只进一个族（先到先得）；未成族的可见技能落为单卡（anchor ''），禁止丢技能。
   可见交集 < 2 条（含锚点缺失、无 skill_trees）一律不成族 → 单卡，**禁止**回退启发式分组。
   **禁止**改用 (type + type_name) 分组或 SkillList 顺序判定父子——镜流 121209 排在基座 121202 前。
   见 docs/adr/0022-技能层级以行迹族为唯一来源.md */
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
