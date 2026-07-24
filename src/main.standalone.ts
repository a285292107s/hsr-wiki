/**
 * Standalone 入口（常规 Vite 应用，index.html 加载）
 * 无宿主 / 无 failsafe；platform.mount 同样创建 Shadow Root 保证 CSS 一致。
 */
import { createStandalonePlatform } from './platform/standalone';
import { setPlatform } from './platform';
import { bootstrap } from './app/bootstrap';

setPlatform(createStandalonePlatform());

bootstrap().catch((e: unknown) => {
  // eslint-disable-next-line no-console
  console.error('[nk-wiki] bootstrap failed:', e);
});
