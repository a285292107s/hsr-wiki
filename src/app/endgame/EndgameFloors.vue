<script setup lang="ts">
/**
 * 终局赛季详情 · 关卡层级面板（以层级为章节，倒序：最高层在前）。
 * 层级默认折叠（>6 层），层头即索引；折叠状态机本地化，数据变化时按阈值重新初始化。
 */
import { computed, ref, watch } from 'vue';
import { buildEndgameSections, sectionIdxMap } from './sections';
import {
  BUFF_ICON_FALLBACK, buffDescHtml, buffIconUrl, mergedMonCount, phaseDamage,
  stageDamageSummary, targetHtml,
} from './renders';
import StageContent from './StageContent.vue';
import type { MazeFloorDetail, MazeListEntry } from '../../services/types';

const props = defineProps<{
  data: MazeListEntry;
  modeKey: string;
  floorSections: MazeFloorDetail[];
}>();

/** 板块编号（与吸顶条导航同源：sections.ts 单一事实源） */
const sectionIdx = computed(() => sectionIdxMap(buildEndgameSections(props.data, props.modeKey, [])));

/* ═══════════ 层级折叠状态机 ═══════════ */

/** 展开的层级集合（key：MazeFloorDetail.floor） */
const expanded = ref<Set<number>>(new Set());
/** 默认展开阈值：层级 ≤6 全展开（开箱即读），>6 全折叠（10+ 层紧凑索引） */
const EXPAND_THRESHOLD = 6;
function initExpanded(): void {
  expanded.value = new Set(props.floorSections.length > EXPAND_THRESHOLD ? [] : props.floorSections.map((f) => f.floor));
}
/** 数据（赛季/模式）变化时按阈值重新初始化；组件实例复用不残留上一赛季折叠状态 */
watch(
  () => props.floorSections,
  () => initExpanded(),
  { immediate: true },
);
function toggleFloor(id: number): void {
  const s = new Set(expanded.value);
  if (s.has(id)) s.delete(id); else s.add(id);
  expanded.value = s;
}
function expandAll(): void { expanded.value = new Set(props.floorSections.map((f) => f.floor)); }
function collapseAll(): void { expanded.value = new Set(); }
const allExpanded = computed(() => props.floorSections.length > 0 && expanded.value.size === props.floorSections.length);
const noneExpanded = computed(() => expanded.value.size === 0);
function isExpanded(id: number): boolean { return expanded.value.has(id); }
</script>

<template>
  <template v-if="floorSections.length">
    <h2 id="egd-floors" class="nk-title">
      <span class="nk-title__idx">{{ sectionIdx['floors'] }}</span>关卡层级 LEVELS
      <!-- 章节工具行：层级批量展开/折叠（仅多层级时出现；随章节同屏，不再占用吸顶条） -->
      <span v-if="floorSections.length > 1" class="nk-egd-title-tools" role="group" aria-label="层级展开控制">
        <button v-if="!allExpanded" type="button" class="nk-egd-title-tool" @click="expandAll">全部展开</button>
        <button v-if="!noneExpanded" type="button" class="nk-egd-title-tool" @click="collapseAll">全部折叠</button>
      </span>
    </h2>
    <div class="nk-egd-floors">
      <section
        v-for="(f, i) in floorSections"
        :key="f.floor"
        class="nk-egd-floor"
        :class="{ 'nk-egd-floor--open': isExpanded(f.floor) }"
        :style="{ '--i': i }"
        :aria-labelledby="`floor-title-${f.floor}`"
      >
        <!-- 层头（button：点击切换折叠；折叠态即层级索引） -->
        <button
          type="button"
          class="nk-egd-floor__head"
          :aria-expanded="isExpanded(f.floor)"
          :aria-controls="`egd-floor-${f.floor}`"
          @click="toggleFloor(f.floor)"
        >
          <svg class="nk-egd-floor__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>
          <!-- 按钮内不能直接嵌套 h3（内容模型仅 phrasing）；role=heading 补标题语义，与 peak 关卡组成的 h3 大纲对齐 -->
          <span :id="`floor-title-${f.floor}`" class="nk-egd-floor__title" role="heading" aria-level="3">第 {{ f.floor }} 层</span>
          <span v-if="f.name" class="nk-egd-floor__name">{{ f.name }}</span>
          <span
            v-if="f.level || f.countdown || (modeKey === 'story' && data.clear_score)"
            class="nk-egd-floor__data"
          >
            <span v-if="f.level" class="nk-egd-floor__dataitem">
              <span class="nk-egd-floor__dataval">{{ f.level }}</span>
              <span class="nk-egd-floor__datalabel">等级</span>
            </span>
            <span v-if="f.countdown" class="nk-egd-floor__dataitem">
              <span class="nk-egd-floor__dataval">{{ f.countdown }}</span>
              <span class="nk-egd-floor__datalabel">回合</span>
            </span>
            <span v-if="modeKey === 'story' && data.clear_score" class="nk-egd-floor__dataitem">
              <span class="nk-egd-floor__dataval">{{ data.clear_score.toLocaleString() }}</span>
              <span class="nk-egd-floor__datalabel">分数线</span>
            </span>
          </span>
        </button>
        <!-- 折叠态摘要：推荐属性（上下半场合并去重） -->
        <div v-if="!isExpanded(f.floor)" class="nk-egd-floor__summary">
          <template v-if="stageDamageSummary(f)">
            <span class="nk-egd-floor__summarylabel">推荐属性</span>
            <span class="nk-egd-floor__elems" v-html="stageDamageSummary(f)"></span>
          </template>
          <span v-if="mergedMonCount(f)" class="nk-egd-floor__summarydata">{{ mergedMonCount(f) }}</span>
        </div>
        <!-- 展开体（grid-rows 折叠动画）；折叠时 inert 整体移出焦点序与可访达范围 -->
        <div
          :id="`egd-floor-${f.floor}`"
          class="nk-egd-floor__body"
          :inert="!isExpanded(f.floor)"
        >
          <div class="nk-egd-floor__body-inner">

            <!-- 上下半场模块（单阶段层仅上半场）；末日幻影为阶段制，优先渲染阶段清单（含第 3 阶段）。
             阶段制与上下半场均经 StageContent 统一渲染（阶段构造 MazeStageDetail），保证同语义 DOM 结构一致 -->
            <div class="nk-egd-floor__stages">
              <template v-if="modeKey === 'boss' && f.phases?.length">
                <StageContent
                  v-for="(p, pi) in f.phases"
                  :key="p.id"
                  :label="`阶段 ${pi + 1}`"
                  :stage="{ damage: phaseDamage(f, pi), monsters: [p] }"
                  :is-boss="true"
                />
              </template>
              <template v-else>
                <StageContent label="上半场" :stage="f.stage1" :is-boss="modeKey === 'boss'" />
                <StageContent label="下半场" :stage="f.stage2" :is-boss="modeKey === 'boss'" />
              </template>
            </div>

            <!-- 可用增益（层级 MazeBuff，如记忆紊流） -->
            <div v-if="f.buff" class="nk-egd-floor__buff">
              <div class="nk-egd-floor__buffhead">
                <img v-if="f.buff.icon" class="nk-egd-buff__icon nk-egd-buff__icon--sm" :src="buffIconUrl(f.buff)" alt="" loading="lazy" @error="($event.target as HTMLImageElement).src = BUFF_ICON_FALLBACK">
                <span class="nk-egd-floor__bufflabel">可用增益</span>
                <span class="nk-egd-floor__buffname">{{ f.buff.name }}</span>
              </div>
              <p v-if="f.buff.desc" class="nk-egd-floor__buffdesc" v-html="buffDescHtml(f.buff)"></p>
            </div>

            <!-- 层级挑战目标 -->
            <ol v-if="f.targets?.length" class="nk-egd-floor__targets">
              <li v-for="(t, ti) in f.targets" :key="ti" class="nk-egd-floor__target">
                <span class="nk-egd-floor__targetidx">{{ String(ti + 1).padStart(2, '0') }}</span>
                <span class="nk-egd-floor__targettext" v-html="targetHtml(t)"></span>
              </li>
            </ol>
          </div>
        </div>
      </section>
    </div>
  </template>
</template>