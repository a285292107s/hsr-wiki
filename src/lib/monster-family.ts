/** 敌对物种「同族」判据（纯函数，列表卡的「变体 i/n」与详情页的「同族变体」共用一份）。
 *
 * 判据 = **名称 + 卡面图标 stem**。三个候选都被实测否掉：
 *   · 不用**立绘**：立绘是 per-变体的（冰锋 1002011/1002012 立绘不同、卡面图标相同），
 *     按立绘分组会把用户看到的 4 张同图卡拆成 2+2 —— 正好拆掉最刺眼的那一簇；
 *   · 不用**裸图标 stem**：92 个 stem 对应多个名称（`Monster_1003010` = 银鬃尉官 /
 *     银鬃尉官（完整）/ 邓恩），那是不同怪物而不是同一怪物的档位；
 *   · 也不用 `MonsterTemplateConfig.TemplateGroupID`：它是**官方图鉴族**且并非空值——
 *     实测 **472/632 有值**（168 组、113 个多成员组、最大 14），但口径比本判据**更宽**：
 *     它把「银鬃尉官 / 银鬃尉官（错误）/ 银鬃尉官（完整）/ 邓恩」归为一族，而这些条目的
 *     名称与卡面各不相同，按它分组会把**不同怪物**并成一张卡的变体。两者语义不同：
 *     TemplateGroupID = 同一模型的各具名形态，本判据 = 用户看到同一张卡。
 *     量化关系：我们的族**从不跨官方组**（多成员族 109 个恰在 1 组内、0 个跨 ≥2 组）⇒ 本判据是
 *     官方组的**细化**；反之 83 个官方组含 ≥2 个我们的族。改用官方组当族：身份 385→328、
 *     344 条卡会「不同图互为变体」、38 个族（112 条，含冰锋 ×4 / 无尽寒冬之槊 ×8）因组号为空而失去分组。
 *
 * 实测规模：632 条目录条目 → 385 族，147 族多成员，簇内 394 条（62%），最大 8 条。
 * 族内 149 族里 148 族的技能都不同 —— 这些是同一怪物的多个数值档，不是重复数据。 */

export interface MonsterFamilyInput {
  id: number | string;
  name: string;
  icon?: string | null;
}

/** 图标 stem：官方相对路径 / 完整 SpriteOutput 路径 / basename 三种形态都能吃。 */
export function monsterIconStem(icon: string | null | undefined): string {
  return (icon || '').split('/').pop()?.replace(/\.png$/i, '') || '';
}

/** 同族键。分隔符取 `\u0000`（NUL）——真实名称与图标 stem 都不含它，拼接无歧义。 */
export function monsterFamilyKey(m: MonsterFamilyInput): string {
  return `${m.name}\u0000${monsterIconStem(m.icon)}`;
}

/** 按同族分组；**族内按 id 升序**（「变体 i/n」的序号必须跨渲染稳定）。 */
export function groupMonsterFamilies<T extends MonsterFamilyInput>(
  rows: readonly T[],
): Map<string, T[]> {
  const out = new Map<string, T[]>();
  for (const row of rows) {
    const key = monsterFamilyKey(row);
    const bucket = out.get(key);
    if (bucket) bucket.push(row);
    else out.set(key, [row]);
  }
  for (const bucket of out.values()) {
    bucket.sort((a, b) => Number(a.id) - Number(b.id));
  }
  return out;
}

/** 一条条目所在族（无同族成员时返回只含自己的长度 1 数组）。 */
export function monsterFamilyOf<T extends MonsterFamilyInput>(
  rows: readonly T[],
  self: MonsterFamilyInput,
): T[] {
  const key = monsterFamilyKey(self);
  return groupMonsterFamilies(rows).get(key) ?? [self as unknown as T];
}

/** 官方图鉴族输入：多一个 `TemplateGroupID`（转换器落为 `atlas_group`，缺位不落键）。 */
export interface MonsterAtlasInput extends MonsterFamilyInput {
  atlas_group?: number | null;
}

/** 官方图鉴族（`TemplateGroupID`）成员 —— 同组全部形态**含自身**，按 id 升序；无组号返回 `[]`。
 *
 * 它是与「同族变体」**并列的第二个维度**：官方组 = 同一图鉴条目的各具名形态（完整 / 幻象 / 错误 /
 * 污染，甚至剧情改名），**比卡面判据更粗**（113 个多成员组里 12 个连卡面图标都不同）⇒ 页面只把
 * 它当「其他形态」互链，绝不拿它当变体序号（那会让两张不同的图互为变体）。
 *
 * **不用 `AtlasSortID` 排序**：实测只有 169/472 有值、113 个多成员组里仅 2 组齐全，拿它当序会让
 * 组内第一项跳到官方位、其余按 id —— 读起来是随机序，故统一按 id。 */
export function atlasFormsOf<T extends MonsterAtlasInput>(
  rows: readonly T[],
  self: MonsterAtlasInput,
): T[] {
  const group = self.atlas_group;
  if (group == null) return [];
  return rows
    .filter((r) => r.atlas_group === group)
    .sort((a, b) => Number(a.id) - Number(b.id));
}
