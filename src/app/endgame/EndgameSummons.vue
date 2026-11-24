<script setup lang="ts">
import { cdnSrc, imgAttrs, markImgError } from '../../lib/image';
import { pollutionLabel } from './pollution';
import type { MazeSummonInfo } from '../../services/types';

import { translate } from '../i18n';

const t = translate;
defineProps<{ items: MazeSummonInfo[] }>();
</script>

<template>
  <div v-if="items.length" class="nk-egd-summons">
    <span class="nk-egd-summons__label">{{ t('egd.summons') }}</span>
    <span class="nk-egd-summon__list">
      <router-link
        v-for="m in items"
        :key="m.id"
        class="nk-egd-summon"
        :to="`/monster/${m.tpl || m.id}`"
        :title="m.name"
      >
        <img
          class="nk-egd-summon__icon"
          v-bind="imgAttrs(m.icon ? cdnSrc('monstermiddleicon', `${m.icon}.webp`) : '')"
          :alt="m.name"
          loading="lazy"
          @error="markImgError"
        >
        <span class="nk-egd-summon__name">{{ m.name }}</span>
        <span v-if="m.polluted" class="nk-egd-pollchip" :data-level="m.polluted">{{ pollutionLabel({ level: m.polluted }) }}</span>
      </router-link>
    </span>
  </div>
</template>
