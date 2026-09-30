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
