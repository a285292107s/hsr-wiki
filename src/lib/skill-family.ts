/**
 * 技能族推导（ADR 0022：docs/adr/0022-技能层级以行迹族为唯一来源.md）。
 * 族 = skill_trees 某锚点的 level_up_skill_id 与可见技能的交集（原序，首个为基座技能 = 父卡）。
 * 必须：一个可见技能只进一个族（先到先得）；未成族的可见技能落为单卡（anchor ''），禁止丢技能。
 * 可见交集 < 2 条（含锚点缺失、无 skill_trees）一律不成族 → 该技能为单卡，禁止回退启发式分组。
 * 禁止：按 (type + type_name) 分组，或用 AvatarConfig.SkillList 顺序判定父子（镜流 121209 排在基座 121202 前）。
 */
import { SKILL_ORDER } from './constants';
import type { CharacterData, Skill, SkillTree } from '../services/types';

/** 技能族：族内首个为基座技能（父卡），其余为形态技能（互为兄弟） */
export interface SkillFamily {
  /** 行迹锚点 key（skill_trees 的键，如 'Point01'）；未被任何族覆盖的单卡族为 '' */
  anchor: string;
  main: Skill;
  children: Skill[];
}

/** 可见性判据（与旧启发式严格同口径）：type_name 非空且 type 在 SKILL_ORDER 内（null 为分隔位，可被 includes 命中） */
function isVisible(sk: Skill): boolean {
  return !!sk.type_name && SKILL_ORDER.includes(sk.type);
}

/** 锚点成员 id：各级 level_up_skill_id 实测内容相同，取首个非空级即可 */
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
    // 按 level_up_skill_id 原序取成员；<2 条不成族且不占位（该技能仍可归入后续锚点）
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

  // 族间排序与旧启发式同口径；Array.sort 自 ES2019 起稳定 → 同类型族保持登记序（锚点插入序 → 单卡补位序）
  return families.sort(
    (a, b) => SKILL_ORDER.indexOf(a.main.type) - SKILL_ORDER.indexOf(b.main.type),
  );
}
