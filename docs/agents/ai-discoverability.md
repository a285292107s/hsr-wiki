# AI 检索可见性：构建期预渲染快照（契约）

> 事实依据（检索结论 + 证据强度；**外部快照、含检索日期、会过期**）见 [docs/audit/AI检索入口事实清单.md](../audit/AI检索入口事实清单.md)；本站据此踩过的坑与判据见 [docs/memory/ai-visibility.md](../memory/ai-visibility.md)。
> 本文是**实现契约**：产物路径、路由覆盖、生成规则、守卫断言。改动本文件即改动生成器与守卫的接口，三者必须同步。

- **分层多语言快照（用户裁决 B）已落地**：非条目级页面 × 13 语言（首页 / 各目录页 / 4 个玩法枢纽 / voracity / formula 共 20 条路由 × 12 个非缺省语言 = 240 份），条目级详情页仍只做缺省语言。生成期默认开启（无开关），`dist/prerender` 共 **1445** 份，`sitemap.xml` 同步 1445 条 URL。

**契约三件套（新增可索引路由必须同步）**：
1. **快照**：`node tools/gen-ai-endpoints.mjs`（`pnpm build` 末步）；
2. **rewrite**：`vercel.json` 在 catch-all 之前有 19 条 `/:lang(en|cht|de|es|fr|id|jp|kr|pt|ru|th|vi)<route>` → `/prerender/:lang<route>.html`（首页 → `:lang/home.html`，因为真实 URL 是 `/<lang>` 而非 `/<lang>/home`）；
3. **sitemap**：由快照路由一一生成（守卫校验一一对应）。

**守卫口径（`tools/check-ai-endpoints.mjs`，均经反向验证）**：
- `routeOf()` 对 `<locale>/home.html` 返回 `/<locale>`（否则 sitemap/canonical 校验全错）；
- 正文长度判据**语言感知**：缺省语言与 `cht` 看汉字数，分层非 Han 语言看去标签可见文本长度（同样拦「空壳 HTML」）；
- `<locale>/…` 不计入「未登记快照」，其覆盖由**分层总数断言**单独校验（语言集合与 `vercel.json` 前缀改写同源，12 × 19 = 228，缺项逐个列出）；
- 每页 `<html lang>` 必须等于 `languages.json` 的 `culture`；hreflang 必须 **13 语言 + `x-default` = 14 条**，且**取值是 `culture`（BCP 47）而不是上游 `TextLanguageKey`**——`cht` / `jp` / `kr` 不是语言码（应为 `zh-TW` / `ja-JP` / `ko-KR`），Google 对无法识别的 hreflang 值**整条忽略**，条数断言查不出这种「值非法」；
- JSON-LD 内嵌 `@id`/`url` 不得指向**别的语言前缀**；
- **汉字残留判据按脚本划界，不按「非缺省语言」**：`cn` / `cht` / `jp` / `kr` 都合法使用汉字（日文汉字；韩国官方韩文用汉字注音，如 `세검(細劍)`），对其判残留会全量误红（实测 jp 19/19、kr 5/19 命中）；其余语言的分层快照**正文**出现汉字即残留，走 `tools/ai-han-baseline.json` 棘轮（只降不升）。**边界**：jp/kr 的「合法汉字」与「中文残留」用码点范围分不开，本断言不覆盖这两种语言。
- **正文类断言必须先证明「抽取命中了目标」**：快照正文只取 `.nk-snapshot` 之后的部分（整页 `visibleText` 含 SPA 外壳的固定中文，会把每个语言都算成 19 个文件）。**抽取为空串即判红**——曾因正则写死三层 `</div>` 收尾而快照只有两层，抽取恒空 ⇒ 汉字断言与其棘轮长期静默失效（`tools/ai-han-baseline.json` 从未落盘，看上去反而像「残留为 0」）。
- 取值路径一致性：语言包里的字面 `\n` 必须还原为换行（此前缺省语言路径会还原、pack 路径原样输出 ⇒ 非缺省语言正文出现字面 `\n`）。


**当前状态**：分层语言展开**无条件全量**（曾经的 `NK_SNAPSHOT_LOCALES` 开关已去掉）：19 条非条目级路由 × 13 语言 + 条目级详情页仅缺省语言，`dist/prerender` 恒为 **1432** 份、`sitemap.xml` 同步 1432 条。

**已完成（曾列为待办，均已落地）**：语言展开无条件全量（`NK_SNAPSHOT_LOCALES` 开关已去掉）；`vercel.json` 前缀**模式化改写**（19 条覆盖 12 个前缀）；`tools/check-ai-endpoints.mjs` 的分层断言（分层总数 / 每页 `<html lang>` / hreflang 完备性 / JSON-LD URL 与 canonical 同路径）；非汉字脚本语言的分层快照正文汉字残留**已归零**（见下「验收判据」）。

**验收判据**：汉字脚本语言（`cn` / `cht` / `jp` / `kr`）以外的分层快照**正文**汉字残留为 0（品牌名 `星铁档案馆` 除外）。判据已固化为 `check-ai-endpoints.mjs` 的棘轮断言 + 「抽取非空」兜底，不再依赖临时探针。


本站是纯 CSR：所有 URL（含详情页）返回同一份空壳 `index.html`，服务端 HTML 里 **0 个正文字符、0 条内链**。
Vercel × MERJ 对 OpenAI 爬虫 5 亿请求的实测为 **零次 JS 执行**；Googlebot 与 GPTBot 的可见词数差为 0。
结论：AI 可见性的唯一决定性因素是**服务端 HTML 里有没有正文**，与 llms.txt / schema 无关。

因此：**构建期**为每个可索引路由生成一份含正文与内链的 HTML，落到 `dist/prerender/**`，由 `vercel.json` 的明确 rewrite 在该路由上投递；
JS 用户仍拿到同一份 HTML（脚本照旧执行、Vue 挂载覆盖快照），**内容对所有 UA 完全一致**，不构成 cloaking。

## 1. 产物契约

| 产物 | 路径 | 生成方 |
| --- | --- | --- |
| 快照页 | `dist/prerender/<route>.html`（下表） | `tools/gen-ai-endpoints.mjs` |
| 站点地图 | `dist/sitemap.xml` | 同上 |
| robots | `public/robots.txt`（提交入库，手写） | Lead |
| llms.txt | `public/llms.txt`（提交入库，手写；vite build 复制到 `dist/llms.txt`） | Lead |
| 路由投递 | `vercel.json` rewrites（快照规则在 catch-all 之前） | Lead |

llms.txt **不是收录杠杆**（Google 明文忽略它，依据见 [AI检索入口事实清单.md](../audit/AI检索入口事实清单.md) §4）：登记它的唯一目的是让它**以真文本文件投递**——`/llms.txt` 无文件时会落回 catch-all，拿到一份 200 的 HTML 外壳（既不是文件、也不是 404），这是比没有它更差的形态。

快照 = **构建后的 `dist/index.html` 原样复制**，再注入 5 项内容（顺序无关）：
1. `<head>` 首部内联 `<script>document.documentElement.classList.add('js')</script>`；
2. `<head>` 内 `<style>html.js #app > .nk-snapshot{display:none}</style>`；
3. 覆盖 `<title>`、`<meta name="description">`、og（`og:title` / `og:description` / `og:url` / `og:image` / `og:locale`）与 `twitter:*`（`card=summary_large_image` / title / description / image），新增 `<link rel="canonical" href="{origin}{route}">`；
   - `og:image` 固定为**站点级** `public/og.png`（1200×630，生成器 `tools/gen-og-image.mjs`），不做每页一图；
     `index.html` 另有一份同源静态兜底供 catch-all 投递的 SPA 外壳消费（守卫断言其 origin 与 `SITE_ORIGIN` 同源）。
   - `og:locale` 取 `culture` 的下划线形（`zh_CN` / `en_US` / `ja_JP`），**必须与页面 `<html lang>` 同源**。
4. 一段 `<script type="application/ld+json">`（见 §4）；
5. `<div id="app">` 内注入 `<div class="nk-snapshot">…</div>`（见 §3）。

**必须复制构建后的 shell 而非重写模板**：否则 `/assets/*` 内容哈希会漂移。守卫断言快照引用的入口 JS 与 shell 完全一致。

**Vercel 投递模型（2026-09 线上实测，决定产物布局）**：Vercel **先命中文件系统、再走 rewrites**。因此：
- 有对应静态文件的路由（`/robots.txt`、`/prerender/x.html`）直接被文件服务，rewrite 不参与；
- 无文件的路由（`/character/1308`）才落到 rewrite → 投递 `prerender/character/1308.html`；
- **`/` 会命中 `dist/index.html`，`{"source":"/"}` 的 rewrite 永不生效** → 因此 home 快照**必须同时写入 `dist/index.html`**（与 `prerender/home.html` 字节一致），而把**纯 SPA 外壳**放到 `dist/prerender/_shell.html`（下划线前缀 = 非快照，守卫跳过；`/prerender/` 已在 robots 里 Disallow），catch-all rewrite 指向它。
- rewrite 目标缺文件时**回落到 catch-all**（实测 `/character/99999`、`/endgame/boss/3022` 返回 SPA 外壳而非 404）——未发布/不存在实体的 URL 行为与改造前一致，无回归。
- **尾斜杠变体由 `trailingSlash: false` 收口**：Vercel **只在显式设置**该项时才生成归一化路由（`@vercel/routing-utils` 的 `convertTrailingSlash`：未设置时一条都不生成），故此前 `/character/1308/`、`/en/`、`/character/` 这类带尾斜杠的写法会绕过全部 rewrite 落到 catch-all，拿到 200 空壳（与规范 URL 并存的重复页）。该路由在 routes 数组里排在 `handle: filesystem` **之前**，故置 `false` 后这些变体先被 308 到无斜杠规范 URL；`/` 不受影响（归一化正则 `^/(.*)/$` 不匹配单斜杠）。
- **未登记路径返回 200 空壳（soft 404）是有意保留的既有语义，不得改成 404**：catch-all 是 `/settings`、`/maze` 这类客户端路由唯一的投递通道（外壳必须以 200 到达浏览器，Router 才能接手）；要改成真 404 就得把客户端路由逐条显式化并另出 `404.html`。判据与理由见 [docs/memory/ai-visibility.md](../memory/ai-visibility.md)。
  - **外壳本体带 `noindex`**：`dist/prerender/_shell.html` 由生成器注入 `<meta name="robots" content="noindex">`（`withShellNoindex`），把「不存在实体 / 垃圾路径」这类 200 空页从索引里摘出去——`robots.txt` 只登记了那几条客户端路由，管不到任意路径。**快照一份都不加**（守卫反向断言），因此 `noindex` 必须在渲染快照前从模板里剥掉，见 §6 第 3 组。

## 2. 路由覆盖（唯一权威清单）

`origin` 常量 = `https://myhsr.wiki`（自有域名，2026-10 迁入；旧 origin `myhsr.vercel.app` 因中国大陆可达性问题不再作为 canonical/sitemap 源；`tools/gen-ai-endpoints.mjs` 内 `SITE_ORIGIN`；`public/robots.txt` 的 `Sitemap:` 行必须与之同源，守卫断言一致）。

| 路由 | 快照文件 | 数据源（`public/data/cn/` 下） | 详情条目 |
| --- | --- | --- | --- |
| `/` | `prerender/home.html` | version.json + characters/light_cones/relics | 版本入册页：本版本新增条目清单（判据同 ADR 0019，形态见 ADR 0063） |
| `/character` | `prerender/character.html` | characters.json | 98（全量：跳线者性别变体**不**按 localStorage 设置过滤——设置态非构建期事实，URL 与内容均真实） |
| `/character/:id` | `prerender/character/{id}.html` | characters/{id}.json | 同列表 id 集 |
| `/lightcone` | `prerender/lightcone.html` | light_cones.json | 170 |
| `/lightcone/:id` | `prerender/lightcone/{id}.html` | light_cones/{id}.json | 同列表 id 集 |
| `/relic` | `prerender/relic.html` | relics.json | 62 |
| `/relic/:id` | `prerender/relic/{id}.html` | relics.json 条目 | 同列表 id 集 |
| `/item` | `prerender/item.html` | items.json | 仅 `name` 非空者（`item.ts:88` 过滤 name/desc/bg_desc 全空占位行）；无详情路由 |
| `/monster` | `prerender/monster.html` | monsters.json | 632 |
| `/monster/:id` | `prerender/monster/{id}.html` | monsters/{id}.json | 同列表 id 集 |
| `/endgame` | `prerender/endgame.html` | maze*.catalog.json（四模式） | 四模式赛季并集 |
| `/endgame/{mode}` | `prerender/endgame/{mode}.html` | endgame_guide.json + maze*.catalog.json | 四模式各 1 页（玩法页；正则白名单，`/endgame/xyz` 落 404） |
| `/endgame/:mode/:id` | `prerender/endgame/{mode}/{id}.html` | maze.catalog / maze_extra.catalog / maze_boss.catalog / maze_peak.catalog | 按 mode 取表，且**仅 `zh` 非空白者**（`endgame.ts:190`；未发布占位行如 boss 3022 不产快照、不入 sitemap，线上落 404） |
| `/achievement` | `prerender/achievement.html` | achievements.json + achievement_series.json | 1950 |
| `/currency` | `prerender/currency.html` | currency/role.json 等 5 表 | 枢纽 |
| `/currency/role` | `prerender/currency/role.html` | currency/role.json | 列表长度 |
| `/currency/role/:id` | `prerender/currency/role/{id}.html` | currency/role/{id}.json | 与 role.json 列表 id 集一致 |
| `/currency/item` | `prerender/currency/item.html` | currency/equipment.json | 列表长度 |
| `/currency/buff` | `prerender/currency/buff.html` | currency/portals.json | 仅 `in_book` 为真者（`currency-portal.ts:30`） |
| `/currency/augment` | `prerender/currency/augment.html` | currency/augments.json | 列表长度 |
| `/currency/trait` | `prerender/currency/trait.html` | currency/traits.json | 列表长度 |
| `/currency/trait/:id` | `prerender/currency/trait/{id}.html` | currency/traits.json 条目 | 列表 id 集 |
| `/voracity` | `prerender/voracity.html` | voracity.json | 专题页（无实体、非目录）：整页 1 个快照，条目级**不**收 `nk-snapshot__entry` |
| `/formula` | `prerender/formula.html` | 无（站点撰写的机制长文，ADR 0064） | 专题页：整页 1 个快照，正文只有区块标题 + 乘区公式 + 内链，条目级**不**收 `nk-snapshot__entry` |

**不生成**：`/settings`、`/currency/settings`、`/debug`（无内容页）；旧路径重定向（`/maze` 等）由前端路由处理。

**可见性对齐（硬约束）**：快照与 sitemap 的条目集合 = **应用真正展示的条目集合**。凡各 `src/app/catalog/pages/*.ts` / 视图中对条目做了过滤（如 `endgame.ts` 的 `if (!info || !info.zh) continue;`），生成器必须施加同一判据——**禁止为被隐藏条目兜底命名**（违反「文本数据来源」硬约束，且会把未发布内容写进索引）。守卫侧独立按同一判据从数据统计期望值（两边各自实现，靠本契约同步）。

**数据源细节以对应视图/服务的实际取数逻辑为准**（`src/services/api/*`、`src/app/views/*`、`src/app/catalog/pages/*`）——生成器不得自建数据源、不得写死实体内容。

## 3. 快照正文规则

- 每个 `<a href>` 必须是真实站内路径（如 `/character/1308`），**禁止 `#` 或 JS 链接**；内链是快照存在的首要目的。
- **页面 ↔ 快照的对齐粒度**：**实体级事实标签必须与页面逐字一致**（`<h1>`、实体名、`受『贪饕』侵蚀` 这类事实行、一切数据派生文本）；**页面级 chrome 允许快照使用更完整的措辞**（分区标题可带括号说明、分组标签可用全称、装饰性英文如 `INVASION` 不进快照）。既有实例：`MonsterDetailView.vue` 的 `受『贪饕』侵蚀` 与生成器逐字相同，而 `/voracity` 分区标题 `「贪饕」侵蚀（敌方与玩家支援）` 与分组标签 `侵蚀等级 N` 是快照侧的完整措辞（页面为 `「贪饕」侵蚀 INVASION` / `侵蚀 LV N`），**双方都保持现状**——禁止把页面 chrome 逐字搬进快照，也禁止反过来要求 chrome 逐字对齐。
- 详情页必须含：`<h1>{实体名}</h1>`、一句话摘要段（**仅当源数据提供文本时输出**：角色 `desc` → `chara_info.stories` 首个非空；敌对物种 `intro`）、属性事实表（`<dl>` 或 `<table>`，值全部来自数据）、面包屑 `<a>`（首页 → 图鉴 → 实体）、**≥3 条同类实体内链**（上一/下一个或同图鉴前若干条）、`数据最后更新：{version.json.synced_at}`。
- **敌对物种「贪饕」侵蚀标记与回链（ADR 0025）**：怪物详情数据带可选块 `invaded`（T1 契约）时，事实表额外输出一行「受『贪饕』侵蚀 · 等级 {`invaded.invasion_ids`} · {`/voracity` 链接}」（标签字符串与 `MonsterDetailView.vue` 逐字一致）。判据 = **目录条目自身的详情文件**里该块是否存在（`monsters.json` 条目 → `monsters/{id}.json`）——**禁止**按 id 白名单硬编码，**禁止**按 `monsters/` 目录枚举详情文件：该目录下的实例变体页（长号实例 ID）不在 `monsters.json` 目录内、应用不展示、快照也不生成（实测带 `invaded` 的详情文件 217 个，其中仅 24 个是目录条目，故只有 24 个快照带该标记）。无该块的怪物不输出此行。同一段的**掉落与出没**两行的契约镜像这条：`drops` / `appearances` 块存在才输出，值逐字取自该块（掉落只列**基准档**（`world_level` 为 `null`）的物品名 + 总档数，出没输出关卡总数 + 至多 3 个样本名；样本带 `activity`（ADR 0047 决策 6）时按**与页面逐字同格式**拼成「活动名 · 关卡名」——这是同一份数据的展示拼接，不是另算）——**禁止**在生成器里另算一遍关卡数或掉落（那会造出第二个事实源，且与页面口径分叉）。
- **怪物详情快照的四维数值仍是「基准值」**（`stats.hp/atk/def/speed`），标签逐字写「生命（基准值）」等：页面按 `基准值 × 实例倍率 × 精英组倍率 × 等级曲线倍率 + 修正值` 在等级滑条上合成并逐因子展开（ADR 0040 / 0045 / 0049），快照**不做合成**（不在生成器里实现第二份算式）。韧性直接取 `stance`（不入曲线链，与页面一致）。改口径时两处（页面注记 / 快照标签）必须同批改，不允许只动一处。
- **状态词条分区**（`MonsterStatusConfig` 安全子集）：怪物详情快照的「状态词条」分区逐条输出 `名称（增益/减益/其他 · 可驱散）` + **仅有值时**的描述——描述只在源文本**既无 `#N[i]` 占位符、也无 `%宏`**（`%CasterName` / `%DynamicTargetName`）时才有（数值与运行时名称本仓都不可知），故**禁止**在生成器里补参、拼接或渲染 `?`；归属判据与页面同源（命名约定桥 + 去形态后缀同名，见 `docs/data/转换器字段映射.md` 的 monster_extra 段）。
- **活动出处事实行**：怪物详情快照的「活动出处」逐字取自详情 `event` 块（`ActivityPanel.TitleName` / `ActivityQuestRewardData.QuestTabName` / 关卡等级，均为源文本），无该块时不输出此行；等级**单档时不写区间**（与页面 `eventLevelText` 同口径，源里确有全档同等级的活动敌人）。**快照不断言「复用模型 / 立绘 / 技能组」**——页面那句按 `art_shared` 的两个维度写（[ADR 0048](../../docs/adr/0048-活动出处备注的判据下沉.md)），快照只出源文本事实；**禁止**在生成器里自撰活动名或页签名。
- **图鉴族分区**（官方 `TemplateGroupID`）：怪物详情快照的「同图鉴其他形态（本族共 N 个形态）」分区列该官方组里**非同卡面**的其他形态内链——同卡面的数值档由「同图鉴敌对物种」内链与页面「同族变体」条承担，**两处不得重复列同一批卡**；生成器与页面同源（都按 `atlas_group` + 名称/卡面图标 stem 过滤，见 [CONTEXT.md](../../CONTEXT.md) 的「图鉴族」词条）。该组**不得**用作变体序号（比卡面判据粗）。
- **禁止为无数据实体合成通用句**（实测反例：「X 是《崩坏：星穹铁道》的可玩角色。」）——应用对这类实体渲染**空描述**（`CharHero.vue`），快照必须一致；空数据的段落**整段省略**，不得把前端的占位文本复制进快照（避免第二事实源）。但 `<meta name="description">` / `og:description` 仍须非空，用**数据字段拼装**（角色：名称 + 稀有度/元素/命途；敌对：名称 + 分类/阵营）。
- 页面级摘要（目录页/枢纽页，含条目数等集合事实）属**页面元描述**而非实体事实，允许保留合成。
- 源文本里的**字面 `#NN`**（如「天才俱乐部#81号会员」这类编号）原样保留：它们不是参数占位符，**禁止**为了对齐前端渲染（`fmtDesc` 会把无参 `#1` 渲染成 `?`）把真实文本改成 `?`——快照以数据忠实为准。
- **参数展开保真**：描述文本必须按前端 `fmtDesc`/`fmtVal` 口径展开（数值、`%` 保留、`null`→`?`）。**若源数据缺参数导致无法完整展开（可见文本残留 `#N[...]` 标记），该字段不得进入快照**——前端卡片本就不渲染该字段（如光锥目录卡片只渲染 `skill_name`）、或渲染成 `?` 残句，两者都是噪声。缺参数的实体因此少一段（**不**影响条目集合与 sitemap）。
- **上游数据例外**：源文本里的字面 `#NN` 编号、转换器未解析的合并标记（如物品名里的 `{TEXTJOIN#61}`）与应用显示一致，属上游/转换器域，**原样保留并单独立项**，不在本域修。
- 目录页必须含：`<h1>{路由 meta.title}</h1>`、条目清单（每条 `<a href="/…">名称</a>` + 属性摘要；无详情路由的条目如物品/成就输出名称 + 描述文本），`数据最后更新`。
- **巨型无详情目录页必须给 `<h2>` 骨架**：`/item`（2412 条）与 `/achievement`（1950 条）按数据自带的分组键（物品 `main_type`、成就 `series_id` → 系列名）分组为 `<section><h2>{分组标签}</h2><ul class="nk-snapshot__list">…</ul></section>`，条目仍逐条带 `nk-snapshot__entry`。**只加结构，条目集合 / 顺序 / 数量都不变**，也不新增路由（真实分页 / 条目级 URL 是另一件未决事项）。分组标签取不到时**整轮构建失败**（`groupSections`）：空 `<h2>` 是守卫禁止形态，而给它编一个回退标签等于为数据里没有的分类自撰文本。
- **正文不得出现空列表**：`<ul class="nk-snapshot__list"></ul>` 这类空壳在语法层无法与「条目静默漏光」区分，守卫显式禁止——因此 `catalogBody()` 对空 `items` 不落 `<ul>`（分组目录页与首页把条目放进 `sections`）。
- **页脚日期必须是机器可读的 `<time>`**：`数据最后更新：<time datetime="{version.json.synced_at}">{synced_at}</time>`。只写可见文本等于「这页没有日期」——抽取器与搜索侧只能读结构化日期。日期占位在各语言词典模板里的位置不同，故实现为「先塞哨兵 `{{nk-date}}` → 转义模板 → 再把哨兵换成标签」。
- **首页必须带站点级统计块**：`<ul class="nk-snapshot__stats">` 内 6 条 `<li class="nk-snapshot__stat"><a href="/{目录}">{本地化目录名}</a><span class="nk-snapshot__stat-n">{条目数}</span></li>`（角色 / 光锥 / 遗器 / 物品 / 敌对物种 / 成就）。条目数**从同一次构建的目录页正文里数 `nk-snapshot__entry` 得到**（不复刻各族过滤判据——复刻即第二事实源）；措辞只用**既有词典键 + 纯数字**，不新增 i18n 键、不合成叙述句（`ui()` 缺键回退中文，新键会在 12 个非汉字语言快照里留下中文，撞上汉字残留棘轮）。统计块在目录页构建完成后注入（`injectHomeStats`，插在页脚前），只在首页族出现。
- **目录条目稳定标记（守卫依赖）**：**收录条目清单**里每个条目必须渲染为 `<li class="nk-snapshot__entry">…</li>`——包括 12 个目录页的条目清单，以及枢纽页（`/` 版本上新三分区、`/currency` 本赛季分区）的收录条目。该类名**禁止**用于详情页的导航性列表（同图鉴/同模式内链、「羁绊成员」等）。守卫按此标记逐目录计数并断言 = 应用可见条目数——否则「生成器静默漏条目」（例如 map 中途异常、上限误用）无法被任何断言察觉；枢纽页则断言 ≥1（新版本必定有新条目，判据失效会让枢纽页静默空态，必须拦住）。
- **枢纽页分区级列表入口**：`/` 与 `/currency` 的每个分区在快照里额外输出一条 `查看全部{X}` 内链（`<p class="nk-snapshot__more">`，目标 = 该分区对应图鉴页：`/character` `/lightcone` `/relic` / `/currency/role` `/currency/trait`），与应用分区头右端的分区入口（首页 `.nk-home__all`、货币战争 `.nk-hub-release__all`）**同源同目标**（同一份 `listHref`）。措辞属页面级 chrome（页面写「全部角色」、快照写「查看全部角色」），按 §粒度规则允许不同；该 `<p>` **不使用** `nk-snapshot__entry`（它不是收录条目）。
- **专题页正文规则（`/formula`，ADR 0064 的第二个专题页实例）**：无数据产物——正文是站点撰写的机制长文，必须含 `<h1>战斗公式</h1>` + 面包屑 + 九个区块标题（`formula.sec.*`：伤害链路 / 击破链路 / 欢愉伤害 / 真实伤害 / 属性成长 / 治疗与护盾 / 速度与行动值 / 削韧·能量·命中 / 实战计算器）+ 四条伤害链路的公式纯文本形（直伤六乘区 `formula.zoneFormula.base/modifier/crit/def/res/special`；击破与超击破、欢愉、真实伤害由 `FORMULA_*_ROWS` 经 `formulaChainLine()` 拼装，行名取自 `formula.row.*`）+ 数据来源说明（`formula.hero.note`）+ 站内内链（`/`、`/character`、`/monster`）。文案一律经 `ui()`/`uiT()` 取词典键（13 语言随分层快照各自成文），**禁止在生成器里写死中文**。同样**不使用 `nk-snapshot__entry`**（不是目录收录清单）。JSON-LD 用 `ldDataPage`——`Article` 只允许 `/voracity`，本页虽是长文也不能用。页面的交互（数值输入、开关、实时读数）**不进快照**：无 JS 的爬虫只看到区块与公式，这是形式选择的固有代价。
- **专题页正文规则（`/voracity`，ADR 0025 的第三种页面形态）**：必须含 `<h1>贪饕污染</h1>` + 面包屑（首页 → 贪饕污染）+ 分区（玩法概览 / 污染等级与愿力 / 「贪饕」侵蚀（敌方与玩家支援）/ 波及关卡与被污染怪物 / 状态词条 / 教程图文 / 位面词条 / 「污染」同形词说明）+ `数据最后更新：{synced_at}`。波及关卡的怪物在 `detail_id` 非空时输出**真实内链** `/monster/{detail_id}`（**禁止 `#`**）；`detail_id` 为空说明模板 ID 未解析成功，只输出纯文本，**不得造链、不得兜底命名**。**专题页一律不使用 `nk-snapshot__entry`**：该标记语义已冻结为「12 个目录页 + 枢纽页的收录条目清单」，专题页的分区列表不是「应用收录条目集合」（条目异构：状态词条 / 教程图文 / 位面词条），误用会把它们算进条目级覆盖率断言。分区标题与说明性小节标签属**页面级 chrome**（源数据无此文本，可合成；措辞差异按上一条的粒度规则处理）；**「污染」同形词说明是站点自撰文案，但属内容级文本**——页面（`VoracityView.vue`）与快照两处硬编码，**必须逐字一致**，改一处必须同时改另一处，不允许措辞分叉；实体性内容（活动名与描述、愿力档位、进度文案、侵蚀/支援描述、状态词条、教程文案、位面词条）必须逐字来自 `voracity.json`；**进度类字段统一按百分比呈现**（`progress_steps[*].progress` 与 `activity.buff_levels[*].progress_percent`，后者为愿力分档进度）：口径镜像页面 `VoracityView.vue` 的 `ratioPct`/`fmtPct`（0~1 视作比例、>1 原样视作百分数、钳到 [0,100]、保留 1 位小数，如 `0.4 → 40%`、`0.7 → 70%`），`null` 档不输出百分比。`invasion.levels[*].name` 在上游 TextMapCHS 缺失（属预期）→ 只用固定分区名 + `侵蚀等级 {invasion_id}`，**禁止**为缺失名称兜底命名。
- 文本处理：数据里的游戏标记（`<color=…>`、`<unbreak>`、`<u>`、`\n`）必须剥成纯文本或安全 HTML；**所有数据派生文本必须 HTML 转义**（与前端 `escHtml()` 同纪律）。守卫断言可见文本中不残留 `<color=` / `<unbreak>` / `\n`。
- 单实体文本上限 `SNAPSHOT_TEXT_LIMIT = 4000` 字符（目录条目）/`20000`（详情页），超出截断并加 `…`——防止 `maze.json`（2.9MB）等把 dist 撑爆。截断是有意取舍，不得静默改成全量。

## 4. JSON-LD

每页一个 `<script type="application/ld+json">`，`JSON.parse` 必须成功（守卫断言）：

- **每种页面类型都必须带 `dateModified`**（取值 = `version.json.synced_at`，与 sitemap `<lastmod>` 同源）：`CollectionPage`（首页 / 各目录页 / 枢纽页，`ldCollection`）、数据条目页（`ldDataPage`）、角色详情页（`ldCharacter` 的 `WebPage` 节点）、专题页 `Article`（`ldArticle`）四类齐全。缺它的那批页面（曾恰好是首页 + 全部目录枢纽 + 98 个角色详情）等于对机器「没有发布时间」，而 JSON 完全合法、任何解析类断言都查不出来。`ldCollection` 的取值走模块级 `SNAPSHOT_SYNCED_AT`（十余处调用点都不带 `ctx`，而该值与语言无关）。

- 目录页：`CollectionPage`（`name`/`url`/`inLanguage`/`isPartOf: WebSite`）+ `ItemList`（有详情路由的条目给 `url`）。
- 角色详情页：`WebPage` + `mainEntity` = `Person`（`@id` 供页面内引用；游戏属性走 `Person.characterAttribute`）。
- **数据条目页**（光锥 / 遗器 / 敌对物种 / 终局赛季 / 终局玩法 / 货币战争角色与羁绊详情）：`WebPage`（`@id`/`name`/`description`/`dateModified`/`inLanguage`/`mainEntity`）+ `mainEntity: Thing` + `BreadcrumbList`。
  - 条目类型一律 `Thing`：schema.org 没有「光锥 / 遗器 / 敌对物种」这类类型，自造类型机器不认（要挑 schema.org 有定义的属性）。
  - **禁止用 `Article` 描述数据条目页**——那等于告诉机器「这是一篇资讯稿」，条目身份与属性都拿不到；`Article` 只允许出现在 `/voracity`（站点撰写的叙述性专题长文）。
- 专题页（`/voracity`）：`Article` + `BreadcrumbList`，**不**用 `CollectionPage` + `ItemList`：专题页不是目录，分区是异构条目的叙述性集合，写成 `ItemList` 等于把「收录清单」语义强加给它，与 §3「不收 `nk-snapshot__entry`」的规则自相矛盾。
- **`inLanguage` 按当前构建语言取 `languages.json` 的 `culture`**，与页面 `<html lang>`、`og:locale`（下划线形）三者同源。硬编码 `zh-CN` 会让 228 份语言前缀快照的富媒体信息全部自称中文页，而 JSON 完全合法——任何解析类断言都查不出来。
- 理由写清：**富结果与实体消歧，不是 AI 引用杠杆**（Ahrefs 1,885 页 DiD 实测无引用提升，见 memory 文档）。

## 5. robots.txt（Lead 手写，提交入库）

- 分组显式 `Allow: /`：`OAI-SearchBot`、`PerplexityBot`、`Claude-SearchBot`、`Googlebot`、`bingbot`（命中具体 UA 组时 `User-agent: *` 组被完全忽略，故每组必须自足）。
- `Disallow: /prerender/`（快照是同一内容的第二份 URL，避免重复收录；爬虫请求的 `/character/1308` 与 rewrite 目标无关，robots 只作用于请求 URL）。
- 末行 `Sitemap: https://myhsr.wiki/sitemap.xml`。

### 站点所有权验证（Google Search Console，2026-09 落地）

origin 迁至自有域名 `myhsr.wiki` 后 DNS 归站方控制：GSC 应为 `myhsr.wiki` 建 **网域** 资源（DNS TXT 验证，一次覆盖全部协议与子域）；旧 `myhsr.vercel.app` 前缀资源仅余历史数据，新域收录必须走新资源。**三个验证资产分属三条通道，都必须常驻**（token 与 HTML 文件属生成它们的 Google 账号、与域名无关，URL 前缀资源可复用），GSC 会周期性复验，删任一即失去对应资源的数据：

1. `index.html` 的 `<meta name="google-site-verification" content="5PSScRDejeMnyjRVQTH2t05GY4tmJ2oG3-JMqQZL_cs" />`（随 shell 模板进入全部快照；首页由 `dist/index.html` 直接投递，GSC 抓首页即读到）；
2. `public/google0415a67deffb7705.html`，内容为 `google-site-verification: google0415a67deffb7705.html`（GSC 推荐/默认自动尝试的方式；文件在 dist 根，文件系统优先命中，不受 catch-all 影响）；
3. 网域资源的 DNS TXT：主机记录 `@`、类型 `TXT`、值 `google-site-verification=3VzU4GhUPzJQ9E26YsxS0luwxU-zfIZpREBvcHgjXNI`、TTL 600。该记录**不在仓库里**：`myhsr.wiki` 的权威 NS 是 `ns1/ns2.nameslink.com`，只在 NamesLink 控制台（域名管理 → 我的域名 → myhsr.wiki → 解析）维护，保存需安全邮箱 MFA 验证码；仓库任何改动都不会同步它，只能靠本清单留档。

网域资源与 meta/文件属**不同验证通道**：换 token 须在 GSC 重新获取后改对应通道的那一处（网域资源改 TXT，URL 前缀资源改 meta 与 HTML 文件），改错通道不会生效。网域资源另有一条硬约束：**属性域名必须逐字 `myhsr.wiki`**——`myhrs.wiki`（m 与 h 换位）是未注册域名（NXDOMAIN），且 GSC 为该属性签发的 token 与本域无关，TXT 加到正确域名上也验证不过。验证通过后应在 GSC「站点地图」提交 `https://myhsr.wiki/sitemap.xml`（Google 唯一主动提交入口）。

### 双域名：主域 + `myhsr.vercel.app` 兜底（2026-10 落地）

Vercel 项目的 Domains 里**同时保留** `myhsr.wiki` 与 `myhsr.vercel.app`，两者都是 `Connect to an environment → Production`（直接服务、不做跳转），只有 `www.myhsr.wiki` 是 `308 → 根域`。`myhsr.vercel.app` 的存在理由是**域名到期兜底**：DNS 随域名一起失效时，旧 `.vercel.app` 域不依赖那条 A 记录，站仍可访问。

- **不要顺手移除 `myhsr.vercel.app`**：它是唯一在域名失效后仍可用的入口，删掉就无法兜底；它与「域名到期后该改哪里」耦合，属于删了不报错、只在事故当天才发现的那类损失。
- **双主机不算重复内容**：canonical / `og:url` / hreflang / JSON-LD 的 URL 全部是**绝对**地址、指向 `SITE_ORIGIN`，故 `myhsr.vercel.app` 上抓到的每一页都自报正式地址为 `myhsr.wiki`。根路由也一样——`dist/index.html` 本身就是 home 快照（与 `prerender/home.html` 字节一致），不存在「相对 canonical 自指」的缺口；守卫第 3 组对每份快照断言 canonical 同源存在，写错即构建失败。
- **域名到期要切兜底**：改 `tools/gen-ai-endpoints.mjs` 的 `SITE_ORIGIN` 常量 + `index.html` 的 `<meta name="google-site-verification">` 与 `og:image` 两行 + `public/robots.txt` 的 `Sitemap` 行，重新部署；GSC 侧需按新域重建资源或另配验证。origin 在本站是**代码常量**（不是环境变量），所以切换是一次提交，不是改后台。
- 反向配置会出真故障：根域若被设成 `308 → www`，sitemap 里每条 URL 都落在重定向链上，GSC 判「不允许的网址」（2026-10 在另一站实测到该形态）。

## 6. 守卫：`tools/check-ai-endpoints.mjs`

构建后运行（`pnpm build` 末步），失败即构建失败。守卫按 **7 组**汇总（`N/7`：1 入口文件 / 2 sitemap / 3 快照正文 / 4 覆盖率 / 5 条目级覆盖率 / 6 外壳与首页 / 7 汇总），下表 1–5 与分组**不是一一对应**——新增断言一律标注其实际组号。断言：

1. `public/robots.txt` 存在、含上表 5 个 UA 组、`Disallow: /prerender/`、`Sitemap:` 与生成器 `SITE_ORIGIN` 同源；`dist/llms.txt` 存在、有 H1、不含 HTML 标签、其中每个绝对 URL 与 `SITE_ORIGIN` 同源（**不断言清单内容**——入口清单会随目录页增减漂移，写进守卫即第二事实源）。
2. `dist/sitemap.xml` 为合法 URL set，`<loc>` 全为绝对 URL 且同源，无重复，URL 数 = 快照数 + 0（快照与 sitemap 一一对应），单文件未超 50,000。
3. 每个 `dist/prerender/**/*.html`：**正文抽取必须非空**（抽取为空即判红；抽样面 = `.nk-snapshot` 之后的可见文本）、`<title>` 非空且不等于站点默认标题、有 `<link rel="canonical">`（同源）、有 ≥1 个 `href="/`、去标签后中文字符 ≥ 80、`<h1>` 存在、JSON-LD `JSON.parse` 成功、无残留游戏标记、**无未展开参数标记 `#\d+\[[^\]]*\]`**（缺参数的字段必须整段省略，见 §3「参数展开保真」；字面 `#NN` 编号与 `{TEXTJOIN#…}` 不在此列）、**汉字脚本语言（`cn`/`cht`/`jp`/`kr`）以外的分层快照正文禁汉字**（棘轮，口径见上「守卫口径」）、入口 `<script src="/assets/…">` 与 **`dist/prerender/_shell.html`** 一致（`dist/index.html` 现在是 home 快照，不得再当外壳基线）。**新增（P0 批次，落在守卫第 3 组）**：每份快照必须含 `"dateModified":"{synced_at}"`（页面级节点 `WebPage` / `CollectionPage` / `Article`）与 `<time datetime="{synced_at}">{synced_at}</time>`（取值与 `version.json.synced_at` 逐字一致）；**任何快照不得含 `noindex` 子串**；`_shell.html` 则**必须**含 `<meta name="robots" content="noindex">`（同属第 3 组的前置断言）。
   - **JSON-LD 内嵌 URL 三项断言**（前缀改写的机械兜底，缺一项就会重演静默断链）：① **语言归属**——分层快照的 LD 同源 URL 路径必须落在 `/<locale>` 下（**唯一豁免站点根 `/`**，那是 `isPartOf` 的 WebSite 本体）；判据必须写成**白名单**「首段 == 本语言前缀」，**不得**写成黑名单「找到别的语言前缀」（`^[a-z]{2,3}$` 匹配不到 `encharacter` 这类粘连形态 ⇒ 正是实测缺陷静默全绿的原因）。② **形状**——同源 URL 去掉站点源后必须为空或以 `/` 开头，拦 `SITE_ORIGIN + href` 少前导斜杠的拼接。③ **自身 URL 在场**——LD 里至少有一个 URL 等于本页 canonical 路径，拦「整份前缀改写缺失」。
   - **前缀改写必须按路径段做，禁止字符串 `split/join` 拼接**：`from` 的收尾斜杠是段分隔符，而 home 的 route 恰是 `/` ⇒ `…wiki/character/1503` 会被粘成 `…wiki/encharacter/1503`（该形态能解析、请求还能 200）。生成器实现 = `prefixLdUrls`：同源 URL 一律改写到 `/<locale>/…`（`/` 站点根同样前缀化），**唯一豁免 `isPartOf` 的 WebSite 本体**。
   - **社交卡片与语言标注**：每页必须有 `og:image`（同源）与 `twitter:card=summary_large_image`；`og:locale` 必须等于 `<html lang>` 的下划线形；JSON-LD 的 `inLanguage` 必须等于 `<html lang>`；`Article` 只允许出现在 `/voracity`（数据条目页出现即判红）；`prerender/_shell.html` 的静态 `og:image` 必须与 `SITE_ORIGIN` 同源；`og:image` 指向的**文件本身**必须存在且为 PNG、尺寸与 `og:image:width/height` 声明一致（只断言标签不断言文件，删掉图就是线上空卡片）。这些断言都做过「故意弄坏它」的反向验证。
   - 另：**`currency/item.html`（CW 装备）与 `currency/augment.html`（CW 投资策略）的可见文本不得含裸 `#N`**——该族数据条目携带 `params` 语义（见 §3），裸 `#N` 即占位符；**裸形态无法全局区分字面与占位符**（角色/成就/物品里的「天才俱乐部#81号会员」是上游字面，必须保留），故按页点名而非全局正则。**该断言只扫实体解码后的可见文本**（`html, body { background:#121214 }` 这类 shell 模板色值只出现在注释 / `<style>` / 内联属性里，按原始面断言会永久红）；原始面扫描须先剥 HTML 注释。**已知覆盖边界**：裸 `#N` 断言只点名上列两页——生成器侧已按「条目是否携带 `params`/`base_params`/`param_list`」通用判定（`hasParamSemantics`），若未来在**其它** params 语义族（如 `/currency/buff`）发现泄漏，须把该页加入点名表并复跑守卫。
4. **覆盖率（文件级 + 条目级）**：① 每族生成文件数 = §2 表内**应用可见**条目数；② 12 个与数据一一对应的目录页，快照内 `<li class="nk-snapshot__entry">` 计数 = 同一可见条目数（防「静默漏条目」——生成器 map 中途异常/上限误用不会被文件数断言发现）；③ `/`、`/currency` 枢纽页断言条目数 ≥1（新版本必定有新条目；`release_version` / 赛季代际判据失效导致的静默空态必须拦住）；④ 单页族中 `/voracity` 与 `/formula`（两个专题页）只断言「无 `:id` 的路由各恰好 1 个快照文件」与「12 语言分层各 1 份」，**无条目级断言**——它们不是目录、也不是枢纽页，正文分区不是收录条目集合（见 §3）；⑤ 反向断言：**专题页 `prerender/voracity.html` 与 `prerender/formula.html` 的 `nk-snapshot__entry` 计数必须 = 0**（该类名未在这两页登记，一旦有人把分区当目录收录清单来标即失败，避免异构条目静默变成覆盖率数字）。期望一律从数据 + 应用可见性判据**实时统计**，禁止写死数字。**新增（P0 批次；组号 = 守卫生成的 `N/7` 汇总行，本表 1–5 与分组不是一一对应）**：⑥ `/item` 与 `/achievement`（含 13 语言，共 26 份）的每个 `nk-snapshot__entry` 必须位于带**非空 `<h2>`** 的 `nk-snapshot__section` 内（**第 5 组**）；⑦ 全站 1445 份不得出现空 `<ul class="nk-snapshot__list"></ul>`（**第 5 组**）；⑧ 首页族（`home.html` + 12 个 `<locale>/home.html`）必须含 `<ul class="nk-snapshot__stats">` 且恰好 6 条 `.nk-snapshot__stat`，路由集合 = `/character` `/lightcone` `/relic` `/item` `/monster` `/achievement`，每条 `.nk-snapshot__stat-n` 的数字 = 该目录页**实时统计**的可见条目数，`nk-snapshot__stats` **只允许出现在首页族**（**第 6 组**）。
5. 汇总一行 `[PASS] …`/`[FAIL] …`，非零退出即失败。

## 7. 验证边界

- AI 侧只保证**代码与规格**：构建产物断言 + 无 JS 可读性（静态文件取证）。线上 rewrite 投递行为需 preview 部署实测（Vercel 对 rewrite 目标缺文件的处理 = 404 或回落 catch-all，两者均可接受）。
- 视觉表现（快照在真实浏览器中是否闪现）交用户 RunPreview 确认；JS 用户路径在 `html.js` 规则下与现状一致。

## 8. 页面形态：第四种「单页数据页」（玩法详情页）

`/endgame/{mode}`（忘却之庭 / 虚构叙事 / 末日幻影 / 异相仲裁）是继「枢纽页 / 目录页 / 详情页」之后的第四种形态：

- **定位**：一页讲清一个**玩法**（常青规则），不随赛季轮换；赛季级内容仍在 `/endgame/{mode}/{id}`。
- **正文来源**：`public/data/cn/endgame_guide.json`（`sections` 逐字来自 `IntroData` 分节）+ 终局产物（当期赛季的结构口径与当期增益名）。
- **快照约定**：**不使用 `nk-snapshot__entry`**，**无条目级覆盖率断言**（`check-ai-endpoints.mjs` 把它归入 `singleFamilies`，各恰好 1 个快照文件）；正文含 h1 + 面包屑 + 规则分节 + 结构事实 + 增益体系（名/条数/选法）+ 当期增益**名称清单** + ≥3 条同玩法赛季内链 + 其它玩法内链。
- **为什么当期增益只出名称**：`MazeBuff.desc` 含 `#N[i]` 参数占位，快照不展开参数 ⇒ 直接输出 desc 会命中守卫的「禁未展开 `#N[i]`」断言。名称清单已足够承载「本期有哪些增益」。
- **与专题页（`/voracity`）的区别**：专题页正文是站点撰写的长文；玩法页正文是**官方规则原文**，站点不加润色。

