<script setup lang="ts">
import { computed } from 'vue';
import { TARGET_TYPE_LABEL, TARGET_TYPE_SVG, targetHtml, targetTypeIconHtml } from './renders';
import type { MazeTargetInfo } from '../../services/types';

/** 面板顶部左栏（层 tab 与星启看板共用）：分数档即星启看板的「星级目标」，
 *  行首星标 + 同句式条目逐档一行、靠行距分节；非 TOTAL_SCORE 类型走语义胶囊标签。 */
const props = defineProps<{ items: MazeTargetInfo[] }>();

/** 栏名按目标类型派生：全是分数档（虚构叙事 / 末日幻影）时官方口径是「星级目标」，
 *  含回合 / 减员档（忘却之庭）时是「挑战目标」——同一位置不留两套叫法以外的自创混称。 */
const label = computed(() => (
  props.items.length > 0 && props.items.every((t) => t.type === 'TOTAL_SCORE') ? '星级目标' : '挑战目标'
));
</script>

<template>
  <div class="nk-egd-head__col">
    <span class="nk-egd-head__label">{{ label }}</span>
    <ol class="nk-egd-startargets">
      <li v-for="(t, i) in items" :key="i" class="nk-egd-node">
        <span
          v-if="t.type && t.type !== 'TOTAL_SCORE' && TARGET_TYPE_LABEL[t.type]"
          class="nk-egd-node__type"
          :title="TARGET_TYPE_LABEL[t.type]"
          v-html="targetTypeIconHtml(t.type)"
        ></span>
        <span v-else class="nk-egd-startargets__star" aria-hidden="true" v-html="TARGET_TYPE_SVG.TOTAL_SCORE"></span>
        <span class="nk-egd-node__text" v-html="targetHtml(t)"></span>
      </li>
    </ol>
  </div>
</template>