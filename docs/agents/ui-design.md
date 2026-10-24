# UI 设计 — 视觉系统唯一事实源

> **定位**：本文件是 UI / 视觉设计约束（样式分层 · 令牌 · 主题 · 断点 · 反 AI 味 · 视觉验收）的**唯一事实源**。AGENTS.md 只留硬约束与指针，其他文档**禁止再写第二份 UI 设计正文**——需要补充时改本文件，或写进 [memory/ui-tokens.md](../memory/ui-tokens.md) 对应域（代码里不留解释性注释，见 AGENTS.md「注释与文档」）。
> **事实源是代码**：`src/styles/tokens.css`（令牌与全局原语）、`src/lib/theme.ts`（强调色切换）、`tools/check-colors.mjs` + `tools/check-contrast.mjs`（颜色门禁）。本文件与代码冲突时以代码为准并立即修订本文件。
> 术语见 [CONTEXT.md](../../CONTEXT.md)「色彩体系 / 导航与模式 / 页面过渡」；决策史见 §9；页面级设计语言（圆角档位、栏目结构、材质）只由各页面 CSS 表达，判据与坑位在 [memory/ui-tokens.md](../memory/ui-tokens.md)。

## 1. 样式分层与命名

| 层 | 文件 | 放什么 | 禁止 |
|---|---|---|---|
| 令牌 + 全局原语 | `src/styles/tokens.css` | 四层令牌（§2）；跨页全局原语（导航壳 `ui-sidebar*` / 更多抽屉 `ui-more*` / 详情页壳 `nk-page--detail`·Hero `nk-hero*` / `nk-tabs` / `nk-panels`·`nk-panel` / `nk-secnav` / 区块标题 `nk-title` / 回顶 `nk-top-btn` / `nk-skeleton`·`nk-sk--*` / `nk-toast` / `nk-card` / 页面过渡 `nk-view-*` / `nk-hub-footer`·`nk-hub-masthead` / 状态原语 `nk-error-state`·`nk-slot-empty`·`nk-img-error`）；无障碍三件套；纸感颗粒覆层 | 页面专属规则；**页面 CSS 引用彩色原始层** |
| 目录引擎 | `src/styles/catalog.css` | 目录卡片与网格族（`nk-idx-grid` / `nk-relic-grid` / `nk-item-grid` / `nk-mob-grid`；卡片 HTML 由模板字符串 v-html 注入，scoped 命不中） | 页面专属样式；复制该区块 |
| 页面 | `src/styles/<page>.css` | 页面专属，由视图组件 `import`，随路由拆 chunk 懒加载 | 跨页复用（先查原语）；复制粘贴其他页面规则 |
| 组件 | SFC `<style scoped>` | 组件专属（如 CW Hub 导航） | 污染全局命名空间 |

- **命名**：BEM + 双前缀——内容与设计系统 `nk-`，应用外壳（侧栏 / 更多抽屉 / 导航）`ui-`。禁止第三种前缀。
- **样式加载**：全局仅 `tokens.css` + `catalog.css` + `fonts.css`（三者由 `src/app/bootstrap.ts` 导入；`fonts.css` 只有自托管 `@font-face`、无选择器）；目录页专属样式在 `CatalogPageConfig.styles` 声明并随路由并行加载（同一 loader 内串行）。页面样式只在自有作用域内细化——枢纽两页用 id（`#nk-home-app` / `#nk-cwhub-app`），详情页多数用页前缀类（`.nk-char-page` 等）；共享原语单点声明留在 tokens / catalog，页面不复制共享区块。
- **不使用 CSS 预处理器**；元素级重置与无障碍规则用 `:where(#app)` 保持零特异性；类原语是单类选择器（0,1,0），页面规则靠作用域与加载顺序覆盖。
- **纸感颗粒**（`#app::after`）唯一收口于 tokens.css，禁止页面级复制或调参；强度唯一调参位 `--grain-opacity`。
- **无障碍三件套**（tokens.css 末尾，全站硬标准）：`focus-visible` 统一 2px 主色焦点环；`prefers-reduced-motion: reduce` 全站禁用位移/过渡；`hover: none` 取消 hover 位移（`transform: none`）。页面级只追加细化，不重定义基础态。
- **图标占位不是 CSS 原语**：`MISSING_ICON_SVG` / `MISSING_ICON_SRC` 是 TS 共享常量（`src/services/cdn/placeholder.ts`，内联 SVG data URI），跨页靠 import，**禁止在页面 CSS / 组件里复制**；CSS 配套只有 tokens.css 的 `img[data-cdn-down]:not([data-cdn-placeholder]) { visibility: hidden }`（占位必须可见），语义见 [ADR 0024](../adr/0024-图标回退链与真缺失占位.md)。

## 2. 色彩：四层令牌与单向事实链

| 层 | 令牌族 | 消费规则 |
|---|---|---|
| **原始层**（色阶事实） | 强调候选色阶 5 族 `--tc-*` / `--ol-*` / `--sl-*` / `--sd-*` / `--ir-*`（缺省族见 §3）；`--gold-*`（星级 / 领域金）；`--blk-*`（中性纯黑阶，5 级 750–950）；`--ph-*`（领域泛品红紫）；`--em-*`（调试系统图专用绿阶，非强调候选） | 彩色裸档只允许被别名层与领域层引用，**页面 CSS 禁止新增直接引用**；黑阶例外——承载面按 ADR 0021 方向直接取 `850/800/750`。存量页面的 `--gold-*` / `--tc-*` 裸档引用属待偿漂移，不得复制 |
| **主题色阶别名层** | `--th-*`（全站唯一，随 `data-accent`） | 语义层只引用别名层、不绑定具体色族——这是「强调色可切换」的实现机制 |
| **语义层** | `--primary`（= `--th-500`）/ `--accent`（= `--th-400`）/ `--bg`（纯黑阶）/ `--surface`·`--card`（黑阶 + 主色 5~6% 注入）/ `--text*` / `--border*` / 发丝线 `--line-1`·`--line-2` / `--gold`·`--gold-sem` / `--highlight` / `--metric-val` / `--primary-glow` / 状态 `--diff-*`·`--season-*`；外壳·抽屉·头部·输入的派生族 `--nk-shell-*`·`--nk-sheet-*`·`--nk-header-*`·`--nk-input-*`·`--nk-page-tint`·`--nk-card-border` | 随强调色切换（**货币战争共用同一套**，ADR 0041）；派生色一律 `color-mix(in srgb, var(--primary) X%, transparent)` |
| **领域层** | `--rarity-*` / `--prop-*` / `--skill-*` / `--relic-*` / `--cw-*` / `--crole-*` / `--ctrait-*` / `--ach-*`；**语境色成员** `--eg-*`（终局四模式）/ `--vor-*`（「贪饕」污染） | 数据语义色，**不随主题/强调色**；领域色不得引用 `--th-*`。语境色在各自子树内局部取代强调位（§3）。`--elem-*` 是零消费者的预留族（与 `elements.json` 的官方色有意不同，属深底可读性调整；启用前按 §5 复核对比度）；**禁止再引入从别名层派生的领域令牌**（曾有的 `--hero-bg-*` 即此类，已按本条删除） |

**事实链单向依赖**：原始层 → 别名层 → 语义层 → 消费层（页面 CSS / JS 模板字符串，只读 `var()` / `color-mix` / 变量注入）。消费层定义任何颜色事实 = 违规。

- **裸色值禁令**与豁免：严格中性三分量差 ≤4 的灰阶/黑/白、SVG data URI 内联白（物理限制）、`var()` fallback 内的中性或令牌值；扩大豁免面只能改 `tools/check-colors.mjs` 的判定常量并同步 ADR。**`var()` fallback 禁止裸彩色**。
- **黑阶是深色表面唯一事实来源**，按用途分三向（ADR 0021）：**承载位**逐级提亮——`850` 页面底色（`--bg`）/ `800` 承载面（外壳·面板·条·牌·图窗）/ `750` 卡片面（`--card` 及卡内垫底）；**压暗位** `950` / `900` 只用于媒体遮罩、暗角内影、scrim、hover 洗色与**亮底 chip 上的深色文字/图形（ink）**，禁止新增把压暗位当承载面的写法。改底色必须同批上移表面阶梯（只改 `--bg` 会让 `--surface` 在某些亮度上比页面更暗）。色相由语义层 `color-mix` 注入（承载面 3~6%），黑阶本身不写色相。
- **数据承载色**例外：游戏数据自带颜色（富文本 `<color>`）运行时透传 inline style，不属令牌体系。
- 新增颜色走 §5 评审闸。

## 3. 主题与强调色

| 通道 | 开关 | 预置值 | 缺省表达 |
|---|---|---|---|
| 模式标记 | `route.meta.cw` → `<html data-theme="cw">`（App.vue 挂载） | 常规 / 货币战争 | 无 `data-theme` = 常规。**仅标记模式，不重映射任何颜色**（ADR 0041） |
| 强调色（全站唯一） | `<html data-accent>` | `olive` 橄榄青（缺省）/ `terracotta` 赤陶 / `slate` 雾霭蓝灰 / `sand` 暖沙棕 / `iris` 暮山紫 | 无 `data-accent` = `olive`：`:root` 即 olive 映射，`applyAccent()` 在缺省值时**删除**该属性。5 个 `[data-accent]` 块齐全（含 olive），olive 块当前不可达、属冗余兜底 |

- **链路**：`src/lib/theme.ts` 持久化到 `HSR_WIKI_ACCENT` + `src/app/bootstrap.ts` 挂载前初始化（防首帧闪烁）；`[data-accent]` 规则重映射别名层 `--th-*`，语义层与全站自动跟随。**只有一套通道**——`--cwth-*` / `data-cw-accent` 已退场（ADR 0041；后者由 `e2e/layout-currency.spec.ts` 反向守卫），不得恢复。
- **新增强调色 = 五处同改**（缺一处即失效）：① 原始层色阶 → ② `[data-accent="…"]` 重映射别名层 → ③ `theme.ts` 的 `ACCENTS`（`key` + `labelKey` + 三点 `swatch`）→ ④ 13 个语言包的 `theme.accent.<key>` 文案 → ⑤ `e2e/layout-currency.spec.ts` 的色板按钮计数（现为 5）。`swatch` 是色阶值的手抄副本（`theme.ts` 被 `check-colors` 跳过、无门禁），改档位必须同批核对；`:root` 缺省映射与语义层自动跟随，无需改动。
- **色阶结构**：11 级（`50`–`950`，别名层消费 `300/400/500/600/700`）。**正文类令牌对黑底 ≥4.5:1**；`--primary` 是编号/激活/焦点等非正文位，验收线 3:1（实测 3.95–4.30，**禁止当正文用**）。由 `check-contrast.mjs` 对 `:root` 与全部 5 个 `[data-accent]` 色板逐个强制。
- **小字混色下限**（`__en` 8px / `__hex` 0.58rem≈9.3px，按正文 4.5:1 判）：`.ui-sidebar-link--active .ui-sidebar-link__en` 的 `--metric-val` 混色 ≥92%；`.nk-swatch--on .nk-swatch__hex` ≥80%。改动任一处前须在全部 5 套色板下按 sRGB 合成重测（`accessibility.spec.ts` 只跑缺省色，抓不到其余 4 套与未扫码页）。
- **同一时刻只有一个强调色相**：主题层（背景/表面/强调）禁止第二色相，全站含货币战争共用同一通道（ADR 0041）；设置页默认即 `DEFAULT_ACCENT`，`--accent` 必须是当前色阶成员（禁止游离色）。
- **领域色豁免**：星级 / 属性 / 元素 / 技能类型 / 强化角标 / 文本高亮保持游戏内约定色。
- **机制语境色（[ADR 0027](../adr/0027-机制语境色与贪饕污染色.md)）**：`--eg-*` / `--vor-*` 是机制自己的特征色，在各自子树内局部取代强调位（终局页用 `[data-mode]` 赋 `--eg-color`；`/voracity` 与污染标记消费 `--vor-500` / `--vor-300`）。机制子树内可出现「用户强调色（外壳）+ 语境色（页内强调位）」同屏：**单强调色通道按主题层判定，不按页面判定**。污染族分工是硬约束——`--vor-500` 只承载非文字（边线 / 底纹 / 进度条 / 大面积标识），文字一律 `--vor-300`（已进 `check-contrast.mjs` 正文类清单）。
- **导航语义豁免（当前无条目）**：`check-colors.mjs` 没有自动豁免表（未接线的预留常量已删除）；跨模式入口由侧栏底部工具组承担（与设置同组，标签是**目的地模式名**，见 [CONTEXT.md](../../CONTEXT.md)「交换」），不构成第三色相。新增豁免须在脚本里实现判定逻辑并同步 ADR。
- **设置页契约**：区块编号与顺序固定为 01 主题色 / 02 开拓者形态 / 03 语言，不随语境交换；可见文案只写玩家可感知语义，禁止 `data-accent` / `meta.cw` / localStorage 等架构黑话。

## 4. 门禁（`pnpm build` 前置七守卫中的颜色两项）

- **`tools/check-colors.mjs --strict`**：扫 `src/**/*.{css,vue,ts}` 裸色值（hex / rgb / rgba），中性阈值 ≤4、`var()` fallback 纳入检查——这些扫描**恒执行**，`--strict` 只决定命中是否非零退出（`check-guards` 恒带该参数）。**盲区**：`color-mix(...)` 整段在扫描前被剥离，首参写裸色不报警。豁免面固定为 `SKIP_FILE`（`__tests__` / `debug/` / `theme.ts`）与 `tokens.css` 本体，**禁止擅自扩大**。颜色变更后必跑。
- **`tools/check-contrast.mjs --strict`**：读 `:root` 与**全部 `[data-accent="…"]` 色板**（每个叠在 `:root` 基底上解析），正文类 ≥4.5:1（`--text` / `--text2` / `--text3` / `--text-bright` / `--highlight` / `--gold-sem` / `--metric-val` / `--vor-300`），`--primary` ≥3:1（装饰与大字号豁免）。`--strict` 同样只控退出码；换任何一套色板都会被逐个验收。
- **`check-contrast` 盲区（改底色/表面亮度必查）**：它只算「文字令牌 × `--bg`」；文字落在 `--surface` / `--card` / 着色片（tag·chip·激活段）上还要再降一档，这层只有 `e2e/accessibility.spec.ts`（axe，12 页 × 缺省强调色）兜底；**两处都覆盖不到的组合（其余页面、非缺省强调色、非激活态）须人工按 sRGB 合成核算**。故改底色时必须同时核 `--bg` / `--surface` / `--card` / 外壳四条。
- **颜色两守卫 + 其余五项**（Spine 清单 / 语言清单 / 语言包覆盖 / UI 词典 / 界面中文）由 `tools/check-guards.mjs` 串行汇总挂到 `pnpm build`（见 [commands.md](commands.md)）。CI 只重跑七守卫与 `vue-tsc`，省掉 `vite build` 与 AI 端点两步。**守卫全绿 ≠ 语法正确**：守卫走正则，CSS 语法错误只在 build 的 postcss 阶段暴露（`tools/check-css-dup-selectors.mjs` 是未挂 build/CI 的孤儿脚本）。

## 5. 新增颜色四步流程（评审闸，唯一事实源）

1. **查令牌**——四层中检索是否已有可用令牌；有 → 直接 `var()` 引用，结束。
2. **定层级**——数据语义色 → 领域层；随主题变的映射色 → 语义层（**必须从别名层派生**）；新色相家族 → 原始层（需评审）。
3. **单强调色通道判定**——是否落在**全站唯一强调色相**内？属领域色豁免 / 机制语境色（§3）/ 导航语义豁免？全部皆非即违规。
4. **落 tokens + 跑门禁**——写进对应区段；页面 CSS / JS 只 `var()` / `color-mix`；`check-colors.mjs --strict` 与 `check-contrast.mjs --strict` 全绿；确需新豁免须在脚本里实现判定逻辑并同步 ADR。步骤 1–3 **无自动门禁**（两守卫只查裸色值与对比度），层级方向与色相数量由评审判定。

**回归**：常规页 + 货币战争页都看（主色强调位、黑阶表面层次、领域色不受影响，且两模式主色必须同一个）→ 视觉确认交用户（§8）。

## 6. 断点与响应式

| 区间 | 布局 |
|---|---|
| <768px | 手机：底部 Tab Bar（槽位数 = 纯视口函数，**与语言无关**；放不下的尾部折叠进「更多」抽屉）；页面过渡统一淡入淡出；枢纽页报头为紧凑文字块（无固定高度） |
| 768–1023px | 平板：竖排图标侧栏；枢纽页报头同上 |
| ≥1024px | 桌面：文字侧栏（档案目录册）；枢纽页报头同上 |

- **档位集合**（新增值须在评审中说明理由，禁止随手新值）：`359 / 360 / 374 / 560 / 640 / 767(.98) / 768 / 1023 / 1024 / 1149 / 1280 / 1439 / 1440 / 1536 / 1600 / 2560`（`1439` 是 `1024–1440` 区间的上界补集；`1024` 作上界只有 /debug 一处特例），外加 `max-height: 500px`（Hero / 骨架再叠 `orientation: landscape`；768–1023 侧栏压缩只判高）、能力查询 `hover: hover and pointer: fine` vs `hover: none`（**交互能力用能力查询判，不用宽度代替**）。`1440` 是角色详情「宽档立绘横向偏移」的起始档（该档以下立绘着色区会压住抬头第二行与规格行）。
- 内容区**左缘避让**经 `--nk-content-offset` 接管（0 / 88 / 148px 三档），**禁止写死**；其余内距不在此约束。
- **正文阅读列宽唯一令牌 `--nk-prose-max`（44em ≈ 44 全角字/行）**：按**字号**缩放，页面 CSS **禁止**再写 `7xch` / px 定值。消费点必须是**承载正文的那一级**——`em` 按元素自身字号解析，落在容器级会得到完全不同的每行字数。`e2e/layout-currency.spec.ts` 与 `e2e/layout-endgame-mode.spec.ts` 只锁「令牌以 `em` 结尾 + 首行 ≤ 令牌字数 + 2」（覆盖 CW trait 与终局模式两页）；**消费层级靠评审**。
- **枢纽页报头 `.nk-hub-masthead`**（跨页共享原语，声明 tokens.css）：站名 h1（28–32px）+ 一条定位文案（20px，<768 档长文案会折行），**无底面、无固定高度、随内容滚动**；两页共用同一条原语与同一字号，使 `nk-view-swap` 互切不跳动（机制约束，不是 e2e 等高断言），**禁止在页面 CSS 重声明字号或加承载面**（面板压在有材质的地面上会截断材质，且站名在 ≥1024px 已由侧栏 `ui-sidebar-brand__cn` 承担）。判据：1920×1080 档报头盒高 ≤120px（`getBoundingClientRect().height`，不含 margin；`layout-home` / `layout-currency` 各一条断言）。见 [ADR 0019 决策 12](../adr/0019-枢纽页导航条回归与首页改为版本上新页.md)。**禁止用渐变补面板**——渐变是机器感来源。
- **承载面必须半透明**：首页光锥字段、遗器板一律半透明，平色会把地面材料整个盖掉（读成纯色块）。半透明后同一色阶既分层又透出材质，且不引入渐变。
- **地面材料 vs 全屏媒体层**（改本页背景前必读）：禁的是**占满首屏的媒体层元素**（背景视频 / poster / KV Spine / 立绘轮播，见 §7 表）；**允许**页面地面的静态材质背景——随站本地化的真实美术图，铺在内容盒上、不占布局、不动、不滚（`#nk-home-app` 是滚动容器，默认 `background-attachment: scroll` 即贴着元素盒）。判据三条：① 是**这个主体自己的**材料（首页用 `bgpic/BgWiki`）；② 12px 模糊后**最亮区域**对 `--text2` 仍 ≥4.5:1（够用即**不叠 scrim**，scrim 是渐变）；③ 它同时算一张真实图片（图像下限）。
- **报头旧形态（已删除，禁止回改）**：渐变底 + 暗角 scrim + 标题投影 + `__supra` 英文副标 + 210px 品牌带面板。定位行取 `--nk-fs-7`（20px）而非 13px：既是正文可读档，也让 eyebrow 候选上限（标题字号一半且 ≤18px）够不到它。
- 侧栏「调试台」入口：**仅 dev 构建**（`v-if="IS_DEV"`，生产摇树）；≥768px 显示在工具组首位（跨模式 / 设置之上），<768px 隐藏且不参与底栏折叠测量。
- **手机底栏槽位数与语言解耦**（[ADR 0054](../adr/0054-底栏槽位数与语言解耦.md)）：折叠分支槽数 = ⌊(可用宽 − 3×`--nk-nav-tool-w` − `--nk-nav-divider-w`) ÷ `--nk-nav-slot-min`⌋，纯视口函数（2 槽下限），**禁止**改回「按文案固有宽逐项累加」。预算两段式：全量放得下就全量平铺（只扣 2×工具位、不预留「更多」槽，CW 6 槽位口径的成立条件）；放不下才走折叠分支（扣 3×工具位，尾部折叠进「更多」抽屉）。手机档工具位（跨模式 / 设置 / 更多）统一为图标档，文案只进 `aria-label` / `title`。
- **详情/专题页外壳分两类**：`.nk-page--detail`（character / CW role / endgame / lightcone / relic / voracity）为纵向 flex，直接子项**限宽不得只写 `margin: 0 auto`**——flex 列里 auto 横向外边距会顶掉 `align-items: stretch`，盒子塌成内容宽再被居中，须并列 `width: 100% + max-width`。文档流外壳（`.nk-ctrait` / `.nk-mob-page`）用 `--nk-content-offset` 做左避让，不走 flex 拉伸。横向内距与相邻区块容器同值，分界线用同一局部变量内缩，否则线与文本对不齐。坑位见 [memory](../memory/ui-tokens.md)。
- **字号与圆角是唯一刻度**：界面/正文 8 档 `--nk-fs-1..8`（8 / 10 / 11.5 / 13.1 / 15 / 17 / 20 / 24px）；标题与特写 7 档 `--nk-fs-title-1..5` + `--nk-fs-hero` + `--nk-fs-hero-lg`（28 / 32 / 36 / 48 / 60 / 72 / 88px）；圆角三档 `--nk-radius-1..3`（2 / 6 / 12px，`--nk-radius-card` = 面板档），`50%` 与胶囊（≥100px）是**形态**不是档位。**新写页面 CSS 禁止字号与圆角字面量**；存量字面量（monster-detail / achievement 等）尚未收口，档数判据只在 [UI质量验收标准](../audit/UI质量验收标准.md) A4.1 / A4.2（现为部分覆盖）。

## 7. 反 AI 味硬约束（不可回退）

判定基准：**能被一眼锁定的机器感元素都禁止**——霓虹光晕、渐变头、玻璃胶囊、堆叠投影、装饰性排版符号。下表是跨页索引（出处列 = 该禁令生效的样式文件），改样式前先扫一遍；坑位见 [memory/ui-tokens.md](../memory/ui-tokens.md)。

| 禁令 | 出处 |
|---|---|
| 禁 head 渐变填充 / 禁 box-shadow 发光（glow）/ 禁 `backdrop-filter` 徽章胶囊 / 禁虚线分隔（发丝线取代）；hover 只允许边框提亮 + 墨色阴影，**禁位移与 scale**（虚拟滚动中重渲染单元格会抖动） | `src/styles/achievement.css` |
| 禁霓虹 glow 阴影（`0 0 Npx`）/ 禁渐变填充徽章；hover 用发丝边框 + 墨色分层阴影 + 2px 抬升 | `src/styles/currency-catalog.css` |
| CW 详情层不设 glow 变量；阴影以物理黑投影 `rgba(0,0,0,…)` 为主；强调色以纯色 / 淡底 / 发丝线为主（例外：详情进度条 2px `primary→accent` 渐变） | `src/styles/currency-role-*.css`（hero / sections / gear / skills 四拆分块） |
| 内容区无发光点 / 无药丸胶囊 / 无 box-shadow 堆叠；徽标走文字式（页面级状态胶囊例外，见 [ADR 0034 决策 6](../adr/0034-终局节点详情面板字阶与区块节奏.md)） | `src/styles/endgame-*.css`（frame / mode / levels / monsters / panels / type-scale） |
| 枢纽页报头之上禁新增行情式装饰（霓虹 glow / 金币雨 / 行情板 / div 合成装饰 / 装饰字符 / em-dash / 装饰性 eyebrow）；**禁补回全屏媒体层**，恢复前必须先改 [ADR 0018](../adr/0018-枢纽页改为工具化入口页.md) 决策 2/3（继续有效） | `src/styles/currency-hub.css`（`nk-hub-release*` / `nk-cwseas*` / `nk-cwrole*` / `nkcwtrait*`）、`src/styles/tokens.css`（`nk-hub-masthead`） |
| 纸感颗粒禁纤维与云斑（会生成可被眼锁定的条纹与脏 blob）；唯一收口、禁止页面级复制 | `src/styles/tokens.css` |
| 弱化霓虹：`--primary-glow` 统一 10% 透明度，只保留隐约材质感；禁止新增 glow 类阴影 | `src/styles/tokens.css` |
| 不做全透白描边的「苹果玻璃」吸顶工具条 | `src/styles/catalog.css` |

页面级设计语言（直角系 / 圆角三档 / 材质与栏目结构）只由各页面 CSS 表达，**改页面视觉前先读该页面 CSS**。目录页头部 2px 强调色划色线（`catalog.css` `.nk-cat-masthead::before`）是发丝线的替代表达，不属「渐变填充」。表外页面（首页 / 怪物详情 / 污染专题 / 角色详情）同受本节总则约束，其页面级材质与例外只在各自 CSS 内声明。

**虚线登记**：虚线只用于承载层级 / 分区 / 空态边界语义，纯装饰性分隔禁用。现有点位——`character-skills.css` 在 `max-width: 767px` 块内给子卡挂 `border-top-style: dashed` + `--line-2`（父卡与单卡族不加线，[ADR 0023](../adr/0023-手机断点技能卡改回虚线分区.md)）；`character-compare.css` 2 处、`character-builds.css` 1 处、`monster-detail.css` 3 处（均 `--line-1`）；状态原语 `nk-img-error` / `nk-slot-empty`（tokens.css）。另 [ADR 0051](../adr/0051-终局赛季奖励进详情页.md) 决策 5 在终局奖励板块登记了**纯装饰的赛季引导虚线**，是唯一「装饰性」例外。新增虚线须在此登记，不得作为通用分隔手段。

## 8. 视觉验收（UI 侧入口）

- **职责边界与取证手段**：AI 只交规格证据（静态审查 / 可断言规格 / DOM 与计算样式取证），不判审美——**唯一定义在 [verification.md](verification.md)**；视觉改动收尾须列「视觉待用户确认」项。
- **像素基线（L4）**：`e2e/visual.spec.ts` 4 张（首页 / 角色图鉴 / 终局 / 货币战争 Hub）。只影响局部时只跑相关用例（`--grep 首页` 等），**全量 `visual.spec` 禁止**；用户确认后用 `pnpm test:e2e:update` 刷新（内置 `--update-snapshots=all`）。直接调 playwright 时默认 `missing`：只补缺失基线，不匹配的基线不落盘且用例报红——刷新必须显式传 `all`。基线入库与 CI 归属见 [testing.md](testing.md)。
- **动画层不进基线**：角色详情 Hero 与调试验收台的 Spine 场景归研究线；枢纽页自 ADR 0018 决策 2/3 移除媒体层、[ADR 0019 决策 12](../adr/0019-枢纽页导航条回归与首页改为版本上新页.md) 定为静态报头（无 WebGL / 视频帧）。细节见 [testing.md](testing.md)。
- **验证级别与预算**（T1a 数值 / T1b 布局结构 / T2 模板数据流 / T3 动画）见 AGENTS.md「验证流程」——**改 UI 先定可断言的验收标准**（如「icon 160px、无边框、无溢出」）。
- **达标判据不在本文件**：见 [UI质量验收标准.md](../audit/UI质量验收标准.md)（A 层可自动断言 / B 层用户裁决 / 终止条件与一票否决）。本文件只答「怎么做」。

## 9. 相关文档地图

- 决策史：ADR 0003（自建侧边栏）、0007（CW 独立模式 + 全壳主题，**主题部分被 0041 修订**）、0010（强化展示范式；**入口形态被 0061 修订**）、0011（黑阶 + 双色约束 + 领域豁免，**双色约束被 0041 修订**）、0012（事实链 + 三道闸门 + 豁免三分类）、0015（研究线迁入，令牌并轨）、0016（枢纽页模式切换入口落点分工，**仅决策 1 有效**）、0018（移除枢纽媒体层与滚轮，**决策 2/3/4 仍有效**）、0019（导航条回归 + 首页版本上新 + 报头原语）、0020（CW 枢纽页本赛季新增）、0021（页面底色上移一档 + 黑阶两向）、0023（手机断点技能卡虚线分区）、0024（图标回退链与真缺失占位）、0027（机制语境色与污染色）、0028（终局父子层级刻度）、0034（面板字阶节奏 + 胶囊政策）、0041（单强调色通道）、0051（赛季奖励板块与引导虚线）、0054（底栏槽位数与语言解耦）。
- 术语：CONTEXT.md「色彩体系」（黑阶 / 主色族 / 领域色豁免 / 语境色 / 污染色 / 数据承载色 / 强调色）、「导航与模式」（交换 / 常规模式 / 货币战争模式 / 枢纽页 / 枢纽返回行）、「页面过渡」（方向性页面过渡 / 交叉过渡 / 串行转场 / 空窗 / 叠层方向 / 错峰）。
- 逐次视觉裁定与坑位：`docs/memory/`；命令与门禁挂载：[commands.md](commands.md)；测试与像素基线：[testing.md](testing.md)；取证手段与陷阱：[verification.md](verification.md)。
