<script setup lang="ts">
import { bossTraitDescHtml } from './renders';
import type { MazeBossTrait } from '../../services/types';

defineProps<{
  items: MazeBossTrait[];
  /** 场次标签（末日幻影：上半场/下半场/星启模式） */
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
    <div class="nk-egd-traits">
      <article
        v-for="(t, i) in items"
        :key="t.id"
        class="nk-egd-trait"
        :style="{ '--i': i }"
      >
        <h3 class="nk-egd-trait__name">{{ t.name }}</h3>
        <p v-if="t.desc" class="nk-egd-trait__desc" v-html="bossTraitDescHtml(t)"></p>
      </article>
    </div>
  </section>
</template>
