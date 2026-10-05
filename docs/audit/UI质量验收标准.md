# UI 质量验收标准 · 全站「获奖级」达标判据

> **本文件回答「做到什么程度算达成」**，而 [ui-design.md](../agents/ui-design.md) 回答「怎么做」、[verification.md](../agents/verification.md) 回答「怎么取证」。
> 判据来源是三家奖项的**公开评审维度** + W3C 标准 + 本仓既有门禁；**数字事实源仍是 `docs/memory/` 与 e2e 契约**，本文件只登记「判什么、门槛多少、在哪验证」，不登记「实测多少」。
> 页面级实例见 [角色详情页验收标准.md](角色详情页验收标准.md)（本文件是它的全站上位口径，两者冲突以本文件为准）。
>
> **维护规则**：表格括号里的「现状 / 起点」数字是建门禁前的**起点基线**（2026-10 审计实测），对应的门禁脚本/契约一旦建立就**必须删掉该处数字**——留着即成为会毒化上下文的过期信息。

## 0. 外部判据来源（写门槛时只允许引用这里）

| 来源 | 用到的部分 |
| --- | --- |
| [Webby · Judging Criteria](https://www.webbyawards.com/judging-criteria/)（官方） | Websites & Mobile Sites 的 7 维：Content / Structure and Navigation / Visual Design / Functionality / Interactivity / Innovation / Overall Experience。原文把**无障碍写进评审项内部**：Visual Design 要求「improving inclusion for people with disabilities, including learning and cognitive disabilities, people with low-vision」；Functionality 要求「cross-platform and browser independent」「special access needs, disabilities, and bandwidth limitations」。Structure & Navigation 的三个词是「consistent, intuitive, transparent」；Content 要求「takes a stand, has a voice and a point of view」 |
| [Awwwards · Evaluation System](https://www.awwwards.com/about-evaluation/) + [Wikipedia: Awwwards](https://en.wikipedia.org/wiki/Awwwards) | 四轴 = **design / usability / creativity / content**（官方 Evaluation 页是 JS 渲染、正文不可静态抓取；四轴取 Wikipedia 对平台的描述）。**权重百分比（40/30/20/10）与 6.5 分门槛只出现在二手行业转述**（[Utsubo](https://www.utsubo.com/blog/award-winning-website-design-guide)）⇒ 本文件只用它排**投入优先级**，不作为阈值依据 |
| [FWA](https://thefwa.com/) | 500+ 国际评审、以 craft 与 novelty 为入选主线（二手来源同上）。本文件不设独立量化项，只借用「完成度 + 新颖性」取向 |
| [WCAG 2.2 AA 成功准则清单](https://www.digitalpolicy.gov.hk/en/our_work/digital_infrastructure/digital_inclusion/accessibility/promulgating_resources/handbook/appendix_b/b2_level_aa_checklist.html) | 2.2 AA 全量准则，含 **2.2 新增 6 条**：2.4.11 Focus Not Obscured / 2.5.7 Dragging Movements / 2.5.8 Target Size / 3.2.6 Consistent Help / 3.3.7 Redundant Entry / 3.3.8 Accessible Authentication |
| [Core Web Vitals 阈值定义方式](https://web.dev/articles/defining-core-web-vitals-thresholds) | 三项指标的「good」阈值（LCP ≤2.5s / INP ≤200ms / CLS ≤0.1）。**获奖级目标值（LCP ≤1.5s / INP ≤100ms / CLS ≤0.05 / 页面总重 ≤3MB / 持续 60fps）来自二手行业经验值**（Utsubo 同页表格）⇒ 作为「目标线」而非「合格线」 |

**一条纪律**：任何新门槛必须能写成「观测方式 + 阈值 + 复现命令」三件套；写不出的一律进 B 层（用户裁决），不得伪装成可断言项。

## 1. 先裁剪：本站是哪种作品（决定权重怎么映射）

奖项口径隐含「品牌互动站」的默认形态（3D/WebGL、音效、滚动叙事、一次性记忆点）。**本站是档案型数据站**，直接照搬会与仓库既有裁决冲突，且会伤害真正被评委计入的 usability：

| 奖项向做法 | 本站裁决 |
| --- | --- |
| 全屏媒体层 / 立绘轮播 / 枢纽滚轮 / 滚动劫持 | **已由 ADR 0018 / 0019 明令禁止**，不因评奖回改 |
| 3D / WebGL / WebGPU 场景 | 不采纳（1204 个预渲染快照 + 移动端低带宽受众，收益与代价倒挂） |
| 音效与音频编排 | 不采纳（工具型站点、无静音开关先例） |
| 装饰性动效堆叠 | 不采纳（[ui-design.md](../agents/ui-design.md) §7 反 AI 味硬约束） |

⇒ **投入面映射**（按 Awwwards 二手权重的优先级，但由本站类型修正）：

1. **Design 一致性是最大缺口**：外部明确点名「inconsistent design systems — homepage polished but inner pages feel like a different site」是典型失败模式；本站已实测存在（单页最多 19 种字号、圆角跨家族无共同基座）。
2. **Usability 是第二大投入面**：性能 / CWV / WCAG 2.2 新增项 / 320px 与 200% 缩放，全部可自动断言。
3. **Creativity 用「站内自有资产」兑现，不新造特效**：Spine 动画预览、虚拟滚动目录、跨模式（常规 ↔ 货币战争）、1204 路由预渲染快照、终局四玩法的同构骨架。
4. **Content 已经是强项**（真实解包数据、零占位），只需守住不回退。

## 2. A 层：可自动断言（硬门禁，任一项红即未达标）

量纲一栏的意义是**让不同实现口径可比**（历史教训：同一件事三处不同单位 ⇒ 看不出差异，见 `docs/memory/2026-10.md` 第 41 轮判据 2）。

### A1 结构与导航（Webby: Structure and Navigation）

| # | 判据 | 量纲 | 合格线 | 目标线 | 取证 |
| --- | --- | --- | --- | --- | --- |
| A1.1 | 每个可索引路由的 h1 唯一且可见 | 计数 | 恰 1 | 恰 1 | `e2e/guards.spec.ts` 不变量循环 ✅已建 |
| A1.2 | 标题层级不跳级，且与页面结构一致 | h 级别序列 | 最大跳跃 ≤1 | 每类页面骨架稳定 | DOM 探针（待建）。**目录页允许只有单层**（一张虚拟网格没有分区）——实测 `/character` 等 5 个目录页 h1 之外零标题；此时判据落在「筛选工具条与网格有可访问命名（`aria-label` / `role=group`）」 |
| A1.3 | 导航单行、桌面高度 ≤80px | px / 行数 | 单行且 ≤80 | ≤72 | 探针（待建） |
| A1.4 | 任一可索引路由从 `/` 出发 ≤3 击可达 | 跳数 | ≤3 | ≤2 | 路由图 BFS（待建） |
| A1.5 | 详情/专题页有上级路径（面包屑或返回链） | 布尔 | 全部有 | 且可键盘到达 | e2e（部分已建） |

### A2 可访问性（Webby 把 a11y 写进 Visual Design 与 Functionality 内部）

| # | 判据 | 量纲 | 合格线 | 目标线 | 取证 |
| --- | --- | --- | --- | --- | --- |
| A2.1 | axe（WCAG 2.2 AA 规则集）违规数 | 条 | 0 serious/critical | 0 全部（含 best-practice） | `e2e/accessibility.spec.ts` ✅部分（缺：全页面族 × 非缺省强调色） |
| A2.2 | **WCAG 2.2 新增 6 条**逐项 | 条 | 6/6 有结论 | 6/6 通过 | 待建（2.4.11 焦点不被遮挡 / 2.5.7 拖拽替代 / 2.5.8 目标尺寸 / 3.2.6 一致帮助 / 3.3.7 冗余录入 / 3.3.8 认证） |
| A2.3 | 键盘可达 + 焦点可见 | 停靠点 | 全部有可见焦点环 | 且不被遮挡 | `e2e/shell.spec.ts` 像素差契约 ✅已建 |
| A2.4 | 320px 重排无横向溢出 | 越界元素数 | 0 | 0（含 200% 缩放） | `e2e/shell.spec.ts` ✅已建（200% 缩放待建） |
| A2.5 | 强制色模式可见文本可读、无溢出 | 条 | 0 违规 | 0 | `e2e/shell.spec.ts` ✅已建 |
| A2.6 | 1.4.12 文本间距：注入用户样式后不裁剪 | 裁剪元素数 | 0 | 0 | 待建 |
| A2.7 | 1.4.11 非文本对比（图标/边框/焦点环） | 对比度 | ≥3:1 | ≥4.5:1 | 待建（扩展 `check-contrast.mjs`） |
| A2.8 | 触控目标 | px | ≥24×24 **或**满足 WCAG 2.5.8 间距豁免 | ≥44×44 | 已建（`target-size` + 探针）。**豁免判据要写清**：24px 直径圆的圆心落在各目标盒中心时互不相交；实测 `/currency/role/1001` 星级按钮 28.6×22、圆心距 31.6 ⇒ 豁免成立——朴素「<24 即缺陷」扫描会误报 |

### A3 性能（Awwwards usability 轴的硬项）

| # | 判据 | 量纲 | 合格线 | 目标线 | 取证 |
| --- | --- | --- | --- | --- | --- |
| A3.1 | LCP / INP / CLS | 秒 / ms / 无量纲 | ≤2.5s / ≤200ms / ≤0.1 | ≤1.5s / ≤100ms / ≤0.05 | 待建（仅角色页测过 LCP/CLS；INP 需真实交互路径） |
| A3.2 | 单页传输总量（首屏与整页分列） | KB | 整页 ≤5MB | ≤3MB 且首屏 ≤1MB | 待建（CDP Network 汇总） |
| A3.3 | 滚动与路由切换的长任务 | ms | 单次 ≤100ms | ≤50ms，掉帧 <1% | 待建（PerformanceObserver） |
| A3.4 | 字体自托管 + `font-display: swap` | 布尔 | 无外链字体 | 子集化 | 静态审查（待核对） |
| A3.5 | 骨架↔就绪的盒高一致性 | px | ≤1 | ≤1 | e2e ✅部分（角色页已建） |

### A4 设计系统一致性（Awwwards design 轴的核心，本站最大缺口）

| # | 判据 | 量纲 | 合格线 | 目标线 | 取证 |
| --- | --- | --- | --- | --- | --- |
| A4.1 | 全站可见文本的字号档位 | 档数 | ≤12 且全部来自 tokens 刻度 | ≤10，每档有语义名 | 待建（现状单页最多 19 档） |
| A4.2 | 圆角档位（跨页面家族） | 档数 | ≤5 且有成文规则 | ≤4 且共用基座 | 待建（现状 `{0,3,4,5,6,8,10,12,14,999}`） |
| A4.3 | 垂直节奏基数 | px | 区块内距与区块间距折算到 4px 栅格（±1） | 8px 栅格 | 待建。**口径**：量区块自身的 `padding/margin` 集合——顶层子元素之间恒为 0（间距由内距承担），量「元素间 gap」会得到一条没信息的 0 序列（实测量到过） |
| A4.4 | 可见文字色是否全部来自语义层 | 越层数 / 每页色数 | 0 越层（裸色值门禁已建） | 且每页 distinct 色 ≤12，**排除领域语义色** | `check-colors --strict` ✅已建 + 待建探针。**排除项**：`--rarity-*` / `--elem-*` / `--skill-*` 等数据承载色是登记豁免，实测 character-detail 14 / cw-role-detail 13 的超出量主要来自它们 |
| A4.5 | 同类元素跨页同规格 | 计算样式指纹 | 卡/按钮/标签/表头跨页一致 | 一致且差异有登记 | 待建 |
| A4.6 | 三态完整性（loading / empty / error） | 布尔 | 每类页面三态齐备 | 三态均有设计且断言 | 原语已建（`nk-skeleton` / `nk-slot-empty` / `nk-error-state`），逐页核对待建 |

### A5 排版与阅读

| # | 判据 | 量纲 | 合格线 | 目标线 | 取证 |
| --- | --- | --- | --- | --- | --- |
| A5.1 | 正文每行字数 | 全角字数 | ≤45 | 38–44 | `--nk-prose-max: 44em` + e2e ✅已建 |
| A5.2 | 正文行高 | 倍数 | 1.7–2.0 | 1.8–1.95 | 探针（待建） |
| A5.3 | 字号下限 | rem | 句子级 ≥0.72；标签级 ≥0.6；无 <0.6 | 句子级 ≥0.78 | 探针（待建；现状有 8px/0.5rem 级文本） |
| A5.4 | 中英混排转写与标点（悬挂/挤压） | 布尔 | 无粘连、无孤立标点 | 一致处理 | 待建 |
| A5.5 | 任何靠 hover 展开的信息都有非 hover 途径 | 布尔 | 触摸端无内容丢失 | 且可键盘触发 | 已建（第 40 轮判据） |

### A6 内容与文案（Awwwards content 轴 10%）

| # | 判据 | 量纲 | 合格线 | 目标线 | 取证 |
| --- | --- | --- | --- | --- | --- |
| A6.1 | 占位文本 / 开发黑话 | 条 | 0 | 0 | 待建（扫 UI 字符串里的 `data-` / `localStorage` / TODO 类） |
| A6.2 | 死链 | 条 | 0 | 0 | `tools/dead-links.test.ts` ✅已建 |
| A6.3 | 每路由唯一 title / description / h1 | 条 | 齐全 | 且与正文主题一致 | AI 端点守卫 ✅部分 |
| A6.4 | 禁 em-dash / 装饰性 eyebrow / 版本号装饰 | 条 | 0 | 0 | 待建（已有成文禁令，缺门禁） |

## 3. B 层：用户裁决（AI 只备证据，不判审美）

每条要求**一份可指认的证据**（截图 / 对比图 / 录屏）与**一次用户勾选**。AI 不得自行给出「达标」结论（职责边界见 [verification.md](../agents/verification.md)）。

| # | 判据（对应奖项维度） | AI 需准备的证据 | 三档 |
| --- | --- | --- | --- |
| B1 | 视觉识别度：一套语言贯穿全站（Design / Visual Design） | 同一元素类别在 ≥6 类页面上的并排截图 | 不一致 / 同类一致 / 跨类一致且有节奏变化 |
| B2 | 一次性记忆点：有没有一个「让人停下来」的交互或形态（Creativity） | 该交互的录屏 + 与常规页面的对比 | 无 / 有但只是动效 / 有且服务于内容 |
| B3 | 微交互品质：hover / focus / press / 禁用态齐全且克制（Design-micro-details） | 同一控件的四态截图组 | 缺失 / 齐全 / 齐全且有物理反馈 |
| B4 | 动效编排：有意图、有节奏、可打断、尊重 reduced-motion（Interactivity） | 动效序列的帧表 / 录屏 | 装饰性 / 有意图 / 有编排且不阻塞操作 |
| B5 | 密度与留白：信息密度与呼吸感的平衡（Design） | 首页 / 目录 / 详情 / 长文四类页面首屏对比 | 拥挤或空旷 / 可读 / 有明确节奏 |
| B6 | 文案语气：档案语气一致、无营销腔（Content） | 全站文案抽样（标题/说明/空态/错误态） | 混杂 / 一致 / 一致且有声音 |

## 4. 达标定义（终止条件）

1. **硬条件**：A 层全绿——每个 A 项都有可重复执行的取证，且最近一次执行全绿。
2. **软条件**：B 层 6 项各有可指认证据，且用户判定 ≥「目标档」（`v2`）。
3. **一票否决**（命中即无论 A/B 如何都判未达标）：为评奖推翻 ADR 0018/0019 禁项；引入模板化/生成式痕迹；桌面优先、移动端后补；首页精致而内页像另一个站；首屏有占位内容；性能靠「以后优化」。
4. **未达标时的推进顺序**：A4 设计系统一致性 → A3 性能 → A2 可访问性缺口 → B2 记忆点 → 其余。
5. **降级必须显式**：任何「接受不达标」的口径要同时出现在本文件与 `docs/memory/`，写清最坏值与样本量；只改代码不改口径视为未达标。

## 5. 与既有门禁的关系（谁覆盖谁）

| 问题 | 归属 |
| --- | --- |
| 颜色怎么收口、令牌怎么分层、断点怎么用 | [ui-design.md](../agents/ui-design.md) |
| 取证金字塔、职责边界、环境性排障 | [verification.md](../agents/verification.md) |
| **做到什么程度算达成** | 本文件 |
| 某页面/某域的具体实例 | [角色详情页验收标准.md](角色详情页验收标准.md) 等域内文件 |
| 实测数字 | `docs/memory/` 与 e2e 契约、commit message 正文 |

**缺口（即后续轮次的工作队列）**：A 层共 **33 项**，其中 **13 项已有取证**（多为部分覆盖：结构与导航 1 项、a11y 5 项、性能 1 项、设计系统 1 项、排版 2 项、内容 3 项），其余 **20 项需先建「量测脚本 + e2e 契约」**才谈得上验收——建脚本本身就是推进路径，不得先宣称达标再补取证。

## 6. 迭代范围（锁定）

迭代范围**只在下面这张表内**；范围外页面不因本目标改动（但任何改动都不得让范围外页面回归——不变量层与守卫照旧全绿）。

| 模式 | 页面 | 路由 |
| --- | --- | --- |
| 常规 | 首页 | `/` |
| 常规 | 角色图鉴 + 详情 | `/character` · `/character/:id` |
| 常规 | 光锥图鉴 + 详情 | `/lightcone` · `/lightcone/:id` |
| 常规 | 遗器图鉴 + 详情 | `/relic` · `/relic/:id` |
| 货币战争 | 枢纽（tab 容器） | `/currency` |
| 货币战争 | 角色图鉴 tab + 详情 | `/currency/role` · `/currency/role/:id` |
| 货币战争 | 装备图鉴 tab | `/currency/item` |
| 货币战争 | 投资环境 tab | `/currency/buff` |
| 货币战争 | 投资策略 tab | `/currency/augment` |
| 货币战争 | 羁绊图鉴 tab + 详情 | `/currency/trait` · `/currency/trait/:id` |

- **覆盖规模**：11 个列表/枢纽页 + 5 个详情族（角色 98 / 光锥 170 / 遗器 62 / 货币角色 75 / 货币羁绊 33 = **438 个详情路由**）。详情页同构 ⇒ 每族抽代表页迭代 + 规格扫全量。
- **明确不在范围内**：`/item`、`/monster`(+详情)、`/endgame`(+玩法页 + 赛季页)、`/achievement`、`/voracity`、`/settings`、`/debug`。
  - 例外：**共享底座**（`tokens.css` / `catalog.css` / 侧栏外壳 / `skill-card.css`）的改动会同时落在范围外页面上——这类改动必须全站跑不变量层，并在交付说明里写清连带面。
- **范围变化**：只能由用户指令改这张表；改表即改「达标」的定义，须同步 commit message 正文。
