import { bootstrap } from './app/bootstrap';

bootstrap().catch((e: unknown) => {
  console.error('[hsr-wiki] bootstrap failed:', e);
});
