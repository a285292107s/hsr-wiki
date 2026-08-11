<script setup lang="ts">
/**
 * 设置页（路由 /settings）：预设主题强调色选择。
 * 选择经 setAccent 持久化（localStorage）并写入 <html data-accent>，
 * tokens.css 的 [data-accent] 规则重映射 --th-* 色阶，全站主题自动跟随；
 * 货币战争（CW）黑金模式独立，不受影响。
 */
import { ref } from 'vue';
import { ACCENTS, DEFAULT_ACCENT, getSavedAccent, setAccent, type AccentKey } from '../../lib/theme';

const current = ref<AccentKey>(getSavedAccent());

function choose(key: AccentKey): void {
  setAccent(key);
  current.value = key;
}
</script>

<template>
  <div class="nk-settings">
    <header class="nk-settings__head">
      <p class="nk-settings__kicker">SETTINGS</p>
      <h1>设置</h1>
      <p class="nk-settings__desc">选择常规模式的强调色。货币战争（黑金）独立，不受影响。</p>
    </header>

    <section class="nk-settings__section" aria-labelledby="accent-title">
      <h2 id="accent-title" class="nk-settings__section-title">主题色</h2>
      <div class="nk-settings__grid" role="listbox" aria-label="主题强调色">
        <button
          v-for="a in ACCENTS"
          :key="a.key"
          type="button"
          class="nk-settings__card"
          :class="{ 'nk-settings__card--active': current === a.key }"
          :aria-pressed="current === a.key"
          @click="choose(a.key)"
        >
          <span class="nk-settings__swatch" :style="{ '--sw-a': a.swatch[0], '--sw-b': a.swatch[1], '--sw-c': a.swatch[2] }" aria-hidden="true"></span>
          <span class="nk-settings__meta">
            <span class="nk-settings__name">{{ a.label }}</span>
            <span class="nk-settings__state">{{ current === a.key ? '使用中' : '选择' }}</span>
          </span>
        </button>
      </div>
      <p v-if="current === DEFAULT_ACCENT" class="nk-settings__hint">当前为默认主题 · 赤陶</p>
    </section>
  </div>
</template>

<style scoped>
/* ─── 页面骨架：左侧避让导航条（与 DebugHubView 同语言） ─── */
.nk-settings {
  padding: 24px;
  font-family: var(--font-body);
  color: var(--text);
}
@media (min-width: 768px) {
  .nk-settings { margin-left: 72px; }
}
@media (min-width: 1024px) {
  .nk-settings { margin-left: 148px; }
}

/* ─── 头部 ─── */
.nk-settings__head { max-width: 1480px; margin-bottom: 24px; }
.nk-settings__kicker {
  margin: 0 0 6px;
  font-family: var(--font-hud);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.22em;
  color: var(--primary);
  text-transform: uppercase;
}
.nk-settings__head h1 {
  margin: 0 0 6px;
  font-family: var(--font-hud);
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.08em;
}
.nk-settings__desc {
  margin: 0;
  font-size: 13px;
  line-height: 1.7;
  opacity: 0.72;
}

/* ─── 主题选择 ─── */
.nk-settings__section { max-width: 1480px; }
.nk-settings__section-title {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
}
.nk-settings__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 14px;
}
.nk-settings__card {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 10px;
  padding: 14px;
  text-align: left;
  font-family: inherit;
  color: var(--text);
  background: color-mix(in srgb, var(--bg) 55%, transparent);
  border: 1px solid color-mix(in srgb, var(--text) 14%, transparent);
  border-radius: 10px;
  cursor: pointer;
  transition: border-color 0.18s, background 0.18s, transform 0.18s;
}
.nk-settings__card:hover {
  border-color: var(--primary);
  background: color-mix(in srgb, var(--primary) 10%, transparent);
  transform: translateY(-1px);
}
.nk-settings__card--active {
  border-color: var(--primary);
  background: color-mix(in srgb, var(--primary) 14%, transparent);
}
.nk-settings__swatch {
  display: flex;
  height: 34px;
  border-radius: 8px;
  overflow: hidden;
  background: linear-gradient(90deg, var(--sw-a) 0%, var(--sw-b) 50%, var(--sw-c) 100%);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--text) 12%, transparent);
}
.nk-settings__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.nk-settings__name { font-size: 14px; font-weight: 600; }
.nk-settings__state {
  font-family: var(--font-hud);
  font-size: 10px;
  letter-spacing: 0.12em;
  color: var(--text3);
}
.nk-settings__card--active .nk-settings__state { color: var(--primary); }
.nk-settings__hint {
  margin: 12px 0 0;
  font-size: 12px;
  color: var(--text3);
}
</style>