# 架构与重构

> 本域 memory 补的是 [docs/agents/architecture.md](../agents/architecture.md) 的盲区：分层纪律、配置驱动目录页、共享单例与 barrel 的**规则**已在其中声明，本文件只记规则推不出的坑位、判据的理由与失灵形态。ADR 已裁定的决策不复述，只标出 ADR 也推不出的那一半。

## 分层与目录归属

- **跨页借用的共享 class 只能是 `tokens.css` 已声明的原语**：页面级 class 借过去会命中不了样式，元素破相而不报错——`lightcone.css` 只随光锥路由 chunk 到达，怪物页借 `.nk-lc-rank-label` 即静默无样式。`src/styles/`
- **同一份样式放在哪个文件由消费面决定，不由「放哪都行」决定**：诊断色（`#ff6b6b` 等）只能落在 `src/app/debug/`，因为色彩守卫的 `SKIP_FILE` 只豁免 `debug/` 与测试——挪进 `styles/` 立刻被 `check-colors --strict` 拦下。`src/app/debug/spine-audit.css`
- **dev-only 研究线的样式不并入产品面令牌体系**：`/debug` 面板的等宽栈与产品面 `--font-mono` 不是同一条栈，dev-only 且无像素基线覆盖，改栈只会引入无从验收的渲染变化；该豁免由本条登记，**收口时禁止当裸字面量一并改掉**。
- **比字体/内距的基准取 `#app` 而不是 `body`**：`font-family` 设在 `#app` 上，`body` 的 computed 是 UA 默认衬线，拿 `body` 当基准会把正常输入框误判成「字体不继承」。

## 共享单例与 barrel

- **`src/services/api/index.ts` 是显式具名清单而非 `export *`**：新单例忘记登记 ⇒ 视图 import 到 `undefined`、onMounted 抛 TypeError、整页不挂载，e2e 表现为 hero 永不出现，**与数据缺失完全同形**。新增共享单例后先查 barrel 再跑页面。
- **单例只提供「首调发起、后续复用、失败重置」这一层，嵌套复用的并发合并要另写守卫**：缓存组内多条并行加载靠的是服务级缓存守卫，不是单例本身；把嵌套复用当成串行复用会重复请求。`src/services/api/singleton.ts`
- **「就绪才渲染」的 watch 必须配 `immediate: true`**：触发源取的是共享单例数据的长度，从其它路由返回时组件重建而 store 里仍有旧数据，触发源初值已非 0 ⇒ 首次触发被漏掉，渲染永远空白。
- **新增可索引路由必须同步三件（快照覆盖 + rewrite + sitemap）**：三者缺一由构建末步守卫拦截；但守卫只保证「覆盖到」，不保证条目正确——`nk-snapshot__more` 这类分区入口内链**不得**复用 `nk-snapshot__entry` 类名，否则会被条目级覆盖率算成收录条目。`tools/gen-ai-endpoints.mjs`
- **按 id 查名称/图标的共享映射不要在消费实例里各建一份**：星数奖励每档一个 `EndgameReward`，各建一份全量 `items.json` Map 会让单页出现多份；改为 `renders.ts` 的模块级 `shallowRef` 一次构建、失败清 promise 允许重试（与共享单例同一纪律）。`src/app/endgame/renders.ts` `src/app/endgame/EndgameReward.vue`
- **目录卡与详情视图共用同一份回退事实时必须两边都绑**：回退链在目录卡上是逐个绑 `data-cdn-fallback` 的，视图侧 `<img :src>` 不绑就没有第二条路——CDN 委托读不到属性即静默失去回退。

## 请求与缓存层

- **超时中止的判定要同时认名字与数值**：`20` 是 `DOMException.ABORT_ERR` 的规范数值，`cache.ts` 的 catch 里同时判 `e.name === 'AbortError'` 与该数值；只判一种会漏认超时、把它降级成普通网络错误（`NkError` 文案从 `Request timed out` 变 `Network error`，页面提示不变而诊断失真）。`src/services/cache.ts`

## types 按域拆分

- **杂物间 `types/misc.ts` 按域拆分的验收线是「barrel 契约不变 + 消费方零改动」**：拆文件只改声明归属，不许顺手改形状；一旦消费方需要跟着改，说明拆的是接口而不是文件。`src/services/types/`
- **按域拆完要复查「列表端点条目是否回本域」**：列表端点条目放在共享杂物间里会诱使下一个域再往里塞，拆分的收益当场归零。同类新增一律先问「它属于哪个域」，而不是「放 misc 会不会更省事」。

## 目录页配置驱动

- **`pages.ts` 注册表是目录清单的唯一事实源**：文档、AI 快照与 e2e 都不得另立清单；新增目录漏登记的表现是路由 404 或空白，而非构建失败，只能靠注册表比对发现。`src/app/catalog/pages/`
- **config 里新增 e2e project 属契约变化，必须登记子文件**：memory 的复盘段落不能替代登记项——当时只改了 config 与 memory，`docs/agents/testing.md` 仍写旧口径，形成漂移。[testing.md](../agents/testing.md)
- **catalog 配置 `styles` 数组的多个 loader 是并行执行的，顺序不保**：多块 CSS 有级联覆写关系时必须串成一个 async loader 依序 `await`，否则同特异性覆写顺序随机。`src/app/router/index.ts`
- **筛选选项的取值域固定写死，不按当批数据现取**：从数据派生选项会在「本批恰好没有该类条目」时让选项消失、筛选栏跳位（如弱点元素恒取 7 项）；数据驱动只用于「有多少种就列多少种」的枚举（阵营 / 系列 / 命途），且须有单测兜「每个非空选项至少命中一条」。`src/app/catalog/pages/monster.ts`
- **带专属样式的目录在 config `styles` 字段声明，不新增视图**：这条是规则；其盲区是**非列表页的两类例外**（枢纽页与专题页）不适用该断言——专题页无条目级快照，用目录页的断言去框它会得出假失败。`src/app/catalog/pages/shared.ts`
- **删掉 DOM 后钉住它的断言要「搬家」而不是删除**：先问断言锁的是元素还是关系——锁相对序的改成相对序断言、锁身份的改 `aria-labelledby`，直接删干净等于丢掉契约。
- **删除类任务的任务描述必须附「必须存活的同名资产清单 + 验证命令」**：仓库存在同名不同物的概念（两个 season），只写「注意别删错」无效；给清单加 `git grep -c` 实测比形容词有效。

## 跨文件重复实现

- **同一语义状态出现第二份实现即漂移起点**：状态态是最容易被漏的一类——不是组件、没有类型约束、守卫也不看它，只有把「同一状态 / 同一空态」当成审核类别逐页清点才抓得到。收口到单一原语后页面自建态各自删净。
- **CSS 层的重复实现同样成立，而色彩与对比度守卫完全看不到它**：那两个守卫只查裸色值与原始层引用，查不出「同一条选择器被写两遍」。重复选择器审计工具的必要性在于此，不在色彩。
- **审计工具报的 A 段要区分「静默覆盖」与「有意覆盖」**：后者（粘性首列必须不透明、媒体右移后开关位置反向补偿）不是重复实现，工具只判「选择器出现两次」且读不到注释 ⇒ 有意的那条按本条登记为豁免，保留覆盖（代码里不留解释性注释）；只有连语义都相同的才是事故。
- **合并两处重复实现时才会浮出潜伏 bug**：一处用正斜杠、调用处比较的是 `path.relative` 的原生分隔符 ⇒ Windows 下排除项从未生效。跨平台路径比较统一到正斜杠后再比；「在某平台正常」的实现会让重复代码活得比缺陷久。`tools/doc-scope.mjs`
- **彼此独立的数据源必须并发取（`Promise.all` + 逐源 `try/catch`）**：`for + await` 是串行往返瀑布（注入 6s 延迟后 12s 仍无第一张卡）。逐源 catch 保序丢弃失败源并计数，才能同时给出「全失败」与「部分失败」两种态。`use-release-showcase.ts → useCwSeason`
- **反转列表展示顺序时，缺省回退值必须先按源序构造再 `reverse()`**：`id ?? i + 1` /「关卡 N」这类兜底若在反序后计算，序号会跟着倒、切 tab 指向不存在的关卡。`src/app/endgame/levels.ts`
- **同一条目派生出的子档要「先反转再插」而不是先插**：主关与它的变体（如异相仲裁「将杀王棋」与「将杀王棋•绝境」）同属源表一行，要插在展示序的**主关之后**——先逐关展开再整体反转，变体会跑到主关**之前**（反转的是整张清单，配对关系跟着翻）。同批：派生档与主档**共用上游 ID** 时，key 必须带后缀并让解析走后缀感知函数（`peak-904-hard` 用旧 `Number(slice)` 会得到 `NaN`），否则派生档会静默解析成「不存在」。
- **共享组件加形态开关时，缺省值必须等于「未被点名的那些页面的现状」**：Vue 布尔 prop 未传会被强制转成 `false` ⇒ 「默认开、例外关」的写法会让整块 UI 静默消失。这类开关要用**否定式命名**或显式 `default`。
- **条件样式的例外要从「谁是特例」翻成「谁还需要」来声明**：有需要的模式显式给值、其余默认 0。按「特例」声明的话，每新增一个模式都会漏改一处默认。
- **带开关的机制每次移除消费方后必须重问「开关还有人用吗」**：竖轨的 `--rail-w: 0` 开关在最后一个消费方退场后变成伺候空集的默认值，整条机制连同语义色覆写一起删除，原语收窄为纯缩进。
- **写进 DOM 的自定义属性先查消费者再上工**：`use-card-tilt` 每帧写 `--rx/--ry` 而全仓无 CSS 消费它们；注释说「3D tilt」但消费者从未出生或被后续重构删掉，属纯死代码＋每帧主线程工作。
- **删「零消费原语」前先查它是不是某个孤儿的唯一消费者**：只看 `grep 类名` 会以为原语还活着，实际消费点在死文件里；视图 + 其 CSS 同批删除，living docs 的原语清单同步改名。`docs/agents/ui-design.md`
- **「代码引用了不存在的词典键」守卫曾经漏检两参调用**：原正则只匹配 `t('k')`，于是 `t('mob.stage', { n })` 这类带插值的键写错也照样通过（实测漏掉一个键并让页面渲染出原始键名）。现为 `\b(?:t|translate)\(\s*'…'`，抓两参调用与 `translate(...)`；**新增 i18n 相关的机检时先确认它覆盖了所有调用形态**，否则守卫给的是虚假安全感。

## 研究线 /debug

- **研究线禁止反向引用 `src/app/` 业务模块与 stores**：调试台只共享 `spine/` + `services/` + `lib/`；反向引用会把生产模块拖进 dev-only 依赖图，摇树前提直接失效。（dev 门控写法与摇树陷阱见 [build-deploy.md](build-deploy.md)）
- **摇树后残留的恒 false 分支不是缺陷**：主包残留约 150B 的侧栏 dev 分支（含 `/debug` 字符串与 svg）属接受项，别为它做二次改造。
- **`NkError` 的 message 是内部诊断，不进界面**：机检白名单把 `new Error` / `NkError` 文案按「内部诊断」归类（文案为中文），但 `CatalogPage` / `EndgameView` / `EndgameModeView` 曾把它直接渲染进错误态的详情行 ⇒ 非缺省语言用户在界面看到中文诊断。现在统一走 `lib/errors.ts` 的 `userErrorDetail()`：**operational 错误只 `console.warn` 留痕、详情行返回空串**（界面用本地化标题 + 重试），非 NkError（编程错误）原样暴露。
- **目录卡 href 带前缀、JS 点击必须先剥前缀再 `router.push`**：卡片 href 由 `activeHref()` 生成（原生导航与爬虫需要前缀），而 router 的 history base **也是**那个前缀 ⇒ 直接 `push(href)` 会拼两次，实测得到 `/en/en/character/1513`（用户报障）。判据：`router.push(stripLocalePrefix(href))`；`e2e/layout-locales-smoke.spec.ts` 已对 12 个带前缀语言逐个点卡验证（回退修复即失败并打印重复前缀）。
- **非 `RouterLink` 的内链必须走 `activeHref()`**：目录卡与模板里的普通 `<a href>` 不经路由 history base，写死 `/lightcone/23001` 这类路径在非缺省语言下点一下就会**静默跳回缺省语言**（实测漏点：`BuildsPanel.vue` 的推荐光锥卡）。字段命名约定：`RouterLink` 用 `to`、普通 `<a>` 用 `href`——`check-languages.mjs` 按「`href` 后直接跟 `/…` 字面量且未经 `activeHref`」判失败，故喂给 `:to` 的字段不能叫 `href`。
- **模板拼接的键（`t('itemType.' + v)`）必须随数据枚举一起登记**：静态扫描只看得到前缀，缺键时 vue-i18n 静默回退（先回退到源语言，源语言也没有就把**键名本身**渲染到界面）⇒ 用户看到 `itemType.ComposeMaterial` 这种原始键。本轮一次扫出四类：`itemType.ComposeMaterial`（13 语言全缺）、`monster.rank.bigBoss`（词典里叫 `.boss`，映射表写错）、`skillType.Assist` / `skillType.ElationDamage`（数据里有、词典没有）、`endgame.status.unknown`（兜底分支可达却无键）。`check-i18n-messages.mjs` 现按数据取值域兜底（`items.sub_type` / 货币战争 `property_type` / 角色 `skills[].type`）并对代码枚举族固定断言（`monster.rank.*` / `endgame.status.*` / `propGroup.*`）；运行期由 `layout-locales-smoke.spec.ts` 的 vue-i18n 缺键告警兜住。
- **计数类文案用 vue-i18n 的 `|` 复数形式**（`"{n} stage | {n} stages"`）：`{n}` 即隐式复数键，**调用点无需改动**（值里带 `|` 且具名参数含 `n` 时自动选形）。英语/德/法/西/葡两形式开箱即用。**俄语三形式取不到**——实测 `pluralizationRules` 的函数零调用、`Intl.PluralRules` 的 one/few/many 也没被采用，故俄语只能用两形式（1 与 5+ 正确，2–4 走复数）。词典守卫的占位符判据按此细化：比较**去重集合**，并要求每个形式自身的占位符集合一致。
- **词典值里的花括号只能是 `{占位符}`**：vue-i18n 会把 `{…}` 当占位符编译，官方文本里的性别变体（德语「开拓者」= `{M#Trailblazer}{F#Trailblazerin}`）与日文 ruby 标记（`{RUBY_B#…}`）直接进词典会抛 `SyntaxError: Invalid token in placeholder`，并连带 `Cannot set properties of null (setting '__vnode')` 让**整页渲染异常**。写入路径统一过 `tools/fill-ui-messages.py` 的 `sanitize_message()`（口径同转换器 `textmap._neutralize_gender`：独占整段的变体取第一支、ruby 标记去除），并由 `check-i18n-messages.mjs` 兜底。判据：`{` 之后必须是合法标识符并紧接 `}`。
- **「代码里还有中文」不等于「漏译」——有意保留清单已做成机检**：判据是「这段文字是否按当前语言渲染给用户看」（是 ⇒ 必须走词典或数据源）。**清单与理由的唯一落位是守卫脚本头部** [check-ui-chinese.mjs](../../tools/check-ui-chinese.mjs)（品牌名 / 语言母语自称 / 中文→枚举解析表 / `console.warn` 诊断 / 内部校验 `Error`·`NkError` 文本 / 含中文的正则字面量 / `src/spine/**` 诊断文本），`pnpm build` 前置跑；本文件不复述清单——新增豁免只改脚本白名单并在脚本里写理由。审计残留先跑该守卫，别把「有意的中文」当缺陷反复重报。
- **同一中文措辞的「近义词」不得合并成同一个键**：`回合上限 CYCLES`（层内通关条件）与 `回合限制 CYCLES`（赛季级规则）措辞不同、出现位置不同，合并会让缺省语言的界面文案静默改变——既有 e2e 断言（逐字 `toHaveText`）会抓住它。**先查断言里的原文再决定合并**。
- **`t` 会被模板作用域里的同名变量遮蔽，且只有类型层看得见（已复发四次）**：`v-for="(t, i) in …"`、`v-for="t in …"`、`const t = …` 都会让 `{{ t('key') }}` 变成「拿非函数调用」，报错形如 `Type 'X' has no call signatures`。固定修法：该处改用显式 `translate('key', …)`；批量为组件补 `const t = translate` 时要**按完整 import 语句定位**（多行 `import type { … }` 会把新导入插进类型清单里，直接语法错误）。

## CSS 拆分纪律

- **拆分必须按原始物理顺序连续切割**：移动端断点块、`prefers-reduced-motion` / `hover:none` 覆盖块、文件末的「排版刻度收口」块都是同特异性级联覆写，乱序合并 = 静默改视觉。逐行 `Compare-Object`（除新增头注释外零丢失零改动）是最低验收线。
- **收口块与修饰类的顺序是硬约束**：`.nk-egd-trait { padding }` 声明在文件末收口块内、与修饰类同特异性 ⇒ 修饰类必须写在它之后，手机档值必须写进最后一个 `max-width: 767px` 块，否则被桌面值静默覆盖。
- **跨文件的媒体查询归属只能靠读包围块或探针确认**：靠「我记得某文件有这条」推断会导向一个不存在的缺陷，进而为一个不存在的 bug 重排版面。`src/styles/character-skeleton.css`
- **页面 CSS 绝不复制粘贴，共享部分下沉到已声明原语层**：同一批行样式让四个常青页共用 `renderCard`、列改多列时行样式仍全部来自 `endgame.css`，才是「不复制」的正确落法。
- **改一个 fixed 层的高度前，先找谁按它的高度写死了避让值**：详情页 `padding-top` 是按吸顶条高度定的，导航抬升后条变长即盖住首屏，页面级截图上不易察觉。`src/styles/character-hero.css`

## 路由与外壳交互

- **「再点同一入口收起」不是链接语义，`RouterLink` 自己做不到**：收起的目标态是「不存在」而非另一个 URL，`to` 只能写成当前路径，而 vue-router 把同址 `push` 判为 `NAVIGATION_DUPLICATED`——不跳转、不报错（控制台安静）、却照跑一次 `scrollBehavior`，两次点击之间看不出差别。收起只能显式做：`history.state.back` 有值走 `router.back()`，为 `null` 时 `replace` 回本模式枢纽（`push` 会在历史里留一条「收起后还能前进回该页」的假入口）。判「有无站内历史」不能看 `window.history.length`——它把站外与 about:blank 条目一起算进去。挂在 `RouterLink` 上的 `@click` 必须放行带修饰键的点击（Ctrl/Cmd/中键是新标签页语义），否则被劫持成返回。`src/app/components/SidebarNav.vue`
- **收起的目标页必须自持；而「自持来源」与「簿记」是**同一前提下的两条路，会一起失效**：`from.fullPath`（`afterEach`）与 `history.state.back` 都要求**路由已解析过一次**——首屏懒加载 chunk 还在路上时侧栏已可点，此刻 `from` 是 `START_LOCATION`（path 恰为 `'/'`）⇒ 记录被 `from.matched.length === 0` 当成「直达设置页」跳过，簿记又指 `'/'`，收起落枢纽 `/en/`（CI 只报 `Received: "/en/"`，看着像时序抖动，实则**该窗口内必错**：本地延迟目录视图 chunk 后点两次稳定复现 4/4，守卫见 `layout-nav.spec.ts` 的「首屏 chunk 就绪前点设置」）。判据三条：① 来源在**点击那一刻**记（路边没有比 `route.fullPath` 更确定的来源），`afterEach` 只当补充；路由未解析时用**本次落地 URL**（`localeBaseFromPath` 去前缀；落地即设置页则记 null，以保住「直达 → 收起回本模式枢纽」契约）。② 开关的两个方向都按**地址栏**判「是否已在设置页」，不按 `route.path`——`push` 是先改 URL 再解析路由，解析完成前 `route.path` 还是 `START_LOCATION`，按它判会把收起误判成「进入设置」（实测落点从 `/en/` 变成 `/en/settings`，两种都不是来源页）。③ 收起时：记录与簿记一致走 `router.back()`，不一致以记录为准用 `replace`，真·直达才回枢纽（枢纽按地址栏分模式，路由未解析时 `meta.cw` 还是常规模式）；记录为空**且**簿记不可用时不得留在设置页。`src/app/components/SidebarNav.vue`
- **「路径前缀决定了」不等于「内容已就绪」**：语言前缀在 **history base** 里而不在 `route.path` 里（`route.path` 已剥离前缀、`location.pathname` 含前缀）⇒ 任何「当前路径 === 路由表路径」的判定都不能把两者混用；`<html lang>` 同理不能当内容就绪判据（见 [testing.md](testing.md)「竞态与等待」）。
- **`router.options.history.state` ≠ `window.history.state`**：前者是 vue-router 自己维护的内存 ref，手动 `history.replaceState` 只改后者、绕不过前者 ⇒ 用它做「篡改内部状态再观察行为」的 A/B 探针会得到**假绿**（两条臂都走原分支）。要造这个条件只能重新加载文档（内部状态清零）。
- **终局玩法页的「当期赛季」要同时拿到 id 与条目，两者不同源**：id 只能从目录卡 href（`/endgame/<mode>/<id>`）解析（卡片条目本身不带 id），条目另从详情数据取，可能单边缺失。只按 id 渲染时 `:to` 会退化成 `/endgame/<mode>/`，而 vue-router 非 strict 模式会**静默解析成自链接**（页面把自己标成当前页），文案里的赛季名也同时变空——渲染前提必须是两者都在。`src/app/views/EndgameModeView.vue`
- **`scrollBehavior` 不要写 `behavior: 'instant'`**：目录页是内部容器滚动（window 不滚），显式 instant 会在卡片初渲染的关键路径上强制同步回流；缺省（auto）让浏览器自己挑。`src/app/router/index.ts`

## Store 与详情数据编排

- **传给 `structuredClone` 的对象必须先 `toRaw`**：Vue 的 reactive proxy 不可结构化克隆，`getRenderData` 的 `structuredClone` 包在 try/catch 里 ⇒ 去掉 `toRaw` 不报错、只悄悄退化成另一条分支。`src/app/stores/character.ts`
- **多段加载里，后段 await 回来必须再判一次代际**：主数据 `submit()` 先渲染，附属数据（名录 / 物品）await 后若不做 `isCurrent()` 判定，快速切换角色会把上一角色的名录合并进新页面——不报错、只是数据串了。`src/app/stores/character.ts` `src/app/stores/detail-core.ts`
