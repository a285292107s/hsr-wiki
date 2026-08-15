<script setup lang="ts">
/**
 * 设置页（路由 /settings 与 /currency/settings，按 meta.cw 切换常规/CW 语境）：
 * 常规主题强调色选择 + 货币战争主题色选择 + 开拓者形态选择。
 * 常规主题：选择经 setAccent 持久化（localStorage）并写入 <html data-accent>，
 * tokens.css 的 [data-accent] 规则重映射 --th-* 色阶，全站主题自动跟随。
 * CW 主题：选择经 setCwAccent 持久化并写入 <html data-cw-accent>，
 * 仅 [data-theme="cw"]（货币战争模式）语境生效，与常规主题互不影响。
 * 开拓者形态：默认女性；常规模式角色列表按性别过滤，CW 列表仅切立绘（female_avatar_id）。
 *
 * 布局家族（v2 反模板化重构）：
 * - 头部右侧「当前主题档案签」：展示激活主题名 + 色阶三点 + 中位 hex
 *   （数据全部来自 theme.ts / cw-theme.ts 的 swatch，禁止写死，防双事实源漂移）
 * - 主题色两区 = 大色板卡（渐变板 + 对勾徽章 + hex 标注）
 * - 开拓者形态 = 名录横条（与全局侧栏激活语言同源：档案竖条 + 淡底）
 * 区块编号与视觉顺序固定：01 = 常规模式主题色，02 = 货币战争主题色，03 = 开拓者形态
 * （两种语境下顺序一致，编号与位置均不随语境交换——防玩家混淆，禁止改回语境置前/交换）
 *
 * 文案分级守则（可见文案只写玩家可感知语义，架构黑话禁止进文案）：
 * - 可写：影响范围（哪些模式生效/互不影响）、缺省值、即时生效并自动保存、形态对内容的影响
 * - 禁止进文案：data-accent/data-cw-accent、语境（meta.cw）、主题档案、黑金外壳、localStorage
 * - hex 标注为 swatch 真实色值（查证型数据，非机制），属粉丝向细节，允许保留
 */
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { ACCENTS, DEFAULT_ACCENT, getSavedAccent, setAccent, type AccentKey } from '../../lib/theme';
import {
  CW_ACCENTS, DEFAULT_CW_ACCENT, getSavedCwAccent, setCwAccent,
  type CwAccentKey,
} from '../../lib/cw-theme';
import {
  DEFAULT_TRAILBLAZER_GENDER, getSavedTrailblazerGender, setTrailblazerGender,
  type TrailblazerGender,
} from '../../lib/trailblazer';

const route = useRoute();
/** 当前是否为货币战争语境（/currency/settings）：驱动头部描述与档案签语境；区块顺序不随语境变化 */
const inCw = computed(() => !!route.meta.cw);

const current = ref<AccentKey>(getSavedAccent());

function choose(key: AccentKey): void {
  setAccent(key);
  current.value = key;
}

const cwCurrent = ref<CwAccentKey>(getSavedCwAccent());

function chooseCw(key: CwAccentKey): void {
  setCwAccent(key);
  cwCurrent.value = key;
}

/** 开拓者形态选项（性别符号 + 名称；默认女性） */
const GENDER_OPTIONS: ReadonlyArray<{ key: TrailblazerGender; label: string; icon: string }> = [
  { key: 'female', label: '女性开拓者', icon: '♀' },
  { key: 'male', label: '男性开拓者', icon: '♂' },
];

const currentGender = ref<TrailblazerGender>(getSavedTrailblazerGender());

function chooseGender(gender: TrailblazerGender): void {
  setTrailblazerGender(gender);
  currentGender.value = gender;
}

/* ─── 头部档案签：当前语境激活主题的档案数据（swatch 三点 + 中位 hex） ─── */
const activeProfile = computed(() => {
  const table = inCw.value ? CW_ACCENTS : ACCENTS;
  const key = inCw.value ? cwCurrent.value : current.value;
  return table.find((a) => a.key === key) ?? table[0];
});

/** 头部描述随语境切换（玩家语言：影响范围 + 即时生效，不写机制词） */
const headDesc = computed(() => (inCw.value
  ? '调整货币战争模式的主色调。只对本模式生效，普通模式配色保持不变。'
  : '调整全站主色调与开拓者形象。选择即时生效并自动保存，与货币战争模式各有独立配色，互不影响。'));

/** 区块编号固定：01 = 常规模式主题色，02 = 货币战争主题色（不随语境交换，防玩家混淆）；CW 语境仅视觉置前 */

/** 对勾徽章路径（stroke-dashoffset 入画动画，见 CSS） */
const CHECK_PATH = 'M5 12.5l4.5 4.5L19 7.5';
</script>

<template>
  <div class="nk-settings">
    <header class="nk-settings__head">
      <div class="nk-settings__head-copy">
        <p class="nk-settings__kicker">设置 · SETTINGS</p>
        <h1>偏好档案</h1>
        <p class="nk-settings__desc">{{ headDesc }}</p>
      </div>
      <div class="nk-settings__tag" aria-label="当前主题">
        <span class="nk-settings__tag-label">当前主题 · ACTIVE THEME</span>
        <span class="nk-settings__tag-name">{{ activeProfile.label }}</span>
        <span class="nk-settings__tag-row">
          <span class="nk-settings__tag-swatch" v-for="(c, i) in activeProfile.swatch" :key="i" :style="{ background: c }" aria-hidden="true"></span>
          <span class="nk-settings__tag-hex">{{ activeProfile.swatch[1] }}</span>
        </span>
      </div>
    </header>

    <div class="nk-settings__sections">
      <section class="nk-settings__section" aria-labelledby="accent-title">
        <h2 id="accent-title" class="nk-title">
          <span class="nk-title__idx">01</span>
          常规模式主题色
        </h2>
        <div class="nk-settings__grid" role="listbox" aria-label="主题强调色">
          <button
            v-for="a in ACCENTS"
            :key="a.key"
            type="button"
            class="nk-swatch"
            :class="{ 'nk-swatch--on': current === a.key }"
            :aria-pressed="current === a.key"
            @click="choose(a.key)"
          >
            <span class="nk-swatch__plate" :style="{ '--sw-a': a.swatch[0], '--sw-b': a.swatch[1], '--sw-c': a.swatch[2] }" aria-hidden="true">
              <span class="nk-swatch__badge">
                <svg viewBox="0 0 24 24" fill="none">
                  <path :d="CHECK_PATH" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </span>
            </span>
            <span class="nk-swatch__meta">
              <span class="nk-swatch__name">{{ a.label }}</span>
              <span class="nk-swatch__hex">{{ a.swatch[1] }}</span>
            </span>
          </button>
        </div>
        <p v-if="current === DEFAULT_ACCENT" class="nk-settings__hint">当前使用默认主题 · 赤陶</p>
      </section>

      <section class="nk-settings__section" aria-labelledby="cw-accent-title">
        <h2 id="cw-accent-title" class="nk-title">
          <span class="nk-title__idx">02</span>
          货币战争主题色
        </h2>
        <div class="nk-settings__grid" role="listbox" aria-label="货币战争主题强调色">
          <button
            v-for="a in CW_ACCENTS"
            :key="a.key"
            type="button"
            class="nk-swatch"
            :class="{ 'nk-swatch--on': cwCurrent === a.key }"
            :aria-pressed="cwCurrent === a.key"
            @click="chooseCw(a.key)"
          >
            <span class="nk-swatch__plate" :style="{ '--sw-a': a.swatch[0], '--sw-b': a.swatch[1], '--sw-c': a.swatch[2] }" aria-hidden="true">
              <span class="nk-swatch__badge">
                <svg viewBox="0 0 24 24" fill="none">
                  <path :d="CHECK_PATH" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </span>
            </span>
            <span class="nk-swatch__meta">
              <span class="nk-swatch__name">{{ a.label }}</span>
              <span class="nk-swatch__hex">{{ a.swatch[1] }}</span>
            </span>
          </button>
        </div>
        <p v-if="cwCurrent === DEFAULT_CW_ACCENT" class="nk-settings__hint">当前使用默认主题 · 香槟金</p>
      </section>
    </div>

    <section class="nk-settings__section" aria-labelledby="trailblazer-title">
      <h2 id="trailblazer-title" class="nk-title">
        <span class="nk-title__idx">03</span>
        开拓者形态
      </h2>
      <div class="nk-seg" role="listbox" aria-label="开拓者性别">
        <button
          v-for="g in GENDER_OPTIONS"
          :key="g.key"
          type="button"
          class="nk-seg__opt"
          :class="{ 'nk-seg__opt--on': currentGender === g.key }"
          :aria-pressed="currentGender === g.key"
          @click="chooseGender(g.key)"
        >
          <span class="nk-seg__symbol" aria-hidden="true">{{ g.icon }}</span>
          <span class="nk-seg__copy">
            <span class="nk-seg__cn">{{ g.label }}</span>
            <span class="nk-seg__en">{{ g.key.toUpperCase() }} TRAILBLAZER</span>
          </span>
          <span class="nk-seg__mark" aria-hidden="true"></span>
        </button>
      </div>
      <p class="nk-settings__hint">常规模式角色列表展示所选性别的开拓者；货币战争模式仅切换立绘形象。<template v-if="currentGender === DEFAULT_TRAILBLAZER_GENDER">当前使用默认形态 · 女性</template></p>
    </section>
  </div>
</template>

<style scoped>
/* ─── 页面骨架：左侧避让导航条（与 Spine Lab 研究线同语言） ─── */
.nk-settings {
  padding: 24px;
  font-family: var(--font-body);
  color: var(--text);
}
@media (min-width: 768px) {
  .nk-settings { margin-left: var(--nk-content-offset); }
}

/* ─── 头部：左文案 + 右「当前主题档案签」（真实 swatch 数据驱动） ─── */
.nk-settings__head {
  max-width: 1480px;
  margin-bottom: 30px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
}
.nk-settings__kicker {
  margin: 0 0 8px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-hud);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.22em;
  color: var(--primary);
  text-transform: uppercase;
}
.nk-settings__kicker::before {
  content: '';
  width: 14px;
  height: 1px;
  background: color-mix(in srgb, var(--th-400) 85%, transparent);
}
.nk-settings__head h1 {
  margin: 0 0 8px;
  font-family: var(--font-hud);
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--text-bright);
}
.nk-settings__desc {
  margin: 0;
  font-size: 13px;
  line-height: 1.7;
  color: var(--text2);
}
/* 档案签：HUD 参数面板质感（墨底 + 细描边 + 采样色点） */
.nk-settings__tag {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 16px;
  min-width: 208px;
  background: var(--nk-sheet-item-bg);
  border: 1px solid var(--nk-sheet-item-border);
  border-radius: var(--nk-radius-card);
  transition: border-color 0.2s var(--nk-ease-out), background 0.2s var(--nk-ease-out);
}
.nk-settings__tag-label {
  font-family: var(--font-hud);
  font-size: 0.55rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  color: var(--text3);
}
.nk-settings__tag-name {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-bright);
  letter-spacing: 0.02em;
}
.nk-settings__tag-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.nk-settings__tag-swatch {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.22);
}
.nk-settings__tag-hex {
  font-family: var(--font-hud);
  font-size: 0.58rem;
  letter-spacing: 0.06em;
  color: var(--text3);
}

/* ─── 主题区排序容器（区块顺序固定：01 常规 → 02 CW → 03 形态，不随语境变化） ─── */
.nk-settings__sections {
  display: flex;
  flex-direction: column;
}

/* ─── 区块 ─── */
.nk-settings__section { max-width: 1480px; }
.nk-settings__section + .nk-settings__section { margin-top: 34px; }
/* 标题行复用全局 .nk-title 原语（HUD 大写 + 编号 + 延伸线），仅收口底部距 */
.nk-settings__section .nk-title { margin-bottom: 16px; }

/* ─── 主题选择：大色板卡（材料感渐变板 + 对勾徽章 + hex 标注） ─── */
.nk-settings__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
}
.nk-swatch {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  text-align: left;
  font-family: inherit;
  color: var(--text);
  background: color-mix(in srgb, var(--bg) 55%, transparent);
  border: 1px solid var(--line-1);
  border-radius: var(--nk-radius-card);
  cursor: pointer;
  transition: border-color 0.18s var(--nk-ease-out), background 0.18s var(--nk-ease-out);
}
.nk-swatch:hover {
  border-color: var(--line-2);
  background: color-mix(in srgb, var(--primary) 6%, transparent);
}
.nk-swatch:active { transform: scale(0.985); }
.nk-swatch--on {
  border-color: var(--nk-shell-active-border);
  background: color-mix(in srgb, var(--primary) 12%, transparent);
}
/* 色板：色阶 300→400→500 渐变 + 釉面高光 + 墨色内描边 */
.nk-swatch__plate {
  position: relative;
  height: 56px;
  border-radius: 8px;
  overflow: hidden;
  background: linear-gradient(90deg, var(--sw-a) 0%, var(--sw-b) 45%, var(--sw-c) 100%);
  box-shadow:
    inset 0 0 0 1px color-mix(in srgb, var(--blk-900) 30%, transparent),
    inset 0 1px 0 rgba(255, 255, 255, 0.16);
  transition: filter 0.18s ease, transform 0.18s var(--nk-ease-out);
}
.nk-swatch__plate::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.04) 38%, transparent 62%);
  pointer-events: none;
}
.nk-swatch:hover .nk-swatch__plate { filter: brightness(1.07); }
.nk-swatch:active .nk-swatch__plate { transform: scale(0.98); }
/* 对勾徽章：墨底圆徽 + 主色对勾，stroke 入画动画（状态切换时勾线画出） */
.nk-swatch__badge {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 1;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: color-mix(in srgb, var(--blk-900) 80%, transparent);
  border: 1px solid color-mix(in srgb, var(--text-bright) 36%, transparent);
  color: var(--metric-val);
  opacity: 0;
  transform: scale(0.6);
  transition: opacity 0.2s var(--nk-ease-out), transform 0.24s var(--nk-ease-spring);
}
.nk-swatch--on .nk-swatch__badge {
  opacity: 1;
  transform: scale(1);
}
.nk-swatch__badge svg { width: 12px; height: 12px; }
.nk-swatch__badge path {
  stroke-dasharray: 24;
  stroke-dashoffset: 24;
  transition: stroke-dashoffset 0.3s var(--nk-ease-out) 0.04s;
}
.nk-swatch--on .nk-swatch__badge path { stroke-dashoffset: 0; }
/* 名称 + hex：悬停/选中时 hex 跟进主色亮端 */
.nk-swatch__meta {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}
.nk-swatch__name { font-size: 14px; font-weight: 600; }
.nk-swatch__hex {
  font-family: var(--font-hud);
  font-size: 0.58rem;
  letter-spacing: 0.04em;
  color: var(--text3);
  transition: color 0.18s;
}
.nk-swatch--on .nk-swatch__hex { color: color-mix(in srgb, var(--metric-val) 62%, transparent); }

/* ─── 开拓者形态：名录横条二选一（与全局侧栏激活语言同源：档案竖条 + 淡底） ─── */
.nk-seg {
  display: grid;
  grid-template-columns: 1fr 1fr;
  max-width: 560px;
  border: 1px solid var(--nk-sheet-item-border);
  border-radius: var(--nk-radius-card);
  overflow: hidden;
  background: var(--nk-sheet-item-bg);
}
.nk-seg__opt {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: transparent;
  border: none;
  color: var(--text2);
  transition: background 0.18s, color 0.18s;
}
.nk-seg__opt + .nk-seg__opt { border-left: 1px solid var(--nk-sheet-item-border); }
.nk-seg__opt:hover { background: var(--nk-shell-hover); color: var(--text); }
/* 激活档案竖条：左侧主色短竖线（与 .ui-sidebar-link--active 语言同源） */
.nk-seg__opt--on { background: var(--nk-shell-active-bg); color: var(--metric-val); }
.nk-seg__opt--on::before {
  content: '';
  position: absolute;
  left: -1px;
  top: 50%;
  transform: translateY(-50%);
  width: 2px;
  height: 62%;
  border-radius: 1px;
  background: var(--primary);
}
.nk-seg__symbol {
  flex: none;
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 15px;
  background: color-mix(in srgb, var(--primary) 8%, transparent);
  color: var(--text3);
  transition: background 0.18s, color 0.18s;
}
.nk-seg__opt--on .nk-seg__symbol {
  background: color-mix(in srgb, var(--primary) 16%, transparent);
  color: var(--metric-val);
}
.nk-seg__copy { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.nk-seg__cn { font-size: 14px; font-weight: 600; white-space: nowrap; }
.nk-seg__en {
  font-family: var(--font-hud);
  font-size: 0.52rem;
  letter-spacing: 0.14em;
  color: var(--text3);
  white-space: nowrap;
}
.nk-seg__mark {
  margin-left: auto;
  flex: none;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--text3);
  opacity: 0.45;
  transition: opacity 0.18s, background 0.18s;
}
.nk-seg__opt--on .nk-seg__mark { background: var(--primary); opacity: 1; }

/* ─── 提示行：主色竖线标注（默认状态 / 语境说明） ─── */
.nk-settings__hint {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 14px 0 0;
  font-size: 12px;
  color: var(--text3);
  line-height: 1.6;
}
.nk-settings__hint::before {
  content: '';
  flex: none;
  width: 3px;
  height: 12px;
  border-radius: 1.5px;
  background: color-mix(in srgb, var(--primary) 70%, transparent);
}

</style>