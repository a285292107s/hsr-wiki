<script setup lang="ts">
import { cdnUri } from '../../services/cdn';
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
          :src="m.icon ? cdnUri('monstermiddleicon', `${m.icon}.webp`) : ''"
          :alt="m.name"
          loading="lazy"
          @error="($event.target as HTMLImageElement).classList.add('nk-img-error')"
        >
        <span class="nk-egd-summon__name">{{ m.name }}</span>
        <span v-if="m.polluted" class="nk-egd-pollchip" :data-level="m.polluted">{{ pollutionLabel({ level: m.polluted }) }}</span>
      </router-link>
    </span>
  </div>
</template>
