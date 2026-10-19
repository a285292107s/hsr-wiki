<script setup lang="ts">
import { computed } from 'vue';
import EndgameSummons from '../endgame/EndgameSummons.vue';
import { elemLabel } from '../../lib/enum-labels';
import EndgameBossGuide from '../endgame/EndgameBossGuide.vue';
import { pollutionLabel } from '../endgame/pollution';
import type { MazeBossGuide, MazeMonsterInfo } from '../../services/types';

import { monsterRankKey } from '../../lib/enum-labels';
import { escHtml, elementIconUrl, fmtBigNumber } from '../../lib/format';
import { cdnUri, cdnImgFallbackAttr } from '../../services/cdn';

import { translate } from '../i18n';

const t = translate;

type MonsterSkill = NonNullable<MazeMonsterInfo['skills']>[number];
const props = defineProps<{
  monster: MazeMonsterInfo;
  polluted?: number;
  guide?: MazeBossGuide;
}>();

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

function skillPhases(list?: number[]): number[] {
  return (list || []).filter((p) => p > 0);
}

const skillGroups = computed<{ phase: number | null; skills: MonsterSkill[] }[]>(() => {
  const skills = props.monster.skills || [];
  const phases = [...new Set(skills.flatMap((s) => skillPhases(s.phase_list)))]
    .sort((a, b) => a - b);
  if (phases.length < 2) return [{ phase: null, skills }];
  const groups: { phase: number | null; skills: MonsterSkill[] }[] = phases.map((p) => ({
    phase: p,
    skills: skills.filter((s) => skillPhases(s.phase_list).includes(p)),
  }));
  const rest = skills.filter((s) => !skillPhases(s.phase_list).length);
  if (rest.length) groups.push({ phase: null, skills: rest });
  return groups;
});
const skillsGrouped = computed(() => skillGroups.value.some((g) => g.phase !== null));

const hpRows = computed<{ label: string; value: number }[]>(() => {
  const phases = props.monster.phase_hp;
  if (phases?.length) {
    return phases.map((v, i) => ({ label: t('mob.stage', { n: i + 1 }), value: v }));
  }
  return props.monster.hp != null
    ? [{ label: t('catalog.sig.hp'), value: props.monster.hp }]
    : [];
});
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
        :class="{ 'nk-egd-mon__hp--phases': hpRows.length > 1 }"
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
        <span class="nk-egd-mon__name">{{ monster.name }}</span>
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
      <EndgameBossGuide v-if="guide" :guide="guide" />
      <div
        v-if="monster.skills?.length"
        class="nk-egd-mon__skills"
        :class="{ 'nk-egd-mon__skills--grouped': skillsGrouped }"
      >
        <div v-for="g in skillGroups" :key="g.phase ?? 'rest'" class="nk-egd-mon__skillgroup">
          <span v-if="g.phase !== null" class="nk-egd-mon__skillphase">{{ t('mob.stage', { n: g.phase }) }}</span>
          <span
            v-for="s in g.skills"
            :key="s.name"
            class="nk-egd-mon__skill"
            :title="s.tag ? `${s.name} · ${s.tag}` : s.name"
          >{{ s.name }}</span>
        </div>
      </div>
      <EndgameSummons :items="monster.summons || []" />
    </div>
  </article>
</template>
