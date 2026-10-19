<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import { cdnUri } from '../../services/cdn';
import { elemRow, lastWaveBoss } from './renders';
import { tabNextIndex } from './tabs';
import type { MazeStageDetail } from '../../services/types';


import { translate } from '../i18n';
const props = defineProps<{
  items: {
    key: string;
    label: string;
    stage: MazeStageDetail | undefined;
    level: number;
    countdown?: number;
    danger?: string;
  }[];
  active: string;
  idPrefix: string;
  tabsLabel: string;
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
    danger: it.danger || '',
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
        <span class="nk-egd-nodecard__title">
          <span class="nk-egd-nodecard__name">{{ t.label }}</span>
          <span
            v-if="t.danger"
            class="nk-egd-nodecard__danger"
            role="img"
            :aria-label="t.danger"
            :title="t.danger"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                class="nk-egd-nodecard__danger-tri"
                d="M10.6 3.4c.3-.5.8-.8 1.4-.8s1.1.3 1.4.8l8.6 15.1c.6 1-.2 2.3-1.4 2.3H3.4c-1.2 0-2-1.3-1.4-2.3z"
              />
              <rect class="nk-egd-nodecard__danger-mark" x="11" y="8.2" width="2" height="5.4" rx="1" />
              <circle class="nk-egd-nodecard__danger-mark" cx="12" cy="16.9" r="1.15" />
            </svg>
          </span>
        </span>
        <span v-if="t.elems" class="nk-egd-nodecard__row nk-egd-nodecard__row--elems">
          <span class="nk-egd-nodecard__label">{{ translate('egd.label.attr') }}</span>
          <span class="nk-egd-nodecard__elems" v-html="t.elems"></span>
        </span>
        <span v-if="t.level" class="nk-egd-nodecard__row nk-egd-nodecard__row--level">
          <span class="nk-egd-nodecard__label">{{ translate('egd.label.level') }}</span>
          <span class="nk-egd-nodecard__val">{{ t.level }}</span>
        </span>
        <span v-if="t.countdown" class="nk-egd-nodecard__row nk-egd-nodecard__row--level">
          <span class="nk-egd-nodecard__label">{{ translate('egd.score.rounds') }}</span>
          <span class="nk-egd-nodecard__val">{{ t.countdown }}</span>
        </span>
      </span>
    </button>
  </div>
</template>
