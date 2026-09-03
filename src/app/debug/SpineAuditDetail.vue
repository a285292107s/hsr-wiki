<script setup lang="ts">
/**
 * 审核条目展开详情（SpineAuditView 子组件）：
 * 渲染 L0 资源表 / atlas 对照 / L1 元数据 / L2 采样 + 诊断建议 + 动画预览。
 * 预览生命周期随组件挂载/卸载自管理（同一时刻仅一个详情展开，父级保证 v-if 单实例），
 * 模板 ref 不再落入 v-for → 无需「取数组末项」兜底。
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import type { SpineResolved } from '../../services/types';
import type { SpinePlayerInstance } from '../../spine/types';
import { disposePlayer, pickAnimName } from '../../spine/player';
import {
  type AuditEntry,
  buildAuditPlayerConfig, buildDiagnosis, ensureSpineCtor, runtimeVersionFor,
} from './spine-audit';

const props = defineProps<{
  entry: AuditEntry;
  /** 父级按条目所属源解析的结果（null = 不可解析） */
  resolved: SpineResolved | null;
}>();

/** WebGL 上下文占用变化通知（预览实例创建 +1 / 释放 -1），父级汇总 GL 配额 */
const emit = defineEmits<{ glChange: [delta: number] }>();

/** 诊断建议（errors/warnings 变化时随 computed 自动刷新，模板单次求值） */
const diagnosis = computed(() => buildDiagnosis(props.entry));

/** 混合模式去重摘要（如 additive / screen） */
const blendModes = computed(() => {
  const slots = props.entry.meta?.blendSlots;
  if (!slots || !slots.length) return '';
  return [...new Set(slots.map((b) => b.name))].join(' / ');
});

/** 混合 slot 完整明细（title 悬停查看，如 S22:additive S23:additive …） */
const blendDetail = computed(() => {
  const slots = props.entry.meta?.blendSlots;
  if (!slots || !slots.length) return '';
  return slots.map((b) => `S${b.index}:${b.name}`).join(' ');
});

/**
 * 无元数据时的占位文案（按状态区分，防「未运行」被误读为「渲染失败」）：
 * 元数据仅在审核队列 L2 渲染成功后写入，未开跑/排队中的条目 meta 天然为空。
 */
const metaPlaceholder = computed(() => {
  const e = props.entry;
  if (e.renderError) return e.renderError;
  if (e.status === 'running') return '审核进行中…（L2 渲染结算后填充元数据）';
  if (e.status === 'pending') return '尚未运行审核 — 点击顶部「开始审核」后查看元数据';
  return '渲染失败，无元数据';
});

/* ─── 预览 ─── */

const stageRef = ref<HTMLElement | null>(null);
const player = ref<SpinePlayerInstance | null>(null);
const anims = ref<string[]>([]);
const anim = ref('');
const paused = ref(false);
const previewError = ref('');

async function mountPreview(): Promise<void> {
  const resolved = props.resolved;
  if (!resolved) {
    previewError.value = '条目不可解析';
    return;
  }
  const Ctor = await ensureSpineCtor(resolved);
  if (!Ctor) {
    previewError.value = `spine-player ${runtimeVersionFor(resolved)} 运行时加载失败`;
    return;
  }
  const host = stageRef.value;
  if (!host) return;
  host.replaceChildren();
  try {
    const p = new Ctor(host, {
      // 场景条目仅预览主背景层（buildAuditPlayerConfig 缺省 layer 0 + pad 0）
      ...buildAuditPlayerConfig(resolved),
      alpha: true,
      backgroundColor: '00000000',
      premultipliedAlpha: false,
      showControls: false,
      showLoading: false,
      success(pl) {
        const list = ((pl.skeleton && pl.skeleton.data && pl.skeleton.data.animations) || []).map((a) => a.name);
        anims.value = list;
        const def = pickAnimName(list);
        if (def) {
          anim.value = def;
          try {
            pl.setAnimation(def);
            pl.play();
          } catch { /* 静默 */ }
        }
      },
      error(_pl, msg) {
        previewError.value = String(msg);
      },
    });
    player.value = p;
    emit('glChange', 1);
  } catch (e) {
    previewError.value = String(e);
  }
}

function disposePreview(): void {
  if (player.value) {
    disposePlayer(player.value);
    player.value = null;
    emit('glChange', -1);
  }
}

function onAnim(name: string): void {
  anim.value = name;
  const p = player.value;
  if (!p) return;
  try {
    p.setAnimation(name);
    p.play();
    paused.value = false;
  } catch { /* 静默 */ }
}

function togglePause(): void {
  const p = player.value;
  if (!p) return;
  paused.value = !paused.value;
  try {
    if (paused.value) p.pause();
    else p.resume ? p.resume() : p.play(); // 4.1 运行时无 resume，退化为 play
  } catch { /* 静默 */ }
}

onMounted(() => {
  void mountPreview();
});

onBeforeUnmount(() => {
  disposePreview(); // 预览的 WebGL 上下文必须随组件卸载释放，不超浏览器 16 配额
});
</script>

<template>
  <div class="nk-spine-audit__detail">
    <div class="nk-spine-audit__cols">
      <div class="nk-spine-audit__col">
        <h3 class="nk-spine-audit__sub">资源检查（L0）</h3>
        <table class="nk-spine-audit__table">
          <tbody>
            <tr v-for="r in entry.resources" :key="r.url" :class="{ 'is-bad': !r.ok }">
              <td class="nk-spine-audit__td-url">{{ r.url }}</td>
              <td class="nk-spine-audit__td-status">{{ r.status || 'ERR' }}</td>
              <td class="nk-spine-audit__td-ms">{{ r.ms }}ms</td>
            </tr>
          </tbody>
        </table>
        <template v-if="entry.atlasDiffs.length">
          <h3 class="nk-spine-audit__sub">纹理映射对照</h3>
          <div v-for="(d, i) in entry.atlasDiffs" :key="i" class="nk-spine-audit__diff">
            <p class="nk-spine-audit__diff-head">
              atlas pages: {{ d.diff.atlasPages.join(', ') || '—' }}
              <span v-if="d.layer !== null" class="nk-spine-audit__state is-off">层 {{ d.layer + 1 }}</span>
            </p>
            <p v-if="d.diff.missingInAtlas.length" class="nk-spine-audit__diff-bad">映射缺失于 atlas: {{ d.diff.missingInAtlas.join(', ') }}</p>
            <p v-if="d.diff.missingInManifest.length" class="nk-spine-audit__diff-warn">atlas page 未映射: {{ d.diff.missingInManifest.join(', ') }}</p>
            <p v-if="!d.diff.missingInAtlas.length && !d.diff.missingInManifest.length" class="nk-spine-audit__diff-ok">映射一致</p>
          </div>
        </template>
      </div>
      <div class="nk-spine-audit__col">
        <h3 class="nk-spine-audit__sub">骨架元数据（L1）</h3>
        <p v-if="!entry.meta" class="nk-spine-audit__muted">{{ metaPlaceholder }}</p>
        <template v-else>
          <div class="nk-spine-audit__meta-chips">
            <span class="nk-spine-audit__meta-chip">动画 {{ entry.meta.animations.length }}</span>
            <span class="nk-spine-audit__meta-chip">皮肤 {{ entry.meta.skins.length }}</span>
            <span class="nk-spine-audit__meta-chip">slot {{ entry.meta.slots }}</span>
            <span class="nk-spine-audit__meta-chip">骨骼 {{ entry.meta.bones }}</span>
            <span class="nk-spine-audit__meta-chip">附件 {{ entry.meta.attachments }}</span>
          </div>
          <p v-if="entry.meta.blendSlots.length" class="nk-spine-audit__blend" :title="blendDetail">
            混合 slot ×{{ entry.meta.blendSlots.length }}<span v-if="blendModes">（{{ blendModes }}）</span>
          </p>
          <h3 class="nk-spine-audit__sub">像素采样（L2）</h3>
          <table class="nk-spine-audit__table">
            <tbody>
              <tr v-for="f in entry.frames" :key="`${f.layer}-${f.anim}`" :class="{ 'is-bad': f.visible === 0 }">
                <td>{{ f.layer !== null ? `层${f.layer + 1}` : f.anim }}</td>
                <td>{{ (f.ratio * 100).toFixed(2) }}%</td>
                <td v-if="f.bbox">{{ f.bbox.x0 }},{{ f.bbox.y0 }} → {{ f.bbox.x1 }},{{ f.bbox.y1 }}</td>
                <td v-else>—</td>
              </tr>
            </tbody>
          </table>
        </template>
        <h3 class="nk-spine-audit__sub">诊断建议</h3>
        <ul class="nk-spine-audit__advice">
          <li v-for="(a, i) in diagnosis" :key="i">{{ a }}</li>
          <li v-if="diagnosis.length === 0" class="nk-spine-audit__muted">未发现问题</li>
        </ul>
      </div>
    </div>
    <div class="nk-spine-audit__preview">
      <h3 class="nk-spine-audit__sub">
        预览
        <span v-if="resolved && resolved.kind === 'official-scene'" class="nk-spine-audit__state is-off">场景仅主背景层</span>
      </h3>
      <div ref="stageRef" class="nk-spine-audit__stage"></div>
      <p v-if="previewError" class="nk-spine-audit__error" role="alert">{{ previewError }}</p>
      <div class="nk-spine-audit__preview-ctl">
        <select
          v-if="anims.length > 1"
          class="nk-spine-audit__select"
          :value="anim"
          aria-label="预览动画"
          @change="onAnim(($event.target as HTMLSelectElement).value)"
        >
          <option v-for="a in anims" :key="a" :value="a">{{ a }}</option>
        </select>
        <button type="button" class="nk-spine-audit__btn" :disabled="!player" @click="togglePause">
          {{ paused ? '播放' : '暂停' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ─── 详情（两列诊断 + 预览舞台） ─── */
.nk-spine-audit__detail {
  padding: 14px;
  border-left: 2px solid color-mix(in srgb, var(--primary) 45%, transparent);
  background: color-mix(in srgb, var(--bg) 70%, transparent);
}
.nk-spine-audit__cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
@media (max-width: 1024px) {
  .nk-spine-audit__cols { grid-template-columns: 1fr; }
}
.nk-spine-audit__sub {
  margin: 0 0 8px;
  font-family: var(--font-hud);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.16em;
  color: var(--text2);
  text-transform: uppercase;
}
.nk-spine-audit__table {
  width: 100%;
  border-collapse: collapse;
  font-family: ui-monospace, monospace;
  font-size: 11px;
  margin-bottom: 12px;
}
.nk-spine-audit__table td {
  padding: 3px 8px 3px 0;
  border-bottom: 1px solid color-mix(in srgb, var(--text) 7%, transparent);
  vertical-align: top;
}
.nk-spine-audit__table tr.is-bad td { color: #ff9c9c; }
.nk-spine-audit__td-url { word-break: break-all; }
.nk-spine-audit__td-status { text-align: right; white-space: nowrap; }
.nk-spine-audit__td-ms { text-align: right; white-space: nowrap; color: var(--text3); }
.nk-spine-audit__diff { margin-bottom: 10px; }
.nk-spine-audit__diff-head {
  margin: 0 0 4px;
  font-family: ui-monospace, monospace;
  font-size: 11px;
  color: var(--text2);
  word-break: break-all;
}
.nk-spine-audit__diff-bad { margin: 2px 0; font-size: 11px; color: #ff9c9c; word-break: break-all; }
.nk-spine-audit__diff-warn { margin: 2px 0; font-size: 11px; color: #ffd9a3; word-break: break-all; }
.nk-spine-audit__diff-ok { margin: 2px 0; font-size: 11px; color: #b7f2bd; }
.nk-spine-audit__state {
  margin-left: 6px;
  padding: 1px 7px;
  border-radius: 999px;
  font-family: var(--font-hud);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.05em;
  white-space: nowrap;
}
.nk-spine-audit__state.is-off { color: var(--text3); background: color-mix(in srgb, var(--text) 10%, transparent); border: 1px solid color-mix(in srgb, var(--text) 18%, transparent); }
.nk-spine-audit__meta-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}
.nk-spine-audit__meta-chip {
  padding: 2px 8px;
  border-radius: 999px;
  font-family: ui-monospace, monospace;
  font-size: 11px;
  color: var(--text2);
  background: color-mix(in srgb, var(--text) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--text) 14%, transparent);
  white-space: nowrap;
}
.nk-spine-audit__blend {
  margin: 0 0 6px;
  font-family: ui-monospace, monospace;
  font-size: 11px;
  line-height: 1.7;
  color: var(--text3);
  word-break: break-all;
  cursor: help;
}
.nk-spine-audit__muted { margin: 0 0 6px; font-size: 12px; color: var(--text3); }
.nk-spine-audit__advice {
  margin: 0;
  padding-left: 18px;
  font-size: 12px;
  line-height: 1.8;
}
.nk-spine-audit__advice li { color: #ffd9a3; }

/* ─── 预览 ─── */
.nk-spine-audit__preview { margin-top: 16px; }
/* 舞台尺寸跟随容器（最大 640 宽 + 16:9）：Spine canvas 自动 100% 填充 */
.nk-spine-audit__stage {
  width: 100%;
  max-width: 640px;
  aspect-ratio: 16 / 9;
  background:
    linear-gradient(135deg, rgba(10, 15, 30, 0.9) 0%, rgba(19, 26, 46, 0.9) 50%, rgba(10, 15, 30, 0.9) 100%),
    repeating-conic-gradient(#151d33 0% 25%, #0d1326 0% 50%) 0 0 / 24px 24px;
  border: 1px solid color-mix(in srgb, var(--text) 10%, transparent);
  border-radius: 8px;
  overflow: hidden;
}
.nk-spine-audit__preview-ctl {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}
.nk-spine-audit__error {
  margin: 10px 0 0;
  color: #ff6b6b;
  font-size: 13px;
  line-height: 1.6;
  word-break: break-all;
}

/* ─── 详情内控件（与父页同名类隔离，scoped 不穿透） ─── */
.nk-spine-audit__select {
  padding: 3px 8px;
  max-width: 220px;
  font-family: ui-monospace, monospace;
  font-size: 12px;
  color: var(--text);
  background: color-mix(in srgb, var(--bg) 85%, transparent);
  border: 1px solid color-mix(in srgb, var(--text) 24%, transparent);
  border-radius: 6px;
  cursor: pointer;
}
.nk-spine-audit__select:focus-visible { outline: 2px solid var(--primary); outline-offset: 1px; }
.nk-spine-audit__btn {
  padding: 4px 12px;
  font-size: 12px;
  font-family: inherit;
  color: var(--text);
  background: color-mix(in srgb, var(--bg) 80%, transparent);
  border: 1px solid color-mix(in srgb, var(--text) 30%, transparent);
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.18s, border-color 0.18s;
}
.nk-spine-audit__btn:hover:not(:disabled) { border-color: color-mix(in srgb, var(--text) 55%, transparent); }
.nk-spine-audit__btn:active:not(:disabled) { background: color-mix(in srgb, var(--text) 14%, transparent); }
.nk-spine-audit__btn:focus-visible { outline: 2px solid var(--primary); outline-offset: 1px; }
.nk-spine-audit__btn:disabled { opacity: 0.45; cursor: not-allowed; }
</style>
