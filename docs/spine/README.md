# Spine 机制与抓取链（docs/spine）

> **定位：现行机制档案**。本目录写「官网 / 米游社怎么下发 Spine、我们怎么抓、渲染为什么黑」——机制分析、抓取流程与素材规范。规则型判据与静默失效形态在 memory，决策在 ADR。

## 与其它目录的分工（写之前先判落位）

| 你手上的内容 | 该去哪 |
| --- | --- |
| Spine 运行时、画布、取证、CDN 回退的**坑与判据** | [docs/memory/spine.md](../memory/spine.md) |
| 不可逆决策（增量接入 / 双层 CDN 兜底 / 图标回退） | [ADR 0009](../adr/0009-官网spine动画增量接入.md)、[0013](../adr/0013-cdn资源兜底架构.md)、[0024](../adr/0024-图标回退链与真缺失占位.md) |
| 研究线页面（`/debug`）与脚本落位 | `src/app/debug/`（页面）、`spine-lab/tools/`（离线脚本，非应用资产，不进 CI / 部署） |
| **机制分析 / 抓取流程 / 素材规范** | **本目录** |

## 文件清单

| 文件 | 用途 | 状态 |
| --- | --- | --- |
| [官网Spine动画播放机制分析.md](官网Spine动画播放机制分析.md) | 官网首页渲染机制逆向：单 WebGL 场景多骨架、单 rAF、spineList 与 renderOrder、取景与顶点预算 | **现行**（对象是官网发布快照，官网改版后需复核） |
| [官网Spine动画抓取流程.md](官网Spine动画抓取流程.md) | 官网角色 / 背景动画抓取：publish_key、两种下发形态、atlas 命名、双 manifest 与版本同步 | **现行**（条目以两份 manifest 为准） |
| [米游社技能动画抓取流程.md](米游社技能动画抓取流程.md) | 技能预览动画抓取：`spine-lab/tools/wiki-anim-scraper.mjs` → `public/data/cn/skill_animations.json` + 13 语言包 | **现行**（覆盖数字以脚本末尾覆盖报告为准） |
| [单层模式透明画布黑块成因与衬底方案.md](单层模式透明画布黑块成因与衬底方案.md) | 单层画布黑块根因（混合模式对透明 dst 退化）与衬底方案；合并渲染为验收基准 | **现行**（排查记录；生产渲染走合并渲染） |

## 读法

- **按需读单份**：动抓取链先读对应抓取流程，再读 [memory/spine.md](../memory/spine.md) 的坑位；只查黑块读第四份。
- 文中脚本 / 文件路径已核（`spine-lab/tools/wiki-anim-scraper.mjs`、`tools/check-spine-manifest.mjs`、`src/app/character/spine.ts`、`src/app/debug/SpineKvSection.vue`、两份 manifest）；失效路径改指现行落点，不要留死指针。
- 条目数与覆盖数字不写进文档：以两份 manifest、脚本覆盖报告与守卫输出为准。
