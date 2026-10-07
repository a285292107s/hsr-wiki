<script setup lang="ts">
import { TARGET_TYPE_LABEL, TARGET_TYPE_SVG, targetHtml, targetTypeIconHtml } from './renders';
import type { MazeTargetInfo } from '../../services/types';

/** 单条挑战目标行（星级档行内用）：行首语义胶囊（回合 / 减员）。
 *  `star` 给**一档吃多个目标**的档（忘却之庭：一层 3 个目标 = 3 星才推一档）逐目标标出
 *  它那 1 星——档位徽章上的星数从哪来才看得出来；1 目标 1 档的模式（虚构叙事 / 末日幻影）
 *  不标，档位徽章本身就是那颗星，再画一颗就是同一件事说两遍。 */
defineProps<{ item: MazeTargetInfo; star?: boolean }>();
</script>

<template>
  <span class="nk-egd-node">
    <span v-if="star" class="nk-egd-node__star" aria-hidden="true" v-html="TARGET_TYPE_SVG.TOTAL_SCORE"></span>
    <span
      v-if="item.type && item.type !== 'TOTAL_SCORE' && TARGET_TYPE_LABEL[item.type]"
      class="nk-egd-node__type"
      :title="TARGET_TYPE_LABEL[item.type]"
      v-html="targetTypeIconHtml(item.type)"
    ></span>
    <span class="nk-egd-node__text" v-html="targetHtml(item)"></span>
  </span>
</template>
