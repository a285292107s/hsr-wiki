# 数据转换与字段探索

> 本域 memory 补 `docs/agents/data-pipeline.md`（机制：增量签名、`MODULE_SOURCES`、TextMap 缓存）与 `docs/data/转换器字段映射.md`（表 → 字段落点）的盲区：那两份写的是规则与落点，这里只记「照规则做仍会踩」的坑——静默失效的形态、字段语义的反直觉事实、取数与取证的顺序。数据口径判据见 [data-semantics.md](data-semantics.md)，前端视图见 [ui-tokens.md](ui-tokens.md)，e2e 见 [testing.md](testing.md)。

## 增量转换与缓存失效

- **改转换器代码不会触发增量重跑**：签名只看源数据文件 mtime/size，改 `endgame.py` 等模块后不加 `--force` 会输出「跳过（未变更）」，现象是「代码改了页面没变」，极易误读成实现没生效。`tools/converter/convert.py --only <模块> --force`
- **新增或变更静态表读取必须同批登记 `incremental.MODULE_SOURCES`**：漏登记不报错，只让增量判断失真；同一张表被跨模块读取时两个模块都要登记（`monster_common` 读 `HardLevelGroup.json` 之后 `monster_detail` 也要登记）。`test_incremental.py` 的 AST 覆盖校验会抓到漏配
- **模块归属要用 `MODULE_SOURCES` 复核，别信二手结论**：`traits.json` / `equipment.json` 出自 `currency_catalog.py` 而非 `currency.py`，只跑 `--only currency` 不会更新它们。
- **未登记源表 = 站点零覆盖且转换不报错**：`StageInvasionBuff/Config`、`MazeBuff` 3034xxx、`GridFightAffixConfig` 在快照里数据完整存在却一张都没登记，站点无任何输出——新数据域先查登记表，再查数据。
- **共享表落盘要排在依赖它的循环之前**：`save_json(curve, OUTPUT_DIR / 'monster-level-curve.json')` 必须放在详情循环之前，曲线缺组才不带坏全部详情，且 `--only <详情目标>` 能独立产出它。
- **`os.replace` 会撞 WinError 5**：产物被并发只读进程持有时替换失败；验收改为内存内 `convert()` 后与磁盘逐字节 / sha256 比对——`--force` 重跑字节不变即输出确定性成立。

## TextMap 与描述渲染

- **`resolve_text_en` 命中英文后仍须过 `clean_text`**：否则游戏内富文本标签（`<unbreak>999</unbreak>`）原样写进 `name_en`，产出非法长串且不报错。`tools/converter/textmap.py`
- **占位符判定必须排在 `clean_text` 之前**：顺序反了 `{NICKNAME}` 会被清洗成中文「开拓者」，产出假英文名——比留空更糟。
- **探针脚本直接 `import resolve_text` 会静默返回空串**：`_text_map` 未加载时是空字典，据此会误判整个字段为空；`convert.py` 的「先 `load_textmap()`」是隐式前提，探针必须自己补。`resolve_text` / `load_textmap`
- **裸 `#N` 的语义取决于该条目是否携带 `params`**：携带（数组存在即便为空）即占位符，展不开就整段省略该描述；不携带（角色 `desc`/`stories`、成就 `desc`、物品名、敌对 `intro`）即上游字面，必须原样保留；`{TEXTJOIN#61}` 属上游合并标记须放行。
- **占位符展开口径必须与 `fmtDesc` 逐字段对齐**：`#N[i]%` 的 `%` 被正则消费后未补回会全站失真（`治疗量提高10。`）；缺参（`StatusDesc` 有占位符而 `ReadParamList` 只有键名）整段省略，禁止自造 `?` 或补 0。`fmtDesc` / `refsResolved`
- **数值的单位、百分比与小数位是描述文本的属性，不是数值的属性**：只能由 `desc` 的 `#N[i|%|fN]%` 标记驱动（复用 `fmtVal`）；在 `param_list` 数值侧重造「0<v<1 即 ×100」类启发式会被 `f1`/`f2` 标签打穿，数值错而不报错。
- **`param_list` 尾部的空槽是上游预留、未被任何 `#\d+` 引用**：参数表行集合必须由描述引用集驱动，按 `param_list` 长度驱动会多渲染空行或错位。
- **换行与富文本要先两侧归一再判定**：数据里的 `\n` 渲染成 `<br>`、`<color=#…>` 渲染时被剥掉，不归一会把渲染正常的文本判成漏渲染；字面 `\n`（两字符序列）只在货币战争羁绊 `desc` 上出现，须显式归一。
- **`TextMapCHS` 未命中的 hash 禁止落空串占位名**：`endgame` 的 3034001–03 `BuffName` / `BuffDesc` 四个 hash 无中文，只能不列该字段；`zh` / `name` 为空的未发布条目整条跳过。`endgame.ts` 的 `!zh`、`item.ts` 的 `!name`
- **成就描述源 JSON 的换行是字面两字符 `\\n`（双反斜杠转义）**：`achievements.py` 用 `text.replace(r"\n", "\n")` 转真换行；用真实换行构造输入永远走不到那一行，删掉该行校验仍绿。`tools/converter/converters/achievements.py`

## 字段透传与登记

- **`src/services/api/index.ts` 是显式具名 barrel，不是 `export *`**：新增共享单例漏登记 ⇒ 视图 import 到 `undefined`、`onMounted` 抛 TypeError、整页不挂载，现象与「数据缺失」难区分；新增单例后先查 barrel。
- **给接口加可选字段时所有构造点都要逐个核对**：`RELEASE_SOURCES` 声明了 `loadBrief` 而 `load()` 里的对象字面量没带它，TS 不报错、运行时恒 `undefined`、正文静默缺席——「可选」只免除类型检查，不免除构造责任。
- **目录卡要用的字段必须在映射层显式带出**：映射层只构造 `searchText` 而没带 `desc` 时，`renderCard` 读 `item.desc` 恒为 `undefined`、卡根 `title` 静默为空且无任何报错。
- **字段改名必须全量搜旧名、连读点一起改**：`summaryPlain` → `sourceSummary` 时漏改 `summary:` 那一行，导致全部角色详情页渲染成目录页摘要；只改声明处不算改完。
- **字段透传是双向的显式责任**：聚合记录新增键会被下游逐键透传的轻形态自动带上（须在 `endgame.py` 的跳过清单里显式排除），不在聚合记录里的字段则要在每个组装点显式带出；改共享聚合表前先审计「谁的 payload 会带上它 / 谁需要它」。
- **别名回退 `{**out[tpl], '_tpl'}` 会把模板的比率与难度组一起复制**：变体形态必须显式覆写为自己的 config 记录，否则同模板各档数值相同且不报错——回退只能兜字段缺位，不能兜语义。`monster_common.py` / `load_monsters()`
- **`HardLevelGroup.Level` 是整型而 JSON 键必须是字符串**：去重与比较先用 int `lv` 比对会永远 miss，重复键整段覆盖且不告警；先 `str(lv)` 再比对。

## 哨兵值与缺值约定

- **负值是哨兵不是数值**：`BPNeed = -1` 表示「不消耗」、真正产出是 `BPAdd = 1`、`CoolDown` 恒为 -1；消费侧只认 `bp_need > 0` / `bp_add > 0`，按算术直接代入会渲染出「消耗 -1」。
- **遇负值先怀疑哨兵，别先怀疑缺数据**：来源数据里 `CoolDown` / `InitCoolDown` 恒 -1 属常见形态；判定字段语义必须做全量值分布 + 跨模式（大世界 / 货币战争）对照，禁止凭单一样例或直觉。
- **缺值不得静默归零或编造**：修饰比缺位 / 不可解析按中性 1（归 0 会把一条 HP 显示成 0），难度组缺位回退「仅展示档案基准值」并同屏注明口径；「解析不出」与「上游本来没填」在页面上同形，只能靠产物 diff 区分——增益回退值同理，虚构叙事层记录 `MazeBuffID = 3031220` 未注册即不落字段。
- **等级上限不要写死**：`StageConfig.Level` 最高 120 而 `HardLevelGroup` 9 个组里只有组 1 被引用（上限 100），写死 100 在低上限组（如 1401 只到 40）会取不到曲线行、整页静默回退基准值；应取该怪实际组的组上限。`combatLevel`
- **`MonsterConfig.HPBase` 是模板基准，不是战斗面板值**：`monsters.json` 列表与终局 payload 里同名的 `stats` 都是它；合成链 = `基准 × 修饰比 × 等级曲线`，**修正值加在曲线之后**（先加减再乘曲线会算错）。`monster-stats.ts` / `stat_ratio`

## ID 与表连接语义

- **模板 ID 反查要走 `MonsterGuideTag.SkillID // 100`**：机制按 `MonsterID // 100` 登记是错口径（配置表敌方 ID 未必等于战斗敌方，如 `2035012` vs `2033022`），会换错敌方；该 ID 可被多首领共享，必须加唯一性闸，不唯一即放弃。
- **`SkillTriggerKey` 不能用来推断层级**：层级取 `skill_trees[anchor][lv].level_up_skill_id`；用 Key 判会被同名跨族污染。`tools/converter/endgame.py`
- **`MappingInfo.ID == StageID // 100` 是巧合不是外键**：`FARM_ENTRANCE` 里几乎无 `ID*100+k` 关卡家族；真外键是 `CocoonConfig` / `FarmElementConfig` 的 `MappingInfoID`，接入前逐关核对交集。
- **同号不同义的 ID 禁止按相等连表**：`StatusID` 与 `ExtraEffectID` 同号不同义；`ILBattle*` 属 IdleLive（挂机直播）子系统，`ILHardLevelGroup` 组号与常规表同号异值（group=4 常规 HPRatio 1.0 / IL 1000），按 key 合并会静默算错，且 `ILBattleStage` ∩ `StageConfig` = 0。
- **`ActivityModuleID` 是「面板号 + 序号」的不定长拼接**：4000501 / 5002001 / 5000002 混排，按固定位长猜前缀会被短号 `4000` 抢匹配；必须遍历全部 `PanelID` 取最长前导命中。`ActivityPanel`
- **活动名靠「面板与关卡类型同名」约定连接，不硬编码**：`ActivityPanel.UIPrefab` 的 basename（`FightFestPanel.prefab` → `FightFest`）等于 `StageConfig.StageType`，页签取 `ActivityQuestRewardData` 里 `ActivityModuleID` 以该面板 ID 开头的行；表对不上就整条不产出，换活动只换表。
- **名字类字段宁可少给也不拿「像」的表认亲**：BoxingClub 只有少数活动号能连到 `BoxingClubChallenge.StageGroupList`、`ElationActivity` 全库无表含其 `ActivityModuleID`——接不上就不加活动名。
- **「表里没有这个字段」推不出「这一项不存在」**：星启表无 buff 字段，但附加关的 `StageConfigData._BindingMazeBuff` 就是关卡内绑定；同一节点的属性先查它自己那张关卡表。同名字段也不是每张表都有——`GNOOAGPBNLD` 只存在于 `ChallengeMazeTierce`。
- **表里只有一场时，场级字段就是该节点的属性**：「没有逐节点字段」推不出「该节点没有推荐属性」；禁止从敌方 `weak` 推导（关卡 `StanceWeakList` 与星启表 `JEBMBCLBIOI` 可能登记不一致）。
- **跨记录沿用的值与自身声明当前相等，但相等是结论不是前提**：分叉时以该实体自己的声明为准，别把沿用的值当权威；这条禁令要留在 ADR 旁，否则下轮会被读成自相矛盾。
- **读去重 / 过滤口径要读条件表达式而不是 docstring**：`load_appearances` 的条件是 `all(s["type"] != stype and s["name"] != name)`，AND 语义实际等于「同一 `StageType` 只取一条」——按注释理解会得出相反的并集口径。
- **同一上游记录会在多个展示位重复登记，剔重只能做一层**：`seasonBuffList` 与 `floor.buff` 是同一条记录（`buffs[0].id === floor_details[*].buff.id`），在头部列表里删同 ID 会把头部一起删空——同 ID 的呈现位置唯一，被删的应是整块赛季增益组。`renders.seasonBuffList()`
- **同一源表被两个转换器各读一次时必须刻意同序**：`equip_by_id` 是字典推导（后写覆盖同名 `AvatarID`），另一侧若用并集语义，会让角色页与光锥页对同一角色给出不同推荐集且不报错；靠产物级双向复算证明。`_build_recommend_index`
- **同名字段的单复数变体可能是两张表**：`MonsterAtlasExtraPhase` 与 `MonsterAtlasExtraPhases` 字段同构，须按（组, 阶段）去重取并集；`PhaseID=1` 的记录立绘就已带 `_Phase2`，不能把 `PhaseID` 当游戏内阶段号。

## 未消费字段与字段下线

- **「未消费字段」里可能藏着正解，不要直接归档为未解**：`IMCMJHAMMKK` 曾被记为「同表常量、语义未验证」，实为本模式奖励族的 `RewardID`（落在 1019xx / 1021xx / 1017xx 段内）——先看常量是否落在已知 ID 段内，再用 `query.py RewardData --where "RewardID=..."` 验证。
- **未验证语义的字段不消费、不硬列，但必须把「已看过、未消费」写进字段映射**：否则下轮重复排查一遍（`PHOIICMCGIH` 与波数 / 回合 / 目标数 / 满分档全对不上、`LCHKKJDBLGM` 全空、`MLMEGBLDFKE` 均 `[200001]`）。
- **字段带 `RewardID` 不代表该 ID 存在**：`ChallengeTargetConfig` 的奖励号段在 `RewardData` 里一条都没有、`ItemConfig` 也无同号条目，照字段名直接映射会造出整批假奖励；先验证编号段存在性。
- **错口径字段留在产物里下轮必被再消费**：确认某字段是错口径（如把节点 ID 当层级敌方）后，只删字段不删读点等于留下诱饵，下线要连消费路径一起删。
- **删转换器模块前先枚举「同名不同物」并附存活清单**：`season.py`（货币战争赛季说明，可删）与 `endgame.py` 的赛季（`_season_stats` 等，须存活）同名不同物，误删即严重回归。
- **判断某字段是不是某物品，用「该物品 id 在这张表里出现过吗」直接判**：`RewardData.ItemID_1 ≡ 1` 的行数为 0，而 `ItemConfig` 1 = 星琼、部分行用 `Hcoin` 记数量 ⇒ 同一货币两种记法，解析时并入物品 1。
- **盘点未消费字段按「有没有真外键」排优先级**：`MonsterSkillConfig.ExtraEffectIDList × ExtraEffectConfig` 全命中可直接落；`MonsterStatusConfig` 的 `ModifierName = 怪物配置名[_技能触发键]_效果后缀` 是启发式且跨怪同名，进管线前必须加同名闸并请用户裁决；统计口径要写明「token 唯一」还是「模板唯一」，同一批命名桥按两种口径能差数倍。

## query.py 与 vendor 取数

- **`query.py --where` 的单条结果字段按字母序排列**：`ExistSeason` 排在 `AvatarID` 前，用「A 字段后 N 字符内找 B 字段」的正则会跨记录配对得出错结论；按字段配对必须整表 dump 后 `JSON.parse`。`tools/converter/query.py`
- **报覆盖率或「覆盖多少」类量词之前先跑全库取值分布**：`AtlasSortID` 只在小部分条目非空，拿它当组内序会让第一项跳到官方位、其余按 id；`MonsterDrop` 里 `DisplayItemList` 为空且 `AvatarExpReward` 为 null 的行大量存在——「有记录」≠「有可展示内容」，必须按取值判非空。
- **表名不可直译**：`Cocoon` 是拟造花萼（回忆之蕾）、`FarmElement` 是凝滞虚影，游戏内命名与表名不一致；社群术语与 vendor 冲突时以 vendor 实测为准。`CocoonConfig` / `FarmElementConfig`
- **相对路径依赖脚本所在层级**：`new URL('../public/data/cn/…')` 在脚本迁入子目录后仍「运行成功」但仓库数据停更；脚本挪位必须实跑一次并核对产物时间戳。

## 参考站与社群表格取证

- **参考站是前端渲染站，抓 HTML 拿不到条目真值**：须用 headless 逐档读渲染后文本（它只接受模板 ID 路由，实例 ID 返 404）；同一页 JSON 里可能并存两种口径（`boss_monster_id2` 是 extra、`event_id_list2.monster_list` 是战斗口径），页面显示后者。`hsr.nanoka.cc/boss/3020`
- **参考站占位贴图会以 HTTP 200（甚至合法 WEBP 头）返回**：绕过 error / 挂起回退链，状态码检查查不出；须比对全量同类文件字节数 + 用不存在的 404 排除缓存。nanoka 的 `assets/hsr/trace/*.webp` 全是占位图 ⇒ trace 本地缺失时回退必须走 jsDelivr。`src/services/cdn/base.ts`
- **参考站条目落地前先找到承载它的上游表与字段**：对照站的「关卡效果」= `MonsterGuideConfig × MonsterGuideTag`（`TagList` → 名称 + 简述 + `ParameterList`），不是独立数据源；参考图 / 截图里的每一项也先过「上游有没有这个字段」——星启看板截图上的「通关目标：击败 N 个首领」在 `targets` 里无对应字段（全是 4 档 `TOTAL_SCORE` 分数），按「展示文本必须来自数据源」不落。
- **社群表格只能逐行对表**：米游社《数据机制通论》与现行 vendor 存在不符行（组 3 ATK 文章 0.85 / vendor 0.70，vendor 全表无 0.85），整表照抄会把旧版本系数带进库；反查社群公式时只采纳能与仓内表逐字段对齐的部分。
- **游戏内教程 TextMap 是术语权威，优先于对照站与口述**：教程 hash `7039255158974959772` 把随难度追加的首领机制称「首领特性」（对照站标成关卡效果）；改术语要连字段、类型、渲染函数、section id 一起改，只改标题会被读成两套东西。
- **米游社 `content/info` 同 URL 有结构化与 OBC 预渲染 HTML 两种形态**：结构化字段为空 ≠ 无数据，须再查 HTML（`.obc-tmpl-character__trace__role` 里藏着 avatarId）。
- **判断某形态是否官方独立美术，用 CDN 探测而非猜测**：查 `monstermiddleicon/Monster_<id>.png` 与 `monsterfigure/Monster_<id>.png` 是否 404，并用 `MonsterTemplateConfig.MonsterName` 的中英名对照证实站内命名逐字一致。
- **`detail_id` 必须取模板 ID**：仓库内实例页 `202206017.json` 与模板页 `2022060.json` 并存，「页面文件存在」是伪证，须核外键归属。

## 表名与命名的反常事实

- **已知的「看似缺字段、实为设计」清单，别重复登记为漏转换**：光锥 `desc` 在多数命途上重复同一句专属说明（已判有意不渲染）、敌方 `figure` 字段全为空（故永远走 `monsterIconUrl` 回退取图，不是缺图）。
- **类型注释会与数据现状脱节**：`misc.ts` 注释写「星启无 wave」而三模式所有节点的 `monsters` 都带 `wave`；定字段规则前先全量列一遍取值分布，以数据为准。
- **vendor 没有 peak 排期表**：`ScheduleDataChallenge{Peak}` 不存在（只有 Maze / Story / Boss / Global），异相仲裁赛季恒无起止日期，`mazeStatus` 返回「未知」是正确行为——是数据缺口不是渲染 bug。
- **货币战争角色的 `equipment_id` 指向常规光锥（23059 / 23061），不是 CW 装备（350xxx / 352xxx）**：不能由此推出「新角色带出专属装备」。
- **备选队友槽的键是 `backup_list1..N`（按位编号、无数组字段可枚举）**：只收 `member_list` 会让备选槽名称永远落回退串 `#id`，图片正常、仅 `title` / `alt` 错且不报错。`loadLocalBuildNames`
- **wiki 技能标签映射漏项会静默丢技能**：`欢愉技` → `ElationDamage`、`忆灵技` / `忆灵天赋` → `Servant` / `ServantPassive`；新增 tag 必须同时改抓取侧映射表与前端查表键（`SkillsPanel` 按 `sk.type` 查表）。
- **「可选增强 + 失败静默」的链路必须产出覆盖报告**：按 `characters.json` 逐技能、与 `SkillsPanel` 同口径核对缺失类型与参考站侧原因，否则缺口无声累积。
- **抓取产物一律「读既有 → 按 key 取并集 → 写」**：覆盖须显式 `--fresh`，静默丢键比报错更危险。`public/data/cn/skill_animations.json`

## 产物形态与排查路径

- **轻形态与全量形态的字段差异要按产物回答，别猜页面**：`maze.json` 的层级敌方全部不带 `intro`，星启节点与 `maze_boss.json` / `maze_peak.json` 全带；期级合并列表必须走 `_lean_monster` 去掉 `wave` / `intro` / `skills`，只有单关卡才传 `full_monsters=True`。
- **「缺少某内容」可能落在数据两端，先分清「没产出」与「上游没有」**：`StageConfigData` 缺 `_BindingMazeBuff`（忘却之庭附加关）是上游未登记，末日幻影则是转换器整块没写；只从关卡取值在忘却之庭是恒空分支。
- **删数据层兜底分支前，先用全量产物量该分支是否可达**：四份产物所有期的 `floor_details` / `tierce` / `levels` 无一期全空 ⇒ 固定条与其 `v-if` 兜底永不触发，属数据层已死的分支。
