
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

const GENDER_VARIANT_RE = /\{([MF])#([^}]*)\}/g;

export function pickGenderVariant(text: string, gender: TrailblazerGender): string {
  if (!text) return text;
  let matched = false;
  const picked = text.replace(GENDER_VARIANT_RE, (_m, flag: string, body: string) => {
    if ((flag === 'M' ? 'male' : 'female') === gender) {
      matched = true;
      return body;
    }
    return '';
  });
  if (matched) return picked;
  return text.replace(GENDER_VARIANT_RE, '$2');
}
