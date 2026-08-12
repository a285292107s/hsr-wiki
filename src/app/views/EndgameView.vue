<script setup lang="ts">
/**
 * 终局赛季详情页（编排层）
 * 结构：Hero（模式铭牌 + 赛季信息 + HUD 指标条）/ 赛季增益 / 关卡层级章节
 *   （每层：推荐属性 + 敌方配置 + 可用增益 + 挑战目标）/ 星启模式 / 相邻赛季导航
 * 面板组件（EndgameHero/Buffs/Peak/Tierce/Floors）各自内聚派生与折叠状态机；
 * 本文件保留：加载编排、章节导航（sections.ts 单一事实源）、滚动追踪、相邻赛季。
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { seasonPosterTabUrl } from '../catalog/pages/endgame';
import { SITE_NAME } from '../../lib/constants';
import {
  loadLocalMazeList, loadLocalStoryList, loadLocalBossList, loadLocalPeakList,
} from '../../services/api';
import type { MazeListDb, MazeListEntry, PeakLevelInfo } from '../../services/types';
import { useDelayedSkeleton } from '../composables/use-delayed-skeleton';
import { useScrollSpy } from '../composables/use-scroll-spy';
import { buildEndgameSections } from '../endgame/sections';
import EndgameHero from '../endgame/EndgameHero.vue';
import EndgameBuffs from '../endgame/EndgameBuffs.vue';
import EndgamePeak from '../endgame/EndgamePeak.vue';
import EndgameTierce from '../endgame/EndgameTierce.vue';
import EndgameFloors from '../endgame/EndgameFloors.vue';
// 终局详情页专属样式（随本路由 chunk 懒加载）
import '../../styles/endgame-detail.css';

const route = useRoute();

/* ═══════════ 加载 ═══════════ */

/** mode → 赛季列表加载器（与目录页 api 同源） */
const MODE_LOADERS: Record<string, () => Promise<MazeListDb>> = {
  maze: loadLocalMazeList,
  story: loadLocalStoryList,
  boss: loadLocalBossList,
  peak: loadLocalPeakList,
};

const phase = ref<'loading' | 'error' | 'ready'>('loading');
const error = ref<string | null>(null);
const data = ref<MazeListEntry | null>(null);
/** 当前模式赛季列表（相邻导航取相邻赛季 arts.poster_tab 缩略图） */
const listDb = ref<MazeListDb | null>(null);
/** 当前赛季在列表中的位置（供"上一赛季 / 下一赛季"导航） */
const seasonIndex = ref(-1);
const seasonKeys = ref<string[]>([]);

/** 延迟显示骨架屏：加载超过阈值才呈现，缓存命中的快速切换不闪骨架屏 */
const showSkeleton = useDelayedSkeleton(() => phase.value === 'loading');

async function load(mode: string, id: string): Promise<void> {
  const loader = MODE_LOADERS[mode];
  if (!loader) {
    phase.value = 'error';
    error.value = `未知的终局模式: ${mode}`;
    return;
  }
  phase.value = 'loading';
  error.value = null;
  try {
    const db = await loader();
    const keys = Object.keys(db);
    seasonKeys.value = keys;
    listDb.value = db;
    const entry = db[id];
    if (!entry || !entry.zh) {
      phase.value = 'error';
      error.value = `未找到赛季 ${mode}/${id}`;
      return;
    }
    data.value = entry;
    seasonIndex.value = keys.indexOf(id);
    document.title = `${entry.zh} - ${SITE_NAME}`;
    // 下一帧再切换 ready，避免 loading 骨架闪烁；随后 nextTick 等正文 DOM 就绪，
    // 重置滚动、刷新滚动追踪（区块激活态；面板组件内折叠状态机随数据自行初始化）。
    // 后台标签页 rAF 会被浏览器暂停导致永久骨架屏：visibility hidden 时用 setTimeout 兜底推进
    const settleReady = (): void => {
      phase.value = 'ready';
      pageRef.value?.scrollTo({ top: 0 });
      void nextTick(() => { refresh(); });
    };
    if (document.visibilityState === 'hidden') {
      setTimeout(settleReady, 0);
    } else {
      requestAnimationFrame(settleReady);
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
    phase.value = 'error';
  }
}

function retry(): void {
  void load(String(route.params.mode || ''), String(route.params.id || ''));
}

onMounted(() => {
  void load(String(route.params.mode || ''), String(route.params.id || ''));
});
watch(
  () => [route.params.mode, route.params.id],
  ([mode, id]) => {
    if (mode && id) void load(String(mode), String(id));
  },
);

/* ═══════════ 派生 ═══════════ */

const modeKey = computed(() => String(route.params.mode || ''));
/** 逐层章节（以关卡层级为章节名的完整内容；倒序：最高层在前）
 *  全模式全量展示（重构后不再"仅最后一层"回退），配合折叠交互控制页面长度 */
const floorSections = computed(() => [...(data.value?.floor_details || [])].reverse());
/** 异相仲裁关卡组成（3 骑士试炼 + 1 王棋最终关，含绝境变体） */
const peakLevels = computed<PeakLevelInfo[]>(() => data.value?.levels || []);

/** 章节导航（吸顶条）与面板编号同源：sections.ts 单一事实源 */
const navSections = computed(() => buildEndgameSections(data.value, modeKey.value, peakLevels.value));

/** 相邻赛季导航（排期开始降序；与目录页同序；posterTab 为相邻赛季海报页签缩略图） */
const prevSeason = computed(() => {
  const i = seasonIndex.value;
  if (i <= 0 || !listDb.value) return null;
  const key = seasonKeys.value[i - 1];
  if (!key) return null;
  return { key, href: `/endgame/${modeKey.value}/${key}`, posterTab: listDb.value[key]?.arts?.poster_tab };
});
const nextSeason = computed(() => {
  const i = seasonIndex.value;
  if (i < 0 || i >= seasonKeys.value.length - 1 || !listDb.value) return null;
  const key = seasonKeys.value[i + 1];
  if (!key) return null;
  return { key, href: `/endgame/${modeKey.value}/${key}`, posterTab: listDb.value[key]?.arts?.poster_tab };
});

/* ═══════════ 吸顶工具条（章节导航 + 阅读进度线 + 返回顶部） ═══════════ */

const pageRef = ref<HTMLElement | null>(null);
const { activeId, progress, showTop, jumpTo, scrollTop, refresh } = useScrollSpy(
  pageRef,
  () => navSections.value.map((s) => s.id),
  (id) => document.getElementById(`egd-${id}`),
  { offset: 64, fallbackFirst: true },
);

/* ═══════════ 卸载清理 ═══════════ */

onBeforeUnmount(() => {
  data.value = null;
});
</script>

<template>
  <div ref="pageRef" class="nk-page--detail nk-egd" :data-mode="modeKey" :aria-busy="phase === 'loading'">
    <!-- ─── 加载骨架屏（延迟显示，缓存命中不闪屏） ─── -->
    <div
      v-if="phase === 'loading' && showSkeleton"
      class="nk-skeleton nk-skeleton--egd"
      role="status"
      aria-live="polite"
      aria-label="赛季详情加载中"
    >
      <div class="nk-skeleton__hero">
        <div class="nk-egd-sk nk-sk--shimmer"></div>
      </div>
      <div class="nk-skeleton__body">
        <div class="nk-sk nk-sk--shimmer nk-sk--block-md"></div>
        <div class="nk-sk nk-sk--shimmer nk-sk--block-lg"></div>
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
      <div class="nk-error-state__title">赛季数据加载失败</div>
      <div v-if="error" class="nk-error-state__detail">{{ error }}</div>
      <button class="nk-error-state__retry" type="button" @click="retry">RETRY</button>
    </div>

    <!-- ─── 正文 ─── -->
    <template v-else-if="data">
      <!-- 吸顶工具条：章节导航 + 阅读进度线（fixed 视口级，近实底） -->
      <div class="nk-egd-bar">
        <div class="nk-egd-bar__inner">
          <nav class="nk-secnav nk-egd-secnav" aria-label="内容区块导航">
            <button
              v-for="s in navSections"
              :key="s.id"
              type="button"
              class="nk-secnav__btn"
              :class="{ 'nk-secnav__btn--active': activeId === s.id }"
              :aria-current="activeId === s.id ? 'true' : undefined"
              @click="jumpTo(s.id)"
            >
              <span class="nk-secnav__idx">{{ s.idx }}</span>
              {{ s.label }}
            </button>
          </nav>
        </div>
        <div class="nk-egd-bar__progress" :style="{ width: `${progress}%` }"></div>
      </div>

      <!-- 返回顶部（滚动超过阈值出现） -->
      <button
        v-show="showTop"
        class="nk-top-btn"
        type="button"
        aria-label="返回顶部"
        @click="scrollTop"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
      </button>

      <!-- Hero：模式铭牌 + 赛季信息（横幅优先，无横幅回退背景图） -->
      <EndgameHero :data="data" :mode-key="modeKey" />

      <!-- 内容面板 -->
      <div class="nk-panels nk-egd-body">
        <div class="nk-egd-panel">
          <!-- 战意机制 + 赛季增益 -->
          <EndgameBuffs :data="data" :mode-key="modeKey" />

          <!-- 异相仲裁关卡组成 -->
          <EndgamePeak :data="data" :peak-levels="peakLevels" />

          <!-- 数据空态提示（无星启 / 无层级 / 无关卡组成时） -->
          <div v-if="!data.tierce && !floorSections.length && !peakLevels.length" class="nk-egd-empty">本赛季暂无关卡数据</div>

          <!-- 星启模式 -->
          <EndgameTierce :data="data" :mode-key="modeKey" />

          <!-- 关卡层级 -->
          <EndgameFloors :data="data" :mode-key="modeKey" :floor-sections="floorSections" />

          <!-- 相邻赛季导航（含海报页签缩略图 poster_tab：虚构/末日/仲裁有，忘却之庭无则不渲染） -->
          <nav v-if="prevSeason || nextSeason" class="nk-egd-nav" aria-label="相邻赛季">
            <router-link
              v-if="prevSeason"
              class="nk-egd-nav__item nk-egd-nav__item--prev"
              :to="prevSeason.href"
            >
              <img
                v-if="prevSeason.posterTab"
                class="nk-egd-nav__thumb"
                :src="seasonPosterTabUrl({ poster_tab: prevSeason.posterTab })"
                alt=""
                loading="lazy"
                @error="($event.target as HTMLImageElement).style.display='none'"
              >
              <span class="nk-egd-nav__body">
                <span class="nk-egd-nav__dir">← 上一赛季</span>
                <span class="nk-egd-nav__id">{{ prevSeason.key }}</span>
              </span>
            </router-link>
            <span v-else class="nk-egd-nav__item nk-egd-nav__item--void"></span>
            <router-link
              v-if="nextSeason"
              class="nk-egd-nav__item nk-egd-nav__item--next"
              :to="nextSeason.href"
            >
              <span class="nk-egd-nav__body">
                <span class="nk-egd-nav__dir">下一赛季 →</span>
                <span class="nk-egd-nav__id">{{ nextSeason.key }}</span>
              </span>
              <img
                v-if="nextSeason.posterTab"
                class="nk-egd-nav__thumb"
                :src="seasonPosterTabUrl({ poster_tab: nextSeason.posterTab })"
                alt=""
                loading="lazy"
                @error="($event.target as HTMLImageElement).style.display='none'"
              >
            </router-link>
          </nav>
        </div>
      </div>
    </template>
  </div>
</template>