# 验证流程 — 职责边界、取证手段与执行纪律

> AGENTS.md 的按主题子文件（主文件「任务 → 必读」路由表经相对链接引用）。**分级表（T0-T3）、各级别验证内容与预算在主文件「验证流程」节**——改分级/预算改主文件；本文件是职责边界、取证金字塔与全部执行纪律的唯一事实源。

## 职责边界（AI 验证基线）

AI 侧验证基线 = **代码与规格工作流**（静态审查 / 可断言规格 / DOM 与计算样式取证）：**禁止以截图或「肉眼确认」类结论作为验证证据**；视觉表现（审美 / 观感 / 像素细节）确认由用户亲自 RunPreview 处理，AI 不判定审美达标。

由此派生的汇报纪律：涉及视觉表现的改动，收尾汇报必须显式列出「视觉待用户确认」项；AI 侧只交付规格证据（计算样式 / 尺寸 / 断点 / 溢出断言），**不输出「看起来正常 / 美观」类结论**；用户确认后的审美修正按「任务交付流程」返工流程处理。

## 分级收敛

改动前先定**可断言的验收标准 + 终止条件**（如「icon 160px、无边框、无溢出」而非「布局正常」），按级别验证，达标即停。

**验证成本与风险敞口成正比**：能静态审查确认的（字面量数值、简单算术、断点区间、选择器覆盖范围）不启动浏览器；CSS 语法错误由 dev server 编译即时暴露。

## 取证金字塔（L1-L4，能力递增、成本递增，取够即停）

| 级别 | 手段 | 固化位置 |
|---|---|---|
| L1 静态结构 | `--dump-dom`、骨架/清单解析（无需渲染） | CDP 兜底命令；`src/app/debug/spine-audit.ts` 的骨架解析与元数据提取 |
| L2 渲染态断言 | `toHaveCSS` / `toHaveText` / `toHaveCount` | `e2e/layout.spec.ts` |
| L3 横向溢出检测 | 全树扫描右边界超出视口/产生横向滚动条的元素 | `e2e/helpers.ts → findHorizontalOverflow` |
| L4 像素基线 | `toHaveScreenshot`（本机刷新基线，CI 不跑） | `e2e/visual.spec.ts` |

## 执行纪律（超预算即降级）

- **降级必须记录**：任何「超预算降级」「跳过某级验证」「豁免项」必须在交付记录 / 回复中写明（原级别、降级原因）；**禁止静默降级**——未记录视为漏测，并作为「任务交付流程」第 5 条的沉淀信号。
- **验证耗时控制**：`visual.spec` 全量禁止——只跑改动实际影响的用例（`--grep 首页` 等），与改动无关的 character / endgame / currency 用例直接跳过；同一会话内全量 e2e 最多执行一次；T1a/T1b 纯 CSS 改动用守卫 + 单探针计算样式断言 + `layout.spec` 即可，不跑像素基线。
- **环境问题先排除**：headless 内 CDN / 网络加载失败先判定环境性（`curl` 验证 URL 可达），不当代码缺陷深究（限流窗口特征见 [architecture.md](architecture.md)）。
- **dev 缓存陈旧先自愈**：dev 下怀疑「改了不生效」时禁止直接重启分析——先 `curl` 对比 dev 响应与磁盘特征串定位，再 `node tools/refresh-vite-cache.mjs` 自愈（症状、用法与根因见 [commands.md](commands.md)）。
- **条件等待与清理**：用 `page.waitForFunction` / `expect.poll` 精确条件，**禁止固定 sleep 与长轮询**；不等待与断言目标无关的就绪状态（如只查 padding 就不等 spine 渲染）；验证确认后单独 `Remove-Item` 清理临时文件。
- **PowerShell 编码**：pwsh 7 `[Console]::OutputEncoding` 默认 gb2312，解码外部程序（node）的 UTF-8 stdout 会乱码；管道外部输出前前缀 `[Console]::OutputEncoding = [Text.UTF8Encoding]::new()`；读文件显式 `-Encoding UTF8`。
- **CDP / headless 取证（兜底，仅 Playwright 覆盖不到时启用）**：首选 Chrome（`--disable-extensions` + 独立 `--user-data-dir`，启动后验 `/json` 隔离，出现未知标签页立即 kill）；探针脚本单 evaluate 一次成型、总超时 30s，含正则 / 引号 / `$` 的脚本一律 Write 成 `.mjs`/`.ps1` 执行、禁止内联（PowerShell 转义 + Bash 预展开 `$var` 陷阱）；结果用 node `writeFileSync` 落盘、**禁止 shell 重定向 `>`**（中文 Windows PowerShell 损坏 UTF-8）；evaluate 无响应 15s 内 kill 重启一次，仍失败降级 `--dump-dom`（L1），禁止在卡死页面上重试。
