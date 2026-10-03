<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAppStore } from '../stores/app';
import { useLightconeStore } from '../stores/lightcone';
import { useDelayedSkeleton } from '../composables/use-delayed-skeleton';
import {
  avatarRoundIconUrl, fmtDesc, fmtVal, gameTagsToHtml, iconImgAttrs, itemName, lightconeIconUrl, pathIconUrl,
} from '../../lib/format';
import { cdnUri } from '../../services/cdn';
import { loadLocalCharacterList } from '../../services/api';
import { PATH, SITE_NAME } from '../../lib/constants';
import type { LightConeStats } from '../../services/types';
import '../../styles/skill-card.css';
import '../../styles/lightcone.css';

const route = useRoute();
const app = useAppStore();
const lc = useLightconeStore();


const phase = computed<'loading' | 'error' | 'ready'>(() =>
  lc.error ? 'error' : lc.data ? 'ready' : 'loading',
);
const showSkeleton = useDelayedSkeleton(() => phase.value === 'loading');
const d = computed(() => lc.data);
watch(d, (data) => {
  if (data) document.title = `${data.name} - ${SITE_NAME}`;
});

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

const stars = computed(() => (d.value ? '★'.repeat(d.value.rarity) : ''));
const figureUrl = computed(() =>
  d.value ? lightconeIconUrl(d.value.id) : '',
);

const rankLevels = computed<number[]>(() => {
  if (!d.value) return [];
  return Object.keys(d.value.skill.level).map(Number).sort((a, b) => a - b);
});

const skillDescHtml = computed(() => {
  if (!d.value) return '';
  const lv = d.value.skill.level[String(lc.rank)];
  return fmtDesc(d.value.skill.desc, lv ? lv.param_list : []);
});

/**
 * 参数表：只渲染描述实际引用的槽位（param_list 含上游预留未用槽，如 23060 #1 恒 0）；
 * 单位/精度按描述里的 `#N[tag]%/fN` 标记走 fmtVal——与描述数值同管线，
 * 禁止自造启发式（旧版 v<1 即 ×100 会把 f1 的 2.5 渲染成 3，21034 的 f2 0.2% 渲染成 0）。
 */
interface RankRow { idx: number; values: string[] }

const rankTable = computed<RankRow[]>(() => {
  if (!d.value) return [];
  const levels = rankLevels.value;
  if (!levels.length) return [];
  const first = d.value.skill.level[String(levels[0])];
  if (!first) return [];
  // 描述中的 `#N` 引用集 → 表行集合；`#N[i]%` / `#N[f1]%` 的 tag+单位 → 每槽位格式
  const refs = new Map<number, { tag: string; pct: boolean }>();
  const re = /#(\d+)\[([^\]]*)\](%?)/g;
  for (const m of d.value.skill.desc.matchAll(re)) {
    refs.set(Number(m[1]), { tag: m[2] || 'i', pct: m[3] === '%' });
  }
  if (!refs.size) return [];
  return [...refs.keys()]
    .sort((a, b) => a - b)
    .filter((n) => n <= first.param_list.length)
    .map((n) => ({
      idx: n,
      values: levels.map((lv) => {
        const p = d.value!.skill.level[String(lv)];
        const ref = refs.get(n);
        const v = p && p.param_list[n - 1];
        if (!ref || v == null) return '?';
        return fmtVal(v, ref.tag, ref.pct) + (ref.pct ? '%' : '');
      }),
    }));
});

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

const maxStats = computed(() => {
  const rows = statRows.value;
  return rows.length ? rows[rows.length - 1] : null;
});

/** 卡面故事：与其他卡面文本同管线（gameTagsToHtml 剥 <unbreak> 等游戏标签、保留 <i> 对话斜体） */
const storyHtml = computed(() =>
  d.value?.story ? gameTagsToHtml(d.value.story).replace(/\\n/g, '<br>') : '',
);

/* 适配角色：官方配装推荐（AvatarEquipRecommend）的反向索引——与角色页 BuildsPanel 的「推荐光锥」
   是同一张表的正反两面（rank 同源）。角色名走 characters.json 共享单例（对称于角色页用光锥
   列表反解光锥名）；名字未就绪时整块不渲染，不落 '#id' 占位。 */
const charNames = ref<Record<string, string>>({});
let charNamesRequested = false;
watch(
  () => (d.value?.recommend_chars || []).length,
  (n) => {
    if (!n || charNamesRequested) return;
    charNamesRequested = true;
    void loadLocalCharacterList()
      .then((list) => {
        const map: Record<string, string> = {};
        for (const c of list) map[String(c.id)] = c.name;
        charNames.value = map;
      })
      .catch(() => {
        charNamesRequested = false; // 名单拉取失败：保留块不渲染，下次进页重试
      });
  },
  { immediate: true },
);
const adaptChars = computed(() =>
  (d.value?.recommend_chars || [])
    .filter((c) => charNames.value[String(c.id)])
    .map((c) => ({ id: c.id, rank: c.rank, name: charNames.value[String(c.id)] })),
);

/* 参数表横滚提示（机制同 RelicView 词条表：溢出时才亮右缘渐隐） */
const rankWrapRef = ref<HTMLElement | null>(null);
const rankScrollable = ref(false);
let rankRo: ResizeObserver | null = null;

function checkRankScroll(): void {
  const el = rankWrapRef.value;
  if (!el) { rankScrollable.value = false; return; }
  rankScrollable.value = el.scrollWidth > el.clientWidth + 2;
}
function onRankScroll(): void {
  const el = rankWrapRef.value;
  if (!el) return;
  const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
  rankScrollable.value = !atEnd && el.scrollWidth > el.clientWidth + 2;
}
watch([phase, () => rankLevels.value.length], () => {
  void nextTick(() => {
    if (rankRo) {
      rankRo.disconnect();
      rankRo = null;
    }
    if (rankWrapRef.value) {
      rankRo = new ResizeObserver(checkRankScroll);
      rankRo.observe(rankWrapRef.value);
    }
    checkRankScroll();
  });
});

onBeforeUnmount(() => {
  if (rankRo) {
    rankRo.disconnect();
    rankRo = null;
  }
  lc.reset();
});
</script>

<template>
  <div class="nk-page--detail" :aria-busy="phase === 'loading'">
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

    <template v-else-if="d">
      <div class="nk-hero nk-hero--lc">
        <div class="nk-hero__visual" :data-rarity="d.rarity">
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
                <img v-bind="iconImgAttrs(pathIconUrl(d.path))" alt="">
                {{ PATH[d.path] || d.path }}
              </span>
            </div>
          </header>

          <section v-if="maxStats" class="nk-hero__section">
            <div class="nk-hero__section-title">
              <span class="nk-hero__section-bar"></span>
              <span>满级属性</span>
            </div>
            <div class="nk-hero__stats nk-hero__stats--lc">
              <div class="nk-hero__stat">
                <img
                  class="nk-hero__stat-icon"
                  :src="cdnUri('trace', 'IconMaxHP.webp')"
                  alt=""
                  aria-hidden="true"
                >
                <span class="nk-hero__stat-label">生命值</span>
                <span class="nk-hero__stat-val">{{ maxStats.hp.toLocaleString() }}</span>
              </div>
              <div class="nk-hero__stat">
                <img
                  class="nk-hero__stat-icon"
                  :src="cdnUri('trace', 'IconAttack.webp')"
                  alt=""
                  aria-hidden="true"
                >
                <span class="nk-hero__stat-label">攻击力</span>
                <span class="nk-hero__stat-val">{{ maxStats.atk.toLocaleString() }}</span>
              </div>
              <div class="nk-hero__stat">
                <img
                  class="nk-hero__stat-icon"
                  :src="cdnUri('trace', 'IconDefence.webp')"
                  alt=""
                  aria-hidden="true"
                >
                <span class="nk-hero__stat-label">防御力</span>
                <span class="nk-hero__stat-val">{{ maxStats.def.toLocaleString() }}</span>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div class="nk-panels">
        <div class="nk-panel nk-panel--active">
          <h2 class="nk-title"><span class="nk-title__idx">01</span>技能 SKILL</h2>
          <div class="nk-skill nk-lc-skill">
            <div class="nk-skill__head">
              <span class="nk-skill__type-dot" aria-hidden="true"></span>
              <div class="nk-skill__slider nk-lc-rank-slider">
                <span class="nk-lc-rank-label">叠影</span>
                <input
                  type="range"
                  aria-label="叠影等级"
                  :min="1"
                  :max="rankLevels.length || 5"
                  :value="lc.rank"
                  :style="{ '--fill': `${((lc.rank - 1) / Math.max(rankLevels.length - 1, 1)) * 100}%` }"
                  @input="lc.setRank(Number(($event.target as HTMLInputElement).value))"
                >
                <span class="nk-slider__val">{{ lc.rank }}</span>
              </div>
            </div>
            <div class="nk-skill__title-row">
              <img
                class="nk-skill__icon"
                v-bind="iconImgAttrs(lightconeIconUrl(d.id))"
                alt=""
              >
              <div class="nk-skill__title">
                <span class="nk-skill__name">{{ d.skill.name }}</span>
              </div>
            </div>
            <div class="nk-skill__desc" v-html="skillDescHtml"></div>
            <div v-if="rankTable.length" class="nk-lc-rank-table-wrap" ref="rankWrapRef" :class="{ 'is-scrollable': rankScrollable }" @scroll.passive="onRankScroll">
              <table class="nk-lc-rank-table">
                <caption style="position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap;">光锥技能各叠影等级参数</caption>
                <thead>
                  <tr>
                    <th class="nk-lc-rank-table__param" scope="col">参数</th>
                    <th
                      v-for="lv in rankLevels"
                      :key="lv"
                      scope="col"
                      :class="{ 'nk-lc-rank-table--active': lv === lc.rank }"
                    >{{ lv }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in rankTable" :key="row.idx">
                    <th class="nk-lc-rank-table__param" scope="row">#{{ row.idx }}</th>
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

          <template v-if="statRows.length">
            <h2 class="nk-title"><span class="nk-title__idx">02</span>晋阶 ASCENSION</h2>
            <div class="nk-lc-asc-grid">
              <div
                v-for="row in statRows"
                :key="row.phase"
                class="nk-lc-phase"
                :class="{ 'nk-lc-phase--max': row.phase === statRows[statRows.length - 1].phase }"
                :data-rarity="d.rarity"
              >
                <div class="nk-lc-phase__head">
                  <span class="nk-lc-phase__idx">晋阶 {{ row.phase }}</span>
                  <span class="nk-lc-phase__lv">Lv. {{ row.maxLevel }}</span>
                </div>
                <div class="nk-lc-phase__stats">
                  <div class="nk-lc-phase__stat">
                    <span class="nk-lc-phase__stat-label">生命值</span>
                    <span class="nk-lc-phase__stat-val">{{ row.hp.toLocaleString() }}</span>
                  </div>
                  <div class="nk-lc-phase__stat">
                    <span class="nk-lc-phase__stat-label">攻击力</span>
                    <span class="nk-lc-phase__stat-val">{{ row.atk.toLocaleString() }}</span>
                  </div>
                  <div class="nk-lc-phase__stat">
                    <span class="nk-lc-phase__stat-label">防御力</span>
                    <span class="nk-lc-phase__stat-val">{{ row.def.toLocaleString() }}</span>
                  </div>
                </div>
                <div v-if="row.cost.length" class="nk-lc-phase__cost">
                  <span
                    v-for="c in row.cost"
                    :key="c.id"
                    class="nk-lc-phase__cost-item"
                    :title="c.name"
                  >
                    <img
                      v-if="c.id !== 2"
                      v-bind="iconImgAttrs(cdnUri('itemfigures', `${c.id}.webp`))"
                      :alt="c.name"
                      loading="lazy"
                      @error="($event.target as HTMLImageElement).classList.add('nk-img-error')"
                    >
                    <span v-else class="nk-lc-phase__credit" title="信用点" aria-label="信用点">¤</span>
                    <span class="nk-lc-phase__cost-num">×{{ c.num.toLocaleString() }}</span>
                  </span>
                </div>
                <div v-else class="nk-lc-phase__cost nk-lc-phase__cost--none">无晋阶材料</div>
              </div>
            </div>
          </template>

          <template v-if="adaptChars.length">
            <h2 class="nk-title"><span class="nk-title__idx">03</span>适配角色 RECOMMENDED</h2>
            <div class="nk-lc-adapt">
              <RouterLink
                v-for="c in adaptChars"
                :key="c.id"
                class="nk-lc-adapt__item"
                :to="`/character/${c.id}`"
                :title="c.name"
              >
                <img
                  class="nk-lc-adapt__icon"
                  v-bind="iconImgAttrs(avatarRoundIconUrl(c.id))"
                  alt=""
                  loading="lazy"
                >
                <span class="nk-lc-adapt__name">{{ c.name }}</span>
                <span class="nk-lc-adapt__rec">REC. {{ c.rank }}</span>
              </RouterLink>
            </div>
          </template>

          <template v-if="storyHtml">
            <h2 class="nk-title"><span class="nk-title__idx">04</span>卡面 STORY</h2>
            <div class="nk-lc-story" v-html="storyHtml"></div>
          </template>
        </div>
      </div>
    </template>
  </div>
</template>
