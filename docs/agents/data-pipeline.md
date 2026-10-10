# 数据转换管线与本地数据探索

> AGENTS.md 的按主题子文件（主文件「任务 → 必读」路由表经相对链接引用，按需读取）。存放数据侧低频技能资料：转换管线、本地数据探索。常用命令见 [commands.md](commands.md)，字段裁决见 [conventions.md](conventions.md)。

## 数据转换管线（Python）

`tools/converter/` 将 `vendor/TurnBasedGameData/`（本地数据目录，**非 git 子模块**：ExcelOutput + TextMap；克隆命令见 `.gitignore` 注释）转换为 `public/data/cn/` 下的 JSON。上游数据无手动流程：`data-sync.yml` 每日 04:00 UTC 自动浅克隆上游 → `convert.py --force` → `gen_catalog.py` 重建 `DATA_CATALOG.md` 总索引与 `DATA_CATALOG.parts/` 分片 → 有 diff 才提交推送 main（转换失败即 job 失败，不推送坏数据）。

- 入口：`convert.py` → `MODULES` 注册表驱动，支持 `--only` / `--force` / `--pretty`
- 模块 → 源文件映射的**唯一事实源是 `incremental.py` 的 `MODULE_SOURCES`**（由 `tools/converter/tests/test_incremental.py` AST 校验锁住，防止声明与实际读取漂移）；本文件不复述映射表，需要时读代码
- 增量转换：`incremental.py` 基于源文件 mtime + size 签名跳过未变更模块，状态存 `.converter-state.json`（已 gitignore）
- 文本解析：`textmap.py` 加载 `TextMapCHS.json`，同时处理 `{ "Hash": N }` 对象引用与字面量字符串键；`text_key_of()` 只取键不取文（组合器与枚举登记需要按语言各自取值）
- **枚举展示名的唯一来源是 `enum_labels.py`**：`枚举 → TextMap 键` 的登记表（遗器部位 / 词条属性 / 敌方分类）。写死中文或自造译文都违反「展示文本必须来自现有数据源」；官方无独立词条的少数枚举显式回退本地映射，并被残留清单点名。命途 / 属性 / 技能类型不在此登记——它们各自已有令牌化来源（`paths.json` / `elements.json` / `skills[].type_name`）。字段落点见 [转换器字段映射.md](../data/转换器字段映射.md)
- TextMap 查询缓存：`textmap_db.py` 预建 SQLite 索引（`.textmap-cache.db`，已 gitignore），按 `mtime_ns:size` 签名自动失效重建
- 数值扁平化：源数据将数值包装为 `{ "Value": N }`，转换器递归展开
- 配置：`config.py` 存放路径映射、枚举回退表、图标路径重映射表
- 输出：默认紧凑 JSON，`--pretty` 切换缩进（调试用）
- 输出确定性：上游数据更新后重跑即可，前端无需改动

### 多语言（[ADR 0052](../adr/0052-多语言站点架构-路径前缀与语言包.md)）

上游 `ExcelOutput/AllowedTextLanguage.json` 声明 13 种文本语言（`TextMap/` 下同口径），站点按「**结构单份 + 语言包**」承载：结构层 `public/data/cn/**` 落文本引用令牌，各语言正文落 `public/data/i18n/<语言>/<分组>.json`，前端解析层替换。

- **令牌模式是 `convert.py` 的默认路径**（`--raw` 才关闭）：文本落 `"$t:<TextMap 键>"`；`resolve_text(clean=False)` 的原文（技能 / 剧情描述，交由前端 `gameTagsToHtml` 渲染）用 `~raw` 变体键，语言包按变体分别加工——**包值必须清洗，否则界面会把 `<unbreak>` 等游戏标记当正文显示**
- 语言清单**唯一事实源** = `languages.json`（`languages.py` 读它 + 解析 TextMap 分片路径）；前端镜像 `src/lib/i18n/locales.ts`，两侧由 `node tools/check-languages.mjs` 逐项比对
- `textpack.py`：令牌编解码 + 变体键 + 转换期键登记（`PackBuilder`）+ **组合器**（`composed_ref`：组合文案按语言现算，见下）+ 语言包生成（缺键从缺省语言回填，使语言包自包含）；前端镜像 `src/lib/i18n/text-ref.ts`
- **组合器（组合文案的正解）**：需要「模板 + 参数」或「模板套模板」（成就描述 = 模板 + `{TEXTJOIN#id}` + `#n[i]`）的文案，**绝不能在转换期组合**——组合只能在当时那一种语言上做，且切分 / 正则替换会把携带键的 `TextRef` 退化成普通字符串。做法是 `textpack.composed_ref(key, composer, cn_text)`：产物落 `"$t:<key>"`，语言包在**逐语言**生成时调用一次 `composer(该语言文本表)`。收益是前端与 AI 快照生成器**零改动**（拿到的仍是普通文本）；代价是组合实现必须写成语言无关的一份（已落地：成就 1950 / 货币词条 334 / 活动名与页签 / 小节正文 join）
  - **判据（一次记牢）**：只要对一个**已 resolve 的字符串**做了 `split` / `join` / `strip` / `replace` / `re.sub` / 切片 / f-string 拼接，那片文本就永远是缺省语言。要么把操作搬到前端，要么登记组合器。
  - **闭包必须按值绑定**：`lambda tm: f(tm, 循环变量)` 在包生成（循环结束后）才求值 ⇒ 整批条目会塌成最后一条（实测 334 条货币词条全成同一条）。写 `lambda tm, k=key: …`。
- **覆盖守卫** `node tools/check-i18n-packs.mjs`（已进 `pnpm build` 前置）：结构层里出现过的令牌 = 必须被语言包覆盖的键，**与来源无关**——`endgame_catalog` 从已令牌化的 `maze*.json` 派生 catalog，拿到的是普通字符串令牌，只登记 `TextRef` 会让这些分组缺包（前端解析即报缺键）
- 分组规则 = 数据文件相对路径首段目录（顶层文件取文件名去 `.json`）：转换器 `textpack.group_of` 与前端 `src/lib/i18n/pack-path.ts` 各一份，真实性由覆盖守卫对着产物校验
- 运行结束打印「结构层残留中文」清单——转换器自己拼出来、语言包取不到的文案，即多语言化尚未完成的部分（实现进度判据，不写进文档以免漂移）
- 转换器内硬编码中文（`config.py` 枚举映射等）改稳定枚举键下沉，产物内禁止出现写死中文

## 本地数据探索（禁止直接读原始文件）

`vendor/TurnBasedGameData` 是 GB 级源数据（`ExcelOutput/` 数千个 JSON + `TextMap/` 多语言全量），**禁止直接读取原始文件**，一律走下列工具：

- **`DATA_CATALOG.md`（总索引）+ `DATA_CATALOG.parts/`（分片）**：自动生成的数据结构索引。总索引只放定位流程、TextMap 清单与分片表（KB 级）；全量字段明细按**文件名首字母**分 9 片存放，单片 ≤150 KB。**禁止整本通读**（旧版单文件约 30 万 token，已按文档体量红线拆分，见 [conventions.md](conventions.md)「文档体量」）。
- **定位流程（三选一，优先前者）**：`python query.py --list <关键词>` 按文件名列出候选（零文档读取）→ `python query.py <文件名> --schema` 直接取单表字段全集与记录数 → 需要浏览整簇表结构时，按首字母打开对应分片。
- **`query.py`**：精确查询 CLI，支持 `--schema` / `--id` / `--where` / `--fields` / `--grep` / `--list` / `--limit` / `--resolve` / `--search` / `--rebuild-textmap`（完整参数以 `python query.py --help` 为准）。`--resolve` / `--search` 走本地 SQLite 缓存，首次自动建库。
- **`gen_catalog.py`**：本地数据更新后重跑 `python gen_catalog.py` 刷新索引。全量模式写 `DATA_CATALOG.md` 总索引 + `DATA_CATALOG.parts/*.md` 分片（分片表以生成器内的 `SHARDS` 为准，未覆盖首字母自动成片，过期分片自动清除）；`--top` / `--filter` 输出独立单文件，勿提交。
