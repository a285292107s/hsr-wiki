# CONTEXT.md — 项目术语表

> 本文件是 HSR Wiki 项目的术语表（glossary），仅定义术语，不含实现细节。

## 数据源相关

### 源数据（Source Data）
`DimbreathBot/TurnBasedGameData` 仓库的原始解包 JSON，位于 `vendor/TurnBasedGameData/` 的 `ExcelOutput/`、`TextMap/`、`Config/` 目录。结构复杂、字段冗余，无法直接供网站消费。

### 目标格式（Target Format）
converter 输出到 `public/data/[lang]/` 的 JSON 数据格式：列表索引（`characters.json` 等）+ 详情子目录（`characters/{id}.json` 等），结构扁平、字段精简。早期以 Mar-7th/StarRailRes 仓库索引 JSON 为格式标准（见 ADR 0006），输出结构已演进；StarRailRes 现在仅作「字段基线」参照（见数据筛选节）。

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
列表索引 JSON（`characters.json` / `light_cones.json` / `relics.json` 等），驱动目录页与卡片展示，不含详细数值表。

### 详情级数据（Detail Data）
详情 JSON（`characters/{id}.json` / `light_cones/{id}.json` / `monsters/{id}.json` 等），含晋阶属性、行迹树、技能等级数值等，由对应 detail 模块输出。

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
用于「对玩家有价值」语义校准的外部站点。**权威基准为米游社官方 wiki（bbs.mihoyo.com/sr/wiki）**——官方展示的内容即官方认定的玩家可见且有价值数据；hsr.nanoka.cc 等民间站仅作补充。米游社 wiki 为 JS 动态渲染，WebFetch 无法读取内容，必须用浏览器自动化（Playwright）抓取渲染后页面。图片资源存在性（CDN 不可枚举）以引用站实际请求过的路径为准，禁止猜测路径。

## 导航与模式

### 交换（Swap）
导航首项按钮，用于在常规模式与货币战争模式之间切换。点击后跳转至对方模式的枢纽页。标签固定为"交换"，附双色状态点指示当前所在模式（紫=常规，金=货币战争）。
_Avoid_: 切换、模式开关

### 常规模式（Normal Mode）
站点默认模式。**黑与紫双色主题**（黑色基底 + 紫色主色强调，见「双色约束」），导航为 7 个内容板块（角色、光锥、遗器、物品、成就、敌对物种、终局内容），枢纽页为 `/`。
_Avoid_: 主模式、普通模式

### 货币战争模式（Currency War Mode / CW 模式）
独立路由树（`/currency/*`）下的沉浸式模式。**黑与金双色主题**（黑色基底 + 金属金主色强调，见「双色约束」），导航为 5 个子板块（角色图鉴、装备图鉴、投资环境、投资策略、羁绊图鉴），枢纽页为 `/currency`。
_Avoid_: 货币战争栏目、CW 页面

### 调试台（Debug Console）
研究线（Spine Lab）在**主站的 dev-only 页面**（路由 `/debug`，仅开发环境存在，生产构建不含）。侧栏「调试台」入口（≥768px 平板/桌面，设置按钮上方）指向它。用户视角的页面 H1 为「Spine 调试台」，含 KV 场景验收 / 清单审核 / 死链审核 / 系统地图四个功能面板。架构语境仍称「研究线」/「Spine Lab」。
_Avoid_: 研究线页面、Spine 页面（作导航入口名时）

### 枢纽页（Hub）
一个模式的着陆页与身份页。「交换」的落地目标。常规模式枢纽页为 `/`（HomeView），货币战争模式枢纽页为 `/currency`（CurrencyHubView）。
_Avoid_: 首页、入口页

## 色彩体系

### 黑阶（Black Scale）
全站深色表面的唯一事实来源：纯中性黑阶（无色相），由低到高若干明度台阶。页面背景取最黑一级，表面/卡片/外壳逐级提亮。主题色相不写入黑阶，由语义层混入主色实现（见 ADR 0011）。
_Avoid_: 黑色系、深色阶

### 双色约束（Two-Tone Constraint）
主题层的色彩纯度规则：每个模式的主题色相恰好一个——常规模式=黑与紫（紫色主色），货币战争模式=黑与金（金色主色）。主题内所有强调色（主色、梯度端、激活态、焦点环）必须落入该模式的**主色族**，禁止第三色相。
_Avoid_: 双色主题、色彩收敛

### 主色族（Primary Family）
一个模式的完整强调色集：主色 + 同色族成员（常规模式 = Purple Heart 阶，货币战争 = 金阶）。`--accent` 是"主色的梯度端"（渐变端点），属主色族成员而非独立色。文字/细线强调位用族内亮端，大面积标识用族内基准位。
_Avoid_: 强调色、辅助色

### 领域色豁免（Domain Color Exemption）
数据语义色（稀有度星级、属性数值、元素、技能类型、强化角标、文本高亮）不参与双色约束：它们代表游戏内约定（5 星必为金色），不随主题切换。双色约束只作用于主题层（背景/表面/强调），不作用于领域层；货币战争模式下领域金按金阶降阶（暗铜哑光）处理。
_Avoid_: 数据色豁免、领域色例外

### 导航语义豁免（Navigation Semantic Exemption）
双色约束的导航例外："金色=CW 模式"的导航标识——首页网关入口卡、交换按钮双色状态点。这些元素用对方主题色做标识（金色指代货币战争模式），不视为第三色相违规。豁免登记于 check-colors.mjs 清单（带理由，引 ADR 0012）。
_Avoid_: 导航金、主题外标识

### 数据承载色（Data-Borne Color）
游戏数据自带的颜色（富文本 `<color>` 标签，如技能描述官方强调色），由渲染层运行时透传为 inline style，不参与令牌体系与双色约束。比领域色豁免更外层——它连"令牌"都不是，是数据本身（与 ADR 0008/0010 官方标签透传原则一致）。
_Avoid_: 内联色、富文本色

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

### 对比模式（Comparison Mode）
角色详情页三态之一（原始/强化/对比）：仅展示与当前选中强化版本相比**实际发生变化的**技能/星魂/行迹数据（真实字段 diff 过滤，非注册清单），每项以「原始 → 强化」双段呈现（原始置灰、强化金色），数值随技能等级滑条联动。
_Avoid_: 对比视图、diff 模式、变化视图（避免与旧版已下线词级红绿 diff 混淆）

## 图片资源

### 图片 CDN
图片资源解析统一收口于 `services/cdn/`（见 ADR 0013）：本地图标（element / pathicon / trace / 遗器通用部位图标，根 `LOCAL_ICONS_BASE` = `public/data/cn/assets/icons/`）local-first，未入库的新图标自动回退远端；其余图片走 jsDelivr 官方镜像（自建 fork StarRailTextures 仓库，`OFFICIAL_ICON_BASE`）首选 + nanoka（`static.nanoka.cc`）回退。converter 不改动 CDN，只输出相对路径；本地图标为构建期一次性入库，converter 同样不产出。注意 nanoka 的 trace 分类是 146 字节占位图（非真图标），trace 本地缺失时必须回退 jsDelivr（`ui/avatar/icon/Icon{key}.png`）。

### 图片路径映射
源数据图片路径（`SpriteOutput/...`）到 CDN 相对路径的映射规则。converter 在 `config.py` 硬编码两套规则：legacy 短路径（`icon/character/1001.png`）与官方 StarRailTextures 仓库相对路径（`avatarshopicon/avatar/1001.png`，`--official-icon-paths` 输出）；前端 `services/cdn/` 再按分类解析为 jsDelivr / nanoka 实际 URL。

## 终局内容

### 终局内容（Endgame）
四个高难玩法合集：忘却之庭、虚构叙事、末日幻影、异相仲裁。数据由 converter 的 `endgame.py` 从挑战配置表（ChallengeMazeConfig / ChallengeStoryMazeConfig / ChallengeBossMazeConfig / ChallengePeakConfig）转换，单页目录（模式为筛选选项） + 赛季详情页。
_Avoid_: 深渊、挑战内容

### 忘却之庭（Forgotten Hall）
含「永屹之城遗秘」常驻 15 关（早期关单阶段、无 Floor 字段按 ID 升序取序号）与「混沌回忆」周期赛季（10 层，每层上下半场各 1-3 波）。赛季增益取分组表 MazeBuffID，层名如"赛季名其一"。
_Avoid_: 混沌回忆（仅指周期赛季部分）

### 虚构叙事（Pure Fiction）
分数制玩法：每层有回合上限（TurnLimit）与通关分数线（ClearScore，当前统一 30000）；层级目标按分数档位（40000/50000/60000 分）。挑战目标走 ChallengeStoryTargetConfig 表。
_Avoid_: 虚构叙事赛季增益名

### 末日幻影（Apocalypse）
**阶段制战斗**：每层 1-3 阶段，各阶段一个 Boss 形态（ChallengeBossMazeExtra 的 MonsterID1/2/3），非上下半场结构；部分层含 StageConfig 波次缺失的第 3 阶段。层级无官方层名（源数据 Name 为空），挑战目标走 ChallengeBossTargetConfig。
_Avoid_: 上下半场（该词仅用于忘却之庭/虚构叙事）

### 异相仲裁（Anomaly）
每期 3 骑士试炼 + 1 王棋最终关（含「绝境」困难变体）；挑战目标走 BattleTargetConfig（Type=ChallengeTarget）。段位徽章系统（ChallengeBadgeConfig）：青铜/白银/黄金/彩钻四段，按期分组（部分期缺省）。
_Avoid_: 徽章奖励、段位

### 星启模式（Starlit）
三模式的独立进阶关卡：Tierce 表（ChallengeMazeTierce 等）记录常规最高难度关 ID（DLCKKJFMJOB）+ 星启附加关（HFIAAGAKFMD），3 节点敌方（节点 1/2 = 常规最高难度关上下半场，节点 3 = 星启附加关）。
_Avoid_: 星启、进阶模式

### 挑战目标（Challenge Target）
赛季/层级的星数条件（如"获得40000分"），按模式分三张目标表（maze 6xx / story 2xxx / boss 3xxx 系列 ID 不冲突）；文本含 #N[i] 参数占位，param 经 fmtDesc 渲染。
_Avoid_: 挑战任务、目标条件

### 波次（Wave）
StageConfig.MonsterList 的出场序列：每波为 {Monster0..N} 字典，波内可含重复敌人；EventIDList 多事件为顺序波次（候选事件拼接，wave 序号跨事件连续递增）。层级/peak 敌方带 wave 字段，前端按波分组展示"第 N 波"。
_Avoid_: 回合、阶段（波次 ≠ 阶段）

## 动画资源

### Spine 动画源（Spine Source）
角色骨骼动画的资源提供方，共两类：**nanoka 源**（`static.nanoka.cc`，`.skel` 二进制骨架，Spine 4.1.23）与**官网源**（`act-webstatic.mihoyo.com`，`.json` JSON 骨架，Spine 4.2.43）。首页/详情页 Hero 区动画由 Spine 清单按角色分发到对应源。
_Avoid_: CDN、动画资源源

### 官网源（Official Source）
米哈游官网随版本发布的活动站资源，URL 含版本 publish_key（如 3.8 为 `pz_Hse3Q5Sb8j`）。收录范围由 `spine-manifest-official.json` 决定（跨版本积累，非仅当期展示角色），旧版本资源无长期保留 SLA。
_Avoid_: 官网 CDN、mihoyo 源

### Atlas 纹理重映射（Atlas Texture Remap）
官网 atlas 内部引用逻辑纹理名（如 `jizi_PC-Web.png`）而实际文件为 hash 命名（如 `f59cc0ed....png`），加载时需将逻辑名改写为实际 URL 再喂给播放器的机制。
_Avoid_: 纹理替换、atlas 改写

### Spine 清单（Spine Manifest）
角色 ID → 动画资源描述的映射文件，本地随站部署，按源拆为双文件：`spine-manifest-nanoka.json`（`skel` 条目 = nanoka 二进制）与 `spine-manifest-official.json`（`official` 条目 = 官网 JSON 骨架，含版本/source 元数据）。两文件顶层 `version` 必须与 `constants.ts` 的 `SPINE_MANIFEST_VERSION` 一致（测试强制校验）。
_Avoid_: manifest、动画清单

### Spine 运行时（Spine Runtime）
spine-player 播放库，**双运行时分源加载**（见「Spine 动画源」）：官方 JSON 骨架走 4.2.43，nanoka `.skel` 二进制走 4.1.23（位域级不兼容，不可合并）。两个版本的 player 脚本（npm dist 原样，禁改动）随站本地分发（`public/vendor/spine/`，`SPINE_RUNTIME_LOCAL`），CDN 列表降级为兜底。版本须与骨架数据格式兼容：向后兼容（4.2 可读 4.1 JSON 数据）、向前不兼容（4.1 读不了 4.2 数据），升级需回归验证现有动画并同步更新本地 vendor 文件。
_Avoid_: 播放器、运行时库
