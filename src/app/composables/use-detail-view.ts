import { computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAppStore } from '../stores/app';
import { useDelayedSkeleton } from './use-delayed-skeleton';
import { translate } from '../i18n';

export interface DetailViewOptions {
  /** store 是否已有数据（就绪判定） */
  hasData(): boolean;
  /** 最近一次加载错误（falsy = 无） */
  error(): string | null;
  /** 当前已加载 id（空串 = 未加载），供路由参数变化比对 */
  currentId(): string;
  /** 触发加载；reject 视为失败 */
  load(id: string): Promise<void>;
  /** 加载成功后的附加动作（失败自理，不影响错误态） */
  onLoaded?(): void;
}

/** 详情视图引导：phase / skeleton / 失败 toast + 重试 / mount 首载 / 路由参数变化重载。
 *  数据本体由调用方 store 持有（跨导航保留），这里只做编排。 */
export function useDetailView(options: DetailViewOptions) {
  const route = useRoute();
  const app = useAppStore();

  const phase = computed<'loading' | 'error' | 'ready'>(() =>
    options.error() ? 'error' : options.hasData() ? 'ready' : 'loading',
  );
  const showSkeleton = useDelayedSkeleton(() => phase.value === 'loading');

  async function load(id: string): Promise<void> {
    try {
      await options.load(id);
      options.onLoaded?.();
    } catch {
      app.toast('error', translate('common.loadFailed', { msg: options.error() || translate('common.unknownError') }));
    }
  }
  function retry(): void {
    void load(String(route.params.id || ''));
  }

  onMounted(() => {
    void load(String(route.params.id || ''));
  });
  watch(
    () => route.params.id,
    (id) => {
      if (id && String(id) !== options.currentId()) void load(String(id));
    },
  );

  return { phase, showSkeleton, retry };
}
