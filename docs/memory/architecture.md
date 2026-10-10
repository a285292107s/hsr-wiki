# 架构与重构

> 本域 memory 补的是 [docs/agents/architecture.md](../agents/architecture.md) 的盲区：分层纪律、配置驱动目录页、共享单例与 barrel 的**规则**已在其中声明，本文件只记规则推不出的坑位、判据的理由与失灵形态。ADR 已裁定的决策不复述，只标出 ADR 也推不出的那一半。

## 分层与目录归属

- **跨页借用的共享 class 只能是 `tokens.css` 已声明的原语**：页面级 class 借过去会命中不了样式，元素破相而不报错——`lightcone.css` 只随光锥路由 chunk 到达，怪物页借 `.nk-lc-rank-label` 即静默无样式。`src/styles/`
- **改页面级样式前先数根类名的写入方，再决定要不要作用域化**：`.nk-title` 被六个页面共享，改 `tokens.css` 等于同时改六个页面版面。`Select-String` 数写入方是「会不会外溢」的最低成本判定，比先跑全量 e2e 快得多。`src/styles/tokens.css`
- **同一份样式放在哪个文件由消费面决定，不由「放哪都行」决定**：诊断色（`#ff6b6b` 等）只能落在 `src/app/debug/`，因为色彩守卫的 `SKIP_FILE` 只豁免 `debug/` 与测试——挪进 `styles/` 立刻被 `check-colors --strict` 拦下。`src/app/debug/spine-audit.css`
- **dev-only 研究线的样式不并入产品面令牌体系**：`/debug` 面板的等宽栈与产品面 `--font-mono` 不是同一条栈，dev-only 且无像素基线覆盖，改栈只会引入无从验收的渲染变化；豁免登记在 `tokens.css` 的 `--font-mono` 注释里，**收口时禁止当裸字面量一并改掉**。
- **「UA 默认泄漏」的可见性取决于布局是否把文字盒拉伸**：单行或收缩盒里 `text-align` 是空转，纵向 flex 或 `flex:1` 把子项拉满时才显形，所以不能靠读样式表判定。解法是同类元素跨标签比对计算样式 + 对可疑项做「改掉这个值再量 ink 位移」的差分；判文字对齐只看 `Range` 盒，不看元素盒。
- **比字体/内距的基准取 `#app` 而不是 `body`**：`font-family` 设在 `#app` 上，`body` 的 computed 是 UA 默认衬线，拿 `body` 当基准会把正常输入框误判成「字体不继承」。

## 共享单例与 barrel

- **`src/services/api/index.ts` 是显式具名清单而非 `export *`**：新单例忘记登记 ⇒ 视图 import 到 `undefined`、onMounted 抛 TypeError、整页不挂载，e2e 表现为 hero 永不出现，**与数据缺失完全同形**。新增共享单例后先查 barrel 再跑页面。
- **单例只提供「首调发起、后续复用、失败重置」这一层，嵌套复用的并发合并要另写守卫**：缓存组内多条并行加载靠的是服务级缓存守卫，不是单例本身；把嵌套复用当成串行复用会重复请求。`src/services/api/singleton.ts`
- **「就绪才渲染」的 watch 必须配 `immediate: true`**：触发源取的是共享单例数据的长度，从其它路由返回时组件重建而 store 里仍有旧数据，触发源初值已非 0 ⇒ 首次触发被漏掉，渲染永远空白。
- **新增可索引路由必须同步三件（快照覆盖 + rewrite + sitemap）**：三者缺一由构建末步守卫拦截；但守卫只保证「覆盖到」，不保证条目正确——`nk-snapshot__more` 这类分区入口内链**不得**复用 `nk-snapshot__entry` 类名，否则会被条目级覆盖率算成收录条目。`tools/gen-ai-endpoints.mjs`
- **目录卡与详情视图共用同一份回退事实时必须两边都绑**：回退链在目录卡上是逐个绑 `data-cdn-fallback` 的，视图侧 `<img :src>` 不绑就没有第二条路——CDN 委托读不到属性即静默失去回退。

## types 按域拆分

- **杂物间 `types/misc.ts` 按域拆分的验收线是「barrel 契约不变 + 消费方零改动」**：拆文件只改声明归属，不许顺手改形状；一旦消费方需要跟着改，说明拆的是接口而不是文件。`src/services/types/`
- **按域拆完要复查「列表端点条目是否回本域」**：列表端点条目放在共享杂物间里会诱使下一个域再往里塞，拆分的收益当场归零。同类新增一律先问「它属于哪个域」，而不是「放 misc 会不会更省事」。

## 目录页配置驱动

- **`pages.ts` 注册表是目录清单的唯一事实源**：文档、AI 快照与 e2e 都不得另立清单；新增目录漏登记的表现是路由 404 或空白，而非构建失败，只能靠注册表比对发现。`src/app/catalog/pages/`
- **config 里新增 e2e project 属契约变化，必须登记子文件**：memory 的复盘段落不能替代登记项——当时只改了 config 与 memory，`docs/agents/testing.md` 仍写旧口径，形成漂移。[testing.md](../agents/testing.md)
- **catalog 配置 `styles` 数组的多个 loader 是并行执行的，顺序不保**：多块 CSS 有级联覆写关系时必须串成一个 async loader 依序 `await`，否则同特异性覆写顺序随机。`src/app/router/index.ts`
- **带专属样式的目录在 config `styles` 字段声明，不新增视图**：这条是规则；其盲区是**非列表页的两类例外**（枢纽页与专题页）不适用该断言——专题页无条目级快照，用目录页的断言去框它会得出假失败。`src/app/catalog/pages/shared.ts`
- **删容器前先点住户名**：用户点名删某个容器里的某一行时，先列该容器的每个子节点，只删点名的那几个，剩下的住户（如无首领特性节点退回的徽标）给一个 `v-if` 专属容器——整块删掉 = 顺手删掉一个没有第二落点的信息位。
- **删掉 DOM 后钉住它的断言要「搬家」而不是删除**：先问断言锁的是元素还是关系——锁相对序的改成相对序断言、锁身份的改 `aria-labelledby`，直接删干净等于丢掉契约。
- **删除类任务的任务描述必须附「必须存活的同名资产清单 + 验证命令」**：仓库存在同名不同物的概念（两个 season），只写「注意别删错」无效；给清单加 `git grep -c` 实测比形容词有效。

## 跨文件重复实现

- **同一语义状态出现第二份实现即漂移起点**：状态态是最容易被漏的一类——不是组件、没有类型约束、守卫也不看它，只有把「同一状态 / 同一空态」当成审核类别逐页清点才抓得到。收口到单一原语后页面自建态各自删净。
- **CSS 层的重复实现同样成立，而色彩与对比度守卫完全看不到它**：那两个守卫只查裸色值与原始层引用，查不出「同一条选择器被写两遍」。重复选择器审计工具的必要性在于此，不在色彩。
- **审计工具报的 A 段要区分「静默覆盖」与「有意覆盖」**：后者（粘性首列必须不透明、媒体右移后开关位置反向补偿）不是重复实现，工具只判「选择器出现两次」且读不到注释 ⇒ 给每条补一句说明为什么，保留覆盖；只有连语义都相同的才是事故。
- **给某模式补机检前，先确认现有的「反例」是否有意为之**：批量打标签会删掉唯一防线（某条用例自钉视口正是 `isMobile` 影响 `<meta viewport>` 的哨兵）；机检只判「自钉视口 ⇒ 必须有标签」这一个方向，反方向的报警只会变成永久噪声。
- **合并两处重复实现时才会浮出潜伏 bug**：一处用正斜杠、调用处比较的是 `path.relative` 的原生分隔符 ⇒ Windows 下排除项从未生效。跨平台路径比较统一到正斜杠后再比；「在某平台正常」的实现会让重复代码活得比缺陷久。`tools/doc-scope.mjs`
- **彼此独立的数据源必须并发取（`Promise.all` + 逐源 `try/catch`）**：`for + await` 是串行往返瀑布（注入 6s 延迟后 12s 仍无第一张卡）。逐源 catch 保序丢弃失败源并计数，才能同时给出「全失败」与「部分失败」两种态。`useCwReleaseShowcase.ts`
- **反转列表展示顺序时，缺省回退值必须先按源序构造再 `reverse()`**：`id ?? i + 1` /「关卡 N」这类兜底若在反序后计算，序号会跟着倒、切 tab 指向不存在的关卡。`src/app/endgame/levels.ts`
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
- **同权重档位规则混写会让断点规则被非媒体规则反压**：把某档规则写成非媒体查询、与另一断点块并列命中时，后写者胜出（平板档恒用手机字号）。判据：每个断点、每一档只允许一条声明；跨文件级联时先确认两个文件的导入序，再决定哪一条该带媒体查询。
- **跨文件的媒体查询归属只能靠读包围块或探针确认**：靠「我记得某文件有这条」推断会导向一个不存在的缺陷，进而为一个不存在的 bug 重排版面。`src/styles/character-skeleton.css`
- **页面 CSS 绝不复制粘贴，共享部分下沉到已声明原语层**：同一批行样式让四个常青页共用 `renderCard`、列改多列时行样式仍全部来自 `endgame.css`，才是「不复制」的正确落法。
- **改一个 fixed 层的高度前，先找谁按它的高度写死了避让值**：详情页 `padding-top` 是按吸顶条高度定的，导航抬升后条变长即盖住首屏，页面级截图上不易察觉。`src/styles/character.css`
