# 迁移执行计划：油猴寄生应用 → GitHub Pages 独立站

> **面向 AI 执行者的技术文档**。按顺序执行，每步完成后验证再进入下一步。

## 0. 背景与决策摘要

本项目原为寄生于 hsr.nanoka.cc 的油猴脚本（Shadow DOM 隔离 + 宿主隐藏 + 分段降级）。
现决定转为 **GitHub Pages 独立网站**，技术栈不变（Vue 3 + TypeScript + Vite + Pinia + Vue Router）。

| 决策项 | 结论 |
|---|---|
| 部署目标 | GitHub Pages，仓库 `hsr_wiki`，URL `https://<user>.github.io/hsr_wiki/` |
| 数据源 | 第一期保持 `https://static.nanoka.cc`（CORS 已验证 `access-control-allow-origin: *`） |
| 路由 | Hash 模式 `createWebHashHistory` |
| Shadow DOM | 彻底移除，改为 Light DOM 标准挂载 |
| DOM 抓取 | 彻底移除，目录页 100% 走 CDN fetchData |
| Spine 动画 | 保留（资源仍从 nanoka CDN 加载） |
| 部署触发 | push to main 自动部署（GitHub Actions） |
| 重构方式 | 当前 repo 破坏性重构（已有备份） |

---

## 1. 删除文件/目录

以下文件/目录**直接删除**，无需保留：

```
src/platform/                          # 整个目录（index.ts, types.ts, userscript.ts, standalone.ts, failsafe.ts）
src/main.ts                            # 油猴入口
src/app/router/host-history.ts         # SvelteKit 宿主路由同步
src/lib/route-gate.ts                  # 路由门控（是否接管宿主）
src/app/catalog/scrape.ts              # 宿主 DOM 抓取工具
要迁移的代码/                           # 旧脚本源码参考
dist-standalone/                       # 旧构建产物
docs/adr/0001-hidden-host-staged-degradation.md  # 废弃 ADR
src/App.vue                            # 根级旧模板（实际应用入口是 src/app/App.vue）
src/components/HelloWorld.vue          # Vite 脚手架残留
src/assets/                            # vite.svg, vue.svg 脚手架残留
src/style.css                          # 脚手架残留
```

---

## 2. 重写 `vite.config.ts`

删除 vite-plugin-monkey 及双模式逻辑，替换为：

```ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  base: '/hsr_wiki/',
});
```

---

## 3. 重写 `package.json`

```json
{
  "name": "hsr-wiki",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "pinia": "^4.0.2",
    "vue": "^3.5.34",
    "vue-router": "^4.6.4"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^6.0.6",
    "happy-dom": "^20.11.1",
    "typescript": "^6.0.3",
    "vite": "^8.0.11",
    "vitest": "^4.1.10",
    "vue-tsc": "^3.2.8"
  }
}
```

变更：删除 `vite-plugin-monkey`；scripts 去掉 `dev:monkey` 和 `build:standalone`，`dev` 不再需要 `--mode standalone`。

---

## 4. 重写 `index.html`

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>HSR Wiki · 崩坏：星穹铁道</title>
    <style>html, body { margin: 0; background: #0F0F23; }</style>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

---

## 5. 新建 `src/main.ts`（唯一入口）

原 `src/main.standalone.ts` 删除，新建 `src/main.ts`：

```ts
import { bootstrap } from './app/bootstrap';

bootstrap().catch((e: unknown) => {
  console.error('[hsr-wiki] bootstrap failed:', e);
});
```

---

## 6. 重写 `src/app/bootstrap.ts`

去掉 platform 依赖，直接挂载：

```ts
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { createNkRouter } from './router';
import '../styles/tokens.css';
import '../styles/character.css';
import '../styles/catalog.css';

export async function bootstrap(): Promise<void> {
  const app = createApp(App);
  const router = createNkRouter();
  app.use(createPinia());
  app.use(router);
  app.mount('#app');
  await router.isReady();
}
```

注意：CSS 改为标准 import（Vite 自动处理），不再拼接字符串注入 Shadow Root。

---

## 7. 重写 `src/app/router/index.ts`

将 `createHostSyncHistory(detectBase())` 替换为 `createWebHashHistory()`：

```ts
import { createRouter, createWebHashHistory, type RouteRecordRaw, type Router } from 'vue-router';
import { ref } from 'vue';

export const navDir = ref<1 | -1 | 0>(0);

const routes: RouteRecordRaw[] = [
  // ... 路由表保持不变（home, character, catalog-*, achievement, catchAll）
];

export function createNkRouter(): Router {
  const router = createRouter({
    history: createWebHashHistory(),
    routes,
  });

  router.beforeEach((to, from) => {
    const dTo = typeof to.meta.depth === 'number' ? to.meta.depth : 0;
    const dFrom = typeof from.meta.depth === 'number' ? from.meta.depth : 0;
    navDir.value = dTo > dFrom ? 1 : dTo < dFrom ? -1 : 0;
    return true;
  });

  return router;
}
```

删除：`import { createHostSyncHistory, detectBase } from './host-history'` 及文件顶部关于宿主同步的注释。

---

## 8. 重写 `src/styles/index.ts`

此文件原职责是拼接 CSS 字符串 + 注册 @property。迁移后：

- CSS 已在 bootstrap.ts 中直接 import，此文件**仅保留 @property 注册**（或也删除，改为 CSS 内写 `@property`）。
- **推荐方案**：删除此文件，将 `@property` 规则直接写入 `tokens.css` 顶部（Light DOM 下 Chrome 正常解析 `@property`）。

在 `tokens.css` 顶部（`@import url(...)` 之后）添加：

```css
@property --spine-inner {
  syntax: '<percentage>';
  inherits: false;
  initial-value: 0%;
}
@property --spine-outer {
  syntax: '<percentage>';
  inherits: false;
  initial-value: 1%;
}
```

然后删除 `src/styles/index.ts`。

---

## 9. 修改 `src/styles/tokens.css`

### 9.1 `:host` → `:root`

```css
/* 第 11 行 */
:host {  →  :root {
```

### 9.2 `#nk-app` 容器规则

原规则（为覆盖宿主而设的 fixed 全屏层）：
```css
#nk-app { position: fixed; inset: 0; z-index: 9999; ... }
```

改为文档流容器：
```css
#app { position: relative; min-height: 100vh; font-family: var(--font-body); color: var(--text); background: var(--bg); -webkit-font-smoothing: antialiased; }
#app h1, #app h2, #app h3, #app p, #app dl, #app dt, #app dd { margin: 0; padding: 0; }
#app * { box-sizing: border-box; }
```

### 9.3 清理 `!important`

侧边栏 `.ui-sidebar` 规则中的 `!important` 全部删除（原用于覆盖宿主样式，独立站无宿主）。同时删除注释中对 Shadow DOM 的引用。

### 9.4 注释更新

文件顶部注释中删除：
- `:root → :host（Shadow Root 隔离）`
- `移除宿主 DOM 覆盖规则（新架构由 failsafe 离屏隐藏宿主）`
- 所有提及 Shadow DOM / 宿主 / failsafe 的描述

---

## 10. 修改 `src/app/catalog/CatalogPage.vue`

### 10.1 删除 platform 相关

- 删除 `import { platform } from '../../platform';`
- 删除 `import { scrapeCards, waitForCards } from './scrape';`

### 10.2 简化 `load()` 函数

原逻辑（约 L95-L126）有 dom/cdn 分支判断。改为**只保留 CDN 路径**：

```ts
async function load(): Promise<void> {
  const gen = ++loadGen;
  phase.value = 'loading';
  errorMsg.value = '';
  showSkeleton.value = false;
  if (skeletonTimer !== null) clearTimeout(skeletonTimer);
  skeletonTimer = setTimeout(() => { showSkeleton.value = true; }, SKELETON_DELAY);
  try {
    await app.initManifest();
  } catch { /* 版本为空 → fetchData 将报错 */ }
  try {
    if (!props.config.fetchData) throw new Error('配置缺少 fetchData');
    items.value = await props.config.fetchData({ version: app.version });
    if (gen !== loadGen) return;
    phase.value = 'ready';
    scrollerRef.value?.scrollTo({ top: 0 });
    props.config.prefetch?.({ version: app.version });
  } catch (e) {
    if (cancelled.value || gen !== loadGen) return;
    errorMsg.value = e instanceof Error ? e.message : String(e);
    phase.value = 'error';
    app.toast('error', `${props.config.title}: ${errorMsg.value}`);
  } finally {
    if (skeletonTimer !== null) { clearTimeout(skeletonTimer); skeletonTimer = null; }
    if (!cancelled.value && gen === loadGen) app.markDataReady();
  }
}
```

### 10.3 简化 `watch(() => props.config, ...)` 

删除 platform 判断，始终走软切换：

```ts
watch(() => props.config, (cfg) => {
  query.value = '';
  activeFilters.value = {};
  stop();
  if (cfg.fetchData) {
    void softSwitchTab();
  } else {
    void load();
  }
});
```

### 10.4 简化 `onContentClick`

删除油猴模式的 `location.href = href` 分支：

```ts
function onContentClick(e: MouseEvent): void {
  const a = (e.target as HTMLElement).closest('a[href]');
  if (!a) return;
  const href = a.getAttribute('href') || '';
  if (!href || href === '#') return;
  e.preventDefault();
  const m = href.match(/\/character\/(\d+)/);
  if (m) {
    void router.push(`/character/${m[1]}`);
  }
  // 未迁移的详情页：静默忽略（第一期无详情页）
}
```

### 10.5 更新组件顶部注释

删除提及 dom 抓取 / 油猴 / 宿主的描述。

---

## 11. 修改 `src/app/catalog/types.ts`

从 `CatalogPageConfig` 接口中删除 dom 模式专属字段：

```ts
export interface CatalogPageConfig {
  id: string;
  title: string;
  subNav?: CatalogSubNavItem[];
  /** 数据获取（所有页面统一走 CDN） */
  fetchData?: (ctx: CatalogContext) => Promise<CatalogItem[]>;
  prefetch?: (ctx: CatalogContext) => void;
  searchPlaceholder: string;
  gridClass?: string;
  cardClass?: string;
  virtualMinColW?: number;
  virtualImgRatio?: number;
  filters?: CatalogFilter[];
  buildFilters?: (data: CatalogItem[]) => CatalogFilter[];
  renderCard: (item: CatalogItem, index: number) => string;
}
```

删除：`dataSource`、`cardSelector`、`cardValidator`、`scrapeCard` 字段。

---

## 12. 修改 `src/app/catalog/pages.ts`

### 12.1 所有页面配置

- 删除所有 `dataSource: 'dom'` / `dataSource: 'cdn'` 字段
- 删除所有 `cardSelector`、`cardValidator`、`scrapeCard` 字段
- 保留 `fetchData`、`prefetch`、`renderCard`、`buildFilters`、`filters` 等

### 12.2 终局内容工厂 `makeEndgamePage`

- 删除 `routeRe` 参数（仅 dom 模式使用）
- 删除 `cardSelector`、`cardValidator`、`scrapeCard`
- `EndgamePageOpts` 接口删除 `routeRe` 字段
- 4 个 `makeEndgamePage` 调用删除 `routeRe` 参数

### 12.3 角色页 `characterPage`

`dataSource: 'dom'` 删除后，`fetchData` 已存在且完整，无需额外改动。

---

## 13. 修改 `src/app/stores/app.ts`

- 删除 `import { platform } from '../../platform';`
- `markDataReady` 函数改为空操作或直接删除：

```ts
/** 首屏数据就绪标记（保留接口兼容，无实际副作用） */
function markDataReady(): void {
  // no-op: 独立站无 failsafe 分段检测
}
```

或从 return 中删除 `markDataReady`，同时删除 CatalogPage.vue 中的 `app.markDataReady()` 调用。

---

## 14. 修改 `src/services/cache.ts`

降级回调机制（`setDegradeSink` / `degradeSink`）不再需要：

- 删除 `setDegradeSink` 导出函数
- 删除 `degradeSink` 变量
- 保留 `failCount` 计数但删除触发降级的行（`if (failCount >= DEGRADE_THRESHOLD) degradeSink?.(...)`)
- 或简化为：连续失败时仅 console.warn，不触发任何回调

---

## 15. 修改 `src/app/character/spine.ts`

文件注释中提及 Shadow DOM 的部分更新：
- 第 96 行 `@param container 播放器挂载容器（.nk-hero__spine，位于 Shadow DOM 内）` → 删除 "位于 Shadow DOM 内"

功能代码无需改动（Spine 自主渲染逻辑不依赖 Shadow DOM）。

---

## 16. 修改 `src/app/catalog/use-virtual-grid.ts`

注释更新：
- 第 7 行 `滚动容器是 #nk-catalog-app（Shadow DOM 内自滚动容器）` → `滚动容器是 #nk-catalog-app（自滚动容器）`

---

## 17. 修改 `src/app/components/SidebarNav.vue`

注释更新：
- 第 3 行 `自建侧边栏（Shadow DOM 内，复用 HOME_NAV 8 项）` → `自建侧边栏（复用 HOME_NAV 8 项）`

---

## 18. 修改 `src/app/router/index.ts` 注释

- 第 108 行 `滚动容器是 Shadow Root 内的 #nk-app（非 window）` → 删除或改为 `滚动容器由 App.vue 管理`

---

## 19. 新建 `.github/workflows/deploy.yml`

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

注意：需在 GitHub 仓库 Settings → Pages → Source 选择 "GitHub Actions"。

---

## 20. 更新 `CONTEXT.md`

重写术语表，删除所有寄生模式术语，新增独立站术语：

```markdown
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

（保留原有：强化模式、目录、Manifest 等术语）

### 视觉

（保留原有：Gaming HUD 术语）
```

---

## 21. 新建 `docs/adr/0004-standalone-github-pages.md`

```markdown
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
```

---

## 22. 清理 `.gitignore`

删除已不存在的目录引用（`要迁移的代码/`），保留有效规则。确保 `dist/` 被忽略。

---

## 23. 删除 `src/vite-env.d.ts` 中的旧引用（如有）

检查 `src/vite-env.d.ts`，确保仅保留：
```ts
/// <reference types="vite/client" />
```

---

## 24. 验证清单

执行完所有步骤后，按顺序验证：

1. **TypeScript 编译**：`pnpm run build` 无报错
2. **本地开发**：`pnpm dev` → 访问 `http://localhost:5173/hsr_wiki/` → 首页正常渲染
3. **路由**：点击侧边栏导航 → hash 变化 → 页面切换正常
4. **目录页**：角色/光锥/遗器/物品/敌对/终局 → 数据从 CDN 加载 → 卡片渲染
5. **角色详情**：点击角色卡片 → 详情页加载 → Spine 动画播放
6. **终局 Tab**：maze/story/boss/peak 切换 → 数据正确
7. **构建产物**：`dist/` 目录结构正确，`index.html` 中资源路径带 `/hsr_wiki/` 前缀
8. **单元测试**：`pnpm test` 通过（可能需要更新测试中的 platform mock）

---

## 25. 注意事项

- `src/lib/constants.ts` 中的 `CDN = 'https://static.nanoka.cc'` **保持不变**
- `src/services/api.ts` **不需要改动**（纯函数，无 platform 依赖）
- `src/app/character/SkillCard.vue` 和 `src/app/views/CharacterView.vue` 无 platform 依赖，不需改动
- `src/app/views/HomeView.vue` 检查是否有 platform 引用（预期无）
- 测试文件 `src/services/__tests__/` 和 `src/lib/__tests__/` 检查是否 mock 了 platform（如有则删除 mock）
- `vitest.config.ts` 无需改动（与 platform 无关）
- `tsconfig.app.json` / `tsconfig.json` / `tsconfig.node.json` 无需改动
