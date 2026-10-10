<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
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
/** 菜单打开时刻：滚动关闭引入 120ms 时间窗，吸收点击按钮瞬间容器/页面的滚动校正（
    否则 Playwright/浏览器自动滚动使按钮可见后的点击，会被紧随其后的 scroll 事件误关） */
let openAt = 0;
const btnRef = ref<HTMLElement | null>(null);
const menuRef = ref<HTMLElement | null>(null);
const rootRef = ref<HTMLElement | null>(null);

const current = computed(() => props.options.find((o) => o.val === props.modelValue) ?? props.options[0]);
const hasValue = computed(() => !!props.modelValue);

function toggle(): void {
  if (props.disabled) return;
  open.value ? closeMenu() : openMenu();
}

function pick(val: string): void {
  closeMenu();
  if (val !== props.modelValue) emit('change', val);
}

function closeMenu(): void {
  open.value = false;
}

function openMenu(): void {
  open.value = true;
  openAt = Date.now();
  // 坐标计算须在菜单挂载后（nextTick），防首帧错位
  void nextTick(() => {
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
  });
}

// 注意：document capture 会收到菜单自身滚动（长选项列表 overflow-y:auto），
// 其 target 即菜单元素（Teleport 到 body，与视图滚动容器隔离）——菜单内滚动浏览不算失焦，必须放行
function onViewportChange(e: Event): void {
  if (!open.value || Date.now() - openAt <= 120) return;
  if (menuRef.value && (e.target === menuRef.value || menuRef.value.contains(e.target as Node))) return;
  closeMenu();
}

function onDocClick(e: MouseEvent): void {
  if (open.value && rootRef.value && !rootRef.value.contains(e.target as Node)) {
    closeMenu();
  }
}

onMounted(() => {
  document.addEventListener('scroll', onViewportChange, true);
  document.addEventListener('click', onDocClick);
  window.addEventListener('resize', onViewportChange);
});
onBeforeUnmount(() => {
  document.removeEventListener('scroll', onViewportChange, true);
  document.removeEventListener('click', onDocClick);
  window.removeEventListener('resize', onViewportChange);
});
</script>

<template>
  <div ref="rootRef" class="nk-cat-select" :class="{ open, 'is-active': hasValue }">
    <button
      ref="btnRef"
      type="button"
      class="nk-cat-select__btn"
      :disabled="disabled"
      :aria-haspopup="true"
      :aria-expanded="open"
      :aria-label="t('catalog.filterAria', { name: label })"
      @click="toggle"
    >
      <img v-if="hasValue && current?.icon" class="nk-cat-select__icon" :src="current.icon" alt="">
      <span class="nk-cat-select__label">{{ label }}</span>
      <span v-if="hasValue" class="nk-cat-select__val" v-html="current?.label ?? ''"></span>
      <svg class="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
    </button>
    <Teleport to="body">
      <div v-if="open" ref="menuRef" class="nk-cat-select__menu" role="menu" :aria-label="label">
        <template v-for="(opt, i) in options" :key="opt.val">
          <div
            v-if="opt.group && opt.group !== options[i - 1]?.group"
            class="nk-cat-select__group"
            role="presentation"
          >{{ opt.group }}</div>
          <button
            type="button"
            role="menuitemradio"
            :aria-checked="opt.val === modelValue"
            class="nk-cat-select__opt"
            :class="{ 'is-active': opt.val === modelValue }"
            @click="pick(opt.val)"
          >
            <img v-if="opt.icon" class="nk-cat-select__icon" :src="opt.icon" alt="">
            <span v-html="opt.label"></span>
          </button>
        </template>
      </div>
    </Teleport>
  </div>
</template>