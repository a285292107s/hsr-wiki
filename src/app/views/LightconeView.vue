<script setup lang="ts">
/**
 * 光锥详情页
 * 结构：Hero（光锥立绘 + 基础信息）/ 技能（叠影等级滑条）/ 属性（晋阶阶段）/ 故事
 * 交互：叠影 1-5 切换实时重渲染技能数值
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAppStore } from '../stores/app';
import { useLightconeStore } from '../stores/lightcone';
import { fmtDesc, lightconeIconUrl, itemName } from '../../lib/format';
import { CDN, PATH } from '../../lib/constants';
import type { LightConeStats } from '../../services/types';

const route = useRoute();
const app = useAppStore();
const lc = useLightconeStore();

/* ═══════════ 加载 ═══════════ */

const phase = computed<'loading' | 'error' | 'ready'>(() =>
  lc.error ? 'error' : lc.data ? 'ready' : 'loading',
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
const d = computed(() => lc.data);

async function load(id: string): Promise<void> {
  try {
    await lc.load(id);
  } catch {
    app.toast('error', `加载失败: ${lc.error || '未知错误'}`);
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
    if (id && String(id) !== lc.lcId) void load(String(id));
  },
);

/* ═══════════ Hero ═══════════ */

const stars = computed(() => (d.value ? '★'.repeat(d.value.rarity) : ''));
const figureUrl = computed(() =>
  d.value ? lightconeIconUrl(d.value.id) : '',
);

/* ═══════════ 技能（叠影等级切换） ═══════════ */

const rankLevels = computed<number[]>(() => {
  if (!d.value) return [];
  return Object.keys(d.value.skill.level).map(Number).sort((a, b) => a - b);
});

const skillDescHtml = computed(() => {
  if (!d.value) return '';
  const lv = d.value.skill.level[String(lc.rank)];
  return fmtDesc(d.value.skill.desc, lv ? lv.param_list : []);
});

/** 叠影参数对比表：每个参数在 5 级的数值 */
const rankTable = computed<{ idx: number; values: string[] }[]>(() => {
  if (!d.value) return [];
  const levels = rankLevels.value;
  if (!levels.length) return [];
  const first = d.value.skill.level[String(levels[0])];
  if (!first) return [];
  return first.param_list.map((_, i) => ({
    idx: i + 1,
    values: levels.map((lv) => {
      const p = d.value!.skill.level[String(lv)];
      const v = p && p.param_list[i];
      if (v == null) return '?';
      // 百分比参数（<1 的小数）显示为百分比整数
      return v < 1 && v > 0 && !Number.isInteger(v) ? String(Math.round(v * 100)) : String(Math.round(v));
    }),
  }));
});

/* ═══════════ 属性（晋阶阶段） ═══════════ */

interface StatRow { phase: number; maxLevel: number; hp: number; atk: number; def: number; cost: { id: number; num: number; name: string }[] }

const statRows = computed<StatRow[]>(() => {
  if (!d.value) return [];
  return Object.entries(d.value.stats)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([phase, s]: [string, LightConeStats]) => ({
      phase: Number(phase),
      maxLevel: s.max_level,
      hp: Math.round(s.hp_base + s.hp_add * (s.max_level - 1)),
      atk: Math.round(s.attack_base + s.attack_add * (s.max_level - 1)),
      def: Math.round(s.defence_base + s.defence_add * (s.max_level - 1)),
      cost: (s.cost || []).map((c) => ({
        id: c.ItemID,
        num: c.ItemNum,
        name: c.ItemID === 2 ? '信用点' : itemName(c.ItemID, app.nameCache, app.itemDb),
      })),
    }));
});

/** 满级（Lv.80 突破6）属性摘要 */
const maxStats = computed(() => {
  const rows = statRows.value;
  return rows.length ? rows[rows.length - 1] : null;
});

/* ═══════════ 描述 / 卡面故事 ═══════════ */

const descHtml = computed(() =>
  d.value && d.value.desc ? d.value.desc.replace(/\\n/g, '<br>') : '',
);

/** 卡面描述：\n → <br>，保留 <i> 对话斜体标签 */
const storyHtml = computed(() =>
  d.value?.story ? d.value.story.replace(/\\n/g, '<br>') : '',
);

/* ═══════════ 卸载清理 ═══════════ */

onBeforeUnmount(() => {
  if (skeletonTimer !== null) clearTimeout(skeletonTimer);
  lc.reset();
});
</script>

<template>
  <div class="nk-page--detail" :aria-busy="phase === 'loading'">
    <!-- ─── 加载骨架屏（延迟显示，缓存命中不闪屏） ─── -->
    <div
      v-if="phase === 'loading' && showSkeleton"
      class="nk-skeleton nk-skeleton--lc"
      role="status"
      aria-live="polite"
      aria-label="光锥详情加载中"
    >
      <div class="nk-skeleton__hero">
        <div class="nk-skeleton__hero-visual">
          <div class="nk-sk nk-sk--shimmer nk-sk--fill"></div>
        </div>
        <div class="nk-skeleton__hero-panel">
          <div class="nk-sk nk-sk--shimmer nk-sk--title nk-sk--bar-lg"></div>
          <div class="nk-sk nk-sk--shimmer nk-sk--text-sm nk-sk--bar-md"></div>
          <div style="display:flex;gap:8px;">
            <div class="nk-sk nk-sk--shimmer nk-sk--chip" style="width:64px;"></div>
            <div class="nk-sk nk-sk--shimmer nk-sk--chip" style="width:60px;"></div>
          </div>
          <div class="nk-skeleton__stat-grid" style="margin-top:16px;">
            <div v-for="i in 3" :key="i" class="nk-sk nk-sk--shimmer nk-sk--stat"></div>
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
      <div class="nk-error-state__title">光锥数据加载失败</div>
      <div v-if="lc.error" class="nk-error-state__detail">{{ lc.error }}</div>
      <button class="nk-error-state__retry" type="button" @click="retry">RETRY</button>
    </div>

    <!-- ─── 正文 ─── -->
    <template v-else-if="d">
      <!-- Hero -->
      <div class="nk-hero nk-hero--lc">
        <div class="nk-hero__visual">
          <div
            class="nk-hero__bg nk-hero__bg--lc"
            :style="{ backgroundImage: `url(${figureUrl})` }"
          ></div>
          <div class="nk-hero__scrim"></div>
        </div>
        <div class="nk-hero__panel">
          <header class="nk-hero__head">
            <h1 class="nk-hero__name">{{ d.name }}</h1>
            <div class="nk-hero__meta">
              <span class="nk-hero__stars">{{ stars }}</span>
              <span class="nk-hero__tag">
                <img :src="`${CDN}/assets/hsr/pathicon/${d.path.toLowerCase()}.webp`">
                {{ PATH[d.path] || d.path }}
              </span>
              <span class="nk-hero__id">
                <span class="nk-hero__id-num">{{ d.id }}</span>
              </span>
            </div>
          </header>

          <!-- 满级属性摘要 -->
          <section v-if="maxStats" class="nk-hero__section">
            <div class="nk-hero__section-title">
              <span class="nk-hero__section-bar"></span>
              <span>属性</span>
              <span class="nk-lc-lv">Lv. {{ maxStats.maxLevel }}</span>
            </div>
            <div class="nk-hero__stats nk-hero__stats--lc">
              <div class="nk-hero__stat">
                <span class="nk-hero__stat-icon" data-icon="hp" aria-hidden="true"></span>
                <span class="nk-hero__stat-label">HP</span>
                <span class="nk-hero__stat-val">{{ maxStats.hp }}</span>
              </div>
              <div class="nk-hero__stat">
                <span class="nk-hero__stat-icon" data-icon="atk" aria-hidden="true"></span>
                <span class="nk-hero__stat-label">ATK</span>
                <span class="nk-hero__stat-val">{{ maxStats.atk }}</span>
              </div>
              <div class="nk-hero__stat">
                <span class="nk-hero__stat-icon" data-icon="def" aria-hidden="true"></span>
                <span class="nk-hero__stat-label">DEF</span>
                <span class="nk-hero__stat-val">{{ maxStats.def }}</span>
              </div>
            </div>
          </section>
        </div>
      </div>

      <!-- 内容面板 -->
      <div class="nk-panels">
        <div class="nk-panel nk-panel--active">
          <!-- 技能 -->
          <div class="nk-title">SKILL</div>
          <div class="nk-skill nk-lc-skill">
            <div class="nk-skill__head">
              <span class="nk-skill__type-dot" style="--sk-accent: var(--primary);"></span>
              <div class="nk-skill__slider nk-lc-rank-slider">
                <span class="nk-lc-rank-label">叠影</span>
                <input
                  type="range"
                  :min="1"
                  :max="rankLevels.length || 5"
                  :value="lc.rank"
                  :style="{ '--fill': `${((lc.rank - 1) / Math.max(rankLevels.length - 1, 1)) * 100}%` }"
                  @input="lc.setRank(Number(($event.target as HTMLInputElement).value))"
                >
                <span class="nk-skill__slider-val">{{ lc.rank }}</span>
              </div>
            </div>
            <div class="nk-skill__title-row">
              <img class="nk-skill__icon" :src="lightconeIconUrl(d.id)">
              <div class="nk-skill__title">
                <span class="nk-skill__name">{{ d.skill.name }}</span>
                <span class="nk-skill__tag">{{ PATH[d.path] || d.path }}命途</span>
              </div>
            </div>
            <div class="nk-skill__desc" v-html="skillDescHtml"></div>
            <div v-if="descHtml" class="nk-lc-skill-note" v-html="descHtml"></div>
            <!-- 叠影数值对比表 -->
            <div v-if="rankTable.length" class="nk-lc-rank-table-wrap">
              <table class="nk-lc-rank-table">
                <thead>
                  <tr>
                    <th class="nk-lc-rank-table__param">参数</th>
                    <th
                      v-for="lv in rankLevels"
                      :key="lv"
                      :class="{ 'nk-lc-rank-table--active': lv === lc.rank }"
                    >{{ lv }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in rankTable" :key="row.idx">
                    <td class="nk-lc-rank-table__param">#{{ row.idx }}</td>
                    <td
                      v-for="(v, i) in row.values"
                      :key="i"
                      :class="{ 'nk-lc-rank-table--active': rankLevels[i] === lc.rank }"
                    >{{ v }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- 晋阶属性 -->
          <template v-if="statRows.length">
            <div class="nk-title">ASCENSION</div>
            <div class="nk-lc-asc-table-wrap">
              <table class="nk-lc-asc-table">
                <thead>
                  <tr>
                    <th>突破</th>
                    <th>等级上限</th>
                    <th>HP</th>
                    <th>ATK</th>
                    <th>DEF</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in statRows" :key="row.phase">
                    <td class="nk-lc-asc-table__phase">{{ row.phase }}</td>
                    <td>Lv. {{ row.maxLevel }}</td>
                    <td>{{ row.hp }}</td>
                    <td>{{ row.atk }}</td>
                    <td>{{ row.def }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <!-- 晋阶材料 -->
            <div class="nk-lc-costs">
              <div
                v-for="row in statRows.filter(r => r.cost.length)"
                :key="`cost-${row.phase}`"
                class="nk-lc-cost"
              >
                <span class="nk-lc-cost__phase">突破 {{ row.phase }}</span>
                <div class="nk-lc-cost__items">
                  <span v-for="c in row.cost" :key="c.id" class="nk-lc-cost__item" :title="c.name">
                    <img
                      v-if="c.id !== 2"
                      :src="`${CDN}/assets/hsr/itemfigures/${c.id}.webp`"
                      :alt="c.name"
                      loading="lazy"
                      @error="($event.target as HTMLImageElement).classList.add('nk-img-error')"
                    >
                    <span v-else class="nk-lc-cost__credit">¤</span>
                    <span class="nk-lc-cost__num">×{{ c.num.toLocaleString() }}</span>
                  </span>
                </div>
              </div>
            </div>
          </template>

          <!-- 故事：卡面描述 -->
          <template v-if="storyHtml">
            <div class="nk-title">STORY</div>
            <div class="nk-lc-story" v-html="storyHtml"></div>
          </template>
        </div>
      </div>
    </template>
  </div>
</template>
