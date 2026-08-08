<script setup lang="ts">
/**
 * 星魂面板：E1-6 卡片。
 */
import { computed } from 'vue';
import { extraTerms } from './utils';
import { iconUrl, fmtDesc } from '../../lib/format';
import { SECTION_IDX } from './sections';
import type { CharacterData, SkillExtra } from '../../services/types';

const props = defineProps<{
  d: CharacterData;
  charId: string;
  /** 强化角标（强化模式下被强化星魂 ID 集合；原始模式为 null） */
  enhMark: { skillIds: Set<number>; rankIds: Set<number> } | null;
}>();

interface EidolonCard {
  num: string;
  name: string;
  img: string;
  descHtml: string;
  /** 强化模式下被强化的星魂 */
  enhanced: boolean;
  terms: SkillExtra[];
}
const eidolons = computed<EidolonCard[]>(() => {
  const dd = props.d;
  return Object.entries(dd.ranks || {}).map(([num, rk]) => ({
    num,
    name: rk.name,
    img: iconUrl(rk.icon),
    descHtml: fmtDesc(rk.desc, rk.param_list || []),
    enhanced: !!(props.enhMark && props.enhMark.rankIds.has(rk.id)),
    terms: extraTerms(rk),
  }));
});
</script>

<template>
  <div class="nk-title"><span class="nk-title__idx">{{ SECTION_IDX.eidolons }}</span>EIDOLONS</div>
  <div
    v-for="e in eidolons"
    :key="e.num"
    class="nk-eidolon"
  >
    <span v-if="e.enhanced" class="nk-eidolon__enh-badge">强化</span>
    <div class="nk-eidolon__head">
      <span class="nk-eidolon__num">E{{ e.num }}</span>
      <img class="nk-skill__icon" :src="e.img" loading="lazy">
      <div class="nk-skill__title">
        <span class="nk-skill__name">{{ e.name }}</span>
      </div>
    </div>
    <div class="nk-skill__desc" v-html="e.descHtml"></div>
    <div v-if="e.terms.length" class="nk-skill__terms">
      <div v-for="t in e.terms" :key="t.name" class="nk-term">
        <span class="nk-term__name">{{ t.name }}</span>：{{ t.desc }}
      </div>
    </div>
  </div>
</template>
