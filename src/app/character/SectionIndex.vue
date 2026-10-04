<script setup lang="ts">
/**
 * 区块内索引（技能族 / 星魂）：长区块（技能实测 1808px、星魂 1481px）里逐卡滚动时无法定位当前读到哪一项，
 * 索引即补上这一层。纯锚点导航——不做滚动同步高亮（那需要 IntersectionObserver 常驻，本页 T3 级纪律不允许）。
 * 索引项由父级用页面数据派生，组件自身不认识任何 skill / rank 结构。
 */
defineProps<{
  items: { id: string; label: string; note: string }[];
  /** 导航可达名（供读屏区分技能索引与星魂索引） */
  label: string;
}>();

/** 跳转落点：卡片自身带 `scroll-margin-top` 抵消吸顶条（见 character-skills.css） */
function jump(id: string): void {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
</script>

<template>
  <nav class="nk-idxstrip" :aria-label="label">
    <span class="nk-idxstrip__label">{{ label }}</span>
    <span class="nk-idxstrip__rule" aria-hidden="true"></span>
    <ul class="nk-idxstrip__list">
      <li v-for="it in items" :key="it.id">
        <button class="nk-idxstrip__item" type="button" @click="jump(it.id)">
          <span class="nk-idxstrip__no">{{ it.note }}</span>{{ it.label }}
        </button>
      </li>
    </ul>
  </nav>
</template>
