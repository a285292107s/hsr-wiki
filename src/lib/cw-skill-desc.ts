/**
 * 货币战争 · 技能描述模式（详细 / 简略）
 * 角色详情页技能卡片描述在 desc（详细，含数值参数）与 simple_desc（简略，官方浓缩版）间
 * 二选一展示（不全部显示）；选择持久化于 localStorage（HSR_WIKI_CW_SKILL_MODE），跨角色页面保持。
 */
export type CwSkillDescMode = 'full' | 'simple';

const STORAGE_KEY = 'HSR_WIKI_CW_SKILL_MODE';
/** 默认模式（缺省 / 非法值时回退） */
export const DEFAULT_CW_SKILL_DESC_MODE: CwSkillDescMode = 'full';

function isCwSkillDescMode(v: unknown): v is CwSkillDescMode {
  return v === 'full' || v === 'simple';
}

/** 读取持久化模式（非法/缺失回退默认） */
export function getSavedCwSkillDescMode(): CwSkillDescMode {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return isCwSkillDescMode(v) ? v : DEFAULT_CW_SKILL_DESC_MODE;
  } catch {
    return DEFAULT_CW_SKILL_DESC_MODE;
  }
}

/** 持久化模式（视图切换时调用） */
export function setCwSkillDescMode(mode: CwSkillDescMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // 存储不可用（隐私模式/配额）：仅本次会话生效，忽略
  }
}