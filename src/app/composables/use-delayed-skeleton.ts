import { onScopeDispose, ref, watch, type Ref } from 'vue';

export const SKELETON_DELAY = 150;

export function useDelayedSkeleton(
  loading: Ref<boolean> | (() => boolean),
  delay: number = SKELETON_DELAY,
): Ref<boolean> {
  const showSkeleton = ref(false);
  let timer: ReturnType<typeof setTimeout> | null = null;
  const isLoading = typeof loading === 'function' ? loading : () => loading.value;
  watch(isLoading, (v) => {
    if (v) {
      if (timer !== null) clearTimeout(timer);
      timer = setTimeout(() => { showSkeleton.value = true; }, delay);
    } else {
      if (timer !== null) { clearTimeout(timer); timer = null; }
      showSkeleton.value = false;
    }
  }, { immediate: true });
  onScopeDispose(() => {
    if (timer !== null) { clearTimeout(timer); timer = null; }
  });
  return showSkeleton;
}
