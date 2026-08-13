<script setup lang="ts">
/**
 * 星魂面板：E1-6 卡片。
 */
import { computed } from 'vue';
import { extraTerms } from './utils';
import { eidolonIconUrl, fmtDesc } from '../../lib/format';
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
    // 本体展示图标：Rank{num} 专属文件（nanoka rank 分类 E1-6 全量）；
    // 与 rk.icon（源数据 IconPath，buff 栏用图标，E3/E5 复用技能图标）不同源
    img: eidolonIconUrl(props.charId, num),
    descHtml: fmtDesc(rk.desc, rk.param_list || []),
    enhanced: !!(props.enhMark && props.enhMark.rankIds.has(rk.id)),
    terms: extraTerms(rk),
  }));
});
</script>

<template>
  <h2 class="nk-title"><span class="nk-title__idx">{{ SECTION_IDX.eidolons }}</span>EIDOLONS</h2>
  <div
    v-for="e in eidolons"
    :key="e.num"
    class="nk-eidolon"
  >
    <span v-if="e.enhanced" class="nk-eidolon__enh-badge">强化</span>
    <div class="nk-eidolon__head">
      <!-- 星魂大图：官方 ui/ui3d/rank 3D 渲染源（2048² 正方形），展品式陈列 -->
      <img class="nk-eidolon__icon" :src="e.img" :alt="e.name" loading="lazy">
      <div class="nk-eidolon__info">
        <div class="nk-eidolon__meta">
          <span class="nk-eidolon__num">E{{ e.num }}</span>
          <span class="nk-eidolon__name">{{ e.name }}</span>
        </div>
        <div class="nk-skill__desc" v-html="e.descHtml"></div>
        <div v-if="e.terms.length" class="nk-skill__terms">
          <div v-for="t in e.terms" :key="t.name" class="nk-term">
            <span class="nk-term__name">{{ t.name }}</span>：{{ t.desc }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
