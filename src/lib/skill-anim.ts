/**
 * 技能预览条目分配（纯函数）
 * 数据源：public/data/cn/skill_animations.json（米游社 Wiki 抓取，见 spine-lab/tools/wiki-anim-scraper.mjs）。
 * 主技能由 SkillCard 按索引在父子技能间分发；本模块只负责忆灵技能——Wiki 侧「忆灵技/忆灵天赋」
 * 的条目 subTitle 就是技能名，故按名匹配优于按顺序，未匹配者才按技能顺序补位。
 */
import type { Skill, SkillAnimEntry } from '../services/types';

/** 忆灵技能预览查表键：忆灵技取角色数据 type（'Servant'）；
 *  忆灵天赋在角色数据里 type 为空串 → 用 SkillType 已声明的 'ServantPassive'（抓取侧同规则写入） */
export function memoAnimKey(sk: Skill): string {
  return sk.type || 'ServantPassive';
}

/** 条目 → 技能 id 映射：先按 subTitle 精确匹配技能名，未匹配条目按技能顺序补位，
 *  多出的条目并入首个技能（卡片内以 tab 切换）。同池只应传同一 type_name 的技能 */
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
