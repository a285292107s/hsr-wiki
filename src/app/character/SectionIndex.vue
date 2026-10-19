<script setup lang="ts">
defineProps<{
  items: { id: string; label: string; note: string }[];
  label: string;
}>();

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
