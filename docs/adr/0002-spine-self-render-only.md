# Spine 动画仅自主渲染，放弃宿主 Canvas 快路径

**Status**: Accepted（2026-09 复核成立；「运行时版本必须与 CDN .skel 严格匹配」条项已演进为双运行时，见下）

旧版双通道策略：优先抢走宿主已渲染的 WebGL canvas（零开销），2s 宽限期后才启动自主渲染。Vue 迁移时砍掉快路径，仅保留自主渲染。

**结论**：独立站无宿主 canvas 可抢，快路径无存在基础——Spine 一律由本站自建 player 渲染，不依赖宿主任何资源。

**Considered Options**（行文见上，此处结构化）：
- **宿主 canvas 快路径**（抢宿主已渲染的 WebGL canvas，零开销）：放弃——独立站无宿主 canvas 可抢；快路径为死代码，且其 2s 宽限期会延迟动画出现。
- **单运行时（合并 4.2 / 4.1）**：放弃——nanoka `.skel` 为自定义封装格式，4.2 运行时无法加载；必须双版本按清单条目分派。

**现状指针**：
- 引擎层 `src/spine/`（runtime / player / scene / types）；运行时版本常量 `src/spine/constants.ts`；运行时随站本地分发 `public/vendor/spine/`，CDN 仅兜底。
- 运行时为**双版本并存**：`4.2.43`（官网 JSON 骨架 / 场景）+ `4.1.23`（nanoka `.skel` 二进制）；按清单条目分派，禁止合并为单版本——nanoka skel 为自定义封装格式，4.2 运行时无法加载（探针取证见 docs/memory/2026-08.md）。
- 每个角色页独占一个 WebGL 上下文（宿主不再渲染 Spine，无上下文数量冲突）。
