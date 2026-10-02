<script setup lang="ts">
import { bossTraitDescHtml } from './renders';
import type { MazeBossTrait } from '../../services/types';

defineProps<{
  items: MazeBossTrait[];
  /** 场次标签（末日幻影：上半场/下半场/星启模式） */
  label?: string;
  /** 分组标题（子 tab 内区分「赛季增益」与「首领特性」） */
  title?: string;
  /** 整组一张卡片（星启看板）：全部特性同屏平铺在同一张卡内；缺省为每条特性各一张卡片 */
  card?: boolean;
}>();
</script>

<template>
  <section class="nk-egd-group">
    <div v-if="title || label || $slots['head-end']" class="nk-egd-group__head">
      <span v-if="title" class="nk-egd-group__title">{{ title }}</span>
      <span v-if="label" class="nk-egd-group__label">{{ label }}</span>
      <span v-if="$slots['head-end']" class="nk-egd-group__tail"><slot name="head-end" /></span>
    </div>
    <div class="nk-egd-traits" :class="{ 'nk-egd-traits--card': card }">
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
