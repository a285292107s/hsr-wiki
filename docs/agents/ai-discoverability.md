# AI 检索可见性：构建期预渲染快照（契约）

> 事实依据（检索结论 + 证据强度）见 [docs/memory/ai-crawler-facts.md](../memory/ai-crawler-facts.md)。
> 本文是**实现契约**：产物路径、路由覆盖、生成规则、守卫断言。改动本文件即改动生成器与守卫的接口，三者必须同步。

## 0. 为什么做

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
| 路由投递 | `vercel.json` rewrites（快照规则在 catch-all 之前） | Lead |

快照 = **构建后的 `dist/index.html` 原样复制**，再注入 5 项内容（顺序无关）：
1. `<head>` 首部内联 `<script>document.documentElement.classList.add('js')</script>`；
2. `<head>` 内 `<style>html.js #app > .nk-snapshot{display:none}</style>`；
3. 覆盖 `<title>`、`<meta name="description">`、`<meta property="og:title">`、`<meta property="og:description">`、`<meta property="og:url">`，新增 `<link rel="canonical" href="{origin}{route}">`；
4. 一段 `<script type="application/ld+json">`（见 §4）；
5. `<div id="app">` 内注入 `<div class="nk-snapshot">…</div>`（见 §3）。

**必须复制构建后的 shell 而非重写模板**：否则 `/assets/*` 内容哈希会漂移。守卫断言快照引用的入口 JS 与 shell 完全一致。

**Vercel 投递模型（2026-09 线上实测，决定产物布局）**：Vercel **先命中文件系统、再走 rewrites**。因此：
- 有对应静态文件的路由（`/robots.txt`、`/prerender/x.html`）直接被文件服务，rewrite 不参与；
- 无文件的路由（`/character/1308`）才落到 rewrite → 投递 `prerender/character/1308.html`；
- **`/` 会命中 `dist/index.html`，`{"source":"/"}` 的 rewrite 永不生效** → 因此 home 快照**必须同时写入 `dist/index.html`**（与 `prerender/home.html` 字节一致），而把**纯 SPA 外壳**放到 `dist/prerender/_shell.html`（下划线前缀 = 非快照，守卫跳过；`/prerender/` 已在 robots 里 Disallow），catch-all rewrite 指向它。
- rewrite 目标缺文件时**回落到 catch-all**（实测 `/character/99999`、`/endgame/boss/3022` 返回 SPA 外壳而非 404）——未发布/不存在实体的 URL 行为与改造前一致，无回归。

## 2. 路由覆盖（唯一权威清单）

`origin` 常量 = `https://myhsr.wiki`（自有域名，2026-10 迁入；旧 origin `myhsr.vercel.app` 因中国大陆可达性问题不再作为 canonical/sitemap 源；`tools/gen-ai-endpoints.mjs` 内 `SITE_ORIGIN`；`public/robots.txt` 的 `Sitemap:` 行必须与之同源，守卫断言一致）。

| 路由 | 快照文件 | 数据源（`public/data/cn/` 下） | 详情条目 |
| --- | --- | --- | --- |
| `/` | `prerender/home.html` | version.json + characters/light_cones/relics | 版本上新三分区（判据同 ADR 0019） |
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

**不生成**：`/settings`、`/currency/settings`、`/debug`（无内容页）；旧路径重定向（`/maze` 等）由前端路由处理。

**可见性对齐（硬约束）**：快照与 sitemap 的条目集合 = **应用真正展示的条目集合**。凡各 `src/app/catalog/pages/*.ts` / 视图中对条目做了过滤（如 `endgame.ts` 的 `if (!info || !info.zh) continue;`），生成器必须施加同一判据——**禁止为被隐藏条目兜底命名**（违反「文本数据来源」硬约束，且会把未发布内容写进索引）。守卫侧独立按同一判据从数据统计期望值（两边各自实现，靠本契约同步）。

**数据源细节以对应视图/服务的实际取数逻辑为准**（`src/services/api/*`、`src/app/views/*`、`src/app/catalog/pages/*`）——生成器不得自建数据源、不得写死实体内容。

## 3. 快照正文规则

- 每个 `<a href>` 必须是真实站内路径（如 `/character/1308`），**禁止 `#` 或 JS 链接**；内链是快照存在的首要目的。
- **页面 ↔ 快照的对齐粒度**：**实体级事实标签必须与页面逐字一致**（`<h1>`、实体名、`受『贪饕』侵蚀` 这类事实行、一切数据派生文本）；**页面级 chrome 允许快照使用更完整的措辞**（分区标题可带括号说明、分组标签可用全称、装饰性英文如 `INVASION` 不进快照）。既有实例：`MonsterDetailView.vue` 的 `受『贪饕』侵蚀` 与生成器逐字相同，而 `/voracity` 分区标题 `「贪饕」侵蚀（敌方与玩家支援）` 与分组标签 `侵蚀等级 N` 是快照侧的完整措辞（页面为 `「贪饕」侵蚀 INVASION` / `侵蚀 LV N`），**双方都保持现状**——禁止把页面 chrome 逐字搬进快照，也禁止反过来要求 chrome 逐字对齐。
- 详情页必须含：`<h1>{实体名}</h1>`、一句话摘要段（**仅当源数据提供文本时输出**：角色 `desc` → `chara_info.stories` 首个非空；敌对物种 `intro`）、属性事实表（`<dl>` 或 `<table>`，值全部来自数据）、面包屑 `<a>`（首页 → 图鉴 → 实体）、**≥3 条同类实体内链**（上一/下一个或同图鉴前若干条）、`数据最后更新：{version.json.synced_at}`。
- **敌对物种「贪饕」侵蚀标记与回链（ADR 0025）**：怪物详情数据带可选块 `invaded`（T1 契约）时，事实表额外输出一行「受『贪饕』侵蚀 · 等级 {`invaded.invasion_ids`} · {`/voracity` 链接}」（标签字符串与 `MonsterDetailView.vue` 逐字一致）。判据 = **目录条目自身的详情文件**里该块是否存在（`monsters.json` 条目 → `monsters/{id}.json`）——**禁止**按 id 白名单硬编码，**禁止**按 `monsters/` 目录枚举详情文件：该目录下的实例变体页（长号实例 ID）不在 `monsters.json` 目录内、应用不展示、快照也不生成（实测带 `invaded` 的详情文件 217 个，其中仅 24 个是目录条目，故只有 24 个快照带该标记）。无该块的怪物不输出此行。同一段的**掉落与出没**两行的契约镜像这条：`drops` / `appearances` 块存在才输出，值逐字取自该块（掉落只列**基准档**（`world_level` 为 `null`）的物品名 + 总档数，出没输出关卡总数 + 至多 3 个样本名）——**禁止**在生成器里另算一遍关卡数或掉落（那会造出第二个事实源，且与页面口径分叉）。
- **怪物详情快照的四维数值仍是「模板基准值」**（`stats.hp/atk/def/speed`），标签逐字写「生命（模板基准）」等：页面按 `基准 × 维度修饰比 × 等级曲线 + 实例修正值` 在等级滑条上合成（ADR 0040 / ADR 0045），快照**不做合成**（不在生成器里实现第二份算式）。韧性直接取 `stance`（不入曲线链，与页面一致）。改口径时两处（页面注记 / 快照标签）必须同批改，不允许只动一处。
- **状态词条分区**（`MonsterStatusConfig` 安全子集）：怪物详情快照的「状态词条」分区逐条输出 `名称（增益/减益/其他 · 可驱散）` + **仅有值时**的描述——描述只在源文本**既无 `#N[i]` 占位符、也无 `%宏`**（`%CasterName` / `%DynamicTargetName`）时才有（数值与运行时名称本仓都不可知），故**禁止**在生成器里补参、拼接或渲染 `?`；归属判据与页面同源（命名约定桥 + 去形态后缀同名，见 `docs/data/转换器字段映射.md` 的 monster_extra 段）。
- **禁止为无数据实体合成通用句**（实测反例：「X 是《崩坏：星穹铁道》的可玩角色。」）——应用对这类实体渲染**空描述**（`CharHero.vue`），快照必须一致；空数据的段落**整段省略**，不得把前端的占位文本复制进快照（避免第二事实源）。但 `<meta name="description">` / `og:description` 仍须非空，用**数据字段拼装**（角色：名称 + 稀有度/元素/命途；敌对：名称 + 分类/阵营）。
- 页面级摘要（目录页/枢纽页，含条目数等集合事实）属**页面元描述**而非实体事实，允许保留合成。
- 源文本里的**字面 `#NN`**（如「天才俱乐部#81号会员」这类编号）原样保留：它们不是参数占位符，**禁止**为了对齐前端渲染（`fmtDesc` 会把无参 `#1` 渲染成 `?`）把真实文本改成 `?`——快照以数据忠实为准。
- **参数展开保真**：描述文本必须按前端 `fmtDesc`/`fmtVal` 口径展开（数值、`%` 保留、`null`→`?`）。**若源数据缺参数导致无法完整展开（可见文本残留 `#N[...]` 标记），该字段不得进入快照**——前端卡片本就不渲染该字段（如光锥目录卡片只渲染 `skill_name`）、或渲染成 `?` 残句，两者都是噪声。缺参数的实体因此少一段（**不**影响条目集合与 sitemap）。
- **上游数据例外**：源文本里的字面 `#NN` 编号、转换器未解析的合并标记（如物品名里的 `{TEXTJOIN#61}`）与应用显示一致，属上游/转换器域，**原样保留并单独立项**，不在本域修。
- 目录页必须含：`<h1>{路由 meta.title}</h1>`、条目清单（每条 `<a href="/…">名称</a>` + 属性摘要；无详情路由的条目如物品/成就输出名称 + 描述文本），`数据最后更新`。
- **目录条目稳定标记（守卫依赖）**：**收录条目清单**里每个条目必须渲染为 `<li class="nk-snapshot__entry">…</li>`——包括 12 个目录页的条目清单，以及枢纽页（`/` 版本上新三分区、`/currency` 本赛季分区）的收录条目。该类名**禁止**用于详情页的导航性列表（同图鉴/同模式内链、「羁绊成员」等）。守卫按此标记逐目录计数并断言 = 应用可见条目数——否则「生成器静默漏条目」（例如 map 中途异常、上限误用）无法被任何断言察觉；枢纽页则断言 ≥1（新版本必定有新条目，判据失效会让枢纽页静默空态，必须拦住）。
- **枢纽页分区级列表入口**：`/` 与 `/currency` 的每个分区在快照里额外输出一条 `查看全部{X}` 内链（`<p class="nk-snapshot__more">`，目标 = 该分区对应图鉴页：`/character` `/lightcone` `/relic` / `/currency/role` `/currency/trait`），与应用分区头右端的 `.nk-hub-release__all` **同源同目标**（同一份 `listHref`）。措辞属页面级 chrome（页面写「全部角色」、快照写「查看全部角色」），按 §粒度规则允许不同；该 `<p>` **不使用** `nk-snapshot__entry`（它不是收录条目）。
- **专题页正文规则（`/voracity`，ADR 0025 的第三种页面形态）**：必须含 `<h1>贪饕污染</h1>` + 面包屑（首页 → 贪饕污染）+ 分区（玩法概览 / 污染等级与愿力 / 「贪饕」侵蚀（敌方与玩家支援）/ 波及关卡与被污染怪物 / 状态词条 / 教程图文 / 位面词条 / 「污染」同形词说明）+ `数据最后更新：{synced_at}`。波及关卡的怪物在 `detail_id` 非空时输出**真实内链** `/monster/{detail_id}`（**禁止 `#`**）；`detail_id` 为空说明模板 ID 未解析成功，只输出纯文本，**不得造链、不得兜底命名**。**专题页一律不使用 `nk-snapshot__entry`**：该标记语义已冻结为「12 个目录页 + 枢纽页的收录条目清单」，专题页的分区列表不是「应用收录条目集合」（条目异构：状态词条 / 教程图文 / 位面词条），误用会把它们算进条目级覆盖率断言。分区标题与说明性小节标签属**页面级 chrome**（源数据无此文本，可合成；措辞差异按上一条的粒度规则处理）；**「污染」同形词说明是站点自撰文案，但属内容级文本**——页面（`VoracityView.vue`）与快照两处硬编码，**必须逐字一致**，改一处必须同时改另一处，不允许措辞分叉；实体性内容（活动名与描述、愿力档位、进度文案、侵蚀/支援描述、状态词条、教程文案、位面词条）必须逐字来自 `voracity.json`；**进度类字段统一按百分比呈现**（`progress_steps[*].progress` 与 `activity.buff_levels[*].progress_percent`，后者为愿力分档进度）：口径镜像页面 `VoracityView.vue` 的 `ratioPct`/`fmtPct`（0~1 视作比例、>1 原样视作百分数、钳到 [0,100]、保留 1 位小数，如 `0.4 → 40%`、`0.7 → 70%`），`null` 档不输出百分比。`invasion.levels[*].name` 在上游 TextMapCHS 缺失（属预期）→ 只用固定分区名 + `侵蚀等级 {invasion_id}`，**禁止**为缺失名称兜底命名。
- 文本处理：数据里的游戏标记（`<color=…>`、`<unbreak>`、`<u>`、`\n`）必须剥成纯文本或安全 HTML；**所有数据派生文本必须 HTML 转义**（与前端 `escHtml()` 同纪律）。守卫断言可见文本中不残留 `<color=` / `<unbreak>` / `\n`。
- 单实体文本上限 `SNAPSHOT_TEXT_LIMIT = 4000` 字符（目录条目）/`20000`（详情页），超出截断并加 `…`——防止 `maze.json`（2.9MB）等把 dist 撑爆。截断是有意取舍，不得静默改成全量。

## 4. JSON-LD

每页一个 `<script type="application/ld+json">`，`JSON.parse` 必须成功（守卫断言）：

- 目录页：`CollectionPage`（`name`/`url`/`inLanguage: zh-CN`/`isPartOf: WebSite`）+ `ItemList`（有详情路由的条目给 `url`）。
- 详情页：`Article`（`headline`/`description`/`dateModified: synced_at`/`inLanguage`）+ `BreadcrumbList`。
- 专题页（`/voracity`）：与详情页同构——`Article` + `BreadcrumbList`，**不**用 `CollectionPage` + `ItemList`：专题页不是目录，分区是异构条目的叙述性集合，写成 `ItemList` 等于把「收录清单」语义强加给它，与 §3「不收 `nk-snapshot__entry`」的规则自相矛盾。
- 理由写清：**富结果与实体消歧，不是 AI 引用杠杆**（Ahrefs 1,885 页 DiD 实测无引用提升，见 memory 文档）。

## 5. robots.txt（Lead 手写，提交入库）

- 分组显式 `Allow: /`：`OAI-SearchBot`、`PerplexityBot`、`Claude-SearchBot`、`Googlebot`、`bingbot`（命中具体 UA 组时 `User-agent: *` 组被完全忽略，故每组必须自足）。
- `Disallow: /prerender/`（快照是同一内容的第二份 URL，避免重复收录；爬虫请求的 `/character/1308` 与 rewrite 目标无关，robots 只作用于请求 URL）。
- 末行 `Sitemap: https://myhsr.wiki/sitemap.xml`。

### 站点所有权验证（Google Search Console，2026-09 落地）

origin 迁至自有域名 `myhsr.wiki` 后 DNS 归站方控制：GSC 应为 `myhsr.wiki` 建 **网域** 资源（DNS TXT 验证，一次覆盖全部协议与子域）；旧 `myhsr.vercel.app` 前缀资源仅余历史数据，新域收录必须走新资源。**两个验证资产都必须常驻**（token 与 HTML 文件属生成它们的 Google 账号、与域名无关，URL 前缀资源可复用），GSC 会周期性复验，删任一即失去数据：

1. `index.html` 的 `<meta name="google-site-verification" content="5PSScRDejeMnyjRVQTH2t05GY4tmJ2oG3-JMqQZL_cs" />`（随 shell 模板进入全部快照；首页由 `dist/index.html` 直接投递，GSC 抓首页即读到）；
2. `public/google0415a67deffb7705.html`，内容为 `google-site-verification: google0415a67deffb7705.html`（GSC 推荐/默认自动尝试的方式；文件在 dist 根，文件系统优先命中，不受 catch-all 影响）。

换 token 必须在 GSC 重新获取后**同步改这两处**。验证通过后应在 GSC「站点地图」提交 `https://myhsr.wiki/sitemap.xml`（Google 唯一主动提交入口）。

## 6. 守卫：`tools/check-ai-endpoints.mjs`

构建后运行（`pnpm build` 末步），失败即构建失败。断言：

1. `public/robots.txt` 存在、含上表 5 个 UA 组、`Disallow: /prerender/`、`Sitemap:` 与生成器 `SITE_ORIGIN` 同源。
2. `dist/sitemap.xml` 为合法 URL set，`<loc>` 全为绝对 URL 且同源，无重复，URL 数 = 快照数 + 0（快照与 sitemap 一一对应），单文件未超 50,000。
3. 每个 `dist/prerender/**/*.html`：`<title>` 非空且不等于站点默认标题、有 `<link rel="canonical">`（同源）、有 ≥1 个 `href="/`、去标签后中文字符 ≥ 80、`<h1>` 存在、JSON-LD `JSON.parse` 成功、无残留游戏标记、**无未展开参数标记 `#\d+\[[^\]]*\]`**（缺参数的字段必须整段省略，见 §3「参数展开保真」；字面 `#NN` 编号与 `{TEXTJOIN#…}` 不在此列）、入口 `<script src="/assets/…">` 与 **`dist/prerender/_shell.html`** 一致（`dist/index.html` 现在是 home 快照，不得再当外壳基线）。
   - 另：**`currency/item.html`（CW 装备）与 `currency/augment.html`（CW 投资策略）的可见文本不得含裸 `#N`**——该族数据条目携带 `params` 语义（见 §3），裸 `#N` 即占位符；**裸形态无法全局区分字面与占位符**（角色/成就/物品里的「天才俱乐部#81号会员」是上游字面，必须保留），故按页点名而非全局正则。**该断言只扫实体解码后的可见文本**（`html, body { background:#121214 }` 这类 shell 模板色值只出现在注释 / `<style>` / 内联属性里，按原始面断言会永久红）；原始面扫描须先剥 HTML 注释。**已知覆盖边界**：裸 `#N` 断言只点名上列两页——生成器侧已按「条目是否携带 `params`/`base_params`/`param_list`」通用判定（`hasParamSemantics`），若未来在**其它** params 语义族（如 `/currency/buff`）发现泄漏，须把该页加入点名表并复跑守卫。
4. **覆盖率（文件级 + 条目级）**：① 每族生成文件数 = §2 表内**应用可见**条目数；② 12 个与数据一一对应的目录页，快照内 `<li class="nk-snapshot__entry">` 计数 = 同一可见条目数（防「静默漏条目」——生成器 map 中途异常/上限误用不会被文件数断言发现）；③ `/`、`/currency` 枢纽页断言条目数 ≥1（新版本必定有新条目；`release_version` / 赛季代际判据失效导致的静默空态必须拦住）；④ 单页族中 `/voracity`（专题页）只断言「无 `:id` 的路由各恰好 1 个快照文件」，**无条目级断言**——它不是目录、也不是枢纽页，正文分区不是收录条目集合（见 §3）；⑤ 反向断言：**专题页 `prerender/voracity.html` 的 `nk-snapshot__entry` 计数必须 = 0**（该类名未在此页登记，一旦有人把分区当目录收录清单来标即失败，避免异构条目静默变成覆盖率数字）。期望一律从数据 + 应用可见性判据**实时统计**，禁止写死数字。
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

