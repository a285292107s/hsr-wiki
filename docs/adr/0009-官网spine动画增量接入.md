# 官网 Spine 动画增量接入（试点三角色）

## 状态

已接受

试点阶段将官网（act-webstatic.mihoyo.com）角色 Spine 动画增量接入现有 nanoka 动画体系：新增官网源支持（Spine 4.2.43 JSON 骨架 + 纹理重映射），manifest 本地化，运行时升级 4.1.23 → 4.2.43，并顺带清理遗留双通道快路径。试点角色为 1508 远坂凛 / 1509 吉尔伽美什 / 1510 姬子•启行（当前 CDN 无动画且官网当期有动画），验证可行后后期考虑全量切换官网数据。

**Considered Options**:
- 整体替换 nanoka 源为官网源：不可行——官网仅当期版本展示角色有动画（29 个无动画老角色在官网无资源），且老版本资源无长期保留 SLA。
- 纹理映射方案：前端运行时重映射（采纳）——atlas 原样加载（page 名为逻辑纹理名，无冒号可被解析器正常识别），通过 spine-player 官方 `rawDataURIs` 配置把「atlas 目录 + 逻辑纹理名」映射到实际 hash URL；纹理 URL 不带 OSS 处理参数（`?x-oss-process=...` 会导致 Image 加载卡死，仅原始 png 可用）。曾尝试 fetch atlas → 改写为绝对 URL → Blob URL 方案，但 Spine 4.2 atlas 解析器将含冒号的行当属性行，绝对 URL 会被吞掉导致解析错乱（弃）；本地转存改写（弃）——违背「直接用官网 CDN」意图且维护成本高；BFF 代理改写（弃）——Vercel Serverless 冷启动慢、多一跳。
- manifest 策略：本地单文件（采纳）——`public/data/cn/spine-manifest.json` 随站部署，复制 66 条存量 + 新增官网条目，结构化区分 `skel`（nanoka 二进制）与 `official`（官网）两类源，为全量切换铺路；双 manifest 分层（弃）——结构分裂、后期需二次改造。
- 回退策略：静默降级（采纳）——加载失败按钮灰掉显示「暂无动画展示」，与现有 nanoka 失败体验统一，console.warn 留痕，不自动重试。
- 双通道快路径：随本次清理删除（采纳 ADR 0002 意图）——独立站无宿主 canvas 可抢，快路径为死代码且空转 2s 宽限期延迟动画出现。

**Consequences**:
- 运行时升级为 spine-player 4.2.43：向后兼容 4.1 `.skel` 存量数据，需回归抽验现有角色动画无退化；新增 `jsonUrl` 加载路径（官网 JSON 骨架）与 `rawDataURIs` 纹理映射（官网源）。
- 官网纹理 URL 必须使用原始 png（去掉 `?x-oss-process=image/format,webp/quality,Q_90` 参数）：带参数时 Image 加载卡死、success 永不触发（浏览器实测）。
- 官网 atlas 的 page 名不可替换为含冒号的绝对 URL：Spine 4.2 atlas 解析器将含冒号的行当属性行消费，导致后续 region 被误判为 page。
- spine-player 4.2.43 的加载依赖 rAF 循环驱动（drawFrame 内检查 isLoadingComplete 后调用 loadSkeleton），标签页不可见（visibilityState=hidden）时 rAF 冻结会导致 success 不触发——属浏览器节流行为，非代码缺陷。
- 官网资源无 SLA：版本更新后旧资源可能被清理，失效时静默降级；CORS 依赖官网 Origin 反射策略（已实测 `Access-Control-Allow-Origin` 随请求反射）。
- 官网 atlas 无 `pma` 字段，沿用 `premultipliedAlpha: false` 与抗锯齿修复（mipmaps + magFilter LINEAR）逻辑。
- 官网角色动画构图（设计于首页轮播，scale 0.8~1.01）在 Hero 16:9 容器内可能需适配调整，为试点观察项。
- 官网 json 骨架与 atlas 由 spine-player 内部下载器加载（第三方库内部实现，不受项目「禁止裸 fetch」规则约束）；spine manifest 本地读取走 `services/cache.ts`。
