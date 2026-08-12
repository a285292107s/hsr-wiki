# 官网 Spine 动画播放机制分析

> 分析对象：《崩坏：星穹铁道》官网首页（https://sr.mihoyo.com/）
> 分析版本：4.4（publish_key = `pz_Devp46QZiu`，buildVer 3.22.15）
> 分析方法：config.js 配置解析 + webpack chunk 运行时逆向 + 浏览器 DOM/Canvas 实证
> 结论一句话：官网用 spine-ts 的 Three.js 渲染器把每个角色做成场景中的一个 `SkeletonMesh`，全部放进**同一个 WebGL 场景**，由**单个 rAF 循环**统一 tick + 统一渲染；"多个角色一起播放"靠 `spineList` 数组配置 + 世界坐标（position/scale）+ `renderOrder` 分层实现，而非多个播放器实例叠放。

---

## 一、总体架构

官网是米哈游自研 **Puzzle 平台**（Vue 2.7 + 声明式配置驱动），Spine 动画是其节点能力之一：

```
首页 HTML（仅 4 个 JS 入口）
├── vendor.5f0c457c.js          → 第三方库
├── config.95eb3990.js          → PUZZLE_RENDER_CONFIG 配置（含全部资源清单）
├── setups.3910bb19.js          → webpack 运行时 + 业务组件
└── lib.pc.0091c309.js          → 组件注册表（chunk 416，懒加载）
    └── 727.1b863ea6.js         → 渲染引擎（chunk 727，懒加载，2MB）
```

**渲染组件链**：

```
config.pc.nodes[] 中 name = "@puzzle/spine-player" 的节点
  └─ PzSpinePlayer（Vue 组件，节点渲染器：管理轮播索引/可见性/切换）
       └─ fastsceneSpinePlayer（拆分 spineList → manifest 数组 + spineData 数组）
            └─ 三维渲染组件「spine-player」（1 个 WebGL canvas，id="effectCanvas"）
                 ├─ THREEPlayer（自定义渲染引擎，基于 spine-ts threejs 渲染器）
                 ├─ Scene + OrthographicCamera + WebGLRenderer
                 └─ rAF 渲染循环
```

---

## 二、配置层：一个节点 = 一组 spine 清单

每个 `@puzzle/spine-player` 节点的 `options.spineList[]` 是一组动画项，每项字段：

| 字段 | 含义 |
|---|---|
| `manifest` | 资源清单 `{ atlas, json, img[] }`（skeleton 标注 **Spine 4.2.43**） |
| `spineId` / `spineName` | 骨架逻辑 ID / 场景对象名（如 `TohsakaRin`） |
| `animation` | 默认动画名（本版本统一为 `animation`） |
| `loop` | 是否循环 |
| `visible` | 初始可见性 |
| `posX` / `posY` | 世界坐标偏移（像素，中心原点坐标系） |
| `scale` | 缩放比例 |
| `renderOrder` | 绘制层级（**渲染顺序由它决定，而非数组顺序**） |
| `maxVert` | 骨架网格顶点上限（缺省 2048） |

当前首页共 2 个 spine 节点：

| 节点 ID | spineList | 模式 | 用途 |
|---|---|---|---|
| `pz-ugmWxhsCCJ`（pc.nodes[0]） | **10 层**：`01_bg_pc` 主背景 + 9 层角色/特效（renderOrder 0~9，posX/posY 全 0，scale 1） | 多角色同时播放 | 枢纽页背景群像 |
| `pz-gRE3yO7OWw`（pc.nodes[8]） | **3 个角色**：姬子(270, -730, 1.01)、远坂凛(-90, 0, 0.83)、吉尔伽美什(85, 40, 0.8)，`isSinglePlay: true, initSpineIdx: 1` | 单播切换 | 首页角色展示轮播 |

> 注意背景节点第 10 层 `10_qianjign_pc` 的 `renderOrder: 0`——它是全屏黑色底衬层（multiply 压暗），必须与主背景同层、置于所有角色之下；若按数组顺序直写会盖住全部角色。

---

## 三、核心机制：多个角色 = 同一个场景里的多个 SkeletonMesh

### 3.1 数据转换 `fmtSpineData()`

`fastsceneSpinePlayer` 把配置项转成三维场景对象描述：

```js
// 配置: { scale: 1.01, posX: 270, posY: -730, renderOrder, visible, animation, spineId, maxVert }
return {
  scale:    [scale, scale, scale],      // → 3D 向量
  position: [posX, posY, 0],            // → 3D 世界坐标
  name:     spineName,                  // → 场景对象名（后续按名查找）
  spineId, loop, renderOrder, visible, animation,
  maxVert: maxVert || 2048,             // 顶点预算
  children // 支持嵌套
}
```

### 3.2 场景构建 `THREEPlayer.initScene()`

```js
initScene(conf, scene) {
  conf.children.forEach(child => this.initObject(child, scene, scene));
  scene.children.forEach(obj => this.finalizeObject(obj));
}
```

`createObject()` 按 `type` 分派创建对象：

| type | 创建 |
|---|---|
| 0 | `Object3D`（空组） |
| 1 / 2 | `Mesh` / `SkinnedMesh` |
| **3** | **`createSpine()` → Spine 对象（本报告主角）** |
| 4 | 插件对象（pluginSetting 自定义） |
| 5 | 灯光（Ambient/Directional/Spot/Point） |
| 6 / 7 / 9 | Bone / Camera / Text |

每个对象应用 `uuid / visible / renderOrder`。

### 3.3 Spine 对象创建 `createSpine()`

```js
var s = new SkeletonMesh(spineData.skeleton, 材质回调, 深度材质回调, maxVert, twoColor);
s.playerType = 3;
s.userData.spineId = t.id;
s.state.setAnimation(0, t.defaultAnimation || 第一个动画名, !t.playOnce);  // 立即开始播放（默认循环）
t.trackOffset && (s.state.tracks[0].trackTime += Math.random() * t.trackOffset); // 同骨架多实例随机错峰
s.onTick = this.defaultAnimationSetting.SPINE.bind(s);   // 每帧 tick 钩子（见第四节）
s.playAnimation = function(t, e) { /* 自定义播放 API：mix / speed / loop */ };
```

要点：

- 使用 **spine-ts 的 threejs 渲染器 `SkeletonMesh`**（继承 `Object3D`，顶点/索引缓冲由引擎管理，`maxVert` 为上限）
- 材质由 `shaderSetting.SPINE` 定制：`transparent: true`、`depthTest/depthWrite: false`、normal blending、`opacity` uniform；支持 `twoColor` 双色着色（`defines.TWO_COLOR`）
- **同一骨架数据（SkeletonData）可被多个 SkeletonMesh 实例复用**（`this.spines[id]` 缓存）

### 3.4 相机与坐标系

```js
// onResize()
this.camera.position.set(0, 0, 100);
this.camera.left = -width/2; this.camera.right = width/2;
this.camera.top  = height/2; this.camera.bottom = -height/2;
this.camera.updateProjectionMatrix();
renderer.setSize(width * min(1, devicePixelRatio), height * min(1, devicePixelRatio));
```

- **正交相机世界范围恒等于节点容器尺寸**（官网设计画布 19.2rem×10.8rem = 1920×1080），世界坐标与设计稿像素 1:1，原点居中
- 各层骨架共享统一世界坐标系（posX/posY 均 0）→ 天然对齐，出血部分被画布裁剪
- 渲染分辨率 = 容器尺寸 × `min(1, DPR)`；pixelRatio 钳制 `max(1.5, min(2.5, DPR))`

---

## 四、动画播放循环（多角色如何"一起动"）

```
requestAnimationFrame
  → render()
      → player.tick()
          // 时钟节流：距上帧 >10ms 才推进（100fps 上限）
          // 更新 uniform：delta = min(clock.getDelta(), 0.03)、fps = delta/0.0167、time += delta
          → 返回 true 才渲染
      → renderer.render(scene, camera)
          → 渲染遍历：对场景对象递归
              → t.dispatchEvent({type:"tick", renderer, camera})
              → t.onTick && t.onTick(this, camera)
                  → SkeletonMesh.onTick = SPINE 动画设置
                      → this.update(delta, time)   // spine 骨骼动画推进（state.update → skeleton.update → 顶点缓冲）
          → WebGL 按 renderOrder 排序绘制
```

**关键机制**：官网在渲染遍历中给每个场景对象挂 `onTick` 回调——所有 Spine 角色在**同一帧**内依次推进动画并一次性绘制，天然同步。THREEPlayer 还内置其他 tick 钩子：`SKIN`（animationMixer 模型动画）、`DRAW_MASK`（stencil 遮罩）等。

---

## 五、单角色轮播（isSinglePlay）实现

角色轮播节点**不销毁/重建播放器**，而是**同一场景内切换可见性**：

```
PzSpinePlayer
├─ index（1-based，钳制到 spineList 长度）
├─ singleSpineList = spineList.map(t => ({...t, visible: false}))  // 全部常驻场景、默认隐藏
├─ 切换：switchNext / switchPrev / switchSpine（事件驱动）
│     或 initSpineIdx（配置初始索引，watch 同步）
└─ setSpineIdxAnimation(旧idx, false) + setSpineIdxAnimation(新idx, true)
     → $refs.player（fastsceneSpinePlayer）.setAnimation(t)
         → effect.getSceneMainObject(spineName).visible = visible   // 按名改可见性
         → 动画名变化时才 playAnimation(animation, {loop})
```

- 所有角色资源**一次性加载**进场景，轮播切换零加载延迟
- 场景对象名 = `spineList[].spineName`，与配置一一对应
- `handlePlayerInit` 同步全局状态 `nowActiveIdx`（供外部 UI 联动）

---

## 六、资源加载管线

### 6.1 预加载（纹理）

```js
prepareManifest() {
  manifest 全部 img[].src 追加 ?x-oss-process=image/format,webp/quality,Q_90  // 纹理转 webp
  loader = player.createLoader();
  loader.load(全部纹理URL);
  loader.on("complete") → build3D() + initMainScene() + $emit("buildComplete")
}
```

### 6.2 懒解析（骨架，首次用到才解析并缓存）

```js
initSpineData(spineId) {
  atlas = new TextureAtlas(this.spineSetting[spineId].atlas);
  atlas.pages.forEach(page => page.setTexture(new ThreeJsTexture(getImage(page名去扩展名)))); // 纹理池取图
  skeleton = new SkeletonJson(new AtlasAttachmentLoader(atlas)).readSkeletonData(json);
  this.spines[spineId] = { skeleton, atlas };   // 缓存复用
}
```

### 6.3 降级与容错

| 场景 | 处理 |
|---|---|
| WebGL 创建失败 | `$emit("webglError")` |
| 资源加载失败 | `$emit("loadError")` → 同步全局状态 `canPlaySpine: false`（页面隐藏动画区） |
| 移动端性能 | `resolutionRatio` prop 可降低渲染分辨率；`maxVert` 限制每骨架顶点数 |
| 组件销毁 | dispose 场景全部子对象 + 取消 rAF + 移除 loader 监听 |

---

## 七、浏览器实证

| 节点 | Canvas（DOM） | 渲染尺寸 | 结论 |
|---|---|---|---|
| `pz-ugmWxhsCCJ` 背景 | `div#pz_Devp46QZiupz-ugmWxhsCCJ > .effect-wrap > canvas#effectCanvas`（19.2rem×10.8rem） | 3840×2160（=1920×1080 × DPR 2） | **10 层动画 = 1 个 canvas** |
| `pz-gRE3yO7OWw` 角色轮播 | `div#pz_Devp46QZiupz-gRE3yO7OWw > .effect-wrap > canvas#effectCanvas`（13.708rem×12.518rem） | 2741×2503（≈容器 × 2.08） | **3 个角色 = 1 个 canvas** |

页面全局仅有 2 个 canvas，与"每节点一场景多骨架"的源码分析完全吻合。

---

## 八、对 wiki 的参考价值

| 官网机制 | wiki 现状 | 可借鉴点 |
|---|---|---|
| 单场景多 SkeletonMesh（单 canvas） | `initSpineSceneViewer` 每层一个 SpinePlayer 叠放（多 canvas） | 单 canvas 方案 GPU 上下文更省、天然同步；但 spine-player 组件多实例方案实现成本低 |
| renderOrder 层序 | manifest layers 按 renderOrder 升序（`kind: official-scene`） | 已落地（含黑色底衬层陷阱，见 `./官网Spine动画抓取流程.md`） |
| 1920×1080 世界坐标 + 统一 viewport | viewport 恒为 `{x:-960, y:-540, w:1920, h:1080}` | 已落地 |
| 同场景切 visible 的单播轮播 | 角色页单角色播放（has-anim） | 如需首页多角色轮播可复刻此模式（资源常驻、零切换延迟） |
| maxVert 顶点预算 | 未实现 | 极端骨架可设上限防顶点缓冲爆内存 |
| 纹理 webp 化（Q_90） | 使用原始 png | 加载体积可优化（注意 atlas 映射键需与 page 名一致） |

## 附：涉及文件

- 配置：`https://act.mihoyo.com/puzzle/hkrpg/pz_Devp46QZiu/config.95eb3990.js`（`window.PUZZLE_RENDER_CONFIG`）
- 运行时：`setups.3910bb19.js`（webpack chunk 映射）、`727.1b863ea6.js`（渲染引擎：PzSpinePlayer / fastsceneSpinePlayer / THREEPlayer / spine-threejs）、`lib.pc.0091c309.js`（组件注册表）
- 相关文档：`./官网Spine动画抓取流程.md`、主项目 `docs/adr/0009-官网spine动画增量接入.md`
