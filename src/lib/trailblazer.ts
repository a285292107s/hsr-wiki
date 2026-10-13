
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

/** 官方 TextMap 的性别变体标记 `{M#…}{F#…}`（同一段文本的男/女两种写法）。 */
const GENDER_VARIANT_RE = /\{([MF])#([^}]*)\}/g;

/**
 * 取性别变体里与 `gender` 相符的一支（`{M#Pionnier}{F#Pionnière}·L'Allégresse` → `Pionnière·L'Allégresse`）。
 *
 * **为什么必须在前端做**：官方只有一套 `{M#…}{F#…}` 文本，**没有**分开的男/女条目；而**只有 fr/de/pt
 * 的开拓者名**把这个标记带进了组合键（`composed:trailblazer:*`，实测 13 语言 × 5 键仅这 3 个语言是双支）。
 * 转换器按既定分工**原样保留**标记（它不知道玩家性别），所以取支只能由知道性别的展示层做。
 *
 * **为什么不能复用 `stripTags`/`gameTagsToHtml`**：那两处的 `/\{[FM]#([^}]*)\}/g → '$1'` 是**把两支拼起来**
 * （`PionnierPionnière`），对**描述文本**是既定口径、且被 `src/lib/__tests__/format.test.ts` 钉住；
 * 但「名字」必须二选一，拼接会得到一个不存在的词（官方 DE/FR/PT 的开拓者名正是这种形态）。
 *
 * 幂等：不含该标记的文本原样返回——其余 10 个语言与非开拓者角色都走这条路径。
 * 与 `tools/gen-ai-endpoints.mjs` 的 `pickGender` 同规则（生成器不能 import TS，故就地镜像；
 * 两侧一致性由 `tools/check-ai-endpoints.mjs` 的快照断言兜住——漏改任一侧都会留下标记而被守卫拦下）。
 */
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
  /* 只带单支、且与当前性别不符（例：只有 `{F#Sora}` 却按男性渲染）：
     此处退回「保留支内文本、丢掉标记」——该分支只可能在单支串上触发（双支串必有一支命中），
     而单支串里那唯一一支就是正确名字，故结果正确；宁可显示另一性别的名字，也不让名字整段消失。 */
  return text.replace(GENDER_VARIANT_RE, '$2');
}
