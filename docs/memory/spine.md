# Spine 运行时与抓取

> 补的是 `docs/spine/` 四篇与 ADR 0009 / 0013 / 0024 的盲区：抓取链（publish_key 提取、两种下发形态、输出路径、替代源调研）、黑块成因、renderOrder 层序、viewport 1920×1080、atlas 逻辑名↔hash 映射、OSS 参数、CDX 限流均已由它们完整记载，此处只留重做一次必然再踩的运行时、画布、取证与 CDN 判据。

## 骨架格式与运行时分派

- **spine-ts 4.2 静默丢弃 4.0 格式骨骼的 `"transform"` 字段，姿态错扭却不报错**（1512 上半身扭近 180°）：这类骨骼被当 Normal 全继承解析，而 atlas 页名与 attachment 全自洽，资源检查查不出。官网正常是其内嵌运行时把 `transform` 映射成了 `inherit`。`src/spine/constants.ts`
- **判兼容性看骨架字段，不看版本串**：以 `skeleton.spine` 是否 4.0 系（含 `4.0-from-…` 降级导出）与骨骼 `"transform":"` 计数判定；命中者必须在官方清单条目标 `"runtime": "4.1"`，否则缺省走 4.2 且不报错。`tools/check-spine-manifest.mjs`
- **骨架姿态异常的排查路径**：静态一致性排除资源错配 → 同一 JSON 分别用 4.0.31 与 4.2.43 解析、比对骨骼世界矩阵 → 定位到字段级根因 → 读活动页 `pz_*.js`（内嵌骨架元数据与播放参数）实锤；外层版本页只是壳，读它得不到结论。`src/app/debug/`
- **双运行时不可合并，不要再尝试统一**：nanoka `.skel` 是自定义封装格式（非标准 spine 二进制头，前 32 字节内嵌明文 `4.1.23`），CDN 上 5 种命名模式均无 4.2 格式替代文件。`src/spine/runtime.ts`
- **两个 spine-manifest 的行文格式不同且守卫不校验**：official 是 2 空格缩进、nanoka 是紧凑单行（均 CRLF）；整文件 `JSON.stringify` 重写会破坏格式，只能做定向文本替换。`public/data/cn/spine-manifest-nanoka.json`

## 运行时加载与 window.spine 代理

- **两版 IIFE 都直接赋值全局 `window.spine`（`var spine=` / `window.spine=` / `globalThis.spine=` 三种写法实测都落在同一属性上）**：加载期用 `Object.defineProperty` 把它换成访问器——setter 按当前 `loadingVersion` 把引用记进内部 Map，getter 恒返回主版本 4.2，全局值自始没被污染；`defineProperty` 失败时退回 onload 后从全局捕获，并立刻把 4.2 写回去（否则 4.1 会留在全局）。`src/spine/runtime.ts`
- **运行时注入必须串行**：`loadingVersion` 是单个可变上下文，并发注入时后到者会改写它，先到的 IIFE 被记到错的版本上，且两侧都返回「加载成功」；`injectChain` 逐源排队（任一源结算后才注入下一个）。`src/spine/runtime.ts`
- **4.1.23 的 API 比 4.2 少一截：没有 `fit` / `resume` / `requestFrame`**：4.1 路径必须在构造前删掉 `fit`，并对 `resume` / `requestFrame` 做存在性判断——照抄 4.2 的调用写法在 4.1 上不生效，而类型里的可选标记不会强制你判。`src/spine/player.ts` `src/spine/types.ts`
- **spine-player / spine-webgl 是 CDN IIFE、无本地类型声明**：类型契约只能收口在 `src/spine/types.ts`（松散、按需探测），升级运行时要回归该文件与调试台 L2——字段换了 TS 不报。

## 画布几何与对齐

- **Spine 画布恒带 `transform: scale(1.15)` 越出容器、被 hero 的 `overflow` 裁掉**：用户看不到横向滚动，但整页 `findHorizontalOverflow` 必判红该画布 ⇒ 角色详情页「整页无横向溢出」断言必假红，只能把溢出守卫限定在子树。`src/styles/tokens.css` `e2e/helpers.ts`
- **要让立绘与 Spine 画布一起位移，位移必须落在两者共同祖先上**：画布由播放器自行定位、不写画布 CSS，单改立绘 `background-position` 会与画布错位；容器的 `transform` 已被滚动视差占用。`src/app/character/CharHero.vue`
- **同 key 重建播放器前必须先释放并把容器清空**：角色切换 / 路由离开时先 `disposeSpineEntry(key)` 再新建（容器 `innerHTML` 先清掉），否则旧实例的 WebGL 上下文与 rAF 循环不释放——浏览器 WebGL 上下文数有硬上限，累积后新实例建不出来。`src/app/character/CharHero.vue` `src/app/character/spine.ts`
- **canvas buffer 与舞台 CSS 必须恒 1:1**（buffer 比例 = `viewport` 比例），否则整幅半屏错位；高 DPR 下把舞台 CSS 收缩到 buffer 最长边 ≤ 2560（WebGL 内存），舞台再被 cover 缩放铺满容器。官网 KV 主体落在画布 4%~96% 的中央带 ⇒ cover 在宽屏裁上下、窄屏裁两侧都切不到主体。`src/spine/scene.ts`
- **`camera.position` 是 `Vector3`，`set()` 必须三参全传**：z 传 `undefined` 会污染 view 矩阵（整幅偏斜），而类型上 z 看起来可省、TS 不报。`src/spine/types.ts` `src/spine/scene.ts`
- **多层共享视口的 `pad*` 必须显式传 0 才能关掉 spine-player 默认的 10% 边距**：不传时各层各留 10%，多层骨架按不同边距缩放、层间错位。`src/app/debug/use-scene-pipeline.ts` `src/spine/types.ts`
- **镜流 1212（nanoka `jl`）的整幅场景底板在角色页呈硬边黑块，产品决定暂不处理**：该资产 slot `bg` 是「月夜/水面」整幅 KV 导出（平均亮度 65/255、近黑不透明像素 26%），在 `--bg #121214` 上落地成一块矩形；隐藏底板能去黑块但会连带丢掉场景美术（已由用户否决），换带羽化边的资源前保持原样。其余 14 个带 `bg` 底板的角色（1110 玲可 / 1203 罗刹 / 1308 黄泉 …）底板是正常亮度插画（82~212），本来就不成黑块——判据是底板发光度，不是「有 bg slot」本身。`public/data/cn/spine-manifest-nanoka.json`
- **真要隐藏底板只能走 `update` 钩子逐帧压 `slot.color.a`**：动画每帧回写 slot 颜色、`setViewport` 还会 `setToSetupPose`，一次性 `color.a = 0` 或 `setAttachment(null)` 都会被冲掉（播放与暂停下表现不同，极易误判成「无效」）；`update` 在 `state.apply` 之后、绘制之前调用。`src/spine/player.ts`

## 动画与像素取证

- **动效不冻结就不要做 A/B 像素取证**：Spine 一就绪即自动播放并把立绘压到 `opacity: 0`，视差 lerp 又持续写 `transform`，噪声足以淹没结论；先注入 `.nk-hero__spine{display:none}` + `.nk-hero__bg{opacity:1;transform:none}` 冻结再量，噪声地板归零。`src/app/character/CharHero.vue`
- **判「动画在跑」必须整幅视觉区逐像素帧差**：取被底衬覆盖的区域会因帧差被压掉大半而误判「没动」，随手取一块自由区又可能正落在角色剪影之外（帧差 0）；区域选点法结构性不可靠。`src/app/character/CharHero.vue`
- **两态相减的探针先确认两态之间除被测对象外无其他差异**：Spine 活帧下静态立绘的 `opacity` 已被压到 0，拿它当「纯素材」背景会让掩码全空，得出「重叠 0%」这种方向对、理由错的结论。`src/styles/tokens.css`
- **opacity／帧采样器必须在导航之前武装，采样窗口 ≥ 动画 delay + duration**：`newPage` 加 `waitUntil:'load'` 的开销已够让短动画播完，读到的全是终值，表现与「动画被静默吃掉」完全一样。`e2e/helpers.ts`
- **`fill-mode: backwards` 的动画播完即被丢弃**：`el.getAnimations()` 播完后返回 `count: 0`，当成「动画不存在」会得出相反结论；用 WAAPI 取证必须在动画进行中查询（配 `animation-play-state: paused` 定格），否则只能 rAF 采样 computed 值。`e2e/helpers.ts`
- **后台标签页里的取证证据一律不可用**：元素截图整张全黑、`getAnimations().length` 为 0、canvas 静止，都不是页面缺陷；必须前台执行并同时记录 `visibilityState`。`src/spine/player.ts`
- **Spine 就绪率必须显式记录，不能笼统写「全部角色」**：headless 下抽样会有角色在等待窗口内未就绪而回退立绘卡；且 ≥1024 就绪后真实后景是动画帧而非立绘卡，取证取错态等于测了一个用户看不到的状态。`src/app/character/CharHero.vue`
- **`gl.readPixels` 的行序自底部起（WebGL 约定）**：像素采样与构造 RGBA 缓冲时 y 必须翻转，否则上下颠倒、掩码位置全错且不报错。`src/app/debug/pixels.ts`

## 场景管线

- **上层开关／选项没透传到消费点＝静默退化，静态审查与全绿门禁都查不出**：场景分阶段加载的分层参数未传给 `createScenePipeline` 时静默退回单阶段，唯一证据是网络时序；任何透传参数落地后必须用一次运行时取证确认它真的到达消费点。`src/spine/scene.ts`
- **`AssetManager.loadAll()` 只要任一资源失败就 reject（`errors` 非空），这不是「全部层缺失」**：必须 `.catch(() => undefined)` 后照常进 then、由逐层 `get()` 判缺失（缺失层跳过、局部降级）；把 reject 当整体失败会让单层 404 整场黑屏。`src/spine/scene.ts`
- **生产与调试验收台必须共用同一条 `createScenePipeline`**：调试侧只允许经控制器插桩点（`items` / `canvas` / `setPaused` / `stepOnce`）诊断；另起一条渲染管线即等于「验收基线 ≠ 生产渲染」，且不会有任何报错。`src/spine/scene.ts` `src/app/debug/use-scene-pipeline.ts`
- **GL 一创建就要挂上 teardown 句柄**：资源加载期间 teardown 也必须能回收 WebGL 上下文（旧版在加载完成后才挂，加载期卸载即泄漏上下文，无报错）。`src/spine/scene.ts`

## CDN 双源与占位

- **占位图以 HTTP 200 下发时会绕过整条回退链，「状态码全绿」类检查（含死链审计）永远查不出来**：nanoka 圆头像 1503 的 200 响应内容是游戏内测试贴图、字节数比同类中位数小一个量级，回退源 jsDelivr 还是同一张 ⇒ 判缺失必须比内容。`src/services/cdn/dom.ts`
- **nanoka `assets/hsr/trace/*.webp` 全部是 146 字节的占位图**（RIFF/WEBP 头合法但不是真图标）：trace 的真源只有 jsDelivr，本地缺失时的回退必须落到 jsDelivr 而非 nanoka。`src/services/cdn/base.ts`
- **「双源回退」必须逐分类实测两侧都有资产**：jsDelivr fork 已冻结，新角色与部分分类（如 `avatarroundicon`）在 jsDelivr 侧永久 404；故禁止切回无回退的直拼模式（`USE_OFFICIAL_PATHS=true`），新内容在直拼下必破图。`src/services/cdn/resolve.ts`
- **玩法入口图标只取玩法级默认图（`modeDefaultArtUrl`），不要改回每季 `arts.tab` 页签图**：4 类玩法图标恒定、不随新赛季漂移；fork 冻结后新赛季的页签图在回退源缺失即破图。`src/app/catalog/pages/endgame.ts` `src/app/endgame/EndgameHero.vue`
- **终局素材白名单是「语义闸门」且有两份，装饰函数不得用宽的那份**：`ART_PREFIXES` 只放行赛季主题类前缀（开关图 `UI/Abyss/**` 落空串），`TAB_ART_PREFIXES` 在其上多放行 `UI/Abyss`、只有 `modeDefaultArtUrl` 用它——banner / 海报 / Hero 背景误用宽表就会把开关图当赛季大图渲染，且不报错。前缀与上游字段的对应关系见 `docs/audit/终局内容图标数据源审计.md` §4。`src/app/catalog/pages/endgame.ts`
- **`<picture><source>` 的 404 不会退回 `<img>`**：不能把 picture/source 当回退链用——主源 404 就是破图，回退只能靠委托改写 `src`。`src/services/cdn/dom.ts`
- **入库图标的四个非文档化环节**：① 字形是**纯白 + 透明底**，白底预览看不出内容、`naturalWidth > 0` 也证明不了有内容 ⇒ 必须同批生成**深底大字预览**核对；② 转码走 **PicList 的转码工具**且**必须显式设 `quality=82`**——PicList 缺省 `quality` 是 **100**（`getOutputQuality()` 在 `quality` 缺失/非法时返回 100），不设只能省 32% 而非 83%；③ 参数哨兵：Pillow `Image.open(src).convert('RGBA').save(dst, 'WEBP', quality=82, method=6)` 可**逐字节复现**已入库产物（9/9），但字节只锁 **libwebp 参数、不锁 wrapper**——据此断言「用的是哪个工具」是错的；④ **不要**改用 Chromium 的 `canvas.toDataURL('image/webp')`：实测同输入下 64×64 图标产物约大 1 倍（572 B → 1190 B）且质量 0.8–1.0 全网格无逐字节命中。（裁切口径见 ADR 0044，转码与入库口径决策见 ADR 0057）`public/data/assets/icons/`
- **`img.currentSrc` 要等浏览器异步完成资源选择才有值，元素插入 ≠ 已选源**：靠固定 sleep 兜底它的断言改成条件等待后会偶发拿到空串；紧跟等待之后的 `currentSrc` / `naturalWidth` / 字体度量读取点都要逐个补条件等待。`e2e/helpers.ts`
- **CDN 位图断言有两种不同失败，不能用同一个补丁糊**：慢导致的用 `expect.poll(..., { timeout: 15_000 })`；`loading="lazy"` 在视口外或横向滚动区外是「不触发」，poll 救不回来，必须逐张 `scrollIntoViewIfNeeded()`。`e2e/helpers.ts`
- **`complete` / `naturalWidth` 类断言前面必须有条件等待**：否则它的通过与否取决于跑在它前面的用例是否预热了缓存——Chromium 长期偶然绿、Firefox 立即判红，会被误判成跨引擎缺陷。`e2e/helpers.ts`
- **拍含 `loading="lazy"` 图的区块前必须等块内图片 `complete`**：滚进视口后只等固定毫秒就截图，会把「还没加载」拍成「加载失败」，进而去修不存在的问题。`e2e/helpers.ts`
- **挂起兜底不能把「还没开始拉取」当挂起**：`loading="lazy"` 且尚无 `currentSrc` 的 img 必须等 `loadstart` 后才启动 `CDN_STALL_TIMEOUT_MS` 定时器——屏外图的 `complete` 恒为 false，按它判挂起会把整屏卡片误标 `data-cdn-down` 隐藏。真挂起与真失败同解（降级 + 占位），原 URL 留 `dataset.cdnSrc` 供恢复重载。`src/services/cdn/dom.ts`
- **分类反查靠 nanoka 前缀匹配，注册表顺序是硬约束**：`cdnFallbackFromPrimary` 用 `rest.startsWith(spec.nanoka + '/')` 找分类 ⇒ 宽前缀分类（`gridfight`）必须排在 `gridfight-equipment` / `-icon` / `-affix` 之后，否则会抢走更具体分类的 marker；新增分类先查前缀关系。`src/services/cdn/base.ts` `src/services/cdn/resolve.ts`
- **官方仓库的命途拼写错误不能「改正」**：jsDelivr 路径用 `Pirest`（Priest）/ `Joy`（Elation），改回正确拼写即 404；正反两向映射（`PROFESSION_MAP` / `jsdelivrToNanokaFile`）必须成对维护。`src/services/cdn/jsdelivr.ts`
- **图标路径构造里有两处「不能归一的官方约定」**：① 源数据的怪物图标目录错拼（`MosterIcon/` / `MonsterIcon/` 两种拼法并存）必须统一重写成官方真目录 `monstermiddleicon/`——删掉这段归一即 404；② `gridfight-*` 四个分类的 file 大小写并不统一（`gridfight-asset` / `gridfight-affix` 全小写，`gridfight-equipment` / `gridfight-icon` 保留原始大小写，如 `GridFight_RoleBox1.webp`）——按「统一成一种」去改即 404，且构建与测试都不报。判据以 `public/data/assets/icons/` 的实际文件名为准。`src/lib/icons.ts`
- **1503 圆头像的本地文件不是上游那张**：上游（nanoka 与 jsDelivr 两侧）该文件是游戏内「TEST No.999」占位贴图且 HTTP 200；本地入库的是官方 `avatarshopicon/1503.webp` 裁出的真珠圆像。上游修正后只替换该文件，从上游重取会退回占位图。`public/data/assets/icons/avatarroundicon/1503.webp`
- **`spriteOutputToRel` 与 converter 的目录规则是同一规则的两份实现**：目录段小写、文件名保留（`config.py::_rule_dir_lower`）；改一侧必须同步另一侧，否则终局赛季图拼出的 jsDelivr URL 与仓库布局不再对应。`src/services/cdn/jsdelivr.ts` `tools/converter/config.py`
- **官方源是预留插槽**：`OFFICIAL_BASE` 为空串（无确认可用的官方图床）⇒ 任何分类的 `spec.official` 都不生效，官方优先分支只在基址非空时可达。`src/services/cdn/base.ts`
- **占位图形用 SVG `<path>` 而不是 `<text>`**：`<text>` 字形随宿主字体栈偏移或缺失；data URI 内不能用 `var()`，故取固定中性灰（`check-colors` 对严格中性豁免）。`src/services/cdn/placeholder.ts`
