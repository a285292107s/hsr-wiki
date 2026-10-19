import { ref, type Ref } from 'vue';
import { userErrorDetail } from '../../lib/errors';
import { useLoadGeneration } from '../composables/use-load-generation';

export interface DetailLoadContext<T> {
  isCurrent(): boolean;
  submit(d: T): void;
}

export interface DetailCore<T> {
  id: Ref<string>;
  data: Ref<T | null>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
  load(
    id: string,
    fetch: (ctx: DetailLoadContext<T>) => Promise<T>,
    options?: { title?: (d: T) => string },
  ): Promise<void>;
  reset(): void;
}

export function createDetailCore<T>(): DetailCore<T> {
  const id = ref('');
  const data = ref(null) as Ref<T | null>;
  const loading = ref(false);
  const error = ref<string | null>(null);
  const loadGen = useLoadGeneration();

  async function load(
    newId: string,
    fetch: (ctx: DetailLoadContext<T>) => Promise<T>,
    options?: { title?: (d: T) => string },
  ): Promise<void> {
    const gen = loadGen.begin();
    loading.value = true;
    error.value = null;
    let submitted = false;
    const submit = (d: T): void => {
      data.value = d;
      const title = options?.title?.(d);
      if (title) document.title = title;
      submitted = true;
    };
    try {
      id.value = newId;
      data.value = null;
      const d = await fetch({ isCurrent: () => loadGen.isCurrent(gen), submit });
      if (submitted) return;
      if (!loadGen.isCurrent(gen)) return;
      submit(d);
    } catch (e) {
      if (!loadGen.isCurrent(gen)) return;
      error.value = userErrorDetail(e);
      throw e;
    } finally {
      if (loadGen.isCurrent(gen)) loading.value = false;
    }
  }

  function reset(): void {
    id.value = '';
    data.value = null;
    loading.value = false;
    error.value = null;
  }

  return { id, data, loading, error, load, reset };
}
