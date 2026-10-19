import type { SkillExtra } from '../../services/types';

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
