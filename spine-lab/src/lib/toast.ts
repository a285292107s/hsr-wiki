/**
 * 研究线轻量 toast(替代主项目 useAppStore().toast):
 * 无 Vuex/Pinia 依赖,事件订阅 + 自清理,由 App.vue 挂载 ToastHost 渲染。
 */
import { ref } from 'vue';

export interface LabToast {
  id: number;
  type: 'success' | 'error';
  message: string;
}

const TOAST_TTL_MS = 2500;

let seq = 0;
const toasts = ref<LabToast[]>([]);

export function toast(type: 'success' | 'error', message: string): void {
  const t: LabToast = { id: ++seq, type, message };
  toasts.value = [...toasts.value, t];
  setTimeout(() => {
    toasts.value = toasts.value.filter((x) => x.id !== t.id);
  }, TOAST_TTL_MS);
}

export function useToasts() {
  return toasts;
}