import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { createNkRouter } from './router';
import '../styles/tokens.css';
import '../styles/character.css';
import '../styles/catalog.css';
import '../styles/lightcone.css';
import '../styles/relic.css';
import '../styles/currency-role.css';

export async function bootstrap(): Promise<void> {
  const app = createApp(App);
  const router = createNkRouter();
  app.use(createPinia());
  app.use(router);
  app.mount('#app');
  await router.isReady();
}
