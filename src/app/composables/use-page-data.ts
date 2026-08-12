/**
 * 页面级数据加载编排：loading/error 状态机 + 加载代竞态 + 延迟骨架屏。
 * 统一轻量详情页（MonsterDetailView / CurrencyTraitView / CurrencyRoleView）重复的
 * loading/error/data + loadGen + SKELETON_DELAY 手写逻辑。
 * 语义：run 开始不清空 data（UI 由 loading/error 分支控制）；失败只写 error；
 * 过期加载（run 期间再次 run）的成功/失败均静默丢弃。
 */
import { ref, shallowRef, type Ref } from 'vue';
import { useDelayedSkeleton } from './use-delayed-skeleton';
import { useLoadGeneration } from './use-load-generation';

export interface PageData<T> {
  data: Ref<T | null>;
  error: Ref<string>;
  loading: Ref<boolean>;
  /** 延迟骨架屏：加载超过阈值才显示，缓存命中的快速切换不闪屏 */
  showSkeleton: Ref<boolean>;
  /** 触发一次加载（自动开始新加载代，保护旧结果） */
  run(): Promise<void>;
  /** 重试当前加载 */
  retry(): void;
}

export function usePageData<T>(loader: () => Promise<T>): PageData<T> {
  // shallowRef：整对象替换语义（不深响应），且避免泛型 ref 的 UnwrapRef 类型污染
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
      if (!loadGen.isCurrent(gen)) return; // 已被更新的加载取代：结果静默丢弃
      data.value = d;
    } catch (e) {
      if (!loadGen.isCurrent(gen)) return; // 过期加载的失败静默丢弃
      error.value = e instanceof Error ? e.message : String(e);
    } finally {
      if (loadGen.isCurrent(gen)) loading.value = false; // 过期加载不得复位最新加载持有的 loading
    }
  }

  return { data, error, loading, showSkeleton, run, retry: () => void run() };
}