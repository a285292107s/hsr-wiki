/**
 * 延迟骨架屏：加载超过阈值才显示骨架屏，缓存命中的快速切换不闪屏。
 * 统一 CharacterView / CatalogPage 等处重复的 SKELETON_DELAY + timer 逻辑。
 */
import { onScopeDispose, ref, watch, type Ref } from 'vue';

export const SKELETON_DELAY = 150;

/**
 * @param loading 加载状态（Ref 或 getter）
 * @param delay 延迟显示阈值（ms）
 * @returns showSkeleton 是否展示骨架屏
 */
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
