<script setup lang="ts">
import { cdnUri } from '../../services/cdn';
import { pollutionLabel } from './pollution';
import type { MazeSummonInfo } from '../../services/types';

import { translate } from '../i18n';

/** 模板与脚本统一走词典 */
const t = translate;
/** 召唤物列表（ADR 0036 修订）：挂在**召唤者自己的**敌方卡片/图标格里，不再单独出行
 *  ——归属由 converter 按敌方实例的 `MonsterConfig.SummonIDList` 算好，前端不做 join。
 *  同一召唤物被同场多个敌方列出时会在各自卡片里各出现一次（各自都具备召唤该单位的技能，
 *  如幼蛰虫分裂出自己）。受污染者挂现有「污染等级 N」徽标，未挂徽标即未受污染。 */
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
