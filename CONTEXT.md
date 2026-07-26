# HSR Wiki

独立部署于 GitHub Pages 的崩坏：星穹铁道游戏数据 Wiki——Gaming HUD 风格沉浸式浏览体验。

## Language

### 运行环境

**GitHub Pages**:
项目的唯一部署目标。纯静态托管，无服务端能力。站点地址：https://<user>.github.io/hsr_wiki/

**Hash 路由**:
使用 Vue Router 的 createWebHashHistory，URL 形如 /#/character/1001。
选择理由：GitHub Pages 无服务端 rewrite，hash 路由刷新不 404。
_Avoid_: history 模式（第二期自定义域名后再考虑）

**CDN 数据源**:
所有游戏数据运行时从 https://static.nanoka.cc 实时拉取（CORS 已开放）。
第二期计划迁移至 https://github.com/theBowja/starrail-data。
_Avoid_: 本地数据、构建时数据

### 游戏数据

**强化模式（Enhancement）**:
部分角色拥有的加强版本数据视图（技能/星魂被替换为强化版）。切换强化模式时，UI 以内联 diff 标注与原始数据的差异。
_Avoid_: 增强模式、改版

**目录（Catalog）**:
由通用目录引擎驱动的物品索引页。共六种：角色、光锥、遗器、物品、敌对物种、终局内容。目录 = 列表 + 筛选 + 排序，不含详情页。
_Avoid_: 列表页、索引页

**Manifest**:
CDN 上的版本清单文件，记录当前数据版本号及各数据文件的路径。是所有数据加载的起点，TTL 10 分钟。
_Avoid_: 索引文件、版本文件

### 视觉

**Gaming HUD**:
当前的设计语言：深空暗色底（#0F0F23）、紫色主调（#7C3AED）、Orbitron HUD 字体、玻璃拟态面板、方向感知页面过渡。第二期在此风格上精修，不换方向。
_Avoid_: 科幻风、赛博风
