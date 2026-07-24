# Spine 动画仅自主渲染，放弃宿主 Canvas 快路径

旧版采用双通道策略：优先抢走宿主已渲染的 WebGL canvas（零开销），2s 宽限期后才启动自主渲染。Vue 迁移时砍掉快路径，仅保留自主渲染（从 CDN 加载 spine-player 4.1.23 运行时 + .skel/.atlas 资源）。

**Considered Options**:
- 保留双通道：性能最优（复用宿主渲染成果），但违背「不依赖宿主资源」的核心架构原则；需要 MutationObserver + 轮询 + 竞态防护 ~90 行复杂逻辑；宿主改版 canvas 选择器即失效，是不可控的隐患；跨树 appendChild 移动 canvas 属于 hack。
- 仅自主渲染（采纳）：运行时 ~500KB 仅首次加载（单例 + HTTP 缓存），实际体验差异 <1s；代码量减半，在 Vue 中收敛为干净的 composable（onMounted 初始化 / onUnmounted 释放）。

**Consequences**:
每个角色页独占一个 WebGL 上下文（宿主不再渲染 Spine，无上下文数量冲突）。spine-player 版本必须与 CDN .skel 格式严格匹配（当前 4.1.x），升级需同步验证。
