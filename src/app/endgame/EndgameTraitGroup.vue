<script setup lang="ts">
import { bossTraitDescHtml } from './renders';
import type { MazeBossTrait } from '../../services/types';

/** 首领特性整组一张卡片（层 tab 与星启看板同形）：全部特性同屏平铺在同一张卡内，
 *  卡形由容器承担、条目自身只留行距——不画分隔线、不加模式色左沿。 */
defineProps<{
  /** 分组标题 */
  title?: string;
  items: MazeBossTrait[];
}>();
</script>

<template>
  <section class="nk-egd-group">
    <div v-if="title" class="nk-egd-group__head">
      <span class="nk-egd-group__title">{{ title }}</span>
    </div>
    <div class="nk-egd-traits">
      <article
        v-for="t in items"
        :key="t.id"
        class="nk-egd-trait"
      >
        <h3 class="nk-egd-trait__name">{{ t.name }}</h3>
        <p v-if="t.desc" class="nk-egd-trait__desc" v-html="bossTraitDescHtml(t)"></p>
      </article>
    </div>
  </section>
</template>
