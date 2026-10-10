import { ref, shallowRef, type Ref } from 'vue';
import { userErrorDetail } from '../../lib/errors';
import { useDelayedSkeleton } from './use-delayed-skeleton';
import { useLoadGeneration } from './use-load-generation';

export interface PageData<T> {
  data: Ref<T | null>;
  error: Ref<string>;
  loading: Ref<boolean>;
  showSkeleton: Ref<boolean>;
  run(): Promise<void>;
  retry(): void;
}

export function usePageData<T>(loader: () => Promise<T>): PageData<T> {
  const data = shallowRef<T | null>(null);
  const error = ref('');
  const loading = ref(true);
  const showSkeleton = useDelayedSkeleton(() => loading.value);
  const loadGen = useLoadGeneration();

  async function run(): Promise<void> {
    const gen = loadGen.begin();
    loading.value = true;
    error.value = '';
    try {
      const d = await loader();
      if (!loadGen.isCurrent(gen)) return;
      data.value = d;
    } catch (e) {
      if (!loadGen.isCurrent(gen)) return;
      error.value = userErrorDetail(e);
    } finally {
      if (loadGen.isCurrent(gen)) loading.value = false;
    }
  }

  return { data, error, loading, showSkeleton, run, retry: () => void run() };
}