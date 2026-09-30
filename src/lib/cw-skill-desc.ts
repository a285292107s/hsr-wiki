
export type CwSkillDescMode = 'full' | 'simple';

const STORAGE_KEY = 'HSR_WIKI_CW_SKILL_MODE';

export const DEFAULT_CW_SKILL_DESC_MODE: CwSkillDescMode = 'full';

function isCwSkillDescMode(v: unknown): v is CwSkillDescMode {
  return v === 'full' || v === 'simple';
}

export function getSavedCwSkillDescMode(): CwSkillDescMode {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return isCwSkillDescMode(v) ? v : DEFAULT_CW_SKILL_DESC_MODE;
  } catch {
    return DEFAULT_CW_SKILL_DESC_MODE;
  }
}

export function setCwSkillDescMode(mode: CwSkillDescMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // 存储不可用（隐私模式/配额）：仅本次会话生效，忽略
  }
}
