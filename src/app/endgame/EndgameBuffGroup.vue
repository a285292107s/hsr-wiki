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
      <!-- 分区标题＝h2（本页分区层级唯一落点） -->
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
          <!-- 条目名是 h3 **当且仅当**本组有 h2 分区标题：A1.2 判的是**文档序**层级递增 ≤1
               （h2 与 h3 互为兄弟是合法形态，标题不可能成为卡片列表的祖先）；无分区标题时
               渲染 h3 会让大纲变成 h1→h3 的跳级，故回退非标题元素。 -->
          <h3 v-if="title" class="nk-egd-buff__name">{{ b.name }}</h3>
          <span v-else class="nk-egd-buff__name">{{ b.name }}</span>
        </div>
        <p v-if="b.desc" class="nk-egd-buff__desc" v-html="buffDescHtml(b)"></p>
      </article>
    </div>
  </section>
</template>
