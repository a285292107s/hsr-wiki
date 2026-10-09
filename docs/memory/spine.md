# Spine 运行时与抓取

> 补的是 `docs/spine/` 四篇与 ADR 0009 / 0013 / 0024 的盲区：抓取链（publish_key 提取、两种下发形态、输出路径、替代源调研）、黑块成因、renderOrder 层序、viewport 1920×1080、atlas 逻辑名↔hash 映射、OSS 参数、CDX 限流均已由它们完整记载，此处只留重做一次必然再踩的运行时、画布、取证与 CDN 判据。

## 骨架格式与运行时分派

- **spine-ts 4.2 静默丢弃 4.0 格式骨骼的 `"transform"` 字段，姿态错扭却不报错**（1512 上半身扭近 180°）：这类骨骼被当 Normal 全继承解析，而 atlas 页名与 attachment 全自洽，资源检查查不出。官网正常是其内嵌运行时把 `transform` 映射成了 `inherit`。`src/spine/constants.ts`
- **判兼容性看骨架字段，不看版本串**：以 `skeleton.spine` 是否 4.0 系（含 `4.0-from-…` 降级导出）与骨骼 `"transform":"` 计数判定；命中者必须在官方清单条目标 `"runtime": "4.1"`，否则缺省走 4.2 且不报错。`tools/check-spine-manifest.mjs`
- **骨架姿态异常的排查路径**：静态一致性排除资源错配 → 同一 JSON 分别用 4.0.31 与 4.2.43 解析、比对骨骼世界矩阵 → 定位到字段级根因 → 读活动页 `pz_*.js`（内嵌骨架元数据与播放参数）实锤；外层版本页只是壳，读它得不到结论。`src/app/debug/`
- **双运行时不可合并，不要再尝试统一**：nanoka `.skel` 是自定义封装格式（非标准 spine 二进制头，前 32 字节内嵌明文 `4.1.23`），CDN 上 5 种命名模式均无 4.2 格式替代文件。`src/spine/runtime.ts`
- **两个 spine-manifest 的行文格式不同且守卫不校验**：official 是 2 空格缩进、nanoka 是紧凑单行（均 CRLF）；整文件 `JSON.stringify` 重写会破坏格式，只能做定向文本替换。`public/data/cn/spine-manifest-nanoka.json`

## 画布几何与对齐

- **Spine 画布恒带 `transform: scale(1.15)` 越出容器、被 hero 的 `overflow` 裁掉**：用户看不到横向滚动，但整页 `findHorizontalOverflow` 必判红该画布 ⇒ 角色详情页「整页无横向溢出」断言必假红，只能把溢出守卫限定在子树。`src/styles/tokens.css` `e2e/helpers.ts`
- **要让立绘与 Spine 画布一起位移，位移必须落在两者共同祖先上**：画布由播放器自行定位、不写画布 CSS，单改立绘 `background-position` 会与画布错位；容器的 `transform` 已被滚动视差占用。`src/app/character/CharHero.vue`

## 动画与像素取证

- **动效不冻结就不要做 A/B 像素取证**：Spine 一就绪即自动播放并把立绘压到 `opacity: 0`，视差 lerp 又持续写 `transform`，噪声足以淹没结论；先注入 `.nk-hero__spine{display:none}` + `.nk-hero__bg{opacity:1;transform:none}` 冻结再量，噪声地板归零。`src/app/character/CharHero.vue`
- **判「动画在跑」必须整幅视觉区逐像素帧差**：取被底衬覆盖的区域会因帧差被压掉大半而误判「没动」，随手取一块自由区又可能正落在角色剪影之外（帧差 0）；区域选点法结构性不可靠。`src/app/character/CharHero.vue`
- **两态相减的探针先确认两态之间除被测对象外无其他差异**：Spine 活帧下静态立绘的 `opacity` 已被压到 0，拿它当「纯素材」背景会让掩码全空，得出「重叠 0%」这种方向对、理由错的结论。`src/styles/tokens.css`
- **opacity／帧采样器必须在导航之前武装，采样窗口 ≥ 动画 delay + duration**：`newPage` 加 `waitUntil:'load'` 的开销已够让短动画播完，读到的全是终值，表现与「动画被静默吃掉」完全一样。`e2e/helpers.ts`
- **`fill-mode: backwards` 的动画播完即被丢弃**：`el.getAnimations()` 播完后返回 `count: 0`，当成「动画不存在」会得出相反结论；用 WAAPI 取证必须在动画进行中查询（配 `animation-play-state: paused` 定格），否则只能 rAF 采样 computed 值。`e2e/helpers.ts`
- **后台标签页里的取证证据一律不可用**：元素截图整张全黑、`getAnimations().length` 为 0、canvas 静止，都不是页面缺陷；必须前台执行并同时记录 `visibilityState`。`src/spine/player.ts`
- **Spine 就绪率必须显式记录，不能笼统写「全部角色」**：headless 下抽样会有角色在等待窗口内未就绪而回退立绘卡；且 ≥1024 就绪后真实后景是动画帧而非立绘卡，取证取错态等于测了一个用户看不到的状态。`src/app/character/CharHero.vue`

## 场景管线

- **上层开关／选项没透传到消费点＝静默退化，静态审查与全绿门禁都查不出**：场景分阶段加载的分层参数未传给 `createScenePipeline` 时静默退回单阶段，唯一证据是网络时序；任何透传参数落地后必须用一次运行时取证确认它真的到达消费点。`src/spine/scene.ts`

## CDN 双源与占位

- **占位图以 HTTP 200 下发时会绕过整条回退链，「状态码全绿」类检查（含死链审计）永远查不出来**：nanoka 圆头像 1503 的 200 响应内容是游戏内测试贴图、字节数比同类中位数小一个量级，回退源 jsDelivr 还是同一张 ⇒ 判缺失必须比内容。`src/services/cdn/dom.ts`
- **nanoka `assets/hsr/trace/*.webp` 全部是 146 字节的占位图**（RIFF/WEBP 头合法但不是真图标）：trace 的真源只有 jsDelivr，本地缺失时的回退必须落到 jsDelivr 而非 nanoka。`src/services/cdn/base.ts`
- **「双源回退」必须逐分类实测两侧都有资产**：jsDelivr fork 已冻结，新角色与部分分类（如 `avatarroundicon`）在 jsDelivr 侧永久 404；故禁止切回无回退的直拼模式（`USE_OFFICIAL_PATHS=true`），新内容在直拼下必破图。`src/services/cdn/resolve.ts`
- **`<picture><source>` 的 404 不会退回 `<img>`**：不能把 picture/source 当回退链用——主源 404 就是破图，回退只能靠委托改写 `src`。`src/services/cdn/dom.ts`
- **入库图标的两个非文档化环节**：字形是纯白 + 透明底，白底预览看不出内容，必须同批生成深底大字预览核对（`naturalWidth > 0` 验不出内容）；转码不引新依赖——用 Playwright 自带 Chromium 的 `canvas.toDataURL('image/webp')`。（裁切口径见 ADR 0044）`public/data/cn/assets/icons/`
- **`img.currentSrc` 要等浏览器异步完成资源选择才有值，元素插入 ≠ 已选源**：靠固定 sleep 兜底它的断言改成条件等待后会偶发拿到空串；紧跟等待之后的 `currentSrc` / `naturalWidth` / 字体度量读取点都要逐个补条件等待。`e2e/helpers.ts`
- **CDN 位图断言有两种不同失败，不能用同一个补丁糊**：慢导致的用 `expect.poll(..., { timeout: 15_000 })`；`loading="lazy"` 在视口外或横向滚动区外是「不触发」，poll 救不回来，必须逐张 `scrollIntoViewIfNeeded()`。`e2e/helpers.ts`
- **`complete` / `naturalWidth` 类断言前面必须有条件等待**：否则它的通过与否取决于跑在它前面的用例是否预热了缓存——Chromium 长期偶然绿、Firefox 立即判红，会被误判成跨引擎缺陷。`e2e/helpers.ts`
- **拍含 `loading="lazy"` 图的区块前必须等块内图片 `complete`**：滚进视口后只等固定毫秒就截图，会把「还没加载」拍成「加载失败」，进而去修不存在的问题。`e2e/helpers.ts`
