
import type { CharacterData, LocalCharList, NameCache, SkillAnimationsDb } from '../types';
import { loadLocalJSON, singletonLocalData } from './local';
import { loadLocalLightCones } from './items';
import { loadLocalRelicSets } from './relics';
import { isTrailblazerId, pickGenderVariant, trailblazerGenderOfId } from '../../lib/trailblazer';

/* 开拓者形态名取支：官方语言包里这个名字带性别变体标记 `{M#…}{F#…}`（实测 13 语言中**仅 fr/de/pt**
   的双支；其余 10 语言单支、本函数原样返回）。取支依据是**条目自身的 id**（奇数=男、偶数=女）而不是
   用户设置——`8002` 这个条目本身**就是**女性形态，两者恒等（列表按设置过滤后只会留下相符的那一个），
   但用条目自身性别能让取支与缓存维度、与构建期（预渲染无 localStorage）都解耦。
   放在取数边界而不是各展示面：列表卡、详情 `<h1>`、`document.title`、配装里的队友名全部经此取数，
   一处修好即全覆盖，避免同一个判据在 4 个视图里各写一遍（`lib/trailblazer.ts` 的 helper 为唯一实现）。 */
function fixTrailblazerName<T extends { id: number | string; name: string }>(row: T): T {
  if (!isTrailblazerId(row.id)) return row;
  const name = pickGenderVariant(row.name, trailblazerGenderOfId(row.id));
  return name === row.name ? row : { ...row, name };
}

/** 角色列表（共享单例：只请求一次，失败自动重置允许重试） */
const charList = singletonLocalData<LocalCharList>('characters.json');

export function loadLocalCharacterList(): Promise<LocalCharList> {
  /* 取支在此处 map：底层单例已保证只请求一次，map 是 98 条量级的纯内存操作。
     返回新对象而非就地改，避免污染缓存里的那份（缓存按语言共享，就地改会让二次调用叠加处理）。 */
  return charList().then((list) => list.map(fixTrailblazerName));
}

export async function loadLocalCharacter(charId: string): Promise<CharacterData> {
  // 详情走请求缓存（内存 → in-flight 去重 → 网络）：二次进入免网络往返
  const d = await loadLocalJSON<CharacterData>(`characters/${charId}.json`, `char_${charId}`);
  /* 详情文件的形状里**没有** `id` 字段（见 public/data/cn/characters/8007.json 首键即 `name`），
     故取支判据用调用方给的 charId——它同时是文件名与条目 id，与列表域同源。 */
  if (!isTrailblazerId(charId)) return d;
  const name = pickGenderVariant(d.name, trailblazerGenderOfId(charId));
  return name === d.name ? d : { ...d, name };
}

/** 技能动画（米游社 Wiki 抓取数据；共享单例） */
export const loadSkillAnimations = singletonLocalData<SkillAnimationsDb>('skill_animations.json');

/* 从本地 JSON 加载配装名称（光锥/遗器套装/队伍成员）。
   返回合并后的新 NameCache（不修改入参）。失败项回退为 '#id'。 */
export async function loadLocalBuildNames(
  d: CharacterData,
  existing: NameCache = {},
): Promise<NameCache> {
  const result: NameCache = { ...existing };
  const needed = new Set<string>();

  (d.lightcones || []).forEach((id) => needed.add(String(id)));
  if (d.relics) {
    (d.relics.set4_id_list || []).concat(d.relics.set2_id_list || []).forEach((id) => needed.add(String(id)));
  }
  if (d.teams) {
    d.teams.forEach((t) => {
      (t.member_list || []).forEach((id) => needed.add(String(id)));
      // 备选队友（backup_list1..N）此前漏收集 ⇒ 它们的头像只拿得到 '#id' 回退。
      // 队列表的键按位编号（backup_list1 对应 member_list[0]），没有数组字段可枚举，故按前缀扫键。
      const raw = t as unknown as Record<string, unknown>;
      for (const key of Object.keys(raw)) {
        if (!key.startsWith('backup_list')) continue;
        const list = raw[key];
        if (Array.isArray(list)) for (const id of list as number[]) needed.add(String(id));
      }
    });
  }

  try {
    // 复用共享单例，避免与其他加载路径产生重复请求
    const [lc, relics, chars] = await Promise.all([
      loadLocalLightCones(),
      loadLocalRelicSets(),
      loadLocalCharacterList(),
    ]);
    for (const item of lc) if (needed.has(String(item.id)) && !result[String(item.id)]) result[String(item.id)] = item.name;
    for (const item of relics) if (needed.has(String(item.id)) && !result[String(item.id)]) result[String(item.id)] = item.name;
    for (const item of chars) if (needed.has(String(item.id)) && !result[String(item.id)]) result[String(item.id)] = item.name;
  } catch { /* 失败静默 */ }

  // 任何仍未找到的名称回退为 '#id'
  for (const id of needed) {
    if (!result[id]) result[id] = '#' + id;
  }
  return result;
}
