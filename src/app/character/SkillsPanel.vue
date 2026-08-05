<script setup lang="ts">
/**
 * 技能面板：type+type_name 分组渲染 SkillCard + REMOVED 卡片 + 忆灵技能。
 * SkillCard key 含 enhKey，强化切换时强制重建以重置滑条状态。
 */
import { computed } from 'vue';
import SkillCard from './SkillCard.vue';
import { fmtDesc, skillIconUrl } from '../../lib/format';
import { SKILL_ORDER, TYPE } from '../../lib/constants';
import type { CharacterData, Skill, SkillAnimEntry, SkillAnimationsDb } from '../../services/types';

const props = defineProps<{
  d: CharacterData;
  /** 加强前视图（diff 用；原始模式为 null） */
  oldD: CharacterData | null;
  charId: string;
  /** 当前强化键（SkillCard key 组成，切换时重置卡片内部状态） */
  enhKey: string | null;
  /** 技能动画映射（可选，未就绪为 null） */
  animDb: SkillAnimationsDb | null;
}>();

/* ─── 技能动画映射（米游社 Wiki 数据，charId → type → 动画列表） ─── */

function animFor(sk: Skill): SkillAnimEntry[] | null {
  const db = props.animDb;
  if (!db || !props.charId) return null;
  const charAnims = db[props.charId];
  if (!charAnims) return null;
  return charAnims[sk.type ?? ''] || null;
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
const oldSkillById = computed<Record<string, Skill>>(() => {
  const map: Record<string, Skill> = {};
  if (props.oldD) {
    Object.values(props.oldD.skills).forEach((sk) => {
      if (sk.id != null) map[String(sk.id)] = sk;
    });
  }
  return map;
});

/** 旧版中删除的技能（在新版中不存在） */
const removedSkills = computed(() => {
  const dd = props.d;
  const od = props.oldD;
  if (!od) return [];
  const newIds = new Set(Object.values(dd.skills).map((s) => s.id));
  const removed: Skill[] = [];
  groupSkills(Object.values(od.skills)).forEach((g) => {
    if (!newIds.has(g.main.id)) removed.push(g.main);
    g.children.forEach((c) => {
      if (!newIds.has(c.id)) removed.push(c);
    });
  });
  return removed.map((sk) => {
    const lvObj = sk.level ? sk.level[Object.keys(sk.level).pop() as string] : null;
    return {
      sk,
      tn: sk.type_name || TYPE[sk.type ?? ''] || '',
      icon: skillIconUrl(sk, props.charId, dd),
      descHtml: fmtDesc(sk.desc, (lvObj && lvObj.param_list) || []),
    };
  });
});

/* ─── 忆灵技能（记忆命途召唤物，单独渲染） ─── */

const memoSkills = computed<Skill[]>(() =>
  props.d.memosprite && props.d.memosprite.skills
    ? Object.values(props.d.memosprite.skills)
    : [],
);
const oldMemoById = computed<Record<string, Skill>>(() => {
  const map: Record<string, Skill> = {};
  const od = props.oldD;
  if (od && od.memosprite && od.memosprite.skills) {
    Object.values(od.memosprite.skills).forEach((sk) => {
      if (sk.id != null) map[String(sk.id)] = sk;
    });
  }
  return map;
});
</script>

<template>
  <div class="nk-title">SKILLS</div>
  <SkillCard
    v-for="g in skillGroups"
    :key="`${enhKey}|${g.main.id}`"
    :sk="g.main"
    :child-skills="g.children"
    :old-sk="oldSkillById[String(g.main.id)] || null"
    :child-old-by-id="oldSkillById"
    :is-diff-mode="!!oldD"
    :char-id="charId"
    :char-data="d"
    :anim-entries="animFor(g.main)"
  />
  <div
    v-for="rc in removedSkills"
    :key="`rm-${rc.sk.id}`"
    class="nk-skill nk-inline-diff"
    data-status="removed"
  >
    <span class="nk-diff-badge nk-diff-badge--removed">REMOVED</span>
    <div class="nk-skill__head">
      <span class="nk-skill__type-dot" :title="rc.tn"></span>
    </div>
    <div class="nk-skill__body">
      <div class="nk-skill__title-row">
        <img v-if="rc.icon" class="nk-skill__icon" :src="rc.icon">
        <div class="nk-skill__title">
          <span class="nk-skill__name">{{ rc.sk.name }}</span>
        </div>
      </div>
      <div class="nk-skill__desc" v-html="rc.descHtml"></div>
    </div>
  </div>
  <SkillCard
    v-for="ms in memoSkills"
    :key="`memo-${enhKey}|${ms.id}`"
    :sk="ms"
    :old-sk="oldMemoById[String(ms.id)] || null"
    :is-diff-mode="!!oldD"
    :char-id="charId"
    :char-data="d"
  />
</template>
