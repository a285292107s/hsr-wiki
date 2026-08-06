<script setup lang="ts">
/**
 * 技能面板：type+type_name 分组渲染 SkillCard + 忆灵技能。
 * SkillCard key 含 enhKey，强化切换时强制重建以重置滑条状态。
 */
import { computed } from 'vue';
import SkillCard from './SkillCard.vue';
import { SKILL_ORDER } from '../../lib/constants';
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

/* ─── 技能动画映射（米游社 Wiki 数据，charId → type → 动画列表） ─── */

/** 当前角色动画索引（一次查表，供 v-for 内多次调用） */
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

/* ─── 技能分组（type + type_name） ─── */

interface SkillGroup { main: Skill; children: Skill[] }
/** 按 (type + type_name) 分组：首个为主技能，同组后续为子技能 */
function groupSkills(skills: Skill[]): SkillGroup[] {
  const valid = skills.filter(
    (s) => !!s.type_name && SKILL_ORDER.includes(s.type),
  );
  const map = new Map<string, SkillGroup>();
  const groups: SkillGroup[] = [];
  valid.forEach((sk) => {
    const key = (sk.type || 'null') + '|' + (sk.type_name || '');
    const exist = map.get(key);
    if (!exist) {
      const g: SkillGroup = { main: sk, children: [] };
      map.set(key, g);
      groups.push(g);
    } else {
      exist.children.push(sk);
    }
  });
  groups.sort((a, b) => SKILL_ORDER.indexOf(a.main.type) - SKILL_ORDER.indexOf(b.main.type));
  return groups;
}

const skillGroups = computed<SkillGroup[]>(() =>
  groupSkills(Object.values(props.d.skills)),
);

/* ─── 忆灵技能（记忆命途召唤物，单独渲染） ─── */

const memoSkills = computed<Skill[]>(() =>
  props.d.memosprite && props.d.memosprite.skills
    ? Object.values(props.d.memosprite.skills)
    : [],
);
</script>

<template>
  <div class="nk-title"><span class="nk-title__idx">{{ SECTION_IDX.skills }}</span>SKILLS</div>
  <SkillCard
    v-for="g in skillGroups"
    :key="`${enhKey}|${g.main.id}`"
    :sk="g.main"
    :child-skills="g.children"
    :char-id="charId"
    :char-data="d"
    :enh-mark="enhMark"
    :anim-entries="animFor(g.main)"
  />
  <SkillCard
    v-for="ms in memoSkills"
    :key="`memo-${enhKey}|${ms.id}`"
    :sk="ms"
    :char-id="charId"
    :char-data="d"
    :enh-mark="enhMark"
  />
</template>
