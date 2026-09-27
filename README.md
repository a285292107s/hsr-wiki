# HSR Wiki · 崩坏：星穹铁道

独立部署于 **Vercel** 的《崩坏：星穹铁道》数据展示型 Wiki（Vue 3 + TypeScript + Vite + Pinia）。全部目录与详情数据由 `tools/converter/` 从官方解包数据离线转换为本地 JSON 随站分发；图片与 Spine 动画在运行期经 `src/services/cdn/` 解析并回退。

- **在线 Demo**：`https://hsr-wiki.vercel.app/`

## 功能特性

- **角色详情**：技能表（等级数值 / 附加能力）、行迹、星魂、晋阶属性、推荐装备，支持「砺烁新辉」强化形态切换

- **Spine 角色动画**：详情页 Hero 渲染骨骼动画，官网源清单优先、nanoka 清单回退（双清单随站部署）

- **终局内容**：忘却之庭 / 虚构叙事 / 末日幻影 / 异相仲裁，单目录页按模式筛选 + 赛季详情页

- **双模式主题**：常规模式（黑底 + 可切换强调色，缺省赤陶）× 货币战争模式（`/currency/*` 独立路由树，缺省香槟金）

- **虚拟滚动目录**：目录卡片以模板字符串渲染，长列表虚拟滚动

- **响应式**：桌面 / 平板 / 手机三档；手机端底部导航；首页 Hero 按断点切换官网 KV Spine 场景与立绘轮播

## 页面地图

- **常规模式**（枢纽页 `/`）：角色 / 光锥 / 遗器 / 物品 / 成就 / 敌对物种 / 终局内容
- **货币战争模式**（枢纽页 `/currency`）：角色图鉴 / 装备图鉴 / 投资环境 / 投资策略 / 羁绊图鉴
- **调试台**（研究线，dev-only `/debug`）：Spine 清单审核与 KV 场景验收；生产构建不含

分层结构、研究线机制与「新增目录」端到端流程见 [docs/agents/architecture.md](docs/agents/architecture.md)；UI 与色彩规则见 [docs/agents/ui-design.md](docs/agents/ui-design.md)。

## 快速开始

环境要求：Node 22+；包管理器使用 `packageManager` 字段锁定的 pnpm 11。

```bash
pnpm install        # 安装依赖
pnpm dev            # 本地开发 → http://localhost:6188/（固定端口 strictPort）
pnpm build          # 构建守卫（色彩 / Spine 清单 / 对比度）→ vue-tsc -b → vite build
pnpm preview        # 预览构建产物
pnpm test           # Vitest 全量
pnpm test:e2e:ci    # e2e CI 层（layout + a11y）
```

命令全量手册（e2e 分层与像素基线、研究线 `/debug`、converter、dev 缓存自愈、部署与门禁）见 [docs/agents/commands.md](docs/agents/commands.md)。

## 技术栈

| 分类 | 选型 |
| --- | --- |
| 框架 | Vue 3（`<script setup>` SFC） |
| 构建 | Vite |
| 语言 | TypeScript |
| 状态 | Pinia |
| 路由 | Vue Router（`createWebHistory`） |
| 测试 | Vitest + happy-dom（前端）/ Playwright（e2e）/ pytest（转换工具） |
| 数据转换 | Python（`tools/converter/`） |
| 包管理 | pnpm 11（`packageManager`），Node 22+ |

## 数据

目录与详情页正常开发**不需要**上游源数据：转换产物已提交在 `public/data/cn/`（随站部署）。仅重跑转换时需要把上游解包数据克隆到 `vendor/TurnBasedGameData/`（该目录已 gitignore，**非 git 子模块**，克隆命令见 `.gitignore` 注释）。

```bash
cd tools/converter
pip install -r requirements.txt
python convert.py --only characters   # 仅重跑指定模块；全量转换去掉 --only
```

- 本地数据是全部展示文本与数值的**唯一来源**：禁止在代码中写死数据、禁止引入外部样本作为数据源

- 数据探索必须走 `query.py` / `DATA_CATALOG.md`，**禁止直接读取** GB 级原始文件

管线细节、模块划分与探索工具用法见 [docs/agents/data-pipeline.md](docs/agents/data-pipeline.md)。

## 文档导航

- [AGENTS.md](AGENTS.md)：工程规则总览（硬约束、验证流程、任务交付流程）与「任务 → 必读」索引

- [CONTEXT.md](CONTEXT.md)：项目术语表

- [docs/agents/](docs/agents/)：按主题拆分的 AI 协作指南（architecture / data-pipeline / testing / commands / ui-design / verification / conventions）

- [docs/adr/](docs/adr/)：不可逆 / 跨模块架构决策

- [docs/audit/](docs/audit/)：字段价值审计与裁决

- [docs/memory/](docs/memory/)：复盘日志与坑位记录

- [docs/spine/](docs/spine/)：Spine 机制研究文档（抓取与审计脚本在 `spine-lab/tools/`，非应用资产、不进 CI）

- [docs/data/](docs/data/)：数据源总结与字段探索记录

## 部署

推送 `main` 后 Vercel 自动构建部署。`vercel.json` 承载 SPA 路由重写与缓存头（`/data/*` 短缓存、`/assets/*` 长期不可变缓存）；`vite.config.ts` 中 `base` 为 `/`，部署于域名根路径。构建失败不部署、可在 Vercel Dashboard 回滚；CI 与门禁语义见 [docs/agents/commands.md](docs/agents/commands.md)。

## License 与版权

- **代码**：本项目代码以 MIT 许可证发布（详见 `LICENSE`）

- **数据来源**：本地数据由社区解包仓库 [`DimbreathBot/TurnBasedGameData`](https://github.com/DimbreathBot/TurnBasedGameData) 经 `tools/converter/` 转换产出，格式参考 [`Mar-7th/StarRailRes`](https://github.com/Mar-7th/StarRailRes)；部分图片与 Spine 动画资源来自 [`hsr.nanoka.cc`](https://hsr.nanoka.cc) 与米哈游官网活动资源

- **版权**：《崩坏：星穹铁道》游戏内容（角色、美术、文本、音视频等）版权归 **米哈游 / HoYoverse** 所有

- **用途**：本项目为非商业用途的数据展示与学习项目，与米哈游无任何关联或背书；如涉侵权请联系移除
