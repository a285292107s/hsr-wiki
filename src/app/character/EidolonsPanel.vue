<script setup lang="ts">
import { computed } from 'vue';
import SectionIndex from './SectionIndex.vue';
import { extraTerms } from './utils';
import { eidolonIconUrl, fmtDesc } from '../../lib/format';
import { SECTION_IDX } from './sections';
import type { CharacterData, SkillExtra } from '../../services/types';

import { translate } from '../i18n';

const t = translate;
const props = defineProps<{
  d: CharacterData;
  charId: string;
}>();

interface EidolonCard {
  num: string;
  name: string;
  img: string;
  descHtml: string;
  terms: SkillExtra[];
}
const eidolons = computed<EidolonCard[]>(() => {
  const dd = props.d;
  return Object.entries(dd.ranks || {}).map(([num, rk]) => ({
    num,
    name: rk.name,
    img: eidolonIconUrl(props.charId, num),
    descHtml: fmtDesc(rk.desc, rk.param_list || []),
    terms: extraTerms(rk),
  }));
});

function eidolonAnchor(num: string): string {
  return `nk-eidolon-${num}`;
}

const indexItems = computed(() =>
  eidolons.value.map((e) => ({ id: eidolonAnchor(e.num), label: e.name, note: `E${e.num}` })),
);
</script>

<template>
  <h2 class="nk-title"><span class="nk-title__idx">{{ SECTION_IDX.eidolons }}</span>EIDOLONS</h2>
  <SectionIndex v-if="indexItems.length > 1" :items="indexItems" :label="t('char.eidolonIndex')" />
  <div
    v-for="e in eidolons"
    :key="e.num"
    :id="eidolonAnchor(e.num)"
    class="nk-eidolon"
  >
    <div class="nk-eidolon__head">
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
