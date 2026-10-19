<script setup lang="ts">
import { fmtDesc } from '../../lib/format';
import { bossTraitDescHtml } from './renders';
import type { MazeBossGuide } from '../../services/types';

import { translate } from '../i18n';

const t = translate;
defineProps<{ guide: MazeBossGuide }>();
</script>

<template>
  <div v-if="guide.traits?.length" class="nk-egd-guide">
    <h2 class="nk-egd-guide__label">{{ t('egd.bossTraits') }}</h2>
    <article v-for="t in guide.traits" :key="t.id" class="nk-egd-trait">
      <h3 class="nk-egd-trait__name">{{ t.name }}</h3>
      <p v-if="t.desc" class="nk-egd-trait__desc" v-html="bossTraitDescHtml(t)"></p>
    </article>
  </div>
  <div v-if="guide.phases?.length" class="nk-egd-phase">
    <h2 class="nk-egd-phase__label">{{ t('mob.sec.guide') }}</h2>
    <article v-for="p in guide.phases" :key="p.id" class="nk-egd-phase__item">
      <h3 class="nk-egd-phase__name">{{ p.name }}</h3>
      <p v-if="p.desc" class="nk-egd-phase__desc" v-html="fmtDesc(p.desc, [])"></p>
      <p v-if="p.answer" class="nk-egd-phase__answer" v-html="fmtDesc(p.answer, [])"></p>
      <ul v-if="p.skills?.length" class="nk-egd-phase__skills">
        <li v-for="s in p.skills" :key="s.name" class="nk-egd-phase__skill">
          <span class="nk-egd-phase__skillname">{{ s.name }}</span>
          <span v-if="s.desc" class="nk-egd-phase__skilldesc" v-html="fmtDesc(s.desc, [])"></span>
        </li>
      </ul>
    </article>
  </div>
</template>
