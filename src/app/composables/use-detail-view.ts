import { computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAppStore } from '../stores/app';
import { useDelayedSkeleton } from './use-delayed-skeleton';
import { translate } from '../i18n';

export interface DetailViewOptions {
  hasData(): boolean;
  error(): string | null;
  currentId(): string;
  load(id: string): Promise<void>;
  onLoaded?(): void;
}

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
