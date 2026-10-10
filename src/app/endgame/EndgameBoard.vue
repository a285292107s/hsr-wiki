<script setup lang="ts">
import StageContent from './StageContent.vue';
import EndgameBuffGroup from './EndgameBuffGroup.vue';
import EndgameFloorBuff from './EndgameFloorBuff.vue';
import { fallbackSystemName } from './guide';
import type { MazeBossGuide, MazeBuffInfo, MazeStageDetail } from '../../services/types';

/** 战斗看板（层 tab 的半场看板 / 星启看板的节点看板共用）：一次只渲染当前这一场战斗。
 *  块序 = 末法余烬（该场次自带的增益）→ 赛季增益 → 敌方配置。
 *  首领机制随**敌方卡**呈现（末日幻影，见 EndgameBossGuide）：同一场只有首领本体带该分区，
 *  故不再有场次级「首领特性」区块。污染等级同样只挂到被污染的那一只敌方卡上。 */
defineProps<{
  /** 看板 id（卡片 aria-controls 指向它） */
  id: string;
  /** 当前卡片的 id；缺省则看板不带 tabpanel 角色（单场无切换时） */
  labelledBy?: string;
  stage: MazeStageDetail;
  buffs: MazeBuffInfo[];
  /** 赛季级首领机制正文（仅末日幻影有） */
  guides?: Record<string, MazeBossGuide>;
  /** 该场次的末法余烬 */
  buff?: MazeBuffInfo | null;
  /** 增益体系名（自上而下透传；缺省回退站点工作名「赛季增益」） */
  systemName?: string;
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
      <EndgameFloorBuff :buff="buff" />
      <EndgameBuffGroup v-if="buffs.length" :title="systemName || fallbackSystemName()" :items="buffs" />
      <StageContent :stage="stage" :guides="guides" />
    </div>
  </div>
</template>
