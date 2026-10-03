import { ref, type Ref } from 'vue';
import { useLoadGeneration } from '../composables/use-load-generation';

/** fetch 回调拿到的编排上下文：isCurrent 供 await 边界自查代际；submit 供
 *  「先渲染主数据、后补附属数据」的多段加载提前提交（提交即落 data + title）。 */
export interface DetailLoadContext<T> {
  isCurrent(): boolean;
  submit(d: T): void;
}

export interface DetailCore<T> {
  id: Ref<string>;
  data: Ref<T | null>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
  /** 加载生命周期：代际起步 → 重置 id/data → fetch → 提交（未 submit 时由 core 代为提交）
   *  → 异常落 error 并 rethrow；过期代际静默收敛。 */
  load(
    id: string,
    fetch: (ctx: DetailLoadContext<T>) => Promise<T>,
    options?: { title?: (d: T) => string },
  ): Promise<void>;
  reset(): void;
}

/** 详情 store 公共内核：id + data + loading/error + 代际守卫。
 *  各域 store 只在 fetch 里编排自己的取数与副作用（多段 await / 并行聚合 / 缓存合并）。 */
export function createDetailCore<T>(): DetailCore<T> {
  const id = ref('');
  // ref 的 UnwrapRef 会拆解泛型 T 的类型，显式断言回到 Ref<T | null>（运行时仍是深响应 ref）
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
      error.value = e instanceof Error ? e.message : String(e);
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
