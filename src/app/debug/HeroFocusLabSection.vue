<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { loadLocalCurrencyRoles, loadLocalCurrencyRole } from '../../services/api';
import type { CurrencyRoleEntry, CurrencyRoleDetail } from '../../services/types';
import { bgStyle, imgAttrs } from '../../lib/image';
import { avatarDrawCardUrl } from '../../lib/icons';
import {
  buildHeroFocusCss, clampFocus, DEFAULT_FOCUS, FOCUS_LIMITS, HERO_FOCUS_ENDPOINT, HERO_POS_VAR,
  getFocusRoles, setFocusRoles, setRoleFocus, removeRoleFocus,
  type HeroFocus, type HeroFocusConfig,
} from '../../services/currency-hero-focus';
import { copyText, downloadJson } from './report';
import { toast } from './lib/toast';

const ENDPOINT = HERO_FOCUS_ENDPOINT;
const route = useRoute();

const roles = ref<CurrencyRoleEntry[]>([]);
const selectedKey = ref('');
const detail = ref<CurrencyRoleDetail | null>(null);
const listLoading = ref(true);
const detailLoading = ref(false);
const listError = ref('');

const configRoles = computed(() => getFocusRoles());
const configError = ref('');

const x = ref(DEFAULT_FOCUS.x);
const y = ref(DEFAULT_FOCUS.y);
const scale = ref(DEFAULT_FOCUS.scale);
const artFailed = ref(false);
const autoState = ref<'idle' | 'pending' | 'saving' | 'error'>('idle');

const artKeys = computed(() => {
  const groups = new Map<string, { key: string; avatarId: string; name: string; ids: string[] }>();
  for (const r of roles.value) {
    const avatarId = String(r.avatar_id || r.id);
    const g = groups.get(avatarId) ?? { key: avatarId, avatarId, name: r.name, ids: [] };
    if (g.name.startsWith('$t:') && !r.name.startsWith('$t:')) g.name = r.name;
    g.ids.push(String(r.id));
    groups.set(avatarId, g);
  }
  return [...groups.values()].sort((a, b) => Number(a.avatarId) - Number(b.avatarId));
});
const current = computed<HeroFocus>(() => clampFocus({ x: x.value, y: y.value, scale: scale.value }));
const savedFocus = computed<HeroFocus | undefined>(() => configRoles.value[selectedKey.value]);
const hasSaved = computed(() => savedFocus.value !== undefined);
const dirty = computed(() => {
  const s = savedFocus.value;
  if (!s) {
    return current.value.x !== DEFAULT_FOCUS.x
      || current.value.y !== DEFAULT_FOCUS.y
      || current.value.scale !== DEFAULT_FOCUS.scale;
  }
  return s.x !== current.value.x || s.y !== current.value.y || s.scale !== current.value.scale;
});

const artUrl = computed(() => (detail.value ? avatarDrawCardUrl(detail.value.avatar_id || detail.value.id) : ''));

const previewStyle = computed<Record<string, string>>(() => ({
  [HERO_POS_VAR]: `${current.value.x}% ${current.value.y}%`,
  [`${HERO_POS_VAR}-scale`]: String(current.value.scale),
}));

const cssSnippet = computed(() => `.nk-crole-hero__bg { ${buildHeroFocusCss(HERO_POS_VAR, current.value)} }`);

const savedList = computed(() =>
  Object.entries(configRoles.value)
    .map(([key, f]) => ({
      key,
      name: artKeys.value.find((a) => a.key === key)?.name ?? `#${key}`,
      focus: f,
    }))
    .sort((a, b) => Number(a.key) - Number(b.key)),
);

const artStyle = computed(() => (
  artFailed.value || !artUrl.value
    ? { background: 'var(--surface)' }
    : bgStyle(artUrl.value)
));

function applyFocus(f: HeroFocus): void {
  x.value = f.x;
  y.value = f.y;
  scale.value = f.scale;
}

async function loadConfig(): Promise<void> {
  configError.value = '';
  try {
    const res = await fetch(ENDPOINT);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as HeroFocusConfig;
    setFocusRoles(data.roles ?? {});
  } catch (e) {
    configError.value = String(e);
  }
}

async function loadDetail(id: string): Promise<void> {
  if (!id) return;
  detailLoading.value = true;
  artFailed.value = false;
  try {
    detail.value = await loadLocalCurrencyRole(id);
  } catch (e) {
    detail.value = null;
    toast('error', `角色详情加载失败：${String(e)}`);
  } finally {
    detailLoading.value = false;
  }
}

async function selectArt(key: string): Promise<void> {
  await flushAutoSave();
  cancelAutoSave();
  detail.value = null;
  applyFocus(configRoles.value[key] ?? DEFAULT_FOCUS);
  selectedKey.value = key;
  const repId = artKeys.value.find((a) => a.key === key)?.ids[0];
  if (repId) await loadDetail(repId);
}

function resetToDefault(): void {
  applyFocus(DEFAULT_FOCUS);
}

function useSaved(): void {
  cancelAutoSave();
  applyFocus(savedFocus.value ?? DEFAULT_FOCUS);
}

async function postRoles(next: Record<string, HeroFocus>): Promise<void> {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roles: next }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;
let chain: Promise<void> = Promise.resolve();

function scheduleAutoSave(): void {
  if (!selectedKey.value || !dirty.value) { autoState.value = 'idle'; return; }
  if (autoSaveTimer) clearTimeout(autoSaveTimer);
  autoState.value = 'pending';
  autoSaveTimer = setTimeout(() => { autoSaveTimer = null; void runAutoSave(); }, 500);
}

function cancelAutoSave(): void {
  if (autoSaveTimer) { clearTimeout(autoSaveTimer); autoSaveTimer = null; }
  if (autoState.value === 'pending') autoState.value = 'idle';
}

function runAutoSave(): Promise<void> {
  chain = chain.then(async () => {
    const key = selectedKey.value;
    if (!key || !dirty.value) { if (autoState.value === 'pending') autoState.value = 'idle'; return; }
    const focus = { ...current.value };
    autoState.value = 'saving';
    try {
      const next = { ...configRoles.value, [key]: focus };
      await postRoles(next);
      setRoleFocus(key, focus);
    } catch (e) {
      autoState.value = 'error';
      toast('error', `自动保存失败：${String(e)}`);
      return;
    }
    if (dirty.value) scheduleAutoSave();
    else autoState.value = 'idle';
  });
  return chain;
}

async function flushAutoSave(): Promise<void> {
  if (autoSaveTimer) { clearTimeout(autoSaveTimer); autoSaveTimer = null; }
  await runAutoSave();
}

watch([x, y, scale], () => { scheduleAutoSave(); });

onBeforeUnmount(() => { void flushAutoSave(); });

async function removeEntry(): Promise<void> {
  const key = selectedKey.value;
  if (!key || !configRoles.value[key]) return;
  if (autoSaveTimer) { clearTimeout(autoSaveTimer); autoSaveTimer = null; }
  autoState.value = 'saving';
  try {
    const next = { ...configRoles.value };
    delete next[key];
    await postRoles(next);
    removeRoleFocus(key);
    applyFocus(DEFAULT_FOCUS);
    toast('success', `已移除角色 ${key} 的背景锚点`);
    autoState.value = 'idle';
  } catch (e) {
    autoState.value = 'error';
    toast('error', `移除失败：${String(e)}`);
  }
}

function exportJson(): void {
  downloadJson({ roles: configRoles.value }, 'currency-hero-focus.json');
  toast('success', '已导出 currency-hero-focus.json');
}

async function copyCss(): Promise<void> {
  const ok = await copyText(cssSnippet.value);
  toast(ok ? 'success' : 'error', ok ? 'CSS 已复制' : '复制失败');
}

function fmt(f: HeroFocus): string {
  return `${Math.round(f.x)}% ${Math.round(f.y)}% ×${f.scale.toFixed(2)}`;
}

onMounted(async () => {
  await loadConfig();
  try {
    const list = await loadLocalCurrencyRoles();
    roles.value = [...list.roles];
    const wantRole = String(route.query.role ?? '');
    const wantArt = wantRole
      ? String(roles.value.find((r) => String(r.id) === wantRole)?.avatar_id ?? wantRole)
      : '';
    const initial = wantArt || String(artKeys.value[0]?.key ?? '');
    if (initial) await selectArt(initial);
  } catch (e) {
    listError.value = String(e);
  } finally {
    listLoading.value = false;
  }
});

watch(
  () => route.query.role,
  async (rid) => {
    if (!rid || listLoading.value) return;
    const art = String(roles.value.find((r) => String(r.id) === String(rid))?.avatar_id ?? rid);
    if (art !== selectedKey.value) await selectArt(art);
  },
);
</script>

<template>
  <section class="nk-hfl">
    <header class="nk-hfl__head">
      <p class="nk-hfl__kicker">HERO FOCUS // 背景立绘锚点</p>
      <h2 class="nk-hfl__title">货币战争角色页 · 背景取景工具</h2>
      <p class="nk-hfl__desc">
        调整 <code>.nk-crole-hero__bg</code> 大立绘的焦点与缩放，避免头部被裁。右侧预览按真实 hero 栅格（1000px 居中、min-height 400、底部左渐变遮罩）渲染，所见即所得。拖动滑杆会<strong>自动保存</strong>（停手约 0.5s 写入）到
        <code>src/data/currency-hero-focus.json</code>，角色详情页立即生效。
      </p>
      <p v-if="configError" class="nk-hfl__warn">配置读写接口不可用（仅 <code>pnpm dev</code> 下提供）：{{ configError }}</p>
    </header>

    <p v-if="listLoading" class="nk-hfl__empty">角色列表加载中…</p>
    <p v-else-if="listError" class="nk-hfl__empty">角色列表加载失败：{{ listError }}</p>

    <div v-else class="nk-hfl__grid">
      <aside class="nk-hfl__side">
        <label class="nk-hfl__label" for="hfl-role">选择角色</label>
        <select
          id="hfl-role"
          class="nk-hfl__select"
          :value="selectedKey"
          @change="selectArt(($event.target as HTMLSelectElement).value)"
        >
          <option v-for="a in artKeys" :key="a.key" :value="a.key">
            {{ a.name }} · ID {{ a.ids.join(' / ') }}{{ a.ids.length > 1 ? '（同素材合并）' : '' }}
          </option>
        </select>

        <div class="nk-hfl__saved">
          <h3 class="nk-hfl__subhead">已配置（{{ savedList.length }}）</h3>
          <ul v-if="savedList.length" class="nk-hfl__savedlist">
            <li v-for="s in savedList" :key="s.key">
              <button
                type="button"
                class="nk-hfl__saveditem"
                :class="{ 'is-active': s.key === selectedKey }"
                @click="selectArt(s.key)"
              >
                <span class="nk-hfl__savedname">{{ s.name }}</span>
                <span class="nk-hfl__savedmeta">{{ s.key }} · {{ fmt(s.focus) }}</span>
              </button>
            </li>
          </ul>
          <p v-else class="nk-hfl__empty">尚无配置，全部角色走默认取景。</p>
          <button type="button" class="nk-hfl__ghost" @click="exportJson">导出 JSON</button>
        </div>
      </aside>

      <div class="nk-hfl__stage">
        <div
          class="nk-hfl__status"
          :class="{ 'is-dirty': autoState === 'pending', 'is-saving': autoState === 'saving', 'is-error': autoState === 'error' }"
          aria-live="polite"
        >
          <span v-if="autoState === 'saving'">⟳ 自动保存中…</span>
          <span v-else-if="autoState === 'error'">⚠ 自动保存失败</span>
          <span v-else-if="autoState === 'pending'">● 待自动保存…</span>
          <span v-else-if="dirty">● 未保存</span>
          <span v-else-if="hasSaved">✓ 已自动保存</span>
          <span v-else>未配置，默认取景</span>
        </div>
        <div class="nk-hfl__preview">
          <div class="nk-hfl__hero" :data-rarity="detail?.rarity ?? 1">
            <div class="nk-hfl__bg" :class="{ 'is-failed': artFailed || !artUrl }" :style="{ ...previewStyle, ...artStyle }"></div>
            <img
              v-if="artUrl && !artFailed"
              class="nk-hfl__probe"
              v-bind="imgAttrs(artUrl)"
              alt=""
              @error="artFailed = true"
            >
            <div class="nk-hfl__scrim"></div>
            <div class="nk-hfl__content">
              <div class="nk-hfl__info">
                <span class="nk-hfl__id">NO.{{ detail?.id ?? '—' }}</span>
                <h4 class="nk-hfl__name">{{ detailLoading ? '加载中…' : (detail?.name ?? '') }}</h4>
              </div>
            </div>
            <span class="nk-hfl__crosshair" :style="{ left: `${current.x}%`, top: `${current.y}%` }"></span>
          </div>
        </div>
        <p class="nk-hfl__hint">十字准星 = 焦点位置（x / y 百分比）；放大围绕焦点进行。</p>
      </div>

      <div class="nk-hfl__controls">
        <div class="nk-hfl__control">
          <label class="nk-hfl__label" for="hfl-x">焦点 X <b>{{ Math.round(current.x) }}%</b></label>
          <input id="hfl-x" v-model.number="x" type="range" min="0" max="100" step="1">
        </div>
        <div class="nk-hfl__control">
          <label class="nk-hfl__label" for="hfl-y">焦点 Y <b>{{ Math.round(current.y) }}%</b></label>
          <input id="hfl-y" v-model.number="y" type="range" min="0" max="100" step="1">
        </div>
        <div class="nk-hfl__control">
          <label class="nk-hfl__label" for="hfl-scale">缩放 <b>{{ current.scale.toFixed(2) }}×</b></label>
          <input id="hfl-scale" v-model.number="scale" type="range" :min="FOCUS_LIMITS.scaleMin" :max="FOCUS_LIMITS.scaleMax" step="0.05">
        </div>

        <div class="nk-hfl__actions">
          <button type="button" class="nk-hfl__ghost" :disabled="!hasSaved" @click="removeEntry">移除配置</button>
          <button type="button" class="nk-hfl__ghost" :disabled="!dirty" @click="useSaved">还原已保存</button>
          <button type="button" class="nk-hfl__ghost" @click="resetToDefault">默认取景</button>
          <button type="button" class="nk-hfl__ghost" @click="copyCss">复制 CSS</button>
        </div>

        <pre class="nk-hfl__code">{{ cssSnippet }}</pre>
      </div>
    </div>
  </section>
</template>

<style scoped>
.nk-hfl {
  max-width: 1480px;
  font-family: var(--font-body);
  color: var(--text);
}

.nk-hfl__head { margin-bottom: 20px; }

.nk-hfl__kicker {
  margin: 0 0 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: var(--font-hud);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.24em;
  color: var(--primary);
  text-transform: uppercase;
}

.nk-hfl__kicker::after {
  content: '';
  flex: none;
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: var(--primary);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--primary) 40%, transparent);
}

.nk-hfl__title {
  margin: 0 0 8px;
  font-family: var(--font-hud);
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--text-bright);
}

.nk-hfl__desc {
  margin: 0;
  max-width: 92ch;
  font-size: 13px;
  line-height: 1.8;
  color: var(--text2);
}

.nk-hfl__desc code,
.nk-hfl__warn code,
.nk-hfl__code {
  font-family: var(--font-hud);
  font-size: 12px;
}

.nk-hfl__warn {
  margin: 10px 0 0;
  padding: 8px 12px;
  font-size: 12px;
  line-height: 1.7;
  color: var(--cw-rarity-4);
  background: color-mix(in srgb, var(--cw-rarity-4) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--cw-rarity-4) 35%, transparent);
  border-radius: var(--nk-radius-2);
}

.nk-hfl__empty {
  font-size: 12px;
  color: var(--text3);
}

.nk-hfl__grid {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr) 300px;
  gap: 20px;
  align-items: start;
}

@media (max-width: 1100px) {
  .nk-hfl__grid { grid-template-columns: 1fr; }
}

.nk-hfl__side,
.nk-hfl__controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
  background: var(--nk-sheet-bg);
  border: 1px solid var(--nk-sheet-border);
  border-radius: var(--nk-radius-3);
  box-shadow: var(--nk-shadow-card);
}

.nk-hfl__label {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text2);
}

.nk-hfl__label b {
  font-family: var(--font-hud);
  font-size: 12px;
  color: var(--primary);
}

.nk-hfl__select {
  width: 100%;
  padding: 8px 10px;
  font-family: inherit;
  font-size: 13px;
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--line-1);
  border-radius: var(--nk-radius-2);
}

.nk-hfl__select:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 1px;
}

.nk-hfl__subhead {
  margin: 4px 0 6px;
  font-family: var(--font-hud);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--text3);
  text-transform: uppercase;
}

.nk-hfl__savedlist {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 0 0 10px;
  padding: 0;
  list-style: none;
  max-height: 260px;
  overflow-y: auto;
}

.nk-hfl__saveditem {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  padding: 7px 9px;
  text-align: left;
  font-family: inherit;
  color: var(--text2);
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--nk-radius-2);
  cursor: pointer;
  transition: background 0.16s var(--nk-ease-out), border-color 0.16s var(--nk-ease-out);
}

.nk-hfl__saveditem:hover { background: color-mix(in srgb, var(--text) 7%, transparent); }
.nk-hfl__saveditem.is-active {
  color: var(--primary);
  background: color-mix(in srgb, var(--primary) 12%, transparent);
  border-color: color-mix(in srgb, var(--primary) 40%, transparent);
}

.nk-hfl__savedname { font-size: 12px; font-weight: 600; }

.nk-hfl__savedmeta {
  font-family: var(--font-hud);
  font-size: 10px;
  color: var(--text3);
}

.nk-hfl__stage {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.nk-hfl__status {
  font-family: var(--font-hud);
  font-size: 11px;
  letter-spacing: 0.06em;
  color: var(--text3);
}

.nk-hfl__status.is-dirty { color: var(--cw-rarity-4); }
.nk-hfl__status.is-saving { color: var(--primary); }
.nk-hfl__status.is-error { color: var(--cw-rarity-4); }

.nk-hfl__preview {
  padding: 14px;
  background: var(--bg);
  border: 1px solid var(--line-1);
  border-radius: var(--nk-radius-3);
}

.nk-hfl__hero {
  position: relative;
  overflow: hidden;
  width: 100%;
  max-width: 1000px;
  min-height: 400px;
  margin: 0 auto;
  background: var(--surface);
}

@media (max-width: 767px) {
  .nk-hfl__hero { min-height: 330px; }
}

.nk-hfl__bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: var(--nk-crole-hero-pos, right center);
  transform: scale(var(--nk-crole-hero-pos-scale, 1));
  transform-origin: var(--nk-crole-hero-pos, right center);
  filter: saturate(0.9) brightness(0.72);
}

.nk-hfl__probe {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.nk-hfl__scrim {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, var(--blk-900) 0%, color-mix(in srgb, var(--blk-900) 70%, transparent) 46%, color-mix(in srgb, var(--blk-900) 15%, transparent) 82%, transparent 100%),
    linear-gradient(0deg, color-mix(in srgb, var(--blk-900) 40%, transparent) 0%, transparent 60%);
}

.nk-hfl__content {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: flex-end;
  min-height: 400px;
  padding: 48px 40px 38px;
}

@media (max-width: 767px) {
  .nk-hfl__content { min-height: 330px; padding: 40px 20px 30px; }
}

.nk-hfl__info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.nk-hfl__id {
  font-family: var(--font-hud);
  font-size: 12px;
  letter-spacing: 0.16em;
  color: var(--metric-val);
}

.nk-hfl__name {
  margin: 0;
  font-size: clamp(20px, 3.4vw, 40px);
  font-weight: 900;
  color: var(--text-bright);
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.55);
}

.nk-hfl__crosshair {
  position: absolute;
  z-index: 3;
  width: 22px;
  height: 22px;
  margin: -11px 0 0 -11px;
  border: 1.5px solid var(--primary);
  border-radius: 999px;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(0, 0, 0, 0.35);
  pointer-events: none;
}

.nk-hfl__crosshair::before,
.nk-hfl__crosshair::after {
  content: '';
  position: absolute;
  background: var(--primary);
}

.nk-hfl__crosshair::before { left: 50%; top: -5px; width: 1px; height: 32px; transform: translateX(-50%); }
.nk-hfl__crosshair::after { top: 50%; left: -5px; height: 1px; width: 32px; transform: translateY(-50%); }

.nk-hfl__hint {
  margin: 0;
  font-size: 11px;
  color: var(--text3);
}

.nk-hfl__control {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.nk-hfl__control input[type="range"] {
  width: 100%;
  accent-color: var(--primary);
}

.nk-hfl__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
}

.nk-hfl__ghost {
  padding: 8px 14px;
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  border-radius: var(--nk-radius-2);
  cursor: pointer;
  color: var(--text2);
  background: transparent;
  border: 1px solid var(--line-1);
  transition: filter 0.16s var(--nk-ease-out), background 0.16s var(--nk-ease-out);
}

.nk-hfl__ghost:hover:not(:disabled) { background: color-mix(in srgb, var(--text) 7%, transparent); }

.nk-hfl__ghost:disabled { opacity: 0.45; cursor: not-allowed; }

.nk-hfl__ghost:focus-visible,
.nk-hfl__saveditem:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }

.nk-hfl__code {
  margin: 4px 0 0;
  padding: 10px;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
  color: var(--text2);
  background: var(--surface);
  border: 1px solid var(--line-1);
  border-radius: var(--nk-radius-2);
}
</style>
