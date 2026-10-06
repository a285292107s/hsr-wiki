# 测试体系

> AGENTS.md 的按主题子文件（主文件「任务 → 必读」路由表经相对链接引用，按需读取）。本文件是**测试三件套与 e2e 分层归属的唯一事实源**。验证级别、预算与执行纪律见主文件「验证流程」节与 [verification.md](verification.md)；测试命令与像素基线刷新方式见 [commands.md](commands.md)。

## 前端单元（Vitest + happy-dom）

- 配置：`vitest.config.ts`（独立于 `vite.config.ts`），`include: src/**/__tests__/**/*.test.ts`
- 范围：纯逻辑——数据层（缓存、API 契约、CDN 解析与健康探测）、`lib/` 与 `spine/` 纯函数、组合式函数、路由注册表、调试台引擎；**不挂载组件**（项目无组件测试运行器，禁止为此引入依赖）
- **环境归属**：不依赖 DOM 的单测文件第一行加 `// @vitest-environment node`（happy-dom 环境启动实测约 0.3s/文件，node 下 environment 0ms）。判定依据：被测生产模块或测试本体是否触碰 `document` / `window` / `localStorage` / `HTMLElement` / `FileReader` / `MutationObserver`；拿不准就加 pragma 实测该文件，跑红即还原并保留 happy-dom
- 跨刷新持久化由 HTTP 缓存承担，无 IndexedDB 持久层

## 前端 e2e（Playwright / 布局验收层）

- 配置：`playwright.config.ts`；`webServer` 起 `pnpm dev` 并复用已有 6188 实例（非 CI）。**三个 project，firefox 排在数组最前**（Playwright 按项目顺序分派文件；最长单元若排在末尾，会被留成单 worker 尾巴——2026-10 实测正是这条让 168s 墙钟只有一个 worker 在跑）：`firefox-layout-contract`（Firefox）只收集 `@cross-engine`——判定可能随引擎差异变化的用例（滚动驱动动画 / mask-image 渐变 / 焦点环 / 极端视口溢出），Firefox 不支持滚动驱动动画，跨引擎契约靠它锁；`chromium`（全部 spec）；`mobile-chromium`（Pixel 7）仅跑 layout（溢出 / 结构 / console 守卫），`testIgnore` 排除 visual 与 accessibility，`grepInvert` 排除**自行 `setViewportSize` 固定视口**的 `@viewport-pinned` 用例（其视口已由用例钉死，重复执行同一断言）与断言与断点无关（数据 / 结构 / 网络来源）的 `@viewport-independent` 用例——手机档只补「非固定视口下的手机断点面」。**三个标签都必须静态写在 `test(...)` 第二参**，动态 annotation 对收集期过滤无效（标签纪律见任一 `e2e/layout-*.spec.ts` 头部）。覆盖面收窄的裁决与未覆盖范围（WebKit 未入 CI）见[验收标准](../audit/角色详情页验收标准.md) B3
- **`@viewport-pinned` 的两种合法用法**：① 用例自钉视口（体内 `page.setViewportSize`）；② 断言只在项目默认（桌面）视口下成立。两者对 `mobile-chromium` 的效果相同（不收集），但**用法 ① 漏标是有代价的**：mobile 会用 Pixel 7（`isMobile` + 触摸仿真）重跑一条本已钉死桌面视口的契约，实测在 CI 上把用例拖成 **30s 超时 × 3 次重试**（e2e job 直接红）。由 `node tools/check-e2e-viewport-tags.mjs --strict` 机检；唯一豁免是 `e2e/layout-debug.spec.ts` 的手机档哨兵（行内 `// e2e-viewport-ok: 理由`——它的 `isMobile` 就是被测对象）。
- **判「滚动中的位置」不要用 `boundingBox()`**：该 API 会等元素「稳定」，平滑滚动期间可能长时间不返回，把用例拖成超时且超时信息里看不到断言值；改用 `locator.evaluate((el) => el.getBoundingClientRect().y)`——轮询值不该有稳定性前置条件。
- **新增 project 必须同步 `.github/workflows/ci.yml` 的 `playwright install` 浏览器清单**（当前 `chromium firefox`；`mobile-chromium` 复用 chromium 二进制）：CI 只装清单内的浏览器，漏登记时该 project 的全部用例以 `browserType.launch: Executable doesn't exist` 告负——而本机浏览器齐全故恒绿，**该缺口只有 CI 能显形**（不装浏览器的项目 = 零覆盖，但仍占 `test:e2e:ci` 的用例数）
- **`@font-calibrated` = 判定依赖平台字体度量的断言，CI 层不收集**（当前 2 条：`layout-character-hero-motion.spec.ts` 的桌面 / 平板「骨架↔就绪同框」）：它们比「骨架盒高 == 就绪面板内容高」，而就绪内容高 = 若干 `line-height: normal` 行盒之和，比例随**实际解析到的回退字体**变——Linux runner 的 Firefox 实测内容高 242.82 / 平板 264.5，比标定源（Windows 239.813 / 262.453）高 3.0 / 2.0px，故在 CI 恒差。`playwright.config.ts` 三个 project 都按 `process.env.CI` 收起该标签（本机 `pnpm test:e2e` 全量仍判；CI 报告里显示为未收集而非失败）。**这是有意的覆盖率收窄**，理由与「像素基线移出 CI」同一条（判定依赖环境，见 `ci.yml` 注释）——**新增判定依赖字体度量的断言必须打此标签**，否则 CI 会在 Linux runner 上翻红；反之，**禁止**为了把它留在 CI 而把面板几何抬到跨平台上界（那是拿全局视觉位移换一条 3px 级加载瑕疵的消音，实测记录见 docs/memory/2026-10.md）。
- 用例：`e2e/guards.spec.ts`（不变量，见下「三层归属」）/ `e2e/shell.spec.ts`（**应用外壳契约**：字体加载链路必须由 HTML `<link>` 承载（CSS 内禁止 `@import`，串行会阻塞字体）、`color-scheme: dark` 已声明、输入框 `caret-color` 随 `--primary`）/ `e2e/layout-*.spec.ts` 十八个分域文件——十一个单域文件（`home` / `nav` / `hub` / `footer` / `debug` / `endgame` / `currency` / `voracity` / `lightcone` / `monster`（敌方页：详情页立绘方框不得造成位移 + 同族各档在卡面可辨、详情页可对照 + 掉落/出没/额外阶段三块逐项等于详情数据，判据与期望值均从 `public/data/cn/**` 派生）/ `catalog`（目录引擎级契约））+ 角色详情页按域拆成 `layout-character-{hero,hero-motion,panel,skill-family,skill-data,lightcone,nav}` 七个 / `accessibility.spec.ts`（axe-core WCAG 扫描）/ `visual.spec.ts`（像素基线）；公共工具在 `e2e/helpers.ts`，layout 跨文件共用的取值原语与数据派生在 `e2e/layout.shared.ts`（只放取值与派生，不放 `test()`/`expect()`）
- **layout 必须按 `describe` 边界分文件**：`fullyParallel: false` 只禁**文件内**并行，文件级并行始终生效——单文件 layout 曾把 74 用例 / 469s 串成一个调度单元，全量墙钟锁死 6.6 分钟。**这条纪律会随用例增长复发**：2026-10 实测全量 180 用例 / 361.6s，其中 `layout-character.spec.ts` 又长回 39 用例的单文件，且 firefox 项目只跑它、它又排在项目末尾 ⇒ 末段 168s（占墙钟 46%）只有 1 个 worker 在跑。故再按域拆成七个 `layout-character-*.spec.ts`，并把 firefox 提到项目最前。**判据**：文件级并行是唯一被采纳的提速手段（提高并发度换 flake 已被否决，见 [commands.md](commands.md)）；新增 layout 用例归入对应域文件，**单文件超过约 15 条就该再拆**——文件级调度单元的时长就是墙钟下界。
- **分层**：CI 层 = `pnpm test:e2e:ci`（layout + accessibility，零外部依赖、环境无关）；像素基线回本机（判定依赖环境——CI IP 对 jsDelivr burst 限流 + Linux/Windows 渲染差异，见 `ci.yml` 注释），**禁止把 `visual.spec` 加回 CI**
- 基线：截图提交 git（`e2e/snapshots/`），本机刷新用 `pnpm test:e2e:update`（详细约束见 [commands.md](commands.md)）
- 断言能力已固化「验证流程」各级别：`toHaveCSS` / `toHaveText` / `toHaveCount`（T1b/T2）、横向溢出检测 `findHorizontalOverflow`（L3）、`toHaveScreenshot`（L4）、axe-core（a11y）、`pageerror` 硬断言（`console` error 仅收集记录，环境性 CDN 失败不硬断言，见 `helpers.ts` 注释）
- a11y 既有缺陷登记在 `accessibility.spec.ts` 的 `KNOWN_VIOLATIONS`（命中降级 warning，新增违规仍失败；登记带超期复查提示）——修复后须人工裁决并从清单移除。**登记前必须先实测**：只有 axe impact 为 `serious`/`critical` 的违规才进入断言路径，`moderate` 级登记进去等于永不生效的白名单（曾有一条此类死条目，已删）。扫描集 = `WCAG_TAGS`（2.2 A/AA）**+ 显式开启 `target-size`**——它挂在 `wcag22aa` 标签下却 `enabled: false`，只写 `withTags` 时 2.5.8 从不执行（「声称 2.2 AA 目标尺寸」的声明曾因此长期未验证，见 [memory](../memory/2026-10.md) 第 10 轮）。
- 枢纽页：`/` 与 `/currency` 为静态品牌带 + 板块索引（无 WebGL / 视频帧），像素基线直接稳定——旧的双枢纽 Hero 媒体层隐藏块已随 [ADR 0018](../adr/0018-枢纽页改为工具化入口页.md) 删除（那些元素已不存在，保留会让 `evaluate` 直接失败）。`/` 首屏入口行数由 `e2e/layout-home.spec.ts` 的可执行断言锁定

### e2e 断言三层归属（不变量 / 契约 / 规格；与上方 CI / 本机归属正交）

| 层 | 职责 | 更新时机 | 落点与机检 |
|---|---|---|---|
| **guards 不变量层** | 页面可达、无未捕获 JS 异常、无未知横向溢出 | **永不**因展示改动（数值 / 块序 / 形态 / 文案）而改；新增页面才补条目 | `e2e/guards.spec.ts` → `pnpm test:e2e:guards`（+ a11y，永远可跑） |
| **contracts 语义契约层** | 语义与跨会话契约：数据驱动的真值、跨模块共享的避让 / 断点 / 尺寸下限 | 契约本身变更时改（即 ADR 或子文件登记过的口径变化） | 与规格层同由 `e2e/layout-*.spec.ts` 承载，按域分文件（`home` / `nav` / `hub` / `footer` / `debug` / `endgame` / `currency` / `character` / `voracity`），每个文件内仍按 `describe` 分组 |
| **specs 数值规格层** | 尺寸 / 间距 / 字号 / 圆角等展示取值 | 随展示迭代改 | 同上；裸 px 由字面量工具扫描（命令与退出码见 [commands.md](commands.md)） |

- **数值断言硬规则（specs 层，可机检）**：禁止裸 px 断言——数值断言必须**令牌派生**（`e2e/helpers.ts → readToken`）或**相对序**（如 `scale.card > scale.groupTitle > scale.label`）；内容真值（首领名 / 污染等级 / 目标分数 / 节点数等）优先从 `public/data/cn/` 的产物 JSON 派生，不在断言里写死页面文案。真正不可漂移的契约值（令牌单点声明值、`0px` 直角 / `1px` 发丝线的**语义即值**类）允许保留字面量，二选一收口：行内标 `// e2e-literal-ok: 理由`，或由基线计数兜底（`tools/e2e-literal-baseline.json`）。扫描器只统计**断言调用里的** px——注释 / 用例标题 / 视口声明不进计数，避免守卫对着注释报警再逼人改注释。
- **改动路由**：展示迭代只需跑 guards 层 + 受影响用例（`pnpm test:e2e:affected`）；**禁止**为过测修改 guards 层——它变红即不变量被破坏，是代码问题而非断言问题。`pnpm test:e2e:ci` 语义不变（layout + a11y，**减去 `@font-calibrated` 那 2 条**——该收窄是登记在案的例外，见上方条目），**除此之外 CI 覆盖率不得下降**。
## Converter（pytest）

- 位置：`tools/converter/tests/`
- 范围：工具函数（unwrap_value / map_icon_path / sort_by_id / resolve_text）、clean_text 标签清洗全分支、增量依赖 AST 一致性、character_detail / currency 纯函数契约、gen_catalog 索引生成、query / textmap_db 缓存查询；合成数据 + mock TextMap，不依赖真实源数据
- 运行：`cd tools/converter && python -m pytest tests/ -v`
- **不在 CI 常驻**：回归由 data-sync 的 Run converter 步骤兜底（转换失败即 job 失败）+ converter 变更时本机 pytest
