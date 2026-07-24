<script setup lang="ts">
/**
 * Toast 通知宿主：订阅 app store 队列，自动定时关闭。
 * 动画由 tokens.css 的 .nk-toast-enter-from / .nk-toast-leave-to 驱动（TransitionGroup）。
 */
import { watch, onBeforeUnmount } from 'vue';
import { useAppStore, type ToastType } from '../stores/app';

const app = useAppStore();

const ICONS: Record<ToastType, string> = {
  error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M15 9l-6 6"/><path d="M9 9l6 6"/></svg>',
  warn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l10 18H2z"/><path d="M12 10v4"/><path d="M12 17.5v.5"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 7.5v.5"/></svg>',
  success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/></svg>',
};

/* 新 toast 入队即安排自动关闭（dismiss 后清理计时器） */
const timers = new Map<number, ReturnType<typeof setTimeout>>();

watch(
  () => app.toasts.slice(),
  (list) => {
    for (const t of list) {
      if (!timers.has(t.id)) {
        timers.set(
          t.id,
          setTimeout(() => {
            timers.delete(t.id);
            app.dismissToast(t.id);
          }, t.duration),
        );
      }
    }
    for (const id of timers.keys()) {
      if (!list.some((t) => t.id === id)) {
        clearTimeout(timers.get(id));
        timers.delete(id);
      }
    }
  },
  { immediate: true, deep: true },
);

onBeforeUnmount(() => {
  for (const t of timers.values()) clearTimeout(t);
  timers.clear();
});

function dismiss(id: number): void {
  app.dismissToast(id);
}
</script>

<template>
  <div class="nk-toast-container" aria-live="polite">
    <TransitionGroup name="nk-toast">
      <div
        v-for="t in app.toasts"
        :key="t.id"
        :class="['nk-toast', `nk-toast--${t.type}`]"
        role="status"
        @click="dismiss(t.id)"
      >
        <span class="nk-toast__icon" v-html="ICONS[t.type]" />
        <span>{{ t.message }}</span>
      </div>
    </TransitionGroup>
  </div>
</template>
