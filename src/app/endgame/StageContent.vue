<script setup lang="ts">
import EnemyCard from '../components/EnemyCard.vue';
import { cdnUri } from '../../services/cdn';
import { elemRow, monCountLabel, monTitle, monWaveGroups } from './renders';
import type { MazeStageDetail } from '../../services/types';

defineProps<{
  label: string;
  stage: MazeStageDetail | undefined;
  isBoss: boolean;
}>();
</script>

<template>
  <div v-if="stage && (stage.damage?.length || stage.monsters?.length)" class="nk-egd-floor__stage">
    <div class="nk-egd-floor__stagehead">
      <span class="nk-egd-floor__stagelabel">{{ label }}</span>
      <span v-if="monCountLabel(stage.monsters)" class="nk-egd-floor__moncount">{{ monCountLabel(stage.monsters) }}</span>
    </div>
    <div v-if="stage.damage?.length" class="nk-egd-floor__row">
      <span class="nk-egd-floor__label">推荐属性</span>
      <span class="nk-egd-floor__elems" v-html="elemRow(stage.damage)"></span>
    </div>
    <div v-if="stage.monsters?.length" class="nk-egd-floor__row nk-egd-floor__row--mons">
      <span class="nk-egd-floor__label">敌方配置</span>
      <span class="nk-egd-floor__monswrap">
        <span v-for="(g, gi) in monWaveGroups(stage.monsters)" :key="gi" class="nk-egd-floor__wave">
          <span v-if="monWaveGroups(stage.monsters).length > 1" class="nk-egd-floor__wavelabel">第 {{ g.wave }} 波</span>
          <div v-if="isBoss" class="nk-egd-mons">
            <EnemyCard v-for="m in g.items" :key="`${m.id}-${gi}`" :monster="m" />
          </div>
          <span v-else class="nk-egd-floor__mons">
            <router-link
              v-for="m in g.items"
              :key="`${m.id}-${gi}`"
              class="nk-egd-floor__monlink"
              :to="`/monster/${m.tpl || m.id}`"
              :title="monTitle(m)"
              :aria-label="`查看 ${m.name} 详情`"
            >
              <img
                class="nk-egd-floor__mon"
                :src="m.icon ? cdnUri('monstermiddleicon', `${m.icon}.webp`) : ''"
                :alt="m.name"
                loading="lazy"
                @error="($event.target as HTMLImageElement).classList.add('nk-img-error')"
              >
            </router-link>
          </span>
        </span>
      </span>
    </div>
  </div>
</template>
