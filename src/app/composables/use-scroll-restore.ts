/**
 * 目录页滚动位置保存/恢复（sessionStorage，key = `nk-scroll:${id}`）。
 * 从详情页返回时恢复原滚动位置；首次进入（无存档）不触发。
 */
import type { Ref } from 'vue';

export interface ScrollRestore {
  /** 是否存在待恢复的存档（每次访问实时读取；noReveal 须在网格挂载前同步求值） */
  readonly hasArchive: boolean;
  save(): void;
  /** 恢复滚动位置；无存档返回 false */
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
