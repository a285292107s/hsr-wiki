# 隐藏宿主 + 分段检测降级

脚本在 document-start 阶段即隐藏宿主全部内容（零闪烁体验），代价是引入白屏风险——因此配套分段检测机制（vue-loaded → app-mounted → data-ready），任一段超时 8s 即触发降级：销毁 Shadow Root、恢复宿主可见性。降级路径为纯 vanilla 代码（platform/failsafe.ts），不依赖 Vue 生态的任何模块。

**Considered Options**:
- 渐进覆盖（不隐藏宿主，应用就绪后淡入）：天然免降级，但首屏会闪烁宿主 UI 再切换，体验割裂；且宿主 Tailwind preflight 会在闪烁期间与我们的样式互相干扰。
- 简单超时兜底（现有方案）：可行但无法定位失败环节；分段检测仅多 ~20 行代码，换来精确的故障可观测性。

**Consequences**:
降级恢复后宿主侧边栏/内容原样呈现（我们从未破坏宿主 DOM，只是隐藏）。Vue 从 CDN 外部加载是该链路中唯一的网络脆弱点——多 CDN 兜底列表是必要的。
