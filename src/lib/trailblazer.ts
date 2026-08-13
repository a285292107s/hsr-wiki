/**
 * 开拓者性别（形态）选择
 * 开拓者在数据源中按 ID 段区分：8xxx 为开拓者，奇数=男性（vo_tag playerboy*）、偶数=女性（playergirl*）。
 * 常规模式列表按此过滤；货币战争仅收录男性 RoleID（8007/8009），女性形态由
 * GridFightGenderOverride 映射（female_avatar_id），仅立绘/头像切换。
 * 选择持久化于 localStorage（HSR_WIKI_TRAILBLAZER_GENDER），默认女性。
 */

export type TrailblazerGender = 'female' | 'male';

const STORAGE_KEY = 'HSR_WIKI_TRAILBLAZER_GENDER';
/** 默认形态（缺省 / 非法值时回退） */
export const DEFAULT_TRAILBLAZER_GENDER: TrailblazerGender = 'female';

function isTrailblazerGender(v: unknown): v is TrailblazerGender {
  return v === 'female' || v === 'male';
}

/** 读取持久化形态选择（非法/缺失回退默认） */
export function getSavedTrailblazerGender(): TrailblazerGender {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return isTrailblazerGender(v) ? v : DEFAULT_TRAILBLAZER_GENDER;
  } catch {
    return DEFAULT_TRAILBLAZER_GENDER;
  }
}

/** 持久化形态选择（设置页调用） */
export function setTrailblazerGender(gender: TrailblazerGender): void {
  try {
    localStorage.setItem(STORAGE_KEY, gender);
  } catch {
    // 存储不可用（隐私模式/配额）：仅本次会话生效，忽略
  }
}

/** 是否为开拓者 ID 段（8xxx；常规角色 1xxx-2xxx 不在此段） */
export function isTrailblazerId(id: number | string): boolean {
  return Number(id) >= 8000;
}

/** 开拓者 ID → 性别（8xxx 奇数=男、偶数=女，与官方 vo_tag playerboy/playergirl 一致） */
export function trailblazerGenderOfId(id: number | string): TrailblazerGender {
  return Number(id) % 2 === 0 ? 'female' : 'male';
}

/** 是否展示女性形态（设置选择女性，且存在女性形态映射时） */
export function shouldUseFemaleAvatar(
  gender: TrailblazerGender,
  femaleAvatarId: number | null | undefined,
): boolean {
  return gender === 'female' && femaleAvatarId != null;
}