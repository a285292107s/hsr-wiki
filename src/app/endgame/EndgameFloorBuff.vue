<script setup lang="ts">
import { BUFF_ICON_FALLBACK, buffDescHtml, buffIconUrl } from './renders';
import type { MazeBuffInfo } from '../../services/types';

defineProps<{ buff: MazeBuffInfo | null | undefined }>();
</script>

<template>
  <div v-if="buff" class="nk-egd-floor__buff">
    <div class="nk-egd-floor__buffhead">
      <img v-if="buff.icon" class="nk-egd-buff__icon nk-egd-buff__icon--sm" :src="buffIconUrl(buff)" alt="" loading="lazy" @error="($event.target as HTMLImageElement).src = BUFF_ICON_FALLBACK">
      <span class="nk-egd-floor__buffname">{{ buff.name }}</span>
    </div>
    <p v-if="buff.desc" class="nk-egd-floor__buffdesc" v-html="buffDescHtml(buff)"></p>
  </div>
</template>
