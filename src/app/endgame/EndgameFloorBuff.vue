<script setup lang="ts">
import { BUFF_ICON_FALLBACK, buffDescHtml, buffIconUrl } from './renders';
import type { MazeBuffInfo } from '../../services/types';

defineProps<{ buff: MazeBuffInfo | null | undefined }>();
</script>

<template>
  <div v-if="buff" class="nk-egd-floor__buff">
    <div class="nk-egd-floor__buffhead">
      <img v-if="buff.icon" class="nk-egd-buff__icon nk-egd-buff__icon--sm" :src="buffIconUrl(buff)" alt="" loading="lazy" @error="($event.target as HTMLImageElement).src = BUFF_ICON_FALLBACK">
      <!-- 层内赛季增益是该块的**唯一分区标题**（忘却之庭的「记忆紊流」走这条渲染路径，无外层 label）：
           取 h2 让赛季页在任何模式下都有可跳转的分区落点（A1.2 判文档序递增 ≤1，故其下同级的
           增益条目若要成标题只能到 h3；本块无下级标题）。 -->
      <h2 class="nk-egd-floor__buffname">{{ buff.name }}</h2>
    </div>
    <p v-if="buff.desc" class="nk-egd-floor__buffdesc" v-html="buffDescHtml(buff)"></p>
  </div>
</template>
