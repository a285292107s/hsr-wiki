<script setup lang="ts">
import { computed } from 'vue';
import StageContent from './StageContent.vue';
import EndgameBuffGroup from './EndgameBuffGroup.vue';
import { buffDescHtml } from './renders';
import type { PeakLevelInfo } from '../../services/types';

import { translate } from '../i18n';

const t = translate;
const props = defineProps<{
  level: PeakLevelInfo;
  hard?: boolean;
  systemName?: string;
  cardsAbove?: boolean;
}>();

type PeakStage = PeakLevelInfo | NonNullable<PeakLevelInfo['hard']>;
const stage = computed<PeakStage>(
  () => (props.hard && props.level.hard ? props.level.hard : props.level),
);
const damage = computed(() => props.level.damage);
const buffs = computed(() => props.level.buffs || []);
const headLevel = computed(() => (props.hard ? props.level.hard?.level : props.level.level));
</script>

<template>
  <section class="nk-egd-floor nk-egd-peak">
    <header v-if="!cardsAbove" class="nk-egd-floor__head">
      <span
        class="nk-egd-peak__kind"
        :class="hard ? 'nk-egd-peak__kind--hard' : `nk-egd-peak__kind--${level.kind}`"
      >
        {{ hard ? t('egd.peak.hard') : level.kind === 'king' ? t('egd.peak.king') : t('egd.peak.knight') }}
      </span>
      <span v-if="headLevel" class="nk-egd-floor__data">
        <span class="nk-egd-floor__dataitem">
          <span class="nk-egd-floor__dataval">{{ headLevel }}</span>
          <span class="nk-egd-floor__datalabel">{{ t('egd.label.level') }}</span>
        </span>
      </span>
    </header>

    <div class="nk-egd-peak__body nk-egd-children">
      <EndgameBuffGroup
        v-if="buffs.length"
        class="nk-egd-group--row"
        :title="systemName || t('egm.sec.buffs')"
        :items="buffs"
      />

      <div v-if="stage.tags?.length" class="nk-egd-floor__mechs nk-egd-row">
        <h2 class="nk-egd-row__label">{{ t('egd.mechanic') }}</h2>
        <ul class="nk-egd-floor__tags">
          <li v-for="m in stage.tags" :key="m.id" class="nk-egd-peak__mech">
            <span class="nk-egd-peak__tag">{{ m.name }}</span>
            <p v-if="m.desc" class="nk-egd-peak__mechdesc" v-html="buffDescHtml(m)"></p>
          </li>
        </ul>
      </div>

      <StageContent
        :stage="stage"
        :damage="cardsAbove ? undefined : damage"
        :invasion="level.invasion"
        :show-count="!cardsAbove"
      />
    </div>
  </section>
</template>
