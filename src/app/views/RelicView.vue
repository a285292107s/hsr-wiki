<script setup lang="ts">
/**
 * 遗器详情页
 * 结构：Hero（套装图 + 基础信息）/ 套装效果（2件/4件）/ 部位（5星部件）/ 主词条（各部位可选）/ 副词条（强化池）
 * 数据：relics.json（按 ID 查找）+ relic_main_affixes.json + relic_sub_affixes.json
 */
import { computed, onBeforeUnmount, onMounted, watch } from 'vue';
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

/* ═══════════ 副词条（强化池） ═══════════ */

const subAffixList = computed<RelicSubAffix[]>(() => {
  const group = pieces.value[0]?.sub_affix_group;
  if (group == null) return [];
  return relic.subAffixes.filter((a) => a.group_id === group);
});

/** 副词条数值档位固定 4 档（base + i×step, i=0..3），与游戏内掉落档位一致 */
const SUB_AFFIX_TIER_COUNT = 4;

/** 单条副词条的 4 个数值档位 */
function subAffixTiers(a: RelicSubAffix): number[] {
  return Array.from({ length: SUB_AFFIX_TIER_COUNT }, (_, i) => a.base_value + a.step_value * i);
}

/** 满级强化信息：+15 遗器在 +3/+6/+9/+12/+15 共 5 次强化，单条满值倍率 = 1 初始 + 5 = 6 */
const enhanceInfo = computed(() => {
  const maxLevel = pieces.value[0]?.max_level ?? 15;
  const rolls = Math.floor(maxLevel / 3);
  return { maxLevel, rolls, multiplier: 1 + rolls };
});

/** 单条副词条理论满值：最高档 × (1 初始 + 满级强化次数) */
function subAffixMax(a: RelicSubAffix): number {
  const maxTier = a.base_value + a.step_value * (SUB_AFFIX_TIER_COUNT - 1);
  return maxTier * enhanceInfo.value.multiplier;
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

/* ═══════════ 卸载清理 ═══════════ */

onBeforeUnmount(() => {
  relic.reset();
});
</script>

<template>
  <div class="nk-page--detail">
    <!-- ─── 加载骨架屏 ─── -->
    <div v-if="phase === 'loading'" class="nk-skeleton nk-skeleton--relic">
      <div class="nk-skeleton__hero">
        <div class="nk-skeleton__hero-visual">
          <div class="nk-sk nk-sk--shimmer" style="position:absolute;inset:0;border-radius:0;"></div>
        </div>
        <div class="nk-skeleton__hero-panel">
          <div class="nk-sk nk-sk--shimmer" style="width:180px;height:28px;border-radius:6px;"></div>
          <div class="nk-sk nk-sk--shimmer" style="width:120px;height:14px;border-radius:4px;"></div>
          <div style="display:flex;gap:8px;">
            <div class="nk-sk nk-sk--shimmer" style="width:80px;height:22px;border-radius:14px;"></div>
            <div class="nk-sk nk-sk--shimmer" style="width:60px;height:22px;border-radius:14px;"></div>
          </div>
        </div>
      </div>
      <div class="nk-skeleton__body">
        <div class="nk-sk nk-sk--shimmer" style="width:100%;height:80px;border-radius:8px;"></div>
        <div class="nk-sk nk-sk--shimmer" style="width:100%;height:160px;border-radius:8px;"></div>
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

          <!-- 部位预览 -->
          <section v-if="pieces.length" class="nk-hero__section">
            <div class="nk-hero__section-title">
              <span class="nk-hero__section-bar"></span>
              <span>部位</span>
              <span class="nk-relic-count">{{ pieces.length }} 件</span>
            </div>
            <div class="nk-relic-hero-pieces">
              <div v-for="p in pieces" :key="p.id" class="nk-relic-hero-piece" :title="SLOT_NAMES[p.type] || p.type">
                <img :src="pieceIconUrl(p)" :alt="SLOT_NAMES[p.type] || p.type" loading="lazy" @error="onPieceImgError($event, p)">
              </div>
            </div>
          </section>
        </div>
      </div>

      <!-- 内容面板 -->
      <div class="nk-panels">
        <div class="nk-panel nk-panel--active">
          <!-- 套装效果 -->
          <template v-if="setEffects.length">
            <div class="nk-title">SET EFFECT</div>
            <div class="nk-relic-effects">
              <div v-for="eff in setEffects" :key="eff.num" class="nk-relic-effect">
                <div class="nk-relic-effect__head">
                  <span class="nk-relic-effect__num">{{ eff.num }}件套</span>
                </div>
                <div class="nk-relic-effect__desc" v-html="eff.html"></div>
              </div>
            </div>
          </template>

          <!-- 主词条 -->
          <template v-if="pieceAffixGroups.some(g => g.affixes.length)">
            <div class="nk-title">MAIN AFFIXES</div>
            <div class="nk-relic-affix-note">主词条初始值 → 满级（+{{ pieces[0]?.max_level || 15 }}）</div>
            <div class="nk-relic-affix-groups">
              <div v-for="g in pieceAffixGroups" :key="g.piece.id" class="nk-relic-affix-group">
                <div class="nk-relic-affix-group__head">
                  <img class="nk-relic-affix-group__icon" :src="pieceIconUrl(g.piece)" :alt="SLOT_NAMES[g.piece.type] || g.piece.type" loading="lazy" @error="onPieceImgError($event, g.piece)">
                  <span class="nk-relic-affix-group__slot">{{ SLOT_NAMES[g.piece.type] || g.piece.type }}</span>
                </div>
                <div class="nk-relic-affix-rows">
                  <div v-for="a in g.affixes" :key="a.affix_id" class="nk-relic-affix-row">
                    <span class="nk-relic-affix-row__name">{{ PROP_NAMES[a.property] || a.property }}</span>
                    <span class="nk-relic-affix-row__val">
                      {{ fmtAffix(a.base_value, a.property, a.base_value) }}
                      <span class="nk-relic-affix-row__arrow">→</span>
                      <span class="nk-relic-affix-row__max">{{ fmtAffix(mainAffixMax(a, g.piece.max_level), a.property, a.base_value) }}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- 副词条 -->
          <template v-if="subAffixList.length">
            <div class="nk-title">SUB AFFIXES</div>
            <div class="nk-relic-affix-note">
              副词条含 {{ SUB_AFFIX_TIER_COUNT }} 个数值档位，掉落时随机取 1 档；满级 +{{ enhanceInfo.maxLevel }} 共 {{ enhanceInfo.rolls }} 次强化（+3/+6/+9/+12/+15），每次随机为 1 条累加 1 档，单条理论满值 = 最高档 × {{ enhanceInfo.multiplier }}。
            </div>
            <div class="nk-relic-subgrid">
              <div v-for="a in subAffixList" :key="a.affix_id" class="nk-relic-subcell">
                <span class="nk-relic-subcell__name">{{ PROP_NAMES[a.property] || a.property }}</span>
                <div class="nk-relic-subcell__tiers">
                  <span
                    v-for="(t, i) in subAffixTiers(a)"
                    :key="i"
                    class="nk-relic-subcell__tier"
                    :class="{ 'is-top': i === SUB_AFFIX_TIER_COUNT - 1 }"
                  >{{ fmtAffix(t, a.property, a.base_value) }}</span>
                </div>
                <span class="nk-relic-subcell__max">满值 {{ fmtAffix(subAffixMax(a), a.property, a.base_value) }}</span>
              </div>
            </div>
          </template>

          <!-- 遗器来历 -->
          <template v-if="pieceStories.length">
            <div class="nk-title">STORIES</div>
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
