<script setup lang="ts">
import { BUFF_ICON_FALLBACK, buffDescHtml, buffIconUrl } from './renders';
import type { MazeBuffInfo } from '../../services/types';

defineProps<{
  items: MazeBuffInfo[];
  title?: string;
}>();
</script>

<template>
  <section class="nk-egd-group">
    <div v-if="title" class="nk-egd-group__head">
      <h2 class="nk-egd-group__title">{{ title }}</h2>
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
          <h3 v-if="title" class="nk-egd-buff__name">{{ b.name }}</h3>
          <span v-else class="nk-egd-buff__name">{{ b.name }}</span>
        </div>
        <p v-if="b.desc" class="nk-egd-buff__desc" v-html="buffDescHtml(b)"></p>
      </article>
    </div>
  </section>
</template>
