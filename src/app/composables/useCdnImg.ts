/**
 * 单图双源回退组合式函数：暴露响应式 src 与 onError 处理器。
 * 组件用法：`<img :src="img.src" @error="img.onError">`。
 * 主源（官方源）加载失败时切回退源（nanoka）；回退源再失败不再回退。
 */
import { ref } from 'vue';
import { resolveCdnUri, type CdnCategory } from '../../services/cdn';

export function useCdnImg(category: CdnCategory, file: string) {
  const { primary, fallback } = resolveCdnUri(category, file);
  const src = ref(primary);
  const onError = (): void => {
    if (fallback && src.value === primary) src.value = fallback;
  };
  return { src, onError };
}