/**
 * Spine 运行时动态加载（全站唯一实现）
 *
 * 双运行时并存（官方 JSON/场景 = 4.2.43 主运行时；nanoka skel = 4.1.23 备用运行时）。
 * 两版本 IIFE 均注入全局 window.spine（`var spine = ...` 形式，已验证 4.1.23/4.2.43 同构），
 * 通过访问器代理隔离（installSpineProxy）：
 * - 首次加载前对 window.spine 定义 getter/setter 访问器（configurable）
 * - IIFE 同步赋值走 setter → 按 loadingVersion 上下文捕获进内部 Map，真实引用不落全局
 * - getter 恒返回主版本（4.2），window.spine 自加载起未被污染，任意时刻读取无时序窗口
 * 对 `var spine=` / `window.spine=` / `globalThis.spine=` 三种挂载形式均生效：
 * var 声明遇已有同名属性跳过声明、赋值走 setter。
 *
 * 单例 Promise 按版本独立共享：全部 CDN 失败自动置空允许重试
 * （审核台「重新加载」按钮依赖此语义）。生产渲染与调试验收台共用。
 */
import { SPINE_RUNTIME_41_CDNS, SPINE_RUNTIME_CDNS } from './constants';
import type { SpineLib, SpinePlayerCtor, SpineRuntimeVersion } from './types';

/** 各版本 CDN 列表（4.1=备用 / 4.2=主） */
const VERSION_CDNS: Record<SpineRuntimeVersion, string[]> = {
  '4.1': SPINE_RUNTIME_41_CDNS,
  '4.2': SPINE_RUNTIME_CDNS,
};

/** 各版本运行时引用（访问器代理捕获的全局 spine 命名空间） */
const libs = new Map<SpineRuntimeVersion, SpineLib>();

/** 各版本加载单例 Promise：失败后自动置空允许重试，成功则共享结果 */
const _runtimeLoads = new Map<SpineRuntimeVersion, Promise<boolean>>();

/** 当前注入 script 对应的版本（访问器 setter 捕获用上下文；注入串行化保证不被并发覆盖） */
let loadingVersion: SpineRuntimeVersion | null = null;

/** window.spine 访问器代理是否已安装（幂等） */
let proxyInstalled = false;

/** script 注入互斥链：同一时刻只允许一个版本的 IIFE 在途，防止 loadingVersion 被并发覆盖导致错位捕获 */
let injectChain: Promise<unknown> = Promise.resolve();

/**
 * 安装 window.spine 访问器代理（首次加载前调用，幂等）：
 * - setter 按 loadingVersion 上下文捕获 IIFE 注入的引用进 libs（不真正覆盖全局值）
 * - getter 恒返回主版本（4.2），保证任意时刻读取 window.spine 均为主运行时
 */
function installSpineProxy(): void {
  if (proxyInstalled) return;
  proxyInstalled = true;
  try {
    Object.defineProperty(window, 'spine', {
      configurable: true, // 保留可替换/删除能力
      get(): SpineLib | null {
        return libs.get('4.2') ?? libs.get('4.1') ?? null;
      },
      set(v: unknown): void {
        try {
          if (loadingVersion && v && typeof v === 'object') libs.set(loadingVersion, v as SpineLib);
        } catch {
          /* 捕获失败仅影响该版本加载判定，不扩散 */
        }
      },
    });
  } catch {
    /* 极端环境 defineProperty 失败 → 走 onload 捕获 + 恢复主版本兜底路径（captureFallback） */
  }
}

/**
 * 代理失效兜底：script onload 后直接从 window.spine 捕获，并恢复主版本引用
 * （仅当访问器代理安装失败时使用；此时 IIFE 直接覆盖了全局）
 */
function captureFallback(version: SpineRuntimeVersion): boolean {
  try {
    const g = globalThis as { spine?: SpineLib };
    if (!g.spine) return false;
    libs.set(version, g.spine);
    const main = libs.get('4.2');
    if (main && g.spine !== main) g.spine = main; // 防止 4.1 污染全局
    return true;
  } catch {
    return false;
  }
}

/** 注入单个版本 CDN script（串行化：前一个下载+执行结算后才注入下一个） */
function injectScript(url: string, version: SpineRuntimeVersion): Promise<boolean> {
  const run = injectChain.then(
    () =>
      new Promise<boolean>((resolve) => {
        loadingVersion = version; // IIFE 同步执行瞬间走 setter → 按版本捕获
        const s = document.createElement('script');
        s.src = url;
        s.onload = () => resolve(proxyInstalled ? getSpineCtor(version) !== null : captureFallback(version));
        s.onerror = () => resolve(false);
        document.head.appendChild(s);
      }),
  );
  injectChain = run.catch(() => undefined);
  return run;
}

/** 读取对应版本的 spine-player 构造器（SpinePlayer 级 API；缺省主版本 4.2） */
export function getSpineCtor(version: SpineRuntimeVersion = '4.2'): SpinePlayerCtor | null {
  const lib = libs.get(version);
  return (lib && lib.SpinePlayer) || null;
}

/** 读取对应版本的 spine 运行时（SceneRenderer 级 API；缺省主版本 4.2） */
export function getSpineLib(version: SpineRuntimeVersion = '4.2'): SpineLib | null {
  return libs.get(version) ?? null;
}

/** 动态加载指定版本 spine-player 运行时（CDN IIFE；全部 CDN 失败时返回 false 并允许下次重试） */
export function loadSpineRuntime(version: SpineRuntimeVersion = '4.2'): Promise<boolean> {
  if (getSpineCtor(version)) return Promise.resolve(true);
  const pending = _runtimeLoads.get(version);
  if (pending) return pending;
  const promise = (async (): Promise<boolean> => {
    installSpineProxy();
    for (const url of VERSION_CDNS[version]) {
      const ok = await injectScript(url, version);
      if (ok) return true;
    }
    return false;
  })().then((ok) => {
    if (!ok) _runtimeLoads.delete(version); // 失败后清空单例 → 「重新加载」可重试
    return ok;
  });
  _runtimeLoads.set(version, promise);
  return promise;
}
