/**
 * 应用引导（油猴 / standalone 共享）
 *
 * 流程：
 *   1. 注入数据层降级回调（连续失败 → platform.degrade）
 *   2. platform.mount(appCss) —— Shadow Root + <style> + #nk-app 容器
 *   3. 创建 Vue app（Pinia + Router）并挂载
 *   4. 等待首导航完成（router.isReady）→ 标记 app-mounted 段
 *
 * data-ready 段由各视图的数据加载完成时标记（app store markDataReady）。
 */
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { createNkRouter } from './router';
import { platform } from '../platform';
import { setDegradeSink } from '../services/cache';
import { appCss } from '../styles';

export async function bootstrap(): Promise<void> {
  const p = platform();

  // 数据层连续失败 → 平台降级（油猴恢复宿主，standalone no-op）
  setDegradeSink((reason) => p.degrade(reason));

  const { container } = await p.mount(appCss);

  const app = createApp(App);
  const router = createNkRouter();
  app.use(createPinia());
  app.use(router);

  // 降级时销毁 Vue 应用（由 failsafe 调用）
  p.registerCleanup(() => {
    try {
      app.unmount();
    } catch {
      /* 卸载失败不阻塞宿主恢复 */
    }
  });

  app.mount(container);

  // 首导航完成（含懒加载视图 chunk）后才算 app-mounted
  await router.isReady();

  p.markStage('app-mounted');
}
