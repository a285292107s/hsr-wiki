<script setup lang="ts">
/**
 * 星魂面板：E1-6 卡片 diff + 旧版删除星魂卡片。
 */
import { computed } from 'vue';
import { extraTerms } from './utils';
import { eidolonIconUrl, fmtDesc, fmtDescDiff, hasParamDiff, hasTextDiff } from '../../lib/format';
import type { CharacterData, SkillExtra } from '../../services/types';

const props = defineProps<{
  d: CharacterData;
  /** 加强前视图（diff 用；原始模式为 null） */
  oldD: CharacterData | null;
  charId: string;
}>();

interface EidolonCard {
  num: string;
  name: string;
  img: string;
  descHtml: string;
  status: '' | 'changed' | 'added';
  terms: SkillExtra[];
}
const eidolons = computed<EidolonCard[]>(() => {
  const dd = props.d;
  const oldRanks = props.oldD && props.oldD.ranks ? props.oldD.ranks : null;
  return Object.entries(dd.ranks || {}).map(([num, rk]) => {
    const oldRk = oldRanks ? oldRanks[num] || null : null;
    const changed = !!(oldRk &&
      (hasParamDiff(rk.param_list || [], oldRk.param_list || []) || hasTextDiff(rk.desc, oldRk.desc)));
    const status: '' | 'changed' | 'added' = changed ? 'changed' : !oldRk && !!props.oldD ? 'added' : '';
    const descHtml = props.oldD && oldRk
      ? fmtDescDiff(rk.desc, rk.param_list || [], oldRk.desc, oldRk.param_list || [])
      : fmtDesc(rk.desc, rk.param_list || []);
    return {
      num,
      name: rk.name,
      img: eidolonIconUrl(props.charId, num),
      descHtml,
      status,
      terms: extraTerms(rk),
    };
  });
});

/** 旧版中删除的星魂 */
const removedEidolons = computed(() => {
  const dd = props.d;
  const od = props.oldD;
  if (!od || !od.ranks) return [];
  const newIds = new Set(Object.keys(dd.ranks || {}));
  return Object.entries(od.ranks)
    .filter(([num]) => !newIds.has(num))
    .map(([num, rk]) => ({
      num,
      name: rk.name,
      img: eidolonIconUrl(props.charId, num),
      descHtml: fmtDesc(rk.desc, rk.param_list || []),
    }));
});
</script>

<template>
  <div class="nk-title">EIDOLONS</div>
  <div
    v-for="e in eidolons"
    :key="e.num"
    :class="['nk-eidolon', { 'nk-inline-diff': !!e.status }]"
    :data-status="e.status || undefined"
  >
    <span v-if="e.status" :class="`nk-diff-badge nk-diff-badge--${e.status}`">
      {{ e.status === 'changed' ? 'CHANGED' : 'NEW' }}
    </span>
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
  <div
    v-for="re in removedEidolons"
    :key="`rm-${re.num}`"
    class="nk-eidolon nk-inline-diff"
    data-status="removed"
  >
    <span class="nk-diff-badge nk-diff-badge--removed">REMOVED</span>
    <div class="nk-skill__title-row">
      <img class="nk-skill__icon" :src="re.img" loading="lazy">
      <div class="nk-skill__title">
        <span class="nk-skill__name">{{ re.name }}</span>
        <span class="nk-skill__tag">E{{ re.num }}</span>
      </div>
    </div>
    <div class="nk-skill__desc" v-html="re.descHtml"></div>
  </div>
</template>
