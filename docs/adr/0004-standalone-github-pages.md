# ADR-0004: 寄生油猴 → 独立站

**Status**: Accepted（架构结论成立；「GitHub Pages 部署 + hash 路由」条款已被现况取代，见「已失效条款」）

## 背景

项目原为寄生于 hsr.nanoka.cc 的油猴脚本，通过 Shadow DOM 隔离、隐藏宿主、分段降级等机制运行，带来大量复杂度（host-sync 路由、failsafe、platform 抽象层），且限制可分享性与可访问性。

## 决策（保留的历史结论，仍成立）

- 转为独立网站，彻底脱离宿主页面。
- 移除 Shadow DOM、platform 层、宿主同步、降级机制（架构简化约 500 行）。
- 保留 Spine 动画与 Gaming HUD 视觉风格。

## 已失效条款（禁止再依据）

- **GitHub Pages 部署 / 仓库子路径 `hsr_wiki` / URL 带 `#` 前缀的 hash 路由**：现为 Vercel 静态托管（`vercel.json` SPA fallback + Vite `base: '/'` + `createWebHistory()`，见 `src/app/router/index.ts`）。迁移记录见 commit「chore: migrate deployment from GitHub Pages to Vercel」。
- **数据源第一期 nanoka CDN、第二期迁移 starrail-data**：现为 TurnBasedGameData 本地离线转换（ADR-0005/0006）。

## Considered Options

- **继续寄生宿主（油猴脚本 + Shadow DOM 隔离）**：放弃——host-sync 路由、failsafe、platform 抽象层带来大量复杂度（架构简化约 500 行），且限制可分享性与可访问性。
- **GitHub Pages + hash 路由**（当时的部署方案）：已被 Vercel + History 路由取代——hash 路由对可分享性与 SEO 不利，子路径还需 `base` 与资源前缀双重维护。

## 后果（当时）

失去「寄生于原站」的无缝体验；需自行处理路由、部署、数据更新。
