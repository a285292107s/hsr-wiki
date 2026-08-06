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

### TextMap SQLite 缓存
`tools/converter/textmap_db.py` 将 TextMapCHS.json 预建为本地 SQLite 索引（`.textmap-cache.db`，已 gitignore），供 `query.py --resolve/--search` 使用。基于源文件 mtime_ns:size 签名自动检测失效并重建。仅服务开发查询路径，不影响 convert.py 生产转换。

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

### 技能标签（Skill Tag）
技能卡片头部显示的官方中文标签（如「单攻」「群攻」「召唤」），来自源数据 `AvatarSkillConfig.SkillTag`（Hash 引用），由转换器解析后直接输出中文文本，前端直显（不映射）。与技能效果枚举 `SkillEffect`（英文类型标识，如 SingleAttack）语义不同：前者是官方展示文案，后者是逻辑分类——常规模式与货币战争模式均以官方 SkillTag 为唯一数据源（见 ADR 0008）。
_Avoid_: 技能效果、SkillEffect 标签

## 数据筛选

### 字段价值审计（Field Value Audit）
系统性评估源数据字段是否应进入转换器输出的流程：AI 为每个字段生成解读卡，人工裁决价值分级，三道闸门防止 AI 误判。流程见 `docs/audit/字段价值审计流程.md`。

### 解读卡（Interpretation Card）
审计的最小工作单元：单个源字段的「字段名 → 人话语义 → 证据 → 置信度 → 价值建议」五元组。AI 只负责生成解读卡，价值判定权归人工。

### 价值分级（Value Grading）
字段的收录裁决标准，共四档：🟢 必收（玩家可见、wiki 应展示，已输出或应输出）、🟡 可选（有价值但展示形态待定，进存疑表）、🔴 排除（内部字段或无区分度，不输出）、⚪ 待定（证据不足，需游戏内 UI 确认）。

### 字段基线（Field Baseline）
判断「字段是否值得收录」的参照格式，来源为 Mar-7th/StarRailRes 仓库的索引 JSON（如 `character_skills.json`）。「基线有、本地无」的字段自动升级为 ⚪ 待定，除非有明确的有意排除理由（如引用 ADR）。

### 引用站（Reference Site）
用于「对玩家有价值」语义校准的外部站点。**权威基准为米游社官方 wiki（bbs.mihoyo.com/sr/wiki）**——官方展示的内容即官方认定的玩家可见且有价值数据；hsr.nanoka.cc 等民间站仅作补充。米游社 wiki 为 JS 动态渲染，WebFetch 无法读取内容，必须用浏览器工具（browser-use）抓取渲染后页面。图片资源存在性（CDN 不可枚举）以引用站实际请求过的路径为准，禁止猜测路径。

## 导航与模式

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

## 角色强化

### 角色强化（Character Enhancement）
官方「砺烁新辉」系统（3.4+）对老角色的机制增强。注册于源数据 `AvatarConfigEnhanced.json`（当前 10 个角色），强化后技能、行迹、星魂效果变化。常规模式角色详情页可切换原始/强化状态，默认显示强化（与游戏内默认开启一致）。
_Avoid_: 角色加强、进阶、Advanced

### 强化形态（Enhanced Form）
开启角色强化后的数据形态：技能/行迹/星魂/`sp_need` 全部为加强版数值，由 `enhanced` 包整体覆盖渲染。
_Avoid_: 加强版、强化版

### 强化摘要（Enhancement Summary）
`AvatarEnhancedHintConfig.json` 的 `EnhancedDesc1-3` 要点文本，页面展示为吸顶工具条下方的「强化内容」横幅，保留官方 `<color>` 橙色强调词。
_Avoid_: 加强概述、强化内容描述

### 强化角标（Enhancement Badge）
强化模式下标记「被强化」技能卡/星魂卡的金色角标，由 `AvatarConfigEnhanced.json` 的 `SkillList`/`RankIDList` 驱动，随 `enhanced` 包输出。
_Avoid_: 强化标记、强化徽章

## 图片资源

### 图片 CDN
现有 `https://static.nanoka.cc` 的图片资源，转换工具不改动 CDN，只输出相对路径，前端拼接 CDN 前缀。

### 图片路径映射
源数据图片路径（如 `SpriteOutput/AvatarIcon/Avatar/1001.png`）到目标相对路径（如 `icon/character/1001.png`）的映射规则，在转换工具中硬编码。

## 动画资源

### Spine 动画源（Spine Source）
角色骨骼动画的资源提供方，共两类：**nanoka 源**（`static.nanoka.cc`，`.skel` 二进制骨架，Spine 4.1.23）与**官网源**（`act-webstatic.mihoyo.com`，`.json` JSON 骨架，Spine 4.2.43）。详情页 Hero 区动画由 Spine 清单按角色分发到对应源。
_Avoid_: CDN、动画资源源

### 官网源（Official Source）
米哈游官网随版本发布的活动站资源，URL 含版本 publish_key（如 4.4 为 `pz_Devp46QZiu`，4.3 为 `pz_Z1nD6naN3q`）。仅当期版本展示的角色有动画（老角色在官网无资源），旧版本资源无长期保留 SLA。
_Avoid_: 官网 CDN、mihoyo 源

### Atlas 纹理重映射（Atlas Texture Remap）
官网 atlas 内部引用逻辑纹理名（如 `jizi_PC-Web.png`）而实际文件为 hash 命名（如 `f59cc0ed....png`），加载时需将逻辑名改写为实际 URL 再喂给播放器的机制。
_Avoid_: 纹理替换、atlas 改写

### Spine 清单（Spine Manifest）
角色 ID → 动画资源描述的映射文件，本地随站部署（`public/data/cn/spine-manifest.json`），条目以 `kind` 区分两类源（`skel` = nanoka 二进制 / `official` = 官网 JSON 骨架）。
_Avoid_: manifest、动画清单

### Spine 运行时（Spine Runtime）
spine-player 播放库（当前 4.2.x），版本须与骨架数据格式兼容：向后兼容（4.2 可读 4.1 数据）、向前不兼容（4.1 读不了 4.2 数据），升级需回归验证现有动画。
_Avoid_: 播放器、运行时库
