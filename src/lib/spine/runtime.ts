/**
 * Spine 运行时动态加载（全站唯一实现）
 *
 * spine-player 4.2.43 IIFE 运行时从 CDN 注入全局 window.spine（多 CDN 依次兜底）。
 * 单例 Promise 共享加载结果：全部 CDN 失败时自动置空，允许调用方重试
 * （审核台「重新加载」按钮依赖此语义）。生产渲染与调试验收台共用。
 */
import { SPINE_RUNTIME_CDNS } from '../constants';
import type { SpineLib, SpinePlayerCtor } from './types';

/** 运行时加载单例 Promise：失败后自动置空允许重试，成功则共享结果 */
let _runtimeLoad: Promise<boolean> | null = null;

/** 读取注入全局的 spine-player 构造器（SpinePlayer 级 API） */
export function getSpineCtor(): SpinePlayerCtor | null {
  const g = globalThis as { spine?: { SpinePlayer?: SpinePlayerCtor } };
  return (g.spine && g.spine.SpinePlayer) || null;
}

/** 读取注入全局的 spine 运行时（SceneRenderer 级 API） */
export function getSpineLib(): SpineLib | null {
  const g = globalThis as { spine?: SpineLib };
  return g.spine ?? null;
}

/** 动态加载 spine-player 运行时（CDN IIFE；全部 CDN 失败时返回 false 并允许下次重试） */
export function loadSpineRuntime(): Promise<boolean> {
  if (getSpineCtor()) return Promise.resolve(true);
  if (_runtimeLoad) return _runtimeLoad;
  _runtimeLoad = (async () => {
    for (const url of SPINE_RUNTIME_CDNS) {
      const ok = await new Promise<boolean>((resolve) => {
        const s = document.createElement('script');
        s.src = url;
        s.onload = () => resolve(!!getSpineCtor());
        s.onerror = () => resolve(false);
        document.head.appendChild(s);
      });
      if (ok) return true;
    }
    return false;
  })().then((ok) => {
    if (!ok) _runtimeLoad = null; // 失败后清空单例 → 「重新加载」可重试
    return ok;
  });
  return _runtimeLoad;
}
