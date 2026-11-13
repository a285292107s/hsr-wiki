<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId } from 'vue';
import { useI18n } from 'vue-i18n';
import type { CatalogFilterOption } from './types';

const props = withDefaults(
  defineProps<{
    label: string;
    options: CatalogFilterOption[];
    modelValue: string;
    disabled?: boolean;
  }>(),
  { disabled: false },
);

const emit = defineEmits<{ change: [val: string] }>();

const { t } = useI18n();

const open = ref(false);
const btnRef = ref<HTMLElement | null>(null);
const menuRef = ref<HTMLElement | null>(null);
const menuId = useId();

const current = computed(() => props.options.find((o) => o.val === props.modelValue) ?? props.options[0]);
const hasValue = computed(() => !!props.modelValue);

function position(): void {
  const btn = btnRef.value;
  const menu = menuRef.value;
  if (!btn || !menu) return;
  const r = btn.getBoundingClientRect();
  const w = Math.max(160, r.width);
  menu.style.left = `${Math.min(r.left, window.innerWidth - w - 8)}px`;
  menu.style.top = `${r.bottom + 8}px`;
  menu.style.width = `${Math.min(w, 320)}px`;
  const bottomNav = window.innerWidth < 768 ? 56 + 16 : 0;
  menu.style.maxHeight = `${Math.max(120, window.innerHeight - r.bottom - 24 - bottomNav)}px`;
}

function onToggle(e: Event): void {
  open.value = (e as Event & { newState?: string }).newState === 'open';
  if (open.value) void nextTick(position);
}

function onResize(): void {
  if (open.value) position();
}

function onScroll(e: Event): void {
  if (!open.value) return;
  const target = e.target as Node | null;
  if (menuRef.value && target && menuRef.value.contains(target)) return;
  position();
}

function pick(val: string): void {
  menuRef.value?.hidePopover();
  btnRef.value?.focus();
  if (val !== props.modelValue) emit('change', val);
}

onMounted(() => {
  window.addEventListener('resize', onResize);
  document.addEventListener('scroll', onScroll, true);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize);
  document.removeEventListener('scroll', onScroll, true);
});
</script>

<template>
  <div class="nk-cat-select" :class="{ open, 'is-active': hasValue }">
    <button
      ref="btnRef"
      type="button"
      class="nk-cat-select__btn"
      :disabled="disabled"
      :popovertarget="menuId"
      :aria-expanded="open"
      :aria-label="t('catalog.filterAria', { name: label })"
    >
      <img v-if="hasValue && current?.icon" class="nk-cat-select__icon" :src="current.icon" alt="">
      <span class="nk-cat-select__label">{{ label }}</span>
      <span v-if="hasValue" class="nk-cat-select__val" v-html="current?.label ?? ''"></span>
      <svg class="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
    </button>
    <div :id="menuId" ref="menuRef" popover="auto" class="nk-cat-select__menu" @toggle="onToggle">
      <template v-for="(opt, i) in options" :key="opt.val">
        <div
          v-if="opt.group && opt.group !== options[i - 1]?.group"
          class="nk-cat-select__group"
        >{{ opt.group }}</div>
        <button
          type="button"
          :aria-current="opt.val === modelValue ? 'true' : undefined"
          class="nk-cat-select__opt"
          :class="{ 'is-active': opt.val === modelValue }"
          @click="pick(opt.val)"
        >
          <img v-if="opt.icon" class="nk-cat-select__icon" :src="opt.icon" alt="">
          <span v-html="opt.label"></span>
        </button>
      </template>
    </div>
  </div>
</template>
