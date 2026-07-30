# ADR-0004: 寄生油猴 → GitHub Pages 独立站

## 状态

已接受（部分过时）

> 数据源决策（决策第 5 条"第二期迁移 starrail-data"）已过时：实际改为 ADR-0005/0006 确立的 TurnBasedGameData 本地转换方案，图片仍走 nanoka CDN。其余决策（GitHub Pages 独立站、hash 路由、移除 Shadow DOM/宿主同步）仍然有效。

## 背景
项目原为寄生于 hsr.nanoka.cc 的油猴脚本，通过 Shadow DOM 隔离、隐藏宿主、
分段降级等机制运行。此架构带来大量复杂度（host-sync 路由、failsafe、platform 抽象层），
且限制了项目的可分享性和可访问性。

## 决策
- 转为 GitHub Pages 独立网站（仓库 hsr_wiki）
- 移除 Shadow DOM、platform 层、宿主同步、降级机制
- 路由改为 hash 模式
- 数据源第一期保持 nanoka CDN（CORS 开放），第二期迁移 starrail-data
- 保留 Spine 动画、Gaming HUD 视觉风格

## 后果
- 大幅简化架构（删除 ~500 行平台/宿主相关代码）
- 失去"寄生于原站"的无缝体验
- 需要自行处理路由、部署、数据更新
- URL 带 # 前缀（第二期自定义域名后可切换 history 模式）
