/**
 * 单图双源回退组合式函数：暴露响应式 src 与 onError 处理器。
 * 组件用法：`<img :src="img.src" @error="img.onError">`。
 * - 主源（官方源）加载失败时切回退源（nanoka）
 * - 回退源再失败 / 无回退源失败 → 标记 data-cdn-down（CSS 隐藏破图，卡片渐变底承接）
 * - CDN 健康探测判定不可用时直接标记降级，不做逐图回退尝试
 */
import { ref } from 'vue';
import { isCdnDown, resolveCdnUri, type CdnCategory } from '../../services/cdn';

export function useCdnImg(category: CdnCategory, file: string) {
  const { primary, fallback } = resolveCdnUri(category, file);
  const src = ref(primary);
  const markDown = (ev?: Event): void => {
    const img = ev && ev.target instanceof HTMLImageElement ? ev.target : null;
    if (img) img.dataset.cdnDown = '1';
  };
  const onError = (ev?: Event): void => {
    if (isCdnDown()) {
      markDown(ev);
      return;
    }
    if (fallback && src.value === primary) {
      src.value = fallback;
      return;
    }
    markDown(ev);
  };
  return { src, onError };
}
