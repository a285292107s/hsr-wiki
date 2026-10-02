<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import { cdnUri } from '../../services/cdn';
import { elemRow, lastWaveBoss } from './renders';
import { tabNextIndex } from './tabs';
import type { MazeStageDetail } from '../../services/types';

/** 战斗卡片行（层 tab 的半场卡片 / 星启看板的节点卡片共用）：
 *  卡片兼作子切换与身份位——一场战斗的「打谁（末波首领图）/ 什么属性 / 多少级 / 几回合」同屏可比，
 *  看板内因此不再复述这四项。 */
const props = defineProps<{
  items: {
    key: string;
    label: string;
    stage: MazeStageDetail | undefined;
    level: number;
    /** 该层回合上限（层共用值，缺省或 0 不渲染——末日幻影层恒为 0） */
    countdown?: number;
  }[];
  /** 当前选中卡的 key */
  active: string;
  /** tab id 前缀：`${idPrefix}-${key}`，与看板的 aria-labelledby 同源 */
  idPrefix: string;
  /** tablist 的无障碍名（星启 =「星启节点」/ 层 =「半场」） */
  tabsLabel: string;
  /** 卡片 aria-controls 指向的看板 id */
  panelId: string;
}>();

const emit = defineEmits<{ select: [key: string] }>();

const listRef = ref<HTMLElement | null>(null);

const cards = computed(() => props.items.map((it) => {
  const boss = lastWaveBoss(it.stage?.monsters);
  return {
    key: it.key,
    label: it.label,
    icon: boss?.icon ? cdnUri('monstermiddleicon', `${boss.icon}.webp`) : '',
    elems: it.stage?.damage?.length ? elemRow(it.stage.damage) : '',
    level: it.level,
    countdown: it.countdown || 0,
  };
}));

function onKeydown(e: KeyboardEvent, i: number): void {
  const next = tabNextIndex(e.key, i, props.items.length);
  if (next < 0) return;
  e.preventDefault();
  const it = props.items[next];
  if (!it) return;
  emit('select', it.key);
  void nextTick(() => {
    listRef.value?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
  });
}
</script>

<template>
  <div
    ref="listRef"
    class="nk-egd-nodecards"
    role="tablist"
    :aria-label="tabsLabel"
  >
    <button
      v-for="(t, i) in cards"
      :id="`${idPrefix}-${t.key}`"
      :key="t.key"
      type="button"
      role="tab"
      class="nk-egd-nodecard"
      :class="{ 'nk-egd-nodecard--active': t.key === active }"
      :aria-selected="t.key === active"
      :aria-controls="panelId"
      :tabindex="t.key === active ? 0 : -1"
      @click="emit('select', t.key)"
      @keydown="onKeydown($event, i)"
    >
      <span class="nk-egd-nodecard__fig">
        <img
          v-if="t.icon"
          class="nk-egd-nodecard__img"
          :src="t.icon"
          alt=""
          loading="lazy"
          @error="($event.target as HTMLImageElement).classList.add('nk-img-error')"
        >
      </span>
      <span class="nk-egd-nodecard__body">
        <span class="nk-egd-nodecard__name">{{ t.label }}</span>
        <span v-if="t.elems" class="nk-egd-nodecard__row nk-egd-nodecard__row--elems">
          <span class="nk-egd-nodecard__label">推荐属性</span>
          <span class="nk-egd-nodecard__elems" v-html="t.elems"></span>
        </span>
        <span v-if="t.level" class="nk-egd-nodecard__row nk-egd-nodecard__row--level">
          <span class="nk-egd-nodecard__label">等级</span>
          <span class="nk-egd-nodecard__val">{{ t.level }}</span>
        </span>
        <span v-if="t.countdown" class="nk-egd-nodecard__row nk-egd-nodecard__row--level">
          <span class="nk-egd-nodecard__label">回合</span>
          <span class="nk-egd-nodecard__val">{{ t.countdown }}</span>
        </span>
      </span>
    </button>
  </div>
</template>
