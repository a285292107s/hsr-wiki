/**
 * useHubWheel 枢纽滚轮手势单测（ADR 0016）。
 *
 * 覆盖：断点拦截、Hero 边界、方向映射（下滚→图签页 / 上滚→另一模式枢纽页）、
 * 冷却去重、阈值抖动过滤、deltaMode 归一化、卸载摘除监听。
 *
 * 环境说明：仓库 vitest 使用 **happy-dom**（非 jsdom），且未安装 `@vue/test-utils`。
 * happy-dom 自带 `matchMedia` 且 `(min-width: 1024px)` 默认返回 `matches: true`——
 * 与 jsdom 的「不存在 / 恒 false」相反，故本测试显式 stub 两种断点值，不依赖默认值。
 * 生命周期用 `createApp().mount()` 真实挂载取得（`onMounted` 在非组件上下文只告警不执行）。
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp, defineComponent, h, nextTick, ref, watch, type App, type Ref } from 'vue';
// 真实 View 源码文本（?raw：vite 在测试转换期注入字符串，不执行组件依赖）
import HOME_VIEW_SRC from '../../views/HomeView.vue?raw';
import CW_VIEW_SRC from '../../views/CurrencyHubView.vue?raw';
import {
  useHubWheel,
  normalizeWheelDelta,
  WHEEL_COOLDOWN_MS,
  WHEEL_THRESHOLD,
  type HubWheelOptions,
} from '../use-hub-wheel';

/** 桌面断点是否命中（默认命中；逐用例显式设定，不依赖 happy-dom 默认值） */
let isDesktop = true;

/** 已挂载的 app 实例，afterEach 统一卸载，避免 DOM 与监听残留 */
let mountedApps: App[] = [];
/** 已创建但需手动卸载的宿主节点 */
let hosts: HTMLElement[] = [];

interface Harness {
  hero: HTMLElement;
  /** Hero 内的子元素（模拟标题/文案），用于验证事件委托与 contains 判定 */
  inner: HTMLElement;
  /** Hero 外的元素（模拟 `/currency` 的 `.nk-cwhub-index` 板块索引行） */
  outside: HTMLElement;
  push: ReturnType<typeof vi.fn>;
  app: App;
  /** Hero 元素 ref：`start()` 契约组用它模拟「元素换绑」 */
  heroRef: Ref<HTMLElement | null>;
  /** composable 返回值：`start()` 契约组用它显式触发绑定 */
  api: ReturnType<typeof useHubWheel>;
}

/**
 * 真实挂载一个组件，在其 setup 内调用 useHubWheel，取得真实 onMounted/onBeforeUnmount。
 * 返回 Hero / Hero 内 / Hero 外三个元素与 spy 过的 router.push。
 */
function mountHub(over: Partial<Omit<HubWheelOptions, 'router' | 'hero'>> = {}): Harness {
  const heroRef = ref<HTMLElement | null>(null);
  const push = vi.fn();
  // 供 Harness.api 回传；setup 同步执行，mount 返回时必已赋值
  let api: ReturnType<typeof useHubWheel> | null = null;

  const Comp = defineComponent({
    setup() {
      api = useHubWheel({
        router: { push },
        hero: heroRef,
        downPath: over.downPath ?? '/character',
        // `upPath` 需区分「未传」与「显式传 null」：未传时取默认 `/currency`，
        // 传 null 时保持 null（禁用上滚通道）。
        upPath: 'upPath' in over ? over.upPath! : '/currency',
      });
      return () => h('section', { ref: heroRef, class: 'nk-home-hero' }, [
        h('h1', { class: 'nk-home-hero__title' }, 'HSR'),
      ]);
    },
  });

  const host = document.createElement('div');
  document.body.appendChild(host);
  const app = createApp(Comp);
  app.mount(host);
  mountedApps.push(app);
  hosts.push(host);

  const hero = host.querySelector('.nk-home-hero') as HTMLElement;
  const inner = host.querySelector('.nk-home-hero__title') as HTMLElement;

  // Hero 外元素：仅用于「target 在 Hero 外」用例（监听绑在 Hero 上，
  // 但本用例把事件直接派发到该元素并冒泡验证判定，见下方 dispatchOutside）
  const outside = document.createElement('nav');
  outside.className = 'nk-cwhub-index';
  document.body.appendChild(outside);

  return { hero, inner, outside, push, app, heroRef, api: api! };
}

/** 在 Hero 上派发一次滚轮事件（target = Hero 自身或其子元素） */
function wheelOn(target: HTMLElement, deltaY: number, deltaMode = 0): void {
  target.dispatchEvent(
    new WheelEvent('wheel', { deltaY, deltaMode, bubbles: true, cancelable: true }),
  );
}

beforeEach(() => {
  vi.useFakeTimers();
  isDesktop = true;
  // happy-dom 的 matchMedia 恒返回 true；显式 stub 以覆盖断点两侧，
  // 与 use-scroll-spy.test.ts 的 stubGlobal 写法一致。
  vi.stubGlobal('matchMedia', vi.fn((q: string) => ({
    matches: q.includes('min-width') ? isDesktop : false,
    media: q,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })));
});

afterEach(() => {
  for (const app of mountedApps) app.unmount();
  mountedApps = [];
  for (const h of hosts) h.remove();
  hosts = [];
  document.body.querySelectorAll('.nk-cwhub-index').forEach((n) => n.remove());
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('normalizeWheelDelta（deltaMode 归一化）', () => {
  it('mode=0 原样返回像素值', () => {
    expect(normalizeWheelDelta(new WheelEvent('wheel', { deltaY: 100, deltaMode: 0 }))).toBe(100);
  });

  it('mode=1 按行高 16px 换算，mode=2 按页高 800px 换算', () => {
    expect(normalizeWheelDelta(new WheelEvent('wheel', { deltaY: 3, deltaMode: 1 }))).toBe(48);
    expect(normalizeWheelDelta(new WheelEvent('wheel', { deltaY: 1, deltaMode: 2 }))).toBe(800);
  });
});

describe('useHubWheel', () => {
  it('验收 1｜断点：matchMedia 匹配失败时滚轮不触发任何导航', () => {
    isDesktop = false;
    const h1 = mountHub();
    wheelOn(h1.inner, 100);
    wheelOn(h1.inner, -100);
    expect(h1.push).not.toHaveBeenCalled();
  });

  it('验收 1｜断点：匹配成功时同一次滚轮即触发导航（证明上一条非因实现失效而通过）', () => {
    isDesktop = true;
    const h1 = mountHub();
    wheelOn(h1.inner, 100);
    expect(h1.push).toHaveBeenCalledWith('/character');
  });

  it('验收 2｜边界：监听绑在 Hero 上，Hero 外滚轮不触发导航', () => {
    const h1 = mountHub();
    // 直接派发到 Hero 外的元素：事件不流经 Hero，监听器不会收到
    wheelOn(h1.outside, 100);
    wheelOn(h1.outside, -100);
    expect(h1.push).not.toHaveBeenCalled();
  });

  it('验收 2｜边界：target 为 Hero 自身或其子元素时均生效', () => {
    const h1 = mountHub();
    wheelOn(h1.hero, 100);
    expect(h1.push).toHaveBeenCalledWith('/character');
  });

  /**
   * 覆盖说明（Lead 补记，勿删）：onWheel 内的 `el.contains(e.target)` 判定
   * **无法被本文件有效覆盖** —— 监听绑在 Hero 上，事件只可能来自 Hero 自身或其子树，
   * 故该分支恒为真，删除它不会有任何用例变红（已实证：删掉 contains 判定后 25/25 仍全绿）。
   * 它是**防御性代码**：防的是未来有人把监听改绑到 window/document（那时该判定才成为唯一防线）。
   * 因此这里不断言它，只断言「监听确实绑在 Hero 上」这一可观测事实——
   * 用 span 计数证明事件在 Hero 与 Hero 外分别是否进入 onWheel。
   */
  it('验收 2｜监听目标：事件只在 Hero 子树内进入 onWheel（Hero 外完全不进入）', () => {
    const h1 = mountHub();
    const heroSpy = vi.fn();
    const outsideSpy = vi.fn();
    h1.hero.addEventListener('wheel', heroSpy);
    h1.outside.addEventListener('wheel', outsideSpy);

    wheelOn(h1.inner, 100);
    wheelOn(h1.outside, 100);

    // Hero 内事件冒泡到 Hero（onWheel 因此可被调用）；Hero 外事件根本不经过 Hero
    expect(heroSpy).toHaveBeenCalledTimes(1);
    expect(outsideSpy).toHaveBeenCalledTimes(1);
  });

  it('验收 3｜方向：deltaY=+100 → 本模式图签页', () => {
    const h1 = mountHub();
    wheelOn(h1.inner, 100);
    expect(h1.push).toHaveBeenCalledTimes(1);
    expect(h1.push).toHaveBeenCalledWith('/character');
  });

  it('验收 3｜方向：deltaY=-100 → 另一模式枢纽页', () => {
    const h1 = mountHub();
    wheelOn(h1.inner, -100);
    expect(h1.push).toHaveBeenCalledTimes(1);
    expect(h1.push).toHaveBeenCalledWith('/currency');
  });

  it('验收 3｜方向：/currency 页映射为 下滚→/currency/role、上滚→/', () => {
    const h1 = mountHub({ downPath: '/currency/role', upPath: '/' });
    wheelOn(h1.inner, 100);
    expect(h1.push).toHaveBeenLastCalledWith('/currency/role');
    // 越过冷却后再验上滚
    vi.advanceTimersByTime(WHEEL_COOLDOWN_MS);
    wheelOn(h1.inner, -100);
    expect(h1.push).toHaveBeenLastCalledWith('/');
    expect(h1.push).toHaveBeenCalledTimes(2);
  });

  it('验收 4｜冷却：连续两次 wheel 只产生一次导航', () => {
    const h1 = mountHub();
    wheelOn(h1.inner, 100);
    wheelOn(h1.inner, 100);
    expect(h1.push).toHaveBeenCalledTimes(1);
  });

  it('验收 4｜冷却：超过 WHEEL_COOLDOWN_MS 后恢复可触发', () => {
    const h1 = mountHub();
    wheelOn(h1.inner, 100);
    vi.advanceTimersByTime(WHEEL_COOLDOWN_MS - 1);
    wheelOn(h1.inner, 100);
    expect(h1.push).toHaveBeenCalledTimes(1); // 冷却期内仍被拦截
    vi.advanceTimersByTime(1);
    wheelOn(h1.inner, 100);
    expect(h1.push).toHaveBeenCalledTimes(2); // 冷却结束，恢复
  });

  it('upPath=null｜上滚不做任何导航（P1 契约：该页禁用上滚通道）', () => {
    const h1 = mountHub({ upPath: null });
    wheelOn(h1.inner, -100);
    expect(h1.push).not.toHaveBeenCalled();
  });

  it('upPath=null｜下滚逻辑不受影响，仍进入本模式图签页', () => {
    const h1 = mountHub({ upPath: null });
    wheelOn(h1.inner, 100);
    expect(h1.push).toHaveBeenCalledTimes(1);
    expect(h1.push).toHaveBeenCalledWith('/character');
  });

  it('upPath=null｜上滚不占用冷却：随后下滚立即生效', () => {
    const h1 = mountHub({ upPath: null });
    wheelOn(h1.inner, -100); // 被忽略，不应写入 lastNavAt
    wheelOn(h1.inner, 100);
    expect(h1.push).toHaveBeenCalledTimes(1);
    expect(h1.push).toHaveBeenCalledWith('/character');
  });

  it('upPath=null｜事件未被 preventDefault（上滚交还默认滚动）', () => {
    const h1 = mountHub({ upPath: null });
    const e = new WheelEvent('wheel', { deltaY: -100, bubbles: true, cancelable: true });
    h1.inner.dispatchEvent(e);
    expect(e.defaultPrevented).toBe(false);
  });

  it('upPath=null｜/currency 形态：下滚→/currency/role、上滚不导航', () => {
    const h1 = mountHub({ downPath: '/currency/role', upPath: null });
    wheelOn(h1.inner, -100);
    expect(h1.push).not.toHaveBeenCalled();
    wheelOn(h1.inner, 100);
    expect(h1.push).toHaveBeenCalledTimes(1);
    expect(h1.push).toHaveBeenCalledWith('/currency/role');
  });

  it('阈值：不足 WHEEL_THRESHOLD 的抖动不跳转，达到阈值即跳转', () => {
    const h1 = mountHub();
    wheelOn(h1.inner, WHEEL_THRESHOLD - 1);
    expect(h1.push).not.toHaveBeenCalled();
    wheelOn(h1.inner, WHEEL_THRESHOLD);
    expect(h1.push).toHaveBeenCalledTimes(1);
  });

  it('阈值：负向抖动同样被过滤（不会误判为上滚）', () => {
    const h1 = mountHub();
    wheelOn(h1.inner, -(WHEEL_THRESHOLD - 1));
    expect(h1.push).not.toHaveBeenCalled();
  });

  it('deltaMode=1（行）经归一化后同样触发方向映射', () => {
    const h1 = mountHub();
    // 1 行 = 16px ≥ 阈值 4，应判为下滚
    wheelOn(h1.inner, 1, 1);
    expect(h1.push).toHaveBeenCalledWith('/character');
  });

  it('卸载：unmount 后 Hero 上不再有 wheel 监听（监听不残留）', () => {
    const h1 = mountHub();
    wheelOn(h1.inner, 100);
    expect(h1.push).toHaveBeenCalledTimes(1);

    h1.app.unmount();
    mountedApps = mountedApps.filter((a) => a !== h1.app);
    // 卸载后即使元素仍在文档中（取消挂载不移除宿主节点），也不应再触发
    wheelOn(h1.inner, 100);
    expect(h1.push).toHaveBeenCalledTimes(1);
  });
});

/**
 * `start()` 契约（Lead 补测，2026-08-29）
 *
 * 为何单独成组：`HomeView.vue` 的 Hero 位于 `v-else`（loading 门控）内，
 * **onMounted 时尚未入 DOM**——composable 的自动绑定拿不到元素，首页滚轮**只能**靠调用方
 * 在 `watch(heroRef, …)` 中补调 `start()` 才能生效。删坏 `start()` 不会让其它用例变红，
 * 但首页滚轮会静默失效，故必须由本组锁定。
 */
describe('useHubWheel · start() 契约', () => {
  it('迟到挂载：onMounted 时 Hero 缺席，元素入 DOM 后调 start() 即完成绑定（HomeView 场景）', () => {
    const h1 = mountHub();
    // 先摘掉自动绑定：模拟 HomeView 中 onMounted 时 Hero 仍在 `v-else` 门控内、ref 为 null
    h1.api.stop();
    h1.heroRef.value = null;
    wheelOn(h1.hero, 100);
    expect(h1.push).not.toHaveBeenCalled();

    // 模拟 watch(heroRef, …) 在 loading 结束、Hero 真正入 DOM 后的补调
    h1.heroRef.value = h1.hero;
    h1.api.start();

    wheelOn(h1.inner, 100);
    expect(h1.push).toHaveBeenCalledWith('/character');
  });

  it('幂等：连续调用 start() 三次不叠加监听（禁止重复 addEventListener）', () => {
    const h1 = mountHub();
    // 直接计数 addEventListener 调用：断言「导航次数」在本 composable 里是**恒真**的
    // （onWheel 的冷却会挡住重复导航，故即使监听叠加三次也只 push 一次）——必须断言监听本身。
    const addSpy = vi.spyOn(h1.hero, 'addEventListener');
    const removeSpy = vi.spyOn(h1.hero, 'removeEventListener');

    h1.api.start();
    h1.api.start();
    h1.api.start();

    // 已在同一元素上：三次调用都不应再 add，也不应 remove 后重加
    expect(addSpy).not.toHaveBeenCalled();
    expect(removeSpy).not.toHaveBeenCalled();

    // 行为兜底：叠加监听也不影响单次导航（这条单独看是恒真的，保留作行为记录）
    wheelOn(h1.inner, 100);
    expect(h1.push).toHaveBeenCalledTimes(1);

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it('stop() 后可再次 start() 恢复监听（禁止 stop 后永久失效）', () => {
    const h1 = mountHub();
    h1.api.stop();
    wheelOn(h1.inner, 100);
    expect(h1.push).not.toHaveBeenCalled();

    h1.api.start();
    wheelOn(h1.inner, 100);
    expect(h1.push).toHaveBeenCalledTimes(1);
  });

  it('换元素：对第二个元素 start() 时摘除旧元素监听（禁止旧监听残留）', () => {
    const h1 = mountHub();
    const hero2 = document.createElement('section');
    hero2.className = 'nk-home-hero';
    document.body.appendChild(hero2);

    // 必须断言「旧元素上真的调了 removeEventListener」：只断言「旧元素不再导航」是**恒真**的
    // ——onWheel 每次都从 hero.value 取元素，换绑后旧元素的监听即使残留也会因 contains 判定而早退。
    // 残留监听的真正代价是内存与语义泄漏，只有在移除动作本身被断言时才能被锁住。
    const oldRemoveSpy = vi.spyOn(h1.hero, 'removeEventListener');

    h1.heroRef.value = hero2;
    h1.api.start();

    expect(oldRemoveSpy).toHaveBeenCalledWith('wheel', expect.any(Function));
    // 旧监听已摘除（事件不再进入 onWheel），新元素已接管
    expect(oldRemoveSpy).toHaveBeenCalledTimes(1);

    wheelOn(hero2, 100);
    expect(h1.push).toHaveBeenCalledWith('/character');

    oldRemoveSpy.mockRestore();
  });

  it('Hero 为 null 时 start() 不抛异常（静默等待调用方），且不产生导航', () => {
    const h1 = mountHub();
    h1.api.stop();
    h1.heroRef.value = null;

    expect(() => h1.api.start()).not.toThrow();
    expect(h1.push).not.toHaveBeenCalled();
  });
});

/**
 * HomeView / CurrencyHubView 接线契约（Lead 补测）
 *
 * **覆盖边界（务必读完再改）**：仓库未安装 `@vue/test-utils`，且这两个 View 会连带拉起
 * api / store / spine / CDN 等重依赖，无法在单测中真实挂载。故本组**不能**断言
 * 「HomeView 调了 start()」——本文件里的复现体自带一份 watch，删改 `HomeView.vue` 的 watch
 * **不会**让本组变红（已实证：删掉 HomeView 的 watch 后仍全绿）。
 *
 * 因此「View 是否接线」这一条**不由单测守护**，改由两道防线承担：
 *   1. 源码级接线断言（本组第 1 条）：直接读 `HomeView.vue` 与 `CurrencyHubView.vue` 的源码文本，
 *      断言必需片段存在——这是唯一能在单测层锁住「View 真的接线了」的办法；
 *   2. 浏览器取证：Lead 用真实 Playwright 验证门控解除后滚轮确实导航（见交付记录）。
 *
 * 本组第 2 条（复现体 + watch）保留价值：它锁的是**时序契约本身**——
 * 即「Hero 在门控内时，必须靠 watch 补调而非 onMounted 自动绑定才生效」，
 * 供后续维护者理解为何 HomeView 需要那段 watch。
 */
describe('useHubWheel · View 接线契约', () => {
  /**
   * 源码级接线断言：读真实 View 的**源码文本**，断言必需片段在位。
   * 这是单测层唯一能锁住「HomeView/CurrencyHubView 确实接入了滚轮」的手段——
   * 删除 View 里的 `useHubWheel(...)` 调用或 `watch(heroRef, …, {once:true})` 补调，本条即红
   * （已用突变测试实证：删 watch / 改 downPath / 改 upPath / 删 ref 绑定 均使本组变红）。
   *
   * 用 Vite 的 `?raw` 导入源码文本，而非真实挂载 View：后者会连带执行
   * api / store / spine / CDN 等重依赖，且仓库未安装 `@vue/test-utils`。
   * `?raw` 由 vite 在测试转换期直接注入字符串，无需 @types/node、不依赖 cwd。
   */
  const readView = {
    home: HOME_VIEW_SRC,
    cw: CW_VIEW_SRC,
  };

  it('HomeView.vue 接线在位：Hero ref + useHubWheel + v-else 门控下的 watch 补调', () => {
    const src = readView.home;
    // Hero 必须有独立 ref（禁止复用 spineRef：两者生命周期不同）
    expect(src).toMatch(/<section\s+ref="heroRef"\s+class="nk-home-hero"/);
    expect(src).toContain('const heroRef = ref<HTMLElement | null>(null)');

    // 必须接入滚轮，且方向映射与 ADR 0016 一致
    expect(src).toContain("import { useHubWheel } from '../composables/use-hub-wheel';");
    expect(src).toMatch(/useHubWheel\(\{/);
    expect(src).toContain("downPath: '/character'");
    expect(src).toContain("upPath: '/currency'");

    // 必须存在 watch 补调（Hero 位于 v-else 门控内，onMounted 拿不到元素）
    expect(src).toMatch(/watch\(\s*heroRef\s*,/);
    expect(src).toMatch(/if \(el\)\s+hubWheel\.start\(\)/);
    expect(src).toMatch(/\{\s*once:\s*true\s*\}/);

    // 反向：必须仍用 v-else 门控（若改成 v-show，onMounted 时序会变，本断言提醒复核）
    expect(src).toMatch(/<div v-if="loading"/);
    expect(src).toMatch(/<template v-else>/);
  });

  it('CurrencyHubView.vue 接线在位：Hero ref + useHubWheel（本页无需 watch，Hero 无门控）', () => {
    const src = readView.cw;

    expect(src).toMatch(/<section\s+ref="heroRef"\s+class="nk-cwhub-hero"/);
    expect(src).toContain('const heroRef = ref<HTMLElement | null>(null)');
    expect(src).toContain("import { useHubWheel } from '../composables/use-hub-wheel';");
    expect(src).toMatch(/useHubWheel\(\{/);
    expect(src).toContain("downPath: '/currency/role'");
    expect(src).toContain("upPath: '/'");

    // 本页 Hero 无 v-if 门控，onMounted 即可绑定 —— 不得出现 watch 补调（出现即说明前提已变，需复核注释）
    expect(src).not.toMatch(/watch\(\s*heroRef\s*,/);
  });

  /**
   * 与 HomeView 同构的最小复现体：loading 门控 + `v-else` 内 Hero + watch 补调 start()。
   * 用途：记录并锁定**时序契约**（门控内 → 必须 watch 补调；不接 watch 则不生效）。
   * 注意：它自带 watch，故**不**随 HomeView 源码变化而变红——View 接线由上面两条源码断言守护。
   */
  function mountGated(over: { withWatch?: boolean } = {}) {
    const withWatch = over.withWatch ?? true;
    const loading = ref(true);
    const heroRef = ref<HTMLElement | null>(null);
    const push = vi.fn();

    const Comp = defineComponent({
      setup() {
        const api = useHubWheel({
          router: { push },
          hero: heroRef,
          downPath: '/character',
          upPath: '/currency',
        });
        if (withWatch) {
          watch(heroRef, (el) => {
            if (el) api.start();
          }, { once: true });
        }
        return () => (loading.value
          ? h('div', { class: 'nk-loading' }, 'LOADING')
          : h('section', { ref: heroRef, class: 'nk-home-hero' }, [
            h('h1', { class: 'nk-home-hero__title' }, 'HSR'),
          ]));
      },
    });

    const host = document.createElement('div');
    document.body.appendChild(host);
    const app = createApp(Comp);
    mountedApps.push(app);
    hosts.push(host);
    app.mount(host);
    return { loading, heroRef, push, host, app };
  }

  it('时序契约：门控解除后靠 watch 补调才生效（不接 watch 则不生效）', async () => {
    const g = mountGated();

    // onMounted 时仍在 loading 门控内：Hero 尚未入 DOM
    expect(g.heroRef.value).toBeNull();
    expect(g.host.querySelector('.nk-home-hero')).toBeNull();

    g.loading.value = false;
    await nextTick();
    await nextTick(); // 等 watch 的 pre flush 完成

    const hero = g.host.querySelector('.nk-home-hero') as HTMLElement;
    expect(hero).not.toBeNull();
    expect(g.heroRef.value).toBe(hero);

    hero.dispatchEvent(new WheelEvent('wheel', { deltaY: 100, bubbles: true, cancelable: true }));
    expect(g.push).toHaveBeenCalledWith('/character');
  });

  it('时序契约反向对照：不接 watch 时门控解除后滚轮不生效（证明上条非恒真）', async () => {
    const g = mountGated({ withWatch: false });

    g.loading.value = false;
    await nextTick();
    await nextTick();

    const hero = g.host.querySelector('.nk-home-hero') as HTMLElement;
    expect(hero).not.toBeNull();

    hero.dispatchEvent(new WheelEvent('wheel', { deltaY: 100, bubbles: true, cancelable: true }));
    // 无 watch 补调 → 绑定从未发生 → 不导航
    expect(g.push).not.toHaveBeenCalled();
  });
});
