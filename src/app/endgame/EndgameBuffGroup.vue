<script setup lang="ts">
import { BUFF_ICON_FALLBACK, buffDescHtml, buffIconUrl } from './renders';
import type { MazeBuffInfo } from '../../services/types';

defineProps<{
  items: MazeBuffInfo[];
  /** 场次标签（末日幻影：上半场/下半场/星启模式）；其余模式的扁平列表为空 */
  label?: string;
  /** 分组标题（子 tab 内区分「赛季增益」与「首领特性」） */
  title?: string;
}>();
</script>

<template>
  <section class="nk-egd-group">
    <div v-if="title || label" class="nk-egd-group__head">
      <span v-if="title" class="nk-egd-group__title">{{ title }}</span>
      <span v-if="label" class="nk-egd-group__label">{{ label }}</span>
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
