# 官网角色 Spine 动画抓取流程

> 目标：从米哈游官网（sr.mihoyo.com）抓取角色 Spine 动画资源（atlas / json 骨架 / 纹理图），
> 写入本地 `public/data/cn/spine-manifest.json`，供 wiki 角色详情页 Hero 区播放。
> 本流程已实测验证并覆盖 3.4 ~ 4.4 全部版本（13 个角色，含千冶•刃、远坂凛、吉尔伽美什、姬子•启行）。

## 适用范围

- **当前版本官网**：当期版本展示的角色（首页轮播 + 版本专题），如 4.4 的远坂凛等
- **历史版本官网**：通过 Wayback Machine 快照回溯（如 4.3 的 SP 刃）
- 老角色（三月七、丹恒等 29 个无动画角色）**官网没有** spine，抓不到是正常的
- **已覆盖版本**：3.4（2025-05，风堇/赛飞儿）起每个版本官网首页均有角色 spine；
  3.2/3.3 时代官网为旧 Nuxt 架构（无 PUZZLE spine），4.2 版本无 Wayback 快照，均无法获取

## 核心原理

官网是 SPA，页面加载时全局挂载 `PUZZLE_CONFIG_{publish_key}` 配置对象（含全部资源清单）。
Spine 角色动画位于 `pc.nodes` 的 `@puzzle/spine-player` 节点 → `options.spineList[]`，
每项 `manifest` 含 `atlas`（图集描述）、`json`（骨架，Spine 4.2.43）、`img[]`（纹理，逻辑名 → hash URL）。

- 官网资源 URL 模式：`https://act-webstatic.mihoyo.com/puzzle/hkrpg/pz_{publish_key}/resource/puzzle/{日期}/{hash}.atlas|.json|.png`
- publish_key 随版本变化：4.3 = `pz_Z1nD6naN3q`、4.4 = `pz_Devp46QZiu`

## 流程 A：当前版本（浏览器 + 控制台）

1. **打开官网**：浏览器访问 `https://sr.mihoyo.com/`（务必等页面完整加载，含首页轮播）
2. **提取配置**：控制台执行（publish_key 从 `Object.keys(window).filter(k => k.startsWith('PUZZLE_CONFIG'))` 获取）
   ```js
   const cfg = window.PUZZLE_CONFIG_pz_Devp46QZiu; // 替换为实际 key
   // 列出全部 spine 节点
   cfg.pc.nodes.filter(n => n.name === '@puzzle/spine-player')
     .map(n => ({ id: n.id, count: n.options.spineList.length }));
   ```
3. **定位角色节点**：角色展示通常挂在内层容器（如「第二屏」container 的 children 中），
   递归查找：`JSON.stringify(node).includes('.atlas')` 定位
4. **提取资源组**：
   ```js
   const s = 角色的 spineList 项;
   s.manifest.atlas;            // atlas URL
   s.manifest.json;             // 骨架 URL
   s.manifest.img.map(i => ({ logical: i.id, url: i.src }));  // 纹理（逻辑名 + 实际 URL）
   ```
5. **交叉验证**：打开 atlas URL 确认 page 名（第 1 行）与 `img[].id` 对应（注意 atlas 名**带扩展名**）
6. **验证可访问性**（CORS 反射 + HTTP 200）：
   ```bash
   curl -sI -H "Origin: https://hsr.wiki" "<atlas|json|png URL>" | Select-String "HTTP|access-control"
   # 期望：HTTP 200 + Access-Control-Allow-Origin 反射请求 Origin
   ```
7. **写入 manifest**：按下方规范追加条目
8. **页面验证**：`pnpm dev` 打开 `/character/{id}`，确认「动画」按钮点亮、动画循环播放

## 流程 B：历史版本（Wayback Machine）

1. **定位快照**：浏览器访问 `https://web.archive.org/web/{yyyymmdd}000000/https://sr.mihoyo.com/`
   （如 4.3 时期 `20260608`），自动重定向到最近快照；注意 CDX API 易限流（498），优先用浏览器
2. **等待快照渲染**：快照会执行页面 JS，等待数秒后 `PUZZLE_CONFIG_{publish_key}` 即存在
   （标题可确认版本，如「4.3全新版本「沉于生者的忘川」正式上线」）
3. **提取配置**：同流程 A 步骤 2-4，publish_key 为历史版本 key
4. **还原原始 URL**：配置中的 URL 带 Wayback 代理前缀 `https://web.archive.org/web/{ts}/`，**剥离前缀**即原始 CDN 地址
5. **验证 + 写入**：同流程 A 步骤 5-8（历史资源通常仍存活，但无 SLA，验证失败则放弃该角色）

> 注意：部分时期快照是不完整捕获（只有 Wayback 工具条壳，正文为空，如 2025-06~07），
> 或老架构页面（Nuxt SSR，无 PUZZLE 配置，如 2025-05）。此类快照直接转流程 C 直取 config.js。

## 流程 C：历史版本 config.js 直取法（推荐，已实测）

历史版本官网的完整资源**仍存活在米哈游服务器上**（config.js / setups.js / vendor.js / atlas / json / png 全部 200），
不必依赖慢速的 Wayback 渲染：

1. **拿 publish_key + config hash**：从任一 Wayback 快照页 DOM 提取
   `document.querySelectorAll('script[src]')` 中形如
   `https://act.mihoyo.com/puzzle/hkrpg/{publish_key}/config.{hash}.js` 的引用
   （老快照渲染失败时，改用 curl 抓快照 HTML 正则提取 `config\.[a-f0-9]{8}\.js`；
   快照缺失时用 CDX 查收录推断 publish_key：
   `curl "https://web.archive.org/cdx/search/cdx?url=act.mihoyo.com/puzzle/hkrpg/*&from={yyyymmdd}&to={yyyymmdd}&output=json&filter=statuscode:200&collapse=urlkey"`，
   从 `config.{hash}.js` 行提取 publish_key）
2. **本地解析配置**：`curl -o config.js <URL>` 后 node vm 执行（配置为 JS 字面量含 `!1`/`!0` 简写，
   不能 JSON.parse；`vm.runInNewContext(src, { window: {} })` 后读 `window.PUZZLE_RENDER_CONFIG`）。
   **按节点 ID 定位角色**：角色 spine 节点 ID 跨版本稳定为 `pz-gRE3yO7OWw`
   （背景动画节点为 `pz-ugmWxhsCCJ`），递归遍历 `pc.nodes` 找 `id === 'pz-gRE3yO7OWw'` 即可——
   不要依赖 container 索引（3.4/3.5 在 `nodes[9]`，3.6+ 在 `nodes[8]`，会漂移）
3. **验证 + 写入**：同流程 A 步骤 5-8（无需任何 Wayback 请求，全部直连原始 CDN）

> 已知各版本 publish_key 与角色：
>
> | 版本 | publish_key | 角色（manifest ID） |
> |---|---|---|
> | 3.4 | `pz_127WXww3Uc` | 赛飞儿 1406、风堇 1409 |
> | 3.5 | `pz_2Mmoz7kMdq` | 海瑟音 1410、刻律德菈 1412 |
> | 3.6 | `pz_acyOXI3piV` | 长夜月 1413、丹恒•腾荒 1414 |
> | 3.7 | `pz_5Pho3vPZz4` | 昔涟 1415 |
> | 3.8 | `pz_Hse3Q5Sb8j` | 大丽花 1321 |
> | 4.1 | `pz_m_gHUEqYs4` | 不死途 1504 |
> | 4.3 | `pz_Z1nD6naN3q` | 千冶•刃 1507 |
> | 4.4 | `pz_Devp46QZiu` | 远坂凛 1508、吉尔伽美什 1509、姬子•启行 1510 |
> | 4.2 | （无 Wayback 快照，无法获取） | — |

## manifest 写入规范（public/data/cn/spine-manifest.json）

```jsonc
{
  // nanoka 源（存量，.skel 二进制，Spine 4.1.23）
  "1005": { "kind": "skel", "name": "kafuka" },
  // 官网源（.json 骨架，Spine 4.2.43）
  "1508": {
    "kind": "official",
    "atlas": "https://act-webstatic.mihoyo.com/.../d6219db1....atlas",
    "json": "https://act-webstatic.mihoyo.com/.../25786df6....json",
    "textures": {
      // 键 = atlas 实际 page 名（含扩展名！），值 = 实际 hash URL（不带 OSS 参数！）
      "TohsakaRin.png": "https://act-webstatic.mihoyo.com/.../7eeeaa4d....png"
    }
  }
}
```

**同 ID 唯一（重要）**：manifest 是「角色 ID → 单条目」映射，无多条目并存。
若目标角色已有 `skel` 条目（nanoka 源），写入 `official` 条目时**直接替换**该 skel 条目
（官方源为精确角色模型，优先级更高；本次 3.4+ 的 10 个角色全部由 skel 替换为 official）。

**多纹理命名规律**：atlas 多 page 时纹理键为 `name.png` / `name_2.png` / `name_3.png`…
（与 `img[].id` 的 `name` / `name_2` / `name_3` 一一对应），如 xilian×3、tenghuang×3、jizi×3。

**写入后必须 bump 缓存版本**：`src/services/api.ts` 中 `resolveSpine` 的 cacheKey
（`spine_manifest_v4` → `v5`...），否则 IndexedDB 旧缓存导致新条目不生效。

## 关键陷阱（全部实测踩过）

| # | 陷阱 | 后果 | 规避 |
|---|---|---|---|
| 1 | atlas 纹理名是逻辑名（`TohsakaRin.png`），实际文件是 hash 名 | 纹理 404 | manifest 存 `atlas目录 + 逻辑名` → 实际 URL 映射，前端用 `rawDataURIs` |
| 2 | manifest 纹理键用官网配置的 img.id（无扩展名） | 映射 miss → 404 | 键必须与 atlas page 名完全一致（**含扩展名**） |
| 3 | 纹理 URL 带 `?x-oss-process=...` 参数 | Image 加载卡死，success 永不触发 | 纹理 URL 用**原始 png**，去掉 OSS 参数 |
| 4 | atlas 改写为含 `:` 的绝对 URL | Spine 4.2 解析器当属性行吞掉，region 误判为 page | atlas 原样加载，映射走 `rawDataURIs` |
| 5 | CDX API 超时/限流（498） | 无法查快照 | 直接用浏览器访问 `web.archive.org/web/{ts}000000/...` |
| 6 | spine-player 依赖 rAF 循环 | 标签页 hidden 时 success 不触发（非缺陷） | 在可见标签页验证 |
| 7 | `cachedFetch` 的 IndexedDB 缓存 | manifest 修改后不生效 | 改 cacheKey 版本号 |
| 8 | 在 Wayback 页面内 fetch 纹理返回 404 | 误判资源已删 | 是 Wayback 上下文 Referer 触发防盗链，
    用 curl（无 Referer）或 wiki 页面直连验证；act-webstatic 为 Origin 反射策略，任意 Origin 均可 |

## 验收清单

- [ ] 资源三件套（atlas/json/纹理）HTTP 200 + CORS 反射通过
- [ ] manifest 纹理键与 atlas page 名逐字一致（含扩展名）
- [ ] 纹理 URL 无 `x-oss-process` 参数
- [ ] `pnpm test` + `pnpm build` 全绿
- [ ] 可见浏览器中 `/character/{id}` 动画按钮点亮（类名含 `has-anim`）、循环播放、构图适配
- [ ] 控制台无错误；`performance.getEntriesByType('resource')` 可见该角色的 atlas/json/全部纹理请求成功
- [ ] 回归：现有 nanoka 角色（如 1005）动画无退化

## 相关

- 实现：`src/app/character/spine.ts`（official 渲染路径）、`src/services/api.ts`（resolveSpine）
- 决策：`docs/adr/0009-官网spine动画增量接入.md`
- 历史抓取样本：`cdn/spine/official-home-spine-4.4.json`
