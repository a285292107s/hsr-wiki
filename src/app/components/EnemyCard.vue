<script setup lang="ts">
import { computed, nextTick, ref, useId, watch } from 'vue';
import EndgameSummons from '../endgame/EndgameSummons.vue';
import { elemLabel } from '../../lib/enum-labels';
import { pollutionLabel } from '../endgame/pollution';
import { monsterPhases, phaseHpValue, phaseSkills } from '../endgame/monster-phases';
import { tabNextIndex } from '../endgame/tabs';
import type { MazeMonsterInfo } from '../../services/types';

import { monsterRankKey } from '../../lib/enum-labels';
import { escHtml, elementIconUrl, fmtBigNumber } from '../../lib/format';
import { cdnUri, cdnImgFallbackAttr } from '../../services/cdn';

import { translate } from '../i18n';

const t = translate;

type MonsterSkill = NonNullable<MazeMonsterInfo['skills']>[number];
const props = defineProps<{
  monster: MazeMonsterInfo;
  polluted?: number;
  phase?: number;
}>();

const uid = useId();
const panelId = `${uid}-phase-panel`;
const phaseTabId = (phase: number): string => `${uid}-phase-${phase}`;

function elemRow(types: string[]): string {
  return types.map((d) => {
    const src = elementIconUrl(d);
    return src
      ? `<img class="nk-egd-elem" src="${escHtml(src)}"${cdnImgFallbackAttr(src)} alt="${escHtml(elemLabel(d))}" title="${escHtml(elemLabel(d))}" loading="lazy">`
      : '';
  }).join('');
}

function monRank(rank?: string): string {
  return rank ? translate(monsterRankKey(rank)) : '';
}

function resistText(m: MazeMonsterInfo): string {
  const es = Object.entries(m.resist || {});
  if (!es.length) return '';
  return es.map(([d, v]) => `${elemLabel(d)} ${Math.round(v * 100)}%`).join(' / ');
}

function resistRowHtml(m: MazeMonsterInfo): string {
  const es = Object.entries(m.resist || {});
  if (!es.length) return '';
  return es.map(([d, v]) => {
    const src = elementIconUrl(d);
    if (!src) return '';
    const label = elemLabel(d);
    const pct = `${Math.round(v * 100)}%`;
    return `<span class="nk-egd-mon__resitem"><img class="nk-egd-elem" src="${escHtml(src)}"${cdnImgFallbackAttr(src)} alt="${escHtml(label)}" title="${escHtml(label)} ${pct}" loading="lazy"><span class="nk-egd-mon__resval">${pct}</span></span>`;
  }).join('');
}

function debuffResistHtml(m: MazeMonsterInfo): string {
  return (m.debuff_resist || []).map((d) => {
    const src = cdnUri('statusimmune', `${d.icon}.webp`);
    const pct = `${Math.round(d.value * 100)}%`;
    const label = t('card.effectRes', { v: pct });
    return `<span class="nk-egd-mon__resitem" title="${escHtml(label)}"><img class="nk-egd-mon__immicon" src="${escHtml(src)}"${cdnImgFallbackAttr(src)} alt="" aria-hidden="true" loading="lazy"><span class="nk-egd-mon__resval">${pct}</span></span>`;
  }).join('');
}

function monTitle(m: MazeMonsterInfo): string {
  const parts = [m.name];
  const r = monRank(m.rank);
  if (r) parts.push(r);
  if (m.camp) parts.push(m.camp);
  if (m.stance) parts.push(t('card.value.stance', { v: m.stance }));
  if (m.speed) parts.push(t('card.value.speed', { v: m.speed }));
  if (m.weak?.length) parts.push(t('card.weak', { list: m.weak.map((d) => elemLabel(d)).join(' / ') }));
  const rs = resistText(m);
  if (rs) parts.push(t('card.resist', { list: rs }));
  return parts.join(' · ');
}

const phases = computed(() => monsterPhases(props.monster));
const phased = computed(() => phases.value.length > 1);
const ownPhase = ref(1);
const activePhase = computed(() => (phased.value && props.phase ? props.phase : ownPhase.value));
const phasesRef = ref<HTMLElement | null>(null);

watch(phases, (list) => {
  if (!list.includes(ownPhase.value)) ownPhase.value = list[0] ?? 1;
}, { immediate: true });
watch(() => props.monster, () => { ownPhase.value = 1; });

const emit = defineEmits<{ 'update:phase': [phase: number] }>();

const activeTabId = computed(() => phaseTabId(activePhase.value));
const hasSkills = computed(() => Boolean(props.monster.skills?.length));

const hpRows = computed<{ label: string; value: number }[]>(() => {
  const phaseHp = props.monster.phase_hp;
  if (phaseHp?.length) {
    const row = (phase: number, value: number) => ({ label: t('mob.stage', { n: phase }), value });
    if (phased.value) {
      const phase = activePhase.value;
      return [row(phase, phaseHpValue(props.monster, phase) ?? phaseHp[0])];
    }
    return phaseHp.map((value, i) => row(i + 1, value));
  }
  return props.monster.hp != null ? [{ label: t('catalog.sig.hp'), value: props.monster.hp }] : [];
});
const hpStacked = computed(() => hpRows.value.length > 1
  || (phased.value && Boolean(props.monster.phase_hp?.length)));

const visibleSkills = computed<MonsterSkill[]>(() => {
  const skills = props.monster.skills || [];
  return phased.value ? phaseSkills(props.monster, activePhase.value) : skills;
});

function selectPhase(phase: number): void {
  ownPhase.value = phase;
  emit('update:phase', phase);
}

function onPhaseKeydown(e: KeyboardEvent, i: number): void {
  const next = tabNextIndex(e.key, i, phases.value.length);
  if (next < 0) return;
  e.preventDefault();
  const phase = phases.value[next];
  if (!phase) return;
  selectPhase(phase);
  void nextTick(() => {
    phasesRef.value?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
  });
}
</script>

<template>
  <article class="nk-egd-mon" :title="monTitle(monster)">
    <div class="nk-egd-mon__art">
      <span v-if="monRank(monster.rank)" class="nk-egd-mon__rank" :class="`nk-egd-mon__rank--${monster.rank}`">{{ monRank(monster.rank) }}</span>
      <router-link
        class="nk-egd-mon__figlink"
        :to="`/monster/${monster.tpl || monster.id}`"
        :title="t('card.viewDetail', { name: monster.name })"
        :aria-label="t('card.viewDetail', { name: monster.name })"
      >
        <img
          class="nk-egd-mon__img"
          :src="monster.icon ? cdnUri('monstermiddleicon', `${monster.icon}.webp`) : ''"
          :alt="monster.name"
          loading="lazy"
          @error="($event.target as HTMLImageElement).classList.add('nk-img-error')"
        >
      </router-link>
      <span
        v-if="hpRows.length"
        class="nk-egd-mon__hp"
        :class="{ 'nk-egd-mon__hp--phases': hpStacked }"
      >
        <span v-for="r in hpRows" :key="r.label" class="nk-egd-mon__hprow">
          <span class="nk-egd-mon__hp-label">{{ r.label }}</span>
          <span class="nk-egd-mon__hp-val">{{ fmtBigNumber(r.value) }}</span>
        </span>
      </span>
      <span v-if="polluted" class="nk-egd-pollchip" :data-level="polluted">{{ pollutionLabel({ level: polluted }) }}</span>
    </div>
    <div class="nk-egd-mon__data">
      <div class="nk-egd-mon__meta">
        <div class="nk-egd-mon__head">
          <span class="nk-egd-mon__name">{{ monster.name }}</span>
          <div
            v-if="phased"
            ref="phasesRef"
            class="nk-egd-mon__phases"
            role="tablist"
            :aria-label="t('egd.monPhases')"
          >
            <button
              v-for="(phase, i) in phases"
              :id="phaseTabId(phase)"
              :key="phase"
              type="button"
              role="tab"
              class="nk-egd-mon__phase"
              :class="{ 'nk-egd-mon__phase--active': phase === activePhase }"
              :aria-selected="phase === activePhase"
              :aria-controls="hasSkills ? panelId : undefined"
              :tabindex="phase === activePhase ? 0 : -1"
              @click="selectPhase(phase)"
              @keydown="onPhaseKeydown($event, i)"
            >{{ t('mob.stage', { n: phase }) }}</button>
          </div>
        </div>
        <span class="nk-egd-mon__tags">
          <span v-if="monster.camp" class="nk-egd-mon__tag">{{ monster.camp }}</span>
          <span v-if="monster.stance" class="nk-egd-mon__tag">{{ t('card.value.stance', { v: monster.stance }) }}</span>
          <span v-if="monster.speed" class="nk-egd-mon__tag">{{ t('card.value.speed', { v: monster.speed }) }}</span>
        </span>
      </div>
      <div v-if="monster.name" class="nk-egd-mon__rows">
        <div class="nk-egd-mon__row">
          <span class="nk-egd-mon__label">{{ t('catalog.filter.weak') }}</span>
          <span v-if="monster.weak?.length" class="nk-egd-mon__weak" v-html="elemRow(monster.weak)"></span>
          <span v-else class="nk-egd-mon__none">{{ t('common.none') }}</span>
        </div>
        <div class="nk-egd-mon__row">
          <span class="nk-egd-mon__label">{{ t('catalog.sig.resist') }}</span>
          <span v-if="resistText(monster)" class="nk-egd-mon__resist" v-html="resistRowHtml(monster)"></span>
          <span v-else class="nk-egd-mon__none">{{ t('common.none') }}</span>
        </div>
        <div v-if="monster.debuff_resist?.length" class="nk-egd-mon__row">
          <span class="nk-egd-mon__label">{{ t('card.effectResLabel') }}</span>
          <span class="nk-egd-mon__resist" v-html="debuffResistHtml(monster)"></span>
        </div>
      </div>
      <div
        v-if="monster.skills?.length"
        :id="phased ? panelId : undefined"
        class="nk-egd-mon__skills"
        :role="phased ? 'tabpanel' : undefined"
        :aria-labelledby="phased ? activeTabId : undefined"
      >
        <span class="nk-egd-mon__seclabel">{{ t('mob.sec.skills') }}</span>
        <span
          v-for="s in visibleSkills"
          :key="s.name"
          class="nk-egd-mon__skill"
          :title="s.tag ? `${s.name} · ${s.tag}` : s.name"
        >{{ s.name }}</span>
      </div>
      <EndgameSummons :items="monster.summons || []" />
    </div>
  </article>
</template>
