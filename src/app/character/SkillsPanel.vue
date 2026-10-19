<script setup lang="ts">
import { computed } from 'vue';
import { skillTypeLabel } from '../../lib/enum-labels';
import SkillCard from './SkillCard.vue';
import SectionIndex from './SectionIndex.vue';
import { groupSkillsByFamily } from '../../lib/skill-family';
import { assignAnimEntries, memoAnimKey } from '../../lib/skill-anim';
import { SECTION_IDX } from './sections';

import type { CharacterData, Skill, SkillAnimEntry, SkillAnimationsDb } from '../../services/types';

import { translate } from '../i18n';

const t = translate;
const props = defineProps<{
  d: CharacterData;
  charId: string;
  enhKey: string | null;
  animDb: SkillAnimationsDb | null;
}>();

const charAnims = computed(() => {
  const db = props.animDb;
  if (!db || !props.charId) return null;
  return db[props.charId] || null;
});

function animFor(sk: Skill): SkillAnimEntry[] | null {
  const db = charAnims.value;
  if (!db) return null;
  return db[sk.type ?? ''] || null;
}

const skillFamilies = computed(() =>
  groupSkillsByFamily(props.d.skills, props.d.skill_trees),
);

const memoSkills = computed<Skill[]>(() =>
  props.d.memosprite && props.d.memosprite.skills
    ? Object.values(props.d.memosprite.skills)
    : [],
);

const memoAnimMap = computed<Record<number, SkillAnimEntry[]>>(() => {
  const db = charAnims.value;
  const map: Record<number, SkillAnimEntry[]> = {};
  if (!db) return map;
  const groups = new Map<string, Skill[]>();
  for (const ms of memoSkills.value) {
    const key = memoAnimKey(ms);
    const group = groups.get(key);
    if (group) group.push(ms);
    else groups.set(key, [ms]);
  }
  for (const [key, group] of groups) Object.assign(map, assignAnimEntries(db[key], group));
  return map;
});

function skillAnchor(id: number): string {
  return `nk-skill-${id}`;
}

const indexItems = computed(() => [
  ...skillFamilies.value.map((g) => ({
    id: skillAnchor(g.main.id),
    label: g.main.name,
    note: skillTypeLabel(g.main.type ?? '', g.main.type_name || ''),
  })),
  ...memoSkills.value.map((ms) => ({
    id: skillAnchor(ms.id),
    label: ms.name,
    note: skillTypeLabel(ms.type ?? '', ms.type_name || ''),
  })),
]);
</script>

<template>
  <h2 class="nk-title"><span class="nk-title__idx">{{ SECTION_IDX.skills }}</span>SKILLS</h2>
  <SectionIndex v-if="indexItems.length > 1" :items="indexItems" :label="t('char.skillIndex')" />
  <SkillCard
    v-for="g in skillFamilies"
    :key="`${enhKey}|${g.main.id}`"
    :anchor="skillAnchor(g.main.id)"
    :sk="g.main"
    :child-skills="g.children"
    :char-id="charId"
    :char-data="d"
    :anim-entries="animFor(g.main)"
  />
  <SkillCard
    v-for="ms in memoSkills"
    :key="`memo-${enhKey}|${ms.id}`"
    :anchor="skillAnchor(ms.id)"
    :sk="ms"
    :char-id="charId"
    :char-data="d"
    :anim-entries="memoAnimMap[ms.id] || null"
  />
</template>
