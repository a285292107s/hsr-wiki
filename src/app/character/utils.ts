/** 角色详情页子组件共享的纯工具函数 */
import type { SkillExtra } from '../../services/types';

/** 词条提取（extra 按 name 去重；行迹树节点 extra 为 unknown，运行时过滤） */
export function extraTerms(src: { extra?: Record<string, unknown> | null }): SkillExtra[] {
  const extra = src.extra as Record<string, SkillExtra> | undefined;
  if (!extra) return [];
  const seen = new Set<string>();
  return Object.values(extra).filter((t) => {
    if (!t || typeof t !== 'object' || !t.name || seen.has(t.name)) return false;
    seen.add(t.name);
    return true;
  });
}
