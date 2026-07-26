# ADR-0004: 寄生油猴 → GitHub Pages 独立站

## 状态
已接受

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
