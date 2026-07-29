# CONTEXT.md — 项目术语表

> 本文件是 HSR Wiki 项目的术语表（glossary），仅定义术语，不含实现细节。

## 数据源相关

### 源数据（Source Data）
`DimbreathBot/TurnBasedGameData` 仓库的原始解包 JSON，位于 `vendor/TurnBasedGameData/` 的 `ExcelOutput/`、`TextMap/`、`Config/` 目录。结构复杂、字段冗余，无法直接供网站消费。

### 目标格式（Target Format）
`Mar-7th/StarRailRes` 仓库定义的索引 JSON 格式，按 `public/data/[lang]/` 组织，结构扁平、字段精简。是本工具的输出格式标准。

### 转换工具（Converter）
将源数据转换为目标格式的 Python 脚本，位于 `tools/converter/`。读源数据 → 输出纯净 JSON。

### TextMap
源数据中的文本本地化映射表。key 为字符串形式的 xxhash64 哈希值，value 为对应语言的文本。简中版本为 `TextMap/TextMapCHS.json`。

### Hash 引用
源数据中引用 TextMap 的方式，有两种形式：
- **Hash 对象**：`{ "Hash": 6186714091647966180 }`，需转字符串后查 TextMap
- **字面量字符串**：`"AvatarRankName_100101"`，直接作为 key 查 TextMap

### 数值包装（Value Wrapper）
源数据中所有数值字段都包装为 `{ "Value": <number> }` 结构，转换时需递归扁平化为纯数字。

## 数据分类

### 索引级数据（Index Data）
第一期产出的基础索引数据，满足列表页和基础展示需求。不含详细数值表。

### 详情级数据（Detail Data）
第二期产出的详细数值数据，包括角色晋阶属性、行迹树、技能等级数值等。第一期跳过。

## 枚举规范

### 命途（Path）
角色的战斗定位，英文标识 + 中文名称。如 `Knight`=存护、`Warrior`=毁灭、`Rogue`=巡猎等。源数据文件：`AvatarBaseType.json`。

### 属性（Element / DamageType）
角色的伤害属性，英文标识 + 中文名称。如 `Physical`=物理、`Fire`=火、`Ice`=冰等。源数据文件：`DamageType.json`。

### 部位（Relic Type）
遗器的装备位置，英文标识。HEAD=头部、HAND=手部、BODY=躯干、FOOT=脚部、NECK=位面球、OBJECT=连结绳。

# 导航与模式

### 交换（Swap）
导航首项按钮，用于在常规模式与货币战争模式之间切换。点击后跳转至对方模式的枢纽页。标签固定为"交换"，附双色状态点指示当前所在模式（紫=常规，金=货币战争）。
_Avoid_: 切换、模式开关

### 常规模式（Normal Mode）
站点默认模式。紫色调主题，导航为 7 个内容板块（角色、光锥、遗器、物品、成就、敌对物种、终局内容），枢纽页为 `/`。
_Avoid_: 主模式、普通模式

### 货币战争模式（Currency War Mode / CW 模式）
独立路由树（`/currency/*`）下的沉浸式模式。黑底暗金全壳主题，导航为 5 个子板块（角色图鉴、装备图鉴、投资环境、投资策略、羁绊图鉴），枢纽页为 `/currency`。
_Avoid_: 货币战争栏目、CW 页面

### 枢纽页（Hub）
一个模式的着陆页与身份页。「交换」的落地目标。常规模式枢纽页为 `/`（HomeView），货币战争模式枢纽页为 `/currency`（CurrencyHubView）。
_Avoid_: 首页、入口页

## 图片资源

### 图片 CDN
现有 `https://static.nanoka.cc` 的图片资源，转换工具不改动 CDN，只输出相对路径，前端拼接 CDN 前缀。

### 图片路径映射
源数据图片路径（如 `SpriteOutput/AvatarIcon/Avatar/1001.png`）到目标相对路径（如 `icon/character/1001.png`）的映射规则，在转换工具中硬编码。
