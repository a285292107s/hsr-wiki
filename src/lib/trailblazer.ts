
export type TrailblazerGender = 'female' | 'male';

const STORAGE_KEY = 'HSR_WIKI_TRAILBLAZER_GENDER';

export const DEFAULT_TRAILBLAZER_GENDER: TrailblazerGender = 'female';

function isTrailblazerGender(v: unknown): v is TrailblazerGender {
  return v === 'female' || v === 'male';
}

export function getSavedTrailblazerGender(): TrailblazerGender {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return isTrailblazerGender(v) ? v : DEFAULT_TRAILBLAZER_GENDER;
  } catch {
    return DEFAULT_TRAILBLAZER_GENDER;
  }
}

export function setTrailblazerGender(gender: TrailblazerGender): void {
  try {
    localStorage.setItem(STORAGE_KEY, gender);
  } catch {
    // 存储不可用（隐私模式/配额）：仅本次会话生效，忽略
  }
}

export function isTrailblazerId(id: number | string): boolean {
  return Number(id) >= 8000;
}

export function trailblazerGenderOfId(id: number | string): TrailblazerGender {
  return Number(id) % 2 === 0 ? 'female' : 'male';
}

export function shouldUseFemaleAvatar(
  gender: TrailblazerGender,
  femaleAvatarId: number | null | undefined,
): boolean {
  return gender === 'female' && femaleAvatarId != null;
}
