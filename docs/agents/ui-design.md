# UI 设计 — 视觉系统唯一事实源

> **定位**：本文件是 UI / 视觉设计约束（样式分层 · 令牌 · 主题 · 断点 · 反 AI 味 · 视觉验收）的**唯一事实源**。AGENTS.md 只留硬约束与指针，其他文档**禁止再写第二份 UI 设计正文**——需要补充时改本文件，或就近写进对应 CSS / 组件头部注释。
> **事实源是代码**：`src/styles/tokens.css`（令牌与全局原语）、`src/lib/theme.ts` + `src/lib/cw-theme.ts`（强调色切换）、`tools/check-colors.mjs` + `tools/check-contrast.mjs`（门禁）。本文件与代码冲突时以代码为准并立即修订本文件。
> 术语定义在 [CONTEXT.md](../../CONTEXT.md)「色彩体系 / 导航与模式 / 页面过渡」；色彩决策史见 ADR 0011 / 0012；页面级设计语言（圆角档位、栏目结构、材质）就近写在各页面 CSS 顶部注释，不上收本文件。

## 1. 样式分层与命名

| 层 | 文件 | 放什么 | 禁止 |
|---|---|---|---|
| 令牌 + 全局原语 | `src/styles/tokens.css` | 四层令牌（§2）；跨页全局原语（导航壳 `ui-sidebar*` / `nk-tabs` / `nk-panels`·`nk-panel` / `nk-secnav` / `nk-skeleton`·`nk-sk--*` / `nk-toast` / `nk-card` / `nk-hub-footer`·`nk-hub-brand`（两个枢纽页共用的页脚骨架与品牌带） / 各目录网格族 / `nk-empty`·`nk-error-state`·`nk-img-error`）；无障碍三件套；纸感颗粒覆层 | 页面专属规则；**页面 CSS 直接引用原始层** |
| 目录引擎 | `src/styles/catalog.css` | 目录卡片与网格（卡片 HTML 由模板字符串 v-html 注入，scoped 命不中）；**两个枢纽页共用的上新区块原语 `nk-hub-release*`**（本章程特例：它是页面布局且作用域覆盖目录卡片类，故单点声明留在本文件而非 tokens.css，见 [ADR 0020](../adr/0020-货币战争枢纽页改为本赛季新增页.md) 决策 7） | 页面专属样式；复制该区块 |
| 页面 | `src/styles/<page>.css` | 页面专属，由视图组件 `import`，随路由拆 chunk 懒加载 | 跨页复用（先查原语）；复制粘贴其他页面规则 |
| 组件 | SFC `<style scoped>` | 组件专属（如 CW Hub 导航） | 污染全局命名空间 |

- **命名**：BEM + 双前缀——内容与设计系统 `nk-`；应用外壳（侧栏、更多抽屉、导航）`ui-`。禁止第三种前缀。
- **样式加载**：全局仅 `tokens.css` + `catalog.css`（bootstrap 导入）；其余页面 CSS 随各自路由 chunk 到达，带专属样式的目录在 `CatalogPageConfig.styles` 声明并随路由并行加载。
- **不使用 CSS 预处理器**；全局原语用 `:where()` 保持零特异性，页面规则必须永远能覆盖原语。
- **纸感颗粒覆层**（`#app::after`）唯一收口于 tokens.css，**禁止页面级复制或调参**；强度唯一调参位 `--grain-opacity`。
- **无障碍三件套**（tokens.css 末尾，全站硬标准）：`focus-visible` 统一 2px 主色焦点环；`prefers-reduced-motion: reduce` 全站禁用位移/过渡；`hover: none` 重置粘滞 hover。页面级只在各自 CSS 追加细化，不重复定义基础态。

## 2. 色彩：四层令牌与单向事实链

| 层 | 令牌族 | 消费规则 |
|---|---|---|
| **原始层**（色阶事实） | 常规强调候选 `--tc-*`（赤陶，缺省）/ `--ol-*` / `--sl-*` / `--sd-*` / `--ir-*`；CW 强调候选 `--rs-*` / `--sv-*` / `--em-*` / `--cp-*`；`--gold-*`（CW 缺省金 / 星级 / 网关入口）；`--blk-*`（中性纯黑阶）；`--ph-*`（领域泛品红紫） | 只允许被别名层与领域层引用；**页面 CSS 禁止直接消费** |
| **主题色阶别名层** | `--th-*`（常规，随 `data-accent`）、`--cwth-*`（CW，随 `data-cw-accent`） | 语义层只引用别名层，不绑定具体色族——这是「强调色可切换」的实现机制 |
| **语义层** | `--primary`（= `--th-500`）/ `--accent`（= `--th-400`，主色梯度端）/ `--bg`·`--surface`·`--card`（黑阶 + 主色注入）/ `--text*` / `--border*` / `--gold-sem` / `--highlight` / `--metric-val` / `--primary-glow` | 随主题与强调色切换；派生色一律 `color-mix(in srgb, var(--primary) X%, transparent)`，禁止写成新色值 |
| **领域层** | `--rarity-*` / `--prop-*` / `--elem-*` / `--skill-*` / `--relic-*` / `--cw-*` / `--crole-*` / `--ctrait-*` / `--ach-*` / `--hero-bg-*` | 数据语义色，**不随主题/强调色**；领域色不得引用 `--th-*` / `--cwth-*` |

**事实链单向依赖**：原始层 → 别名层 → 语义层 → 消费层（页面 CSS / JS 模板字符串，只读 `var()` / `color-mix` / CSS 变量注入）。消费层定义任何颜色事实 = 违规。

- **裸色值禁令**与豁免（豁免必须在 `tools/check-colors.mjs` 常量区块登记，带理由 + ADR 引用）：严格中性三分量差 ≤4 的灰阶/黑/白、SVG data URI 内联白（物理限制）、`var()` fallback 内的中性或令牌值。**`var()` fallback 禁止裸彩色**。
- **黑阶是深色表面唯一事实来源**，并按用途分两个方向（ADR 0021）：**承载位**逐级提亮——`850` 页面底色（`--bg`）/ `800` 承载面（外壳·面板·条·牌·图窗）/ `750` 卡片面（`--card` 及其卡内垫底）；**压暗位** `950` / `900` 只用于媒体遮罩、暗角内影、scrim、hover 洗色，**禁止当承载面**（比页面更暗是它们的语义，误用即读成空洞）。改底色必须与表面阶梯同批上移：只改 `--bg` 会在 `#101012` 以上让 `--surface` 比页面更暗（实测算例见 ADR 0021）。主题色相由语义层 `color-mix` 注入（约 3~8%），黑阶本身不写色相。
- **数据承载色**例外：游戏数据自带颜色（富文本 `<color>`）运行时透传 inline style，不属令牌体系（见 CONTEXT.md）。
- 新增颜色的完整评审闸见 §5。

## 3. 主题与强调色

| 通道 | 开关 | 预置值 | 缺省表达 |
|---|---|---|---|
| 模式 | `route.meta.cw` → `<html data-theme="cw">`（App.vue 挂载） | 常规 / 货币战争 | 无 `data-theme` = 常规 |
| 常规强调色 | `<html data-accent>` | `terracotta` 赤陶（缺省）/ `olive` 橄榄青 / `slate` 雾霭蓝灰 / `sand` 暖沙棕 / `iris` 暮山紫 | 无 `data-accent` = `terracotta`（另有显式 `[data-accent="terracotta"]` 规则保证幂等） |
| CW 强调色 | `<html data-cw-accent>` | `gold` 香槟金（缺省）/ `rose` 玫瑰金 / `silver` 铂银 / `emerald` 翡翠 / `copper` 赤铜 | 无 `data-cw-accent` = `gold`；仅 `[data-theme="cw"]` 语境生效 |

- 链路：`theme.ts` / `cw-theme.ts` 持久化到 localStorage（`HSR_WIKI_ACCENT` / `HSR_WIKI_CW_ACCENT`）+ `bootstrap.ts` 挂载前初始化（防首帧主题闪烁）；`tokens.css` 的 `[data-accent]` / `[data-theme="cw"][data-cw-accent]` 规则重映射别名层，语义层与全站自动跟随。两通道**互相独立**。
- **新增强调色 = 三处同改**（缺一处即失效或漂移）：① 原始层色阶 → ② `[data-accent="…"]`（常规）或 `[data-theme="cw"][data-cw-accent="…"]`（CW）规则重映射别名层 `--th-*` / `--cwth-*` → ③ `theme.ts` 的 `ACCENTS` / `cw-theme.ts` 的 `CW_ACCENTS`（`key` + `label` + 三点 `swatch`）。`:root` 的别名层缺省映射与语义层无需改动（自动跟随）。
- **色阶结构硬约束**：常规强调色阶为 11 级（`50`–`950`，别名层消费 `300/400/500/600/700`）；CW 强调色阶为 7 位（`200` 亮端 / `300` 文字强调位 / `350` 高亮暖位 / `400-500` 主色位 / `600-700` 降阶暗位）。**两模式的文字强调位对黑底对比度必须 ≥4.5:1**（`check-contrast.mjs` 门禁强制）。
- **小字混色下限**（两处，均为 8~9px，按 WCAG 正文 4.5:1 判定）：`.ui-sidebar-link--active .ui-sidebar-link__en` 的 `--metric-val` 混色**不得低于 92%**——原「85% 最低 5.19」是旧底色（`--bg` = 纯黑）下的结论；底色上移到 `blk-850` 后同一混色只余 4.59、axe 实测 4.48 已破线，逐色阶重测 92% 最低 5.10（ADR 0021）。`.nk-swatch--on .nk-swatch__hex` 不得低于 **80%**（原 62% 实测 3.60，存量违规）。改动任一处前必须在全部 10 套强调色下按 sRGB 合成重测对比度（`e2e/accessibility.spec.ts` 只覆盖缺省色 + 4 个页面，抓不到其余 8 套、也抓不到未扫码页）。
- **同一时刻只有一个强调色相**：主题层（背景/表面/强调）禁止第二色相；设置页默认即赤陶，`--accent` 必须是当前色阶成员（禁止恢复游离色）。
- **领域色豁免**：星级 / 属性 / 元素 / 技能类型 / 强化角标 / 文本高亮保持游戏内约定色，不随主题；CW 内领域金走暗铜降阶。
- **导航语义豁免（已退场，ADR 0019）**：旧首页网关入口行 `.nk-home-row--gateway` 随首页板块索引一并删除，跨模式入口由侧栏「交换」承担，不存在第三色相——本分类当前无条目（`check-colors.mjs` 仅保留说明注释）。
- 设置页布局契约：区块编号与视觉顺序固定为 01 常规主题色 / 02 货币战争主题色 / 03 开拓者形态，**不随语境交换**；可见文案只写玩家可感知语义，禁止出现 `data-accent` / `meta.cw` / localStorage 等架构黑话（规则见 `SettingsView.vue` 头部注释）。

## 4. 门禁（`pnpm build` 前置三守卫中的两个）

- **`tools/check-colors.mjs --strict`**：扫描 `src/**/*.{css,vue,ts}` 裸色值（hex / rgb / rgba）；严格中性阈值 ≤4、`var()` fallback 纳入检查。豁免面固定为 `SKIP_FILE`（`__tests__` / `debug/` / `theme.ts` / `cw-theme.ts`）与 `tokens.css` 本体，**禁止擅自扩大豁免面**；确需新增须在脚本内登记理由 + ADR 引用。**每次颜色变更后必跑**。
- **`tools/check-contrast.mjs --strict`**：读 `:root` 与 `[data-theme="cw"]` 两套令牌，正文类 ≥4.5:1（`--text` / `--text2` / `--text3` / `--text-bright` / `--highlight` / `--gold-sem` / `--metric-val`），主色位 ≥3:1（`--primary`，装饰与大字豁免）。
- **`check-contrast` 的盲区（改底色/表面亮度必查）**：它只算「文字令牌 × `--bg`」。文字落在 `--surface` / `--card` / 着色片（tag·chip·激活段）上时对比度还要再降一档，这一层只有 `e2e/accessibility.spec.ts`（axe，4 页 × 缺省强调色）兜底；**两处都覆盖不到的组合（其余页面、其余 9 套强调色、非激活态）改颜色时必须人工按 sRGB 合成核算**。实例（ADR 0021）：`--text3` 在提亮后的卡片上由 5.61 掉到 4.83、在着色 tag 上掉到 4.10，axe 因此抓到 3 处新回归。故改底色时「除 `--bg` 外必须同时核 `--surface` / `--card` / 外壳三条」，改完用 axe 覆盖 4 页 + 自建探针覆盖详情页。
- **两守卫与 `check-spine-manifest.mjs`** 由 `tools/check-guards.mjs` 串行汇总，挂载于 `pnpm build`（详见 [commands.md](commands.md)）；CI 不重复跑 build。**守卫全绿 ≠ 语法正确**：三个守卫都走正则解析，CSS 语法错误只有在 `pnpm build` 的 postcss 阶段才暴露（ADR 0021 实例：注释块插到 `*/` 之后，三守卫全 PASS、build 报 `Unknown word`）。

## 5. 新增颜色四步流程（评审闸）

新增颜色进入代码前必须走完四步并跑通门禁（本流程以本节为唯一事实源，其他文档不复述）。

1. **查令牌**——在 `tokens.css` 四层中检索是否已有可用令牌；有 → 直接 `var()` 引用，流程结束。
2. **定层级**——无可用令牌时按语义归属：数据语义色 → 领域层；随主题变的映射色 → 语义层（**必须从别名层派生**）；新色相家族 → 原始层（需评审：新家族意味着新强调色阶或新领域语义族）。
3. **双色约束判定**——该色是否落在当前模式的**唯一强调色相**内？是否属于领域色豁免或导航语义豁免？两者皆非即违规（禁止第三色相）。
4. **落 tokens + 跑门禁**——令牌写进 `tokens.css` 对应区段；页面 CSS / JS 只 `var()` / `color-mix`；跑 `node tools/check-colors.mjs --strict` 与 `node tools/check-contrast.mjs --strict` 全绿；确需新豁免须在 `check-colors.mjs` 登记理由 + ADR 引用，并同步 ADR。

**回归**：常规 + CW 双主题都要看（重点：主色强调位、黑阶表面层次、领域色不受影响）→ 视觉确认交用户（§8）。

## 6. 断点与响应式

| 区间 | 布局 |
|---|---|
| <768px | 手机：底部 Tab Bar（放不下的尾部动态折叠进「更多」抽屉）；页面过渡统一淡入淡出；枢纽页品牌带 148px |
| 768–1023px | 平板：竖排图标侧栏；枢纽页品牌带 176px |
| ≥1024px | 桌面：文字侧栏（档案目录册）；枢纽页品牌带 200px |

- 断点档位集合（新增值须在评审中说明理由，禁止随手新值）：`374 / 560 / 640 / 767(.98) / 768 / 1023 / 1024 / 1280 / 1536 / 1600 / 2560`，外加 `max-height: 500px + landscape`（横屏矮视口压缩侧栏与 Hero）、`hover: hover and pointer: fine` vs `hover: none`（**交互能力判定用能力查询，不用宽度代替**）。
- 内容留白经令牌断点接管（平板 / 桌面两档），**禁止写死像素**。
- 枢纽页 Hero 是**跨页共享原语** `.nk-hub-brand`（声明 tokens.css）：桌面 200 / 平板 176 / 手机 148px，纯令牌渐变、无媒体层。**禁止在页面 CSS 重新声明或改断点数值**——两页高度不一致会让 `nk-view-swap` 互切时出现一边文字已展开、一边文字直接就在那里的跳动。策略与理由见 [ADR 0018](../adr/0018-枢纽页改为工具化入口页.md)。
- 侧栏「调试台」入口：≥768px 显示（设置按钮上方），<768px 隐藏且不参与底部栏折叠测量。

## 7. 反 AI 味硬约束（不可回退）

判定基准：**能被一眼锁定的机器感元素都禁止**——霓虹光晕、渐变头、玻璃胶囊、堆叠投影、装饰性排版符号。以下禁令分散在各 CSS 头部（就近上下文），本表是跨页索引，改样式前先扫一遍：

| 禁令 | 出处 |
|---|---|
| 禁 head 渐变 / 禁 box-shadow 发光（glow）/ 禁 `backdrop-filter` 徽章胶囊 / 禁虚线分隔（发丝线取代）；hover 只允许边框提亮 + 墨色阴影，**禁位移与 scale**（虚拟滚动中重渲染单元格会抖动） | `src/styles/achievement.css` |
| 禁霓虹 glow 阴影（`0 0 Npx`）/ 禁渐变填充徽章；hover 仅发丝边框 + 墨色分层阴影 | `src/styles/currency-catalog.css` |
| CW 详情层不设 glow 变量；阴影以物理黑投影 `rgba(0,0,0,…)` 为主；强调色只用纯色 / 淡底 / 发丝线 | `src/styles/currency-role.css` |
| 无发光点 / 无药丸胶囊 / 无 box-shadow 堆叠；徽标走文字式 | `src/styles/endgame.css` |
| 枢纽页品牌带之上禁新增行情式装饰（霓虹 glow / 金币雨 / 行情板 / div 合成装饰 / 装饰字符 / em-dash / 装饰性 eyebrow）；**禁补回全屏媒体层**（背景视频 / poster / KV Spine / 立绘轮播），恢复前必须先改 [ADR 0018](../adr/0018-枢纽页改为工具化入口页.md) | `src/styles/currency-hub.css`、`src/styles/tokens.css` |
| 纸感颗粒禁纤维与云斑（会生成可被眼锁定的条纹与脏 blob = 机器感来源）；唯一收口、禁止页面级复制 | `src/styles/tokens.css` |
| 弱化霓虹：`--primary-glow` 常规层为 10% 透明度、CW 层为 25%，只保留隐约材质感；禁止新增 glow 类阴影 | `src/styles/tokens.css` |
| 不做全透白描边的「苹果玻璃」吸顶工具条 | `src/styles/catalog.css` |

页面级设计语言（直角系 / 圆角三档 / 材质与栏目结构）就近写在各自 CSS 头部注释，**改页面视觉前先读该页面 CSS 头部**。

**有意豁免登记 · 技能卡子卡虚线分区**：`src/styles/character.css` 在 `max-width: 767px` 块内用 `border-top: 1px dashed var(--line-2)` 表达技能族层级（子卡上沿；父卡与单卡族不加线），与上表「禁虚线分隔」相抵。判据 = **该虚线承载同族层级语义，不是装饰性分隔**（出处：`src/styles/character.css` 的手机断点块 + [ADR 0023](../adr/0023-手机断点技能卡改回虚线分区.md)），且与 `character.css` 既有 3 处虚线（技能故事 / 对比模式）同类。**豁免不扩展到**成就页与其它页面的装饰性分隔——上表该行对它们继续有效。

## 8. 视觉验收（UI 侧入口）

- **职责边界与取证手段**：AI 侧只交规格证据（静态审查 / 可断言规格 / DOM 与计算样式取证），不判定审美——**唯一定义在 [verification.md](verification.md)**，本文件不复述；涉及视觉表现的改动，收尾汇报必须列「视觉待用户确认」项。
- **像素基线（L4）**：`e2e/visual.spec.ts` 4 张（首页 / 角色图鉴 / 终局 / 货币战争 Hub），基线提交 git（`e2e/snapshots/`），**CI 不跑 visual**（判定依赖环境）。改动只影响局部时只跑相关用例（`--grep 首页` 等），**全量 `visual.spec` 禁止**；用户确认改动符合预期后用 `pnpm test:e2e:update` 刷新（脚本已内置 `--update-snapshots=all`，直接调 playwright 时必须显式传，默认 changed 模式会静默不落盘）。
- **动画层不进基线**：角色详情页 Hero 与调试验收台的 Spine 场景不进基线，其渲染验收归研究线；枢纽页自 [ADR 0018](../adr/0018-枢纽页改为工具化入口页.md) 起为静态品牌带（无 WebGL / 视频帧），基线天然稳定。细节见 [testing.md](testing.md)。
- **验证级别与预算**（T1a 纯数值 / T1b 布局结构 / T2 模板数据流 / T3 动画）见 AGENTS.md「验证流程」——**改 UI 先定可断言的验收标准**（如「icon 160px、无边框、无溢出」）。

## 9. 相关文档地图

- 术语：CONTEXT.md「色彩体系」（黑阶 / 双色约束 / 主色族 / 领域色豁免 / 导航语义豁免 / 数据承载色 / 强调色）、「导航与模式」（交换 / 常规模式 / 货币战争模式 / 枢纽页 / 枢纽滚轮 / 枢纽返回行 / 无侧栏枢纽）、「页面过渡」（方向性页面过渡 / 交叉过渡 / 串行转场 / 空窗 / 叠层方向 / 错峰）。
- 决策史：ADR 0003（自建侧边栏）、0007（CW 独立模式 + 全壳主题）、0010（强化对比双段灰金）、0011（黑阶 + 双色约束 + 领域豁免）、0012（事实链 + 三道闸门 + 豁免三分类）、0015（研究线迁入，样式令牌并轨）、0016（枢纽页模式切换入口的落点分工：交换→对方图签页 / 上滚→对方枢纽页 / 返回行→常规首页）、0021（页面底色上移一档 + 黑阶承载位 / 压暗位）。
- 逐次视觉裁定与坑位：`docs/memory/`（成就页反 AI 味、CW Hub 三轮对齐、视觉职责边界收敛等）。
- 命令与门禁挂载：[commands.md](commands.md)；测试与像素基线：[testing.md](testing.md)；取证手段与陷阱：[verification.md](verification.md)。
