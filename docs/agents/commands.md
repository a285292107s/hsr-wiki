# 命令手册 — 运行 / 构建 / 测试 / 部署 / 工具

> AGENTS.md 的按主题子文件（主文件「任务 → 必读」路由表经相对链接引用）。主文件只留高频命令，本文件是命令全量事实源：环境、端口、dev 缓存自愈、e2e 命令、研究线入口、converter、部署与门禁。e2e 分层归属与用例范围见 [testing.md](testing.md)。

## 环境与安装

```bash
pnpm install   # 版本口径与禁用依赖清单见 tech-stack.md（唯一事实源）
```

## 本地开发

```bash
pnpm dev       # → http://localhost:6188/
```

端口 6188 为冷门固定端口，`strictPort`：被占用时明确报错而非静默换端口；先探测 6188 复用已有实例，无实例才新起。**禁止改回 Vite 默认 5173**（见 ADR 0014）。

## dev 缓存自愈（rolldown-vite 8 Windows 坑位）

- **症状**：改 CSS/TS 后 dev 永远返回旧内容（事件被软失效吸收，transform 缓存无 mtime 兜底），重启才恢复。
- **用法**：仅当「文件已最新但 dev 响应旧」时执行 `node tools/refresh-vite-cache.mjs <文件/目录...>`。
- **纪律**：先诊断（`curl` 对比 dev 响应与磁盘特征串）→ 自愈 → 才允许重启；**禁止引入自动改源文件的失效方案**（已因并发写入破坏源文件废弃）。
- **根因**：rolldown-vite 8 事件软失效吸收；`usePolling` 已配置但不根除。

## 构建与预览

```bash
pnpm build     # 构建守卫 → vue-tsc -b → vite build → AI 端点生成 + 守卫 → dist/
pnpm preview   # 预览构建产物
```

`pnpm build` 前置 `tools/check-guards.mjs`（色彩收口 / Spine 清单 / 对比度三守卫串行）；末步 `tools/gen-ai-endpoints.mjs` + `tools/check-ai-endpoints.mjs`（生成 `dist/prerender/**` 快照与 `dist/sitemap.xml` 并断言覆盖率，契约见 [ai-discoverability.md](ai-discoverability.md)）。两者可单独运行，但生成器必须在 `vite build` 之后（模板取自 `dist/index.html`）。

## 测试

```bash
pnpm test                                            # 全部测试（Vitest）
pnpm vitest run src/services/__tests__/api.test.ts   # 单个测试文件
pnpm test:watch                                      # 监听模式
```

e2e（Playwright，webServer 自动起 dev server 并复用已有 6188 实例）：

```bash
pnpm test:e2e          # 本机层：全量（含像素基线）
pnpm test:e2e:ci       # CI 层：layout + a11y（环境无关；覆盖不得下降，`@font-calibrated` 与 2026-10 登记在案的 firefox/mobile 收窄除外——见 testing.md）
pnpm test:e2e:guards   # 不变量层：guards + a11y（不受 UI 迭代影响，永远可跑）
pnpm test:e2e:affected # 受影响用例层：按 git diff 推导并直接执行（= node tools/e2e-affected.mjs --run）
pnpm test:e2e:update   # 刷新像素基线（已内置 --update-snapshots=all；重构期只在收敛后跑一次）
```

**直接调用 playwright 时必须显式传覆盖模式**：`pnpm exec playwright test --update-snapshots=all`——Playwright 默认 `changed` 模式在更新已有基线时静默 pass 不落盘。只跑改动实际影响的用例（`--grep 首页` 等），`visual.spec` 全量禁止。

`playwright.config.ts` 保持 `fullyParallel: false`（**文件内**串行）——全局并行实测过但不采纳：本地 4 worker 全量墙钟比串行快约两成，代价是 3 次全量里出现 1 次并发竞态 flake（同一用例串行复跑 2/2 与单独复跑 3/3 均绿，属并发下 dev server 争用而非代码缺陷）。**禁止为提速放宽断言、加 `--retries` 或改配置掩盖 flake**。

**2026-10 复测的是另一个配置**——`fullyParallel: true` + `workers: 2`（并发页面数与现状**相同**，只把调度粒度从文件降到用例）：CI 层 206 用例 A/B 实测 **341s → 312s（约 8%）**，且提速那一 arm 跑在更热的缓存上（顺序对 `fullyParallel` 有利）。增益不足以承担改配置的 flake 面，故**仍维持 `false`**；要提速走拆分文件那条路（见下条），**不要**再拿这条做「反正并发数没变」的翻案——翻案需要换序复跑的稳定增益，而不是单次 A/B。

**但「不采纳全局并行」≠「接受单文件串行」**：`fullyParallel: false` 并不禁止**文件级**并行（Playwright 始终按文件分派 worker）。layout 曾是单个 74 用例 / 469s 的大文件，等于把全量调度压成一个串行单元——实测墙钟 327s。按 `describe` 边界拆成 `e2e/layout-*.spec.ts` 后墙钟大幅下降，**但这纪律会随用例增长复发**：2026-10 实测全量 180 用例 / 361.6s，`layout-character.spec.ts` 又长回 39 用例单文件、firefox 项目只跑它、它又排在项目数组末尾 ⇒ 末段 168s（占墙钟 46%）只有 1 个 worker 在跑。故再拆成七个 `layout-character-*.spec.ts`，并把 firefox project 提到项目最前（Playwright 按项目顺序分派，最长单元先起跑）。**要提速就走这条路：减用例数、按域拆文件、最长的 project 放最前——禁止提高并发度**（唯一例外是先把 flake 根因修掉，见下条）。

## 漂移与影响面工具（report-only，默认不阻塞）

六个漂移检查器都**默认不阻塞**（退出码 `0`）：只打印漂移清单，**加 `--strict` 才在命中时退出 1**；`e2e-affected.mjs` 只推导并打印可执行命令，`--run` 才真正执行。它们**刻意不接入 `pnpm build` 与 CI**——迭代期漂移必然存在，硬门禁只会逼出「为过闸改文档」的反向浪费。注意区分：`tools/check-doc-links.mjs`（断链 / 误删引用即非零退出）是硬门禁，不属本组。

```bash
node tools/check-adr-index.mjs          # ADR 索引 ↔ 正文双向一致（编号 / 标题 / Status / 互指修订）
node tools/check-e2e-literals.mjs       # e2e 裸 px 字面量扫描 + 计数基线
node tools/check-e2e-viewport-tags.mjs  # 自钉视口的 e2e 用例必须声明 @viewport-pinned
node tools/check-doc-drift.mjs          # living docs 提到的类名 / 路径 vs 代码现状
node tools/check-css-dup-selectors.mjs  # 同上下文同属性重叠的选择器（后写静默覆盖 / 重复实现）
node tools/doc-audit.mjs                # 文档结构化审核：体量红线 / 路由登记 / 概论禁词 / 版本号禁入与一致性 / ADR 否决项 / memory 分片
node tools/e2e-affected.mjs             # 按 git diff 推导受影响路由 → 用例（可 --run 直接执行）
```

- **退出码**：`0` = 报告完成（含无 `--strict` 时的命中）；`1` = 漂移检查器带 `--strict` 且有命中。
- `doc-audit.mjs`：八条可断言检查——① 体量红线（估 token >5 万必须「总索引+分片」）② `docs/agents/*` 必须在 AGENTS.md 路由表登记 ③ living docs 禁 AI 汇报腔（「当然，这是 / 以下是为 / 本文将介绍」）④ 禁会过期的断言（「已修复 / 已全部完成」）⑤ **版本号禁入叙述性文档**（README / AGENTS / `docs/agents/` 只写选型名），外加 `tech-stack.md` 的 `<!--ver:包名-->` 标记与 `package.json` / `requirements.txt` / CI 工作流 / spine constants **逐字比对** ⑥ ADR 必须有**结构化**的「替代方案 / 否决」落点（标题或加粗字段；只有行文暗示则报「疑似缺失待复核」）⑦ memory 分片与月文件总索引同步 ⑧ `DATA_CATALOG.md` 引用的分片存在。**运行时打印覆盖面与豁免数**（哪些文档受写法规则管辖、哪些是历史档案豁免），避免「命中 0」被误读为全覆盖。判据出处：conventions.md「文档体量 / 文档写法」+ AGENTS.md 强制规则。受管范围与跳过名单的唯一来源是 `tools/doc-scope.mjs`（本文件与 `check-doc-links.mjs` 共用，禁止再各写一份）。
- `check-e2e-literals.mjs`：`--baseline <json>` 改计数基线；基线文件缺失时以「当前计数」为基线并提示生成，不报失败。行内豁免 `// e2e-literal-ok: 理由`（不可漂移的契约值，如侧栏避让 / 断点）。
- `check-e2e-viewport-tags.mjs`：`--strict` 时「用例体调用 `page.setViewportSize` 但签名未声明 `@viewport-pinned`」即退出 1。行内豁免 `// e2e-viewport-ok: 理由`（缺理由不豁免）。**不是风格洁癖**：漏标会让 `mobile-chromium` 用 Pixel 7 的触摸仿真重跑一条本已钉死视口的桌面契约，实测把 CI 拖成 30s 超时 × 3 次重试（见 docs/memory/2026-10）。
- `check-doc-drift.mjs`：**只扫 living docs**（`docs/agents/` 与 `CONTEXT.md`）；`docs/memory/` 是历史档案，必须排除，否则全是假阳性。
- `check-css-dup-selectors.mjs`：判据 = **同一条选择器在同一个 at-rule 上下文里重复声明了同一个属性**（属性不重叠的分组写法不算）。A 段（同文件）必为静默覆盖；B 段（跨文件）由加载序决定生效者，计为 conflict；两侧都是 `<style scoped>` 的 SFC 降级为 C 段（运行时不冲突，只是重复实现）。**命中不都是缺陷**：刻意的变体覆盖（`focus-visible` 收掉投影、断点补偿）也会命中，需人工判读——它只负责把「谁会静默吃掉谁」摆到台面上。
- `e2e-affected.mjs`：`--base <ref>` 改 diff 基线，`--run` 直接执行推出的命令；命中全局文件（tokens / 全局 css / App 外壳 / 路由 / 入口）判「影响全部页面」，**推导不出受影响用例时打印「跑 guards 层 + 全量 layout」而不是静默输出空命令**。

## 文档体量维护

对应「文档体量红线」（[conventions.md](conventions.md)）。

- **`docs/memory/`＝按域组织的避坑手册**（不是按月日志）：9 份域文件 + [README 索引](../memory/README.md)，新增条目直接写进对应域，**禁止新建按月/按日文件**（时序编号对检索无意义）。
- **`DATA_CATALOG` 侧**由 `gen_catalog.py` 源头控制分片（脚本内 `SHARDS` 表 + KB 级总索引），不走人工流程。
- `tools/tidy-memory.mjs` 只服务**旧的按月日志格式**（`strip` 删验证数字 + `split` 按时序分片）；当前 `docs/memory/` 已按域重组，**该工具对本目录已无用途**，保留仅为处理历史文件。它的 `split` 输入必须是含正文小节的日志源——对已生成的总索引再跑一次会丢章节锚点（已加幂等守卫拒绝）。

## 临时工作区 `temp/`（不入库 · 不引用）

`temp/` 在 `.gitignore` 内（第 68 行），是**探针脚本 / 截图 / 原始日志**的临时落点：既不入库，也随时可整目录清空。

- **AI 检索不会命中它**：内容检索走 ripgrep，默认遵循 `.gitignore` ⇒ `temp/` 天然不在检索面内（已实测确认）。所以临时文件**不会**污染 AI 的检索结果，不需要为「怕干扰检索」而刻意回避使用它。
- **但文档不得把 `temp/` 当引用目标**。一条 `脚本见 temp/xxx.py` 就是**永久死指针**——该路径从未入库（历史提交为 0），清空后读者既找不到也无法从 git 恢复。脚本值得复用 → 放 `tools/`（入库）；一次性探针 → 写明「一次性探针，未入库」。此规则由 `doc-audit.mjs` 检查⑨ 强制。
- **纪律**：探针用完即删（同一会话内），不要在此囤放需要长期保留的东西——需要留就走 git。

## 研究线（Spine Lab 调试台）

- dev server 内 `http://localhost:6188/debug`（侧栏「调试台」入口 ≥768px 显示，手机隐藏）；生产构建不含该路由、深链落 404（机制见 [architecture.md](architecture.md)）
- 调试台测试并入主 `pnpm test`
- 研究文档在 `docs/spine/`，研究脚本在 `spine-lab/tools/`（脚本非应用资产，不进 CI / 部署）

## 数据转换工具（Python）

需 `vendor/TurnBasedGameData` 本地目录（已 gitignore，克隆命令见 `.gitignore` 注释）。

```bash
cd tools/converter
pip install -r requirements.txt
python convert.py                        # 全量转换（增量跳过未变更）
python convert.py --only characters      # 仅重跑指定模块
python convert.py --force --pretty       # 强制全量 + 缩进输出
python -m pytest tests/ -v               # converter 单元测试
```

数据探索工具（`query.py` / `gen_catalog.py`）用法见 [data-pipeline.md](data-pipeline.md)。

## 部署与门禁

推送 `main` 分支 → Vercel 自动构建部署（SPA 路由重写见 `vercel.json`）；回滚 = Vercel Dashboard → Deployments → 选中上一个构建 Rollback。

门禁语义（**软门禁**）：

- main 分支 protection 仅保留防 force push 与防删除（required status checks / enforce_admins / PR 强制均已移除）——push main 直接通过。
- 推送后 CI 自动运行 `unit-tests`（`pnpm test`）+ `e2e`（`pnpm test:e2e:ci` = layout + a11y，减去 `@font-calibrated`），失败由 GitHub 通知；CI **不跑** `pnpm build`。
- Vercel 生产构建（`pnpm build`，含 vue-tsc 与三守卫）是上线前最后一道守卫：构建失败不部署，可一键回滚。
- 本地推送前先跑 `pnpm build` + `pnpm test` 自检——CI 红不会拦 push，但会留失败记录。
