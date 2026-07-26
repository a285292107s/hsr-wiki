# 崩坏：星穹铁道 富文本标签 / 占位符 完整参考

> 来源：`theBowja/starrail-data` (data/CHS) + `Dimbreath/turnbasedgamedata` (TextMap/ExcelOutput)  
> 整理日期：2026-07-27  
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
```

- 格式：`<color=#RRGGBB>` 或 `<color=#RRGGBBAA>`
- 已发现颜色：`#f29e38ff`（橙金）、`#8790abff`（灰蓝），可能还有更多战斗属性色（物理灰、火红、冰蓝、雷紫、风绿、量子蓝紫、虚数黄）
- **渲染建议**：`<span style="color: #…">…</span>`

### `u` — 下划线（游戏术语标定）
**状态**：✅ 已确认（成就/星魂/技能描述中大量使用）

```html
对<u>弱点击破状态</u>下的敌方目标造成的伤害提高     <!-- 标定游戏机制术语 -->
触发<u>追加攻击</u>后                                  <!-- 标定战斗术语 -->
```

- **用途**：在描述文本中标注游戏机制关键词（类似超链接效果，但不可点击）
- **渲染建议**：`<u>…</u>` 或 `<span class="underline">…</span>`（若 wiki 需要特殊配色可自定义）

---

## 二、动态占位符（运行时替换为用户/上下文相关文本）

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

## 五、未在 HSR 数据中确认的标签（来自米哈游共通体系 / Genshin Impact / Unity TMP 推测）

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

## 六、解析建议（适用 Wiki 构建管线）

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

  // 5. 占位符
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
/<color=[^>]*>|<\/color>/g          → 删/替换
/<\/?unbreak>/g                      → 删
/<\/?u>/g                            → 删
/#\d+\[.[^\]\]]*\][%]?/g              → 从 Params 替换
/\{NICKNAME\}/g                      → "开拓者"
/\{[FM]#[^}]+\}/g                    → 性别分支选一
/\{TEXTJOIN#\d+\}/g                  → 跨表替换
/\\n/g                               → <br>
```

---

## 7. 与 Wiki 渲染流程的整合位置

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
     parseHSRRichText()
            │
            ▼
      HTML / 纯文本 →  Wiki 页面
```
