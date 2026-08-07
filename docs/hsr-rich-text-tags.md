# 崩坏：星穹铁道 富文本标签 / 占位符 完整参考

> 来源：`Dimbreath/turnbasedgamedata`（TextMapCHS.json + ExcelOutput）
> 整理日期：2026-08-07（全量扫描修订）
> 统计口径：全量扫描 `TextMapCHS.json`（449,615 条文本）+ 引用字段溯源（ExcelOutput 全表），非抽样。
> 状态：**已确认标签**均附全量出现次数；**确认未出现**标签基于全量扫描结论。
> 新增标签 / 修订本文档的流程见**第九节**。

---

## 一、样式标签（对用户可见的排版效果）

### `unbreak` — 不换行
**状态**：✅ 已确认（41,658 次）

```html
<unbreak>30%</unbreak>            <!-- 数字与单位不拆开 -->
BCI<unbreak>-34</unbreak>型灰质      <!-- 编号与中文文本不拆开 -->
```

本仓库前端 `gameTagsToHtml()` 转 `<span class="nowrap">`。

### `color` — 文字着色
**状态**：✅ 已确认（40,138 次，6 位或 8 位十六进制）

> 本标签为**数据承载色**（ADR 0012）：颜色来自游戏数据本身，运行时透传 inline style，不参与令牌体系与双色约束，已登记 check-colors 豁免。

```html
<color=#f29e38ff>追加攻击</color>    <!-- 全局机制/数值高亮 -->
<color=#6cce9f>2费角色</color>       <!-- 货币战争费用品质 -->
```

- 格式：`<color=#RRGGBB>` 或 `<color=#RRGGBBAA>`
- 语义明确的色值（全量扫描）：

| 色值 | 次数 | 说明 |
|------|------|------|
| `#f29e38ff`（及 6 位变体 `#f29e38`） | 30,828 / 153 | 全局机制词/数值高亮（技能、成就、书籍、货币战争通用） |
| `#8790abff` | 454 | 稀有度/系统标签 |
| `#b4b4b4` / `#6cce9f` / `#7196ff` | 98 / 60 / 50 | 货币战争 1 / 2 / 3 费角色品质色 |
| `#ffc870ff` / `#cdcdd8ff` / `#ffca58` | 合计 58（含变体） | 货币战争四阶棋子 / 【不可解除】、一阶棋子、大型货物 |

> 完整色值共 100+ 种（次高为 `#dbc291ff` 3,542、`#9e5738` 562 等），多为书籍、活动、成就的局部着色，用途未逐色审计——数据承载色无需令牌化，透传即可。

### `u` — 下划线（游戏术语标定）
**状态**：✅ 已确认（6,778 对）

```html
对<u>弱点击破状态</u>下的敌方目标造成的伤害提高     <!-- 标定游戏机制术语 -->
<u>超载</u>                                          <!-- 标定技能/状态名 -->
```

本仓库：converter 剥离、前端 `gameTagsToHtml()` 保留。

### `i` — 斜体（书籍引言/注释）
**状态**：✅ 已确认（5,847 次）

```html
<i><color=#9e5738>「那只是杀戮，毫无荣耀可言。」</color></i>
```

书籍对白/引言、成就注释小字，常与 `<color>`、`\n` 组合。本仓库前端按未知标签剥离（内容保留）。

### `b` — 粗体（强调）
**状态**：✅ 已确认（1,441 次）

```html
<b>8:<unbreak>00</unbreak></b>           <!-- 时间段强调 -->
<b>完成每个衣匠对应的若虫预言谜题后获得…</b>  <!-- 提示语 -->
```

本仓库前端按未知标签剥离（内容保留）。

### `size` — 字号（相对值）
**状态**：✅ 已确认（1,201 次）

```html
<i><size=-2>你是说，那个结课率堪比…</size></i>   <!-- 相对缩小 2 号 -->
<size=+2>前言：鼹鼠队的冒险窍门</size>             <!-- 相对放大 2 号 -->
```

- 格式：`<size=±n>`，HSR 数据中仅见**相对值**（`-2` / `+2`），未见绝对值
- 书籍对白小字、章节标题。本仓库前端按未知标签剥离（内容保留）

### `align` — 对齐
**状态**：✅ 已确认（3,835 次）

```html
<align="right">——黑塔，天才俱乐部#83号会员</align>   <!-- 署名右对齐 -->
```

格式：`<align="left|center|right">`（数据中带引号），用于书籍署名右对齐、章节标题居中。本仓库前端按未知标签剥离（内容保留）。

### `icon` — 内联图标（⚠️ 核心标签）
**状态**：✅ 已确认（2,506 次）

```html
<unbreak><icon SpriteName=ActivityDiceCombat15 id=0 width=1 height=1>#1</unbreak>
```

- **格式**：`<icon SpriteName=X id=N width=W height=H>`（自闭合，2,501 次）；少数变体 `SpritePath=X id=N Height=N color=X`（5 次）
- **分布**：活动技能（PixAir 302 / ChimeraDuel 194+194 / ActivityDice 102+86）、**角色技能 AvatarSkillConfig.SkillDesc/SimpleSkillDesc（15+15）**、邮件/商店（Recharge 50+30）、成就等
- **⚠️ 现状**：converter `clean_text()` 会剥离未知标签，但角色技能 desc 走 `clean=False` 保留原始标签——`<icon>` 会**残留**进 `public/data/cn/characters/*.json`（当前 2 个角色 5 处，如 1415/1510）；前端 `gameTagsToHtml()` 按未知标签剥离（图标丢失、数值保留）。若需还原图标需在渲染层按 SpriteName 映射

### `property` — 内联属性引用（⚠️ 货币战争核心标签）
**状态**：✅ 已确认（520 次，display=icon 349 / display=all 171）

```html
<!-- display=all → 属性全名文本 -->
【公司】队员的<property type=ExtraBackPowerAddedRatio1 display=all>和<property type=ExtraShieldAddedRatio display=all>提高。

<!-- 相邻引用 display=icon → 属性小图标，后跟共享标签 -->
使<color=#f29e38ff>我方小队</color>的<property type=ExtraFrontPowerAddedRatio1 display=icon><property type=ExtraBackPowerAddedRatio1 display=icon>前/后台强度提高。
```

- 格式：`<property type=PropertyTypeName display=icon|all>`，**自闭合**，不包含文本内容
- **语义**：内联插入属性名称引用。直接删除会导致描述残缺（如"的和提高"丢失属性名）
- **type 值**：数据中实际出现的 17 种（按次数）：

| type | 次数 | 友好名称 |
|---|---|---|
| `ExtraBackPowerAddedRatio1` | 104 | 后台强度 |
| `ExtraFrontPowerAddedRatio1` | 100 | 前台强度 |
| `ExtraAllDamageTypeAddedRatio1` | 81 | 全伤害 |
| `ExtraQuantumResonance` | 60 | 量子共鸣 |
| `ExtraSpeedAddedRatio1` | 41 | 速度增幅 |
| `ExtraLuckChance` | 25 | 幸运触发率 |
| `ExtraElementDamageAddedRatio1` | 20 | 属性伤害 |
| `ExtraInsertDamageAddedRatio1` | 16 | 追加攻击伤害 |
| `ExtraHealAddedRatio` | 14 | 治疗量 |
| `ExtraHPAddedRatio1` | 14 | 生命增幅 |
| `ExtraLuckDamage` | 12 | 幸运伤害 |
| `ExtraShieldAddedRatio` | 8 | 护盾量 |
| `ExtraUltraDamageAddedRatio1` | 8 | 终结技伤害 |
| `ExtraAllDamageReduce` | 6 | 伤害减免 |
| `ExtraDOTDamageAddedRatio1` | 5 | 持续伤害 |
| `ExtraInitSP` | 4 | 初始战技点 |
| `ExtraElationDamageAddedRatio1` | 2 | 欢愉伤害 |

> `textmap.py → _PROPERTY_LABEL` 另有防御性预置映射（数据中未出现，如 `ExtraAttackAddedRatio`、`ExtraStatusProbabilityBase`、`ExtraShieldRatioBase` 等，防新版本引入），见源码。

- **本仓库处理**：`textmap.py → clean_text()` 通过 `_PROPERTY_LABEL` 替换；相邻 property 组由 `_process_adjacent_properties()` 去重/合并（后续文本已含属性名则删标签，否则以 `/` 连接）

### `gridfightinfo` — 实体名称引用（货币战争专用）
**状态**：✅ 已确认（334 次：type=item 193 / type=role 141）

```html
获得#1个【<gridfightinfo type=item id=350106>】。
获得#4个<color=#6cce9f>【<gridfightinfo type=role id=1505>】</color>。
```

- 格式：`<gridfightinfo type=item|role id=N>` 或 `<gridfightinfo type=item|role id=N/>`，**自闭合**
- `type=item`：引用 `GridFightItems.json` 物品名称（如 99999 武装箱）；`type=role`：引用 `GridFightRoleBasicInfo.json` → `AvatarConfig(+LD).json` 角色名称
- **实际分布**：仅两个字段——`GridFightAugment.json → HexDesc`（约 150 条）与 `GridFightPrayQuest.json → PrayDesc`（12 条）。**不出现在装备描述中**
- **本仓库处理**：`currency_catalog.py → _resolve_gridfightinfo()` 在 `clean_text()` 之前执行（仅 Augment 接入；PrayQuest 无转换模块，标签保留在原始数据）

---

## 二、动态占位符（运行时替换为用户/上下文相关文本）

> `<property>`、`<gridfightinfo>`、`<icon>` 虽也是"运行时替换"，但为 HTML 标签形式，已归入第一节。

### `{NICKNAME}` — 开拓者名称
**状态**：✅ 已确认（7,102 次）

```
{NICKNAME}的基础速度提高10点
```

本仓库 converter 与前端均替换为「开拓者」。

### `{F#text}` / `{M#text}` — 性别条件文本
**状态**：✅ 已确认（{F#} 2,356 次 / {M#} 2,355 次）

```
{F#老姐}{M#老哥}           <!-- 短信对话中的称呼变体 -->
```

- `{F#text}` 仅女性开拓者显示；`{M#text}` 仅男性显示；实际文本全部为称呼词（小姐/女士/老姐/老哥/小子等）
- 本仓库取 `{F#}` 文本

### `{TEXTJOIN#id}` — 跨文本引用
**状态**：✅ 已确认（1,277 次）

```
{TEXTJOIN#87}
```

- **⚠️ 解析机制（易误解）**：`id` **不是** TextMap Hash，而是 `TextJoinConfig.json → TextJoinID` 配置键。解析链：
  `{TEXTJOIN#id}` → `TextJoinConfig.DefaultItem` → `TextJoinItem.json`（`TextJoinItemID`）→ `TextJoinText`（**该字段才是 TextMap Hash**）→ TextMap 文本
- `TextJoinItemList` 含性别/命名等多形态变体，默认取 `DefaultItem`
- **本仓库处理**：`achievements.py → _expand_textjoin()` 构建期展开（输出数据已无残留，验证 0 处）；无对应配置时保留原占位符

### `{SPACE}` — 空格
**状态**：⚠️ 中文 TextMap 未出现（0 次）；其他语言 TextMap（DE/EN 等）共 2,920 行使用

中文数据当前不使用；converter `clean_text()` 与前端 `gameTagsToHtml()` 仍保留处理（防御多语言/未来版本）。

### `{RUBY_B#text}` / `{RUBY_E#text}` — 注音（振假名）
**状态**：✅ 已确认（中文 TextMap 2,088 对，非日文专属！）

```
{RUBY_B#死亡}塞纳托斯{RUBY_E#}
```

- `{RUBY_B#X}` 标记注音开始（X 为注音文本），`{RUBY_E#}` 结束（无内容）
- 剧情/读书文本中的生僻词注音；中文 wiki 直接移除——本仓库 converter 与前端均移除

---

## 三、数值插值占位符（非富文本，但是必须识别）

### `#n[type]%` / `#n[type]` / 裸 `#N`
**状态**：✅ 已确认（`#n[...]` 32,170 次；裸 `#N` 7,677 次）

```json
{
  "EffectTemplate": "对该目标造成等同于#1[i]%攻击力的火属性伤害，并使其防御力降低#2[f1]%。",
  "Superimpositions": [
    { "Params": [0.6, 0.15] }     // #1=0.6 → 60%, #2=0.15 → 15.0%
  ]
}
```

| 格式 | 含义 | 示例 |
|------|------|------|
| `#n[i]` | 第 n 个参数，整数（数值型参数） | `#1[i]` → `7`（"获得#1[i]枚金币"） |
| `#n[i]%` | 第 n 个参数，整数百分比 | `#1[i]%` → `60%` |
| `#n[f1]%` | 第 n 个参数，1 位小数百分比 | `#2[f1]%` → `15.0%` |
| `#n[f2]` / `#n[f0]` | 2 位 / 0 位小数 | `#n[f2]`（35 次）、`#n[f0]`（5 次） |
| `#n[m]` | 百万单位（粉丝数等） | `#1[m]` → `12`（3 次，如 `<unbreak>#1[m]</unbreak>粉丝`） |
| `#N`（裸） | 无格式直接插值 | `#3倍` → `3倍`、`#2金币` → `2金币`（7,677 次） |

- ⚠️ **参数值域（关键）**：带 `%` 的参数均为**比率**（0.6 表示 60%），渲染必须**乘 100**；不带 `%` 的参数为数值（金币、次数等）直接显示
- **格式分布**（全量）：`[i]` 30,963 / `[f1]` 1,164 / `[f2]` 35 / `[f0]` 5 / `[m]` 3
- 数值来自同条目的 `Params`/`param_list` 数组，按 `#n` 序号索引
- **本仓库实现**：`format.ts → fmtVal()`：`%` 乘 100、`i` 取整、`f1`~`f6` 保留小数、其余回退整数；`fmtDesc()` 先转标签再插值并包 `<span class="hl">`

---

## 四、换行符（非标签，但处理逻辑不同）

### `\n` / `\n\n`
**状态**：✅ 已确认（70,264 处 `\n` 序列）

```
"对指定敌方单体造成等同于三月七#1[i]%攻击力的冰属性伤害。\n并施加【嘲讽】负面效果，持续#2[i]回合。"
```

- ⚠️ **存储机制**：TextMap JSON 文件中为转义序列 `\\n`，`JSON.parse()` 后是**字面 2 字符**（反斜杠 + n），**不是换行符**；游戏引擎/渲染层将其解释为换行。converter 输出 JSON 中同样保留这 2 字符（再次转义为 `\\n`）
- HSR **不使用** `<br>` 标签（全量扫描 0 次）；书籍/剧情文本常见 `\n\n` 段落分隔
- **本仓库处理**：前端 `fmtDesc()` 对 `\n` 与真实换行统一替换为 `<br>`

---

## 五、货币战争复合结构

货币战争（GridFight）文本中 `#n[type]%` 常与 `<unbreak>`、`<color>`、`<property>` 嵌套组合（以下均为实际数据）：

```html
<!-- 数值 + 着色 + 不换行（三层嵌套） -->
若敌方目标当前生命值百分比小于（<color=#f29e38ff><unbreak>#1[i]%</unbreak></color>+…）

<!-- 英文名称 / 数字编号不换行 -->
<unbreak>Archer</unbreak><color=#f29e38ff>攻击</color>后获得<unbreak>#1[i]</unbreak>点充能
【银狼LV.<unbreak>999</unbreak>】

<!-- 图标 + 数值（活动技能） -->
<unbreak><icon SpriteName=ActivityDiceCombat15 id=0 width=1 height=1>#1</unbreak>
```

**⚠️ 重要**：`<unbreak>` 内的 `#n[type]` 仍是数值占位符，不可把 `<unbreak>` 当"纯装饰标签"直接移除而丢失内部文本。正确做法是保留内容、仅去掉标签包裹。

---

## 六、确认未出现的标签（全量扫描结论）

以下标签基于 TextMapCHS 全量扫描（449,615 条）**确认 0 次**，不来自抽样遗漏：

| 标签 | 用途 | 结论 |
|------|------|------|
| `<sprite=name>` | 内联图标 | ❌ 未出现——HSR 的图标标签是 `<icon SpriteName=...>`（见第一节） |
| `<cspace=n>…</cspace>` | 字间距 | ❌ 未出现 |
| `<sup>…</sup>` / `<sub>…</sub>` | 上标 / 下标 | ❌ 未出现 |
| `<br>` | 换行 | ❌ 未出现——换行统一用 `\n` |

---

## 七、本仓库解析管线（处理位置速查）

```
ExcelOutput + TextMap + Params[] → converter（Python）→ public/data/cn/*.json → 前端渲染（TypeScript）→ HTML
```

### 构建期（converter，`tools/converter/`）

1. `{TEXTJOIN#id}` 展开——`achievements.py → _expand_textjoin()`（TextJoinConfig 链，仅 achievements 模块）
2. `<gridfightinfo>` 实体名替换——`currency_catalog.py → _resolve_gridfightinfo()`（**先于 clean_text**，仅 Augment）
3. `clean_text()`（`textmap.py`）：`{NICKNAME}`→开拓者、`{SPACE}`→空格、`{RUBY_*}`→移除、`<property>`→友好名（`_PROPERTY_LABEL` + `_process_adjacent_properties`）、`<color>`/`<unbreak>` 剥离保留内容、其余未知标签剥离
4. 角色/光锥/遗器技能 desc 走 `clean=False`（`character_detail` 等）：保留 `<unbreak>`/`<u>`/`<color>`/`#n`，交给前端渲染

### 渲染期（前端，`src/lib/`）

- `html.ts → gameTagsToHtml()`：占位符替换（`{NICKNAME}`/`{F#}`/`{M#}`/`{RUBY_*}`/`{SPACE}`/`{TEXTJOIN#}`）→ 成对 `color`/`unbreak` 转 span（先转 `\x01/\x02` 占位符避免误伤）→ 剥离孤立/未知标签（保留 `<u>`，`<icon>` 无映射剥离保内容）
- `html.ts → stripTags()`：纯文本（搜索索引 / diff）
- `format.ts → fmtVal()`：`%` 乘 100、`i` 取整、`f1`~`f6` 保留小数、其余回退整数
- `format.ts → fmtDesc()` / `fmtDescMerged()`：标签转 HTML 后 `#n` 插值（含裸 `#N`，包 `<span class="hl">`）→ `\n` → `<br>`（合并模式多星级值以 `/` 分隔）

> 处理顺序关键点：占位符 → 成对标签转 span → 剥离残余 → 数值插值 → 换行，顺序颠倒会导致转义或插值失效。

---

## 八、标签分类速查表

| 标签 | 类型 | 闭合 | 出现次数 | 数据域 | 处理方式 |
|------|------|------|---------|--------|----------|
| `<color=#hex>` | 样式 | ✅ 成对 | 40,138 | 全局 | 保留内容/转 span（数据承载色） |
| `<unbreak>` | 样式 | ✅ 成对 | 41,658 | 全局 | 保留内容/加 nowrap |
| `<u>` | 样式 | ✅ 成对 | 6,778 | 全局 | 保留（术语标定） |
| `<i>` | 样式 | ✅ 成对 | 5,847 | 书籍/成就 | 剥离保内容 |
| `<b>` | 样式 | ✅ 成对 | 1,441 | 全局 | 剥离保内容 |
| `<size=±n>` | 样式 | ✅ 成对 | 1,201 | 书籍 | 剥离保内容 |
| `<align="…">` | 样式 | ✅ 成对 | 3,835 | 书籍 | 剥离保内容 |
| `<icon SpriteName=X>` | 引用 | ❌ 自闭合 | 2,506 | 活动/角色技能 | 剥离保内容（现状）；可映射图标 |
| `<property type=X display=Y>` | 引用 | ❌ 自闭合 | 520 | 货币战争 | 替换为属性名 |
| `<gridfightinfo type=X id=N>` | 引用 | ❌ 自闭合 | 334 | 货币战争 | 替换为实体名 |
| `#n[type]%` | 数值 | — | 32,170 | 全局 | 从 Params 插值（% 乘 100） |
| `#N`（裸） | 数值 | — | 7,677 | 全局 | 从 Params 插值 |
| `{NICKNAME}` | 占位 | — | 7,102 | 全局 | 替换为"开拓者" |
| `{F#}/{M#}` | 占位 | — | 2,356/2,355 | 全局 | 性别分支 |
| `{TEXTJOIN#id}` | 占位 | — | 1,277 | 全局 | 构建期展开（TextJoinConfig 链） |
| `{RUBY_B#}/{RUBY_E#}` | 占位 | — | 2,088 对 | 剧情/读书 | 中文移除 |
| `{SPACE}` | 占位 | — | 中文 0 | 多语言 | → 空格 |
| `\n` | 换行 | — | 70,264 | 全局 | → `<br>` |

---

## 九、维护流程（新增标签 / 修订本文档）

> 原则：一切结论以**实际数据验证**为准，不凭猜测写文档；出现次数一律来自全量扫描，不写抽样估计。

### 触发场景

- `vendor/TurnBasedGameData` 子模块更新（新版本数据）后，可能出现新标签/新占位符格式
- 渲染异常：页面出现未转换的 `<...>` 文本、或标签被剥离后内容残缺（如 `<icon>` 图标丢失）
- 发现本文档描述与数据/代码行为不符

### 验证三步法

**① 快速定位（有嫌疑字符串时）**

```bash
cd tools/converter
python query.py --search "<icon"        # TextMap 全文搜索（SQLite 缓存，<1ms）
python query.py GridFightAugment --grep "<property"   # 在 ExcelOutput 表中定位引用
```

**② 全量统计（确认出现次数，替代抽样）**

`TextMapCHS.json` 为逐行一条的格式化 JSON（约 50MB），流式扫描即可，**不要整体加载**：

```python
import json, re, collections
pat = re.compile(r"<新标签")
cnt = collections.Counter()
with open("vendor/TurnBasedGameData/TextMap/TextMapCHS.json", encoding="utf-8") as f:
    for line in f:
        line = line.strip().rstrip(",")
        if not line or line in ("{", "}"):
            continue
        val = next(iter(json.loads("{" + line + "}").values()))
        if isinstance(val, str):
            cnt.update(m.group(1) for m in pat.finditer(val))
print(cnt)
```

**③ 字段溯源（判断影响面）**：收集含该标签的 TextMap Hash 集合，遍历 ExcelOutput 全表找引用字段（`{ "Hash": N }` 模式），确定它出现在哪些模块（角色技能 / 货币战争 / 活动），据此决定是否需要 converter 或前端处理。

**判定标准**：全量扫描 > 0 次即"已确认"；0 次列入第六节"确认未出现"。注意排除误匹配（正则边界、转义序列）。

### 更新文档的一致性检查清单

新增或修订一个标签时，以下位置必须同步，缺一即为文档不一致：

1. **头部状态行**：修订日期与口径说明（如"2026-08-07 全量扫描修订"）
2. **对应小节**（第一/二/三节）：格式、示例、出现次数、分布字段、本仓库处理现状
3. **第八节速查表**：新增行，或修订该行的出现次数 / 处理方式
4. **第六节**：若标签此前列为"确认未出现"，确认出现后必须移除
5. **第七节管线**：若处理逻辑变化（converter / 前端函数行为变更），同步更新

### 同步代码（按影响面）

| 标签需处理的位置 | 修改点 | 测试 |
|---|---|---|
| converter 清洗 | `textmap.py → clean_text()` / `_PROPERTY_LABEL`（或对应模块） | `tools/converter/tests/`（pytest） |
| 前端渲染 | `src/lib/html.ts → gameTagsToHtml()` / `stripTags()` | `src/lib/__tests__/format.test.ts` |
| 新参数格式 `[tag]` | `src/lib/format.ts → fmtVal()` | 同上 |
| 新占位符 | converter 与前端两处（先确认该字段是否走 `clean=False`） | 两处测试 |

> 角色技能 desc 走 `clean=False` 保留原始标签——新标签若出现在此路径，converter 不会清洗，由前端 `gameTagsToHtml()` 剥离；若需保留渲染（如 `<icon>` 图标），在前端按 SpriteName 映射。

### 回归验证（全部通过后方可提交）

```bash
cd tools/converter && python -m pytest tests/ -v   # converter 单测
pnpm build                                          # vue-tsc 类型检查 + 生产构建
pnpm test                                           # 前端单测
# 重扫 public/data/cn：残留/无残留应符合预期（如角色数据中的 <icon> 残留）
```
