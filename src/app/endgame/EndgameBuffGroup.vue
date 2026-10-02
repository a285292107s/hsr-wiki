<script setup lang="ts">
import { BUFF_ICON_FALLBACK, buffDescHtml, buffIconUrl } from './renders';
import type { MazeBuffInfo } from '../../services/types';

defineProps<{
  items: MazeBuffInfo[];
  /** 分组标题（层 tab 的看板内区分「赛季增益」与「首领特性」） */
  title?: string;
}>();
</script>

<template>
  <section class="nk-egd-group">
    <div v-if="title" class="nk-egd-group__head">
      <span class="nk-egd-group__title">{{ title }}</span>
    </div>
    <div class="nk-egd-buffs">
      <article
        v-for="(b, i) in items"
        :key="b.id"
        class="nk-egd-buff"
        :style="{ '--i': i }"
      >
        <div class="nk-egd-buff__head">
          <img v-if="b.icon" class="nk-egd-buff__icon" :src="buffIconUrl(b)" alt="" loading="lazy" @error="($event.target as HTMLImageElement).src = BUFF_ICON_FALLBACK">
          <h3 class="nk-egd-buff__name">{{ b.name }}</h3>
        </div>
        <p v-if="b.desc" class="nk-egd-buff__desc" v-html="buffDescHtml(b)"></p>
      </article>
    </div>
  </section>
</template>
