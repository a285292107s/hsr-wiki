# 崩坏：星穹铁道 富文本标签 / 占位符 完整参考

> 来源：`theBowja/starrail-data` (data/CHS) + `Dimbreath/turnbasedgamedata` (TextMap/ExcelOutput)  
> 整理日期：2026-08-01  
> 状态：**已确认标签** 100% 来自 HSR 实际数据采样；**未确认标签** 标注来源（Genshin 共通推测 / Unity TMP 标准）

---

## 一、样式标签（对用户可见的排版效果）

### `unbreak` — 不换行
**状态**：✅ 已确认（大量出现）

```html
<unbreak>30%</unbreak>            <!-- 数字与单位不拆开 -->
BCI<unbreak>-34</unbreak>型灰质      <!-- 编号与中文文本不拆开 -->
```

**渲染建议**：`<span class="text-nowrap">…</span>` 或 `white-space: nowrap`

### `color` — 文字着色
**状态**：✅ 已确认

```html
<color=#f29e38ff>追加攻击</color>    <!-- 橙金色（属性伤害/增益数值） -->
<color=#8790abff>隐藏</color>        <!-- 灰蓝色（稀有度/系统标签） -->
<color=#6cce9f>2费角色</color>       <!-- 绿色（货币战争费用品质） -->
<color=#7196ff>3费角色</color>       <!-- 蓝色（货币战争费用品质） -->
<color=#b4b4b4>1费角色</color>       <!-- 灰色（货币战争费用品质） -->
<color=#ffc870ff>四阶棋子</color>    <!-- 金色（货币战争棋子阶级） -->
<color=#cdcdd8ff>一阶棋子</color>    <!-- 浅灰（货币战争棋子阶级） -->
```

- 格式：`<color=#RRGGBB>` 或 `<color=#RRGGBBAA>`（6 位或 8 位十六进制）
- 已发现颜色汇总：

| 色值 | 色调 | 用途 |
|------|------|------|
| `#f29e38ff` | 橙金 | 高亮关键机制词/条件（行动、星级、商店、连续行动等） |
| `#8790abff` | 灰蓝 | 稀有度/系统标签 |
| `#6cce9f` | 绿 | 货币战争 2 费角色品质色 |
| `#7196ff` | 蓝 | 货币战争 3 费角色品质色 |
| `#b4b4b4` | 灰 | 货币战争 1 费角色品质色 |
| `#ffc870ff` | 金 | 货币战争四阶棋子/【不可解除】 |
| `#ffca58` | 亮金 | 货币战争大型货物 |
| `#cdcdd8ff` | 浅灰 | 货币战争一阶棋子 |

- **渲染建议**：`<span style="color: #…">…</span>`

### `u` — 下划线（游戏术语标定）
**状态**：✅ 已确认（成就/星魂/技能描述中大量使用）

```html
对<u>弱点击破状态</u>下的敌方目标造成的伤害提高     <!-- 标定游戏机制术语 -->
触发<u>追加攻击</u>后                                  <!-- 标定战斗术语 -->
```

- **用途**：在描述文本中标注游戏机制关键词（类似超链接效果，但不可点击）
- **渲染建议**：`<u>…</u>` 或 `<span class="underline">…</span>`（若 wiki 需要特殊配色可自定义）

### `property` — 内联属性引用（⚠️ 货币战争核心标签）
**状态**：✅ 已确认（货币战争羁绊/技能/装备描述中**大量**使用）

```html
<!-- 单个属性引用（display=all → 显示属性全名文本） -->
【公司】队员的<property type=ExtraBackPowerAddedRatio1 display=all>和<property type=ExtraShieldAddedRatio display=all>提高。

<!-- 相邻属性引用（display=icon → 显示为属性小图标） -->
使<color=#f29e38ff>我方小队</color>的<property type=ExtraFrontPowerAddedRatio1 display=icon><property type=ExtraBackPowerAddedRatio1 display=icon>前/后台强度提高。

<!-- 与数值占位符配合 -->
<unbreak>#1[i]%</unbreak><property type=ExtraFrontPowerAddedRatio1 display=icon><property type=ExtraBackPowerAddedRatio1 display=icon>前/后台强度。
```

- **格式**：`<property type=PropertyTypeName display=icon|all>`
- **⚠️ 无闭合标签**：这是自闭合标签（类似 `<br>`），不包含文本内容
- **`display` 属性**：
  - `display=icon`：游戏内渲染为属性小图标（如剑/盾/靴子图标）
  - `display=all`：游戏内渲染为属性全名文本
- **语义**：在描述文本中内联插入一个属性名称引用。若直接删除会导致描述残缺（如"的和提高"丢失属性名）
- **已发现的 type 值**（去末尾数字后缀）：

| type（去数字后缀） | 友好名称 |
|---|---|
| `ExtraAllDamageTypeAddedRatio` | 全伤害 |
| `ExtraHPAddedRatio` | 生命增幅 |
| `ExtraAttackAddedRatio` | 攻击增幅 |
| `ExtraDefenceAddedRatio` | 防御增幅 |
| `ExtraSpeedAddedRatio` | 速度增幅 |
| `ExtraBackPowerAddedRatio` | 后台强度 |
| `ExtraFrontPowerAddedRatio` | 前台强度 |
| `ExtraShieldAddedRatio` | 护盾量 |
| `ExtraCriticalChanceBase` | 暴击率 |
| `ExtraCriticalDamageBase` | 暴击伤害 |
| `ExtraBreakDamageAddedRatio` | 击破特攻 |
| `ExtraHealAddedRatio` / `ExtraHealRatio` | 治疗量 |
| `ExtraSPAddedRatio` / `ExtraSP` | 战技点 |
| `ExtraInitSP` | 初始战技点 |
| `ExtraMaxSP` | 战技点上限 |
| `ExtraLuckChance` | 幸运触发率 |
| `ExtraLuckDamage` | 幸运伤害 |
| `ExtraQuantumResonance` | 量子共鸣 |
| `ExtraEnergyRatio` | 能量恢复效率 |
| `ExtraUltraDamageAddedRatio` | 终结技伤害 |
| `ExtraInsertDamageAddedRatio` | 追加攻击伤害 |
| `ExtraDOTDamageAddedRatio` | 持续伤害 |
| `ExtraNormalDamageAddedRatio` | 普攻伤害 |
| `ExtraSkillDamageAddedRatio` | 战技伤害 |
| `ExtraElementDamageAddedRatio` | 属性伤害 |
| `ExtraAllDamageReduce` | 伤害减免 |
| `ExtraElationDamageAddedRatio` | 欢愉伤害 |

- **渲染建议**：替换为友好属性名文本（如 `全伤害`、`前/后台强度`）
- **Converter 处理**：`textmap.py → clean_text()` 中通过 `_PROPERTY_LABEL` 映射表替换

### `gridfightinfo` — 实体名称引用（货币战争专用）
**状态**：✅ 已确认（货币战争投资策略/装备描述中使用）

```html
<!-- 引用物品名称 -->
获得#1个【<gridfightinfo type=item id=350106>】。

<!-- 引用角色名称 -->
获得#4个<color=#6cce9f>【<gridfightinfo type=role id=1505>】</color>。
```

- **格式**：`<gridfightinfo type=item|role id=N>` 或 `<gridfightinfo type=item|role id=N/>`
- **⚠️ 无闭合标签**：自闭合标签，运行时替换为对应实体的名称文本
- **`type` 属性**：
  - `type=item`：引用 `GridFightItems.json` 中的物品名称（按 ID 查找）
  - `type=role`：引用 `GridFightRoleBasicInfo.json` → `AvatarConfig` 中的角色名称
- **语义**：跨表实体名称引用，类似 `{TEXTJOIN#id}` 但专用于货币战争模块
- **渲染建议**：构建阶段预处理，替换为实际名称文本
- **Converter 处理**：`currency_catalog.py → _resolve_gridfightinfo()` 在 `clean_text()` 之前执行

---

## 二、动态占位符（运行时替换为用户/上下文相关文本）

> 注意：`<property>` 和 `<gridfightinfo>` 虽也是"运行时替换"，但因其为 HTML 标签形式且语义特殊，已归入第一节。

### `{NICKNAME}` — 开拓者名称
**状态**：✅ 已确认

```
{NICKNAME}的基础速度提高10点
```

- 替换为玩家给开拓者起的名字
- 纯展示型 wiki 可固定替换为「开拓者」「穹/星」
- 开放式 wiki 可保留占位符

### `{F#text}` / `{M#text}` — 性别条件文本
**状态**：✅ 已确认

```
{F#少女}{M#少年}           <!-- loadingtips.json 中的占位 -->
{F#老姐}{M#老哥}           <!-- 短信对话中的称呼变体 -->
```

- `{F#text}` 仅在开拓者选择**女性**时显示
- `{M#text}` 仅在开拓者选择**男性**时显示
- **wiki 渲染建议**：显示两者之一或默认用 `{F#}`，或保留「他/她」

### `{TEXTJOIN#id}` — 跨文本引用
**状态**：✅ 已确认

```
{TEXTJOIN#87}                    <!-- achievements.json, travellogs.json -->
位于{TEXTJOIN#87}的比赛场地       <!-- 引用 TextMap 中 Hash 为 #87 的文本 -->
```

- `id` 是 TextMap Hash，运行时替换为该 Hash 对应的完整文本
- **本质**：跨表文本拼接，构建时需要解析 TextMap 映射
- **wiki 建议**：预处理阶段展开替换，输出静态文本

---

## 三、数值插值占位符（非富文本，但是必须识别）

### `#n[type]%` / `#n[type]`
**状态**：✅ 已确认

```json
{
  "EffectTemplate": "对该目标造成等同于#1[i]%攻击力的火属性伤害，并使其防御力降低#2[f1]%。",
  "Superimpositions": [
    { "Params": [60, 15] }     // #1=60, #2=15
  ]
}
```

| 格式 | 含义 | 示例 |
|------|------|------|
| `#n[i]` | 第 n 个参数，整数 | `#1[i]` → `60` |
| `#n[i]%` | 第 n 个参数，整数百分比 | `#1[i]%` → `60%` |
| `#n[f1]%` | 第 n 个参数，1 位小数百分比 | `#2[f1]%` → `15.0%` |

- `[i]` = integer，`[f1]` = float with 1 decimal → `n.toFixed(1)`
- 数值来自同条目的 `Params` 数组，按 `#n` 的序号索引

---

## 四、换行符（非标签，但处理逻辑不同）

### `\n` / `\\n`
**状态**：✅ 已确认

```
// JSON 中存储为 \\n（转义）
"对指定敌方单体造成等同于三月七#1[i]%攻击力的冰属性伤害。\\n并施加【嘲讽】负面效果，持续#2[i]回合。"

// 短信对话中为原始 \n
"嘿{NICKNAME}，\n最近过得怎么样？"
```

- HSR **不使用** `<br>` 标签，换行全靠 `\n`
- JSON 中是 `\\n`（双反斜杠），`JSON.parse()` 后自动转为 `\n`
- **渲染建议**：CSS `white-space: pre-line` 或 `\n` → `<br>`

---

## 五、货币战争数值占位符的特殊用法

货币战争（GridFight）数据中，`#n[type]%` 占位符与 `<unbreak>` 和 `<property>` 标签组合使用，形成复合结构：

```html
<!-- 数值 + 不换行 + 属性图标 -->
<unbreak>#1[i]%</unbreak><property type=ExtraFrontPowerAddedRatio1 display=icon><property type=ExtraBackPowerAddedRatio1 display=icon>前/后台强度。

<!-- 数值 + 不换行（纯文本上下文） -->
获得<unbreak>#1[i]</unbreak>枚金币。

<!-- 多段数值斜杠分隔 -->
造成<unbreak>#1[i]%</unbreak>/<unbreak>#5[i]%</unbreak>基础伤害的火属性伤害

<!-- 英文名称不换行 -->
<unbreak>Archer</unbreak><color=#f29e38ff>攻击</color>后获得<unbreak>#1[i]</unbreak>点充能

<!-- 数字编号不换行 -->
【银狼LV.<unbreak>999</unbreak>】
```

**⚠️ 重要**：`<unbreak>` 内的 `#n[type]` 仍是数值占位符，不可将 `<unbreak>` 当作"纯装饰标签"直接移除而丢失内部文本。正确做法是保留内容、仅去掉标签包裹。

---

## 六、未在 HSR 数据中确认的标签（来自米哈游共通体系 / Genshin Impact / Unity TMP 推测）

以下标签在**原神 TextMap** 或 **Unity TextMeshPro 标准**中存在，但截至本文档整理时，**在 HSR 数据采样中未出现**。新版本可能引入，建议预留解析代码。

| 标签 | 用途 | 可能性 |
|------|------|--------|
| `<i>…</i>` | 斜体 | 中（通用排版） |
| `<b>…</b>` | 粗体 | 中（通用排版） |
| `<size=n>…</size>` | 字号 | 低（HSR 未用） |
| `<align=left/center/right>…</align>` | 对齐 | 低 |
| `<sprite=name>` | 内联图标/纹章 | 高（原神大量使用，HSR 可能在未采样文件中） |
| `<cspace=n>…</cspace>` | 字间距 | 低 |
| `<sup>…</sup>` | 上标 | 低 |
| `<sub>…</sub>` | 下标 | 低 |
| `{RUBY_B#text}` / `{RUBY_E#text}` | 日文注音（振假名） | 中（日文 TextMap 中需要，中文不需要） |
| `{MATE}_…` | 角色/伙伴名称引用 | 低 |

---

## 七、解析建议（适用 Wiki 构建管线）

### 处理优先级（⚠️ 顺序关键）

```
1. <gridfightinfo> → 替换为实体名称（必须在 clean 之前，否则标签被通用清理删除）
2. #n[type]% 数值占位符 → 从 Params 替换
3. <property type=X display=Y> → 替换为友好属性名
4. <color=...>...</color> → 保留内容或转 HTML span
5. <unbreak>...</unbreak> → 保留内容，加 nowrap
6. <u>...</u> → 保留
7. {NICKNAME} / {F#} / {M#} / {TEXTJOIN#} → 占位符替换
8. \n → <br>
```

### TypeScript 参考实现

```ts
/**
 * 将 HSR 原始富文本编译为 HTML（Wiki 页面可直接渲染）
 */
export function parseHSRRichText(raw: string, params?: number[]): string {
  let html = raw

  // 1. 先处理数值占位符
  if (params) {
    html = html.replace(/#(\d+)\[(.[^\]\]]*)\](%?)/g, (_, n, fmt, pct) => {
      const val = params[parseInt(n) - 1] ?? 0
      const display = fmt === 'f1' ? val.toFixed(1) : `${Math.round(val)}`
      return pct ? `${display}%` : display
    })
  }

  // 2. 换行
  html = html.replace(/\\n/g, '<br>')

  // 3. 实体转义
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // 4. 恢复 HSR 标签（成对）
  html = html
    .replace(/&lt;color=([#0-9A-Fa-f]{6,8})&gt;/g, '<span style="color:$1">')
    .replace(/&lt;\/color&gt;/g, '</span>')
    .replace(/&lt;unbreak&gt;(.*?)&lt;\/unbreak&gt;/g, '<span class="nowrap">$1</span>')
    .replace(/&lt;u&gt;/g, '<u>').replace(/&lt;\/u&gt;/g, '</u>')

  // 5. property 标签（自闭合，无内容）→ 替换为属性名
  html = html.replace(
    /&lt;property\s+type=(\w+)[^&]*&gt;/g,
    (_, t) => PROPERTY_LABEL[t.replace(/\d+$/, '')] ?? t
  )

  // 6. gridfightinfo 标签（应在转义前处理，此处为兜底）
  html = html.replace(
    /&lt;gridfightinfo\s+type=\w+\s+id=\d+\s*\/?&gt;/g,
    '' // 构建阶段应已替换为实际名称
  )

  // 7. 占位符
  html = html
    .replace(/\{NICKNAME\}/g, '开拓者')
    .replace(/\{F#(.*?)\}/g, '$1')   // 简化为女性文本（或根据配置选择）
    .replace(/\{M#(.*?)\}/g, '$1')   // 同上
    .replace(/\{TEXTJOIN#(\d+)\}/g, '[$1]') // 构建时需替换为实际文本

  return html
}

/**
 * 纯文本提取（用于搜索索引/纯文本预览）
 */
export function stripHSRRichText(raw: string): string {
  return raw
    .replace(/<color=[^>]*>/g, '')
    .replace(/<\/color>/g, '')
    .replace(/<property\s+type=(\w+)[^>]*>/g, (_, t) => PROPERTY_LABEL[t.replace(/\d+$/, '')] ?? '')
    .replace(/<gridfightinfo\s+[^>]*>/g, '')  // 构建阶段应已替换
    .replace(/<\/?unbreak>/g, '')
    .replace(/<\/?u>/g, '')
    .replace(/#\d+\[.\][%]?/g, '')
    .replace(/\{NICKNAME\}/g, '开拓者')
    .replace(/\{[FM]#([^}]+)\}/g, '$1')
    .replace(/\{TEXTJOIN#\d+\}/g, '')
    .replace(/\\n/g, ' ')
    .trim()
}
```

### 最小正则集合（给构建脚本用）

```
/<gridfightinfo\s+[^>]*>/g             → 替换为实体名称（最先处理）
/#\d+\[.[^\]\]]*\][%]?/g              → 从 Params 替换
/<property\s+type=(\w+)[^>]*>/g        → 替换为属性名（查映射表）
/<color=[^>]*>|<\/color>/g             → 删/替换
/<\/?unbreak>/g                         → 删（保留内容）
/<\/?u>/g                               → 删
/\{NICKNAME\}/g                         → "开拓者"
/\{[FM]#[^}]+\}/g                       → 性别分支选一
/\{TEXTJOIN#\d+\}/g                     → 跨表替换
/\\n/g                                  → <br>
```

---

## 八、与 Wiki 渲染流程的整合位置

```
ExcelOutput  +  TextMap  +  Params[]
     │              │            │
     ▼              ▼            ▼
  取值          取中文        取数值
     │              │            │
     └──────┬───────┴────────────┘
            ▼
     交叉编译 → 展开 TEXTJOIN
            │
            ▼
     ① resolve_gridfightinfo()  ← 实体名替换（最先）
            │
            ▼
     ② parseHSRRichText()       ← 标签 → HTML
            │
            ▼
      HTML / 纯文本 →  Wiki 页面
```

---

## 九、标签分类速查表

| 标签 | 类型 | 闭合 | 数据域 | 处理方式 |
|------|------|------|--------|----------|
| `<color=#hex>` | 样式 | ✅ 成对 | 全局 | 保留内容/转 span |
| `<unbreak>` | 样式 | ✅ 成对 | 全局 | 保留内容/加 nowrap |
| `<u>` | 样式 | ✅ 成对 | 全局 | 保留 |
| `<property type=X display=Y>` | 引用 | ❌ 自闭合 | 货币战争 | 替换为属性名 |
| `<gridfightinfo type=X id=N>` | 引用 | ❌ 自闭合 | 货币战争 | 替换为实体名 |
| `#n[type]%` | 数值 | — | 全局 | 从 Params 插值 |
| `{NICKNAME}` | 占位 | — | 全局 | 替换为"开拓者" |
| `{F#}/{M#}` | 占位 | — | 全局 | 性别分支 |
| `{TEXTJOIN#id}` | 占位 | — | 全局 | 跨表文本拼接 |
| `\n` | 换行 | — | 全局 | → `<br>` |
