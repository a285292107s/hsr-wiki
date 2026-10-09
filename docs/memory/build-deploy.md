# 构建、部署与 dev 环境

> 按域组织的避坑手册，补 [commands.md](../agents/commands.md)（命令与流程事实源）、[testing.md](../agents/testing.md)（e2e 分层）、[ai-discoverability.md](../agents/ai-discoverability.md)（快照契约）与 [ADR 0014](../adr/0014-dev-server固定端口严格失败.md) 的盲区：那几份写的是**规则**，本文件只写规则推不出、但重做一次必然再踩的**判据与坑位形态**。规则本身请读上述文件，此处不复述。

## dev server：改了不生效的完整形态

- **新增 `public/` 资产在运行中的 dev server 上一律返回 `index.html`（200 + `text/html`，SPA fallback），放进已存在的目录同样如此**：新建子目录与新建文件都会命中，表现是页面「代码没生效」——本地图解码失败后回退链正常工作、也没有 `data-cdn-down`，看起来像实现写错。`Invoke-WebRequest` 比对 `Content-Type` 与字节数即可定性；`refresh-vite-cache.mjs` 对 public 二进制无效，**只能重启 dev server**。
- **public 快照与源文件 transform 缓存是两个独立坑，且前者已复发两次**：改 `refresh-vite-cache.mjs` 或只看 commands.md「dev 缓存自愈」一节的人不会知道 public 情形。凡涉及新增 public 资源，**第一时间用 `curl -o NUL -w "%{http_code} %{content_type} %{size_download}"` 与磁盘字节比对**，不要先看状态码——返回 200 不等于文件正确（实测外壳 793B vs 磁盘 JSON 10453B）。
- **dev 的 transform 缓存无 mtime 兜底，事件丢失即该文件「永久」陈旧，不受后续无关请求影响**：「.vue 新鲜 .css 陈旧」是假象，实际取决于该文件最后一次成功事件与磁盘修改的先后，与扩展名无关。所有自动失效方案已废弃且禁止重试（`invalidateAll()` 打不通 rust 内核、`utimes` 只认内容/size、多进程内容触碰会把源文件写成空白壳）。顺序固定：诊断 → 自愈工具 → 重启；**build 进行中禁止运行自愈工具**。
- **`vite build` 可当「磁盘内容是否已更新」的诊断手段**：它独立进程同步全量读磁盘，无 watcher 事件链路与跨进程源码级增量缓存，产物必然反映磁盘内容。**产物流旧 ⇒ 文件根本没落盘**，而不是构建有问题。
- **rollup 的常量替换不做跨模块摇树**：跨模块导出的 `import.meta.env.DEV` 常量被替换后，dead branch 里的 `() => import(...)` **仍会产出 chunk**（实测研究线 79KB 进产物）。dev 门控必须本文件内 `if (import.meta.env.DEV)` 包裹 `router.addRoute`，**常量一律就近内联、禁止跨模块导出**。
- **Vue SFC 模板内禁止写 `import.meta.env.DEV`**：模板编译器报 `import.meta may appear only with 'sourceType: "module"'`。必须在 script 侧同文件取 `const IS_DEV = import.meta.env.DEV` 再在模板 `v-if`。

## 端口与实例

- **e2e 全军覆没（含毫不相干的用例）时先查端口上是谁在服务，不要先怀疑自己的改动**：实测 6188 上挂着前一天启动的旧实例，它不认识新生成的 `public/data/cn/*.json`，把请求回退成 index.html ⇒ `fetchJSON` 报 `Invalid JSON`、整文件 12 条 e2e 全红。用 `Get-NetTCPConnection` 看 PID 与启动时间即可确认。（ADR 0014）
- **连接被拒绝不等于页面缺陷**：上一会话遗留的 dev server 中途死亡时，截图/探针取证会拿到连接错误。取证前先探活 6188。
- **dev server 只监听 `[::1]:6188` ⇒ 必须用 `localhost` 访问，写 `127.0.0.1` 会被拒**：地址族解析差异会让 `Test-NetConnection -InformationLevel Quiet` 报假阴性（它不做地址族回退），只有 `Invoke-WebRequest` 才准。排查「服务到底活着吗」时先解析地址族，别据 `127.0.0.1` refused 判定服务已死。

## 构建守卫与门禁

- **三守卫全绿不等于 CSS 语法正确**：`check-colors` / `check-contrast` / 字号类守卫只看色值与字号，**少一个分号会让该规则的全部声明静默失效而不报错**（实测 `color` + `letter-spacing`、`color` + `font-weight` 四条双双失效）。这类损坏只有 postcss 才报错或被静默合并，改完 CSS 需要人眼过一次声明块。
- **`var()` 引用不存在的令牌且无 fallback 时，该声明在计算期失效、属性静默退回初始值**——构建守卫**不校验变量是否存在**（实测 `var(--radius-sm)` / `var(--radius-2)` 应为 `--nk-radius-1/2/3/card`，档位徽章圆角因此长期为 0 且无人发现）。写 CSS 变量名前先 grep `tokens.css`。
- **「守卫通过」只说明没报错，不说明新加的检查真的在跑**（选择器写错、路径判断写错都会静默通过）。凡新增守卫断言，交付前必须做一次「故意弄坏它」的负测——实测把 `dist/prerender/character/1204.html` 的 `"@type":"Person"` 改成 `"Article"` 应如期判红。**「守卫从不响」与「没有守卫」等价。**
- **守卫只查形状与必填项，不查具体取值**：新断言（如 JSON-LD）若锁死数据取值，数据一变就假红。取值随数据变、形状是契约。
- **report-only 检查器的计数基线会静默过期**：`check-e2e-literals` 不进 `pnpm build`/CI，漂移长期不可见（实测基线写 5、HEAD 实际 7）。**拆文件顺手 `--write-baseline` 会把别人的漂移一起吞掉**——正确动作是先回放 HEAD 版本单独计数、看清增量归属，能收口为行内豁免（`// e2e-literal-ok: 理由`）就不要抬高基线。
- **某检查器从未运行过时，首次修好它 = 一次性暴露它攒下的全部存量，要预先算进工作量**：`check-doc-links.mjs` 的块注释被 `spine-lab/**/*.md` 里的 `*/` 提前闭合（HEAD 即有），改写后首次实跑立刻报出 3 条指向已删除文件的「误删引用」。**预期是「修好即红」，不是「修好即绿」。**
- **对 ADR / memory 豁免正文写法规则是对的（历史档案抹平措辞等于篡改历史），但豁免必须是显式声明而非副作用**：检查器**输出必须报告覆盖面与豁免数**，否则「命中 0」会被误读成全覆盖（实测在 `tools/` 放一份含违规内容的 md，命中 0 条）。

## Vercel 部署与产物投递

- **产物布局必须服从托管平台的真实求值顺序，不能靠直觉**：Vercel **先命中文件系统、再走 rewrites**，因此 `{"source":"/"}` 那条 rewrite **永不生效**（`/` 命中 `dist/index.html`）。**「构建产物都对」≠「线上投递正确」——必须用真实 UA 在生产环境验收**，仅在本地跑 build + 守卫必然漏检（投递模型与 `_shell.html` 布局见 ai-discoverability.md）。
- **给托管平台写 rewrite 前先判定「该 URL 在产物里是否已有对应文件」**：有文件则 rewrite 是死规则；无文件才轮到 rewrite。判据可直接用「`/character/99999` 因文件系统无对应文件才落到 rewrite」这类旁证验证。
- **不可逆的产物布局决策（快照数量、rewrite、sitemap）要先算产物量级再决定**：为 2606 个物品新增详情页等于把 1200 个预渲染 HTML 翻近三倍，且必须同步 sitemap / vercel rewrite / 快照覆盖三处（跨模块契约）。**凡「零路由成本」的替代路径（检索 + 悬停）能达成同一目的，就不要开新路由形态。**

## 增量与确定性

- **converter 的增量签名只看源表 mtime/size，改 converter 代码本身不触发重跑**：不加 `--force` 会输出「跳过（未变更）」，产物留在旧字段名上——**极易被误读成「实现没生效」**，已两轮实踩。诊断指令：`python tools/converter/convert.py --only <模块> --force`。
- **转换产物必须做「重跑两次字节一致」的确定性验收**，否则增量与排序的不确定性会伪装成数据变更。改完 converter 先 `--force` 重跑并比对字节，再做其他验证。
- **新增源表依赖必须同批登记 `incremental.MODULE_SOURCES`**：`test_incremental.py` 的 AST 静态扫描会当场抓出漏配——但抓出它的代价是当场返工，登记是纯机械动作，**改 converter 时先登记再跑**，别等守卫报。同一个源表被多个模块读取时每个模块都要登记。
- **落盘顺序会决定「缺一组数据是否带坏整批产物」**：共享表（如等级曲线）必须写在依赖它的详情循环**之前**，否则缺组会污染全部详情。
- **`tools/e2e-literal-baseline.json` 是按文件计数的**：文件改名/拆分后旧键消失、新文件按「基线 0」直接判红（总量不变，只换键）。重生成前后都要核对总数，否则会顺手把真实新增一起豁免掉。
- **`check-doc-links.mjs`（硬门禁）把「HEAD 有、工作区无」的旧路径判为「误删引用」**：拆文件 / 删文件时必须同批改 ADR 与 memory 里指向旧路径的反引号路径与 markdown 链接（历史叙述保留、只换路径说法），否则门禁直接红。
