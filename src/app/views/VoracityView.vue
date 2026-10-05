<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { fmtDesc, gridFightIconUrl, monsterIconUrl, refsResolved, tutorialPicUrl } from '../../lib/format';
import { cdnFallbackFromPrimary } from '../../services/cdn';
import { loadLocalVoracity } from '../../services/api';
import type { MazeBuffInfo, VoracityDb, VoracityStage } from '../../services/types';
import { usePageData } from '../composables/use-page-data';
import { useScrollSpy } from '../composables/use-scroll-spy';
import { BUFF_ICON_FALLBACK, buffDescHtml, buffIconUrl } from '../endgame/renders';
import { pollutionPosition } from '../endgame/pollution';
import { ENDGAME_MODES } from '../catalog/pages/endgame';
import '../../styles/voracity.css';

const { data, error, loading, showSkeleton, run: load, retry } = usePageData<VoracityDb>(loadLocalVoracity);

const pageRef = ref<HTMLElement | null>(null);

const activity = computed(() => data.value?.activity ?? null);
const invasion = computed(() => data.value?.invasion ?? null);

/** 波及关卡按侵蚀等级分组（组内保持数据原序） */
const stageGroups = computed<{ invasionId: number; stages: VoracityStage[] }[]>(() => {
  const groups: { invasionId: number; stages: VoracityStage[] }[] = [];
  for (const s of [...(invasion.value?.stages ?? [])].sort((a, b) => a.invasion_id - b.invasion_id)) {
    const last = groups[groups.length - 1];
    if (last && last.invasionId === s.invasion_id) last.stages.push(s);
    else groups.push({ invasionId: s.invasion_id, stages: [s] });
  }
  return groups;
});

const SECTION_DEFS: { id: string; label: string }[] = [
  { id: 'overview', label: '玩法概览' },
  { id: 'scores', label: '污染等级与愿力' },
  { id: 'invasion', label: '「贪饕」侵蚀' },
  { id: 'stages', label: '波及关卡' },
  { id: 'statuses', label: '状态词条' },
  { id: 'tutorials', label: '教程图文' },
  { id: 'affixes', label: '位面词条' },
  { id: 'disambig', label: '同形词说明' },
];

const sections = computed(() => {
  const d = data.value;
  const on: Record<string, boolean> = {
    overview: !!d?.activity,
    scores: !!d?.activity?.scores?.length || !!d?.activity?.progress_steps?.length,
    invasion: !!d?.invasion?.levels?.length || !!d?.activity?.buff_levels?.length,
    stages: !!d?.invasion?.stages?.length,
    statuses: !!d?.statuses?.length,
    tutorials: !!d?.tutorials?.length,
    affixes: !!d?.affixes?.length,
    disambig: true,
  };
  const out: { id: string; idx: string; label: string }[] = [];
  for (const def of SECTION_DEFS) {
    if (on[def.id]) out.push({ ...def, idx: String(out.length + 1).padStart(2, '0') });
  }
  return out;
});

const shownSections = computed(() => new Set(sections.value.map((s) => s.id)));
const sectionIdx = (id: string): string => sections.value.find((s) => s.id === id)?.idx ?? '';

const { activeId, progress, showTop, jumpTo, scrollTop, refresh } = useScrollSpy(
  pageRef,
  () => sections.value.map((s) => s.id),
  (id) => document.getElementById(`vor-${id}`),
  { offset: 64, fallbackFirst: true },
);

/** 描述正文（占位符引用缺参时整段省略，不落残缺 `#N[...]` 与 `?`） */
function plainDesc(desc: string | null | undefined, params?: number[] | null): string {
  return refsResolved(desc, params) ? fmtDesc(desc, params) : '';
}

/** 增益类条目适配成 MazeBuffInfo，复用终局页的图标与描述原语 */
function buffView(id: number, name: string | undefined, desc: string | undefined, params: number[] | undefined, icon: string | undefined): MazeBuffInfo {
  return { id, name: name ?? '', desc, param_list: params, icon };
}

function buffHtml(b: MazeBuffInfo): string {
  return refsResolved(b.desc, b.param_list) ? buffDescHtml(b) : '';
}

const introHtml = computed(() => plainDesc(activity.value?.intro, null));
const progressSteps = computed(() =>
  (activity.value?.progress_steps ?? []).map((p) => ({ ...p, html: plainDesc(p.desc, null) })));
const levels = computed(() =>
  (invasion.value?.levels ?? []).map((l) => {
    const buff = buffView(l.maze_buff_id ?? l.invasion_id, undefined, l.desc, l.param_list, l.icon);
    return { ...l, buff, html: buffHtml(buff) };
  }));
const buffLevels = computed(() =>
  (activity.value?.buff_levels ?? []).map((b) => {
    const buff = buffView(b.buff_id, b.name, b.desc, b.param_list, b.icon);
    return { ...b, buff, html: buffHtml(buff) };
  }));
const affixes = computed(() =>
  (data.value?.affixes ?? []).map((a) => ({
    ...a,
    iconUrl: gridFightIconUrl(a.icon),
    html: plainDesc(a.desc, a.params),
  })));
const statuses = computed(() =>
  (data.value?.statuses ?? []).map((s) => {
    const buff = buffView(s.status_id, s.name, s.desc, s.param_list, s.icon);
    return { ...s, buff, html: buffHtml(buff) };
  }));
const tutorials = computed(() =>
  (data.value?.tutorials ?? []).map((t) => ({ ...t, html: plainDesc(t.desc, null) })));

function buffIconError(e: Event): void {
  (e.target as HTMLImageElement).src = BUFF_ICON_FALLBACK;
}

/** 终局模式中文名（与终局目录页共用 ENDGAME_MODES 单一来源） */
function modeLabel(mode: string): string {
  return ENDGAME_MODES.find((m) => m.key === mode)?.label || mode;
}

/** 关卡在该赛季中的位置（与终局详情页的污染节点文案同一实现） */
function scopePosition(sc: { half: string; floor?: number; title?: string }): string {
  return pollutionPosition(sc);
}

function iconFallback(url: string): string | undefined {
  return cdnFallbackFromPrimary(url) || undefined;
}

/** 比例字段（0~1）→ 百分比数值；源值已是百分数时原样透传 */
function ratioPct(v: number | null | undefined): number {
  if (v == null) return 0;
  return Math.max(0, Math.min(100, v <= 1 ? v * 100 : v));
}
const fmtPct = (v: number | null | undefined): string => `${Math.round(ratioPct(v) * 10) / 10}%`;

watch(data, (d) => {
  if (!d) return;
  pageRef.value?.scrollTo({ top: 0 });
  void nextTick(() => { refresh(); });
});

onMounted(() => { void load(); });
</script>

<template>
  <div ref="pageRef" class="nk-page--detail nk-vor" :aria-busy="loading">
    <div
      v-if="loading && showSkeleton"
      class="nk-skeleton nk-vor-skeleton"
      role="status"
      aria-live="polite"
      aria-label="贪饕污染数据加载中"
    >
      <div class="nk-skeleton__body">
        <div class="nk-sk nk-sk--shimmer nk-sk--title"></div>
        <div class="nk-sk nk-sk--shimmer nk-sk--block-md"></div>
        <div class="nk-sk nk-sk--shimmer nk-sk--block-lg"></div>
      </div>
    </div>

    <div v-else-if="error" class="nk-error-state">
      <div class="nk-error-state__icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <path d="M12 9v4" /><path d="M12 17h.01" />
        </svg>
      </div>
      <div class="nk-error-state__title">贪饕污染数据加载失败</div>
      <div class="nk-error-state__detail">{{ error }}</div>
      <button class="nk-error-state__retry" type="button" @click="retry">RETRY</button>
    </div>

    <template v-else-if="data">
      <div class="nk-vor-bar">
        <div class="nk-vor-bar__inner">
          <nav class="nk-secnav nk-vor-secnav" aria-label="内容区块导航">
            <button
              v-for="s in sections"
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
        <div class="nk-vor-bar__progress" :style="{ width: `${progress}%` }"></div>
      </div>

      <button
        v-show="showTop"
        class="nk-top-btn"
        type="button"
        aria-label="返回顶部"
        @click="scrollTop"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
      </button>

      <header class="nk-vor-hero">
        <h1 class="nk-vor-hero__title">贪饕污染</h1>
        <p v-if="activity?.name" class="nk-vor-hero__act">{{ activity.name }}</p>
      </header>

      <div class="nk-panels">
        <div class="nk-panel nk-panel--active">
          <!-- 01 玩法概览 -->
          <section v-if="shownSections.has('overview')" id="vor-overview" class="nk-vor-sec">
            <h2 class="nk-title"><span class="nk-title__idx">{{ sectionIdx('overview') }}</span>玩法概览 OVERVIEW</h2>
            <p v-if="introHtml" class="nk-vor-intro" v-html="introHtml"></p>
            <dl class="nk-vor-facts">
              <div v-if="activity?.panel_id != null" class="nk-vor-fact">
                <dt>活动编号</dt>
                <dd>{{ activity.panel_id }}</dd>
              </div>
              <div v-if="activity?.unlock_mission_id != null" class="nk-vor-fact">
                <dt>解锁任务</dt>
                <dd>{{ activity.unlock_mission_id }}</dd>
              </div>
            </dl>
          </section>

          <!-- 02 污染等级与愿力 -->
          <section v-if="shownSections.has('scores')" id="vor-scores" class="nk-vor-sec">
            <h2 class="nk-title"><span class="nk-title__idx">{{ sectionIdx('scores') }}</span>污染等级与愿力 WILL</h2>
            <div v-if="activity?.scores?.length" class="nk-vor-scores">
              <span class="nk-vor-scores__label">愿力档位</span>
              <span v-for="(v, i) in activity.scores" :key="i" class="nk-vor-score">{{ v }}</span>
            </div>
            <ol v-if="progressSteps.length" class="nk-vor-steps">
              <li v-for="(p, i) in progressSteps" :key="i" class="nk-vor-step">
                <span class="nk-vor-step__no">{{ String(i + 1).padStart(2, '0') }}</span>
                <div class="nk-vor-step__main">
                  <p v-if="p.html" class="nk-vor-step__desc" v-html="p.html"></p>
                  <div class="nk-vor-step__meter">
                    <div v-if="p.progress != null" class="nk-vor-step__track">
                      <div class="nk-vor-step__fill" :style="{ width: `${ratioPct(p.progress)}%` }"></div>
                    </div>
                    <span v-if="p.progress != null" class="nk-vor-step__pct">{{ fmtPct(p.progress) }}</span>
                  </div>
                </div>
              </li>
            </ol>
          </section>

          <!-- 03 「贪饕」侵蚀 -->
          <section v-if="shownSections.has('invasion')" id="vor-invasion" class="nk-vor-sec">
            <h2 class="nk-title"><span class="nk-title__idx">{{ sectionIdx('invasion') }}</span>「贪饕」侵蚀 INVASION</h2>

            <div v-if="levels.length" class="nk-vor-group">
              <h3 class="nk-vor-group__title">敌方强化</h3>
              <div class="nk-vor-levels">
                <article v-for="l in levels" :key="l.invasion_id" class="nk-vor-level">
                  <header class="nk-vor-level__head">
                    <img
                      v-if="l.icon"
                      class="nk-vor-level__icon"
                      :src="buffIconUrl(l.buff)"
                      alt=""
                      loading="lazy"
                      @error="buffIconError"
                    >
                    <span class="nk-vor-level__no">污染等级 {{ l.invasion_id }}</span>
                    <span v-if="l.maze_buff_id != null" class="nk-vor-code">#{{ l.maze_buff_id }}</span>
                    <span v-if="l.binding" class="nk-vor-code nk-vor-code--bind">{{ l.binding }}</span>
                  </header>
                  <p v-if="l.html" class="nk-vor-level__desc" v-html="l.html"></p>
                </article>
              </div>
            </div>

            <div v-if="buffLevels.length" class="nk-vor-group">
              <h3 class="nk-vor-group__title">玩家支援</h3>
              <div class="nk-vor-buffs">
                <article v-for="b in buffLevels" :key="b.buff_id" class="nk-vor-buff">
                  <header class="nk-vor-buff__head">
                    <img
                      v-if="b.icon"
                      class="nk-vor-buff__icon"
                      :src="buffIconUrl(b.buff)"
                      alt=""
                      loading="lazy"
                      @error="buffIconError"
                    >
                    <span class="nk-vor-buff__lv">LV {{ b.level }}</span>
                    <h4 v-if="b.name" class="nk-vor-buff__name">{{ b.name }}</h4>
                    <span class="nk-vor-code">#{{ b.buff_id }}</span>
                  </header>
                  <p v-if="b.html" class="nk-vor-buff__desc" v-html="b.html"></p>
                  <div v-if="b.progress_percent != null" class="nk-vor-buff__pct">
                    愿力进度 <span class="nk-vor-buff__pctval">{{ fmtPct(b.progress_percent) }}</span>
                  </div>
                </article>
              </div>
            </div>
          </section>

          <!-- 04 波及关卡 -->
          <section v-if="shownSections.has('stages')" id="vor-stages" class="nk-vor-sec">
            <h2 class="nk-title"><span class="nk-title__idx">{{ sectionIdx('stages') }}</span>波及关卡与被污染怪物 STAGES</h2>
            <div v-for="g in stageGroups" :key="g.invasionId" class="nk-vor-stgroup">
              <header class="nk-vor-stgroup__head">
                <span class="nk-vor-stgroup__badge">污染等级 {{ g.invasionId }}</span>
                <span class="nk-vor-stgroup__count">{{ g.stages.length }} 关</span>
              </header>
              <div class="nk-vor-stages">
                <article v-for="s in g.stages" :key="s.stage_id" class="nk-vor-stage">
                  <div class="nk-vor-stage__id">{{ s.stage_id }}</div>
                  <div v-if="s.scopes?.length" class="nk-vor-scopes">
                    <router-link
                      v-for="(sc, si) in s.scopes"
                      :key="si"
                      class="nk-vor-scope"
                      :to="`/endgame/${sc.mode}/${sc.season_id}`"
                      :title="`${modeLabel(sc.mode)} · ${sc.season_name}`"
                    >
                      <span class="nk-vor-scope__mode">{{ modeLabel(sc.mode) }}</span>
                      <span class="nk-vor-scope__name">{{ sc.season_name }}</span>
                      <span class="nk-vor-scope__pos">{{ scopePosition(sc) }}</span>
                    </router-link>
                  </div>
                  <div v-if="s.monsters?.length" class="nk-vor-mons">
                    <span v-for="(m, i) in s.monsters" :key="i" class="nk-vor-mon">
                      <img
                        v-if="m.icon"
                        class="nk-vor-mon__icon"
                        :src="monsterIconUrl(m.icon)"
                        alt=""
                        loading="lazy"
                        :data-cdn-fallback="iconFallback(monsterIconUrl(m.icon))"
                      >
                      <router-link
                        v-if="m.detail_id"
                        class="nk-vor-mon__name nk-vor-mon__name--link"
                        :to="`/monster/${m.detail_id}`"
                      >{{ m.name || `#${m.monster_id}` }}</router-link>
                      <span v-else class="nk-vor-mon__name">{{ m.name || `#${m.monster_id}` }}</span>
                    </span>
                  </div>
                </article>
              </div>
            </div>
          </section>

          <!-- 05 状态词条 -->
          <section v-if="shownSections.has('statuses')" id="vor-statuses" class="nk-vor-sec">
            <h2 class="nk-title"><span class="nk-title__idx">{{ sectionIdx('statuses') }}</span>状态词条 STATUS</h2>
            <div class="nk-vor-statuses">
              <article v-for="st in statuses" :key="st.status_id" class="nk-vor-status">
                <header class="nk-vor-status__head">
                  <img
                    v-if="st.icon"
                    class="nk-vor-status__icon"
                    :src="buffIconUrl(st.buff)"
                    alt=""
                    loading="lazy"
                    @error="buffIconError"
                  >
                  <h3 class="nk-vor-status__name">{{ st.name }}</h3>
                  <span v-if="st.type" class="nk-vor-status__type">{{ st.type }}</span>
                </header>
                <p v-if="st.html" class="nk-vor-status__desc" v-html="st.html"></p>
                <div class="nk-vor-status__meta">
                  <span class="nk-vor-code">#{{ st.status_id }}</span>
                  <span v-if="st.modifier" class="nk-vor-code">{{ st.modifier }}</span>
                  <span v-if="st.can_dispel != null" class="nk-vor-status__flag">
                    {{ st.can_dispel ? '可驱散' : '不可驱散' }}
                  </span>
                </div>
              </article>
            </div>
          </section>

          <!-- 06 教程图文 -->
          <section v-if="shownSections.has('tutorials')" id="vor-tutorials" class="nk-vor-sec">
            <h2 class="nk-title"><span class="nk-title__idx">{{ sectionIdx('tutorials') }}</span>教程图文 TUTORIAL</h2>
            <div class="nk-vor-tutorials">
              <figure v-for="t in tutorials" :key="t.id" class="nk-vor-tutorial">
                <div v-if="t.image" class="nk-vor-tutorial__frame">
                  <img
                    class="nk-vor-tutorial__img"
                    :src="tutorialPicUrl(t.image)"
                    alt=""
                    loading="lazy"
                    :data-cdn-fallback="iconFallback(tutorialPicUrl(t.image))"
                  >
                </div>
                <figcaption class="nk-vor-tutorial__cap">
                  <span class="nk-vor-code">#{{ t.id }}</span>
                  <span v-if="t.html" class="nk-vor-tutorial__desc" v-html="t.html"></span>
                </figcaption>
              </figure>
            </div>
          </section>

          <!-- 07 货币战争位面词条 -->
          <section v-if="shownSections.has('affixes')" id="vor-affixes" class="nk-vor-sec">
            <h2 class="nk-title"><span class="nk-title__idx">{{ sectionIdx('affixes') }}</span>货币战争位面词条 AFFIX</h2>
            <div class="nk-vor-affixes">
              <article v-for="a in affixes" :key="a.id" class="nk-vor-affix">
                <header class="nk-vor-affix__head">
                  <img
                    v-if="a.iconUrl"
                    class="nk-vor-affix__icon"
                    :src="a.iconUrl"
                    alt=""
                    loading="lazy"
                    :data-cdn-fallback="iconFallback(a.iconUrl)"
                  >
                  <h4 class="nk-vor-affix__name">{{ a.name }}</h4>
                  <span class="nk-vor-code">#{{ a.id }}</span>
                </header>
                <p v-if="a.html" class="nk-vor-affix__desc" v-html="a.html"></p>
                <div v-if="a.params?.length" class="nk-vor-params">
                  <span class="nk-vor-params__label">参数</span>
                  <span v-for="(p, i) in a.params" :key="i" class="nk-vor-param">{{ p }}</span>
                </div>
              </article>
            </div>
          </section>

          <!-- 08 「污染」同形词说明 -->
          <section v-if="shownSections.has('disambig')" id="vor-disambig" class="nk-vor-sec">
            <h2 class="nk-title"><span class="nk-title__idx">{{ sectionIdx('disambig') }}</span>「污染」同形词说明 NOTE</h2>
            <!-- 与 tools/gen-ai-endpoints.mjs 的 VORACITY_DISAMBIGUATION 逐字一致（契约：同一分区文本对所有 UA 一致） -->
            <p class="nk-vor-note">
              本页「污染」指「贪饕」侵蚀污染；4.5 联动「命运/今晚留下来」的「圣杯战争 · 污染等级 1–7 / 深度污染 / 污染词条」是另一套无关体系，两者不合并叙述、也不互相内链。
            </p>
          </section>
        </div>
      </div>
    </template>
  </div>
</template>
