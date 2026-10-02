<script setup lang="ts">
import StageContent from './StageContent.vue';
import EndgameBuffGroup from './EndgameBuffGroup.vue';
import EndgameTraitGroup from './EndgameTraitGroup.vue';
import EndgameFloorBuff from './EndgameFloorBuff.vue';
import { pollutionLabel } from './pollution';
import type { MazeBossTrait, MazeBuffInfo, MazeStageDetail } from '../../services/types';

/** 战斗看板（层 tab 的半场看板 / 星启看板的节点看板共用）：一次只渲染当前这一场战斗。
 *  块序 = 末法余烬（该场次自带的增益；层为层共用块、由面板顶部承载故不传）→ 首领特性
 *  （整组一张卡，组内逐条平铺）→ 敌方配置 → 赛季增益。 */
defineProps<{
  /** 看板 id（卡片 aria-controls 指向它） */
  id: string;
  /** 当前卡片的 id；缺省则看板不带 tabpanel 角色（单场无切换时） */
  labelledBy?: string;
  stage: MazeStageDetail;
  traits: MazeBossTrait[];
  buffs: MazeBuffInfo[];
  /** 该场次的末法余烬 */
  buff?: MazeBuffInfo | null;
}>();
</script>

<template>
  <div
    :id="id"
    class="nk-egd-board"
    :role="labelledBy ? 'tabpanel' : undefined"
    :aria-labelledby="labelledBy"
  >
    <div class="nk-egd-board__body nk-egd-children">
      <header v-if="stage.invasion" class="nk-egd-board__head">
        <span class="nk-egd-pollchip" :data-level="stage.invasion.level">{{ pollutionLabel(stage.invasion) }}</span>
      </header>
      <EndgameFloorBuff :buff="buff" />
      <EndgameTraitGroup v-if="traits.length" title="首领特性" :items="traits" />
      <StageContent :stage="stage" :is-boss="true" headless hide-damage />
      <EndgameBuffGroup v-if="buffs.length" title="赛季增益" :items="buffs" />
    </div>
  </div>
</template>
