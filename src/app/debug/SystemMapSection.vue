<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  DOMAIN_LABEL, DOMAIN_VAR, EDGES, EDGE_KINDS, LAYERS, NODES, TIERS,
  type EdgeKind, type MapEdge, type MapNode,
} from './system-map/map-data';
import { degrees } from './system-map/geometry';
import SystemMapCanvas from './system-map/SystemMapCanvas.vue';

const props = defineProps<{ active?: boolean }>();

const layerById = new Map(LAYERS.map((l) => [l.id, l]));
const tierByGy = new Map(TIERS.map((t) => [t.gy, t]));
const nodeById = new Map(NODES.map((n) => [n.id, n]));
const degreeOf = degrees(EDGES);

const selected = ref<string | null>(null);
const hovered = ref<string | null>(null);
const kind = ref<EdgeKind | 'all'>('all');
const query = ref('');
const panelOpen = ref(false);
const bootKey = ref(0);

watch(() => props.active, (on) => {
  if (on) bootKey.value += 1;
});

const selNode = computed(() => (selected.value ? nodeById.get(selected.value) ?? null : null));
const selLayer = computed(() => (selNode.value ? layerById.get(selNode.value.layer) ?? null : null));
const selTier = computed(() => (selNode.value ? tierByGy.get(selNode.value.gy) ?? null : null));
const selLayerLabel = computed(() => {
  const layer = selLayer.value;
  const node = selNode.value;
  if (!layer || !node) return '';
  return layer.name === node.name ? '' : layer.name;
});

interface LinkRow {
  edge: MapEdge;
  dir: '上游' | '下游';
  other: string;
  otherName: string;
}

const selLinks = computed<LinkRow[]>(() => {
  const id = selected.value;
  if (!id) return [];
  const rows: LinkRow[] = [];
  for (const edge of EDGES) {
    if (edge.from === id) rows.push({ edge, dir: '下游', other: edge.to, otherName: nodeById.get(edge.to)?.name ?? edge.to });
    else if (edge.to === id) rows.push({ edge, dir: '上游', other: edge.from, otherName: nodeById.get(edge.from)?.name ?? edge.from });
  }
  return rows.sort((a, b) => (a.dir === b.dir ? a.edge.label.localeCompare(b.edge.label) : a.dir === '下游' ? -1 : 1));
});

const degreeNow = computed(() => (selected.value ? degreeOf.get(selected.value) ?? 0 : 0));
const upstreamCount = computed(() => selLinks.value.filter((l) => l.dir === '上游').length);
const downstreamCount = computed(() => selLinks.value.filter((l) => l.dir === '下游').length);

const filters = computed(() => [
  { id: 'all' as const, label: '全部', count: EDGES.length },
  ...EDGE_KINDS.map((k) => ({
    id: k.id,
    label: k.label,
    count: EDGES.filter((e) => e.kind === k.id).length,
  })),
]);

const hubs = computed(() =>
  NODES
    .map((n) => ({ node: n, deg: degreeOf.get(n.id) ?? 0 }))
    .sort((a, b) => b.deg - a.deg || a.node.name.localeCompare(b.node.name))
    .slice(0, 5),
);

const tierRows = TIERS.map((t) => ({
  ...t,
  count: NODES.filter((n) => n.gy === t.gy).length,
}));

const selCount = computed(() => selLinks.value.length);

function pick(id: string | null): void {
  selected.value = id;
  if (id) panelOpen.value = true;
}

function closePanel(): void {
  selected.value = null;
  panelOpen.value = false;
}

function kindLabel(id: EdgeKind): string {
  return EDGE_KINDS.find((k) => k.id === id)?.label ?? id;
}

function domVarOf(node: MapNode | null): string {
  if (!node) return DOMAIN_VAR.system;
  const layer = layerById.get(node.layer);
  return layer ? DOMAIN_VAR[layer.domain] : DOMAIN_VAR.system;
}

function domLabelOf(node: MapNode | null): string {
  if (!node) return DOMAIN_LABEL.system;
  const layer = layerById.get(node.layer);
  return layer ? DOMAIN_LABEL[layer.domain] : DOMAIN_LABEL.system;
}
</script>

<template>
  <section class="nk-sysmap" :class="{ 'has-selection': !!selNode, 'is-panel-open': panelOpen }">
    <header class="nk-sysmap__hud">
      <div class="nk-sysmap__brand">
        <p class="nk-sysmap__kicker">SYSTEM ATLAS</p>
        <h2 class="nk-sysmap__title">系统地图</h2>
        <p class="nk-sysmap__lede">
          整站从外部依赖落到本地数据的一条完整链路，按六个层域展开。
          建筑高度＝该模块的接口数，地形段位＝它所在的层域。
        </p>
      </div>
      <dl class="nk-sysmap__readout">
        <div class="nk-sysmap__stat">
          <dt>模块</dt>
          <dd>{{ NODES.length }}</dd>
        </div>
        <div class="nk-sysmap__stat">
          <dt>路径</dt>
          <dd>{{ EDGES.length }}</dd>
        </div>
        <div class="nk-sysmap__stat">
          <dt>层域</dt>
          <dd>{{ TIERS.length }}</dd>
        </div>
      </dl>
    </header>

    <div class="nk-sysmap__toolbar">
      <div class="nk-sysmap__filters" role="group" aria-label="按路径类型筛选">
        <button
          v-for="f in filters"
          :key="f.id"
          type="button"
          class="nk-sysmap__filter"
          :class="{ 'is-on': kind === f.id }"
          :aria-pressed="kind === f.id"
          @click="kind = f.id"
        >
          <svg class="nk-sysmap__swatch" viewBox="0 0 26 8" aria-hidden="true">
            <line x1="1" y1="4" x2="25" y2="4" :class="'is-' + f.id" />
          </svg>
          <span>{{ f.label }}</span>
          <em>{{ f.count }}</em>
        </button>
      </div>

      <label class="nk-sysmap__find">
        <svg class="nk-sysmap__find-icon" viewBox="0 0 16 16" aria-hidden="true">
          <circle cx="7" cy="7" r="4.6" />
          <line x1="10.4" y1="10.4" x2="14" y2="14" />
        </svg>
        <input v-model="query" type="search" placeholder="定位模块" aria-label="按名称定位模块" @keydown.esc="query = ''" />
      </label>

      <button
        type="button"
        class="nk-sysmap__panel-btn"
        :aria-expanded="panelOpen"
        @click="panelOpen = !panelOpen"
      >{{ panelOpen ? '收起面板' : selNode ? '详情' : '说明' }}</button>
    </div>

    <div class="nk-sysmap__grid">
      <div class="nk-sysmap__stage">
        <SystemMapCanvas
          :selected="selected"
          :hovered="hovered"
          :kind="kind"
          :query="query"
          :boot-key="bootKey"
          @select="pick"
          @hover="hovered = $event"
        />
      </div>

      <aside class="nk-sysmap__panel" :class="{ 'is-open': panelOpen }" aria-live="polite">
        <template v-if="selNode">
          <header class="nk-sysmap__panel-head">
            <span class="nk-sysmap__dom" :style="{ '--nk-dom': domVarOf(selNode) }">{{ domLabelOf(selNode) }}</span>
            <button type="button" class="nk-sysmap__close" aria-label="关闭详情" @click="closePanel">×</button>
          </header>
          <h3 class="nk-sysmap__pname">{{ selNode.name }}</h3>
          <p class="nk-sysmap__pen">{{ selNode.en }}<template v-if="selLayerLabel"><span class="nk-sysmap__pdot">·</span>{{ selLayerLabel }}</template><span class="nk-sysmap__pdot">·</span>{{ selTier?.name }}</p>
          <p class="nk-sysmap__pdesc">{{ selNode.desc }}</p>

          <dl class="nk-sysmap__metrics">
            <div><dt>接口</dt><dd>{{ degreeNow }}</dd></div>
            <div><dt>上游</dt><dd>{{ upstreamCount }}</dd></div>
            <div><dt>下游</dt><dd>{{ downstreamCount }}</dd></div>
          </dl>

          <h4 class="nk-sysmap__sub">关键文件</h4>
          <ul class="nk-sysmap__files">
            <li v-for="f in selNode.files" :key="f"><code>{{ f }}</code></li>
          </ul>

          <h4 class="nk-sysmap__sub">关联路径 <em>{{ selCount }}</em></h4>
          <ul class="nk-sysmap__links">
            <li v-for="l in selLinks" :key="l.edge.id">
              <button type="button" class="nk-sysmap__link" @click="pick(l.other)">
                <span class="nk-sysmap__link-top">
                  <span class="nk-sysmap__kind" :class="'is-' + l.edge.kind">{{ kindLabel(l.edge.kind) }}</span>
                  <span class="nk-sysmap__dir">{{ l.dir }}</span>
                  <span class="nk-sysmap__link-other">{{ l.otherName }}</span>
                </span>
                <span class="nk-sysmap__link-label">{{ l.edge.label }}</span>
              </button>
            </li>
          </ul>
        </template>

        <template v-else>
          <header class="nk-sysmap__sheet-head">
            <button type="button" class="nk-sysmap__close" aria-label="收起面板" @click="panelOpen = false">×</button>
          </header>
          <h3 class="nk-sysmap__pname">站点架构总览</h3>
          <p class="nk-sysmap__pen">OVERVIEW · {{ NODES.length }} 模块 / {{ EDGES.length }} 路径</p>
          <p class="nk-sysmap__pdesc">
            本图由当前 main 分支源码静态推导。六段地形自上而下是：外部依赖 → 启动装配 → 页面 → 服务 → 引擎与工具 → 数据生产。
            连线只画真实存在的调用与数据路径。
          </p>

          <h4 class="nk-sysmap__sub">读图</h4>
          <ul class="nk-sysmap__guide">
            <li><b>高度</b>方块越高，接入与接出的路径越多。</li>
            <li><b>颜色</b>站内模块取当前强调色，外部依赖与交付取金色；最下一层（数据生产）同色更暗。</li>
            <li><b>线型</b>实线＝装配调用，流动虚线＝数据加载，点划线＝CDN 网络，点线＝令牌传导，粗实线＝构建部署。</li>
            <li><b>操作</b>拖拽平移、Ctrl/⌘ + 滚轮缩放、双击放大；点方块看文件与上下游，点路径可跳到对端。</li>
          </ul>

          <h4 class="nk-sysmap__sub">层域分布</h4>
          <ul class="nk-sysmap__tiers">
            <li v-for="t in tierRows" :key="t.id" class="nk-sysmap__tierrow">
              <span class="nk-sysmap__tierrow-name">{{ t.name }}</span>
              <span class="nk-sysmap__tierrow-en">{{ t.en }}</span>
              <span class="nk-sysmap__tierrow-n">{{ t.count }}</span>
            </li>
          </ul>

          <h4 class="nk-sysmap__sub">接口最密的模块</h4>
          <ol class="nk-sysmap__hubs">
            <li v-for="h in hubs" :key="h.node.id">
              <button type="button" class="nk-sysmap__hub" @click="pick(h.node.id)">
                <span class="nk-sysmap__hub-name">{{ h.node.name }}</span>
                <span class="nk-sysmap__hub-deg">{{ h.deg }}</span>
              </button>
            </li>
          </ol>
        </template>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.nk-sysmap {
  --nk-stage-h: clamp(460px, calc(100dvh - 372px), 880px);
  max-width: 1560px;
  color: var(--text);
}

.nk-sysmap__hud {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--line-1);
}
.nk-sysmap__brand { min-width: 0; }
.nk-sysmap__kicker {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 6px;
  font-family: var(--font-hud);
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.26em;
  color: var(--primary);
}
.nk-sysmap__kicker::before {
  content: '';
  width: 14px;
  height: 1px;
  background: var(--primary);
}
.nk-sysmap__title {
  margin: 0;
  font-family: var(--font-hud);
  font-size: var(--nk-fs-7);
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--text-bright);
}
.nk-sysmap__lede {
  margin: 7px 0 0;
  max-width: 68ch;
  font-size: var(--nk-fs-4);
  line-height: 1.7;
  color: var(--text2);
}

.nk-sysmap__readout {
  display: flex;
  flex: none;
  margin: 0;
  gap: 26px;
}
.nk-sysmap__stat { display: grid; gap: 2px; justify-items: end; }
.nk-sysmap__stat dt {
  font-family: var(--font-hud);
  font-size: 9px;
  letter-spacing: 0.18em;
  color: var(--text3);
}
.nk-sysmap__stat dd {
  margin: 0;
  font-family: var(--font-hud);
  font-size: var(--nk-fs-6);
  font-weight: 600;
  line-height: 1;
  color: var(--text-bright);
  font-variant-numeric: tabular-nums;
}

.nk-sysmap__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 12px 0 14px;
}
.nk-sysmap__filters { display: flex; flex-wrap: wrap; gap: 6px; }
.nk-sysmap__filter {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px 5px 7px;
  border: 1px solid var(--nk-sheet-item-border);
  border-radius: var(--nk-radius-2);
  background: var(--nk-sheet-item-bg);
  color: var(--text2);
  font-family: inherit;
  font-size: var(--nk-fs-3);
  cursor: pointer;
  transition: border-color 0.18s var(--nk-ease-out), color 0.18s var(--nk-ease-out), background 0.18s var(--nk-ease-out);
}
.nk-sysmap__filter:hover { color: var(--text-bright); background: var(--nk-shell-hover); }
.nk-sysmap__filter.is-on {
  color: var(--text-bright);
  background: var(--nk-shell-active-bg);
  border-color: var(--nk-sheet-border);
}
.nk-sysmap__filter em {
  font-style: normal;
  font-family: var(--font-hud);
  font-size: 9px;
  color: var(--text3);
  font-variant-numeric: tabular-nums;
}
.nk-sysmap__filter.is-on em { color: var(--text2); }

.nk-sysmap__swatch { flex: none; width: 26px; height: 8px; overflow: visible; }
.nk-sysmap__swatch line { stroke: var(--text3); stroke-width: 1.6; stroke-linecap: round; }
.nk-sysmap__swatch .is-all { stroke: var(--text3); }
.nk-sysmap__swatch .is-control { stroke: var(--primary); }
.nk-sysmap__swatch .is-data { stroke: var(--em-400); stroke-dasharray: 5 4; }
.nk-sysmap__swatch .is-cdn { stroke: var(--gold-400); stroke-dasharray: 2 3 7 3; }
.nk-sysmap__swatch .is-theme { stroke: var(--sl-300); stroke-dasharray: 1 4; }
.nk-sysmap__swatch .is-build { stroke: var(--text2); stroke-width: 3; }

.nk-sysmap__find {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  padding: 0 10px;
  height: 30px;
  border: 1px solid var(--nk-sheet-item-border);
  border-radius: var(--nk-radius-2);
  background: var(--nk-input-bg);
  transition: border-color 0.18s var(--nk-ease-out);
}
.nk-sysmap__find:focus-within { border-color: var(--nk-sheet-border); }
.nk-sysmap__find-icon {
  flex: none;
  width: 12px;
  height: 12px;
  fill: none;
  stroke: var(--text3);
  stroke-width: 1.4;
  stroke-linecap: round;
}
.nk-sysmap__find input {
  width: 132px;
  min-width: 0;
  border: 0;
  background: transparent;
  color: var(--text);
  font-family: inherit;
  font-size: var(--nk-fs-3);
  outline: none;
}
.nk-sysmap__find input::placeholder { color: var(--text3); }
.nk-sysmap__find input::-webkit-search-cancel-button { opacity: 0.6; }

.nk-sysmap__panel-btn {
  display: none;
  height: 30px;
  padding: 0 12px;
  border: 1px solid var(--nk-sheet-item-border);
  border-radius: var(--nk-radius-2);
  background: var(--nk-sheet-item-bg);
  color: var(--text2);
  font-family: inherit;
  font-size: var(--nk-fs-3);
  cursor: pointer;
}
.nk-sysmap__panel-btn:hover { color: var(--text-bright); background: var(--nk-shell-hover); }

.nk-sysmap__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 14px;
  align-items: stretch;
}
.nk-sysmap__stage {
  min-width: 0;
  height: var(--nk-stage-h);
}

.nk-sysmap__panel {
  min-width: 0;
  padding: 16px;
  border: 1px solid var(--nk-sheet-border);
  border-radius: var(--nk-radius-card);
  background: var(--nk-sheet-bg);
  box-shadow: var(--nk-shadow-card);
}

.nk-sysmap__sheet-head { display: none; }
.nk-sysmap__panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}
.nk-sysmap__dom {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 9px 2px 7px;
  border: 1px solid color-mix(in srgb, var(--nk-dom) 45%, transparent);
  border-radius: 999px;
  background: color-mix(in srgb, var(--nk-dom) 14%, transparent);
  color: var(--text-bright);
  font-family: var(--font-hud);
  font-size: 9.5px;
  letter-spacing: 0.12em;
}
.nk-sysmap__dom::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 1px;
  background: var(--nk-dom);
}
.nk-sysmap__close {
  flex: none;
  width: 26px;
  height: 26px;
  border: 1px solid var(--nk-sheet-item-border);
  border-radius: var(--nk-radius-2);
  background: var(--nk-shell-hover);
  color: var(--text2);
  font-size: var(--nk-fs-5);
  line-height: 1;
  cursor: pointer;
}
.nk-sysmap__close:hover { color: var(--text-bright); background: var(--nk-shell-press); }

.nk-sysmap__pname {
  margin: 0;
  font-family: var(--font-hud);
  font-size: var(--nk-fs-7);
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--text-bright);
}
.nk-sysmap__pen {
  margin: 5px 0 0;
  font-family: var(--font-hud);
  font-size: 9.5px;
  letter-spacing: 0.12em;
  color: var(--text3);
}
.nk-sysmap__pdot { margin: 0 6px; color: var(--line-2); }
.nk-sysmap__pdesc {
  margin: 12px 0 0;
  font-size: var(--nk-fs-4);
  line-height: 1.75;
  color: var(--text2);
}

.nk-sysmap__metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin: 14px 0 0;
}
.nk-sysmap__metrics > div {
  padding: 8px 10px;
  border: 1px solid var(--nk-sheet-item-border);
  border-radius: var(--nk-radius-2);
  background: var(--nk-sheet-item-bg);
}
.nk-sysmap__metrics dt {
  font-family: var(--font-hud);
  font-size: 9px;
  letter-spacing: 0.14em;
  color: var(--text3);
}
.nk-sysmap__metrics dd {
  margin: 3px 0 0;
  font-family: var(--font-hud);
  font-size: var(--nk-fs-5);
  color: var(--text-bright);
  font-variant-numeric: tabular-nums;
}

.nk-sysmap__sub {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin: 20px 0 8px;
  font-family: var(--font-hud);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.16em;
  color: var(--text3);
}
.nk-sysmap__sub em {
  font-style: normal;
  color: var(--text2);
  font-variant-numeric: tabular-nums;
}

.nk-sysmap__files { list-style: none; margin: 0; padding: 0; display: grid; gap: 5px; }
.nk-sysmap__files code {
  display: block;
  padding: 5px 8px;
  border: 1px solid var(--nk-sheet-item-border);
  border-radius: var(--nk-radius-2);
  background: var(--nk-sheet-item-bg);
  font-family: var(--font-hud);
  font-size: 10px;
  line-height: 1.5;
  color: var(--text2);
  word-break: break-all;
}

.nk-sysmap__links { list-style: none; margin: 0; padding: 0; display: grid; gap: 5px; }
.nk-sysmap__link {
  width: 100%;
  display: grid;
  gap: 3px;
  padding: 7px 9px;
  border: 1px solid var(--nk-sheet-item-border);
  border-radius: var(--nk-radius-2);
  background: var(--nk-sheet-item-bg);
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.18s var(--nk-ease-out), background 0.18s var(--nk-ease-out);
}
.nk-sysmap__link:hover,
.nk-sysmap__link:focus-visible { border-color: var(--nk-sheet-border); background: var(--nk-shell-hover); }
.nk-sysmap__link-top { display: flex; align-items: center; gap: 7px; min-width: 0; }
.nk-sysmap__kind {
  flex: none;
  padding: 0 6px;
  border-radius: var(--nk-radius-1);
  background: color-mix(in srgb, var(--text3) 26%, transparent);
  color: var(--text-bright);
  font-family: var(--font-hud);
  font-size: 8.5px;
  line-height: 15px;
  letter-spacing: 0.04em;
}
.nk-sysmap__kind.is-data { background: color-mix(in srgb, var(--em-400) 32%, transparent); }
.nk-sysmap__kind.is-cdn { background: color-mix(in srgb, var(--gold-400) 30%, transparent); }
.nk-sysmap__kind.is-theme { background: color-mix(in srgb, var(--sl-300) 30%, transparent); }
.nk-sysmap__kind.is-build { background: color-mix(in srgb, var(--text2) 30%, transparent); }
.nk-sysmap__dir { color: var(--text3); font-size: var(--nk-fs-2); }
.nk-sysmap__link-other {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--nk-fs-3);
  color: var(--text-bright);
}
.nk-sysmap__link-label {
  font-size: var(--nk-fs-2);
  line-height: 1.5;
  color: var(--text3);
}

.nk-sysmap__guide {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 8px;
  font-size: var(--nk-fs-3);
  line-height: 1.65;
  color: var(--text2);
}
.nk-sysmap__guide b {
  display: inline-block;
  min-width: 34px;
  font-weight: 600;
  color: var(--text-bright);
}

.nk-sysmap__tiers { list-style: none; margin: 0; padding: 0; display: grid; }
.nk-sysmap__tierrow {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 6px 2px;
  border-bottom: 1px solid var(--line-1);
  font-size: var(--nk-fs-3);
  color: var(--text2);
}
.nk-sysmap__tierrow:last-child { border-bottom: 0; }
.nk-sysmap__tierrow-name { color: var(--text-bright); }
.nk-sysmap__tierrow-en {
  font-family: var(--font-hud);
  font-size: 8.5px;
  letter-spacing: 0.14em;
  color: var(--text3);
}
.nk-sysmap__tierrow-n {
  margin-left: auto;
  font-family: var(--font-hud);
  font-size: var(--nk-fs-2);
  color: var(--text3);
  font-variant-numeric: tabular-nums;
}

.nk-sysmap__hubs { list-style: none; margin: 0; padding: 0; display: grid; gap: 4px; }
.nk-sysmap__hub {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 6px 9px;
  border: 1px solid transparent;
  border-radius: var(--nk-radius-2);
  background: var(--nk-sheet-item-bg);
  font-family: inherit;
  color: var(--text2);
  font-size: var(--nk-fs-3);
  text-align: left;
  cursor: pointer;
}
.nk-sysmap__hub:hover,
.nk-sysmap__hub:focus-visible { color: var(--text-bright); border-color: var(--nk-sheet-item-border); }
.nk-sysmap__hub-deg {
  flex: none;
  font-family: var(--font-hud);
  font-size: var(--nk-fs-2);
  color: var(--text3);
  font-variant-numeric: tabular-nums;
}

@media (min-width: 1280px) {
  .nk-sysmap__grid { grid-template-columns: minmax(0, 1fr) 320px; }
  .nk-sysmap__panel { max-height: var(--nk-stage-h); overflow-y: auto; }
}

@media (max-width: 1279px) {
  .nk-sysmap__panel-btn { display: inline-flex; align-items: center; }
  .nk-sysmap__panel {
    position: fixed;
    left: 12px;
    right: 12px;
    bottom: 12px;
    z-index: 40;
    max-height: 62dvh;
    overflow-y: auto;
    visibility: hidden;
    transform: translateY(110%);
    transition: transform 0.32s var(--nk-ease-out), visibility 0.32s;
  }
  .nk-sysmap__panel.is-open {
    visibility: visible;
    transform: none;
  }
  .nk-sysmap__sheet-head {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 8px;
  }
}

@media (max-width: 767px) {
  .nk-sysmap { --nk-stage-h: clamp(420px, 60dvh, 620px); }
  .nk-sysmap__hud { flex-direction: column; align-items: flex-start; gap: 14px; }
  .nk-sysmap__readout { gap: 22px; }
  .nk-sysmap__stat { justify-items: start; }
  .nk-sysmap__toolbar { gap: 6px; }
  .nk-sysmap__filters {
    flex-wrap: nowrap;
    overflow-x: auto;
    padding-bottom: 2px;
    scrollbar-width: none;
  }
  .nk-sysmap__filters::-webkit-scrollbar { display: none; }
  .nk-sysmap__filter { flex: none; }
  .nk-sysmap__find { margin-left: 0; flex: 1 1 100%; }
  .nk-sysmap__find input { width: 100%; }
  .nk-sysmap__panel-btn { margin-left: auto; }
  .nk-sysmap__panel {
    bottom: calc(var(--nk-nav-bar-h, 56px) + 14px + env(safe-area-inset-bottom, 0px));
    max-height: 56dvh;
  }
}

@media (prefers-reduced-motion: reduce) {
  .nk-sysmap__panel { transition: none; }
}
</style>
