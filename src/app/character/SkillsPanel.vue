<script setup lang="ts">
/**
 * 技能面板：按行迹族渲染 SkillCard（族内首个 = 基座技能 → 父卡，其余 = 形态技能 → 子卡）+ 忆灵技能。
 * 层级唯一来源见 ADR 0022：禁止回退 (type + type_name) 分组，禁止用 SkillList 顺序判定父子。
 * SkillCard key 含 enhKey，强化切换时强制重建以重置滑条状态。
 */
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

/* ─── 技能族（行迹族；族序即渲染序） ─── */

const skillFamilies = computed(() =>
  groupSkillsByFamily(props.d.skills, props.d.skill_trees),
);

/* ─── 忆灵技能（记忆命途召唤物，单独渲染） ─── */

const memoSkills = computed<Skill[]>(() =>
  props.d.memosprite && props.d.memosprite.skills
    ? Object.values(props.d.memosprite.skills)
    : [],
);

/* ─── 忆灵技能预览（Wiki「忆灵技」→ Servant、「忆灵天赋」→ ServantPassive） ─── */
/* 忆灵技能在面板里平铺渲染（不像主技能那样父子嵌套），故在此按技能 id 分好条目：
 * 同 type_name 一个池，条目 subTitle 匹配技能名优先，未匹配者顺序补位（分配规则见 lib/skill-anim.ts） */
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
