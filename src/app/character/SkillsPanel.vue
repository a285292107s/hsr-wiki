<script setup lang="ts">
import { computed } from 'vue';
import SkillCard from './SkillCard.vue';
import { groupSkillsByFamily } from '../../lib/skill-family';
import { assignAnimEntries, memoAnimKey } from '../../lib/skill-anim';
import { SECTION_IDX } from './sections';
import type { CharacterData, Skill, SkillAnimEntry, SkillAnimationsDb } from '../../services/types';

const props = defineProps<{
  d: CharacterData;
  charId: string;
  /** 当前强化键（SkillCard key 组成，切换时重置卡片内部状态） */
  enhKey: string | null;
  /** 强化角标数据（强化模式下被强化技能 ID 集合；原始模式为 null） */
  enhMark: { skillIds: Set<number>; rankIds: Set<number> } | null;
  /** 技能动画映射（可选，未就绪为 null） */
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
</script>

<template>
  <h2 class="nk-title"><span class="nk-title__idx">{{ SECTION_IDX.skills }}</span>SKILLS</h2>
  <SkillCard
    v-for="g in skillFamilies"
    :key="`${enhKey}|${g.main.id}`"
    :sk="g.main"
    :child-skills="g.children"
    :char-id="charId"
    :char-data="d"
    :enh-mark="enhMark"
    :enh-label="enhKey ? `V${enhKey}` : ''"
    :anim-entries="animFor(g.main)"
  />
  <SkillCard
    v-for="ms in memoSkills"
    :key="`memo-${enhKey}|${ms.id}`"
    :sk="ms"
    :char-id="charId"
    :char-data="d"
    :enh-mark="enhMark"
    :enh-label="enhKey ? `V${enhKey}` : ''"
    :anim-entries="memoAnimMap[ms.id] || null"
  />
</template>
