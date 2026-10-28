<script setup lang="ts">
import { computed, nextTick, ref, useId } from 'vue';
import { bossTraitDescHtml } from './renders';
import { sharedPhaseAnswer } from './boss-guide';
import { tabNextIndex } from './tabs';
import { fmtDesc } from '../../lib/format';
import { translate } from '../i18n';
import type { MazeBossGuide, MazeBossPhase } from '../../services/types';

const t = translate;
const props = defineProps<{
  guide: MazeBossGuide;
  owner: string;
  phase: number;
}>();

const emit = defineEmits<{ 'update:phase': [phase: number] }>();

const phases = computed<MazeBossPhase[]>(() => props.guide.phases ?? []);
const tabbed = computed(() => phases.value.length > 1);
const current = computed<MazeBossPhase | null>(
  () => (tabbed.value ? phases.value[props.phase - 1] ?? phases.value[0] : phases.value[0]) ?? null,
);
const tabsRef = ref<HTMLElement | null>(null);

const uid = useId();
const panelId = `${uid}-phase-panel`;
const tabId = (index: number): string => `${uid}-phase-${index}`;
const titleId = `${uid}-phase-title`;
const activeTabId = computed(() => (tabbed.value ? tabId(Math.max(0, props.phase - 1)) : titleId));

const sharedAnswer = computed<string | null>(() => sharedPhaseAnswer(phases.value));

function select(phase: number): void {
  emit('update:phase', phase);
}

function onKeydown(e: KeyboardEvent, i: number): void {
  const next = tabNextIndex(e.key, i, phases.value.length);
  if (next < 0) return;
  e.preventDefault();
  select(next + 1);
  void nextTick(() => {
    tabsRef.value?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
  });
}
</script>

<template>
  <section v-if="guide.traits?.length" class="nk-egd-traits">
    <header class="nk-egd-traits__head">
      <h2 class="nk-egd-traits__title">{{ t('egd.bossTraits') }}</h2>
      <span class="nk-egd-traits__owner">{{ owner }}</span>
    </header>
    <div class="nk-egd-traits__list">
      <article v-for="tr in guide.traits" :key="tr.id" class="nk-egd-traits__item">
        <h3 class="nk-egd-traits__name">{{ tr.name }}</h3>
        <p v-if="tr.desc" class="nk-egd-traits__desc" v-html="bossTraitDescHtml(tr)"></p>
      </article>
    </div>
  </section>
  <section v-if="phases.length" class="nk-egd-phase">
    <header class="nk-egd-phase__head">
      <h2 class="nk-egd-phase__label">{{ t('mob.sec.guide') }}</h2>
      <div
        v-if="tabbed"
        ref="tabsRef"
        class="nk-egd-phase__tabs"
        role="tablist"
        :aria-label="t('mob.sec.guide')"
      >
        <button
          v-for="(p, i) in phases"
          :id="tabId(i)"
          :key="p.id"
          type="button"
          role="tab"
          class="nk-egd-phase__tab"
          :class="{ 'nk-egd-phase__tab--active': phase === i + 1 }"
          :aria-selected="phase === i + 1"
          :aria-controls="panelId"
          :tabindex="phase === i + 1 ? 0 : -1"
          @click="select(i + 1)"
          @keydown="onKeydown($event, i)"
        >{{ p.name }}</button>
      </div>
    </header>
    <div
      v-if="current"
      :id="panelId"
      class="nk-egd-phase__item"
      :class="{ 'nk-egd-phase__item--split': Boolean(current.skills?.length) }"
      :role="tabbed ? 'tabpanel' : undefined"
      :aria-labelledby="activeTabId"
    >
      <div class="nk-egd-phase__main">
        <h3
          :id="titleId"
          class="nk-egd-phase__name"
          :class="{ 'nk-egd-phase__name--sr': tabbed }"
        >{{ current.name }}</h3>
        <p v-if="current.desc" class="nk-egd-phase__desc" v-html="fmtDesc(current.desc, [])"></p>
        <p v-if="current.answer && !sharedAnswer" class="nk-egd-phase__answer" v-html="fmtDesc(current.answer, [])"></p>
      </div>
      <ul v-if="current.skills?.length" class="nk-egd-phase__skills">
        <li v-for="s in current.skills" :key="s.name" class="nk-egd-phase__skill">
          <span class="nk-egd-phase__skillname">{{ s.name }}</span>
          <span v-if="s.desc" class="nk-egd-phase__skilldesc" v-html="fmtDesc(s.desc, [])"></span>
        </li>
      </ul>
    </div>
    <p v-if="sharedAnswer" class="nk-egd-phase__answer nk-egd-phase__answer--shared" v-html="fmtDesc(sharedAnswer, [])"></p>
  </section>
</template>
