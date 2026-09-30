import type { Ref } from 'vue';

export interface ScrollRestore {
  readonly hasArchive: boolean;
  save(): void;
  restore(): boolean;
}

export function useScrollRestore(
  scroller: Ref<HTMLElement | null>,
  key: string,
): ScrollRestore {
  return {
    get hasArchive(): boolean {
      return sessionStorage.getItem(key) != null;
    },
    save(): void {
      const el = scroller.value;
      if (el) sessionStorage.setItem(key, String(el.scrollTop));
    },
    restore(): boolean {
      const el = scroller.value;
      if (!el) return false;
      const saved = sessionStorage.getItem(key);
      if (saved == null) return false;
      el.scrollTo({ top: Number(saved), behavior: 'instant' });
      sessionStorage.removeItem(key);
      return true;
    },
  };
}
