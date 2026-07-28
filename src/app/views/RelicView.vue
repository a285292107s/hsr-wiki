<script setup lang="ts">
/**
 * 遗器详情页
 * 结构：Hero（套装图 + 基础信息）/ 套装效果（2件/4件）/ 部位（5星部件）/ 主词条（各部位可选）/ 副词条（强化池）
 * 数据：relics.json（按 ID 查找）+ relic_main_affixes.json + relic_sub_affixes.json
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAppStore } from '../stores/app';
import { useRelicStore } from '../stores/relic';
import { fmtDesc, itemIconUrl } from '../../lib/format';
import { CDN, PROP_NAMES, SLOT_ICONS, SLOT_INDEX, SLOT_NAMES } from '../../lib/constants';
import type { LocalRelicPiece, RelicMainAffix, RelicSubAffix } from '../../services/types';

const route = useRoute();
const app = useAppStore();
const relic = useRelicStore();

/* ═══════════ 加载 ═══════════ */

const phase = computed<'loading' | 'error' | 'ready'>(() =>
  relic.error ? 'error' : relic.data ? 'ready' : 'loading',
);
/** 延迟显示骨架屏：加载超过阈值才呈现，缓存命中的快速切换不闪骨架屏 */
const showSkeleton = ref(false);
const SKELETON_DELAY = 150;
let skeletonTimer: ReturnType<typeof setTimeout> | null = null;
watch(phase, (p) => {
  if (p === 'loading') {
    if (skeletonTimer !== null) clearTimeout(skeletonTimer);
    skeletonTimer = setTimeout(() => { showSkeleton.value = true; }, SKELETON_DELAY);
  } else {
    if (skeletonTimer !== null) { clearTimeout(skeletonTimer); skeletonTimer = null; }
    showSkeleton.value = false;
  }
}, { immediate: true });
const d = computed(() => relic.data);

async function load(id: string): Promise<void> {
  try {
    await relic.load(id);
  } catch {
    app.toast('error', `加载失败: ${relic.error || '未知错误'}`);
  }
}
function retry(): void {
  void load(String(route.params.id || ''));
}

onMounted(() => {
  void load(String(route.params.id || ''));
});
watch(
  () => route.params.id,
  (id) => {
    if (id && String(id) !== relic.relicId) void load(String(id));
  },
);

/* ═══════════ Hero ═══════════ */

const figureUrl = computed(() => (d.value ? itemIconUrl(d.value.icon) : ''));
/** 套装类型：含 4 件套需求 → 隧洞遗器；否则 → 位面饰品 */
const isCavern = computed(() => (d.value?.require_num || []).includes(4));
const setTypeLabel = computed(() => (isCavern.value ? '隧洞遗器' : '位面饰品'));
const setTypeEn = computed(() => (isCavern.value ? 'CAVERN RELIC' : 'PLANAR ORNAMENT'));

/* ═══════════ 套装效果 ═══════════ */

const setEffects = computed<{ num: number; html: string }[]>(() => {
  if (!d.value) return [];
  return (d.value.require_num || [])
    .slice()
    .sort((a, b) => a - b)
    .map((num) => ({
      num,
      html: fmtDesc(
        d.value!.descriptions[String(num)],
        (d.value!.param_list && d.value!.param_list[String(num)]) || [],
      ),
    }));
});

/* ═══════════ 部位 ═══════════ */

const pieces = computed<LocalRelicPiece[]>(() => d.value?.pieces || []);

/** 部位专属图标（relicfigures/IconRelic_{setId}_{slotIndex}.webp），加载失败时回退部位通用图标 */
function pieceIconUrl(p: LocalRelicPiece): string {
  return `${CDN}/assets/hsr/relicfigures/IconRelic_${d.value!.id}_${SLOT_INDEX[p.type] ?? 1}.webp`;
}
function slotIconUrl(p: LocalRelicPiece): string {
  return `${CDN}/assets/hsr/relicfigures/${SLOT_ICONS[p.type] || 'IconRelicBody'}.webp`;
}
function onPieceImgError(e: Event, p: LocalRelicPiece): void {
  const img = e.target as HTMLImageElement;
  img.onerror = null;
  img.src = slotIconUrl(p);
}

/* ═══════════ 数值格式化 ═══════════ */

/** 词条数值格式化：百分比属性（基础值 < 1 的比率）保留 1 位小数 + %；速度为小数值保留 1 位；其余平坦值（生命/攻击/防御）取整 */
function fmtAffix(value: number, property: string, baseValue: number): string {
  if (baseValue > 0 && baseValue < 1) return `${(value * 100).toFixed(1)}%`;
  if (property === 'SpeedDelta') return value.toFixed(1);
  return String(Math.round(value));
}

/* ═══════════ 主词条（各部位可选） ═══════════ */

interface PieceAffixGroup {
  piece: LocalRelicPiece;
  affixes: RelicMainAffix[];
}

const pieceAffixGroups = computed<PieceAffixGroup[]>(() =>
  pieces.value.map((piece) => ({
    piece,
    affixes: relic.mainAffixes.filter((a) => a.group_id === piece.main_affix_group),
  })),
);

function mainAffixMax(a: RelicMainAffix, maxLevel: number): number {
  return a.base_value + a.level_add * maxLevel;
}

/* ─── 主词条对比表：行=属性，列=部位，单元格=初始→满值 ─── */

interface MainAffixCell { piece: LocalRelicPiece; affix: RelicMainAffix | null }
interface MainAffixRow {
  property: string;
  name: string;
  cells: MainAffixCell[];
}

/** 对比表列：部位列表 */
const mainAffixColumns = computed<LocalRelicPiece[]>(() => pieces.value);

/** 对比表行：每个属性对应各部位的 affix（无则 null） */
const mainAffixRows = computed<MainAffixRow[]>(() => {
  const props: string[] = [];
  const seen = new Set<string>();
  const cellsByProp = new Map<string, Map<string, RelicMainAffix>>();
  for (const g of pieceAffixGroups.value) {
    for (const a of g.affixes) {
      if (!seen.has(a.property)) {
        seen.add(a.property);
        props.push(a.property);
        cellsByProp.set(a.property, new Map());
      }
      cellsByProp.get(a.property)!.set(String(g.piece.id), a);
    }
  }
  return props.map((prop) => ({
    property: prop,
    name: PROP_NAMES[prop] || prop,
    cells: mainAffixColumns.value.map((piece) => ({
      piece,
      affix: cellsByProp.get(prop)?.get(String(piece.id)) || null,
    })),
  }));
});

/* ═══════════ 副词条（强化池） ═══════════ */

const subAffixList = computed<RelicSubAffix[]>(() => {
  const group = pieces.value[0]?.sub_affix_group;
  if (group == null) return [];
  return relic.subAffixes.filter((a) => a.group_id === group);
});

/** 副词条数值档位 = step_num + 1（BaseValue 是最高档，每档递减 step_value） */
function subAffixTierCount(a: RelicSubAffix): number {
  return (a.step_num ?? 0) + 1;
}

/** 单条副词条的所有数值档位（从低到高排列） */
function subAffixTiers(a: RelicSubAffix): number[] {
  const count = subAffixTierCount(a);
  return Array.from({ length: count }, (_, i) => a.base_value - a.step_value * (a.step_num - i));
}

/** 满级强化信息：+15 遗器在 +3/+6/+9/+12/+15 共 5 次强化，单条满值倍率 = 1 初始 + 5 = 6 */
const enhanceInfo = computed(() => {
  const maxLevel = pieces.value[0]?.max_level ?? 15;
  const rolls = Math.floor(maxLevel / 3);
  return { maxLevel, rolls, multiplier: 1 + rolls };
});

/** 单条副词条理论满值：最高档（=base_value）× (1 初始 + 满级强化次数) */
function subAffixMax(a: RelicSubAffix): number {
  return a.base_value * enhanceInfo.value.multiplier;
}

/* ═══════════ 遗器来历（部位故事） ═══════════ */

interface PieceStoryItem {
  piece: LocalRelicPiece;
  /** 部位名（作为故事标题） */
  name: string;
  /** 题记 HTML */
  descHtml: string;
  /** 正文 HTML */
  storyHtml: string;
}

/** 来历文本 → HTML：字面量 \n 转 <br>，保留 <i> 对话标签 */
function toStoryHtml(text: string): string {
  return text.replace(/\\n/g, '<br>');
}

const pieceStories = computed<PieceStoryItem[]>(() => {
  if (!d.value) return [];
  const setStories = relic.stories[String(d.value.id)] || {};
  const items: PieceStoryItem[] = [];
  for (const piece of pieces.value) {
    const s = setStories[piece.type];
    if (s && s.story) {
      items.push({
        piece,
        name: s.name,
        descHtml: s.desc ? toStoryHtml(s.desc) : '',
        storyHtml: toStoryHtml(s.story),
      });
    }
  }
  return items;
});

/* ═══════════ 主词条表横向滚动检测 ═══════════ */

/** 表格内容溢出时显示右侧渐变提示；滚到末尾移除提示 */
const affixWrapRef = ref<HTMLElement | null>(null);
const affixScrollable = ref(false);
let affixRo: ResizeObserver | null = null;

function checkAffixOverflow(): void {
  const el = affixWrapRef.value;
  if (!el) { affixScrollable.value = false; return; }
  affixScrollable.value = el.scrollWidth > el.clientWidth + 2;
}
function onAffixScroll(): void {
  const el = affixWrapRef.value;
  if (!el) return;
  // 滚到末尾时移除渐变提示（已无更多内容可看）
  const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
  affixScrollable.value = !atEnd && el.scrollWidth > el.clientWidth + 2;
}

watch(
  () => [phase.value, mainAffixRows.value.length] as const,
  () => {
    void nextTick(() => {
      if (affixRo) { affixRo.disconnect(); affixRo = null; }
      if (affixWrapRef.value) {
        affixRo = new ResizeObserver(checkAffixOverflow);
        affixRo.observe(affixWrapRef.value);
      }
      checkAffixOverflow();
    });
  },
);

/* ═══════════ 卸载清理 ═══════════ */

onBeforeUnmount(() => {
  if (skeletonTimer !== null) clearTimeout(skeletonTimer);
  if (affixRo) { affixRo.disconnect(); affixRo = null; }
  relic.reset();
});
</script>

<template>
  <div class="nk-page--detail" :aria-busy="phase === 'loading'">
    <!-- ─── 加载骨架屏（延迟显示，缓存命中不闪屏） ─── -->
    <div
      v-if="phase === 'loading' && showSkeleton"
      class="nk-skeleton nk-skeleton--relic"
      role="status"
      aria-live="polite"
      aria-label="遗器详情加载中"
    >
      <div class="nk-skeleton__hero">
        <div class="nk-skeleton__hero-visual">
          <div class="nk-sk nk-sk--shimmer nk-sk--fill"></div>
        </div>
        <div class="nk-skeleton__hero-panel">
          <div class="nk-sk nk-sk--shimmer nk-sk--title nk-sk--bar-lg"></div>
          <div class="nk-sk nk-sk--shimmer nk-sk--text-sm nk-sk--bar-md"></div>
          <div style="display:flex;gap:8px;">
            <div class="nk-sk nk-sk--shimmer nk-sk--chip nk-sk--bar-sm"></div>
            <div class="nk-sk nk-sk--shimmer nk-sk--chip" style="width:60px;"></div>
          </div>
        </div>
      </div>
      <div class="nk-skeleton__body">
        <div class="nk-sk nk-sk--shimmer nk-sk--block-md"></div>
        <div class="nk-sk nk-sk--shimmer nk-sk--block-lg"></div>
      </div>
    </div>

    <!-- ─── 错误态 ─── -->
    <div v-else-if="phase === 'error'" class="nk-error-state">
      <div class="nk-error-state__icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <path d="M12 9v4" /><path d="M12 17h.01" />
        </svg>
      </div>
      <div class="nk-error-state__title">遗器数据加载失败</div>
      <div v-if="relic.error" class="nk-error-state__detail">{{ relic.error }}</div>
      <button class="nk-error-state__retry" type="button" @click="retry">RETRY</button>
    </div>

    <!-- ─── 正文 ─── -->
    <template v-else-if="d">
      <!-- Hero -->
      <div class="nk-hero nk-hero--relic">
        <div class="nk-hero__visual">
          <div
            class="nk-hero__bg nk-hero__bg--relic"
            :style="{ backgroundImage: `url(${figureUrl})` }"
          ></div>
          <div class="nk-hero__scrim"></div>
        </div>
        <div class="nk-hero__panel">
          <header class="nk-hero__head">
            <h1 class="nk-hero__name">{{ d.name }}</h1>
            <div class="nk-hero__meta">
              <span class="nk-hero__tag nk-relic-type-badge" :class="isCavern ? 'nk-relic-type-badge--cavern' : 'nk-relic-type-badge--planar'">
                {{ setTypeLabel }}
              </span>
              <span v-if="d.release_version" class="nk-hero__tag nk-relic-ver">v{{ d.release_version }}</span>
              <span class="nk-hero__id">
                <span class="nk-hero__id-num">{{ d.id }}</span>
              </span>
            </div>
            <div class="nk-relic-type-en">{{ setTypeEn }}</div>
          </header>

          <!-- 部位预览：图标 + 部位名标签，网格布局 -->
          <section v-if="pieces.length" class="nk-hero__section">
            <div class="nk-hero__section-title">
              <span class="nk-hero__section-bar"></span>
              <span>部位</span>
              <span class="nk-relic-count">{{ pieces.length }} 件</span>
            </div>
            <div class="nk-relic-hero-pieces">
              <div
                v-for="p in pieces"
                :key="p.id"
                class="nk-relic-hero-piece"
                :title="SLOT_NAMES[p.type] || p.type"
              >
                <div class="nk-relic-hero-piece__img">
                  <img :src="pieceIconUrl(p)" :alt="SLOT_NAMES[p.type] || p.type" loading="lazy" @error="onPieceImgError($event, p)">
                </div>
                <span class="nk-relic-hero-piece__slot">{{ SLOT_NAMES[p.type] || p.type }}</span>
              </div>
            </div>
          </section>
        </div>
      </div>

      <!-- 内容面板 -->
      <div class="nk-tabs">
        <div class="nk-tabs__bar">
          <div class="nk-tabs__left">
            <button
              v-for="t in relic.TABS"
              :key="t.key"
              type="button"
              :class="['nk-tab', { 'nk-tab--active': relic.activeTab === t.key }]"
              @click="relic.setTab(t.key)"
            >{{ t.label }}</button>
          </div>
        </div>
      </div>

      <div class="nk-panels">
        <!-- 套装效果 -->
        <div :class="['nk-panel nk-panel--relic', { 'nk-panel--active': relic.activeTab === 'effect' }]" data-panel="effect">
          <template v-if="setEffects.length">
            <div class="nk-relic-effects">
              <div
                v-for="eff in setEffects"
                :key="eff.num"
                class="nk-relic-effect"
              >
                <div class="nk-relic-effect__head">
                  <span class="nk-relic-effect__num">{{ eff.num }}件套</span>
                </div>
                <div class="nk-relic-effect__desc" v-html="eff.html"></div>
              </div>
            </div>
          </template>
        </div>

        <!-- 主词条 -->
        <div :class="['nk-panel nk-panel--relic', { 'nk-panel--active': relic.activeTab === 'main' }]" data-panel="main">
          <template v-if="mainAffixRows.length">
            <div class="nk-relic-affix-note">初始 → 满级（+{{ pieces[0]?.max_level || 15 }}）</div>
            <div
              ref="affixWrapRef"
              class="nk-relic-affix-table-wrap"
              :class="{ 'is-scrollable': affixScrollable }"
              @scroll.passive="onAffixScroll"
            >
              <table class="nk-relic-affix-table">
                <thead>
                  <tr>
                    <th class="nk-relic-affix-table__prop-h">词条</th>
                    <th
                      v-for="p in mainAffixColumns"
                      :key="p.id"
                      class="nk-relic-affix-table__slot-h"
                    >
                      <img class="nk-relic-affix-table__icon" :src="pieceIconUrl(p)" :alt="SLOT_NAMES[p.type] || p.type" loading="lazy" @error="onPieceImgError($event, p)">
                      <span class="nk-relic-affix-table__slot-name">{{ SLOT_NAMES[p.type] || p.type }}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in mainAffixRows" :key="row.property">
                    <td class="nk-relic-affix-table__prop">{{ row.name }}</td>
                    <td v-for="cell in row.cells" :key="cell.piece.id" class="nk-relic-affix-table__cell">
                      <template v-if="cell.affix">
                        <span class="nk-relic-affix-table__init">{{ fmtAffix(cell.affix.base_value, row.property, cell.affix.base_value) }}</span>
                        <span class="nk-relic-affix-table__arrow">→</span>
                        <span class="nk-relic-affix-table__max">{{ fmtAffix(mainAffixMax(cell.affix, cell.piece.max_level), row.property, cell.affix.base_value) }}</span>
                      </template>
                      <span v-else class="nk-relic-affix-table__empty" aria-label="该部位无此词条">—</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>
        </div>

        <!-- 副词条 -->
        <div :class="['nk-panel nk-panel--relic', { 'nk-panel--active': relic.activeTab === 'sub' }]" data-panel="sub">
          <template v-if="subAffixList.length">
            <div class="nk-relic-submeta">
              <div class="nk-relic-submeta__badges">
                <span class="nk-relic-submeta__badge">
                  <span class="nk-relic-submeta__val">{{ subAffixTierCount(subAffixList[0]) }}</span>
                  <span class="nk-relic-submeta__lbl">数值档位</span>
                </span>
                <span class="nk-relic-submeta__badge">
                  <span class="nk-relic-submeta__val">+{{ enhanceInfo.maxLevel }}</span>
                  <span class="nk-relic-submeta__lbl">满级</span>
                </span>
                <span class="nk-relic-submeta__badge">
                  <span class="nk-relic-submeta__val">{{ enhanceInfo.rolls }}</span>
                  <span class="nk-relic-submeta__lbl">次强化</span>
                </span>
                <span class="nk-relic-submeta__badge nk-relic-submeta__badge--accent">
                  <span class="nk-relic-submeta__val">×{{ enhanceInfo.multiplier }}</span>
                  <span class="nk-relic-submeta__lbl">满值倍率</span>
                </span>
              </div>
              <p class="nk-relic-submeta__hint">
                掉落随机取 1 档；强化在 +3/+6/+9/+12/+15 随机累加 1 条 1 档，理论满值 = 最高档 × {{ enhanceInfo.multiplier }}。
              </p>
            </div>
            <div class="nk-relic-subgrid">
              <div v-for="a in subAffixList" :key="a.affix_id" class="nk-relic-subcell">
                <div class="nk-relic-subcell__head">
                  <span class="nk-relic-subcell__name">{{ PROP_NAMES[a.property] || a.property }}</span>
                  <span class="nk-relic-subcell__max">满值 {{ fmtAffix(subAffixMax(a), a.property, a.base_value) }}</span>
                </div>
                <div class="nk-relic-subcell__tiers">
                  <span
                    v-for="(t, i) in subAffixTiers(a)"
                    :key="i"
                    class="nk-relic-subcell__tier"
                    :title="`第 ${i + 1} 档`"
                  >{{ fmtAffix(t, a.property, a.base_value) }}</span>
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- 遗器来历 -->
        <div :class="['nk-panel nk-panel--relic', { 'nk-panel--active': relic.activeTab === 'story' }]" data-panel="story">
          <template v-if="pieceStories.length">
            <div class="nk-relic-stories">
              <article v-for="s in pieceStories" :key="s.piece.id" class="nk-relic-story">
                <div class="nk-relic-story__head">
                  <img class="nk-relic-story__icon" :src="pieceIconUrl(s.piece)" :alt="SLOT_NAMES[s.piece.type] || s.piece.type" loading="lazy" @error="onPieceImgError($event, s.piece)">
                  <div class="nk-relic-story__heading">
                    <div class="nk-relic-story__name">{{ s.name }}</div>
                    <div class="nk-relic-story__slot">{{ SLOT_NAMES[s.piece.type] || s.piece.type }}</div>
                  </div>
                </div>
                <div v-if="s.descHtml" class="nk-relic-story__desc" v-html="s.descHtml"></div>
                <div class="nk-relic-story__body" v-html="s.storyHtml"></div>
              </article>
            </div>
          </template>
        </div>
      </div>
    </template>
  </div>
</template>
