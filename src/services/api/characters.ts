/** 角色列表 / 详情 / 技能动画 / 配装名称加载器 */
import { fetchJSON } from '../cache';
import type { CharacterData, LocalCharList, NameCache, SkillAnimationsDb } from '../types';
import { LOCAL_DATA_BASE } from './base';
import { loadLocalLightCones } from './items';
import { loadLocalRelicSets } from './relics';
import { singletonLoad } from './singleton';

/** 角色列表（共享单例：只请求一次，失败自动重置允许重试） */
export const loadLocalCharacterList = singletonLoad<LocalCharList>(`${LOCAL_DATA_BASE}/characters.json`);

export function loadLocalCharacter(charId: string): Promise<CharacterData> {
  return fetchJSON<CharacterData>(`${LOCAL_DATA_BASE}/characters/${charId}.json`);
}

/** 技能动画（米游社 Wiki 抓取数据；共享单例） */
export const loadSkillAnimations = singletonLoad<SkillAnimationsDb>(`${LOCAL_DATA_BASE}/skill_animations.json`);

/**
 * 从本地 JSON 加载配装名称（光锥/遗器套装/队伍成员）。
 * 返回合并后的新 NameCache（不修改入参）。失败项回退为 '#id'。
 */
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
  if (d.teams) d.teams.forEach((t) => (t.member_list || []).forEach((id) => needed.add(String(id))));

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
