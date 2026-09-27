# 官网 Spine 动画增量接入（nanoka 之外的第二源）

**Status**: Accepted（决策成立，范围已从「试点三角色」扩为官网源常态接入：official 清单 19 条条目，nanoka 清单 66 条）

将官网（act-webstatic.mihoyo.com）角色 Spine 动画增量接入 nanoka 动画体系：新增官网源支持（JSON 骨架 + 纹理重映射），manifest 本地化，并按条目分派运行时。与 ADR-0002 无冲突——两者是同一链条：0002 决定「只自主渲染」，本 ADR 决定「在自主渲染之上增加官网源」。

**Considered Options**:
- 整体替换 nanoka 源为官网源：不可行——官网仅当期版本展示角色有动画（老角色在官网无资源），且老版本资源无长期保留 SLA。
- 纹理映射方案：前端运行时重映射（采纳）——atlas 原样加载（page 名为逻辑纹理名，无冒号可被解析器正常识别），通过 spine-player 官方 `rawDataURIs` 配置把「atlas 目录 + 逻辑纹理名」映射到实际 hash URL。曾尝试 fetch atlas → 改写为绝对 URL → Blob URL（弃：Spine 4.2 atlas 解析器将含冒号的行当属性行，绝对 URL 被吞掉导致解析错乱）；本地转存改写（弃：违背「直接用官网 CDN」且维护成本高）；BFF 代理改写（弃：Vercel Serverless 冷启动慢、多一跳）。
- manifest 策略：本地单文件（采纳）——`public/data/cn/spine-manifest-{nanoka,official}.json` 随站部署，结构化区分 `skel`（nanoka 二进制）与 `official`（官网），为按源分派运行时铺路；双 manifest 分层（弃：结构分裂、后期需二次改造）。
- 回退策略：静默降级（采纳）——加载失败按钮灰掉显示「暂无动画展示」，与 nanoka 失败体验统一，console.warn 留痕，不自动重试。
- 双通道快路径：随本次清理删除（采纳 ADR-0002 意图）——独立站无宿主 canvas 可抢，快路径为死代码且空转 2s 宽限期延迟动画出现。

**Consequences**:
- 运行时为双版本并存（`4.2.43` 官网 JSON/场景 + `4.1.23` nanoka `.skel`），条目可选 `runtime` 标记分派，收口于 `src/services/api/spine.ts`；运行时常量与本地/兜底源清单见 `src/spine/constants.ts`。**禁止按版本串直觉推断兼容性**：4.0 系导出的骨架 JSON 在 4.2 运行线下会静默丢弃骨骼 `transform` 继承字段导致姿态错误（判定与处置见 docs/memory/2026-09.md）。
- 官网纹理 URL 必须使用原始 png（去掉 `?x-oss-process=image/format,webp/quality,Q_90` 参数）：带参数时 Image 加载卡死、success 永不触发（浏览器实测）。
- 官网 atlas 的 page 名不可替换为含冒号的绝对 URL（Spine 4.2 atlas 解析器会把含冒号的行当属性行消费）。
- spine-player 的加载依赖 rAF 循环驱动：标签页不可见（`visibilityState=hidden`）时 rAF 冻结导致 success 不触发——属浏览器节流行为，非代码缺陷。
- 官网资源无 SLA：版本更新后旧资源可能被清理，失效时静默降级；CORS 依赖官网 Origin 反射策略（已实测 `Access-Control-Allow-Origin` 随请求反射）。
- 官网 atlas 无 `pma` 字段，沿用 `premultipliedAlpha: false` 与抗锯齿修复（mipmaps + magFilter LINEAR）逻辑。
- 官网 json 骨架与 atlas 由 spine-player 内部下载器加载（第三方库内部实现，不受项目「禁止裸 fetch」规则约束）；spine manifest 本地读取走 `src/services/cache.ts`。
