<script setup lang="ts">
/**
 * 目录页筛选下拉（吸顶工具条内嵌）：按钮 = 组名 + 当前值（选中时），点击展开单选菜单。
 * 菜单 Teleport 到 body 后 fixed 定位：父级 .nk-cat-toolbar 含 backdrop-filter，会把菜单的
 * fixed containing block 锚到工具条（坐标偏移视口）；且按钮位于移动端横向滚动容器内，
 * absolute 会被 overflow-x:auto 按轴配对规则裁剪。Teleport 使 fixed 直接相对视口，
 * 打开时按按钮 rect 计算坐标，同时避开滚动容器裁剪与 sticky 锚定。
 * 打开期间任意滚动/缩放视为失焦，关闭菜单。
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import type { CatalogFilterOption } from './types';

const props = withDefaults(
  defineProps<{
    /** 筛选组名（按钮常态文本，如「命途」） */
    label: string;
    options: CatalogFilterOption[];
    /** 当前选中值（'' = 全部） */
    modelValue: string;
    disabled?: boolean;
  }>(),
  { disabled: false },
);

const emit = defineEmits<{ change: [val: string] }>();

const open = ref(false);
/** 菜单打开时刻：滚动关闭引入 120ms 时间窗，吸收点击按钮瞬间容器/页面的滚动校正（
    否则 Playwright/浏览器自动滚动使按钮可见后的点击，会被紧随其后的 scroll 事件误关） */
let openAt = 0;
const btnRef = ref<HTMLElement | null>(null);
const menuRef = ref<HTMLElement | null>(null);
const rootRef = ref<HTMLElement | null>(null);

/** 当前选中项（'' 无选中时回退「全部」项） */
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
    // 右缘防越界：菜单起点 = min(按钮左缘, 视口右缘 - 菜单宽 - 8)
    menu.style.left = `${Math.min(r.left, window.innerWidth - w - 8)}px`;
    menu.style.top = `${r.bottom + 8}px`;
    menu.style.width = `${Math.min(w, 320)}px`;
    /* 手机端底部导航条占位（56px + 16 呼吸，与 tokens.css 底部导航断点/尺寸同源）：
       maxHeight 必须扣除，否则菜单滚动末端被导航遮盖（导航 z-index 10000 > 菜单 300，
       靠尺寸规避而非压 z）；safe-area 已由导航自身 padding 吸收 */
    const bottomNav = window.innerWidth < 768 ? 56 + 16 : 0;
    menu.style.maxHeight = `${Math.max(120, window.innerHeight - r.bottom - 24 - bottomNav)}px`;
  });
}

/** 任意滚动（含横向滚动容器）/缩放 → 菜单随定位基准失焦关闭；打开后 120ms 内豁免（吸收点击联动滚动）。
 *  注意：document capture 会收到菜单自身滚动（长选项列表 overflow-y:auto），
 *  其 target 即菜单元素（Teleport 到 body，与视图滚动容器隔离）——菜单内滚动浏览不算失焦，必须放行 */
function onViewportChange(e: Event): void {
  if (!open.value || Date.now() - openAt <= 120) return;
  if (menuRef.value && (e.target === menuRef.value || menuRef.value.contains(e.target as Node))) return;
  closeMenu();
}

/** 点击外部关闭：菜单打开时，点组件根之外的任意处（含菜单外滚动条等）关菜单 */
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
      :aria-label="`${label}筛选`"
      @click="toggle"
    >
      <img v-if="hasValue && current?.icon" class="nk-cat-select__icon" :src="current.icon" alt="">
      <span class="nk-cat-select__label">{{ label }}</span>
      <span v-if="hasValue" class="nk-cat-select__val" v-html="current?.label ?? ''"></span>
      <svg class="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
    </button>
    <Teleport to="body">
      <div v-if="open" ref="menuRef" class="nk-cat-select__menu" role="menu" :aria-label="label">
        <!-- 无菜单标题：按钮 label 已承载（菜单锚定其正下方），且 role=menu 仅允许 menuitem* 直接子节点 -->
        <template v-for="(opt, i) in options" :key="opt.val">
          <!-- 分组头：连续同组间渲染一次（items.ts 类型筛选按 main_type 分组）；
               role=presentation 不进读屏菜单导航，不产生额外导航停靠点 -->
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