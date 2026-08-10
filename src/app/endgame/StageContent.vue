<script setup lang="ts">
/**
 * 层级阶段内容（上下半场原子组件）：阶段头（标签 + 敌数）+ 推荐属性行 + 敌方配置（波次分组）。
 * 消除 EndgameView 关卡层级 stage1/stage2 双块逐行重复；渲染纯函数来自 endgame/renders（单一事实源）。
 * 空阶段（无推荐属性且无敌方）整体不渲染。
 */
import EnemyCard from '../components/EnemyCard.vue';
import { cdnUri } from '../../services/cdn';
import { elemRow, monCountLabel, monTitle, monWaveGroups } from './renders';
import type { MazeStageDetail } from '../../services/types';

defineProps<{
  /** 阶段标题（上半场 / 下半场） */
  label: string;
  /** 阶段内容（无数据时整体不渲染） */
  stage: MazeStageDetail | undefined;
  /** 完整信息卡模式（modeKey === 'boss'）：敌方用 EnemyCard 完整卡；否则小图行 */
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
          <!-- 末日幻影纯 Boss 战：完整信息卡；其余模式：小图行 -->
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
