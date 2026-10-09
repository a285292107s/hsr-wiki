# 复盘记忆（按域组织的避坑手册）

> **本目录记什么**：从当前代码、当前文档都**推不出来**，但**重做一次就必然再踩**的知识——静默失效、反常直觉、必须实测才知道的事实，以及判据背后的理由。按域组织，**不是按时间**。

## 与其它文档的分工（先判落位，别写错地方）

| 你手上的内容 | 该去哪 |
| --- | --- |
| 每个任务都要遵守的硬约束 | [AGENTS.md](../../AGENTS.md) 强制规则 |
| 某一域怎么做（规则、流程、清单） | [docs/agents/](../agents/) 对应子文件 |
| 不可逆决策（数据判据 / 路由 / 字段归属 / 令牌层级） | [docs/adr/](../adr/) |
| 字段审计裁决 | [docs/audit/](../audit/) |
| **踩过的坑、判据的理由、静默失效的形态** | **本目录** |
| 做了什么 / 实现落点 / 测试用例数 / 耗时 / 降级记录 | **commit message**（进 memory 即流水账） |

**三条准入判据**（缺一不可）：

1. 现在读代码或文档能推出来吗？能 → 不写（它属规则或 ADR）。
2. 不记的话，下次会在哪一步踩到？说不出具体步骤 → 不写（是流水账）。
3. 它是「事实」还是「判据」？**只有判据可复用**。

**验证数字不进本目录**——用例数 / 耗时 / 断言计数 / KB 数字都会过期，过期后毒化判断。它们属 commit message。

## 域索引

| 域 | 补的是哪份文档的盲区 | 覆盖主题 |
| --- | --- | --- |
| [spine.md](spine.md) | [docs/spine/](../spine/) | 运行时版本分派 · 黑块与画布 · rAF 冻结与动画取证 · Atlas 与纹理 · 抓取链 · 取景构图 · CDN 回退 |
| [data-pipeline.md](data-pipeline.md) | [data-pipeline.md](../agents/data-pipeline.md) | 增量转换与缓存 · 字段语义与判据 · 文本与描述渲染 · 数据探索环境 · 前端接线 |
| [data-semantics.md](data-semantics.md) | [docs/data/](../data/) + ADR 数据裁决 | 版本上新与赛季代际 · 目录卡字段 · 出没样本名与活动出处 · 精英组与合成链 · 连接键与身份 · 口径注记与降级态 · 命名裁决 |
| [ui-tokens.md](ui-tokens.md) | [ui-design.md](../agents/ui-design.md) | 静默失效 · 令牌收口与迁移 · 字阶与圆角刻度 · 几何与形态判据 · 排查路径 · 坐标系与断点 · 工具链坑位 |
| [testing.md](testing.md) | [testing.md](../agents/testing.md) + [verification.md](../agents/verification.md) | 静默失效 · 溢出与几何取证 · 竞态与等待 · vitest 环境 · 假结论防治 · 形态与契约判据 · 焦点与可达名 · 取证手法陷阱 · 提速并发 |
| [build-deploy.md](build-deploy.md) | [commands.md](../agents/commands.md) | dev server「改了不生效」 · 端口与实例 · 构建守卫与门禁 · Vercel 投递 · 增量与确定性 |
| [ai-visibility.md](ai-visibility.md) | [ai-discoverability.md](../agents/ai-discoverability.md) | 构建全绿但结果错 · 覆盖率与守卫盲区 · 快照正文保真 · 快照与就绪态类名耦合 · 投递模型 · 反 cloaking · crawler UA 与 robots · 无 JS 取证与死链 |
| [architecture.md](architecture.md) | [architecture.md](../agents/architecture.md) | 分层与目录归属 · 共享单例与 barrel · types 按域拆分 · 目录页配置驱动 · 跨文件重复实现 · 研究线 /debug · CSS 拆分纪律 |
| [docs-process.md](docs-process.md) | 本目录 + [conventions.md](../agents/conventions.md) | 渐进式披露与路由表 · ADR 门槛 · memory 写法 · 注释政策 · Agent Teams 并发与写入分工 · 交付流程与验证纪律 · 文档守卫 |

## 怎么用（给 AI）

- **按域读，不整读**：本目录 9 份域文件共约 150 KB / 550 条。改哪一域就读哪一份，一次通常只需 1 份（最大单份约 25 KB）。
- **动手前先扫一眼对应域**：判据与坑位的作用是**省掉一次返工**，不是事后阅读材料。
- **同一事实只在一处**：同一坑位若在两份里都出现即为漂移，删至一处（本目录已做过跨域去重，新增条目请先 grep 关键词确认没有第二处）。
- **可迁移的才进**：判据的三条准入见上；只描述「这次做了什么」的句子一律属 commit message。
- 外部事实类调研（如爬虫 UA 清单，**会过期**）不放本目录，见 [docs/audit/](../audit/)。

## 维护

- 新增条目直接写进对应域文件，**不要新建按月/按日的文件**；时序编号对检索无意义。
- 本目录原为按月/按日累积的复盘日志（2026-08 ~ 2026-10，约 750 KB / 173 节），已**按域压缩折叠**为上表 9 份；原时序文件已删除，其内容并入对应域（不再保留副本，避免两份真相）。
- **原始日志没丢，在 git 历史里**（删除前是 `2026-09.md` 183 KB / `2026-10.md` 535 KB 的单体版本）。要回查某一轮的完整上下文：
  `git log --oneline -- docs/memory/2026-10.md` 找到删除前的提交，再 `git show <commit>:docs/memory/2026-10.md`。
  折叠时已做过覆盖审计（源文件逐条对照域文件，含三个独立审计视角），故**不要把单体日志恢复回工作区**——那会重新形成两份真相。临时留存的副本（`temp/memory-backup/`）已删，它是冗余的：分片只是这些单体的一次机械切分。
