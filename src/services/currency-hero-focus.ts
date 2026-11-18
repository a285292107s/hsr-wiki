import { shallowRef } from 'vue';
import rawFocus from '../data/currency-hero-focus.json';

export interface HeroFocus {
  x: number;
  y: number;
  scale: number;
}

export interface HeroFocusConfig {
  roles: Record<string, HeroFocus>;
}

export const HERO_POS_VAR = '--nk-crole-hero-pos';
export const HERO_FOCUS_ENDPOINT = '/__lab/hero-focus';

export const DEFAULT_FOCUS: HeroFocus = { x: 100, y: 50, scale: 1 };

export const FOCUS_LIMITS = {
  scaleMin: 1,
  scaleMax: 2.6,
} as const;

function cloneRoles(source: Record<string, HeroFocus> | undefined): Record<string, HeroFocus> {
  const out: Record<string, HeroFocus> = {};
  for (const [id, f] of Object.entries(source ?? {})) out[id] = { ...f };
  return out;
}

const focusRoles = shallowRef<Record<string, HeroFocus>>(cloneRoles((rawFocus as HeroFocusConfig).roles));

export function getFocusRoles(): Readonly<Record<string, HeroFocus>> {
  return focusRoles.value;
}

export function setFocusRoles(next: Record<string, HeroFocus>): void {
  focusRoles.value = cloneRoles(next);
}

export function setRoleFocus(id: string, focus: HeroFocus): void {
  focusRoles.value = { ...focusRoles.value, [id]: { ...focus } };
}

export function removeRoleFocus(id: string): void {
  if (!(id in focusRoles.value)) return;
  const next = { ...focusRoles.value };
  delete next[id];
  focusRoles.value = next;
}

export function clampFocus(focus: HeroFocus): HeroFocus {
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
  return {
    x: clamp(focus.x, 0, 100),
    y: clamp(focus.y, 0, 100),
    scale: clamp(focus.scale, FOCUS_LIMITS.scaleMin, FOCUS_LIMITS.scaleMax),
  };
}

export function getHeroFocus(id: string): HeroFocus | undefined {
  const v = focusRoles.value[id];
  return v ? clampFocus(v) : undefined;
}

export function buildHeroFocusCss(cssVar: string, focus: HeroFocus): string {
  const f = clampFocus(focus);
  return `${cssVar}: ${f.x}% ${f.y}%; ${cssVar}-scale: ${f.scale};`;
}

export function heroFocusStyleVars(id: string, cssVar = HERO_POS_VAR): Record<string, string> {
  const f = getHeroFocus(id);
  if (!f) return {};
  return {
    [cssVar]: `${f.x}% ${f.y}%`,
    [`${cssVar}-scale`]: String(f.scale),
  };
}

export async function syncHeroFocusFromServer(): Promise<void> {
  if (!import.meta.env.DEV) return;
  try {
    const res = await fetch(HERO_FOCUS_ENDPOINT);
    if (!res.ok) return;
    const data = (await res.json()) as HeroFocusConfig;
    if (data && data.roles) setFocusRoles(data.roles);
  } catch {
    /* dev-only 实时同步，失败即静默保持当前值 */
  }
}
