<script setup lang="ts">
import { translate } from '../i18n';

const t = translate;
defineProps<{ rows: { value: string; label: string }[] }>();
</script>

<template>
  <div class="nk-egd-head__col nk-egd-clear">
    <span class="nk-egd-head__label">{{ t('egd.clearCondition') }}</span>
    <span v-for="r in rows" :key="r.label" class="nk-egd-rules__item">
      <span class="nk-egd-rules__val">{{ r.value }}</span>
      <span class="nk-egd-rules__label">{{ r.label }}</span>
    </span>
  </div>
</template>
