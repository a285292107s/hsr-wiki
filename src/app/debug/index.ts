/**
 * 研究线调试台出口（spine-lab 迁入主站）：
 * dev 门控不使用跨模块常量——生产构建摇树依赖 router/index.ts 与 SidebarNav.vue
 * 各自**本文件内** `import.meta.env.DEV`（vite 常量替换在模块内生效；跨模块布尔 +
 * dynamic import 无法消除 chunk，实测见 router/index.ts DEV 分支注释）。
 * 本文件仅提供路由路径单一事实源（router 注册与侧栏「调试台」入口共用）。
 */
export const DEBUG_PATH = '/debug';
