# 构建、部署与 dev 环境

> 按域组织的避坑手册，补 [commands.md](../agents/commands.md)（命令与流程事实源）、[testing.md](../agents/testing.md)（e2e 分层）、[ai-discoverability.md](../agents/ai-discoverability.md)（快照契约）与 [ADR 0014](../adr/0014-dev-server固定端口严格失败.md) 的盲区：那几份写的是**规则**，本文件只写规则推不出、但重做一次必然再踩的**判据与坑位形态**。规则本身请读上述文件，此处不复述。

## dev server：改了不生效的完整形态

- **新增 `public/` 资产在运行中的 dev server 上一律返回 `index.html`（200 + `text/html`，SPA fallback），放进已存在的目录同样如此**：新建子目录与新建文件都会命中，表现是页面「代码没生效」——本地图解码失败后回退链正常工作、也没有 `data-cdn-down`，看起来像实现写错。`Invoke-WebRequest` 比对 `Content-Type` 与字节数即可定性；`refresh-vite-cache.mjs` 对 public 二进制无效，**只能重启 dev server**。它与源文件 transform 缓存是两个独立坑（public 情形在 `refresh-vite-cache.mjs` 与「dev 缓存自愈」一节里都看不到）：凡新增 public 资源，**第一时间用 `curl -o NUL -w "%{http_code} %{content_type} %{size_download}"` 与磁盘字节比对**，不要先看状态码——返回 200 不等于文件正确（实测外壳 793B vs 磁盘 JSON 10453B）。
- **CSS `background-image` 是这条坑里唯一**完全静默**的消费方，也是最容易自欺的一处**：`<img>` 至少有 error 事件、回退链与占位降级可观测，而背景图失败时**没有事件、没有回退、没有占位**，页面只是少了一层材质（看起来像「设计就是这样」）。故判据必须是**取回并解码**，不能是看状态码、也不能是「截图里好像有光影」——后者会把 `#app` 的环境径向渐变误认成新加的材质（本轮实测踩过：把环境光影读成星野，据此宣布已验证）。正解：
  ```js
  const res = await fetch('/data/assets/icons/bgpic/BgWiki.webp');
  const bmp = await createImageBitmap(await res.blob()).catch(() => null);
  return { status: res.status, type: res.headers.get('content-type'), bytes: (await res.clone().blob()).size, decoded: bmp && `${bmp.width}x${bmp.height}` };
  ```
  `status=200` + `type=text/html` + `decoded=null` 即命中本坑（实测 200 / HTML / 2785B，而磁盘 164940B）。**判定顺序固定：先解码成功，再谈观感**。
- **dev 的 transform 缓存无 mtime 兜底，事件丢失即该文件「永久」陈旧，不受后续无关请求影响**：「.vue 新鲜 .css 陈旧」是假象，实际取决于该文件最后一次成功事件与磁盘修改的先后，与扩展名无关。所有自动失效方案已废弃且禁止重试（`invalidateAll()` 打不通 rust 内核、`utimes` 只认内容/size、多进程内容触碰会把源文件写成空白壳）。顺序固定：诊断 → 自愈工具 → 重启；**build 进行中禁止运行自愈工具**。
- **`vite build` 可当「磁盘内容是否已更新」的诊断手段**：它独立进程同步全量读磁盘，无 watcher 事件链路与跨进程源码级增量缓存，产物必然反映磁盘内容。**产物流旧 ⇒ 文件根本没落盘**，而不是构建有问题。
- **rollup 的常量替换不做跨模块摇树**：跨模块导出的 `import.meta.env.DEV` 常量被替换后，dead branch 里的 `() => import(...)` **仍会产出 chunk**（实测研究线 79KB 进产物）。dev 门控必须本文件内 `if (import.meta.env.DEV)` 包裹 `router.addRoute`，**常量一律就近内联、禁止跨模块导出**。
- **Vue SFC 模板内禁止写 `import.meta.env.DEV`**：模板编译器报 `import.meta may appear only with 'sourceType: "module"'`。必须在 script 侧同文件取 `const IS_DEV = import.meta.env.DEV` 再在模板 `v-if`。
- **给入口模块新增 import 边后，紧接的第一轮 e2e 可能整片 `page.goto: Test timeout of 30000ms exceeded`**：Vite 对新的模块图做重新预构建（optimize deps），首个页面请求因此远超 30s。判据：失败集中在**导航阶段**（不是断言）、且**复跑同一 spec 全绿**；此时不要改测试或加超时，先复跑确认预热完成（实测 `bootstrap.ts` 新增一条 import 后，mobile 项目两条 goto 超时，复跑 16/16 通过）。

## 端口与实例

- **e2e 全军覆没（含毫不相干的用例）时先查端口上是谁在服务，不要先怀疑自己的改动**：实测 6188 上挂着前一天启动的旧实例，它不认识新生成的 `public/data/cn/*.json`，把请求回退成 index.html ⇒ `fetchJSON` 报 `Invalid JSON`、整文件 12 条 e2e 全红。用 `Get-NetTCPConnection` 看 PID 与启动时间即可确认。（ADR 0014）
  - **补记（多语言落地实测）**：旧实例的快照范围是**启动时刻整个 `public/` 目录**——新增的目录（如刚生成的 `public/data/i18n/**`）在该实例上**一律 404 → SPA fallback 返回 index.html**，症状同上（`JSON.parse` 失败 → 页面空白 → 14 条 e2e 全红）；**重启 dev server 后同一批用例 30 条全过（54s）**。同时该实例会把「浏览器半途中断的静态响应」一直挂着：实测 `public/data/cn/items.json` 被独占锁住数十分钟，转换器 `os.replace` 直接 `PermissionError [WinError 5]`。**处置顺序**：先 `Stop-Process` 旧实例（锁随之释放）→ 再跑转换 → 让 Playwright 自起实例跑 e2e；判断依据是「同一请求在旧实例上返回 HTML、在新实例上返回 JSON」。
- **连接被拒绝不等于页面缺陷**：上一会话遗留的 dev server 中途死亡时，截图/探针取证会拿到连接错误。取证前先探活 6188。
- **dev server 只监听 `[::1]:6188` ⇒ 必须用 `localhost` 访问，写 `127.0.0.1` 会被拒**：地址族解析差异会让 `Test-NetConnection -InformationLevel Quiet` 报假阴性（它不做地址族回退），只有 `Invoke-WebRequest` 才准。排查「服务到底活着吗」时先解析地址族，别据 `127.0.0.1` refused 判定服务已死。

## 构建守卫与门禁

- **三守卫全绿不等于 CSS 语法正确**：`check-colors` / `check-contrast` / 字号类守卫只看色值与字号，**少一个分号会让该规则的全部声明静默失效而不报错**（实测 `color` + `letter-spacing`、`color` + `font-weight` 四条双双失效）。这类损坏只有 postcss 才报错或被静默合并，改完 CSS 需要人眼过一次声明块。
- **`var()` 引用不存在的令牌且无 fallback 时，该声明在计算期失效、属性静默退回初始值**——构建守卫**不校验变量是否存在**（实测 `var(--radius-sm)` / `var(--radius-2)` 应为 `--nk-radius-1/2/3/card`，档位徽章圆角因此长期为 0 且无人发现）。写 CSS 变量名前先 grep `tokens.css`。
- **守卫只查形状与必填项，不查具体取值**：新断言（如 JSON-LD）若锁死数据取值，数据一变就假红。取值随数据变、形状是契约。
- **report-only 检查器的计数基线会静默过期**：`check-e2e-literals` 不进 `pnpm build`/CI，漂移长期不可见（实测基线写 5、HEAD 实际 7）；`tools/e2e-literal-baseline.json` 按文件计数，文件改名 / 拆分后旧键消失、新文件按「基线 0」直接判红——**重生成前后都要核对总数**，否则会顺手把真实新增一起豁免掉。**拆文件顺手 `--write-baseline` 会把别人的漂移一起吞掉**——正确动作是先回放 HEAD 版本单独计数、看清增量归属，能收口为行内豁免（`// e2e-literal-ok: 理由`）就不要抬高基线。
- **某检查器从未运行过时，首次修好它 = 一次性暴露它攒下的全部存量，要预先算进工作量**：`check-doc-links.mjs` 的块注释被 `spine-lab/**/*.md` 里的 `*/` 提前闭合（HEAD 即有），改写后首次实跑立刻报出 3 条指向已删除文件的「误删引用」。**预期是「修好即红」，不是「修好即绿」。**

## Vercel 部署与产物投递

- **产物布局必须服从托管平台的求值顺序**：平台求值顺序、rewrite 失效形态与「构建产物都对 ≠ 线上投递正确」的判据见 [ai-visibility.md](ai-visibility.md)「投递模型：产物布局服从平台求值顺序」——本文件不重述，只留下面的平台侧工程判据。
- **不可逆的产物布局决策（快照数量、rewrite、sitemap）要先算产物量级再决定**：为 2606 个物品新增详情页等于把 1200 个预渲染 HTML 翻近三倍，且必须同步 sitemap / vercel rewrite / 快照覆盖三处（跨模块契约）。**凡「零路由成本」的替代路径（检索 + 悬停）即能达成同一目的，就不要开新路由形态。**
- **平台注入路由（`/_vercel/*`）优先于项目 rewrites——正则「匹配」不等于「会被 rewrite」**：本仓 catch-all `/((?!data/|assets/|…).*)` 在正则上**确实匹配** `/_vercel/speed-insights/script.js`，静态分析极易据此得出「接入分析会被投递成 HTML 外壳」的结论。线上实测反证：在**未加任何排除**的旧部署上，`/_vercel/insights/script.js` 与 `/_vercel/speed-insights/script.js` 均返回 `200 application/javascript` 真实包体，而同期 `/this-path-should-404` 仍返回 HTML 外壳（证明 catch-all 生效中）。判据：**「该 URL 被某条 rewrite 的 source 匹配」∧「该规则在此优先级生效」** 才是结论；平台保留路径这一层不减。凡对平台保留路径的判断，**一律用线上/预览实测终结，不要只做正则推演**（`/.well-known/*` 是另一处文档明示的保留路径）。
- **探针必须有阳性对照组，否则假阴性会把你推向错误结论**：本次首版探针因把 `path.slice(1)` 后再去匹配「含前导 `/` 的 source 正则」，导致**全部路径报 EXCLUDED**（含 `/_vercel/*`），若就此收工会得出与事实相反的「无需处理」。是对照组 `/character/1308`（**必须 CAUGHT**）与 `/data/**`（**必须 EXCLUDED**）暴露了矛盾。**凡「判定 A 会被 B 影响」类探针，必须同时纳入一条确定应当命中的样本与一条确定应当放行的样本**，两侧都符合预期才采信结果。

## 增量与确定性

- **converter 增量与源表登记纪律**见 [data-pipeline.md](data-pipeline.md)「增量转换与缓存失效」（签名口径、`--force`、`MODULE_SOURCES` 与 AST 守卫盲区）：那一域是唯一落位，本文件只留「构建侧」的确定性验收。
- **转换产物必须做「重跑两次字节一致」的确定性验收**，否则增量与排序的不确定性会伪装成数据变更。改完 converter 先 `--force` 重跑并比对字节，再做其他验证。
- **落盘顺序会决定「缺一组数据是否带坏整批产物」**：共享表（如等级曲线）必须写在依赖它的详情循环**之前**，否则缺组会污染全部详情。
- **`check-doc-links.mjs`（硬门禁）把「HEAD 有、工作区无」的旧路径判为「误删引用」**：拆文件 / 删文件时必须同批改 ADR 与 memory 里指向旧路径的反引号路径与 markdown 链接（历史叙述保留、只换路径说法），否则门禁直接红。

## 静态资产：自托管字体与社交分享图

- **`<link rel="stylesheet">` 指向第三方域，等于把「能不能渲染」挂在对端的可达性上**：Google Fonts 既渲染阻塞，又在部分网络（如中国大陆）不可达——浏览器要等连接超时才继续渲染，FCP/LCP 直接塌掉，而页面本身毫无异常。判据：`index.html` 里不得出现跨域渲染阻塞样式表。
- **`fonts.css` 必须 import 在入口模块（`bootstrap.ts`），不能随路由懒加载**：字体是每一页的渲染前提，放进路由包意味着没命中该路由的页面在 JS 之后才发现字体（静默回退系统字体 / CLS）。全局样式同理只有 `tokens.css` + `catalog.css` 进入口。`src/app/bootstrap.ts`
- **「自托管」的产物是入库的资产，不是构建步骤**：抓字体要联网、生成分享图要起浏览器，都不该进 `pnpm build`；构建只复制它们。凡「构建期需要网络/浏览器」的产物，一律做成手动工具 + 入库产物。
- **改写 CSS 里的字体 URL 不能用「替换主机名」**：上游地址形如 `/{family}/{version}/{file}.woff2`，而文件是**平铺**到 `public/fonts/` 的——替换主机名会留下路径段，指向不存在的目录，浏览器**静默**回退系统字体。判据：生成器必须自检「CSS 里出现的每个本地 `url()` 都有对应文件」，否则这类拼错可以一路过完构建。
- **字体栈（设计侧）与抓取清单（资产侧）是两份事实**：`tokens.css` 的 `--font-body` / `--font-hud` 与工具里的家族/字重表必须同步；只改一边，新字重静默回退系统字体（浏览器不报错，只有排版变了）。
- **保留上游的 `unicode-range` 分片，不要合并成一个大文件**：CJK 每片只有几十 KB，浏览器按当前页面用到的字下载；合并后每个首屏都要多下数 MB。
- **`/fonts/*` 必须给长缓存**：文件名带上游内容哈希，等价内容寻址；缺这条 header 会让每个页面反复回源取分片。
- **分享图是入库产物，且不应在生成器里写颜色字面量**：色值取自 `tokens.css`（生成器自己起本地静态服务喂浏览器），主题改色或换字体后需重跑，否则分享图静默过期——没有任何守卫会察觉。
- **`text=` 子集抓到的字体地址没有 `.woff2` 后缀**：整族走 `fonts.gstatic.com/s/<family>/vN/<hash>.woff2`，而 `text=` 子集走 `/l/font?kit=<hash>&v=<ver>`——按后缀匹配会一条都抓不到。判据也不是「有没有 `unicode-range`」（子集**也有**），而是 **`@font-face` 块数 = 1**（整族是上百个）。
- **字体没就位时必须拒绝导出，不能照常出图**：截到系统回退字体的图「看起来也能用」，却已经不是设计的样子——这类缺陷没有任何断言能发现，只能由生成器自己判死（等 `document.fonts.ready` 后核对已加载家族）。
- **中文显示字折行不会被任何溢出断言抓到**：「星铁档案馆」折成「星铁档案 / 馆」时元素既没溢出也没报错。判据是 `element.getClientRects().length === 1`（一行恰好一个 rect）；修复顺序是缩字号或加宽栏，**不是**放任折行。
- **设计类产物的「好不好看」要靠外部量化校验器落地**：分享图这类单图产物没有回归断言，可借版式技能自带的校验器量溢出 / 最小字号 / 标题与下一块的间距 / 边界（`validate-social-deck.mjs`）。它的 R9（标题与下一块 ≥24px）是实测最容易踩的一条——肉眼看「有间距」但只有 16px。

## 图标入库：新版本缺口的补数路径

- **图标分类缺文件看兜底链、别猜**：图片走 jsdelivr（主）+ raw.githubusercontent（回退）同仓库镜像（两者都指向已提交的 `public/data/assets/icons/`），某分类在仓库里缺文件时两端同时 404 → 占位符。判据：先按「jsdelivr 与 raw 都 404」定性，再去解包补数并提交入库，别拿同角色其它分类的 200 当该分类有图的证据。
- **补数走 AnimeStudio CLI 的 map 定向导出，不要全量扫包**：`AnimeStudio.CLI.exe "<game>\StarRail_Data" <导出目录> --game SR --map_op AssetMap,Load --map_type MessagePack --map_name "<textures>\index\game.map" --group_assets ByContainer --types Sprite --containers "<分类正则>" --dedupe_content`；`--containers` 让 map 只回捞相关包。前提是 `index/game.map` 建时已含当前版本——旧 map 只会回捞到旧资产（「map 里搜不到资产名」即此因，重建 map 等于整盘扫）；`--src` 要给 `<导出目录>/assets/asbres/spriteoutput`（解包根可能多一层 `ui/`，别依赖脚本默认路径）。
- **`ingest-icons.py --crop-alpha 4:5` 的产物比例并不统一，这是算法而非流程漂移**：裁剪窗口宽高被 `min(w2, W) / min(h2, H)` 夹回画布后不再缩小，所以宽幅或几乎满画布的立绘会原样保留比例——目录里 4:5 与 0.9~1.1 的比例混存是正常形态；判据是「窗口受画布限制」，不要为了凑 4:5 手裁或换源。

## 图片分发：本地同源（主）+ jsDelivr（二级）+ raw.githubusercontent（三级）

图片主源是**站点同源** `/data/assets/icons`（`LOCAL_ICONS_BASE`），随 `pnpm build` 拷进 `dist/data/assets/icons` 部署；本地失败时回退 `cdn.jsdelivr.net/gh/<repo>@<ref>`（`LOCAL_ICONS_DELIVR_BASE`），再失败回退 `raw.githubusercontent.com`（`LOCAL_ICONS_FALLBACK_BASE`）。**图标分类的 `local` 分支现在是「本地主源 → jsDelivr → raw」三级链**（翻案自「jsDelivr 主源 + raw 回退」，见 [ADR 0069](../adr/0069-图片加载改为本地优先.md)）。

- **`LOCAL_ICONS_BASE` 恒为同源相对路径**（`${import.meta.env.BASE_URL}data/assets/icons`），不再按 `DEV` 分流——dev 与 build 都直读 `public/`→`dist/` 同源文件；jsDelivr/raw 仅作失败回退。判据：`pnpm dev` 与线上图片首选请求全部是 `/data/assets/icons/**` 同源 200，不会被 minify 前的分支误判。
- **回退链在运行期推导，属性层不再内联**：`resolveCdnUri` 的 `{ primary, fallback, fallback2 }` 只是声明，真正跳转由 `resolve.ts → nextFallbackFrom(src)` 单点决定（本地 → jsDelivr → raw → 终止；nanoka → jsDelivr 旧档 → 终止），`dom.ts` 的 `handleFailure` 每次只问它一跳。`imgHtml`/`cdnImgAttrs`/`imgAttrs` 不再输出 `data-cdn-fallback`/`-fallback2`；`data-cdn-fallback` 仅作 `imgAttrsPair` 的显式覆盖（[ADR 0071](../adr/0071-图片回退链改为失败时推导.md)）。**jsDelivr 规则地址必须是终点**：再反查 nanoka 会让两个 404 地址互相回退成环。
- **本地图标源文件现在随构建产物投递**：`prune-dist-icons.mjs` 已删除，`dist/data/assets/icons`（4,585 文件 / 约 250 MB）随部署上线，`dist` 约 100 → 约 400 MB（实测 401 MB）。这是「本地优先」的必要代价——Vercel 走 Git 集成部署无产物硬上限，但 Deployment Storage 按部署数累加。
- **jsdelivr 50 MB ref 上限仍在，但已退为二级**：只有本地缺文件（新版本图标尚未入库）才会打到 jsDelivr，冷文件偶发 403 `Package size exceeded the configured limit of 50 MB` 时由 raw 三级兜底；回退链两跳必须同 ref（`ICON_MIRROR_REF`=main）。
- **`index.html` 只保留 `dns-prefetch`**（jsdelivr + raw），不再 `preconnect` jsdelivr——主源同源无需跨域预连接，回退前 `dns-prefetch` 足够；仍不得 `preconnect` `static.nanoka.cc`（Cloudflare 域在目标网络常不可达）。
- **构建产物里基址是模板字面量拼接，grep 完整 URL 会 0 命中**：minify 后形如 ``a=`https://cdn.jsdelivr.net/gh/${repo}@${ref}/public/data/assets/icons` ``，核对时 grep `hsr-wiki` 或 `raw.githubusercontent` 片段，别因整串 grep 无果就以为没改到。
- **`official()` / `endgameArtUrl` 这类「官方原图直链」的分发是另一条链，不要和本地图标混淆**：它们指向**纹理镜像仓库 `a285292107s/StarRailTextures`** 的 jsDelivr（不是站点仓库 `hsr-wiki`）。两仓库互不相干——`LOCAL_ICONS_*` 回退指向 `hsr-wiki`，`OFFICIAL_ICON_BASE` 指向 `StarRailTextures`。
- **需要本地化的官方原图走 `uiart` 清单白名单（`src/services/cdn/uiart.ts`）**：清单命中的 `(rel路径)` 从同源 `/data/assets/icons/uiart/<rel>` 发（随 dist 部署），未命中则回官方 `StarRailTextures` 镜像。`gridFightPropIconUrl` / `modeDefaultArtUrl`（`endgame.ts` 的 `endgameArtUrl`）均走 `uiartUri()`。**不要给 `uiart` 声明 `CDN_CATEGORIES` 分类**——那样会让所有官方原图都尝试本地并 404；用清单只本地化「策展过的少量文件」，其余（如数百张季节背景 185MB）留在镜像仓库不膨胀仓库。判据：要本地化某张官方原图时，把文件拷进 `public/data/assets/icons/uiart/<官方相对路径>`（路径规则同 `spriteOutputToRel`：目录小写、文件名保留、`.png`）并在 `UIART_LOCAL_FILES` 登记。
- **Chimera 图标数据路径是陈旧死链**：`prop_icons.json` 写 `UI/Quest/Chimera/ChimeraTextIconAtk.png`，但镜像上是 404，真实图在解包源 `ui/quest/hipplen/_autogen/`；已用真实文件入库 `uiart/ui/quest/chimera/`。

## 图片并发闸门（避免一次性大量加载被 jsdelivr 限流）

`src/services/cdn/img-gate.ts` 的 `installImageGate()`（bootstrap 里 `app.mount` 之前安装）给全站图片加了两层调度：**视口 ±300px 才放行** + **远端在途并发上限**（`IMAGE_GATE_MAX_INFLIGHT=6`），避免列表首屏一次性把 30–40 个跨域请求同时发出去、撞上突发限流。**同源 `/data/assets/icons` 只做视口调度、不占名额**——本地优先后它是绝大多数图的主源，继续卡 6 路只会拖慢首屏。

- **浏览器一旦拿到 `src` 就立即发请求，改属性/改 `src` 拦不住**——所以闸门必须让图**一开始就没有真 `src`**。实现：装一个 `HTMLImageElement.prototype.src` 属性 setter 拦截，本域图片一律改成透明占位、把真 URL 记在 `data-cdn-src`，等拿到名额再由闸门写回。`v-html`/`innerHTML` 出的图不走属性 setter（实测：setter 只拦属性赋值，`setAttribute`/`innerHTML` 都漏），因此**模板串里本域图片必须写 `data-cdn-src` 而非 `src`**，由闸门在插入时接管。
- **本域判定**：`img-gate.ts` 的 `isGatedImageUrl` 认 `CDN`(nanoka) + `cdn.jsdelivr.net` + `raw.githubusercontent.com` + `${LOCAL_ICONS_BASE}/`。新增图片来源（换 CDN / 加域名）必须同步这里，否则新源不受闸门；本地基址现在是**站点相对路径**（dev/build 一致），漏了这一条则模板串的 `data-cdn-src` 永不被接管、图片全空（`dom.ts` 的降级判定 `isManagedImage` 同理会漏掉本地相对地址、失败时不给占位）。
- **优先级/视口**：`fetchpriority="high"` 的 LCP 图立即放行（不受上限约束，并移除该属性避免过早请求），其余按「靠近视口优先」入队；名额靠全局 `load`/`error` 捕获释放（`load` 不冒泡，故必须 capture），并 rAF 合并重算，避免 1000 图页面里每次 release 都 O(n) 全扫。
- **`release` 必须同时清掉元素的等待标记**：不清的话该元素此后再改写 `src`（含回退跳转）会被当成「已接管」而直连——本地整体不可用时会一次性把所有图推去 jsDelivr，闸门在最该限流的时刻失效（2026-11-25 修）。占位 GIF 自己的 `load` 不代表请求结束，`release` 里按 `src === BLANK_SRC` 早退。
- **回退跳转一律走 `replaceImageSrc`**：`dom.ts` 只能在拿到 `load`/`error` 后靠事件释放，挂起超时（`CDN_STALL_TIMEOUT_MS`）触发的降级没有事件可依；改写受管图地址统一用 `img-gate.ts → replaceImageSrc(img, url)`（先退掉上一跳占用的名额、清等待标记，再赋值），否则那一跳绕过闸门。**退名额不能漏**：挂起超时跳转的上一跳既无 `load` 也无 `error`，不在这里还名额就吞一个在途名额，累计到上限后远端图再也放不出去。
- **降级与闸门的耦合坑**：闸门把 `src` 设成**透明**占位（不是错误图标）——4×4 的透明图 `complete && naturalWidth>0` 成立，所以**任何「图已加载」的断言必须认真实 `src`（或 `data-cdn-src`），别只信 `naturalWidth>0`**（它会假阳性）。若用错误 SVG 当占位，会触发组件 `@error` 处理器误隐藏图，更糟。
- **测试约定**：闸门接管后，本域图的真实 URL 统一在 `data-cdn-src`（不管在队还是已加载），`src` 可能是占位 GIF（未放行时）。e2e 断言图片地址一律读 `data-cdn-src || src`；旧 `toHaveAttribute('src', …)` 会假失败。全 404 占位类断言要先把目标 `scrollIntoViewIfNeeded()`，否则屏外图根本不会入队加载、404 永不触发。降级态另有 `data-cdn-degraded-src`（降级前的原地址）与 `data-cdn-placeholder`——**降级记录不写 `data-cdn-src`**，那是对闸门的接管凭据，写了会互相覆盖。
- **`IMAGE_GATE_ROOT_MARGIN`（IntersectionObserver 的 `rootMargin`）与 `isNearViewport()` 的像素余量是同一语义的两处实现**：后者必须从前者 `parseInt` 派生，禁止各写一个字面量——两处不同步会让「视口 ±N 预加载」静默失效（一处 300 一处 250 时，靠近边界的图在两判定间反复进出队列）。

## 图片加载统一入口与背景图的边界

业务层禁止私自加载（裸 `<img src>` / 模板串 `data-cdn-src` / `background-image: url()` / 内联 `@error` 改 src / `new Image()`），统一走 `src/lib/image.ts` + `CdnImage.vue`；`tools/check-image-loading.mjs` 以 `--strict` 进 `pnpm build` 守卫链，命中即构建失败。

- **背景图（`bgStyle` / `bgVar`）是刻意保留的例外，不是漏网**：CSS `background-image` 的首帧计算样式里**必须**带 URL——`e2e/layout-endgame-mode.spec.ts`、`layout-character-hero.spec.ts` 直接断言 `getComputedStyle().backgroundImage` 含 `url(`，预渲染快照也要求爬虫拿到的 HTML 内联背景 URL。因此背景图**不能**像 `<img>` 那样「初始留空、加载成功后写入」，也就进不了闸门队列（闸门的前提是先占位再放行）。代价是背景图无并发上限、无自动回退、无占位降级；这是已知取舍，不要试图用「隐藏探针 `<img>`」绕路——隐藏元素 `getBoundingClientRect` 为 0，`isNearViewport` 恒 false 会卡死队列；放 `fetchpriority=high` 则绕过并发，等于没优化。真要给背景图补保护，须先改 e2e 断言与快照策略（待裁决）。
- **两条 `<img>` 路径并存是刻意的**：`imgAttrs()` 产出普通 `src` 靠全局 `src` setter 拦截，`imgHtml()`/`CdnImage.vue` 产出 `data-cdn-src` 靠 MutationObserver。曾评估「统一成 data-cdn-src、删掉原型劫持」，但会重写 `img-gate.test.ts` 里 7 条针对 setter 路径的用例（那正是闸门的核心保护网），纯内部简化、用户零收益，性价比低，故暂缓。改动闸门前先读那 7 条用例，别误删保护。
- **异步数据填充的 `<img>` 必须在拿到真实 URL 后才挂载（Vue 里加 `v-if`），否则闸门永远接管不到**：`adopt()` 只在 `data-cdn-src` 非空时纳管，且 MutationObserver 只观察 `childList`、不观察 `attributes`。若 `<CdnImage :src="computedThatStartsEmpty">` 首帧带空 `data-cdn-src` 挂进 DOM，闸门直接 `return`；之后 Vue 原地更新该属性不会再触发 `childList`，图永久停在 `src=null`/`naturalWidth=0`（无占位、无回退、无报错）。判据：图片 URL 来自异步加载（store / `loadLocal*`）时，`v-if="url"` 与 `:src="url"` 同时写，让元素带着真实 `data-cdn-src` 首次插入、由 childList 观察者接管。反之纯静态 URL 的 `<img>` 无需此保护。症状识别：`data-cdn-src` 是正确 URL 但 `src` 为 `null` 且无任何网络请求——区别于「已入队待放行」的透明 GIF（`src` 为 `data:`、`naturalWidth=1`）。`src/app/character/BuildsPanel.vue` 的遗器套装图标曾因此整块缺失。
